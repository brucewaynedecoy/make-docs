import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {acquireStoreAccess, openStoreDatabase, recoverDeadStoreAccessSessions, StoreUnavailableError, withStoreWaitLimit} from '../src/store/database';
import {createExecutionContext} from '../src/operations/context';
import {runCliEntry} from '../src/run/entry';

type Step = 'create' | 'secure' | 'verify' | 'open' | 'write' | 'owner-stat' | 'owner-read' | 'rename' | 'unlink' | 'cleanup';
const faults = vi.hoisted(() => ({kind: null as null | 'win32' | 'linux', step: null as Step | null, code: 'EPERM', remaining: 0, hits: 0, directoryOpened: false, sessionFds: new Set<number>(), cleanupWithOpenFile: false, plan: {} as Partial<Record<Step, {code: string; remaining: number}>>, hitsByStep: {} as Partial<Record<Step, number>>, ownerDead: false}));

// Windows returns EPERM when a process opens or creates a Store session path that another process is deleting.
vi.mock('node:fs', async original => {
  const actual = await original<typeof import('node:fs')>();
  const inject = (step: Step, target: string) => {
    const planned = faults.plan[step];
    if (planned ? planned.remaining <= 0 : faults.step !== step || faults.remaining <= 0) return;
    if (planned) planned.remaining--;
    else faults.remaining--;
    faults.hits++;
    faults.hitsByStep[step] = (faults.hitsByStep[step] ?? 0) + 1;
    const code = planned?.code ?? faults.code;
    throw Object.assign(new Error(`${code}: ${step} '${target}'`), {code});
  };
  return {
    ...actual,
    mkdirSync: (...args: Parameters<typeof actual.mkdirSync>) => {
      if (String(args[0]).endsWith('store-access.lock')) inject('create', String(args[0]));
      return actual.mkdirSync(...args);
    },
    openSync: (...args: Parameters<typeof actual.openSync>) => {
      const target = String(args[0]);
      if (target.endsWith('store-access.lock')) { inject('secure', target); faults.directoryOpened = true; }
      else if (path.basename(target).startsWith('.pending-')) inject('open', target);
      const fd = actual.openSync(...args);
      if (target.includes(`store-access.lock${path.sep}`)) faults.sessionFds.add(fd);
      return fd;
    },
    closeSync: (fd: number) => {
      actual.closeSync(fd);
      faults.sessionFds.delete(fd);
    },
    // Only the verification read after the directory opens fails, not the earlier existence check.
    lstatSync: ((...args: Parameters<typeof actual.lstatSync>) => {
      if (String(args[0]).endsWith('store-access.lock') && faults.directoryOpened) inject('verify', String(args[0]));
      if (String(args[0]).includes('store-access.lock') && String(args[0]).endsWith('.json')) inject('owner-stat', String(args[0]));
      return actual.lstatSync(...args);
    }) as typeof actual.lstatSync,
    writeFileSync: (...args: Parameters<typeof actual.writeFileSync>) => {
      if (typeof args[0] === 'number') inject('write', `fd ${args[0]}`);
      return actual.writeFileSync(...args);
    },
    readFileSync: ((...args: Parameters<typeof actual.readFileSync>) => {
      if (faults.sessionFds.has(Number(args[0])) || (String(args[0]).includes('store-access.lock') && String(args[0]).endsWith('.json'))) inject('owner-read', String(args[0]));
      return actual.readFileSync(...args);
    }) as typeof actual.readFileSync,
    renameSync: (...args: Parameters<typeof actual.renameSync>) => {
      if (String(args[0]).includes('store-access.lock')) inject('rename', String(args[0]));
      return actual.renameSync(...args);
    },
    unlinkSync: (...args: Parameters<typeof actual.unlinkSync>) => {
      if (String(args[0]).includes('store-access.lock')) inject('unlink', String(args[0]));
      return actual.unlinkSync(...args);
    },
    rmdirSync: (...args: Parameters<typeof actual.rmdirSync>) => {
      if (String(args[0]).endsWith('store-access.lock')) {
        if (faults.sessionFds.size > 0) faults.cleanupWithOpenFile = true;
        inject('cleanup', String(args[0]));
      }
      return actual.rmdirSync(...args);
    },
  };
});

vi.mock('../src/platform', async original => {
  const actual = await original<typeof import('../src/platform')>();
  // The real platform object is frozen, so the proxy wraps an empty target and reads through to it.
  return {...actual, platform: new Proxy({}, {get: (_target, key) => key === 'kind' && faults.kind ? faults.kind : key === 'processLiveness' && faults.ownerDead ? () => 'dead' : Reflect.get(actual.platform, key)})};
});

let temp = '';
let store = '';
beforeEach(() => {
  temp = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'make-docs-session-admission-')));
  store = path.join(temp, 'store');
  Object.assign(faults, {kind: null, step: null, code: 'EPERM', remaining: 0, hits: 0, directoryOpened: false, cleanupWithOpenFile: false, plan: {}, hitsByStep: {}, ownerDead: false});
  faults.sessionFds.clear();
});
afterEach(() => {
  vi.restoreAllMocks();
  Object.assign(faults, {kind: null, step: null, remaining: 0, hits: 0, directoryOpened: false});
  fs.rmSync(temp, {recursive: true, force: true});
});

function virtualClock(): {elapsed: () => number} {
  const started = Date.now();
  let now = started;
  vi.spyOn(Date, 'now').mockImplementation(() => now);
  vi.spyOn(Atomics, 'wait').mockImplementation((_array, _index, _value, timeout) => {
    now += Number(timeout ?? 0);
    return 'timed-out';
  });
  return {elapsed: () => now - started};
}

describe('Store session admission on Windows (D-059)', () => {
  const admissionSteps = [
    ['create', 'creates the session directory'],
    ['secure', 'opens the session directory'],
    ['verify', 'verifies the opened session directory'],
    ['open', 'creates the session file'],
    ['write', 'writes the session file'],
    ['rename', 'publishes the session file'],
  ] as const;
  it.each(['EPERM', 'EACCES', 'EBUSY'].flatMap(code => admissionSteps.map(([step, description]) => [code, step, description] as const)))('retries transient %s when it %s (%s)', (code, step, _description) => {
    Object.assign(faults, {kind: 'win32', code, step, remaining: 2});
    const release = acquireStoreAccess(store, false, 5_000);
    expect(faults.hits).toBe(2);
    // A failed attempt leaves no pending file behind; only the live session file remains.
    const entries = fs.readdirSync(path.join(store, 'store-access.lock'));
    expect(entries.filter(name => name.startsWith('.pending-'))).toEqual([]);
    expect(entries).toHaveLength(1);
    release();
    expect(fs.existsSync(path.join(store, 'store-access.lock'))).toBe(false);
  });

  it('still fails with access-denied when Windows EPERM lasts past the deadline', () => {
    Object.assign(faults, {kind: 'win32', step: 'secure', remaining: Number.POSITIVE_INFINITY});
    let error: unknown;
    try { acquireStoreAccess(store, false, 300); } catch (caught) { error = caught; }
    expect(error).toBeInstanceOf(StoreUnavailableError);
    expect((error as StoreUnavailableError).issue).toMatchObject({code: 'access-denied', systemCode: 'EPERM', operation: 'secure session directory'});
    expect(faults.hits).toBeGreaterThan(1);
  });

  it.each(admissionSteps)('reports busy at the admission deadline during %s', (step, _description) => {
    Object.assign(faults, {kind: 'win32', code: 'EBUSY', step, remaining: Infinity});
    let error: unknown;
    const started = Date.now();
    try { acquireStoreAccess(store, false, 80); } catch (caught) { error = caught; }
    expect((error as StoreUnavailableError).issue).toMatchObject({code: 'contention-timeout', systemCode: 'EBUSY', retryable: true});
    expect((error as StoreUnavailableError).issue.waitedMs).toBeGreaterThanOrEqual(80);
    expect(Date.now() - started).toBeLessThan(1500);
    expect(faults.hits).toBeGreaterThan(1);
    expect(faults.sessionFds.size).toBe(0);
  });

  it('keeps EPERM fatal on the first attempt on other platforms', () => {
    Object.assign(faults, {kind: 'linux', step: 'secure', remaining: 1});
    expect(() => acquireStoreAccess(store, false, 5_000)).toThrow(StoreUnavailableError);
    expect(faults.hits).toBe(1);
  });
});

describe('Store session release on Windows (D-059)', () => {
  const releaseSteps = ['owner-stat', 'owner-read', 'unlink', 'cleanup'] as const;
  it.each(['EPERM', 'EACCES', 'EBUSY'].flatMap(code => releaseSteps.map(step => [code, step] as const)))('retries transient %s during %s without an open session handle at directory cleanup', (code, step) => {
    const release = acquireStoreAccess(store);
    virtualClock();
    Object.assign(faults, {kind: 'win32', code, step, remaining: 2});
    release();
    expect(faults.hits).toBe(2);
    expect(faults.cleanupWithOpenFile).toBe(false);
    expect(faults.sessionFds.size).toBe(0);
    expect(fs.existsSync(path.join(store, 'store-access.lock'))).toBe(false);
  });

  it.each(releaseSteps)('returns within the call wait limit when %s stays busy', step => {
    const release = acquireStoreAccess(store);
    Object.assign(faults, {kind: 'win32', code: 'EBUSY', step, remaining: Infinity});
    const clock = virtualClock();
    expect(() => withStoreWaitLimit(80, release)).not.toThrow();
    expect(clock.elapsed()).toBe(80);
    expect(faults.hits).toBeGreaterThan(1);
    expect(faults.sessionFds.size).toBe(0);
  });

  it.each(['EPERM', 'EACCES'])('keeps a persistent Windows %s cleanup fault from replacing a result', code => {
    const release = acquireStoreAccess(store);
    Object.assign(faults, {kind: 'win32', code, step: 'cleanup', remaining: Infinity});
    const clock = virtualClock();
    expect(() => withStoreWaitLimit(80, release)).not.toThrow();
    expect(clock.elapsed()).toBe(80);
    expect(fs.existsSync(path.join(store, 'store-access.lock'))).toBe(true);
    expect(faults.sessionFds.size).toBe(0);
  });

  it.each(['linux', 'win32'] as const)('keeps an unrelated I/O error fatal on %s', kind => {
    const release = acquireStoreAccess(store);
    Object.assign(faults, {kind, code: 'EIO', step: 'cleanup', remaining: 1});
    let error: unknown;
    try { release(); } catch (caught) { error = caught; }
    expect((error as StoreUnavailableError).issue).toMatchObject({code: 'io-error', systemCode: 'EIO', operation: 'clean session directory', attempts: 1, waitedMs: 0});
    expect(faults.hits).toBe(1);
  });

  it('keeps a POSIX permission fault fatal on the first attempt during release', () => {
    const release = acquireStoreAccess(store);
    Object.assign(faults, {kind: 'linux', step: 'cleanup', remaining: 1});
    expect(release).toThrow(StoreUnavailableError);
    expect(faults.hits).toBe(1);
  });

  it.each([[null, 5000], [1000, 1000], [5000, 5000]] as const)('shares one release budget with call limit %s', (limit, expected) => {
    const release = acquireStoreAccess(store);
    Object.assign(faults, {kind: 'win32', plan: {unlink: {code: 'EBUSY', remaining: Infinity}, cleanup: {code: 'EBUSY', remaining: Infinity}}});
    const clock = virtualClock();
    expect(() => limit === null ? release() : withStoreWaitLimit(limit, release)).not.toThrow();
    expect(clock.elapsed()).toBe(expected);
    expect(faults.hitsByStep.unlink).toBeGreaterThan(1);
    // Folder cleanup still gets one attempt, without a second wait budget.
    expect(faults.hitsByStep.cleanup).toBe(1);
    expect(faults.sessionFds.size).toBe(0);
  });

  it.each(['EPERM', 'EACCES', 'EBUSY'])('leaves an owned lease for recovery when Windows %s persists', code => {
    const release = acquireStoreAccess(store);
    Object.assign(faults, {kind: 'win32', code, step: 'unlink', remaining: Infinity});
    const clock = virtualClock();
    expect(() => withStoreWaitLimit(80, release)).not.toThrow();
    expect(clock.elapsed()).toBe(80);
    expect(faults.sessionFds.size).toBe(0);
    const directory = path.join(store, 'store-access.lock');
    expect(fs.readdirSync(directory)).toHaveLength(1);
    // A later recovery removes only the lease whose owner is then proven dead.
    Object.assign(faults, {step: null, ownerDead: true});
    expect(recoverDeadStoreAccessSessions(store).removed).toHaveLength(1);
    expect(fs.existsSync(directory)).toBe(false);
  });

  it('caps standalone folder cleanup and still admits a session into the busy existing folder', () => {
    fs.mkdirSync(path.join(store, 'store-access.lock'), {recursive: true});
    Object.assign(faults, {kind: 'win32', step: 'cleanup', code: 'EBUSY', remaining: Infinity});
    const clock = virtualClock();
    expect(recoverDeadStoreAccessSessions(store)).toEqual({removed: [], active: []});
    expect(clock.elapsed()).toBe(250);
    const before = clock.elapsed();
    const release = acquireStoreAccess(store, false, 1000);
    expect(clock.elapsed() - before).toBe(250);
    expect(fs.readdirSync(path.join(store, 'store-access.lock'))).toHaveLength(1);
    expect(release).not.toThrow();
    expect(faults.cleanupWithOpenFile).toBe(false);
  });

  it('preserves a completed command result and CLI exit 0 through production Store admission when cleanup stays busy', async () => {
    const root = path.join(temp, 'project');
    fs.mkdirSync(root);
    openStoreDatabase(store).db.close();
    const context = createExecutionContext({cwd: root, storeRoot: store});
    const clock = virtualClock();
    let answer: unknown;
    let errors = '';
    const exit = await runCliEntry(async () => {
      answer = await context.withStoreSession('read', 'project.checkpoint.run', {store: 'read', project: 'read', hostConfig: 'none'}, root, () => {
        fs.writeFileSync(path.join(root, 'result.txt'), 'completed');
        Object.assign(faults, {kind: 'win32', code: 'EBUSY', step: 'cleanup', remaining: Infinity});
        return {completed: true};
      });
    }, ['project', 'checkpoint', '--json'], {writeError: value => { errors += value; }});
    expect(answer).toEqual({completed: true});
    expect(fs.readFileSync(path.join(root, 'result.txt'), 'utf8')).toBe('completed');
    expect(exit).toBe(0);
    expect(errors).toBe('');
    expect(clock.elapsed()).toBe(250);
    expect(faults.sessionFds.size).toBe(0);
  });
});

describe('Cleanup after failed Store admission', () => {
  it.each(['EPERM', 'EACCES', 'EBUSY'])('retries pending-file %s cleanup while retaining the first admission failure', code => {
    Object.assign(faults, {kind: 'win32', plan: {write: {code: 'EIO', remaining: 1}, unlink: {code, remaining: 2}, cleanup: {code: 'EBUSY', remaining: Infinity}}});
    virtualClock();
    let error: unknown;
    try { acquireStoreAccess(store, false, 5000); } catch (caught) { error = caught; }
    expect((error as StoreUnavailableError).issue).toMatchObject({code: 'io-error', systemCode: 'EIO'});
    expect((error as StoreUnavailableError).issue.cause).toContain('write');
    expect(faults.hitsByStep.write).toBe(1);
    expect(faults.hitsByStep.unlink).toBe(2);
    expect(fs.readdirSync(path.join(store, 'store-access.lock'))).toEqual([]);
    expect(faults.sessionFds.size).toBe(0);
  });

  it.each(['linux', 'win32'] as const)('retains the original fault even when later cleanup has a real I/O failure on %s', kind => {
    Object.assign(faults, {kind, plan: {write: {code: 'EROFS', remaining: 1}, unlink: {code: 'EIO', remaining: 1}, cleanup: {code: 'EIO', remaining: 1}}});
    let error: unknown;
    try { acquireStoreAccess(store, false, 80); } catch (caught) { error = caught; }
    expect((error as StoreUnavailableError).issue).toMatchObject({code: 'read-only-filesystem', systemCode: 'EROFS'});
    expect((error as StoreUnavailableError).issue.cause).toContain('write');
    expect(faults.hitsByStep.unlink).toBe(1);
    expect(faults.hitsByStep.cleanup).toBe(1);
    expect(faults.sessionFds.size).toBe(0);
  });
});

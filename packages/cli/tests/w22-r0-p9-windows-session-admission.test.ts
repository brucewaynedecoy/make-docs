import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {acquireStoreAccess, StoreUnavailableError, withStoreWaitLimit} from '../src/store/database';

type Step = 'create' | 'secure' | 'verify' | 'open' | 'write' | 'owner-stat' | 'owner-read' | 'rename' | 'unlink' | 'cleanup';
const faults = vi.hoisted(() => ({kind: null as null | 'win32' | 'linux', step: null as Step | null, code: 'EPERM', remaining: 0, hits: 0, directoryOpened: false, sessionFds: new Set<number>(), cleanupWithOpenFile: false}));

// Windows returns EPERM when a process opens or creates a Store session path that another process is deleting.
vi.mock('node:fs', async original => {
  const actual = await original<typeof import('node:fs')>();
  const inject = (step: Step, target: string) => {
    if (faults.step !== step || faults.remaining <= 0) return;
    faults.remaining--;
    faults.hits++;
    throw Object.assign(new Error(`${faults.code}: ${step} '${target}'`), {code: faults.code});
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
  return {...actual, platform: new Proxy({}, {get: (_target, key) => key === 'kind' && faults.kind ? faults.kind : Reflect.get(actual.platform, key)})};
});

let temp = '';
let store = '';
beforeEach(() => {
  temp = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'make-docs-session-admission-')));
  store = path.join(temp, 'store');
  Object.assign(faults, {kind: null, step: null, code: 'EPERM', remaining: 0, hits: 0, directoryOpened: false, cleanupWithOpenFile: false});
  faults.sessionFds.clear();
});
afterEach(() => {
  Object.assign(faults, {kind: null, step: null, remaining: 0, hits: 0, directoryOpened: false});
  fs.rmSync(temp, {recursive: true, force: true});
});

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
    Object.assign(faults, {kind: 'win32', code, step, remaining: 2});
    release();
    expect(faults.hits).toBe(2);
    expect(faults.cleanupWithOpenFile).toBe(false);
    expect(faults.sessionFds.size).toBe(0);
    expect(fs.existsSync(path.join(store, 'store-access.lock'))).toBe(false);
  });

  it.each(releaseSteps)('reports busy within the call wait limit when %s stays busy', step => {
    const release = acquireStoreAccess(store);
    Object.assign(faults, {kind: 'win32', code: 'EBUSY', step, remaining: Infinity});
    let error: unknown;
    const started = Date.now();
    try { withStoreWaitLimit(80, release); } catch (caught) { error = caught; }
    expect(error).toBeInstanceOf(StoreUnavailableError);
    expect((error as StoreUnavailableError).issue).toMatchObject({code: 'contention-timeout', systemCode: 'EBUSY', retryable: true});
    expect((error as StoreUnavailableError).issue.waitedMs).toBeGreaterThanOrEqual(80);
    expect(Date.now() - started).toBeLessThan(1500);
    expect(faults.hits).toBeGreaterThan(1);
    expect(faults.sessionFds.size).toBe(0);
  });

  it.each(['EPERM', 'EACCES'])('preserves a persistent %s permission fault after the bounded retry', code => {
    const release = acquireStoreAccess(store);
    Object.assign(faults, {kind: 'win32', code, step: 'cleanup', remaining: Infinity});
    let error: unknown;
    try { withStoreWaitLimit(80, release); } catch (caught) { error = caught; }
    expect((error as StoreUnavailableError).issue).toMatchObject({code: 'access-denied', systemCode: code, operation: 'clean session directory'});
    expect((error as StoreUnavailableError).issue.waitedMs).toBeGreaterThanOrEqual(80);
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
});

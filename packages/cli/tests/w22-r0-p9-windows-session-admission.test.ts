import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {acquireStoreAccess, StoreUnavailableError} from '../src/store/database';

type Step = 'create' | 'secure' | 'open';
const faults = vi.hoisted(() => ({kind: null as null | 'win32' | 'linux', step: null as null | 'create' | 'secure' | 'open', remaining: 0, hits: 0}));

// Windows returns EPERM when a process opens or creates a Store session path that another process is deleting.
vi.mock('node:fs', async original => {
  const actual = await original<typeof import('node:fs')>();
  const inject = (step: Step, target: string) => {
    if (faults.step !== step || faults.remaining <= 0) return;
    faults.remaining--;
    faults.hits++;
    throw Object.assign(new Error(`EPERM: operation not permitted, open '${target}'`), {code: 'EPERM'});
  };
  return {
    ...actual,
    mkdirSync: (...args: Parameters<typeof actual.mkdirSync>) => {
      if (String(args[0]).endsWith('store-access.lock')) inject('create', String(args[0]));
      return actual.mkdirSync(...args);
    },
    openSync: (...args: Parameters<typeof actual.openSync>) => {
      const target = String(args[0]);
      if (target.endsWith('store-access.lock')) inject('secure', target);
      else if (path.basename(target).startsWith('.pending-')) inject('open', target);
      return actual.openSync(...args);
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
  Object.assign(faults, {kind: null, step: null, remaining: 0, hits: 0});
});
afterEach(() => {
  Object.assign(faults, {kind: null, step: null, remaining: 0, hits: 0});
  fs.rmSync(temp, {recursive: true, force: true});
});

describe('Store session admission on Windows (D-059)', () => {
  it.each([
    ['create', 'creates the session directory'],
    ['secure', 'opens the session directory'],
    ['open', 'creates the session file'],
  ] as const)('retries a transient EPERM when it %s (%s)', step => {
    Object.assign(faults, {kind: 'win32', step, remaining: 2});
    const release = acquireStoreAccess(store, false, 5_000);
    expect(faults.hits).toBe(2);
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

  it('keeps EPERM fatal on the first attempt on other platforms', () => {
    Object.assign(faults, {kind: 'linux', step: 'secure', remaining: 1});
    expect(() => acquireStoreAccess(store, false, 5_000)).toThrow(StoreUnavailableError);
    expect(faults.hits).toBe(1);
  });
});

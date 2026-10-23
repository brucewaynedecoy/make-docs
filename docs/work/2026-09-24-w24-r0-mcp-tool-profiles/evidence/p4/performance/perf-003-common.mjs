import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';

export const PROFILE = Object.freeze({ id: 'PERF-003', version: 1, digest: '596198aff5593560606677258b4754cd81aef440477d1d3a058f5828aecbe6eb', packet: 'W24-R0-P4-PERF-003-PACKET-1', budget: 'W24-R0-P4-PERF-003-B1' });
export const PROFILES = Object.freeze(['all', 'core', 'setup', 'workflow', 'quality', 'backlog']);
export const TOOL_COUNTS = Object.freeze({ all: 43, core: 8, setup: 15, workflow: 14, quality: 9, backlog: 3 });
export const RESOURCE_COUNTS = Object.freeze({ all: 62, core: 7, setup: 7, workflow: 48, quality: 33, backlog: 8 });
export const LIMITS = Object.freeze({ passes: 1, corrections: 1, reviews: 2, elapsedMs: 90 * 60 * 1000, launches: 60, listCalls: 720, externalSpend: 0, paidModelRequests: 0 });
export const sha256 = value => crypto.createHash('sha256').update(value).digest('hex');
export const readJson = file => JSON.parse(fs.readFileSync(file, 'utf8'));

// Object keys are sorted. Array order and JSON values remain unchanged.
export function stableSerialize(value) {
  const normalize = value => Array.isArray(value) ? value.map(normalize) : value !== null && typeof value === 'object' ? Object.fromEntries(Object.keys(value).sort().map(key => [key, normalize(value[key])])) : value;
  return JSON.stringify(normalize(value));
}

export function immutableJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, { flag: 'wx' });
}

export function walkManifest(directory) {
  const files = {};
  const visit = current => {
    for (const entry of fs.readdirSync(current, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const file = path.join(current, entry.name);
      const relative = path.relative(directory, file).split(path.sep).join('/');
      if (entry.isDirectory()) visit(file);
      else if (entry.isSymbolicLink()) files[relative] = { kind: 'link', target: fs.readlinkSync(file) };
      else files[relative] = { kind: 'file', bytes: fs.statSync(file).size, sha256: sha256(fs.readFileSync(file)) };
    }
  };
  visit(directory);
  return { digest: sha256(stableSerialize(files)), files };
}

export function profileDigest(text) {
  const normalized = text.replace(/\r\n?/g, '\n');
  const start = normalized.indexOf('### PERF-003 Profile Context And Stdio Discovery\n');
  assert.notEqual(start, -1, 'PERF-003 section is absent');
  const end = normalized.indexOf('\n## ', start + 1);
  const section = normalized.slice(start, end === -1 ? undefined : end + 1).replace(/^\| Source Digest \|.*\n/gm, '');
  assert.ok(section.endsWith('\n'), 'Profile section must retain its final LF');
  return { digest: sha256(section), normalizedBytes: Buffer.byteLength(section, 'utf8') };
}

export function plannedOrder() {
  return Array.from({ length: 5 }, (_, round) => [...PROFILES.slice(round), ...PROFILES.slice(0, round)].map((profile, position) => ({ round, position, profile, launch: round * 6 + position + 1 }))).flat();
}

export function statistics(values) {
  assert.ok(values.length, 'Statistics need observations');
  assert.ok(values.every(Number.isFinite), 'Statistics need finite observations');
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return { count: values.length, medianMs: sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2, minimumMs: sorted[0], maximumMs: sorted.at(-1), rawMs: values };
}

// Hook the standard SDK's real Node spawn without replacing its transport.
export function installSpawnBoundary(childProcess, predicate, now, observe) {
  const original = childProcess.spawn;
  childProcess.spawn = function (...args) {
    if (!predicate(...args)) return original.apply(this, args);
    const started = now();
    const child = original.apply(this, args);
    observe({ started, child });
    return child;
  };
  return () => { childProcess.spawn = original; };
}

export function validateList(result, kind, profile, expected) {
  const arrayKey = kind === 'tools' ? 'tools' : 'resources';
  const key = kind === 'tools' ? 'name' : 'uri';
  const entries = result[arrayKey];
  assert.ok(Array.isArray(entries), `Missing ${arrayKey} list`);
  const count = kind === 'tools' ? TOOL_COUNTS[profile] : RESOURCE_COUNTS[profile];
  assert.equal(entries.length, count, `${profile} ${kind} count`);
  assert.equal(new Set(entries.map(item => item[key])).size, count, `${profile} ${kind} unique count`);
  assert.deepEqual(result, expected, `${profile} ${kind} wire list changed`);
  assert.ok(!result.nextCursor, 'Pagination would change the measurement boundary');
  const serializedArray = stableSerialize(entries);
  return { uniqueCount: count, serializedArray, utf8Bytes: Buffer.byteLength(serializedArray, 'utf8'), arraySha256: sha256(serializedArray) };
}

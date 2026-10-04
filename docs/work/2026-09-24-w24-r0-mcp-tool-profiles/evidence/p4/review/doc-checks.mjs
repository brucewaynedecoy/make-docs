import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const root = process.cwd();
const work = 'docs/work/2026-09-24-w24-r0-mcp-tool-profiles';
const paths = [`${work}/04-compatibility-and-evidence.md`, `${work}/00-index.md`, `${work}/evidence.md`, 'docs/plans/2026-09-24-w24-r0-mcp-tool-profiles/00-overview.md', '.make-docs/archive/history/2026-10-03-w24-r0-p4-mcp-tool-profiles.md'];
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const failures = [];
let links = 0;
const slug = text => text.toLowerCase().replace(/<[^>]*>/g, '').replace(/[^\p{L}\p{N}_\-\s]/gu, '').replace(/\s/g, '-');
const anchors = file => {
  const text = fs.readFileSync(file, 'utf8').replace(/```[\s\S]*?```/g, '');
  const used = new Map();
  return new Set([...text.matchAll(/^#{1,6}\s+(.+)$/gm)].map(match => { const base = slug(match[1]); const count = used.get(base) ?? 0; used.set(base, count + 1); return count ? `${base}-${count}` : base; }));
};
for (const file of paths) {
  const body = fs.readFileSync(file, 'utf8');
  if (/\{\{|\}\}|\b(?:TODO|TBD|FIXME)\b/.test(body)) failures.push({ file, reason: 'placeholder' });
  const prose = body.replace(/```[\s\S]*?```/g, '');
  for (const match of prose.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
    const target = match[1].split(/\s+["']/)[0].replace(/^<|>$/g, '');
    if (/^(https?:|mailto:|make-docs:|codex:)/.test(target)) continue;
    links++;
    const [relative, anchor] = target.split('#');
    const resolved = path.resolve(root, path.dirname(file), decodeURIComponent(relative || path.basename(file)));
    if (!fs.existsSync(resolved)) failures.push({ file, target, reason: 'missing-target' });
    else if (anchor && !anchors(resolved).has(decodeURIComponent(anchor))) failures.push({ file, target, reason: 'missing-anchor' });
  }
}
const plan = 'docs/plans/2026-09-24-w24-r0-mcp-tool-profiles/04-compatibility-and-validation.md';
const committedPlan = execFileSync('git', ['show', `5162f1c7c918cf6c7c82cf443d178d35c3f2e836:${plan}`], { encoding: 'utf8' });
assert.equal(fs.readFileSync(plan, 'utf8'), committedPlan, 'canonical PERF plan remains byte-identical');
const beforeEvidence = execFileSync('git', ['show', `5162f1c7c918cf6c7c82cf443d178d35c3f2e836:${work}/evidence.md`], { encoding: 'utf8' });
assert.ok(fs.readFileSync(`${work}/evidence.md`, 'utf8').startsWith(beforeEvidence), 'P1-P3 evidence prefix retained exactly');
const changed = execFileSync('git', ['diff', '--name-only'], { encoding: 'utf8' }).trim().split('\n').filter(Boolean);
const allowed = new Set(paths.filter(file => !file.includes('/history/')));
for (const file of changed) if (!allowed.has(file)) failures.push({ file, reason: 'unexpected-tracked-change' });
const diff = execFileSync('git', ['diff', '--check'], { encoding: 'utf8' });
const result = { coordinate: 'W24 R0 P4', capturedAt: new Date().toISOString(), passed: failures.length === 0, checkedPaths: paths, hashes: Object.fromEntries(paths.map(file => [file, hash(fs.readFileSync(file))])), checkedLinks: links, failures, canonicalPlanUnchanged: true, p1P2P3EvidenceUnchanged: true, trackedChangeAllowlist: changed, diffCheck: diff };
fs.writeFileSync(path.join(root, work, 'evidence/p4/review/doc-checks-attempt-1.json'), `${JSON.stringify(result, null, 2)}\n`, { flag: 'wx' });
console.log(JSON.stringify(result));
assert.equal(result.passed, true);

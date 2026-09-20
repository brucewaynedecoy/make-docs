import { afterEach, describe, expect, it } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, readdirSync, symlinkSync, chmodSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { previewProjectLayout, verifyProjectLayout, type LayoutPlan } from '../src/layout-plan.js';

const roots: string[] = [];
function root(): string { const p = mkdtempSync(path.join(tmpdir(), 'layout-plan-')); roots.push(p); return p; }
function file(root: string, name: string, body: string | Buffer = 'content'): void { mkdirSync(path.dirname(path.join(root, name)), { recursive: true }); writeFileSync(path.join(root, name), body); }
function apply(plan: LayoutPlan): void {
  for (const change of plan.changes) {
    const target = path.join(plan.projectRoot, change.path);
    if (change.after.kind === 'missing') rmSync(target, { recursive: change.before.kind === 'directory' });
    else if (change.after.kind === 'directory') mkdirSync(target, { recursive: true, mode: change.after.mode });
    else if (change.after.kind === 'file') { writeFileSync(target, Buffer.from(change.after.contentBase64!, 'base64')); chmodSync(target, change.after.mode!); }
    else symlinkSync(change.after.target!, target);
  }
}
afterEach(() => { for (const p of roots.splice(0)) rmSync(p, { recursive: true, force: true }); });
describe('reviewed project layout plan', () => {
  it('inventories and removes exact empty old roots without creating asset children', () => {
    const p = root(); mkdirSync(path.join(p, '.make-docs/contracts/system'), { recursive: true });
    const plan = previewProjectLayout(p);
    expect(plan.blockers).toEqual([]);
    expect(plan.entries.some((e) => e.path === '.make-docs/contracts/system' && e.disposition === 'remove-empty')).toBe(true);
    expect(plan.changes.map((e) => e.path)).toEqual(['.make-docs/contracts/system', '.make-docs/contracts']);
    apply(plan); expect(verifyProjectLayout(p, plan).blockers).toEqual([]);
  });
  it('preserves nested binary content, orders destination writes before source deletion, and repeats unchanged', () => {
    const p = root(); file(p, 'docs/artifacts/deep/payload.bin', Buffer.from([0, 255, 128, 4]));
    mkdirSync(path.join(p, 'docs/artifacts/empty'), { recursive: true });
    const plan = previewProjectLayout(p); expect(plan.blockers).toEqual([]);
    expect(plan.changes.findIndex((e) => e.path === 'docs/assets/project/deep/payload.bin')).toBeLessThan(plan.changes.findIndex((e) => e.path === 'docs/artifacts/deep/payload.bin'));
    expect(verifyProjectLayout(p, plan, 'before').blockers).toEqual([]);
    apply(plan); expect(verifyProjectLayout(p, plan).blockers).toEqual([]);
    expect(readFileSync(path.join(p, 'docs/assets/project/deep/payload.bin'))).toEqual(Buffer.from([0, 255, 128, 4]));
    expect(previewProjectLayout(p).changes).toEqual([]);
  });
  it('moves archive and retired Playbooks with historical content intact', () => {
    const p = root(); file(p, 'docs/assets/archive/history/a.md', 'Past fact.'); file(p, 'docs/assets/playbooks/old.md', 'Retired work.');
    const plan = previewProjectLayout(p); expect(plan.blockers).toEqual([]); apply(plan);
    expect(readFileSync(path.join(p, '.make-docs/archive/history/a.md'), 'utf8')).toBe('Past fact.');
    expect(readFileSync(path.join(p, '.make-docs/archive/legacy-playbooks/old.md'), 'utf8')).toBe('Retired work.');
    expect(verifyProjectLayout(p, plan).blockers).toEqual([]);
  });
  it('requires explicit developer and agent audience review', () => {
    const p = root(); file(p, 'docs/assets/library/developer/a.md'); file(p, 'docs/assets/library/agent/a.md');
    expect(previewProjectLayout(p).blockers).toHaveLength(2);
    const plan = previewProjectLayout(p, ['docs/assets/library/developer=docs/assets/maintainer', 'docs/assets/library/agent=docs/assets/maintainer/agent-guides']);
    expect(plan.blockers).toEqual([]); apply(plan); expect(verifyProjectLayout(p, plan).blockers).toEqual([]);
  });
  it('requires an explicit disposition for unproven old system bodies', () => {
    const p = root(); file(p, '.make-docs/contracts/system/custom.md');
    expect(previewProjectLayout(p).blockers).toHaveLength(1);
    const plan = previewProjectLayout(p, ['.make-docs/contracts/system/custom.md=.make-docs/archive/old-contracts/custom.md']);
    expect(plan.blockers).toEqual([]); apply(plan); expect(verifyProjectLayout(p, plan).blockers).toEqual([]);
  });
  it('blocks different collisions and requires reviewed provenance for identical duplicates', () => {
    const p = root(); file(p, 'docs/artifacts/a.bin', 'first'); file(p, 'docs/assets/project/a.bin', 'second');
    expect(previewProjectLayout(p).blockers[0]).toContain('Destination conflict');
    file(p, 'docs/assets/project/a.bin', 'first');
    expect(previewProjectLayout(p).blockers[0]).toContain('provenance');
    const plan = previewProjectLayout(p, ['docs/artifacts=docs/assets/project']); expect(plan.blockers).toEqual([]); apply(plan);
    expect(verifyProjectLayout(p, plan).blockers).toEqual([]);
  });
  it('repairs incoming and moved Markdown/reference links and pins unchanged target bytes', () => {
    const p = root(); file(p, 'docs/assets/library/user/a.md', '[Shared](../../artifacts/a.md)\n[Home](../../../home.md)');
    file(p, 'docs/assets/artifacts/a.md', '# Shared'); file(p, 'docs/home.md', '[Guide][g]\n[g]: assets/library/user/a.md');
    const plan = previewProjectLayout(p); expect(plan.blockers).toEqual([]); expect(plan.linkEdits).toHaveLength(3);
    apply(plan); expect(verifyProjectLayout(p, plan).blockers).toEqual([]);
    expect(readFileSync(path.join(p, 'docs/assets/user/a.md'), 'utf8')).toContain('../project/a.md');
    expect(readFileSync(path.join(p, 'docs/home.md'), 'utf8')).toContain('assets/user/a.md');
    file(p, 'docs/home.md', 'drift'); expect(verifyProjectLayout(p, plan).blockers.some((e) => e.includes('docs/home.md'))).toBe(true);
  });
  it('binds config bytes and reviewed maps to the digest and detects new source entries at all gates', () => {
    const p = root(); file(p, 'docs/artifacts/a.md'); const plan = previewProjectLayout(p);
    expect(previewProjectLayout(p, ['docs/artifacts=docs/assets/project']).digest).not.toBe(plan.digest);
    file(p, '.make-docs/config.yaml', '# declarative config\n'); expect(verifyProjectLayout(p, plan, 'before').blockers.some((e) => e.includes('config.yaml'))).toBe(true);
    rmSync(path.join(p, '.make-docs/config.yaml')); file(p, 'docs/artifacts/new.md');
    expect(verifyProjectLayout(p, plan, 'progress').blockers.some((e) => e.includes('new.md'))).toBe(true);
  });
  it('accepts only before/after known bytes during recovery and rejects a changed payload', () => {
    const p = root(); file(p, 'docs/artifacts/a.md'); const plan = previewProjectLayout(p);
    const partial = { ...plan, changes: plan.changes.slice(0, 3) }; apply(partial);
    expect(verifyProjectLayout(p, plan, 'progress').blockers).toEqual([]);
    file(p, 'docs/artifacts/a.md', 'concurrent work'); expect(verifyProjectLayout(p, plan, 'progress').blockers).not.toEqual([]);
  });
  it('rejects unsafe maps and symlink parents without writing through them', () => {
    const p = root(); file(p, 'docs/artifacts/a.md');
    expect(previewProjectLayout(p, ['docs/artifacts=../../escape']).blockers).not.toEqual([]);
    mkdirSync(path.join(p, 'docs/assets'), { recursive: true }); symlinkSync(tmpdir(), path.join(p, 'docs/assets/project'));
    expect(() => previewProjectLayout(p)).toThrow('Unsafe layout parent');
    expect(readdirSync(path.join(p, 'docs/artifacts'))).toEqual(['a.md']);
  });
  it('shows symlink refusal in preview before a user can prepare the plan', () => {
    const p = root(); file(p, 'docs/artifacts/a.md'); symlinkSync('a.md', path.join(p, 'docs/artifacts/link'));
    symlinkSync('/etc/passwd', path.join(p, 'docs/artifacts/outside'));
    const plan = previewProjectLayout(p);
    expect(plan.blockers.filter((e) => e.includes('Symbolic link'))).toHaveLength(2);
    expect(plan.entries.filter((e) => e.state.kind === 'symlink').every((e) => e.disposition === 'blocked')).toBe(true);
    expect(plan.changes.some((e) => e.before.kind === 'symlink' || e.after.kind === 'symlink')).toBe(false);
  });

  it('skips code examples and repairs YAML links with explicit Persona metadata changes', () => {
    const p = root();
    file(p, 'docs/assets/library/developer/a.md', '---\npersona: developer\nrelated:\n  - ../../../home.md\n---\n[Home](../../../home.md)\n`[Example](missing)`\n```md\n[Example](also-missing)\n```\n');
    file(p, 'docs/home.md');
    const plan = previewProjectLayout(p, ['docs/assets/library/developer=docs/assets/maintainer']);
    expect(plan.blockers).toEqual([]); expect(plan.metadataEdits).toHaveLength(1); apply(plan);
    const text = readFileSync(path.join(p, 'docs/assets/maintainer/a.md'), 'utf8');
    expect(text).toContain('persona: "maintainer"'); expect(text).toContain('"../../home.md"');
    expect(text).toContain('`[Example](missing)`'); expect(text).toContain('[Example](also-missing)');
    expect(verifyProjectLayout(p, plan).blockers).toEqual([]);
  });
  it('repairs only proven shipped aliases that have current targets', () => {
    const p = root(); file(p, 'docs/assets/library/user/a.md', '[Contract](../../../../.make-docs/contracts/system/test.md)\n[Router](../AGENTS.md)');
    file(p, '.make-docs/system/contracts/test.md'); file(p, 'docs/assets/AGENTS.md');
    const plan = previewProjectLayout(p); expect(plan.blockers).toEqual([]); expect(plan.linkEdits).toHaveLength(2);
    apply(plan); expect(verifyProjectLayout(p, plan).blockers).toEqual([]);
  });
  it('records exact pre-existing historical missing links and blocks active missing links', () => {
    const p = root(); file(p, 'docs/assets/archive/a.md', '[Old](gone.md)'); file(p, 'docs/artifacts/a.md', '[Active](gone.md)');
    const plan = previewProjectLayout(p); expect(plan.blockers).toHaveLength(1);
    expect(plan.exclusions.some((e) => e.path === 'docs/assets/archive/a.md' && e.reason.includes('docs/assets/archive/gone.md'))).toBe(true);
    const archived = previewProjectLayout(p, ['docs/artifacts/a.md=.make-docs/archive/retired/a.md']);
    expect(archived.blockers).toEqual([]); apply(archived); expect(verifyProjectLayout(p, archived).blockers).toEqual([]);
  });
  it('rejects a new incoming document during progress and final verification', () => {
    const p = root(); file(p, 'docs/artifacts/a.md'); const plan = previewProjectLayout(p);
    file(p, 'docs/new-guide.md', '[Old](artifacts/a.md)');
    expect(verifyProjectLayout(p, plan, 'progress').blockers.some((e) => e.includes('new-guide.md'))).toBe(true);
  });

  it('accepts only exact Store-proven stage files during progress, never at final verification', () => {
    const p = root(); file(p, 'docs/artifacts/a.md'); const plan = previewProjectLayout(p);
    const temporary = 'docs/artifacts/.make-docs-00000000-0000-4000-8000-000000000001-1.tmp';
    file(p, temporary, 'part'); chmodSync(path.join(p, temporary), 0o600);
    const proof = { [temporary]: { kind: 'file' as const, digest: createHash('sha256').update('part').digest('hex'), mode: 0o600 } };
    expect(verifyProjectLayout(p, plan, 'progress', proof).blockers).toEqual([]);
    expect(verifyProjectLayout(p, plan, 'before', proof).blockers).not.toEqual([]);
    file(p, 'docs/artifacts/.make-docs-unrecorded.tmp', 'user content');
    expect(verifyProjectLayout(p, plan, 'progress', proof).blockers.some((e) => e.includes('unrecorded'))).toBe(true);
    file(p, temporary, 'changed');
    expect(verifyProjectLayout(p, plan, 'progress', proof).blockers.some((e) => e.includes('Owned temporary file changed'))).toBe(true);
    expect(readFileSync(path.join(p, temporary), 'utf8')).toBe('changed');
    expect(readFileSync(path.join(p, 'docs/artifacts/.make-docs-unrecorded.tmp'), 'utf8')).toBe('user content');
  });

  it('repairs README incoming links and guards later README edits', () => {
    const p = root(); file(p, 'docs/assets/library/user/guide.md', '# Guide');
    file(p, 'README.md', '[Guide](docs/assets/library/user/guide.md)');
    const plan = previewProjectLayout(p); expect(plan.blockers).toEqual([]);
    expect(plan.linkEdits.some((edit) => edit.source === 'README.md')).toBe(true);
    apply(plan); expect(readFileSync(path.join(p, 'README.md'), 'utf8')).toBe('[Guide](docs/assets/user/guide.md)');
    expect(verifyProjectLayout(p, plan).blockers).toEqual([]);
    file(p, 'README.md', 'Concurrent author edit');
    expect(verifyProjectLayout(p, plan).blockers.some((message) => message.includes('README.md'))).toBe(true);
  });
  it('repairs relative links inside explicitly moved old-system Markdown', () => {
    const p = root(); file(p, '.make-docs/contracts/system/old.md', '[Readme](../../../README.md)'); file(p, 'README.md', '# Project');
    const plan = previewProjectLayout(p, ['.make-docs/contracts/system/old.md=.make-docs/archive/old-contracts/old.md']);
    expect(plan.blockers).toEqual([]); apply(plan);
    expect(readFileSync(path.join(p, '.make-docs/archive/old-contracts/old.md'), 'utf8')).toBe('[Readme](../../../README.md)');
    // Also move to a destination of a different depth so the old source cannot pass accidentally.
    const q = root(); file(q, '.make-docs/contracts/system/old.md', '[Readme](../../../README.md)'); file(q, 'README.md', '# Project');
    const changed = previewProjectLayout(q, ['.make-docs/contracts/system/old.md=.make-docs/archive/old.md']);
    expect(changed.blockers).toEqual([]); expect(changed.linkEdits.some((edit) => edit.source === '.make-docs/contracts/system/old.md')).toBe(true);
    apply(changed); expect(readFileSync(path.join(q, '.make-docs/archive/old.md'), 'utf8')).toBe('[Readme](../../README.md)');
    expect(verifyProjectLayout(q, changed).blockers).toEqual([]);
  });
  it('keeps explicit source provenance ahead of a different live alias destination', () => {
    const p = root(); file(p, '.make-docs/contracts/system/old.md', 'Historical contract');
    file(p, '.make-docs/system/contracts/old.md', 'Different current contract');
    file(p, 'README.md', '[Old](.make-docs/contracts/system/old.md)');
    const plan = previewProjectLayout(p, ['.make-docs/contracts/system/old.md=.make-docs/archive/contracts/old.md']);
    expect(plan.blockers).toEqual([]);
    expect(plan.linkEdits.find((edit) => edit.source === 'README.md')?.target).toBe('.make-docs/archive/contracts/old.md');
    apply(plan); expect(readFileSync(path.join(p, 'README.md'), 'utf8')).toBe('[Old](.make-docs/archive/contracts/old.md)');
    expect(readFileSync(path.join(p, '.make-docs/system/contracts/old.md'), 'utf8')).toBe('Different current contract');
    expect(verifyProjectLayout(p, plan).blockers).toEqual([]);
  });

});

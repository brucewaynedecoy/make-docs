import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { applyInstallPlan, planInstall } from '../src/install';
import { defaultSelections } from '../src/profile';
import { loadManifest, writeManifest } from '../src/manifest';
import { runCli } from '../src/cli';
import { previewProjectLayout } from '../src/layout-plan';
import { getDesiredAssetsForMaterializationMode } from '../src/catalog';
import { resolveInstallProfile } from '../src/profile';
import { DEFAULT_SYSTEM_ASSET_MATERIALIZATION_MODE } from '../src/types';

const names = [
  ['templates/guide-developer.md', 'templates/guide-maintainer.md'],
  ['prompts/coverage-pass-developer-guide.prompt.md', 'prompts/coverage-pass-maintainer-guide.prompt.md'],
] as const;
let temp: string, root: string;
const file = (name: string) => path.join(root, '.make-docs/system', name);
beforeEach(() => {
  temp = mkdtempSync(path.join(os.tmpdir(), 'r4-guide-upgrade-'));
  root = path.join(temp, 'project'); mkdirSync(root);
  vi.stubEnv('MAKE_DOCS_HOME', path.join(temp, 'store'));
  vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
});
afterEach(() => {vi.restoreAllMocks(); vi.unstubAllEnvs(); process.exitCode = 0; rmSync(temp, {recursive: true, force: true});});

async function legacyFixture() {
  const selections = defaultSelections(); selections.skills = false; selections.resourceProjection = ['template', 'prompt'];
  const plan = await planInstall({targetDir: root, selections, existingManifest: null});
  applyInstallPlan({targetDir: root, plan, existingManifest: null});
  let prior = JSON.stringify(loadManifest(root)!);
  for (const [oldName, currentName] of names) {
    renameSync(file(currentName), file(oldName));
    // Keep every URI/path/source claim consistent with the former package inventory.
    prior = prior.replaceAll(path.basename(currentName), path.basename(oldName));
  }
  writeManifest(root, JSON.parse(prior));
  return selections;
}

describe('W19 R4 canonical guide resource names', () => {
  it('exposes canonical public resource URIs and rejects retired names', async () => {
    for (const [oldName, currentName] of names) {
      const type = currentName.startsWith('templates/') ? 'template' : 'prompt';
      await runCli(['resource', 'read', `make-docs://system/${type}/${path.basename(currentName)}`]);
      await expect(runCli(['resource', 'read', `make-docs://system/${type}/${path.basename(oldName)}`])).rejects.toThrow();
    }
    expect(existsSync(path.join(temp, 'store'))).toBe(false);
  });
  it('selects only canonical guide and coverage prompt resource filenames', () => {
    const paths = getDesiredAssetsForMaterializationMode(resolveInstallProfile(defaultSelections()), DEFAULT_SYSTEM_ASSET_MATERIALIZATION_MODE).map(asset => asset.relativePath);
    for (const [oldName, currentName] of names) {
      expect(paths).toContain(`.make-docs/system/${currentName}`);
      expect(paths).not.toContain(`.make-docs/system/${oldName}`);
    }
  });
  it('public setup replaces verified old resources, removes old ownership, and repeats cleanly', async () => {
    const selections = await legacyFixture();
    const plan = await planInstall({targetDir: root, selections, existingManifest: loadManifest(root)});
    for (const [oldName, currentName] of names) {
      expect(plan.actions.findIndex(action => action.relativePath === `.make-docs/system/${currentName}`)).toBeLessThan(plan.actions.findIndex(action => action.relativePath === `.make-docs/system/${oldName}`));
      expect(plan.actions.find(action => action.relativePath === `.make-docs/system/${oldName}`)?.type).toBe('remove-managed');
    }
    await runCli(['setup', '--yes', '--target', root]);
    for (const [oldName, currentName] of names) {
      expect(existsSync(file(oldName))).toBe(false);
      expect(existsSync(file(currentName))).toBe(true);
      expect(JSON.stringify(loadManifest(root))).not.toContain(path.basename(oldName));
    }
    await runCli(['setup', '--yes', '--target', root]);
    expect(existsSync(path.join(root, '.make-docs/state'))).toBe(false);
  });
  it.each(names)('preserves edited retired resource %s and reports the conflict', async (oldName) => {
    await legacyFixture();
    writeFileSync(file(oldName), '# User changes must survive\n');
    await expect(runCli(['setup', '--yes', '--target', root])).rejects.toThrow(/conflict|review|overwrite|unresolved ownership or safety stops/i);
    expect(readFileSync(file(oldName), 'utf8')).toBe('# User changes must survive\n');
    expect(loadManifest(root)?.files[`.make-docs/system/${oldName}`]).toBeDefined();
  });
  it('repairs a retired link only when the old target is absent and its canonical target exists', () => {
    mkdirSync(path.dirname(file('templates/guide-maintainer.md')), {recursive: true});
    writeFileSync(file('templates/guide-maintainer.md'), '# Maintainer\n');
    mkdirSync(path.join(root, 'docs'), {recursive: true});
    writeFileSync(path.join(root, 'docs/note.md'), '[Guide](../.make-docs/system/templates/guide-developer.md)\n');
    let plan = previewProjectLayout(root);
    expect(plan.linkEdits).toContainEqual(expect.objectContaining({after: '../.make-docs/system/templates/guide-maintainer.md'}));
    writeFileSync(file('templates/guide-developer.md'), '# Local legacy content\n');
    plan = previewProjectLayout(root);
    expect(plan.linkEdits).not.toContainEqual(expect.objectContaining({after: '../.make-docs/system/templates/guide-maintainer.md'}));
  });
  it.each(names)('requires exact review instead of recreating retired filename %s from a pre-system root', (oldName, currentName) => {
    const family = oldName.split('/')[0]!;
    const source = `.make-docs/${family}/system/${path.basename(oldName)}`;
    mkdirSync(path.dirname(path.join(root, source)), {recursive: true});
    writeFileSync(path.join(root, source), '# Retained legacy bytes\n');
    const broad = previewProjectLayout(root, [`.make-docs/${family}/system=.make-docs/system/${family}`]);
    expect(broad.blockers).toContainEqual(expect.stringContaining('Retired system resource name must not be recreated'));
    const exact = previewProjectLayout(root, [`${source}=.make-docs/system/${currentName}`]);
    expect(exact.blockers).toEqual([]);
    expect(exact.entries).toContainEqual(expect.objectContaining({path: source, destination: `.make-docs/system/${currentName}`, disposition: 'move'}));
  });
});

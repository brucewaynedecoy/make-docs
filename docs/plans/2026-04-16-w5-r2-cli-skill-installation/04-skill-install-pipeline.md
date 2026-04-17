# Phase 4 — Skill Install Pipeline

## Objective

Add a harness-aware skill catalog that computes multi-target install paths, rewrites references per harness, and integrates with the planner and installer. When both Claude Code and Codex are selected, each skill produces two installed copies — one in `.claude/skills/` and one in `.agents/skills/` — with assets similarly duplicated into `.claude/skill-assets/` and `.agents/skill-assets/`. The install root depends on scope: `.` for project, `~` for global.

## Depends On

- Phase 1 (needs `Harness` type, `HARNESSES` const, `harnesses` and `skillScope` in `InstallSelections`)
- Phase 2 (needs `skill-registry.json`, registry loader, `local:` protocol resolver)

## Files to Create/Modify

| File | Change Summary |
| ---- | -------------- |
| `packages/cli/src/skill-catalog.ts` | **New.** Exports `getDesiredSkillAssets(selections)` — multi-target skill discovery, path computation, and reference rewriting. |
| `packages/cli/src/planner.ts` | Integrate skill assets into `createInstallPlan`. |
| `packages/cli/src/install.ts` | Integrate skill asset application into `applyInstallPlan`. |
| `packages/cli/src/manifest.ts` | Handle `skillFiles` keyed by harness + scope in manifest read/write. |

## Detailed Changes

### 1. `skill-catalog.ts` — Multi-target skill discovery

Create a new module exporting `getDesiredSkillAssets(selections: InstallSelections)` that:

1. Returns an empty array if `!selections.skills`.
2. Loads the skill registry via the Phase 2 registry loader.
3. Determines the install root from `selections.skillScope`: `.` for `"project"`, `os.homedir()` for `"global"`.
4. Iterates over `HARNESSES`, skipping any harness where `selections.harnesses[harness]` is false.
5. For each active harness, for each registry skill entry:
   a. Resolves the harness-specific directories:
      - Skills dir: `.claude/skills/` for `claude-code`, `.agents/skills/` for `codex`.
      - Assets dir: `.claude/skill-assets/` for `claude-code`, `.agents/skill-assets/` for `codex`.
   b. Computes the skill install path: `<install-root>/<harness-skills-dir>/<installName>`.
   c. Reads the entry point content via the protocol resolver (Phase 2).
   d. Rewrites relative references in the content to target the harness-specific asset location (see section 2 below).
   e. Returns a `DesiredAsset` with `relativePath`, `content`, and `sourceId`.
6. For each active harness, for each declared asset on each registry skill entry:
   a. Computes the asset install path: `<install-root>/<harness-skill-assets-dir>/<installPath>`.
   b. Reads the source content via the protocol resolver.
   c. Returns a `DesiredAsset` with `relativePath`, `content`, and `sourceId`.

The return type is an array of `DesiredAsset` objects. When both harnesses are selected, the array contains two copies of each skill and asset — one per harness — with distinct `relativePath` values pointing to the correct harness directory.

### 2. Reference rewriting

When a SKILL.md contains a relative reference like `references/archive-workflow.md`, the installed copy at `.claude/skills/archive-docs-archive.md` needs that reference to resolve to `../skill-assets/archive-docs/references/archive-workflow.md`. For the Codex copy at `.agents/skills/archive-docs-archive.md`, it resolves to `../skill-assets/archive-docs/references/archive-workflow.md` (same relative shape, different absolute root).

The rewriting logic per harness:

1. Parse all relative markdown links and file references in the entry point content.
2. Resolve each link relative to the source entry point's original location.
3. Match the resolved path against the skill's declared assets to find the corresponding `installPath`.
4. Compute a relative path from the skill's install location (`<harness-skills-dir>/`) to the asset's install location (`<harness-skill-assets-dir>/<installPath>`).
5. Replace the original reference with the computed relative path.

Because the relative offset from `skills/` to `skill-assets/` is `../skill-assets/` for both harnesses, the rewritten content is structurally identical across harnesses. The rewriting function can therefore compute the rewrite once and reuse it — but each harness still gets its own `DesiredAsset` with the correct `relativePath`.

### 3. `planner.ts` — Integrate skill actions

In `createInstallPlan`, after building docs-template actions:

1. Call `getDesiredSkillAssets(profile.selections)`.
2. For each returned `DesiredAsset`, create a `PlannedAction`:
   - Compare against `manifest.skillFiles` to determine `create`, `update`, or `noop`.
   - Use the `sourceId` for content-hash comparison when deciding `update` vs `noop`.
3. Append skill actions to the plan's actions array.

The planner does not need to know about harnesses — it receives fully resolved paths from the skill catalog and treats them like any other planned action.

### 4. `install.ts` — Apply skill actions

In `applyInstallPlan`, handle skill actions alongside docs-template actions:

1. For each skill-related `PlannedAction` with status `create` or `update`, write the file to the computed path.
2. Ensure parent directories exist before writing (skill and asset directories may not exist yet, especially for first install or for the global scope).
3. Collect all installed skill file paths into the manifest update.

### 5. `manifest.ts` — skillFiles support

Update manifest read/write to handle the `skillFiles` field:

- `skillFiles` is an array of relative paths (strings) tracking all installed skill and asset files across all harnesses and scopes.
- When loading an existing manifest without `skillFiles`, treat it as an empty array (backward-compatible with R1 manifests that may have had a different shape).
- On write, persist the full list so that future `update` or `reconfigure` runs can diff against it.
- Files that were previously installed but are no longer in the desired set should be planned as `remove` actions.

## Parallelism

- `skill-catalog.ts` is a new file with no overlap with other phases — safe to create in parallel with Phases 3, 5, and 6.
- `planner.ts` and `install.ts` changes depend on the skill catalog being complete.
- `manifest.ts` changes can be done in parallel with `skill-catalog.ts`.
- All changes in this phase depend on Phases 1 and 2 being merged first.

## Acceptance Criteria

- [ ] `skill-catalog.ts` exists and exports `getDesiredSkillAssets`.
- [ ] When both harnesses are selected, the returned assets include entries for both `.claude/skills/` and `.agents/skills/`.
- [ ] When only one harness is selected, assets are returned only for that harness's directories.
- [ ] Project scope uses `.` as the install root; global scope uses `~`.
- [ ] Relative references in SKILL.md content are rewritten to resolve from the harness-specific install location.
- [ ] Rewritten references correctly point to `../skill-assets/<plugin>/<path>` for both harnesses.
- [ ] Skill actions appear in the install plan with correct `create`/`update`/`noop` status.
- [ ] Skill files are written during `applyInstallPlan` to the correct harness-specific directories.
- [ ] `manifest.skillFiles` tracks all installed skill and asset files.
- [ ] Removing a harness on reconfigure plans `remove` actions for that harness's skill files.
- [ ] `npm run build -w starter-docs` succeeds.
- [ ] `npm test -w starter-docs` passes.

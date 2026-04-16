# Phase 3 — Skill Catalog and Install

## Objective

Add skill discovery, path rewriting, and installation logic so the CLI can install skills into `.claude/skills/` and supporting assets into `.claude/skill-assets/<plugin>/` during `init` and `update`.

## Depends On

- Phase 1 (skills must be bundled in the CLI package)
- Phase 2 (`skills` boolean must exist in `InstallSelections`)

## Files to Modify

| File | Change Summary |
| ---- | -------------- |
| `packages/cli/src/utils.ts` | Add `SKILLS_ROOT` constant (resolves skills directory in dev and packed modes). |
| `packages/cli/src/catalog.ts` | Add `getDesiredSkillAssets(profile)` function that discovers and maps skill files. |
| `packages/cli/src/planner.ts` | Integrate skill assets into `createInstallPlan`. |
| `packages/cli/src/install.ts` | Integrate skill asset application into `applyInstallPlan`. |
| `packages/cli/src/manifest.ts` | Handle `skillFiles` in manifest read/write. |

## Detailed Changes

### 1. `utils.ts` — Add SKILLS_ROOT

Add a `resolveSkillsRoot(packageRoot)` function parallel to `resolveTemplateRoot`:
- First try sibling: `path.resolve(packageRoot, "..", "skills")` (dev mode)
- Then try bundled: `path.join(packageRoot, "skills")` (packed mode)
- Return `null` if neither exists (skills are optional — repos without skills shouldn't break)

Export `SKILLS_ROOT` (nullable).

### 2. `catalog.ts` — Skill discovery

Add `getDesiredSkillAssets(profile)` that:
1. Returns empty array if `!profile.selections.skills` or `SKILLS_ROOT` is null
2. Walks `SKILLS_ROOT` recursively for all files
3. For each SKILL.md, maps to install target: `.claude/skills/<plugin>-<skill-name>.md`
   - `decompose-codebase/SKILL.md` → `.claude/skills/decompose-codebase.md`
   - `archive-docs/skills/archive/SKILL.md` → `.claude/skills/archive-docs-archive.md`
   - `archive-docs/skills/staleness-check/SKILL.md` → `.claude/skills/archive-docs-staleness-check.md`
   - etc.
4. For each non-SKILL.md file (references, scripts, agents configs), maps to: `.claude/skill-assets/<plugin>/<relative-path>`
   - `archive-docs/references/archive-workflow.md` → `.claude/skill-assets/archive-docs/references/archive-workflow.md`
   - `archive-docs/scripts/trace_relationships.py` → `.claude/skill-assets/archive-docs/scripts/trace_relationships.py`
5. For SKILL.md files, rewrites relative paths in the content so references resolve from the installed location
6. Returns an array of resolved skill assets with `relativePath` (install target), `content`, and `sourceId`

### 3. Path rewriting

When a SKILL.md references `references/archive-workflow.md` or `../../references/archive-workflow.md`, the installed copy at `.claude/skills/archive-docs-archive.md` needs the reference to resolve to `../skill-assets/archive-docs/references/archive-workflow.md`.

The rewriting logic:
1. Parse all relative markdown links in the SKILL.md content
2. Resolve each link relative to the SKILL.md's original location in the skills tree
3. Map the resolved path to its install target under `.claude/skill-assets/`
4. Rewrite the link to a relative path from the SKILL.md's install location (`.claude/skills/`) to the asset's install location (`.claude/skill-assets/<plugin>/`)

### 4. `planner.ts` — Integrate skill actions

In `createInstallPlan`, after building docs-template actions, also build skill actions:
1. Call `getDesiredSkillAssets(profile)` 
2. For each skill asset, create a `PlannedAction` (create/noop/update based on manifest comparison)
3. Append skill actions to the plan's actions array

### 5. `install.ts` — Apply skill actions

In `applyInstallPlan`, handle skill actions alongside docs-template actions. Skill files are written to `.claude/skills/` and `.claude/skill-assets/`. Track installed files in `manifest.skillFiles`.

### 6. `manifest.ts` — skillFiles support

Update manifest read/write to handle the optional `skillFiles` field. Existing manifests without `skillFiles` are treated as having no installed skills (backward-compatible).

## Parallelism

- `utils.ts` change is independent and should be done first.
- `catalog.ts` depends on `utils.ts` (needs `SKILLS_ROOT`).
- `planner.ts` and `install.ts` depend on `catalog.ts`.
- `manifest.ts` can be done in parallel with `catalog.ts`.

## Acceptance Criteria

- [ ] `SKILLS_ROOT` resolves correctly in both dev and packed modes.
- [ ] `getDesiredSkillAssets` discovers all SKILL.md files and supporting assets.
- [ ] Skill files are mapped to correct install targets (`.claude/skills/<name>.md`).
- [ ] Supporting assets are mapped to `.claude/skill-assets/<plugin>/`.
- [ ] Relative references in SKILL.md content are rewritten to resolve from the install location.
- [ ] Skill actions appear in the install plan.
- [ ] Skill files are written during `applyInstallPlan`.
- [ ] `manifest.skillFiles` tracks installed skill files.
- [ ] `npm run build -w starter-docs` succeeds.

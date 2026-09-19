# Phase 2 - Skills-Only Planner and Apply

## Objective

Implement the skills-only sync and removal engine so `make-docs skills` creates, updates, and removes only skill files plus the manifest fields needed to track them.

## Depends On

- [2026-04-21-cli-skills-command.md](../../designs/2026-04-21-cli-skills-command.md)
- Phase 1 command dispatch.
- Existing skill registry/resolver code in `packages/cli/src/skill-registry.ts`, `skill-resolver.ts`, and `skill-catalog.ts`.
- Existing manifest and install action behavior in `packages/cli/src/manifest.ts`, `planner.ts`, and `install.ts`.

## Files to Modify

| File | Change Summary |
| ---- | -------------- |
| `packages/cli/src/cli.ts` | Dispatch `skills` runs into the skills-only planner/apply flow. |
| `packages/cli/src/planner.ts` or new `packages/cli/src/skills-command.ts` | Add skills-only planning for sync and removal without invoking the full docs asset planner. |
| `packages/cli/src/install.ts` or new helper module | Apply skills-only actions while preserving unrelated manifest-managed files. |
| `packages/cli/src/manifest.ts` | Ensure first-time skills-only manifests and later full installs/reconfigures remain compatible. |
| `packages/cli/tests/install.test.ts` and/or `packages/cli/tests/cli.test.ts` | Cover skills-only planning, apply, removal, and manifest state. |

## Detailed Changes

### 1. Resolve skills-only selections

For sync mode:

- If a manifest exists, seed from saved manifest selections.
- If no manifest exists, seed from skills-only defaults: Claude Code enabled, Codex enabled, project scope, required skills only.
- Apply command flags over the seed selections.
- Force `skills = true`.
- Preserve unrelated capability, prompt, template, and reference selections from the manifest when present.

For removal mode:

- Use manifest `skillFiles` as the ownership source.
- Do not require an active skills selection.
- Do not remove files that are not manifest-tracked skill files.

### 2. Add a skills-only desired asset graph

Compute desired assets through the existing skill registry/resolver path only. Do not call the broad docs catalog that produces templates, prompts, references, instructions, or generated docs assets.

The desired graph should include:

- required skill entrypoints and declared assets
- selected optional skill entrypoints and declared assets
- selected harness directories only
- selected project/global scope only

### 3. Plan safe sync and stale cleanup

The sync plan should:

- create missing desired skill files
- update current managed skill files whose manifest hash still matches
- refresh manifest-tracked skill files that lack normal file metadata when existing behavior already treats them as managed
- skip modified managed skill files with conflict messaging rather than overwriting them silently
- remove stale manifest-managed skill files that are no longer desired because of harness, scope, or optional skill changes
- leave every non-skill manifest file untouched and still present in the next manifest

### 4. Plan safe removal

`make-docs skills --remove` should:

- remove manifest-tracked skill files that still match ownership rules
- preserve modified skill files with conflict/preserved reporting rather than deleting them silently
- prune only emptied parent skill directories where existing utility behavior already makes that safe
- leave normal docs scaffold, prompts, templates, references, root instructions, and unrelated files intact
- update manifest `skillFiles` to remove deleted skills while preserving `files`

### 5. Write minimal first-time manifest state

When no manifest exists and sync mode applies successfully:

- create the config directory needed for the manifest
- write package metadata, profile id, selections, effective capabilities, `files: {}`, and populated `skillFiles`
- avoid installing root instruction files or docs scaffold solely for tracking state

The manifest shape must remain loadable by later full `make-docs`, `reconfigure`, `backup`, and `uninstall` flows.

## Acceptance Criteria

- [ ] First-time `make-docs skills --yes` writes only selected skill files plus manifest/config state.
- [ ] Existing installs preserve all non-skill manifest `files` entries after `make-docs skills --yes`.
- [ ] Harness changes remove stale managed skill files from disabled harnesses.
- [ ] Scope changes install in the new scope and remove stale managed skill files from the prior scope when safe.
- [ ] Optional skill changes add/remove only the relevant managed skill files.
- [ ] `make-docs skills --remove --yes` removes only manifest-tracked skill files.
- [ ] Modified managed skill files are preserved or conflict-staged according to the existing safety model.

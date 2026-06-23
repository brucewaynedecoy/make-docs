# P3 Skill and Script Migration

## Purpose

Rewrite selected first-party skills so they call CLI/shared-core operations instead of owning deterministic helper logic.

## Tasks

- [ ] Update `closeout-commit`, `closeout-phase`, `work-on-wave`, and `work-on-phase` skill prose, references, and metadata to call the CLI/shared-core boundary.
- [ ] Update `packages/cli/skill-registry.json` and registry tests only after the replacement operation and skill rewrite both exist.
- [ ] Classify removed helper scripts as managed old scripts, managed wrappers, modified local files, or custom scripts.
- [ ] Preserve no-default-skills behavior for bare installs.
- [ ] Keep explicit selected-skill installs functional for project and home scopes.

## Acceptance Criteria

- Selected first-party skills no longer require missing script assets.
- Selected-skill install/update/remove tests cover rewritten skill assets.
- Audit, backup, uninstall, and migration behavior treats removed or wrapper scripts as managed assets with reviewable plans.

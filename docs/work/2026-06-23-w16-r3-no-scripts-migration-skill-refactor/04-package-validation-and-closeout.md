# P4 Package Validation and Closeout

## Purpose

Prove the migrated operation and skill assets remain consistent across source templates, dogfood, package copies, and packed npm behavior.

## Tasks

- [ ] Apply source-first edits under `packages/docs/template/` when shipped system helpers or docs assets change.
- [ ] Refresh `packages/cli/template/` through the package copy/prepack path when template-owned assets change.
- [ ] Run selected-skill, registry, install, audit, backup, uninstall, and package validation commands appropriate to the changed files.
- [ ] Run smoke-pack validation when shipped package contents change.
- [ ] Update risk register entries R-008 and R-014 only with implementation evidence.
- [ ] Capture a closeout history record if the implementation wave changes behavior or user-facing workflow.

## Acceptance Criteria

- Package/template/dogfood parity is proven for every shipped file changed by the migration.
- Packed npm validation exercises the migrated assets.
- R-008 and R-014 remain open or are updated with concrete evidence from the completed implementation.

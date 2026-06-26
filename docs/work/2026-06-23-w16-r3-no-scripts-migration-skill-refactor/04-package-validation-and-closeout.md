# P4 Package Validation and Closeout

## Purpose

Prove the migrated operation and skill assets remain consistent across source templates, dogfood, package copies, and packed npm behavior.

## Tasks

- [x] t1: Apply source-first edits under `packages/docs/template/` when shipped system helpers or docs assets change.
- [x] t2: Refresh `packages/cli/template/` through the package copy/prepack path when template-owned assets change.
- [x] t3: Run selected-skill, registry, install, audit, backup, uninstall, and package validation commands appropriate to the changed files.
- [x] t4: Run smoke-pack validation when shipped package contents change.
- [x] t5: Update risk register entries R-008 and R-014 only with implementation evidence.
- [x] t6: Capture a closeout history record if the implementation wave changes behavior or user-facing workflow.

## Implementation Notes

- No `packages/docs/template/` source edits were required because W16 R3 changed CLI operations, selected-skill registry/prose, selected-skill install/audit behavior, package smoke assertions, PRD source anchors, and risk evidence rather than template-owned system helper or docs assets.
- `packages/cli/template/` refresh was exercised through `npm run smoke:pack`, whose `prepack` step copied `packages/docs/template/` into `packages/cli/template/`; no persistent template diff remained.
- Updated `scripts/smoke-pack.mjs` so packed selected-skill validation expects current migrated skill assets and asserts retired lifecycle helper scripts are absent from disk and manifest tracking.
- Updated R-008 and R-014 with W16 R3 implementation evidence while keeping both open for remaining helper scripts, purpose metadata, future MCP/Rust parity, plugin/shared-agentics surfaces, and broader delivery-model work.
- Added a final W16 R3 closeout history record for the behavior change.
- Manual UAT is not worthwhile for this wave because the user-observable surface is selected CLI/package behavior already exercised by focused tests and packed CLI smoke validation; a human would only repeat install/manifest checks covered by automation.

## Validation Evidence

- `npm test -w packages/cli -- --reporter=dot`
- `npm run validate:defaults -w packages/cli`
- `npm run build -w packages/cli`
- `npm run smoke:pack`
- `git diff --check`
- `python3 .make-docs/scripts/check_path_hygiene.py --repo-root .`
- `bash scripts/check-wave-numbering.sh`
- Changed-file Markdown link check

## Acceptance Criteria

- Package/template/dogfood parity is proven for every shipped file changed by the migration.
- Packed npm validation exercises the migrated assets.
- R-008 and R-014 remain open or are updated with concrete evidence from the completed implementation.

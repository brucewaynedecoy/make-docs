# P4 Validation and Closeout

## Goal

Close W17 R4 with package-level validation, manual UAT, PRD closeout, and a history record.

## Tasks

- [x] t1 Run `npm test -w packages/cli -- --run tests/backup.test.ts tests/uninstall.test.ts tests/audit.test.ts tests/lifecycle.test.ts tests/install.test.ts tests/skill-catalog.test.ts`.
- [x] t2 Run `npm run validate:defaults -w packages/cli`.
- [x] t3 Run `npm run build -w packages/cli`.
- [x] t4 Run `npm run smoke:pack`.
- [x] t5 Run `git diff --check` and changed-file Markdown link checks.
- [x] t6 Run `bash scripts/check-wave-numbering.sh`.
- [x] t7 Perform manual UAT covering selected-skill install, backup, uninstall/removal pruning, and legacy root `.backup/**` preservation.
- [x] t8 Reconcile PRD closeout notes and risk-register status after implementation.
- [x] t9 Create the W17 R4 closeout history record under `docs/assets/archive/history/**`.

## Acceptance Criteria

- Package tests, build, defaults validation, and smoke-pack pass or have explicit documented deferrals.
- Manual UAT proves `.make-docs/backup/**` creation, no root `.backup/**` creation, legacy root `.backup/**` preservation, and safe `.make-docs/agentics/**` pruning.
- The closeout history records exactly what shipped and what remains deferred.

## Validation Notes

Phase 4 validation confirmed:

- The aggregate package test set passed with 6 files and 108 tests.
- Defaults validation initially caught the expected risk-register consistency drift after PRD 03 gained `R-015`; `packages/cli/tests/consistency.test.ts` now includes the W17 R4 risk heading and `npm run validate:defaults -w packages/cli` passes.
- `npm run build -w packages/cli` passed.
- `npm run smoke:pack` passed and proved the packed CLI uses `.make-docs/backup/**` while preserving legacy root `.backup/**`.
- Isolated manual UAT passed using a temporary target, isolated `HOME`, isolated cache state, and the locally built CLI. The flow installed one selected skill, verified the shared payload plus native harness exposure, created legacy root `.backup/**` evidence, ran backup under `.make-docs/backup/**`, cleared selected skills and observed `.make-docs/agentics/**` pruning, reinstalled the skill, ran uninstall, and verified `.make-docs/backup/**` plus legacy root `.backup/**` were preserved.
- PRD 32 now records implementation closeout evidence. R-015 remains open only for downstream plugin lifecycle inheritance; the CLI/package portion is complete.

Coverage decisions:

- Developer guide coverage: none. The wave changed packaged lifecycle behavior and tests but did not introduce a separate maintainer procedure beyond existing backlog and PRD closeout evidence.
- User guide coverage: complete through Phase 2. The lifecycle user guide already explains the `.make-docs/backup/**` destination and legacy `.backup/**` preservation.
- PRD coverage: update-existing. [PRD 32](../../prd/32-revise-lifecycle-backup-state-agentics-pruning.md) records implementation closeout, and [PRD 03](../../prd/03-open-questions-and-risk-register.md) records the residual plugin-inheritance risk status.
- UAT coverage: complete. Manual UAT passed after the full W17 R4 wave was implemented.

Validation run:

- `npm test -w packages/cli -- --run tests/backup.test.ts tests/uninstall.test.ts tests/audit.test.ts tests/lifecycle.test.ts tests/install.test.ts tests/skill-catalog.test.ts --reporter=dot --silent`
- `npm run validate:defaults -w packages/cli`
- `npm run build -w packages/cli`
- `npm run smoke:pack`
- Manual UAT in an isolated temporary target with isolated `HOME` and cache state.
- `git diff --check`
- Focused Markdown link check for changed W17 R4 Phase 4, PRD, and history files.
- `bash scripts/check-wave-numbering.sh`

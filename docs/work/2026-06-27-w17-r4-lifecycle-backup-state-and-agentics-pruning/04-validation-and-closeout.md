# P4 Validation and Closeout

## Goal

Close W17 R4 with package-level validation, manual UAT, PRD closeout, and a history record.

## Tasks

- [ ] t1 Run `npm test -w packages/cli -- --run tests/backup.test.ts tests/uninstall.test.ts tests/audit.test.ts tests/lifecycle.test.ts tests/install.test.ts tests/skill-catalog.test.ts`.
- [ ] t2 Run `npm run validate:defaults -w packages/cli`.
- [ ] t3 Run `npm run build -w packages/cli`.
- [ ] t4 Run `npm run smoke:pack`.
- [ ] t5 Run `git diff --check` and changed-file Markdown link checks.
- [ ] t6 Run `bash scripts/check-wave-numbering.sh`.
- [ ] t7 Perform manual UAT covering selected-skill install, backup, uninstall/removal pruning, and legacy root `.backup/**` preservation.
- [ ] t8 Reconcile PRD closeout notes and risk-register status after implementation.
- [ ] t9 Create the W17 R4 closeout history record under `docs/assets/archive/history/**`.

## Acceptance Criteria

- Package tests, build, defaults validation, and smoke-pack pass or have explicit documented deferrals.
- Manual UAT proves `.make-docs/backup/**` creation, no root `.backup/**` creation, legacy root `.backup/**` preservation, and safe `.make-docs/agentics/**` pruning.
- The closeout history records exactly what shipped and what remains deferred.

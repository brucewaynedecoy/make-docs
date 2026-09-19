# P4 Validation and Closeout

## Goal

Prove the corrected backup root and selected-agentics pruning behavior from package code, packed smoke validation, and user-facing manual scenarios.

## Required Validation

- `npm test -w packages/cli -- --run tests/backup.test.ts tests/uninstall.test.ts tests/audit.test.ts tests/lifecycle.test.ts tests/install.test.ts tests/skill-catalog.test.ts`
- `npm run validate:defaults -w packages/cli`
- `npm run build -w packages/cli`
- `npm run smoke:pack`
- `git diff --check`
- `bash scripts/check-wave-numbering.sh`
- changed-file Markdown link checks for W17 R4 docs, touched PRDs, and touched downstream guardrails

## Manual UAT Shape

Manual UAT should cover an end-user lifecycle scenario rather than merely rerunning tests:

1. In a temp project, install Make Docs with one selected skill into project scope.
2. Confirm the selected skill exists once under `.make-docs/agentics/skills/<skill-name>/`.
3. Confirm harness skill roots expose the native skill directory through symlink or managed copy mirror.
4. Run `make-docs backup --yes` and confirm `.make-docs/backup/<date>` exists while root `.backup/` is not created.
5. Run selected-skill removal or uninstall with backup and confirm empty `.make-docs/agentics/**` directories are pruned only when no unmanaged content remains.
6. Repeat with a pre-existing root `.backup/legacy-test/` directory and confirm it remains untouched.

## Closeout

Create a W17 R4 history record under `docs/assets/archive/history/**` after implementation finishes. That history record should state whether the full package validation and manual UAT passed, or explain any deferred coverage.

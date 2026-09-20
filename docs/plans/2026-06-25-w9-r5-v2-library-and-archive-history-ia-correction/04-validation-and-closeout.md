# Validation and Closeout

## Purpose

Define the final proof that W9 R5 is integrated across authority docs, package behavior, dogfood migration, and closeout records.

## Required Validation

- Targeted path scans for old future-facing targets.
- `npm test -w packages/cli -- --reporter=dot`
- `npm run validate:defaults -w packages/cli`
- `npm run build -w packages/cli`
- `npm run smoke:pack`
- `git diff --check`
- `python3 .make-docs/scripts/check_path_hygiene.py --repo-root .`
- `bash scripts/check-wave-numbering.sh`
- `bash scripts/check-instruction-routers.sh`

## Closeout

Create the W9 R5 closeout record under `docs/assets/archive/history/**`. If any check reports unrelated baseline debt, record it explicitly rather than hiding it or reopening W9 R5 path decisions.

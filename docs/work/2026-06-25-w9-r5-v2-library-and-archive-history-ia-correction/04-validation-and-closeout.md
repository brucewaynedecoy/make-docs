# Phase 4: Validation and Closeout

## Purpose

Validate W9 R5 end to end and write the closeout history record under the corrected path.

## Overview

This phase refreshes manifest evidence, runs package/docs validation, performs targeted path scans, and records the W9 R5 outcome.

## Source PRD Docs

- [03 Open Questions and Risk Register](../../prd/03-open-questions-and-risk-register.md)
- [10 Packaging Validation and Release Reference](../../prd/10-packaging-validation-and-release-reference.md)
- [22 Revise New Docs Assets Playbooks Persona Model](../../prd/22-revise-new-docs-assets-playbooks-persona-model.md)

## Stage 1 - Validation

### Tasks

- [x] t1: Refresh `.make-docs/manifest.json` after managed asset moves.
- [x] t2: Run targeted scans for old future-facing path targets.
- [x] t3: Run CLI tests, default validation, build, smoke-pack, path hygiene, wave numbering, router checks, and `git diff --check`.

### Acceptance criteria

- Fresh install behavior and package validation prove W9 R5 paths.
- Any unrelated baseline failure is recorded separately from W9 R5 completion.

### Dependencies

- Phases 1 through 3 complete.

### Evidence

| Check | Result |
| --- | --- |
| Old directory existence scan | Passed: no `docs/assets/guides`, `docs/assets/breadcrumbs`, `docs/assets/history`, `docs/guides`, or `docs/library` directories remain in root dogfood, package template, or generated CLI template paths. |
| Active package/template old-path scan | Passed: remaining old-path mentions are negative assertions, supersession text, or historical-evidence references rather than shipped-current targets. |
| Manifest old-path scan | Passed: `.make-docs/manifest.json` has no managed entries for old W9 R5 paths. |
| Changed-file Markdown link check | Passed: 142 touched Markdown files checked, with fenced examples and archived historical records excluded. |
| CLI test suite | Passed: `npm test -w packages/cli -- --reporter=dot` reported 17 files and 280 tests passing. |
| Default validation | Passed: `npm run validate:defaults -w packages/cli` reported 24 tests passing. |
| CLI build | Passed: `npm run build -w packages/cli`. |
| Package smoke | Passed: `npm run smoke:pack`, including prepack copy/build and fresh-install package behavior. |
| Path hygiene | Passed: `python3 .make-docs/scripts/check_path_hygiene.py --repo-root .` reported `checked_files=82 changed_files=0 errors=0 allowed=0`. |
| Wave numbering | Passed: `bash scripts/check-wave-numbering.sh`. |
| Diff whitespace | Passed: `git diff --check`. |
| Instruction routers | Known baseline only: `bash scripts/check-instruction-routers.sh` still reports root `./AGENTS.md` and `./CLAUDE.md` differ and `./CLAUDE.md` exceeds the 12-line budget. No W9 R5 nested router drift was reported. |

## Stage 2 - Closeout

### Tasks

- [x] t4: Create W9 R5 closeout history under `docs/assets/archive/history/**`.
- [x] t5: Record final validation status and any manual/UAT decision.

### Acceptance criteria

- Closeout record uses the W9 R5 history path.
- Final status identifies pass/fail for every required check.

### Dependencies

- Stage 1 complete.

### Evidence

- Closeout history record: `docs/assets/archive/history/2026-06-25-w9-r5-v2-library-and-archive-history-ia-correction.md`.
- Manual/UAT decision: no separate manual UAT pass was run for W9 R5. The user-observable surface is fresh install/package layout and closeout-path behavior, which is covered by package smoke, install tests, path scans, and changed-file Markdown checks.

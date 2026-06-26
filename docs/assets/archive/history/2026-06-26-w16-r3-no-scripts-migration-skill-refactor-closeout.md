---
date: 2026-06-26
coordinate: W16 R3
closeout: wave
---

# W16 R3 No-Scripts Migration Skill Refactor Closeout

## Purpose

Record completion of the W16 R3 no-scripts migration wave for lifecycle-critical selected skills.

## Changes

- Added packaged `make-docs operations` commands for closeout, wave/phase state, checkpoint, scope guard, and phase gate behavior.
- Rewrote `closeout-commit`, `closeout-phase`, `work-on-wave`, and `work-on-phase` selected-skill guidance to call the packaged operation boundary.
- Removed replaced lifecycle helper scripts from selected-skill registry assets while keeping unrelated guide coverage helpers installed.
- Added retired managed skill asset handling so unchanged old lifecycle helper scripts can be removed and modified local copies are preserved for review.
- Updated packed smoke validation to assert migrated selected-skill assets are present and retired lifecycle helper scripts are absent from disk and manifest tracking.
- Updated PRD 26 source anchors and risk register entries R-008 and R-014 with implementation evidence while keeping the broader no-scripts risk items open.

## Gap Decisions

No new PRD was needed. W16 R3 implements the first lifecycle-critical no-scripts migration slice under PRD 26, but Q-001, Q-007, Q-012, R-008, and R-014 remain open for remote skill delivery, alternate manifests, shared plugin/skill redirection, remaining helper scripts, future MCP/Rust parity, and broader agentics delivery work.

## Guide Decisions

No separate developer or user guide update was needed. The changed user-facing guidance is the selected skill content itself, and manual UAT is not worthwhile because focused tests plus packed CLI smoke validation cover the observable install, manifest, and skill-asset behavior.

## Validation

- `npm test -w packages/cli -- --run tests/operations.test.ts`
- `npm test -w packages/cli -- --run tests/cli.test.ts tests/operations.test.ts`
- `npm test -w packages/cli -- --run tests/install.test.ts tests/audit.test.ts tests/skill-registry.test.ts tests/skill-catalog.test.ts tests/operations.test.ts`
- `npm test -w packages/cli -- --run tests/backup.test.ts tests/uninstall.test.ts`
- `npm test -w packages/cli -- --reporter=dot`
- `npm run validate:defaults -w packages/cli`
- `npm run build -w packages/cli`
- `npm run smoke:pack`
- `git diff --check`
- `python3 .make-docs/scripts/check_path_hygiene.py --repo-root .`
- `bash scripts/check-wave-numbering.sh`
- Changed-file Markdown link check
- `bash scripts/check-instruction-routers.sh` still reports the known root-router baseline: `./AGENTS.md` and `./CLAUDE.md` differ, and `./CLAUDE.md` exceeds the 12-line budget.

## Links

- [PRD 26](../../../prd/26-revise-no-scripts-migration-skill-refactor.md)
- [Risk Register](../../../prd/03-open-questions-and-risk-register.md)
- [W16 R3 Work](../../../work/2026-06-23-w16-r3-no-scripts-migration-skill-refactor/00-index.md)

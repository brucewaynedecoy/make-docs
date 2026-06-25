# Validation and Closeout

## Purpose

Prove template, dogfood, and package copy alignment before closing implementation.

## Source PRD Docs

- `docs/prd/19-revise-template-package-dogfood-source-of-truth-contract.md`
- `docs/prd/10-packaging-validation-and-release-reference.md`
- `docs/prd/03-open-questions-and-risk-register.md`

## Stage 1 - Validation

### Tasks

- [x] t1: Run `npm test -w packages/cli`.
- [x] t2: Run `npm run validate:defaults -w packages/cli`.
- [x] t3: Run `npm run smoke:pack`.
- [x] t4: Run package dry-run checks when package contents change.
- [x] t5: Run targeted dogfood/template parity and instruction-router checks.
- [x] t6: Update the risk register and history only with evidence from completed implementation work.

### Acceptance Criteria

- Local development template and packed template paths are both proven.
- Dogfood freshness checks cover files expected to match exactly.
- Package validation remains dry-run unless separately authorized.
- Package/source-of-truth validation proves migration-relevant behavior comes from packaged CLI/shared-core code, or records deterministic Markdown link rewriting and destination-tree validation as a blocking dependency.
- W10 R4 validation remains scoped to package/template/dogfood source-of-truth proof and does not require full V1-to-V2 Markdown-tree migration validation unless W10 R4 implementation directly adds that behavior.
- Closeout records any residual D-006, D-007, D-014, Q-005, R-003, R-004, or R-007 risk.

### Dependencies

- Phase 3 reseed and package-copy changes.

## Implementation Notes

| Task | Evidence |
| --- | --- |
| t1 | `npm test -w packages/cli` passed all 17 test files and 280 tests. This proves the local development path, compatibility classification, planner/apply behavior, lifecycle commands, skills, backup, uninstall, and current CLI flows still agree with the template/package contract. |
| t2 | `npm run validate:defaults -w packages/cli` passed all 24 consistency tests. This keeps default assets, generated routers, and static asset selection aligned with the checked-in template source. |
| t3 | `npm run smoke:pack` passed. The run executed package `prepack`, copied `packages/docs/template/` into `packages/cli/template/`, built `dist/`, packed the CLI, installed from the tarball, verified clean sync, exercised explicit skills, backup, and uninstall, and left the working tree clean. |
| t4 | `npm pack --dry-run --json --ignore-scripts -w packages/cli` passed after the package README change. The dry-run tarball contains package metadata, `LICENSE`, `README.md`, `dist/`, `template/`, `skill-registry.json`, and `skill-registry.schema.json`; repo-root `docs/`, root routers, source packages, scripts, and scratch material are not tarball-root package contents. |
| t5 | Targeted dogfood/template parity checked 79 expected files. Seventy-five matched exactly. The only expected exceptions are `docs/plans/{AGENTS,CLAUDE}.md` and `docs/work/{AGENTS,CLAUDE}.md`, which intentionally carry dogfood-only W9 R5 supersession notes and match their same-directory siblings. `bash scripts/check-wave-numbering.sh` passed. `bash scripts/check-instruction-routers.sh` still reports the known root-router baseline: root `AGENTS.md` and `CLAUDE.md` differ, and root `CLAUDE.md` exceeds the current 12-line budget. |
| t6 | No PRD or risk-register edit was warranted. W10 R4 implemented existing PRD 19 requirements and recorded residual risk in this work file and the W10 R4 closeout history. D-006, D-014, and R-003 are already closed; D-007, Q-005, R-004, and R-007 remain open because W10 R4 adds focused proof and documentation but does not implement full automated parity coverage, path centralization, or V1-to-V2 Markdown-tree migration link rewriting. |

## Manual Test Coverage

No separate manual UAT scenario was added for W10 R4. The user-observable behavior is package/docs source-of-truth and package contents, and `npm run smoke:pack` is the repo's built-in user-runnable scenario with human-readable output for the packaged installer path. A bespoke manual script would only rerun the same package proof less reliably.

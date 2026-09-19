# P1 Requirements and Register Reconciliation

## Tasks

- [x] t1: Confirm PRD 27 is linked from the PRD index, PRD 08, PRD 12, and affected baseline docs.
- [x] t2: Confirm D-005 and Q-001 still keep the broader delivery-model decision open.
- [x] t3: Confirm Q-007 is narrowed for alternate manifests and remote skill payload integrity without pretending the whole remote-source policy is complete.
- [x] t4: Confirm Q-012 and Q-013 remain open for shared install and plugin exposure boundaries.
- [x] t5: Confirm R-001, R-002, R-006, R-008, and R-014 mention the new manifest/provenance implications where relevant.

## Acceptance Criteria

- PRD 27 is the active owner for purpose ids, alternate manifests, source policy, and selection provenance.
- No affected PRD reintroduces required/default first-party skills.
- No risk entry is closed without implementation evidence.

## Validation Notes

Use touched Markdown link checks and unfinished-token scans after reconciliation.

## Implementation Notes

Phase 1 confirmed the active PRD and risk-register surface already carries the W17 R1 authority needed before implementation:

- PRD 27 is listed in the PRD index and linked from PRD 08, PRD 12, and the affected baseline docs that own CLI behavior, package validation, package boundaries, compatibility/audit behavior, configuration labels, CLI/MCP parity, and no-scripts migration.
- D-005 and Q-001 still leave the broader bundled-local versus remote-fetch skills delivery model open.
- Q-007 narrows alternate manifest and remote skill payload policy around immutable refs and integrity metadata while keeping broader remote skill and plugin source policy open.
- Q-012 and Q-013 still leave shared install/config mapping and plugin exposure boundaries open for W17 R2/W18 work.
- R-001, R-002, R-006, R-008, and R-014 mention alternate-manifest, selection-provenance, purpose-metadata, or CLI/shared-core implications where relevant without closing risks before implementation evidence exists.

## Coverage Decisions

- PRD coverage: `none`. No new PRD changes were needed because PRD 27, its affected baseline backlinks, and the risk-register entries already express the accepted W17 R1 requirements.
- Developer-guide coverage: `none`. This phase reconciles requirement authority and does not introduce durable maintainer behavior beyond the PRD/work backlog.
- User-guide coverage: `none`. This phase has no user-observable workflow.
- Manual/UAT: deferred until W17 R1 wave closeout per the requested workflow.

## Validation Evidence

- `node packages/cli/dist/index.js operations wave-status docs/work/2026-06-23-w17-r1-skill-purpose-registry-alternate-skills-manifest --json`
- PRD/risk search across PRD 00, 07, 08, 10, 12, 16, 18, 24, 25, 26, 27, and the risk register.
- Refreshed the local jdocmunch docs index.
- Changed-file Markdown link check.
- Unfinished-token scan for touched files.
- `git diff --check`

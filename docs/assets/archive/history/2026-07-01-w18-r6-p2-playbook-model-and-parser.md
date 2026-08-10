---
title: "W18 R6 P2 Playbook Model and Parser"
kind: "history"
status: "completed"
date: "2026-07-01"
client: "Claude Code"
model: "Fable 5"
coordinate: "W18 R6 P2"
repo: "make-docs"
branch: "make-docs-v2"
summary: "Built the pure Playbook model and staged parser library with its test suite, then ran the closeout coverage passes."
---

# W18 R6 P2 Playbook Model and Parser

## Changes

Implemented W18 R6 Phase 2 by building the pure Playbook model and staged parser library at `packages/cli/src/playbook/` per R-MODEL-1 through R-MODEL-3 of [historical closeout](2026-07-01-w18-r6-p1-playbook-contract-authoring.md) (retired action-PRD: `docs/prd/34-revise-playbook-contract-and-model.md`). The library is twelve modules behind an `index.ts` barrel — `source-span.ts`, `diagnostics.ts`, `model.ts`, and `detection.ts` at the top level, plus a `parser/` directory with `markdown-scan.ts`, `yaml-nodes.ts`, `frontmatter.ts`, `headings.ts`, `dependency-table.ts`, `workflow-block.ts`, `resolve.ts`, and the `parse-playbook.ts` orchestrator — with `parsePlaybook` as the single entry point. The model carries the full R-MODEL-2 content: identity including the source digest, the typed dependency registry, fully resolved steps whose dependency references are direct registry-record links rather than bare strings, a narrative-section presence map, and source spans on every parsed element; the eight-value step status vocabulary is encoded once as `PLAYBOOK_STEP_STATUSES` (R-WF-6) and the `runnable` flag is derived from diagnostics via `derivePlaybookRunnable` (R-MODEL-3). The parser runs seven fixed stages that fail soft for diagnostics and fail closed for execution, detects both the `<slug>.playbook.md` form and the deprecated `kind: playbook` plain-file form (emitting PB-FILE-007), enforces the unknown-section placement rules (R-DOC-7) and the single-`playbook`-fence rule (R-WF-1), and extracts no deterministic meaning from narrative free text (R-DOC-6). The diagnostic catalog is designed for Phase 3 extension: the parser owns PB-DOC-001, PB-FM-002, PB-DEP-003, PB-WF-006, and PB-FILE-007 plus structural codes PB-FM-008, PB-DEP-009, PB-WF-010, and PB-WF-011, while validator-owned codes (PB-DEP-004, PB-WF-005, and enum/semantic checks) are deliberately deferred to Phase 3 with raw tokens preserved via `SpannedEnum` so the validator can diagnose them without re-parsing; the persona-versus-folder mismatch is likewise recorded in the model but diagnosed in Phase 3, and the Phase 4 `playbook.validate`/`playbook.catalog` operations should wrap `parsePlaybook`. The test suite at `packages/cli/tests/playbook-parser.test.ts` holds 31 tests, including a worked-example test that extracts the Worked Example fence from [the dogfooded Playbook contract](../../../../.make-docs/contracts/system/playbook-contract.md) itself and asserts zero diagnostics and a runnable model, giving R-WF-7 an executable contract/parser parity check. All nine tasks in [the Phase 2 backlog file](../../../work/2026-07-01-w18-r6-playbook-contract-and-model/02-playbook-model-and-parser.md) are checked off.

Developer-guide coverage was `update-existing`, limited to the Future Coverage bullet in [the Run Playbook runner architecture guide](../../library/developer/playbooks-development-runner-architecture.md): the guide's Catalog Contract Validation section still accurately describes what the code enforces, because nothing wires the new library into the catalog or a validate operation until Phases 3 and 4, so the P1 refresh stays gated rather than being executed half-way; the bullet's blocker was narrowed from "Phases 2 and 3" to Phase 3 and now records that the model/parser seam landed at `packages/cli/src/playbook/` with `parsePlaybook` as the entry point. Dedicated guide coverage of the library seam (module layout, diagnostic extension pattern) was `none` for now because Phase 3 completes the diagnostic catalog and validator layering that define the extension story — writing it now would document a half-landed seam and immediately need rework, and the updated Future Coverage bullet already routes that work. User-guide coverage was `none` for new content because the library has zero user-visible surface until `playbook.validate` and `playbook.catalog` land in Phase 4; the existing Future Coverage bullet in [the user running-playbooks guide](../../library/user/playbooks-running-make-docs-workflows.md) already gates the refresh on that trigger and received only an accuracy touch-up narrowing its blocker to Phases 3 through 5. PRD coverage was `risk-register-update` because the phase implemented existing PRD 34 requirements without changing the active requirement surface (no change doc, no index change); the R-018 Decision cell in [the open questions and risk register](../../../prd/03-open-questions-and-risk-register.md) now records that Phase 2 encoded the contract schema once in the model/parser and landed the worked-example parity test against the dogfooded contract copy, while the layered validator, per-code failing fixtures, and automated parity checks covering the upstream template copy remain open through Phases 3 and 5; the item number, heading, Open status, and Follow-Up were preserved with a Decision-cell-only edit. Manual-test/UAT coverage remains `none` (deferred) until W18 R6 wave completion per user instruction; the natural UAT is a `playbook.validate` run over the default Playbook once Phase 4 lands it.

Validation: the full CLI suite passes 29 files / 469 tests with `tsc` clean in the new library, the worked-example test parses the shipped contract's own example with zero diagnostics, `git diff --check` is clean, `check_path_hygiene.py` reports zero errors on the docs touched by this closeout, and all relative links in the touched docs resolve. No template pairs changed in this phase, so no upstream/dogfood reseeding was required.

## Documentation

### Project

| Path | Description |
| --- | --- |
| [../../../work/2026-07-01-w18-r6-playbook-contract-and-model/02-playbook-model-and-parser.md](../../../work/2026-07-01-w18-r6-playbook-contract-and-model/02-playbook-model-and-parser.md) | Marked Phase 2 tasks t1 through t9 complete. |
| [../../../prd/03-open-questions-and-risk-register.md](../../../prd/03-open-questions-and-risk-register.md) | Updated the R-018 Decision cell to record the Phase 2 model/parser landing and the worked-example parity test while keeping the item Open for validator, fixture, and parity work. |

### Developer

| Path | Description |
| --- | --- |
| [../../library/developer/playbooks-development-runner-architecture.md](../../library/developer/playbooks-development-runner-architecture.md) | Narrowed the parser/validator Future Coverage bullet's blocker to W18 R6 Phase 3 and recorded the landed `packages/cli/src/playbook/` seam with `parsePlaybook` as the single entry point. |

### User

| Path | Description |
| --- | --- |
| [../../library/user/playbooks-running-make-docs-workflows.md](../../library/user/playbooks-running-make-docs-workflows.md) | Narrowed the Future Coverage bullet's blocker to W18 R6 Phases 3 through 5, noting the Phase 2 library landed without user-visible surface. |

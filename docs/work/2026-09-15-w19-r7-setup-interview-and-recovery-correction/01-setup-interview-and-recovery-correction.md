---
title: "Phase 1: Setup Interview and Recovery Correction"
kind: "work"
status: "superseded"
coordinate: "W19 R7 P1"
source:
  type: "prd"
  path: "docs/prd/39-cli-command-model-and-operation-registry.md"
---

# Phase 1: Setup Interview and Recovery Correction

> Superseded on 2026-09-16 by [W19 R8 P1 Store Access Bootstrap and Remediation](../2026-09-16-w19-r8-store-access-bootstrap-and-remediation/01-store-access-bootstrap-and-remediation.md). Do not implement this phase separately.

## Purpose

Fix the installed setup interaction and recovery failures as one tested release correction. Keep the affected real project read-only until the packaged candidate passes and the owner gives separate approval for real-project action.

## Overview

Stage 1 removes the second Skills interview and moves pending-operation admission before all editable setup questions. Stage 2 adds compatible failure detail and derives recovery actions from saved proof. Stage 3 proves one extracted package against legacy and recovery fixtures and completes the owner review.

The [phase plan](../../plans/2026-09-15-w19-r7-setup-interview-and-recovery-correction/01-setup-interview-and-recovery-correction.md) defines V1-V8. The [design](../../designs/2026-09-15-setup-interview-and-recovery-correction.md) defines HX-1 through HX-6. Do not close the phase on source tests alone.

## Human Experience Outcome

- Impact and governing promise or preserved boundary: Direct impact. Apply HX-1 through HX-6 from the [design](../../designs/2026-09-15-setup-interview-and-recovery-correction.md).
- Intended human outcome: A person sees one familiar Skills interview, learns about pending recovery before new questions, and gets one recovery action that works for the saved state.
- Human-facing surface or indirect effect: `setup`, `setup reconfigure`, `setup skills`, `project state status`, `project state recover`, JSON output, and MCP output.
- Implementation work: One interaction model, early setup admission, plan-aware recovery, durable safe failure detail, installed-package fixtures, and review evidence.
- Evidence source or testing type selected under current authority: Automated Implementation Testing, Guided Progress Review, packaged CLI evidence, and Human Experience Review.
- Executor: Implementers run automated and package checks. The owner runs the guided terminal review. The agent prepares the Human Experience Review.
- Accepted obligation or deferral route: None. A required failure keeps this phase open.

Authority: [Human Experience Contract](../../../.make-docs/system/contracts/human-experience-contract.md), [PRD 07](../../prd/07-cli-command-surface-and-lifecycle.md), [PRD 08](../../prd/08-skills-catalog-and-distribution.md), [PRD 10](../../prd/10-packaging-validation-and-release-reference.md), [PRD 18](../../prd/18-compatibility-classification-and-migration-safety.md), [PRD 38](../../prd/38-global-store-and-project-state.md), and [PRD 39](../../prd/39-cli-command-model-and-operation-registry.md).

## Current Testing Decisions

| Testing type | Current decision | Decision record or `not-needed-now` reason |
| --- | --- | --- |
| Automated Implementation Testing | Required; blocking for phase close | Decision informed: whether shared interaction, early admission, Store migration, action selection, and preservation meet current PRDs. Scope: focused unit/integration tests, full CLI suite, defaults, PRD authority, links, paths, diff, and package smoke. Executor: implementation and validation owners. Gate effect: blocking-current-work. Effort budget: V1-V7 once, with focused reruns after relevant changes. Stop condition: all required cases pass or one bounded defect is identified. Evidence retained: central report and linked test results. Rerun trigger: relevant code, fixture, package, or authority change. |
| Performance Testing | `not-needed-now` | No speed, load, memory, or latency decision is open. Lock and retry behavior is functional safety proof. |
| Guided Progress Review | Required; advisory until owner response | Decision informed: whether the exact packaged terminal flow is understandable and the recovery action is useful. Product maturity: release candidate. Scope: full setup Skills screen, focused Skills screen, early pending stop, status, rollback dry-run, and result. Executor: owner with agent guidance. Gate effect: owner acceptance is required for phase close, but the review does not replace automated safety proof. Effort budget: one candidate review, then one bounded rerun after a material fix. Stop condition: owner response recorded or a clear defect is filed. Evidence retained: central report. Rerun trigger: changed public flow or owner correction. |
| Unassisted Goal Testing | `not-needed-now` | The current owner knows the defect, source diagnosis, and expected route, so this review cannot meet executor isolation. Automated proof and a knowledgeable owner review can answer the current correction decision. Reassess only if a material discoverability unknown remains and a qualified separate executor is available. |

Human Experience Review is separate. It uses V1-V8 to prepare a conclusion for HX-1 through HX-6. It records the owner's response and reviewer limits. It does not become a fifth testing type.

## Source PRD Docs

- [03 Open Questions and Risk Register](../../prd/03-open-questions-and-risk-register.md): D-034 and D-035 close rules.
- [07 CLI Command Surface and Lifecycle](../../prd/07-cli-command-surface-and-lifecycle.md): one interaction and early setup admission.
- [08 Skills Catalog and Distribution](../../prd/08-skills-catalog-and-distribution.md): selected-Skill interaction parity.
- [10 Packaging, Validation, and Release Reference](../../prd/10-packaging-validation-and-release-reference.md): one installed legacy-project candidate matrix.
- [18 Compatibility Classification and Migration Safety](../../prd/18-compatibility-classification-and-migration-safety.md): plan-aware resume, rollback, and content preservation.
- [38 Global Store and Project State](../../prd/38-global-store-and-project-state.md): operation fields, checkout state, and scoped recovery.
- [39 CLI Command Model and Operation Registry](../../prd/39-cli-command-model-and-operation-registry.md): setup, status, recovery, JSON, and MCP grammar.
- [49 Human Experience Standard](../../prd/49-human-experience-standard-and-intent.md) and [50 Proportionate Testing](../../prd/50-proportionate-testing-and-human-centered-validation.md): review and test selection.

## Source Obligations, Scenarios, And Findings

- Findings: [D-034](../../prd/03-open-questions-and-risk-register.md#d-034-full-setup-and-setup-skills-use-different-skills-interviews) and [D-035](../../prd/03-open-questions-and-risk-register.md#d-035-setup-can-recommend-a-recovery-action-that-the-recovery-command-rejects).
- Accepted obligations: none.
- Activated Unassisted Goal Test scenarios: none. Current decision is `not-needed-now` for the reason above.
- Other retained finding: [D-033](../../prd/03-open-questions-and-risk-register.md#d-033-w19-r6-setup-uses-retired-dynamic-conformance-authority) remains owned by W19 R6. Do not close it through this narrower correction unless its own close rules also pass.

## Stage 1 - Shared Interview and Early Setup Admission

### Tasks

- [ ] t1: Add one source-owned Skills interaction state and renderer. Include list order, active row, detail, selected summary, instructions, keys, empty state, cancellation, and saved result.
- [ ] t2: Make full setup and `setup skills` call the shared interaction with the same effective manifest, saved selection, scope, harness support, and trust data.
- [ ] t3: Remove the full-setup path that collects a valid Skill change and rejects it only after the interview. Keep the focused final plan limited to Skill changes.
- [ ] t4: Move target-checkout pending-operation admission before the first editable question in `setup`, `setup reconfigure`, and `setup skills`. Reuse read-only status state and write nothing on this stop.
- [ ] t5: Add exact source-level and integration tests for V1 and V2. Cover fresh, existing, empty, all-selected, partial, cancel, changed-selection, and pending states.

### Acceptance criteria

- A1: The same state produces the same Skills frames, labels, details, selected summary, instructions, and navigation keys in full setup and `setup skills`.
- A2: Both entry points return the same selection and cancellation result from the same keys.
- A3: Full setup can carry a valid reviewed Skill change into its plan without a post-interview rejection.
- A4: Each setup entry stops before the first editable question for pending work and produces no project, Store, backup, or native configuration write.

### Dependencies

- Current PRDs and the existing effective Skills manifest and selection services.
- No Store schema change is needed before the read-only admission check.

### Closeout Notes

- Four testing decisions: Automated Implementation Testing required; Performance Testing `not-needed-now`; Guided Progress Review waits for Stage 3; Unassisted Goal Testing `not-needed-now`.
- Human Experience Review: HX-1 and HX-2 evidence is prepared here. Owner approval waits for Stage 3.
- Evidence report: Create or update the central report only when evidence exists.
- Phase / capability status: P1 remains active. No partial release claim.

## Stage 2 - Plan-Aware Recovery and Failure Detail

### Tasks

- [ ] t6: Add a compatible Store schema migration for stable failure code, safe summary, failed stage, and last safe next action. Preserve old rows and privacy limits.
- [ ] t7: Create one action-selection function for setup admission, status, recovery, CLI JSON, and MCP. Derive its result from plan completeness, steps, ledgers, checkout binding, lock state, and live file evidence.
- [ ] t8: Implement no-effect rollback for an incomplete zero-step operation with equal ledgers and no active lock. Change only that operation to `rolled-back` with a final time in one Store transaction.
- [ ] t9: Preserve verified resume and rollback for complete partial plans. Keep changed, unknown, conflicting, and active-writer evidence blocked and intact.
- [ ] t10: Record safe failure detail before operation context release when the Store remains writable. Preserve the first fault and recovery evidence when failure recording also fails.
- [ ] t11: Add V3-V5 tests across human, JSON, MCP, restart, unrelated operation, and byte-preservation cases.

### Acceptance criteria

- A5: An incomplete plan never offers or attempts resume in setup, status, recovery, JSON, or MCP.
- A6: A proved zero-effect rollback changes no project file or installation ledger. It changes only the owning operation status and final time and keeps the row.
- A7: A complete partial plan offers only verified actions. Later user changes block mutation and remain intact.
- A8: A failed operation keeps its stable code, safe summary, stage, and next action after process restart. Older rows with no detail report unknown without inventing a cause.

### Dependencies

- Stage 1 early admission uses the final action-selection result when Stage 2 lands.
- The schema migration must pass before failure-detail and restart tests.

### Closeout Notes

- Four testing decisions: Automated Implementation Testing required; Performance Testing `not-needed-now`; Guided Progress Review waits for Stage 3; Unassisted Goal Testing `not-needed-now`.
- Human Experience Review: HX-3 through HX-5 evidence is prepared here. Owner approval waits for Stage 3.
- Evidence report: Retain the recovery matrix and privacy limits in the central report.
- Phase / capability status: P1 remains active. No real-project recovery is authorized.

## Stage 3 - Packaged Candidate and Acceptance

### Tasks

- [ ] t12: Run focused tests, the full CLI suite, default validation, PRD authority validation, link checks, path checks, and `git diff --check`. Separate any old baseline failure from new failures.
- [ ] t13: Build one tarball after Stage 1 and Stage 2 pass. Record its identity and digest. Install it in isolated homes with isolated Store roots and the repository unavailable.
- [ ] t14: Run V1-V7 through that exact packed executable. Include the pre-v2 Skills-disabled fixture, old managed blocks, zero-step incomplete operation, complete partial operation, verified backup and rollback, repeat setup, and interaction parity.
- [ ] t15: Create the central `evidence.md`. Record per-case findings, package identity, environment, before and after inventories, reviewer, limits, and links. Confirm the affected real project and Store stayed unchanged.
- [ ] t16: Present HX-1 through HX-6 in a Human Experience Review and run the owner Guided Progress Review. Record the owner response, apply corrections, update D-034 and D-035 only when their close rules pass, complete the coverage pass, and prepare the phase closeout for separate commit approval.

### Acceptance criteria

- A9: One extracted package shows the same full and focused Skills interaction and applies the same valid selection result.
- A10: The pre-v2 fixture receives a verified backup before destructive writes. Apply, repeat, and rollback preserve user-owned content and produce matching Store evidence.
- A11: Both recovery fixtures give executable advice. The incomplete zero-step case closes through no-effect rollback. The complete partial case preserves safe resume and rollback.
- A12: The central evidence report proves V1-V8, identifies the tested package and limits, records the owner response, and confirms no write to the affected real project or its Store.

### Dependencies

- Stages 1 and 2 are complete.
- Package proof uses one tarball after all source checks pass.
- Owner review uses the same tested candidate.
- Real-project action remains outside this phase until separately approved.

### Closeout Notes

- Four testing decisions: Record the final Automated Implementation Testing, Performance Testing, Guided Progress Review, and Unassisted Goal Testing results without changing their meanings.
- Human Experience Review: Record the proposal, evidence, observation, conclusion, owner response, approved result, reviewer, limits, and next action for HX-1 through HX-6.
- Evidence report: Link the relevant `evidence.md` sections for A1-A12.
- Phase / capability status: Close P1 only when all required cases pass and the owner accepts the result. Package acceptance alone is not implementation or commit authority.

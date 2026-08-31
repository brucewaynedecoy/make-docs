---
title: "Phase 6: Global Store Evolution"
kind: "work"
status: "completed"
coordinate: "W19 R1 P6"
source:
  type: "prd"
  path: "docs/prd/38-global-store-and-project-state.md"
---

# Phase 6: Global Store Evolution

## Purpose

Add transactional general lifecycle-run state and bounded evidence references while keeping legacy `playbook_runs` data opaque and unchanged in the checkpoint-9 migration and current lifecycle operations. Keep repository documents authoritative.

## Overview

This phase implements migration checkpoint 9. The Store receives `runs` and `run_evidence`, optimistic transitions, bounded busy handling, typed receipts, and a nonblocking unavailable outcome. It never stores document bodies, UAT scenario authority, arbitrary evidence payloads, secrets, or inferred legacy Playbook meaning.

## Source PRD Docs

- [PRD 25 — TypeScript Runtime, CLI, and MCP Operation Boundaries](../../prd/25-typescript-runtime-cli-mcp-operation-boundaries.md)
- [PRD 38 — Global Store and Project State](../../prd/38-global-store-and-project-state.md)
- [PRD 39 — CLI Command Model and Operation Registry](../../prd/39-cli-command-model-and-operation-registry.md)
- [PRD 44 — Conformance Lab Sessions and Evidence](../../prd/44-conformance-lab-sessions-and-evidence.md)
- [PRD 46 — Naive End-User Acceptance Testing](../../prd/46-naive-end-user-acceptance-testing.md)
- [PRD 03 — Open Questions and Risk Register](../../prd/03-open-questions-and-risk-register.md)

## Source Obligations, Scenarios, And Findings

- O-001 remains separate W18 R3 work; O-002 remains superseded.
- Q-019 enters only if Persona storage is proposed. This phase does not make the Store the authority for Persona configuration.
- No `NUAT-###` identity or scenario body is created or stored. Repository scenario and finding records remain authoritative.
- Task completion cannot close closed-R-023 regression status, findings, obligations, waivers, or capability status.

## Stage 1 - Phase-Entry PRD Question And Risk Gate

### Tasks

- [x] t1: Verify the exact worktree, branch, HEAD, free disk, dirty-state allowlist, accepted P5 closeout, active lock/quiescence, and implementation authorization; stop on unexpected user work or unsafe growth.
- [x] t2: Reread every Source PRD and PRD 03 from the live worktree and record each revision or content digest.
- [x] t3: Reevaluate at minimum Q-018, closed R-023 as a regression check, and the receipt-field generalization question; include Q-019 only if Persona storage is proposed and add newly relevant live items.
- [x] t4: Record each relevant item's ID or bounded gap label, digest, impact, classification (`blocking`, `impacted-nonblocking`, `unrelated`, `closed-regression-check`, or `new-authority-gap`), disposition, and rationale.
- [x] t5: Record an explicit no-blocker determination and finite migration/busy/failure/correction/review budget before unlocking t8 when no blocker or gap remains.
- [x] t6: Stop before implementation for any blocker or authority gap and present an owner decision package with source anchors, affected phase and PRDs, bounded options and trade-offs, recommendation, consequences, exact PRD/register/history edits, focused validation, and a decision-only commit boundary; create no standalone decision file.
- [x] t7: Require canonical authority updates, focused validation, a separate decision commit, and its recorded SHA before unlock; never infer closure from a schema migration or task.
- [x] t8: Record the Stage 1 result, authority digests, P5 checkpoint evidence, receipt-field disposition, and implementation unlock or stop result.

### Acceptance criteria

- Store authority, receipt generalization, and closed R-023 regression have explicit current dispositions.
- Q-019 remains out of scope unless Persona storage is actually proposed.
- The P6 proof budget has exact fixture, platform, failure, correction, rerun, and review limits.
- Checkpoint 9 remains locked until the accepted authority is committed and implementation receives separate authorization.

### Dependencies

- Accepted P5 lock, quiescence, backup, rollback, and migration coordinator.
- Current PRD authority and separate P6 implementation authorization.

### Closeout Notes

- Testing-mode decision(s): transactional Store proof; no naive-UAT execution or scenario authority is introduced.
- Receipt decision: P6 uses a dedicated `LifecycleStoreMutationReceipt` with `schemaVersion: 1`, `receiptId`, `operation`, `projectId`, `runId`, `storeSchemaVersion`, `resultingVersion`, and `committedAt`. It proves only the Store transaction. Existing lifecycle and migration receipt types remain unchanged.
- Finite proof budget: one pre-change review pass and at most 20 fixed test cases, split into six migration and legacy-data cases, four busy or concurrent-write cases, six lifecycle-transition and unavailable-capture cases, two evidence and privacy cases, and two receipt and CLI/MCP parity cases.
- Failure, platform, and correction limits: at most five planned transaction failure points; native macOS, Linux execution, and fixed Windows drive, UNC, and path cases; at most two materially different correction attempts per defect and six correction attempts in total.
- Review and rerun limits: one initial independent review, one follow-up review after corrections, one full candidate check, and one full confirmation check after material changes. Only affected checks may rerun after a changed input. Unchanged inputs cannot cause another run.
- Exhaustion rule: budget exhaustion stops the affected work with evidence and an owner decision. P6 creates no performance target.
- Safety design decision: checkpoint 9 uses pre-mutation Store classification, one SQLite transaction for schema DDL, `user_version`, and an internal metadata-only journal row, then an idempotent project receipt projection. Two projection failures return a typed stop result. No post-commit whole-Store or database restore occurs. The finite proof budget does not change.
- Authority sequence: `e344d49b` recorded the bounded P6 contract, `63c39bf9` fixed the lifecycle transition matrix, and `906cfc69` fixed the Store safety design. `298df67` recorded the later-rejected isolated proof design. Implementation commit `bac3eb2` contains the final retirement reconciliation and the accepted P6 implementation.
- Phase / capability status: Stage 1 is complete. The owner accepted implementation commit `bac3eb2` after the required authority commits and focused checks.

## Stage 2 - Migrate The Store Transactionally

### Tasks

- [x] t9: Add ordered idempotent schema migrations for general `runs` and `run_evidence` relations with stable project/run/evidence identities, lifecycle stages, statuses, checkpoints, optimistic versions, bounded metadata, and timestamps defined by PRD 38. Add one internal checkpoint journal that stores only checkpoint and receipt-projection metadata and no Store payload.
- [x] t10: Keep the existing `playbook_runs` relation and rows byte-opaque and unchanged during checkpoint-9 migration and current lifecycle operations. Exclude them from current lifecycle listings, conversions, inference, merging, and new foreign-key behavior. Do not change the existing explicit project-prune contract.
- [x] t11: Classify the Store before any setup mutation and fail closed for corrupt, unknown, newer, or indeterminate state. Commit checkpoint-9 schema DDL, `user_version`, and the internal journal row in one SQLite write transaction with bounded busy handling. Use that transaction as the Store rollback and cross-process serialization boundary. Do not replace or restore the whole Store or its database after commit.
- [x] t12: Prove repeat application is idempotent, the integrated fresh and existing setup paths cannot bypass checkpoint 9, concurrent writers serialize, and an interrupted migration cannot expose a partial current schema or journal.

### Acceptance criteria

- `runs` and `run_evidence` match current PRD fields and constraints.
- Checkpoint-9 migration and current lifecycle operations keep legacy `playbook_runs` rows byte-opaque and unchanged. Current lifecycle listings exclude them. The existing explicit project-prune path remains unchanged.
- Busy, interruption, unsafe classification, and schema mismatch fail safely within finite budgets before later setup mutation.
- Migration checkpoint 9 commits its schema, version, and internal journal as one transaction and recovers receipt projection from that journal.
- A post-commit failure does not replace or restore the Store and cannot erase another process or project's write.

### Dependencies

- Stage 1 unlock.
- P5 frozen snapshot, active lock/quiescence, and repository-filesystem backup and rollback.

### Closeout Notes

- Testing-mode decision(s): integrated fresh and existing setup, repeated, busy, cross-process, interrupted, unsafe-classification, journal-recovery, and legacy-row fixtures inside the existing finite case budget.
- Phase / capability status: Stage 2 is complete at `bac3eb2`. Store schema version 2 includes the transactional checkpoint-9 schema and metadata-only journal. Checkpoint-9 migration keeps legacy `playbook_runs` rows byte-opaque and unchanged. The existing explicit project-prune contract remains outside this scope.

## Stage 3 - Implement General Run Operations And Evidence References

### Tasks

- [x] t13: Activate the P3-pending `lifecycle.start`, `lifecycle.show`, `lifecycle.list`, `lifecycle.checkpoint`, `lifecycle.pause`, `lifecycle.resume`, `lifecycle.attach-evidence`, `lifecycle.complete`, `lifecycle.fail`, and `lifecycle.abandon` handlers. Preserve the `make-docs run lifecycle <operation>` CLI paths and derived MCP tools. Implement PRD-defined transition validation and optimistic concurrency. Reads accept every status. Checkpoints accept `active` or `paused`. Evidence attachment accepts every status without changing status or reopening a terminal run. Pause accepts `active`; resume accepts `paused`; complete accepts `active`; and fail and abandon accept `active` or `paused`. Terminal runs reject checkpoints and later status transitions.
- [x] t14: Restrict current `run_type` and lifecycle/status vocabularies to the PRD-defined values; reject unknown values rather than converting them into arbitrary metadata.
- [x] t15: Store only bounded evidence references with kind, project-relative path or sanitized external reference, optional digest, and timestamp; reject bodies, screenshots, recordings, logs, prompts, secrets, credentials, and arbitrary payloads.
- [x] t16: Keep repository PRDs, work, scenarios, findings, evidence artifacts, gates, and history authoritative; Store rows are rebuildable operational projection and never close those records.
- [x] t17: Implement `run-capture-unavailable` as a typed no-repository-mutation, no-automatic-retry outcome that is nonblocking unless a direct Store/run-capture gate explicitly requires success.

### Acceptance criteria

- All transitions enforce optimistic version and the exact PRD 38 legal-state matrix. CLI and MCP return the same typed invalid-transition outcome.
- Evidence storage is reference-only, bounded, sanitized, and non-authoritative.
- Unavailable capture has exact typed semantics and cannot trigger an unbounded retry loop.
- Legacy rows never appear in current lifecycle operations or listings.
- P6 clears `pendingLineage: W19 R1 P6` only after all ten handlers, CLI projections, MCP tools, and focused transition tests pass.

### Dependencies

- Stage 2 schema.
- P3 registry and projection contracts.

### Closeout Notes

- Testing-mode decision(s): transition-table, version-conflict, evidence validation, unavailable, and legacy-exclusion fixtures.
- Phase / capability status: Stage 3 is complete at `bac3eb2`. All ten lifecycle identifiers are active. CLI and MCP paths remain derived from the same operation registry.

## Stage 4 - Return Typed Mutation Receipts

### Tasks

- [x] t18: Return a typed receipt for each successful Store mutation containing run identity, operation, Store schema version, resulting optimistic version, and commit time, plus only additional fields explicitly approved by the Stage 1 receipt-generalization disposition.
- [x] t19: Make receipt serialization stable across CLI and MCP while preserving the distinction between a Store commit and repository write, validation, publication, external delivery, UAT acceptance, or phase closure.
- [x] t20: Prove failed, conflicted, unavailable, and rolled-back lifecycle mutations cannot emit a success receipt and that retry uses the latest explicit optimistic version rather than hidden repetition. For checkpoint 9, project receipt persistence projects idempotently from the committed journal, retries once, and returns a typed stop result if both attempts fail.

### Acceptance criteria

- Receipts prove exactly one committed Store mutation and no broader outcome.
- CLI/MCP receipt projections are semantically identical.
- Failure paths cannot produce false success receipts.
- Receipt fields do not silently expand product authority.
- A checkpoint-9 receipt-projection failure does not undo the committed Store. The journal supports later projection recovery.

### Dependencies

- Stage 3 operations.
- Stage 1 disposition for any generalized receipt field.

### Closeout Notes

- Testing-mode decision(s): receipt schema, transport parity, false-success, conflict, checkpoint-journal projection, double projection failure, and recovery tests inside the existing finite case budget.
- Phase / capability status: Stage 4 is complete at `bac3eb2`. `LifecycleStoreMutationReceipt` schema version 1 proves only one committed Store mutation and has equal CLI and MCP meaning.

## Stage 5 - Prove Data Safety And Unlock Checkpoint 10

### Tasks

- [x] t21: Run focused schema, integrated-setup migration, transition, cross-process concurrency, busy, evidence-reference, receipt, CLI/MCP parity, privacy, transactional rollback, journal recovery, typed double-projection-failure, quiescence, migration-safety, deterministic-kit, and whitespace validation within the existing finite budget. Do not run frozen Playbook package operations for conformance proof. Do not expand the fixed 20-case Store budget or five planned Store failure points.
- [x] t22: Compare pre/post fixtures to prove checkpoint-9 migration and current lifecycle operations keep every legacy `playbook_runs` row and unrelated Store table unchanged. Prove that current lifecycle listings exclude legacy rows. Preserve the existing explicit project-prune contract.
- [x] t23: Obtain independent review of transactional safety, pre-mutation classification, cross-process serialization, journal recovery, typed projection failure, repository-vs-Store authority, receipt semantics, unavailable behavior, legacy preservation, active quiescence, and migration safety; correct only actionable defects within budget.
- [x] t24: Record checkpoint-9 completion evidence, exact schema/operation versions, remaining nonblocking items, and the locked checkpoint-10/P7 handoff while keeping quiescence active.

### Acceptance criteria

- Focused data-safety and failure-injection validation passes.
- Integrated setup, cross-process serialization, journal recovery, and typed double-projection-failure checks pass inside the fixed 20-case and five-failure-point limits.
- Independent review finds no unresolved material migration, authority, privacy, or receipt defect.
- Checkpoint 9 and current lifecycle operations close without touching legacy Playbook state. P6 does not change the existing explicit project-prune path.
- Checkpoint 10 remains separately gated and quiescence remains active.
- All ten lifecycle operation identifiers are active without a transport or identifier change.
- P6 does not require or preserve a successful R-KIT-3 proof over frozen Playbook package operations.
- The real session workspace keeps its active P5-through-P10 quiescence barrier. Focused migration-safety checks pass.
- Equal inputs still produce deterministic kit output through static projection only.
- P8 owns removal of the legacy package conformance surfaces or an owner-approved retargeting.
- A future non-Playbook packaging conformance design requires new owner authority.

### Dependencies

- Stages 2 through 4 complete.
- Finite migration/failure/correction/review budget.

### Closeout Notes

- Testing-mode decision(s): deterministic Store fixtures plus independent data-safety review.
- Validation evidence: the full confirmation passed 1,249 tests, 47 default checks, build, and diff checks. The focused Linux P6 proof passed 20 tests. Final affected checks passed 29 conformance tests, 14 P5 migration-safety tests, and 21 PRD-authority tests.
- Review result: independent review and final confirmation found no remaining material or nonmaterial findings. The owner accepted implementation commit `bac3eb2`. No push occurred.
- Legacy boundary: checkpoint-9 migration and current lifecycle operations keep legacy rows unchanged and exclude them from current lifecycle listings. P6 preserves the pre-existing explicit project-prune contract.
- Retirement boundary: P6 does not run frozen Playbook package operations for conformance proof. P8 owns removal or owner-approved retargeting of those surfaces.
- Phase / capability status: P6 and checkpoint 9 are complete. Store schema version 2 and `LifecycleStoreMutationReceipt` schema version 1 are current. Checkpoint 10 and P7 remain separately gated. Quiescence stays active.

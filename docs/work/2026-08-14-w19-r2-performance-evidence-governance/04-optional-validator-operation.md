---
title: "Phase 4: Optional Validator Operation"
kind: "work"
status: "active"
coordinate: "W19 R2 P4"
source:
  type: "prd"
  path: "docs/prd/48-performance-evidence-governance.md"
---

# Phase 4: Optional Validator Operation

> **Phase status: BLOCKED / NOT AUTHORIZED.** The accepted plan and current PRD 48 permit only a future admission decision. Do not begin validator code, tests, registry work, CLI/MCP exposure, or PRD 25/39 implementation until Stage 1 records owner admission and the separate decision commit SHA.

## Purpose

Define the executable queue for a possible deterministic, read-only structural validator while preserving the hard admission gate. This backlog entry does not itself admit the operation, authorize implementation, or turn agent judgment into deterministic product authority.

## Overview

If the owner later admits the operation, it may report structural and traceability facts only. It may not run benchmarks, choose targets, decide applicability or comparability, approve waivers, fulfill obligations, promote support, rewrite files, or loop on results. The phase permits at most two materially distinct correction attempts and two review cycles after admission.

## Source PRD Docs

- [PRD 03 — Open Questions and Risk Register](../../prd/03-open-questions-and-risk-register.md)
- [PRD 25 — TypeScript Runtime, CLI, MCP, and Operation Boundaries](../../prd/25-typescript-runtime-cli-mcp-operation-boundaries.md)
- [PRD 39 — CLI Command Model and Operation Registry](../../prd/39-cli-command-model-and-operation-registry.md)
- [PRD 48 — Performance Evidence Governance](../../prd/48-performance-evidence-governance.md)

## Source Obligations, Scenarios, And Findings

- `O-###: none` — no deferred obligation is assigned at backlog generation.
- `NUAT-###: none` — no naive-UAT scenario is assigned to a structural validator.
- `Finding: none` — no finding is assigned; validator output cannot close a finding by itself.

## Stage 1 - Phase-Entry PRD Question And Risk Gate

### Tasks

- [ ] t1: Verify the exact branch, HEAD, worktree, free disk, dirty-state allowlist, and P2/P3 closeout; record that P4 is currently blocked and perform no implementation write.
- [ ] t2: Reread the current normative bodies of PRDs 25, 39, and 48 plus PRD 03, and record each current revision or content digest.
- [ ] t3: Reevaluate the hard validator-admission question and at minimum R-025 plus R-029 through R-032; add any newly relevant current item discovered by the live reread.
- [ ] t4: Classify every relevant `Open`, `Confirming`, `Deferred`, or closed regression item with its ID, authority revision or digest, phase impact, one classification (`blocking`, `impacted-nonblocking`, `unrelated`, `closed-regression-check`, or `new-authority-gap`), disposition, and rationale.
- [ ] t5: Unless owner admission and current PRD authority already exist, classify the missing admission and missing PRD 25/39 operation contract as blocking, stop before t8, and present an owner decision package rather than asking for implementation authorization by implication.
- [ ] t6: The decision package must include the source anchor, affected phase/PRDs, bounded options (`remain documentation-only`, `defer`, or `admit the exact deterministic operation`), trade-offs, recommendation, consequences, exact PRD 25/39/03/48 and history changes, validation, and a decision-only commit boundary; do not create a standalone decision file.
- [ ] t7: Unlock t8 only after explicit owner admission, canonical PRD 25/39 and register/history reconciliation, PRD-authority validation, a separate decision-only commit, and recording that commit SHA in the phase-entry record; after all admission items are classified and resolved, also record an explicit no-blocker/no-authority-gap result and the finite correction/review budget before t8 unlocks.

### Acceptance criteria

- P4 remains blocked unless explicit owner admission and separately committed current PRD authority exist.
- Current PRDs 25, 39, 48, and PRD 03 were reread and revisions or digests are recorded.
- R-025 and R-029 through R-032 have explicit phase classifications and rationales.
- After all admission items are classified and resolved, the phase-entry record states an explicit no-blocker/no-authority-gap result and the finite correction/review budget before t8 unlocks.
- No validator implementation, test, registry, CLI, MCP, or package write occurred before unlock.
- Any owner decision is documented in canonical PRDs/register/history, validated, separately committed, and referenced by SHA.
- No standalone decision file exists, and task completion cannot close a risk, finding, obligation, or capability.

### Dependencies

- P2 and P3 accepted.
- Separate owner admission decision.
- Separately reconciled, validated, and committed PRDs 25 and 39.

### Closeout Notes

- Testing-mode decision(s): phase-entry authority review only while blocked; all implementation testing is `none`.
- Phase / capability status: `blocked / not-authorized` until every admission criterion passes.

## Stage 2 - Implement The Admitted Deterministic Operation Core

### Tasks

- [ ] t8: Confirm the admitted decision names exact modules, supported document roots, fixtures, permissions, failure behavior, operation identity, and one shared structured result schema.
- [ ] t9: Implement one read-only TypeScript operation core that inventories candidate language and validates only admitted structural facts: `PERF-###` identity/version, required fields, links, class-based owner/location, approval, expiry, finite budget/stops, traceability, evidence references, stricter work criteria, and declared fingerprint equality.
- [ ] t10: Emit stable diagnostic codes, complete structured results, reasons, and remediation text for missing, contradictory, unsupported, unreadable, unsafe, or escaping targets; fail closed before any mutation.
- [ ] t11: Report declared fingerprint comparison only as `unchanged`, `materially-changed`, or `not-comparable` with reasons, without authorizing execution, retries, equivalence, or a favorable outcome.
- [ ] t12: Enforce non-capabilities: the operation cannot decide applicability, maturity, target/statistic/environment value, comparability judgment, user impact, severity, trade-offs, waiver approval, obligation fulfillment, supported scope, requirement change, or support promotion.
- [ ] t13: Keep the operation non-mutating: it executes no benchmark, rewrites no file, chooses no remediation, replenishes no budget, and loops on no result.

### Acceptance criteria

- The operation matches the exact owner-admitted PRD 25/39 contract and no broader scope.
- One TypeScript core owns parsing, validation, and the complete structured result.
- Unsafe or ambiguous inputs fail closed with stable diagnostics before mutation.
- Judgment boundaries are enforced as tested non-capabilities.
- Fingerprint reporting cannot authorize an execution or retry.
- No benchmark framework, universal profile library, arbitrary target, or self-replenishing budget is created.

### Dependencies

- Stage 1 unlocked with decision commit SHA recorded.

### Closeout Notes

- Testing-mode decision(s): focused unit/property fixtures for structural facts and non-capabilities; no benchmark execution.
- Phase / capability status: core implemented; projections and parity remain open.

## Stage 3 - Project One Result Through CLI And MCP

### Tasks

- [ ] t14: Register the admitted read-only operation with exact metadata, inputs, outputs, permissions, and failure modes.
- [ ] t15: Derive human CLI rendering and MCP tool output from the same complete result schema with no separate validation or business logic.
- [ ] t16: Add bounded fixtures for each target class, invalid/duplicate identity, wrong owner, unsupported stricter work criterion, expired evidence, unchanged fingerprint, valid single-event requalification declaration, prohibited repeat, broken evidence link, unsafe target root, and explicit human-decision boundary.
- [ ] t17: Prove CLI/MCP parity, complete diagnostics, read-only behavior, fail-closed path handling, and absence of output-triggered retries.
- [ ] t18: Prove the validator cannot admit itself, update PRDs, approve a waiver, close an obligation/finding, execute a profile, promote a result, or change support status.

### Acceptance criteria

- CLI and MCP project one operation core and preserve complete diagnostics.
- Registry metadata and permissions match the admitted read-only contract.
- Fixtures cover positive, negative, unsafe-path, expiry, rerun, and judgment-boundary cases.
- No adapter, CLI renderer, or MCP tool contains separate business policy.
- The operation cannot mutate authority or execution state.

### Dependencies

- Stage 2 accepted.
- Admitted CLI/MCP scope in the decision commit.

### Closeout Notes

- Testing-mode decision(s): focused operation, registry, CLI/MCP parity, router, and unsafe-path tests.
- Phase / capability status: projections complete; final validation remains open.

## Stage 4 - Validate And Close Or Reblock P4

### Tasks

- [ ] t19: Run only the focused operation, registry, type/build, fixture, CLI/MCP parity, router, path-hygiene, link, and affected tests required by the admitted surface.
- [ ] t20: Retry only affected failed checks after a material correction, reuse unchanged valid results, and stop at the finite correction/review budget or diminishing return.
- [ ] t21: Independently review the exact diff for scope creep, judgment automation, mutation, benchmark execution, incomplete diagnostics, parity drift, hidden retry, and target-authority promotion.
- [ ] t22: Record exact changed files, decision commit SHA, validation evidence, remaining risks/findings/obligations, correction/review budget, and one disposition: `validated optional operation`, `blocked`, or `deferred`.

### Acceptance criteria

- Focused tests and independent review pass within the admitted and finite scope.
- The operation remains read-only, deterministic, complete, and non-judgmental.
- No benchmark was run and no product target, waiver, obligation, result, or support claim changed.
- Closeout preserves open risks and distinguishes P4 task status from W19 R2 capability status.
- Any unresolved authority or safety issue reblocks the phase rather than broadening scope.

### Dependencies

- Stages 2 and 3 accepted.

### Closeout Notes

- Testing-mode decision(s): focused automated checks and independent review complete; `O-###`, `NUAT-###`, and finding remain `none` unless authority-backed records were created separately.
- Phase / capability status: report `validated` only for the exact admitted structural operation; otherwise remain `blocked` or `deferred`.

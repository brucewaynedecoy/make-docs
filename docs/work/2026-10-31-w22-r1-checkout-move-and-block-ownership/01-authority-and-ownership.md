---
title: "Phase 1: Authority and Ownership"
kind: "work"
status: "draft"
coordinate: "W22 R1 P1"
source:
  type: "prd"
  path: "docs/prd/15-agent-instruction-ownership-and-managed-blocks.md"
---

# Phase 1: Authority and Ownership

## Purpose

Repair durable move proof while keeping Make Docs ownership limited to its block in shared instruction files. This phase starts with the authority gate. See [plan P1](../../plans/2026-10-31-w22-r1-checkout-move-and-block-ownership/01-authority-and-ownership.md).

## Overview

The root blocks already match their saved block hashes. The defect is the full-file move digest. Preserve user prefix/suffix bytes. Use current ownership and trusted provenance rather than every historical operation path. Keep exact full-file snapshots for active writes and recovery.

The user authorized only Stage 1 PRD reconciliation and gap review. Stage 1 is complete after the owning edits, independent gap review, and Store-free authority validation. Stage 2 and Stage 3 remain unrun and require separate implementation authorization.

## Human Experience Outcome

- Impact and promise: direct; user text outside valid Make Docs blocks must not create a move conflict.
- Intended human outcome: the user can keep project instructions while moving the install.
- Surface: shared instruction files and ownership diagnostics.
- Work: reconcile authority, prove a failing case, then add ownership-scoped versioned evidence.
- Evidence: block hashes, byte comparisons, negative fixtures, current PRD validation.
- Executor: authorized maintainer or agent in an isolated test environment.
- Obligation route: none. Keep D-049 open.
- Authority: [Human Experience Contract](../../../.make-docs/system/contracts/human-experience-contract.md).

## Current Testing Decisions

Use the [common decision record](00-index.md#common-testing-decision-record). It supplies the reason, maturity, executor, gate effect, budget, stop condition, retained evidence, and rerun trigger. The phase scope is authority checks and focused ownership/evidence fixtures.

| Testing type | Current decision | Phase record |
| --- | --- | --- |
| Automated Implementation Testing | Planned; required for exact correctness claims after authorization | authority checks and focused ownership/evidence fixtures; affected-first tests before broader proof; use the shared finite budget. |
| Performance Testing | not-needed-now | No speed/scale claim; zero runs. Revisit only for a new accepted performance claim or relevant cost risk. |
| Guided Progress Review | Optional and advisory | No working installed increment exists in this phase. Offer later in P3. A decline or no response creates no gate or obligation. |
| Unassisted Goal Testing | not-needed-now | The known failure can be answered by automated proof and agent review. Revisit for material discoverability uncertainty those cannot answer, or explicit product/release authority. No scenario or tester is selected. |

Human Experience Review remains required agent work. Inspect the available real result for each promise and record the reviewer, observations, conclusion, evidence, limit, and next action in [evidence.md](evidence.md). It is not a fifth test type. No explicit human acceptance gate is selected.

Performance fields: base action is correctness repair; applicability is not-needed-now; canonical profile is none; budget, packet, outcome, and performance gate are not-applicable. Do not run a benchmark.

## Source PRD Docs

- [PRD 15: block ownership](../../prd/15-agent-instruction-ownership-and-managed-blocks.md), Requirements and Managed Instruction Conflict Semantics.
- [PRD 18: migration safety](../../prd/18-compatibility-classification-and-migration-safety.md), Quiescence and Mutation Barrier; Compatibility Bridge Contract.
- [PRD 38: Store and project state](../../prd/38-global-store-and-project-state.md), R-ID, R-CHECKOUT, R-XFER, R-TEST.
- [PRD 24: declarative config](../../prd/24-project-configuration-and-convention-overlay.md), Declarative Identity and Settings.
- [PRD 07: setup lifecycle](../../prd/07-cli-command-surface-and-lifecycle.md).
- [PRD 25: operation boundaries](../../prd/25-typescript-runtime-cli-mcp-operation-boundaries.md).
- [PRD 39: registry](../../prd/39-cli-command-model-and-operation-registry.md).
- [PRD 10: candidate proof](../../prd/10-packaging-validation-and-release-reference.md).
- [PRD 02: architecture](../../prd/02-architecture-overview.md), link-only.

## Source Obligations, Scenarios, And Findings

- Accepted obligations: none.
- Activated NUAT scenarios: none; not-needed-now.
- Finding: [D-049](../../prd/03-open-questions-and-risk-register.md#d-049-moved-checkout-setup-bypasses-project-identity-and-managed-block-ownership).
- Planned sequence: [plan overview](../../plans/2026-10-31-w22-r1-checkout-move-and-block-ownership/00-overview.md). It does not replace current PRDs.

## Stage 1 - Reconcile Authority Before Code

### Tasks

- [x] t1: Recheck the named current PRD owners and the user-approved scope. Read docs/assets/project/developing-deterministic-agentic-twins.md before any business logic work.
- [x] t2: Update only the named owning sections for block-only move proof, config identity, evidence-v1 to evidence-v2 transition, setup discovery, and shared Store-only preview/apply. Adopt proposed project.checkout-move.preview and project.checkout-move.apply in PRD 39 before code.
- [x] t3: Preserve authentic schema-1 whole-file adoption rules and unrelated requirements. Add bounded non-normative history only for material accepted contract changes. Keep the current PRD index and D-049 links accurate without closing D-049.
- [x] t4: Run the Store-free current-authority validator and changed-doc link/trace checks. Record the reconciled PRD sections and resolve defects before opening code tasks.

### Acceptance criteria

- A1: Every candidate in the plan matrix has one existing owner and an inline current rule or a reasoned link-only/none decision. No new product PRD or broad rewrite appears.
- A2: Current authority states that shared-file ownership is block-scoped, while transient file snapshots and authentic schema-1 adoption keep their distinct safety roles.
- A3: The PRD authority and changed-doc checks pass before code tasks. The code gate stays closed until separate implementation authorization; documentation completion does not supply it.

### Dependencies

- Current user authorization for PRD reconciliation and gap review only.
- The reviewed plan and current named PRDs.
- Separate code/test authorization remains required before Stage 2 or Stage 3.

### Closeout Notes

Stage 1 t1–t4 are complete. The named existing PRDs were updated, both independent gap reviews closed their findings, and the post-review Store-free CLI authority check passed with 35 PRDs, 635 Markdown sources, 1206 links, and zero diagnostics. A1–A3 are satisfied only as documentation acceptance; see [PRD review evidence](evidence.md#final-prd-documentation-stage-result). No product pass, code permission, Store repair, or human acceptance is inferred. t5 and later remain unchecked.

## Stage 2 - Write Focused Red Ownership Cases

### Tasks

- [x] t5: Add failing focused cases for unchanged valid blocks with edited prefix/suffix in both root files. Assert the existing 2.0.5 move digest rejects them while the saved block proof remains valid.
- [x] t6: Add grouped negative cases for changed blocks, strict missing/duplicate/reversed markers, changed fully owned files, invalid config identity, and historical paths that no longer prove current ownership.
- [x] t7: Add versioned-proof cases for valid v1 per-block evidence, missing independent saved proof, unknown evidence versions, and authentic schema-1 whole-file adoption. Add an evidence-v2 old-reader check: after the fixed tool saves v2 evidence, move a disposable copy again and attempt that further relocation with released 2.0.5. Assert refusal without losing rows or history. Do not claim that the immutable old binary refuses ordinary reads or writes at an already-bound path, or that downgrade is supported.

### Acceptance criteria

- A4: The focused rename/outside-edit cases expose the actual defect before implementation. Negative fixtures distinguish user bytes from changed managed content.
- A5: A valid v1 transition requires saved ledger/project/digest agreement and independent per-block or fully owned-file proof. Missing proof is not replaced by current bytes or approval.

### Dependencies

- Stage 1 authority gate.
- Explicit isolated fixture roots and disposable Stores.

### Closeout Notes

The focused v1 bridge case failed against the original verifier. It reported that the moved content did not match the last verified Store facts after outside text and a config comment changed. The edited verifier passed the same case. The released 2.0.5 executable also refused a further move after version 2 evidence was saved. These results use disposable checkouts and a temporary Store. See [Phase 1 implementation evidence](evidence.md#phase-1-implementation-evidence). They do not prove release readiness.

## Stage 3 - Implement Scoped Evidence

### Tasks

- [x] t8: Reuse strict parseManagedBlock and saved ownership/provenance readers in one shared move verifier. Hash only valid managed-block bodies; compare fully owned files with their trusted full-file facts. Preserve all project-owned bytes.
- [x] t9: Add evidence-version 2 inside existing verification_json with a retained version 1 reader. Upgrade only a selected record after independent proof. Keep ledger claims unchanged. Exclude config comments/unrelated settings and stale historical paths from permanent move identity.
- [x] t10: Run focused tests and review the verifier at its call sites. Preserve exact pending-recovery snapshots, safe file-kind/parent/path checks, and unknown-version refusal. Record the proof contract for P2 and the limits for P3.

### Acceptance criteria

- A6: Valid unchanged blocks pass despite outside user edits. Changed/invalid blocks and changed fully owned content stop with scoped diagnostics and no adoption.
- A7: Evidence v2 is built only from independently proved ownership facts. No schema migration, blind reset, identity churn, or broad Store cleanup occurs.
- A8: Active-operation concurrency/recovery retains its exact snapshots. Existing tests for authentic schema-1 adoption remain valid. The P2 verifier contract is recorded.

### Dependencies

- Stages 1 and 2.
- Recheck actual source signatures before patching packages/cli/src/store/installation-state.ts, manifest.ts, managed-block.ts, and identity/config readers.

### Closeout Notes

The focused code and test work is complete but uncommitted. The current move path uses the new proof. P2 still must use that proof in shared preview and apply operations. P3 still needs an installed candidate review. See [Phase 1 implementation evidence](evidence.md#phase-1-implementation-evidence) for test results, Human Experience Review, and limits. No benchmark, Unassisted Goal Test, human gate, or release was run.

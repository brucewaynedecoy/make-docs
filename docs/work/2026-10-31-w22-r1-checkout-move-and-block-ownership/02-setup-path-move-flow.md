---
title: "Phase 2: Setup Path-Move Flow"
kind: "work"
status: "draft"
coordinate: "W22 R1 P2"
source:
  type: "prd"
  path: "docs/prd/38-global-store-and-project-state.md"
---

# Phase 2: Setup Path-Move Flow

## Purpose

Detect and review a moved install before fresh setup. Use the shared proof contract from P1. See [plan P2](../../plans/2026-10-31-w22-r1-checkout-move-and-block-ownership/02-setup-path-move-flow.md).

## Overview

Discover records from valid config projectId without treating that ID alone as proof of a move. The shared preview and apply operations must serve setup, direct CLI, and MCP. Move apply changes only the selected Store path/evidence and its completed receipt in one transaction. It cannot write project files.

Every task remains unrun. P1 authority and separate implementation authorization are prerequisites.

## Human Experience Outcome

- Impact and promise: direct; the user sees the existing project, old path, current path, exact effect, and next choice before fresh-install selections.
- Intended human outcome: the user can move one install, keep another checkout separate, or cancel.
- Surface: setup review, status, CLI/MCP results, and recovery messages.
- Work: early discovery, explicit review, bounded Store-only apply, and reclassification after move.
- Evidence: failing flow fixtures, no-change assertions, transaction/retry tests, and installed output.
- Executor: authorized maintainer or agent using isolated roots and disposable Stores.
- Obligation route: none. Keep D-049 open.
- Authority: [Human Experience Contract](../../../.make-docs/system/contracts/human-experience-contract.md).

## Current Testing Decisions

Use the [common decision record](00-index.md#common-testing-decision-record). It supplies the reason, maturity, executor, gate effect, budget, stop condition, retained evidence, and rerun trigger. The phase scope is focused setup, registry/MCP admission, and Store-only transaction cases.

| Testing type | Current decision | Phase record |
| --- | --- | --- |
| Automated Implementation Testing | Planned; required for exact correctness claims after authorization | focused setup, registry/MCP admission, and Store-only transaction cases; affected-first tests before broader proof; use the shared finite budget. |
| Performance Testing | not-needed-now | No speed/scale claim; zero runs. Revisit only for a new accepted performance claim or relevant cost risk. |
| Guided Progress Review | Optional and advisory | Offer only once the installed increment is meaningful in P3. A decline or no response creates no gate or obligation. |
| Unassisted Goal Testing | not-needed-now | The known failure can be answered by automated proof and agent review. Revisit for material discoverability uncertainty those cannot answer, or explicit product/release authority. No scenario or tester is selected. |

Human Experience Review remains required agent work. Inspect the available real result for each promise and record the reviewer, observations, conclusion, evidence, limit, and next action in [evidence.md](evidence.md). It is not a fifth test type. No explicit human acceptance gate is selected.

Performance fields: base action is correctness repair; applicability is not-needed-now; canonical profile is none; budget, packet, outcome, and performance gate are not-applicable. Do not run a benchmark.

## Source PRD Docs

- [PRD 07: setup lifecycle](../../prd/07-cli-command-surface-and-lifecycle.md).
- [PRD 38: checkout binding](../../prd/38-global-store-and-project-state.md), R-CHECKOUT, R-ID, R-XFER, R-TEST.
- [PRD 18: safe migration](../../prd/18-compatibility-classification-and-migration-safety.md).
- [PRD 24: config identity](../../prd/24-project-configuration-and-convention-overlay.md).
- [PRD 39: registry](../../prd/39-cli-command-model-and-operation-registry.md).
- [PRD 25: CLI/MCP boundaries](../../prd/25-typescript-runtime-cli-mcp-operation-boundaries.md).

## Source Obligations, Scenarios, And Findings

- Accepted obligations and activated NUAT scenarios: none.
- Finding: [D-049](../../prd/03-open-questions-and-risk-register.md#d-049-moved-checkout-setup-bypasses-project-identity-and-managed-block-ownership).
- Prior phase: [P1](01-authority-and-ownership.md).
- Planned rule detail: [P2 plan](../../plans/2026-10-31-w22-r1-checkout-move-and-block-ownership/02-setup-path-move-flow.md).

## Stage 1 - Prove the Setup Ordering Failure

### Tasks

- [ ] t1: Write red flow cases for config-ID discovery before path-bound manifest lookup, fresh classification, or editable selections. Include the root and a distinct nested kit.
- [ ] t2: Specify Move this existing install here, Register a separate checkout, and Cancel outcomes. Add grouped tests for live/recreated source paths, multiple candidates, target claims, missing/invalid IDs, pending work, and active/dead locks.
- [ ] t3: Add red no-change cases for status, preview, dry-run, cancel, no approval, and bare non-interactive --yes. Assert logical durable state rather than raw SQLite file checksums.

### Acceptance criteria

- A9: A recognizable moved install is explained before fresh choices. A config ID finds candidates but never selects a source by name, timestamp, row order, or spelling.
- A10: All unapproved/read-only paths leave durable bindings, evidence, identities, journals, and history unchanged. Transient leases are released.

### Dependencies

- P1 Stage 1 authority gate and scoped verifier contract.
- Separate implementation authorization.

### Closeout Notes

These are focused red tests before code. No test has run in the current documentation task. Retain actual failures later in evidence.md.

## Stage 2 - Add Shared Preview and Safe Apply

### Tasks

- [ ] t4: Add proposed project.checkout-move.preview and project.checkout-move.apply to the shared operation contract and registry projections. Keep the three-part ID grammar. CLI checkout-move preview/apply and MCP checkout_move_preview/apply must use the same core.
- [ ] t5: Build stateless reviewed facts from selected project/checkout, canonical source/target paths and comparison keys, saved ledger/evidence digests, evidence version, and proved target ownership. Preview writes no durable review row.
- [ ] t6: Implement move apply with existing Store access/locking and one SQLite transaction for bounded move journal/receipt, path binding, and proved evidence. Do not use generic withInstallationOperation unchanged. Preserve ledger bytes and history.
- [ ] t7: Enforce Store-write/project-read/host-config-none admission. Require allowWrite=true for MCP apply, the exact reviewed source/target, and caller root scope. Recheck under lock; reject source switching, stale proof, competing claims, unsupported schema, or pending work.

### Acceptance criteria

- A11: Preview is Store-read/project-read only. Apply cannot write config, bootstrap identity, replace the ledger, migrate the schema, register another checkout, or widen MCP roots.
- A12: Path, proved evidence, and completed receipt commit together. Crash before commit leaves the old state; retry after commit recognizes only that exact completion without duplicate receipt or identity.

### Dependencies

- Stage 1 red fixtures and P1 proof implementation.
- Existing supported Store schema. Required compatibility work is a separate reviewed action.

### Closeout Notes

Retain transaction/fault results and operation-access comparisons after execution. No ad hoc setup SQL or real Store repair is authorized by this backlog.

## Stage 3 - Integrate the Review and Reclassification

### Tasks

- [ ] t8: Wire discovery before compatibility/fresh setup classification. Show source and target facts, available choices, disabled unsafe choices, and useful next actions. Keep JSON and human results consistent.
- [ ] t9: Route Register a separate checkout to a distinct reviewed managed-install action with its own project-write admission and adoption review. Force a new checkout ID; do not let absent-source automatic binding steal the old record or copy pending work.
- [ ] t10: After move, reread the bound manifest and saved selections before planning later setup changes. Keep move completion distinct from cancelled/failed later edits. Run focused cases, record root/kit independence, and hand off to P3.

### Acceptance criteria

- A13: Move keeps the selected project/checkout IDs, ledger, and history. Separate-checkout registration preserves the old record and uses a new checkout ID under its own approval.
- A14: Parent approval never changes a kit record. Each explicit target needs its own review.
- A15: A second setup sees the current install and proposes no move or fresh install. Later setup edits have separate review and state.
- A16: Required agent Human Experience Review can identify subject, paths, effect, state, and next action in success, cancel, unsafe, ambiguous, and partial cases. No human gate is inferred.

### Dependencies

- Stages 1 and 2.
- Recheck owners in cli.ts, setup-project-recovery.ts, installation-state.ts, registry.ts, wizard and result models.

### Closeout Notes

Record exact outcomes in evidence.md. Carry failed or unrun claims to P3 without calling them passed. Guided Progress Review is advisory; Performance Testing and Unassisted Goal Testing remain not-needed-now on the stated triggers. No live root or kit repair has occurred.

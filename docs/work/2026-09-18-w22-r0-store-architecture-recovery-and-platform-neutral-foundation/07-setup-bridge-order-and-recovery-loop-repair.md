---
title: "Phase 7: Setup Bridge Order and Recovery Loop Repair"
kind: "work"
status: "active"
coordinate: "W22 R0 P7"
source:
  type: "prd"
  path: "docs/prd/07-cli-command-surface-and-lifecycle.md"
---

# Phase 7: Setup Bridge Order and Recovery Loop Repair

## Purpose

Repair the closed command loop between full setup and system setup when a supported legacy Store and a machine configuration change exist together.

## Overview

P7 corrects the dependency order in full setup, preserves direct machine setup independence, delays new harness intent until its owned change can succeed, and replaces generic recovery directions with one action that changes the failed condition. It proves the exact reported state in isolated fixtures and one exact installed package on Windows, macOS, and Linux.

P7 is the only active W22 phase. P1 through P6 remain completed records for their exact prior evidence. Runtime implementation has not started. The owner requested an implementation discussion after this authority package is committed.

## Human Experience Outcome

- Impact and governing promise or preserved boundary: Direct impact. Repair HX-2 and HX-5. Preserve HX-1, HX-3, HX-4, and HX-6.
- Intended human outcome: A person can review and run setup from a supported legacy Store without being sent between two commands that cannot change the failed condition.
- Human-facing surface or indirect effect: Full setup, direct system setup, compatibility preview and apply, failure output, JSON output, repeat setup, and recovery guidance.
- Implementation work: Setup dependency ordering, direct machine-setup independence, harness-intent commit timing, error classification, recovery-action selection, exact regression fixtures, and installed-package proof.
- Evidence source or testing type selected under current authority: Automated Implementation Testing with an exact legacy-Store and drifted-machine fixture, isolated installed-package workflows, and Human Experience Review.
- Executor: Setup and compatibility owner implements. Store, harness, platform, and validation owners review their boundaries.
- Accepted obligation or deferral route: None. The phase cannot close with a deferred command loop, partial intent ambiguity, or reduced platform scope.

Authority: [Human Experience Contract](../../../.make-docs/system/contracts/human-experience-contract.md), [PRD 07](../../prd/07-cli-command-surface-and-lifecycle.md), [PRD 18](../../prd/18-compatibility-classification-and-migration-safety.md), [PRD 38](../../prd/38-global-store-and-project-state.md), and [PRD 39](../../prd/39-cli-command-model-and-operation-registry.md).

## Current Testing Decisions

| Testing type | Current decision | Decision record or `not-needed-now` reason |
| --- | --- | --- |
| Automated Implementation Testing | Required; blocking | The exact source and installed state must prove ordering, intent safety, recovery output, repeat behavior, and preservation. |
| Performance Testing | `not-needed-now` | No accepted performance target or current decision depends on setup duration. |
| Guided Progress Review | Required before implementation start; useful for final output | The owner requested a discussion of how the bounded repair will be implemented. This gate blocks P7 runtime work only. Final review can correct output meaning before closeout. |
| Unassisted Goal Testing | `not-needed-now` | Deterministic state assertions and installed workflow evidence can answer the current recovery question. |

Human Experience Review is separate. Inspect the real installed preview, blocked, failed, resumed, successful, and repeated results. Record the visible state, next action, recovery path, observations, conclusions, and limits. No explicit human acceptance gate applies unless the owner later creates one.

Performance evidence lifecycle fields:

- Base maintenance action: `none`
- Performance applicability: `not-needed`
- Canonical `PERF-###` profile link or `none`: None
- Finite evidence budget and stop-rule reference or `not-applicable`: Not applicable
- Execution packet link or `not-applicable`: Not applicable
- Outcome and evidence handoff or `none`: None
- Gate disposition and supported-scope limit or `not-applicable`: Not applicable

## Source PRD Docs

- [03 Open Questions and Risk Register](../../prd/03-open-questions-and-risk-register.md#d-038-setup-and-store-access-form-a-closed-recovery-loop)
- [07 CLI Command Surface and Lifecycle](../../prd/07-cli-command-surface-and-lifecycle.md#setup-composition-and-store-free-use)
- [10 Packaging, Validation, and Release Reference](../../prd/10-packaging-validation-and-release-reference.md)
- [16 Package Runtime and Deployment Boundaries](../../prd/16-package-runtime-and-deployment-boundaries.md)
- [18 Compatibility Classification and Migration Safety](../../prd/18-compatibility-classification-and-migration-safety.md#compatibility-bridge-contract)
- [28 Shared Agentics Installation and Harness Exposure](../../prd/28-shared-agentics-installation-and-harness-exposure.md)
- [38 Global Store and Project State](../../prd/38-global-store-and-project-state.md#transfer-and-recovery-r-xfer)
- [39 CLI Command Model and Operation Registry](../../prd/39-cli-command-model-and-operation-registry.md#setup-command-contract-r-setup)

## Source Obligations, Scenarios, And Findings

- Reopened finding: [D-038 Setup and Store Access Form a Closed Recovery Loop](../../prd/03-open-questions-and-risk-register.md#d-038-setup-and-store-access-form-a-closed-recovery-loop).
- Accepted obligations: none.
- Activated Unassisted Goal Test scenarios: none.

## Stage 1 - Reproduce and Repair the Closed Loop

### Tasks

- [ ] t1: Build an isolated fixture that reproduces the reported state with a supported schema 3 Store, a drifted managed Codex MCP entry, a newly selected Claude Code MCP method, and reviewed project work. Record the pre-fix command loop as regression evidence.
- [ ] t2: Make full setup treat the reviewed Store bridge as a named prerequisite for each Store-backed machine step. Apply and verify the bridge before the dependent machine step.
- [ ] t3: Keep direct system setup machine-level and callable without the Store or MCP route that it creates or repairs. Do not make system setup an owner of project Store migration.
- [ ] t4: Persist new harness intent only after its required prerequisite and owned machine change can complete. Preserve prior intent or return an explicit, recorded, and resumable partial result on failure.
- [ ] t5: Classify setup failures by the failed condition. Return one action that can change that condition. Reject reciprocal directions between full setup and system setup.
- [ ] t6: Preserve separate machine and project approvals, Store backup and journal rules, user files, changed native entries, and Store-free work.
- [ ] t7: Add focused human and JSON regression cases for preview, success, failure, interruption, repeat, and no-op behavior.
- [ ] t8: Run the focused setup, Store, migration, harness, CLI, JSON, MCP, and operation-boundary tests plus TypeScript and diff checks.

### Acceptance criteria

- A45: The exact isolated pre-fix fixture reproduces the reciprocal setup and system-setup directions without using the owner's real Store.
- A46: Full setup applies and verifies the reviewed Store bridge before any dependent Store-backed machine step, then continues only through separately approved and verified machine and project work.
- A47: Direct system setup creates or repairs the reviewed machine route without depending on a current Store or working MCP route and without taking ownership of project Store migration.
- A48: A failed prerequisite or machine apply does not leave unfulfilled new harness intent, unreviewed project changes, hidden native changes, or an unexplained pending operation.
- A49: Human and JSON results name the failed action, current state, and one action that can change the condition. No result directs two unchanged commands back to each other.

### Dependencies

- P1 through P6 accepted authority and implementation remain available as the baseline.
- D-038 is open for this exact corrective scope.
- The owner must review the implementation approach and separately authorize runtime implementation before t1 starts.
- Concurrent W23 changes are protected and must not be reverted or included in the P7 commit.

### Closeout Notes

- Four testing decisions: Automated Implementation Testing required; Guided Progress Review required before implementation start; Performance and Unassisted Goal Testing `not-needed-now`.
- Performance evidence: None. No performance target or executable profile applies.
- Human Experience Review: Record installed observations and conclusions for HX-2 and HX-5. Confirm that HX-1, HX-3, HX-4, and HX-6 remain within their accepted boundaries.
- Optional experience handoff: After installed proof, offer one bounded retry of the normal setup path and state what to notice. The owner can decline without blocking closure.
- Explicit human acceptance gate: None for phase closeout. Separate owner authority is required only to start runtime implementation and any later live-Store verification.
- Evidence report: Add a P7 section to `evidence.md` after implementation evidence exists. Link the exact fixture, source results, package identity, platform runs, and Human Experience Review.
- Phase / capability status: P7 is active. Implementation has not started.

## Stage 2 - Installed Package Proof and Corrective Closeout

### Tasks

- [ ] t9: Build one exact package candidate after all required source checks pass. Record its package identity, digest, size, and source commit.
- [ ] t10: Install the same candidate into isolated Windows, macOS, and Linux environments with the source checkout unavailable to product execution.
- [ ] t11: Run the exact legacy-Store and drifted-machine regression contract on every host. Include full setup, direct system setup, failure, interruption, repeat, and no-op cases.
- [ ] t12: Compare the three runs and reject a missing host, repeated host, candidate mismatch, source execution, extract-only proof, or different public result.
- [ ] t13: Complete the Human Experience Review from the installed output. Record observations, conclusions, evidence limits, and next actions for HX-2 and HX-5.
- [ ] t14: Run the coverage pass, full source suite, default validation, package smoke checks, PRD authority validation, links, path hygiene, and `git diff --check`.
- [ ] t15: Update the P7 evidence record and close D-038 only after every required case passes. Preserve the prior W19 R8 and W22 P1 through P6 results as historical evidence.

### Acceptance criteria

- A50: Failure, interruption, retry, and repeat setup preserve Store data, project files, user-owned native content, prior intent, and one resumable operation state without duplicate writes or manual cleanup.
- A51: One exact package candidate passes the same source and installed regression contract on Windows, macOS, and Linux with no platform exception or reduced support claim.
- A52: The final evidence closes the exact loop, records a satisfied Human Experience Review within its limits, and supports closing P7 and D-038 without rewriting prior phase history.

### Dependencies

- Stage 1 passes all focused source cases.
- The exact candidate is built after the final P7 source change.
- Push, external workflow execution, publication, release, and live owner-Store verification each remain separately authorized actions.

### Closeout Notes

- Four testing decisions: Record final Automated Implementation Testing and Guided Progress Review results. Performance and Unassisted Goal Testing remain `not-needed-now` unless later authority changes the decision.
- Performance evidence: None.
- Human Experience Review: Link the per-promise installed observations, conclusions, reviewer, evidence, and limits.
- Optional experience handoff: Offer one to three normal-use steps for the repaired setup path. State the expected non-circular result and invite optional feedback.
- Explicit human acceptance gate: None unless the owner creates one before closeout.
- Evidence report: Link the P7 section in `evidence.md` plus the exact cross-platform workflow results.
- Phase / capability status: P7 and W22 remain open until A45 through A52 pass and the owner authorizes closeout.

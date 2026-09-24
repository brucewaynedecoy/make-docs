---
title: "Phase 7: Setup Bridge Order and Recovery Loop Repair"
kind: "work"
status: "draft"
coordinate: "W22 R0 P7"
source:
  type: "prd"
  path: "docs/prd/07-cli-command-surface-and-lifecycle.md"
---

# Phase 7: Setup Bridge Order and Recovery Loop Repair

## Purpose

Repair the complete upgrade path for supported older installations. Plain setup must assess, plan, approve, apply, verify, resume, or restore without a command loop or a normal-use dependency on deep recovery commands.

## Overview

P7 corrects the dependency order in full setup, builds one final plan from predicted post-prerequisite state, completes every safety check before operation creation, requires planner-classifier-executor agreement, preserves direct machine setup independence, delays new harness intent until its owned change can succeed, and keeps normal resume or restore in plain setup. It proves both reported installed failures with authentic supported older-package fixtures and one exact installed package on Windows, macOS, and Linux.

P7 is closed. P1 through P6 remain completed records for their exact prior evidence. The final P7 and P8 candidate passed the comparable three-platform installed-package workflow. The live Make Docs and North Atlantic BuildOS results proved that unrelated project work no longer blocks the current target and that plain setup can finish without deep-command recovery.

## Human Experience Outcome

- Impact and governing promise or preserved boundary: Direct impact. Repair HX-2 and HX-5. Preserve HX-1, HX-3, HX-4, and HX-6.
- Intended human outcome: A person can run plain setup from a supported older installation, approve one plan that the executor can apply, and use setup itself to resume or restore an interrupted operation.
- Human-facing surface or indirect effect: Full setup, direct system setup, compatibility preview and apply, project approval, failure output, JSON output, pending-operation handling, repeat setup, and recovery guidance.
- Implementation work: Predicted post-prerequisite planning, complete preflight before operation creation, planner-classifier-executor agreement, setup-level resume or restore, direct machine-setup independence, harness-intent commit timing, error classification, authentic legacy-package fixtures, and installed-package proof.
- Evidence source or testing type selected under current authority: Automated Implementation Testing with the checkpoint-3 regression, authentic supported older-package fixtures, isolated installed-package workflows, and Human Experience Review.
- Executor: Setup and compatibility owner implements. Store, harness, platform, and validation owners review their boundaries.
- Accepted obligation or deferral route: None. The phase cannot close with a deferred command loop, partial intent ambiguity, or reduced platform scope.

Authority: [Human Experience Contract](../../../.make-docs/system/contracts/human-experience-contract.md), [PRD 07](../../prd/07-cli-command-surface-and-lifecycle.md), [PRD 18](../../prd/18-compatibility-classification-and-migration-safety.md), [PRD 38](../../prd/38-global-store-and-project-state.md), and [PRD 39](../../prd/39-cli-command-model-and-operation-registry.md).

## Current Testing Decisions

| Testing type | Current decision | Decision record or `not-needed-now` reason |
| --- | --- | --- |
| Automated Implementation Testing | Passed | The exact cross-project, computer-replan, current-target guidance, prompt, source, and installed-package checks pass. One final candidate passed on Windows, macOS, and Linux. |
| Performance Testing | `not-needed-now` | No accepted performance target or current decision depends on setup duration. |
| Guided Progress Review | Passed | The review found and closed approval-order, migration backup preflight, one-recovery guard, post-import recovery routing, JSON mutation-state, retired-resource, cross-project Store isolation, and computer-review gaps. |
| Unassisted Goal Testing | `not-needed-now` | Deterministic state assertions and installed workflow evidence can answer the current recovery question. |

Human Experience Review is separate. The source, installed-package, and live setup results support HX-2 and HX-5 within the recorded limits. The owner approved phase closeout on 2026-09-23. No separate human acceptance gate applied.

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
- Installed counterevidence: after rollback reported a ready installation, plain setup classified the project as `partial-install`, offered `migrate-with-review`, showed one planned skip after 108 checks, received approval, rejected the same work at checkpoint 3 as `ambiguous-ownership`, and created pending operation `9b687b36-5394-4bae-879e-416937eaa33d`.
- Audit finding: the planner can call a path current while the frozen migration classifier calls its older-manifest ownership ambiguous. A test expected this dead end. Operation creation occurred before the predictable rejection.
- Latest installed counterevidence: after plain setup restored the current project operation, the owner approved both reviewed plans. Machine setup then stopped on a pending operation from a different checkout. The current target read back as `ready` with no pending operation. The shared machine guard used Store-wide project-operation and project-lock checks instead of current-target checks.
- Latest human wording finding: the computer approval prompt said `Apply the reviewed This computer changes?`. The accepted wording is `Apply the reviewed changes to this computer?`.
- Accepted obligations: none.
- Activated Unassisted Goal Test scenarios: none.

## Stage 1 - Reproduce and Repair the Closed Loop

### Tasks

- [x] t1: Build three authentic fixtures from supported older Make Docs packages. Reproduce the reciprocal setup loop and the later `partial-install` approval, checkpoint-3 `ambiguous-ownership` rejection, and pending-operation creation without using the owner's live Store.
- [x] t2: Make full setup predict and verify the result of each approved prerequisite. Build one final project plan from that post-prerequisite state. Rebuild the plan before approval if the verified state changes.
- [x] t3: Run ownership classification, migration admission, migration backup destination, native safety, approval, stale-state, and operation checks against the final plan before operation creation or the first durable write. Prove that a regular file at `.make-docs/backup` creates no pending operation.
- [x] t4: Make the planner, compatibility classifier, migration coordinator, and executor agree on one reviewed action and result for every managed path. Do not offer approval for a plan that a later checkpoint will reject.
- [x] t5: Make plain setup detect an interrupted operation and offer its valid resume or restore action. Keep `project state recover` as a support and automation control, not a normal upgrade step. Reject reciprocal or condition-preserving directions.
- [x] t6: Preserve direct system setup independence, separate machine and project approvals, harness-intent timing, Store backup and journal rules, user files, changed native entries, Store-free work, and equal Windows, macOS, and Linux support.
- [x] t7: Replace the test that expects the checkpoint-3 dead end with a regression for the required result. Add migration backup preflight, fail-closed retired-resource, human, and JSON cases for preview, block-before-write, success, failure, interruption, resume, restore, repeat, and no-op behavior.
- [x] t8: Make the regressions pass. Run the focused setup, Store, migration, harness, CLI, JSON, MCP, and operation-boundary tests plus TypeScript and diff checks. Record the earlier passing results as incomplete history, not current acceptance.

### Acceptance criteria

- A45: Authentic supported older-package fixtures reproduce both installed failures. The second fixture reaches reviewed `partial-install`, receives approval, then proves the pre-fix checkpoint-3 `ambiguous-ownership` rejection and pending-operation creation without using the owner's live Store.
- A46: Preview computes one final project plan from predicted post-prerequisite state. The approved plan and executed plan have the same managed-path actions and results. Preview changes no durable state.
- A47: Every predictable Store, ownership, migration, native, approval, stale-state, and operation check passes before operation creation. A blocked plan creates no pending operation and changes no Store, project, intent, or native file.
- A48: For every managed path, the planner, compatibility classifier, migration coordinator, and executor agree on the reviewed action and result. Setup never offers approval for work that a later checkpoint is designed to reject.
- A49: Plain setup shows clear complete, blocked, pending, resumed, restored, and failed states. It offers one action that changes the condition. A normal supported upgrade needs no deep recovery command and no reciprocal command loop.

### Dependencies

- P1 through P6 accepted authority and implementation remain available as the baseline.
- D-038 is open for this exact corrective scope.
- Three authentic older-package fixtures and corrected Stage 1 validation pass.
- Concurrent W23 changes are protected and must not be reverted or included in the P7 commit.

### Closeout Notes

- Four testing decisions: Automated Implementation Testing and Guided Progress Review pass for the Stage 1 source boundary. Stage 2 installed proof remains blocking. Performance and Unassisted Goal Testing remain `not-needed-now`.
- Performance evidence: None. No performance target or executable profile applies.
- Human Experience Review: Stage 1 source results support HX-2 and HX-5 within the isolated source boundary. Exact installed three-platform observations remain a Stage 2 gate.
- Optional experience handoff: After installed proof, offer one bounded retry of the normal setup path and state what to notice. The owner can decline without blocking closure.
- Explicit human acceptance gate: None for phase closeout. Any later live-Store verification remains a separate action.
- Evidence report: The P7 section in `evidence.md` preserves the earlier incomplete results, installed counterevidence, interim review gaps, exact authentic-package identities, and final Stage 1 result.
- Phase / capability status: Stage 1 tasks t1 through t8 and A45 through A49 are complete. P7 and D-038 remain open for Stage 2 tasks t9 through t15 and A50 through A52.

## Stage 2 - Installed Package Proof and Corrective Closeout

### Tasks

- [x] t9: Build one exact package candidate after all required source checks pass. Record its package identity, digest, size, and source commit.
- [x] t10: Install the same candidate into isolated Windows, macOS, and Linux environments with the source checkout unavailable to product execution.
- [x] t11: Run the authentic supported older-package regression contract on every host. Include full setup, direct system setup, block-before-write, failure, interruption, resume, restore, repeat, no-op, and normal-operation-without-deep-recovery cases.
- [x] t12: Compare the three runs and reject a missing host, repeated host, candidate mismatch, source execution, extract-only proof, or different public result.
- [x] t13: Complete the Human Experience Review from the installed output. Record observations, conclusions, evidence limits, and next actions for HX-2 and HX-5.
- [x] t14: Run the coverage pass, full source suite, default validation, package smoke checks, PRD authority validation, links, path hygiene, and `git diff --check`.
- [x] t15: Update the P7 evidence record and close D-038 only after every required case passes. Preserve the prior W19 R8 and W22 P1 through P6 results as historical evidence.

### Acceptance criteria

- A50: Failure, interruption, retry, and repeat setup preserve Store data, project files, user-owned native content, prior intent, and one resumable operation state without duplicate writes or manual cleanup.
- A51: One exact package candidate passes the same source and installed regression contract on Windows, macOS, and Linux with no platform exception or reduced support claim.
- A52: The final evidence closes the exact loop, records a satisfied Human Experience Review within its limits, and supports closing P7 and D-038 without rewriting prior phase history.

### Dependencies

- Stage 1 passed A45 through A49 with the corrected source and three authentic older-package cases.
- The exact candidate is built after the final P7 source change.
- Push, external workflow execution, publication, release, and live owner-Store verification each remain separately authorized actions.

### Closeout Notes

- Four testing decisions: Automated Implementation Testing and Guided Progress Review passed. Performance and Unassisted Goal Testing remain `not-needed-now`.
- Performance evidence: None.
- Human Experience Review: The central evidence records the installed and live observations, conclusions, evidence, and limits for HX-2 and HX-5.
- Optional experience handoff: Offer one to three normal-use steps for the repaired setup path. State the expected non-circular result and invite optional feedback.
- Explicit human acceptance gate: None unless the owner creates one before closeout.
- Evidence report: The P7 section in `evidence.md` links the final exact candidate, three-platform workflow, live Make Docs result, and North Atlantic result.
- Phase / capability status: A50 through A52 pass. The owner authorized closeout on 2026-09-23. P7 and D-038 are closed. W22 remains open for its revision-level closeout.

## Stage 3 - Cross-Project Store Isolation And Live Acceptance Repair

### Tasks

- [x] t16: Record the live `2.0.1` counterevidence. Prove that the pending operation belongs to a different checkout while the current target is `ready` with no pending operation.
- [x] t17: Scope installation-operation and project-lock conflicts to the exact target checkout. Keep machine-wide tool operations global. Preserve the unrelated project operation without change.
- [x] t18: Rebuild the computer plan after the Store prerequisite. Show and reapprove a changed computer review. Read the current target before recovery guidance. Use the approved computer prompt wording.
- [x] t19: Add the exact combined plain-setup regression plus focused component tests. Pass the full repository test command, package build, and diff check.
- [x] t20: Build one new exact package candidate. Run the comparable Windows, macOS, and Linux installed workflow. Then install that exact candidate and repeat plain `make-docs setup` against the live Make Docs project.

### Acceptance criteria

- A53: A pending operation or project lock for another checkout does not block machine setup for the current target. The unrelated operation remains present and recoverable.
- A54: A Store state change cannot leave machine setup with a stale plan. A changed computer review is shown and approved again before native changes.
- A55: Recovery guidance names the current target state. A ready target with no pending operation is not directed to project-state recovery. The computer prompt reads `Apply the reviewed changes to this computer?`.
- A56: One exact repaired package passes the installed workflow on Windows, macOS, and Linux. The same candidate then completes the live Make Docs setup path without cross-project interference or deep-command recovery.

### Dependencies

- The owner approved reopening P7 and implementing this bounded repair.
- The unrelated checkout and its pending operation remain outside this repair and must not change.
- Staging, commit, push, pull-request work, installation, live setup, and closeout remain separate actions unless the owner authorizes them.

### Current Result

Tasks t16 through t20 and A53 through A56 pass. Platform Safety run [35932516304](https://github.com/brucewaynedecoy/make-docs/actions/runs/35932516304) passed the source contract, one exact package build, installed-package proof on Ubuntu, macOS, and Windows, and final evidence comparison. The live setup results completed without cross-project interference or deep-command recovery. P7 and D-038 are closed. The central evidence records the live-run limit that the final North Atlantic check began from an already-current `2.0.1` project state.

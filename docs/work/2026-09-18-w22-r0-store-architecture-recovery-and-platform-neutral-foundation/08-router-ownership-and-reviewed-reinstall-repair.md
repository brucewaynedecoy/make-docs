---
title: "Phase 8: Router Ownership and Reviewed Reinstall Repair"
kind: "work"
status: "active"
coordinate: "W22 R0 P8"
source:
  type: "prd"
  path: "docs/prd/18-compatibility-classification-and-migration-safety.md"
---

# Phase 8: Router Ownership and Reviewed Reinstall Repair

## Purpose

Make plain setup complete a reviewed reinstall after a verified project removal. Scope ownership checks to active planned targets. Preserve unrelated routers, shared-router user content, and backup evidence.

## Overview

P8 repairs the defect found during the North Atlantic BuildOS acceptance test. The current CLI scans router names across the repository, including its own backup tree and unrelated BuildOS control files. After a successful reviewed removal, it then requires a `backup-and-reinstall` path that the public CLI does not expose.

P8 uses the completed removal operation and verified backup as the handoff into a new reviewed setup plan for the same project and checkout. It does not add a broad reset or force command. P7 remains open, and its live acceptance path resumes only after P8 passes its source, package, and isolated installed gates.

## Human Experience Outcome

- Impact and governing promise or preserved boundary: Direct impact. Extend HX-2 and HX-5. Preserve HX-1, HX-3, HX-4, and HX-6.
- Intended human outcome: A person can recover from a reviewed removal by running plain setup. Valid project routers remain in place. The person sees which Make Docs blocks will change and receives one action that can complete the install.
- Human-facing surface or indirect effect: Compatibility review, router conflict review, removal result, repeat setup, reinstall preview, setup apply, blocked output, JSON output, and final status.
- Implementation work: Active-surface filtering, target-scoped router ownership, managed-block mutation, completed-removal handoff, Store evidence continuity, plain-setup replanning, isolated fixtures, package proof, and live-project proof.
- Evidence source or testing type selected under current authority: Automated Implementation Testing, exact installed-package workflows, Guided Progress Review of public output, and Human Experience Review.
- Executor: Compatibility and setup owners implement. Store, router, platform, and validation owners review their boundaries.
- Accepted obligation or deferral route: None. P8 cannot close while plain setup requires an unavailable command, unrelated router quarantine, manual Store edits, or loss of project-owned bytes.

Authority: [Human Experience Contract](../../../.make-docs/system/contracts/human-experience-contract.md), [PRD 18](../../prd/18-compatibility-classification-and-migration-safety.md), [PRD 38](../../prd/38-global-store-and-project-state.md), [PRD 39](../../prd/39-cli-command-model-and-operation-registry.md), and [D-038](../../prd/03-open-questions-and-risk-register.md#d-038-setup-and-store-access-form-a-closed-recovery-loop).

## Current Testing Decisions

| Testing type | Current decision | Decision record or `not-needed-now` reason |
| --- | --- | --- |
| Automated Implementation Testing | Required and blocking | Source, Store, compatibility, setup, router, JSON, installed-package, and repeat-setup cases must pass. |
| Performance Testing | `not-needed-now` | No accepted performance target or current decision depends on scan or setup duration. |
| Guided Progress Review | Required for the public flow | Review the real preview, approval, blocked, success, and repeat outputs before package acceptance. |
| Unassisted Goal Testing | `not-needed-now` | The exact deterministic state and installed-project contract can answer this recovery question. |

Human Experience Review is separate. It must inspect the real installed flow and record observations, conclusions, limits, and next actions for HX-2 and HX-5. No explicit human acceptance gate applies unless the owner later creates one.

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
- [18 Compatibility Classification and Migration Safety](../../prd/18-compatibility-classification-and-migration-safety.md)
- [38 Global Store and Project State](../../prd/38-global-store-and-project-state.md#transfer-and-recovery-r-xfer)
- [39 CLI Command Model and Operation Registry](../../prd/39-cli-command-model-and-operation-registry.md#setup-command-contract-r-setup)

## Source Evidence And Boundaries

- The first North Atlantic BuildOS apply reviewed router conflicts and then failed as `ambiguous-ownership` without changing the project or Store.
- The reviewed removal deleted 67 manifest-owned files, preserved 12 project-owned paths, and created 67 verified backup copies.
- The Store retained project `423f49d6-c28d-4ba5-b99f-3049a31efcb8`, checkout `ff0e0216-fd25-4b5e-b896-aa63beed415d`, completed removal operation `6c484c3a-007f-4e18-a0a8-0b57abdb9bcb`, no pending operation, and no project lock.
- Plain setup then treated 52 backup router files and 36 unrelated active BuildOS router files as ownership collisions and required an unavailable explicit `backup-and-reinstall` flow.
- The backup exactly matches the 67 removed Git `HEAD` files. No project content is known lost.
- The live North Atlantic BuildOS project and its backup remain outside source implementation and isolated tests. A later live apply requires separate owner approval.

## Stage 1 - Ownership Scope And Reinstall Core

### Tasks

- [x] t1: Build an isolated fixture from the exact completed-removal state. Include the same project and checkout identities, completed operation, verified backup index, preserved target routers, backup router files, and unrelated active BuildOS routers.
- [x] t2: Exclude `.make-docs/backup/**` and declared inactive backup, export, and archive roots from active compatibility discovery without weakening backup verification or rollback.
- [x] t3: Limit router ownership review to exact paths the plan can create, change, or remove. Preserve non-target routers. Treat target routers as project-owned containers and mutate only exact Make Docs managed blocks.
- [x] t4: Make malformed or contradictory target markers fail before operation creation. Show missing-block insertion as an explicit action. Preserve every byte outside the managed block.
- [x] t5: Use the completed removal operation, removed and preserved ledgers, verified backup index, digests, and checkout binding as trusted input to a new reviewed install plan. Retain the project and checkout identities.
- [x] t6: Make plain setup expose and apply that plan without a hidden command, manual Store edit, or unrelated-router quarantine. Add human and JSON cases for preview, block, apply, interruption, recovery, repeat, and no-op results.
- [x] t7: Run focused and full source tests, TypeScript checks, package build, default validation, PRD authority validation, links, path hygiene, and `git diff --check`. Complete a read-only corrective review.

### Acceptance criteria

- A57: Active discovery excludes backup copies and unrelated non-target routers. It still classifies every path that the reviewed plan can change.
- A58: Shared target routers remain project-owned. Setup changes only the exact reviewed Make Docs block and preserves all other bytes. Malformed target markers stop before operation creation with one safe next action.
- A59: A completed reviewed removal with verified backup evidence can continue through plain setup under the same project and checkout identities. The flow needs no unavailable command, manual database edit, or movement of unrelated project routers.
- A60: Preview and blocked results write nothing. Failure and interruption preserve the completed removal evidence, backup, project content, Store integrity, and one safe continuation.

### Dependencies

- The owner approved P8 Stage 1 implementation on 2026-09-23.
- P7 and D-038 remain open.
- The North Atlantic BuildOS live project stays unchanged during source and isolated fixture work.
- Existing Store, backup, rollback, user-content, path, symlink, and platform safety rules remain in force.

### Closeout Notes

- Four testing decisions: Automated Implementation Testing and Guided Progress Review are required. Performance and Unassisted Goal Testing are `not-needed-now`.
- Performance evidence: None.
- Human Experience Review: Stage 1 can support only the isolated source boundary. Installed output remains a Stage 2 gate.
- Optional experience handoff: Not applicable before installed proof.
- Explicit human acceptance gate: None for source implementation. Live project apply remains a separately approved action.
- Evidence report: Add one P8 section to the central `evidence.md` record.
- Phase / capability status: Stage 1 passes in source. Stage 2 and phase closeout remain open.

## Stage 2 - Exact Package And Live Project Proof

### Tasks

- [ ] t8: Build one exact package candidate after Stage 1 passes. Record the source commit, package identity, digest, and size.
- [ ] t9: Install the same candidate on Windows, macOS, and Linux with the source checkout unavailable. Run the completed-removal, router-ownership, plain-reinstall, blocked, interrupted, recovery, repeat, and no-op contract on each host.
- [ ] t10: Compare the three runs. Reject a missing host, repeated host, candidate mismatch, source execution, extract-only proof, different ownership result, or unavailable public recovery path.
- [ ] t11: After separate owner approval, install the exact accepted candidate and run plain setup against the current North Atlantic BuildOS removed state. Preserve the backup and all BuildOS-owned router content.
- [ ] t12: Verify Store and project results. Run immediate repeat setup. Complete Human Experience Review, coverage, evidence, and corrective review. Return P7 to its remaining acceptance and closeout gates.

### Acceptance criteria

- A61: One exact candidate passes the same installed contract on Windows, macOS, and Linux with no platform exception or reduced ownership rule.
- A62: The approved live candidate completes North Atlantic BuildOS setup from the current removed state. It preserves the 67-file backup, every BuildOS-owned router byte outside reviewed Make Docs blocks, the existing project and checkout identities, and no pending operation. Immediate repeat setup is a no-op or a truthful current-state review.

### Dependencies

- Stage 1 passes A57 through A60.
- The exact candidate is built after the final P8 source change.
- Push, pull-request workflow execution, local CLI installation, live North Atlantic BuildOS apply, closeout, publication, and release remain separately gated actions.

### Closeout Notes

- Four testing decisions: Record final Automated Implementation Testing and Guided Progress Review results. Performance and Unassisted Goal Testing remain `not-needed-now` unless later authority changes them.
- Performance evidence: None.
- Human Experience Review: Link per-promise observations, conclusions, reviewer, evidence, and limits from the installed output.
- Optional experience handoff: Offer plain setup as the normal path. State what preserved router content and completed Store state should look like. Invite optional feedback.
- Explicit human acceptance gate: None unless the owner creates one before the live run.
- Evidence report: Link the P8 central evidence section and exact three-platform workflow.
- Phase / capability status: P8, P7, D-038, and W22 remain open until A57 through A62 pass and the owner authorizes closeout.

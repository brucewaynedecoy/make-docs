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

Repair the missing direct upgrade path for authentic schema-1 routers whose exact legacy manifest hashes match but whose files predate V2 managed-block markers.

## Overview

P8 repairs the defect found during the North Atlantic BuildOS acceptance test. The current CLI scans router names across the repository, including its own backup tree and unrelated BuildOS control files. After a successful reviewed removal, it then requires a `backup-and-reinstall` path that the public CLI does not expose.

P8 uses the completed removal operation and verified backup as the handoff into a new reviewed setup plan for the same project and checkout. It does not add a broad reset or force command. The prior P8 scope closed after source proof, one exact three-platform installed-package result, and the approved live North Atlantic BuildOS setup result.

Videos Matter reopened P8 on 2026-09-24. Its schema-1 manifest and exact whole-file router hashes are authentic legacy evidence. Setup treats the missing V2 markers as malformed and stops as `ambiguous-ownership`. Stage 4 owns this bounded defect. The owner approved this authority and backlog update. Implementation is not yet authorized.

## Human Experience Outcome

- Impact and governing promise or preserved boundary: Direct impact. Extend HX-2 and HX-5. Preserve HX-1, HX-3, HX-4, and HX-6.
- Intended human outcome: A person can recover from a reviewed removal by running plain setup. Valid project routers remain in place. The person sees which Make Docs blocks will change and receives one action that can complete the install.
- Human-facing surface or indirect effect: Compatibility review, router conflict review, removal result, repeat setup, reinstall preview, setup apply, blocked output, JSON output, and final status.
- Implementation work: Active-surface filtering, target-scoped router ownership, managed-block mutation, completed-removal handoff, Store evidence continuity, plain-setup replanning, isolated fixtures, package proof, and live-project proof.
- Evidence source or testing type selected under current authority: Automated Implementation Testing, exact installed-package workflows, Guided Progress Review of public output, and Human Experience Review.
- Executor: Compatibility and setup owners implement. Store, router, platform, and validation owners review their boundaries.
- Accepted obligation or deferral route: None. P8 cannot close while plain setup requires an unavailable command, unrelated router quarantine, manual Store edits, or loss of project-owned bytes.

Authority: [Human Experience Contract](../../../.make-docs/system/contracts/human-experience-contract.md), [PRD 18](../../prd/18-compatibility-classification-and-migration-safety.md), [PRD 24](../../prd/24-project-configuration-and-convention-overlay.md#resource-selection-and-applied-ownership), [PRD 38](../../prd/38-global-store-and-project-state.md), [PRD 39](../../prd/39-cli-command-model-and-operation-registry.md), and [D-038](../../prd/03-open-questions-and-risk-register.md#d-038-setup-and-store-access-form-a-closed-recovery-loop).

## Current Testing Decisions

| Testing type | Current decision | Decision record or `not-needed-now` reason |
| --- | --- | --- |
| Automated Implementation Testing | Passed | Source, Store, compatibility, setup, router, JSON, installed-package, and repeat-setup cases pass. |
| Performance Testing | `not-needed-now` | No accepted performance target or current decision depends on scan or setup duration. |
| Guided Progress Review | Passed | The review covered the real preview, approval, blocked, success, and repeat outputs before closeout. |
| Unassisted Goal Testing | `not-needed-now` | The exact deterministic state and installed-project contract can answer this recovery question. |

Human Experience Review is separate. The installed and live results support HX-2 and HX-5 within the recorded limits. The owner approved phase closeout on 2026-09-23. No separate human acceptance gate applied.

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
- [24 Project Configuration and Convention Overlay](../../prd/24-project-configuration-and-convention-overlay.md#resource-selection-and-applied-ownership)
- [38 Global Store and Project State](../../prd/38-global-store-and-project-state.md#transfer-and-recovery-r-xfer)
- [39 CLI Command Model and Operation Registry](../../prd/39-cli-command-model-and-operation-registry.md#setup-command-contract-r-setup)

## Source Evidence And Boundaries

- The first North Atlantic BuildOS apply reviewed router conflicts and then failed as `ambiguous-ownership` without changing the project or Store.
- The reviewed removal deleted 67 manifest-owned files, preserved 12 project-owned paths, and created 67 verified backup copies.
- The Store retained project `423f49d6-c28d-4ba5-b99f-3049a31efcb8`, checkout `ff0e0216-fd25-4b5e-b896-aa63beed415d`, completed removal operation `6c484c3a-007f-4e18-a0a8-0b57abdb9bcb`, no pending operation, and no project lock.
- Plain setup then treated 52 backup router files and 36 unrelated active BuildOS router files as ownership collisions and required an unavailable explicit `backup-and-reinstall` flow.
- The backup exactly matches the 67 removed Git `HEAD` files. No project content is known lost.
- The live North Atlantic BuildOS project and its backup remain outside source implementation and isolated tests. A later live apply requires separate owner approval.
- Videos Matter reports installed version `0.1.0`, schema-1 state, and exact hashes for all 71 manifest-managed files. Its 26 legacy router files predate V2 managed-block markers.
- Compatibility classification rejects those exact legacy routers as malformed before it compares their schema-1 whole-file hashes. Apply then rejects the reviewed `modified-v1` plan as `ambiguous-ownership`.
- The current `modified-v1` fixture installs current V2 files before it changes the manifest schema. It cannot prove the authentic legacy file form.
- Videos Matter Store readback is `ready` with stable project and checkout identities and no pending recovery. This authority update does not retry or change that project.

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
- The owner later approved staging, commit, push, pull-request review, and Stage 2 tasks t8 through t10.
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

- [x] t8: Build one exact package candidate after Stage 1 passes. Record the source commit, package identity, digest, and size.
- [x] t9: Install the same candidate on Windows, macOS, and Linux with the source checkout unavailable. Run the completed-removal, router-ownership, plain-reinstall, blocked, interrupted, recovery, repeat, and no-op contract on each host.
- [x] t10: Compare the three runs. Reject a missing host, repeated host, candidate mismatch, source execution, extract-only proof, different ownership result, or unavailable public recovery path.
- [x] t11: After separate owner approval, install the exact accepted candidate and run plain setup against the current North Atlantic BuildOS removed state. Preserve the backup and all BuildOS-owned router content.
- [x] t12: Verify Store and project results. Run immediate repeat setup. Complete Human Experience Review, coverage, evidence, and corrective review. Return P7 to its remaining acceptance and closeout gates.

### Acceptance criteria

- A61: One exact candidate passes the same installed contract on Windows, macOS, and Linux with no platform exception or reduced ownership rule.
- A62: The approved live candidate completes North Atlantic BuildOS setup from the current removed state. It preserves the 67-file backup, every BuildOS-owned router byte outside reviewed Make Docs blocks, the existing project and checkout identities, and no pending operation. Immediate repeat setup is a no-op or a truthful current-state review.

### Dependencies

- Stage 1 passes A57 through A60.
- The exact candidate is built after the final P8 source change.
- Stage 2 tasks t8 through t10 are approved. Local CLI installation, live North Atlantic BuildOS apply, closeout, publication, and release remain separately gated actions.

### Closeout Notes

- Four testing decisions: Automated Implementation Testing and Guided Progress Review passed. Performance and Unassisted Goal Testing remain `not-needed-now`.
- Performance evidence: None.
- Human Experience Review: The central evidence records the installed and live observations, conclusions, evidence, and limits for HX-2 and HX-5.
- Optional experience handoff: Offer plain setup as the normal path. State what preserved router content and completed Store state should look like. Invite optional feedback.
- Explicit human acceptance gate: None unless the owner creates one before the live run.
- Evidence report: The P8 central evidence section links the final exact candidate, three-platform workflow, and approved live North Atlantic result.
- Phase / capability status: A57 through A62 pass. The owner authorized closeout on 2026-09-23. P8, P7, and D-038 are closed. W22 remains open for its revision-level closeout.

## Stage 3 - Live Acceptance Correction

### Tasks

- [x] t13: Record the live defect. The first repaired setup completed, but it did not retain the prior local resource selection or recreate proved `docs/assets/` routers. A later setup could therefore plan removal of current local resources.
- [x] t14: Recover the prior resource selection only from exact canonical resource records in the verified completed-removal before-ledger. Require an explicit interactive or command-line selection when that evidence is not sufficient. Use the before-manifest as planning authority so setup preserves disabled capabilities and does not classify the reviewed handoff as fresh.
- [x] t15: Let the completed-removal handoff recreate exact on-demand surface routers from proved manifest file records even when removal deleted the former surface directory.
- [x] t16: Extend the authentic schema-3 completed-removal fixture. Prove first-run resource preservation, first-run asset-router creation, unknown-selection refusal, interactive state review for unknown intent, disabled-capability preservation, and an immediate all-no-op repeat.
- [x] t17: Run the focused P8 suite, related authentic-upgrade and projection suites, the general CLI suite, TypeScript, package build, documentation validation, and diff whitespace check against the final reviewed source.
- [x] t18: Build one new exact candidate from the final correction. Repeat the full Windows, macOS, and Linux installed-package contract. Do not merge the open pull request before this proof passes.
- [x] t19: Install that exact accepted candidate. Repeat plain setup and immediate setup in North Atlantic BuildOS. Verify the saved resource selection, surface routers, backup, project and checkout identities, router bytes, Store state, and no pending operation.

### Acceptance criteria

- A63: A verified completed-removal handoff retains the prior local resource selection when exact canonical resource records prove it. Unknown intent stops before mutation until the person makes an explicit selection.
- A64: The first setup recreates every proved planned surface router without using unrelated routers or the deleted directory as ownership evidence. Immediate repeat setup reports no project change and only no-op file actions.
- A65: One new exact candidate passes the three-platform installed contract and the repeated live North Atlantic BuildOS test. The open pull request stays unmerged until this result passes review.

### Dependencies

- The owner approved this additional P8 repair on 2026-09-23.
- The earlier candidate and live run are evidence for the defect. They are not acceptance evidence for A63 through A65.
- Pull-request review of commit `740c7b64` found two remaining selection-continuity defects. The completed-removal before-manifest was not used for fresh-install detection, and unknown resource intent did not force the interactive state-review wizard. The owner approved the bounded source and regression repair.
- Staging, commit, push, a new workflow run, candidate installation, live project mutation, merge, and closeout keep their existing approval gates.

### Closeout Notes

- Four testing decisions: Automated Implementation Testing and Guided Progress Review passed. Performance and Unassisted Goal Testing remain `not-needed-now`.
- Performance evidence: None.
- Human Experience Review: The final installed and live reviews showed one clear setup path, stable project identity, preserved saved intent, and no recovery loop. The final live run began from an already-current `2.0.1` project state, so authentic legacy fixtures remain the evidence for the initial upgrade transition.
- Optional experience handoff: State that plain setup preserves the reviewed local resource set and that immediate repeat should need no project change.
- Explicit human acceptance gate: None. The live run still requires the approved exact-candidate action.
- Evidence report: The P8 section in `evidence.md` records the source correction, final exact candidate, three-platform installed result, live North Atlantic result, and evidence limit.
- Phase / capability status: Stage 3 tasks t13 through t19 and A63 through A65 pass. The owner authorized closeout on 2026-09-23. P8, P7, and D-038 are closed. W22 remains open for its revision-level closeout.

## Stage 4 - Authentic Schema-1 Router Upgrade Repair

### Tasks

- [x] t20: Record the Videos Matter counterevidence. Reopen P8 and D-038. Update PRDs 18 and 39 with the source-schema ownership and one-command upgrade contract.
- [ ] t21: Add an authentic older-package fixture. Use the actual schema-1 manifest form, exact whole-file router hashes, and router bytes without V2 managed-block markers.
- [ ] t22: Make router ownership classification source-schema aware. Trust an exact schema-1 whole-file hash. Treat missing V2 markers as expected only for that exact legacy state.
- [ ] t23: Preserve the hard stop for whole-file hash mismatch and partial, malformed, duplicated, nested, or contradictory V2 markers. A blocked plan must create no operation and change no Store, project, backup, router, or native file.
- [ ] t24: Prove one direct plain-setup upgrade from authentic schema 1 and one immediate all-no-op repeat. Require no removal, reset, manual Store edit, hidden command, or unrelated-router movement.
- [ ] t25: Run the focused compatibility, migration, router, setup, authentic-upgrade, and packed-CLI suites. Run the full CLI suite, TypeScript checks, package build, default validation, PRD authority validation, links, path hygiene, and `git diff --check`.
- [ ] t26: Build one exact package candidate. Record its source commit, package identity, digest, and size. Run the same installed-package contract on Windows, macOS, and Linux with the source checkout unavailable.
- [ ] t27: After separate owner approval, install the exact accepted candidate and run plain setup once in Videos Matter. Verify the direct upgrade, preserved project content, project and checkout identities, Store state, backup evidence, router bytes, and no pending operation. Run immediate repeat setup and require no project change.
- [ ] t28: Complete Human Experience Review, corrective review, evidence, owner acceptance, and P8 and D-038 closeout. Keep W22 revision closeout, publication, and release separate.

### Acceptance criteria

- A66: A supported schema-1 router with an exact manifest whole-file hash is trusted legacy ownership. Missing V2 managed-block markers are expected in that exact state.
- A67: Hash mismatch and partial, malformed, duplicated, nested, or contradictory marker evidence stop before operation creation and preserve all state.
- A68: An authentic older-package fixture completes one reviewed plain-setup upgrade and an immediate all-no-op repeat without a reset, manual Store edit, or second migration command.
- A69: One exact package passes the authentic schema-1 transition contract on Windows, macOS, and Linux with comparable candidate and execution evidence.
- A70: After separate owner approval, the same candidate completes the live Videos Matter upgrade and immediate repeat while preserving project content, identities, backup evidence, and a clean Store state.

### Dependencies

- Depends on the accepted prior P8 target-scoped ownership and reviewed-removal results.
- Depends on PRD 18 R-BRIDGE-7, PRD 39 R-MIG-7 and R-TEST-16, and reopened D-038.
- Depends on separate owner approval before implementation and again before the live Videos Matter install and setup.

### Closeout Notes

- Four testing decisions: Automated Implementation Testing and Guided Progress Review are required. Performance and Unassisted Goal Testing are `not-needed-now`.
- Performance evidence: None.
- Human Experience Review: Required for source, installed, blocked, success, and immediate-repeat output.
- Optional experience handoff: Offer plain setup as the normal path only after the exact installed candidate passes.
- Explicit human acceptance gate: The owner must approve implementation. The live Videos Matter action also requires approval after source and installed gates pass.
- Evidence report: Add the Stage 4 source, exact-candidate, three-platform, and live results to `evidence.md` without replacing prior P8 evidence.
- Phase / capability status: Authority and backlog update approved on 2026-09-24. Task t20 is complete. Tasks t21 through t28 and A66 through A70 are open. Implementation has not started.

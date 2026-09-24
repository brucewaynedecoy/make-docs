---
title: "W22 R0 Store Architecture Recovery and Platform-Neutral Foundation Work Backlog"
kind: "work"
status: "active"
coordinate: "W22 R0"
source:
  type: "prd"
  path: "docs/prd/38-global-store-and-project-state.md"
follow_on:
  route: "implementation-loop"
  next_prompt: "../../../.make-docs/system/references/execution-workflow.md"
  why: "P7 and P8 are closed from the final exact candidate, three-platform installed proof, and approved live setup results. W22 remains open for revision-level closeout."
  coordinate_handoff: "Review the complete W22 R0 evidence and request owner authority before revision closeout, publication, or release."
---

# W22 R0 Store Architecture Recovery and Platform-Neutral Foundation Work Backlog

## Purpose

Provide the execution queue for the [W22 R0 design](../../designs/2026-09-18-store-architecture-recovery-and-platform-neutral-foundation.md) and [plan](../../plans/2026-09-18-w22-r0-store-architecture-recovery-and-platform-neutral-foundation/00-overview.md).

P1 through P8 are completed records for their exact accepted evidence. The owner reopened P7 on 2026-09-22 after the installed `2.0.1` CLI let pending work from another checkout block machine setup for the current target. The final repair corrected that scope and passed its exact installed and live gates.

The repaired CLI completed plain setup in the Make Docs project. The North Atlantic BuildOS acceptance test then found a separate defect. After a reviewed removal, plain setup treated backup routers and unrelated BuildOS routers as active ownership collisions and required a `backup-and-reinstall` flow that the CLI does not expose.

P8 corrected target-scoped router ownership and the reviewed reinstall handoff. The final exact candidate passed the source and installed-package workflow on Ubuntu, macOS, and Windows. The approved live North Atlantic BuildOS setup completed with stable identities, no pending recovery, and no project file change. P7, P8, and D-038 are closed. W22 remains open for its revision-level closeout.

## Human Experience Trace

| Impact or promise | Source design and plan | Owning PRD or preserved boundary | Work phase | Evidence source or selected testing type | Implementation gate | Accepted obligation, if any |
| --- | --- | --- | --- | --- | --- | --- |
| HX-1: equal action meaning and recovery on Windows, macOS, and Linux | [Design](../../designs/2026-09-18-store-architecture-recovery-and-platform-neutral-foundation.md) and [plan](../../plans/2026-09-18-w22-r0-store-architecture-recovery-and-platform-neutral-foundation/00-overview.md) | PRDs 10, 16, 28, and 38 after P2 reconciliation | [P3](03-platform-neutral-filesystem-and-checkout-safety.md), [P6](06-real-platform-package-proof-and-closeout.md), and [P7](07-setup-bridge-order-and-recovery-loop-repair.md) | Automated checks and real-platform installed matrix | A13-A19, A36-A44, and A51-A52 pass | None |
| HX-2: clear state and one next safe action | Same | PRDs 07, 38, and 39 after P2 reconciliation | [P4](04-harness-trust-setup-and-resource-simplification.md), [P6](06-real-platform-package-proof-and-closeout.md), and [P7](07-setup-bridge-order-and-recovery-loop-repair.md) | Output fixtures, installed transcripts, and Human Experience Review | A20-A27, A40-A44, and A45-A52 pass | None |
| HX-3: independent work continues without Store access | Same | PRDs 07, 25, 38, and 39 after P2 reconciliation | [P2](02-product-authority-and-minimal-state-model.md), [P4](04-harness-trust-setup-and-resource-simplification.md), and [P6](06-real-platform-package-proof-and-closeout.md) | Access matrix and installed absent/denied/unavailable cases | A10, A23-A24, and A39 pass | None |
| HX-4: checkout moves and valid package updates do not fail only because low-level identity changed | Same | PRDs 16, 18, 28, and 38 after P2 reconciliation | [P2](02-product-authority-and-minimal-state-model.md), [P3](03-platform-neutral-filesystem-and-checkout-safety.md), and [P5](05-compatibility-bridge-and-symptom-closure.md) | Schema, move, update, and bridge cases | A9, A14-A16, and A28-A35 pass | None |
| HX-5: setup and repair use one open recovery path | Same | PRDs 07, 18, 38, and 39 after P8 authority maintenance | [P4](04-harness-trust-setup-and-resource-simplification.md), [P5](05-compatibility-bridge-and-symptom-closure.md), [P7](07-setup-bridge-order-and-recovery-loop-repair.md), and [P8](08-router-ownership-and-reviewed-reinstall-repair.md) | State-transition tests, interruption/restart proof, exact loop regression, router-preservation proof, three-platform installed proof, and live setup results | A22-A26, A31-A34, and A45-A65 pass. | None |
| HX-6: every retained mechanism has a clear purpose and authority class | Same | PRDs 02, 03, 25, 28, and 38 after P2 reconciliation | [P1](01-architecture-inventory-and-decision-gates.md), [P2](02-product-authority-and-minimal-state-model.md), and [P6](06-real-platform-package-proof-and-closeout.md) | Decision ledger, PRD validation, and final review | A1-A12 and A42 pass | None |

## Phase Map

| Phase | File | Required result |
| --- | --- | --- |
| P1 | [Architecture Inventory and Decision Gates](01-architecture-inventory-and-decision-gates.md) | Complete evidence-based mechanism and symptom ledger with owner-accepted target decisions. |
| P2 | [Product Authority and Minimal State Model](02-product-authority-and-minimal-state-model.md) | Current PRDs state one accepted minimal architecture and migration boundary. |
| P3 | [Platform-Neutral Filesystem and Checkout Safety](03-platform-neutral-filesystem-and-checkout-safety.md) | One bounded platform layer and no durable low-level file identity. |
| P4 | [Harness Trust, Setup, and Resource Simplification](04-harness-trust-setup-and-resource-simplification.md) | Separate trust concerns, thin setup, one recovery path, and minimal projection state. |
| P5 | [Compatibility Bridge and Symptom Closure](05-compatibility-bridge-and-symptom-closure.md) | Safe conversion or quarantine for supported old state and close evidence for every symptom. |
| P6 | [Real Platform Package Proof and Closeout](06-real-platform-package-proof-and-closeout.md) | One package passes comparable installed cases on Windows, macOS, and Linux. |
| P7 | [Setup Bridge Order and Recovery Loop Repair](07-setup-bridge-order-and-recovery-loop-repair.md) | Plain setup uses one final post-prerequisite plan, passes every safety check before operation creation, and provides normal resume or restore without deep recovery commands. |
| P8 | [Router Ownership and Reviewed Reinstall Repair](08-router-ownership-and-reviewed-reinstall-repair.md) | Plain setup scopes router ownership to active planned targets and continues a completed reviewed removal under the same project and checkout identities. |

## Usage Notes

- P1 through P8 are completed records for their exact evidence. Preserve the rejected candidates and failed live attempts as historical evidence.
- The source, isolated fixture, exact package, installed, and approved live North Atlantic BuildOS gates passed for P7 and P8.
- Keep the P8 closeout bound to the recorded exact candidate and its Ubuntu, macOS, Windows, and live-project evidence.
- Recheck branch, HEAD, dirty files, disk, indexes, installed CLI, and relevant Store state before each phase. Preserve concurrent edits.
- Never create or switch a branch or worktree without explicit user permission.
- Preserve the affected real project, its completed removal evidence, and its backup as accepted live evidence.
- Maintain one P1 decision ledger and one P5 symptom table. Do not create competing lists.
- Use one central `evidence.md`. Keep the installed counterevidence, interim review gaps, corrected Stage 1 result, and later Stage 2 evidence in that record.
- Automated Implementation Testing is required for implementation phases. Performance Testing is `not-needed-now`. Guided Progress Review is selected only where it can change a decision. Unassisted Goal Testing is `not-needed-now` until a real normal-use discoverability question and a qualified separate executor exist.
- Human Experience Review is separate from the four testing types. The agent prepares it from real results. Owner feedback is optional unless later accepted authority defines a specific gate.
- No `O-###`, `NUAT-###`, or `PERF-###` record is active for P7. Create no placeholder ID.
- P7 and P8 are explicit corrective phases based on new installed evidence. Their closeout does not rewrite prior phase history or hide a partial result.
- Keep a broad reset, detach, quarantine, forced reinstall, or repository-cleaning capability outside P7 and P8 unless the owner separately approves that product choice.

## Intended Follow-On

- Route: `implementation-loop`
- Next step: Review the complete W22 R0 evidence before any revision-level closeout.
- Next Prompt: [execution-workflow.md](../../../.make-docs/system/references/execution-workflow.md).
- Why: P7 and P8 are closed. W22 revision closeout, publication, and release retain separate authority gates.
- Coordinate Handoff: Keep P1 through P8 as completed records and request owner authority before closing W22 R0.

Reopening the completed wave and adding P8 were explicit lifecycle departures. The product-authority update recorded the new defect without rewriting prior phase history. The owner approved the final exact-candidate installation, live setup, P7 and P8 closeout, and pull-request merge on 2026-09-23. P7, P8, and D-038 are closed. W22 remains open for its revision-level closeout.

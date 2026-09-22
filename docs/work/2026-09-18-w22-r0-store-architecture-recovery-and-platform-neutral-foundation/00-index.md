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
  why: "Implement the bounded P7 setup recovery repair after the owner reviews the approach and separately authorizes runtime work."
  coordinate_handoff: "Carry W22 R0 P7 into implementation evidence and a later corrective closeout."
---

# W22 R0 Store Architecture Recovery and Platform-Neutral Foundation Work Backlog

## Purpose

Provide the execution queue for the [W22 R0 design](../../designs/2026-09-18-store-architecture-recovery-and-platform-neutral-foundation.md) and [plan](../../plans/2026-09-18-w22-r0-store-architecture-recovery-and-platform-neutral-foundation/00-overview.md).

P1 through P6 remain completed records for their exact accepted evidence. The owner reopened W22 R0 on 2026-09-22 after a current installed CLI proved that full setup and system setup can direct the person back to each other while the Store remains on supported legacy schema 3. P7 is the only active phase.

The owner authorized this plan, work, and D-038 authority update plus its documentation commit. P7 runtime implementation, Store changes, real-project repair, installation, push, publication, and release remain separately gated. The next step is an implementation discussion with the owner.

## Human Experience Trace

| Impact or promise | Source design and plan | Owning PRD or preserved boundary | Work phase | Evidence source or selected testing type | Implementation gate | Accepted obligation, if any |
| --- | --- | --- | --- | --- | --- | --- |
| HX-1: equal action meaning and recovery on Windows, macOS, and Linux | [Design](../../designs/2026-09-18-store-architecture-recovery-and-platform-neutral-foundation.md) and [plan](../../plans/2026-09-18-w22-r0-store-architecture-recovery-and-platform-neutral-foundation/00-overview.md) | PRDs 10, 16, 28, and 38 after P2 reconciliation | [P3](03-platform-neutral-filesystem-and-checkout-safety.md), [P6](06-real-platform-package-proof-and-closeout.md), and [P7](07-setup-bridge-order-and-recovery-loop-repair.md) | Automated checks and real-platform installed matrix | A13-A19, A36-A44, and A51-A52 pass | None |
| HX-2: clear state and one next safe action | Same | PRDs 07, 38, and 39 after P2 reconciliation | [P4](04-harness-trust-setup-and-resource-simplification.md), [P6](06-real-platform-package-proof-and-closeout.md), and [P7](07-setup-bridge-order-and-recovery-loop-repair.md) | Output fixtures, installed transcripts, and Human Experience Review | A20-A27, A40-A44, and A45-A52 pass | None |
| HX-3: independent work continues without Store access | Same | PRDs 07, 25, 38, and 39 after P2 reconciliation | [P2](02-product-authority-and-minimal-state-model.md), [P4](04-harness-trust-setup-and-resource-simplification.md), and [P6](06-real-platform-package-proof-and-closeout.md) | Access matrix and installed absent/denied/unavailable cases | A10, A23-A24, and A39 pass | None |
| HX-4: checkout moves and valid package updates do not fail only because low-level identity changed | Same | PRDs 16, 18, 28, and 38 after P2 reconciliation | [P2](02-product-authority-and-minimal-state-model.md), [P3](03-platform-neutral-filesystem-and-checkout-safety.md), and [P5](05-compatibility-bridge-and-symptom-closure.md) | Schema, move, update, and bridge cases | A9, A14-A16, and A28-A35 pass | None |
| HX-5: setup and repair use one open recovery path | Same | PRDs 07, 18, 38, and 39 after P2 reconciliation | [P4](04-harness-trust-setup-and-resource-simplification.md), [P5](05-compatibility-bridge-and-symptom-closure.md), and [P7](07-setup-bridge-order-and-recovery-loop-repair.md) | State-transition tests, interruption/restart proof, exact loop regression, and installed transcripts | A22-A26, A31-A34, and A45-A52 pass | None |
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
| P7 | [Setup Bridge Order and Recovery Loop Repair](07-setup-bridge-order-and-recovery-loop-repair.md) | Supported legacy Store and drifted machine setup reach one verified non-circular recovery path. |

## Usage Notes

- P1 through P6 are completed records. Start with P7 for current W22 work.
- Do not start P7 code work until the owner reviews the implementation approach and separately authorizes runtime implementation.
- Recheck branch, HEAD, dirty files, disk, indexes, installed CLI, and relevant Store state before each phase. Preserve concurrent edits.
- Never create or switch a branch or worktree without explicit user permission.
- Keep the affected real project and its Store read-only until an approved phase and its candidate gate permit a bounded action.
- Maintain one P1 decision ledger and one P5 symptom table. Do not create competing lists.
- Use one central `evidence.md`. Add its P7 section only after implementation evidence exists.
- Automated Implementation Testing is required for implementation phases. Performance Testing is `not-needed-now`. Guided Progress Review is selected only where it can change a decision. Unassisted Goal Testing is `not-needed-now` until a real normal-use discoverability question and a qualified separate executor exist.
- Human Experience Review is separate from the four testing types. The agent prepares it from real results. Owner feedback is optional unless later accepted authority defines a specific gate.
- No `O-###`, `NUAT-###`, or `PERF-###` record is active for P7. Create no placeholder ID.
- A failed required case keeps its phase open. P7 is an explicit corrective phase based on new installed evidence. It does not rewrite prior phase history or hide a partial result.

## Intended Follow-On

- Route: `implementation-loop`
- Next step: Review the bounded P7 implementation approach with the owner. Start runtime work only after separate implementation approval.
- Next Prompt: [execution-workflow.md](../../../.make-docs/system/references/execution-workflow.md).
- Why: Current PRDs already require the repaired behavior. P7 now carries the exact correction and proof boundary.
- Coordinate Handoff: Carry W22 R0 P7 into implementation evidence and a later corrective closeout.

Reopening the completed wave is an explicit lifecycle departure. New installed evidence invalidated only the setup recovery claim. P7 implementation remains stopped for the requested owner discussion.

---
title: "W22 R0 Store Architecture Recovery and Platform-Neutral Foundation Work Backlog"
kind: "work"
status: "draft"
coordinate: "W22 R0"
source:
  type: "prd"
  path: "docs/prd/38-global-store-and-project-state.md"
follow_on:
  route: "implementation-loop"
  next_prompt: "../../../.make-docs/system/references/execution-workflow.md"
  why: "Execute the accepted recovery in dependency order after current product authority is reconciled."
  coordinate_handoff: "Carry W22 R0 and the active P coordinate into phase evidence and later commits."
---

# W22 R0 Store Architecture Recovery and Platform-Neutral Foundation Work Backlog

## Purpose

Provide the draft execution queue for the [W22 R0 design](../../designs/2026-09-18-store-architecture-recovery-and-platform-neutral-foundation.md) and [plan](../../plans/2026-09-18-w22-r0-store-architecture-recovery-and-platform-neutral-foundation/00-overview.md).

This backlog is draft. The user asked for the full package before the exact symptom list was complete. P1 must finish the inventory. The owner must accept the target decisions. P2 must update current PRD authority. The owner must then give separate implementation approval before P3 or later code work starts.

Package acceptance does not authorize code changes, PRD changes, Store changes, real-project repair, installation, staging, commit, push, publication, or release.

## Human Experience Trace

| Impact or promise | Source design and plan | Owning PRD or preserved boundary | Work phase | Evidence source or selected testing type | Implementation gate | Accepted obligation, if any |
| --- | --- | --- | --- | --- | --- | --- |
| HX-1: equal action meaning and recovery on Windows, macOS, and Linux | [Design](../../designs/2026-09-18-store-architecture-recovery-and-platform-neutral-foundation.md) and [plan](../../plans/2026-09-18-w22-r0-store-architecture-recovery-and-platform-neutral-foundation/00-overview.md) | PRDs 10, 16, 28, and 38 after P2 reconciliation | [P3](03-platform-neutral-filesystem-and-checkout-safety.md) and [P6](06-real-platform-package-proof-and-closeout.md) | Automated checks and real-platform installed matrix | A13-A19 and A36-A44 pass | None |
| HX-2: clear state and one next safe action | Same | PRDs 07, 38, and 39 after P2 reconciliation | [P4](04-harness-trust-setup-and-resource-simplification.md) and [P6](06-real-platform-package-proof-and-closeout.md) | Output fixtures, installed transcripts, and Human Experience Review | A20-A27 and A40-A44 pass | None |
| HX-3: independent work continues without Store access | Same | PRDs 07, 25, 38, and 39 after P2 reconciliation | [P2](02-product-authority-and-minimal-state-model.md), [P4](04-harness-trust-setup-and-resource-simplification.md), and [P6](06-real-platform-package-proof-and-closeout.md) | Access matrix and installed absent/denied/unavailable cases | A10, A23-A24, and A39 pass | None |
| HX-4: checkout moves and valid package updates do not fail only because low-level identity changed | Same | PRDs 16, 18, 28, and 38 after P2 reconciliation | [P2](02-product-authority-and-minimal-state-model.md), [P3](03-platform-neutral-filesystem-and-checkout-safety.md), and [P5](05-compatibility-bridge-and-symptom-closure.md) | Schema, move, update, and bridge cases | A9, A14-A16, and A28-A35 pass | None |
| HX-5: setup and repair use one open recovery path | Same | PRDs 07, 18, 38, and 39 after P2 reconciliation | [P4](04-harness-trust-setup-and-resource-simplification.md) and [P5](05-compatibility-bridge-and-symptom-closure.md) | State-transition and interruption/restart tests | A22-A26 and A31-A34 pass | None |
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

## Usage Notes

- Read phases in order. Do not start P2 until the P1 target decisions are accepted.
- Do not start P3 or later code work until P2 current authority is accepted and the owner separately authorizes implementation.
- Recheck branch, HEAD, dirty files, disk, indexes, installed CLI, and relevant Store state before each phase. Preserve concurrent edits.
- Never create or switch a branch or worktree without explicit user permission.
- Keep the affected real project and its Store read-only until an approved phase and its candidate gate permit a bounded action.
- Maintain one P1 decision ledger and one P5 symptom table. Do not create competing lists.
- Use one central `evidence.md` only after evidence exists. Do not create an empty report during package drafting.
- Automated Implementation Testing is required for implementation phases. Performance Testing is `not-needed-now`. Guided Progress Review is selected only where it can change a decision. Unassisted Goal Testing is `not-needed-now` until a real normal-use discoverability question and a qualified separate executor exist.
- Human Experience Review is separate from the four testing types. The agent prepares it from real results. Owner feedback is optional unless later accepted authority defines a specific gate.
- No `O-###`, `NUAT-###`, or `PERF-###` record is active for this draft. Create no placeholder ID.
- A failed required case keeps its phase open. Do not add a new phase to hide a partial result.

## Intended Follow-On

- Route: `implementation-loop`
- Next step: Review P1 and its decision questions. After package acceptance, authorize P1 separately if you want the investigation to start.
- Next Prompt: [execution-workflow.md](../../../.make-docs/system/references/execution-workflow.md).
- Why: Execute the accepted recovery in dependency order after current product authority is reconciled.
- Coordinate Handoff: Carry W22 R0 and the active P coordinate into phase evidence and later commits.

This draft backlog is an explicit lifecycle departure made at the owner's request to capture the full package. It is not implementation authority.

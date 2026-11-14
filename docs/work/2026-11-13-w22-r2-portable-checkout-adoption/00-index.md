---
title: "W22 R2 Portable Checkout Adoption"
kind: "work"
status: "active"
coordinate: "W22 R2"
follow_on:
  route: "implementation-loop"
  next_prompt: ".make-docs/system/references/execution-workflow.md"
  why: "The backlog turns the approved plan and current PRDs into implementation work."
  coordinate_handoff: "Carry W22 R2 into phase history and commits, with the active P number."
source:
  type: "prd"
  path: "../../prd/39-cli-command-model-and-operation-registry.md"
---

# W22 R2 Portable Checkout Adoption

## Purpose

Register a cloned Make Docs project in a new machine Store under its saved project ID. Keep changed project content. Make setup preview and apply report the same choices and blockers. Bump the CLI package from `2.0.6` to the `2.0.7` candidate during implementation.

Plain setup must stop before any write on a portable unregistered checkout. Interactive setup offers adopt, normal setup, and cancel. Non-interactive setup points to `make-docs setup --adopt --yes`. The two-Store check for this choice is a 2.0.7 release gate.

The [design](../../designs/2026-11-13-portable-checkout-adoption.md), [plan](../../plans/2026-11-13-w22-r2-portable-checkout-adoption/00-overview.md), and [D-050](../../prd/03-open-questions-and-risk-register.md#d-050-second-machine-setup-cannot-adopt-a-portable-checkout) define the scope. The [evidence report](evidence.md) records the confirmed 2.0.6 behavior and open limits.

## Human Experience Trace

| Impact or promise | Source design and plan | Owning PRD or preserved boundary | Work phase | Evidence source or selected testing type | Implementation gate | Accepted obligation, if any |
| --- | --- | --- | --- | --- | --- | --- |
| A clone is named as a portable checkout and given an adopt action. | [Design](../../designs/2026-11-13-portable-checkout-adoption.md); [plan](../../plans/2026-11-13-w22-r2-portable-checkout-adoption/00-overview.md) | [PRD 18](../../prd/18-compatibility-classification-and-migration-safety.md); [PRD 38](../../prd/38-global-store-and-project-state.md) | [P1](01-state-and-store-binding.md) | Two-Store automated case and status/preview result review | Same identity and next action before and after a failed setup | None |
| Plain setup waits for an explicit path choice. | [Design](../../designs/2026-11-13-portable-checkout-adoption.md); [plan](../../plans/2026-11-13-w22-r2-portable-checkout-adoption/00-overview.md) | [PRD 05](../../prd/05-installation-profile-and-manifest-lifecycle.md); [PRD 07](../../prd/07-cli-command-surface-and-lifecycle.md); [PRD 39](../../prd/39-cli-command-model-and-operation-registry.md) | [P2](02-adoption-and-conflict-review.md); [P3](03-package-proof-and-closeout.md) | Interactive choice test and two-Store plain/yes/dry-run/adopt test | No write before choice; `--yes` names `setup --adopt --yes` | None |
| Saved choices appear before fresh defaults. | [Design](../../designs/2026-11-13-portable-checkout-adoption.md); [plan](../../plans/2026-11-13-w22-r2-portable-checkout-adoption/00-overview.md) | [PRD 24](../../prd/24-project-configuration-and-convention-overlay.md); [PRD 07](../../prd/07-cli-command-surface-and-lifecycle.md) | [P2](02-adoption-and-conflict-review.md) | Automated saved-choice cases and agent Human Experience Review | A valid saved method and resource choice need no new selection | None |
| Changed routers and resources stay in the clone under keep. | [Design](../../designs/2026-11-13-portable-checkout-adoption.md); [plan](../../plans/2026-11-13-w22-r2-portable-checkout-adoption/00-overview.md) | [PRD 05](../../prd/05-installation-profile-and-manifest-lifecycle.md); [PRD 06](../../prd/06-template-contracts-and-generated-assets.md); [PRD 15](../../prd/15-agent-instruction-ownership-and-managed-blocks.md) | [P2](02-adoption-and-conflict-review.md) | File and block cases; git byte comparison | Adoption records only proved ownership and changes no tracked byte under keep | None |
| Dry run shows the same block or ready result as apply. | [Design](../../designs/2026-11-13-portable-checkout-adoption.md); [plan](../../plans/2026-11-13-w22-r2-portable-checkout-adoption/00-overview.md) | [PRD 07](../../prd/07-cli-command-surface-and-lifecycle.md); [PRD 39](../../prd/39-cli-command-model-and-operation-registry.md) | [P2](02-adoption-and-conflict-review.md); [P3](03-package-proof-and-closeout.md) | Automated CLI/MCP parity cases and agent Human Experience Review | The same inputs and snapshot give the same conflict result | None |

## Phase Map

| File | Purpose |
| --- | --- |
| [P1 State and Store Binding](01-state-and-store-binding.md) | Classify a portable checkout and register a distinct local checkout safely. |
| [P2 Adoption and Conflict Review](02-adoption-and-conflict-review.md) | Use saved choices and a reviewed path map to preserve or replace content. |
| [P3 Package Proof and Closeout](03-package-proof-and-closeout.md) | Prove the two-Store path, negative cases, output, and guide decision. |

## Usage Notes

- Read phases in order.
- Each phase links its current PRD owners.
- Update [evidence.md](evidence.md) when a case produces a finding.
- No deferred obligation or Unassisted Goal Testing case is active now. Record a new need through the governing review before adding an ID.
- The three named resource differences on the owner's machine remain unexplained. Keep them project-owned until their bytes and package source are compared.

## Intended Follow-On

- Route: `implementation-loop`.
- Next step: Start P1, then P2 and P3.
- Why: This backlog is the implementation queue from the approved plan and current PRDs.
- Coordinate Handoff: Use W22 R2 P1, P2, or P3 for phase records and commits.

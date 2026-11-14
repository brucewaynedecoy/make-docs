---
title: "Phase 2: Adoption and Conflict Review"
kind: "work"
status: "active"
coordinate: "W22 R2 P2"
source:
  type: "prd"
  path: "../../prd/05-installation-profile-and-manifest-lifecycle.md"
---

# Phase 2: Adoption and Conflict Review

## Purpose

Use the clone's saved choices and current bytes to build one safe adoption plan.

## Overview

Read valid config intent before fresh defaults. Compare routers by managed block and selected resources by full body. Give each changed path a reviewed keep or export-and-replace disposition. Make dry run report the same conflict state as apply.

## Human Experience Outcome

- Impact and governing promise: A person can keep the clone's choices and changed content while registering it. [PRD 07](../../prd/07-cli-command-surface-and-lifecycle.md#interactive-selection-contract) and [PRD 15](../../prd/15-agent-instruction-ownership-and-managed-blocks.md#initialization-and-adoption-safety) own the visible rules.
- Intended human outcome: Setup shows saved methods, the resource choice, changed paths, and the result before apply.
- Human-facing surface or indirect effect: Setup prompts, `--yes` result, dry-run text and JSON, and tracked project files.
- Implementation work: Config choice resolution, file and block proof, conflict policy, plan review, and apply admission.
- Evidence source or testing type: Automated fixture cases and agent Human Experience Review under the [contract](../../../.make-docs/system/contracts/human-experience-contract.md).
- Executor: Implementing agent.
- Accepted obligation or deferral route: None.

## Current Testing Decisions

| Testing type | Current decision | Decision record or `not-needed-now` reason |
| --- | --- | --- |
| Automated Implementation Testing | Activate | File bytes, Store receipts, and dry-run parity need deterministic checks. |
| Performance Testing | `not-needed-now` | The current plan has no performance candidate. |
| Guided Progress Review | `not-needed-now` | Agent review can inspect the command output and path map in this phase. |
| Unassisted Goal Testing | `not-needed-now` | The full user goal is tested through P3 package cases. |

- Base maintenance action: `none`.
- Performance applicability: `not-needed`.
- Canonical `PERF-###` profile link or `none`: none.
- Finite evidence budget and stop-rule reference or `not-applicable`: `not-applicable`.
- Execution packet link or `not-applicable`: `not-applicable`.
- Outcome and evidence handoff or `none`: none.
- Gate disposition and supported-scope limit or `not-applicable`: `not-applicable`.

Human Experience Review is required for the named outputs. Record the visible path choices, block result, and limits in [evidence.md](evidence.md).

## Source PRD Docs

- [PRD 05: selection and conflict map](../../prd/05-installation-profile-and-manifest-lifecycle.md)
- [PRD 06: resource projection](../../prd/06-template-contracts-and-generated-assets.md)
- [PRD 07: setup review](../../prd/07-cli-command-surface-and-lifecycle.md)
- [PRD 15: managed blocks](../../prd/15-agent-instruction-ownership-and-managed-blocks.md)
- [PRD 24: saved intent](../../prd/24-project-configuration-and-convention-overlay.md)
- [PRD 39: command inputs](../../prd/39-cli-command-model-and-operation-registry.md)

## Source Obligations, Scenarios, And Findings

- Obligations: none active.
- Unassisted Goal Testing scenarios: none active.
- Finding: [D-050](../../prd/03-open-questions-and-risk-register.md#d-050-second-machine-setup-cannot-adopt-a-portable-checkout).

## Stage 1 - Saved Choices and Ownership

### Tasks

- [ ] t1: Load valid project harness, method, Skill, capability, and resource choices before fresh defaults. Use machine maximum methods only as bounds.
- [ ] t2: When resource intent is absent, offer the complete unambiguous four-type local set only inside explicit adoption review. Require input for a partial or unclear set.
- [ ] t3: Compare each router's managed block with shipped block bytes. Compare each selected resource body with shipped resource bytes. Build a per-path ownership map for the new checkout.
- [ ] t4: Preserve exact outside-block text and changed resource bodies. Record managed ownership only for exact verified matches.

### Acceptance criteria

- A5: A valid saved MCP method and saved resource choice are used on the new machine when machine intent permits them. An absent method still stops before writes.
- A6: A complete local four-type set with no saved choice is offered in adopt review. A partial or unclear set needs an explicit selection.
- A7: Exact shipped blocks and resources may gain managed ownership in the new checkout. Changed valid content remains project-owned under keep. Git reports no tracked-byte change.
- A8: A router with changed text outside an exact managed block keeps that text and can gain block-only managed ownership.

### Dependencies

- P1 provides the portable target state and distinct-checkout operation.

### Closeout Notes

- Four testing decisions: Use the phase table.
- Performance evidence: none.
- Human Experience Review: Record saved-choice and ownership observations in [evidence.md](evidence.md).
- Optional experience handoff: Save for P3.
- Explicit human acceptance gate: none.
- Evidence report: [P2 result](evidence.md#next-evidence).
- Phase / capability status: Open until saved-choice and byte-preservation cases pass.

## Stage 2 - Conflict and Dry-Run Parity

### Tasks

- [ ] t5: Add `--conflicts keep|overwrite` to the shared setup planner. Expand the selected policy to exact per-path resolutions in the frozen plan.
- [ ] t6: Map keep to project-owned preservation. Map overwrite to reviewed export-and-replace. Stop on damaged markers, unsafe evidence, or stale review.
- [ ] t7: Make interactive dry run show the same conflict review and blocked or ready result as apply. Keep dry run free of Store and project writes.
- [ ] t8: Check CLI and MCP setup results for the same paths, blockers, and next action.
- [ ] t9: Gate plain setup on portable unregistered identity before any write. Offer Adopt this checkout, Continue with normal setup, and Cancel in interactive mode. Show the selected plan. Return blocked with `make-docs setup --adopt --yes` in `nextAction` for `--yes`; keep dry run read-only with the same choice or block.

### Acceptance criteria

- A9: `--adopt --yes` can finish with changed valid paths and no tracked-byte change. The result lists every kept path as project-owned. Explicit `--conflicts keep` gives the same result.
- A10: Identical dry-run and apply inputs on one source snapshot report the same conflict paths and ready or blocked result. Dry run writes nothing. Stale or unsafe evidence blocks both. Plain setup in a portable checkout makes no write before the path choice, and `--yes` points to `setup --adopt --yes`.

### Dependencies

- Stage 1 supplies saved choices and the ownership map.

### Closeout Notes

- Four testing decisions: Use the phase table.
- Performance evidence: none.
- Human Experience Review: Record the conflict review and next action in [evidence.md](evidence.md).
- Optional experience handoff: Save for P3.
- Explicit human acceptance gate: none.
- Evidence report: [P2 result](evidence.md#next-evidence).
- Phase / capability status: Open until conflict and dry-run parity cases pass.

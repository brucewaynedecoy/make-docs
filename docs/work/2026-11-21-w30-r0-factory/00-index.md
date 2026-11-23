---
title: "W30 R0 Factory"
kind: "work"
status: "active"
coordinate: "W30 R0"
follow_on:
  route: "implementation-loop"
  next_prompt: ".make-docs/system/references/execution-workflow.md"
  why: "The backlog turns the approved plan and PRD 53 into implementation work."
  coordinate_handoff: "Carry W30 R0 into phase history records and commits, adding the active P number."
source:
  type: "prd"
  path: "docs/prd/53-factory-setup-and-orchestration.md"
---

# W30 R0 Factory

## Purpose

This backlog builds the factory in [PRD 53](../../prd/53-factory-setup-and-orchestration.md). The factory sets up a person's agent tools once, proves the wiring, saves it, and runs ready work through builders, reviewers, and corrections. It reaches the person through one human channel for the decisions that need a person. The person's own tools do the work. Make Docs has no workflow engine.

The [design](../../designs/2026-11-21-factory.md) and the [plan](../../plans/2026-11-21-w30-r0-factory/00-overview.md) define the scope. The factory uses the [W29 R0 work store](../2026-11-21-w29-r0-work-store/00-index.md) as its queue.

Limits:

- Implementation starts only after W29 R0 ships. It needs separate owner authority.
- Nothing in W22 R2 is touched: its files, branches, and worktrees stay as they are.
- Shipped resources change in `packages/docs/template/` first. After review, they are reseeded into this repository's `.make-docs/` and `docs/`.
- No example, default, or fixture names a particular tool as required. Proof records name the tools that were actually used.

## Human Experience Trace

| Impact or promise | Source design and plan | Owning PRD or preserved boundary | Work phase | Evidence source or selected testing type | Implementation gate | Accepted obligation, if any |
| --- | --- | --- | --- | --- | --- | --- |
| `direct`: setup ends with a plain summary of roles, wake method, human channel, test result, and open manual steps. | [Design](../../designs/2026-11-21-factory.md), [plan](../../plans/2026-11-21-w30-r0-factory/00-overview.md) | [PRD 53](../../prd/53-factory-setup-and-orchestration.md) R-FACTORY-13, R-FACTORY-14 | [P4](04-factory-setup-skill.md), [P6](06-proofs-and-acceptance.md) | Two capability proofs, Guided Progress Review | P4 closeout and P6 acceptance | None |
| `direct`: the person hears only floor events and added events. Each message says what happened, what is needed, and what happens next. | Same | [PRD 53](../../prd/53-factory-setup-and-orchestration.md) R-FACTORY-37, R-FACTORY-38 | [P1](01-factory-contract-and-workflow-types.md), [P5](05-factory-run-skill-and-handoffs.md) | Escalation fixtures, Guided Progress Review of real messages | P5 closeout | None |
| `direct`: `run factory status` shows each claimed unit, its tool, its state, and the last check, in human words first. | Same | [PRD 53](../../prd/53-factory-setup-and-orchestration.md) R-FACTORY-51 | [P3](03-factory-operations.md) | Parity fixtures, Guided Progress Review | P3 closeout | None |
| `direct`: at the end of the given scope, the person gets one acceptance request with the reviewed result and evidence. | Same | [PRD 53](../../prd/53-factory-setup-and-orchestration.md) R-FACTORY-39 | [P5](05-factory-run-skill-and-handoffs.md), [P6](06-proofs-and-acceptance.md) | Capability proofs, Human Experience Review | P6 acceptance | None |
| `direct`: a drifted workflow says so before it takes new work and names the smallest fix. | Same | [PRD 53](../../prd/53-factory-setup-and-orchestration.md) R-FACTORY-12, R-FACTORY-33 | [P3](03-factory-operations.md), [P5](05-factory-run-skill-and-handoffs.md) | Drift test that removes a wired tool | P6 acceptance | None |

## Phase Map

| File | Purpose |
| --- | --- |
| [01-factory-contract-and-workflow-types.md](01-factory-contract-and-workflow-types.md) | Author the factory contract, the capability catalog, and three workflow type references upstream. |
| [02-store-records-config-and-copies.md](02-store-records-config-and-copies.md) | Add the factory tables, the `factory:` config block, the generated copies, and backup records. |
| [03-factory-operations.md](03-factory-operations.md) | Build the `run factory` operations and the `factory` MCP profile. |
| [04-factory-setup-skill.md](04-factory-setup-skill.md) | Build the `factory-setup` Skill: find, read, interview, wire, prove, and save. |
| [05-factory-run-skill-and-handoffs.md](05-factory-run-skill-and-handoffs.md) | Rewrite the `factory` Skill around the loop, and add the backlog review handoff. |
| [06-proofs-and-acceptance.md](06-proofs-and-acceptance.md) | Prove two setups by capability, drift, work outside git, package parity, and Human Experience outcomes. |

## Usage Notes

- Read phases in order. P4 and P5 can run in parallel after P3, with separate write scopes.
- Every phase file links back to its PRD docs in `## Source PRD Docs`.
- Each Human Experience promise above stays traceable through its phase, evidence decision, and gate.
- No deferred obligation or Unassisted Goal Testing scenario applies now. P6 reassesses Unassisted Goal Testing for first setup.
- When a phase retains evidence for acceptance or review, create this backlog's central `evidence.md` and link it here. Do not create it empty.

## Intended Follow-On

This handoff is advisory-default-but-overridable: it is authoritative unless the user explicitly overrides it, and it is not a gate or precondition.

- Route: `implementation-loop`
- Next step: After W29 R0 ships and the owner gives phase-start authority, start with P1 and continue phase by phase.
- Why: The backlog is the implementation queue derived from the plan and PRD 53.
- Coordinate Handoff: Carry `W30 R0` into phase history records and commits, adding the active P number.

## Change History

### 2026-11-22 — W30 R0 P2

- Kind: `edit`
- Affected scope: P2 migration order and table rules.
- Previous scope: the factory migration followed W29's schema v7.
- Replacement scope: the factory migration follows W29's schema v8, and each factory table has the Store write guard triggers and a Store table catalog entry.
- Rationale: W32 R0 takes schema v7 and adds the write guard and the table catalog.
- PRD decision: `update-existing` — PRD 38 R-DB-7, R-WRITE-GUARD, and R-MAINT.
- Owner approval: the owner's choice on 2026-11-22 to finish the whole Store review first.
- Source: [W32 R0 plan](../../plans/2026-11-22-w32-r0-store-review-and-maintenance/00-overview.md)

---
title: "W32 R0 Store Review and Maintenance"
kind: "work"
status: "active"
coordinate: "W32 R0"
follow_on:
  route: "implementation-loop"
  next_prompt: ".make-docs/system/references/execution-workflow.md"
  why: "The backlog turns the approved plan and the PRD 38 and PRD 39 rules into implementation work."
  coordinate_handoff: "Carry W32 R0 into phase history records and commits, adding the active P number."
source:
  type: "prd"
  path: "docs/prd/38-global-store-and-project-state.md"
---

# W32 R0 Store Review and Maintenance

## Purpose

This backlog makes the global Store easy to trust. Every table gets a catalog entry, a maintenance class, and a retention rule. A write guard lets only Make Docs write the Store. `project_register` lists every project. `make-docs setup store check` and `make-docs setup store clean` remove only what fixed rules prove safe, after a backup. [PRD 38](../../prd/38-global-store-and-project-state.md) R-MAINT, R-REGISTER, and R-WRITE-GUARD and [PRD 39](../../prd/39-cli-command-model-and-operation-registry.md) R-STORE-CMD hold the rules. The [design](../../designs/2026-11-22-store-review-and-maintenance.md) and the [plan](../../plans/2026-11-22-w32-r0-store-review-and-maintenance/00-overview.md) define the scope.

Implementation needs separate owner authority. This backlog does not touch W22 R2 files, branches, or worktrees. It never runs `clean` on the real Store without separate owner approval.

Out of scope:

- Automatic cleanup after update.
- A caller for project prune.
- Full isolation of the Store under a separate system account or a server process.

## Human Experience Trace

| Impact or promise | Source design and plan | Owning PRD or preserved boundary | Work phase | Evidence source or selected testing type | Implementation gate | Accepted obligation, if any |
| --- | --- | --- | --- | --- | --- | --- |
| `direct`: `make-docs project list` shows every project that the Store knows, with its name, ID, checkouts, and any missing checkout folder. | [Design](../../designs/2026-11-22-store-review-and-maintenance.md), [plan](../../plans/2026-11-22-w32-r0-store-review-and-maintenance/00-overview.md) | PRD 38 R-REGISTER-3, PRD 39 R-STORE-CMD-2 | [P3](03-project-register-and-row-events.md) | Fixture Stores, CLI and MCP parity, Guided Progress Review | P3 closeout | None |
| `direct`: `make-docs setup store check` explains what is safe to remove, what needs a decision, and how much space a clean frees, and changes nothing. | Same | PRD 39 R-STORE-CMD-3 | [P4](04-maintenance-commands.md) | No-write test, parity, Guided Progress Review | P4 closeout | None |
| `direct`: `make-docs setup store clean` removes only rows that a fixed rule proves safe, after a backup, and reports what it removed and how to restore. | Same | PRD 38 R-MAINT-3, R-MAINT-5, PRD 39 R-STORE-CMD-4 | [P4](04-maintenance-commands.md), [P5](05-real-store-proof-and-acceptance.md) | Rule tests, backup and restore test, a run on a copy of a real Store | P5 closeout | None |
| `direct`: a program that is not Make Docs cannot change the Store by accident, and Make Docs says so if someone removes the guard. | Same | PRD 38 R-WRITE-GUARD | [P2](02-schema-v7-and-defect-fixes.md), [P5](05-real-store-proof-and-acceptance.md) | Guard tests on every open path, a direct-write refusal test, a removed-trigger test | P5 closeout | None |
| `direct`: a crash never leaves a lock or a pending row that blocks the machine forever. | Same | PRD 38 R-MAINT-3, R-LIFE-6 | [P2](02-schema-v7-and-defect-fixes.md), [P4](04-maintenance-commands.md) | Crash-leftover fixtures for each blocking row | P4 closeout | None |

## Phase Map

| File | Purpose |
| --- | --- |
| [01-table-catalog-and-fixed-rules.md](01-table-catalog-and-fixed-rules.md) | Settle the table catalog, the maintenance classes, the fixed rules, and the fixtures. |
| [02-schema-v7-and-defect-fixes.md](02-schema-v7-and-defect-fixes.md) | Add schema v7 with the write guard, and fix the known Store defects. |
| [03-project-register-and-row-events.md](03-project-register-and-row-events.md) | Fill the project register, prove each row event, and add `project list`. |
| [04-maintenance-commands.md](04-maintenance-commands.md) | Build `setup store check` and `setup store clean`. |
| [05-real-store-proof-and-acceptance.md](05-real-store-proof-and-acceptance.md) | Fix documentation drift, run on a copy of a real Store, and prove the Wave. |

## Wave Sequence

- Full order: [W31 R0](../2026-11-22-w31-r0-task-id-case-and-project-doctor/00-index.md) and [W32 R0](../2026-11-22-w32-r0-store-review-and-maintenance/00-index.md) side by side, with [W33 R0](../2026-11-22-w33-r0-command-tree-and-tool-names/00-index.md) P1 beside them; then [W29 R0](../2026-11-21-w29-r0-work-store/00-index.md) P2 and P3 beside [W33 R0](../2026-11-22-w33-r0-command-tree-and-tool-names/00-index.md) P2 to P5; then W29 R0 P4 to P6; then [W30 R0](../2026-11-21-w30-r0-factory/00-index.md).
- Waits for: nothing. This Wave can start now.
- Runs beside: [W31 R0](../2026-11-22-w31-r0-task-id-case-and-project-doctor/00-index.md). The two Waves share no files.
- Next: [W29 R0](../2026-11-21-w29-r0-work-store/00-index.md) P2 waits for all of this Wave, and [W33 R0](../2026-11-22-w33-r0-command-tree-and-tool-names/00-index.md) P2 waits for this Wave's P4.

## Usage Notes

- Read phases in order. P4 can run beside P3 after P2.
- P1 is the contract gate. No Store code changes before the owner accepts P1.
- Every phase file includes `## Source PRD Docs`.
- Acceptance case IDs run from A1 to A24 across this backlog.
- Create `evidence.md` when the first phase retains evidence, and link it here.
- No `O-###` obligation or `NUAT-###` scenario is in scope. Unassisted Goal Testing is `not-needed-now`.

## Intended Follow-On

This handoff is advisory-default-but-overridable.

- Route: `implementation-loop`
- Next step: When the owner gives phase-start authority, start P1 and continue phase by phase.
- Why: The backlog turns the approved plan and the PRD 38 and PRD 39 rules into implementation work.
- Coordinate Handoff: Carry W32 R0 into phase history records and commits, adding the active P number.

## Change History

### 2026-11-22 — W32 R0 P3

- Kind: `edit`
- Affected scope: P3 project list MCP tool name.
- Previous scope: the project list MCP tool was `project_register_list`.
- Replacement scope: the tool is `project_list`, the CLI path `project list` joined with an underscore.
- Rationale: the command naming rule in PRD 39 R-NAME-3 (register D-065).
- PRD decision: `update-existing` — PRD 25 R-MCP-PROFILE-10.
- Owner approval: the owner's command tree choices on 2026-11-22.
- Source: [W33 R0 plan](../../plans/2026-11-22-w33-r0-command-tree-and-tool-names/00-overview.md)

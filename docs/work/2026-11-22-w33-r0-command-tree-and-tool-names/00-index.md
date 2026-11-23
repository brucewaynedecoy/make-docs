---
title: "W33 R0 Command Tree and Tool Names"
kind: "work"
status: "active"
coordinate: "W33 R0"
follow_on:
  route: "implementation-loop"
  next_prompt: ".make-docs/system/references/execution-workflow.md"
  why: "The backlog turns the approved plan and the PRD 39 and PRD 25 naming rules into implementation work."
  coordinate_handoff: "Carry W33 R0 into phase history records and commits, adding the active P number."
source:
  type: "prd"
  path: "docs/prd/39-cli-command-model-and-operation-registry.md"
---

# W33 R0 Command Tree and Tool Names

## Purpose

This backlog retires `run` as a root and gives every capability its own top-level group. Every MCP tool name is its CLI path after `make-docs`, joined with underscores. Old names stay hidden aliases for two minor releases, then return `command-renamed` for one more. [PRD 39](../../prd/39-cli-command-model-and-operation-registry.md) R-TOP-1, R-NAME, R-MIG-1, and R-MIG-3 and [PRD 25](../../prd/25-typescript-runtime-cli-mcp-operation-boundaries.md) `Current MCP Surface` hold the rules. The [design](../../designs/2026-11-22-command-tree-and-tool-names.md) and the [plan](../../plans/2026-11-22-w33-r0-command-tree-and-tool-names/00-overview.md) define the scope.

Implementation needs separate owner authority. This backlog does not touch W22 R2 files, branches, or worktrees.

Out of scope:

- Operation IDs. They stay stable.
- History records, archives, and closed evidence. They keep the names they recorded.

## Human Experience Trace

| Impact or promise | Source design and plan | Owning PRD or preserved boundary | Work phase | Evidence source or selected testing type | Implementation gate | Accepted obligation, if any |
| --- | --- | --- | --- | --- | --- | --- |
| `direct`: every command for one capability starts with that capability's group. | [Design](../../designs/2026-11-22-command-tree-and-tool-names.md), [plan](../../plans/2026-11-22-w33-r0-command-tree-and-tool-names/00-overview.md) | PRD 39 R-TOP-1, R-NAME-1, R-NAME-2 | [P1](01-name-catalog-and-rules.md), [P2](02-command-tree-and-tool-names.md) | Naming-rule test, Guided Progress Review | P2 closeout | None |
| `direct`: each MCP tool name is the CLI path after `make-docs`, joined with underscores. | Same | PRD 39 R-NAME-3, R-MIG-3, PRD 25 | [P2](02-command-tree-and-tool-names.md) | Naming-rule test, CLI and MCP parity | P2 closeout | None |
| `direct`: a current name keeps working for the window and names the new one. | Same | PRD 39 R-MIG-1 | [P3](03-aliases-and-migration-window.md) | Alias tests for every current name | P3 closeout | None |
| `direct`: `make-docs --help` lists the groups by capability, in plain words. | Same | PRD 39 R-TOP-1 | [P2](02-command-tree-and-tool-names.md), [P5](05-acceptance.md) | Help snapshot test, Human Experience Review | P5 closeout | None |

## Phase Map

| File | Purpose |
| --- | --- |
| [01-name-catalog-and-rules.md](01-name-catalog-and-rules.md) | Settle the full name table and the naming-rule test. |
| [02-command-tree-and-tool-names.md](02-command-tree-and-tool-names.md) | Build the eleven groups and derive MCP names by the rule. |
| [03-aliases-and-migration-window.md](03-aliases-and-migration-window.md) | Keep old names working for the window, then return `command-renamed`. |
| [04-shipped-text-and-skills.md](04-shipped-text-and-skills.md) | Move every shipped text and Skill to the new names. |
| [05-acceptance.md](05-acceptance.md) | Prove parity, aliases, help, and the Human Experience promises. |

## Wave Sequence

- Full order: [W31 R0](../2026-11-22-w31-r0-task-id-case-and-project-doctor/00-index.md) and [W32 R0](../2026-11-22-w32-r0-store-review-and-maintenance/00-index.md) side by side, with this Wave's P1 beside them; then [W29 R0](../2026-11-21-w29-r0-work-store/00-index.md) P2 and P3 beside this Wave's P2 to P5; then W29 R0 P4 to P6; then [W30 R0](../2026-11-21-w30-r0-factory/00-index.md).
- Waits for: nothing before P1. P2 waits for W31 R0 P3 and W32 R0 P4.
- Runs beside: W31 R0, W32 R0, and W29 R0 P2 and P3.
- Next: W29 R0 P4 and W30 R0 P3 wait for all of this Wave.

## Usage Notes

- Read phases in order. P4 can run beside P3 after P2.
- P1 is the contract gate. No rename starts before the owner accepts the name table.
- Every phase file includes `## Source PRD Docs`.
- Acceptance case IDs run from A1 to A15 across this backlog.
- Evidence: [W33 R0 Evidence Report](evidence.md).
- No `O-###` obligation or `NUAT-###` scenario is in scope. Unassisted Goal Testing is `not-needed-now`.

## Intended Follow-On

This handoff is advisory-default-but-overridable.

- Route: `implementation-loop`
- Next step: When the owner gives phase-start authority, start P1 and continue phase by phase.
- Why: The backlog turns the approved plan and the PRD 39 and PRD 25 naming rules into implementation work.
- Coordinate Handoff: Carry W33 R0 into phase history records and commits, adding the active P number.

---
title: "W31 R0 Task ID Case and Project Doctor"
kind: "work"
status: "completed"
coordinate: "W31 R0"
follow_on:
  route: "implementation-loop"
  next_prompt: ".make-docs/system/references/execution-workflow.md"
  why: "The backlog turns the approved plan and the PRD 14 and PRD 39 rules into implementation work."
  coordinate_handoff: "Carry W31 R0 into phase history records and commits, adding the active P number."
source:
  type: "prd"
  path: "docs/prd/39-cli-command-model-and-operation-registry.md"
---

# W31 R0 Task ID Case and Project Doctor

## Purpose

This backlog makes task IDs upper case and adds the project doctor. Task IDs become `T3` in everything Make Docs writes, and every reader still accepts `t3` ([PRD 14](../../prd/14-lifecycle-workflow-and-coverage-passes.md) R-COORD-22). The doctor finds and fixes lower-case task IDs after a review ([PRD 39](../../prd/39-cli-command-model-and-operation-registry.md) R-DOCTOR). The [design](../../designs/2026-11-22-task-id-case-and-project-doctor.md) and the [plan](../../plans/2026-11-22-w31-r0-task-id-case-and-project-doctor/00-overview.md) define the scope. [W29 R0 P3](../2026-11-21-w29-r0-work-store/03-parser-import-and-sync.md) depends on this backlog.

Implementation needs separate owner authority. This backlog does not touch W22 R2 files, branches, or worktrees. Its one-time rewrite excludes `docs/work/2026-11-13-w22-r2-portable-checkout-adoption/`.

Shipped resources change in `packages/docs/template/` first. Each change is then reseeded into this repository's `.make-docs/` and `docs/`.

This backlog uses lower-case task IDs, because today's readers accept only `t`. The P4 doctor run rewrites them to `T`.

Out of scope:

- Store data checks and maintenance. Register [D-062](../../prd/03-open-questions-and-risk-register.md) owns them.
- Any doctor check other than `task-id-case`.
- Archives and history records. They stay as written.

## Human Experience Trace

| Impact or promise | Source design and plan | Owning PRD or preserved boundary | Work phase | Evidence source or selected testing type | Implementation gate | Accepted obligation, if any |
| --- | --- | --- | --- | --- | --- | --- |
| `direct`: every coordinate that Make Docs writes uses upper-case letters, so `W29 R0 P1 T3` looks the same in files, results, URIs, and commits. | [Design](../../designs/2026-11-22-task-id-case-and-project-doctor.md), [plan](../../plans/2026-11-22-w31-r0-task-id-case-and-project-doctor/00-overview.md) | [PRD 14](../../prd/14-lifecycle-workflow-and-coverage-passes.md) R-COORD-22, [PRD 06](../../prd/06-template-contracts-and-generated-assets.md) R-TASK-RESOURCE-1, [PRD 51](../../prd/51-backlog-review-and-reporting.md) R-BACKLOG-SNAPSHOT-33 | [P2](02-writers-and-shipped-resources.md), [P4](04-one-time-rewrite-and-acceptance.md) | Shipped-file search, template and dogfood parity, snapshot tests | P4 closeout | None |
| `direct`: a person can still type `t3`, and an old file with `t3` still works. | Same | PRD 14 R-COORD-22, PRD 51 R-BACKLOG-SNAPSHOT-33 | [P1](01-readers-accept-both-cases.md) | Parser tests on lower-case, upper-case, and mixed files | P1 closeout | None |
| `direct`: `make-docs project doctor check` names each problem in plain words, shows the exact change, and changes nothing. | Same | [PRD 39](../../prd/39-cli-command-model-and-operation-registry.md) R-DOCTOR-3, [PRD 25](../../prd/25-typescript-runtime-cli-mcp-operation-boundaries.md) R-MCP-PROFILE-9 | [P3](03-project-doctor.md) | No-write test, CLI and MCP parity, Guided Progress Review | P3 closeout | None |
| `direct`: `make-docs project doctor fix` changes only what the person reviewed, and says what it changed and how to undo it. | Same | PRD 39 R-DOCTOR-4, R-DOCTOR-5, PRD 14 R-COORD-20 | [P3](03-project-doctor.md), [P4](04-one-time-rewrite-and-acceptance.md) | Digest-bound fix tests, stale-file refusal test, the recorded one-time rewrite, Guided Progress Review | P4 closeout | None |

## Phase Map

| File | Purpose |
| --- | --- |
| [01-readers-accept-both-cases.md](01-readers-accept-both-cases.md) | Make every reader accept `t` and `T` as the same task ID. |
| [02-writers-and-shipped-resources.md](02-writers-and-shipped-resources.md) | Make every shipped file and CLI text write `T`. |
| [03-project-doctor.md](03-project-doctor.md) | Build the doctor commands, the `task-id-case` check, and its agent twin. |
| [04-one-time-rewrite-and-acceptance.md](04-one-time-rewrite-and-acceptance.md) | Rewrite this repository's active backlogs with the doctor and prove the Wave. |

## Wave Sequence

- Full order: [W31 R0](../2026-11-22-w31-r0-task-id-case-and-project-doctor/00-index.md) and [W32 R0](../2026-11-22-w32-r0-store-review-and-maintenance/00-index.md) side by side, with [W33 R0](../2026-11-22-w33-r0-command-tree-and-tool-names/00-index.md) P1 beside them; then [W29 R0](../2026-11-21-w29-r0-work-store/00-index.md) P2 and P3 beside [W33 R0](../2026-11-22-w33-r0-command-tree-and-tool-names/00-index.md) P2 to P5; then W29 R0 P4 to P6; then [W30 R0](../2026-11-21-w30-r0-factory/00-index.md).
- Waits for: nothing. This Wave can start now.
- Runs beside: [W32 R0](../2026-11-22-w32-r0-store-review-and-maintenance/00-index.md). The two Waves share no files.
- Next: [W29 R0](../2026-11-21-w29-r0-work-store/00-index.md) P3 waits for all of this Wave, and [W33 R0](../2026-11-22-w33-r0-command-tree-and-tool-names/00-index.md) P2 waits for this Wave's P3.
- Later: after W22 R2 closes, run the doctor on its backlog (register D-063).

## Usage Notes

- Read phases in order. P3 can run beside P2 after P1.
- Every phase file includes `## Source PRD Docs`.
- Acceptance case IDs run from A1 to A16 across this backlog.
- Acceptance evidence is in the [W31 R0 Evidence Report](evidence.md).
- No `O-###` obligation or `NUAT-###` scenario is in scope. Unassisted Goal Testing is `not-needed-now`.

## Intended Follow-On

This handoff is advisory-default-but-overridable.

- Route: `implementation-loop`
- Next step: When the owner gives phase-start authority, start P1 and continue phase by phase.
- Why: The backlog turns the approved plan and the PRD 14 and PRD 39 rules into implementation work.
- Coordinate Handoff: Carry W31 R0 into phase history records and commits, adding the active P number.

## Change History

### 2026-11-22 — W31 R0 P2

- Kind: `edit`
- Affected scope: P2 T3.
- Previous scope: P2 T3 changed CLI text that names task IDs, such as the phase check warning.
- Replacement scope: P2 T3 also changes the task `id` in `run` results to `T`.
- Rationale: the P1 review found that no phase owned the task `id` in parser results, which PRD 14 R-COORD-22 says use `T`.
- PRD decision: `none` — PRD 14 R-COORD-22 already requires `T` in results.
- Owner approval: not required. The edit fits the plan.
- Source: [P1 evidence](evidence.md#p1-readers-accept-both-cases)

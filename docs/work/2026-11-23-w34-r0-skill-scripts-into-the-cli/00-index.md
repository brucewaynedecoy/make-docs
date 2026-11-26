---
title: "W34 R0 Skill Scripts Into the CLI"
kind: "work"
status: "active"
coordinate: "W34 R0"
follow_on:
  route: "implementation-loop"
  next_prompt: ".make-docs/system/references/execution-workflow.md"
  why: "The backlog turns the approved plan and the PRD 39, 25, 08, and 51 Skill check rules into implementation work."
  coordinate_handoff: "Carry W34 R0 into phase history records and commits, adding the active P number."
source:
  type: "prd"
  path: "docs/prd/39-cli-command-model-and-operation-registry.md"
---

# W34 R0 Skill Scripts Into the CLI

## Purpose

This backlog moves the logic of three Python Skill scripts into four CLI operations, removes `probe_environment.py`, and builds the two hand-written `backlog-review` scripts from CLI source. After the Wave, no first-party Skill ships Python, and a guard test keeps it that way. It closes register [D-064](../../prd/03-open-questions-and-risk-register.md) and the helper-script part of R-008.

The rules live in [PRD 39](../../prd/39-cli-command-model-and-operation-registry.md) R-TOP-1 and R-SKILL-CHECK, [PRD 25](../../prd/25-typescript-runtime-cli-mcp-operation-boundaries.md) R-SKILL-RUNTIME-7 and `Domain and Script Classification`, [PRD 08](../../prd/08-skills-catalog-and-distribution.md) R-SKILL-BUNDLE-7 and the Validation Boundary, and [PRD 51](../../prd/51-backlog-review-and-reporting.md) R-BACKLOG-SKILL-21. The [design](../../designs/2026-11-23-skill-scripts-into-the-cli.md) and the [plan](../../plans/2026-11-23-w34-r0-skill-scripts-into-the-cli/00-overview.md) define the scope. The owner chose design OD-1, OD-2, and OD-3 option A and plan PD-1 option A on 2026-11-23.

Implementation needs separate owner authority. This backlog does not touch W22 R2 files, branches, or worktrees, or the real Store.

Out of scope:

- History records, archives, and closed evidence that name the old scripts. They keep the names they recorded.
- The backlog review report model, snapshot, and cache.
- Any release or publish action.

## Human Experience Trace

| Impact or promise | Source design and plan | Owning PRD or preserved boundary | Work phase | Evidence source or selected testing type | Implementation gate | Accepted obligation, if any |
| --- | --- | --- | --- | --- | --- | --- |
| `direct`: each check is one Make Docs command and one MCP tool with a name from the W33 rules. | [Design](../../designs/2026-11-23-skill-scripts-into-the-cli.md), [plan](../../plans/2026-11-23-w34-r0-skill-scripts-into-the-cli/00-overview.md) | PRD 39 R-SKILL-CHECK-1, R-NAME-1 to R-NAME-5; PRD 25 R-MCP-PROFILE-11 | [P1](01-cli-operations-and-ported-tests.md) | Name catalog test, CLI and MCP parity tests | P1 closeout | None |
| `direct`: a check gives the same findings through the CLI and MCP, in plain words first, with a JSON form for agents. | Same | PRD 39 R-SKILL-CHECK-6 | [P1](01-cli-operations-and-ported-tests.md), [P5](05-acceptance.md) | Parity tests, Guided Progress Review of plain output | P1 closeout | None |
| `direct`: without the CLI, the Skill tells the agent how to do the same check by hand, and the agent says that the result is a manual review. | Same | PRD 25 R-SKILL-RUNTIME-7; PRD 08 R-SKILL-BUNDLE-2 | [P2](02-skill-text-and-guides.md) | Twin rule ID test, Human Experience Review of the Skill text | P5 closeout | None |
| `direct`: an update removes the old Python files from an installed Skill when Make Docs wrote them, and keeps any file that a person changed. | Same | PRD 08 R-SKILL-BUNDLE-7 and Validation Boundary | [P4](04-removal-and-guard.md) | Managed-removal tests for each removed file | P4 closeout | None |
| `indirect`: a rule change in the CLI fails a test until the Skill text changes with it, and the other way around. | Same | PRD 25 R-SKILL-RUNTIME-7 | [P2](02-skill-text-and-guides.md) | Twin rule ID test with a broken fixture | P2 closeout | None |

## Phase Map

| File | Purpose |
| --- | --- |
| [01-cli-operations-and-ported-tests.md](01-cli-operations-and-ported-tests.md) | Add the four operations, their catalog entries and PRD names, CLI and MCP parity, and the ported tests. |
| [02-skill-text-and-guides.md](02-skill-text-and-guides.md) | Move the three Skills to the MCP, CLI, agent-form order with shared rule IDs. |
| [03-backlog-review-bundles.md](03-backlog-review-bundles.md) | Build the two hand-written backlog-review scripts from CLI source, with a byte-match test. |
| [04-removal-and-guard.md](04-removal-and-guard.md) | Remove the Python files from the registry, the closeout code, and Git, and add the guard test. |
| [05-acceptance.md](05-acceptance.md) | Prove the Wave and close D-064. |

## Wave Sequence

- Full order: [W31 R0](../2026-11-22-w31-r0-task-id-case-and-project-doctor/00-index.md) and [W32 R0](../2026-11-22-w32-r0-store-review-and-maintenance/00-index.md) side by side, with [W33 R0](../2026-11-22-w33-r0-command-tree-and-tool-names/00-index.md) P1 beside them; then [W29 R0](../2026-11-21-w29-r0-work-store/00-index.md) P2 and P3 beside W33 R0 P2 to P5; then W29 R0 P4 to P6; then [W30 R0](../2026-11-21-w30-r0-factory/00-index.md). This Wave runs beside W29 R0 and W30 R0.
- Waits for: nothing. P1 and P3 can start now.
- Runs beside: W29 R0 and W30 R0. No Wave depends on this one, and this Wave depends on none of them. P5 closed D-064 on 2026-11-23, so its hold has ended. The P4 guard test keeps first-party Skills free of Python.
- Next: no Wave waits for this one.
- Recommended order: start P1 and P3 now. Merge whichever of this Wave's P1 and W29 R0 P4 is ready first. The other one rebases.

Files that this Wave and W29 R0 both touch are merge risks:

| File or surface | W29 R0 change | W34 R0 change | Handling |
| --- | --- | --- | --- |
| `packages/cli/src/operations/name-catalog.ts` and its test | [P4](../2026-11-21-w29-r0-work-store/04-work-queue-operations.md) turns the planned `work` entries current. | P1 adds four entries and `W34 R0` to the planner list. | Text conflict near the same lines. The second branch rebases and reruns the name catalog test. |
| PRD 39 R-TOP-1 and R-RUN-1 | P4 moves the `work` commands from planned to active. | P1 adds `decomposition` to the active `check` list. R-TOP-1 already names the new `project` and `check` contents. | Each requirement is one long line. Merge by hand. |
| PRD 25 R-MCP-PROFILE and Requirement History | P4 edits R-MCP-PROFILE-8. | P1 adds R-MCP-PROFILE-11. | History entries append at the same place. Merge by hand. |
| `packages/cli/src/operations/registry.ts`, MCP tool lists, and profile count tests | P4 adds the `work` operations. | P1 adds four operations. | Both change lists and counts. Rebase and rerun the parity tests. |
| Work phase parser in `packages/cli/src/operations/work/` | [P3](../2026-11-21-w29-r0-work-store/03-parser-import-and-sync.md) builds a round-trip parser for work files. | P1 `check decomposition` reuses the task line and task ID reader. | A meaning risk, not only a text risk. Call the shared reader through its public function. If W29 R0 P3 lands first, use its reader. |
| Backlog presentation source under `packages/cli/src/operations/work/backlog/` | P4 makes the snapshot read the work store. | P3 adds generated bundles and a byte-match test. | A source change on either side changes the bundle bytes. After each merge, run the bundle build and the byte-match test. |
| PRD 51 and the register | W29 R0 edits the snapshot source and adds entries. | This Wave edits R-BACKLOG-SKILL-21 and D-064. | History and register appends. Merge by hand. |

W30 R0 also changes `packages/cli/skill-registry.json` and `packages/skills/README.md` for the factory Skills. P4 changes both. Treat them the same way.

## Usage Notes

- Read phases in order. P3 depends only on the PRD pass and can run beside P1 and P2. P4 waits for P2 and P3.
- P1 T1 is the name gate. The PRD lines that name the four commands and tools land in P1 T1, with the catalog entries. The name catalog test and the shipped-text test fail a PRD line that names a command or tool before the catalog holds it.
- Every phase file includes `## Source PRD Docs`.
- Acceptance case IDs run from A1 to A22 across this backlog.
- Template-first rule: no file in `packages/docs/template/` names these scripts, and the agent forms stay in the Skills. If a task adds or changes a shipped system resource, write it first in `packages/docs/template/`, then copy it byte for byte to this repository's `.make-docs/` or `docs/`. The Skills keep `packages/skills/` as their only authoring source.
- Evidence: [W34 R0 Evidence Report](evidence.md).
- Source register entries: [D-064 and R-008](../../prd/03-open-questions-and-risk-register.md). No `O-###` obligation or `NUAT-###` scenario is in scope. Unassisted Goal Testing is `not-needed-now`.
- Status: `active` on 2026-11-23. All five phases are built, and D-064 is closed ([P5 evidence](evidence.md#p5-acceptance)). One task stays open: P3 T7 and A15, the refresh of the installed `backlog-review` copy in `.agents/skills/`, which the owner does with `make-docs update` after the release. The index stays `active` until that task is done, because no completed backlog keeps an open task.

## Change History

- 2026-11-23, W34 R0 P5: T8 adds `readTaskLabel` to `packages/cli/src/operations/work/task-line.ts`, because `readTaskLine` reads only a task line with a checkbox and the acceptance check looks for a task ID label without one. Both readers share one task ID rule, `TASK_ID_SOURCE`, and the work phase reader's `TASK_RE` builds on it too. `TASK_LINE_PATTERN` and `TASK_RE` do not change. PRD decision: `none`.
- 2026-11-23, W34 R0 P1 review: P5 gains T8. After W29 R0 P3 lands its shared task line reader, the acceptance task ID check of `check decomposition` switches to it, and the P1 side-by-side run is repeated. PRD 39 R-SKILL-CHECK-2 now records that `check decomposition` reads PRD sections with its own reader, a departure from the plan.

## Intended Follow-On

This handoff is advisory-default-but-overridable.

- Route: `implementation-loop`
- Next step: When the owner gives phase-start authority, start P1 and P3 and continue phase by phase.
- Why: The backlog turns the approved plan and the PRD 39, 25, 08, and 51 Skill check rules into implementation work.
- Coordinate Handoff: Carry W34 R0 into phase history records and commits, adding the active P number.

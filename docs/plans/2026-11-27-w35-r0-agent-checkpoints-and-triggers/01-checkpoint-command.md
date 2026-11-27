---
title: "W35 R0 P1 Checkpoint Command"
kind: "plan"
status: "draft"
coordinate: "W35 R0 P1"
source:
  type: "design"
  path: "docs/designs/2026-11-27-agent-checkpoints-and-triggers.md"
---

# W35 R0 P1 Checkpoint Command

## Purpose

Build the one command that every trigger leads to, before any trigger exists. This is the first part of the design's Phase 1.

## Outcome

One registry operation runs through the CLI and MCP with the same result. Its agent form is in the work store reference with the same rule IDs.

| Operation ID | CLI path | MCP name | Characters | Access | MCP profiles |
| --- | --- | --- | --- | --- | --- |
| `project.checkpoint.run` | `make-docs project checkpoint` | `project_checkpoint` | 18 | Store write and project write for the sync step. Store read and project read for the other steps. | `backlog`, `workflow`, `all` |

The path follows PRD 39 R-NAME-1 to R-NAME-4. The profile column is new in this plan.

## Scope

- T1 to T3 are the name gate. T1 adds the catalog entry as `planned` with `plannedBy: "W35 R0"` and adds `W35 R0` to `NameCatalogPlanner`. T2 lands the PRD lines that name the command and the tool: PRD 39 R-TOP-1 and the new R-CHECKPOINT-CMD section with its registry table, and PRD 25 R-MCP-PROFILE-12. T3 adds the test check for the new table. No PRD line may name the command before the catalog holds it.
- Named finding: how the registry admits one operation whose sync step needs more access than its read steps. The task reads `assertOperationStoreAdmission`, the `handler` admission kind, and the access check inside the `work.queue.status` handler. It records the answer before the handler is written. When no existing kind fits, the phase stops at owner gate OG-1.
- Named finding: whether the import-only sync of a trigger run can reuse the first-import path or the `holdWrites` option of `syncWorkFiles`, with no second copy of the sync table.
- The operation does the five steps of the design in order: authority, sync, claims that ended or end soon, next ready work, and one summary line. The backlog builds it in two tasks: the operation with steps 1 and 2, then steps 3 to 5.
- A direct run has no `--event`. It runs the same two-way sync as `work sync` and always prints its result.
- A trigger run has `--event <name>`. The six event names are `session-start`, `files-changed`, `turn-end`, `commit`, `branch-change`, and `phase-closed`. A trigger run imports only, writes and removes no project file, reports each file that waits for a direct run, and prints nothing when nothing is due. With `--event branch-change` it does not import. An unknown event name is refused with the list of names.
- "Nothing is due" means: this run imported no file, no file waits for a write or a removal, and no conflict waits. Ready work and a claim that ended are not due.
- A caller with read access only gets step 1, the read-only sync check, step 3, and step 4, one line that says the sync waits and how many files wait, exit 0, and a result field that says that the sync did not run.
- Without a usable Store the result says in one line that the `docs/work/` files are the authority, and exits 0. In a folder that is not a Make Docs project it says so and exits 0.
- The result names the checkout that it synced, and says when this run was the first sync of that checkout.
- The claim list never shows a claim ID and renews nothing (PRD 52 R-WORK-QUEUE-19).
- The operation adds no Store table. It reads and writes only what `work sync`, `work status`, and `work next` use.
- The help of `project checkpoint` and of `lifecycle checkpoint` says how the two differ.
- The agent form: the work store reference in `packages/docs/template/` gains a "Checkpoint" section: when to run it, what it does, and what to do by hand with no CLI. Each checkpoint rule gets an ID from `WORK-RULE-055` on in the catalog `make-docs.work-store-rules.v1`. The dogfood copy is byte-identical.
- PRD changes: PRD 52 (new R-WORK-CHECKPOINT, the Operations table, R-WORK-SYNC-9, R-WORK-STORE-6, R-WORK-QUEUE-11), PRD 39, PRD 25, PRD 06 R-WORK-RESOURCE-1, and PRD 04, each with a Requirement History entry where the contract changes.
- Register: one risk for one project store with many branches and worktrees, and one for a trigger run that is the first sync of a checkout.
- The version and the digest. Package bytes change in this phase, and the pull request check compares the package digest with `.github/release-candidates/v<version>.sha256`. Version 2.1.0 is released. The owner chose version 2.1.1, a patch release, on 2026-11-27 (owner gate OG-8, answered). So the last stage of this phase sets version 2.1.1 in `packages/cli/package.json` and `package-lock.json`, and records the first digest in `.github/release-candidates/v2.1.1.sha256` under standing rule 10. Every later phase commit that changes package bytes records the digest again.

## Exclusions

- No reminder line and no change to `work next` or `work status`. P2 owns them.
- No router line and no MCP server instruction. P3 owns them.
- No hook. P5 and P6 own them. The `--event` input exists here so that P4 can test with it.
- No person-editable event registry. The roadmap holds it.

## Acceptance

- The name catalog test passes with the entry `current`, and PRD 39 and PRD 25 match the code.
- The help of each of the two checkpoint commands names the other and says how they differ.
- The package holds version 2.1.1, and `.github/release-candidates/v2.1.1.sha256` matches the tarball of the phase commit.
- CLI and MCP results match for a direct run and for each event name.
- The six installed cases of the design pass: nothing due, files imported, a conflict, a claim that ended, no Store, and a folder that is not a Make Docs project.
- A second run right after the first changes nothing and says that nothing is due.
- A trigger run leaves every project file byte-identical, and `--event branch-change` leaves the store unchanged.
- A caller with read access only gets the read steps, the waiting line, and exit 0.
- The twin rule ID test passes, and fails on a one-sided fixture.

## Testing Decisions

- Automated Implementation Testing: required.
- Performance Testing: `not-needed-now`. `PERF-004-R1` already measured the sync that the checkpoint runs. P4 measures the trigger run.
- Guided Progress Review: selected. The owner sees the plain output of the six cases.
- Unassisted Goal Testing: `not-needed-now`.

## Dependencies

- W29 R0, which is released.
- Owner gate OG-1, only if no existing admission kind fits.
- Owner gate OG-8 is answered: version 2.1.1. It blocks nothing.

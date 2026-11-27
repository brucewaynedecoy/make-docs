---
title: "W35 R0 Evidence Report"
kind: "work"
status: "active"
coordinate: "W35 R0"
---

# W35 R0 Evidence Report

This report explains the acceptance evidence for the [W35 R0 backlog](00-index.md). Each section names the acceptance cases it covers, what was run, what it showed, and its limits.

## P1 Checkpoint Command

Covers A1 to A13 in [P1](01-checkpoint-command.md), the prepared part of A14, and the version part of A15. Evidence date: 2026-11-27. Branch: `docs/w35-store-authority-and-agent-reminders`, at `bab7c9ec`, with the phase changes uncommitted. Node `v26.13.1`. CLI package version `2.1.1`.

P1 is built and not marked complete. T1 to T17 are done. The orchestrator recorded T18, the digest file, on 2026-11-27 after the second review. The owner has not reviewed the plain output of the six cases (A14) or the 23 points of new behavior. A second review on 2026-11-27 found four more faults and five notes, and a second fix pass corrected them. A review pass on 2026-11-27 found faults in the first build, and a fix pass on the same day corrected them. This report states the code after the second fix pass.

### Owner Decisions Recorded In This Phase

The owner made two decisions on 2026-11-27, after Stage 1.

- Owner gate OG-1: option A. PRD 25 R-ACCESS-17 gains the rule that a write operation may check its write access inside its handler, at the step that needs it, as `work status` does for its read access. The checkpoint stays one registry operation with one MCP tool. A caller with read access only gets the read steps, a line that says the sync did not run, and exit code 0. An MCP call without the write permission (`allowWrite`) gets that same result. The orchestrator told the owner this consequence with option A, so it is part of the answer. The answer is recorded in the [plan](../../plans/2026-11-27-w35-r0-agent-checkpoints-and-triggers/00-overview.md#owner-decisions), the [index](00-index.md#owner-gates), the [phase file](01-checkpoint-command.md#stage-2---the-operation), and PRD 25.
- The scope of the git hook preference. With the machine preference on, setup installs the git hooks automatically only in new projects. An older project still gets the git hooks when the person wants them, through an explicit hook input or an explicit "yes" in an interactive setup of that project. This replaces recommendation R3 of the plan. It is recorded in the design (owner decision 5, OD-11, and the hooks section), the plan overview (R3), [P5](05-git-hooks-in-setup.md) in the plan and the backlog (T5, T6, T8, A53, A53b, A53d, A53f, and the new case A53g), the index, and the roadmap. This phase built no hook code.

The owner also decided the meaning of "new project" on 2026-11-27: the same as for the project name in PRD 38 R-ID-8, a fresh setup target with no config file. The plan lists it as R3a.

### What Was Built

- `packages/cli/src/operations/registry.ts` holds the new Store admission kind `step`, and admits `project.checkpoint.run` with the CLI path `project checkpoint`.
- `packages/cli/src/operations/project/checkpoint-ops.ts` holds the registry operation. It calls the core `workCheckpoint` in `packages/cli/src/operations/work/work-queue/checkpoint.ts`.
- `packages/cli/src/run/root-operations.ts` holds the CLI command `make-docs project checkpoint` with `--event`, `--target-root`, and `--json`.
- The MCP tool `project_checkpoint` (18 characters) is derived from the registry, in the profiles `backlog`, `workflow`, and `all`. `packages/cli/src/mcp/tools.ts` gives a `step` operation its own sentence about `allowWrite`.
- `packages/cli/src/operations/leaf-help-table.ts` holds the help of `make-docs project checkpoint`, and one new sentence in the help of `make-docs lifecycle checkpoint`.
- `packages/cli/src/operations/name-catalog.ts` holds the entry as current, with `addedBy: "W35 R0"`.
- `packages/cli/src/operations/work/work-store/catalog.ts` holds the rules `WORK-RULE-055` to `WORK-RULE-065`, the agent form section `checkpoint`, and the check `workRuleTwinProblems`.
- `packages/docs/template/.make-docs/system/references/work-store.md` holds the new `Checkpoint` section and one new row in the command table. `.make-docs/system/references/work-store.md` is its byte-identical copy.
- PRD 52 holds the new `### Checkpoint` section with R-WORK-CHECKPOINT-1 to R-WORK-CHECKPOINT-12, a new row in the Operations table, and changes to R-WORK-SYNC-9, R-WORK-STORE-6, R-WORK-QUEUE-11, and R-WORK-QUEUE-13. PRD 25 holds the `step` admission in R-ACCESS-17 and the changed R-MCP-PROFILE-12. PRD 39 holds the changed R-CHECKPOINT-CMD-1, -2, -4, and -5. PRD 06 holds the changed R-WORK-RESOURCE-1. PRD 04 holds five new terms. Each PRD has a `W35 R0 P1` Requirement History entry.
- From Stage 1: the PRD 39 R-CHECKPOINT-CMD section and table, PRD 25 R-MCP-PROFILE-12, the name catalog test for the new table, the [risk register](../../prd/03-open-questions-and-risk-register.md) entries R-039 and R-040, and version 2.1.1. The fix pass added register entry R-041.

### Name Gate (A1, A10)

- The name catalog test passes with the entry current: 49 tests. It compares the PRD 39 R-CHECKPOINT-CMD table and the PRD 52 Operations table with the catalog, and it fails on four broken fixture rows of the PRD 39 table. `project_checkpoint` has 18 characters and is in the `project` group.
- The shipped-text test passes with every line that names `make-docs project checkpoint` and `project_checkpoint`.
- PRD 39 R-RUN-1 did not change. The name catalog test did not ask for it, because R-RUN-1 lists no `project` command.
- PRD 25 R-MCP-PROFILE-12 names `backlog`, `workflow`, and `all`, and a test compares that line with the profile list in code.

### T4 Finding: Store Admission (A2)

Owner gate OG-1 opened. No existing Store admission kind let one registry operation hold the two access levels that the checkpoint needs. The owner answered on 2026-11-27 with option A.

The facts, from `packages/cli/src/operations/registry.ts`, `packages/cli/src/operations/access.ts`, and `packages/cli/src/operations/work/work-queue/operations.ts`:

- The checkpoint writes the Store and project files in its sync step. So `assertOperationAccess` needs `mutates: "write"` and a write in its declared access.
- `required`, the default kind: `invokeOperation` checks the caller against the declared access before the handler runs. A caller with read access only gets the typed `store-denied` refusal, and the handler never runs. With no Store, the Store session refuses with `store-unavailable`. In a folder with no project config, the caller check of an agent caller fails before the handler runs. Each of these is an error and not a result with exit code 0.
- `optional`: `assertOperationStoreAdmission` allows it only with `mutates: "read"` and `access.store: "read"`. PRD 25 R-ACCESS-17 says the same. The checkpoint writes, so the registry refuses to load the operation.
- `handler`: the handler opens its own Store session, but `invokeOperation` still runs the caller check with the declared access first. So a caller with read access only is refused in the same way as with `required`. PRD 25 R-ACCESS-17 does not name this kind. The machine-scope factory operations use it.
- `work.queue.status` checks the caller's access inside its handler and still returns a result when the caller is denied. It can do this only because it is a read-only operation with `optional` admission.
- One more barrier exists for a write operation. `invokeOperation` refuses a `mutates: "write"` operation when the surface did not allow writes. An MCP call must pass `allowWrite: true`. The owner's answer should say whether an MCP call without it gets the read steps or a refusal.
- One path exists in code that this phase did not use. `resolveTarget` may return a value before the access check, and the call returns that value. The registry documents it as a typed refusal with no Store admission. To return the read steps of the checkpoint through it would be a write operation that checks its own access. That is the new rule of option A, and no document allows it today.

Why a caller with read access only got no result before this phase: each kind that allowed a write checked the declared write access before the handler, and the one kind that deferred the check did not allow a write.

### The Step Store Admission (OG-1, Option A)

How it works:

- An operation may declare `storeAdmission: "step"`. `project.checkpoint.run` declares it, with `mutates: "write"` and the access of its sync step: Store write and project write.
- For a `step` operation, `invokeOperation` skips exactly three things that it does for a `required` write operation: the refusal when the surface did not allow writes, the caller check against the declared access, and the outer Store session. The table below lists every check before the handler, and each other check stays.
- The first build also skipped a fourth check, the guard that refuses a production Store operation with no explicit route, and the handler did not replace it. The review found this. The fix pass moved the skip, so that the guard runs for a `step` operation too.
- The handler does those three things itself, at the step that needs them. First it checks the caller's read access, with the same check as `work status`. A caller without it gets the "files are the authority" result. Then, only when the sync step would run, it checks the surface write permission and the caller's write access. A caller without one of them gets the read steps. Then it opens the Store session itself, with write access for a sync and read access for the read steps.
- A folder that is not a Make Docs project returns before any check of the handler, and reads no Store. The checks of the registry run first, as for every operation.

Every check of `invokeOperation` in `packages/cli/src/operations/registry.ts` before a handler runs, in the order of the code, and what a `step` operation gets:

| Check before the handler | A `step` operation |
| --- | --- |
| The admission check of the declaration (`assertOperationStoreAdmission`). | Gets it. It also refuses a `step` declaration that is not a full write declaration. |
| The pending refusal. | Gets it. |
| The refusal when the surface did not allow writes. | Skipped. The handler in `packages/cli/src/operations/project/checkpoint-ops.ts` checks `context.dryRun` and `context.writesAllowed` before its sync step, and gives the read steps without them. |
| The named approvals. | Gets it. The checkpoint names none. |
| The input schema. | Gets it. An unknown event name is refused here. |
| The check that an active operation has a handler. | Gets it. |
| The target resolution (`resolveTarget`), when the operation declares one. | Gets it. The checkpoint declares none. |
| The route guard: on the CLI and MCP surfaces, a production Store operation needs an explicit route. | Gets it, since the fix pass. |
| The caller check against the declared access (`assertHarnessOperationAllowed`). | Skipped. The handler calls `checkWorkHarness` with Store read and project read access first, and with Store write and project write access before its sync step. `checkWorkHarness` runs the same `assertHarnessOperationAllowed`. |
| The outer Store session (`withStoreSession`). | Skipped. The handler opens its own session, with write access for a sync and read access for the read steps. |
| The typed Store result for a Store failure (`scopeStoreAccessFailure`), around the handler. | Gets it. |

How it stays narrow:

- Only an operation that declares `step` gets it. A test lists every registry operation with that kind, and the list is `project.checkpoint.run` only.
- `assertOperationStoreAdmission` refuses a `step` declaration on a read-only operation, on an operation without Store write access, on an operation without project access, and on an operation with host configuration access. A test proves each refusal, and that `optional` and an unknown kind are refused as before.
- A test invokes every other active write operation of the registry without the write permission, and each one is refused with the same error as before. `tests/registry-contract.test.ts` keeps that check for all write operations and names the checkpoint as the one exception.
- A test invokes `work sync` and the checkpoint as an agent caller with no proved identity. `work sync` is refused with its typed Store result, as before. The checkpoint returns the "files are the authority" line and changes no store record. The same test invokes every other active Store write operation of the registry as that caller, with one plain input. None returns a result. The caller check refuses each operation that accepts the input. The input schema refuses each other operation earlier, so the test does not reach the caller check for those.
- A test invokes the checkpoint and `work sync` on the CLI surface and on the MCP surface with no explicit route. Each call is refused with "A production Store operation needs an explicit route.", and no store record and no file changes. This is the failing case of the review, and it now passes.
- A test reads the source of `invokeOperation` and finds exactly three skips for a `step` operation, with the caller skip after the route guard. It also checks the order of the checks that stay. The test fails on a fourth call of the helper `checksWriteAtStep`, on a new line in `invokeOperation` that reads `storeAdmission` or names `"step"`, and on a change of the helper. It does not catch a skip that is written with none of these words, such as a check of the operation ID.
- A test with the built CLI and a real setup sets each access limit. It calls the tool function in the same process, with the real connection key of that setup. It does not use the stdio transport. With read access only, the tool returns the read steps and changes nothing. With Store write and project read, the same. With write access and no `allowWrite`, the same result, field for field. With no Store access, the files line. `work_sync` without `allowWrite` is still refused.
- The tool description of `project_checkpoint` says what a call without write access gets. Every other write tool keeps the sentence that it requires `allowWrite=true`.

### T5 Finding: The Import-Only Sync (A2)

A trigger run can reuse the `holdWrites` option of `syncWorkFiles`. It needs no change in `packages/cli/src/operations/work/work-store/sync.ts` and no second copy of the sync table.

- `syncWorkFiles` writes a file in one loop and removes a copy in one loop. Each loop skips a path that a hold covers, records it in `held`, and leaves the file, its units, and its ledger entry as they were. The import step does not read the holds. The only other file changes are inside a settle, and a trigger run never settles.
- So a trigger run passes one hold for each work root (`docs/work` and `.make-docs/archive/work`), after the holds of the project config. Sync then imports under the one sync table and writes and removes nothing. Each file that it held for this reason is a file that waits for a direct run.
- The first-import path does not fit. It belongs to the checkout record: it runs only when the checkout has no sync yet, and it marks the checkout at its end. To reuse it for a later sync would need a new flag in the sync core.
- A trigger run with the event `branch-change`, and a caller with read access only, use `previewWorkSync`, the read-only check of `work status` and `work next`. It changes no Store record.
- One limit: when the store changed only what a file cannot show, a trigger run reports the file as waiting for a write. The next direct run then writes no byte and records the file as synced.

### The Operation On Its Surfaces (A3 to A9)

`packages/cli/tests/w35-r0-p1-checkpoint-surfaces.test.ts` (43 tests) and `packages/cli/tests/w35-r0-p1-checkpoint-core.test.ts` (33 tests) prove these points with a temporary Store at a fixed, checked path:

- A3: the CLI command and the registry give the same result for a direct run and for each of the six event names. With the built CLI and the tool function called in the same process with a real connection key, the CLI `--json` result and the MCP tool result are equal for the direct run and each event, and the plain output is the `summary` field of that result.
- A4: the plain output of a direct run starts with the summary line. When nothing was due, the line says so. The line says that the work files and the work store match only when that is true. When a file on the sync hold list differs from the store, sync could not write a file, or Make Docs cannot read a work file, the line gives the count, and the result names each file as `work sync` does. A conflict is named with its file and one settle command for each choice, and it is not settled.
- A5: a second run right after the first changes no store record and no file, and says that nothing is due.
- A6: a trigger run leaves every project file byte-identical, also when the store holds a record that a direct run would write. It prints nothing when nothing is due. With `--event branch-change` the store is unchanged, and the result says how many files wait.
- A7: a caller with read access only gets the read steps, the line that the sync waits with the count of files, and the fields `syncRan: false` and `syncSkipped: "read-access-only"`. The call does not fail. An MCP call without `allowWrite` gets the same result.
- A8: with no usable Store the result says that the `docs/work/` files are the authority, and the exit code is 0. The tests cover a computer with no Store, a checkout that is not bound, a Store with an old schema, and a Store that is not safe to use. In a folder that is not a Make Docs project the result says so, and the exit code is 0. No case creates a Store. The installed cases below show three of them with the built CLI.
- A9: the result names the checkout by its folder and its checkout ID, and the first sync of a checkout says so, with the count of files that it imported. A test with a second checkout proves the count when a first sync imports no file and stops one file as a conflict.
- More tests from the fix pass: a file on the sync hold list in a direct run, a read-only check, a branch change, and a trigger run (PRD 52 R-WORK-CHECKPOINT-3); a held file beside a file that waits; a work file that Make Docs cannot read; a copy that waits for a removal; five ready units with three shown; and two runs of the built CLI that start at the same time. Both runs end with exit code 0 and no conflict, and a later run ends with nothing due. That test found a fault in sync, which "Known Limits" and register entry R-041 record. The test has two limits. It closes the task with the outcome `done`, so it cannot show the outcome that the fault loses. It also passes when the two runs do not overlap.
- More tests from the second fix pass: a file that sync could not write, in a direct run, beside an imported file, in a read-only check, and in a trigger run; and a broken project config in a direct run and a trigger run.
- An unknown event name is refused with the list of the six names, in the same words on the CLI and the MCP tool.

Limit: the exit code 0 of a caller with read access only is proved by the MCP result and by the registry result, which return and do not throw. The closest real path is in the tests: a real setup and the tool function called in the same process, with a real connection key and an access limit of Store read and project read. No stdio transport is part of that test. No test starts the built CLI as an agent with a read-only access limit. The CLI takes its caller from an identity that a first-party agent tool passes and that Make Docs verifies against that tool's installed rules, and a test cannot make that identity in a sound way without a session of the agent tool. A built CLI with an invalid identity is refused before any operation runs. The CLI sets exit code 0 for every checkpoint result that returns.

### Help Texts (A10)

The help of `make-docs project checkpoint` holds this sentence: "This is not make-docs lifecycle checkpoint: that command records one step of one lifecycle run, and this command does all that is due for the work of the project." The help of `make-docs lifecycle checkpoint` holds: "This is not make-docs project checkpoint: that command does all that is due for the work of the project, and this command records one step of one lifecycle run." A test checks both texts and that each sentence is one sentence.

### Rule IDs And The Agent Form (A11, A12)

The checkpoint rules of the catalog `make-docs.work-store-rules.v1`:

| Rule ID | Rule | PRD 52 requirement |
| --- | --- | --- |
| `WORK-RULE-055` | The checkpoint does all that is due, in one order. | R-WORK-CHECKPOINT-1 |
| `WORK-RULE-056` | A direct run syncs both ways. | R-WORK-CHECKPOINT-2 |
| `WORK-RULE-057` | A trigger run only imports. | R-WORK-CHECKPOINT-3, R-WORK-SYNC-9 |
| `WORK-RULE-058` | A branch change imports nothing. | R-WORK-CHECKPOINT-4 |
| `WORK-RULE-059` | Nothing is due. | R-WORK-CHECKPOINT-5 |
| `WORK-RULE-060` | The checkpoint never settles a conflict. | R-WORK-CHECKPOINT-6 |
| `WORK-RULE-061` | Claims that ended or end soon. | R-WORK-CHECKPOINT-7, R-WORK-QUEUE-19 |
| `WORK-RULE-062` | The next ready work, in short. | R-WORK-CHECKPOINT-8 |
| `WORK-RULE-063` | A caller with read access only. | R-WORK-CHECKPOINT-9 |
| `WORK-RULE-064` | The checkpoint without a Store or a project. | R-WORK-CHECKPOINT-10, R-WORK-STORE-2 |
| `WORK-RULE-065` | The checkpoint names its checkout. | R-WORK-CHECKPOINT-11, R-WORK-SYNC-9 |

- Each rule ID sits in the `Checkpoint` section of the work store reference, and the catalog names that section as its agent form.
- The twin rule ID test passes. It fails on a fixture with a checkpoint rule ID in the catalog only, on one with a rule ID in the reference only, and on one with a rule outside its section.
- Each rule has a parity fixture, `WSF-073` to `WSF-083`. A test runs each fixture through the real checkpoint and compares the answer.
- The template reference and the installed reference are byte-identical. The shipped-text test passes.
- The `Checkpoint` section says that without the CLI or a usable Store there is nothing to sync, and what an agent does by hand.

### The Six Installed Cases (A14)

These are the plain outputs of the built CLI, `node packages/cli/dist/index.js project checkpoint`, in real project folders with a temporary Store at a fixed path. `<temp>` stands for the temporary folder. The project was set up with `make-docs setup --target <temp>/aurora --yes --no-codex --no-claude-code --no-skills`. Each run ended with exit code 0. The fix pass ran every case again on the final code. The owner has not reviewed these outputs.

Case 1, nothing due. A direct run right after another direct run:

```text
Checkpoint: nothing is due. The work files and the work store match.
Checkout: <temp>/aurora.
Ready work (2). Next:
  W1 R0 P1: Phase 1: First (docs/work/2042-06-01-w1-r0-aurora/01-first.md)
  W1 R0 P2: Phase 2: Second (docs/work/2042-06-01-w1-r0-aurora/02-second.md)
Claim the first one: make-docs work claim W1 R0 P1 --claimant <name> --expected-version 1
```

A trigger run at the same point, `make-docs project checkpoint --event commit`, printed nothing and ended with exit code 0.

Case 2, files imported. One work file was edited by hand:

```text
Checkpoint: 1 file imported.
Checkout: <temp>/aurora.
  Imported: docs/work/2042-06-01-w1-r0-aurora/01-first.md
Ready work (2). Next:
  W1 R0 P1: Phase 1: First (docs/work/2042-06-01-w1-r0-aurora/01-first.md)
  W1 R0 P2: Phase 2: Second (docs/work/2042-06-01-w1-r0-aurora/02-second.md)
Claim the first one: make-docs work claim W1 R0 P1 --claimant <name> --expected-version 2
```

The first run of the checkout, before case 1, said that it was the first sync and gave the count of files that it imported:

```text
Checkpoint: 3 files imported.
Checkout: <temp>/aurora. This run was the first sync of this checkout. A first sync only imports: it imported 3 files and wrote and removed no file.
  Imported: docs/work/2042-06-01-w1-r0-aurora/00-index.md
  Imported: docs/work/2042-06-01-w1-r0-aurora/01-first.md
  Imported: docs/work/2042-06-01-w1-r0-aurora/02-second.md
Ready work (2). Next:
  W1 R0 P1: Phase 1: First (docs/work/2042-06-01-w1-r0-aurora/01-first.md)
  W1 R0 P2: Phase 2: Second (docs/work/2042-06-01-w1-r0-aurora/02-second.md)
Claim the first one: make-docs work claim W1 R0 P1 --claimant <name> --expected-version 1
```

Case 3, a conflict. `make-docs work close` closed task `W1 R0 P2 T1` in the store, and then a person changed the text of that task in the file:

```text
Checkpoint: 1 conflict waits for a person.
Checkout: <temp>/aurora.
Conflict in docs/work/2042-06-01-w1-r0-aurora/02-second.md (both-changed): The file and the store both changed. A person decides.
  Keep the file. Make Docs imports it and replaces the store's version. Run: make-docs work sync --settle docs/work/2042-06-01-w1-r0-aurora/02-second.md --keep-file
  Keep the store. Make Docs rewrites the file from the store. Run: make-docs work sync --settle docs/work/2042-06-01-w1-r0-aurora/02-second.md --keep-store
Claim ended: W1 R0 P1 T2, claimed by builder-a, ended at 2026-11-27T20:19:29.151Z. Check the task, then release it: make-docs work release W1 R0 P1 T2 --handle <stopped|finished|not-found> --expected-version 1
Ready work (1). Next:
  W1 R0 P1: Phase 1: First (docs/work/2042-06-01-w1-r0-aurora/01-first.md)
Claim the first one: make-docs work claim W1 R0 P1 --claimant <name> --expected-version 2
```

The run did not settle the conflict. The claim line is from case 4, which ran before this case.

Case 4, a claim that ended:

```text
Checkpoint: nothing is due. The work files and the work store match.
Checkout: <temp>/aurora.
Claim ended: W1 R0 P1 T2, claimed by builder-a, ended at 2026-11-27T20:19:29.151Z. Check the task, then release it: make-docs work release W1 R0 P1 T2 --handle <stopped|finished|not-found> --expected-version 1
Ready work (2). Next:
  W1 R0 P1: Phase 1: First (docs/work/2042-06-01-w1-r0-aurora/01-first.md)
  W1 R0 P2: Phase 2: Second (docs/work/2042-06-01-w1-r0-aurora/02-second.md)
Claim the first one: make-docs work claim W1 R0 P1 --claimant <name> --expected-version 2
```

Limit of case 4: a claim lasts at least 20 minutes, so the built CLI cannot make a claim that already ended. A short script called the source function `workClaim` with a start time 40 minutes in the past, and the built CLI then ran the checkpoint. The line shows no claim ID.

Case 5, no Store. A project folder on a computer with no Make Docs Store:

```text
The docs/work/ files are the authority, because this computer has no Make Docs Store. The checkpoint synced nothing.
Run make-docs setup to create the Store. Read and edit the docs/work/ files directly. They are the authority until the Store is usable.
```

The exit code was 0. The first line gives the meaning, and the second line names the next command. The second line is the `nextAction` field of the result. A trigger run printed nothing and ended with exit code 0.

A checkout that is not bound to the Store, such as a new linked worktree, gets the same form:

```text
The docs/work/ files are the authority, because this checkout is not bound to the Store. The checkpoint synced nothing.
Run make-docs setup in this checkout. Read and edit the docs/work/ files directly. They are the authority until the Store is usable.
```

The exit code was 0, and a trigger run printed nothing.

Case 6, a folder that is not a Make Docs project:

```text
<temp>/plain is not a Make Docs project, so the checkpoint did nothing.
```

The exit code was 0. A trigger run printed nothing and ended with exit code 0. This case has no next command. After cases 5 and 6, no Store folder existed at the path of case 5, and the plain folder held no file.

### The Failing Cases Of The Review, Run Again

The fix pass ran the two cases of review finding M2 with the built CLI and a temporary Store.

A file is on `work.syncHold`, and the store holds a newer record. `make-docs work sync` names the file as held. The direct checkpoint now does the same and no longer says "match":

```text
Checkpoint: nothing is due. 1 held file differs from the work store, and sync never writes it.
Checkout: <temp>/aurora.
Held, not written: docs/work/2042-06-01-w1-r0-aurora/01-first.md. This path is on the sync hold list (work.syncHold in .make-docs/config.yaml), so Make Docs reads it and never writes or removes it.
```

A trigger run at that point printed nothing, and its `--json` result holds the file in the new `held` field with `quiet: true`.

Then one work file got broken front matter:

```text
Checkpoint: nothing is due. 1 held file differs from the work store, and sync never writes it. Make Docs cannot read 1 work file.
Checkout: <temp>/aurora.
Held, not written: docs/work/2042-06-01-w1-r0-aurora/01-first.md. This path is on the sync hold list (work.syncHold in .make-docs/config.yaml), so Make Docs reads it and never writes or removes it.
Cannot read docs/work/2042-06-01-w1-r0-aurora/00-index.md, line 2: The front matter is not valid YAML: Missing closing "quote The file is untouched.
```

The words after "line 2:" are the existing message of sync, and this phase did not change them.

The failing case of review finding M1 is a test now. See "How it stays narrow" above.

### Known Limits

- From a subfolder of a project, such as `docs/`, the checkpoint says that the folder is not a Make Docs project, and the exit code is 0. The built CLI printed `<temp>/aurora/docs is not a Make Docs project, so the checkpoint did nothing.` The checkpoint does not search parent folders. This phase did not change that. P4 to P6 must handle it: a hook runs the checkpoint at the project root, or passes `--target-root`. [P4](04-git-hook-proofs.md) T9 holds a line for it.
- "Claim the first one" can name a phase that the claim then refuses with `descendant-claimed`, when a task inside that phase holds a live claim. `make-docs work next` has the same older behavior. This phase did not change it.
- When the store changed only what a file cannot show, a trigger run reports the file as waiting for a write, and the next direct run writes no byte.
- A read-only check names a file that Make Docs cannot read without its line, because the check does not keep the line. Its line says that a direct run of `make-docs project checkpoint` names the line. For a caller with read access only, it says that a caller with write access must do that run.
- A read-only check and a trigger run do not try the write. So they name a file that sync cannot write as a file that waits for a write. The next direct run names it as not written.
- No test starts the built CLI as an agent with a read-only access limit. See the limit under "The Operation On Its Surfaces".
- Two runs at the same time can undo a close in the store, and the store does not fully recover. The first fix pass found this with a test that starts two built CLI processes at once. The cause: `syncWorkFiles` calls `scanWorkFiles` before `writeWorkStore`, so sync reads the work files before it takes the Store. In the test, the first run wrote a closed task to its file, and the second run imported the older file text and set the task back to open in the store. Both runs ended with exit code 0 and no conflict. A review on 2026-11-27 then proved the true effect with the built CLI. It closed a task with `make-docs work close "<unit>" --expected-version <n> --outcome cancelled` and started two `make-docs project checkpoint --json` runs at the same time. One run wrote the file, and the other imported that same file with its older text. The store showed the task as open. One more run gave a closed task with the outcome `done`. What is lost for good: the outcome `cancelled`, and the same happens with `superseded`, because a task line shows only that a task is closed. What is wrong until the next run: the unit shows as open and ready, so another agent can claim it. What recovers: the closed status, with the next run that imports the file. In the review, evidence rows and an in-progress status stayed, an older file scan with a missing file or a missing task stopped as a conflict, and notes and met gates were not checked. `make-docs work sync` in the released version 2.1.0 has the same fault, and it is older than the checkpoint. A trigger run imports, so each hook run that overlaps a run that writes a file can do this. This phase did not change the sync core. The fix is to move the file scan inside the Store write session and then to measure the sync time again. It is not built, and it waits for the owner's decision on where it goes. The [risk register](../../prd/03-open-questions-and-risk-register.md) holds the fault as R-041. No test fails on it: the test of this phase closes with the outcome `done` and also passes when the runs do not overlap.

### New Behavior That The Documents Did Not State

The design, the plan, and the phase file do not state these 23 points. Each one is kept, because it is sound, and each one waits for the owner's review at the phase report. None is an owner decision.

Two points need the owner's eyes first:

1. A work file that Make Docs cannot read is not "due". So a trigger run with only such a file prints nothing, and a hook stays silent about a broken work file. A direct run names the file and its line, and its summary line gives the count. `make-docs work status` also reports it. The owner may want a hook to print in this case.
2. PRD 52 R-WORK-QUEUE-13 gets an exception. That line says that every write needs an `expectedVersion` check. The checkpoint takes no expected version, and the line now names the checkpoint as its one exception. This changes a MUST line.

The other points from the first build:

3. "Ends soon" for a claim means that it ends within 10 minutes. This is `checkEverySeconds` of the claim policy, the same time as the check time of PRD 52 R-WORK-QUEUE-7, so a holder that checks on time renews before the line appears.
4. A claim that ended shows the release command. A claim that ends soon shows the renew command, with `<claim ID>` in the place of the claim ID. The claim that ends first comes first. Neither line shows a claim ID.
5. The short list shows at most three ready phases and quick items, the count of all ready units, and the claim command for the first one. `make-docs work next` gives the full list, and the result says so when more are ready.
6. A direct run that wrote or removed a file does not say that nothing is due. The design defines "nothing is due" without the files that a run wrote. A line "nothing is due" above a line "Wrote: ..." would say two different things, so the summary line says what the run did. The next run says that nothing is due. This differs from the letter of the design only for a direct run, because a trigger run never writes.
7. After a first sync, and after a file that the file system refused, a direct run lists the files that still wait and says to run the checkpoint again.
8. The result holds the fields `syncRan`, `syncSkipped`, and `quiet`. `syncSkipped` is `read-access-only`, `dry-run`, `branch-change`, `files-authority`, `not-a-project`, or null. `quiet` is true for a trigger run with nothing due. The fix pass added the fields `held` and `unreadable`. The second fix pass added the field `notWritten`.
9. A trigger run with no usable Store, or in a folder that is not a Make Docs project, prints nothing. A direct run prints its lines. This follows standing rule 5 for hooks.
10. With no usable Store, a direct run prints the next step of `work status`, such as the setup command, as a second plain line. The first build kept it only in the `nextAction` field, and the review asked for it in the plain output, because case A14 says that the next command must be visible. The phase file asks for "one line", so the owner may want one line only. A caller with no Store access gets the second line too.
11. A trigger run keeps the write holds of the project config before its own holds. So a file that the project config holds is reported as held and not as waiting for a direct run, which would never write it.
12. When the store changed only what a file cannot show, a trigger run still reports that file as waiting for a write. This is a known limit. The cost: a hook can print one line for a write that changes no byte.
13. A read-only check counts a file that waits for an import, a write, or a removal. It counts a file that the next sync would stop as a new conflict in its own line, and points to `make-docs work status`.

The other points from the second build pass:

14. `--json` prints the full result of a quiet trigger run, with `quiet: true`. Plain output prints nothing. The MCP tool must return a result, so `--json` does the same, and the two stay equal.
15. A dry run of the MCP tool (`dryRun: true`) gets the read steps with `syncSkipped: "dry-run"` and the line "Dry run: the sync did not run, and nothing changed." Every derived MCP tool takes `dryRun`, and no document said what the checkpoint does with it. The CLI command has no `--dry-run` option.
16. A caller with Store write access and project read access only gets the read steps. The sync step needs both, as `work sync` does.
17. The MCP tool description of a `step` operation has its own sentence about `allowWrite`. The first sentence of the tool summary says that the tool is not `lifecycle_checkpoint`.
18. `make-docs project --help` lists the checkpoint first.
19. The catalog names the checkpoint operation as a rule owner beside the nine `work` operations and the resource read, because it is a `project` operation that runs the work rules.

From the fix pass:

20. A file on the sync hold list that differs from the store is not "due". The summary line gives the count of such files, and the result names each one with the line of `work sync`, "Held, not written: ...". A trigger run with only such a file prints nothing. No sync ever writes a held file, so a line from a hook on each run would repeat with nothing that a person can run.

From the second fix pass:

21. A file that sync could not write from the store is not "due". An example is a store unit that the file does not record, because the file writer adds no unit. The result holds each such file in the new field `notWritten`, with the reason of `work sync`. The summary line gives the count and does not say that the files and the store match. The result names each file in one line. A direct run with only such a file says "Checkpoint: nothing is due. 1 file differs from the work store, and sync cannot write it." and "Not written: <path> (<reason>)". With other work in the same run, the summary line says "1 file not written" beside the other counts. `make-docs work sync` says "1 file not written: <path> (<reason>)". Each direct run repeats the line until a person changes the file or the store. A read-only check and a trigger run do not try the write, so they name the file as one that waits for a write.
22. With a broken project config, a direct run ends with exit code 0 and says that the `docs/work/` files are the authority, because this caller may not use the Store. `make-docs work sync` ends with an error in that project. A trigger run prints nothing, so a hook stays silent about a broken config. The owner may want an error, or a line from the hook, in this case.
23. The checkpoint shortens a refusal reason of many lines. A broken config gave one line for each problem, about 30 lines in the review. The first line of a direct run now holds the first line of the reason and the count of the lines that it does not show, and the second line is the next step. An example: "The docs/work/ files are the authority, because this caller may not use the Store: Invalid make-docs config: <path> (3 more lines not shown). The checkpoint synced nothing." The `reason` field of the result holds the same short text. The setup command of the next step shows each problem.

### Version (A15)

The owner answered owner gate OG-8 on 2026-11-27: the version is 2.1.1, a patch release. `packages/cli/package.json` and the CLI workspace entry of `package-lock.json` hold 2.1.1. `.github/release-candidates/v2.1.0.sha256` did not change. This phase did not create `.github/release-candidates/v2.1.1.sha256`. The orchestrator records the digest after the review, under standing rule 10 (T18). So the digest part of A15 is open.

### Checks

The second fix pass ran each check again on the final code. Every test and every CLI run used a temporary Store at a fixed path under `/private/tmp`, and each run checked first that `MAKE_DOCS_HOME` was not empty. No run read or wrote the real Store.

- `npm run prepack -w packages/cli`: the build passes.
- `npx tsc --noEmit -p packages/cli`: no errors.
- `npx vitest run tests/w35-r0-p1-checkpoint-surfaces.test.ts`: 43 tests pass.
- `npx vitest run tests/w35-r0-p1-checkpoint-core.test.ts`: 33 tests pass.
- `npx vitest run tests/name-catalog.test.ts` and `tests/w33-r0-shipped-text-names.test.ts`: pass.
- `npm run validate:defaults`: 53 tests pass.
- `npm run test:smoke-harness`: 19 tests pass.
- `make-docs check prd`: no diagnostics.
- `make-docs project paths validate`: 0 findings.
- `make-docs project markdown validate --path <file>` on each changed document: no findings on the design, the roadmap, the three plan files, the four backlog files, this report, PRD 04, PRD 06, PRD 52, and both copies of the work store reference. On PRD 03, PRD 25, and PRD 39 it reports findings only on lines that this phase did not change.
- `make-docs backlog snapshot --target-root .`: exit code 0, and no diagnostic names W35.

### Full Test Suite

`npm test -w packages/cli -- --testTimeout=120000` on the maintainer machine, on the final code, with `TMPDIR` set to a short folder under `/private/tmp`: 3,811 tests pass, 4 fail, and 6 are skipped, in 160 test files. This is the run of the second fix pass. None of the four is from this phase.

- `tests/mcp-app-contract.test.ts`: "gives a typed chat fallback for an unproved transport" and "opens the same factory and resource over real stdio". They fail on Node 26. Known, and not from this phase.
- `tests/consistency.test.ts` passes in this run, with register entry R-041 in its fixed list.
- `tests/p5-migration-safety.test.ts` "fixture 11" and `tests/w19-r5-skills-command.test.ts` pass in this run. The first one needs `TMPDIR` under `/private/tmp`. The second one passes because the orchestrator removed two stray empty folders under `packages/skills/factory/`.
- `tests/backup.test.ts`: "copies managed project files into a dated backup directory without modifying originals" fails when `TMPDIR` is a long path, because the boxed output then breaks the destination path across two lines. It passes with a short `TMPDIR`. This is not from this phase. It failed in this run.
- `tests/uninstall.test.ts`: "uninstall with backup reuses one audit snapshot and removes files after backup" failed in this run. It is a known failure with a long temp path, and it is not from this phase.

Eleven test files hold a fixed list or count of every operation, tool, or register entry. The build passes added `project.checkpoint.run` or `project_checkpoint` to ten: `mcp.test.ts`, `mcp-derivation.test.ts`, `mcp-profiles.test.ts`, `mcp-profile-discovery.test.ts`, `name-catalog.test.ts`, `operation-domains.test.ts`, `p3-operation-surfaces.test.ts`, `registry-contract.test.ts`, `reorganization-verification.test.ts`, and `w33-r0-p5-leaf-help.test.ts`. `consistency.test.ts` holds the register entries R-039 to R-041.

### Not Done

- T18: the orchestrator recorded the digest file `.github/release-candidates/v2.1.1.sha256` on 2026-11-27 after the second review. The full suite then gave 3,813 passed and 2 failed, and the 2 are the known `mcp-app-contract` failures on Node 26.
- A14: the owner has not reviewed the plain output of the six cases.
- The owner has not reviewed the 23 points under "New Behavior That The Documents Did Not State".
- No test starts the built CLI as an agent with a read-only access limit. See the limit under "The Operation On Its Surfaces".
- The fix for the fault of two runs at the same time (R-041) is not built. It waits for the owner's decision on where it goes.
- The limits under "Known Limits" stay.
- The guides do not name the new command yet. [P7](07-acceptance.md) updates the guides.

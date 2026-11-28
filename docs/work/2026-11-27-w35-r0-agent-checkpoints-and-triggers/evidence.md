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

These are the plain outputs of the built CLI, `node packages/cli/dist/index.js project checkpoint`, in real project folders with a temporary Store at a fixed path. `<temp>` stands for the temporary folder. The project was set up with `make-docs setup --target <temp>/aurora --yes --no-codex --no-claude-code --no-skills`. Each run ended with exit code 0. The fix pass ran every case again on the final code.

Owner review, 2026-11-27: the owner reviewed the plain output of the six installed cases below. This answers acceptance case A14 of [P1](01-checkpoint-command.md).

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
- Two runs at the same time can undo a close in the store, and the store does not fully recover. The first fix pass found this with a test that starts two built CLI processes at once. The cause: `syncWorkFiles` calls `scanWorkFiles` before `writeWorkStore`, so sync reads the work files before it takes the Store. In the test, the first run wrote a closed task to its file, and the second run imported the older file text and set the task back to open in the store. Both runs ended with exit code 0 and no conflict. A review on 2026-11-27 then proved the true effect with the built CLI. It closed a task with `make-docs work close "<unit>" --expected-version <n> --outcome cancelled` and started two `make-docs project checkpoint --json` runs at the same time. One run wrote the file, and the other imported that same file with its older text. The store showed the task as open. One more run gave a closed task with the outcome `done`. What is lost for good: the outcome `cancelled`, and the same happens with `superseded`, because a task line shows only that a task is closed. What is wrong until the next run: the unit shows as open and ready, so another agent can claim it. What recovers: the closed status, with the next run that imports the file. In the review, evidence rows and an in-progress status stayed, an older file scan with a missing file or a missing task stopped as a conflict, and notes and met gates were not checked. `make-docs work sync` in the released version 2.1.0 has the same fault, and it is older than the checkpoint. A trigger run imports, so each hook run that overlaps a run that writes a file can do this. This phase did not change the sync core. The fix is to move the file scan inside the Store write session and then to measure the sync time again. It is not built yet. The owner decided on 2026-11-27 to fix it in this Wave, before the hooks ship. The owner did not choose the phase. The orchestrator placed the fix in P4, before any hook installs: [P4 Stage 5](04-git-hook-proofs.md#stage-5---the-fix-for-two-syncs-at-the-same-time), tasks T18 to T23. The [risk register](../../prd/03-open-questions-and-risk-register.md) holds the fault as R-041. No test fails on it: the test of this phase closes with the outcome `done` and also passes when the runs do not overlap. Update of 2026-11-27, from P4: the fix is built. Sync now scans the work files inside its Store write session, tests that hold two runs at the Store at the same time fail on the older code and pass on the new code, and R-041 is closed. See [The Fix For Two Syncs At The Same Time](#the-fix-for-two-syncs-at-the-same-time-t18-to-t23-a47a-to-a47f).

### New Behavior That The Documents Did Not State

Owner review, 2026-11-27: the owner reviewed all 23 points of this list and keeps all 23 as built. Each point stays a build choice that the owner reviewed and kept.

The design, the plan, and the phase file do not state these 23 points. Each one was kept in the build, because it is sound.

Two points were put first for the owner's review:

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
- `make-docs backlog snapshot --target-root .`: exit code 0, no diagnostic names W35, and standard error is empty. The snapshot counts 7 phases and 106 tasks for this backlog.

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
- A14: answered. The owner reviewed the plain output of the six cases on 2026-11-27.
- The 23 points under "New Behavior That The Documents Did Not State": the owner reviewed them on 2026-11-27 and keeps all 23 as built.
- No test starts the built CLI as an agent with a read-only access limit. See the limit under "The Operation On Its Surfaces".
- The fix for the fault of two runs at the same time (R-041) is not built. The owner decided on 2026-11-27 to fix it in this Wave, before the hooks ship, and the orchestrator placed it in [P4 Stage 5](04-git-hook-proofs.md#stage-5---the-fix-for-two-syncs-at-the-same-time).
- The limits under "Known Limits" stay.
- The guides do not name the new command yet. [P7](07-acceptance.md) updates the guides.

## P2 Reminder and Read Commands

Covers A16 to A28 in [P2](02-reminder-and-read-commands.md), and the prepared part of A29. Evidence date: 2026-11-27. Branch: `docs/w35-store-authority-and-agent-reminders`, at `1a9c552c`, with the phase changes uncommitted. Node `v26.13.1`. CLI package version `2.1.1`.

P2 is built and not marked complete. T1 to T15 are done. Owner gate OG-2 did not open. The owner has not reviewed the lines (A29) or the points of new behavior below. An independent review ran on 2026-11-27 and found three faults and four smaller points. A fix pass on the same day corrected them, and this section shows the state after that pass. The fix pass waits for its own review. The orchestrator records the package digest after the review, under standing rule 10.

### P2 What Was Built

- `packages/cli/src/operations/work/work-queue/reminder.ts` is new. It holds the reminder line, the rule for the reminder set, the check `workReminderFor`, and the one slot that keeps the CLI line.
- `packages/cli/src/operations/registry.ts`: `invokeOperation` runs the check one time, after the handler returned and after the Store session of the command ended. The result of the call has the new field `reminder`. `listReminderOperationIds` builds the set from the registry.
- `packages/cli/src/run/entry.ts`: the CLI entry prints the line on standard error after the command ended, one time, and only when the command ends with exit code 0.
- `packages/cli/src/mcp/tools.ts`: a derived tool result carries the field `reminder`, which names the command and the tool. A tool with a fixed result schema carries none, and a result that is a refusal carries none.
- `packages/cli/src/operations/work/backlog/store-snapshot.ts`: the store-mode snapshot gives its sync check to the reminder.
- `packages/cli/src/operations/work/work-queue/queue.ts`: `work status` and `work next` name the checkpoint first, `work next` marks units and says when the list is not complete, and both results have new fields.
- `packages/cli/src/operations/work/work-queue/project-resource.ts`: each `backlog` read by project URI carries the fixed sentence.
- `packages/cli/src/operations/work/work-store/catalog.ts`: the rules `WORK-RULE-066` to `WORK-RULE-069`.
- `packages/docs/template/.make-docs/system/references/work-store.md` and its byte-identical copy `.make-docs/system/references/work-store.md`: what the reminder line, the mark, the "This list is not complete" line, and the URI sentence mean, and what to do.
- `packages/cli/src/operations/work/work-queue/queue.ts` also changes the end of the sync check line of `work status` and `work next`, where these two commands render it. The sync core still writes its own sentence for every other caller.
- PRD 52 holds the new `### Reminder` section with R-WORK-REMIND-1 to R-WORK-REMIND-7, and changes to R-WORK-SYNC-8, R-WORK-QUEUE-5, and R-WORK-URI-3. PRD 39 holds the new R-RENDER-4 and R-RENDER-5 and the table of the reminder set. PRD 25 holds the new R-MCP-REMIND-1 and R-MCP-REMIND-2. Each PRD has a `W35 R0 P2` Requirement History entry. The [risk register](../../prd/03-open-questions-and-risk-register.md) holds the new question Q-027 and the new risk R-042. PRD 51 did not change.
- `packages/cli/tests/w35-r0-p2-reminder.test.ts` is new, with 45 tests. `packages/cli/tests/w29-r0-p6-package-parity.test.ts` changed in one way: two expected sync check lines of `work next` now name the checkpoint. `packages/cli/tests/fixtures/work-store-contract.ts` holds the five new parity fixtures, and `packages/cli/tests/work-store-contract.test.ts` checks their shape. `packages/cli/tests/consistency.test.ts` holds Q-027 and R-042 in its fixed lists. `packages/cli/tests/w35-r0-p1-checkpoint-surfaces.test.ts` changed in one way: its two fixtures for "a rule ID that the catalog does not have" used `WORK-RULE-066`, which is a real rule now, so they use `WORK-RULE-999`.
- The `PERF-006` profile and result are in the [phase file](02-reminder-and-read-commands.md#performance-evidence), with the [harness](evidence/p2/performance/perf-006-harness.mjs) and the [results](evidence/p2/performance/perf-006-results.json).

This phase did not change the sync core, `packages/cli/src/operations/work/work-store/sync.ts`. It did not change any file in `.github/release-candidates/`.

### The Reminder Set (T1, A18)

A test builds the set from the registry: each active operation with Store access and project access in its declared access, without `work.queue.status`, `work.queue.next`, `work.queue.sync`, and `project.checkpoint.run`. The registry holds 76 operations now, with the checkpoint of P1. 55 declare Store access. Four of those declare no project access, and four are excluded. The set has 47 operations, and six of them sync first. How the snapshot is counted: `work.backlog.snapshot` is one of the 47 and one of the 41 that do not sync first. It runs no reminder check of its own, and it shows the reminder only with `--work-store`. So 46 operations run the check on each run: 40 that do not sync first, and the six that do. The test compares the set with the table of PRD 39 R-RENDER-5, and it fails on a missing row, a row that the registry does not have, a wrong CLI path, a wrong "Syncs first" cell, and a wrong "Shows the reminder" cell. One more test reads the source and finds that exactly the six functions `workAdd`, `workClaim`, `workClose`, `workExport`, `workRelease`, and `workReport` call `syncFirst`.

### T2 Finding: The MCP Path Of Each Changed Tool (A22)

`formatMcpToolResult` in `packages/cli/src/mcp/server.ts` has two paths. A tool whose operation declares `mcpResultSchema` goes through its fixed schema. Every other tool goes through the plain path: the result object is sent as JSON text in `content` and as `structuredContent`.

- Two operations declare `mcpResultSchema`: `backlog.review.open` and `backlog.review.refresh`. A test lists them from the registry. Only `backlog.review.refresh` is in the reminder set. Its MCP tool result carries no reminder, and it still passes its schema. Its operation still finds the waiting file, and its CLI command prints the line. `backlog.review.open` declares no Store access, so it is not in the set.
- The other 46 tools of the set take the plain path. Their result object gains the field `reminder`, after the field `result`, only when the reminder applies and the result is not a refusal. `backlog_snapshot` is one of the 46, and it gains the field only with `workStore: true`.
- `work_status` and `work_next` take the plain path. They are not in the set. Their own `lines` and `summary` fields name the `project_checkpoint` tool.
- This phase added no reminder to a tool with a fixed schema, so it needed no proof for that.

### The Reminder Check (T3, A16, A17, A20, A21)

How the check works, in order: it stops unless the operation is in the set and is the outermost operation of the call. For the backlog snapshot, it stops with no Store read unless the snapshot ran the sync check itself. It stops unless the target folder is a Make Docs project. For an operation with `optional` or `handler` Store admission, it runs the caller access check for a Store read and a project read, and stops when the caller does not have them. It runs the authority rule of `work status`, and stops when the work store is not in charge. Then it runs `previewWorkSync`, the read-only sync check of `work status` and `work next`, and gives the line when at least one file waits for import. Any error gives no line.

- A16: a test runs the real operation runner for each of the 40 operations that do not sync first and run the check on each run, with one work file that waits for import. Each one gives the line. The same test runs the backlog snapshot, the 41st: with a handler that does nothing and with its real handler by default it gives no line, and with its real handler and the work store option it gives the line, with no reminder check of its own. The test puts a handler that does nothing in the place of each real handler, so that it needs no input and no state for 40 different commands. The ID, the declared access, the Store admission, and the runner are the real ones. Five more tests run all 47 operations in each of these states, and none gives the line: nothing waits, only a conflict waits, only a file waits for a write, the work store is not in charge, and no Store exists. The check wrote no project file in any state, and it created no Store where none was. A unit test proves that a file that waits for a removal, a recorded conflict, an import that a recorded conflict holds, and a file that Make Docs cannot read do not count. One more test proves that a changed work file under a sync hold counts: the line shows, the checkpoint imports the file, and a held file that waits for a write does not count.
- A17: a test runs the six real commands that sync first, each on a store where one work file waited for import before the run. Each result shows that its own sync imported the file, no result has a reminder, and the store holds the new text after the run. In the same test, the check function alone gives the line before each run. So the test fails for a check that runs before the operation. A test with the built CLI shows the same for `make-docs work add`.
- A18: each of the 29 active operations outside the set gives no line with a waiting file. The real `work status`, `work next`, `work sync`, and checkpoint print nothing on standard error. `--help` of three commands of the set prints no line. A command whose operation returns a refusal ends with exit code 1 and prints no line.
- A20: after a direct checkpoint run, and after a trigger run, with write access, the next command shows no reminder. After a checkpoint run with read access only, the next command still shows it. After a checkpoint run that stopped one file as a conflict, the next command shows no reminder.
- A21: a forced error inside the check leaves standard output byte-identical, standard error empty, and the exit code 0. A Store that cannot be read at check time gives no line and creates no folder.
- Access: an agent route with no proved identity gets no check and no line for an operation with `optional` or `handler` admission. The registry refuses a `required` operation for that caller before its handler runs, so no check runs.
- Reuse: `backlog snapshot --work-store` ran the sync check one time, and the reminder ran no second check. `PERF-006` shows the same: about 20 ms added in place of about 190 ms. The default `backlog snapshot`, with no `--work-store`, reads only the files, runs no sync check, and gets no reminder and no reminder check. A test puts a counting check in the place of the sync check and finds zero calls. So PRD 51 R-BACKLOG-SNAPSHOT-24, "By default it reads no Store state", holds. With `--work-store` in a project where the files are the authority, the snapshot runs no sync check and gives no line.

Limit of A16: the 40 commands were not each run with their own real handler. The check runs in the runner after any handler, and it does not read the result of the handler. Real handlers ran for `project state status`, `project list`, `lifecycle list`, `backlog snapshot`, `backlog review refresh`, `factory status`, `factory workflow show`, the six commands that sync first, and the seven commands of `PERF-006`. These are 15 commands of the set.

### The CLI Line And The MCP Field (T4, T5, A19, A22)

- A19: for `project state status`, `project list`, and `lifecycle list` with `--json`, standard output is byte-identical with the reminder and with a check that finds nothing. The line is on standard error one time. The built CLI gives the same for plain output.
- One command run prints at most one line, also when it runs two operations of the set. `setup`, `mcp`, `update`, and `uninstall` print none. The line shows only when the command ends with exit code 0. A command that throws prints its error and no reminder. A command whose operation returns a refusal prints its result, ends with exit code 1, and prints no reminder: the CLI entry reads the exit code after the command and prints the line only when the code is 0 or not set.
- A22: with a real setup, a real connection key, and a real MCP client over an in-memory transport, the result of `project_state_status` holds the reminder in `structuredContent.reminder` and in the JSON text of `content`. The field names the command and the tool: `Work files wait for sync. Run: make-docs project checkpoint (MCP tool: project_checkpoint)`. With nothing waiting, the field is absent. The result of `factory_workflow_show` for a workflow that does not exist is a refusal, and it holds no reminder field, while `factory_status` in the same state holds it. The field `result` is the same in both cases. `backlog_review_refresh` passes its schema and holds no reminder text, although its operation found the waiting file.

### The Read Commands And The Project URI Read (T6 to T8, A23 to A26)

- A23: with one changed work file, the first line of `work status` and of `work next` names `make-docs project checkpoint` and the `project_checkpoint` tool. The sync check line near the end names the same command and tool, and the result names no other command for the sync. In `work next`, each unit of that file has the mark, at the levels phase, stage, and task, and units of other files have none.
- A24: with a new work file that the store does not hold, and in a checkout whose first sync is not done, `work next` says in exactly one line that the list is not complete, and the result has `listComplete: false`.
- A25: in each of these cases, the store records and every project file are the same before and after `work status` and `work next`.
- A26: each `backlog` read by project URI carries the fixed sentence one time, after the sentence about sync conflicts. The source of the read names no sync function, and the read opens the Store read only. The Store records and the files do not change.

Limit of A26: the sentence is on `backlog` reads only. A `tasks` read and a `factory` read carry none. The phase file says "each project URI read". See point 1 under "P2 New Behavior That The Documents Did Not State".

### The Lines For The Owner (A29)

These are real outputs of the built CLI, `node packages/cli/dist/index.js`, in a project folder with a temporary Store at a fixed path. The project was set up with `make-docs setup --target <temp>/aurora --yes --no-codex --no-claude-code --no-skills`. The owner has not reviewed these lines. The fix pass of 2026-11-27 ran each `work next` and `work status` case again with the final code, because their sync check line changed.

The reminder line, on standard error, after `make-docs project state status --json` with one changed work file and one new work file. The exit code was 0, and standard output held only the JSON result:

```text
Work files wait for sync. Run: make-docs project checkpoint
```

`make-docs work next` in the same state. It shows the first line, the "not complete" line, and one marked unit:

```text
2 work files wait for import, so this list can be out of date. Run this first: make-docs project checkpoint (MCP tool: project_checkpoint)
This list is not complete: 1 new work file waits for import, and the work store does not hold its units yet. Run: make-docs project checkpoint (MCP tool: project_checkpoint)
Ready phases (2), in order. Read each unit's revision with --json, for --expected-version:
  W1 R0 P1: Phase 1: First (docs/work/2042-06-01-w1-r0-aurora/01-first.md) [out of date: its file waits for import]
  W1 R0 P2: Phase 2: Second (docs/work/2042-06-01-w1-r0-aurora/02-second.md)
Sync check: 2 files to import. make-docs project checkpoint (MCP tool: project_checkpoint) applies the changes.
Changes nothing.
```

`make-docs work next --level task` in the same state:

```text
2 work files wait for import, so this list can be out of date. Run this first: make-docs project checkpoint (MCP tool: project_checkpoint)
This list is not complete: 1 new work file waits for import, and the work store does not hold its units yet. Run: make-docs project checkpoint (MCP tool: project_checkpoint)
Ready tasks (3), in order. Read each unit's revision with --json, for --expected-version:
  W1 R0 P1 T1: Build the parser. (docs/work/2042-06-01-w1-r0-aurora/01-first.md) [out of date: its file waits for import]
  W1 R0 P1 T2: Write the writer. (docs/work/2042-06-01-w1-r0-aurora/01-first.md) [out of date: its file waits for import]
  W1 R0 P2 T1: Ship it. (docs/work/2042-06-01-w1-r0-aurora/02-second.md)
Sync check: 2 files to import. make-docs project checkpoint (MCP tool: project_checkpoint) applies the changes.
Changes nothing.
```

`make-docs work status` in the same state:

```text
2 work files wait for import, so the work store is out of date. Run this first: make-docs project checkpoint (MCP tool: project_checkpoint)
The work store is the authority, because this checkout is bound to a usable Store. The docs/work/ files are its repo copy.
Repo copies are on: sync keeps the docs/work/ files and the store the same.
9 open units: 8 ready, 1 waiting. 0 quick items. 0 live claims.
Sync check: 2 files to import. make-docs project checkpoint (MCP tool: project_checkpoint) applies the changes.
Changes nothing.
```

`make-docs work next` in a checkout whose first sync is not done:

```text
3 work files wait for import, so this list can be out of date. Run this first: make-docs project checkpoint (MCP tool: project_checkpoint)
This list is not complete: this checkout has not synced yet, so the work store can lack its work files. Run: make-docs project checkpoint (MCP tool: project_checkpoint)
No phase is ready.
This checkout has not synced yet. The first work write command imports every backlog and writes no file. Sync check: 3 files to import. make-docs project checkpoint (MCP tool: project_checkpoint) applies the changes.
Changes nothing.
```

`make-docs work add "A quick item"` in the state with two waiting files printed nothing on standard error, and its result showed that its own sync imported both files. The next `make-docs project state status` printed no reminder.

The end of `make-docs resource read make-docs://project/aurora/backlog/W1/R0/`:

```text
Sync conflicts belong to one checkout, so this read does not show them. Run make-docs work next in a checkout to see them.
This read does not know whether work files wait for sync in a checkout. Run make-docs project checkpoint in a checkout to find out.
Changes nothing.
```

The reminder field of an MCP tool result, from `project_state_status` in a test with a real MCP client:

```text
Work files wait for sync. Run: make-docs project checkpoint (MCP tool: project_checkpoint)
```

A terminal shows these plain lines. When standard output is not a terminal, `work next` and `work status` print the full JSON result, and the lines above are its `summary` field.

### Run Of PERF-006 (T9 to T11, A27)

The [phase file](02-reminder-and-read-commands.md#perf-006-the-reminder-check-on-commands-with-store-read-access) is the one record of the profile and of result `PERF-006-R1`. The profile was written, with its digest, before the three counted runs. In plain lines:

- The machine: the maintainer machine, macOS 27.2.1 arm64, Apple M2 Pro, 10 cores, 16 GiB, Node `v26.13.1`.
- The method: the method of `PERF-004`. The packed candidate was installed two times in temporary folders. The second install had the check taken out: `workReminderFor` returns null in its first statement. Each of three runs used a fresh clone of this repository and a fresh temporary Store, and five rounds of each command, state, and build. So each number is the median of 15 samples.
- The work files: 471 work files and 4,382 store units.
- The CLI floor, `make-docs --version`: 86 ms to 87 ms.
- A command that does not sync first: the check adds 189 ms to 196 ms. For example, `project state status` takes 124 ms with no check and 317 ms with the check. `lifecycle list`, `factory status`, `work evidence read`, and `resource ensure --dry-run` give the same picture.
- `backlog snapshot --work-store`: the check adds about 20 ms (3,082 ms and 3,101 ms). The reminder reused the sync check of the snapshot. The command did not pay for the check two times.
- `work add`, which syncs first: the check adds about 160 ms (412 ms and 570 ms with nothing waiting, 498 ms and 658 ms with one waiting file). The run with a waiting file also measures the command's own sync, which imports the file.
- The largest added time: 196 ms.
- OG-2: the gate did not open. It opens only above 1 second.
- "Fast path: not now" of 2026-11-23: the result gives no reason to change it. The cost of the exact check is now on the 46 commands of the set that run it, and not only on the work commands. Register entry Q-027 holds the question and says to look again at about 900 work files, or when a person reports a slow command.
- Limits: one machine, one repository, a warm file cache, one waiting file, and 7 of the 47 commands. `backlog review refresh` was not measured, because it needs the session data of a review app. The default `backlog snapshot` was not measured. After the fix pass it runs no reminder check, and the profile exclusions say so. That sentence was added to the profile after the run, so the source digest of the profile changed. The budget ledger records it. The fix pass changed the reminder check in one branch, for a backlog snapshot that ran no sync check, and `PERF-006` was not rerun. The ledger gives the reason, and the reviewer and the owner decide whether it holds.
- One trial run of the harness, with 1 run and 1 round, ran before the counted runs and is not part of the result.

`make-docs check performance-evidence` reports `PERF-006` as valid and no diagnostic for the phase file. The check as a whole still reports `failed`, because of the older `PERF-001` records and of warnings in other files. That was the same before this phase.

### Rule IDs And The Agent Form (T12, A28)

| Rule ID | Rule | PRD 52 requirement |
| --- | --- | --- |
| `WORK-RULE-066` | Files that wait for import come first: the first line of the read commands, and the reminder line. | R-WORK-SYNC-8, R-WORK-REMIND-1, R-WORK-REMIND-2 |
| `WORK-RULE-067` | `work next` marks a unit whose file waits for import. | R-WORK-QUEUE-5 |
| `WORK-RULE-068` | `work next` says when the list is not complete. | R-WORK-QUEUE-5 |
| `WORK-RULE-069` | A project URI read does not know what waits for sync. | R-WORK-URI-3 |

- The fix pass changed the text of `WORK-RULE-066` in the catalog and in both copies of the reference: the line shows only for exit code 0, the MCP field names the tool, a changed file on the sync hold list counts, and the backlog snapshot shows the line only with `--work-store`. No rule ID changed.
- Each rule ID sits in its section of the work store reference: `Sync`, `Readiness`, and `Project URIs`. The twin rule ID test passes. It fails on a rule ID in the catalog only, on one in the reference only, and on a rule outside its section.
- The template reference and the installed reference are byte-identical.
- The reference says that without the CLI or a usable Store no reminder, no mark, and no "not complete" line appears, because no store can be behind the files.
- Each rule has a parity fixture, `WSF-084` to `WSF-088`, of the new kind `read-wait-scenario`. A test runs each fixture through the real `work next`, `work status`, and project URI read, and compares the answer.

### The Failing Cases Of The P2 Review, Run Again

The fix pass ran the failing cases of the review of 2026-11-27 again with the built CLI, `node packages/cli/dist/index.js`, in a project folder with a temporary Store at a fixed path. One work file was changed and one was new, so two files waited for import.

M1, a command that fails. `make-docs factory workflow show x --json` for a workflow that does not exist: the result was `refused` with the refusal `record-not-found`, the exit code was 1, and standard error was empty. Before the fix pass, standard error held the reminder line. `make-docs project state status --json` in the same state ended with exit code 0, and standard error held:

```text
Work files wait for sync. Run: make-docs project checkpoint
```

M2, the default snapshot. `make-docs backlog snapshot --target-root .` ended with exit code 0, and standard error was empty. `make-docs backlog snapshot --target-root . --work-store` in the same state ended with exit code 0, and standard error held the reminder line. A test also proves that the default snapshot runs no reminder check.

For the owner, on M2: the reviewer named a second option, to keep the reminder on the default snapshot and to change PRD 51. The fix pass did not take it, because PRD 51 is the standing authority and the owner approved no change to it. That option stays possible if the owner asks for it.

M3, a held file. With the folder of the backlog on `work.syncHold` and one changed work file in it, `make-docs work status` said this:

```text
1 work file waits for import, so the work store is out of date. Run this first: make-docs project checkpoint (MCP tool: project_checkpoint)
The work store is the authority, because this checkout is bound to a usable Store. The docs/work/ files are its repo copy.
Repo copies are on: sync keeps the docs/work/ files and the store the same.
8 open units: 7 ready, 1 waiting. 1 quick item. 0 live claims.
Sync check: 1 file to import. make-docs project checkpoint (MCP tool: project_checkpoint) applies the changes.
Sync never writes these held paths: docs/work/2042-06-01-w1-r0-aurora.
Changes nothing.
```

`make-docs project state status` printed the reminder line on standard error. `make-docs project checkpoint` then said "Checkpoint: 1 file imported." and named the file, and the next `make-docs project state status` printed no reminder. So a hold stops only a write and a removal, and PRD 52 R-WORK-REMIND-2 now says "a held file that waits for a write or a removal". The agent form, the rule text, and the design did not hold the wrong statement.

The smaller points of the review:

- S1: the sync check line of `work next` and `work status` names the checkpoint. The outputs under "The Lines For The Owner" show it.
- S2: the gate tables of the [index](00-index.md#owner-gates) and of the [plan](../../plans/2026-11-27-w35-r0-agent-checkpoints-and-triggers/00-overview.md#owner-decisions) state the `PERF-006` result for OG-2.
- S3: the MCP `reminder` field names the command and the `project_checkpoint` tool.
- S4: the `PERF-006` profile exclusions say that the default `backlog snapshot` was not measured and runs no check.

### P2 Known Limits

Each of the first three limits can only miss a line. None can show a false line or change a result.

- A work file with no read permission: a command of the set prints no reminder line and ends with exit code 0, and the error inside the check is dropped. The fix pass proved it with the built CLI. The next step for a person: `make-docs work status` or `make-docs project checkpoint`. Each one ends with an error that names the file.
- `make-docs backlog review refresh` checks the folder where the command runs, and not the folder in its envelope. When the two differ, the line can be missing.
- One CLI run that runs two outer operations keeps only the result of the last one. When the first one found a waiting file and the last one found none, the line is missing.
- Not from this phase: `make-docs work add "x" --dry-run` takes the flag, ignores it, and writes the Store. The fix pass proved it with the built CLI and a temporary Store: the result said "Added task 1: x.", and `make-docs work next --level quick-item` then listed the item. The help of the command does not list `--dry-run`. Only `work add` was checked. This phase did not fix it. [Register entry R-042](../../prd/03-open-questions-and-risk-register.md) holds it. The owner decided on 2026-11-27 to fix it in this Wave, and the orchestrator placed the fix in [P7 Stage 4](07-acceptance.md#stage-4---the-fix-for-an-unknown-option-on-a-write-command).
- From a subfolder of a project, such as `docs/`, a command of the set shows no reminder. See "P2 Not Done".

### P2 New Behavior That The Documents Did Not State

The design, the plan, and the phase file do not state these 22 points. Each one waits for the owner's review. None is an owner decision. The fix pass of 2026-11-27 changed points 3, 7, 9, and 19 and added point 22. Each of those points says so.

Three points need the owner's eyes first:

1. The fixed sentence is on `backlog` reads by project URI only. A `tasks` read and a `factory` read carry none. The phase file says "each project URI read" (A26). The reasons: quick items and factory records come from no work file, so no file can wait for sync for them. PRD 52 R-WORK-URI-7 says that a `tasks` read and the file of `work export --quick` come from one renderer, so the sentence would also go into that file. PRD 53 owns the `factory` reads. PRD 52 R-WORK-URI-3 states this rule now. The owner can ask for the sentence on every read.
2. The six commands that sync first pay for the check too, about 160 ms each, after their own sync. The phase file keeps them in the set. After a good sync nothing waits, so the check finds a file only when a work file changed while the command ran. The owner can take these six out of the set to save the time.
3. Changed by the fix pass. The backlog snapshot is counted in the reminder set and runs no reminder check of its own. The default `make-docs backlog snapshot`, with no `--work-store`, shows no reminder and reads no Store state, as before this phase and as PRD 51 R-BACKLOG-SNAPSHOT-24 says. With `--work-store` it shows the reminder from the sync check that it ran itself. With `--work-store` in a project where the files are the authority, it shows none. The first build ran the access check, the authority rule, and the sync check after the default snapshot. The review found that this broke PRD 51, and the fix pass took it out. New here: one command of the set shows the reminder only with an option. The reviewer's second option, to change PRD 51, was not taken.

The other points:

4. `setup` prints no reminder, also when it runs a registry operation of the set inside, such as the checkout registration. The design lists `mcp`, `update`, and `uninstall`, and not `setup`.
5. An operation that runs inside another operation leaves the reminder to the outermost one. `backlog review refresh` runs the snapshot and the cache lookup inside it, so one check runs and not three.
6. The reminder reuses a sync check only for a read-only command. A write command can change the state after such a check, so it always runs its own.
7. Changed by the fix pass. The reminder shows only when the command ends with exit code 0. A command that throws shows none, because the check runs only after the handler returned. A command whose operation returns a refusal shows none, because the CLI entry reads the exit code after the command. For such a command the check still runs, and its result is not shown. In the first build such a command printed the line.
8. In an MCP result the field is named `reminder`. It stands beside the field `result`, and it is absent when no reminder applies. The canonical operation result does not change.
9. Changed by the fix pass. The MCP reminder field holds the CLI command and the tool name: `Work files wait for sync. Run: make-docs project checkpoint (MCP tool: project_checkpoint)`. So the MCP field and the CLI line differ in their last words. The first build held the CLI command only, and an agent with MCP only cannot run a command. The `project_checkpoint` tool is in the profiles `backlog`, `workflow`, and `all` only, and a tool of the set can be in another profile. So a caller can still read the name of a tool that its profile does not hold.
10. The first line of `work status` and `work next` has this form: "<n> work files wait for import, so <effect>. Run this first: make-docs project checkpoint (MCP tool: project_checkpoint)". It gives the count of files. It is not the reminder line.
11. The mark is the text `[out of date: its file waits for import]` at the end of the unit's line, in the ready list and in the waiting list. In the JSON result each unit has the field `fileWaitsForImport`.
12. The results of `work next` have the new fields `filesWaitingForImport` and `listComplete`. The result of `work status` has the new field `filesWaitingForImport`.
13. "A new work file" means a file that waits for import and that the store holds no unit of. A moved file whose units the store holds under another path can count as new.
14. When the first sync of a checkout is not done, the "not complete" line gives that reason and not the count of new files.
15. The reminder does not count an import that a recorded conflict holds. That file waits for a person.
16. The check does not apply the import guards, as `work status` does not. So the line can show for a file that the real sync then stops as a conflict. After that sync the conflict is recorded, and the line is gone.
17. The reminder shows on a command with `--dry-run` too, because the check reads only.
18. The reminder also runs for a call with no CLI or MCP surface, such as a test. Such a call holds no line for the CLI.
19. Changed by the fix pass. The sync check line of `work next` and `work status` ends with "make-docs project checkpoint (MCP tool: project_checkpoint) applies the changes." So one result names one command. The `sync.summary` field of both results holds the same text. The sync core did not change: `work status` and `work next` replace the end of the sentence where they render it. Every other result that holds the sync check line, such as the store-mode snapshot, keeps the sentence of the sync core, "The next work write command, or make-docs work sync, applies the changes." The first sync line still says "The first work write command imports every backlog and writes no file." before it names the checkpoint.
20. The rule for the reminder has no rule ID of its own. `WORK-RULE-066` covers the first line of the read commands and the reminder line together, because the rule catalog can name only the work commands, the resource read, and the checkpoint as the CLI form of a rule.
21. The `PERF-006` run with no check is made by a change of the installed package in a temporary folder, not by a product setting. Make Docs has no switch that turns the reminder off.
22. Added by the fix pass. For an MCP tool result, "a refusal" means a result with `result: "refused"` or `accepted: false`. These are the two forms for which the CLI ends a work or factory command with exit code 1. The MCP rule applies them to every tool of the set. The CLI also ends some commands with another exit code for other results, such as a `project layout` result with the status `blocked`. Such a result prints no reminder in the CLI, and its MCP tool result can still carry the field. So the CLI and MCP differ in that case.

### P2 Checks

The fix pass of 2026-11-27 ran each check again on the final code, and these are its results. Every test and every CLI run used a temporary Store at a fixed path under `/private/tmp`, and each run checked first that `MAKE_DOCS_HOME` was not empty. No run read or wrote the real Store.

- `npm run prepack -w packages/cli`: the build passes.
- `npx tsc --noEmit -p packages/cli`: no errors.
- `npx vitest run tests/w35-r0-p2-reminder.test.ts`: 45 tests pass.
- The two P1 test files, the registry contract test, the consistency test, the work store contract test, the W29 package parity test, the name catalog test, and the shipped-text test, with the P2 test file: 278 tests pass in 9 files.
- `npm test -w packages/cli -- --testTimeout=120000`, on the final code, with `TMPDIR` set to a short folder under `/private/tmp`: 3,858 tests pass, 2 fail, and 6 are skipped, in 161 test files. The 2 are `tests/mcp-app-contract.test.ts` "gives a typed chat fallback for an unproved transport" and "opens the same factory and resource over real stdio". They fail on Node 26. Known, and not from this phase. `tests/backup.test.ts` and `tests/uninstall.test.ts` pass with the short `TMPDIR`. An earlier run with a longer `TMPDIR` showed their known failures.
- `npm run validate:defaults`: 53 tests pass.
- `npm run test:smoke-harness`: 19 tests pass.
- `make-docs check prd`: passed, no diagnostics.
- `make-docs check performance-evidence`: `PERF-006` is `valid`, with the result outcome `pass`. No error names a W35 file. Three warnings of the kind `PERF-VAL-014` name W35 files. Two are on lines that existed before this phase. One is on the closeout line of this phase file about owner gate OG-2, which names the 1 second line of the gate. The warning asks only for a review by hand. The check as a whole reports `failed`, with 17 errors in older records, as before this phase.
- `make-docs project paths validate`: 0 failing findings.
- `make-docs project markdown validate --path <file>` on each changed document: no findings on PRD 52, the design, the three changed plan files, the index, the phase files of P1, P2, and P4, this report, and both copies of the work store reference. On PRD 03, PRD 25, and PRD 39 it reports findings only on lines that this phase did not change.
- `make-docs backlog snapshot --target-root .`: exit code 0, and no diagnostic names W35.

### P2 Not Done

- A29: the owner has not reviewed the lines.
- The owner has not reviewed the 22 points under "P2 New Behavior That The Documents Did Not State".
- The fix pass of 2026-11-27 has no independent review yet.
- `PERF-006` was not rerun after the fix pass. See the budget ledger of the [phase file](02-reminder-and-read-commands.md#budget-ledger).
- The package digest is not recorded again. The orchestrator does that after the review, under standing rule 10. This phase changed package bytes, so the recorded digest is stale.
- 40 of the 47 commands of the set were not measured, and 40 commands were tested through the real runner with a handler that does nothing. See the limit of A16.
- No test starts the built CLI as an agent with a read-only access limit. The limit of P1 stays.
- From a subfolder of a project, such as `docs/`, a command of the set shows no reminder, because the check looks at the folder that the command names and does not search parent folders. The checkpoint has the same limit, which P1 recorded.
- The guides do not name the reminder yet. [P7](07-acceptance.md) updates the guides.
- The fault of register entry R-041 stays. This phase did not change the sync core. The owner decided on 2026-11-27 to fix it in this Wave, before the hooks ship, and the orchestrator placed the fix in [P4 Stage 5](04-git-hook-proofs.md#stage-5---the-fix-for-two-syncs-at-the-same-time).
- The fault of register entry R-042, `make-docs work add` with `--dry-run`, is not fixed. The owner decided on 2026-11-27 to fix it in this Wave. The owner did not choose the phase. The orchestrator placed it in P7, and [P7 Stage 4](07-acceptance.md#stage-4---the-fix-for-an-unknown-option-on-a-write-command) holds it as tasks T14 to T19.
- The limits under "P2 Known Limits" stay.

## P3 Routers and MCP Instructions

Covers A30 to A37 in [P3](03-routers-and-mcp-instructions.md), and the prepared part of A38. Evidence date: 2026-11-27. Branch: `docs/w35-store-authority-and-agent-reminders`, at `23c105ab`, with the phase changes uncommitted. Node `v26.13.1`. CLI package version `2.1.1`.

P3 is built and not marked complete. T1 to T9 are done. The owner has not read the lines (A38) or the points of new behavior below. One independent review ran on 2026-11-27, and its fix pass is in this report: see [The Review Of P3 And Its Fix Pass](#the-review-of-p3-and-its-fix-pass). The check of that fix pass has not run yet. One finding of the review waits for the owner: the `docs/work/` note. The orchestrator records the package digest after the review, under standing rule 10.

### P3 What Was Built

- `packages/docs/template/AGENTS.md` and `packages/docs/template/CLAUDE.md`: one new line in the managed block, before the commit line. The block has 11 lines with its two marker lines. The budget of `scripts/check-instruction-routers.sh` is 12.
- `packages/docs/template/docs/work/AGENTS.md` and `packages/docs/template/docs/work/CLAUDE.md`: the note replaces the work store line of release 2.1.0, in the managed block. The block keeps its line count.
- `packages/docs/template/.make-docs/system/references/work-store.md`: the new part `### When to Run It` at the end of the `Checkpoint` section, and one changed sentence in the first paragraph of that section.
- The installed copies of this repository: `AGENTS.md`, `CLAUDE.md`, `docs/work/AGENTS.md`, `docs/work/CLAUDE.md`, and `.make-docs/system/references/work-store.md`. The text of this repository after the block of `AGENTS.md` and `CLAUDE.md` did not change.
- `packages/cli/src/mcp/instructions.ts` is new. It builds the work rule from the tool names of the name catalog, and it decides from the listed tools whether a connection gets the rule. When the catalog does not hold one of the three names as current, it gives no instructions and throws no error.
- `packages/cli/src/mcp/server.ts`: `createMakeDocsMcpServer` gives the instructions to the server when the profile lists the three tools. No other code changed.
- `packages/cli/tests/w35-r0-p3-routers-and-mcp-instructions.test.ts` is new, with 36 tests. No other test changed.
- PRD 15 holds the new `### Work Store Router Discovery` section with R-WORK-ROUTER-1 to R-WORK-ROUTER-5. PRD 25 holds the new `### MCP Server Instructions` section with R-MCP-INSTR-1 to R-MCP-INSTR-4. PRD 39 R-NAME-6 gained three sentences. Each PRD has a `W35 R0 P3` Requirement History entry. PRD 06 did not change: its R-WORK-RESOURCE-1 already says that the `Checkpoint` section says when to run the checkpoint.

This phase did not change the sync core, any work file of the template, any file in `.github/release-candidates/`, or any W22 R2 file. It changed no pinned digest, no size limit, and no snapshot.

### The Lines For The Owner (A38)

The exact wording of these texts is a proposal. The owner did not decide it. Each text waits for the owner's review. The counts are bytes and words of the text as shown, with no line end.

The root router line, in the managed block of `AGENTS.md` and `CLAUDE.md` at the project root (349 bytes, 58 words). Every agent in every project reads it in every session:

```text
- When the work store is in charge of this project's work (`make-docs work status` says which side is), find work with `make-docs work next`, not with file searches, and run `make-docs project checkpoint` after you change a file under `docs/work/` and after you close a phase. Otherwise, or without the CLI, the `docs/work/` files are the authority.
```

The `docs/work/` note, in the managed block of `docs/work/AGENTS.md` and `docs/work/CLAUDE.md` (526 bytes, 80 words). The line that it replaces had 293 bytes and 40 words. This text waits for the owner's answer on its first sentence, and the fix pass did not change it:

```text
- When the work store is present, it is the authority (`make-docs work status` says which side is in charge). Find work with `make-docs work next`, and run `make-docs project checkpoint` after you edit a file here. Without the CLI or a usable Store, these files are the authority: read and edit them directly. For the rules, and to claim, report, or close work, use a valid local `.make-docs/system/references/work-store.md` body or, when it is absent, run `make-docs resource read make-docs://system/reference/work-store.md`.
```

The trigger text of the work store reference, at the end of its `Checkpoint` section (1,053 bytes, 184 words, with the heading left out):

```text
### When to Run It

Run the checkpoint yourself at three moments:

1. At the start of a session, before you find or pick work.
2. After you edit a file under `docs/work/`.
3. After you close a phase.

Each of the three is a direct run: run `make-docs project checkpoint` with no `--event`, or call the `project_checkpoint` tool with no `event`. The tool syncs only with `allowWrite: true`, and without it gives the read steps and says that the sync did not run. A direct run is safe to repeat. So also run one when you do not know whether work files changed, such as after a commit or a pull.

The checkpoint knows six events: `session-start`, `files-changed`, `turn-end`, `commit`, `branch-change`, and `phase-closed`. An event name belongs to a trigger run, and only a hook starts a trigger run. You never start one, and you need no hook for the three moments above.

Without the CLI, there is no checkpoint to run. Without a usable Store, a run syncs nothing and says that the `docs/work/` files are the authority. In both cases the `docs/work/` files are the authority.
```

The first paragraph of the `Checkpoint` section changed in one sentence. Before: "Run it when you start a session, after you change a work file, at the end of a turn, after a commit or a pull, and when you close a phase." Now: "[When to Run It](#when-to-run-it) names the moments."

The MCP server instructions (528 bytes, 80 words). The text before the fix pass had 437 bytes and 67 words. The `all`, `backlog`, and `workflow` profiles send this same text. The `core`, `setup`, `quality`, and `factory` profiles send no instructions:

```text
When you start work on this project's backlog, call `project_checkpoint` with no `event`. Add `allowWrite: true` only when your task may change this project's files. When the work store is in charge (`work_status` says which side is), find work with `work_next`, not with file searches, and call `project_checkpoint` with `allowWrite: true` after you change a file under `docs/work/` and after you close a phase. Without a usable Store, the `docs/work/` files are the authority: `project_checkpoint` says so and changes nothing.
```

The text is true to the tool of Phase 1. A call without `allowWrite` gets the read steps and a result that says the sync did not run (PRD 25 R-MCP-PROFILE-12). So an agent that only reads or reviews writes nothing when it obeys the first sentence. With the Store in charge, a call with `allowWrite: true` is a full two-way sync: it writes the Store, and it can write and remove files under `docs/work/`. So the text asks for it only from an agent whose task may change project files, and after that agent changed a work file or closed a phase.

How each text meets the owner's rule that the note holds with no Store:

| Case | The root line | The `docs/work/` note | The MCP instructions |
| --- | --- | --- | --- |
| A usable Store, and the work store is in charge | The "When" sentence applies. | The "When" sentence applies. | The agent runs the checkpoint. It syncs only with `allowWrite: true`. |
| A Store is present, and the files are in charge, such as a fresh clone or a linked worktree that is not bound | The "When" sentence does not apply, and the word "Otherwise" of the last sentence applies. | Not proven. The first sentence says that a present work store is the authority, which is false in this case. The words in brackets send the agent to `make-docs work status`. This case waits for the owner. | `project_checkpoint` says in one line that the files are the authority. |
| No usable Store | The word "Otherwise" of the last sentence applies. | The "Without" sentence applies. | The last sentence applies. |
| No CLI | The last sentence applies. | The "Without" sentence applies. | No MCP server runs, so no instructions exist. |

#### The Review Finding On The Note, Which Waits For The Owner

The independent review of 2026-11-27 found that the `docs/work/` note is false in one case. Its first sentence says: "When the work store is present, it is the authority". A Store can be present and not in charge: in a fresh clone, and in a linked worktree that is not bound to the Store. In that case the files are the authority, and the note says the opposite. The words in brackets send the agent to `make-docs work status`, and they do not make the first sentence true.

"Present" is the owner's own word. So the fix pass did not change the note, its tests, or PRD 15 R-WORK-ROUTER-2. The orchestrator asks the owner. No decision is recorded here.

PRD 15 R-WORK-ROUTER-3 says that both texts are true "in a project where the files are in charge". That statement holds for the root line. It is not proven for the note, and this report does not claim it. The statement and the note wait for the owner's answer.

The reviewer's proposed replacement text for the note, exactly:

```text
- When the work store is in charge (`make-docs work status` says which side is), find work with `make-docs work next`, and run `make-docs project checkpoint` after you edit a file here. Otherwise, or without the CLI, these files are the authority: read and edit them directly. To claim, report, or close work, use a valid local `.make-docs/system/references/work-store.md` body or, when it is absent, run `make-docs resource read make-docs://system/reference/work-store.md`.
```

The root line and the MCP instructions use "in charge".

### The Copies (T4, A30)

- `docs/work/AGENTS.md`, `docs/work/CLAUDE.md`, and `.make-docs/system/references/work-store.md` match their template files byte for byte.
- The template files `AGENTS.md` and `CLAUDE.md` hold only the managed block. This repository's `AGENTS.md` and `CLAUDE.md` start with exactly those bytes and then hold this repository's own text. So for these two files "byte-identical" means: the installed block is the template file, byte for byte.
- The test function `copyProblems` checks the five files. It fails on a fixture with a changed block, with one more line end in a `docs/work/` router, and with a changed heading in the reference. It does not fail for a project's own text after the root block.
- `bash scripts/check-instruction-routers.sh`: "Instruction router check passed." The script needs the system temp folder, so this one run was outside the sandbox.

### The Update Path (T5, A33)

A real run by hand, with the released package `@brucewaynedecoy/make-docs@2.1.0` from the registry, the built CLI of this branch, and the temporary Store `/private/tmp/claude/p3/store-a`. Each run checked first that `MAKE_DOCS_HOME` was not empty.

1. The 2.1.0 CLI set up two projects with `make-docs setup --yes --target . --codex-method none --claude-code-method none --github-copilot-method none --no-skills`. The SHA-256 of the installed `AGENTS.md` was `f853bac8…28793c`, and of `docs/work/AGENTS.md` it was `e65810f8…124c24`. These are the hashes of the two files at git tag `v2.1.0`.
2. The project with unchanged blocks: `make-docs setup --yes` with the same method options, from the built CLI, ended with the status `complete`. Its actions were `update` for `AGENTS.md`, `CLAUDE.md`, `docs/work/AGENTS.md`, and `docs/work/CLAUDE.md`, and nothing else. After the run, each of the four files matched its template file byte for byte (`cmp`).
3. The project with changed blocks: a person's line was added inside the block of `AGENTS.md` and of `docs/work/AGENTS.md`, and a person's own text after each block. The same command ended with the status `blocked` and exit code 0. The actions were `skip-conflict` for the two changed files. The message named both files: "Existing conflicting make-docs managed block was skipped because no reassert resolution was provided." The next action was: "Review and repair the listed files without deleting project content, then run `make-docs setup` again." `shasum -c` showed that both changed files kept their bytes. The two unchanged files of that project, `CLAUDE.md` and `docs/work/CLAUDE.md`, also kept their 2.1.0 text, because a blocked run writes nothing.
4. The same project with `--conflicts keep`: the run again ended `blocked`, with "The reviewed plan does not permit migration (ambiguous-ownership)." The files kept their bytes. See the known limits.
5. The same project with `--conflicts overwrite`: the run ended `complete`. Each block was replaced with the new block. The person's text after each block stayed, and the person's line inside the block was gone. The run made a backup under `.make-docs/backup/`.

What a person with a hand-edited managed block sees after an update to 2.1.1:

- The same `blocked` result as before this phase, with the conflict review. This phase changed no rule of that review.
- The new lines arrive only after an interactive setup, or after `make-docs setup` with `--conflicts overwrite`. Each of the two replaces the person's text inside the block and keeps a backup under `.make-docs/backup/`. The person's text outside the block stays.
- While a project is `blocked` on one changed router, its unchanged routers keep the old text. So the person gets none of the new lines until the review is done.

Both limits exist before this phase: the `blocked` result with no way to keep a changed block in a `--yes` run, and the old text in the unchanged routers of a blocked project. W22 R1 and W22 R2 own those rules, and this phase did not change them.

The test file repeats steps 2, 3, and 5 through the planner: a project whose four routers hold the 2.1.0 blocks, with the 2.1.0 hashes in its install record. The test proves that its 2.1.0 blocks have the hashes of step 1.

### The MCP Instructions (T6, A35)

A real run of the built CLI over stdio, `make-docs mcp --profile <profile>`, with a client of the MCP SDK and the same temporary Store:

| Profile | Tools listed | `project_checkpoint` listed | Instructions |
| --- | --- | --- | --- |
| `all` | 82 | yes | The text above. |
| `backlog` | 15 | yes | The text above. |
| `workflow` | 25 | yes | The text above. |
| `core` | 9 | no | None. |
| `setup` | 25 | no | None. |
| `quality` | 13 | no | None. |
| `factory` | 14 | no | None. |

The tests connect a client to each of the seven profiles in the test process and check the same. They also check that each tool that the instructions name is in the tool list of that connection, and that the rule is not sent when one of its three tools is not listed. One more test gives the functions a catalog where one of the three operations is `planned`, and a catalog where it is absent: no error is thrown, and no instructions are sent. One more test checks that no sentence orders a call at the start of every session, and that each sentence with `allowWrite` ties it to a change of project files.

The table above is the run of the first pass. The fix pass ran the `all` profile and the `core` profile again over stdio with the built CLI: see [The Review Of P3 And Its Fix Pass](#the-review-of-p3-and-its-fix-pass).

### The Name Test (T7, A36)

The test function `nameProblems` reads the code spans of a text. It fails when a `make-docs` path is not a current command of the name catalog, when a tool name is a former catalog name, when a tool name is not in the given tool list, and when the text lacks the current checkpoint command or tool. It runs on the root line and the note in the template and in the installed copy, on the trigger text and the whole reference in both copies, and on the MCP instructions with the tool list of each connection. It fails on these fixtures: `make-docs project sync-all`, `make-docs work list`, `make-docs work evidence write`, `make-docs run work backlog snapshot`, `make-docs project path-hygiene validate`, `backlog_cache_read`, `project_checkpoint_run`, a catalog where the checkpoint entry is `planned`, and a catalog where the checkpoint has another name. The shipped-text scan of W33 R0 P4 did not change, and it still passes on all files.

### P3 Known Limits

- A router line is text. An agent that reads no router, or does not obey it, is not reached. The design says so for all of Phase 1.
- A host can drop the MCP server instructions. Nothing in the server can tell whether a host showed them to its agent.
- Not from this phase: in the changed project, `make-docs setup --yes --conflicts keep` did not finish. It ended `blocked` with "ambiguous-ownership". So a person who wants to keep a changed block cannot get the other files of that run updated with `--yes`. W22 R1 and W22 R2 own these rules, so this phase did not look for the cause and did not change it.
- Not from this phase: while a project is `blocked` on a changed `AGENTS.md`, its unchanged `CLAUDE.md` keeps the old text. The two files of the pair then differ until a person finishes the review.
- The name test checks code spans only. A command in plain prose with no code span is not read.
- The tests of A31 are text matches. They compare each line with a fixed text and check that fixed parts are in it. They do not prove that a reader can act on a line with no other document, and they do not prove that a line is true in each Store state. The table under [The Lines For The Owner](#the-lines-for-the-owner-a38) is a reading by the implementing agent, not a test.
- The tests of A32 are text matches on the template copy of the reference, plus the byte match of the installed copy. No test runs the checkpoint at the three moments.
- The test of A34 reads only the template folder: it checks that `packages/docs/template/docs/work` holds the two router files and no other file. It does not read this repository's `docs/work/`, it computes no digest, and it starts no sync. That no work file of this repository changed for the routers is a fact of the staged change set, which changes `docs/work/AGENTS.md`, `docs/work/CLAUDE.md`, and files of this backlog only.
- A host that asks the person before each call with the write permission asks when an agent obeys the instructions after an edit under `docs/work/` or after a phase closes. It does not ask at the first call, which has no write permission unless the task may change project files.
- An agent decides for itself whether its task "may change this project's files". No code checks that choice.

### P3 New Behavior That The Documents Did Not State

The design, the plan, and the phase file do not state these 15 points. Each one waits for the owner's review. None is an owner decision.

1. The root line does not name `make-docs resource read`. The proposed text of the design named it as a second read command. The line is shorter without it, and `make-docs work next` is the command that an agent needs first. The line says "find work" and not "read work".
2. The root line says "(`make-docs work status` says which side is)" and not "says so", as the review of the design asked. Its last sentence is "Otherwise, or without the CLI, the `docs/work/` files are the authority." The proposed text of the design said "Without the CLI or a usable Store". The review of this phase found that those words do not cover a usable Store with a checkout that is not bound, so the fix pass changed them.
3. The `docs/work/` note keeps the words "to claim, report, or close work" from the line that it replaces. It also keeps the form of the other router lines: a valid local body first, then `make-docs resource read` with the URI.
4. The MCP instructions name `allowWrite: true` two times, each with a condition: the agent adds it to the first call only when its task may change this project's files, and it passes it after it changed a file under `docs/work/` and after it closed a phase. Without it, the tool does the read steps only and says that the sync did not run (PRD 25 R-MCP-PROFILE-12). The first text of this phase told every agent to pass it at the start of every session. The review found that this made the write intent automatic, also for an agent that only reviews or answers a question, and the fix pass removed it.
5. The MCP instructions tell an agent to call the checkpoint "when you start work on this project's backlog", and not at the start of every session. So an agent with a task that is not backlog work is not told to call it. The design's event table names the start of a session. The words "start work on this project's backlog" are narrower, and they are new. The checkpoint itself finds who is in charge, and with no usable Store it changes nothing.
6. The server decides from the listed tools, and not from the profile name, whether it sends the rule. The rule needs all three tools: `project_checkpoint`, `work_status`, and `work_next`.
7. A profile with no work tool sends no `instructions` field at all. No profile sends any other instruction text.
8. The tool names in the instructions come from the name catalog when the server starts. If one of the three operations is not a current catalog entry, the server sends no instructions and starts as before. Advice text cannot stop the server. A test holds the three names, so the name test is the guard, and a second test proves that a catalog without a current name gives no instructions and no error. The first text of this phase stopped the server in that case, also for a profile that sends no text, and the fix pass removed that.
9. The trigger text is its own part, `### When to Run It`, at the end of the `Checkpoint` section. It has no rule ID, because no CLI rule decides when an agent runs a command.
10. The trigger text replaces the earlier sentence of five moments. "At the end of a turn" and "after a commit or a pull" are not in the list of three moments. The text says that an agent also runs the checkpoint when it does not know whether work files changed, such as after a commit or a pull. `turn-end` stays in the list of the six events.
11. The trigger text says that an agent needs no hook for the three moments.
12. The name test of this phase is its own, stricter test, beside the shipped-text scan of W33 R0 P4. PRD 39 R-NAME-6 says so.
13. The PRDs fix the meaning of each text and not its exact words, because the owner has not approved the words. PRD 15 R-WORK-ROUTER-1 and PRD 25 R-MCP-INSTR-1 say so and point to this report for the proposed words. One exception waits: PRD 15 R-WORK-ROUTER-2 holds the words "When the work store is present, it is the authority", which are the owner's own words and wait for the owner's answer.
14. The trigger text names the two forms of the event input: `--event` for the command and `event` for the tool. It says that the tool syncs only with `allowWrite: true`, and without it gives the read steps and says that the sync did not run.
15. The trigger text keeps the moment "at the start of a session, before you find or pick work" for a direct run by an agent. The MCP instructions say "when you start work on this project's backlog". The two texts differ in these words.

### The Review Of P3 And Its Fix Pass

One independent review of P3 ran on 2026-11-27, before any commit of the phase. The fix pass checked each finding against the code first. Each finding was right. The fix pass recorded no owner decision for this phase.

| Finding | What the review found | Result |
| --- | --- | --- |
| M1 | The MCP instructions told every agent to call `project_checkpoint` with `allowWrite: true` at the start of every session, with no condition. PRD 25 R-MCP-INSTR-1 said the same as a MUST. With the Store in charge, that call is a full two-way sync. | Fixed. The first call has no write permission unless the agent's task may change project files. The later calls name the write permission, after a change under `docs/work/` and after a closed phase. R-MCP-INSTR-1 has the new meaning, and its words "in the same conditional words" are gone. |
| M2 | The `docs/work/` note is false when a Store is present and not in charge. | Not changed. It waits for the owner. See [the finding](#the-review-finding-on-the-note-which-waits-for-the-owner). |
| S1 | The last sentence of the root line did not cover a usable Store with a checkout that is not bound. | Fixed: "Otherwise, or without the CLI, the `docs/work/` files are the authority." |
| S2 | A catalog without a current name for one of the three tools stopped the MCP server in every profile. | Fixed. The server sends no instructions in that case, and a test proves it. |
| S3 | The reference named the tool argument as `--event`. | Fixed. The text names `--event` for the command and `event` for the tool, and it says that the tool syncs only with `allowWrite: true`. |

The reference keeps the moment "at the start of a session, before you find or pick work". It gives no order to pass the write permission, and its new clause says what the tool does without it. The root line held no session-start order, so only its last sentence changed.

The fix pass also softened the PRD text. PRD 15 R-WORK-ROUTER-1 and PRD 25 R-MCP-INSTR-1 now say that they fix the meaning and not the words, and they point to this report. PRD 15 R-WORK-ROUTER-2 and R-WORK-ROUTER-3 did not change, because they wait for the owner's answer on the note.

The owner's decision of 2026-11-27 on register entry R-042 is recorded in the register, the plan, and the backlog: fix it in this Wave. The owner did not choose the phase. The orchestrator placed it in [P7 Stage 4](07-acceptance.md#stage-4---the-fix-for-an-unknown-option-on-a-write-command), as tasks T14 to T19 and cases A79a to A79f. The backlog now has 112 tasks.

Checks of the fix pass, on the final files, with the temporary Store `/private/tmp/claude/p3fix/store`. Each run checked first that `MAKE_DOCS_HOME` was not empty. No run read or wrote the real Store.

- `npm run prepack -w packages/cli`: the build passes.
- `npx tsc --noEmit -p packages/cli`: no errors.
- `npx vitest run tests/w35-r0-p3-routers-and-mcp-instructions.test.ts`: 36 tests pass.
- `npm test -w packages/cli -- --testTimeout=120000`, with `TMPDIR=/private/tmp/claude/x`: 3,894 tests pass, 2 fail, and 6 are skipped, in 162 test files. The 2 are the known failures of `tests/mcp-app-contract.test.ts` on Node 26. `backup.test.ts` and `uninstall.test.ts` pass with this temp path. Two documents changed after this run started: this report and the index. The run of the next line covers them.
- A second run on the final files: the P3 test file, the consistency test, the managed block test, the nine MCP test files without `mcp-app-contract.test.ts`, the name catalog test, the two router test files, the shipped-text test, the P1 surfaces test, `backup.test.ts`, and `uninstall.test.ts`. 402 tests pass in 17 files.
- `npm run validate:defaults`: 53 tests pass.
- `npm run test:smoke-harness`: 19 tests pass.
- `bash scripts/check-instruction-routers.sh`: "Instruction router check passed." This one run was outside the sandbox, because the script needs the system temp folder.
- `make-docs check prd --target-root .`: the status `passed`, exit code 0, no diagnostics.
- `make-docs project paths validate`: 1,139 files checked, 0 findings.
- `make-docs project markdown validate --path <file>` on each changed document: no findings on this report, the index, the P3 and P7 phase files, the two plan files, and both copies of the work store reference. On PRD 03, PRD 15, PRD 25, and PRD 39 it reports findings only on lines that this phase did not change.
- `make-docs backlog snapshot --target-root . --json`: exit code 0, standard error is empty, and no diagnostic names W35. The snapshot counts 7 phases and 112 tasks for this backlog.
- The five template files and their installed copies: `cmp` shows that `docs/work/AGENTS.md`, `docs/work/CLAUDE.md`, and the reference match whole, and that the block of the root `AGENTS.md` and `CLAUDE.md` equals the template file. The text after the block of both root files equals the text at `23c105ab`.
- A real run of the built CLI over stdio, with one `initialize` request: `make-docs mcp --profile all` answers with the instructions as shown above, and `make-docs mcp --profile core` answers with no `instructions` field.
- Not run again in the fix pass: `npm run smoke:pack:local`, the update by hand from the released 2.1.0 package, and the stdio run of the other five profiles. The results above for them are from the first pass, before the text changed.

### P3 Checks

The checks below are from the first pass, before the review. The section above holds the checks of the fix pass.

Every test and every CLI run used a temporary Store at a fixed path under `/private/tmp`, and each run checked first that `MAKE_DOCS_HOME` was not empty. No run read or wrote the real Store.

- `npm ci`, then `npm run prepack -w packages/cli`: the build passes.
- `npx tsc --noEmit -p packages/cli`: no errors.
- `npx vitest run tests/w35-r0-p3-routers-and-mcp-instructions.test.ts`: 34 tests pass.
- `npm test -w packages/cli -- --testTimeout=120000`, on the final code, with `TMPDIR=/private/tmp/claude/p3/s`: 3,890 tests pass, 4 fail, and 6 are skipped, in 162 test files. Two of the 4 are `tests/mcp-app-contract.test.ts` "gives a typed chat fallback for an unproved transport" and "opens the same factory and resource over real stdio". They fail on Node 26 because of a deprecation warning on standard error. Known, and not from this phase. The other two are one test in `tests/backup.test.ts` and one in `tests/uninstall.test.ts`. They failed because that temp path was still too long, so the output box wrapped a path. With `TMPDIR=/private/tmp/claude/x` both files pass.
- A second run after the last document change, with `TMPDIR=/private/tmp/claude/x`: the P3 test file, `backup.test.ts`, `uninstall.test.ts`, the shipped-text test, the name catalog test, the consistency test, the P1 surfaces test, and the W29 agent twin test. 245 tests pass in 8 files.
- `npm run validate:defaults`: 53 tests pass.
- `npm run test:smoke-harness`: 19 tests pass.
- `npm run smoke:pack:local` (`node scripts/smoke-pack.mjs --mode local`), with a temporary Store: "[smoke:pack] PASS mode=local". The script packs the CLI, installs the tarball in a temp folder, and compares the router bytes after an update. Its last step, `scripts/w22-r1-package-proof.mjs`, could not reach the registry from the sandbox in the first run. The second run gave it the released 2.0.5 tarball through `MAKE_DOCS_RELEASED_205_TARBALL`, and it passed.
- `bash scripts/check-instruction-routers.sh`: passed.
- `make-docs check prd --target-root .`: exit code 0, no diagnostics.
- `make-docs project paths validate`: 1,139 files checked, 0 findings.
- `make-docs project markdown validate --path <file>` on each changed document: no findings on this report, the P3 phase file, and both copies of the work store reference. The six router files are skipped as instruction router files. On PRD 15, PRD 25, and PRD 39 it reports findings only on lines that this phase did not change.
- `make-docs backlog snapshot --target-root .`: exit code 0, and no diagnostic names W35.
- The update by hand and the MCP run over stdio: see the sections above.

### P3 Not Done

- A38: the owner has not read the lines.
- The owner has not answered the review finding on the `docs/work/` note. PRD 15 R-WORK-ROUTER-3 is not proven for the note until then.
- The owner has not reviewed the 15 points under "P3 New Behavior That The Documents Did Not State".
- The fix pass of the first independent review has no check by a reviewer yet.
- The package digest is not recorded again. The orchestrator does that after the review, under standing rule 10. This phase changed package bytes, so the recorded digest is stale.
- No session of a real agent tool read the router lines or the MCP instructions. [P7](07-acceptance.md) holds the recorded agent sessions.
- The guides do not name the router lines or the MCP instructions yet. P7 updates the guides.
- The merge with W22 R1 and W22 R2 is not done. The branch that merges second rebases and reruns the router tests and the byte-match tests.

## P4 Git Hook Proofs

Covers A39 to A47 and A47a to A47f in [P4](04-git-hook-proofs.md). Evidence date: 2026-11-27. Branch: `docs/w35-store-authority-and-agent-reminders`, at `d12d1047`, with the phase changes uncommitted. Node `v26.13.1`. git 2.47.1. CLI package version `2.1.1`. The platform run of 2026-11-28 ran commit `965ad51e` with git 2.56.1 on Linux, macOS, and Windows. See [Platform Run](#platform-run).

P4 is built on the maintainer machine and not marked complete. Each task that a builder on this computer can do is done. The platform run is done, and this section records its results. Three things wait:

- T10. The access runs inside each agent tool belong to the orchestrator under standing rule 11. The steps, a script, and the table are ready below. No run exists, so each tool has "no proof gathered" today.
- The owner. Owner gate OG-4 is open, and A46 waits for the owner's answer. The owner has not reviewed the points under "P4 New Behavior That The Documents Did Not State".
- The independent review of this phase, and the package digest, which the orchestrator records after the review.

Every test, measurement, and CLI run used a temporary Store at a fixed path under `/private/tmp/claude`, and each run checked first that `MAKE_DOCS_HOME` was not empty. No run read or wrote the real Store. Each git test worked only inside a temporary folder that the test made, with a temporary home folder, with empty files in place of the global and the system git config, and with local bare repositories in place of a network remote. No test ran a git command in this repository's checkout.

### P4 What Was Built

- One product change: `syncWorkFiles` in `packages/cli/src/operations/work/work-store/sync.ts` now scans the work files inside its Store write session (T18). Nothing else in the product changed. This phase installs no hook and adds no setup code.
- `packages/cli/tests/git-hook-proof.ts`: the helper of the git proofs. It builds temporary repositories, writes a hook that records each run with its arguments and the state marks of git, refuses a git command outside its temporary folder, and writes one log line for each fact with the platform and the git version.
- `packages/cli/tests/w35-r0-p4-git-hook-facts.test.ts`: 34 tests for T1 to T7. The review correction of 2026-11-27 added 9: a cherry-pick of one commit, two cherry-picks that stop for a conflict, four forms of a revert, `git am`, and a temporary folder with a single quote in its name.
- `packages/cli/tests/w35-r0-p4-hook-checkpoint.test.ts`: 17 tests for T7 (the checkpoint in the hooks after a merge and after a rewrite), T9, T11, and T12. The review correction added 2: a trigger run, and a commit with a foreground proof hook, while another process holds the Store.
- `packages/cli/tests/w35-r0-p4-sync-race.test.ts`: 5 tests for T19 to T21 and the read-only check of A47a. The review correction split the test of T21 into one test for a progress note and one for a met gate.
- `.github/workflows/platform-safety.yml`: the two git proof test files are in both fixed lists (T8, T9). The orchestrator added the race test file to both lists on 2026-11-27 after the review, so that the race tests also run on macOS and Windows in the platform job.
- `packages/cli/tests/consistency.test.ts`: the fixed list of register entries holds R-043 to R-045.
- [PRD 52](../../prd/52-work-store-and-work-queue.md): R-WORK-SYNC-1 and a `W35 R0 P4` Requirement History entry (T23).
- The [risk register](../../prd/03-open-questions-and-risk-register.md): R-041 is closed, R-043 to R-045 are new, and R-039 and R-040 name the P4 results (T16, T23).
- The P4 phase file: the `PERF-007` profile and its result, and the requalification record of `PERF-004`. The W29 R0 P6 phase file: the result `PERF-004-R2` beside `PERF-004-R1`.
- `evidence/p4/`: the three measurement harnesses, their results, and the script that prepares the access proof of T10. The third harness is the comparison in one session that the review asked for.

### The Git Facts By Platform (T1 To T4, A39)

Each row is one test or more in `packages/cli/tests/w35-r0-p4-git-hook-facts.test.ts`. Each test writes one log line that starts with `W35-R0-P4-GIT-FACT` and holds the platform, the git version, and what it saw. The Linux and Windows cells come from those lines in the logs of the [platform run](#platform-run). A cell that says "proven" means that the test passed on that platform and that its log line holds the same value as the macOS column. Where a test checks a part that its log line does not hold, the cell says so. The macOS column is from the maintainer machine with git 2.47.1. The macOS job of the platform run also passed with git 2.56.1, and its log lines hold the same values.

| Fact | macOS, git 2.47.1 and git 2.56.1 | Linux, git 2.56.1 | Windows, git 2.56.1.windows.1 |
| --- | --- | --- | --- |
| `git pull` with a true merge runs `post-merge`, with the one argument `0` | proven | proven | proven |
| `git pull` that only moves the branch forward runs `post-merge` | proven | proven | proven |
| `git pull --rebase` with no local commits runs `post-merge`, and no `post-rewrite` | proven | proven | proven |
| `git pull --rebase` with local commits runs `post-checkout`, `post-commit`, and `post-rewrite`, and not `post-merge` | proven | proven | proven |
| In that pull, `post-rewrite` runs one time, with the argument `rebase`, as the last hook | proven | proven | proven |
| A plain commit runs `post-commit` only | proven | proven | proven |
| An amended commit runs `post-commit` and `post-rewrite` (argument `amend`) | proven | proven | proven |
| The rebase folder of git is still there when `post-rewrite` runs | proven (`rebase-merge`) | proven (`rebase-merge`) | proven (`rebase-merge`) |
| `MERGE_HEAD` is still there when `post-merge` runs after a true merge | proven | proven | proven |
| A branch change runs `post-checkout` with the third argument `1` | proven | proven | proven |
| A file checkout runs `post-checkout` with the third argument `0` | proven | proven | proven |
| `git worktree add` runs `post-checkout` in the new work tree, with the third argument `1` | proven | proven | proven |
| A clone runs `post-checkout` when the clone has the hook. The first argument is the null commit | proven, with a hook from a template folder | proven, with a hook from a template folder. The log line holds the third argument `1`, and not the first argument | proven, with a hook from a template folder. The log line holds the third argument `1`, and not the first argument |
| Git does not copy hooks on clone: a plain clone has no hook and runs none | proven | the test passed; the log holds no value | the test passed; the log holds no value |
| `git rev-parse --git-path hooks` in a linked work tree returns the hooks folder of the main checkout | proven | proven | proven |
| One hook file runs for a commit in each work tree of the clone, in the top folder of that work tree | proven | proven: two `post-commit` runs. For the folder, the test passed; the log holds no value | proven: two `post-commit` runs. For the folder, the test passed; the log holds no value |
| `git reset --hard` to another commit runs none of the four hooks | proven | proven | proven |
| `git am` runs none of the four hooks | proven, with two patches | proven, with two patches | proven, with two patches |
| Git does not run a hook file that is not executable | proven | proven: no hook ran | git runs the file there: the log line holds one `post-commit` run. The test expects that, because Windows has no executable mode. So this fact does not hold on Windows |

The design checked these facts with git 2.47.1, and the maintainer machine has the same version. Two git versions ran in all: 2.47.1 on the maintainer machine, and 2.56.1 on the three platforms of the platform run (2.56.1.windows.1 on Windows). So each fact of this table also holds on a newer git, with one platform difference: on Windows, git runs a hook file that is not executable.

### How Setup Detects Another Owner Of The Hooks (T5, A40)

This phase builds no setup code. The tests prove the git output that the rule reads, and they hold the rule as test functions. P5 builds it in the product. The rule has four checks, in this order. Setup refuses the git hooks, with one reason and no change, at the first check that holds.

1. A hooks path is set. `git config --show-scope --get-all core.hooksPath` gives one line for each scope that sets the value, with the scope name first: `local` for the repository, `global` for the whole machine, and `system` or `worktree` for those scopes. Exit code 1 means that no scope sets it. As a second check, `git rev-parse --git-path hooks` then differs from the `hooks` folder under `git rev-parse --git-common-dir`. The reason names the scope, so a person knows where the setting lives. Proven: no setting gives no line and the default folder; a repository setting shows as `local`, and git then does not run a hook file in the hooks folder of the clone; a machine setting shows as `global`; a relative value resolves from the top folder of the work tree.
2. The hook file is a symbolic link. A link points to a file that another tool owns, and a block that Make Docs wrote through the link would change that file. Proven on macOS and on Linux: the test passed there, and it writes no log line. The test is skipped on Windows, so no Windows proof exists that git runs a hook file that is a link.
3. The hook file is not a shell script. A hook file is a shell script when it holds no null byte and its first line starts with `#!` and names `sh`, `bash`, `dash`, `ksh`, or `zsh`, directly or through `env`. Every other file is not one: a file with another program on its first line, a file with no first line of that kind, a binary file, and an empty file. Proven with nine sample files.
4. Nothing else. A hook file that is a shell script, with lines of another tool, is not refused. Make Docs adds its marked block and keeps every other byte, as the design says.

Limits of the rule, for the hook review that setup shows:

- The rule does not know a hook manager by name. A hook manager that sets a hooks path stops at check 1. One that links its hook files stops at check 2. One that writes a plain shell script into the hooks folder of the clone is not seen as an owner, and Make Docs then adds its block to that file. When that tool writes its file again, the block can go, and setup then reports the block as missing.
- A shell script of another tool can end with `exec` or `exit`. A block after that line never runs. So P5 must choose where the block goes. This phase did not prove a place.
- On a platform with file modes, git does not run a hook file that is not executable. So P5 must set the executable mode when it creates a hook file, and it must name an existing hook file that is not executable.

### The Shell That Runs A Hook (T6, A40)

The test writes a hook file with a line of another tool and a small marked block. The block records the shell, the kernel name, where `sh` and `git` are, the folder, and the PATH. Then a commit runs the hook.

| Question | macOS, git 2.47.1 and git 2.56.1 | Linux, git 2.56.1 | Windows, git 2.56.1.windows.1 |
| --- | --- | --- | --- |
| Which shell runs a hook file with the first line `#!/bin/sh` | `/bin/sh`, which is bash in its `sh` form there | `/usr/bin/sh`. It is not bash and not zsh: the hook saw no version variable of either. The log does not name the shell program | `/usr/bin/sh` of a POSIX shell layer, which is bash in its `sh` form there. It is not the Windows command shell. The log does not say which folder of the machine holds that shell |
| The block runs in it and the hook exits 0 | proven | proven | proven |
| The kernel name that the hook sees | `Darwin` | `Linux` | `MINGW64_NT-10.0-26100` |
| The folder in which the hook runs | the top folder of the work tree | the test passed; the log holds no value | the test passed; the log holds no value |
| The PATH that the hook sees | the PATH of the git process, with the program folder of git (`git-core`) added in front. So a hook always finds `git`. The run of git 2.56.1 logged 32 entries | 27 entries. The first one is `git-core`, and the hook finds `git`. The log holds the count and the first entry, and not the full PATH | 85 entries. The first one is `git-core`, and the hook finds `git`. The log holds the count and the first entry, and not the full PATH |

On Windows the phase expected that git runs a hook through the shell that it ships, and not through the Windows command shell. The test proves it there in one way only: the block is POSIX shell text, and the test passes only when a shell ran it and `uname`, `command -v sh`, and `command -v git` gave answers. The test passed on Windows. Its log line holds the shell value `bash .git/hooks/post-commit`, the kernel name `MINGW64_NT-10.0-26100`, and `sh` at `/usr/bin/sh`. So a bash shell of a POSIX layer ran the hook file, and the Windows command shell did not. The log does not say which folder of the machine holds that shell, so it does not prove by itself that the shell is the one that git ships. On Linux the shell value is `.git/hooks/post-commit` with no shell name in front, so the `sh` there is not bash. A hook block must therefore hold POSIX shell text only, as the proof block does.

### Git In The Middle Of An Action (T7, A40)

The rule that a hook after a commit or after a branch change uses: git is in the middle of an action when one of these exists in the git folder of the work tree (`git rev-parse --absolute-git-dir`): the folder `rebase-merge` or `rebase-apply`, or the file `MERGE_HEAD`, `CHERRY_PICK_HEAD`, `REVERT_HEAD`, or `BISECT_LOG`. A linked work tree has its own git folder, so the rule reads the state of that work tree only.

| Fact | macOS, git 2.47.1 and git 2.56.1 | Linux, git 2.56.1 | Windows, git 2.56.1.windows.1 |
| --- | --- | --- | --- |
| During `git pull --rebase` with local commits, each `post-checkout` and `post-commit` run sees `rebase-merge` | proven. The `post-commit` run also sees `CHERRY_PICK_HEAD` | proven, with the same marks | proven, with the same marks |
| A merge that stops for a conflict shows `MERGE_HEAD`. A file checkout in it runs `post-checkout` with the third argument `0`, and the hook sees the merge | proven | the test passed; the log holds no value | the test passed; the log holds no value |
| The commit that ends such a merge runs `post-commit` and not `post-merge`. The hook then sees no state mark | proven. The test asserts the empty state | proven | proven |
| A cherry-pick of one commit runs `post-commit` one time, and that run sees `CHERRY_PICK_HEAD` | proven | proven | proven |
| A cherry-pick of two commits runs `post-commit` for each one, and each run, also the last one, sees `CHERRY_PICK_HEAD` and the `sequencer` folder | proven | proven | proven |
| A cherry-pick that stops for a conflict runs no hook. `git cherry-pick --continue` then runs `post-commit`, and that run sees no state mark | proven | proven for the run after `--continue`. For the stop with no hook, the test passed; the log holds no value | proven for the run after `--continue`. For the stop with no hook, the test passed; the log holds no value |
| In a cherry-pick of two commits that stops at the first one, the commit that ends the stop sees only the `sequencer` folder, and the next commit sees `CHERRY_PICK_HEAD` | proven | proven | proven |
| A revert of one commit runs `post-commit` with no state mark | proven | proven | proven |
| A revert of two commits runs `post-commit` for each one, and each run sees only the `sequencer` folder | proven | proven | proven |
| A revert that stops for a conflict shows `REVERT_HEAD` and runs no `post-commit`. A file checkout in it runs `post-checkout` with the third argument `0`, and that run sees `REVERT_HEAD`. `git revert --continue` then runs `post-commit` with no state mark | proven | proven for the run after `--continue`. For the stop and the file checkout, the test passed; the log holds no value | proven for the run after `--continue`. For the stop and the file checkout, the test passed; the log holds no value |
| `git revert --no-commit` leaves `REVERT_HEAD`. A branch change then removes it before `post-checkout` runs, so that run sees no state mark | proven | proven | proven |
| `git am` of two patches runs none of the four hooks | proven | proven | proven |
| Each `post-checkout` run of a bisect sees `BISECT_LOG` | proven | proven | proven |
| The hook after a merge runs the checkpoint while `MERGE_HEAD` is still there, and the store has the pulled work file | proven, with the built CLI in the hook | proven, with the built CLI in the hook | proven, with the built CLI in the hook |
| The hook after a rewrite runs the checkpoint while the rebase folder is still there, and the store has the pulled work file | proven, with the built CLI in the hook | proven, with the built CLI in the hook | proven, with the built CLI in the hook |

Four things follow for P5. The independent review of 2026-11-27 corrected the second and the third one, and added the fourth. Each fact below has a test.

- The commit that ends a merge with a conflict runs only `post-commit`, and no state mark is left then. So the hook after a commit runs the checkpoint there, and the pulled work files reach the store. Git runs no `post-merge` for such a merge, so this is the only hook for it.
- A cherry-pick. Each `post-commit` run of a cherry-pick with no conflict sees `CHERRY_PICK_HEAD`. That holds for a cherry-pick of one commit, for each commit of a cherry-pick of more than one, and also for the last run. So the rule stops every one of those runs. Git runs no `post-merge` and no `post-rewrite` for a cherry-pick, so no other hook runs at its end. The consequence for the owner: with this rule, a cherry-pick with no conflict never syncs through the hook after a commit. The reminder line of the next Make Docs command and the next commit cover it. The hook review names it. One exception exists. When a cherry-pick stops for a conflict, git removes `CHERRY_PICK_HEAD` before it runs `post-commit` for the commit that ends the stop. So the rule does not stop that one run, and the hook runs the checkpoint there. In a cherry-pick of two commits that stops at the first one, that run sees only the `sequencer` folder, which the rule does not read, and the run for the second commit sees `CHERRY_PICK_HEAD` again and stops.
- A revert. `REVERT_HEAD` in the rule does nothing for a revert. Git writes `REVERT_HEAD` only while a revert is stopped before its commit: after a conflict, or with `--no-commit`. No `post-commit` runs at that time. Git removes the file before it runs `post-commit`, and before it runs `post-checkout` for a branch change. In these tests only one hook run saw `REVERT_HEAD`: a file checkout during a stopped revert, and the hook after a checkout does nothing for a file checkout in any case. What a hook does for each form of a revert, with the rule as it is:
  - A revert of one commit: `post-commit` runs with no state mark, and the hook runs the checkpoint.
  - A revert of two commits: `post-commit` runs after each commit and sees only the `sequencer` folder. The rule does not read that folder. So the hook runs the checkpoint after each commit, also after the first one, in the middle of the sequence.
  - A revert that stops for a conflict: no hook runs at the stop. `git revert --continue` then runs `post-commit` with no state mark, and the hook runs the checkpoint.
  - A revert with `--no-commit`: no hook runs until the person commits. That commit runs `post-commit` with no state mark, and the hook runs the checkpoint.
- So a revert syncs through the hook after a commit, and a cherry-pick with no conflict does not. The rule does not treat the two in the same way. The design names a rebase, a merge, a cherry-pick, and a bisect, and it names no revert. P5 T34 holds the question for the owner: keep `REVERT_HEAD` in the rule or take it out, and read the `sequencer` folder or not.
- `git am` runs none of the four hooks. A test applies two patches, two commits appear, and no hook of the four runs. So no trigger reaches the checkpoint, and the reminder line and the next commit cover it. Git has its own hook after each applied patch (`post-applypatch`). It is not one of the four hooks. One run by hand saw it run, and no test of this phase covers it.

Two more runs were made by hand, with no test: a plain `git commit` in place of `git cherry-pick --continue`, and in place of `git revert --continue`, gave the same result as the `--continue` form.

### How A Hook Finds The Command (T9, A41)

The tests write a hook with a proof form of the block and run a commit with the PATH that each case names. The "short PATH" is the system folders only (`/usr/bin:/bin`, and on Windows the two system folders), as an app can pass it to git.

| Case | macOS, git 2.47.1 and git 2.56.1 | Linux, git 2.56.1 | Windows, git 2.56.1.windows.1 |
| --- | --- | --- | --- |
| A PATH lookup alone, with the command folder on PATH: the hook finds the command, and the store has the edit after the commit | proven | proven | proven |
| A PATH lookup alone, with a short PATH: the hook finds no command, does nothing, prints nothing, and exits 0 | proven | proven | proven |
| A PATH lookup and then a recorded path, with a short PATH: the hook finds the command file at the recorded path, and the store has the edit | proven, with a command file that names `node` by its full path | proven | proven |
| No command on PATH and none at the recorded path: the hook does nothing, prints nothing, and exits 0 | proven | proven | proven |
| A recorded command file that starts `node` by name, with a short PATH: found, not started, no output, exit 0. With the folder of `node` added to the end of PATH for the call: the store has the edit | proven | proven. The test ran its proof and was not skipped | proven. The test ran its proof and was not skipped. The block changes the folder to the form of the hook shell with `cygpath` when that tool is there. The log does not say whether the block used `cygpath` |
| The command file that a real global install writes (`npm install -g` of this package from its folder, into a temporary prefix, with no network) is found on PATH and runs in the hook shell | proven. The install writes a link to the package folder | proven. The log line holds `made: true`, so the install worked and the test ran its proof | proven. The log line holds `made: true`, so the install worked and the test ran its proof |
| A hook runs in the top folder of the work tree, also for a commit from a subfolder | proven | proven. The log line holds no folder value | proven. The hook shell there prints its folder in its own form, such as `/d/a/...`. So the proof hook prints the folder with `pwd -W` when the shell knows that input, and with `pwd` when not. The test passed with that step. The log line holds no folder value, so it does not show which form the shell printed |
| From a subfolder with no project root, a direct run says that the folder is not a Make Docs project and exits 0, and a trigger run prints nothing | proven | proven | proven |

The choice: a PATH lookup, and then a path that setup recorded in the block. A PATH lookup alone fails for a commit from an app that passes a short PATH, with no line to the person. The recorded path is not new in kind: setup already records the full path of the verified command for the agent tools.

The folder: a hook passes `--target-root` with the top folder of the work tree (`git rev-parse --show-toplevel`). Git already runs a hook in that folder, and the explicit root keeps the call correct when a tool starts the hook from another folder.

Three findings for P5:

- The supported install method that the README names is `npx`. A run through `npx` leaves no `make-docs` command on PATH. So for such a person the PATH lookup finds nothing, and only the recorded path can work. Setup then needs a stable command file to record. This phase did not prove what `npx` leaves on each platform.
- A recorded command file can need `node` from PATH ([register entry R-044](../../prd/03-open-questions-and-risk-register.md)). The proof adds the folder of `node` to the end of PATH for the call.
- The proof block sends the error output of the checkpoint call to nowhere, so that a command file that cannot start prints nothing. The line that the checkpoint prints for a person goes to standard output and still shows.

### The Access Runs In Each Agent Tool (T10, A42)

The orchestrator ran these proofs on 2026-11-27 under standing rule 11, on the maintainer machine (macOS), with the built CLI of commit `74b19c60`. The builder ran no agent tool session. The results are in the table below and in the findings under it.

The script [t10-prepare.sh](evidence/p4/access/t10-prepare.sh) prepares one run. It was tried one time from a plain shell on the maintainer machine, and it ended with the project, the Store, the first sync, and the hook in place. That trial is not an access run.

Steps for each agent tool:

1. In a plain shell, run `sh docs/work/2026-11-27-w35-r0-agent-checkpoints-and-triggers/evidence/p4/access/t10-prepare.sh <new work folder> <full path of the make-docs command> [setup method inputs]`. Use a new work folder for each tool. The script makes a temporary project with two work files, a temporary Store inside the work folder, the first sync, and a `post-commit` test hook that runs `make-docs project checkpoint --event commit --json`. With no method inputs, setup connects no agent tool. To prove the access rule that setup gives a tool, pass the setup method input of that tool. That input can change the configuration of that tool on the machine, so the orchestrator decides it.
2. Open the project folder in the agent tool. Ask the agent to change "Build the parser." to "Build the new parser." in `docs/work/2042-06-01-w1-r0-aurora/01-first.md`, and then to run `git add -A && git commit -m "Change a work file"`. The agent must make the commit itself.
3. In a plain shell, read `hook-exit.txt`, `hook-answer.json`, and `hook-errors.txt` in the work folder.
4. Read the answer: "write" when `syncRan` is true and `imported` names the work file; "read only" when `syncRan` is false and `syncSkipped` is `read-access-only`; "nothing" when `authority` is not `store`, when the answer file is empty, or when no `hook-exit.txt` exists, which means that the tool did not start the hook.
5. Remove the work folder.

The table to fill:

| Agent tool | Who started the session | Setup method of the tool | The hook ran | What the checkpoint could do | Exit code |
| --- | --- | --- | --- | --- | --- |
| Codex | The orchestrator, as a delegated session with no sandbox and no approval step (the session reported this) | `none` | yes | write: `syncRan` is true, and `imported` names the work file | 0 |
| Claude Code, run 1 | The orchestrator, as a subagent session. The commit ran inside the command sandbox of the tool | `none` | yes | write: `syncRan` is true, and `imported` names the work file. The temporary Store was inside the folders that the sandbox lets a command write | 0 |
| Claude Code, run 2 | The orchestrator, as a subagent session. The commit ran inside the command sandbox of the tool | `none` | yes | nothing: the answer file is empty, and standard error holds one JSON line with the code `store-unavailable`. The temporary Store was outside the folders that the sandbox lets a command write | 1 |
| GitHub Copilot CLI | no proof gathered: the orchestrator's environment cannot start this tool | | | | |

Findings of these runs:

- Each tool started the `post-commit` hook for a commit that the agent made, and the commit itself succeeded in each run. In run 2 the commit took about 0.24 seconds, so the refused Store did not make the commit wait.
- With the setup method `none`, the caller check of Make Docs did not refuse the checkpoint in a hook. It synced in each run where the process could write the Store folder.
- The command sandbox of an agent tool decides the result. In Claude Code run 2 the process could not write the Store folder, so the checkpoint stopped with `store-unavailable` and exit code 1, wrote nothing, and printed one long JSON line on standard error. The test hook hid that line and returned 0. A real Store is in the home folder of the person. Whether the command sandbox of a tool lets a command write there depends on the settings of that tool and of the person. This proof did not test the real Store, by the rule of this Wave.
- So a git hook reaches an agent that commits only when the shell of that agent may write the Store. Where it may not, the hook does nothing, and the files stay unsynced until a run with Store access. This is a limit of the universal reach that the design gives to git hooks. P5 must decide what the hook prints in this case (P5 T31 covers the exit code).

What is not proven:

- No run used a setup method other than `none`. A run with `mcp`, `command-rules`, or `permission-rules` needs the machine step of setup, which writes entries in the person's own agent tool settings. The orchestrator did not change those settings without the owner's approval.
- No run used GitHub Copilot CLI.
- No run used a session that the person started by hand in the app of a tool. Both sessions were started by the orchestrator.
- Linux and Windows have no access run.

The work folders of the three runs were under the temporary folder of the session, and the Store of run 2 was removed after the run.

### The Store Record For The Hook Block (T11, A43)

Answer: an existing record fits, with no Store schema change. Owner gate OG-3 does not open on this result. This is the builder's finding and not an owner decision. The independent review agreed with the reading below on 2026-11-27.

The record: one row of the table `tool_operations`, which holds machine records with no checkout. Setup already keeps the receipt of each agent tool connection of the machine there, as rows with the operation names `setup.system.receipt` and `setup.system.receipt-current` (`packages/cli/src/store/harness-integration-receipts.ts`). Those receipts record entries in files outside any project, with their drift state. PRD 38 R-HARNESS-STATE-6 states the same rule for them: use the current schema when the records fit existing installation and operation data.

The proof, in `packages/cli/tests/w35-r0-p4-hook-checkpoint.test.ts`, with a temporary Store:

- The key. Each work tree of a clone gives the same shared git folder (`git rev-parse --git-common-dir`), and another clone gives another one. So a key from that folder names the clone.
- One record for the clone. A row written through the main checkout is read through the linked work tree, with the same statement form as the receipts use. A second write from the linked work tree changes that row, and one row stays.
- Drift. The record holds the digest of the block of each hook file. The digest of the block in the file equals it, and differs after an edit of the block.
- Exact removal. The block is cut from the file only when its digest equals the record, and each other byte of the file stays.
- The rule for other bound checkouts. The record holds the checkout IDs that selected the hooks. Removal in one work tree takes its ID out and keeps the block and the row while another ID remains. Removal in the last one takes out the block and the row.
- No schema change. The schema version of the Store is the same before and after.
- Store care. With the row in place, the Store check reports no leftover, and no cleanup rule selects the row.

Limits of this answer:

- The table catalog of the Store and the PRD 38 register row for `tool_operations` name the writers of that table today: the tool operation journal and machine setup. A hook record is a new kind of row there. So P5 must add the row kind to the catalog and to PRD 38, as its planned requirement R-HOOK-STATE. That is a change of PRD text and of the catalog in code. It is not a change of a table, a column, or a check of the database.
- The row is a machine record. It does not go when a project is removed from the Store, so P5 must remove it in `setup remove` and name it in Store care.
- The record form in the test (the operation name `setup.git-hooks.receipt-current`, the key, and the fields) is a proof form. P5 sets the real names.
- Two gaps of the record form, which the independent review named. First: when a person deletes the folder of a checkout and does not run `setup remove` there, its checkout ID stays in the list of the record, and the block then never goes, because another ID remains. Second: the key is a digest of the path of the shared git folder. When the clone moves, the key changes, the old row stays in the Store, and the block in the moved clone has no record. No test of this phase covers either one. P5 T32 and T33 hold them.
- The other existing record, `installation_ledgers.manifest_json`, does not fit. It belongs to one checkout and holds paths inside that checkout, and the hooks folder is outside a linked work tree. It is the form in which each checkout owns the block, which the design refused.

If the reviewer or the owner reads a new row kind in `tool_operations` as a Store schema change, OG-3 opens with the two options that the plan states: A, approve a Store schema change; B, record the block for each checkout, a form that the design refused. The plan recommends A.

### Two Work Trees And A Direct Checkpoint (T12, A44)

Four tests in `packages/cli/tests/w35-r0-p4-hook-checkpoint.test.ts`, with the built CLI, a main checkout on `main`, and a linked work tree on `topic`. No hook is installed.

| Step | What the run reports | What the store holds |
| --- | --- | --- |
| The plain binding step for the linked work tree | It refuses: the project ID has a Store checkout at another path | No change |
| A checkpoint in the linked work tree before it is bound | It syncs nothing and exits 0. A trigger run prints nothing | No change |
| The linked work tree binds as a separate checkout (the step of `make-docs project checkout apply`) | Bound, with its own checkout ID | A second checkout of the project |
| Case 1: the branch already differs. A direct checkpoint in `main`, then in `topic` | `main`: first sync, 2 files imported. `topic`: first sync, 1 conflict for the file that differs, and that file is not imported | The text of `main`. The file of `topic` keeps its text. A later run in `main` says that nothing is due |
| Case 2: both first syncs with the same files, then an edit and a commit in `topic`, then a direct checkpoint there | `topic`: 1 file imported | The text of `topic`. The one project store follows the work tree that ran the checkpoint last |
| Then a read-only check in `main` (`--event branch-change`) | 1 file waits for a write. No file changes | No change |
| Then a trigger run in `main` (`--event commit`) | 1 file waits for a write. No file changes | No change |
| Then a direct run in `main` | It wrote the file, and the result names it. `git status` shows that file as changed | No change |
| Case 3: as case 2, but `main` also changed its file | 1 conflict. No file changes | The text of `topic`, and one recorded conflict for the checkout of `main` |

Each result names its checkout. Each difference shows as a file that waits for a write or as a conflict. Nothing is overwritten with no report. One point is for the owner to know: in case 2 a direct run in `main` changes the work file of `main` to the text of the `topic` branch. The result names the file, and `git status` shows it. That is the existing sync table, and [register entry R-039](../../prd/03-open-questions-and-risk-register.md) holds the risk.

### The Fix For Two Syncs At The Same Time (T18 To T23, A47a To A47f)

The change (T18). In `syncWorkFiles` in `packages/cli/src/operations/work/work-store/sync.ts`, the call `scanWorkFiles(root)` moved from the line before `writeWorkStore(...)` into the function that `writeWorkStore` runs after it holds the Store. The diff is 3 added lines and 2 removed lines: the scan call moved, and one comment names the reason. `writeWorkStore` starts its session with `BEGIN IMMEDIATE`, so a second sync waits there, and it now scans only after the first sync ended its session. No other rule of sync changed. `previewWorkSync`, the read-only sync check, did not change: it still scans and then opens a read session.

The tests (T19 to T21), in `packages/cli/tests/w35-r0-p4-sync-race.test.ts`, with the built CLI and a temporary Store:

- How a test makes the two runs overlap. The product code has no test seam. A helper process opens the Store database and takes its write lock. The test then starts two `make-docs project checkpoint --json` runs. Each run does all that it does before its Store write session, and then waits for the lock. After 2.5 seconds the helper lets go. The test proves the overlap in each run: each of the two runs started while the helper held the Store, and each one ended after the helper let go. A run waits at most 5 seconds for the Store, so the 2.5 seconds are inside that limit.
- `cancelled` (T19, A47b). The test closes the task with `make-docs work close "W1 R0 P1 T1" --expected-version <n> --outcome cancelled`, and then holds two runs at the Store. After them the store shows the task as closed with the outcome `cancelled`. No run lists the task as ready work. One run wrote the file, no run imported it, and one run says that nothing is due. A later run says that nothing is due, and the outcome is still `cancelled`.
- `superseded` (T20, A47c). The same test with the outcome `superseded`, with the same result.
- A progress note and a met gate (T21, A47d), one test each. The first test records a note on the task with `make-docs work report "W1 R0 P1 T1" --note <text>`. The second test records a met gate on the stage with `make-docs work report "W1 R0 P1 S1" --met-gate <text>`. Each test then closes the task with the outcome `cancelled`, so that the next sync writes the file, and holds two runs at the Store. The note, and the met gate, are the same after the two runs and after a later run. At first this was one test for both. The review of 2026-11-27 asked for one test each, as T21 says.
- The read-only check (A47a). While a helper holds the Store write lock, `previewWorkSync` returns its result in less than 4 seconds and names the file that waits for import, and no store unit changes. A check that took a write session would wait for the lock.

Before the fix and after the fix:

| Test | On the code before T18 | On the code after T18 |
| --- | --- | --- |
| Two runs after a close with the outcome `cancelled` | Fails. The store shows the task as `open` with no outcome | Passes |
| Two runs after a close with the outcome `superseded` | Fails. The store shows the task as `open` with no outcome | Passes |
| A progress note in the same race, and a met gate in the same race | The one test that held both failed at the close outcome: `open` with no outcome. The checks of the note and of the met gate before that line passed, so both stayed. The two split tests were also run on the code before T18, in the temporary copy of the old build: see "P4 Checks" | Both pass |
| The read-only check takes no write session | Passes | Passes |

The run on the code before T18: `npx vitest run tests/w35-r0-p4-sync-race.test.ts`, with the test file as it was then, gave "3 failed | 2 passed (5)". The fifth test of that run was a weak test of the public result that this builder then removed, because it passed on both codes and proved nothing about the order. The run on the code after T18: "4 passed (4)". Then 20 runs in a row of the test file: 20 of 20 passed, 4 tests each. After the split of the T21 test the file holds 5 tests, and "P4 Checks" holds the new runs.

What the store holds, for notes and met gates (T21): before T18 and after T18, the note and the met gate stay. The older import changes the status and the outcome of the task, and it does not touch a note or a gate. So the fix leaves no loss for them, and A47d needs no new register entry for a loss.

What happens now to the second of two runs: it waits for the Store, then it scans the work files. It finds the file that the first run wrote, with the same digest that the first run recorded. So it imports nothing, writes nothing, and says that nothing is due.

Limits of the proof:

- The tests force the overlap with the Store write lock. They do not make a race by chance, so they pass and fail for the same reason in each run.
- The tests prove two runs of one checkout. Two checkouts of one project that sync at the same time each scan their own files, and the sync table handles what differs.
- A run that waits more than 5 seconds for the Store ends with the typed Store contention result, as before. The fix can make the wait of a second run longer, because the first run now scans inside its session. `PERF-004-R2` gives the wait for this repository: about 305 ms.
- The race tests run on Linux in the full suite of the workflow, and on macOS here. The builder left them out of the two fixed lists, by its reading of T8 and T9. The orchestrator added the race test file to both lists on 2026-11-27, so the platform job also runs them on macOS and Windows. The platform run ran them on all three platforms: 5 tests pass on Linux, on macOS, and on Windows, in the platform contract job and again in the installed package job. That is the first run of the race tests on Windows, and their first run on macOS in the platform job.
- The projection and the hold list are still read before the Store session (`sync.ts`, in `syncWorkFiles`, the lines before `writeWorkStore`). So a run that waits for the Store uses the config as it was before the wait. No data is lost: the next run reads the config again.
- The order of two errors changed with the fix. A scan error of the work files now comes after a Store busy error and after "project not identified", because the scan runs inside the session.
- While a sync scans, it now holds the Store. So each other writer on the machine, in any project, waits a little longer than before. The side measure gives about 305 ms for this repository.

The twin review (T18, A47f). The agent form of the work rules is `make-docs://system/reference/work-store.md`. It was reviewed for this change, and it needs no change. The change is about the order of a file read and a Store session inside one CLI process. An agent that follows the agent form by hand has no CLI and no Store, so it has no Store session and no second sync. No rule ID of the catalog `make-docs.work-store-rules.v1` describes that order, and none changed. The template copy and the installed copy of the reference did not change.

PRD 52 (T23, A47f). R-WORK-SYNC-1 now says that sync reads the work files inside its Store write session, and that the read-only sync check takes no write session. The PRD has a `W35 R0 P4` Requirement History entry. `make-docs check prd` passes.

The register (T23, A47f). R-041 is `Closed`, with a link to this section. The builder closed it because the fix landed in the work tree and the tests of T19 to T21 pass. The independent review of P4 checks that before the phase commit.

The sync time (T22, A47e). `PERF-004-R2` is recorded beside `PERF-004-R1` in the [result record](../2026-11-21-w29-r0-work-store/06-package-parity-and-acceptance.md#result-record-of-the-requalification) of the profile, and its budget record is in the [P4 phase file](04-git-hook-proofs.md#requalification-of-perf-004-after-the-sync-core-fix). In milliseconds, the median of 15 samples, and 3 for the first import:

| Command | `PERF-004-R2` | `PERF-004-R1` |
| --- | --- | --- |
| `make-docs --version` (the floor) | 100 | 84 |
| First import | 1,883 | 1,380 |
| `work sync` with no change | 444 | 386 |
| `work next` | 383 | 330 |
| `work status` | 399 | 351 |

Each command is slower than in `PERF-004-R1`, also the floor and the two commands that do not run the changed code. `work sync` with no change is slower by 15 percent, and `work next` and `work status` by 14 to 16 percent. `PERF-004-R2` alone cannot say whether the fix adds time. It holds no run of the build before the fix in the same session, and it cannot give the cost of the fix as one number. The first import is slower by 36 percent, and this result does not say why: the build, the count of work files (471 and not 463), and the day differ. A second sync that starts at the same time as a first one waits about 305 ms for the Store (764 ms and not 459 ms). All numbers are for [`PERF-004`](../2026-11-21-w29-r0-work-store/06-package-parity-and-acceptance.md#perf-004-automatic-sync-on-a-project-with-many-backlogs) on this repository and this machine.

The comparison in one session. The independent review of 2026-11-27 asked for it, because the first text here said that `PERF-004-R2` shows no added time, and that record cannot support those words. It is a side measure. It is outside the `PERF-004` profile, it is not a result of that profile, and it used no counted run. The [harness](evidence/p4/performance/perf-004-r2-compare-harness.mjs) and the [results](evidence/p4/performance/perf-004-r2-compare-results.json) are kept.

- The two builds: the build with the fix, and the build with `sync.ts` as it is in commit `d12d1047`. Each was built in its own temporary copy of the source outside this checkout, with the same build step, and the two copies differ in that one file. `sync.ts` in this checkout did not change.
- The fixture: one fresh clone of this repository at `d12d1047`, with every work file that the commit holds: 471 work files. Both builds used that one clone and one temporary Store.
- The runs: `work sync --json` with no change and `make-docs project checkpoint --json` with no change. 25 samples of each command for each build. For each sample both builds ran one after the other, and the build that ran first changed with each sample. One run of each command with each build came first and was not counted. Each run was checked: it imported, wrote, and removed nothing. No work file changed during the runs.
- The measure: one CLI process from spawn to exit, in milliseconds. The median, then the minimum to the maximum.

| Command, with no change | With the fix | Before the fix | Median with the fix minus median before |
| --- | --- | --- | --- |
| `work sync` | 431.8 (411.9 to 505.9) | 432.6 (414.2 to 497.2) | -0.8 |
| `make-docs project checkpoint` | 498.9 (483.5 to 592.6) | 503.0 (481.8 to 551.9) | -4.1 |

The median of the 25 pair differences is +1.1 ms for `work sync` and -1.8 ms for the checkpoint. The build with the fix was the slower one in 14 of 25 pairs for `work sync` and in 9 of 25 pairs for the checkpoint.

What the numbers support: on this repository, with 471 work files, the comparison found no difference between the two builds that is larger than the spread of the samples. The medians differ by less than 5 ms, and the samples of one build spread over 70 ms to 110 ms. The numbers do not prove that the fix costs nothing. They show that a cost, if there is one, is too small for this measure to see.

Limits of the comparison:

- One session, one machine, macOS only, a warm file cache, and 471 work files. A larger project or another machine can differ.
- The builds are bundles from temporary source copies. They are not the packed candidate that `PERF-004-R2` and `PERF-007` measured.
- One process ran at a time. So the comparison does not show the time that one sync waits for another one. The other side measure shows that time: about 305 ms.
- The 25 samples of a build are not independent runs on fresh clones. They are repeats on one clone.
- The reviewer ran a comparison too, on 130 work files and not the full set: `work sync` 197.5 ms with the fix and 199.1 ms before it, and the checkpoint 225.8 ms and 227.0 ms. That run is a cross-check only. It agrees with this one.

### Run Of PERF-007 And The Run Mode (T13 To T15, A45)

The [`PERF-007` profile](04-git-hook-proofs.md#perf-007-the-checkpoint-that-a-git-hook-runs) was written in the phase file before the counted runs, and it ran after the fix of Stage 5. Result `PERF-007-R1`, outcome `pass`. The phase file holds the full result record. All numbers below are from [`PERF-007`](04-git-hook-proofs.md#perf-007-the-checkpoint-that-a-git-hook-runs): one git action, in milliseconds, the median of 15 samples, on clones of this repository with 471 work files, on the maintainer machine, on macOS only.

| Action | No hook | Foreground hook adds | Start and return hook adds | Then the checkpoint ends after |
| --- | --- | --- | --- | --- |
| `git commit`, no change | 32 | 538 | 27 | 524 |
| `git commit`, one changed work file | 34 | 631 | 27 | 612 |
| `git merge` (a true merge), no change | 59 | 533 | 17 | 523 |
| `git merge` (a true merge), one changed work file | 60 | 628 | 16 | 606 |
| `git commit --amend` (two hooks), no change | 33 | 1,086 | 45 | 815 |
| `git commit --amend` (two hooks), one changed work file | 35 | 1,159 | 44 | 910 |
| `git checkout <branch>`, no change | 22 | 411 | 27 | 393 |
| `git checkout <branch>`, one changed work file | 22 | 417 | 27 | 400 |
| A commit whose hook run is the first sync of the checkout (3 samples) | not measured | the commit takes 2,210 in all | the commit takes 139 in all | 1,944 |

In each sample of each mode, git exited 0, the work tree was clean after the action, and no project file changed.

What a person sees in each mode (T15):

- Foreground, nothing due: nothing prints. The git action takes about half a second longer, and an amended commit about one second longer.
- Foreground, a work file changed: the output of the checkpoint appears after the output of git and before the prompt returns. After a commit, a merge, or a rewrite, its first line is `Checkpoint: 1 file imported.`. After a branch change, its first line is `Checkpoint: 1 file waits.`, with the command to run. So the line about waiting files appears at the moment of the git action, in the same terminal.
- Start and return, in each state: nothing prints. The hook must send the output of the checkpoint to nowhere, because the checkpoint ends 0.4 seconds to 0.9 seconds after the prompt is back, and output at that time would land in the middle of what the person types next. So the person never sees the line about waiting files from the hook. The reminder line of the next Make Docs command is then the only sign. An error in the checkpoint is also not seen.
- Start and return, an amended commit: two checkpoints run at the same time. With the fix of Stage 5 the store and the work tree were right in each of the 30 samples.

One finding for P5, outside the timed workload: a trigger run that imported a file or found a file that waits prints its full result, 9 or 10 lines, with the list of ready work and a claim command. The hook rule of the design allows the summary line and the command. So the block of P5 must cut the output, or the checkpoint must get a shorter trigger output. P5 T3 owns that rule.

#### Owner Gate OG-4: The Run Mode Of A Git Hook

For the owner. This text gives the two options of the plan and one recommendation. It records no decision. A46 waits for the owner's answer.

The question: does a git hook run the checkpoint in the foreground, or does it start the checkpoint and return?

Where the numbers come from. The added times are medians from `PERF-007-R1`: one machine, macOS only, clones of this repository with 471 work files. The worst case of option A is from two tests in `packages/cli/tests/w35-r0-p4-hook-checkpoint.test.ts`, on the same machine. A larger project, another machine, or another platform can differ.

**Option A: a hook runs the checkpoint in the foreground.** Git waits until the checkpoint ends.

| Git action | Added time, nothing due | Added time, one changed work file |
| --- | --- | --- |
| A commit | 538 ms | 631 ms |
| A true merge | 533 ms | 628 ms |
| An amended commit (two hooks run) | 1,086 ms | 1,159 ms |
| A branch change | 411 ms | 417 ms |
| The first commit in a checkout, one time | the commit takes 2,210 ms in all | not measured |

- What the person sees: nothing when nothing is due. When a work file was imported or waits, the output of the checkpoint appears after the output of git and before the prompt returns. Its first line is `Checkpoint: 1 file imported.` after a commit, a merge, or a rewrite, and `Checkpoint: 1 file waits.` with the command to run after a branch change. Today that output is 9 or 10 lines. The hook rule of the design allows the summary line and the command, and P5 makes that rule hold.
- The worst case: another process holds the Store. The Store is one for the whole machine. So any Make Docs write on the machine, in this project or in another one, can hold it at the moment of the git action. The checkpoint then waits 5 seconds for the Store, which is the busy time of the Store (`STORE_BUSY_TIMEOUT_MS`, 5,000 ms), and then it stops. Measured with a helper process that held the Store: `make-docs project checkpoint --event commit` ended after 5.4 seconds with exit code 1. It printed nothing on standard output and one line on standard error. That line is the typed Store result as JSON, more than 1,000 characters long. A commit with the foreground proof hook took 5.5 seconds, exited 0, and printed nothing, because the proof block hides the error output and the exit code. So in this case a commit, a merge, or a rewrite takes about 5.5 seconds longer. The commit itself is done. The work file is not imported, and the next checkpoint imports it.
- More about the worst case. A branch change does not wait: its check only reads, and it ended in about 0.1 seconds while the Store was held. An amended commit runs two hooks, so it can wait two times, about 11 seconds. That number is a calculation, and no run measured it. No run measured how often another write holds the Store for 5 seconds. In normal use a second sync waits about 305 ms for a first one.

**Option B: a hook starts the checkpoint and returns.** Git does not wait.

| Git action | Added time, nothing due | Added time, one changed work file | The checkpoint ends this long after git returned |
| --- | --- | --- | --- |
| A commit | 27 ms | 27 ms | 524 ms to 612 ms |
| A true merge | 17 ms | 16 ms | 523 ms to 606 ms |
| An amended commit (two hooks run) | 45 ms | 44 ms | 815 ms to 910 ms |
| A branch change | 27 ms | 27 ms | 393 ms to 400 ms |
| The first commit in a checkout, one time | the commit takes 139 ms in all | not measured | 1,944 ms |

- What the person sees: nothing from the hook, in any state. The hook must send the output of the checkpoint to nowhere, because the checkpoint ends after the prompt is back, and output at that time would land in what the person types next. So the person never sees the line about waiting files at the git action. The reminder line of the next Make Docs command is then the only sign. An error of the checkpoint is not seen either.
- The worst case: another process holds the Store. The git action is not longer. The started checkpoint waits 5 seconds in the background, stops, and imports nothing, and the person sees nothing. No run measured this case in this mode. It follows from the same checkpoint process as in option A.
- More about the worst case. An amended commit starts two checkpoints at the same time. With the fix of Stage 5 the store and the work tree were right in each of the 30 samples. A started checkpoint can still run when the person starts the next git action or closes the terminal. No run tested a closed terminal.

**Recommended: A.** This confirms the recommendation that the plan made before the measurement. The reason: the promise of this Wave is that the person sees one line that says what waits and which command settles it, at the git action. Only option A can show that line. The price is about half a second for each commit on a project with 471 work files, about 1.1 seconds for an amended commit, and about 5.5 seconds in the worst case, when another Make Docs write holds the Store at that moment. With option A the git action never fails in any measured case.

**Possible refinements.** These are new ideas. The owner did not ask for them. They are not built, and no run measured them. Each one is a change to option A, and the owner can take one, both, or none.

1. A foreground run with a short time limit on the wait for the Store. After the limit the hook gives up quietly, and the reminder line covers the file. This would cut the worst case of option A from about 5.5 seconds to the limit. It needs a new input or a new setting of the checkpoint, which is a product change.
2. The hook after a rewrite skips the amend case, because the hook after a commit already ran for that commit. Git gives the hook after a rewrite the argument `amend` in that case. An amended commit would then add about 0.55 seconds and not about 1.1 seconds. That number is a calculation from the table.

A note for P5, in each mode: standing rule 5 says that a git hook never fails or blocks a git action. The checkpoint exits 1 when the Store is held. So the hook block must swallow that exit code, and P5 must decide what the hook prints then. P5 T31 holds it.

### What P5 Builds From This Phase (A47)

One list for P5, from the findings above. Each point that no document stated is also in the next section.

1. Install four hooks: after a commit, after a merge, after a rewrite, and after a branch change. The hook after a rewrite covers `git pull --rebase` with local commits and an amended commit.
2. Refuse with the detection rule of T5: a hooks path in any scope, a hook file that is a symbolic link, and a hook file that is not a shell script.
3. Set the executable mode on a hook file that setup creates, and name an existing hook file that is not executable.
4. Choose where the block goes in an existing shell script, so that an `exec` or an `exit` of another tool before it does not skip it.
5. Find the command by a PATH lookup, and then by the recorded path. Decide whether the block also records the folder of `node` (R-044). Hide the error output of a command that cannot start.
6. Pass `--target-root` with the top folder of the work tree. When the Make Docs project is in a subfolder of the git repository, the top folder is not the project root, and the block needs the path from the top folder to the project. This phase did not prove that case.
7. Use the rule for git in the middle of an action in the hooks after a commit and after a branch change: the six state marks of T7, in the git folder of the work tree. Do not use it in the hooks after a merge and after a rewrite. Know what the rule does: it stops every hook run of a cherry-pick with no conflict, and it stops no hook run of a revert. P5 T34 brings the choice of the marks to the owner.
8. Cut the output of a trigger run to the summary line and the command (P5 T3).
9. Record the block in the Store as the answer of T11 says, when the review accepts that answer. Add the row kind to the table catalog and to PRD 38, and remove the row in `setup remove`.
10. Run the checkpoint in the mode that the owner chooses at OG-4.
11. Make the block swallow a non-zero exit code of the checkpoint, and decide what the hook prints then. The checkpoint exits 1 when another process holds the Store (P5 T31).
12. Each choice of this phase that no document stated is a proposal, and P5 holds each one as a task with a case: [P5 Stage 5](05-git-hooks-in-setup.md#stage-5---proposals-from-phase-4), T20 to T34.

What the hook review that setup shows must name:

- The hooks act only in a checkout that is bound to the Store. A new work tree of a clone is not bound until `make-docs project checkout apply` runs there (R-045).
- These git actions do not reach the checkpoint through a hook, so the reminder line and the next commit cover them: `git reset --hard` and `git am`, which run none of the four hooks; a cherry-pick with no conflict, of one commit or more, where the rule for git in the middle of an action stops each hook run; and the open cases of R-043.
- With a foreground hook, a git action can take about 5.5 seconds longer while another Make Docs write holds the Store.
- With a hook manager that writes a plain shell script into the hooks folder of the clone, the block lives in that tool's file, and that tool can remove it.
- A commit from an app that passes a short PATH works only through the recorded path (R-044).
- Each platform gap that the platform run finds. The run of commit `965ad51e` found no gap. It found one platform difference and one fact with no Windows proof, and [Platform Run](#platform-run) holds both with the finding for owner gate OG-6. The review must say that on Windows git also runs a hook file that is not executable.

### Platform Run

The orchestrator pushed the phase commit and started this run through the pull request, under standing rule 12. The results below are from the job logs of the run. This section records no owner decision.

- Pull request: 69 of the repository `brucewaynedecoy/make-docs`.
- Workflow run: `46097028050` of `.github/workflows/platform-safety.yml`, first attempt, started by the pull request. Link: <https://github.com/brucewaynedecoy/make-docs/actions/runs/46097028050>.
- Commit: `965ad51e` (`965ad51e54a2d7695d77adb975e84fdba7e78f25`).
- Date: the run started on 2026-11-28 at 02:13:50 UTC and ended at 02:34:27 UTC.
- Result: success. Each job of the run passed.

| Job | Job ID | git | The three P4 test files | All test files of the fixed list |
| --- | --- | --- | --- | --- |
| `ubuntu-latest platform contract` | `140830666604` | 2.56.1 | git facts 34 pass. Hook checkpoint 17 pass. Race 5 pass. None skipped | 17 files pass. 317 tests pass, 1 skipped |
| `macos-latest platform contract` | `140830666545` | 2.56.1 | git facts 34 pass. Hook checkpoint 17 pass. Race 5 pass. None skipped | 17 files pass. 317 tests pass, 1 skipped |
| `windows-latest platform contract` | `140830666564` | 2.56.1.windows.1 | git facts 33 pass and 1 skipped, of 34. Hook checkpoint 17 pass. Race 5 pass | 17 files pass. 316 tests pass, 2 skipped |
| `ubuntu-latest installed package` | `140833199060` | 2.56.1 | the same counts as the Linux contract job | 17 files pass. 317 tests pass, 1 skipped |
| `macos-latest installed package` | `140833199064` | 2.56.1 | the same counts as the macOS contract job | 17 files pass. 317 tests pass, 1 skipped |
| `windows-latest installed package` | `140833199034` | 2.56.1.windows.1 | the same counts as the Windows contract job | 17 files pass. 316 tests pass, 2 skipped |
| `Build one installed-package candidate` | `140830666538` | 2.56.1 | git facts 34 pass. Hook checkpoint 17 pass. Race 5 pass | The full suite on Linux: 164 test files pass and 1 is skipped. 3,951 tests pass, 7 skipped, none fail |

The one test that is skipped on each platform in the fixed list is in `tests/w22-r1-ownership.test.ts`, which is not a P4 file. The second skipped test on Windows is the symbolic link test of `tests/w35-r0-p4-git-hook-facts.test.ts`. The job `Build one installed-package candidate` also holds the digest check of the package candidate, and that job passed. The other three jobs of the run, `Detect package changes`, `Compare installed-package evidence`, and `PR merge gate`, passed too.

Each of the seven jobs above wrote 44 log lines that start with `W35-R0-P4-GIT-FACT`, one for each fact that a test records. The lines of the two jobs of one platform hold the same values, apart from the times of the held Store.

What each platform proved:

- Linux, git 2.56.1: each git fact of T1 to T4, the detection rule of T5 with the symbolic link test, the shell of T6, each fact of T7, each case of the command lookup of T9, the Store record of T11, the two work trees of T12, and the race tests of T19 to T21 with the read-only check.
- macOS, git 2.56.1: the same list. Each log line holds the same value as the maintainer machine gave with git 2.47.1.
- Windows, git 2.56.1.windows.1: the same list, without the symbolic link test. One fact differs there, as the test expects: git runs a hook file that is not executable.

The values that differ between the platforms, from the log lines:

| Value | Linux | macOS | Windows |
| --- | --- | --- | --- |
| The shell value of a hook file with the first line `#!/bin/sh` | `.git/hooks/post-commit`, so not bash and not zsh | `bash .git/hooks/post-commit` | `bash .git/hooks/post-commit` |
| Where `sh` is | `/usr/bin/sh` | `/bin/sh` | `/usr/bin/sh` |
| The kernel name | `Linux` | `Darwin` | `MINGW64_NT-10.0-26100` |
| The PATH of a hook | 27 entries, `git-core` first | 32 entries, `git-core` first | 85 entries, `git-core` first |
| A hook file that is not executable | does not run | does not run | runs |
| A trigger run for a commit while another process holds the Store: exit code and time, in the contract job | 1, about 5,300 ms | 1, about 7,600 ms | 1, about 5,500 ms |
| A commit with the foreground proof hook while another process holds the Store: exit code and time, in the contract job | 0, about 5,300 ms | 0, about 8,500 ms | 0, about 5,700 ms |
| A read-only check for a branch change while another process holds the Store: exit code and time, in the contract job | 0, about 300 ms | 0, about 400 ms | 0, about 200 ms |

The times in this table are from test log lines, rounded to 100 ms, on shared runners. They are not a `PERF-007` result. In the installed package job the macOS trigger run took about 9,000 ms. So the worst case of a foreground hook was longer on the macOS runner than the 5.5 seconds of the maintainer machine. The owner gate OG-4 text keeps the numbers of the maintainer machine.

What is not proven:

- Windows: that git runs a hook file that is a symbolic link. The test "a hook file that is a link to a file of another tool shows as a symbolic link" is skipped there, because a test cannot make a symbolic link there without a special right. The log gives the count "1 skipped" and does not name the test. The name comes from the test file, where this test is the only one with a skip rule.
- Windows: whether the proof block used `cygpath` for the folder of `node`. The test passed, and the log holds no value.
- Windows: the folder form that the hook shell printed with `pwd -W`. The tests passed, and the log holds no value.
- Windows: which folder of the machine holds the shell that ran the hook. The log holds the kernel name and `/usr/bin/sh` only.
- Linux: which shell program is behind `/usr/bin/sh`. The log shows only that it is not bash and not zsh.
- Each platform: the folder in which the hook of the shell test ran. The test asserts it, and its log line holds no folder value.
- Each platform: a git version other than 2.47.1 and 2.56.1.
- T10 and A42: a run inside each agent tool. It waits for the orchestrator.

The finding for owner gate OG-6: no platform gap found in the run of commit `965ad51e`; the gate did not open. Each hook fact that ran holds on each platform, and on each platform the hook reaches `make-docs` in each lookup case. Two points go with the finding:

- A platform difference that the hook review can cover: on Windows git runs a hook file that is not executable. The test expects it. The rule of P5 to set the executable mode, and to name a hook file that is not executable, applies to platforms with file modes only.
- A fact with no Windows proof: that git runs a hook file that is a symbolic link. The builder of this record judges that this is not a gap that matters for the hooks of P5. Check 2 of the detection rule refuses a hook file that is a link on each platform, and that check reads the file and does not need git to run it. So with no proof, the only loss is the reason behind the refusal on Windows. Recommendation: keep the gate closed, and let P5 test on Windows that setup refuses a hook file that is a link, when a test can make one there. The owner decides whether to open the gate for this point.

### P4 Known Limits

- The proofs ran on the maintainer machine (macOS, git 2.47.1) and in the platform run of commit `965ad51e` (Linux, macOS, and Windows, each with git 2.56.1). The measurements of `PERF-007` and `PERF-004-R2` are from the maintainer machine only.
- The Windows facts that the phase expected now have a run: the hook shell, the PATH of a hook, the executable mode, and the global install. Three Windows points have no logged value. The log does not say whether the block used `cygpath`. It does not show the folder form that `pwd -W` printed. It does not say which folder holds the shell that ran the hook. For each one the test passed, and no more is known.
- One fact has no Windows proof: that git runs a hook file that is a symbolic link. The test is skipped there.
- Two git versions ran: 2.47.1 and 2.56.1. No other version ran, and no git older than 2.47.1 ran.
- The log of a run lists by name only the tests that took longer than a set time. For a faster test the log holds the count of the test file and the log line of the fact, when the test writes one. The log does not name a skipped test.
- T10 has no run. No tool has a proof of what a hook's checkpoint may do inside it.
- The proof block of the tests is not the block of P5. P5 builds the real block, with its own tests.
- The global install proof uses a link to the package folder, which is how `npm install -g <folder>` installs. An install from the registry writes a copy and the same kind of command file. That form was not run.
- `PERF-004-R2` cannot give the cost of the fix as one number. See its result record. The comparison in one session found no difference larger than its spread, on one machine and 471 work files.
- The projection and the hold list are read before the Store session, so a run that waits uses the older config, with no data loss. A scan error now comes after a Store busy error and after "project not identified". Other writers on the machine wait a little longer while a sync scans. The section about the fix holds each point.
- A checkpoint that a hook runs for a commit waits 5 seconds and exits 1 while another process holds the Store. The tests pin that behavior as it is today. They do not say that it is wanted.
- The proof hook prints its folder with `pwd -W` on Windows, and the helper puts each path into the hook text in safe single quotes. Windows ran both, and the tests passed. The log holds no folder value.
- The temporary folder of the global install proof holds a link into this repository's package folder. The test removes that link by itself, with `unlink` and then `rmdir` for a link to a folder on Windows, before the recursive removal of the temporary folder. It then checks that the package folder still holds `package.json` and the built CLI. On macOS this ran and passed. The test also passed on Linux and on Windows in the platform run, with `made: true` in its log line.
- The race tests hold the Store for 2.5 seconds for each test, so the test file takes about 10 seconds.

### P4 New Behavior That The Documents Did Not State

The builder chose each point. No point is an owner decision. The owner has not reviewed this list.

1. The detection rule of T5 has a check that no document names: a hook file that is a symbolic link is refused.
2. The same rule says what "a shell script" is: no null byte, and a first line that starts with `#!` and names `sh`, `bash`, `dash`, `ksh`, or `zsh`, directly or through `env`. A file with no such first line is refused, also when it holds shell text.
3. The rule does not try to know a hook manager by name. The design says that setup refuses "when another tool owns the hooks". The rule reads that as: a hooks path is set, or the hook file is a link.
4. The rule for git in the middle of an action reads six state marks. The design names a rebase, a merge, a cherry-pick, and a bisect. `REVERT_HEAD` is added, and the tests show that it stops no hook run of a revert: git removes the file before it runs the hook after a commit. So this point adds a mark that does nothing today. The rule also stops every hook run of a cherry-pick with no conflict, which the design does not say. P5 T34 holds both for the owner.
5. The recommended command lookup has a third part that no document names: the block adds the recorded folder of `node` to the end of PATH for the call (R-044).
6. The proof block sends the error output of the checkpoint call to nowhere.
7. The proof block passes `--target-root` with the top folder of the work tree. The phase file gives two ways, and this is the choice between them.
8. The Store record of T11 is a proof form: a row of `tool_operations` with the operation name `setup.git-hooks.receipt-current`, a key from the shared git folder of the clone, the digest of each block, and the list of checkout IDs that selected the hooks. The reading that this needs no Store schema change is the builder's.
9. The race tests force the overlap with a helper process that holds the Store write lock. The phase file allows a test seam in the product. The builder chose a way with no change to the product.
10. `PERF-007` measures the rewrite as an amended commit, and the merge as a true merge with `--no-ff`. The phase file names "a rewrite" and "a merge" and no form.
11. The measure of the second sync that waits is a side measure with its own small harness, outside the `PERF-004` profile, because that profile runs one process at a time.
12. Three register entries are new: R-043, which T16 asks for, and R-044 and R-045, which are not platform gaps. The builder added them because each one is a gap that the hook review must name.
13. The two git proof test files are in both workflow lists. The race test file is not, because T8 and T9 name the files of T1 to T7 and T9. The section about the fix holds the recommendation to add it.

Each point that P5 can build is a task with a case in [P5 Stage 5](05-git-hooks-in-setup.md#stage-5---proposals-from-phase-4), as a proposal that the Phase 5 review shows to the owner.

### P4 Review Corrections Of 2026-11-27

The independent review of this phase found statements that the proofs did not support, and gaps in the tests. The builder of the correction checked each finding with a run before the change. Each finding was right. This list says what changed.

| Finding | What changed |
| --- | --- |
| The text said that the rule stops a cherry-pick "of more than one commit" | Wrong. A cherry-pick of one commit also runs `post-commit` with `CHERRY_PICK_HEAD`. Three new tests, and the test of two commits now asserts each run, also the last one. The text is corrected in this report and in register entry R-043. One fact is new and was not in the review: the commit that ends a stop for a conflict sees no `CHERRY_PICK_HEAD` |
| `REVERT_HEAD` had no test | It stops no hook run of a revert. Four new tests show each form of a revert. The text says exactly when git writes the file |
| "`PERF-004-R2` shows no added time from the fix" | No support in that record. The words are corrected in three documents, and a comparison of the two builds in one session is added as a side measure |
| The OG-4 text left out the worst case of the foreground mode | Two new tests pin the behavior with a held Store. The OG-4 text is new, with the times, what a person sees, and the worst case for each option |
| A path comparison that would fail on Windows | The proof hook prints its folder with `pwd -W` when the shell knows it. The test passed on Windows in the platform run of 2026-11-28 |
| Tests that returned early and passed | They are skipped tests now, with the reason in the name. See the next section |
| No assertion of the empty state after the commit that ends a conflict merge | Added |
| One test for notes and met gates | Split into two tests |
| P5 took builder choices by reference | [P5 Stage 5](05-git-hooks-in-setup.md#stage-5---proposals-from-phase-4) holds each one as a proposal: T20 to T34, A62a to A62p |
| The index did not show the P4 results | The gate rows of OG-3, OG-4, and OG-6, and the note about register entries, are updated in the index and in the plan |
| `git am` | A new test: it runs none of the four hooks. Added to R-043 |
| A single quote in a temporary path broke the hook text | The helper writes each path in safe single quotes, and a test uses a temporary folder with a quote and a space in its name |
| The cleanup after the global install proof | The test removes the link into the package folder by itself, before the recursive removal, and checks that the package folder is whole |

The correction changed no product code. `packages/cli/src/operations/work/work-store/sync.ts` is as the review passed it.

### P4 Conditional Skips

Each test below can be skipped. A skipped test shows as skipped in the run, with the reason in its name, and it proves nothing in that run. On macOS, in the runs of this report, no test of the three P4 files was skipped. In the platform run, no test of the three files was skipped on Linux and on macOS, and one was skipped on Windows. The table after this one holds what each test did on each platform.

| Test file | Test | Skipped when | What is then not proven |
| --- | --- | --- | --- |
| `w35-r0-p4-git-hook-facts.test.ts` | "a hook file that is a link to a file of another tool shows as a symbolic link" | The platform is Windows. A test cannot make a symbolic link there without a special right | That git runs a hook file that is a link, on Windows |
| `w35-r0-p4-hook-checkpoint.test.ts` | "a recorded command file that needs node from PATH fails with a short PATH, and works when the block adds the node folder" | The system folders of the machine hold a `node` program | The case of R-044 on that machine |
| `w35-r0-p4-hook-checkpoint.test.ts` | "the command file that a real global install writes is found on PATH and runs in the hook shell" | The global install into the temporary prefix does not work. The test finds that out during its run, writes a log line with `made: false`, and marks itself as skipped | The command file of a real install on that platform. The evidence commit records "no proof gathered" |
| `w35-r0-p4-hook-checkpoint.test.ts` | The four groups that use the built CLI: the command lookup, a held Store, the hooks after a merge and after a rewrite, and the two work trees | The built CLI (`packages/cli/dist/index.js`) does not exist | Each test of those groups: 15 of the 17 tests |
| `w35-r0-p4-sync-race.test.ts` | The group of the four race tests | The built CLI does not exist | The race of R-041 |

What each test did in the platform run of commit `965ad51e`:

| Test | Linux | macOS | Windows |
| --- | --- | --- | --- |
| "a hook file that is a link to a file of another tool shows as a symbolic link" | ran and passed | ran and passed | skipped. The log shows "34 tests, 1 skipped" for the test file and does not name the test. This test is the only one of that file with a skip rule, and the rule is the platform Windows |
| "a recorded command file that needs node from PATH ..." | ran its proof. The log line `lookup-launcher-needs-node` holds both results | ran its proof, with the same log line | ran its proof, with the same log line |
| "the command file that a real global install writes ..." | ran its proof. The log line `lookup-global-install` holds `made: true` | ran its proof, `made: true` | ran its proof, `made: true` |
| The groups that need the built CLI | ran | ran | ran |

So neither of the two tests whose names say "(skipped when ...)" took its skip path on any platform. The short PATH of each runner held no `node` program, and the global install into the temporary prefix worked on each one.

One test is not skipped and expects another result on Windows: "git does not run a hook file that is not executable" expects that git runs the file there. The Windows run saw that: the log line `hook-not-executable` holds one `post-commit` run there, and no run on Linux and on macOS.

### P4 Checks

Every test and every CLI run used a temporary Store at a fixed path under `/private/tmp/claude`, and each run checked first that `MAKE_DOCS_HOME` was not empty. No run read or wrote the real Store. All checks of this list ran on macOS 27.2.1 with Node `v26.13.1` and git 2.47.1. The checks of the platform run are in [Platform Run](#platform-run).

- `npm ci`, then `npm run prepack -w packages/cli`: the build passes.
- `npx tsc --noEmit -p packages/cli`: no errors.
- `npx vitest run tests/w35-r0-p4-sync-race.test.ts` on the code before T18: 3 tests fail, each with "expected [ 'open', null ] to deeply equal [ 'closed', '<outcome>' ]". On the code after T18: 4 tests pass. 20 runs in a row after T18: 20 of 20 pass.
- `npx vitest run tests/w35-r0-p4-git-hook-facts.test.ts`: 25 tests pass. `npx vitest run tests/w35-r0-p4-hook-checkpoint.test.ts`: 15 tests pass.
- `npm test -w packages/cli -- --testTimeout=120000`, with `TMPDIR=/private/tmp/claude/x`, after the last change of product code and of documents: 3,938 tests pass, 2 fail, and 6 are skipped, in 165 test files. The 2 are `tests/mcp-app-contract.test.ts` "gives a typed chat fallback for an unproved transport" and "opens the same factory and resource over real stdio". They fail on Node 26 because of a deprecation warning on standard error. Known, and not from this phase. `tests/backup.test.ts` and `tests/uninstall.test.ts` pass with the short temporary path.
- One change came after that full run: the two git proof test files and their helper now use the native real path, so that a short folder name of Windows matches the long name that git prints. After it: `npx tsc --noEmit -p packages/cli` gives no errors, and the three P4 test files, `tests/w35-r0-p1-checkpoint-surfaces.test.ts`, and `tests/consistency.test.ts` pass, 125 tests in 5 files. The full suite did not run again after that change.
- `npm run validate:defaults`: 53 tests pass.
- `npm run test:smoke-harness`: 19 tests pass.
- `make-docs check prd --target-root .`: exit code 0, no diagnostics.
- `make-docs check performance-evidence`: exit code 1, as before this phase, with 127 diagnostics before and 127 after. No diagnostic is new, and none names `PERF-007`. The check lists 8 profiles and not 7: `PERF-007` is the new one.
- `make-docs project paths validate`: valid, 0 findings.
- `make-docs project markdown validate --path <file>` on each changed document: no findings on this report, the P4 phase file, the W29 R0 P6 phase file, and PRD 52. On the risk register it reports findings only on lines that this phase did not change.
- `make-docs backlog snapshot --target-root .`: exit code 0, and no diagnostic names W35.
- The package: `npm pack --ignore-scripts` in `packages/cli` after the last change gives the tarball SHA-256 `739ad356412dfa09c3ffb853e3f0a62391cef44d042da3fbb11c676eb8ab7ab9`, the same build that `PERF-007` and `PERF-004-R2` measured. The builder did not write the digest file. The orchestrator records it after the review, under standing rule 10.
- `PERF-007`, `PERF-004-R2`, and the side measure: see the sections above. No other process of this builder ran on the machine during the counted runs.

Checks of the review correction, on 2026-11-27, on the same machine, with a temporary Store at a fixed path under `/private/tmp/claude`:

- Each finding of the review was checked with a run before the change: a cherry-pick, a revert, and `git am` in temporary repositories by hand, and the held Store with a new test.
- `npm run prepack -w packages/cli`: the build passes. `npx tsc --noEmit -p packages/cli`: no errors.
- The three P4 test files and the four test files of P1 to P3, in one run: 213 tests pass in 7 files, and none is skipped. `tests/w35-r0-p4-git-hook-facts.test.ts` has 34 tests, `tests/w35-r0-p4-hook-checkpoint.test.ts` has 17, and `tests/w35-r0-p4-sync-race.test.ts` has 5.
- `npx vitest run tests/w35-r0-p4-sync-race.test.ts`, 20 runs in a row: 20 of 20 pass, 5 tests each.
- The same race test file against the build with the sync file of `d12d1047`, in the temporary copy of the source: 4 tests fail and 1 passes. Each failure is "expected [ 'open', null ] to deeply equal [ 'closed', '<outcome>' ]". In the two split tests the check of the note, and of the met gate, before that line passes.
- `npm test -w packages/cli -- --testTimeout=120000`, with `TMPDIR=/private/tmp/claude/x`: 3,950 tests pass, 2 fail, and 6 are skipped, in 165 test files. The 2 are the known `tests/mcp-app-contract.test.ts` failures on Node 26. `tests/backup.test.ts` and `tests/uninstall.test.ts` pass. A first try of this run was stopped by a time limit of the builder's tool after 10 minutes, with no result. The second try ran to its end in 604 seconds. After it, only documents changed: one sentence and one blank line in the P5 phase file, and this list.
- `npm run validate:defaults`: 53 tests pass. `npm run test:smoke-harness`: 19 tests pass.
- `make-docs check prd --target-root .`: exit code 0, no diagnostics.
- `make-docs check performance-evidence`: exit code 1, with 127 diagnostics, the same count as before the correction, and 8 profiles. None names `PERF-007`. A first run gave 128: one new sentence in the P5 phase file held a time with no profile link. The sentence was changed, and the count is 127 again.
- `make-docs project paths validate`: valid, 0 failing findings.
- `make-docs project markdown validate --path <file>` on each changed document: no findings on this report, the index, the P4 and P5 phase files, the two plan files, the W29 R0 P6 phase file, and PRD 52. On the risk register it reports 9 findings, each on a line that this phase did not change.
- `make-docs backlog snapshot --target-root . --json`: exit code 0, standard error is empty, and no diagnostic names W35. The snapshot shows 7 phases and 127 tasks for W35 R0.
- The comparison in one session: one trial with 2 samples to prove the harness, then the one run with 25 samples that this report holds. No other process of this builder ran during that run.
- Not run in the correction: `npm ci`, `npm pack`, and any run on Linux or Windows. The package bytes did not change in the correction, because only tests and documents changed.

### P4 Not Done

- A39 and A41: the platform run is done and recorded in [Platform Run](#platform-run). What is still missing for each case is in the closeout notes of the [phase file](04-git-hook-proofs.md#closeout-notes). The orchestrator and the reviewer judge whether each case passes.
- Owner gate OG-6: the finding is "no platform gap found in the run of commit `965ad51e`; the gate did not open". It is a finding and not an owner decision.
- T10 and A42: no access run inside an agent tool exists. The orchestrator starts those sessions under standing rule 11.
- A46: the owner has not answered owner gate OG-4.
- The owner has not reviewed the 13 points under "P4 New Behavior That The Documents Did Not State", and the two possible refinements under owner gate OG-4.
- The race test file is in the two workflow lists since 2026-11-27, and the platform run ran it on the three platforms.
- The finding of T11, that an existing record fits and OG-3 does not open: the independent review agreed with it on 2026-11-27. It stays a finding and not an owner decision.
- R-041 is closed in the register by the builder. The independent review has not checked the fix yet.
- The package digest is not recorded again. This phase changed package bytes, so the recorded digest is stale.
- The first import is slower in `PERF-004-R2` than in `PERF-004-R1` by 36 percent, and this phase did not find the cause.
- P5 owns each point of the list under "What P5 Builds From This Phase". This phase built none of them.

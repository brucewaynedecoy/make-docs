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

P3 is built and not marked complete. T1 to T9 are done. The owner has not read the lines (A38) or the points of new behavior below. One independent review ran on 2026-11-27, and its fix pass is in this report: see [The Review Of P3 And Its Fix Pass](#the-review-of-p3-and-its-fix-pass). The check of that fix pass has not run yet. One finding of the review waited for the owner: the `docs/work/` note. The owner answered it on 2026-11-28, and the note has new words: see [the finding](#the-review-finding-on-the-note-answered-by-the-owner). The orchestrator records the package digest after the review, under standing rule 10.

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

The exact wording of these texts is a proposal, with one exception: the owner chose the words of the `docs/work/` note on 2026-11-28. The owner did not decide the other wordings, and each of them waits for the owner's review. The counts are bytes and words of the text as shown, with no line end.

The root router line, in the managed block of `AGENTS.md` and `CLAUDE.md` at the project root (349 bytes, 58 words). Every agent in every project reads it in every session:

```text
- When the work store is in charge of this project's work (`make-docs work status` says which side is), find work with `make-docs work next`, not with file searches, and run `make-docs project checkpoint` after you change a file under `docs/work/` and after you close a phase. Otherwise, or without the CLI, the `docs/work/` files are the authority.
```

The `docs/work/` note, in the managed block of `docs/work/AGENTS.md` and `docs/work/CLAUDE.md` (474 bytes, 68 words). The line that it replaces had 293 bytes and 40 words. The owner chose this exact text on 2026-11-28. It is the text that the reviewer proposed. The text before it had 526 bytes and 80 words, and [the finding](#the-review-finding-on-the-note-answered-by-the-owner) holds it:

```text
- When the work store is in charge (`make-docs work status` says which side is), find work with `make-docs work next`, and run `make-docs project checkpoint` after you edit a file here. Otherwise, or without the CLI, these files are the authority: read and edit them directly. To claim, report, or close work, use a valid local `.make-docs/system/references/work-store.md` body or, when it is absent, run `make-docs resource read make-docs://system/reference/work-store.md`.
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

The first paragraph of the `Checkpoint` section changed in one sentence. Before: "Run it when you start a session, after you change a work file, at the end of a turn, after a commit or a pull, and when you close a phase." Now: `[When to Run It](#when-to-run-it) names the moments.`

The MCP server instructions (528 bytes, 80 words). The text before the fix pass had 437 bytes and 67 words. The `all`, `backlog`, and `workflow` profiles send this same text. The `core`, `setup`, `quality`, and `factory` profiles send no instructions:

```text
When you start work on this project's backlog, call `project_checkpoint` with no `event`. Add `allowWrite: true` only when your task may change this project's files. When the work store is in charge (`work_status` says which side is), find work with `work_next`, not with file searches, and call `project_checkpoint` with `allowWrite: true` after you change a file under `docs/work/` and after you close a phase. Without a usable Store, the `docs/work/` files are the authority: `project_checkpoint` says so and changes nothing.
```

The text is true to the tool of Phase 1. A call without `allowWrite` gets the read steps and a result that says the sync did not run (PRD 25 R-MCP-PROFILE-12). So an agent that only reads or reviews writes nothing when it obeys the first sentence. With the Store in charge, a call with `allowWrite: true` is a full two-way sync: it writes the Store, and it can write and remove files under `docs/work/`. So the text asks for it only from an agent whose task may change project files, and after that agent changed a work file or closed a phase.

How each text meets the owner's rule that the note holds with no Store:

| Case | The root line | The `docs/work/` note | The MCP instructions |
| --- | --- | --- | --- |
| A usable Store, and the work store is in charge | The "When" sentence applies. | The "When" sentence applies. | The agent runs the checkpoint. It syncs only with `allowWrite: true`. |
| A Store is present, and the files are in charge, such as a fresh clone or a linked worktree that is not bound | The "When" sentence does not apply, and the word "Otherwise" of the last sentence applies. | The "When" sentence does not apply, and the word "Otherwise" of the second sentence applies. Before the owner's decision of 2026-11-28 the note was false in this case. | `project_checkpoint` says in one line that the files are the authority. |
| No usable Store | The word "Otherwise" of the last sentence applies. | The word "Otherwise" of the second sentence applies. | The last sentence applies. |
| No CLI | The last sentence applies. | The words "or without the CLI" of the second sentence apply. | No MCP server runs, so no instructions exist. |

#### The Review Finding On The Note, Answered By The Owner

The owner answered this finding on 2026-11-28 with option a of question P3-1: replace the word "present" in the note. The owner chose the exact text that the reviewer proposed. The end of this section records the change. The text from here to the proposed text is the record of the finding as it stood on 2026-11-27.

The independent review of 2026-11-27 found that the `docs/work/` note was false in one case. Its first sentence said: "When the work store is present, it is the authority". A Store can be present and not in charge: in a fresh clone, and in a linked worktree that is not bound to the Store. In that case the files are the authority, and the note said the opposite. The words in brackets sent the agent to `make-docs work status`, and they did not make the first sentence true. The note of 2026-11-27, exactly:

```text
- When the work store is present, it is the authority (`make-docs work status` says which side is in charge). Find work with `make-docs work next`, and run `make-docs project checkpoint` after you edit a file here. Without the CLI or a usable Store, these files are the authority: read and edit them directly. For the rules, and to claim, report, or close work, use a valid local `.make-docs/system/references/work-store.md` body or, when it is absent, run `make-docs resource read make-docs://system/reference/work-store.md`.
```

"Present" was the owner's own word. So the fix pass of 2026-11-27 did not change the note, its tests, or PRD 15 R-WORK-ROUTER-2, and the orchestrator asked the owner.

PRD 15 R-WORK-ROUTER-3 says that both texts are true "in a project where the files are in charge". On 2026-11-27 that statement held for the root line and was not proven for the note.

The reviewer's proposed replacement text for the note, exactly:

```text
- When the work store is in charge (`make-docs work status` says which side is), find work with `make-docs work next`, and run `make-docs project checkpoint` after you edit a file here. Otherwise, or without the CLI, these files are the authority: read and edit them directly. To claim, report, or close work, use a valid local `.make-docs/system/references/work-store.md` body or, when it is absent, run `make-docs resource read make-docs://system/reference/work-store.md`.
```

The root line and the MCP instructions use "in charge".

The owner's decision of 2026-11-28, and what changed with it:

- The decision: replace the word "present" in the note of the `docs/work/` routers, because a Store can be present and not in charge, as in a fresh clone or a linked worktree. The note is now the proposed text above, byte for byte. The conditional intent of the owner's first decision is kept: the note holds when no work store is installed or available.
- The files: `packages/docs/template/docs/work/AGENTS.md` and `packages/docs/template/docs/work/CLAUDE.md` first, then the installed copies `docs/work/AGENTS.md` and `docs/work/CLAUDE.md`, which match their template files byte for byte (`cmp`). The block keeps its line count. No file of a backlog changed for the note.
- The tests: `packages/cli/tests/w35-r0-p3-routers-and-mcp-instructions.test.ts` holds the new note. The test of the two lines now needs "When the work store is in charge" at the start of each, fails on the word "present", and allows only three sentence starts: "When the work store is in charge", "Otherwise, or without the CLI", and "To claim, report, or close work". The file still has 36 tests.
- PRD 15: R-WORK-ROUTER-2 has the new meaning and no longer fixes the word "present". The statement of R-WORK-ROUTER-3 about a project where the files are in charge now holds for the note, by the same word "Otherwise" as in the root line. That is a reading of the text and a text match of the test, as for the root line, and no test runs an agent. PRD 15 has a Requirement History entry of 2026-11-28.
- The design records the decision under its owner decisions.
- What the new note no longer says: the words "For the rules" before the pointer to the work store reference. The pointer now names the claim, the report, and the close of work.
- Other shipped text: a search of `packages/docs/template/`, `packages/cli/src/`, and `packages/skills/` found no other text that says that a work store that is "present" is the authority. The root line, the MCP instructions, and the work store reference use "in charge".
- A router file under `docs/work/` changed, and the note asks for a checkpoint after such an edit when the work store is in charge. The builder of this change ran no checkpoint in this repository, because that run would use the real Store. The orchestrator owns that run.
- The checks: see [Checks Of The Owner Decisions Of 2026-11-28](#checks-of-the-owner-decisions-of-2026-11-28).

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
3. The `docs/work/` note keeps the words "to claim, report, or close work" from the line that it replaces. It also keeps the form of the other router lines: a valid local body first, then `make-docs resource read` with the URI. Since the owner's decision of 2026-11-28 the note says "in charge" and "Otherwise, or without the CLI", as the root line does, and it no longer holds the words "For the rules".
4. The MCP instructions name `allowWrite: true` two times, each with a condition: the agent adds it to the first call only when its task may change this project's files, and it passes it after it changed a file under `docs/work/` and after it closed a phase. Without it, the tool does the read steps only and says that the sync did not run (PRD 25 R-MCP-PROFILE-12). The first text of this phase told every agent to pass it at the start of every session. The review found that this made the write intent automatic, also for an agent that only reviews or answers a question, and the fix pass removed it.
5. The MCP instructions tell an agent to call the checkpoint "when you start work on this project's backlog", and not at the start of every session. So an agent with a task that is not backlog work is not told to call it. The design's event table names the start of a session. The words "start work on this project's backlog" are narrower, and they are new. The checkpoint itself finds who is in charge, and with no usable Store it changes nothing.
6. The server decides from the listed tools, and not from the profile name, whether it sends the rule. The rule needs all three tools: `project_checkpoint`, `work_status`, and `work_next`.
7. A profile with no work tool sends no `instructions` field at all. No profile sends any other instruction text.
8. The tool names in the instructions come from the name catalog when the server starts. If one of the three operations is not a current catalog entry, the server sends no instructions and starts as before. Advice text cannot stop the server. A test holds the three names, so the name test is the guard, and a second test proves that a catalog without a current name gives no instructions and no error. The first text of this phase stopped the server in that case, also for a profile that sends no text, and the fix pass removed that.
9. The trigger text is its own part, `### When to Run It`, at the end of the `Checkpoint` section. It has no rule ID, because no CLI rule decides when an agent runs a command.
10. The trigger text replaces the earlier sentence of five moments. "At the end of a turn" and "after a commit or a pull" are not in the list of three moments. The text says that an agent also runs the checkpoint when it does not know whether work files changed, such as after a commit or a pull. `turn-end` stays in the list of the six events.
11. The trigger text says that an agent needs no hook for the three moments.
12. The name test of this phase is its own, stricter test, beside the shipped-text scan of W33 R0 P4. PRD 39 R-NAME-6 says so.
13. The PRDs fix the meaning of each text and not its exact words, because the owner has not approved the words. PRD 15 R-WORK-ROUTER-1 and PRD 25 R-MCP-INSTR-1 say so and point to this report for the proposed words. One exception existed on 2026-11-27: PRD 15 R-WORK-ROUTER-2 held the words "When the work store is present, it is the authority", which were the owner's own words. The owner replaced them on 2026-11-28, and R-WORK-ROUTER-2 now fixes the meaning "in charge". The words of the note are the owner's choice of 2026-11-28.
14. The trigger text names the two forms of the event input: `--event` for the command and `event` for the tool. It says that the tool syncs only with `allowWrite: true`, and without it gives the read steps and says that the sync did not run.
15. The trigger text keeps the moment "at the start of a session, before you find or pick work" for a direct run by an agent. The MCP instructions say "when you start work on this project's backlog". The two texts differ in these words.

### The Review Of P3 And Its Fix Pass

One independent review of P3 ran on 2026-11-27, before any commit of the phase. The fix pass checked each finding against the code first. Each finding was right. The fix pass recorded no owner decision for this phase.

| Finding | What the review found | Result |
| --- | --- | --- |
| M1 | The MCP instructions told every agent to call `project_checkpoint` with `allowWrite: true` at the start of every session, with no condition. PRD 25 R-MCP-INSTR-1 said the same as a MUST. With the Store in charge, that call is a full two-way sync. | Fixed. The first call has no write permission unless the agent's task may change project files. The later calls name the write permission, after a change under `docs/work/` and after a closed phase. R-MCP-INSTR-1 has the new meaning, and its words "in the same conditional words" are gone. |
| M2 | The `docs/work/` note is false when a Store is present and not in charge. | Not changed in the fix pass, because "present" was the owner's word. The owner answered on 2026-11-28, and the note now says "in charge". See [the finding](#the-review-finding-on-the-note-answered-by-the-owner). |
| S1 | The last sentence of the root line did not cover a usable Store with a checkout that is not bound. | Fixed: "Otherwise, or without the CLI, the `docs/work/` files are the authority." |
| S2 | A catalog without a current name for one of the three tools stopped the MCP server in every profile. | Fixed. The server sends no instructions in that case, and a test proves it. |
| S3 | The reference named the tool argument as `--event`. | Fixed. The text names `--event` for the command and `event` for the tool, and it says that the tool syncs only with `allowWrite: true`. |

The reference keeps the moment "at the start of a session, before you find or pick work". It gives no order to pass the write permission, and its new clause says what the tool does without it. The root line held no session-start order, so only its last sentence changed.

The fix pass also softened the PRD text. PRD 15 R-WORK-ROUTER-1 and PRD 25 R-MCP-INSTR-1 now say that they fix the meaning and not the words, and they point to this report. PRD 15 R-WORK-ROUTER-2 and R-WORK-ROUTER-3 did not change in the fix pass, because they waited for the owner's answer on the note. They changed on 2026-11-28 with that answer.

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
- Done on 2026-11-28: the owner answered the review finding on the `docs/work/` note, and the note, its tests, and PRD 15 changed. The owner has not read the other lines yet (A38).
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
- The owner. The owner answered owner gate OG-4 on 2026-11-28, so A46 has its answer: see [the gate](#owner-gate-og-4-the-run-mode-of-a-git-hook). The owner has not reviewed the points under "P4 New Behavior That The Documents Did Not State".
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

The owner answered this gate on 2026-11-28. The answer, for A46:

- Option A: a git hook runs the checkpoint in the foreground.
- Improvement 1, chosen: a short time limit on the wait for the Store, after which the hook gives up quietly. It is the first of the two possible refinements below.
- Improvement 2, offered and not chosen: the hook after a rewrite skips the amend case. It is not built. So an amended commit still runs two hooks, and each one runs the checkpoint.

What replaced this answer, on the same day. The owner decided on 2026-11-28, after the answer above, that git hooks run in the background. The answer above stays as the record of the first answer, and the measured history below is not changed. The reason for the change, as a fact that the owner saw: an independent review measured that the cost of a foreground hook grows with the count of work files (about 1.85 seconds for each commit at 1,000 work files in the review's project), and that the wait limit does not bound the work of the run. The decisions:

- OD-P5-1: git hooks run in the background. The hook starts the checkpoint and returns, and git does not wait. This replaces the foreground mode of option A.
- OD-P5-2: a foreground fallback applies where a background process cannot survive: on a platform or in an agent tool where the started process does not keep running after the hook ends, the hook runs the checkpoint in the foreground. The owner did not exclude a foreground fallback for git hooks and sees no reason why it cannot be done. The review that setup shows says which mode applies.
- OD-P5-3: in the background, the checkpoint has no short limit on the wait for the Store. It uses the normal wait, the Store busy timeout, 5,000 ms today, and then it syncs. The fix for the 30 second waits stays: no background run waits that long.
- OD-P5-4: in the foreground fallback, the limit of 1,000 ms on each wait for the Store applies, as the owner chose with improvement 1.
- OD-P5-5: a person who wants a foreground hook, or a hook whose output an agent can see, uses the hook of an agent tool (P6). So a git hook in the background mode prints nothing, in every case.

[P5 Stage 6](05-git-hooks-in-setup.md#stage-6---the-foreground-run-and-the-wait-limit) builds these decisions as T39 to T45, and [The Background Mode](#the-background-mode-t39-to-t45-a62w-to-a62ae) in the P5 section holds the evidence. The built block was measured again as [`PERF-007-R2`](04-git-hook-proofs.md#result-record-of-the-requalification). Option B of the text below is not what was built: the built hook starts the checkpoint through the command itself and has a foreground fallback.

The owner did not decide four details: the length of the limit, how the limit is built, what "quietly" means in detail, and whether the limit covers the whole checkpoint run or only the wait for the Store. The [plan](../../plans/2026-11-27-w35-r0-agent-checkpoints-and-triggers/00-overview.md#owner-decisions) holds one recommendation for each, R8 to R11, with the facts. They are not owner decisions. [P5 Stage 6](05-git-hooks-in-setup.md#stage-6---the-foreground-run-and-the-wait-limit) builds the answer as T35 to T38, with the cases A62q to A62v, and the P5 review shows R8 to R11 to the owner. This phase built no hook code and no limit.

The text from here to the end of this section is the text that the owner had for the choice, as it stood on 2026-11-27. It gives the two options of the plan and one recommendation.

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

A note for P5, in each mode: standing rule 5 says that a git hook never fails or blocks a git action. The checkpoint exits 1 when the Store is held. So the hook block must swallow that exit code, and P5 must decide what the hook prints then. P5 T31 holds it. Since the owner's answer of 2026-11-28 the case of a held Store has its rule: the hook waits only the limit and then gives up quietly. P5 T36 builds it, and T31 decides only the other non-zero exit codes.

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
10. Run the checkpoint in the foreground. The owner chose that mode at OG-4 on 2026-11-28 (P5 T35). Build the short time limit on the wait for the Store, after which the hook gives up quietly (P5 T36 to T38). Do not make the hook after a rewrite skip the amend case: the owner did not choose that improvement.
11. Make the block swallow a non-zero exit code of the checkpoint, and decide what the hook prints then. The checkpoint exits 1 when another process holds the Store. For that case the hook gives up quietly after the limit (P5 T36), and P5 T31 decides the other cases.
12. Each choice of this phase that no document stated is a proposal, and P5 holds each one as a task with a case: [P5 Stage 5](05-git-hooks-in-setup.md#stage-5---proposals-from-phase-4), T20 to T34.

What the hook review that setup shows must name:

- The hooks act only in a checkout that is bound to the Store. A new work tree of a clone is not bound until `make-docs project checkout apply` runs there (R-045).
- These git actions do not reach the checkpoint through a hook, so the reminder line and the next commit cover them: `git reset --hard` and `git am`, which run none of the four hooks; a cherry-pick with no conflict, of one commit or more, where the rule for git in the middle of an action stops each hook run; and the open cases of R-043.
- With a foreground hook, a git action can take longer while another Make Docs write holds the Store. Without a limit that is about 5.5 seconds. With the wait limit that the owner chose on 2026-11-28, it is the limit and then the normal time of the checkpoint, and the hook then imports nothing. The review names the limit that P5 builds.
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

### Checks Of The Owner Decisions Of 2026-11-28

One change set recorded both owner decisions of 2026-11-28: the word of the `docs/work/` note, and the answer to owner gate OG-4. It changed the two template routers and their installed copies, one test file, PRD 15, one line of register entry R-040, the design, the plan, and this backlog. It built no hook code and no wait limit. It changed no file in `.github/release-candidates/` and no W22 R2 file. The note is package text, so the package bytes changed, and the orchestrator records the digest again under standing rule 10.

Every test and every CLI run used a temporary Store at a fixed path under `/private/tmp/claude/d28`, and each run checked first that `MAKE_DOCS_HOME` was not empty. No run read or wrote the real Store. The CLI runs used the built CLI of this branch. All checks ran on the maintainer machine, on macOS, with Node `v26.13.1`.

- `npm run prepack -w packages/cli`: the build passes.
- `npx tsc --noEmit -p packages/cli`: no errors.
- The P3 test file, `router-paths.test.ts`, `consistency.test.ts`, the W29 agent twin test, `system-assets.test.ts`, `install.test.ts`, `audit.test.ts`, and `human-experience-propagation.test.ts`, in one run: 273 tests pass in 8 files. The P3 test file has 36 tests.
- `npm test -w packages/cli -- --testTimeout=120000`, with `TMPDIR=/private/tmp/claude/x`: 3,950 tests pass, 2 fail, and 6 are skipped, in 165 test files. The 2 are the known failures of `tests/mcp-app-contract.test.ts` on Node 26. `backup.test.ts` and `uninstall.test.ts` pass. Documents changed while this run was going: the order of the Change History entries, and three links to the performance profile. The run of the next line covers them.
- A second run on the final files: the P3 test file, the consistency test, the managed block test, the two router test files, the shipped-text test, the name catalog test, and the W29 agent twin test. 220 tests pass in 8 files.
- `npm run validate:defaults`: 53 tests pass.
- `npm run test:smoke-harness`: 19 tests pass.
- `bash scripts/check-instruction-routers.sh`: "Instruction router check passed." This one run was outside the sandbox, because the script needs the system temp folder. The script runs no Make Docs command.
- `make-docs check prd --target-root .`: exit code 0, no diagnostics.
- `make-docs check performance-evidence --target-root .`: exit code 1, as before this change, with 127 diagnostics before and 127 after. A first run gave 129: one closeout note of P3 held a byte count, and one new task of P5 held a time bound with no profile link. Both lines were changed, and no diagnostic is new.
- `make-docs project paths validate`: valid, 0 failing findings.
- `make-docs project markdown validate --path <file>` on each changed document: no findings on this report, the index, the P3, P4, and P5 phase files, the three plan files, and the design. On PRD 03 and PRD 15 it reports findings only on lines that this change did not touch. The router files are skipped as instruction router files.
- `make-docs backlog snapshot --target-root . --json`: exit code 0, standard error is empty, and no diagnostic names W35. The snapshot shows 7 phases and 131 tasks for W35 R0. A first run gave one warning for this backlog: the new Change History entry stood first, and the rule wants the newest entry last. The entry was moved to the end, in the index and in the plan.
- The two template routers and their installed copies: `cmp` shows that `docs/work/AGENTS.md` and `docs/work/CLAUDE.md` match their template files byte for byte. The note has 474 bytes with no line end.
- Not run: `npm ci`, `npm pack`, `npm run smoke:pack:local`, the update by hand from the released 2.1.0 package, and any run on Linux or Windows.

### P4 Not Done

- A39 and A41: the platform run is done and recorded in [Platform Run](#platform-run). What is still missing for each case is in the closeout notes of the [phase file](04-git-hook-proofs.md#closeout-notes). The orchestrator and the reviewer judge whether each case passes.
- Owner gate OG-6: the finding is "no platform gap found in the run of commit `965ad51e`; the gate did not open". It is a finding and not an owner decision.
- T10 and A42: no access run inside an agent tool exists. The orchestrator starts those sessions under standing rule 11.
- Done on 2026-11-28: the owner answered owner gate OG-4 (A46), and chose the first of the two possible refinements. The owner did not choose the second one. The four recommendations R8 to R11 of the plan wait for the owner at the P5 review.
- The owner has not reviewed the 13 points under "P4 New Behavior That The Documents Did Not State".
- The race test file is in the two workflow lists since 2026-11-27, and the platform run ran it on the three platforms.
- The finding of T11, that an existing record fits and OG-3 does not open: the independent review agreed with it on 2026-11-27. It stays a finding and not an owner decision.
- R-041 is closed in the register by the builder. The independent review has not checked the fix yet.
- The package digest is not recorded again. This phase changed package bytes, so the recorded digest is stale.
- The first import is slower in `PERF-004-R2` than in `PERF-004-R1` by 36 percent, and this phase did not find the cause.
- P5 owns each point of the list under "What P5 Builds From This Phase". This phase built none of them.

## P5 Git Hooks in Setup

Covers A48 to A62 and A62a to A62v in [P5](05-git-hooks-in-setup.md). Evidence date: 2026-11-28. Branch: `docs/w35-store-authority-and-agent-reminders`, at `7e3436d0`, with the phase changes uncommitted. Node `v26.13.1`. git 2.47.1. macOS. CLI package version `2.1.1`.

P5 is built on the maintainer machine and not marked complete. Each task that a builder on this computer can do is done. The independent review of this phase ran, and [P5 Fixes After The Independent Review](#p5-fixes-after-the-independent-review) holds what changed after it. After those fixes, the owner decided on 2026-11-28 that git hooks run in the background, and [The Background Mode](#the-background-mode-t39-to-t45-a62w-to-a62ae) holds that change. It replaces each statement of this section that a hook runs the checkpoint in the foreground. Six things wait:

- A first look by the independent review at the background mode.
- The proof of the background mode inside each agent tool, which the orchestrator runs.

- A second look by the independent review at the fixes, and the package digest, which the orchestrator records after the review.
- The platform run. The six hook test files of this phase are in both fixed lists of the platform workflow. They ran on macOS only. Linux and Windows have no result yet, so A60 waits for the phase commit, the push, the pull request run, and the evidence commit.
- The owner. The owner has not reviewed the hook review, the machine preference question, the lines that a hook prints, the removal report, the recommendations R1, R2, and R4 to R11, the proposals of T20 to T34, or the proposed names. [The List For The Owner](#the-list-for-the-owner) holds each one.
- No run in a real terminal. The sandbox of the builder gives no terminal. So no person saw the prompts on a screen. The tests replace the prompts and record the first choice of each one, and the review texts below come from the functions that setup calls.

Every test, measurement, and CLI run used a temporary Store at a fixed path, and each run checked first that `MAKE_DOCS_HOME` was not empty. No run read or wrote the real Store. Each git hook test and each hand run worked only inside a temporary git repository that the run made, with a temporary home folder, with empty files in place of the global and the system git config, with no inherited git variable, and with local bare repositories in place of a network remote. No run installed, changed, or removed a hook in this repository, in its work trees, or in any other real repository. No run started `make-docs setup` against this repository. Each machine step ran with no agent tool selected and with a temporary home folder, so it changed no settings file of any agent tool.

### P5 What Was Built

Product code:

- `packages/cli/src/git-hooks.ts` (new): the block text of each hook, the read of the hook files with the refusals, the clone-owned record in `tool_operations`, the plan with the state of each hook, the hook review text, apply, and removal.
- `packages/cli/src/setup-git-hooks.ts` (new): the decision of project setup about the hooks, the one line for each case with no install, and the hook part of the setup JSON result.
- `packages/cli/src/cli.ts`: the inputs `--git-hooks`, `--no-git-hooks`, and `--git-hooks-for-new-projects <yes|no>`, their checks before any write, the help text, the hook review and the question in the project flow, the install after the project is set up, and the field `gitHooks` of the setup JSON result.
- `packages/cli/src/setup-system.ts`: the machine preference question, its explicit input, its lines in the review under `This computer`, its write, and the field `gitHooksPreference` of the machine result.
- `packages/cli/src/store/global-config.ts`: the preference `settings.gitHooksForNewProjects`, with one read function and one write function.
- `packages/cli/src/uninstall.ts`: `setup remove` names what it does with each hook file before its final approval, and then removes or keeps each block.
- `packages/cli/src/store/database.ts`, `packages/cli/src/store/installation-state.ts`, and `packages/cli/src/store/tool-operations.ts`: the wait limit of one call (`withStoreWaitLimit`). Inside that call it bounds the busy time of each Store connection and each wait for a live Store owner (`storeOwnerWaitMs`).
- `packages/cli/src/backup-paths.ts` and `packages/cli/src/backup.ts`: the function that names the next backup folder moved to the backup paths file, with no change of its result, so that the hook code can use it. `packages/cli/src/store/json-files.ts`: the modes 0700 and 0600.
- `packages/cli/src/operations/project/checkpoint-ops.ts` and `packages/cli/src/operations/work/work-queue/checkpoint.ts`: a trigger run with the event `commit` or `branch-change` takes the wait limit and prints the short form.
- `packages/cli/src/operations/work/work-store/catalog.ts`: the rules `WORK-RULE-070` to `WORK-RULE-072`.
- `packages/cli/src/store/table-catalog.ts`, `packages/cli/src/store/maintenance.ts`, and `packages/cli/src/run/setup-store.ts`: the table catalog names the new kind of row, and `setup store check` names each git hook record.

Shipped text:

- `packages/docs/template/.make-docs/system/references/work-store.md` and its byte-identical installed copy `.make-docs/system/references/work-store.md`: three new rules in the Checkpoint section, and one paragraph under "When to Run It".

Tests:

- `packages/cli/tests/git-hook-setup.ts` (new): the helper. It extends the helper of the P4 proofs, `packages/cli/tests/git-hook-proof.ts`, which now builds the PATH of each git child process from one tool folder of the test and the system folders.
- `packages/cli/tests/w35-r0-p5-git-hook-block.test.ts` (new, 26 tests): the block text, the block writer, the refusals, and what a hook does and prints.
- `packages/cli/tests/w35-r0-p5-setup-git-hooks.test.ts` (new, 17 tests): the machine preference, the non-interactive setup path, repeat setup, drift, the record, removal, a deleted checkout folder, a moved clone, and two projects in one repository.
- `packages/cli/tests/w35-r0-p5-hook-wait-limit.test.ts` (new, 19 tests): the wait limit, each wait for a live Store owner inside and outside the limit, the three held lock files with a commit and a branch change, the commands that keep their waits, the held Store with a commit and with a true merge, the direct run, the first sync, the foreground run, the amended commit, and the short form.
- `packages/cli/tests/w35-r0-p5-hook-ownership.test.ts` (new, 11 tests): a changed block that setup keeps, the backup of a replaced block, a copied clone, a moved work tree, the command order, a hook file with a second language, and the modes of the Store folder.
- `packages/cli/tests/w35-r0-p5-test-path-guard.test.ts` (new, 4 tests): no hook test can run an installed `make-docs`.
- `packages/cli/tests/w35-r0-p5-hook-end-to-end.test.ts` (new, 7 tests): the two-checkout test, the two-worktree test, `git pull --rebase`, and the amended commit.
- `packages/cli/tests/w35-r0-p5-setup-offer.test.ts` (new, 6 tests): the interactive offer and the preference question, with the prompts replaced by test answers. The first report said that it proves no platform fact and left it out of the platform lists. The second independent review found that this breaks the standing rule, and the file is in both fixed lists now. It has no step that a platform cannot run: it replaces the prompts and uses the same helper as the other hook tests.
- `packages/cli/tests/setup.ts`: each test worker now stops the repository search of git at the temporary folder of the machine. So a test target in a temporary folder can never be read as a part of a real repository.
- Changed tests of earlier phases, each for a behavior that this phase changed on purpose: `w35-r0-p1-checkpoint-core.test.ts` and `w35-r0-p1-checkpoint-surfaces.test.ts` (the short form, and the three new rules), `w35-r0-p2-reminder.test.ts` (its rule list ends at `WORK-RULE-069`), `w35-r0-p3-routers-and-mcp-instructions.test.ts` (the name test also reads the hook block), `w35-r0-p4-hook-checkpoint.test.ts` (two tests that pinned the wait of 5 seconds now pin the limit, with an upper bound of 4,500 ms), `fixtures/work-store-contract.ts` (the new rules in two parity fixtures, with their exact lines), and `consistency.test.ts` (register entry R-046).
- `.github/workflows/platform-safety.yml`: six test files in both fixed lists (T14).

Documents: PRD 07, 28, 30, 38, 39, and 52, each with a `W35 R0 P5` Requirement History entry; the risk register (R-043 to R-045 updated, R-046 and R-047 new); this section; and the phase file.

### Owner Decisions That This Phase Built

These are the owner's decisions, built as decided. This phase records no other decision as made.

| Decision | Date | What was built | Proof |
| --- | --- | --- | --- |
| The git hooks are opt-in for each project. Setup shows each hook path and the exact block before it writes. No machine-wide git hooks path. | 2026-11-27 | The hook review, and three ways to select the hooks. The code sets no git config value. | A52, A53 |
| A machine preference, default "No", set at the machine step. | 2026-11-27 (OG-5) | `settings.gitHooksForNewProjects`, the question, and the input of `make-docs setup system`. | A53a |
| With the preference on, setup installs the hooks with no hook input, also with `--yes`, and only in a new project. A new project is a fresh setup target with no config file. | 2026-11-27 (R3, R3a) | The same condition that decides the project name of PRD 38 R-ID-8, read at the same place, before any write. | A53b, A53g |
| With the preference off, `setup --yes` installs no hook and says so in one line. | 2026-11-27 | One fixed line. | A53c |
| A hook of one agent tool always needs an explicit input. | 2026-11-27 | This phase builds no agent tool hook. The preference installs none. | A53e |
| Four hooks. Three import, and the hook after a branch change only reports. | 2026-11-27 | The four blocks. | A49, A57, A58 |
| A hook runs the checkpoint in the foreground, with a short time limit on the wait for the Store, after which it gives up quietly. The hook after a rewrite does not skip the amend case. The owner replaced the foreground mode of this answer on the same day: see the next row. | 2026-11-28 (OG-4) | The first build: the block started no background process, and a trigger run for a commit or a branch change waited at most 1,000 ms at each wait for the Store. That limit now holds for a foreground run. An amended commit runs two hooks. | A62q to A62u |
| Git hooks run in the background, with a foreground fallback where a background process cannot survive. In the background the checkpoint uses the normal wait for the Store and never waits 30 seconds. In the foreground fallback the limit of 1,000 ms applies. A git hook in the background mode prints nothing, in every case. | 2026-11-28 (OD-P5-1 to OD-P5-5) | See [The Owner Decisions Of 2026-11-28 On The Run Mode](#the-owner-decisions-of-2026-11-28-on-the-run-mode). | A62w to A62ae |
| The words of PRD 30 R-ADMIT-1, PRD 30 R-SELECT-1, the PRD 30 acceptance line, PRD 07 R-SETUP-CLI-10, and the PRD 28 sentence. | 2026-11-27 (OG-10) | The exact words are in the PRDs. | A61 |

### The List For The Owner

Nothing in this list is an owner decision. The builder built each point as the plan or the phase file writes it, or named another form with the reason. The owner can change any of them.

#### The Proposed Names

Each name follows the form of the names that setup has today. The setup inputs today are lower-case words with hyphens, with `--no-<thing>` for "skip this thing" (`--no-codex`, `--no-skills`) and `--<thing> <value>` for a choice (`--codex-method <none|mcp|command-rules>`). PRD 39 R-NAME-1 to R-NAME-5 rule command paths and MCP tool names. These three names are options of existing commands, so the name catalog does not change.

| What | Proposed name | Where | Reason |
| --- | --- | --- | --- |
| The hook input | `--git-hooks` | `make-docs setup`, `make-docs setup reconfigure` | It names the thing that setup installs. "Git" keeps it apart from a hook of an agent tool, which P6 names. |
| The "no hooks" input for one run | `--no-git-hooks` | The same two commands | The existing `--no-<thing>` form. |
| The input that sets the machine preference | `--git-hooks-for-new-projects <yes|no>` | `make-docs setup system` only | It says what the preference does and where it stops: new projects. It takes `yes` or `no`, so one input turns it on and off. |
| The key of the machine preference | `settings.gitHooksForNewProjects` (a boolean) in `config.json` of the Store | Global config | The form of the keys there today (`selfUpdate`, `marketplaceAutoRegistration`). |
| The debug switch | `MAKE_DOCS_HOOK_DEBUG` (an environment variable, any value) | One git command | The form of the variables that Make Docs reads today (`MAKE_DOCS_HOME`). A variable needs no change of a hook file. |
| The record in the Store | The operation name `setup.git-hooks.receipt-current` | One row of `tool_operations` | The name of the P4 proof, beside `setup.system.receipt-current`. |

#### The Recommendations R1, R2, And R4 To R11

| Number | The recommendation | What was built | What the person sees | Proof |
| --- | --- | --- | --- | --- |
| R1 | An update of Make Docs never turns the preference on and never installs a hook by itself. | Only the machine step writes the preference, and only from an answer or the explicit input. Setup of a project that exists installs no hook by the preference alone. | Nothing changes after an update. A later `setup --yes` in that project says in one line that it installed no hook, and names `make-docs setup --git-hooks`. | A53f |
| R2 | Turning the preference on writes one value and installs no hook in any project. Turning it off removes none. | The machine step writes `settings.gitHooksForNewProjects` and nothing else. | The review under `This computer` says: "This change installs no hook in any project now." or "This change removes no hook that a project already has." | A53, A53f |
| R4 | With the preference on, an interactive setup of a new project still shows the review, with "yes" first, and the person confirms. In an older project "no" is first. `setup --yes` shows the hooks in its plan and installs them. | As written. | The hook review, then the question "Install these four Make Docs git hooks for this project?". | A53, A53b |
| R5 | An explicit "no hooks" input for one run holds over the preference. | `--no-git-hooks`. | "Git hooks: none installed in this run (--no-git-hooks)." | A53d |
| R6 | The machine step asks when global config holds no answer. `make-docs setup system` shows it again with the current value first. A non-interactive machine setup changes it only by an explicit input. `--yes` alone never changes it. An absent value means "No". | As written. One detail is the builder's: the inline machine step of project setup asks only when no answer exists, and `make-docs setup system` asks in each interactive run. | The question "Install the Make Docs git hooks automatically in each new project on this computer?", with "No" and "Yes". | A53a |
| R7 | When setup must refuse the git hooks, it installs none, says why in one line, and the rest of the run goes on. | As written, with the preference on and also with the hook input. | "Git hooks: none installed. `<the reason>` Make Docs changed no hook file." The setup result is still `complete`. | A48 |
| R8 | The limit is 1,000 ms. | `CHECKPOINT_GIT_HOOK_STORE_WAIT_MS = 1000`. It is the bound of each wait for the Store, and not of the whole hook run. | A commit while another process holds the Store, or a lock file of the Store, takes about 1.0 to 1.1 seconds longer than a normal commit with the hook. Before the fix after the review, a held lock file made it 30 seconds longer. An amended commit runs two hooks, so it takes about 2.3 seconds longer. The time of the checkpoint itself is not in the limit: see [The Cost Of A Hook With Nothing Due, For The Owner](#the-cost-of-a-hook-with-nothing-due-for-the-owner). | A62r |
| R9 | The checkpoint takes the limit. The hook script holds no timer. No new CLI option and no new MCP input. | A trigger run with the event `commit` or `branch-change` runs its Store work inside the wait limit of one call. The Store code got one input for that. The block text holds no timer. The name catalog did not change. | Nothing new. | A62r, A62t |
| R10 | "Quietly": nothing on standard output and standard error, and the git action exits 0. The checkpoint keeps its typed Store result and its exit code 1, and the block hides both. | As written. | Nothing at the commit. `make-docs work status` and the reminder line count the file as waiting until the next checkpoint. With `MAKE_DOCS_HOOK_DEBUG=1` the person sees the Store result. | A62l, A62s |
| R11 | The limit covers only the wait for the Store, and each wait. | The limit bounds each wait for the Store of the call by itself: the busy time of each Store connection, each retry of an open, and each wait for a live Store owner, which is a shared session, a named lock file, or a checkout writer. [Each Place Where A Checkpoint Run Can Wait](#each-place-where-a-checkpoint-run-can-wait) lists them. It is no timer on the run, and it does not add the waits of one run together. In each measured case a run met one wait. The first build bounded only the busy time of a connection, and only for the event `commit`; the review found that, and this is the corrected form. | A first sync that has the Store runs to its end. A hook run with nothing due takes longer in a project with more work files, and no rule bounds that. | A62t |

#### The Proposals From Phase 4 (T20 To T34)

| Task | The proposal | What was built | The reason | What the person sees | Proof |
| --- | --- | --- | --- | --- | --- |
| T20 | The block adds the recorded folder of `node` to the end of PATH. | Built, with one more part. The block records two paths: the `node` program and the Make Docs command file. It starts the recorded command file with the recorded `node` program first, and it uses `make-docs` from PATH only when the recorded file or the recorded `node` program is gone. The first build looked on PATH first; the fixes after the review changed the order (RF-9). | The recorded command is the version that wrote the block, so it knows the events and the wait limit. The command file that setup runs is a script file. A shell cannot always start it by its path, on Windows or when the file is not executable. `node <file>` is how setup itself was started. | The review names both paths as paths of this computer that can go stale, and names `make-docs setup --git-hooks` to record them again. | A62a |
| T21 | Setup sets the executable mode on a file that it creates, and names an existing file that is not executable. | As written. | Git does not run a file with no executable mode on a platform with file modes. Make Docs does not change a mode that another tool or the person set. | "This file is not executable, so git does not run it on a platform with file modes. Make Docs does not change its mode. To let git run it: chmod +x on this file." | A62b |
| T22 | Choose the place of the block. | Right after the first line of the hook file. The block is one subshell with its input closed. | An `exec` or an `exit` of another tool cannot skip a block that stands before it. A subshell changes no variable and no folder of the other script, and it does not take the input that git gives the hook after a rewrite. | "Make Docs adds the block after the first line and keeps every other byte." | A62c |
| T23 | A project in a subfolder of the repository. | The block holds the project folder, from the top folder of the work tree. It runs the checkpoint for each such folder that holds a Make Docs config. Two projects in one repository share the hook files. | The hook files belong to the clone, so the block cannot hold one full project path: each work tree has another one. | Nothing. | A62d |
| T24 | `setup remove` removes the Store record with the last block, and Store care names the record. | As written. `setup store check` lists each record. | The record is a machine record. | A new part of the Store check: "Git hook records (kept; no rule removes them):". | A62e |
| T25 | In a work tree that is not bound, the hook does nothing and says nothing. | Kept. | A line at each commit in such a work tree would be noise for a person who did not choose Make Docs there. | The review: "The hooks act only in a checkout that is bound to the Store. A new work tree of this clone is not bound until `make-docs project checkout apply` runs there." | A62f |
| T26 | Where the output is cut. | In the checkpoint, and not in the block. A trigger run with the event `commit` or `branch-change` gives the short form. | The block prints what the checkpoint prints. A cut in shell text would count lines and could cut the wrong one. | See [Each Line That A Hook Can Print](#each-line-that-a-hook-can-print). | A62g |
| T27 | Hidden error output, with a debug switch. | Kept. The switch is `MAKE_DOCS_HOOK_DEBUG`. | See the name table. | With the switch, the error output of the checkpoint on standard error. With no command at all: "make-docs git hook: no make-docs command at the recorded path and none on PATH." | A62h |
| T28 | No hook manager is known by name. | Kept. | A list of product names would go stale, and Make Docs names no such product. | The review: "Make Docs knows no other hook tool by name. When another tool writes a hook file again, it can remove the Make Docs block. A later `make-docs setup` then reports the block as missing." | A62i |
| T29 | A hook file that is a symbolic link is refused. | Kept. The hooks folder is also refused when it is a link. | A block written through a link changes a file that another tool owns. | "Another tool owns the hook file `<path>`: it is a symbolic link. Make Docs changed no hook file." | A62j |
| T30 | What "a shell script" means. | Kept as written. One more refusal: a file that is not UTF-8 text. | The block is text, so the file must be text. | "The hook file `<path>` is not a shell script: its first line does not name sh, bash, dash, ksh, or zsh." | A62k |
| T31 | The hook swallows a non-zero exit code. What it prints then. | Nothing, for each non-zero exit code. The block prints only the standard output of a checkpoint that ended with exit code 0. | Standing rule 5. A Store error at a commit is not something that the person at the commit can settle, and the file is not lost. | Nothing. Register entry R-046 holds the case of a shell that may not use the Store. | A62l |
| T32 | A checkout ID whose folder is gone. | Such a checkout does not hold the blocks. Setup and `setup remove` drop it when they write the record. | The other form keeps the block for ever. | "Git hooks: 1 other checkout of this clone selected the hooks, and its recorded folder is gone:", then the recorded folder, then "It does not keep the blocks, and git lists no work tree of this clone that can be that checkout at a new folder." When git lists such a work tree, the blocks stay (RF-7). | A62m |
| T33 | A record that a moved clone left behind. | A repair, and not a new key. Only setup with the hook input takes the record over, when no record exists for the new path, the git folder of the record is not there, and each block of the record is in the hook files, byte for byte. The plan names the record and its folder first. A plain setup and `setup remove` take nothing over. The first build took the record over in each setup and in `setup remove`; the review showed that a copy of a clone then takes the record of the original, and the fixes changed it (RF-5, RF-6). | Git gives a clone no ID, so each key is a path. The same bytes do not prove that the clone is the same, because a copy holds them too. So the person says it, with the hook input. | A plain setup at the new path says that no record of this clone covers the blocks, names the record of the old folder, and names `make-docs setup --git-hooks`. It reports no drift. With the hook input, each block is current and the record is the record of this clone. The Store check names the record of the old folder until then. | A62n |
| T34 | The state marks. | Five marks: `rebase-merge`, `rebase-apply`, `MERGE_HEAD`, `CHERRY_PICK_HEAD`, and `BISECT_LOG`. `REVERT_HEAD` is out. The block does not read the `sequencer` folder. | `REVERT_HEAD` stops no hook run, so it was a mark that did nothing. The `sequencer` folder would stop the sync of a revert of several commits, and the design names no revert. | The review names `git reset --hard`, `git am`, and a cherry-pick with no conflict as actions that reach no checkpoint. | A62o |

#### Each Line That A Hook Can Print

Since the background mode of 2026-11-28, these are the lines of the foreground fallback, and a hook in the background mode prints none of them. [What A Hook Prints Now](#what-a-hook-prints-now) holds both modes.

A hook prints only what the checkpoint prints on standard output, and only when the checkpoint ended with exit code 0. So these are all the lines. `<N>` is a count.

| Case | The lines |
| --- | --- |
| Nothing is due | No line. |
| Files were imported, and nothing waits | `Checkpoint: <N> file imported.` or `Checkpoint: <N> files imported.` |
| Something waits: a file waits for a write or a removal, a conflict waits, a held file differs, a file was not written, or a work file cannot be read | The summary line, such as `Checkpoint: 1 file imported, 1 file waits.` or `Checkpoint: 1 conflict waits for a person.`, and then `Run make-docs project checkpoint to see and settle what waits.` |
| After a branch change, when files wait | `Checkpoint: <N> file waits.` and then `Run make-docs project checkpoint to see and settle what waits.` |
| The caller has read access only, and files wait | One line: `Checkpoint: <N> file waits. This caller has read access only, so a caller with write access must run make-docs project checkpoint.` |
| No command, no Store, no Make Docs project, a checkout that is not bound, a held Store after the limit, a shell that may not use the Store, each other error | No line. |
| With `MAKE_DOCS_HOOK_DEBUG` set, on standard error | The error output of the checkpoint, or `make-docs git hook: no make-docs command at the recorded path and none on PATH.` |

The parts of the summary line are the parts of the checkpoint of P1: files imported, files that wait, conflicts that wait for a person, held files that differ, files not written, and work files that cannot be read. The short form holds no file path, no claim, and no list of ready work. [The Hand Run](#the-hand-run) holds the exact block of each hook.

### The Cases By Test

Each row names the test file that proves the case on the maintainer machine. "block" is `w35-r0-p5-git-hook-block.test.ts`, "setup" is `w35-r0-p5-setup-git-hooks.test.ts`, "offer" is `w35-r0-p5-setup-offer.test.ts`, "wait" is `w35-r0-p5-hook-wait-limit.test.ts`, "e2e" is `w35-r0-p5-hook-end-to-end.test.ts`, and "own" is `w35-r0-p5-hook-ownership.test.ts`.

| Case | State | Proof |
| --- | --- | --- |
| A48 | Proven | block: beside a hook of another tool, every other byte stays; the refusals for a hooks path of the repository and of the machine, a link, and a file that is not a shell script. setup: the one line, and the rest of the run goes on. |
| A49 | Proven | block: each of the four hooks exits 0 and prints nothing with no command, with no Store, and with no Make Docs install; a file checkout; the five state marks for the hooks after a commit and after a branch change. e2e: the hooks after a merge and after a rewrite run the checkpoint in a merge and in a rebase. |
| A50 | Proven in part | wait: a caller with read access only gets the one line, at the level of the checkpoint core. block: a shell that may not write the Store folder prints nothing and exits 0. No test starts a hook as a caller with read access only: that needs the caller identity of an agent tool, which P6 owns. |
| A51 | Proven | block, setup, and own: a changed block is drift, a plan changes nothing, and setup changes it only with the hook input, after the plan named it, with a backup file of the old block text. |
| A52 | Proven | offer: the review holds each of the four paths and each exact block, and it comes before the question. setup: the dry run holds each path and each block, and writes nothing. |
| A53 | Proven | offer: the first choice of the question in each case, and the hooks of a project that has them stay. |
| A53a | Proven | offer and setup. |
| A53b | Proven | setup. |
| A53c | Proven | setup. |
| A53d | Proven | setup and offer. |
| A53e | Proven | setup: no settings file of an agent tool exists in the temporary home folder. This phase builds no agent tool hook. |
| A53f | Proven in part | setup: a later setup run of an installed project installs no hook by the preference alone, and global config is byte-identical. No test runs a real update of the package from an older release. |
| A53g | Proven | setup and offer. An adopted checkout is an older project. |
| A54 | Proven | setup: two files of another tool, one of them with no line end at its end. |
| A55 | Proven | setup. |
| A56 | Done | Owner gate OG-6 did not open. See [Owner Gates](#owner-gates-og-3-and-og-6). |
| A57 | Proven | e2e. |
| A58 | Proven | e2e. |
| A59 | Proven | e2e. |
| A60 | Waits | Both lists hold the six files. The tests pass on macOS. Linux and Windows wait for the pull request run. |
| A61 | Proven | `make-docs check prd`, the shipped-text test, and the byte-match tests pass. See [P5 Checks](#p5-checks). |
| A62 | Waits for the owner | This section. |
| A62a | Proven | block. |
| A62b | Proven | block. On Windows no file is named, because Windows has no executable mode. |
| A62c | Proven | block: the block runs in a file that ends with `exec`, and in a file that ends with `exit`. |
| A62d | Proven | block. setup: two projects in one repository. |
| A62e | Proven | setup. |
| A62f | Proven | block. |
| A62g | Proven | block, wait, and e2e. The cut is in the checkpoint. |
| A62h | Proven | block. |
| A62i | Proven | block. |
| A62j | Proven on macOS | block. The test is skipped on Windows, where a test cannot make a link without a special right. |
| A62k | Proven | block: six first lines that setup takes, and five files that it refuses. |
| A62l | Proven | wait and block. |
| A62m | Proven | setup: the folder was deleted, and the blocks and the record go. own: the folder of a linked work tree moved, and the blocks and the record stay. |
| A62n | Proven | setup: the clone moved, and its checkout got a new checkout ID at the new path. A plain setup reports no false drift and takes nothing over. The hook input moves the record, `setup remove` then removes the blocks, and no record stays for the old path. own: a copy of a clone takes nothing over. |
| A62o | Proven | block. |
| A62p | Waits for the owner | [The List For The Owner](#the-list-for-the-owner). |
| A62q | Proven | wait. |
| A62r | Proven on macOS | wait. The bound is a number: the action may take at most 3,500 ms longer than the same action with a free Store, and at most 4,500 ms in all while a lock file of the Store is held. |
| A62s | Proven | wait. |
| A62t | Proven in part | wait: a direct run waits the busy time. For the first sync, a test shows that a commit whose hook run is the first sync of a checkout with 61 work files imports each one. That run is shorter than the limit on this machine, so it does not show a run that is longer than the limit. A unit test shows that the limit is the wait of a Store connection and no timer. |
| A62u | Proven | wait: a command file on PATH records two checkpoint calls for one amended commit. The recorded command of that test does not exist, so the block uses PATH. |
| A62v | Waits for the owner | The PRDs hold the run mode and the limit. |

### The Wait Limit (T35 To T37, A62q To A62u)

How it is built. The Store code has a wait limit for one call (`withStoreWaitLimit` in `packages/cli/src/store/database.ts`). Each Store connection that opens inside that call sets its busy time to the limit, the retry of a busy open ends at the limit, and each wait for a live Store owner ends at the limit. The checkpoint operation takes the limit of 1,000 ms for a trigger run with the event `commit` or `branch-change`. Nothing else takes it. So a direct run, a trigger run with another event, and each other command keep the wait times of the Store. The first build bounded only the busy time, and only for the event `commit`. [Each Place Where A Checkpoint Run Can Wait](#each-place-where-a-checkpoint-run-can-wait) holds the correction and each bound.

The times below are from test log lines of the first build on the maintainer machine. [The Measured Times After The Fix](#the-measured-times-after-the-fix) holds the times of the final build, also for a held lock file and for an amended commit. They are not a result of [`PERF-007`](04-git-hook-proofs.md#perf-007-the-checkpoint-that-a-git-hook-runs), and they are one run each.

| Action with the installed hooks | Free Store | Store held by another process | Added |
| --- | --- | --- | --- |
| A commit | 196 ms | 1,309 ms, exit code 0, no output | 1,113 ms |
| A true merge (`git pull` with a local commit) | 416 ms | 1,363 ms, exit code 0, no output | 947 ms |
| `make-docs project checkpoint --event commit` (the run of the hook, alone) | not measured | about 1,300 ms, exit code 1, one line on standard error | not measured |
| `make-docs project checkpoint` (a direct run) | not measured | about 5,500 ms, exit code 1 | not measured |
| `make-docs project checkpoint --event branch-change` | not measured | about 200 ms, exit code 0, the report | not measured |

The added time is about one limit, so a trigger run that imports has one wait for the Store on this machine. The test bound of 3,500 ms is the limit and a margin for a shared test machine. Before the limit, the same commit took about 5.5 seconds longer ([P4 evidence](#owner-gate-og-4-the-run-mode-of-a-git-hook)).

The block of P5 differs from the proof block that `PERF-007` measured: it reads the state marks, it finds the command in two steps, and it holds the output of the checkpoint until the checkpoint ends. The phase file asks for a rerun of an affected check only. The builder ran no `PERF-007` sample again. The one comparable number of this phase is the commit with nothing due and a free Store: 196 ms in one test run. That is one run with a small fixture of 2 work files, so it cannot be compared with the `PERF-007` medians on 471 work files.

### Owner Gates OG-3 And OG-6

OG-3 did not open. The record is one row of the existing table `tool_operations`, written with the same statement form as the machine receipts. The build added no table, no column, no schema version, and no migration. A test reads the schema version of the Store before and after and finds it the same. What changed is text: the table catalog in code and the R-MIN row of PRD 38 name the new kind of row and its writer. This stays a finding of P4 and of this build. It is not an owner decision. If the owner reads a new kind of row in that table as a Store schema change, the gate opens with the two options of the plan: A, approve a Store schema change; B, record the block for each checkout, a form that the design refused. The plan recommends A.

OG-6 did not open, by the finding of the P4 platform run. So T10 has nothing to apply, and it closes as `superseded`, as the phase file writes. One point of that finding concerns this phase: git runs a hook file that is a link has no Windows proof. Setup refuses a hook file that is a link on each platform, and that check reads the file and does not need git to run it. The test of that refusal in this phase is skipped on Windows too, because a test cannot make a link there.

### Where This Phase Meets A Rule That W22 Owns

This phase edited no W22 file. It changed shared setup code in these places, each small:

- `packages/cli/src/cli.ts`, the project flow of `runResolvedCli`. Five inserts: the reset of one module value at the start, the preference question inside `afterHarnessSelection`, one value named `gitHookNewProject` beside `planNewProjectName`, the hook decision after `printPlan`, the question after the project approval, and the install after `applyInstallPlan`. W22 R2 adds the adoption path to this same function. A merge is by hand.
- "New project". The hook code reads the same two facts as the project name rule: a fresh setup target, and no config file. An adopted checkout (`setup --adopt`) has a config file, so it is an older project, and the preference installs no hook there. This follows from R3a. W22 R2 owns adoption, so it should know this consequence.
- A second work tree of a project. It binds through `make-docs project checkout apply` and then `make-docs setup --adopt --yes`, which are W22 rules. The hooks act there only after that. This phase changed none of it.
- A clone that moved. The record repair of T33 works with a checkout that got a new checkout ID at the new path, and with a checkout that kept its ID through `make-docs project move apply`. In the test of this phase the reviewed move was not available ("The target has no independent managed ownership fact."), so the test covers only the new checkout ID. W22 R1 owns the move.
- `writeCanonicalSetupResult` gained one field, `gitHooks`. It is null when setup stops before the hook decision, such as at the adoption choice of PRD 07 R-SETUP-CLI-14.
- `packages/cli/src/uninstall.ts`. Two inserts around the removal operation. The removal of the project is unchanged.
- PRD 07 gained R-SETUP-CLI-15 to R-SETUP-CLI-24 after R-SETUP-CLI-14, and PRD 38 gained R-HOOK-STATE after R-HARNESS-STATE and one changed row of the R-MIN register. Both PRDs append a Requirement History entry at the end.

### P5 New Behavior That The Documents Did Not State

The builder chose each point. No point is an owner decision. The owner has not reviewed this list. The recommendations and the proposals above are not repeated here.

1. A refusal is for all four hooks. One hook file that setup must refuse means that setup installs no hook.
2. With the hook input, setup replaces a drifted block. The reviewed plan names the change first, and the old block text goes into a backup file. Without the hook input, setup keeps a drifted block and changes no hook in that run, also after an explicit "yes" and with the machine preference on (RF-2, RF-3). The first build replaced it on the preference path, with no backup, and the review found that.
3. A fourth state: a current block for which a newer block is ready. It appears when the recorded paths or the block text of a newer Make Docs differ. Setup writes the newer block only with the hook input.
4. A block with no Store record. Setup with the hook input records it when its bytes equal the block that setup would write, and replaces it, with a backup file, when they differ. Without the hook input setup keeps it. `setup remove` leaves it and names it.
5. A hook file that holds a damaged Make Docs block (one marker, or the markers in the wrong order) is refused, with the words to fix it by hand.
6. A setup with no terminal and no `--yes` installs no hook, also with the hook input. An interactive setup with the hook input installs the hooks with no extra question, after the review.
7. `--git-hooks-for-new-projects` is valid only with `make-docs setup system`. Project setup refuses it, so one run cannot set the preference and use it.
8. The hook input also counts as a selection input of `make-docs setup reconfigure --yes`.
9. A project that has the hooks, each with a current block, gets no question in an interactive setup. Setup reports the state.
10. A project outside a git work tree gets one line, and no offer.
11. Two Make Docs projects in one git repository share the hook files. The block names each project folder, and `setup remove` in one project takes its folder out of the block.
12. `setup remove` handles the hooks after the project files, and a hook problem never fails the removal of the project.
13. The machine result and the setup JSON result gained one field each: `gitHooksPreference` and `gitHooks`.
14. The Store check gained a list of the git hook records. It adds no fixed rule, and clean removes no hook record. A record of a clone that was deleted stays, and blocks nothing.
15. Three rule IDs are new in the work rule catalog: `WORK-RULE-070` to `WORK-RULE-072`. Three PRD 52 requirements are new: R-WORK-CHECKPOINT-13 to R-WORK-CHECKPOINT-15.
16. The MCP result of `project_checkpoint` with the event `commit` or `branch-change` holds the short form in its `lines`, as the CLI does. Each other field is unchanged.
17. Register entry R-046 is new: a git hook does nothing when its shell may not use the Store.
18. The test setup stops the repository search of git at the temporary folder of the machine, for each test of the suite.

### The Twin Review (T36)

The checkpoint is deterministic logic with an agent form, `make-docs://system/reference/work-store.md`. The agent form was reviewed for each change of this phase, and it changed:

- The short form and the wait limit are rules of the checkpoint that an agent can meet in a hook output. They are `WORK-RULE-070` and `WORK-RULE-071`, in the catalog and in the Checkpoint section.
- `WORK-RULE-072` says what the four hooks do, that only setup installs and removes a git hook, that an agent installs no hook by hand and writes no hook file of its own, and that an agent starts a direct run when a hook prints that something waits. This is the agent form of "install the hooks by hand": the answer is "do not". An agent without the CLI has no checkpoint to run, so a hook written by hand would have nothing to call.
- "When to Run It" says that the hooks do not replace the three moments, and why.

The twin test passes: each rule ID is in the catalog and in the agent form, in its own section. The template file and the installed copy are byte-identical.

### The Hand Run

This hand run is of the first build, before the fixes after the independent review. The hook review in step 4 is replaced with the review of the final build, which a function of setup made in a temporary project. These outputs of the final build differ from the lines below, and [The Hand Run Of The Four Review Cases](#the-hand-run-of-the-four-review-cases) shows them: each `gitHooks` result also holds `kept`, `takeoverFrom`, and `command`; the plan of `setup remove` with another bound checkout also names each hook file; the report of a kept changed block has more words; and the time in step 6 is now about 1.3 seconds.

One script ran the whole story with the built CLI, a temporary Store at a fixed path, a temporary home folder, and temporary git repositories. In the output below, `<work>` stands for the temporary folder of the run, `<node>` for the full path of the `node` program, and `<cli>` for the full path of the built CLI. The JSON results are cut to the hook part. The sandbox of the builder gives no terminal, so two texts come from the functions that setup calls: the review under `This computer` (`prepareSystemSetupCommand`) and the hook review (`renderGitHookReview`). Each other line is the plain output of the command.

```text
=== 1. The machine step sets the preference (non-interactive input) ===
--yes alone: {"status":"skipped-none","gitHooksPreference":{"value":null,"changed":false}}
The review under This computer, as the machine step shows it before the approval:
Detection is a hint. It does not prove support or limit your choice.

Generic MCP client: available; Make Docs prints a standard configuration and does not edit client-owned files. Next: rerun setup with `--generic-mcp-client <label>`.

No native harness method is selected.
Choosing none makes no native file changes.
Resource reads need no Store access.

Global intent file: <work>/store/config.json
- Effect: no global harness intent change.

Git hooks for new projects: no answer, which means No -> Yes
- Effect: writes one value, settings.gitHooksForNewProjects, in <work>/store/config.json. It changes no other value.
- With Yes, setup of a new project installs the Make Docs git hooks, also with `make-docs setup --yes`. This change installs no hook in any project now. An older project gets the hooks only by `make-docs setup --git-hooks` or by your yes in an interactive setup of that project.
- This preference never installs a hook that belongs to one agent tool.
with the input: {"status":"configured","gitHooksPreference":{"value":true,"changed":true}}
config.json settings.gitHooksForNewProjects: true

=== 2. A new project with the preference on: setup --yes installs the four hooks ===
{
  "status": "complete",
  "gitHooks": {
    "selection": "machine-preference",
    "preferenceOn": true,
    "newProject": true,
    "status": "installed",
    "message": null,
    "hooks": [
      "post-commit: absent -> create-file",
      "post-merge: absent -> create-file",
      "post-rewrite: absent -> create-file",
      "post-checkout: absent -> create-file"
    ]
  }
}
post-checkout
post-commit
post-merge
post-rewrite

=== 3. An older project: setup --yes installs none, and the explicit input installs them ===
{
  "status": "complete",
  "gitHooks": {
    "selection": "none",
    "preferenceOn": false,
    "newProject": true,
    "status": "none",
    "message": "Git hooks: none installed. The machine preference for git hooks is off. To install them for this project, run `make-docs setup --git-hooks`.",
    "hooks": [
      "post-commit: absent -> none",
      "post-merge: absent -> none",
      "post-rewrite: absent -> none",
      "post-checkout: absent -> none"
    ]
  }
}
{
  "status": "complete",
  "gitHooks": {
    "selection": "none",
    "preferenceOn": true,
    "newProject": false,
    "status": "none",
    "message": "Git hooks: none installed. The machine preference installs them only in a new project, and this project was set up before. To install them here, run `make-docs setup --git-hooks`.",
    "hooks": [
      "post-commit: absent -> none",
      "post-merge: absent -> none",
      "post-rewrite: absent -> none",
      "post-checkout: absent -> none"
    ]
  }
}

=== 4. The review that setup shows before it writes (a dry run in a terminal, with the explicit input) ===
{
  "status": "planned",
  "gitHooks": {
    "selection": "hook-input",
    "preferenceOn": true,
    "newProject": false,
    "status": "planned",
    "message": null,
    "hooks": [
      "post-commit: absent -> create-file",
      "post-merge: absent -> create-file",
      "post-rewrite: absent -> create-file",
      "post-checkout: absent -> create-file"
    ]
  }
}
The hook review, as setup shows it in a terminal before it writes:
Make Docs can add one marked block to each of four git hook files of this clone, in <work>/older/.git/hooks.
Each block runs the checkpoint in the foreground after the git action. A block never fails or blocks git, and it prints nothing when nothing is due.
Each work tree of this clone uses these hook files. Make Docs sets no machine-wide git hooks path.
Each hook runs the Make Docs command at the recorded path: <node> <cli>. That is the version that writes the block. Only when that file or that `node` program is gone does a hook run `make-docs` from PATH.

<work>/older/.git/hooks/post-commit
- Make Docs creates this file, with the executable mode, and puts the block in it.
- It runs: make-docs project checkpoint --event commit (it imports changed docs/work/ files into the work store and writes no project file)
<work>/older/.git/hooks/post-merge
- Make Docs creates this file, with the executable mode, and puts the block in it.
- It runs: make-docs project checkpoint --event commit (it imports changed docs/work/ files into the work store and writes no project file)
<work>/older/.git/hooks/post-rewrite
- Make Docs creates this file, with the executable mode, and puts the block in it.
- It runs: make-docs project checkpoint --event commit (it imports changed docs/work/ files into the work store and writes no project file)
<work>/older/.git/hooks/post-checkout
- Make Docs creates this file, with the executable mode, and puts the block in it.
- It runs: make-docs project checkpoint --event branch-change (after a branch change only; it imports nothing and only reports)

Limits:
- The hooks act only in a checkout that is bound to the Store. A new work tree of this clone is not bound until `make-docs project checkout apply` runs there. Until then the hooks do nothing there and say nothing.
- These git actions do not reach the checkpoint through a hook: `git reset --hard`, `git am`, and a cherry-pick with no conflict. The reminder line of the next Make Docs command and the next commit cover them.
- While another Make Docs process holds the Store or one of its locks, a hook waits at most 1 second at each wait for the Store. Then it gives up, prints nothing, and git goes on. The next checkpoint imports the file. The limit bounds the waits for the Store. It does not bound the work of the checkpoint, which reads each file below `docs/work/` and so takes longer in a project with more work files.
- A hook does nothing, and says nothing, when the shell that runs it may not use the Store, such as a restricted command shell of an agent tool.
- The block holds two paths of this computer: the `node` program and the Make Docs command file. A hook runs the command at these paths first, so the version that wrote the block runs, and not another `make-docs` on PATH. The paths can go stale when you move, update, or remove them. Then a hook runs `make-docs` from PATH, or does nothing when none is there. Run `make-docs setup --git-hooks` again to record them again.
- Make Docs keeps a block that you changed, and a block that no record of this clone covers. Only `make-docs setup --git-hooks` replaces or records such a block, and it keeps a backup of the old text of a block that it replaces.
- Make Docs refuses a hook file that starts another program on itself (a line with `exec` and `$0` as one word), because a block of shell text would break that file.
- Make Docs knows no other hook tool by name. When another tool writes a hook file again, it can remove the Make Docs block. A later `make-docs setup` then reports the block as missing.
- On a platform with file modes, git does not run a hook file that is not executable. Make Docs names such a file and does not change its mode.
- To see the error output of a hook, set MAKE_DOCS_HOOK_DEBUG=1 for one git command.

The exact block for post-commit:
# >>> make-docs git hook: post-commit >>>
# Make Docs wrote this block (version 1). It runs `make-docs project checkpoint --event commit` after a commit.
# It never fails or blocks git, and it prints nothing when nothing is due. Set MAKE_DOCS_HOOK_DEBUG=1 to see its errors.
# Do not edit it. `make-docs setup remove` takes it out only while it is unchanged.
(
  set +e +u
  md_top=$(git rev-parse --show-toplevel 2>/dev/null)
  [ -n "$md_top" ] || exit 0
  md_git=$(git rev-parse --absolute-git-dir 2>/dev/null)
  for md_mark in rebase-merge rebase-apply MERGE_HEAD CHERRY_PICK_HEAD BISECT_LOG; do
    if [ -e "$md_git/$md_mark" ]; then exit 0; fi
  done
  md_debug=${MAKE_DOCS_HOOK_DEBUG:-}
  md_node='<node>'
  md_file='<cli>'
  md_cmd=$(command -v make-docs 2>/dev/null)
  md_node_dir=${md_node%/*}
  if command -v cygpath >/dev/null 2>&1; then md_node_dir=$(cygpath -u "$md_node_dir" 2>/dev/null); fi
  if [ -n "$md_node_dir" ] && [ -d "$md_node_dir" ]; then PATH=$PATH:$md_node_dir; fi
  md_run() {
    if [ -f "$md_file" ] && [ -x "$md_node" ]; then "$md_node" "$md_file" "$@"
    elif [ -n "$md_cmd" ]; then "$md_cmd" "$@"
    else
      if [ -n "$md_debug" ]; then echo 'make-docs git hook: no make-docs command at the recorded path and none on PATH.' >&2; fi
      return 127
    fi
  }
  for md_folder in '.'; do
    md_root=$md_top
    [ "$md_folder" = . ] || md_root=$md_top/$md_folder
    [ -f "$md_root/.make-docs/config.yaml" ] || continue
    if [ -n "$md_debug" ]; then
      md_out=$(md_run project checkpoint --event commit --target-root "$md_root")
    else
      md_out=$(md_run project checkpoint --event commit --target-root "$md_root" 2>/dev/null)
    fi
    md_status=$?
    if [ "$md_status" = 0 ] && [ -n "$md_out" ]; then printf '%s\n' "$md_out"; fi
  done
  exit 0
) </dev/null || :
# <<< make-docs git hook: post-commit <<<

The exact block for post-merge:
# >>> make-docs git hook: post-merge >>>
# Make Docs wrote this block (version 1). It runs `make-docs project checkpoint --event commit` after a merge.
# It never fails or blocks git, and it prints nothing when nothing is due. Set MAKE_DOCS_HOOK_DEBUG=1 to see its errors.
# Do not edit it. `make-docs setup remove` takes it out only while it is unchanged.
(
  set +e +u
  md_top=$(git rev-parse --show-toplevel 2>/dev/null)
  [ -n "$md_top" ] || exit 0
  md_debug=${MAKE_DOCS_HOOK_DEBUG:-}
  md_node='<node>'
  md_file='<cli>'
  md_cmd=$(command -v make-docs 2>/dev/null)
  md_node_dir=${md_node%/*}
  if command -v cygpath >/dev/null 2>&1; then md_node_dir=$(cygpath -u "$md_node_dir" 2>/dev/null); fi
  if [ -n "$md_node_dir" ] && [ -d "$md_node_dir" ]; then PATH=$PATH:$md_node_dir; fi
  md_run() {
    if [ -f "$md_file" ] && [ -x "$md_node" ]; then "$md_node" "$md_file" "$@"
    elif [ -n "$md_cmd" ]; then "$md_cmd" "$@"
    else
      if [ -n "$md_debug" ]; then echo 'make-docs git hook: no make-docs command at the recorded path and none on PATH.' >&2; fi
      return 127
    fi
  }
  for md_folder in '.'; do
    md_root=$md_top
    [ "$md_folder" = . ] || md_root=$md_top/$md_folder
    [ -f "$md_root/.make-docs/config.yaml" ] || continue
    if [ -n "$md_debug" ]; then
      md_out=$(md_run project checkpoint --event commit --target-root "$md_root")
    else
      md_out=$(md_run project checkpoint --event commit --target-root "$md_root" 2>/dev/null)
    fi
    md_status=$?
    if [ "$md_status" = 0 ] && [ -n "$md_out" ]; then printf '%s\n' "$md_out"; fi
  done
  exit 0
) </dev/null || :
# <<< make-docs git hook: post-merge <<<

The exact block for post-rewrite:
# >>> make-docs git hook: post-rewrite >>>
# Make Docs wrote this block (version 1). It runs `make-docs project checkpoint --event commit` after a rewrite of commits.
# It never fails or blocks git, and it prints nothing when nothing is due. Set MAKE_DOCS_HOOK_DEBUG=1 to see its errors.
# Do not edit it. `make-docs setup remove` takes it out only while it is unchanged.
(
  set +e +u
  md_top=$(git rev-parse --show-toplevel 2>/dev/null)
  [ -n "$md_top" ] || exit 0
  md_debug=${MAKE_DOCS_HOOK_DEBUG:-}
  md_node='<node>'
  md_file='<cli>'
  md_cmd=$(command -v make-docs 2>/dev/null)
  md_node_dir=${md_node%/*}
  if command -v cygpath >/dev/null 2>&1; then md_node_dir=$(cygpath -u "$md_node_dir" 2>/dev/null); fi
  if [ -n "$md_node_dir" ] && [ -d "$md_node_dir" ]; then PATH=$PATH:$md_node_dir; fi
  md_run() {
    if [ -f "$md_file" ] && [ -x "$md_node" ]; then "$md_node" "$md_file" "$@"
    elif [ -n "$md_cmd" ]; then "$md_cmd" "$@"
    else
      if [ -n "$md_debug" ]; then echo 'make-docs git hook: no make-docs command at the recorded path and none on PATH.' >&2; fi
      return 127
    fi
  }
  for md_folder in '.'; do
    md_root=$md_top
    [ "$md_folder" = . ] || md_root=$md_top/$md_folder
    [ -f "$md_root/.make-docs/config.yaml" ] || continue
    if [ -n "$md_debug" ]; then
      md_out=$(md_run project checkpoint --event commit --target-root "$md_root")
    else
      md_out=$(md_run project checkpoint --event commit --target-root "$md_root" 2>/dev/null)
    fi
    md_status=$?
    if [ "$md_status" = 0 ] && [ -n "$md_out" ]; then printf '%s\n' "$md_out"; fi
  done
  exit 0
) </dev/null || :
# <<< make-docs git hook: post-rewrite <<<

The exact block for post-checkout:
# >>> make-docs git hook: post-checkout >>>
# Make Docs wrote this block (version 1). It runs `make-docs project checkpoint --event branch-change` after a branch change.
# It never fails or blocks git, and it prints nothing when nothing is due. Set MAKE_DOCS_HOOK_DEBUG=1 to see its errors.
# Do not edit it. `make-docs setup remove` takes it out only while it is unchanged.
(
  set +e +u
  [ "${3:-}" = 1 ] || exit 0
  md_top=$(git rev-parse --show-toplevel 2>/dev/null)
  [ -n "$md_top" ] || exit 0
  md_git=$(git rev-parse --absolute-git-dir 2>/dev/null)
  for md_mark in rebase-merge rebase-apply MERGE_HEAD CHERRY_PICK_HEAD BISECT_LOG; do
    if [ -e "$md_git/$md_mark" ]; then exit 0; fi
  done
  md_debug=${MAKE_DOCS_HOOK_DEBUG:-}
  md_node='<node>'
  md_file='<cli>'
  md_cmd=$(command -v make-docs 2>/dev/null)
  md_node_dir=${md_node%/*}
  if command -v cygpath >/dev/null 2>&1; then md_node_dir=$(cygpath -u "$md_node_dir" 2>/dev/null); fi
  if [ -n "$md_node_dir" ] && [ -d "$md_node_dir" ]; then PATH=$PATH:$md_node_dir; fi
  md_run() {
    if [ -f "$md_file" ] && [ -x "$md_node" ]; then "$md_node" "$md_file" "$@"
    elif [ -n "$md_cmd" ]; then "$md_cmd" "$@"
    else
      if [ -n "$md_debug" ]; then echo 'make-docs git hook: no make-docs command at the recorded path and none on PATH.' >&2; fi
      return 127
    fi
  }
  for md_folder in '.'; do
    md_root=$md_top
    [ "$md_folder" = . ] || md_root=$md_top/$md_folder
    [ -f "$md_root/.make-docs/config.yaml" ] || continue
    if [ -n "$md_debug" ]; then
      md_out=$(md_run project checkpoint --event branch-change --target-root "$md_root")
    else
      md_out=$(md_run project checkpoint --event branch-change --target-root "$md_root" 2>/dev/null)
    fi
    md_status=$?
    if [ "$md_status" = 0 ] && [ -n "$md_out" ]; then printf '%s\n' "$md_out"; fi
  done
  exit 0
) </dev/null || :
# <<< make-docs git hook: post-checkout <<<

`make-docs setup remove` takes these blocks out again, and only while they are unchanged.
{
  "status": "complete",
  "gitHooks": {
    "selection": "hook-input",
    "preferenceOn": true,
    "newProject": false,
    "status": "installed",
    "message": null,
    "hooks": [
      "post-commit: absent -> create-file",
      "post-merge: absent -> create-file",
      "post-rewrite: absent -> create-file",
      "post-checkout: absent -> create-file"
    ]
  }
}

=== 5. A commit with a changed work file, and a commit with nothing due ===
$ git commit -m "Add the work files"
Checkpoint: 2 files imported.
exit code: 0
$ git commit -m "A note" (nothing due)
exit code: 0
$ git commit -m "Change a task"
Checkpoint: 1 file imported.
exit code: 0
git status --porcelain: []

=== 6. A commit while another process holds the Store ===
exit code: 0, output: none, time: 1376 ms (the Store was held for 7,000 ms)
$ make-docs work status (first lines)
{
  "operation": "work.queue.status",
  "mode": "store",
  "storeState": "usable",
$ git commit -m "The next commit"
Checkpoint: 1 file imported.
exit code: 0

=== 7. A hook file that another tool owns: the refusal ===
{
  "status": "complete",
  "gitHooks": {
    "selection": "hook-input",
    "preferenceOn": true,
    "newProject": true,
    "status": "refused",
    "message": "Git hooks: none installed. The hook file <work>/owned/.git/hooks/post-commit is not a shell script: its first line does not name sh, bash, dash, ksh, or zsh. Make Docs changed no hook file.",
    "hooks": []
  }
}
the file of the other tool: #!/usr/bin/env node console.log("another tool"); 

=== 8. A second linked work tree ===
  "status": "registered",
{
  "status": "complete",
  "gitHooks": {
    "selection": "hook-input",
    "preferenceOn": true,
    "newProject": false,
    "status": "installed",
    "message": null,
    "hooks": [
      "post-commit: current -> none",
      "post-merge: current -> none",
      "post-rewrite: current -> none",
      "post-checkout: current -> none"
    ]
  }
}
$ git commit (in the linked work tree)
Checkpoint: 1 conflict waits for a person.
Run make-docs project checkpoint to see and settle what waits.
exit code: 0
$ git checkout -b side (in the main work tree: a branch change only reports)
exit code: 0

=== 9. setup remove in one work tree, and then in the last one ===
Git hooks: the Make Docs blocks stay in <work>/new/.git/hooks. Another bound checkout of this clone uses them:
- <work>/new
Make Docs removes the blocks when `make-docs setup remove` runs in the last of these checkouts.
Git hooks: the Make Docs blocks stay, because another bound checkout of this clone uses them:
- <work>/new
This checkout is no longer in their Store record.
post-checkout post-commit post-merge post-rewrite 
Git hooks: this is the last bound checkout of this clone that selected the hooks, so Make Docs removes its blocks from <work>/new/.git/hooks and removes their Store record.
- <work>/new/.git/hooks/post-commit: Make Docs created this file and it holds nothing else, so Make Docs removes the file.
- <work>/new/.git/hooks/post-merge: Make Docs created this file and it holds nothing else, so Make Docs removes the file.
- <work>/new/.git/hooks/post-rewrite: Make Docs created this file and it holds nothing else, so Make Docs removes the file.
- <work>/new/.git/hooks/post-checkout: Make Docs created this file and it holds nothing else, so Make Docs removes the file.
Git hooks: removed for this clone. The Store holds no git hook record for it now.
- <work>/new/.git/hooks/post-commit: the file was removed, because Make Docs created it and it held nothing else
- <work>/new/.git/hooks/post-merge: the file was removed, because Make Docs created it and it held nothing else
- <work>/new/.git/hooks/post-rewrite: the file was removed, because Make Docs created it and it held nothing else
- <work>/new/.git/hooks/post-checkout: the file was removed, because Make Docs created it and it held nothing else
hook files left: []
Store check lines that name a git hook record after removal: 1

=== 10. A changed block at removal ===
{
  "status": "complete",
  "gitHooks": {
    "selection": "none",
    "preferenceOn": true,
    "newProject": false,
    "status": "selected",
    "message": "Git hooks: this project has the Make Docs git hooks. This run changes none.\n- <work>/older/.git/hooks/post-commit: drifted: the block was changed after Make Docs wrote it\n- <work>/older/.git/hooks/post-merge: current\n- <work>/older/.git/hooks/post-rewrite: current\n- <work>/older/.git/hooks/post-checkout: current\nTo write the current block again, run `make-docs setup --git-hooks`.",
    "hooks": [
      "post-commit: drifted -> none",
      "post-merge: current -> none",
      "post-rewrite: current -> none",
      "post-checkout: current -> none"
    ]
  }
}
Git hooks: removed for this clone. The Store holds no git hook record for it now.
- <work>/older/.git/hooks/post-commit: kept: the block was changed after Make Docs wrote it. Take out its two marker lines and the lines between them by hand
- <work>/older/.git/hooks/post-merge: the file was removed, because Make Docs created it and it held nothing else
- <work>/older/.git/hooks/post-rewrite: the file was removed, because Make Docs created it and it held nothing else
- <work>/older/.git/hooks/post-checkout: the file was removed, because Make Docs created it and it held nothing else
hook files left: [post-commit ]
```

What the hand run shows, step by step:

1. The machine step. `--yes` alone leaves the preference with no value. The explicit input writes `true`, and the review names the one value that it writes.
2. A new project with the preference on. `make-docs setup --yes` installs the four hooks, and the result names the selection `machine-preference`.
3. An older project. With the preference off, and then with the preference on, `make-docs setup --yes` installs none and gives its one line.
4. The hook review, with each path, the limits, and each exact block. Then the explicit input installs the hooks in the older project.
5. A commit with new work files prints `Checkpoint: 2 files imported.`. A commit with nothing due prints nothing. `git status --porcelain` is empty after each one.
6. A commit while another process holds the Store for 7 seconds: exit code 0, no output, about 1.4 seconds in all. The next commit imports the file.
7. A hook file of another tool that is not a shell script: setup is `complete`, the hooks are `refused` with one line, and the file of the other tool is unchanged.
8. A second linked work tree: it binds, `setup --adopt --yes --git-hooks` finds the four blocks current and records the checkout, and a commit there runs the checkpoint. The commit reports a conflict in two lines, because the store held a newer text of that file from the main work tree.
9. `setup remove` in the linked work tree keeps the blocks and names the checkout that uses them. `setup remove` in the main work tree removes the four files and the record. The Store check still names 1 record after that: the record of the older project of step 3, which has the hooks.
10. A changed block. Repeat setup reports it as drifted and changes nothing. `setup remove` keeps that block, says how to remove it by hand, removes the other three files, and removes the record.

### P5 Fixes After The Independent Review

The independent review of this phase gave 4 findings that must be fixed (M1 to M4), 5 that should be fixed (S1 to S4 and S6, with S5 inside M2), and 4 notes. The builder made each case again in temporary repositories before the fix, and each one was true. This section holds what changed. Each rule that this round added is a proposal. None is an owner decision. [More Points For The Owner](#more-points-for-the-owner) lists each one with a new label, RF-1 and later, so no earlier label of this report changed.

| Finding | Result | What changed |
| --- | --- | --- |
| M1: a commit can wait 30 seconds | Applied | The wait limit of a hook run now bounds each wait for the Store, also the wait for a lock file that a live process holds, and a `branch-change` run takes the same limit. See [Each Place Where A Checkpoint Run Can Wait](#each-place-where-a-checkpoint-run-can-wait). |
| M2: the machine preference path overwrites a person's edit | Applied | Make Docs keeps a block that a person changed, and a block that no record of this clone covers, unless the person gave `--git-hooks`. With that input the plan names each such block, and the old block text goes into a backup file that the result names. |
| M3: a copy of a clone takes over the record of the original | Applied | A record is taken over only by `--git-hooks`, after the plan named the record and its folder. `setup remove` reads, writes, and deletes only the record of its own clone. |
| M4: a test runs the installed `make-docs` | Applied, in another way | The PATH of each git child process of a hook test is one tool folder inside the temporary folder of the test and the system folders. The folder of `node` itself is not on that PATH, because on the maintainer machine it holds an installed `make-docs`. See [The Test PATH](#the-test-path). |
| S1: nothing bounds the whole hook run | Applied as asked: measured, no new limit | [The Cost Of A Hook With Nothing Due, For The Owner](#the-cost-of-a-hook-with-nothing-due-for-the-owner), and register entry R-047. |
| S2: the amended commit with a held Store | Applied | Measured again: 2,633 ms (median of 3). The earlier words "about 2 seconds" are gone. |
| S3: wrong words for a block that is written again | Applied | The plan and the report of `setup remove` say that Make Docs writes the block again with no line for the project folder of this checkout. |
| S4: the Phase 4 test lost its upper time bound | Applied | Both P4 tests of a held Store have the bound 4,500 ms again. See [The Measured Times After The Fix](#the-measured-times-after-the-fix). |
| S5: a kept drifted block loses its record | Applied with M2 | The record still goes with the last removal. The kept block is then a block with no record, and the rule of M2 keeps it in each later run with no hook input. |
| S6: the hook prefers `make-docs` on PATH | Applied | The block runs the recorded command first, and uses PATH only when the recorded file or the recorded `node` program is gone. The hook review names the command. |
| Note: a hook file with a second language | Applied | It breaks, so setup refuses it with one reason. |
| Note: the modes of a Store that `setup system` makes | Applied | The Store folder is made with mode 0700 and `config.json` with mode 0600, as the rest of the Store code does. |
| Note: points that the owner must see | Applied | [More Points For The Owner](#more-points-for-the-owner). |
| Note: host name and process number in the record | Checked, no change | Each row of `tool_operations` holds them. See [The Data Of The Record](#the-data-of-the-record). |

#### Each Place Where A Checkpoint Run Can Wait

Before the fix, the limit of 1,000 ms was only the busy time of a Store connection, and only for the event `commit`. Each other wait kept its own bound. The reviewer's case is one of them: a live process holds `removal.lock`, and the run waits 30,000 ms for it.

The fix: the Store code reads the wait limit of the call path in each place below. A trigger run with the event `commit` or `branch-change` takes the limit (`CHECKPOINT_GIT_HOOK_EVENTS` in `checkpoint-ops.ts`). No other caller takes it, so each other command keeps each bound in the last column exactly.

| Place in the code | What the run waits for | Old bound in a hook run | New bound in a hook run | Every other caller |
| --- | --- | --- | --- | --- |
| `acquireStoreAccess` in `packages/cli/src/store/database.ts` | A live owner of `removal.lock`, `installation-bootstrap.lock`, or `installation-lease-recovery.lock`; a live owner of the legacy session file `store-access.lock`; a busy session folder on Windows | 30,000 ms | 1,000 ms | 30,000 ms, or the time that the caller gives |
| `waitForStoreAccessToDrain` in the same file | Other live Store sessions to end. A checkpoint reaches it only when the Store must be prepared | 30,000 ms | 1,000 ms | 30,000 ms, or the time that the caller gives |
| `acquireStorePreparationLease` in `packages/cli/src/store/installation-state.ts` | The preparation lock `installation-bootstrap.lock`. A checkpoint reaches it only when the Store must be prepared | 30,000 ms | 1,000 ms | 30,000 ms |
| `acquireInstallationLock` in the same file | A live checkout writer. In the measure below, a commit with nothing due did not wait here | 30,000 ms | 1,000 ms | 30,000 ms |
| `acquireRemovalLease` in `packages/cli/src/store/tool-operations.ts` | The removal lock. Only Store removal calls it, so a checkpoint does not reach it | 30,000 ms | 1,000 ms, if a limited call reached it | 30,000 ms |
| The busy time of each Store connection (five places in `database.ts`) | A write lock of the Store database that another process holds | 1,000 ms for `commit`, 5,000 ms for `branch-change` | 1,000 ms | 5,000 ms |
| `openSqliteWithRetry` in `database.ts` | A busy open of the Store database, with retries | 1,000 ms for `commit`, 5,000 ms for `branch-change` | 1,000 ms | 5,000 ms |
| `acquireGlobalAssetLock` in `packages/cli/src/store/global-asset-lock.ts` | Nothing. It fails at once, and a checkpoint does not reach it | No wait | No wait | No wait |
| The hook block | Nothing. The shell text holds no timer and no wait | No wait | No wait | Not used |

What the limit bounds, stated plainly: each wait for the Store by itself. A wait that reaches the limit ends the run with the typed Store result, and the hook then prints nothing and exits 0. In each measured case a hook run met one wait, so the added time is about one limit. The limit is not a bound on the whole run. It does not bound the work of the checkpoint, and it does not add the waits of one run together.

The proof that the limit does not leak: `w35-r0-p5-hook-wait-limit.test.ts` shows that outside the limit a caller that gives 2,000 ms waits 2,000 ms, that the default stays 30,000 ms, and that a direct run of the checkpoint, a trigger run with the event `turn-end`, and `make-docs work status` still wait for a held `removal.lock` at 4,500 ms, well after a hook run gave up, and then end well when the lock is free.

Statements that the old behavior made false, and that now hold: [PRD 52](../../prd/52-work-store-and-work-queue.md) R-WORK-CHECKPOINT-14, [PRD 38](../../prd/38-global-store-and-project-state.md) R-DB-3, `WORK-RULE-071` in the catalog and in the agent form, the limit sentence of the hook review, `packages/cli/src/store/README.md`, and the rows R8 and R11 of this report.

#### The Measured Times After The Fix

Each time is from a hand run on the maintainer machine, with the built block, a temporary Store at a fixed path, and a project with 2 work files. Each value is the median of 3 runs. They are not a result of [`PERF-007`](04-git-hook-proofs.md#perf-007-the-checkpoint-that-a-git-hook-runs).

| Case | A commit | A branch change | An amended commit |
| --- | --- | --- | --- |
| Free Store | 193 ms | 171 ms | 363 ms |
| A live process holds `removal.lock` | 1,166 ms (before the fix: 30,177 ms) | 1,163 ms (before the fix: 30,203 ms) | not measured |
| A live process holds `installation-bootstrap.lock` | 1,164 ms | 1,150 ms | not measured |
| A live process holds `installation-lease-recovery.lock` | 1,164 ms | 1,156 ms | not measured |
| A live process holds the legacy session file `store-access.lock` | 1,160 ms | 1,154 ms | not measured |
| Another process holds the write lock of the Store database | 1,325 ms | 171 ms. It only reads, so it does not wait | 2,633 ms. Two hooks run, and each one waits the limit |

Each run exits 0 and prints nothing. The numbers before the fix are the builder's own run of the reviewer's case.

The test bounds. A git action with the installed hooks may take at most 4,500 ms while a lock file is held (`HELD_LOCK_RUN_BOUND_MS` in `w35-r0-p5-hook-wait-limit.test.ts`), and so may one trigger run and one commit with the proof hook in the two P4 tests (`HELD_STORE_RUN_BOUND_MS` in `w35-r0-p4-hook-checkpoint.test.ts`, finding S4). How the bound was chosen: the limit of 1,000 ms, about 300 ms of normal run cost on this machine, and a margin of about 3,200 ms for a slow shared test machine. The bound is less than the busy time of 5,000 ms and far less than 30,000 ms, so a run with the old behavior fails each of these tests.

#### The Cost Of A Hook With Nothing Due, For The Owner

This is an open point for the owner. It records no decision. The owner decided on 2026-11-23 "fast path: not now", with a look again at about 900 work files, and chose the exact check on 2026-11-27. This round adds no limit and no fast path. Register entry R-047 holds the point.

The plain statement: the time that a hook adds to a git action grows with the count and the size of the work files, also when nothing is due, and the wait limit does not bound it.

A side measure, with the built block, in a temporary project with a temporary Store, on the maintainer machine. Each value is the median of 7 runs. "Added" is the time of the git action with the hook, less the time of the same action with the hooks turned off for that one command. No work file changed in a measured run, so nothing was due.

Work files of a real size: about 12,000 bytes and 7 tasks each, which is near the mean of the work files of this repository (403 files, 4.8 million bytes).

| Work files | Added to a commit | Added to a branch change | The first sync in a commit, one run |
| --- | --- | --- | --- |
| 100 | 226 ms | 200 ms | 460 ms |
| 470 | 419 ms | 326 ms | 1,242 ms |
| 1,000 | 773 ms | 517 ms | 2,370 ms |
| 2,000 | 1,862 ms | 1,137 ms | 4,733 ms |

Small work files: about 300 bytes and 3 tasks each.

| Work files | Added to a commit | Added to a branch change | The first sync in a commit, one run |
| --- | --- | --- | --- |
| 100 | 205 ms | 182 ms | 372 ms |
| 470 | 302 ms | 249 ms | 746 ms |
| 1,000 | 501 ms | 366 ms | 1,356 ms |
| 2,000 | 1,006 ms | 640 ms | 2,696 ms |

The limits of this measure. It is a side measure and not a result of `PERF-007`. It is one machine, one run of the script for each table, with made-up work files that all look the same, in 20 files for each backlog folder. The reviewer measured more on another setup: 1.85 seconds for each commit at 1,000 work files. So the numbers show the growth, and not a time that another computer will have. An amended commit runs two hooks, so it adds about two times the commit value.

#### The Rules For A Changed Block, A Block With No Record, And A Record Of Another Folder

The rules that this round built, each as a proposal:

1. A block that a person changed (state `drifted`) and a block that no record of this clone covers (a block with no Store record) are never replaced or recorded without the hook input `--git-hooks`. The machine preference and an explicit "yes" in an interactive setup are not enough.
2. Without the hook input, setup keeps such a block. That run changes no hook file and no hook record, asks no hook question, and prints one line with the next step. One kept block keeps all four hook files as they are. This is the existing rule "one refused hook file refuses all four", used again, so that a project never has some hooks that name a new project folder and one that does not.
3. With the hook input, the plan names each such block before the write: the review text has a list, and each hook of the JSON plan has `backup: true`. Setup then writes the old block text to a backup file, and after that it replaces the block. The result names the file.
4. The backup place is the backup folder of setup, in the project that ran setup: `.make-docs/backup/<date>/git-hooks/<hook name>.block`, with the same folder name rule as each other backup (`resolveBackupDestinationPlan`, the date and then a number). Only the folder and its name rule are used. The file holds the old block text and nothing else. The backup and restore commands do not read it.
5. A block with the same bytes and no record is recorded, with no byte change and no backup, and only by the hook input.
6. A record belongs to the clone at the folder of its key. A record of another folder is taken over only by the hook input, when exactly one such record holds the same blocks and its git folder is not there. The plan names the record and the folder first. The write moves the record.
7. `setup remove` never takes a record over. It reads, writes, and deletes only the record under the key of its own clone.

The cases, and the rule for each:

| Case | A plain setup | `make-docs setup --git-hooks` | `make-docs setup remove` |
| --- | --- | --- | --- |
| A moved clone: the same repository at a new path, and the old path is gone | Reports that no record of this clone covers the blocks, names the record of the old folder, and changes nothing. No false drift | The plan names the record and the old folder. The run moves the record to the new key. The blocks do not change | Before the take-over: leaves each block, removes no record, and says to run `make-docs setup --git-hooks` first. After it: removes the blocks and the record |
| A copied clone: two folders, both there | Reports that no record of this clone covers the blocks. Names no other record, because the git folder of the original exists | Records the blocks of the copy under its own key. The record of the original is not read as a candidate and not changed | Each clone removes only its own blocks and its own record |
| A copied clone while the original is away, such as on a drive that is not connected | The same report as for a moved clone. Nothing is taken over | It looks the same as a moved clone, so the take-over can move the record of the original. The plan says so, and says to do it only when the clone moved. When the original comes back, its blocks have no record, a plain setup there says so, and the hook input there records them again | In the copy: leaves the blocks, and does not delete the record of the original. In the original, when it is back and the record was not taken: removes its blocks |
| A clone restored from a backup at the same path | The key is the path, so the record is its record. Blocks with the same bytes are current. A block from an older backup that differs is drifted, and it is kept | Replaces a drifted block, with a backup file | Removes each block that matches the record, and keeps a block that differs |
| A clone restored from a backup at another path | As a moved clone when the old path is gone, and as a copied clone when it exists | The same | The same |
| A linked work tree whose folder moved | The git folder is the same, so the record is the same. The checkout of the work tree is not bound at its new folder, so the Store sees it as gone | In the moved work tree, after it is bound again: adds its checkout to the record | In the last bound checkout: the plan names the gone checkout by its recorded folder. When git lists a work tree of the clone that holds a Make Docs project and is no bound checkout of the record, the blocks and the record stay, the plan names that work tree, and the gone checkout stays in the record. When git lists no such work tree, the blocks and the record go |

The check for the moved work tree: the reviewer noted that such a work tree counts as "gone", and that `setup remove` in the main checkout then removed blocks that the moved work tree uses. The test `setup remove in the main checkout keeps the blocks for a linked work tree whose folder moved` shows that no block goes now, and that the plan names the work tree first.

The limit sentence of the earlier report, "the copy holds blocks with no Store record", was true only for a copy beside its original. With the original away, the copy took the record over, with no input. That sentence is corrected in [P5 Known Limits](#p5-known-limits).

#### The Command That A Hook Runs

The safest order, as a proposal: the recorded command first, and then PATH. The recorded command is the `node` program and the Make Docs command file of the setup run that wrote the block. That version knows the events `commit` and `branch-change` and the wait limit. An older `make-docs` that is first on PATH can lack the limit, and then a commit could wait the full Store times, or it can fail on the event.

What happens after the person updates or removes Make Docs:

- An update at the same path, as a global install does: the recorded path now holds the new version, and the hook runs it.
- An update to another path, such as another `node` version of a version manager: the old command file still exists, so the hook keeps running the old version until `make-docs setup --git-hooks` records the new one. Repeat setup names the block as "current, and a newer block is ready". The old version knows the limit, because it wrote the block.
- The recorded file or the recorded `node` program is gone: the hook runs `make-docs` from PATH. With none there, it does nothing and says nothing.
- Make Docs is removed and no command is left: the hook does nothing and says nothing.

The hook review now has one line that names the command: "Each hook runs the Make Docs command at the recorded path: `<node>` `<cli>`. That is the version that writes the block. Only when that file or that `node` program is gone does a hook run `make-docs` from PATH." The other form, PATH first with a block that detects an old version, was not built: the block cannot ask a command for its version without a second start of `node` at each git action.

#### A Hook File With A Second Language

A hook file can start with `#!/bin/sh` and then start another program on the same file, such as `exec node "$0" "$@"`. That program reads the whole file in its own language. The test shows that such a file runs before, and that the same file with a block after its first line ends with an error and does not run the other program. So setup refuses it, as it refuses a file that is not a shell script: one reason, and no change to any hook file. The rule: a line that is not a comment and holds both the word `exec` and `$0` as one whole word, also as `"$0"` and `${0}`. A line that only builds another path from `$0`, such as `exec "$(dirname "$0")/run"`, starts another file. It is plain shell, and setup takes it. The rule is a text mark. It cannot see each form of such a file, and the hook review names the refusal.

#### The Modes Of The Store Folder

`setup system` with no Store wrote `config.json` through `writeStoreJsonFile`, which made the Store folder with the default mode (0755) and the file with the default mode (0644). The rest of the Store code makes the Store folder with mode 0700 (`acquireStoreAccess`, `prepareStore`) and its files with mode 0600 (`applyStoreFileMode`, the lock files). `writeStoreJsonFile` now uses 0700 for a folder that it makes and 0600 for the file. It writes two files: `config.json` and the global manifest. It does not change the mode of a Store folder that exists. A test reads both modes after the machine step made the Store.

#### The Data Of The Record

The record holds three full paths of this computer in its JSON: the shared git folder, the `node` program, and the Make Docs command file. The block needs the last two, and the key and the check for a moved clone need the first. The row also holds the process number and the host name of the write, in the columns `pid` and `hostname`. The table defines both columns as `NOT NULL`, and each row of `tool_operations` holds them: the tool operation journal and the machine harness receipts fill them in the same way. The R-MIN register of PRD 38 names "process" and "host" as fields of `tool_operations`, with the privacy rule "host data stays local". So nothing was dropped. PRD 38 R-HOOK-STATE-2 now says that the row holds them.

#### The Test PATH

The failing test, made again before the fix: `w35-r0-p5-git-hook-block.test.ts`, `expected 'Build parser 2.' to be 'Build the parser.'`. The git child process of that step had the full PATH of the test run, a hook found the `make-docs` that is installed on the maintainer machine, and that command imported a file into the temporary Store of the test.

The fix is in `packages/cli/tests/git-hook-proof.ts`, so it holds for each P4 and P5 hook test:

- The environment of each git child process drops the PATH of the caller. Its PATH is one tool folder inside the temporary folder of the test, and the system folders (`/usr/bin` and `/bin`, or the two system folders of Windows).
- On a computer with file modes the tool folder holds two small scripts, `git` and `node`, that start the real programs by their full paths. So the folders of the real programs are not on PATH. This differs from the words of the finding, "the folder of the `node` that runs the tests": on the maintainer machine that folder also holds an installed `make-docs`. On Windows the folder of `git` stands on PATH, because a program there is found only by its real file.
- Each git run checks its PATH first and throws when the PATH reaches a `make-docs` command outside the temporary folder of the test.
- The recorded `node` of the fixture is the script in a helper folder that holds only `node`, because the block adds the folder of the recorded `node` to the end of PATH.

The guard test is `packages/cli/tests/w35-r0-p5-test-path-guard.test.ts`, with 4 tests. Each one puts a fake `make-docs` first on the PATH of the test process, and the fake writes a mark file when it runs. The same leak in Phase 4: `w35-r0-p4-hook-checkpoint.test.ts` used the full PATH for each "terminal" case and the real folder of `node` in one test. Both now use the helper.

The proof: the P1 to P5 test files ran with a fake `make-docs` first on the outer PATH. Each test passed, and the fake command did not run. See [The Checks Of This Round](#the-checks-of-this-round).

#### The Hand Run Of The Four Review Cases

Each case ran by hand with the final build, a temporary Store at a fixed path, a temporary home folder, and temporary git repositories. `<work>` stands for the temporary folder of the run.

The 30 second wait. A lock file in the temporary Store names a live `sleep` process. Each value is one of the 3 runs of the table above.

```text
commit with held removal.lock:                         -> exit 0, 1168 ms
branch change with held removal.lock:                  -> exit 0, 1244 ms
commit with held installation-bootstrap.lock:          -> exit 0, 1166 ms
branch change with held installation-bootstrap.lock:   -> exit 0, 1150 ms
commit with held installation-lease-recovery.lock:     -> exit 0, 1162 ms
branch change with held installation-lease-recovery.lock: -> exit 0, 1144 ms
```

The lost edit, and the copied clone. The output is the hook part of each setup JSON result, in a short form, and the plain lines of `setup remove`.

```text
=== M2. The lost edit ===
status: installed | selection: hook-input | takeoverFrom: null
  post-commit: absent / create-file
  post-merge: absent / create-file
  post-rewrite: absent / create-file
  post-checkout: absent / create-file
the person edits the block of post-commit. Lines with --json: 1
$ make-docs setup --yes   (new project in sub/, preference on)
status: none | selection: none | takeoverFrom: null
message: Git hooks: The Make Docs block in <work>/m/.git/hooks/post-commit was changed after Make Docs wrote it. Make Docs keeps it and changes no hook in this run. To replace it and keep a backup of the old block text, run `make-docs setup --git-hooks`.
  post-commit: drifted / keep
  post-merge: outdated / keep
  post-rewrite: outdated / keep
  post-checkout: outdated / keep
lines with --json in post-commit after it: 1
$ make-docs setup --yes --git-hooks
status: installed | selection: hook-input | takeoverFrom: null
  post-commit: drifted / replace-block / backup planned / backup: <work>/m/sub/.make-docs/backup/2026-11-27/git-hooks/post-commit.block
  post-merge: outdated / replace-block
  post-rewrite: outdated / replace-block
  post-checkout: outdated / replace-block
lines with --json in post-commit after it: 0; lines with --json in the backup file: 1

=== M3. The copied clone ===
status: installed | selection: hook-input | takeoverFrom: null
  record git-hooks:6457d90ee14c... git folder <work>/m/.git, checkouts 2
  record git-hooks:19671729650a... git folder <work>/g/.git, checkouts 1
g2 is bound as a separate checkout; g is away
$ make-docs setup --adopt --yes   (in g2)
status: none | selection: none | takeoverFrom: null
message: Git hooks: This folder has Make Docs hook blocks that no record of this clone covers (post-commit, post-merge, post-rewrite, post-checkout, in <work>/g2/.git/hooks). Make Docs keeps them and changes no hook in this run. The Store holds a record of the same blocks for the git folder <work>/g/.git, which is not there now. When this clone moved from that folder, run `make-docs setup --git-hooks` here to move that record to this clone.
$ make-docs setup remove --yes   (in g2)
Git hooks: these hook files hold a Make Docs block, and no record of this clone covers it. So `setup remove` leaves each block and removes no record.
- <work>/g2/.git/hooks/post-commit
- <work>/g2/.git/hooks/post-merge
- <work>/g2/.git/hooks/post-rewrite
- <work>/g2/.git/hooks/post-checkout
The Store holds a record of the same blocks for the git folder <work>/g/.git, which is not there now. `setup remove` does not take that record over and does not delete it. When this clone moved from that folder, stop here and run `make-docs setup --git-hooks` first: it moves that record to this clone, and then `make-docs setup remove` takes the blocks out.
To remove a block by hand, take out its two marker lines and the lines between them.
  record git-hooks:6457d90ee14c... git folder <work>/m/.git, checkouts 2
  record git-hooks:19671729650a... git folder <work>/g/.git, checkouts 1
blocks in g2 after it: 4
g comes back. $ make-docs setup --yes   (in g)
status: selected | selection: none | takeoverFrom: null
message: Git hooks: this project has the Make Docs git hooks, and each block is current.
$ make-docs setup remove --yes   (in g)
Git hooks: removed for this clone. The Store holds no git hook record for it now.
hook files in g after it: 0
  record git-hooks:6457d90ee14c... git folder <work>/m/.git, checkouts 2
```

What the hand run shows. The lost edit: the plain setup of the new project in `sub/` keeps the edit and changes no hook, and the hook input replaces the block and names the backup file, which holds the edit. The copied clone: the plain setup in the copy says the true state, `setup remove` in the copy removes no record and no block, and the original has its record and its four blocks when it comes back.

The installed command on PATH: see [The Test PATH](#the-test-path) and [The Checks Of This Round](#the-checks-of-this-round).

#### More Points For The Owner

Nothing in this list is an owner decision. Each label is new, so no label of [The List For The Owner](#the-list-for-the-owner) or of [P5 New Behavior That The Documents Did Not State](#p5-new-behavior-that-the-documents-did-not-state) changed.

| Label | The point | What is built now |
| --- | --- | --- |
| RF-1 | What the wait limit bounds | Each wait for the Store by itself, for the events `commit` and `branch-change`. It does not bound the whole run, and it does not add the waits of one run together. R8 and R11 state it. |
| RF-2 | Who may replace a changed block or record a block with no record | Only the hook input `--git-hooks`. The machine preference and an interactive "yes" keep such a block. This is stricter than point 2 of the earlier list, which also took an interactive "yes". |
| RF-3 | The other hooks of a run that keeps one block | One kept block keeps all four hook files, and the run asks no hook question. The other form is to handle the three other hooks. Then a project could have hooks that name a new project folder beside one that does not. |
| RF-4 | The backup of a replaced block | A file below `.make-docs/backup/` of the project that ran setup. With `--yes --git-hooks` the same run names the block in its plan and then replaces it, with no pause. A dry run shows the plan with no write. |
| RF-5 | The take-over of a record of another folder | Only by the hook input, and the run moves the record. With the original away, a copy looks the same as a moved clone, so the hook input in the copy can move the record of the original. The plan warns of this. Another form is to never move a record: the hook input records the blocks under a new key, and the old record stays for the Store check. That form loses the facts of which hook files Make Docs created. |
| RF-6 | `setup remove` in a moved clone | It leaves each block and removes no record, until the person ran `make-docs setup --git-hooks` there. Before this round it took the record over and removed the blocks. |
| RF-7 | The "folder gone" rule for a work tree | A checkout whose recorded folder is gone does not keep the blocks, except when git lists a work tree of the clone that can be that checkout at a new folder. Then the blocks and the record stay. When the person later deletes that work tree with no `setup remove`, the blocks stay until the person takes them out by hand. |
| RF-8 | A changed block that `setup remove` keeps | It has no Store record after the last removal. A later setup keeps it, and only the hook input replaces it, with a backup. |
| RF-9 | The command that a hook runs | The recorded command first, and then PATH. Before this round: PATH first. |
| RF-10 | A hook file that starts another program on itself | Refused, by a text mark. |
| RF-11 | The modes of a Store that the machine step makes | 0700 for the folder and 0600 for `config.json` and the global manifest. |
| RF-12 | The cost of a hook with nothing due | Not bounded, and it grows with the work files. Open, with no decision. Register entry R-047. |
| RF-13 | An interactive setup with `--git-hooks` asks no hook question | It shows the hook review, and the input is the selection. The person can stop only at the project approval. |
| RF-14 | `make-docs setup reconfigure --yes --git-hooks` | The hook input alone passes the rule that `reconfigure --yes` needs one selection flag. |
| RF-15 | The short hook output changes what each caller of `--event commit` gets | The short form and the wait limit belong to the events `commit` and `branch-change`, and not to the git hook. A later agent tool hook that gives one of these events gets the same two lines and the same limit. |
| RF-16 | A setup with no terminal and no `--yes` | It installs no hook, also with the hook input, and says so in one line. |
| RF-17 | An interactive `--dry-run` with the preference off and no hook input | The plan says "none installed", and a real run would ask the hook question. |
| RF-18 | The linked work tree that never selected the hooks | Not changed in this round. The block names project folders and not checkouts, so the hooks also run in a bound work tree of the clone that has the same project folder and did not select them. A plain setup there says that the preference is off or that the project is older, and does not say that the hooks of the clone run there. |

#### The Twin Review Of This Round

The checkpoint is deterministic logic with an agent form. This round changed one rule of both: `WORK-RULE-071`. The catalog text and the Checkpoint section of `make-docs://system/reference/work-store.md` now say that the limit holds for `commit` and `branch-change`, that it holds while another process holds the Store or one of its lock files, and that it bounds the waits and not the work of the run. The template file and the installed copy are byte-identical. The rules of setup for a changed block and for a record are rules of setup, and an agent does not install, change, or remove a hook by hand (`WORK-RULE-072`), so the agent form needs no new rule for them.

#### The Checks Of This Round

Every test, measurement, and CLI run of this round used a temporary Store at a fixed path under `/private/tmp/claude` or inside the temporary folder of the test, and each run checked first that `MAKE_DOCS_HOME` was not empty. No run read or wrote the real Store. No run installed, changed, or removed a git hook in this repository or in any real repository, and no run started `make-docs setup`, `setup system`, or `setup remove` against this repository or with the real home folder. After the last run, the hooks folder of this repository holds only the `.sample` files. All checks ran on the maintainer machine, on macOS, with Node `v26.13.1` and git 2.47.1.

- `npm run prepack -w packages/cli`: the build passes.
- `npx tsc --noEmit -p packages/cli`: no errors.
- The P1 to P5 test files (14 files), with a fake `make-docs` first on the outer PATH: 303 tests pass and 1 is skipped. The fake command writes a mark file when it runs, and no mark file exists after the run. The one skipped test is the P4 test of a real global install, which needs the package registry and skips when the install does not work.
- `npm test -w packages/cli -- --testTimeout=120000`, with `TMPDIR=/private/tmp/claude/x`, after the last change of product code: 4,040 tests pass, 2 fail, and 7 are skipped, in 172 test files, in 632 seconds. The 2 are the known failures of `tests/mcp-app-contract.test.ts` on Node 26. `backup.test.ts` and `uninstall.test.ts` pass. After that run, only documents changed.
- `npm run validate:defaults`: 53 tests pass.
- `npm run test:smoke-harness`: 19 tests pass.
- `make-docs check prd --target-root .`, with the built CLI: exit code 0, status `passed`.
- `make-docs check performance-evidence --target-root .`: exit code 1, with 127 diagnostics, the same count as before this phase. No diagnostic is new.
- `make-docs project paths validate --target-root .`: valid, 0 failing findings, 1,139 files checked.
- `make-docs project markdown validate --path <file>` on each document that this round changed: no findings on this report, the P5 phase file, PRD 07, PRD 52, the work store reference of the template and its installed copy, and the Store README. On PRD 38 it reports 8 findings and on the risk register 9, each on a line that this phase did not change.
- `make-docs backlog snapshot --target-root . --json`: exit code 0, and no diagnostic names W35.
- `cmp` shows that `.make-docs/system/references/work-store.md` matches its template file byte for byte.
- After the last document change, in one run: the consistency test, the shipped-text test, the name catalog test, the package safety test, the P1 to P5 test files, the W29 agent twin test, the work store contract test, the Store table catalog test, the template links test, and the Human Experience propagation test. 572 tests pass and 1 is skipped, in 23 files. After that run, only this one line of this report changed.
- The four review cases by hand: [The Hand Run Of The Four Review Cases](#the-hand-run-of-the-four-review-cases).
- Not run: any run on Linux or Windows, `npm run smoke:pack:local`, `npm pack` for the digest, a run in a real terminal, and `make-docs project checkpoint` in this repository, which would write the real Store.

### The Background Mode (T39 To T45, A62w To A62ae)

This section holds the change that followed the owner's decisions of 2026-11-28 on the run mode of the git hooks. It was built after the fixes of the independent review, on the same uncommitted phase. Where an earlier part of this P5 report says that a hook runs the checkpoint in the foreground, that a hook prints a line when something is due, or that a hook run waits 1,000 ms, this section replaces it. [What This Change Replaced In The Earlier Parts](#what-this-change-replaced-in-the-earlier-parts) names each place.

#### The Owner Decisions Of 2026-11-28 On The Run Mode

These are the owner's decisions, built as decided. This section records no other decision as made.

The reason for the change, as a fact that the owner saw: an independent review measured that the cost of a foreground hook grows with the count of work files (about 1.85 seconds for each commit at 1,000 work files in the review's project), and that the wait limit does not bound the work of the run.

| Decision | What the owner decided | What was built | Proof |
| --- | --- | --- | --- |
| OD-P5-1 | Git hooks run in the background: the hook starts the checkpoint and returns, and git does not wait. This replaces the foreground mode that the owner chose at owner gate OG-4 on 2026-11-28 (option A). The record of that earlier answer stays in the [P4 evidence](#owner-gate-og-4-the-run-mode-of-a-git-hook). | The block sets one variable and runs the checkpoint command. The command starts the checkpoint as a process of its own session and ends at once. | A62w, A62x, A62y |
| OD-P5-2 | A foreground fallback applies where a background process cannot survive: on a platform or in an agent tool where the started process does not keep running after the hook ends, the hook runs the checkpoint in the foreground. The owner did not exclude a foreground fallback for git hooks and sees no reason why it cannot be done. The review that setup shows says which mode applies. | When the last background run of a checkout did not end and its process is gone, the next hook runs the checkpoint in the foreground. The hook review states the mode and the fallback. The rule itself is a proposal (RF-21). | A62aa, A62ac |
| OD-P5-3 | In the background, the checkpoint has no short limit on the wait for the Store: it uses the normal wait, the Store busy timeout, 5,000 ms today, and then syncs. The fix for the 30 second waits stays: no background run waits that long. | A background run waits at most 5,000 ms at each wait for the Store. | A62r, A62s |
| OD-P5-4 | In the foreground fallback, the limit of 1,000 ms on each wait for the Store applies, as the owner chose with OG-4 (improvement 1). | A foreground run with the event `commit` or `branch-change` waits at most 1,000 ms at each wait. | A62r, A62ab |
| OD-P5-5 | A person who wants a foreground hook, or a hook whose output an agent can see, uses the hook of an agent tool (Phase 6). So a git hook in the background mode prints nothing, in every case. | The command prints nothing when it starts the background run, and the background run has no output. | A62w, A62h |

Not decided by the owner, and built as proposals: how a hook knows that it must fall back; what the fallback prints, other than "gives up quietly" for a held Store; how the mode shows in the setup review, in the setup JSON result, and in the Store record; and whether the mode is fixed at install time or found at each run. [The Background Mode For The Owner](#the-background-mode-for-the-owner) lists each one.

#### What Was Built For The Background Mode

Product code:

- `packages/cli/src/store/git-hook-runs.ts` (new): the start code. It decides the run mode, starts the background run, holds the fallback rule and the bound on waiting runs, and reads and removes the run files.
- `packages/cli/src/index.ts`: the entry of the CLI now calls the start code first and loads the rest of the CLI after it. So a hook start loads about 24,000 bytes of code and not the whole CLI. Each other command runs as before.
- `packages/cli/src/git-hooks.ts`: the block text, version 2; the hook review; the run mode in the plan and in the Store record; and the removal of the run files with `setup remove`.
- `packages/cli/src/setup-git-hooks.ts`: the fields `runMode`, `runFallback`, and `runStateDir` of the setup JSON result.
- `packages/cli/src/operations/project/checkpoint-ops.ts` and `packages/cli/src/operations/work/work-queue/checkpoint.ts`: the bound of each wait for the Store by run mode.
- `packages/cli/src/operations/work/work-store/catalog.ts`: the words of `WORK-RULE-071` and `WORK-RULE-072`.
- `packages/cli/src/store/lifecycle.ts`: Store removal takes out the folder of the run files.

Shipped text: the work store reference of the template and its byte-identical installed copy, in the three rules of the Checkpoint section and in the paragraph under "When to Run It".

Tests:

- `packages/cli/tests/w35-r0-p5-hook-background.test.ts` (new, 17 tests at first, and 20 since the fixes after the second review): the background start, also with a pipe and with captured output; the process group of the run and the hang-up signal; the run after its parent ended; ten commits in a loop; the bound on waiting runs; the fallback after a stopped run; the stale rule; the fallback with a held Store and with the debug switch; the start code; the mode in setup and in the record; the run files and their removal. It is in both fixed lists of the platform workflow.
- `packages/cli/tests/w35-r0-p5-hook-wait-limit.test.ts` (rewritten in its second half, 20 tests at first, and 21 since the fixes after the second review): the bound of a background run, of a foreground fallback run, and of each other caller, for a held Store and for each held lock file.
- `packages/cli/tests/git-hook-setup.ts` and `packages/cli/tests/git-hook-proof.ts`: each git action of a hook test now waits, with a bound of 45 seconds, until no background run of the temporary Store is left, and a test that must see git return first uses a second function with no wait. The wait reads the run files. The cleanup of each fixture waits in the same way before it removes the temporary folder.
- `w35-r0-p5-git-hook-block.test.ts`, `w35-r0-p5-hook-end-to-end.test.ts`, `w35-r0-p5-hook-ownership.test.ts`, and `w35-r0-p5-test-path-guard.test.ts`: each check of a line that a hook printed now reads the output of the background run from its run file, and checks that git printed nothing.

Evidence files: [perf-007-r2-harness.mjs](evidence/p5/performance/perf-007-r2-harness.mjs), [perf-007-r2-results.json](evidence/p5/performance/perf-007-r2-results.json), [hook-cost-by-work-files.mjs](evidence/p5/performance/hook-cost-by-work-files.mjs), [hook-cost-by-work-files-results.json](evidence/p5/performance/hook-cost-by-work-files-results.json), and [p5-background-proof.sh](evidence/p5/access/p5-background-proof.sh).

#### The Start: The Shell Or The Command

Two forms can start a process that outlives the hook. The table compares them. The builder chose the second one. The choice is a proposal (RF-19).

| Point | The shell starts it (`&`, with `nohup`, `setsid`, or `disown`) | The command starts it (chosen) |
| --- | --- | --- |
| What exists on each platform | `&` is in each POSIX `sh`. `nohup` is on Linux and macOS. `setsid` as a program is on Linux and not on macOS. `disown` is in bash and zsh and not in a plain POSIX `sh` such as dash. What the shell that git ships on Windows provides was not checked in this build. | Node gives one call for each platform: a child process with the option `detached`, no input, output, or error output (`stdio: "ignore"`), and `unref()`. On Linux and macOS the child is the leader of a new session. On Windows it is a process with its own process group and no window. |
| The process group | A background job of the hook shell stays in the process group of git, because a shell that runs a script has no job control. A signal to that group reaches it. | The child has a session and a process group of its own. A signal to the group of git does not reach it. |
| The hang-up signal | `nohup` makes the signal ignored for the program that it starts. Node sets each signal back to its default at its start, so the checkpoint would not keep that. This statement about Node is from the builder's knowledge of Node, and no test of this phase checks it. | The child has no terminal, so the hang-up signal of a closed terminal is not sent to it. |
| The output pipe | The shell text must send each output to nowhere. One missed output keeps the pipe of git open, and a tool that reads it waits. | The child gets no output at all. |
| The cost in the foreground | The shell and its git lookups only. The start-and-return proof hook of `PERF-007-R1` added 27 ms to a commit. | One more start of `node`, which loads only the start code. `PERF-007-R2` gives 59 ms added to a commit. |
| Where the fallback rule lives | In shell text, in each hook file, on each platform. | In the command, in one place, with tests. |
| What is shipped | Nothing new. | Nothing new: the same command file. The entry of the CLI changed. |

Why the command starts it: one form for the three platforms, a process that is outside the process group and the terminal of git, and a fallback rule that is code with tests and not shell text. The price is about 30 ms more for each hook start than the shell form of `PERF-007-R1`, as a comparison across two sessions.

The cost of the start alone, on the maintainer machine, 5 runs each, with `time`: `node -e 0` takes 20 ms, and `make-docs --version` with the whole CLI takes 80 ms. `PERF-007-R2` measured `make-docs --version` at 91 ms (the floor) and the whole hook, with the shell, two git lookups, the start code, and the start of the child, at 59 ms added to a commit. So the hook start costs less than one start of the whole CLI.

What a block does on each platform: the same thing. It sets `MAKE_DOCS_GIT_HOOK_RUN=start` and runs the checkpoint command at the recorded path. The command does the rest. The block has no background job, no `nohup`, no `setsid`, and no `disown`.

#### The New Block Text

The four blocks, version 2, as `renderGitHookBlock` in `packages/cli/src/git-hooks.ts` gives them for a project at the top folder of the work tree. `<node>` stands for the full path of the `node` program and `<cli>` for the full path of the Make Docs command file. Three lines differ from version 1 in each block: the two comment lines about the run mode, and the line with `export`. The blocks differ from each other as before: the event, the check of the third argument in `post-checkout`, and the state marks only in `post-commit` and `post-checkout`.

`post-commit`:

```sh
# >>> make-docs git hook: post-commit >>>
# Make Docs wrote this block (version 2). It runs `make-docs project checkpoint --event commit` after a commit.
# It starts the checkpoint in the background and prints nothing, so git does not wait. It never fails or blocks git.
# Only when the last background run did not end does it run the checkpoint in the foreground. MAKE_DOCS_HOOK_DEBUG=1 shows the errors of such a run.
# Do not edit it. `make-docs setup remove` takes it out only while it is unchanged.
(
  set +e +u
  md_top=$(git rev-parse --show-toplevel 2>/dev/null)
  [ -n "$md_top" ] || exit 0
  md_git=$(git rev-parse --absolute-git-dir 2>/dev/null)
  for md_mark in rebase-merge rebase-apply MERGE_HEAD CHERRY_PICK_HEAD BISECT_LOG; do
    if [ -e "$md_git/$md_mark" ]; then exit 0; fi
  done
  md_debug=${MAKE_DOCS_HOOK_DEBUG:-}
  md_node='<node>'
  md_file='<cli>'
  md_cmd=$(command -v make-docs 2>/dev/null)
  md_node_dir=${md_node%/*}
  if command -v cygpath >/dev/null 2>&1; then md_node_dir=$(cygpath -u "$md_node_dir" 2>/dev/null); fi
  if [ -n "$md_node_dir" ] && [ -d "$md_node_dir" ]; then PATH=$PATH:$md_node_dir; fi
  md_run() {
    if [ -f "$md_file" ] && [ -x "$md_node" ]; then "$md_node" "$md_file" "$@"
    elif [ -n "$md_cmd" ]; then "$md_cmd" "$@"
    else
      if [ -n "$md_debug" ]; then echo 'make-docs git hook: no make-docs command at the recorded path and none on PATH.' >&2; fi
      return 127
    fi
  }
  export MAKE_DOCS_GIT_HOOK_RUN=start
  for md_folder in '.'; do
    md_root=$md_top
    [ "$md_folder" = . ] || md_root=$md_top/$md_folder
    [ -f "$md_root/.make-docs/config.yaml" ] || continue
    if [ -n "$md_debug" ]; then
      md_out=$(md_run project checkpoint --event commit --target-root "$md_root")
    else
      md_out=$(md_run project checkpoint --event commit --target-root "$md_root" 2>/dev/null)
    fi
    md_status=$?
    if [ "$md_status" = 0 ] && [ -n "$md_out" ]; then printf '%s\n' "$md_out"; fi
  done
  exit 0
) </dev/null || :
# <<< make-docs git hook: post-commit <<<
```

`post-merge`:

```sh
# >>> make-docs git hook: post-merge >>>
# Make Docs wrote this block (version 2). It runs `make-docs project checkpoint --event commit` after a merge.
# It starts the checkpoint in the background and prints nothing, so git does not wait. It never fails or blocks git.
# Only when the last background run did not end does it run the checkpoint in the foreground. MAKE_DOCS_HOOK_DEBUG=1 shows the errors of such a run.
# Do not edit it. `make-docs setup remove` takes it out only while it is unchanged.
(
  set +e +u
  md_top=$(git rev-parse --show-toplevel 2>/dev/null)
  [ -n "$md_top" ] || exit 0
  md_debug=${MAKE_DOCS_HOOK_DEBUG:-}
  md_node='<node>'
  md_file='<cli>'
  md_cmd=$(command -v make-docs 2>/dev/null)
  md_node_dir=${md_node%/*}
  if command -v cygpath >/dev/null 2>&1; then md_node_dir=$(cygpath -u "$md_node_dir" 2>/dev/null); fi
  if [ -n "$md_node_dir" ] && [ -d "$md_node_dir" ]; then PATH=$PATH:$md_node_dir; fi
  md_run() {
    if [ -f "$md_file" ] && [ -x "$md_node" ]; then "$md_node" "$md_file" "$@"
    elif [ -n "$md_cmd" ]; then "$md_cmd" "$@"
    else
      if [ -n "$md_debug" ]; then echo 'make-docs git hook: no make-docs command at the recorded path and none on PATH.' >&2; fi
      return 127
    fi
  }
  export MAKE_DOCS_GIT_HOOK_RUN=start
  for md_folder in '.'; do
    md_root=$md_top
    [ "$md_folder" = . ] || md_root=$md_top/$md_folder
    [ -f "$md_root/.make-docs/config.yaml" ] || continue
    if [ -n "$md_debug" ]; then
      md_out=$(md_run project checkpoint --event commit --target-root "$md_root")
    else
      md_out=$(md_run project checkpoint --event commit --target-root "$md_root" 2>/dev/null)
    fi
    md_status=$?
    if [ "$md_status" = 0 ] && [ -n "$md_out" ]; then printf '%s\n' "$md_out"; fi
  done
  exit 0
) </dev/null || :
# <<< make-docs git hook: post-merge <<<
```

`post-rewrite`:

```sh
# >>> make-docs git hook: post-rewrite >>>
# Make Docs wrote this block (version 2). It runs `make-docs project checkpoint --event commit` after a rewrite of commits.
# It starts the checkpoint in the background and prints nothing, so git does not wait. It never fails or blocks git.
# Only when the last background run did not end does it run the checkpoint in the foreground. MAKE_DOCS_HOOK_DEBUG=1 shows the errors of such a run.
# Do not edit it. `make-docs setup remove` takes it out only while it is unchanged.
(
  set +e +u
  md_top=$(git rev-parse --show-toplevel 2>/dev/null)
  [ -n "$md_top" ] || exit 0
  md_debug=${MAKE_DOCS_HOOK_DEBUG:-}
  md_node='<node>'
  md_file='<cli>'
  md_cmd=$(command -v make-docs 2>/dev/null)
  md_node_dir=${md_node%/*}
  if command -v cygpath >/dev/null 2>&1; then md_node_dir=$(cygpath -u "$md_node_dir" 2>/dev/null); fi
  if [ -n "$md_node_dir" ] && [ -d "$md_node_dir" ]; then PATH=$PATH:$md_node_dir; fi
  md_run() {
    if [ -f "$md_file" ] && [ -x "$md_node" ]; then "$md_node" "$md_file" "$@"
    elif [ -n "$md_cmd" ]; then "$md_cmd" "$@"
    else
      if [ -n "$md_debug" ]; then echo 'make-docs git hook: no make-docs command at the recorded path and none on PATH.' >&2; fi
      return 127
    fi
  }
  export MAKE_DOCS_GIT_HOOK_RUN=start
  for md_folder in '.'; do
    md_root=$md_top
    [ "$md_folder" = . ] || md_root=$md_top/$md_folder
    [ -f "$md_root/.make-docs/config.yaml" ] || continue
    if [ -n "$md_debug" ]; then
      md_out=$(md_run project checkpoint --event commit --target-root "$md_root")
    else
      md_out=$(md_run project checkpoint --event commit --target-root "$md_root" 2>/dev/null)
    fi
    md_status=$?
    if [ "$md_status" = 0 ] && [ -n "$md_out" ]; then printf '%s\n' "$md_out"; fi
  done
  exit 0
) </dev/null || :
# <<< make-docs git hook: post-rewrite <<<
```

`post-checkout`:

```sh
# >>> make-docs git hook: post-checkout >>>
# Make Docs wrote this block (version 2). It runs `make-docs project checkpoint --event branch-change` after a branch change.
# It starts the checkpoint in the background and prints nothing, so git does not wait. It never fails or blocks git.
# Only when the last background run did not end does it run the checkpoint in the foreground. MAKE_DOCS_HOOK_DEBUG=1 shows the errors of such a run.
# Do not edit it. `make-docs setup remove` takes it out only while it is unchanged.
(
  set +e +u
  [ "${3:-}" = 1 ] || exit 0
  md_top=$(git rev-parse --show-toplevel 2>/dev/null)
  [ -n "$md_top" ] || exit 0
  md_git=$(git rev-parse --absolute-git-dir 2>/dev/null)
  for md_mark in rebase-merge rebase-apply MERGE_HEAD CHERRY_PICK_HEAD BISECT_LOG; do
    if [ -e "$md_git/$md_mark" ]; then exit 0; fi
  done
  md_debug=${MAKE_DOCS_HOOK_DEBUG:-}
  md_node='<node>'
  md_file='<cli>'
  md_cmd=$(command -v make-docs 2>/dev/null)
  md_node_dir=${md_node%/*}
  if command -v cygpath >/dev/null 2>&1; then md_node_dir=$(cygpath -u "$md_node_dir" 2>/dev/null); fi
  if [ -n "$md_node_dir" ] && [ -d "$md_node_dir" ]; then PATH=$PATH:$md_node_dir; fi
  md_run() {
    if [ -f "$md_file" ] && [ -x "$md_node" ]; then "$md_node" "$md_file" "$@"
    elif [ -n "$md_cmd" ]; then "$md_cmd" "$@"
    else
      if [ -n "$md_debug" ]; then echo 'make-docs git hook: no make-docs command at the recorded path and none on PATH.' >&2; fi
      return 127
    fi
  }
  export MAKE_DOCS_GIT_HOOK_RUN=start
  for md_folder in '.'; do
    md_root=$md_top
    [ "$md_folder" = . ] || md_root=$md_top/$md_folder
    [ -f "$md_root/.make-docs/config.yaml" ] || continue
    if [ -n "$md_debug" ]; then
      md_out=$(md_run project checkpoint --event branch-change --target-root "$md_root")
    else
      md_out=$(md_run project checkpoint --event branch-change --target-root "$md_root" 2>/dev/null)
    fi
    md_status=$?
    if [ "$md_status" = 0 ] && [ -n "$md_out" ]; then printf '%s\n' "$md_out"; fi
  done
  exit 0
) </dev/null || :
# <<< make-docs git hook: post-checkout <<<
```

The block still prints what the command prints. In the background mode the command prints nothing. In the foreground fallback it prints the short form. A block of version 1 that a project already has keeps its foreground run, with the limit of 1,000 ms, until `make-docs setup --git-hooks` writes version 2. Repeat setup names such a block as "current, and a newer block is ready".

#### What The Command Does At A Hook Start

1. The command sees the variable of the block and a checkpoint call with the event `commit` or `branch-change` and no `--json`. Each other command, a checkpoint call with another event, a call with `--json`, and a checkpoint call with no such variable run as before.
2. With no usable Store, in a folder that is no Make Docs project, or when the folder of the run files cannot be made, such as in a shell that may not write the Store folder: it runs the checkpoint in the foreground, as before this change. That run does nothing or reports with read access only.
3. It reads `started.json` of this checkout. When the file is absent, or names a process that lives and is younger than 60 seconds: the background mode. It writes `started.json`, starts the same command again as a background process, and ends with exit code 0 and no output.
4. When `started.json` names a process that is gone, or is older than 60 seconds: the foreground fallback. It writes `foreground.json`, runs the checkpoint itself with the short form and the limit of 1,000 ms, and then starts a background run too.
5. The background run: when another background run of this checkout waits, this run ends at once, because the waiting run reads the work files later. Else it waits for the run that works now, for at most 5,000 ms, and then runs the checkpoint, with the bound of 5,000 ms at each wait for the Store. At its end, also after an error, it writes `last.json` and removes `started.json`.

#### The Fallback Rule, And What It Can And Cannot Detect

The rule, as a proposal (RF-21): a hook runs the checkpoint in the foreground when the last background run of its checkout left its start mark and the process of that run is gone. A run that ends, also with an error or with a Store that stayed held, removes its start mark. So only a run that something stopped leaves it. The mode is found at each hook run. It is not fixed at install time, and setup has no mode input.

Why the fallback also starts a background run: that run is the test of the shell. When it ends, the next hook uses the background again. When it is stopped too, the next hook stays in the foreground. So a shell that stops each background run gets the foreground at each hook run after the first one, and a checkout that lost one run to a restart of the computer gets one foreground run and then the background again.

| Case | What the rule does | Detected |
| --- | --- | --- |
| The background run was stopped before its end: a shell or a tool that stops each process that a command started, a `kill`, or a restart of the computer | The next hook of this checkout runs in the foreground | Yes, at the next hook run |
| The first hook run in such a shell | The background run is stopped, and nothing is synced. `make-docs work status` and the reminder line count the file as waiting | No. A hook cannot know before its run that its child will be stopped |
| The background run still works when the next hook comes, as with two commits in quick succession | The next hook uses the background | Yes: the process of the start mark lives |
| The background run ended with an error, or gave up after the wait for a held Store | The next hook uses the background. The file of the last run holds the error output | Not a fallback case: the process survived |
| The shell may not write the Store folder, so no run file can be written | The hook runs the checkpoint in the foreground, which does nothing there, as before this change (register entry R-046) | Yes, at this hook run |
| A shell that lets the background run live, but stops it later than the run takes | No fallback is needed: the run ended | Not a case |
| One checkout that is used from a terminal and from a shell that stops background runs, in turn | After a change from the terminal to that shell, the first hook run there syncs nothing. After a change back, the first hook run in the terminal is a foreground run | In part: the rule keeps one fact for each checkout, and not one for each shell |
| The process number of a stopped run was given to another process that lives | The hook takes the run as alive, for at most 60 seconds from the start mark. Then the mark is stale, and the next hook runs in the foreground | Late, by at most 60 seconds |
| A platform where a process with its own session cannot be started at all | The start fails, the hook runs in the foreground at once, and the start mark stays, so each next hook is a foreground run | Yes |

By platform. On macOS each row above that a test can make is proven: the stopped run, the fallback and the return to the background, the stay in the foreground, the stale rule, and the folder that cannot be written. On Linux and on Windows the same tests are in both fixed lists of the platform workflow, and they have no result yet. For Windows two points are open until that run: that a process started with the `detached` option outlives the shell that git starts for a hook, and that the check for a live process (`process.kill` with signal 0) answers as on the other platforms. The test of the process group and of the hang-up signal is skipped on Windows, which has neither. No rule by platform is built: no platform is known where the background cannot work, so none is named.

What the rule never does: it never makes a hook fail, block, or print in the background mode; it writes no file of the project; and it needs no Store schema change. In a linked work tree it works as in the main one, because the folder of the run files is named by a digest of the project folder, and each work tree has another folder. The end-to-end test with two work trees passes with the installed hooks.

#### Owner Gate OG-3 For The Run Files

OG-3 did not open. The facts of the hook runs are files in the Store folder, below `git-hook-runs/`, and not rows. The build added no table, no column, no schema version, and no migration, and the Store record of the hook blocks gained two values inside its JSON (`runMode` and `runFallback`) in the same row as before. What is new is one folder in the Store folder, with at most five small files for each checkout. PRD 38 R-HOOK-STATE-8 and the Store README name it, `setup remove` takes out the files of its checkout, and Store removal takes out the folder when it holds only these files. This is a finding of this build, and not an owner decision. If the owner reads a new folder in the Store folder as a change that needs the gate, the gate opens, and RF-23 names the other places that the files could have.

#### The Folder Of The Run Files In The Store

The folder is `git-hook-runs/<digest>/` in the Store folder. The digest is the SHA-256 of the real path of the project folder, with forward slashes. So each checkout has its own folder, also each linked work tree, and two projects in one repository have two. The start code makes the folder with the mode 0700 at the first hook start of a checkout, and only when the Store database exists and the project folder holds `.make-docs/config.yaml`. Each file has the mode 0600. The code is `packages/cli/src/store/git-hook-runs.ts`.

| File | Who writes it, and when | What it holds | Who removes it |
| --- | --- | --- | --- |
| `started.json` | The hook process, right before it starts a background run, and again with the process number right after | A token of the run, the process number of the background run, the start time, and the event | The background run, at its end, when the file still holds its token. A run that was stopped leaves it, and that is the sign for the fallback |
| `pending.json` | A background run that must wait, at its start | Its token, its process number, and the time | That run, when it stops waiting and starts its work |
| `working.json` | A background run, when it starts its work | Its token, its process number, and the time | That run, at its end, when the file still holds its process number |
| `last.json` | Each background run, at its end, also after an error. The next run replaces it | `schemaVersion`, `mode` (`background`), `outcome` (`ran`, or `covered` for a run that ended at once because another run waited), `event`, `root` (the full path of the project folder), `pid`, `startedAt`, `endedAt`, `exitCode`, and at most 4,000 characters each of `output` and `errorOutput` | Nobody, until `setup remove` or Store removal |
| `foreground.json` | The hook process, when it falls back to the foreground. The next fallback replaces it | `schemaVersion`, `at`, `event`, `root`, `reason`, and `previous` with the process number and the start time of the background run that did not end | Nobody, until `setup remove` or Store removal |

A write of `started.json`, `working.json`, `last.json`, or `foreground.json` goes to a file with the ending `.<process number>.tmp` and is then renamed, so a reader sees a whole file. A run that is stopped in that moment can leave such a `.tmp` file. `setup remove` and Store removal take out a file of that name form with the run files.

Who removes the folder:

- `make-docs setup remove`: when it handles the git hooks of a checkout that is in the hook record (the cases "shared", "held", and "last"), it removes the five file names of that checkout and then the folder when it is empty, and then `git-hook-runs/` when that is empty. A bound work tree of a clone with hooks gets a run folder also when it is not in the hook record, because each work tree uses the hook files. Since the fixes after the second review, `setup remove` takes out the run folder of its checkout in each case, also with no hook record.
- Store removal (`removeGlobalStore`, which `make-docs uninstall` calls): it removes each folder with a digest name, by the five file names only, and then `git-hook-runs/`. When another file or folder is there, it keeps `git-hook-runs/` and reports it with the entries that the Store does not own.
- `make-docs setup store check` does not read `git-hook-runs/`. It names no run folder and counts none. It works on the rows of the Store database, and the run files are no rows.
- `make-docs setup store clean` does not read or remove `git-hook-runs/`. Its backup is a copy of the database only, so it holds no run file.
- Nothing removes the run folder of a project folder that a person deleted with no `setup remove`. It stays until Store removal. It blocks nothing, and it holds at most five small files.

These are gaps of the build, and RF-23 lists them for the owner: Store care does not name the run folders, and the run folder of a deleted project folder stays until Store removal.

#### The Waits For The Store, By Kind Of Run

This table replaces the columns "New bound in a hook run" of [Each Place Where A Checkpoint Run Can Wait](#each-place-where-a-checkpoint-run-can-wait). The places in the code are the same. No other caller changed.

| What the run waits for | A background run of a git hook | A run in the foreground fallback | Every other caller |
| --- | --- | --- | --- |
| A live owner of `removal.lock`, `installation-bootstrap.lock`, or `installation-lease-recovery.lock`, a live owner of the legacy session file, or a busy session folder on Windows (`acquireStoreAccess`) | 5,000 ms | 1,000 ms | 30,000 ms, or the time that the caller gives |
| Other live Store sessions to end (`waitForStoreAccessToDrain`) | 5,000 ms | 1,000 ms | 30,000 ms, or the time that the caller gives |
| The preparation lock (`acquireStorePreparationLease`) | 5,000 ms | 1,000 ms | 30,000 ms |
| A live checkout writer (`acquireInstallationLock`) | 5,000 ms | 1,000 ms | 30,000 ms |
| The removal lock (`acquireRemovalLease`), which a checkpoint does not reach | 5,000 ms, if such a run reached it | 1,000 ms, if such a run reached it | 30,000 ms |
| The busy time of each Store connection | 5,000 ms, the normal time | 1,000 ms | 5,000 ms |
| A busy open of the Store database, with retries (`openSqliteWithRetry`) | 5,000 ms, the normal time | 1,000 ms | 5,000 ms |
| Another background run of the same checkout that works now. This wait is new, and it is not a wait for the Store | 5,000 ms. Then the run goes on | No such wait | No such wait |
| The start code in the hook process | No wait: it reads at most two small files and starts one process | No wait before the run | Not used |
| The hook block | No wait: the shell text holds no timer | No wait | Not used |

"A run in the foreground fallback" is each foreground run with the event `commit` or `branch-change`: the fallback of a hook, a block of version 1, and a person or a hook of an agent tool that gives one of these events. A direct run, a trigger run with another event, and each other command are "every other caller".

What each bound is, stated plainly: the bound of one wait. It is not a bound on the whole run. It does not bound the work of the checkpoint, and it does not add the waits of one run together. A background run that meets one held wait ends about 5 seconds after its start, and the git action is not delayed by it.

Measured in the tests on the maintainer machine, from the log lines of one test run: with a live process that holds `removal.lock`, a commit with the hooks took 86 ms, and its background run ended with exit code 1 after 5,079 ms. A foreground run of the same checkpoint took 1,105 ms. The two other lock files gave 84 ms and 82 ms for the commit, 5,080 ms and 5,077 ms for the background run, and 1,149 ms and 1,142 ms for the foreground run. With another process that holds the write lock of the Store database, a commit took 84 ms, next to 88 ms with a free Store, and its background run ended after 5,531 ms. When that process freed the Store after 2 seconds, the background run ended after 2,033 ms with `Checkpoint: 1 file imported.`. A commit in the foreground fallback with a held Store took 1,454 ms.

#### Overlapping Runs And The Bound On Waiting Runs

Two commits in quick succession start two background runs. The fix for register entry R-041 makes that safe for the data: the scan of the work files runs inside the Store write session. The test `ten commits in a loop, and then one direct checkpoint` starts ten commits with real hooks and no wait between them. After the runs the store holds the text of the tenth commit, and a direct run of the checkpoint finds nothing due: no file imported, no file that waits, and no conflict. The hand run gave the same result: ten commits took 938 ms in all, and the store held "Loop 10." after the runs.

The bound, as a proposal (RF-24): at most one background run of a checkout waits. A run that finds a waiting run ends at once. The waiting run waits at most 5 seconds for the working run. Then it works too. So the rule bounds the runs that wait, and not the runs that work: two runs of one checkout can work at the same time when one takes longer than 5 seconds. The first report said "at most one works and one waits", which was false, and the second independent review found it: [The Fixes After The Second Independent Review](#the-fixes-after-the-second-independent-review). This is safe because the waiting run has not read the work files yet: it reads them after it stops waiting, which is after the commit of the run that ended. The waiting run waits for the working run for at most 5,000 ms and then goes on. A mark of a waiting or working run that is older than 60 seconds, or whose process is gone, is taken as left behind.

The test `at most one background run of a checkout waits, and a run that finds a waiting run ends at once` holds the Store, makes six commits, and reads the process number of each started run. While the Store is held, two of the six processes live, the first as the working run and the second as the waiting run, and the other four ended. After the Store is free, the store holds the text of the sixth commit, and a direct run finds nothing due.

What the bound does not cover: two projects in one repository have two checkouts, so each one can have one working and one waiting run. A run that waits for the Store for 5 seconds and gives up is replaced by the waiting run, so a Store that stays held for a long time gives one run that gives up about each 5 seconds while commits go on.

#### What A Hook Prints Now

This table replaces [Each Line That A Hook Can Print](#each-line-that-a-hook-can-print) for the background mode. The lines of that table are now the lines of the foreground fallback, which is a proposal (RF-22), and the short form that the file of the last run keeps.

| Case | The background mode | The foreground fallback |
| --- | --- | --- |
| Nothing is due | No line | No line |
| Files were imported, and nothing waits | No line | `Checkpoint: <N> file imported.` or `Checkpoint: <N> files imported.` |
| Something waits | No line | The summary line, and then `Run make-docs project checkpoint to see and settle what waits.` |
| After a branch change, when files wait | No line | `Checkpoint: <N> file waits.` and then the line with the command |
| The caller has read access only, and files wait | No line | The one line with the count and the command |
| A held Store after the wait | No line | No line. The owner chose "gives up quietly" |
| No command, no Store, no Make Docs project, a checkout that is not bound, a shell that may not use the Store, each other error | No line | No line |
| With `MAKE_DOCS_HOOK_DEBUG` set, on standard error | No line from the run. With no command at all, the block still says: `make-docs git hook: no make-docs command at the recorded path and none on PATH.` That line comes from the block before any run starts | The error output of the checkpoint |

Where a person finds the result of a background run: `make-docs work status`, and the reminder line of the next Make Docs command when files wait. The hook review says so. For a person who looks for a fault, `last.json` in the folder of the run files holds the outcome, the exit code, and at most 4,000 characters each of the output and of the error output of the last background run, and the hook review names that folder.

#### The Mode In The Setup Review, In The Setup Result, And In The Record

Each of these is a proposal (RF-27).

The hook review starts with these lines, from `renderGitHookReview`, with `<hooks folder>` for the hooks folder of the clone:

```text
Make Docs can add one marked block to each of four git hook files of this clone, in <hooks folder>.
Run mode: background. Each block starts the checkpoint in the background after the git action and returns, so git does not wait. A block never fails or blocks git, and it prints nothing. To see the result, run `make-docs work status`, or read the reminder line of the next Make Docs command.
Fallback: foreground. Only when the last background checkpoint of this checkout did not end does a hook run the checkpoint in the foreground, and then git waits for it.
Each work tree of this clone uses these hook files. Make Docs sets no machine-wide git hooks path.
```

Its limits list has these new or changed points, with `<run folder>` for the folder of the run files of the checkout:

```text
- A hook prints nothing, also when something is due, because the checkpoint ends after git returned. To see the result, run `make-docs work status`. The next Make Docs command also shows the reminder line when files wait.
- While another Make Docs process holds the Store or one of its locks, the background checkpoint waits at most 5 seconds at each wait for the Store. Then it syncs, or it gives up and the next checkpoint imports the file. Git does not wait in either case. The checkpoint reads each file below `docs/work/`, so it takes longer in a project with more work files, and that time is not added to the git action.
- At most one background checkpoint of a checkout waits. A hook run that finds a waiting one ends at once, because the waiting one reads the files later. The waiting one waits at most 5 seconds for the working one. Then it works too, so two can work at the same time when one takes longer than 5 seconds.
- The foreground fallback: when the last background checkpoint of this checkout did not end and is not running, such as in a shell that stops each process that a command started, the next hook runs the checkpoint in the foreground. Git then waits for it. That run waits at most 1 second at each wait for the Store, and it prints the summary line and the command when something is due. It then starts a background checkpoint again. When that one ends, the next hook uses the background again. A hook cannot know before its run that a shell will stop the background checkpoint, so the first hook run in such a shell syncs nothing.
- Make Docs keeps the facts of the hook runs of this checkout in the Store folder, in <run folder>: `last.json` holds the result of the last background checkpoint with its output, and `foreground.json` names the last foreground fallback. No file of the project changes.
- To see the error output of a foreground run of a hook, set MAKE_DOCS_HOOK_DEBUG=1 for one git command. A background checkpoint prints nothing with that variable too, and `last.json` holds its error output.
```

The setup JSON result holds three new fields in `gitHooks`: `runMode` with the value `background`, `runFallback` with the value `foreground`, and `runStateDir` with the folder of the run files. The Store record of the clone holds `runMode` and `runFallback` in its JSON, and its block version is 2. A record of block version 1 has no such value, and its blocks run in the foreground.

#### The Method Of PERF-007-R2 As Recorded Before The Runs

These points stood in the [requalification record](05-git-hooks-in-setup.md#requalification-of-perf-007-with-the-built-block) of the phase file before the counted runs. They moved here after the runs, with the same words, because the work store holds a work file only up to 65,536 characters, and the phase file was over that size. The phase file keeps the profile, the reason, the authorization, the budget event with its limits, and the stop rule.

- Method: the harness of `PERF-007-R1` with stated differences, kept as [perf-007-r2-harness.mjs](evidence/p5/performance/perf-007-r2-harness.mjs). The actions, the states, the measurement boundary, the statistic, the count of runs and rounds, and the outcome rules are those of the profile. The differences:
  - The hooks are the four blocks that `make-docs setup --yes --git-hooks` installs in the clone, and not proof hooks. The profile lists "the hook block that P5 builds" and "a hook that finds the command through a recorded path" among its exclusions, so the hook columns of this result are not comparable with those of `PERF-007-R1` as a result. The column with no hook is comparable.
  - The modes are: no hook; the installed hooks in the background mode, which is their normal mode; and the installed hooks in the foreground fallback. The harness makes the fallback happen before each timed action: it leaves the start mark of a background run whose process is gone. A fallback run also starts one background run, as the built code does, and the harness waits for it.
  - The candidate is the built CLI of this checkout, started through a small command file. It is not packed and installed, because the sandbox of the builder cannot reach the package registry. The result names the digest of the package file that `npm pack` makes from the same build.
  - The harness cannot count the checkpoints that the hooks of one action start, because the block writes no log line. It checks in place of that: each background run ended with exit code 0, the foreground fallback ran only in its mode, the store units changed only when they must, the work tree is clean, and what git printed.
  - The second number of each sample is the time between the end of git and the end of the last background run, read from the run files in the temporary Store.
- Result: `PERF-007-R2`, recorded beside `PERF-007-R1` in the [result record](04-git-hook-proofs.md#result-record) of the profile.
- Side measure, outside the profile: the time that the installed hooks add to a commit by the count of work files (about 100, 470, 1,000, and 2,000), in the background mode and in the foreground fallback, with made-up work files in a temporary project. One more [harness](evidence/p5/performance/hook-cost-by-work-files.mjs) runs it. It is one session on one machine, it is informational, it is not a result of `PERF-007`, and it uses no counted run of the budget.

#### The New Measurements

`PERF-007` ran again with the built block, as [`PERF-007-R2`](04-git-hook-proofs.md#result-record-of-the-requalification), outcome `pass`. The [requalification record](05-git-hooks-in-setup.md#requalification-of-perf-007-with-the-built-block) was written before the counted runs, with budget event `W35-R0-P5-PERF-007-2`. The phase file of P4 holds the full result record. All numbers of the first table are from `PERF-007-R2`: one git action, in milliseconds, the median of 15 samples, on clones of this repository with 4,417 store units, on the maintainer machine (Apple M2 Pro, 10 cores, 16 GiB, macOS, Node `v26.13.1`, git 2.47.1), on macOS only.

| Action | No hook | Background: the hooks add | Then the checkpoint ends after | Foreground fallback: the hooks add |
| --- | --- | --- | --- | --- |
| `git commit`, no change | 24 | 59 | 461 | 492 |
| `git commit`, one changed work file | 25 | 59 | 543 | 580 |
| `git merge` (a true merge), no change | 47 | 51 | 458 | 487 |
| `git merge` (a true merge), one changed work file | 48 | 50 | 545 | 572 |
| `git commit --amend` (two hooks), no change | 24 | 111 | 857 | 546 |
| `git commit --amend` (two hooks), one changed work file | 25 | 113 | 955 | 632 |
| `git checkout <branch>`, no change | 16 | 59 | 345 | 378 |
| `git checkout <branch>`, one changed work file | 16 | 59 | 348 | 378 |
| A commit whose hook run is the first sync of the checkout (3 samples) | not measured | the commit takes 161 in all | 1,706 | the commit takes 1,825 in all |

In each sample git exited 0, the work tree was clean after the action, the store changed only when it must, each background run ended with exit code 0, and git printed nothing in the background mode. The limits of the result: three runs in one session on one machine; the candidate is the built CLI of the checkout and not a packed install, because the sandbox of the builder cannot reach the package registry; the hook columns are not comparable with `PERF-007-R1` as a result; the fallback is made by the harness; and the harness could not count the checkpoints that one action starts.

The side measure by the count of work files, outside the profile. One [harness](evidence/p5/performance/hook-cost-by-work-files.mjs) made one temporary project for each count, with made-up work files of a real size (about 12,000 bytes and 7 tasks each, 20 files for each backlog folder), installed the hooks through setup, and timed a commit with nothing due. Each value is the median of 7 samples, in milliseconds. "Adds" is the time of the commit with the hooks, less the time of the same commit with the hooks turned off for that one command. The [results](evidence/p5/performance/hook-cost-by-work-files-results.json) hold each sample.

| Work files | Background: added to a commit | Then the checkpoint ends after | Foreground fallback: added to a commit | The first sync in a commit, one run: the commit, and then the checkpoint ends after |
| --- | --- | --- | --- | --- |
| 100 | 59 | 218 | 247 | 141, and 395 |
| 470 | 57 | 463 | 489 | 142, and 1,346 |
| 1,000 | 56 | 884 | 923 | 145, and 2,511 |
| 2,000 | 56 | 2,129 | 2,175 | 144, and 5,296 |

What the side measure shows: in the background mode the time that the hooks add to a commit does not grow with the count of work files. It is 56 ms to 59 ms from 100 to 2,000 work files. The work of the checkpoint still grows, and it now runs after git returned. In the foreground fallback the added time grows as the foreground hook did: about 0.25 seconds at 100 work files and about 2.2 seconds at 2,000. The limits of this measure: it is a side measure and not a result of `PERF-007`; one machine, one session, made-up work files that all look the same; a commit only. The earlier table of [The Cost Of A Hook With Nothing Due, For The Owner](#the-cost-of-a-hook-with-nothing-due-for-the-owner) is of the foreground block of the first build. Its numbers for a commit are near the fallback column here.

#### The Proof Inside Each Agent Tool, For The Orchestrator

The builder ran no agent tool session. The orchestrator ran the proof under standing rule 11 on 2026-11-28 and filled the table below.

The script [p5-background-proof.sh](evidence/p5/access/p5-background-proof.sh) has three actions, each for a plain shell. It was tried one time from the shell of the builder: `prepare`, then `hold` for 3 seconds with one commit, then `read`. The reading showed the hook name, no start mark, a last run that ended 2.8 seconds after its start with `Checkpoint: 1 file imported.`, and the new task text in the store. That trial is not a proof inside an agent tool.

What `prepare` makes: a temporary project with two work files, a temporary Store and a temporary home folder inside the work folder, the first sync, and the four real hook blocks, which the real `make-docs setup --yes --git-hooks` installs. The shell of an agent tool does not have the variable of the temporary Store. So the script adds two lines before the Make Docs block of each hook file that set `MAKE_DOCS_HOME` to the temporary Store, and one line at the end of each hook file that records that git ran the hook. It changes no byte of a block. Without those two lines a hook in the tool would use the real Store, which the rule of this Wave forbids.

Steps for each agent tool:

1. In a plain shell: `sh docs/work/2026-11-27-w35-r0-agent-checkpoints-and-triggers/evidence/p5/access/p5-background-proof.sh prepare <new work folder> <full path of the make-docs command> [setup method inputs]`. Use a new work folder for each tool. With no method inputs, setup connects no agent tool. A method input of the tool can change the configuration of that tool on the machine, so the orchestrator decides it.
2. Open the folder `<work folder>/project` in the agent tool.
3. Commit 1, with the Store held, so that the background checkpoint must outlive the command of the tool. In a plain shell: `sh <script> hold <work folder> 60`. It prints `held`. At once, ask the agent to change "Build the parser." to "Build parser 1." in `docs/work/2042-06-01-w1-r0-aurora/01-first.md` and to run `git add -A && git commit -m "Commit 1"` as one command of its own. Wait until the hold printed `free`. Then, in a plain shell: `sh <script> read <work folder> after-commit-1`.
4. Commit 2, with a free Store. Ask the agent to change "Build parser 1." to "Build parser 2.", to run `git add -A && git commit -m "Commit 2"`, and to report each line that the commit printed. Wait 10 seconds. Then: `sh <script> read <work folder> after-commit-2`.
5. Commit 3, with a free Store, in the same way with "Build parser 3." and the label `after-commit-3`.
6. Copy the three readings from `<work folder>/readings.txt` into the record of the run, and remove the work folder.

The files that the script makes in the work folder, all outside the project:

| File | Made by | What it means |
| --- | --- | --- |
| `setup.json` | `prepare` | The JSON result of the first `make-docs setup --yes`. |
| `first-sync.json` | `prepare` | The JSON result of the first checkpoint, from the plain shell. |
| `setup-hooks.json` | `prepare` | The JSON result of `make-docs setup --yes --git-hooks`. Its `gitHooks` part holds `status`, `runMode`, `runFallback`, and `runStateDir`, the folder of the run files. |
| `empty.gitconfig` | `prepare` | The empty file that stands in for the global and the system git config in the git commands of the script. The agent tool does not use it. |
| `hooks-ran.txt` | Each hook file, by its last line | One hook name for each hook that git ran. An empty file means that no hook ran. |
| `store/git-hook-runs/<digest>/` | The hooks | The run files: `started.json`, `pending.json`, `working.json`, `last.json`, and `foreground.json`. [The Folder Of The Run Files In The Store](#the-folder-of-the-run-files-in-the-store) says what each one holds. |
| `readings.txt` | `read` | Each reading, one after the other, with its label and its time. |

`hold` writes no file. It prints `held` when it has the write lock of the temporary Store and `free` when it let go.

The three results, and how each one shows:

- "The background run ran to its end": a reading shows `started.json: none`, and `last.json` with an `endedAt` after the commit. `outcome` is `ran`. With `exitCode` 0, `output` holds what the checkpoint did, such as `Checkpoint: 1 file imported.`, or nothing when nothing was due. With `exitCode` 1, `errorOutput` holds the reason, such as `store-unavailable` after a held Store.
- "The run was stopped": after the wait, a reading still shows `started.json` with a process number, and `last.json` is absent or is of an earlier commit. The store does not have the new task text.
- "The fallback happened": a reading shows `foreground.json` with an `at` after the commit, and `previous.pid` is the process number of the stopped run. The agent saw the line of the checkpoint in the output of its commit when something was due.

How to read one reading:

- "hooks that git ran" holds the hook names. No name means that the tool did not start the hook.
- After commit 1: `last.json` with `"exitCode":1`, `store-unavailable` in `errorOutput`, and an end about 5 seconds after the start means that the run outlived the command of the tool, waited the normal time for the held Store, and gave up. That is the survival proof. `started.json` that still exists after the hold ended, with no new `last.json`, means that the tool stopped the run.
- After commit 2: when the run of commit 1 was stopped, `foreground.json` exists with a time after commit 2, the agent reports the line `Checkpoint: 1 file imported.`, and the store has "Build parser 2.". That is the fallback. When the run of commit 1 survived, no `foreground.json` exists, the agent reports no line of a hook, and `last.json` holds `Checkpoint: 1 file imported.`.
- After commit 3: the mode of the third hook. In a tool that stops each background run, `foreground.json` has a time after commit 3. In a tool that lets it live, `last.json` is of commit 3.
- "the store, task T1" is the text that the temporary Store holds at the time of the reading.

The table to fill:

| Agent tool | Who started the session | Setup method of the tool | Commit 1: the hook ran | Commit 1: the background run ended, and what it did | Commit 2: the fallback happened, and what the agent saw | Commit 3: the mode | The store after commit 3 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Codex | The orchestrator, as delegated sessions with no command sandbox (each session reported this). Commit 1 was one session, and commits 2 and 3 were a second session | `none` | yes | Yes. The commit took 0.15 seconds. The background run started at 07:19:02.9 and ended at 07:19:08.4 UTC, so it outlived the command. It waited 5 seconds for the held Store and ended with exit code 1 and `store-unavailable` | No fallback. The agent saw no line of a hook. The commit took 0.08 seconds | background: `last.json` is of commit 3, exit code 0, `Checkpoint: 1 file imported.`, with no `foreground.json` | "Build parser 3." |
| Claude Code | The orchestrator, as subagent sessions. Each commit ran inside the command sandbox of the tool. Commit 1 was one session, and commits 2 and 3 were a second session | `none` | yes | Yes. The commit took 0.16 seconds. The background run started at 07:18:33.9 and ended at 07:18:39.4 UTC, so it outlived the command. It waited 5 seconds for the held Store and ended with exit code 1 and `store-unavailable` | No fallback. The agent saw no line of a hook. The commit took 0.10 seconds | background: `last.json` is of commit 3, exit code 0, `Checkpoint: 1 file imported.`, with no `foreground.json` | "Build parser 3." |
| GitHub Copilot CLI | no proof gathered: the orchestrator's environment cannot start this tool | | | | | | |

The orchestrator ran these proofs on 2026-11-28 on the maintainer machine (macOS), with the built CLI of the staged Phase 5 work. Findings:

- In both tools the background run outlived the command of the tool, and no tool stopped it. So the foreground fallback did not happen in any run, and these runs do not prove the fallback inside an agent tool. The tests and the hand runs of the builder prove the fallback with a killed run.
- In both tools the agent saw no line of a hook in any commit.
- In each run the temporary Store was in a folder that the shell of the tool may write. The Phase 4 access runs showed that the checkpoint stops with `store-unavailable` where the shell may not write the Store folder, and the background mode does not change that.
- What is not proven: a setup method other than `none`; GitHub Copilot CLI; a session that the person started by hand in the app of a tool; Linux and Windows.

The orchestrator removed the two work folders after the record.


One observation of the builder, which is not a row of the table. The builder works inside the command shell of one agent tool, with its sandbox on. In a hand run there, a commit with the installed hooks in a temporary project started a background run while another process held the temporary Store, and the tool command ended at once. A later tool command found that the run had ended 3.7 seconds after its start, with `Checkpoint: 1 file imported.`. So in that one shell, on that day, a background run outlived the command that started it. It is one run, the builder's own session is not a session that the orchestrator started for the proof, and the temporary Store was inside the folders that the sandbox lets a command write.

What the script cannot show: a real Store in the home folder of a person, a session that a person started by hand in the app of a tool, and Linux or Windows.

#### The Cases Of The Background Mode By Test

"bg" is `w35-r0-p5-hook-background.test.ts`, and "wait" is `w35-r0-p5-hook-wait-limit.test.ts`.

| Case | State | Proof |
| --- | --- | --- |
| A62q | Proven on macOS | wait: a commit, a rewrite, and a true merge print nothing, the store holds each edit after the run, and no run file of a live run is left. bg: the foreground fallback prints the line before git returns. |
| A62r | Proven on macOS | wait: with a held Store and with each of the three held lock files, a commit ends in less than 900 ms, its background run ends after 4,900 ms to 9,000 ms with exit code 1, and a foreground run of the checkpoint ends after 900 ms to 4,500 ms. |
| A62s | Proven | wait: the file is not imported, `work status` and the reminder line count it, the next commit and a direct run import it, and a Store that is free again after 2 seconds lets the background run import it. |
| A62t | Proven in part | wait: a direct run waits 5,000 ms. A commit whose hook run is the first sync of 61 work files imports each one. As before, that run is shorter than each bound on this machine. |
| A62u | Proven | wait: a command file on PATH records two checkpoint calls for one amended commit, and git prints nothing. |
| A62v | Waits for the owner | The PRDs hold the modes and each bound. `make-docs check prd` passes. |
| A62w | Proven on macOS | bg: with a held Store, a commit returns in less than 900 ms and prints nothing, the run still waits, and after the Store is free the store has the edit and `git status` shows no change. |
| A62x | Proven on macOS | bg: `git commit ... \| cat` and a process that reads both outputs of git through pipes each return in less than 900 ms while the background run still waits. |
| A62y | Proven on macOS. Skipped in part on Windows | bg: the run leads a process group of its own, it lives after the hang-up signal went to the group of the shell that ran git, and it then imports. A second test shows that it lives after the process that ran git ended, and that only `last.json` is left. A hand run with a real terminal, outside the sandbox, gave the same result: see [The Hand Runs Of The Background Mode](#the-hand-runs-of-the-background-mode). The first test is skipped on Windows. |
| A62z | Proven on macOS | bg: ten commits in a loop and one direct run; six commits with a held Store, of which two runs live and four ended. |
| A62aa | Proven on macOS | bg: a run that was stopped with a kill signal; the next commit prints `Checkpoint: 1 file imported.` and syncs; the commit after it prints nothing and syncs in the background. Two commits, each after a stopped run, both run in the foreground. A start mark of a live process that is older than 60 seconds gives the foreground. |
| A62ab | Proven on macOS | bg: a fallback commit with a held Store takes 900 ms to 4,500 ms, prints nothing, and exits 0, and with the debug switch standard error holds `store-unavailable`. No file of the project changes: `git status --porcelain --ignored` is empty. The end-to-end test with two work trees passes. No schema change: see [Owner Gate OG-3 For The Run Files](#owner-gate-og-3-for-the-run-files). |
| A62ac | Proven | bg: the review, the JSON result, and the record state the mode, and `setup remove` in the last checkout removes the run folder. |
| A62ad | Done | `PERF-007-R2` and the side measure are recorded. `make-docs check performance-evidence` shows 127 diagnostics, the same count as before this change. |
| A62ae | Prepared. Waits for the orchestrator | The script, the steps, and the table are above. No cell holds a result. |

#### The Hand Runs Of The Background Mode

Each run used the built CLI, a temporary project that the real setup made, a temporary Store at a fixed path below `/private/tmp/claude`, a temporary home folder, empty files in place of the global and the system git config, and the PATH `/usr/bin:/bin`. `<work>` stands for the temporary folder. Each time holds about 25 ms of the timer of the script, which is one start of `node`. The lines are the plain output of the scripts. Lines that only print a run file again are left out, and `<work>` replaces the path of the temporary folder. In the first run, `last.json` is there right after git because an earlier commit of the same script session left it.

```text
commit 1: exit 0 in 98 ms (with about 25 ms for the timer)
  right after git: last.json started.json working.json 
  after the run: last.json 
{"schemaVersion":1,"mode":"background","outcome":"ran","event":"commit","root":"<work>/project","pid":22356,"startedAt":"2026-11-28T06:07:43.829Z","endedAt":"2026-11-28T06:07:43.957Z","exitCode":0,"output":"Checkpoint: 1 file imported.\n","errorOutput":""}
  waiting for import: []
commit 2 piped to cat: 98 ms; output: [[main 875d304] c2
 1 file changed, 1 insertion(+), 1 deletion(-)]
  waiting for import: []
no hook commit: 48 ms
hook commit nothing due: 101 ms

=== ten commits in a loop ===
ten commits: 938 ms in all
store body after the runs: Loop 10.
Checkpoint: nothing is due. The work files and the work store match.

=== a commit with the Store held ===
commit, Store held for 2.5 s: exit 0 in 99 ms
background run ended 2505 ms after git; body: Held short.
commit, Store held for 8 s: exit 0 in 101 ms
background run ended 5527 ms after git; body: Held short.
ran 1 "" {"ok":false,"code":"store-unavailable","message":"Make Docs waited 5 seconds to write Store data at <work>/store/store.db. ...
Checkpoint: 1 file imported.
body: Held long.

=== the fallback: a background run is killed ===
files after the kill: last.json started.json working.json
next commit: exit 0 in 228 ms, output: [Checkpoint: 1 file imported.]
{"schemaVersion":1,"at":"2026-11-28T06:08:54.289Z","event":"commit","root":"<work>/project","reason":"The last background run of this checkout did not end, and its process is not running.","previous":{"pid":23382,"at":"2026-11-28T06:08:51.016Z"}}
the commit after it: exit 0 in 100 ms, output: []
{"schemaVersion":1,"mode":"background","outcome":"ran","event":"commit","root":"<work>/project","pid":23473,"startedAt":"2026-11-28T06:08:54.720Z","endedAt":"2026-11-28T06:08:54.845Z","exitCode":0,"output":"Checkpoint: 1 file imported.\n","errorOutput":""}

=== a closed terminal, outside the sandbox ===
background run before the close: pid pgid sess tty = 10894 10894      0 ??
the shell in the terminal before the close: 10880 10880 ttys003  sh -c git commit -q -m hup; sleep 30
close at 2026-11-28T06:35:36.089Z
run6.sh: line 17: 10878 Hangup: 1               script -q /dev/null sh -c 'git commit -q -m hup; sleep 30' > /dev/null 2>&1
background run after the close: [10894 Ss   ??      ]
{"schemaVersion":1,"mode":"background","outcome":"ran","event":"commit","root":"<work>/project","pid":10894,"startedAt":"2026-11-28T06:35:35.973Z","endedAt":"2026-11-28T06:35:39.917Z","exitCode":0,"output":"Checkpoint: 1 file imported.\n","errorOutput":""}
```

What the hand runs show. A commit returns in about 0.1 seconds, and the store has the file a moment later. A commit whose output goes through `cat` returns as fast. Ten commits in a loop leave the store equal to the files. With the Store held for 2.5 seconds, the background run waits and then imports. With the Store held for 8 seconds, it gives up after about 5.5 seconds, the commit is not delayed, and the next checkpoint imports the file. After a killed background run, the next commit runs the checkpoint in the foreground and prints its line, and the commit after it is quiet again.

The closed terminal. The sandbox of the builder gives no terminal, so this one run used the command `script` outside the sandbox, in the same temporary project and with the same temporary Store and home folder. `script` gave the shell a real terminal (`ttys003`). The commit ran there, with the Store held. The background run had its own process group and no terminal (`??`). Then the terminal was closed with the hang-up signal to `script`. The shell in the terminal ended. The background run was still there, and it ended 3.8 seconds later with the import. It is one run on macOS.

Not run by hand: a case on Linux or Windows, and a session of an agent tool that the orchestrator started.

#### The Background Mode For The Owner

Nothing in this list is an owner decision. Each label is new, and it continues the labels RF-1 to RF-18, so no earlier label changed its meaning.

| Label | The point | What is built now | What the person sees | Another form |
| --- | --- | --- | --- | --- |
| RF-19 | How the background run starts | The command starts it, as a process of its own session, with the Node options `detached` and `stdio: "ignore"` and with `unref()`. The shell text starts no job. It costs one start of `node` with the start code in the foreground. | A git action with the hooks takes about 59 ms longer in `PERF-007-R2`, and the person gets the prompt back before the checkpoint ends. | A background job of the shell. It added 27 ms in `PERF-007-R1`, it stays in the process group of git, and its fallback rule would be shell text. |
| RF-20 | The sign from the block to the command | The environment variable `MAKE_DOCS_GIT_HOOK_RUN`, which the block sets to `start`. The command sets it to `foreground` or to `background:` and a token for the run. It follows the form of `MAKE_DOCS_HOOK_DEBUG`. It is no CLI option and no MCP input, so the name catalog did not change. Since the fixes after the second review, the variable changes only a checkpoint call with the event `commit` or `branch-change` and with no `--json`. Each other command, each other event, and a call with `--json` run as without it. | Nothing, in normal use. The person sees the name in the block text of the hook review. A person who sets it to `start` by hand with `make-docs project checkpoint --event commit` gets a background run and no output. With `--event session-start`, or with `--json`, the person gets the same output as without the variable. | A hidden CLI option. |
| RF-21 | How a hook knows that it must fall back, and when the mode is found | A hook runs in the foreground when the last background run of its checkout left its start mark and its process is gone, or the mark is older than 60 seconds. The fallback run also starts a background run, and when that one ends, the next hook uses the background again. The mode is found at each hook run. It is not fixed at install time, and setup has no mode input. [The Fallback Rule](#the-fallback-rule-and-what-it-can-and-cannot-detect) says what it can and cannot detect. | In a shell that stops background runs: nothing at the first git action, and from the second one on git waits for the checkpoint and prints its line when something is due. The hook review says so before the person selects the hooks. | A rule by platform; a mode input of setup that fixes the mode for a project; a sign in the environment of a known kind of shell. None is built: no platform is known where the background fails, and no shell is known by name. |
| RF-22 | What the foreground fallback prints | The lines that the foreground hook printed before: nothing when nothing is due, the summary line and the command when something is due, the one line for a caller with read access only, and nothing after a held Store and after each other error. | After the git action, `Checkpoint: 1 file imported.`, or the summary line and `Run make-docs project checkpoint to see and settle what waits.`, or no line. | Nothing in each case, as in the background mode. Then a shell that stops background runs would get the sync and no line. |
| RF-23 | Where the facts of the hook runs are kept | Files in the Store folder, `git-hook-runs/<digest of the project folder>/`, with at most five small JSON files for each checkout. They are no part of the database. `setup remove` and Store removal take them out. Two gaps: `setup store check` and `setup store clean` do not read these folders, and a person who deletes a project folder with no `setup remove` leaves the folder of that checkout until Store removal. [The Folder Of The Run Files In The Store](#the-folder-of-the-run-files-in-the-store) holds each file. | Nothing at a git action. The hook review names the folder of this checkout. A person who opens `last.json` there reads what the last background run did, with the full path of the project folder and, after an error, paths in the error output. | The git folder of the work tree, which a sandbox can keep read-only and which is inside the project folder; the temporary folder of the system, which differs between shells and is cleaned by the system; a row of the Store database, which would make each hook start open the database. |
| RF-24 | The bound on waiting runs | At most one background run of a checkout waits. A run that finds a waiting run ends at once. The waiting run waits at most 5 seconds for the working run. Then it works too, so two runs can work at the same time when one takes longer than 5 seconds. A mark older than 60 seconds, or of a process that is gone, is left behind. | Nothing. After many commits in quick succession the store holds the last state, and `last.json` can show the outcome `covered` for a run that ended at once. | No bound: each commit keeps one process that waits for the Store. |
| RF-25 | The bound of a background run at each wait | 5,000 ms at each wait for the Store, also for the waits that are 30,000 ms for each other caller. The owner said "the normal wait, about 5 seconds", and that no background run waits 30 seconds. The same value for each wait is the builder's reading of those words. | Nothing at the git action, which is not delayed. While the Store stays held, the file is imported up to about 5.5 seconds after the commit, or it waits for the next checkpoint, and `make-docs work status` counts it as waiting. | 30,000 ms for a live Store owner, as for each other caller. The owner excluded it. |
| RF-26 | The debug switch in the background mode | `MAKE_DOCS_HOOK_DEBUG` makes a background run print nothing, as without it. The file `last.json` always holds the output and the error output of the last background run. The switch shows the error output of a foreground run on standard error, and the line of the block for "no command at all". | With the switch and a background run: nothing. With the switch and a foreground run: the typed Store result on standard error. With the switch and no command: `make-docs git hook: no make-docs command at the recorded path and none on PATH.` | A log file that only the switch turns on. |
| RF-27 | How the mode shows | The hook review has the lines "Run mode: background." and "Fallback: foreground.", with what the person sees and where the result is. The setup JSON result has `runMode`, `runFallback`, and `runStateDir`. The Store record has `runMode` and `runFallback`, and the block version is 2. | The two lines at the top of the hook review, and the points of its limits list. [The Mode In The Setup Review](#the-mode-in-the-setup-review-in-the-setup-result-and-in-the-record) holds the exact words. | One field with one word for both. |
| RF-28 | The hook after a branch change in the background mode | It starts a background run that only reads, as the other hooks do. Its report goes to `last.json`. It adds about 59 ms to each branch change. In the foreground fallback it prints its two lines. | Nothing at a branch change, also when files wait. The reminder line of the next Make Docs command says that files wait. | The hook after a branch change does nothing in the background mode, which saves that time. The owner decided that this hook only reports (design OD-9), and did not decide what it does when a hook prints nothing. So the builder kept one form for the four hooks. |
| RF-29 | A block of version 1, and an older `make-docs` on PATH | A project that already has version 1 keeps the foreground run with the limit of 1,000 ms until `make-docs setup --git-hooks` writes version 2. When the recorded command is gone and a hook runs an older `make-docs` from PATH, that version does not know the variable, and it runs in the foreground as it did. | Repeat setup says for each hook: "current, and a newer block is ready", and names `make-docs setup --git-hooks`. Until then the person sees the lines of the foreground hook at a git action. | An update that writes the new block by itself. Recommendation R1 and the rule for a changed block forbid a write with no selection. |
| RF-30 | No usable Store, no Make Docs project, or a Store folder that cannot be written | The command runs the checkpoint in the foreground, as before this change, and that run does nothing or reports with read access only. It starts no process and writes no file. | Nothing, or the one line for a caller with read access only. | No run at all in these cases. |
| RF-31 | The entry of the CLI | Each start of the CLI now runs the start code first and then loads the rest. For each command that is no hook start, this is one check of one variable. | Nothing. Each command prints what it printed before. | A second command file only for hooks, which is a new shipped program. |
| RF-32 | The first hook run in a shell that stops background runs, and a checkout that is used from two kinds of shell | The first hook run there syncs nothing. The rule keeps one fact for each checkout, so each change between a terminal and such a shell costs one hook run: one that syncs nothing, or one foreground run in the terminal. | Nothing at that first git action. `make-docs work status` and the reminder line count the file as waiting. After a change back to the terminal, one git action waits for the checkpoint. | One fact for each kind of shell, by a sign such as "standard error is a terminal". It is a guess about the shell, so it is not built. |

##### What This Change Replaced In The Earlier Parts

| Earlier point | What this change did to it |
| --- | --- |
| The row "A hook runs the checkpoint in the foreground" of [Owner Decisions That This Phase Built](#owner-decisions-that-this-phase-built) | Replaced by OD-P5-1 to OD-P5-5. The row stays as the record of the first answer. |
| R8, the limit of 1,000 ms | Holds only for a foreground run: the fallback, a block of version 1, and a person or a hook of an agent tool that gives the event. A background run waits 5,000 ms at each wait. |
| R9, the checkpoint takes the limit | Still holds. The checkpoint takes the bound by run mode. No CLI option and no MCP input is new. One environment variable is new (RF-20). |
| R10, "quietly" | Still holds for the foreground fallback, where the owner chose it. In the background mode a hook prints nothing in every case, by OD-P5-5. |
| R11, the limit covers each wait and not the run | Still holds, in both modes. |
| T26, where the output is cut | Still holds: the checkpoint gives the short form. In the background mode nobody sees it at the action, and `last.json` keeps it. |
| T27 and A62h, the debug switch | Changed: it shows the error output of a foreground run only (RF-26). |
| T31 and A62l, what a hook prints after an error | Holds for the foreground fallback. The background mode prints nothing in every case. |
| T35, A62q, and the words "the block starts no background process" | Replaced. The shell text still starts no job, and the command starts the background run. |
| The table [Each Line That A Hook Can Print](#each-line-that-a-hook-can-print) | Now the lines of the foreground fallback. [What A Hook Prints Now](#what-a-hook-prints-now) replaces it. |
| RF-1, what the wait limit bounds | Changed: 5,000 ms at each wait in a background run, and 1,000 ms at each wait in a foreground run. Still each wait by itself. |
| RF-9, the command that a hook runs | Still holds. It matters more now: only the recorded version knows the variable of the block. |
| RF-12, the cost of a hook with nothing due | Changed by the background mode: the added time of a git action no longer grows with the work files. It stays open for the foreground fallback and for the time until the store has the file. Register entry R-047 holds it. |
| RF-15, the short form and the limit belong to the events | Changed in part: the short form belongs to the events `commit` and `branch-change`. The bound now also depends on the run mode. What holds after the fixes of the second review: a trigger run with the event `commit` or `branch-change` that an agent tool hook or a person starts gets the short form and the limit of 1,000 ms, in the foreground. It starts in the background only when its environment holds the variable of the git hook block and the call has no `--json`. A call with another event never starts in the background and never gets the short form or the limit. |
| Point 16 of [P5 New Behavior That The Documents Did Not State](#p5-new-behavior-that-the-documents-did-not-state) | Still holds. |
| The times of [The Wait Limit](#the-wait-limit-t35-to-t37-a62q-to-a62u), of [The Measured Times After The Fix](#the-measured-times-after-the-fix), and of [The Cost Of A Hook With Nothing Due, For The Owner](#the-cost-of-a-hook-with-nothing-due-for-the-owner) | They are of the foreground block of the first build and of the fix round. They stay as measured. [The New Measurements](#the-new-measurements) hold the times of the built block. |
| [The Hand Run](#the-hand-run), its hook review, its four blocks, and its lines that a commit printed | They are of block version 1. [The New Block Text](#the-new-block-text) and [The Hand Runs Of The Background Mode](#the-hand-runs-of-the-background-mode) hold version 2. |
| R1 to R7, T20 to T25, T28 to T30, T32 to T34, RF-2 to RF-8, RF-10, RF-11, RF-13, RF-14, and RF-16 to RF-18 | Not changed. |

#### The Twin Review Of The Background Mode

The checkpoint is deterministic logic with an agent form, `make-docs://system/reference/work-store.md`. This change touched two rules of both forms, and the agent form was reviewed for each:

- `WORK-RULE-071`: the catalog text and the Checkpoint section now give the two bounds, 5 seconds in a background run of a git hook and 1 second in a foreground run, and say that git does not wait for a background run.
- `WORK-RULE-072`: both now say that a hook starts the run in the background and prints nothing, that the next hook runs in the foreground only when the last background run did not end, and what an agent does: it does not wait for a line of a hook after a commit, it reads `make-docs work status` or the reminder line, and it starts a direct run when something waits.
- `WORK-RULE-070`, the short form, keeps its rule. Its sentence about who sees the output changed in the agent form.
- "When to Run It" says that a hook starts the checkpoint in the background and prints nothing, so an agent still runs the checkpoint at the three moments.

An agent without the CLI has no hook and no checkpoint, so the agent form needs no rule for the start code, the run files, or the fallback: those are parts of the command. The twin test passes, and the template file and the installed copy are byte-identical.

#### The Checks Of The Background Mode

Every test, measurement, and CLI run of this change used a temporary Store at a fixed path under `/private/tmp/claude` or inside the temporary folder of the test, and each run checked first that `MAKE_DOCS_HOME` was not empty. No run read or wrote the real Store. No run installed, changed, or removed a git hook in this repository or in any real repository, and no run started `make-docs setup`, `setup system`, or `setup remove` against this repository or with the real home folder. Each hook ran only in a temporary git repository, with a temporary home folder and empty files in place of the global and the system git config. After the last run, the hooks folder of this repository holds only the `.sample` files, and no checkpoint process of a test or of a hand run is left. All checks ran on the maintainer machine, on macOS, with Node `v26.13.1` and git 2.47.1.

- `npm run prepack -w packages/cli`: the build passes.
- `npx tsc --noEmit -p packages/cli`: no errors.
- The P1 to P5 test files (15 files), with a fake `make-docs` first on the outer PATH: 321 tests pass and 1 is skipped. The fake command writes a mark file when it runs, and no mark file exists after the run. The one skipped test is the P4 test of a real global install.
- `w35-r0-p5-hook-background.test.ts`, 10 runs in a row: 17 tests pass in each run.
- `npm test -w packages/cli -- --testTimeout=120000`, with `TMPDIR=/private/tmp/claude/x`, after the last change of product code: 4,058 tests pass, 2 fail, and 7 are skipped, in 173 test files, in 658 seconds. The 2 are the known failures of `tests/mcp-app-contract.test.ts` on Node 26. `backup.test.ts` and `uninstall.test.ts` pass.
- After the last document change, in one run: the consistency test, the template links test, the package safety test, the P3 name and router test, the W29 parser and sync test, the two dependency direction tests, and the P1 surface test. 259 tests pass in 8 files. After that run, only this line changed.
- A first full run of this change found 5 more failures, and each one was the builder's. Two dependency tests: the first build kept the start code below `src/run/` and added a file between the entry and the CLI, and the operation core may reach neither. The start code moved to `packages/cli/src/store/git-hook-runs.ts`, and the entry file loads the CLI itself. Two parser tests: the phase files of P4 and P5 were longer than the 65,536 characters that the work store holds for one file. Both are shorter now, with 65,063 and 64,748 characters, and the method list of the requalification moved to this report. One test of this change read the end of a process a moment too early, and it now waits for it. The second full run is the result above.
- `npm run validate:defaults`: 53 tests pass.
- `npm run test:smoke-harness`: 19 tests pass.
- `make-docs check prd --target-root .`, with the built CLI: exit code 0, no diagnostics.
- `make-docs check performance-evidence --target-root .`: exit code 1, with 127 diagnostics, the same count as before this change. No diagnostic is new. A first run gave 128: lines of the P5 phase file held a time value and no profile name. Those lines now name `PERF-007` or hold no value.
- `make-docs project paths validate --target-root .`: valid, 0 failing findings.
- `make-docs project markdown validate --path <file>` on each document that this change touched: no findings on this report, the phase files of P4 and P5, the index, the two plan files, the design, PRD 07, PRD 52, the work store reference of the template and its installed copy, and the Store README. On PRD 38 it reports 8 findings and on the risk register 9, the same counts as before, each on a line that this change did not touch.
- `make-docs backlog snapshot --target-root . --json`: exit code 0, and no diagnostic names W35. The snapshot shows 7 phases and 138 tasks for W35 R0.
- `cmp` shows that `.make-docs/system/references/work-store.md` matches its template file byte for byte.
- The hand runs: [The Hand Runs Of The Background Mode](#the-hand-runs-of-the-background-mode). One of them, the closed terminal, ran outside the sandbox of the builder, in a temporary project with a temporary Store.
- Not run: any run on Linux or Windows, `npm run smoke:pack:local`, a packed install of the candidate, a session inside an agent tool that the orchestrator started, and `make-docs project checkpoint` in this repository, which would write the real Store. The orchestrator runs that checkpoint, because work files changed.

- A repair of this report, after the checks above. One late edit of the builder, which changed one line of this list of checks, cut out the whole section [The Background Mode](#the-background-mode-t39-to-t45-a62w-to-a62ae) and the last three lines of [The Checks Of This Round](#the-checks-of-this-round): it cut from the first line with the same first words, which stood in that earlier section, to a line of this list. So the staged report held none of it, while other lines linked to it. The orchestrator found this. The section is written again from the builder's saved copy, and the three lines are back with their first words. Four parts are new in the repair: the block text of each of the four hooks, from the code; the folder of the run files with each file; the files and the three results of the proof script; and the column "What the person sees" of the list for the owner. One small code change came with it: `setup remove` and Store removal also take out a `.tmp` file that a stopped write of a run file left behind, with a test. After the repair: `npx tsc --noEmit -p packages/cli` has no errors; the background test file, the W29 parser and sync test, the two dependency direction tests, and `uninstall.test.ts` pass with 155 tests in 5 files; a script found that each number of the two tables of [The New Measurements](#the-new-measurements) and of the table of `PERF-007-R2` in the P4 phase file equals the value of its results file, and that each link with an anchor in the W35 work files, the W35 plan files, the design, PRD 07, PRD 38, PRD 52, and the Store README has its heading. The full suite did not run again after this small code change.

#### The Fixes After The Second Independent Review

The second independent review of this phase found that the data and the hooks hold, and it failed two statements. It gave 2 findings that must be fixed (MF-1 and MF-2), 3 that should be fixed (SF-1 to SF-3), and a list of notes. The builder checked each one against the code before the change, and each one was true. This section holds what changed. Each rule that this round added is a proposal. None is an owner decision.

| Finding | Result | What changed |
| --- | --- | --- |
| MF-1: "at most one background run works" is false | Applied | The claim is corrected in the hook review, in PRD 52 R-WORK-CHECKPOINT-15, in the code comment, in the test title, in the phase file (A62z), and in this report. One new test shows a working run that lasts longer than the wait. See [The Rule For Waiting Runs, In Its True Words](#the-rule-for-waiting-runs-in-its-true-words). |
| MF-2: the run files have no row in the field register | Applied, with two rows | PRD 38 has two new R-MIN rows, and the table catalog in code names both. R-MIN-1 gives each fact one class, and the marks and the reports have different classes, so one row was not enough. See [The New Rows Of The Field Register](#the-new-rows-of-the-field-register). |
| SF-1: the variable also changed calls that are no git hook calls | Applied | Only a checkpoint call with the event `commit` or `branch-change` and with no `--json` can start in the background. Each other call ignores the variable. A call with `--json` prints its JSON and never starts in the background. RF-20, RF-15, PRD 07 R-SETUP-CLI-22, and PRD 52 R-WORK-CHECKPOINT-15 say so. |
| SF-2: the preference path writes old, unedited blocks of an older project again | Applied as a statement, with no code change | PRD 07 R-SETUP-CLI-23 states the case, and RF-33 lists it for the owner. |
| SF-3: the offer test file was in neither platform list | Applied | `w35-r0-p5-setup-offer.test.ts` is in both fixed lists. Each of the 8 `w35-r0-p5-*.test.ts` files is in both lists now. |
| Note: the start mark can be written again after a very fast run removed it | Applied, with a rest | The hook process writes the process number into the start mark only while the mark still holds the token of its run. A rest stays: see the known limits below. |
| Note: two runs can both take a left `pending.json` | Recorded | No small safe fix was found. See the known limits below. |
| Note: a dead waiting run whose process number another process got | Recorded | See the known limits below. |
| Note: the Store error text said "6 seconds" for 5,009 ms and "2 seconds" for 1,010 ms | Applied | The message rounded up. It now rounds down, in one function (`waitedSecondsText` in `packages/cli/src/store/database.ts`), which the Store message and the message for a live checkout writer use: 5,009 ms is "5 seconds", 1,010 ms is "1 second", and less than 1,000 ms is "less than 1 second". No test pinned the old text. One new test pins the new text. |
| Note: `setup remove` with a block that it writes again kept the old block version in the record | Applied | When `setup remove` writes a block again for the checkouts that stay, the record takes the block version, the run mode, and the fallback of this version. One test sets a record to version 1 and reads version 2 after the removal. |
| Note: a bound work tree that is not in the hook record gets a run folder, and `setup remove` there left it | Applied | `setup remove` takes out the run folder of its checkout in each case, after the project files. One test shows it. |
| Note: risks on Windows | Applied in part | The rename of a run file is tried again up to 5 times, for at most about 50 ms. The other risks are recorded below. |
| Note: points for the owner | Applied | [The Points Of The Second Review For The Owner](#the-points-of-the-second-review-for-the-owner). |

##### The Rule For Waiting Runs, In Its True Words

The exact words, as the hook review, the code comment, and PRD 52 hold them: "At most one background checkpoint of a checkout waits. A hook run that finds a waiting one ends at once, because the waiting one reads the files later. The waiting one waits at most 5 seconds for the working one. Then it works too, so two can work at the same time when one takes longer than 5 seconds."

Why the first words were false: the waiting run waits for the working run with a bound of 5,000 ms (`GIT_HOOK_RUN_QUEUE_WAIT_MS`), and then it goes on. The reviewer's case: a project with 4,002 work files, a first commit whose first sync took 14 seconds, and a second commit at once. At 5.6 seconds both runs were alive. The data was safe, because the scan of the work files runs inside the Store write session (register entry R-041).

What the rule bounds: the runs of one checkout that wait, which is one. It does not bound the runs that work. While one run works for a long time, a new run can start to work about each 5 seconds for as long as commits go on, and each one then waits for the Store with its own bound.

The new test, `the waiting run waits about 5 seconds for a working run that still lives, then it works too, and the store agrees with the files at the end`: a process that the test controls holds the working mark, as a working run that lasts longer than the wait. A commit with the hooks starts a run. That run holds the pending mark for more than 1.5 seconds, and the store does not have the edit. After the wait it takes the working mark while the long process still lives. Its run took 5,190 ms in one test run, with the bounds 4,800 ms and 10,000 ms. At the end the store has the edit, a direct run of the checkpoint finds nothing due, and `git status` shows no change. The test uses no project with thousands of files. So it shows the wait and its end, and it does not show two real syncs of one checkout at the same time. The tests of register entry R-041 in `w35-r0-p4-sync-race.test.ts` show two real syncs at the same time.

##### The New Rows Of The Field Register

PRD 38 has two new rows in the R-MIN table, before the row of `tool_operations`. The table catalog in code names both as rows outside the tables (`STORE_NON_TABLE_RMIN_ROWS` in `packages/cli/src/store/table-catalog.ts`), and the drift test of the catalog passes.

| Fact | Class | Writer | Readers | Retention | Privacy | Purpose |
| --- | --- | --- | --- | --- | --- | --- |
| Git hook run marks: `started.json`, `pending.json`, and `working.json` in `git-hook-runs/<digest>/` | Short-lived mutation guard | The hook process writes the start mark, and a background checkpoint writes the two others | The next hook process of the checkout, and a background checkpoint | A run that ends removes its marks. A left mark is replaced or taken over. `setup remove` removes the marks of its checkout, and Store removal removes all | Process numbers of this computer; local data only | Start a background checkpoint, find one that did not end, and keep at most one waiting run |
| Git hook run reports: `last.json` and `foreground.json` in `git-hook-runs/<digest>/` | Historical evidence | A background checkpoint writes `last.json`, and the hook process writes `foreground.json` | A person. No Make Docs decision reads them | What the code does today: the next run or the next fallback replaces the file, `setup remove` removes the files of its checkout, and Store removal removes all. The files of a deleted project folder stay with no end date until Store removal. This is the open owner point RF-23, and no decided rule | The full path of the project folder, and paths in the error output; local data only, with the modes 0700 and 0600 | Show what the last background checkpoint did, and that a fallback happened |

The table above is a short form. PRD 38 holds the full words of each cell. The `W35 R0 P5` Requirement History entry of PRD 38 names the two rows.

##### What Holds For The Variable And For The Events

- `MAKE_DOCS_GIT_HOOK_RUN=start` changes one kind of call only: `make-docs project checkpoint` with `--event commit` or `--event branch-change` and with no `--json`. That call starts in the background, or it runs in the foreground fallback.
- With the variable and another event, such as `--event session-start`, the call prints the full trigger output in the foreground, as without the variable. Before the fix it printed nothing and ran in the background.
- With the variable and `--json`, the call prints its JSON result in the foreground. A hook block never passes `--json`. Before the fix it printed no JSON.
- Neither call makes a run file or starts a process.
- For RF-15: the short form and the limit of 1,000 ms still belong to the events `commit` and `branch-change`. A hook of an agent tool, or a person, that gives one of these events gets both, in the foreground. It gets the background only when the variable of the git hook block is in its environment.
- The tests: the start code for five other event names and for two places of `--json`, and two calls of the built CLI with the variable, one with `--event session-start` and one with `--event commit --json`.

##### The Known Limits Of The Run Marks

Each one is recorded with its effect and its bound. None can lose data: the Store and the sync core decide what is written, and the marks only decide when a run starts.

| Limit | How it comes | Effect | Bound |
| --- | --- | --- | --- |
| A start mark of a run that already ended | The hook process writes the start mark, starts the run, and then writes the process number into the mark. A run that ends at once, as a run that another run covers, can remove the mark between the check and the second write of the hook process. Since this round the hook process writes only while the mark still holds the token of its run, so the time for this is the time between one read and one write of a small file | The next hook finds a start mark of a process that is gone, and runs one checkpoint in the foreground that was not needed. Then the background is used again | One foreground run |
| Two runs take a left `pending.json` | Two runs start in the same moment and both find a pending mark of a process that is gone. Both remove it, and the second removal can take out the new mark of the first run | Both runs wait, and both work then. One more run works at the same time than the rule says | Two runs in place of one, for one pair of starts |
| A left `pending.json` of a process number that another process got | A waiting run was stopped, and the system gave its process number to another process that lives | Each new run of the checkout ends as "covered", with no run that covers it. Nothing is synced by a hook in that time. `make-docs work status` and the reminder line count the files as waiting | At most 60 seconds from the time of the mark. Then the mark is taken as left behind |
| A left `working.json` of a process number that another process got | The same, for a working run that was stopped | Each new run waits 5 seconds before it works | At most 60 seconds from the time of the mark |

##### The Expected Risks On Windows, Before The Platform Run

No run of this phase used Windows. These risks are stated before the platform run, so that a failure there has a known cause.

- A rename onto a run file that another process has open can fail on Windows. The write of a run file renames a new file onto the old one. Since this round the rename is tried again up to 5 times, for at most about 50 ms in all. When it still fails for `started.json` in the hook process, the hook runs the checkpoint in the foreground. When it fails for `last.json` or for the removal of the start mark at the end of a run, the start mark stays, and one foreground run follows that was not needed.
- A `pending.json` that is deleted while another process has it open can stay visible for a moment on Windows. A new run that reads it in that moment can end as "covered" with no run that covers it. The file is then imported by the next checkpoint. No change was made for this.
- It is not proven that the process that the command starts with the `detached` option outlives the shell that git starts for a hook on Windows. When it does not, each hook run after the first one is a foreground run, by the fallback rule.
- It is not proven that the check for a live process (`process.kill` with signal 0) answers on Windows as on the other platforms.
- The test of the process group and of the hang-up signal is skipped on Windows, which has neither.

##### The Points Of The Second Review For The Owner

Nothing in this list is an owner decision. A point with an earlier label keeps that label. Three labels are new, RF-33 to RF-35, and they continue the labels RF-1 to RF-32.

- RF-32: the first hook run in a shell that stops background processes syncs nothing, and no line says so there.
- RF-21: the mode is found at each hook run, so the hook review that setup shows cannot say which mode applies in a given shell. It says how the mode is found.
- RF-24: two background runs of one checkout can work at the same time when one takes longer than 5 seconds. Only the count of waiting runs has a bound.
- RF-25: when the Store stays held for the whole wait, a background run gives up, and the change waits for the next checkpoint.
- RF-23: the run folder of a deleted project folder stays until Store removal, and the Store check does not show it.
- RF-5: `make-docs setup --yes --git-hooks` in a copy of a clone can move the record of an original that is away. The plan names the record, and no separate question is asked.
- RF-15: a trigger run with the event `commit` or `branch-change` from an agent tool gets the short form and the limit of 1,000 ms, in the foreground. It never starts in the background by the event alone.
- RF-33, new: an unedited block of an older version is brought up to date when setup writes the hooks for another project of the same clone. The case of the review: a project at the top folder of a repository has hooks, and `make-docs setup --yes` of a new project in a subfolder, with the machine preference on and no hook input, writes all four blocks again. This follows from the shared hook files: the blocks must name the new project folder. A block that a person edited is kept. What the person sees: the plan of that run names each of the four hook files with the state `outdated` and the action `replace-block`, and the hook review says for each one "Make Docs replaces its block with a newer one and keeps every other byte." No backup is made, because the old block is the unedited text that Make Docs wrote. Another form: the preference path adds only the new project folder and keeps the old block version, which needs two block versions in one file set.
- RF-34, new: the run folder is a new format on disk, with a format version of its own (`schemaVersion` 1 in `last.json` and in `foreground.json`). It did not open owner gate OG-3 by the letter of that gate, which names a table, a column, a version of the Store schema, or a migration. The owner can read it as a change that the gate must cover.
- RF-35, new: the Store message for a wait now rounds the time down, and it says "less than 1 second" below one second. It changes the text of a message that each command with a held Store can print, and not only a hook.

##### The Checks After The Second Review

Every test and CLI run of this round used a temporary Store at a fixed path under `/private/tmp/claude` or inside the temporary folder of the test, and each run checked first that `MAKE_DOCS_HOME` was not empty. No run read or wrote the real Store, and no run installed, changed, or removed a git hook in this repository or in any real repository. After the last run, the hooks folder of this repository holds only the `.sample` files. All checks ran on the maintainer machine, on macOS, with Node `v26.13.1` and git 2.47.1.

- `npm run prepack -w packages/cli`: the build passes.
- `npx tsc --noEmit -p packages/cli`: no errors.
- The P1 to P5 test files (15 files): 325 tests pass and 1 is skipped, which is the P4 test of a real global install.
- `w35-r0-p5-hook-background.test.ts`, 5 runs in a row: 20 tests pass in each run.
- `npm test -w packages/cli -- --testTimeout=120000`, with `TMPDIR=/private/tmp/claude/x`, after the last change of product code: 4,062 tests pass, 2 fail, and 7 are skipped, in 173 test files, in 662 seconds. The 2 are the known failures of `tests/mcp-app-contract.test.ts` on Node 26.
- A first run of the Store table catalog test failed after the two new R-MIN rows: the catalog in code did not name them. It names them now, and the test passes in the full run above.
- `npm run validate:defaults`: 53 tests pass.
- `npm run test:smoke-harness`: 19 tests pass.
- `make-docs check prd --target-root .`: exit code 0.
- `make-docs check performance-evidence --target-root .`: 127 diagnostics, the same count as before. No diagnostic is new.
- `make-docs project paths validate --target-root .`: valid, 0 failing findings.
- `make-docs project markdown validate --path <file>`: no findings on this report, the P5 phase file, PRD 07, and PRD 52. PRD 38 has 8 findings, the same count as before, each on a line that this round did not touch.
- `make-docs backlog snapshot --target-root . --json`: exit code 0, no diagnostic names W35, and W35 R0 has 138 tasks.
- The anchor check script: each of the 196 links with an anchor into this report has its heading. The script names one line, line 715, where a quoted sentence of the reference stands in code marks and is no live link.
- The character counts of the two phase files, with the limit of 65,536: `04-git-hook-proofs.md` has 65,063, and `05-git-hooks-in-setup.md` has 64,850.
- Not run: any run on Linux or Windows, and `make-docs project checkpoint` in this repository, which would write the real Store. After the full run above, only this list changed.

### P5 Known Limits

The second independent review added limits of the run marks and expected risks on Windows. [The Known Limits Of The Run Marks](#the-known-limits-of-the-run-marks) and [The Expected Risks On Windows, Before The Platform Run](#the-expected-risks-on-windows-before-the-platform-run) hold them.

The first ten points below are of the background mode. Each later point is of the earlier builds, and it still holds unless [What This Change Replaced In The Earlier Parts](#what-this-change-replaced-in-the-earlier-parts) names it.

- The background mode is proven on macOS only. The test file `w35-r0-p5-hook-background.test.ts` is in both fixed lists of the platform workflow, and Linux and Windows have no result yet. On Windows two points are open until that run: that a process started with the `detached` option outlives the shell that git starts for a hook, and that the check for a live process answers as on the other platforms. The test of the process group and of the hang-up signal is skipped on Windows.
- No proof of the background mode ran inside an agent tool in a session that the orchestrator started. The script, the steps, and the table are ready.
- The first hook run in a shell that stops background runs syncs nothing, and no line says so there. The reminder line and the next hook run cover it.
- The fallback rule keeps one fact for each checkout, and not one for each shell. A checkout that is used from a terminal and from a shell that stops background runs pays one hook run at each change.
- A hook in the background mode prints nothing, so a person no longer sees the line about what waits at a git action. This follows from OD-P5-5.
- The foreground fallback costs what the foreground hook cost, and that cost grows with the count of work files (register entry R-047).
- The store is behind a commit for the time of the background run: about 0.5 seconds on this repository, about 2.1 seconds at 2,000 made-up work files, and up to about 5.5 seconds more when the Store is held. A command that reads the work store right after a commit can see the state before the commit. The reminder line names files that wait.
- The run files hold the full path of the project folder, and `last.json` can hold paths in its error output. A person who deletes a project folder with no `setup remove` leaves the run folder of that checkout in the Store folder.
- `PERF-007-R2` used the built CLI of the checkout and not a packed install, and its harness could not count the checkpoints that one action starts. The statement that Node sets each signal back to its default at its start is from the builder's knowledge, and no test checks it. It is one reason for the chosen start and not the only one.
- A project with blocks of version 1 keeps the foreground run until `make-docs setup --git-hooks` writes version 2.
- The tests ran on macOS with git 2.47.1 only. The four hook test files run on Linux and on Windows only in the platform run, which is not done.
- No test ran on Windows, so these Windows points have no proof yet: that the block starts the recorded `node` program by a path with a drive letter, that the block finds its folder for PATH with `cygpath`, and that each path comparison of the tests holds with the folder names of Windows. The block uses only the forms that the P4 proofs ran on Windows.
- No run used a real terminal. The prompts are proven with replaced prompts.
- No run used the real Store, by the rule of this Wave. So no run shows the hooks beside a real Store in a home folder.
- No test starts a hook as a caller with read access only. The one line for that caller is proven in the checkpoint core.
- No test runs a real update of the package from release 2.1.0 and then checks the preference and the hooks. The rule is proven by the code path: only the machine step writes the preference, and only a setup run with a selection writes a hook.
- The first sync test does not show a run that is longer than the limit.
- The test of the moved clone covers a checkout that got a new checkout ID. It does not cover `make-docs project move apply`, which was not available for that fixture.
- A record of a clone that a person deleted stays in the Store. The Store check names it, and nothing removes it.
- When a person copies a clone with its hook files, the copy holds blocks that no record of this clone covers. A plain setup says so and changes nothing. Setup with the hook input records them. `setup remove` leaves them and names them. The first report said that this held for each copy. It did not: with the original away, the copy took the record of the original over with no input, and `setup remove` in the copy deleted it. The fixes after the review ended that. One limit stays: with the original away, the hook input in the copy can still move the record of the original, after the plan named it (RF-5).
- The block runs the recorded command first. When the person updated Make Docs to another path and the old command file still exists, the hook keeps running the old version until `make-docs setup --git-hooks` records the new one. Only when the recorded command is gone does the hook run `make-docs` from PATH, and an older Make Docs there can lack the wait limit or the event.
- The wait limit bounds each wait for the Store by itself. It does not bound the whole hook run. The time of a hook run with nothing due grows with the count and the size of the work files (register entry R-047).
- The check for a hook file with a second language is a text mark: a line with `exec` and `$0` as one word. It cannot see each form of such a file.
- When `setup remove` keeps the blocks for a moved work tree and the person later deletes that work tree, the blocks and the record stay until the person takes the blocks out by hand.
- The PATH of the hook tests on Windows holds the folder of `git`. No Windows run checked the new test helper.
- With two projects in one repository, the block runs one checkpoint for each project, one after the other. So a commit takes about that many times longer.
- The hook review is long: it holds four full blocks, as the owner asked for the exact block of each hook.
- The times of the wait limit are one test run each for the first build, and the median of 3 hand runs for the final build, on one machine.

### P5 Checks

This list is of the first build. [The Checks Of This Round](#the-checks-of-this-round) holds the runs after the fixes that followed the independent review.

Every test and every CLI run used a temporary Store at a fixed path under `/private/tmp/claude` or inside the temporary folder of the test, and each run checked first that `MAKE_DOCS_HOME` was not empty. No run read or wrote the real Store. All checks ran on the maintainer machine, on macOS, with Node `v26.13.1` and git 2.47.1.

- `npm ci`, then `npm run prepack -w packages/cli`: the build passes.
- `npx tsc --noEmit -p packages/cli`: no errors.
- The five new test files, each in its own run: 26, 17, 10, 7, and 6 tests pass. None is skipped on macOS.
- `npm test -w packages/cli -- --testTimeout=120000`, with `TMPDIR=/private/tmp/claude/x`, after the last change of product code: 4,017 tests pass, 2 fail, and 6 are skipped, in 170 test files, in 604 seconds. The 2 are the known failures of `tests/mcp-app-contract.test.ts` on Node 26. `backup.test.ts` and `uninstall.test.ts` pass. A first full run, during the build, found 3 tests of P1 that held the full trigger output and 8 tests that the builder's own edits broke in the middle of that run. Each one was corrected, and the second full run is the result above. After that run, only documents, one sentence of `packages/cli/src/store/README.md`, and this report changed.
- `npm run validate:defaults`: 53 tests pass.
- `npm run test:smoke-harness`: 19 tests pass.
- `make-docs check prd --target-root .`: exit code 0, no diagnostics.
- `make-docs check performance-evidence --target-root .`: exit code 1, as before this phase, with 127 diagnostics. The same check on the files of commit `7e3436d0` gives the same 127. No diagnostic is new.
- `bash scripts/check-instruction-routers.sh`: not run. This phase changed no router.
- `npm run smoke:pack:local`: not complete. The run packed the candidate, passed the packed router parity, and ran its setup, sync, Skill, backup, and removal steps with the packed CLI in temporary folders. Its last step, the package proof `scripts/w22-r1-package-proof.mjs`, stopped with `getaddrinfo ENOTFOUND registry.npmjs.org`: the sandbox of the builder cannot reach the registry. A second try with registry access asked for gave the same error. So the package proof did not run here.
- `make-docs project paths validate --target-root .`: valid, 0 failing findings, 1,139 files checked.
- `make-docs project markdown validate --path <file>` on each changed document: no findings on this report, the P5 phase file, PRD 07, PRD 30, PRD 52, and the work store reference of the template. On PRD 28, PRD 38, PRD 39, and the risk register it reports findings only on lines that this phase did not change.
- `make-docs backlog snapshot --target-root . --json`: exit code 0, and no diagnostic names W35. The snapshot shows 7 phases and 131 tasks for W35 R0.
- `cmp` shows that `.make-docs/system/references/work-store.md` matches its template file byte for byte.
- After the last document change, in one run: the consistency test, the shipped-text test, the name catalog test, the P1 to P3 test files, the W29 agent twin test, the P4 test files, the five P5 test files, the work store contract test, the Store table catalog test, the template links test, and the Human Experience propagation test. 546 tests pass in 20 files.
- Not run: any run on Linux or Windows, `npm pack` for the digest, and an update by hand from the released 2.1.0 package.

### P5 Not Done

- The independent review of the background mode.
- The proof of the background mode inside each agent tool, and its table (T45, A62ae). The orchestrator runs it.
- The owner review of the points RF-19 to RF-32.
- A60: the three-platform result. It waits for the phase commit, the push, the pull request run, and the evidence commit.
- A62, A62p, and A62v: the owner review.
- A second look by the independent review at the fixes of [P5 Fixes After The Independent Review](#p5-fixes-after-the-independent-review).
- The owner review of the points RF-1 to RF-18.
- `make-docs project checkpoint` after the edits of the phase file and of this report. A work file changed, and the rule of the repository asks for the checkpoint. It would write the real Store, which the rule of this round forbids, so the builder did not run it. The orchestrator runs it.
- The package digest. This phase changed package bytes, so the recorded digest is stale. The builder did not edit `.github/release-candidates/`.
- T10: the orchestrator closes it as `superseded`.
- No guide changed. P7 owns the guides.
- No history record was written. The closeout owns it.

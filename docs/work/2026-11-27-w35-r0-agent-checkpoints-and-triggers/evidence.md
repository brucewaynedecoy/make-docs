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
- Two runs at the same time can undo a close in the store, and the store does not fully recover. The first fix pass found this with a test that starts two built CLI processes at once. The cause: `syncWorkFiles` calls `scanWorkFiles` before `writeWorkStore`, so sync reads the work files before it takes the Store. In the test, the first run wrote a closed task to its file, and the second run imported the older file text and set the task back to open in the store. Both runs ended with exit code 0 and no conflict. A review on 2026-11-27 then proved the true effect with the built CLI. It closed a task with `make-docs work close "<unit>" --expected-version <n> --outcome cancelled` and started two `make-docs project checkpoint --json` runs at the same time. One run wrote the file, and the other imported that same file with its older text. The store showed the task as open. One more run gave a closed task with the outcome `done`. What is lost for good: the outcome `cancelled`, and the same happens with `superseded`, because a task line shows only that a task is closed. What is wrong until the next run: the unit shows as open and ready, so another agent can claim it. What recovers: the closed status, with the next run that imports the file. In the review, evidence rows and an in-progress status stayed, an older file scan with a missing file or a missing task stopped as a conflict, and notes and met gates were not checked. `make-docs work sync` in the released version 2.1.0 has the same fault, and it is older than the checkpoint. A trigger run imports, so each hook run that overlaps a run that writes a file can do this. This phase did not change the sync core. The fix is to move the file scan inside the Store write session and then to measure the sync time again. It is not built yet. The owner decided on 2026-11-27 to fix it in this Wave, before the hooks ship. The owner did not choose the phase. The orchestrator placed the fix in P4, before any hook installs: [P4 Stage 5](04-git-hook-proofs.md#stage-5---the-fix-for-two-syncs-at-the-same-time), tasks T18 to T23. The [risk register](../../prd/03-open-questions-and-risk-register.md) holds the fault as R-041. No test fails on it: the test of this phase closes with the outcome `done` and also passes when the runs do not overlap.

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
- Not from this phase: `make-docs work add "x" --dry-run` takes the flag, ignores it, and writes the Store. The fix pass proved it with the built CLI and a temporary Store: the result said "Added task 1: x.", and `make-docs work next --level quick-item` then listed the item. The help of the command does not list `--dry-run`. Only `work add` was checked. This phase did not fix it. [Register entry R-042](../../prd/03-open-questions-and-risk-register.md) holds it.
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
- The fault of register entry R-042, `make-docs work add` with `--dry-run`, is not fixed. No task holds it.
- The limits under "P2 Known Limits" stay.

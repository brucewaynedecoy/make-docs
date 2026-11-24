# Work Store

## Purpose

Use this reference to find, claim, report, and close Make Docs work with the same rules as the Make Docs CLI. It is for an agent that edits the `docs/work/` files directly, with or without the CLI.

This reference is the agent twin of the deterministic work operations. Both forms share the rule catalog `make-docs.work-store-rules.v1` and its rule IDs, such as `WORK-RULE-020`. Both forms must give the same answer on the shared fixtures. A change to either form needs a review of the other. Each rule ID below names the catalog rule that the sentence states.

When the CLI is available, prefer it. Each command has one MCP tool with the same core:

| Command | MCP tool | What it does |
| --- | --- | --- |
| `make-docs work status` | `work_status` | Says whether the work store or the `docs/work/` files are in charge, and why. Lists each sync conflict with its settle commands. Changes nothing. |
| `make-docs work sync` | `work_sync` | Syncs the files and the work store both ways, or settles one conflict with `--settle <path>` and one choice. |
| `make-docs work next` | `work_next` | Lists the ready units in order, and why each other open unit waits, with one next action for each reason. Changes nothing. |
| `make-docs work claim` | `work_claim` | Claims a ready unit for a time limit, renews a claim, or takes over an expired claim after a check of the old task handle. |
| `make-docs work release` | `work_release` | Releases a claim without closing its unit. |
| `make-docs work report` | `work_report` | Records a status change, a short note, an evidence link, cleared blockers, or met gates. |
| `make-docs work close` | `work_close` | Closes a unit as done, cancelled, or superseded, and releases its claim. |
| `make-docs work export` | `work_export` | Writes the backlog files that the store holds to a folder that you name, or the quick item list to a file that you name. |
| `make-docs work add` | `work_add` | Adds a quick item with the next quick item number. |

Each write needs the write permission. A claim, release, report, or close also needs the unit's expected version, which `work next --json` shows. `make-docs resource read` and the `resource_read` MCP tool read the project URIs below. `make-docs backlog snapshot` reads the `docs/work/` files by default. Only with the opt-in `--work-store` option (MCP `workStore: true`) does it read the work store, when the store is the authority, and add readiness facts.

## Authority

- With a usable Store that this checkout is bound to, the work store is the authority for the project's work, and the `docs/work/` files are its repo copy. Without one, the `docs/work/` files are the authority, exactly as before the work store existed. (WORK-RULE-001)
- `work status` names the authority and its reason in plain words first. (WORK-RULE-002)
- The work store holds work records only. Designs, plans, PRDs, guides, and history stay repository documents. (WORK-RULE-003)
- A unit keeps its links to its design, plan, PRD sections, and evidence file. Those documents keep their links to the unit's coordinate. Keep links in both directions when you edit a file. (WORK-RULE-004)
- Units and claims belong to the project and are shared by every checkout of it. The sync ledger and sync conflicts belong to one checkout, so two worktrees never read each other's writes as edits. (WORK-RULE-037)
- Without a usable Store, or without the CLI, read the `docs/work/` files directly and apply the rules in this reference. The queue commands that need the Store return their typed Store result, such as `store-not-configured` or `store-unavailable`. `work next` and a project URI read also point to the `docs/work/` files and to `make-docs backlog snapshot`, which reads them without the Store. (WORK-RULE-053)

Without a Store, there are no claims, progress notes, met-gate records, or quick items. A status line, a checkbox, a dependency bullet, and a blocker bullet in the files are the whole record. To record progress, edit the file: change the front matter `status`, or check a task box. Tell the person that two agents can pick the same unit, because nothing holds a claim.

## Repo Copy

- The repo copy is on unless the project config sets `work.projection: off`. (WORK-RULE-005)
- The repo copy uses the current `docs/work/` format, file names, and templates. A teammate without a Store, and an older Make Docs version, read and edit the same files. (WORK-RULE-006)
- Make Docs removes a repo copy only when its bytes still match what sync last wrote. A changed copy is kept and reported. (WORK-RULE-007)
- With copies off, the store is the only record of that work in this checkout, and `work status` says so. (WORK-RULE-008)
- With copies off, a copy that a person changed is imported, kept in that sync, and reported. A later sync removes it, because it then matches what sync last saw. A copy that a person deleted while copies are off loses its ledger entry, so when copies go on again, sync writes the file with no conflict. (WORK-RULE-048)
- `work export --to <dir>` writes the backlog files only to a new or empty folder that the caller names. `--quick <file>` writes the quick item list only to a new file. Export never writes under `docs/work/`, `.make-docs/`, or a held path, also through a symbolic link, and it never replaces a file. An export of all of the project's work says so and gives a work digest. Any other export gives no digest. (WORK-RULE-054)

## Sync

Sync compares three things for each work file: the file's bytes, the bytes that this checkout last wrote or read (the ledger), and the store record's revision. (WORK-RULE-009)

- An edit on one side moves to the other side. A changed file with an unchanged store is imported. A changed store with an unchanged file is written when copies are on. A new file is imported. New store work with no file is written when copies are on. (WORK-RULE-009)
- When both sides changed, sync stops for that file only. It shows both sides, the affected units, and one command for each choice. Other files go on. The units of that file are not ready until a person settles it. (WORK-RULE-010)
- A file that the parser cannot read stays untouched. Sync names its path and first failing line, and never overwrites it. (WORK-RULE-011)
- Writing a file that did not change gives the same bytes, so git shows no change. (WORK-RULE-012)
- Every work command syncs first. (WORK-RULE-013)
- `work status` and `work next` change nothing. They run a read-only sync check that names each file that the next sync would import, write, or remove, and each file that waits for a person. (WORK-RULE-052)
- When a person deletes a file that the store still holds, sync stops for that file. It does not recreate the file or drop its work. (WORK-RULE-014)
- When the store no longer has the work of a file that still exists, sync stops for that file. Make Docs never deletes a shared file on its own. (WORK-RULE-035)
- After a person accepts a deletion, no checkout asks again or brings the file back. Each checkout removes its unchanged copy. (WORK-RULE-036)
- When a state that the table below calls a conflict meets a file whose bytes equal what the store would write, nothing can be lost. Sync records the file as synced, with no conflict. This also settles a recorded conflict when both sides come to hold the same work. (WORK-RULE-041)
- A work file that leaves one backlog folder and appears in another with the same coordinate, in the same sync, while the store did not change its work, is a move, such as an archive move. Its units keep their store IDs, and no deleted-file conflict is raised. (WORK-RULE-042)
- When a person removes a unit from its file, sync deletes the unit from the store and names it, but only when the unit has no claim and the store holds nothing about it that the file cannot show: a status other than its line shows (such as in progress), a met gate, a progress note, or links from other documents. Otherwise sync stops for that file as a conflict that names each unit and why. (WORK-RULE-043)
- A unit with an open factory assignment never closes or leaves the store: `work close` refuses it with `factory-assignment-open`, and sync stops a file that closes or removes it, with the message "A factory assignment is still open for <unit>. Finish or cancel it first, then sync again." The assignment changes only through the unit's claim, and closing a unit ends its claim. `--keep-store` settles that conflict; `--keep-file` and `--accept-deletion` refuse while the assignment is open. (WORK-RULE-043)
- A file edit never closes or removes a unit that has a claim, live or expired. Sync stops that file as a `claimed` conflict that names the unit, its claimant, and the claim's end time, never the claim ID. Its choices: release each claimed unit with `make-docs work release <unit>` (the holder sends its claim ID; for an expired claim, anyone sends what the check of the old task handle saw), after which the next sync imports the file; or `--keep-store`, which rewrites the file from the store. `--keep-file` is never offered. Sync never runs the handle check itself. (WORK-RULE-044)
- The project config list `work.syncHold` names work folders or files under `docs/work/` or `.make-docs/archive/work/` that a person holds. Sync reads a held path, never writes or removes it, and names each held path that it would have written or removed. A settle that would write or remove a held path, or accept its deletion, is refused. Export never writes under a held path. Never edit a held path yourself unless the person asks. (WORK-RULE-045)
- `make-docs work sync --settle <path>` with one choice settles one file's conflict. A choice that the conflict kind does not offer, a stale `--expected-revision`, or a file that is missing or changed since the report is refused, and nothing changes. (WORK-RULE-046)

### Sync Table

Read each row as: the file state, the store state, the copy setting, and what sync does. The file state compares the file with this checkout's ledger entry. The store state compares the store record with the revision in that entry. `removed` means a person accepted the file's deletion in any checkout. `any` matches every value.

| File | Store | Copies | Sync does |
| --- | --- | --- | --- |
| unreadable | any | any | Reports the first failing line, and leaves the file alone. |
| unchanged | unchanged | on | Nothing. |
| unchanged | unchanged | off | Removes the copy. |
| unchanged | changed | on | Writes the file. |
| unchanged | changed | off | Removes the copy. |
| unchanged | none | any | Conflict: `store-missing`. |
| unchanged | new | any | Conflict: `unclear`. |
| unchanged | removed | any | Removes the copy. |
| changed | unchanged | any | Imports the file. |
| changed | changed | any | Conflict: `both-changed`. |
| changed | none | any | Conflict: `store-missing`. |
| changed | new | any | Conflict: `unclear`. |
| changed | removed | any | Conflict: `file-deleted`. |
| new | none | any | Imports the file. |
| new | new | any | Conflict: `unclear`. |
| new | unchanged | any | Conflict: `unclear`. |
| new | changed | any | Conflict: `unclear`. |
| new | removed | any | Conflict: `file-deleted`. |
| missing | unchanged | on | Conflict: `file-deleted`. |
| missing | changed | on | Conflict: `file-deleted`. |
| missing | unchanged | off | Clears the ledger entry, so copies on writes the file with no conflict. |
| missing | changed | off | Clears the ledger entry, so copies on writes the file with no conflict. |
| missing | new | any | Conflict: `unclear`. |
| missing | none | any | Nothing. |
| missing | removed | any | Nothing. |
| absent | new | on | Writes the file. |
| absent | new | off | Nothing. |
| absent | none | any | Nothing. |
| absent | unchanged | any | Conflict: `unclear`. |
| absent | changed | any | Conflict: `unclear`. |
| absent | removed | any | Nothing. |

### Conflict Kinds and Settle Choices

Each settle command is `make-docs work sync --settle <path> --<choice>`.

| Conflict kind | Choices |
| --- | --- |
| `both-changed` | `keep-file`: import the file and replace the store's version. `keep-store`: rewrite the file from the store. |
| `file-deleted` | `restore`: write the file back from the store, and keep its work open. `accept-deletion`: close the file's open units as superseded, and every checkout removes its unchanged copy. Refused while a unit of the file has a live claim. |
| `store-missing` | `reimport`: import the file's work into the store again. `remove-file`: remove the file only if nobody changed it. |
| `unclear` | `keep-file` or `keep-store`, as for `both-changed`. |
| `claimed` | `make-docs work release <unit>` for each claimed unit, then sync again. Or `keep-store`: rewrite the file from the store, so the claimed unit stays open for its claim. |

Without the CLI there is no store, so there is no sync and no conflict. Edit the files.

## First Import

- The first work operation on a checkout that is bound to a usable Store imports every backlog under `docs/work/` and `.make-docs/archive/work/`. Import writes no project file, so git stays clean. (WORK-RULE-015)
- The first sync of a checkout only imports. It writes and removes no project file, even when the store holds work that the checkout's files do not show. It names each file that the next sync will write or remove. The Store records that the first sync is done, and every later sync names each file that it writes or removes. (WORK-RULE-047)
- Each recorded status maps to one status, and the unit keeps the recorded text. Matching ignores letter case. (WORK-RULE-017)

| Recorded status | Status | Close outcome |
| --- | --- | --- |
| `complete`, `completed`, `closed`, `done`, a checked box `[x]` | closed | done |
| `cancelled`, `canceled` | closed | cancelled |
| `superseded` | closed | superseded |
| `blocked` | blocked | none |
| `in-progress`, `in progress` | in progress | none |
| `draft`, `planned`, `proposed` | draft | none |
| `active`, `open`, `incomplete`, an empty box `[ ]` | open | none |
| any other text | open, and the unit waits with `status-unknown` | none |

A phase or index file with no front matter `status` has no status line. Its status is open, and the readiness section says when it counts as done.

### Dependency Bullets

A bullet in a `### Dependencies` section belongs to the stage whose heading it sits under, or to the phase when it sits before the first stage. (WORK-RULE-031)

- A bullet that names coordinates becomes one dependency for each named unit. `P` or `Phase` with a number resolves in the bullet's own revision. A bare stage or task resolves in the bullet's own phase. A task ID that an older file writes with a lower-case letter names the same task. Ranges with "to", "through", or a dash, and lists joined by commas or "and", name each unit. Status words such as "complete", "accepted", or "unlocked" do not change the match. (WORK-RULE-031)
- "None", or "parallel with" a unit, means no dependency. A bullet that is only a file path or a code span is a reference. It holds nothing. (WORK-RULE-031)
- A bullet that names no coordinate, such as "The owner approves this package.", is a gate. A bullet that names coordinates and adds a further condition, such as "The owner approved P8 Stage 1 for release.", is a gate that links those units. A gate holds its unit until a person records it as met. (WORK-RULE-031)
- A bullet that names one unit and adds only that unit's own title is a dependency, because the words only name the unit. Example: "Phase 1 trace and scope." for a phase titled "Phase 1: Trace and Scope". Compare the words without letter case, numbers, status words, and joining words. (WORK-RULE-049)
- A coordinate that matches no unit is an unresolved dependency. It stays as text on its unit and keeps that unit out of the ready list until a person fixes it. Import names each unresolved bullet. (WORK-RULE-016)

| Bullet | Result |
| --- | --- |
| `P2 is complete.` | Depends on P2 of the same revision. |
| `P1 to P3 and P5 are complete.` | Depends on P1, P2, P3, and P5. |
| `Stages 1-3.` | Depends on Stage 1, Stage 2, and Stage 3 of the same phase. |
| `T2` | Depends on T2 of the same phase, also when an older file writes the letter in lower case. |
| `P2 Stage 3 is complete.` | Depends on Stage 3 of P2. |
| `None (parallel with Stage 1).` | No dependency. |
| `` `packages/cli/src/cli.ts` `` | A reference. |
| `The owner approves this package.` | A gate. |
| `P9 is complete.`, with no P9 | Unresolved. The unit waits. |

## Units

- A unit is a wave, revision, phase, stage, task, or quick item. People use its coordinate, such as `W29 R0 P4 T3`. The store gives it a store ID that stays the same when the coordinate changes, and dependencies point to store IDs. A task may sit under a stage or directly under a phase. A task ID is an upper-case `T` and a number. (WORK-RULE-018)

## Readiness

A unit is ready when all of these are true (WORK-RULE-020):

1. Its status is open or in progress.
2. Every dependency closed as done or superseded. A dependency closed as cancelled keeps the unit waiting until a person decides.
3. Every gate is met, and it has no unresolved dependency.
4. It has no open blocker.
5. It has no claim, live or expired. An expired claim keeps the unit waiting until someone takes it over or releases it. A unit inside a unit that you hold is ready for you.
6. Its file has no unsettled sync conflict.
7. Every parent and other ancestor is open, and would be ready apart from claims.

- Look at the whole parent chain. A task in Stage 2 is not ready while Stage 2 waits for Stage 1. (WORK-RULE-032)
- A unit with draft status, or with a recorded status that the table above does not know, is never ready. Keep the recorded text and name the reason. (WORK-RULE-033)
- A wave is ready when all its revisions are closed, and each open revision is a reason that it waits. A revision never waits for its own wave. Units of archived backlogs under `.make-docs/archive/work/` never show in the lists, and they still count as dependencies. (WORK-RULE-020)
- List the ready units in dependency order, then coordinate order. Compare coordinates part by part (W, R, P, S, T), with numbers as numbers, so P10 comes after P2. Quick items come after every coordinate, by number. List every open unit that waits, with every reason and one next action for each reason. (WORK-RULE-021)
- A status line is the authority when a file has one. For older backlogs, a phase whose file has no status line, whose store status is open, whose tasks are all checked, and whose `Tasks` sections have no unchecked checkbox at any indent counts as done. It is neither ready nor waiting, it meets a dependency, and a claim on it is refused. Say so in every answer that uses this rule: `doneBy: "all-tasks-checked"`. A phase with no task, or with an unchecked task or checkbox, keeps its status. The rule changes no record or file. `make-docs project doctor check` finds such phases and proposes a status line for each. (WORK-RULE-040)
- Your answer and the CLI's answer must be the same on the same files. (WORK-RULE-027)

### Wait Reasons

Name each reason with its words, and give its next action.

| Reason | Words | Next action |
| --- | --- | --- |
| `draft` | Is a draft, so it is not approved to start. | Change its status in the file to active when it is approved. |
| `status-unknown` | Has a status that Make Docs does not know. | Change its status in the file to a known value, such as active or completed. |
| `dependency-open` | Waits for a dependency to close. | Finish or close the dependency. |
| `dependency-cancelled` | Needs a dependency that was cancelled. | Decide whether the unit still makes sense. Change the dependency in the file, or close the unit. |
| `dependency-unresolved` | Names a coordinate that no unit has. | Fix the coordinate in the file. |
| `gate-open` | Waits for a condition. | When the condition is true, record it as met with `make-docs work report`. |
| `blocked` | Is blocked. | Clear the blocker with `make-docs work report`, or remove it from the file. Clearing the last blocker reopens the unit. |
| `claimed` | Is claimed by a claimant until a time. | Wait for the claimant to finish or release it. |
| `claim-expired` | Was claimed, and the claim ended. | Check the claimant's task, then take the unit over with `make-docs work claim`, or ask a person to release it with `make-docs work release`. |
| `ancestor-claimed` | Is part of a unit that another claimant holds. | Wait for that claimant to finish or release it. |
| `ancestor-closed` | Is part of a unit that is closed. | When the unit has tasks and every one is checked: set its status line to `completed` in its file, or close it with `make-docs work close <unit> --outcome done`. Otherwise: close this unit as superseded, or reopen the ancestor by changing its status in the file. A closed index does not close its phases. |
| `ancestor-waiting` | Is part of a unit that is not ready yet. | Find why the ancestor waits, with `make-docs work next --level <kind>`. |
| `sync-conflict` | Its file has a sync conflict. | Settle the conflict with one of the commands in `make-docs work status`. |

## Claims

- A claim names the unit, the claimant, and a time limit. A unit has at most one live claim. Only one claimant can hold a unit, its parents, or its children at a time. A claim is refused when an ancestor or a descendant has a live claim of another claimant. (WORK-RULE-022)
- A claim lasts 30 minutes by default, and between 20 minutes and 24 hours from its latest renewal. The holder renews it at each check, and checks at least every 10 minutes. Renewal has no total limit. (WORK-RULE-023)
- When a claim expires, another claimant can take the unit over only after it checks the old task handle. The takeover names the previous claimant, and records what the check saw: stopped, finished, or not found. A takeover is refused while the handle shows the work still running. After a finished handle, review its result before new work starts. When the old claim has no task handle, a takeover is refused, and a person releases the claim. (WORK-RULE-023)
- `work release` lets go of a claim without closing the unit. The holder releases a live claim with its claim ID. Anyone can release an expired claim without its claim ID, after the handle check: send what the check saw, and `no-handle` for a claim with no task handle. A running task is refused. (WORK-RULE-026)
- A claim on a unit that is not ready is refused. The one exception is a takeover of an expired claim when the unit waits only on that claim. Claim and release requests carry the unit's expected version. (WORK-RULE-034)
- A claim ID works like a private key. Only the result of a new claim, a plain claim or a takeover, shows it, once. A renewal, a refusal, `work next`, `work status`, a sync conflict, and a Store check never show it. A renewal, a report, a close, and a release of a live claim must send the claim ID: naming the claimant alone renews nothing. Every caller sees the claimant, the task handle, and the claim times. Never write a claim ID into a file, a note, or a message. (WORK-RULE-050)

## Report and Close

- `work report` records a status change, a short progress note, an evidence link, cleared blockers, or met gates. A unit with a live claim changes only through its holder. Anyone can change a unit that has no live claim. A close of a unit whose claim expired, by a caller without that claim, needs the handle check above. (WORK-RULE-024)
- A unit closes as done, cancelled, or superseded, and the close releases its claim. Closing every task in a phase does not close the phase. Phase closeout keeps its own rules. (WORK-RULE-025)
- A progress note is one line of plain text of at most 256 characters. The unit keeps its latest note and its time, and a new note replaces the last. A cleared or changed blocker, a changed gate text, a met gate, a title other than a task's, and a status that the file cannot show stay in the store only. The file shows none of them, and `work report` names each one. (WORK-RULE-051)

Without the CLI, record a close in the file: check the task box, or change the front matter `status` of the phase or index file. Write no store-only data into the file.

## Tracker Connections

- A tracker connection says which of the operations next, claim, report, and close it supports. It maps the Make Docs fields `unit`, `status`, `dependencies`, `claim`, and `links` to the tracker's own field names. (WORK-RULE-028)
- The map lives in `work.tracker` in `.make-docs/config.yaml`. It names fields only. It never holds a value, a key, a token, a password, or another secret. Make Docs refuses a field name that looks like a key: a run of 32 or more letters and digits with no separator, or a name of four or more words where most words have one or two characters. A word ends at `_`, `.`, `-`, a change to upper case, or a change between letters and digits. (WORK-RULE-029)
- The local work store is the only current connection, `connection: local`. A connection for any other tracker needs its own accepted authority, and must keep this interface. (WORK-RULE-030)

The `work` block holds shared intent only:

```yaml
work:
  projection: on        # on or off. The default is on.
  syncHold:             # work folders or files that sync reads and never writes or removes
    - docs/work/2026-01-01-w1-r0-example/
  tracker:
    connection: local   # the only current connection
    fieldMap:
      status: status    # a Make Docs field and the tracker's field name
```

The `work` block never holds state: no store ID, project ID, checkout ID, claim, claim ID, task handle, digest, revision, receipt, ledger entry, lock, grant, machine path, or secret. Config validation refuses each one and names it. It compares each word of a key whole, so a key such as `author` is not read as a secret, and it reads `id` only as the last word, as in `checkoutId`.

## Quick Items

- A quick item is a task-level unit with no design, plan, or PRD. It lives only in the work store: it has no repo copy, and sync never reads or writes a file for it. `work add` gives it the next plain number of the project, such as `7`. Write it as `task 7` in human text. The number is never used twice. Without a usable Store, there are no quick items, and `work add` returns the typed Store result. (WORK-RULE-019)

## Project URIs

- `make-docs://project/<project>/tasks/` lists a project's quick items, and `make-docs://project/<project>/tasks/<n>` shows one. `<project>` is the project name or the project ID. Every project URI names its project in full. Nothing in it comes from the current folder, a target path, or a checkout, so it gives the same answer from any folder. A read changes nothing. A system resource read never opens the Store. (WORK-RULE-038)
- `make-docs://project/<project>/backlog/` lists the waves. Each further part names one coordinate part: `backlog/W29/` lists the revisions of W29, `backlog/W29/R0/` lists its phases, `backlog/W29/R0/P1/` shows a phase with its stages and tasks, and `backlog/W29/R0/P1/S2` or `backlog/W29/R0/P1/T3` shows a stage or a task. Any letter case works, and the answer names the exact form: a lower-case project name, upper-case coordinate letters, and a trailing slash on a list. Sync conflicts belong to one checkout, so a project URI read leaves them out of readiness and says so. (WORK-RULE-039)

Without a usable Store, a project URI read returns the typed Store result, and its next step says to read the project's `docs/work/` files directly. Without the CLI, read those files in a checkout of the project.

## Related

- Use `project-doctor.md` for the `phase-status-line` check, which adds a status line to an older phase whose tasks are all checked.
- Use `wave-model.md` for coordinates, and `execution-workflow.md` for writing backlogs.

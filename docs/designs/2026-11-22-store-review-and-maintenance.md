---
title: "Store Review and Maintenance"
kind: "design"
status: "draft"
coordinate: "W32 R0"
follow_on:
  route: "change-plan"
  next_prompt: "make-docs://system/prompt/designs-to-plan-change.prompt.md"
  why: "PRD 38 owns every Store table, field, record class, and retention rule. This design changes several of them, adds a project register and a maintenance command, and fixes defects in the current Store code."
  coordinate_handoff: "Recommended W32 R0 as new work, by the owner's choice on 2026-11-22 that the whole Store review closes before W29 R0 P2. W32 R0 takes Store schema v7, so the W29 work tables move to v8. The planner checks the choice under the wave-model decision procedure."
---

# Store Review and Maintenance

## Purpose

Make the global Store easy to trust. Every table has one clear purpose, a known writer, known readers, and a rule for how long its rows stay. One project register lists every project that the Store knows. A maintenance command finds bad or stale rows. It removes the ones that a fixed rule proves are safe to remove, after a backup, and it lists the rest for a person to decide.

Only Make Docs writes the Store: the CLI and the MCP server today, and a Make Docs server API if Make Docs later runs as a shared server. Any other program, including an agent's shell, can read the Store but cannot change it by accident.

This design closes register [D-062](../prd/03-open-questions-and-risk-register.md). It must close before [W29 R0 P2](../work/2026-11-21-w29-r0-work-store/02-store-schema-and-records.md) adds the work store tables.

## Context

The Store is one SQLite file, `~/.make-docs/store.db`, at schema v6. It has 17 tables. A read-only inventory of the code on 2026-11-22 and a read-only look at the maintainer machine's Store found these facts.

The data on the maintainer machine:

- The file is 35 MB, but it holds about 140 rows.
- 27 MB is two copies of one finished Skill adoption plan, `detached:` and `detached-original:` snapshots in `installation_migration_records`, at about 13.8 MB each.
- One finished operation still holds 21 steps with `applied = 0` and about 3.6 MB of saved file bytes in `installation_steps`.
- The `projects` table has 0 rows. The three projects that use Make Docs are in `installation_checkouts`. One of those rows still names the old folder of a moved project.

Tables that nothing writes or nothing reads:

- `projects` is a legacy discovery mirror. No current code writes it. `packages/cli/src/store/README.md` says the CLI apply flow fills it, but that hook is gone. Legacy import still reads it.
- `playbook_runs`, `installation_transfers`, and `store_checkpoint_journal` are legacy. No current code writes them.
- `store_schema_journal` is written by every migration, but no code reads it.
- No command lists the projects that the Store knows.

Rows that nothing ever removes:

- `installation_checkouts`, `installation_operations`, `tool_operations`, `runs`, `run_evidence`, `work_evidence`, the receipt and journal tables, and the legacy tables.
- `installation_steps` and `installation_migration_records` have only narrow deletes. Saved file bytes and plan snapshots stay after an operation ends, although [PRD 38](../prd/38-global-store-and-project-state.md) says to remove saved bytes after a terminal state.
- `backlog_review_cache` is capped at 512 rows for each checkout. Rows for old versions are never read again, but they stay until the cap pushes them out.

Crash leftovers that no code can clear:

- A dead-owner row in `installation_locks` with no pending operation.
- A pending `tool.update` or `tool.uninstall` row in `tool_operations`.
- A pending `legacy.recovery` operation.
- A pending operation on a checkout whose folder is gone.

Each of these blocks tool update, tool uninstall, and Store removal on the whole machine.

Defects and drift:

- The explicit checkpoint-9 receipt insert in `packages/cli/src/store/database.ts` writes target version 6, but the `store_migration_receipts` CHECK allows only target 5 and source 0 to 4. Normal setup does not reach this path today.
- `pruneProjectFromStore` in `packages/cli/src/store/lifecycle.ts` has no caller. It counts the remaining projects from the empty `projects` table. It deletes `playbook_runs`, which its own comment and PRD 38 R-PS-6 say it must keep. It never touches checkout-keyed tables.
- Each committed installation operation rewrites the checkout's `root_path` and verification. PRD 38 says that only the path-update rule may change them.
- `installation_operations` has no `failed` status and no failure fields, although PRD 38 R-LIFE-6 requires a failure code, a safe summary, the failed stage, and a next action.
- `work_evidence` accepts payloads of any size, but PRD 38 calls it a bounded reference.
- `installation_migration_records` has no list of kinds with a class and retention, although PRD 38 says each kind declares one.
- Code comments and the Store README describe callers, backup names, and recovery paths that no longer exist.

Nothing in the Store file stops a direct write. `store.db` is an ordinary SQLite file, mode `0644`, owned by the person's account. Any program that runs as that person, including an agent with a shell and the `sqlite3` tool, can change rows. Only the shipped instructions forbid it: `.make-docs/CLAUDE.md` says to never write directly to the Store. The per-harness access limit in `~/.make-docs/config.json` controls Make Docs commands and MCP tools only, not the file. A harness sandbox may block writes to `~/.make-docs/`, but that protection belongs to the harness, not to Make Docs.

The work store (W29) and the factory (W30) add more tables. The owner chose on 2026-11-22 to finish this whole review first, so those tables build on a Store with clear rules.

## Human Experience Intent

Impact: `direct`

Affected humans: the `user` and `maintainer` Personas, human or agent, who set up Make Docs, look at their projects, or keep their machine healthy.

Human goal or effect: a person can see every project that the Store knows and can keep the Store small and healthy without reading tables.

Experience promises:

- `make-docs project list` shows every project that the Store knows, with its name, ID, checkouts, and any checkout folder that is missing.
- `make-docs setup store check` explains in plain words what is safe to remove, what needs a decision, and how much space a cleanup frees. It changes nothing.
- `make-docs setup store clean` removes only rows that a fixed rule proves safe, after it backs up the Store. It reports what it removed, how much space it freed, and how to restore the backup.
- A crash never leaves a lock or a pending row that blocks the machine forever. The check names it, and the clean clears it when the rule proves the owner is dead.
- A program that is not Make Docs cannot change the Store by accident. Its write fails with a clear error, and its reads still work. If someone removes the guard, Make Docs says so and names the next step.

Complexity kept out of the human path:

- The person does not need to know table names, row classes, or SQLite.
- The person does not need to review each row that a fixed rule covers.
- The person does not hand-edit the Store.

Evidence required:

- A test for each row event and each fixed rule, on fixture Stores.
- A check and clean run on a copy of the maintainer machine's Store, with the space before and after.
- A Human Experience Review of `project list`, `setup store check`, and `setup store clean`.

## Performance Evidence Candidates

| Candidate | Base maintenance action | Performance applicability | Protected outcome | Decision informed | Canonical owner or next record |
| --- | --- | --- | --- | --- | --- |
| `setup store clean` with a vacuum on a Store with large saved bytes | `create` | `characterize-now` | A clean finishes in a reasonable time and the Store shrinks. | Whether the vacuum runs inside the clean or as a separate step. | The W32 plan, measured on a copy of a real Store. |

## Decision

### Rules for every table

- Each table has one purpose, a named writer set, a named reader set, a record class from PRD 38 R-MIN-1, and a retention rule. Code and the PRD 38 R-MIN rows match, and a test fails when they drift.
- Every row is in one of three classes for maintenance:
  - **keep:** current authority or durable history. Maintenance never removes it.
  - **bounded:** history with a size or count limit. Maintenance trims it to the limit.
  - **disposable:** a fixed rule proves that nothing needs it. Maintenance removes it after a backup.
- A row that no fixed rule covers is never removed without a person's decision.

### One project register

- A new table, `project_register`, holds one row for each project: project ID, project name (PRD 38 R-ID-8), first seen, and last seen. Every Store write for a project updates it.
- `installation_checkouts` stays the list of checkouts for each project.
- Every reader that needs "the projects that the Store knows" reads `project_register` and `installation_checkouts`: status, prune, project URI resolution in W29, and the new list command.
- The legacy `projects` table becomes a read-only legacy input. Legacy import still reads it. A later migration drops it once legacy import no longer needs it.
- `make-docs project list` (operation `project.register.list`, MCP `project_register_list`) reads only. It shows each project with its name, ID, checkouts, last seen time, and any checkout folder that is missing.

### Table decisions

| Table | Decision |
| --- | --- |
| `projects` | Read-only legacy input. Replaced by `project_register`. Drop in a later migration. |
| `playbook_runs`, `installation_transfers` | Keep as read-only legacy history. No writer. |
| `store_checkpoint_journal` | Disposable once a matching `store_migration_receipts` row exists. |
| `store_migration_receipts` | Keep. Widen the CHECK so a receipt can name the current target version, and fix the checkpoint-9 insert. |
| `store_schema_journal` | Keep. Store status reads it to show the schema history and to verify that no version is missing. |
| `installation_checkouts` | Keep. Only the path-update rule changes `root_path` and verification. Other commits stop rewriting them. |
| `installation_ledgers` | Keep as the current ownership record. PRD 38 changes to match: the separate target ownership record was never built. |
| `installation_operations` | Keep. Add a `failed` status and the R-LIFE-6 failure fields. After a terminal state, keep a bounded receipt (operation, status, times, step counts, and ledger digests) and remove the full before and after ledgers after the retention window. |
| `installation_steps` | Bounded. After a terminal state, remove saved file bytes, and keep path and applied state until the retention window ends. |
| `installation_migration_records` | Each kind gets a class and retention rule in code. Detached plan snapshots and atomic write intents of terminal operations are disposable. A quiescence row whose lock is gone is disposable. |
| `installation_locks` | Keep while held. A lock whose owner is proven dead and that guards no pending operation is disposable. |
| `tool_operations` | Bounded history. Keep the current harness receipt and a fixed number of older ones. A pending `tool.update` or `tool.uninstall` whose owner is proven dead becomes `failed` with reason `abandoned`, after a check that no package manager run is still active. |
| `runs`, `run_evidence`, `work_evidence` | Keep. A run left open for a long time is a decision item, not a removal. `work_evidence` payloads get a size limit with a typed refusal. |
| `backlog_review_cache` | Rows for old snapshot, rule catalog, or Skill versions are disposable. Rows for a checkout whose folder is missing are a decision item. |

### Row events

Each event that creates, updates, or removes rows has a named row list and a test that proves it: Store create and migration, setup and install apply, adoption, legacy import, checkout register, checkout move, `setup remove`, project prune, tool update and uninstall, machine harness setup, project recover, lifecycle start, change, and evidence, work evidence record, backlog cache write, and maintenance clean.

`pruneProjectFromStore` is rewritten on the project register. It removes only the rows that PRD 38 R-LIFE-2 allows, keeps `playbook_runs`, and reports the projects that remain from `project_register`. It gets a caller only through a reviewed command in a later design. This design adds none.

### Maintenance commands

- `make-docs setup store check` (operation `setup.store.check`, MCP `setup_store_check`) reads only. It reports, in plain words first:
  - the rows each fixed rule would remove, by rule, with counts and space;
  - the decision items, such as a missing checkout folder or a long-open run;
  - crash leftovers that block the machine, and why.
- `make-docs setup store clean` (operation `setup.store.clean`, MCP `setup_store_clean`):
  - backs up the Store file first, under `~/.make-docs/backup/`, and keeps the three newest backups;
  - removes only the rows that the fixed rules cover, in one transaction;
  - vacuums the file to return the space;
  - reports each rule, the rows removed, the space freed, the backup path, and how to restore it.
- `clean` needs no per-row review. The fixed rules are reviewed once, in PRD 38, and that review is the reviewed scope that PRD 38 R-MIN-4 requires. An interactive run asks once. A non-interactive run needs `--yes`.
- `clean` never removes a keep-class row, a decision item, or project content. A rule that cannot prove its condition, such as a liveness check that cannot run, skips the row and reports why.
- Both commands need the Store write permission for `clean` and the read permission for `check`, and they return the existing typed Store outcomes.

### Only Make Docs writes the Store

- Every Store table gets `BEFORE INSERT`, `BEFORE UPDATE`, and `BEFORE DELETE` triggers that call a SQL function named `make_docs_write_guard()`.
- Make Docs registers that function on every connection that it opens. Today that means the CLI and the MCP server. A later Make Docs server API uses the same connection code.
- A connection that Make Docs did not open, such as the `sqlite3` shell or another program, does not have the function. Its write fails with `no such function: make_docs_write_guard` and changes nothing. Its reads still work. A test on Node 24 `node:sqlite` on 2026-11-22 confirmed this behavior.
- Each migration installs the triggers for the tables it creates. A test fails when any table lacks its triggers. The W29 and W30 tables include them.
- When Make Docs opens the Store, it checks that every table still has its triggers with the expected SQL. A missing or changed trigger makes the Store `store-unsafe` with the reason "changed outside Make Docs". The next action names `make-docs setup store check` and the newest backup.
- `store.db` and the Store backups use file mode `0600`.
- Limit: this guard stops accidental and casual direct writes. It does not stop a program that runs as the same person and sets out to drop the triggers or register the same function. That program is detected at the next open, not blocked. Full isolation needs a separate system account or a server process that owns the file. A later shared-server design can add that.
- The shipped instructions keep the rule: agents write the Store only through `make-docs` commands or MCP tools.

### Documentation and drift

- The Store README and the code comments describe only callers, names, and paths that exist.
- PRD 38 R-MIN rows match the code after this Wave: readers, writers, classes, and retention.

### Schema version

W32 R0 takes schema v7 for `project_register`, the `failed` status and failure fields, and the widened receipt CHECK. The W29 R0 work store tables move to v8. The W29 plan, backlog, and PRD 38 and PRD 52 rows change to match.

### Order

W32 R0 runs beside W31 R0. W29 R0 P2 waits for all of W32 R0.

## Alternatives Considered

- **Fix only the project register before W29.** Rejected by the owner. W29's tables should build on a Store with clear rules.
- **Reuse the legacy `projects` table as the register.** Not chosen. Its columns are per checkout (`root_path`), legacy import still reads its old meaning, and a new table keeps the two meanings apart.
- **Review every removal by hand.** Rejected. The owner wants cleanup with little or no human review. Fixed rules reviewed once in PRD 38 give the same safety.
- **Delete stale rows with no backup.** Rejected. A backup costs little and gives a restore path.
- **Run cleanup automatically after every update.** Not chosen now. A later design can add it once the rules have run on real Stores. Check output says when a clean would help.
- **File permissions alone.** Rejected. A program that runs as the same person passes any permission check.
- **A signed digest of the whole Store after each write.** Not chosen. It detects a change but does not block it, and it costs a full read on each write.
- **A separate system account or a Store server process now.** Not chosen. It gives full isolation, but it is a large install change. A later shared-server design can add it.
- **A new top-level `store` command.** Not chosen. The CLI keeps seven top-level commands, and machine-level Store work fits under `setup`.

## Consequences

- The maintainer machine's Store drops from 35 MB to under 10 MB after one clean, mostly from the two detached plan snapshots.
- A person can see every project, and W29 can resolve project names from one register.
- Crash leftovers stop blocking tool update, uninstall, and Store removal forever.
- PRD 38 changes in many rows: R-MIN rows, R-LIFE-6, R-MIN-3, R-MIN-4, R-ID-8, and the retention of saved bytes. PRD 39 and PRD 25 gain three operations and their MCP tools. The register closes D-062.
- W29 R0 moves its tables from schema v7 to v8 and waits longer to start P2.
- Risk: a wrong fixed rule removes needed rows. The rules are narrow, each has a test, `check` shows the effect first, and `clean` backs up the Store first.
- Direct edits with the `sqlite3` tool no longer work. Repair always goes through Make Docs commands. A person who must inspect the Store can still read it.
- Risk: a Make Docs code path that opens the Store without the shared connection code cannot write. Tests cover every open path.
- Risk: dropping saved bytes and full ledgers ends some recovery paths for old operations. The rules apply only after a terminal state and the retention window.

## Design Lineage

- Update Mode: `new-doc-related`
- Prior Design Docs: [Global Store and Project State](2026-07-01-global-store-and-project-state.md), [Store-Owned Installation and Migration State](2026-09-09-store-owned-installation-and-migration-state.md), [Store Architecture Recovery](2026-09-18-store-architecture-recovery-and-platform-neutral-foundation.md), [Work Store](2026-11-21-work-store.md)
- Reason: this design reviews the Store that those designs built and sets retention and maintenance rules for it. The work store builds on the result.

## Intended Follow-On

- Route: `change-plan`
- Next Prompt: [designs-to-plan-change.prompt.md](../../.make-docs/system/prompts/designs-to-plan-change.prompt.md). Read `make-docs://system/prompt/designs-to-plan-change.prompt.md` with `make-docs resource read`.
- Why: PRD 38 owns every Store table, field, record class, and retention rule. This design changes several of them, adds a project register and a maintenance command, and fixes defects in the current Store code.
- Coordinate Handoff: Recommended W32 R0 as new work, by the owner's choice on 2026-11-22 that the whole Store review closes before W29 R0 P2. W32 R0 takes Store schema v7, so the W29 work tables move to v8. The planner checks the choice under the wave-model decision procedure.

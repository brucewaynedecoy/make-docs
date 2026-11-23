---
title: "W32 R0 P5 Real Store Proof and Acceptance Closeout"
kind: "history"
status: "completed"
date: "2026-11-23"
client: "T3 Code"
model: "Claude Opus 5.5"
coordinate: "W32 R0 P5"
repo: "make-docs"
branch: "docs/w29-w30-work-store-and-factory"
---

# W32 R0 P5 Real Store Proof and Acceptance Closeout

## Changes

Proves the Store review Wave on a copy of the maintainer machine's Store. The owner approved the copy run on 2026-11-23. Every command ran on a duplicate of a read-only copy, with `MAKE_DOCS_HOME` and `HOME` set to temporary folders. The real Store was never read or cleaned.

On the copy, a reviewed `make-docs setup --yes` converted schema 6 to schema 7 in 0.5 s, after one verified backup. `project list` showed all 4 projects and the one missing checkout folder. `setup store check` reported nothing to remove today and one decision item, because every operation is inside the 30-day retention window; it now says "38 rows wait for the 30-day window; the first can go on 2026-12-14." With the clock moved 31 days ahead, clean trimmed 38 rows (about 33.7 MB of row data) under rules 003, 004, and 005, and the file shrank from 37.9 MB to 1.2 MB (the CLI's "MB" is MiB). Its backup verified and restored every row. `sqlite3` writes failed and changed nothing, and a dropped guard trigger made Make Docs report `store-unsafe` while check still read the Store. The largest `work_evidence` payload is 0 bytes, because the copy has no such rows.

`PERF-005` is new: three clean runs, each on a fresh duplicate, took 164 to 176 ms and freed 9,395 pages each. The vacuum stays in `clean`: without it the file does not shrink, and it costs about 7 ms.

Fixes: the Store README is rewritten against the code (callers, backup names, recovery paths, tables, schemas 1 to 7, the guard and its limit). `project state status` states the guard limit (R-WRITE-GUARD-6). A `store-unsafe` refusal states its next action once. A setup name refusal has its own next action. A schema 6 Store names `make-docs setup` instead of "Restore access". The clean dry run states each line once. Store removal no longer refuses a Store that has the clean backup folder; it keeps the backups, ignores `.DS_Store` and `Thumbs.db`, and refuses a backup folder with other files in plain words. `uninstall --remove-store` says before confirmation that the backups in `<store>/backup/` stay, says "Removed the Store. Kept N backups at ..." after, and no longer says the Store is preserved when it removes it. Check and clean say how many rows wait for the 30-day window and the first date (an owner wording request). Help explains `project list --target-root` and says that people run `setup store check` and `clean` in a terminal and agents use the MCP tools. The rule 002 follow-up records that the owner kept the rule off.

Validation: 12 new tests, the catalog test, the type check, the validators, and the full suite with only known failures. An independent review asked for small changes, and all are made. The owner's Guided Progress Review passed on 2026-11-23 (option A: accept, fix the 30-day wording now, track the other two wording points), so the W32 index is `completed`. A real `setup store clean` of the owner's Store after about 2026-12-23 needs separate owner approval. Follow-ups: raw JSON for text-mode refusals, raw row keys, and the "MB" label for MiB. Register D-062 names the result and the remaining items.

## Documentation

### Project

| Path | Description |
| --- | --- |
| [P5 work](../../../docs/work/2026-11-22-w32-r0-store-review-and-maintenance/05-real-store-proof-and-acceptance.md) | Closes T1–T7 and A19–A24, holds the `PERF-005` profile and result, and records the passed Guided Progress Review. |
| [W32 index](../../../docs/work/2026-11-22-w32-r0-store-review-and-maintenance/00-index.md) | Marks the Wave completed after the owner's Guided Progress Review passed, and records the P5 scope edit. |
| [Evidence report](../../../docs/work/2026-11-22-w32-r0-store-review-and-maintenance/evidence.md) | Records the owner decisions, drift fixes, the copy run, the guard proof, the `PERF-005` run, validation, the Human Experience Review, the passed Guided Progress Review with its redacted sample, follow-ups, and limits. |
| [Open questions and risk register](../../../docs/prd/03-open-questions-and-risk-register.md) | Updates D-062 with the result and the remaining items. |

### Maintainer

| Path | Description |
| --- | --- |
| [Store README](../../../packages/cli/src/store/README.md) | Describes only callers, files, and paths that exist, with the write guard, its limit, and the maintenance commands. |

### User

None this session.

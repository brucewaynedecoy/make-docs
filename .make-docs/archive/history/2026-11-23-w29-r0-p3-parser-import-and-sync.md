---
title: "W29 R0 P3 Parser, Import, and Sync Closeout"
kind: "history"
status: "completed"
date: "2026-11-23"
client: "T3 Code"
model: "Claude Opus 5.5"
coordinate: "W29 R0 P3"
repo: "make-docs"
branch: "docs/w29-w30-work-store-and-factory"
---

# W29 R0 P3 Parser, Import, and Sync Closeout

## Changes

Adds a strict parser and writer for `docs/work/` index and phase files. The parser reads a file into a lossless document: every line with its own line ending, plus the revision or phase, its stages, and its tasks, with dependency bullets, blocker bullets, and outbound links. The writer changes only the part of a line that the store changed: a task's mark, a task's text, or a file unit's front matter `status`, and it writes `T` in each task line it changes. Parse then write gives identical bytes for all 463 work files in this repository, live and archived, including the read-only W22 R2 backlog with its lower-case `t` IDs. An unreadable file is reported with its path and first failing line and is never written. One shared task line reader now serves the backlog snapshot and the parser, and reads `t` and `T` as the same ID.

Adds first import and two-way sync. Sync compares each file with this checkout's last applied digest and the store revision of the file's units, takes the one P1 sync table decision, and applies it in one Store write session. The file unit keeps the file text as its body, so the writer renders a file from the store alone. First import of every backlog in a temporary git copy leaves `git status` clean: 463 files and 4,178 units, 784 resolved dependencies, no unresolved bullet, and 707 gates. A conflict stops only its own file, names only that file's units, shows both sides, and names one planned `make-docs work sync --settle` command for each choice. An import that would close a unit on a live claim, or delete a unit that holds what the file cannot show, stops that file as a conflict and never uses or shows a claim ID. The first sync of a checkout writes no file, and every summary names each file written or removed and each unit deleted. With copies off, sync writes no file and removes only a copy that matches its last applied digest; a changed copy is imported, kept, and removed by a later sync, and the report says so. A write hold option keeps sync from writing a held folder.

An independent review asked for changes before commit: units that left a file together could block every sync, an import closed a claimed unit with the holder's claim ID, a task that left its file was deleted silently, a second checkout's first sync wrote a file while saying no file changed, the gate note was wrong, the dependency fix-up changed waiting files, and a byte order mark crashed the writer. All are fixed with tests built from the reviewer's probes. The work was rebased on `71096981`.

A re-check review confirmed those fixes and found three more problems. The import guard checked files once, so a later file could delete a unit that a stopped earlier file needed, and every sync then failed; the check now repeats until no new file stops. A checkout with no work file, or whose copies were removed, never left its first sync; the owner chose to record each checkout's first sync in a new `work_sync_checkouts` table, added to the unreleased v8 migration because schema v7 and v8 exist only on this branch and no real Store is at v8. The table has write guard triggers, a catalog entry, a PRD 38 R-MIN row, and a place in the rollback check. A file write that the file system refused threw inside the Store session; it is now a typed file error for that file, which the next sync retries.

Validation passed: 90 new tests (A10 to A15, one fixture for each of the 31 sync table rows, the P1 dependency fixtures, and every review and re-check finding), the P1, P2, W31, backlog, and name catalog tests, the type check, the build, `validate:defaults`, the instruction router check, `project paths validate`, `project doctor check`, and the full suite with only the known failures. No public command or MCP tool was added. The owner approved on 2026-11-23, as recommended, the deletion rule, the first sync that writes no file, the later removal of a changed copy with copies off, the phase-title rule, identical sides with no conflict, and an archive move that keeps store IDs. PRD 52 now states them in R-WORK-STORE-10, R-WORK-SYNC-9, and R-WORK-SYNC-13 to R-WORK-SYNC-16, with Requirement History entries, and PRD 38 names `work_sync_checkouts`. A file edit that closes a claimed unit stays a conflict for each file until P4 T18. The owner reviews the conflict report wording. P4 gains T15 to T19, and P5 gains T9 for the new rules in the catalog and the agent form. Performance and Unassisted Goal Testing are `not-needed-now`. No obligation or scenario changed.

## Documentation

### Project

| Path | Description |
| --- | --- |
| [P3 work](../../../docs/work/2026-11-21-w29-r0-work-store/03-parser-import-and-sync.md) | Closes T1–T7 and A10–A15, awaiting owner acceptance. |
| [P4 work](../../../docs/work/2026-11-21-w29-r0-work-store/04-work-queue-operations.md) | Adds T15 to T19 from P3 and its review. |
| [P5 work](../../../docs/work/2026-11-21-w29-r0-work-store/05-agent-twin-and-config.md) | Adds T9 for the new sync rules in the catalog and the agent form. |
| [Backlog index](../../../docs/work/2026-11-21-w29-r0-work-store/00-index.md) | Records the P4 and P5 scope edits in its change history. |
| [PRD 52](../../../docs/prd/52-work-store-and-work-queue.md) | Adds R-WORK-SYNC-14 to R-WORK-SYNC-16, edits R-WORK-STORE-10, R-WORK-SYNC-9, and R-WORK-SYNC-13, and adds a Requirement History entry. |
| [PRD 38](../../../docs/prd/38-global-store-and-project-state.md) | Adds the `work_sync_checkouts` R-MIN row, names the table in R-DB-7, and adds a Requirement History entry. |
| [Evidence report](../../../docs/work/2026-11-21-w29-r0-work-store/evidence.md) | Records the parser and writer design, the round trip, the import report, the sync table fixtures, the conflict report and import guard samples, the review fixes, the owner decisions, and the limits. |

### Maintainer

| Path | Description |
| --- | --- |
| [Store README](../../../packages/cli/src/store/README.md) | Describes the seventh work store table, `work_sync_checkouts`. |

### User

None this session.

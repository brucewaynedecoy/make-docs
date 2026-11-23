---
title: "W29 R0 P4 Work Queue Operations First Pass"
kind: "history"
status: "draft"
date: "2026-11-23"
client: "T3 Code"
model: "Claude Opus 5.5"
coordinate: "W29 R0 P4"
repo: "make-docs"
branch: "t3/w29-work-queue-operations"
---

# W29 R0 P4 Work Queue Operations First Pass

## Changes

Adds the nine work queue commands under `make-docs work`: `status`, `sync`, `next`, `claim`, `release`, `report`, `close`, `export`, and `add`, with the MCP tools `work_status` to `work_add` in the `backlog` and `workflow` profiles. They share one registry core, have leaf help and JSON output, and every write needs the shared write permission and an expected version. Every write syncs first. `work status` and `work next` read only, so they run a read-only sync check that names what the next sync would do, and their text ends with "Changes nothing.". `work next` lists ready units in dependency and coordinate order and says why each other open unit waits, with one next action for each reason. Every P1 readiness, claim, and update fixture gives the P1 answer through the new code.

Builds the owner decisions of 2026-11-23. A claim ID works like a private key: only the result of a new claim shows it, a renewal must send it, and a takeover names the previous claimant; any caller releases an expired claim without its ID (T13). `setup store check` lists work claims that expired more than 7 days ago as a report-only decision item, without the claim ID (T14). `work sync --settle <path>` takes the six choices that the conflict report names (T15). Store-only edits, such as a cleared blocker or a met gate, stay in the store, survive a later import, and show in `work report`; the writer writes no byte for them (T16). A wave is ready when all its revisions are closed, and archived backlogs never show in `work next` (T17). A file edit that closes a claimed unit stays a per-file conflict, also after `--keep-file`, and `--accept-deletion` is refused while a unit has a live claim (T18). The sync hold list is `work.syncHold` in project config, and this repository holds the W22 R2 backlog with it (T19). With copies off, a copy deleted by hand loses its ledger entry, so copies on again write the file with no conflict (T20).

An independent review asked for changes before commit. Export could write into `docs/work/` and a held path (`--to .` rewrote a W22 R2 task line on a temporary copy) and could replace any file, also the project config; it now writes only to a new or empty folder or a new file, never under `docs/work/`, `.make-docs/`, or a held path, and checks the real path of each destination, so a symbolic link cannot lead there. Naming the holder's claimant showed or renewed a claim ID; now no result but a new claim's shows it. Inputs are checked before the sync, so a refusal that says "Nothing changed." is true. `work add` names no project URI until T10, `work close` names the file only when sync can write it, `--accept-deletion` is refused on a held path, and the claim and release words are fixed. The owner chose option A of register D-066: the unreleased v8 `work_units` table keeps the latest progress note and its time, and `work report --note` records it; D-066 is closed. The owner then decided the two remaining findings. A phase with no status line whose tasks are all checked counts as done for readiness, and the output says `doneBy: "all-tasks-checked"`; a status line still decides when present. On a copy of this repository `work next` lists 46 ready phases instead of 125, and names the 79 done by the fallback. A release of an expired claim, and a close of a unit whose claim expired by a caller without the claim, need the handle check, and a file edit never closes a unit with any claim. P5 T10 holds the later fix that adds status lines to older backlogs.

A re-check confirmed those fixes and found seven more, all fixed with tests built from its probes. Export refuses a protected folder in any letter case on macOS and Windows. A progress note counts as store-only data, so a unit with one never leaves its file silently. An unchecked checkbox at any indent keeps a phase with no status line open. A file edit that closes a claimed unit is now a `claimed` conflict whose choices are `work release` of each claimed unit and `--keep-store`, so it no longer loops through `--keep-file`. The expired-claim advice, the fallback claim words, and the MCP `claimant` text are fixed.

T7, T8, T10, T11, and T12 are not built in this pass: the store-backed `backlog_snapshot`, the `tasks` and `backlog` project URI reads, and the scoped work-row cleanup of a pruned project. The phase stays active.

## Documentation

### Project

| Path | Description |
| --- | --- |
| [P4 work](../../../docs/work/2026-11-21-w29-r0-work-store/04-work-queue-operations.md) | Checks T1 to T6, T9, and T13 to T20, records the review and the owner decisions, and what stays for a follow-up pass. |
| [P5 work](../../../docs/work/2026-11-21-w29-r0-work-store/05-agent-twin-and-config.md) | Adds T10: explicit status lines for older backlogs. |
| [Backlog index](../../../docs/work/2026-11-21-w29-r0-work-store/00-index.md) | Records the P4 and P5 scope edits in its change history. |
| [Evidence report](../../../docs/work/2026-11-21-w29-r0-work-store/evidence.md) | Adds the P4 section: commands, owner decisions as built, samples, acceptance cases, checks, and limits. |
| [PRD 52](../../../docs/prd/52-work-store-and-work-queue.md) | Edits R-WORK-STORE-10, R-WORK-SYNC-8, and R-WORK-QUEUE-4, -5, -7, -8, and -10; adds R-WORK-SYNC-17, R-WORK-SYNC-18, and R-WORK-QUEUE-19, fixes R-WORK-QUEUE-19 to the owner's T13 decision after the review, adds R-WORK-QUEUE-20 and the expired-claim handle check to R-WORK-QUEUE-8 and R-WORK-QUEUE-10, and adds the `claimed` conflict kind to R-WORK-SYNC-12 and R-WORK-SYNC-16, with Requirement History entries. |
| [PRD 38](../../../docs/prd/38-global-store-and-project-state.md) | Adds the expired work claim decision item to R-MAINT-4, the sync hold list to the config row, and the progress note to the work store records row, with Requirement History entries. |
| [PRD 24](../../../docs/prd/24-project-configuration-and-convention-overlay.md) | Adds `syncHold` to R-CONFIG-WORK-1, with a Requirement History entry. |
| [PRD 39](../../../docs/prd/39-cli-command-model-and-operation-registry.md) | Moves the nine work queue commands to active in R-RUN-1, with a Requirement History entry. |
| [Risk register](../../../docs/prd/03-open-questions-and-risk-register.md) | Adds and closes D-066, the progress note field (owner option A). |
| `.make-docs/config.yaml` | Holds the W22 R2 backlog with `work.syncHold` (register D-063). |

### Maintainer

| Path | Description |
| --- | --- |
| [Store README](../../../packages/cli/src/store/README.md) | Names the work queue service, the expired claim decision item, the claim ID rule, and the note columns. |

### User

None this session.

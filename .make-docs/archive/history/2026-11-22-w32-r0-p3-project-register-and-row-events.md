---
title: "W32 R0 P3 Project Register and Row Events Closeout"
kind: "history"
status: "completed"
date: "2026-11-22"
client: "T3 Code"
model: "Claude Opus 5.5"
coordinate: "W32 R0 P3"
repo: "make-docs"
branch: "docs/w29-w30-work-store-and-factory"
---

# W32 R0 P3 Project Register and Row Events Closeout

## Changes

Fills `project_register` from each Store write for a project. One function records the project ID, the `projectName` from `.make-docs/config.yaml`, and the first and last seen times, inside the write's own transaction. The writers are the start and commit of every installation operation (setup, install apply, adoption, `setup remove`, and recover), detached operation preparation, a new checkout binding, migration records, legacy import, checkout register, checkout move, backlog cache write, work evidence record, and every lifecycle write. Legacy identity adoption removes the temporary project ID's register row.

A `projectName` uses lower-case letters, digits, and hyphens, starts with a letter, has at most 64 characters, and does not look like a project ID. Config validation and the Store write both refuse a wrong form. A name that another project holds is refused at the start of a write, before any row or project file changes, and the message names that project's ID and checkout path. A project ID that is another project's name is refused the same way. A commit or a recovery never stops on a name: it keeps the stored name, and a recovery reports the clash, so a rollback or a resume always finishes. A changed name replaces the old one at the next write, and a removed name is cleared.

Project prune now removes only the project's `run_evidence`, `runs`, and `work_evidence` rows, and its register row once no checkout of it is bound. It keeps `playbook_runs` and the legacy `projects` table, and counts the remaining projects from `project_register`. It still has no caller.

Adds `make-docs project list` (operation `project.register.list`, MCP `project_list`, profiles `core` and `all`). It reads only, shows each project by name first, then its ID, last seen time, and checkouts, and says in plain words when a checkout folder is missing. The CLI and MCP results match. An absent Store gives `store-unavailable` through the CLI and `store-denied` through MCP, and an unsafe or unconfigured Store gives the usual typed outcome. The name catalog marks it current.

Fixes the P2 follow-up about exact `root_path` comparisons. Pending path claims leave out the checkout's own work by checkout ID. Lock lookups, the machine setup work check, and the setup ledger prediction compare by the platform comparison key and treat doubt as the same folder, which only blocks work. Recovery deletes a dead lock only when it matches by the platform key, and stops on doubt.

Validation passed: 30 new tests, including one for each row event of the design, the updated prune, tool-list, and name-catalog tests, the type check, and the full suite with only the 3 known failures and one load timeout that passes alone. Mutation runs show that the tests catch the old path comparisons, a commit that refuses a name, and a recovery that deletes a doubtful lock. An independent review's findings were fixed in the same phase. Without a backfill, another project can take a project's config name until that project writes again. Setup proposing the folder name stays with W29 R0 P5 T8. The owner reviews the decisions in the evidence report and runs `make-docs project list` on this machine's projects as the Guided Progress Review. Performance Testing and Unassisted Goal Testing are `not-needed-now`. No obligation or scenario changed.

## Documentation

### Project

| Path | Description |
| --- | --- |
| [P3 work](../../../docs/work/2026-11-22-w32-r0-store-review-and-maintenance/03-project-register-and-row-events.md) | Closes T1–T6 and A11–A14, awaiting owner review and the Guided Progress Review. |
| [Evidence report](../../../docs/work/2026-11-22-w32-r0-store-review-and-maintenance/evidence.md) | Records the register writers, each row event and its rows, name refusal, prune, `project list`, the path comparison fix, decisions, and limits. |

### Maintainer

None this session.

### User

None this session.

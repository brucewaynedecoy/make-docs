---
title: "W32 R0 P3 Project Register and Row Events"
kind: "plan"
status: "draft"
coordinate: "W32 R0 P3"
source:
  type: "design"
  path: "docs/designs/2026-11-22-store-review-and-maintenance.md"
---

# W32 R0 P3 Project Register and Row Events

## Purpose

Fill the project register from every row event, prove each event, and let a person list the projects.

## Outcome

Every Store write for a project updates `project_register`. Each row event has a test that names its rows. `make-docs project list` shows every project.

## Scope

- Update `project_register` at each Store write for a project: setup, adoption, legacy import, checkout register, checkout move, backlog cache write, and work evidence record.
- Record the `projectName` from config under PRD 38 R-ID-8, and refuse a name that another project holds.
- Add a test for each row event in the design that names the rows it creates, updates, or removes.
- Rewrite `pruneProjectFromStore` on the project register. It removes only what PRD 38 R-LIFE-2 allows, keeps `playbook_runs`, and counts the remaining projects from `project_register`. It gets no new caller in this Wave.
- Add `project.register.list` (`make-docs project list`, MCP `project_register_list`) in `core` and `all`. It reads only. It shows each project with its name, ID, checkouts, last seen time, and missing checkout folders.
- Keep the legacy `projects` table as a read-only legacy input.

## Exclusions

- No row removal. P4 owns maintenance.

## Acceptance

- Each row event touches only its named rows.
- `project list` CLI and MCP results match, and the list shows a missing checkout folder in plain words.
- Two projects cannot hold the same name.

## Dependencies

- P2.

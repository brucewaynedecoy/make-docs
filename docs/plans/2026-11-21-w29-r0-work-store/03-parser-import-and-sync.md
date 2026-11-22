---
title: "W29 R0 P3 Parser, Import, and Sync"
kind: "plan"
status: "draft"
coordinate: "W29 R0 P3"
source:
  type: "design"
  path: "docs/designs/2026-11-21-work-store.md"
---

# W29 R0 P3 Parser, Import, and Sync

## Purpose

Connect the store and the `docs/work/` files without losing an edit on either side.

## Outcome

A strict parser and writer round-trip today's work files byte for byte. First import fills the store with no file change. Two-way sync follows the P1 sync table and stops on a conflict for only the affected units.

## Scope

- Build a parser for the current work index and phase format, including frontmatter, tasks, acceptance criteria, dependencies, blockers, closeout, and links.
- Build a writer that renders the same bytes from the store for any file the store did not change.
- Leave a file that does not parse untouched. Report it with its path and the first failing line.
- Build first import for `docs/work/` and its archive. Report each imported record, each resolved dependency, and each unresolved bullet.
- Build two-way sync for each sync table row. Record the last applied digest after each write or import.
- Build the conflict report: both sides, the affected units, and one settle command for each choice (keep the file, keep the store).
- Respect the `work.projection` setting. With copies off, write no file and remove a copy only when its bytes match the last applied digest.

## Exclusions

- No public operation surface. P4 owns that.
- No change to the work templates or file names.

## Acceptance

- Round trip passes on every current backlog in this repo.
- First import on a clean checkout leaves `git status` clean.
- Each sync table row has a passing fixture.
- A conflict in one phase file does not block units in other files.

## Dependencies

- P1 and P2.

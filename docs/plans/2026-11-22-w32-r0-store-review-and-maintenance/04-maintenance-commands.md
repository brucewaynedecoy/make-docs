---
title: "W32 R0 P4 Maintenance Commands"
kind: "plan"
status: "draft"
coordinate: "W32 R0 P4"
source:
  type: "design"
  path: "docs/designs/2026-11-22-store-review-and-maintenance.md"
---

# W32 R0 P4 Maintenance Commands

## Purpose

Let a person keep the Store small and healthy with two commands.

## Outcome

`make-docs setup store check` and `make-docs setup store clean` exist with CLI and MCP parity. Each fixed rule from P1 runs in `clean`.

## Scope

- Add `setup.store.check` (`make-docs setup store check`, MCP `setup_store_check`) in `setup` and `all`. It reads only. It reports, in plain words first, the rows each rule would remove with counts and space, the decision items, and each crash leftover that blocks the machine and why.
- Add `setup.store.clean` (`make-docs setup store clean`, MCP `setup_store_clean`) in `setup` and `all`:
  - back up the Store under `~/.make-docs/backup/` and keep the three newest backups;
  - remove only the rows that the fixed rules cover, in one transaction;
  - vacuum the file;
  - report each rule, the rows removed, the space freed, the backup path, and how to restore it.
- An interactive run asks once. A non-interactive run needs `--yes`.
- A rule that cannot prove its condition skips the row and reports why.
- Use the existing Store write permission and typed Store outcomes.

## Exclusions

- No automatic cleanup after update.
- No removal of a keep-class row, a decision item, or project content.

## Acceptance

- `check` writes nothing, and its CLI and MCP results match.
- Each rule removes only its rows on fixtures and skips rows it cannot prove.
- The backup restores the Store exactly, and only three backups remain.
- Each blocking crash leftover from P1 is cleared when its owner is proven dead.

## Dependencies

- P1 and P2. It can run beside P3.

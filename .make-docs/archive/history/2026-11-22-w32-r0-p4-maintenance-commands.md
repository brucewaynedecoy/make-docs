---
title: "W32 R0 P4 Maintenance Commands Closeout"
kind: "history"
status: "completed"
date: "2026-11-22"
client: "T3 Code"
model: "Claude Opus 5.5"
coordinate: "W32 R0 P4"
repo: "make-docs"
branch: "docs/w29-w30-work-store-and-factory"
---

# W32 R0 P4 Maintenance Commands Closeout

## Changes

Adds `make-docs setup store check` (MCP `setup_store_check`) and `make-docs setup store clean` (MCP `setup_store_clean`) in the `setup` group and the `setup` and `all` MCP profiles. Both run the fixed rules of the Store table catalog. A rule acts on a row only when every proof passes, keeps the row when a proof fails, and skips it with a reason when a proof cannot be decided.

Check reads only. It starts with one plain line: the rows and space that clean would remove, the skipped rows, the items that need a decision, and the crash leftovers that block this computer. Then it lists each rule with its rows and skip reasons, each decision item with its next step, and each leftover with what it blocks and what clears it. It opens the Store read only with the guard check off, so it also reports a Store that was changed outside Make Docs, and it writes nothing.

Clean needs the Store write permission and one confirmation: an interactive run asks once, and a non-interactive run needs `--yes`. It backs up the Store under `~/.make-docs/backup/` with a `VACUUM INTO` copy under a partial name, verifies it, and names it `store-clean-*.db` only after the clean commits. Every failure deletes the partial file. Only verified clean backups count toward the three that it keeps and toward the newest backup that error messages name. It takes the backup again when another command commits before the write lock, so the backup is the exact start state, and it checks the schema version and the guard again inside the transaction. A busy Store gives a typed, retryable result. It changes rows in one transaction, each with a compare-and-change statement after the rule runs again, then vacuums and reports each rule, the rows changed, the space freed, the backup path, and the restore steps. It refuses a Store that was changed outside Make Docs. Restoring by the reported steps gives the Store back exactly.

Rules 004 (full ledgers, after their receipt columns) and 005 (finished plans and write intents) are now on. Rule 005 runs first, so one clean can trim an operation completely. Rule 009 keeps the current receipt plus 10 older receipts; the current receipt's own history copy and observations take no kept slot. The package-manager-idle check for rule 002 is built: it examines every word of every process line and counts any process that names the manager or the make-docs package, including Homebrew's `brew.rb` and `brew.sh` and changed process titles. Rule 002 stays off until the owner approves it. Rule 006 stays off. A dead-owner lock with no unfinished change is cleared, and then tool update, uninstall, and Store removal work again.

Validation passed: 54 new tests, the updated catalog, name catalog, and P2 tests, the type check, and the full suite with only the known failures. An independent review asked for six fixes, and all six are made with a test each. The tests cover each P1 fixture, an exact restore, backup rotation, compare-and-change, the real layout readers, a real setup with CLI and MCP parity, and setup after removal. The owner reviews the check and clean wording, the rule 002 approval, and the other decisions in the evidence report. Performance is `not-needed-now` in P4 (`PERF-005` in P5). No obligation or scenario changed.

## Documentation

### Project

| Path | Description |
| --- | --- |
| [P4 work](../../../docs/work/2026-11-22-w32-r0-store-review-and-maintenance/04-maintenance-commands.md) | Closes T1–T6 and A15–A18, awaiting owner review. |
| [Evidence report](../../../docs/work/2026-11-22-w32-r0-store-review-and-maintenance/evidence.md) | Records the P4 commands, rule activation, check and clean proof, the review fixes, sample output, changed tests, decisions, and limits. |

### Maintainer

None this session.

### User

None this session.

# CLI Help, Backup, and Uninstall — Implementation Plan

## Purpose

Implement the new CLI lifecycle surface designed in [2026-04-18-cli-help-backup-and-uninstall.md](../../designs/2026-04-18-cli-help-backup-and-uninstall.md). This is **Wave 7 Revision 0** (`w7-r0`): a new baseline wave that expands `make-docs` beyond install/update with a clearer help system, a shared audit engine, a non-destructive `backup` command, and a safety-first `uninstall` command.

## Objective

- Top-level and command-specific `--help` output become structured, readable, and explicit about commands, flags, and examples.
- A shared audit engine defines the exact managed files and prunable directories for both `backup` and `uninstall`.
- `make-docs backup` copies the audited file set into deterministic `.backup/` roots without deleting originals.
- `make-docs uninstall` removes only audited leaves, prunes only emptied parent directories, preserves modified `AGENTS.md` and `CLAUDE.md`, and supports `--backup` plus `--yes` for prompt skipping.
- Final validation proves the audit is conservative, same-day backup naming is correct, and destructive flows never remove unmanaged files or `.backup/` contents.

## Phase Map

| File | Purpose |
| ---- | ------- |
| `01-help-and-command-surface.md` | Restructure top-level and command-specific help output, add the new `backup` and `uninstall` command surfaces, and define their flag parsing contracts. |
| `02-shared-audit-engine.md` | Implement the manifest-first audit engine, conservative fallback rules, root instruction file fingerprint checks, and directory-pruning classification. |
| `03-backup-command.md` | Add the non-destructive backup flow, backup destination planning, same-day backup sequencing, and formatted audit/result output for backup mode. |
| `04-uninstall-command.md` | Add the destructive uninstall flow, warning/confirmation UX, optional pre-removal backup execution, and audited leaf-first removal behavior. |
| `05-tests-and-validation.md` | Add targeted regression coverage, end-to-end lifecycle validation, and manual verification for help, backup, uninstall, and shared audit safety. |

## Dependencies

- Phase 1 has no dependencies.
- Phase 2 has no dependencies. Phases 1 and 2 can run in parallel.
- Phase 3 depends on Phases 1 and 2 because backup needs its public command surface and the shared audit contract.
- Phase 4 depends on Phases 1, 2, and 3 because uninstall reuses the command surface, the shared audit engine, and the backup path/flow contract for `--backup`.
- Phase 5 depends on all prior phases.

## Validation

1. `make-docs --help`, `make-docs init --help`, `make-docs update --help`, `make-docs backup --help`, and `make-docs uninstall --help` render the new grouped help structure with accurate commands, flags, and examples.
2. Automated tests cover manifest-first audit behavior, conservative manifest-missing fallback, modified versus unmodified root instruction files, same-day backup directory sequencing, `--yes` prompt skipping, and uninstall preservation of unmanaged files.
3. Manual lifecycle validation in a temp target confirms `backup` copies the exact audited file set, `uninstall --backup` reuses one audit before backup and removal, and `.backup/` contents are never selected for deletion.
4. Full CLI validation passes after all phases complete.

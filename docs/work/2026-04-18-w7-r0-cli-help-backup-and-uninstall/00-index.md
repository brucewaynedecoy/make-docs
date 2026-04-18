# CLI Help, Backup, and Uninstall — Work Backlog

> See `docs/.references/wave-model.md` for W/R semantics.

## Purpose

This backlog tracks execution of the new CLI lifecycle wave for clearer help, shared audit-driven ownership, non-destructive backup, and safety-first uninstall. It derives from [the `w7-r0` plan](../../plans/2026-04-18-w7-r0-cli-help-backup-and-uninstall/00-overview.md) and the originating [design](../../designs/2026-04-18-cli-help-backup-and-uninstall.md).

## Phase Map

| File | Purpose |
| --- | --- |
| [01-help-and-command-surface.md](./01-help-and-command-surface.md) | Add `backup` and `uninstall` command surfaces and replace the flat help output with structured top-level and command-specific help. |
| [02-shared-audit-engine.md](./02-shared-audit-engine.md) | Build the manifest-first audit engine, fallback ownership rules, root-instruction exact-match checks, and prune classification. |
| [03-backup-command.md](./03-backup-command.md) | Implement the non-destructive backup flow, same-day backup sequencing, `_home` mapping, and backup audit/result rendering. |
| [04-uninstall-command.md](./04-uninstall-command.md) | Implement the destructive uninstall flow, two-step confirmation UX, optional pre-removal backup, and audited leaf-first removal. |
| [05-tests-and-validation.md](./05-tests-and-validation.md) | Add lifecycle regression coverage, smoke-pack validation, and manual dogfood verification for the final shipped behavior. |

## Usage Notes

- Phase 1 and Phase 2 are intentionally disjoint and can run in parallel.
- Phase 3 depends on Phases 1 and 2.
- Phase 4 depends on Phases 1, 2, and 3.
- Phase 5 depends on all prior phases and should remain a dedicated validation/fixup pass rather than being folded into feature phases.
- Preserve the delegated write-scope split from the plan: command/help surface, audit engine, backup flow, uninstall flow, and final validation should remain separate ownership areas.
- Keep phase files dependency-ordered.

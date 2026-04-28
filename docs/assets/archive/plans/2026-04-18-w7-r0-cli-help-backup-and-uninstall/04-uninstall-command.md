# Phase 4 — Uninstall Command

## Objective

Implement `make-docs uninstall` as a safety-first destructive command that consumes the shared audit results from earlier phases, presents a two-step confirmation flow, optionally creates a backup from the same audit snapshot, and removes only the audited leaf files plus now-empty parent directories.

## Depends On

- [2026-04-18-cli-help-backup-and-uninstall.md](../../designs/2026-04-18-cli-help-backup-and-uninstall.md)
- Phases 1--3 of this plan:
  - help/command-surface scaffolding must exist
  - the shared audit engine and audit result types must already be implemented
  - the standalone backup executor must already support running from a precomputed audit result

This phase must consume audit results; it must not redesign or re-author the shared audit engine itself.

## Files to Modify

| File | Change Summary |
| ---- | -------------- |
| `packages/cli/src/cli.ts` | Add `uninstall` command routing, parse `--backup`, `--yes`, `--target`, and `--help`, and dispatch into the uninstall executor. |
| `packages/cli/src/uninstall.ts` | Add the uninstall orchestration flow: warning panel, audit consumption, audit-summary rendering, optional backup execution, destructive removal, and final outcome reporting. |
| `packages/cli/src/backup.ts` | Accept a precomputed audit result and resolved backup destination so `uninstall --backup` can reuse the same audit instead of recomputing ownership. |
| `packages/cli/src/utils.ts` | Reuse or minimally extend leaf-removal and prune-empty-directory helpers where needed for deterministic, safe uninstall ordering. |

## Detailed Changes

### 1. Add the `uninstall` CLI surface

Extend the CLI command model so `make-docs uninstall` is a first-class top-level command.

Command contract:

- `make-docs uninstall --target <dir>`
- `make-docs uninstall --backup --target <dir>`
- `make-docs uninstall --yes --target <dir>`
- `make-docs uninstall --help`

Behavioral requirements:

- Omitting `--yes` keeps interactive confirmation prompts enabled.
- `--yes` suppresses interactive confirmation prompts only; it does not suppress the warning or audit summaries.
- `--help` for `uninstall` must show the command purpose, the destructive nature of the command, `--backup`, `--yes`, and `--target`.
- `cli.ts` should remain a thin dispatcher. Destructive flow logic belongs in `uninstall.ts`.

### 2. Implement the uninstall review flow around one audit result

`uninstall.ts` should orchestrate the full destructive flow in this order:

1. print an initial warning panel before execution continues
2. run or load the shared audit once
3. print a detailed audit summary showing:
   - files scheduled for removal
   - directories eligible for pruning
   - preserved or skipped paths that will remain
4. print a final irreversible-action confirmation
5. perform backup first when `--backup` is set
6. perform uninstall removal using the same audit result

Prompt semantics:

- By default, the user must explicitly approve the warning step and the final removal step.
- With `--yes`, both prompts are skipped, but both summaries are still shown.
- If the user cancels at either confirmation point, uninstall exits cleanly without modifying files.

Warning-message requirements:

- When `--backup` is **not** present, the first warning must explicitly suggest:
  - `make-docs backup`
  - `make-docs uninstall --backup`
- When `--backup` **is** present, the first warning must instead describe the exact backup directory that will be created before removal begins.

### 3. Execute `uninstall --backup` from a single audit snapshot

The combined flow must not re-run ownership discovery between backup and deletion.

Implementation requirements:

- The uninstall executor requests one audit result from the shared audit engine.
- The backup destination is resolved once from the same execution context and displayed in the warning/audit output.
- The audit result is passed directly into the backup executor.
- If backup succeeds, uninstall continues into deletion.
- If backup fails, uninstall stops immediately and performs no removals.

This phase may add a narrow `backup.ts` entry point such as “execute backup from audited paths,” but it should not change the audit rules themselves.

### 4. Remove audited leaves first, then prune empty directories

Removal semantics must follow the audit instead of re-discovering ownership during delete:

- remove only file paths explicitly marked for removal by the audit
- never delete preserved or skipped paths
- after leaf deletion, prune only the directories the audit marked as eligible
- stop pruning as soon as any remaining non-removed child exists
- never remove or descend into `.backup/`

Project-root instruction files:

- `AGENTS.md` and `CLAUDE.md` should only be removed when the audit marked them as exact generated-content matches
- if either file was preserved by the audit, uninstall must leave it untouched and must not treat that as an error

Manifest behavior:

- successful uninstall should remove the manifest file and prune `docs/.make-docs/` only if it becomes empty
- manifest-missing fallback behavior is owned by the audit phase, not by uninstall execution

### 5. Report outcome clearly and fail safely

The uninstall executor should end with a concise terminal summary that distinguishes:

- files removed
- directories pruned
- paths preserved
- whether a backup was created first

Failure rules:

- if the audit cannot run, exit non-zero and do nothing
- if backup fails in `uninstall --backup`, exit non-zero and do not remove anything
- if deletion fails partway through, exit non-zero and report that the uninstall was partial
- partial-delete handling should never trigger cleanup of `.backup/` or preserved paths

## Parallelism

- `cli.ts` command parsing/help wiring can be implemented independently first.
- `backup.ts` can be given the small precomputed-audit hook in parallel with `uninstall.ts`, as long as the audit result contract is already fixed by earlier phases.
- The destructive-flow orchestration in `uninstall.ts` depends on the final audit result shape from Phase 2 and the backup execution API from Phase 3.

This phase should not overlap with shared audit authoring or standalone backup auditing logic.

## Acceptance Criteria

- [ ] `make-docs uninstall` is a recognized top-level command
- [ ] `make-docs uninstall --help` documents `--backup`, `--yes`, and `--target`
- [ ] Omitting `--yes` defaults to interactive confirmation
- [ ] `--yes` skips prompts but still prints warning and audit summaries
- [ ] The initial uninstall warning suggests `make-docs backup` and `make-docs uninstall --backup` when `--backup` is not set
- [ ] `make-docs uninstall --backup` runs one audit, shows the exact backup destination, then backs up and removes from the same audit result
- [ ] Backup failure during `make-docs uninstall --backup` aborts removal
- [ ] Uninstall removes only audited file leaves and prunes only audited directories that become empty
- [ ] Preserved/skipped paths remain untouched, including modified `AGENTS.md` or `CLAUDE.md`
- [ ] `.backup/` is never removed or traversed as an uninstall target
- [ ] Successful uninstall removes the make-docs manifest and any now-empty managed directories

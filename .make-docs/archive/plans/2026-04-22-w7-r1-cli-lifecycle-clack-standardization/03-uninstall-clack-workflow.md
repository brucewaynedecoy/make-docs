# Phase 3 - Uninstall Clack Workflow

## Objective

Route `make-docs uninstall` through the lifecycle renderer so destructive warnings, audit review, final confirmation, backup-before-remove status, cancellation, completion, and partial-failure states use the same Clack-backed interaction model as the rest of the CLI.

## Depends On

- [2026-04-22-cli-lifecycle-clack-standardization.md](../../designs/2026-04-22-cli-lifecycle-clack-standardization.md)
- Phase 1 renderer boundary.
- Phase 2 shared backup renderer refinements, if any.
- Existing uninstall behavior in `packages/cli/src/uninstall.ts`.
- Existing uninstall coverage in `packages/cli/tests/uninstall.test.ts` and lifecycle coverage in `packages/cli/tests/lifecycle.test.ts`.

## Files to Modify

| File | Change Summary |
| ---- | -------------- |
| `packages/cli/src/uninstall.ts` | Inject or obtain the lifecycle renderer and route uninstall workflow states through it. |
| `packages/cli/src/lifecycle-ui.ts` | Add uninstall-specific renderer methods or payload shapes if Phase 1 did not already cover them. |
| `packages/cli/tests/uninstall.test.ts` | Update uninstall tests to assert renderer routing and preserve destructive-flow behavior. |
| `packages/cli/tests/lifecycle.test.ts` | Add shared assertions for warning, final confirmation, completion, and failure rendering. |

## Detailed Changes

### 1. Render the initial uninstall warning through Clack

The initial warning should remain the first user-facing uninstall checkpoint.

When `--backup` is not present, the warning must still suggest:

- `make-docs backup`
- `make-docs uninstall --backup`

When `--backup` is present, the warning must show that a backup will be created first and include the exact destination when it is known.

### 2. Render uninstall audit review through the lifecycle renderer

The audit review should include:

- operation: uninstall
- target directory
- backup-before-removal state
- files to remove
- directories to prune
- preserved paths
- skipped paths
- totals for each group

This phase must not change which paths are removable, prunable, preserved, or skipped.

### 3. Route final confirmation and cancellation through the renderer

The final confirmation should retain the current destructive wording:

- remove-only mode states that removal cannot be undone
- backup-then-remove mode states that backup is created first and then audited paths are removed

Required behavior:

- interactive mode asks at the warning checkpoint and final checkpoint
- `--yes` skips both prompts but still renders warning, audit review, and completion output
- non-TTY interactive mode still fails with guidance to rerun with `make-docs uninstall --yes`
- cancellation at either checkpoint exits cleanly without modifying files

### 4. Render success and partial failure through Clack

Completion output should include:

- removed file count
- pruned directory count
- preserved path count
- skipped path count
- backup status

Partial-failure output should include:

- files removed before failure
- directories pruned before failure
- preserved and skipped counts
- backup status
- error message

Do not trigger any additional cleanup from the renderer. It should report state, not mutate filesystem behavior.

### 5. Keep uninstall semantics stable

Do not change these behaviors:

- uninstall uses one audit result
- `uninstall --backup` backs up from the same audit result before removal
- backup failure aborts removal
- deletion removes only audited leaves
- pruning stops at non-empty directories
- preserved and skipped paths remain untouched
- `.backup/` is never removed or traversed as an uninstall target

## Parallelism

Uninstall call-site conversion can proceed after Phase 1. If Phase 2 has already refined shared completion or grouped-review rendering, reuse those primitives instead of adding uninstall-only formatting.

## Acceptance Criteria

- [ ] Uninstall warning uses the lifecycle renderer.
- [ ] Uninstall audit review uses the lifecycle renderer.
- [ ] Final destructive confirmation uses the lifecycle renderer.
- [ ] Cancellation at warning or final confirmation renders through the lifecycle renderer and does not modify files.
- [ ] `--yes` skips prompts while preserving warning, audit review, and completion output.
- [ ] `uninstall --backup` still uses one audit result for backup and removal.
- [ ] Success and partial-failure summaries use the lifecycle renderer.
- [ ] Existing uninstall safety tests continue to pass.

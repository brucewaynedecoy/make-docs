# Phase 2 - Backup Clack Workflow

## Objective

Route `make-docs backup` through the lifecycle renderer so backup audit review, confirmation, noop, cancellation, and completion states use the same Clack-backed interaction model as the rest of the CLI.

## Depends On

- [2026-04-22-cli-lifecycle-clack-standardization.md](../../designs/2026-04-22-cli-lifecycle-clack-standardization.md)
- Phase 1 renderer boundary.
- Existing backup behavior in `packages/cli/src/backup.ts`.
- Existing backup coverage in `packages/cli/tests/backup.test.ts` and lifecycle coverage in `packages/cli/tests/lifecycle.test.ts`.

## Files to Modify

| File | Change Summary |
| ---- | -------------- |
| `packages/cli/src/backup.ts` | Inject or obtain the lifecycle renderer and route backup workflow states through it. |
| `packages/cli/src/lifecycle-ui.ts` | Add backup-specific renderer methods or payload shapes if Phase 1 did not already cover them. |
| `packages/cli/tests/backup.test.ts` | Update backup tests to assert renderer routing and preserve behavioral coverage. |
| `packages/cli/tests/lifecycle.test.ts` | Add shared lifecycle assertions if backup and uninstall use common renderer paths. |

## Detailed Changes

### 1. Render backup review through the lifecycle renderer

`runBackupCommand` should continue to prepare one audit result and one destination plan, then pass that data into the renderer for review.

The review should include:

- operation: backup
- target directory
- destination directory or no-op state
- files to copy
- directories to materialize
- retained paths
- skipped paths
- totals for each group

This phase must not change which audit entries are copyable or materializable.

### 2. Route confirmation through the same renderer

Backup confirmation should remain one prompt after the review and before copying.

Required behavior:

- interactive mode asks whether to create the backup
- `--yes` skips the prompt
- non-TTY interactive mode still fails with guidance to rerun with `make-docs backup --yes`
- cancellation exits without creating a backup destination or copying files

The renderer should own the prompt copy and cancellation output.

### 3. Render backup noop and completion states through Clack

Backup noop and completion output should stop using direct stdout as the production surface.

Noop output should make clear that no make-docs-managed files required backup and no new `.backup/` destination was created.

Completion output should include:

- backup destination
- copied file count
- materialized directory count
- retained path count surfaced in review
- skipped path count surfaced in review

### 4. Keep backup semantics stable

Do not change these behaviors:

- audit runs once
- empty audits do not create a backup destination
- destination naming and same-day ordinal promotion stay unchanged
- project-relative and `_home/` layouts stay unchanged
- `.backup/` contents are never audited or copied

## Parallelism

Backup call-site conversion and backup test updates can proceed together after Phase 1 defines the renderer contract. Avoid changing uninstall in this phase except for shared lifecycle renderer refinements that are already covered by Phase 1.

## Acceptance Criteria

- [ ] Backup audit review uses the lifecycle renderer.
- [ ] Backup confirmation uses the lifecycle renderer.
- [ ] Backup cancellation uses the lifecycle renderer and does not modify files.
- [ ] Backup noop uses the lifecycle renderer and does not create a destination.
- [ ] Backup completion uses the lifecycle renderer.
- [ ] `--yes` skips backup confirmation while preserving review and completion output.
- [ ] Existing backup destination, layout, and audit-once tests continue to pass.

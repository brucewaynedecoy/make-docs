# Phase 4 - Tests and Validation

## Objective

Add semantic test coverage for lifecycle Clack standardization and run the final validation pass across build, automated tests, and package smoke checks.

## Depends On

- Phase 1 renderer boundary.
- Phase 2 backup Clack workflow conversion.
- Phase 3 uninstall Clack workflow conversion.

## Files to Modify

| File | Change Summary |
| ---- | -------------- |
| `packages/cli/tests/lifecycle.test.ts` | Add shared renderer contract coverage for warning, audit, confirmation, cancellation, success, and failure states. |
| `packages/cli/tests/backup.test.ts` | Assert backup routes through the renderer while preserving audit, copy, noop, and destination behavior. |
| `packages/cli/tests/uninstall.test.ts` | Assert uninstall routes through the renderer while preserving warning, audit, backup-before-remove, removal, cancellation, and partial-failure behavior. |
| `packages/cli/tests/cli.test.ts` | Add CLI-level coverage only if command dispatch or non-TTY behavior changes shape. |
| `README.md` or docs guides | Refresh lifecycle output examples only if the implementation changes documented examples. |

## Detailed Changes

### 1. Add renderer routing coverage

Tests should assert semantic lifecycle events rather than exact decorative output.

Recommended event coverage:

- workflow starts with the expected command label
- audit review is rendered before confirmation
- confirmation is skipped only when `permissions` is `allow-all`
- cancellation renders the expected cancellation state
- completion renders copied, removed, pruned, preserved, and skipped counts where applicable
- partial failure renders the error message and partial mutation counts

### 2. Preserve behavior regression coverage

Existing backup and uninstall behavior remains in scope for this validation phase.

Backup checks should continue to cover:

- audit-once behavior
- empty audit no-op behavior
- backup destination naming
- project-relative and `_home/` layouts
- `.backup/` exclusion
- `--yes` prompt skipping

Uninstall checks should continue to cover:

- warning and final confirmation checkpoints
- cancellation before mutation
- `uninstall --backup` single-audit behavior
- backup failure aborting removal
- audited leaf removal
- safe directory pruning
- preserved and skipped paths remaining untouched
- `.backup/` exclusion

### 3. Avoid brittle snapshots

Do not snapshot full Clack output unless the repo already has a stable helper for that purpose.

Prefer tests that inspect:

- renderer method calls
- semantic labels
- operation modes
- counts
- safety messages
- ordering of review, confirmation, execution, and completion events

### 4. Run final validation

Run the standard CLI validation commands:

```sh
npm run build -w make-docs
npm test -w make-docs
node scripts/smoke-pack.mjs
```

If any command fails for an environmental reason, record the exact blocker and the narrower tests that did pass.

## Parallelism

Renderer unit tests can be written after Phase 1. Backup and uninstall integration tests should wait for Phases 2 and 3 respectively. Final validation runs after all implementation phases are complete.

## Acceptance Criteria

- [ ] Lifecycle renderer tests prove production flows use Clack-backed lifecycle rendering.
- [ ] Backup tests cover review, prompt skipping, cancellation, noop, success, and unchanged backup semantics.
- [ ] Uninstall tests cover warning, audit review, prompt skipping, cancellation, success, partial failure, and unchanged uninstall semantics.
- [ ] No tests rely on raw box-drawing or fixed decorative Clack output where semantic assertions are sufficient.
- [ ] `npm run build -w make-docs` passes.
- [ ] `npm test -w make-docs` passes.
- [ ] `node scripts/smoke-pack.mjs` passes.

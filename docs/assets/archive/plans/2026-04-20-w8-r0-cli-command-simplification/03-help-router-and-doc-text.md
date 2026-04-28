# Phase 3 — Help, Router, and Documentation Text

## Objective

Update all user-facing command guidance so users and agents see the simplified command vocabulary: apply/sync with bare `make-docs`, selection changes with `make-docs reconfigure`, and unchanged lifecycle commands.

## Depends On

- [2026-04-20-cli-command-simplification.md](../../designs/2026-04-20-cli-command-simplification.md)
- Phase 1 command grammar and Phase 2 behavior decisions.

## Files to Modify

| File | Change Summary |
| ---- | -------------- |
| `packages/cli/src/cli.ts` | Rewrite top-level and command-specific help for bare apply/sync, `reconfigure`, `backup`, and `uninstall`. |
| `packages/cli/src/renderers.ts` | Replace generated guidance that references `npx make-docs update --reconfigure`. |
| `docs/` planning and guide docs as needed | Update active project docs that would otherwise direct future agents to removed commands. |

## Detailed Changes

### 1. Rewrite top-level help around user intent

Top-level help should teach four actions:

- apply/sync: `make-docs [options]`
- change selections: `make-docs reconfigure [options]`
- back up managed files: `make-docs backup [options]`
- uninstall managed files: `make-docs uninstall [options]`

Examples should avoid `init`, `update`, and `--reconfigure`.

### 2. Add `reconfigure --help`

`make-docs reconfigure --help` should document:

- existing manifest requirement
- interactive wizard behavior
- non-interactive selection flag behavior
- `--yes` requirement tradeoff
- content, harness, template, reference, and skill selection flags

### 3. Remove stale generated guidance

Generated router text should no longer tell users to run:

- `npx make-docs update --reconfigure`

The replacement guidance should be:

- `npx make-docs reconfigure`

If the guidance is specifically about enabling a capability, include the relevant flag only when that flag is already known and supported.

### 4. Update project docs that drive future work

Update docs created in this wave so future agents do not reintroduce removed commands. Historical docs may keep references when they are clearly describing prior behavior, but active design, plan, work, and agent-guide closeout docs for this change should use the simplified model.

## Acceptance Criteria

- [ ] `make-docs --help` documents bare apply/sync, `reconfigure`, `backup`, and `uninstall`.
- [ ] `make-docs reconfigure --help` documents selection-change behavior.
- [ ] Help examples contain no `make-docs init`, `make-docs update`, or `--reconfigure`.
- [ ] Generated router text contains no `npx make-docs update --reconfigure` guidance.
- [ ] Active project docs for this wave use the new command vocabulary.

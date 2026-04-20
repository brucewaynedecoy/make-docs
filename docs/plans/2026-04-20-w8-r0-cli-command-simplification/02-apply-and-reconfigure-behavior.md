# Phase 2 — Apply and Reconfigure Behavior

## Objective

Implement the semantics behind the simplified command model without changing the underlying install planner more than necessary. Bare `starter-docs` applies desired state, while `starter-docs reconfigure` explicitly changes the saved install footprint.

## Depends On

- [2026-04-20-cli-command-simplification.md](../../designs/2026-04-20-cli-command-simplification.md)
- Phase 1 command grammar from this plan.
- Existing manifest loading, selection resolution, wizard, install planning, and install application behavior in `packages/cli/src/`.

## Files to Modify

| File | Change Summary |
| ---- | -------------- |
| `packages/cli/src/cli.ts` | Rework command inference and selection resolution so bare apply/sync and explicit reconfigure have distinct behavior. |
| `packages/cli/tests/cli.test.ts` | Add behavior coverage for first install, existing-install sync, desired-state selection flags, and reconfigure modes. |

## Detailed Changes

### 1. Bare `starter-docs` applies desired state

When no manifest exists, bare `starter-docs` should install using default selections plus any selection flags.

When a manifest exists and no selection flags are present, bare `starter-docs` should sync using the saved manifest selections. It should not ask whether the user wants update versus reconfigure.

When a manifest exists and selection flags are present, bare `starter-docs` should treat those flags as desired state, update the saved selections, and apply the resulting plan.

### 2. `starter-docs reconfigure` changes selections

`starter-docs reconfigure` requires an existing manifest. If no manifest exists, it should fail with guidance to run `starter-docs` first.

Interactive `starter-docs reconfigure` should open the selection wizard with current manifest selections.

Non-interactive `starter-docs reconfigure --yes` should require at least one selection flag. Without selection flags it should fail because there is no wizard input to define the change.

### 3. Preserve existing planner safety behavior

The existing install planner and apply confirmation behavior should remain the foundation:

- `--dry-run` still shows planned changes without writing.
- `--yes` still skips interactive prompts for apply/reconfigure flows where enough command-line input exists.
- Instruction-conflict handling should remain unchanged except for command labels and guidance.

### 4. Keep lifecycle behavior isolated

`backup` and `uninstall` should continue dispatching to their existing executors. This phase must not change audit, backup, uninstall, warning, or lifecycle prompt behavior.

## Acceptance Criteria

- [ ] Bare `starter-docs --yes` installs when no manifest exists.
- [ ] Bare `starter-docs --yes` syncs existing manifest selections when a manifest exists.
- [ ] Bare `starter-docs --yes --no-skills` updates saved selections on an existing install and applies the resulting state.
- [ ] `starter-docs reconfigure` opens the wizard from current manifest selections.
- [ ] `starter-docs reconfigure --yes --no-skills` updates saved selections and applies the resulting state.
- [ ] `starter-docs reconfigure --yes` without selection flags fails clearly.
- [ ] `starter-docs reconfigure` without a manifest fails with guidance to run `starter-docs` first.
- [ ] `backup --yes` and `uninstall --yes` still behave as before.

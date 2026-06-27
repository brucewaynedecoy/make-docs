# P3 Selected-Agentics Uninstall Pruning

## Goal

Remove empty managed selected-agentics directories after selected-skill removal or uninstall without deleting user or ambiguous content.

## Implementation Targets

- `packages/cli/src/audit.ts`
- `packages/cli/src/uninstall.ts`
- `packages/cli/src/skill-catalog.ts`
- `packages/cli/src/install.ts`
- `packages/cli/src/skills-command.ts`
- `packages/cli/tests/audit.test.ts`
- `packages/cli/tests/uninstall.test.ts`
- `packages/cli/tests/install.test.ts`
- `packages/cli/tests/skill-catalog.test.ts`
- `scripts/smoke-pack.mjs`

## Requirements

- Audit must classify empty managed `.make-docs/agentics/skills/<skill-name>/`, `.make-docs/agentics/skills/`, and `.make-docs/agentics/` directories as prunable only after their managed descendants are removed.
- The same rule applies to the home-scoped `.make-docs/agentics/**` tree for global selected skills.
- Pruning must not follow symlink targets.
- Pruning must preserve any directory containing unmanaged files, modified managed files, wrong-target symlinks, ambiguous legacy stubs, unreviewed copy mirrors, plugin payloads, manifests, config, or other future agentics content.
- Removing one selected skill must not prune sibling selected skill or plugin directories.

## Acceptance Criteria

- Removing the only selected project-scope skill removes the empty project `.make-docs/agentics/**` parent directories.
- Removing one of multiple selected skills leaves the shared parent directories and sibling skill intact.
- Removing a global selected skill prunes only empty managed home-scoped agentics directories.
- User-authored files under `.make-docs/agentics/**` force preservation or review instead of deletion.
- Native harness symlink exposures are unlinked without following canonical payload targets.

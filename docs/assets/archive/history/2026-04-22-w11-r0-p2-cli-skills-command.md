---
date: "2026-04-22"
coordinate: "W11 R0 P2"
repo: "make-docs"
branch: "main"
status: "complete"
summary: "Implemented the `make-docs skills` sync and removal planner/apply path with manifest-safe skill tracking."
---

# CLI Skills Command - Phase 2 Skills-Only Planner and Apply

## Changes

Implemented Phase 2 of the Wave 11 CLI skills command work, framed by [the Phase 2 plan](../archive/plans/2026-04-21-w11-r0-cli-skills-command/02-skills-only-planner-and-apply.md) and [the Phase 2 backlog](../archive/work/2026-04-21-w11-r0-cli-skills-command/02-skills-only-planner-and-apply.md). This phase replaces the Phase 1 placeholder with a real skills-only command runner, adds sync and removal planning that operates only on skill assets, preserves non-skill manifest state, and adds CLI and installer coverage for first-time sync, stale cleanup, removal mode, and manifest compatibility.

| Area | Summary |
| --- | --- |
| Command runner | [`packages/cli/src/skills-command.ts`](../../../packages/cli/src/skills-command.ts) loads the existing manifest, resolves skills-only selections, prints a skills-focused plan, prompts or honors `--yes`, applies the plan, and reports staged conflicts. |
| CLI dispatch | [`packages/cli/src/cli.ts`](../../../packages/cli/src/cli.ts) now loads the real skills command runner for `make-docs skills` while preserving the test override boundary introduced in Phase 1. |
| Skills-only planner | [`packages/cli/src/planner.ts`](../../../packages/cli/src/planner.ts) adds `createSkillsOnlyInstallPlan`, which builds desired state from skill assets only, plans create/update/noop actions, removes stale manifest-tracked skill files, and conflict-stages modified skill files instead of overwriting them. |
| Apply path | [`packages/cli/src/install.ts`](../../../packages/cli/src/install.ts) adds `planSkillsOnlyInstall` and `applySkillsOnlyInstallPlan`, reusing the existing apply primitives while keeping skills-only tracking in `skillFiles` so non-skill manifest `files` entries are preserved. |
| CLI tests | [`packages/cli/tests/cli.test.ts`](../../../packages/cli/tests/cli.test.ts) covers skills removal dispatch through the real command boundary, including operation without an existing manifest. |
| Installer tests | [`packages/cli/tests/install.test.ts`](../../../packages/cli/tests/install.test.ts) covers non-skill manifest preservation, optional skill cleanup, tracked skill removal, unrelated file preservation, and modified managed skill-file preservation. |
| Backlog closeout | [Phase 1](../archive/work/2026-04-21-w11-r0-cli-skills-command/01-command-surface-and-help.md) and [Phase 2](../archive/work/2026-04-21-w11-r0-cli-skills-command/02-skills-only-planner-and-apply.md) backlog acceptance criteria were marked complete after implementation verification. |
| Verification | `npm run build`, targeted CLI/install tests, `git diff --check`, and `npm test` passed during Phase 2 verification. |
| Commit | Phase 2 implementation and backlog closeout were committed as `c626824` with subject `feat: [W11 R0 P2] CLI skills command - Skills-only planner and apply`. |

## Documentation

### Project

| Path | Description |
| --- | --- |
| [docs/.assets/history/2026-04-22-w11-r0-p2-cli-skills-command.md](2026-04-22-w11-r0-p2-cli-skills-command.md) | History record for Wave 11 Phase 2 skills-only planner and apply implementation. |
| [docs/assets/archive/work/2026-04-21-w11-r0-cli-skills-command/01-command-surface-and-help.md](../archive/work/2026-04-21-w11-r0-cli-skills-command/01-command-surface-and-help.md) | Phase 1 work backlog with acceptance criteria marked complete. |
| [docs/assets/archive/work/2026-04-21-w11-r0-cli-skills-command/02-skills-only-planner-and-apply.md](../archive/work/2026-04-21-w11-r0-cli-skills-command/02-skills-only-planner-and-apply.md) | Phase 2 work backlog with acceptance criteria marked complete. |

### Developer

None this session.

### User

None this session.

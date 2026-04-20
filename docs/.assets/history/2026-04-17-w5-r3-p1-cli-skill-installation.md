---
date: "2026-04-17"
coordinate: "W5 R3 P1"
---

# Phase 1: CLI Skill Installation R3 — Grouped Default and Optional Skill Selection

## Changes

Completed `w5-r3` Phase 1 by fixing the wizard screen that previously treated optional skills as effectively required. The CLI now shows all installable skills in one grouped step, keeps required skills visible as selected read-only defaults, and allows the user to continue without choosing any optional skills.

| Area | Summary |
| --- | --- |
| [packages/cli/src/skill-catalog.ts](../../../packages/cli/src/skill-catalog.ts) | Added a wizard-facing grouped skill helper that derives deterministic `defaultSkills` and `optionalSkills` directly from the current remote registry model. This kept the change scoped to presentation state and avoided any registry, planner, or manifest redesign. |
| [packages/cli/src/wizard.ts](../../../packages/cli/src/wizard.ts) | Reworked the options step so it builds grouped skill-selection state, retitles the prompt to `Which skills should be installed?`, renders required skills under `Default` as selected read-only rows, renders optional skills under `Optional` as selectable rows, and skips the selection prompt entirely when no optional skills exist. Persisted behavior remains unchanged: only optional ids are stored in `optionalSkills`. |
| [packages/cli/tests/skill-catalog.test.ts](../../../packages/cli/tests/skill-catalog.test.ts) | Added coverage proving the registry is projected into the expected default-vs-optional grouping for the wizard. |
| [packages/cli/tests/wizard.test.ts](../../../packages/cli/tests/wizard.test.ts) | Added regression coverage for grouped skill-selection state, the no-optional skip path, and the required-only continuation path where `archive-docs` alone still counts as a valid answer. |
| Validation | Verified with `npm run build -w starter-docs`, `npm test -w starter-docs`, and a live `npm run dev -w starter-docs -- init --dry-run --target /tmp/...` PTY run. The live wizard displayed `archive-docs` under `Default`, `decompose-codebase` under `Optional`, and advanced immediately when `Enter` was pressed with no optional skill selected. |

### Notes

- The important boundary in this phase was to fix the user interaction without changing the shipped `w5-r2` install semantics. Required skills are still auto-installed by the installer; this phase only changed how that reality is represented in the wizard.
- The implementation stayed on the existing custom-rendered `MultiSelectPrompt` path rather than introducing a broader registry or CLI-surface refactor. That kept the write set small and let the tests focus on the exact regression.
- The review summary remains intentionally unchanged in meaning: `Optional skills: required only` is still the correct downstream state when no optional ids are chosen.

## Documentation

### Project

| Path | Description |
| --- | --- |
| [docs/work/2026-04-17-w5-r3-cli-skill-installation/01-skill-selection-default-and-optional-groups.md](../../work/2026-04-17-w5-r3-cli-skill-installation/01-skill-selection-default-and-optional-groups.md) | Active phase backlog that defined the grouped default-and-optional skill-selection implementation completed in this session. |
| [docs/plans/2026-04-17-w5-r3-cli-skill-installation/01-skill-selection-default-and-optional-groups.md](../../plans/2026-04-17-w5-r3-cli-skill-installation/01-skill-selection-default-and-optional-groups.md) | Phase plan for the narrow wizard UX fix and its validation scope. |
| [docs/designs/2026-04-17-cli-skill-selection-default-and-optional-groups.md](../../designs/2026-04-17-cli-skill-selection-default-and-optional-groups.md) | Design source for the grouped skill-selection screen, required/default read-only behavior, and required-only submit semantics. |

### Developer

None this session.

### User

None this session.

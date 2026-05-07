---
date: "2026-05-07"
client: "Codex Desktop"
repo: "make-docs"
branch: "main"
status: "completed"
summary: "Added the implement-wave skill, mirrored it into agent skill roots, and registered it for CLI installation."
---

# Implement Wave Skill

## Changes

Added a packaged `implement-wave` skill for driving `docs/work/` waves or phases from backlog resolution through implementation, validation, closeout, and phase commit drafting. The change registered the skill in the CLI skill registry, installed matching `.agents/skills` and `.claude/skills` mirrors, and extended registry, install, wizard, UI, and mirror-parity tests so the new skill is selectable and its referenced assets remain bundled.

| Area | Summary |
| --- | --- |
| Packaged skill | Added `packages/skills/implement-wave/` with the skill entrypoint, workflow reference, helper scripts, OpenAI agent prompt, and helper-script tests. |
| Dogfood mirrors | Added `.agents/skills/implement-wave/` and `.claude/skills/implement-wave/` with the installable mapped file set aligned to the package copy. |
| CLI skill registry | Added `implement-wave` to `packages/cli/skill-registry.json` with referenced workflow, agent prompt, and helper-script assets. |
| Tests | Updated CLI, installer, skill catalog, registry, skills UI, wizard, and mirror-parity coverage for the new selectable skill. |

### Gap Decisions

No novel gaps were found. The active PRD risk register at [docs/prd/03-open-questions-and-risk-register.md](../../prd/03-open-questions-and-risk-register.md) already covers broader skills-delivery and skills-authoring questions, and this closeout did not discover a new open question, confirmed drift item, rebuild risk, or unresolved blocker requiring a register update.

### Validation

Validation commands run:

```text
git diff --check
python3 packages/skills/implement-wave/scripts/test_implement_wave_helpers.py
npm test -w make-docs -- consistency install skill-catalog skill-registry
npm run build -w make-docs
```

The Python helper tests passed 5 tests. The targeted Vitest run passed 5 files and 100 tests, including the uninstall tests matched by the `install` filter. The package build completed successfully.

Post-validation index refreshes:

```text
jdocmunch index_local /Users/tylerkneisly/Developer/Source/Tyler/Projects/make-docs
jcodemunch index_folder /Users/tylerkneisly/Developer/Source/Tyler/Projects/make-docs
```

Commit-message drafting used [docs/assets/references/commit-message-convention.md](../references/commit-message-convention.md) and recent commit history. No W/R/P coordinate applies because this was general skill and CLI registry maintenance rather than a single work backlog phase.

## Documentation

### Project

| Path | Description |
| --- | --- |
| [packages/skills/implement-wave](../../../packages/skills/implement-wave) | Packaged implementation-wave skill added with workflow guidance, helper scripts, agent prompt, and helper tests. |
| [.agents/skills/implement-wave](../../../.agents/skills/implement-wave) | Codex skill mirror added for the installable mapped file set. |
| [.claude/skills/implement-wave](../../../.claude/skills/implement-wave) | Claude skill mirror added for the installable mapped file set. |
| [packages/cli/skill-registry.json](../../../packages/cli/skill-registry.json) | CLI skill registry updated so `implement-wave` is selectable and installable. |
| [packages/cli/tests](../../../packages/cli/tests) | Focused CLI, installer, catalog, registry, UI, wizard, and consistency tests updated for the new skill. |
| [docs/assets/history/2026-05-07-implement-wave-skill.md](./2026-05-07-implement-wave-skill.md) | Closeout breadcrumb for this skill and registry maintenance set. |

### Developer

None this session.

### User

None this session.

---
client: "Codex Desktop"
date: "2026-05-12"
repo: "make-docs"
status: "completed"
summary: "Added the work-on-phase skill, registered it for CLI installation, and updated skills authoring guidance."
---

# Work On Phase Skill

## Changes

Added a packaged `work-on-phase` skill for implementing exactly one explicit `docs/work/` phase. The skill reuses the work-on-wave helper model where practical, but its copied resolver rejects wave-only coordinates and work-directory targets so agents must ask for a concrete phase instead of selecting the next incomplete phase.

| Area | Change |
| --- | --- |
| Packaged skill | Added `packages/skills/work-on-phase/` with the skill entrypoint, phase workflow reference, OpenAI metadata, helper scripts, and phase-only helper tests. |
| Dogfood mirrors | Added `.agents/skills/work-on-phase/` and `.claude/skills/work-on-phase/` with the installable mapped file set aligned to the package copy. |
| CLI registry and tests | Registered `work-on-phase` in `packages/cli/skill-registry.json` and updated registry, catalog, install, consistency, wizard, skills UI, CLI, and smoke-pack expectations. |
| Risk register | Closed the skills-authoring guidance gap after expanding `packages/skills/README.md` with the package, registry, mirror, and validation workflow. |

Validation run:

```bash
python3 -B packages/skills/work-on-wave/scripts/test_work_on_wave_helpers.py
python3 -B packages/skills/work-on-phase/scripts/test_work_on_phase_helpers.py
npm test -w make-docs -- skill-registry skill-catalog install consistency
npm test -w make-docs -- wizard skills-ui cli
npm run build -w make-docs
npm run smoke:pack
git diff --check
```

## Documentation

### Project

| Path | Description |
| --- | --- |
| [packages/skills/work-on-phase](../../../../packages/skills/work-on-phase) | New package-shipped single-phase implementation skill. |
| .agents/skills/work-on-phase | Codex dogfood mirror for the installable mapped file set. |
| .claude/skills/work-on-phase | Claude dogfood mirror for the installable mapped file set. |
| [packages/skills/README.md](../../../../packages/skills/README.md) | New maintainer guidance for adding package-shipped skills. |
| [docs/prd/03-open-questions-and-risk-register.md](../../../prd/03-open-questions-and-risk-register.md) | Closed the skills-authoring guidance drift item. |

### Developer

None this session.

### User

None this session.

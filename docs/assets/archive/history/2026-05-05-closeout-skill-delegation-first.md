---
date: "2026-05-05"
client: "Codex Desktop"
repo: "make-docs"
branch: "main"
status: "completed"
summary: "Added delegation-first coordinator and worker guidance to the closeout and archive skills."
---

# Closeout Skill Delegation First

## Changes

Added delegation-first instructions to the packaged `archive-docs`, `closeout-commit`, and `closeout-phase` skills and kept the `.agents/skills` and `.claude/skills` mirrors aligned. The new guidance tells primary agents to spawn a worker before broad repo inspection when the harness supports delegation, defines the minimal worker prompt for each workflow, and makes the worker responsible for the skill-specific discovery, validation, approval, and summary outputs.

```text
make-docs/
├── packages/skills/archive-docs/SKILL.md
├── packages/skills/closeout-commit/SKILL.md
├── packages/skills/closeout-phase/SKILL.md
├── .agents/skills/archive-docs/SKILL.md
├── .agents/skills/closeout-commit/SKILL.md
├── .agents/skills/closeout-phase/SKILL.md
├── .claude/skills/archive-docs/SKILL.md
├── .claude/skills/closeout-commit/SKILL.md
└── .claude/skills/closeout-phase/SKILL.md
```

### Gap Decisions

No novel gaps were found. The change set clarifies delegation behavior for existing skills and does not introduce a new PRD open question, confirmed drift item, or rebuild risk.

### Validation

Validation commands run:

```text
scripts/check-instruction-routers.sh
git diff --check
diff -u packages/skills/archive-docs/SKILL.md .agents/skills/archive-docs/SKILL.md
diff -u packages/skills/archive-docs/SKILL.md .claude/skills/archive-docs/SKILL.md
diff -u packages/skills/closeout-commit/SKILL.md .agents/skills/closeout-commit/SKILL.md
diff -u packages/skills/closeout-commit/SKILL.md .claude/skills/closeout-commit/SKILL.md
diff -u packages/skills/closeout-phase/SKILL.md .agents/skills/closeout-phase/SKILL.md
diff -u packages/skills/closeout-phase/SKILL.md .claude/skills/closeout-phase/SKILL.md
```

Post-edit index refreshes:

```text
jdocmunch index_local packages/skills
jdocmunch index_local .agents/skills
jdocmunch index_local .claude/skills
```

Commit-message drafting used [docs/assets/references/commit-message-convention.md](../../../../.make-docs/contracts/system/commit-message-convention.md). No W/R/P coordinate applies because this was skill workflow maintenance rather than a single work backlog phase.

## Documentation

### Project

| Path | Description |
| --- | --- |
| [packages/skills/archive-docs/SKILL.md](../../../../packages/skills/archive-docs/SKILL.md) | Packaged archive skill now includes delegation-first coordinator and worker guidance. |
| [packages/skills/closeout-commit/SKILL.md](../../../../packages/skills/closeout-commit/SKILL.md) | Packaged commit-closeout skill now includes delegation-first coordinator and worker guidance. |
| [packages/skills/closeout-phase/SKILL.md](../../../../packages/skills/closeout-phase/SKILL.md) | Packaged phase-closeout skill now includes delegation-first coordinator and worker guidance. |
| .agents/skills | Codex skill mirrors aligned with the packaged skill changes. |
| .claude/skills | Claude skill mirrors aligned with the packaged skill changes. |
| [docs/assets/history/2026-05-05-closeout-skill-delegation-first.md](./2026-05-05-closeout-skill-delegation-first.md) | Closeout breadcrumb for this delegation-first skill maintenance. |

### Developer

None this session.

### User

None this session.

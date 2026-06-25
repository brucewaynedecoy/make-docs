---
date: "2026-05-04"
client: "Codex Desktop"
repo: "make-docs"
status: "completed"
summary: "Added closeout workflow skills and wired them into CLI skill installation."
---

# Closeout Workflow Skills

## Changes

Added package-shipped `closeout-phase` and `closeout-commit` workflow skills, wired both into the CLI skill registry and default selected-skill install surface, refreshed dogfood mirrors for `.agents` and `.claude`, and extended registry, catalog, install, wizard, skills UI, CLI, and consistency tests around their installable asset surfaces.

```text
make-docs/
├── packages/skills/
│   ├── closeout-commit/
│   └── closeout-phase/
├── .agents/skills/
│   ├── closeout-commit/
│   └── closeout-phase/
├── .claude/skills/
│   ├── closeout-commit/
│   └── closeout-phase/
├── packages/cli/skill-registry.json
├── packages/cli/tests/
└── .make-docs/manifest.json
```

| Area | Summary |
| --- | --- |
| Phase closeout skill | Added a deterministic workflow for closing completed work backlog phases, including acceptance-criteria verification, developer-guide decision gates, gap capture, history entries, and commit-message drafting. |
| Commit closeout skill | Added a general workflow for closing uncommitted changes with status/diff inspection, novel-gap detection, mandatory history entries, and draft-only commit messages. |
| CLI skill registry | Added both closeout skills as package-shipped, default-selectable registry entries with OpenAI metadata and workflow reference assets. |
| Dogfood mirrors | Added `.agents` and `.claude` mirrors for both new skills and updated the local make-docs manifest to track them. |
| Tests | Updated registry, catalog, install, wizard, skills UI, CLI, and consistency tests so default installs and selected-skill asset planning include the new skills. |

### Gap Decisions

No novel gaps were found. The active PRD risk register at [docs/prd/03-open-questions-and-risk-register.md](../../prd/03-open-questions-and-risk-register.md) already covers adjacent skill delivery, dogfood freshness, duplicated path knowledge, and remote skill source concerns, so this closeout did not update the register.

### Validation

Focused validation passed for the closeout skill changes:

```text
npm test -w make-docs -- skill-registry skill-catalog install consistency wizard skills-ui cli
npm run build -w make-docs
git diff --check
jdocmunch index_local docs/
jcodemunch index_folder .
```

Earlier validation for the `closeout-phase` slice also passed the focused registry, catalog, install, consistency, build, diff-check, and index refresh steps. A full package test run attempted during that slice still had pre-existing environment-sensitive backup/lifecycle failures caused by globally installed home-scope skill files; those failures were outside this closeout change set.

Commit-message drafting used [docs/assets/references/commit-message-convention.md](../references/commit-message-convention.md). No W/R/P coordinate applies because these skills were added as general package-shipped workflows rather than a single work backlog phase.

## Documentation

### Project

| Path | Description |
| --- | --- |
| [packages/skills/closeout-phase/SKILL.md](../../../packages/skills/closeout-phase/SKILL.md) | Phase closeout skill trigger metadata and high-level workflow. |
| [packages/skills/closeout-phase/references/closeout-workflow.md](../../../packages/skills/closeout-phase/references/closeout-workflow.md) | Deterministic phase closeout gates for acceptance criteria, guides, gaps, history, and commit-message drafts. |
| [packages/skills/closeout-commit/SKILL.md](../../../packages/skills/closeout-commit/SKILL.md) | Commit closeout skill trigger metadata and high-level workflow. |
| [packages/skills/closeout-commit/references/closeout-commit-workflow.md](../../../packages/skills/closeout-commit/references/closeout-commit-workflow.md) | Deterministic commit closeout gates for change discovery, gap capture, history entries, convention resolution, and draft-only commit messages. |
| [packages/cli/skill-registry.json](../../../packages/cli/skill-registry.json) | Registry entries and asset lists for both closeout skills. |
| [.make-docs/manifest.json](../../../.make-docs/manifest.json) | Dogfood manifest selection and managed-file tracking for the new skill mirrors. |
| [packages/cli/tests](../../../packages/cli/tests) | Focused test coverage for registry names, catalog assets, default installs, wizard/UI selection behavior, CLI validation, and dogfood mirror consistency. |
| [docs/assets/history/2026-05-04-closeout-workflow-skills.md](./2026-05-04-closeout-workflow-skills.md) | Closeout breadcrumb for the new package-shipped closeout skills. |

### Developer

None this session.

### User

None this session.

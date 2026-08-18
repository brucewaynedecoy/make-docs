---
date: "2026-05-06"
client: "Codex Desktop"
repo: "make-docs"
branch: "main"
status: "completed"
summary: "Added fast-path probe, validation, and history helpers for closeout skills."
---

# Closeout Fast-Path Helpers

## Changes

Added fast-path helper scripts to the packaged `closeout-commit` and `closeout-phase` skills, wired those scripts into the skill workflows before broad manual repository analysis, registered them as installable skill assets, and kept the `.agents/skills` and `.claude/skills` mirrors aligned. The closeout helpers now summarize changed files, repo contracts, candidate coordinates, risk-register IDs, validation commands, guide candidates, work-phase task state, and history skeletons so future workers can start from compact JSON before opening broad diffs or docs.

| Area | Summary |
| --- | --- |
| Commit closeout skill | Added `closeout_probe.py`, `closeout_validate.py`, `closeout_history.py`, and helper tests; updated the workflow to require probe-first discovery and helper-selected validation. |
| Phase closeout skill | Added the shared closeout helpers plus `work_phase_state.py`, `guide_coverage_probe.py`, and helper tests; updated the workflow to use phase, change-set, and guide probes before manual reads. |
| CLI skill registry | Added the helper scripts to the `closeout-commit` and `closeout-phase` registry asset lists so installed skills include their referenced fast-path scripts. |
| Dogfood mirrors | Added the script directories under `.agents/skills` and `.claude/skills` and kept mirrored skill instructions and references aligned with the packaged skills. |
| Tests | Extended registry, install, and consistency coverage so referenced helper scripts are installed, mirrored, and shared consistently across closeout skills. |

### Gap Decisions

No novel gaps were found. The active PRD risk register at [docs/prd/03-open-questions-and-risk-register.md](../../../prd/03-open-questions-and-risk-register.md) exists, but this closeout did not discover a new open question, confirmed drift item, rebuild risk, or unresolved blocker requiring a register update.

### Validation

Validation commands run:

```text
python3 -B packages/skills/closeout-phase/scripts/test_closeout_helpers.py
python3 -B packages/skills/closeout-commit/scripts/test_closeout_helpers.py
git diff --check
npm test -w make-docs -- consistency install skill-catalog skill-registry
npm run build -w make-docs
```

The Python helper tests passed with 3 `closeout-phase` tests and 7 `closeout-commit` tests. The targeted Vitest run passed 5 files and 95 tests, including the uninstall tests matched by the `install` filter. The package build completed successfully.

Post-validation index refreshes:

```text
jdocmunch index_local /Users/tylerkneisly/Developer/Source/Tyler/Projects/make-docs
jcodemunch index_folder /Users/tylerkneisly/Developer/Source/Tyler/Projects/make-docs
```

Commit-message drafting used [docs/assets/references/commit-message-convention.md](../../../../.make-docs/contracts/system/commit-message-convention.md) and inspected the aligned shipped-template copy at [packages/docs/template/.make-docs/contracts/system/commit-message-convention.md](../../../../packages/docs/template/.make-docs/contracts/system/commit-message-convention.md). No W/R/P coordinate applies because this was general skill workflow and CLI registry maintenance rather than a single work backlog phase.

## Documentation

### Project

| Path | Description |
| --- | --- |
| packages/skills/closeout-commit (historical path: `../../../../packages/skills/closeout-commit`) | Packaged commit-closeout skill updated with fast-path helper scripts, probe-first workflow guidance, and helper tests. |
| packages/skills/closeout-phase (historical path: `../../../../packages/skills/closeout-phase`) | Packaged phase-closeout skill updated with shared closeout helpers, phase/guide probes, workflow guidance, and helper tests. |
| .agents/skills | Codex skill mirrors aligned with the packaged closeout helper scripts and workflow references. |
| .claude/skills | Claude skill mirrors aligned with the packaged closeout helper scripts and workflow references. |
| [packages/cli/skill-registry.json](../../../../packages/cli/skill-registry.json) | Closeout skill asset lists now include the helper scripts referenced by the packaged skills. |
| [packages/cli/tests](../../../../packages/cli/tests) | Focused registry, install, and consistency tests updated for closeout helper asset and mirror coverage. |
| [docs/assets/history/2026-05-06-closeout-fast-path-helpers.md](./2026-05-06-closeout-fast-path-helpers.md) | Closeout breadcrumb for this fast-path helper maintenance set. |

### Developer

None this session.

### User

None this session.

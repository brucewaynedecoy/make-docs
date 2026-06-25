---
date: "2026-05-05"
client: "Codex Desktop"
repo: "make-docs"
branch: "main"
status: "completed"
summary: "Codified work backlog task IDs and plain acceptance criteria across docs, shipped templates, skills, renderers, and validators."
---

# Work Backlog Task Contract

## Changes

Codified the work backlog task contract so phase tasks are markdown checkbox items with phase-local `tN` IDs, acceptance criteria remain plain bullets, and generated instructions, shipped templates, closeout guidance, and validator checks all enforce the same model.

| Area | Summary |
| --- | --- |
| Work contract docs | Updated dogfood and shipped execution/output/wave references plus work routers to document task IDs, non-resetting phase-local numbering, and plain acceptance bullets. |
| Templates and renderers | Updated dogfood, shipped template, and decompose skill work-phase templates to emit `- [ ] tN: ...` tasks and plain acceptance bullets; updated the CLI renderer for docs router output. |
| Closeout skills | Updated `closeout-commit` and `closeout-phase` package and mirror copies so closeout verifies task checkboxes and uses acceptance criteria as evidence rather than completion checkboxes. |
| Validator | Extended the decompose output validator to require per-stage task, acceptance, and dependency subsections, enforce monotonic task IDs across a phase, and reject checkbox or task-labeled acceptance criteria. |
| Tests | Added CLI consistency coverage for the task contract and decompose validator unit coverage for valid/invalid task and acceptance formats. |

### Gap Decisions

No novel gaps were found. The active risk register at [docs/prd/03-open-questions-and-risk-register.md](../../../prd/03-open-questions-and-risk-register.md) already exists, but this closeout did not discover a new open question, risk, drift item, or unresolved blocker requiring a register update.

### Validation

Validation commands run:

```text
npm test -w make-docs -- consistency skill-catalog
python3 -m unittest test_validate_output.py
git diff --check
```

The repo-root Python unittest invocation was also attempted and failed before the passing rerun because `test_validate_output.py` imports sibling `validate_output.py`; the passing command was run from `packages/skills/decompose-codebase/scripts/`.

Post-discovery index refreshes:

```text
jdocmunch index_local /Users/tylerkneisly/Developer/Source/Tyler/Projects/make-docs
jcodemunch index_folder /Users/tylerkneisly/Developer/Source/Tyler/Projects/make-docs
```

Commit-message drafting used [docs/assets/references/commit-message-convention.md](../../../../.make-docs/contracts/system/commit-message-convention.md) and inspected the aligned shipped-template copy at [packages/docs/template/.make-docs/contracts/system/commit-message-convention.md](../../../../packages/docs/template/.make-docs/contracts/system/commit-message-convention.md). No W/R/P coordinate applies because the changed files do not identify a single active phase, plan, or work backlog coordinate.

## Documentation

### Project

| Path | Description |
| --- | --- |
| [docs/AGENTS.md](../../AGENTS.md) | Dogfood docs router updated with the task-checkbox and plain-acceptance work contract. |
| [docs/assets/references/execution-workflow.md](../../../../.make-docs/references/system/execution-workflow.md) | Execution workflow updated with phase-local task ID and acceptance bullet rules. |
| [docs/assets/references/output-contract.md](../../../../.make-docs/contracts/system/output-contract.md) | Output contract updated to make task IDs and plain acceptance criteria explicit. |
| [docs/assets/references/wave-model.md](../../../../.make-docs/references/system/wave-model.md) | Wave model updated with the `t{T}` task coordinate and phase-local numbering rule. |
| [docs/assets/templates/work-phase.md](../../../../.make-docs/templates/system/work-phase.md) | Dogfood work phase template updated to use task checkboxes and plain acceptance bullets. |
| [docs/work/AGENTS.md](../../../work/AGENTS.md) | Dogfood work router updated with task and acceptance formatting guidance. |
| `packages/docs/template/docs` | Shipped template copies aligned with the dogfood work contract, routers, references, and work phase template. |
| `packages/cli/src/renderers.ts` | Generated docs router output updated for the work task contract. |
| `packages/cli/skill-registry.json` | Closeout phase skill description updated to refer to checked tasks and acceptance evidence. |
| `packages/cli/tests` | CLI consistency and skill catalog tests updated for the task contract and skill description. |
| `packages/skills/closeout-commit` | Closeout commit workflow updated to route task-checkbox phase closeout through `closeout-phase`. |
| `packages/skills/closeout-phase` | Closeout phase workflow updated to verify task items and use acceptance criteria as evidence. |
| `packages/skills/decompose-codebase` | Decompose skill templates, references, validator, and validator tests updated for the task contract. |
| [docs/assets/history/2026-05-05-work-backlog-task-contract.md](./2026-05-05-work-backlog-task-contract.md) | Closeout breadcrumb for the task-contract maintenance set. |

### Developer

None this session.

### User

None this session.

---
date: "2026-04-23"
repo: "make-docs"
branch: "codex/makedocsw5r4"
coordinate: "W5 R4 P1"
status: "completed"
summary: "Updated the packaged decompose skill contract surfaces to the v2 lifecycle model."
---

# Phase 1: Decompose Codebase Skill Contract De-Drift - Authority and Skill Contract

## Changes

This session completed [Phase 1 of the `w5-r4` backlog](../../work/2026-04-23-w5-r4-decompose-codebase-skill-contract-dedrift/01-authority-and-skill-contract.md), implementing the contract-alignment direction from [the de-drift design](../../designs/2026-04-23-decompose-codebase-skill-contract-dedrift.md) and [Phase 1 of the implementation plan](../../plans/2026-04-23-w5-r4-decompose-codebase-skill-contract-dedrift/01-authority-and-skill-contract.md). The packaged `decompose-codebase` skill now routes PRD archives to `docs/assets/archive/prds/...`, documents plan and backlog outputs as v2 directories, and explicitly treats bundled references, templates, and scripts as skill-local runtime assets rather than repo-root dependencies.

| Area | Summary |
| --- | --- |
| Skill contract | Updated `packages/skills/decompose-codebase/SKILL.md` so the active skill surface describes the current archive path, directory-based plan output, directory-based rebuild backlog output, and the installed skill's self-contained runtime model. |
| User-facing skill guide | Updated `packages/skills/decompose-codebase/assets/README.md` to mirror the same v2 lifecycle contract and clarify that bundled references, templates, and scripts are local installed assets. |
| Bundled lifecycle references | Updated `packages/skills/decompose-codebase/references/planning-workflow.md`, `references/execution-workflow.md`, and `references/output-contract.md` so the packaged skill no longer documents `docs/prd/archive/...` or one-file decomposition and backlog outputs as current behavior. |
| Scope boundary | Confirmed that `references/mcp-playbook.md` and `references/harness-capability-matrix.md` did not need churn for this phase, and left validator-path drift for the later validator phase instead of mixing scope. |
| Backlog tracking | Marked [the Phase 1 work item](../../work/2026-04-23-w5-r4-decompose-codebase-skill-contract-dedrift/01-authority-and-skill-contract.md) complete after the packaged contract sweep and acceptance checks passed. |
| Validation | Verified the targeted human-facing contract surfaces with stale-path `rg` scans and `git diff --check`. No validator or install-surface tests were run in this phase because those checks belong to later `w5-r4` phases. |

## Documentation

### Project

| Path | Description |
| --- | --- |
| [docs/work/2026-04-23-w5-r4-decompose-codebase-skill-contract-dedrift/01-authority-and-skill-contract.md](../../work/2026-04-23-w5-r4-decompose-codebase-skill-contract-dedrift/01-authority-and-skill-contract.md) | Phase 1 backlog item with all tasks and acceptance criteria marked complete. |
| [packages/skills/decompose-codebase/SKILL.md](../../../packages/skills/decompose-codebase/SKILL.md) | Updated the active packaged skill contract to the v2 archive, plan-directory, and work-directory model. |
| [packages/skills/decompose-codebase/assets/README.md](../../../packages/skills/decompose-codebase/assets/README.md) | Updated the user-facing packaged skill guide to match the corrected lifecycle contract and self-contained runtime model. |
| [packages/skills/decompose-codebase/references/planning-workflow.md](../../../packages/skills/decompose-codebase/references/planning-workflow.md) | Updated the bundled planning workflow to the v2 output model and current archive namespace. |
| [packages/skills/decompose-codebase/references/execution-workflow.md](../../../packages/skills/decompose-codebase/references/execution-workflow.md) | Updated the bundled execution workflow to the v2 output model and current archive namespace. |
| [packages/skills/decompose-codebase/references/output-contract.md](../../../packages/skills/decompose-codebase/references/output-contract.md) | Updated the packaged output contract to the current directory-based plan/work model and `docs/assets/archive/prds/` archive location. |

### Developer

None this session.

### User

None this session.

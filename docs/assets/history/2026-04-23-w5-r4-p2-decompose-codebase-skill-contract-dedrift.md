---
date: "2026-04-23"
repo: "make-docs"
branch: "codex/makedocsw5r4"
coordinate: "W5 R4 P2"
status: "completed"
summary: "Rebased the packaged decompose skill templates onto the shared v2 model."
---

# Phase 2: Decompose Codebase Skill Contract De-Drift - Templates and Output Model

## Changes

This session completed [Phase 2 of the `w5-r4` backlog](../../work/2026-04-23-w5-r4-decompose-codebase-skill-contract-dedrift/02-templates-and-output-model.md), implementing the shared-template alignment described in [the de-drift design](../../designs/2026-04-23-decompose-codebase-skill-contract-dedrift.md) and [Phase 2 of the implementation plan](../../plans/2026-04-23-w5-r4-decompose-codebase-skill-contract-dedrift/02-templates-and-output-model.md). The packaged `decompose-codebase` skill now ships v2-aligned decomposition and work-directory templates, reseeded the remaining drifted `prd-index.md` template, and removed the obsolete one-file `rebuild-backlog.md` scaffold from the packaged template surface.

| Area | Summary |
| --- | --- |
| Decomposition-plan template | Reseeded `packages/skills/decompose-codebase/assets/templates/decomposition-plan.md` from the shared `plan-prd-decompose.md` authority so the packaged skill now describes `docs/plans/.../00-overview.md` plus `0N-<phase>.md` outputs and the current coordinator, worker, MCP, and validation sections. |
| Work-directory templates | Reseeded `rebuild-backlog-index.md` and `rebuild-backlog-phase.md` from the shared `work-index.md` and `work-phase.md` authorities so packaged work output now centers `00-index.md`, dependency-ordered phase files, and `## Source PRD Docs` traceability. |
| PRD template drift | Compared the packaged `prd-*.md` templates against `docs/assets/templates/prd-*.md`, confirmed all but `prd-index.md` were already byte-identical, and reseeded `prd-index.md` to restore full parity. |
| Obsolete template removal | Deleted `packages/skills/decompose-codebase/assets/templates/rebuild-backlog.md` and confirmed the packaged docs/template surface no longer references the retired one-file backlog scaffold. |
| Backlog tracking | Marked [the Phase 2 work item](../../work/2026-04-23-w5-r4-decompose-codebase-skill-contract-dedrift/02-templates-and-output-model.md) complete after the template parity and stale-reference checks passed. |
| Validation | Verified byte-identical parity for all retained packaged templates against the shared authorities, ran targeted stale-reference scans for retired backlog-template strings, and ran `git diff --check`. Validator, registry, install-surface, and mirror work remain intentionally deferred to later `w5-r4` phases. |

## Documentation

### Project

| Path | Description |
| --- | --- |
| [docs/work/2026-04-23-w5-r4-decompose-codebase-skill-contract-dedrift/02-templates-and-output-model.md](../../work/2026-04-23-w5-r4-decompose-codebase-skill-contract-dedrift/02-templates-and-output-model.md) | Phase 2 backlog item with all tasks and acceptance criteria marked complete. |
| [packages/skills/decompose-codebase/assets/templates/decomposition-plan.md](../../../packages/skills/decompose-codebase/assets/templates/decomposition-plan.md) | Updated packaged decomposition-plan template aligned to the shared v2 plan-directory contract. |
| [packages/skills/decompose-codebase/assets/templates/rebuild-backlog-index.md](../../../packages/skills/decompose-codebase/assets/templates/rebuild-backlog-index.md) | Updated packaged backlog-index template aligned to the shared work-directory index model. |
| [packages/skills/decompose-codebase/assets/templates/rebuild-backlog-phase.md](../../../packages/skills/decompose-codebase/assets/templates/rebuild-backlog-phase.md) | Updated packaged backlog-phase template aligned to the shared work-directory phase model. |
| [packages/skills/decompose-codebase/assets/templates/prd-index.md](../../../packages/skills/decompose-codebase/assets/templates/prd-index.md) | Reseeded packaged PRD index template to eliminate the remaining PRD-template drift. |

### Developer

None this session.

### User

None this session.

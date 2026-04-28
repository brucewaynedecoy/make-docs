---
date: "2026-04-23"
repo: "make-docs"
branch: "codex/makedocsw5r4"
coordinate: "W5 R4 P3"
status: "completed"
summary: "Aligned the decompose validator and install surface to the v2 packaged skill contract."
---

# Phase 3: Decompose Codebase Skill Contract De-Drift - Validator, Registry, and Install Surface

## Changes

This session completed [Phase 3 of the `w5-r4` backlog](../archive/work/2026-04-23-w5-r4-decompose-codebase-skill-contract-dedrift/03-validator-registry-and-install-surface.md), implementing the executable-contract alignment described in [the de-drift design](../archive/designs/2026-04-23-decompose-codebase-skill-contract-dedrift.md) and [Phase 3 of the implementation plan](../archive/plans/2026-04-23-w5-r4-decompose-codebase-skill-contract-dedrift/03-validator-registry-and-install-surface.md). The packaged `decompose-codebase` skill now validates the v2 archive and work-directory model, installs only the retained runtime asset surface, and updates the shared work-phase templates so generated PRD links resolve correctly under the stricter validator.

| Area | Summary |
| --- | --- |
| Validator contract | Updated `packages/skills/decompose-codebase/scripts/validate_output.py` so the packaged validator now enforces `docs/assets/archive/prds/...`, requires `docs/work/YYYY-MM-DD-w{W}-r{R}-<slug>/00-index.md` plus numbered phase files, skips router docs where appropriate, and rejects legacy `docs/prd/archive/...` and one-file backlog assumptions as current behavior. |
| Validator coverage | Expanded `packages/skills/decompose-codebase/scripts/test_validate_output.py` with v2 acceptance coverage, explicit legacy rejection cases, and retained Wave 6 false-positive link protection. |
| Registry and install surface | Updated `packages/cli/skill-registry.json`, `packages/cli/tests/skill-catalog.test.ts`, `packages/cli/tests/skill-registry.test.ts`, and `packages/cli/tests/install.test.ts` so the declared, installed, and tested `decompose-codebase` asset set all agree on the retained packaged runtime files and exclude the retired `rebuild-backlog.md` scaffold. |
| Template compatibility fix | Corrected the shared `## Source PRD Docs` relative link path in `docs/assets/templates/work-phase.md`, `packages/skills/decompose-codebase/assets/templates/rebuild-backlog-phase.md`, and `packages/docs/template/docs/assets/templates/work-phase.md` from `../prd/...` to `../../prd/...` so generated work-phase docs remain valid under the hardened validator. |
| Backlog tracking | Marked [the Phase 3 work item](../archive/work/2026-04-23-w5-r4-decompose-codebase-skill-contract-dedrift/03-validator-registry-and-install-surface.md) complete after validator, registry, install-surface, and template-path checks passed. |
| Validation | Ran `python3 packages/skills/decompose-codebase/scripts/test_validate_output.py`, `npm exec -w make-docs -- vitest run tests/skill-catalog.test.ts tests/skill-registry.test.ts tests/install.test.ts`, and `git diff --check`. |

## Documentation

### Project

| Path | Description |
| --- | --- |
| [docs/assets/history/2026-04-23-w5-r4-p3-decompose-codebase-skill-contract-dedrift.md](2026-04-23-w5-r4-p3-decompose-codebase-skill-contract-dedrift.md) | History record for the completed Phase 3 validator, registry, and install-surface work. |
| [docs/assets/templates/work-phase.md](../templates/work-phase.md) | Corrected the shared work-phase PRD link path to the repo's actual backlog-to-PRD relative layout. |
| [docs/assets/archive/work/2026-04-23-w5-r4-decompose-codebase-skill-contract-dedrift/03-validator-registry-and-install-surface.md](../archive/work/2026-04-23-w5-r4-decompose-codebase-skill-contract-dedrift/03-validator-registry-and-install-surface.md) | Phase 3 backlog item with all tasks and acceptance criteria marked complete. |
| [packages/cli/skill-registry.json](../../../packages/cli/skill-registry.json) | Removed the retired one-file backlog template from the packaged decompose skill asset manifest. |
| [packages/cli/tests/install.test.ts](../../../packages/cli/tests/install.test.ts) | Updated install assertions so optional decompose installs prove the retained runtime asset set and reject retired or source-only files. |
| [packages/cli/tests/skill-catalog.test.ts](../../../packages/cli/tests/skill-catalog.test.ts) | Updated skill-catalog expectations for the retained optional `decompose-codebase` install surface. |
| [packages/cli/tests/skill-registry.test.ts](../../../packages/cli/tests/skill-registry.test.ts) | Added explicit registry assertions for the intended decompose skill asset set. |
| [packages/docs/template/docs/assets/templates/work-phase.md](../../../packages/docs/template/docs/assets/templates/work-phase.md) | Propagated the shared work-phase PRD link-path correction into the shipped docs template. |
| [packages/skills/decompose-codebase/assets/templates/rebuild-backlog-phase.md](../../../packages/skills/decompose-codebase/assets/templates/rebuild-backlog-phase.md) | Corrected the packaged decompose backlog-phase template to the valid PRD relative-link path. |
| [packages/skills/decompose-codebase/scripts/test_validate_output.py](../../../packages/skills/decompose-codebase/scripts/test_validate_output.py) | Added validator coverage for the v2 contract and legacy rejection cases. |
| [packages/skills/decompose-codebase/scripts/validate_output.py](../../../packages/skills/decompose-codebase/scripts/validate_output.py) | Updated the packaged validator to enforce the v2 archive and work-directory contract. |

### Developer

None this session.

### User

None this session.

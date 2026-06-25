---
date: "2026-04-23"
repo: "make-docs"
branch: "codex/makedocsw5r4"
coordinate: "W5 R4 P4"
status: "completed"
summary: "Refreshed the dogfood decompose skill mirror and added a mapped-file parity guardrail."
---

# Phase 4: Decompose Codebase Skill Contract De-Drift - Dogfood Mirror and Parity

## Changes

This session completed [Phase 4 of the `w5-r4` backlog](../archive/work/2026-04-23-w5-r4-decompose-codebase-skill-contract-dedrift/04-dogfood-mirror-and-parity.md), implementing the mirror-alignment work described in [the de-drift design](../archive/designs/2026-04-23-decompose-codebase-skill-contract-dedrift.md) and [Phase 4 of the implementation plan](../archive/plans/2026-04-23-w5-r4-decompose-codebase-skill-contract-dedrift/04-dogfood-mirror-and-parity.md). The `.agents` dogfood copy of `decompose-codebase` is now a package-driven mirror of the shipped skill, backed by an automated consistency test that enforces the mapped runtime file set and catches future package-vs-mirror drift.

| Area | Summary |
| --- | --- |
| Parity guardrail | Updated `packages/cli/tests/consistency.test.ts` so the repo now derives the mirrored `decompose-codebase` file set from explicit include/exclude rules, asserts the `.agents` mirror contains exactly that mapped set, and checks byte equality for every mirrored file. |
| Dogfood mirror refresh | Reseeded the drifted `.agents/skills/decompose-codebase/` runtime files from `packages/skills/decompose-codebase/`, including the active skill contract, bundled references, packaged templates, and `validate_output.py`, so the dogfood mirror now matches the shipped skill for every mapped file. |
| Retired mirror cleanup | Removed the stale mirror-only `assets/templates/rebuild-backlog.md` file from `.agents/skills/decompose-codebase/` after Phase 2 retired that template from the packaged surface. |
| Backlog tracking | Marked [the Phase 4 work item](../archive/work/2026-04-23-w5-r4-decompose-codebase-skill-contract-dedrift/04-dogfood-mirror-and-parity.md) complete after the parity guardrail and mirror refresh were in place. |
| Validation | Ran `npm exec -w make-docs -- vitest run tests/consistency.test.ts`, confirmed raw package-vs-mirror diffs only show the intentional package-only files (`assets/README.md`, `scripts/test_validate_output.py`, and `scripts/__pycache__/`), and ran `git diff --check`. |

## Documentation

### Project

| Path | Description |
| --- | --- |
| [docs/assets/history/2026-04-23-w5-r4-p4-decompose-codebase-skill-contract-dedrift.md](2026-04-23-w5-r4-p4-decompose-codebase-skill-contract-dedrift.md) | History record for the completed Phase 4 dogfood-mirror and parity work. |
| [docs/assets/archive/work/2026-04-23-w5-r4-decompose-codebase-skill-contract-dedrift/04-dogfood-mirror-and-parity.md](../archive/work/2026-04-23-w5-r4-decompose-codebase-skill-contract-dedrift/04-dogfood-mirror-and-parity.md) | Phase 4 backlog item with all tasks and acceptance criteria marked complete. |
| [.agents/skills/decompose-codebase/SKILL.md](../../../.agents/skills/decompose-codebase/SKILL.md) | Refreshed the dogfood mirror of the active decompose skill contract from the packaged source. |
| [.agents/skills/decompose-codebase/assets/templates/decomposition-plan.md](../../../.agents/skills/decompose-codebase/assets/templates/decomposition-plan.md) | Refreshed the mirrored decomposition-plan template from the packaged skill. |
| [.agents/skills/decompose-codebase/assets/templates/prd-index.md](../../../.agents/skills/decompose-codebase/assets/templates/prd-index.md) | Refreshed the mirrored PRD index template from the packaged skill. |
| [.agents/skills/decompose-codebase/assets/templates/rebuild-backlog-index.md](../../../.agents/skills/decompose-codebase/assets/templates/rebuild-backlog-index.md) | Refreshed the mirrored backlog-index template from the packaged skill. |
| [.agents/skills/decompose-codebase/assets/templates/rebuild-backlog-phase.md](../../../.agents/skills/decompose-codebase/assets/templates/rebuild-backlog-phase.md) | Refreshed the mirrored backlog-phase template from the packaged skill. |
| [.agents/skills/decompose-codebase/references/execution-workflow.md](../../../.agents/skills/decompose-codebase/references/execution-workflow.md) | Refreshed the mirrored execution-workflow reference from the packaged skill. |
| [.agents/skills/decompose-codebase/references/output-contract.md](../../../.agents/skills/decompose-codebase/references/output-contract.md) | Refreshed the mirrored output-contract reference from the packaged skill. |
| [.agents/skills/decompose-codebase/references/planning-workflow.md](../../../.agents/skills/decompose-codebase/references/planning-workflow.md) | Refreshed the mirrored planning-workflow reference from the packaged skill. |
| [.agents/skills/decompose-codebase/scripts/validate_output.py](../../../.agents/skills/decompose-codebase/scripts/validate_output.py) | Refreshed the mirrored runtime validator from the packaged skill. |
| [packages/cli/tests/consistency.test.ts](../../../packages/cli/tests/consistency.test.ts) | Added the package-driven mapped-file parity test for the `decompose-codebase` dogfood mirror. |

### Developer

None this session.

### User

None this session.

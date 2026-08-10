---
date: 2026-06-23
coordinate: W15 R0
closeout: reconciliation
summary: "Reconciled W15 work-backlog source authority with accepted v2 template, dogfood, lifecycle, and skill boundaries."
---

# W15 Source Authority V2 Reconciliation

## Changes

This reconciliation completes W15 as a v2-aligned source-authority update rather than the original legacy PRD and mirror-sync implementation. It preserves the W15 rule that work-backlog generation must follow an explicit authority ladder, while replacing superseded targets with accepted v2 ownership boundaries.

| Area | Summary |
| --- | --- |
| Active PRD owners | Recorded W15 requirements in template/static assets, skills distribution, dogfood/maintainer operations, and lifecycle workflow foundation instead of creating the obsolete `docs/prd/14-revise-work-backlog-source-authority.md` slot. |
| Template guidance | Added source-authority wording to the template-owned work routers and execution workflow, then aligned root dogfood copies. |
| Skill projection | Updated `packages/skills/decompose-codebase/` wording so skill-local references and templates are secondary/fallback projections, not primary repo authority. |
| Harness mirror disposition | Documented that absent `.agents` and `.claude` skill mirrors were not recreated; v2 treats harness exposure as generated/fallback output. |
| Validation | Confirmed W15-relevant template parity, build, smoke, validator, wave-numbering, and diff checks; documented unrelated CLI backup/router baseline failures. |
| Manual-test coverage | Decision: worthwhile as a lightweight UAT read-through because the changed template docs and selected skill copies are user-observable, and a human can judge clarity better than another parity check. |
| Developer-guide coverage | Decision: `update-existing` for maintainer-facing work-backlog source authority and skill-projection rules; `link-only` for template/dogfood source ownership already covered by existing maintainer guides. |
| User-guide coverage | Decision: `none` for new or updated user guides because W15 changed maintainer/source-authority guidance, not shipped commands, setup, configuration, troubleshooting, or expected user output. Existing skill user guides remain `link-only` context. |
| PRD coverage | Decision: `baseline-change-note` for active owners `06`, `08`, `09`, and `14`; `none` for a new numbered PRD change doc because W15 reconciles existing accepted requirements rather than introducing a net-new capability, revision, removal, or unresolved risk. |

### Manual-Test Coverage

Recommended UAT: build the local CLI, install make-docs into a temporary target, sync only the `decompose-codebase` skill, and inspect the generated `docs/work/AGENTS.md`, `docs/assets/references/execution-workflow.md`, and installed `decompose-codebase/SKILL.md` copies. The pass condition is that the generated docs clearly place accepted live repo contracts before archived examples, bundled skill projections, generated harness stubs, and installed copies.

### Developer-Guide Coverage

| Candidate | Outcome | Rationale |
| --- | --- | --- |
| Work-backlog source-authority ladder | `update-existing` | [Understanding the Make Docs Stage Model](../../library/developer/development-workflows-stage-model-and-artifact-relationships.md) owns current artifact relationships and now names the backlog authority order future maintainers should follow. |
| `decompose-codebase` bundled references and templates as projections | `update-existing` | [Skills Catalog and Distribution Model](../../library/developer/skills-catalog-and-distribution-model.md) owns distributed skill maintainer guidance and now clarifies that skill-local assets are fallback projections relative to live repo contracts. |
| Template/package/dogfood source ownership | `link-only` | Existing maintainer guides already cover this boundary through template assets, dogfood operations, and release validation; no duplicate guide was created. |
| End-user workflow changes | `none` | The work changes maintainer/source-authority guidance only and does not introduce a new shipped user workflow. |

### User-Guide Coverage

| Candidate | Outcome | Rationale |
| --- | --- | --- |
| Work-backlog source-authority ladder | `developer` | The rule tells maintainers and agents how to choose source authority while generating `docs/work/**`; it does not change how an end user invokes make-docs or interprets CLI output. |
| `decompose-codebase` installed-skill behavior | `link-only` | Existing user guides for installing skills and decomposing codebases already cover the user task surface; W15 only clarifies authority precedence inside the bundled skill guidance. |
| Template, dogfood, and harness source ownership | `none` | These are maintainer packaging and provenance boundaries, not user-facing configuration or troubleshooting steps. |
| New user guide entry point | `none` | No distinct user task, adoption path, expected result, or troubleshooting path was introduced. |

### PRD Coverage

| Candidate | Outcome | Rationale |
| --- | --- | --- |
| Template-owned work-backlog guidance | `baseline-change-note` | [06-template-contracts-and-generated-assets.md](../../../prd/06-template-contracts-and-generated-assets.md) now clarifies that shipped work-backlog guidance is authored template-first before dogfood or installed-skill projections. |
| Skill-local backlog guidance and installed skill copies | `baseline-change-note` | [08-skills-catalog-and-distribution.md](../../../prd/08-skills-catalog-and-distribution.md) now clarifies that selected skills, skill-local references/templates, generated harness exposure files, and installed copies are secondary/fallback surfaces. |
| Root dogfood, archived examples, and maintainer operations | `baseline-change-note` | [09-dogfood-and-maintainer-operations.md](../../../prd/09-dogfood-and-maintainer-operations.md) now clarifies root `docs/` as dogfood/project-owned surface rather than product source of truth for shipped backlog guidance. |
| Lifecycle work-backlog handoff authority | `baseline-change-note` | [historical design](../designs/2026-06-17-make-docs-lifecycle-foundation.md) (retired action-PRD: `docs/prd/14-add-lifecycle-workflow-foundation.md`) now names the authority order for backlog handoffs before fallback evidence. |
| New numbered PRD change doc | `none` | The next available slot is `16`, but no new doc was created because W15 reconciles existing accepted v2 requirements in active owners instead of changing the product surface. |
| Risk register | `none` | No new gap, drift item, open question, decision, or rebuild risk was discovered or resolved beyond the existing dogfood/template and skill-projection risks already tracked in [03-open-questions-and-risk-register.md](../../../prd/03-open-questions-and-risk-register.md). |
| PRD index | `none` | [00-index.md](../../../prd/00-index.md) remains accurate because no new PRD file, status change, renumbering, or active-set document kind change occurred. |

## Documentation

### Project

| Path | Description |
| --- | --- |
| [../../../prd/06-template-contracts-and-generated-assets.md](../../../prd/06-template-contracts-and-generated-assets.md) | Notes that template-owned work guidance is the shipped source for source-authority rules. |
| [../../../prd/08-skills-catalog-and-distribution.md](../../../prd/08-skills-catalog-and-distribution.md) | Clarifies package skills, installed copies, and generated harness files as secondary/fallback surfaces. |
| [../../../prd/09-dogfood-and-maintainer-operations.md](../../../prd/09-dogfood-and-maintainer-operations.md) | Clarifies root dogfood docs as validation/project-owned copies rather than shipped product source. |
| [historical design](../designs/2026-06-17-make-docs-lifecycle-foundation.md) (retired action-PRD: `docs/prd/14-add-lifecycle-workflow-foundation.md`) | Records that lifecycle handoffs must name accepted authority before fallback evidence. |
| [docs/assets/archive/work/2026-05-06-w15-r0-work-backlog-source-authority/00-index.md](../work/2026-05-06-w15-r0-work-backlog-source-authority/00-index.md) | Recasts W15 completion around active PRD owners, template-owned contracts, dogfood copies, skill projections, and generated-harness disposition. |
| [docs/assets/archive/work/2026-05-06-w15-r0-work-backlog-source-authority/04-tests-work-backlog-and-validation.md](../work/2026-05-06-w15-r0-work-backlog-source-authority/04-tests-work-backlog-and-validation.md) | Captures validation evidence, stale-wording scan results, and baseline validation blockers. |
| [../../../../.make-docs/references/system/execution-workflow.md](../../../../.make-docs/references/system/execution-workflow.md) | Adds the explicit work-backlog source-authority ladder to root dogfood guidance. |
| [../../../work/AGENTS.md](../../../work/AGENTS.md) | Adds first-read authority guidance for agents generating work backlogs. |

### Developer

| Path | Description |
| --- | --- |
| [../../../../packages/docs/template/.make-docs/references/system/execution-workflow.md](../../../../packages/docs/template/.make-docs/references/system/execution-workflow.md) | Adds the shipped template-owned source-authority ladder. |
| [../../../../packages/docs/template/docs/work/AGENTS.md](../../../../packages/docs/template/docs/work/AGENTS.md) | Adds shipped work-router guidance for authority order and fallback evidence. |
| [../../../../packages/docs/template/docs/work/CLAUDE.md](../../../../packages/docs/template/docs/work/CLAUDE.md) | Keeps the paired shipped Claude router aligned with the AGENTS router. |
| [../../../../packages/skills/decompose-codebase/SKILL.md](../../../../packages/skills/decompose-codebase/SKILL.md) | Reframes bundled skill guidance as a projection/fallback surface relative to live repo contracts. |
| [../../../../packages/skills/decompose-codebase/assets/README.md](../../../../packages/skills/decompose-codebase/assets/README.md) | Clarifies bundled skill assets as installed-skill projections. |
| [../../../../packages/skills/decompose-codebase/references/execution-workflow.md](../../../../packages/skills/decompose-codebase/references/execution-workflow.md) | Aligns skill-local workflow guidance with the new source-authority ladder. |
| [../../library/developer/development-workflows-stage-model-and-artifact-relationships.md](../../library/developer/development-workflows-stage-model-and-artifact-relationships.md) | Adds maintainer-facing work-backlog source-authority guidance to the stage model guide. |
| [../../library/developer/skills-catalog-and-distribution-model.md](../../library/developer/skills-catalog-and-distribution-model.md) | Clarifies that bundled `decompose-codebase` assets are projections/fallbacks relative to live repo contracts. |

### User

None this session.

# Phase 03: Persona Schema and Validation

## Purpose

Implement the persona schema and frontmatter validation needed by guide/playbook coverage and future generated metadata.

## Source PRDs

- [../../prd/22-revise-new-docs-assets-playbooks-persona-model.md](../../prd/22-revise-new-docs-assets-playbooks-persona-model.md)
- [../../prd/14-add-lifecycle-workflow-foundation.md](../../prd/14-add-lifecycle-workflow-foundation.md)

## Tasks

- [x] t1: Add the default persona set with `slug`, `label`, `description`, and `primitive` fields in the implementation-owned configuration or defaults surface selected by the implementation phase. (`W9R3-P3-T1`)
- [x] t2: Validate custom personas using the same schema, including lowercase kebab-case `slug`, uniqueness, and primitive membership in `agent`, `maintainer`, or `user`. (`W9R3-P3-T2`)
- [x] t3: Require `persona` frontmatter for persona-scoped guide and playbook docs. (`W9R3-P3-T3`)
- [x] t4: Add drift detection when `persona` frontmatter and `docs/assets/{guides,playbooks}/<persona-slug>/` placement disagree. (`W9R3-P3-T4`)
- [x] t5: Preserve coverage records as separate verdict and persona-target axes; do not collapse persona into verdict. (`W9R3-P3-T5`)
- [x] t6: Add fixtures for default personas, custom personas, invalid slugs, invalid primitives, missing frontmatter, and path/frontmatter drift. (`W9R3-P3-T6`)

## Acceptance Criteria

- `Q-009` can remain closed because the schema is implemented as specified.
- `R-011` is reduced to configuration integration, not schema ambiguity.
- Generated metadata and configuration overlay work can cite stable field names.
- Single-primary-persona docs are enforced.

## Validation

- Run `npm test -w packages/cli`.
- Run any focused persona/frontmatter validation tests added in this phase.
- Run Markdown link and frontmatter checks for touched guide/playbook docs.

## Implementation Notes

- Added `packages/skills/closeout-phase/scripts/persona_schema.py` with the default `agent`, `developer`, and `user` personas, primitive membership, custom persona validation, coverage axes, and canonical persona-scoped path checks.
- Updated `guide_coverage_probe.py` so canonical guide and playbook docs under `docs/assets/{guides,playbooks}/<persona>/` require `persona` frontmatter and report path/frontmatter drift.
- Preserved coverage records as separate axes by emitting `coverageAxes.verdicts` and `coverageAxes.personaTargets` instead of combining persona with verdict.
- Added closeout helper fixtures for default personas, custom personas, invalid slugs, invalid primitives, missing frontmatter, path/frontmatter drift, canonical guide discovery, and legacy guide persona inference.
- Updated the closeout-phase skill registry and install tests so `persona_schema.py` is packaged with the skill.
- Updated `coverage-pass-contract.md` so persona targets use configured persona slugs while verdicts remain `create`, `update-existing`, `link-only`, or `none`.
- Reconciled `Q-009` and `R-011` in the active PRD risk register: schema ambiguity is resolved here, while configuration-overlay integration remains a follow-on risk.
- Changed path scope: `docs/assets/references/coverage-pass-contract.md`, `docs/prd/03-open-questions-and-risk-register.md`, `docs/work/2026-06-23-w9-r3-new-docs-assets-playbooks-persona-model/03-persona-schema-and-validation.md`, `packages/docs/template/docs/assets/references/coverage-pass-contract.md`, `packages/skills/closeout-phase`, `packages/cli/skill-registry.json`, and `packages/cli/tests`.
- Developer guide decision: none; the durable developer-facing contract is covered by `docs/assets/references/coverage-pass-contract.md`.
- User guide decision: none; installed user behavior is unchanged in this phase.
- UAT decision: deferred until full W9 R3 wave completion.

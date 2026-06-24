# Phase 03: Persona Schema and Validation

## Purpose

Implement the persona schema and frontmatter validation needed by guide/playbook coverage and future generated metadata.

## Source PRDs

- [../../prd/22-revise-new-docs-assets-playbooks-persona-model.md](../../prd/22-revise-new-docs-assets-playbooks-persona-model.md)
- [../../prd/14-add-lifecycle-workflow-foundation.md](../../prd/14-add-lifecycle-workflow-foundation.md)

## Tasks

- [ ] t1: Add the default persona set with `slug`, `label`, `description`, and `primitive` fields in the implementation-owned configuration or defaults surface selected by the implementation phase. (`W9R3-P3-T1`)
- [ ] t2: Validate custom personas using the same schema, including lowercase kebab-case `slug`, uniqueness, and primitive membership in `agent`, `maintainer`, or `user`. (`W9R3-P3-T2`)
- [ ] t3: Require `persona` frontmatter for persona-scoped guide and playbook docs. (`W9R3-P3-T3`)
- [ ] t4: Add drift detection when `persona` frontmatter and `docs/assets/{guides,playbooks}/<persona-slug>/` placement disagree. (`W9R3-P3-T4`)
- [ ] t5: Preserve coverage records as separate verdict and persona-target axes; do not collapse persona into verdict. (`W9R3-P3-T5`)
- [ ] t6: Add fixtures for default personas, custom personas, invalid slugs, invalid primitives, missing frontmatter, and path/frontmatter drift. (`W9R3-P3-T6`)

## Acceptance Criteria

- `Q-009` can remain closed because the schema is implemented as specified.
- `R-011` is reduced to configuration integration, not schema ambiguity.
- Generated metadata and configuration overlay work can cite stable field names.
- Single-primary-persona docs are enforced.

## Validation

- Run `npm test -w packages/cli`.
- Run any focused persona/frontmatter validation tests added in this phase.
- Run Markdown link and frontmatter checks for touched guide/playbook docs.

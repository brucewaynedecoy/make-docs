---
date: 2026-06-24
coordinate: W9 R3 P3
repo: make-docs
branch: make-docs-v2
status: completed
summary: "Implemented persona schema defaults, frontmatter validation, drift checks, and coverage axis separation for guide/playbook coverage."
---

# New Docs Assets Persona Schema Validation

## Changes

Completed W9 R3 Phase 3 by adding the default persona schema and validator for closeout guide/playbook coverage, wiring persona frontmatter and path-drift checks into the guide coverage probe, and reducing the active persona risk register from schema ambiguity to future configuration-overlay integration.

| Area | Summary |
| --- | --- |
| Persona schema | Added `packages/skills/closeout-phase/scripts/persona_schema.py` with default `agent`, `developer`, and `user` persona entries plus shared schema validation for custom persona sets. |
| Frontmatter validation | Updated the guide coverage probe to require `persona` frontmatter for canonical `docs/assets/guides/<persona>/` and `docs/assets/playbooks/<persona>/` documents and to report path/frontmatter drift. |
| Coverage axes | Preserved separate `coverageAxes.verdicts` and `coverageAxes.personaTargets` outputs so persona targets do not collapse into coverage verdicts. |
| Skill packaging | Added the persona schema helper to the closeout-phase skill registry and install tests so packaged skills include the validator. |
| PRD and risk reconciliation | Updated `Q-009` and `R-011` so Phase 3 closes schema ambiguity while leaving configuration-overlay integration as a follow-on risk. |
| Coverage decisions | Developer-guide verdict is `none` because the durable maintainer-facing contract lives in the coverage reference. User-guide verdict is `none` because installed user behavior is unchanged. No new PRD was created because PRD 22 owns the persona model. UAT remains deferred until the full W9 R3 wave is complete. |

## Documentation

### Project

| Path | Description |
| --- | --- |
| [../../../../.make-docs/contracts/system/coverage-pass-contract.md](../../../../.make-docs/contracts/system/coverage-pass-contract.md) | Defines configured persona target slugs and keeps verdict and persona-target axes separate. |
| [../../../prd/03-open-questions-and-risk-register.md](../../../prd/03-open-questions-and-risk-register.md) | Reconciles `Q-009` and `R-011` after schema validation landed. |
| [../../../work/2026-06-23-w9-r3-new-docs-assets-playbooks-persona-model/03-persona-schema-and-validation.md](../../../work/2026-06-23-w9-r3-new-docs-assets-playbooks-persona-model/03-persona-schema-and-validation.md) | Records Phase 3 completion evidence and changed path scope. |
| `../../../../packages/skills/closeout-phase/scripts/persona_schema.py` (historical path) | Provides the reusable persona schema and validation helper. |
| `../../../../packages/skills/closeout-phase/scripts/guide_coverage_probe.py` (historical path) | Applies persona validation to guide/playbook coverage discovery. |

### Developer

None this session.

### User

None this session.

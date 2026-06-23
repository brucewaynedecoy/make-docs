# Lifecycle Handoff Validation

## Purpose

Define the generated handoff metadata and validation behavior that keeps human-readable `## Intended Follow-On` sections aligned with tooling.

## Handoff Shape

The canonical handoff metadata shape is:

```yaml
follow_on:
  route: "{{ROUTE}}"
  next_prompt: "{{REPO_RELATIVE_PROMPT_PATH}}"
  why: "{{SHORT_REASON}}"
  coordinate_handoff: "{{COORDINATE_HANDOFF}}"
```

Generated design docs, plan overviews, PRD indexes, and work indexes keep body `## Intended Follow-On` sections for reader clarity. The body section renders the same values in contract-specific wording:

- `Route:`
- `Next Prompt:` or `Next step:`
- `Why:`
- `Coordinate Handoff:`

YAML is canonical for tooling. The body section is the required human-readable rendering. Validators flag YAML/body mismatch as drift.

## Lifecycle Departure Shape

```yaml
lifecycle:
  default_arc: "design -> plan -> PRD -> work -> implementation"
  departure: "{{DEPARTURE_KIND}}"
  reason: "{{SHORT_REASON}}"
```

Initial `departure` values are:

- `none`
- `source-to-design-straddle`
- `skip`
- `reorder`
- `revisit`

The current v2 design generation uses `source-to-design-straddle` because artifact roadmap inputs are being converted into design docs before the workflow resumes with design -> plan -> PRD -> work -> implementation.

## Validation Rules

Validators should:

- flag YAML/body mismatch as drift,
- preserve advisory-default behavior for follow-ons,
- avoid failing a document solely because a recommended follow-on is deferred, overridden, or unresolved,
- flag invalid `kind`, route, source type, or lifecycle departure values,
- require `persona` only for persona-scoped guide/playbook docs,
- treat missing v2 metadata on historical documents as acceptable until planned backfill or touched-file work applies.

## Implementation Surfaces

Future implementation should update:

- `packages/docs/template/`
- root dogfood `docs/`
- `packages/cli/template/` through copy/prepack
- `packages/cli/src/rules.ts`
- `packages/cli/src/manifest.ts`
- `packages/cli/src/audit.ts`
- `packages/cli/src/backup.ts`
- `packages/cli/src/install.ts`
- `packages/cli/src/planner.ts`
- `packages/cli/tests/consistency.test.ts`
- `packages/cli/tests/install.test.ts`
- `scripts/copy-template-to-cli.mjs`
- `scripts/smoke-pack.mjs`

# Generated Metadata Lifecycle Handoffs - PRD Change Plan

## Objective

Convert [Generated Metadata and Lifecycle Handoffs](../../designs/2026-06-20-generated-metadata-and-lifecycle-handoffs.md) into an implementation-ready plan, PRD reconciliation, and work backlog.

This plan defines the v2 metadata contract for generated make-docs documents: YAML frontmatter is canonical for tooling, required body sections remain the human-readable rendering where existing contracts require them, and validators should report drift between generated frontmatter and rendered body handoffs.

## Coordinate Decision

Coordinate: `W16 R1`

The source design gives W16 R0 P4 stage follow-on handoffs as the prior related coordinate and leaves the downstream coordinate unresolved. This plan uses `W16 R1` because the design revises the W16 lifecycle handoff work into a generated metadata contract. It depends on W9 R2 and W9 R3 information-architecture decisions, but its primary lineage is lifecycle handoffs and generated document metadata.

## Change Classification

- Route: `change-plan`
- Update Mode: `new-doc-related`
- Source design: [../../designs/2026-06-20-generated-metadata-and-lifecycle-handoffs.md](../../designs/2026-06-20-generated-metadata-and-lifecycle-handoffs.md)
- Primary dependency: [../2026-06-23-w9-r3-new-docs-assets-playbooks-persona-model/00-overview.md](../2026-06-23-w9-r3-new-docs-assets-playbooks-persona-model/00-overview.md)
- PRD strategy: create PRD 23 because the metadata schema, lifecycle departure fields, source metadata, and YAML/body handoff drift requirements are new cross-cutting requirements.

## Current Baseline

Current generated and template-backed docs use metadata unevenly:

- Guide templates already use YAML frontmatter such as `title`, `path`, and `status`.
- History records use flexible YAML with fields such as `date`, `client`, `model`, `coordinate`, `repo`, `branch`, `status`, and `summary`.
- Design, plan, PRD, and work handoffs are body sections today.
- `design-contract.md` requires `## Intended Follow-On` in design docs.
- `output-contract.md` frames follow-ons as advisory defaults rather than hard gates.
- PRD 22 makes `persona` frontmatter canonical for persona-scoped guide/playbook docs.

Existing active docs remain valid even when they predate the v2 metadata contract. Backfill belongs in planned template, package, or touched-file work, not opportunistic rewrites.

## Output Contract

This planning round creates:

- This plan bundle under `docs/plans/2026-06-23-w16-r1-generated-metadata-lifecycle-handoffs/`.
- A new active PRD change doc: [../../prd/23-generated-document-metadata-and-lifecycle-handoffs.md](../../prd/23-generated-document-metadata-and-lifecycle-handoffs.md).
- PRD index, risk-register, and affected baseline/change-doc annotations.
- A matching implementation backlog under `docs/work/2026-06-23-w16-r1-generated-metadata-lifecycle-handoffs/`.

This round does not backfill frontmatter into existing historical docs or change source templates. It records requirements for later implementation.

## Validation

Future implementation validation should include:

- fixtures for common required frontmatter fields,
- fixtures for conditional `coordinate`, `persona`, `source`, `lifecycle`, and `follow_on` metadata,
- YAML/body handoff drift checks,
- lifecycle departure checks for skipped, reordered, revisited, and source-to-design-straddle flows,
- package-template parity checks after template updates,
- Markdown link checks for any generated body handoff links,
- `npm test -w packages/cli`,
- `npm run validate:defaults -w packages/cli`,
- `npm run build -w packages/cli`,
- `npm run smoke:pack`.

## Phase Map

1. [Active PRD and Risk Reconciliation](01-active-prd-and-risk-reconciliation.md)
2. [Generated Metadata Schema](02-generated-metadata-schema.md)
3. [Lifecycle Handoff Validation](03-lifecycle-handoff-validation.md)
4. [Delta Backlog and Closeout](04-delta-backlog-and-closeout.md)

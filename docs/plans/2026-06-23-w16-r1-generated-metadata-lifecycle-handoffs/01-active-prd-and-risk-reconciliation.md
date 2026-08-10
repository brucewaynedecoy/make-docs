# Active PRD and Risk Reconciliation

## Purpose

Define the active PRD edits needed to capture the generated metadata and lifecycle handoff contract.

## New PRD Change Doc

Create [../../prd/23-generated-document-metadata-and-lifecycle-handoffs.md](../../prd/23-generated-document-metadata-and-lifecycle-handoffs.md) because the design introduces cross-cutting requirements that span templates, lifecycle handoffs, generated docs, source provenance, persona metadata, and validation.

## Existing PRD Updates

Update these active docs:

- `00-index.md`: add PRD 23 to reading order, document map, source anchors, audience paths, and intended follow-on.
- `02-architecture-overview.md`: record the generated metadata layer and YAML/body drift boundary.
- `03-open-questions-and-risk-register.md`: update `Q-011`, `R-004`, `R-011`, `R-013`, and `R-014`; add PRD 23 to source anchors.
- `06-template-contracts-and-generated-assets.md`: require generated templates to carry canonical metadata and preserve template-first implementation.
- `10-packaging-validation-and-release-reference.md`: require packed validation for metadata-bearing templates and YAML/body drift checks.
- `14-lifecycle-workflow-and-coverage-passes.md`: revise W16 handoffs so body `## Intended Follow-On` sections are rendered from `follow_on` metadata when generated.
- `22-project-documentation-asset-model.md`: cross-reference that `persona` remains the frontmatter field used by PRD 23.

## Risk Register Updates

- `Q-011`: metadata may record known coordinates but does not settle coordinate/prefix configurability.
- `R-004`: add generated metadata field names, route identifiers, and handoff body renderings to duplicated knowledge.
- `R-011`: PRD 23 consumes the PRD 22 persona schema and adds validation requirements.
- `R-013`: generated metadata backfill must avoid broad opportunistic rewrites during path relocation.
- `R-014`: no-scripts migration must not strand metadata validation in scripts or skills without CLI support.

## Acceptance Criteria

- PRD 23 is discoverable and cited from affected PRDs.
- The register distinguishes settled metadata schema from still-open configuration/prefix questions.
- Existing docs are not declared invalid only because they lack v2 frontmatter.
- Future implementation has clear acceptance criteria for frontmatter/body drift validation.

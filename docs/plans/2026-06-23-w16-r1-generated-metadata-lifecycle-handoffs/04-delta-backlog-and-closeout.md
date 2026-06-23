# Delta Backlog and Closeout

## Purpose

Translate PRD 23 into an implementation backlog that can update metadata templates and validation without rewriting every historical document.

## Backlog Shape

Create [../../work/2026-06-23-w16-r1-generated-metadata-lifecycle-handoffs/00-index.md](../../work/2026-06-23-w16-r1-generated-metadata-lifecycle-handoffs/00-index.md) with phases for:

1. PRD/register reconciliation.
2. Metadata schema and template defaults.
3. Handoff drift validation and lifecycle departure fixtures.
4. Package parity and closeout proof.

## Handoff Requirements

The implementation backlog must carry forward:

- YAML frontmatter is canonical for tooling.
- Required body sections remain the human-readable rendering where contracts require them.
- Existing historical docs are not invalid merely because they predate PRD 23.
- Backfill happens through planned template, package, or touched-file work.
- `persona` remains the field name from PRD 22.
- Configuration overlays cannot rename structural metadata fields.
- Provider/cache provenance for tool resources stays in `.make-docs/**` resource/manifest contracts, not reader-facing doc metadata.

## Closeout Expectations

Do not mark implementation complete until:

- generated templates include required metadata,
- validation catches YAML/body drift,
- lifecycle departure fixtures cover source-to-design straddle, skip, reorder, and revisit,
- package validation proves packed templates match source templates,
- touched docs pass Markdown link checks,
- PRD/risk entries are closed or narrowed with implementation evidence.

<!-- make-docs:begin -->
# Archive Router

This directory is the current consolidated archive for all artifact types and mirrors the structure of `docs/`. It is the authority for current archival rules; other routers and contracts defer here.

W9 R4 defines `docs/assets/archive/**` as the managed lifecycle archive surface. W9 R5 adds `history/` as the on-demand home for history and breadcrumb records. Keep archived content in place unless an explicit archive migration phase moves or maps it with lineage-preserving links.

## Sub-directory mapping

- `docs/assets/archive/designs/` — archived designs (mirrors `docs/designs/`).
- `docs/assets/archive/plans/` — archived plan directories (mirrors `docs/plans/`).
- `docs/assets/archive/work/` — archived work directories (mirrors `docs/work/`).
- `docs/assets/archive/prds/` — archived PRD sets grouped by date: `docs/assets/archive/prds/YYYY-MM-DD/`; use `-XX` increment suffix when the same date repeats.
- `docs/assets/archive/history/` — history and breadcrumb records created by lifecycle closeout.
- `docs/assets/archive/breadcrumbs/` — archived historical breadcrumb records only when preserving pre-W9 R5 lineage.
- `docs/assets/archive/guides/developer/` — archived developer guides.
- `docs/assets/archive/guides/user/` — archived user guides.

Sub-directories are created only when an artifact is explicitly archived. Do not pre-create them.

## Rules

- HARD RULE: never move anything into `docs/assets/archive/` unless the user explicitly asks. Archiving can break relative links and obscure lineage.
- Archived artifacts are referenced in place via relative links to `docs/assets/archive/...`; they are not moved back to their original location.
- Do not move current archive records to `docs/assets/archive/**` without a dedicated migration plan that preserves lineage links.
<!-- make-docs:end -->

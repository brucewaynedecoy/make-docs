<!-- make-docs:begin -->
# Archive Router

This directory is the current consolidated archive for all artifact types and mirrors the structure of `docs/`. It is the authority for current archival rules; other routers and contracts defer here.

W9 R3 defines `docs/archive/**` as the planned lifecycle archive surface. Keep existing `docs/assets/archive/**` links readable until an explicit archive migration phase moves or maps archived content.

## Sub-directory mapping

- `docs/assets/archive/designs/` — archived designs (mirrors `docs/designs/`).
- `docs/assets/archive/plans/` — archived plan directories (mirrors `docs/plans/`).
- `docs/assets/archive/work/` — archived work directories (mirrors `docs/work/`).
- `docs/assets/archive/prds/` — archived PRD sets grouped by date: `docs/assets/archive/prds/YYYY-MM-DD/`; use `-XX` increment suffix when the same date repeats.
- `docs/assets/archive/history/` — archived history records (mirrors `docs/assets/history/`).
- `docs/assets/archive/guides/developer/` — archived developer guides.
- `docs/assets/archive/guides/user/` — archived user guides.

Sub-directories are created only when an artifact is explicitly archived. Do not pre-create them.

## Rules

- HARD RULE: never move anything into `docs/assets/archive/` unless the user explicitly asks. Archiving can break relative links and obscure lineage.
- Archived artifacts are referenced in place via relative links to `docs/assets/archive/...`; they are not moved back to their original location.
- Do not move current archive records to `docs/archive/**` without a dedicated migration plan that preserves lineage links.
<!-- make-docs:end -->

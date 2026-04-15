# Archive Router

This directory is the single consolidated archive for all artifact types and mirrors the structure of `docs/`. It is the authority for archival rules; other routers and contracts defer here.

## Sub-directory mapping

- `docs/.archive/designs/` — archived designs (mirrors `docs/designs/`).
- `docs/.archive/plans/` — archived plan directories (mirrors `docs/plans/`).
- `docs/.archive/work/` — archived work directories (mirrors `docs/work/`).
- `docs/.archive/prds/` — archived PRD sets grouped by date: `docs/.archive/prds/YYYY-MM-DD/`; use `-XX` increment suffix when the same date repeats.

Sub-directories are created only when an artifact is explicitly archived. Do not pre-create them.

## Rules

- HARD RULE: never move anything into `docs/.archive/` unless the user explicitly asks. Archiving can break relative links and obscure lineage.
- Archived artifacts are referenced in place via relative links to `docs/.archive/...`; they are not moved back to their original location.

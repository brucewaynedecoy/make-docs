# Phase 2 — Archive Router Updates

## Objective

Add guide sub-directory mappings to the archive router files so the archive-docs plugin can route archived guides to the correct locations. Both the template and dogfood copies must remain byte-identical after the change.

## Files to Modify

| # | File | Role |
|---|------|------|
| 1 | `packages/docs/template/docs/.archive/AGENTS.md` | Template authority — add guide sub-directories |
| 2 | `packages/docs/template/docs/.archive/CLAUDE.md` | Template mirror — must remain byte-identical to AGENTS.md |
| 3 | `docs/.archive/AGENTS.md` | Dogfood re-seed — copy of template AGENTS.md |
| 4 | `docs/.archive/CLAUDE.md` | Dogfood re-seed — copy of template CLAUDE.md |

## Detailed Changes

In the `## Sub-directory mapping` section of each file, replace the current text:

**Current text:**

```markdown
- `docs/.archive/designs/` — archived designs (mirrors `docs/designs/`).
- `docs/.archive/plans/` — archived plan directories (mirrors `docs/plans/`).
- `docs/.archive/work/` — archived work directories (mirrors `docs/work/`).
- `docs/.archive/prds/` — archived PRD sets grouped by date: `docs/.archive/prds/YYYY-MM-DD/`; use `-XX` increment suffix when the same date repeats.
```

**Replacement text:**

```markdown
- `docs/.archive/designs/` — archived designs (mirrors `docs/designs/`).
- `docs/.archive/plans/` — archived plan directories (mirrors `docs/plans/`).
- `docs/.archive/work/` — archived work directories (mirrors `docs/work/`).
- `docs/.archive/prds/` — archived PRD sets grouped by date: `docs/.archive/prds/YYYY-MM-DD/`; use `-XX` increment suffix when the same date repeats.
- `docs/.archive/guides/agent/` — archived agent session guides (mirrors `docs/guides/agent/`).
- `docs/.archive/guides/developer/` — archived developer guides (mirrors `docs/guides/developer/`).
- `docs/.archive/guides/user/` — archived user guides (mirrors `docs/guides/user/`).
```

The only change is appending three lines after the existing `prds/` entry. No other sections are modified.

## Parallelism

This phase has no file overlap with Phase 1 (scaffold and shared assets) and can run in parallel with it.

## Acceptance Criteria

1. All four files contain the three new `docs/.archive/guides/` sub-directory entries.
2. `packages/docs/template/docs/.archive/AGENTS.md` and `packages/docs/template/docs/.archive/CLAUDE.md` are byte-identical (`diff --brief` returns nothing).
3. `docs/.archive/AGENTS.md` and `docs/.archive/CLAUDE.md` are byte-identical to their template counterparts.
4. `bash scripts/check-instruction-routers.sh` passes (no router drift detected).
5. No other files are modified by this phase.

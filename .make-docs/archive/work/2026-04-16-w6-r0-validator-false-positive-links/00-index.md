# Validator False-Positive Link Fix — Work Backlog

## Purpose

This backlog tracks execution of the validator false-positive link fix. It is **Wave 6** (`w6-r0`) — a new initiative to fix a data-corruption bug in the decompose-codebase validator where programming syntax is misidentified as broken Markdown links. It derives from [the plan](../../plans/2026-04-16-w6-r0-validator-false-positive-links/00-overview.md) and the originating [design](../../designs/2026-04-16-validator-false-positive-links.md).

## Phase Map

| File | Purpose |
| --- | --- |
| [01-code-aware-filtering.md](01-code-aware-filtering.md) | Add fenced-code-block skipping and inline-code-span masking to `validate_links`. |
| [02-heuristic-rejection.md](02-heuristic-rejection.md) | Add post-match heuristic to reject non-path targets (commas, spaces, quotes, ellipsis). |
| [03-tests-and-validation.md](03-tests-and-validation.md) | Add regression tests; run full validation suite; manual spot-check. |

## Usage Notes

- Phases 1 and 2 can execute in parallel (pre-match filtering vs post-match rejection — disjoint code regions).
- Phase 3 depends on Phases 1 and 2.
- All changes are scoped to `packages/skills/decompose-codebase/scripts/` — no other packages are affected.

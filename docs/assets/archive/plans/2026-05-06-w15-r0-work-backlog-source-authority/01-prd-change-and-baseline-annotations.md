# Phase 1 - PRD Change and Baseline Annotations

## Objective

Create the active-set PRD change documentation that defines the source-authority contract for plan-derived work backlog generation.

## Depends On

- [2026-05-06-work-backlog-source-authority.md](../../designs/2026-05-06-work-backlog-source-authority.md)
- [00-overview.md](./00-overview.md)
- `docs/assets/references/prd-change-management.md`
- `docs/assets/templates/prd-change-revision.md`

## Files To Modify

- `docs/prd/14-revise-work-backlog-source-authority.md`
- `docs/prd/00-index.md`
- `docs/prd/09-dogfood-and-maintainer-operations.md`
- `docs/prd/03-open-questions-and-risk-register.md`, only if new risks or questions are discovered
- other impacted baseline docs only if discovered by focused search

## Detailed Changes

1. Create `docs/prd/14-revise-work-backlog-source-authority.md` as a revision change doc.
2. Define the source-priority ladder for work backlog generation.
3. State that root repo contracts and templates are primary, the approved plan is the content driver, archived examples are examples only, package skill projections are secondary, and mirrors are parity outputs.
4. Update `docs/prd/00-index.md` with the new PRD doc and status.
5. Add targeted baseline annotations where existing PRD text describes generated docs, skill maintenance, or maintainer workflow source authority.
6. Record only concrete risks or open questions in `docs/prd/03-open-questions-and-risk-register.md`.

## Parallelism

This phase is a serial prerequisite for root contract and skill updates. Keep PRD write scope separate from implementation edits.

## Acceptance Criteria

- `docs/prd/14-revise-work-backlog-source-authority.md` exists and links to the source design and plan.
- The PRD index includes the new change doc.
- Baseline annotations are focused and backlink to the change doc.
- No active PRD files are renumbered.
- Any unresolved ambiguity is captured in the risk register.

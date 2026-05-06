# Phase 1 - PRD Change and Baseline Annotations

## Objective

Create the active-set change documentation that defines the revised CLI conflict-resolution contract before implementation starts.

## Depends On

- [2026-05-06-cli-conflict-resolution.md](../../designs/2026-05-06-cli-conflict-resolution.md)
- [00-overview.md](./00-overview.md)
- `docs/assets/references/prd-change-management.md`
- `docs/assets/templates/prd-change-revision.md`

## Files To Modify

- `docs/prd/13-revise-cli-conflict-resolution.md`
- `docs/prd/00-index.md`
- `docs/prd/07-cli-command-surface-and-lifecycle.md`
- `docs/prd/11-revise-cli-asset-selection-simplification.md`
- `docs/prd/03-open-questions-and-risk-register.md`, only if new risks or questions are discovered

## Detailed Changes

1. Create `docs/prd/13-revise-cli-conflict-resolution.md` as a revision change doc.
2. Capture the required behavior:
   - inspect agent instructions, references, and templates before prompting;
   - ask once for `Overwrite all`, `Skip all`, or `Review each`;
   - review agent instructions before references, and references before templates;
   - remove the instruction-only `Update` decision from this flow;
   - preserve deterministic plan application after resolutions are collected.
3. Update `docs/prd/00-index.md` with the new PRD doc and status.
4. Annotate `docs/prd/07-cli-command-surface-and-lifecycle.md` where install or reconfigure conflict behavior is described.
5. Annotate `docs/prd/11-revise-cli-asset-selection-simplification.md` to connect always-managed references/templates to explicit conflict handling.
6. Use `docs/prd/03-open-questions-and-risk-register.md` only for concrete risks discovered during this phase.

## Parallelism

This phase is a serial prerequisite for the code phases. Keep the PRD write scope separate from implementation edits.

## Acceptance Criteria

- `docs/prd/13-revise-cli-conflict-resolution.md` exists and links back to the source design and this plan.
- The PRD index includes the new change doc.
- Baseline annotations point readers from current CLI behavior to the new conflict-resolution revision.
- No existing PRD files are renumbered.
- Any unresolved risks are recorded in the risk register rather than buried in chat.

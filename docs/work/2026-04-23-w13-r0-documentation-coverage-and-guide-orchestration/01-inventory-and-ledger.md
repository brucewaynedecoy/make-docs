# Phase 1: Inventory and Capability Coverage Ledger

> Derives from [Phase 1 of the plan](../../plans/2026-04-23-w13-r0-documentation-coverage-and-guide-orchestration/01-inventory-and-ledger.md).

## Purpose

Create the canonical capability coverage ledger before any guide prose is drafted. This phase inventories the current guide library first, scans historical wave artifacts second, validates current truth against the active PRD set and targeted code inspection third, and records mismatches or unresolved questions directly in the ledger.

## Overview

This phase establishes the evidence baseline for the rest of `W13 R0`. The main output is a normalized ledger at `supporting/capability-coverage-ledger.md` with one row per current-state capability or documentation-worthy surface. Historical implementation waves remain inputs, but the ledger must represent the product as it exists now.

## Source PRD Docs

- [../../prd/00-index.md](../../prd/00-index.md)
- [../../prd/01-product-overview.md](../../prd/01-product-overview.md)
- [../../prd/02-architecture-overview.md](../../prd/02-architecture-overview.md)
- [../../prd/05-installation-profile-and-manifest-lifecycle.md](../../prd/05-installation-profile-and-manifest-lifecycle.md)
- [../../prd/06-template-contracts-and-generated-assets.md](../../prd/06-template-contracts-and-generated-assets.md)
- [../../prd/07-cli-command-surface-and-lifecycle.md](../../prd/07-cli-command-surface-and-lifecycle.md)
- [../../prd/08-skills-delivery-and-runtime-integration.md](../../prd/08-skills-delivery-and-runtime-integration.md)
- [../../prd/09-dogfood-and-maintainer-operations.md](../../prd/09-dogfood-and-maintainer-operations.md)
- [../../prd/10-packaging-validation-and-release-reference.md](../../prd/10-packaging-validation-and-release-reference.md)

## Source Plan Phases

- [00-overview.md](../../plans/2026-04-23-w13-r0-documentation-coverage-and-guide-orchestration/00-overview.md)
- [01-inventory-and-ledger.md](../../plans/2026-04-23-w13-r0-documentation-coverage-and-guide-orchestration/01-inventory-and-ledger.md)

## Stage 1 - Seed the guide inventory and ledger scaffold

### Tasks

1. Create `docs/work/2026-04-23-w13-r0-documentation-coverage-and-guide-orchestration/supporting/`.
2. Create `supporting/capability-coverage-ledger.md` with the fixed schema fields: `capability`, `source waves/revisions/phases`, `current status`, `evidence links`, `existing guide overlap`, `developer guide action`, `user guide action`, `suggested guide path/title`, `priority`, and `related docs`.
3. Inventory every existing guide under `docs/guides/user/` and `docs/guides/developer/` before historical discovery begins.
4. Record, for each existing guide, the title, `path`, audience, `status`, current topical coverage, and obvious overlap or drift risk against the active PRD set.
5. Seed the ledger with reuse candidates for the known guide anchors named by the plan before any new standalone guide ideas are entertained.

### Acceptance criteria

- [ ] The `supporting/` directory exists inside the `W13 R0` work backlog.
- [ ] The ledger exists at the planned support path with the fixed schema already present.
- [ ] Existing guide coverage is cataloged before any wave-artifact scan begins.
- [ ] The initial inventory distinguishes current reuse candidates from obvious gaps or drift risks.

### Dependencies

- None.

## Stage 2 - Run the read-only historical discovery lanes

### Tasks

1. Split historical discovery across the fixed inventory ranges: `W1-W4`, `W5-W8`, and `W9-W12`.
2. In each range, inspect source classes in the same order: design docs, plan docs, work backlogs, then history records.
3. Return normalized candidate rows and evidence links only. Do not draft guide prose, assign final filenames, or claim bundle ownership during this stage.
4. Record any apparent overlap with existing guides so the synthesis pass can decide whether the later action is update, create, link-only, or none.
5. Keep chronology notes concise and tied to evidence links rather than narrative summaries.

### Acceptance criteria

- [ ] Each inventory lane covers its assigned wave range and uses the required source order.
- [ ] Discovery outputs are normalized candidate rows rather than free-form prose.
- [ ] No guide files under `docs/guides/` are modified during this stage.
- [ ] Evidence links are specific enough for later ledger review and traceability.

### Dependencies

- Stage 1 - Seed the guide inventory and ledger scaffold.

## Stage 3 - Validate current truth and synthesize canonical ledger rows

### Tasks

1. Validate every candidate capability against the active PRD set first and targeted code inspection second.
2. Use git history only when chronology or lineage remains unresolved after PRD and current-code review.
3. Merge candidate rows into the canonical ledger and record one current-state row per capability surface.
4. Mark historical-vs-current mismatches explicitly in the ledger instead of silently dropping the historical evidence.
5. Capture unresolved questions when a capability remains ambiguous, stale, or already-covered-but-uncertain.

### Acceptance criteria

- [ ] PRD and current-code validation happen before any git-history fallback.
- [ ] The ledger records current truth even when historical artifacts disagree.
- [ ] Mismatches and unresolved questions are explicit rather than implied.
- [ ] The canonical ledger, not the lane outputs, becomes the authoritative Phase 1 artifact.

### Dependencies

- Stage 2 - Run the read-only historical discovery lanes.

## Stage 4 - Collapse duplicates and prepare the Phase 2 handoff

### Tasks

1. Collapse multi-wave or multi-revision implementations of the same capability into one current-state ledger row.
2. Merge rename-driven duplicates and phased rollout fragments into one capability record when the user or maintainer surface is still the same.
3. Leave `developer guide action`, `user guide action`, `suggested guide path/title`, and `priority` present but provisional where Phase 2 still needs to resolve them.
4. Add a short Phase 2 handoff section or note block that lists unresolved rows, evidence gaps, and guide-overlap conflicts needing rubric review.

### Acceptance criteria

- [ ] Multi-wave duplicates are collapsed into current-state capability rows.
- [ ] The ledger schema is complete even where final values are still provisional.
- [ ] Phase 2 receives a clear handoff of unresolved or conflicting rows.
- [ ] No guide drafting begins before this handoff is complete.

### Dependencies

- Stage 3 - Validate current truth and synthesize canonical ledger rows.

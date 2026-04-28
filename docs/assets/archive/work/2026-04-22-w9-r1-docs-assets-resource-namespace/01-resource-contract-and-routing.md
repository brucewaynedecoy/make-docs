# Phase 1: Resource Contract and Routing

> Derives from [Phase 1 of the plan](../../plans/2026-04-22-w9-r1-docs-assets-resource-namespace/01-resource-contract-and-routing.md).

## Purpose

Establish one active path contract before moving files or changing generated output.

`docs/assets/` should route only document resources. Root `.make-docs/` should route make-docs runtime state.

## Overview

This phase updates active docs, router files, workflow references, templates, prompts, and package-facing language so later file moves have a stable destination model. It should not perform the physical template or dogfood resource moves except where a small paired edit is required to keep links valid.

## Source PRD Docs

None. This backlog is derived from the W9 R1 plan and design, not from an active PRD namespace.

## Source Plan Phases

- [Phase 1 - Resource Contract and Routing](../../plans/2026-04-22-w9-r1-docs-assets-resource-namespace/01-resource-contract-and-routing.md)

## Stage 1: Normalize Active Path Contracts

### Tasks

- [x] Update `docs/AGENTS.md` and `docs/CLAUDE.md` so direct project documents stay under normal docs directories and reusable support resources route through `docs/assets/`.
- [x] Update active reference docs that describe workflows, output contracts, design docs, planning docs, archive behavior, guide generation, and wave conventions.
- [x] Update template and prompt source text so future links point to `docs/assets/templates/`, `docs/assets/references/`, and `docs/assets/prompts/`.
- [x] Update archive and history router language so future archive records go to `docs/assets/archive/` and history records go to `docs/assets/history/`.
- [x] Replace active config/state guidance with root `.make-docs/manifest.json` and `.make-docs/conflicts/<run-id>/`.

### Acceptance criteria

- [x] Active router text distinguishes project-doc output directories from reusable `docs/assets/` resources.
- [x] Active resource guidance uses `docs/assets/archive/`, `docs/assets/history/`, `docs/assets/prompts/`, `docs/assets/references/`, and `docs/assets/templates/`.
- [x] Active state guidance uses `.make-docs/manifest.json` and `.make-docs/conflicts/<run-id>/`.
- [x] No active instruction describes `docs/assets/` as a CLI state directory.

### Dependencies

- None. This phase establishes the shared contract for later phases.

## Stage 2: Prepare Template-Side Router Language

### Tasks

- [x] Update matching active router/source files under `packages/docs/template/docs/**` while the old hidden directories still exist.
- [x] Ensure template wording says `docs/assets/` contains document resources only.
- [x] Remove or rewrite template wording that points manifest, conflict, state, or config files under `docs/assets/`.
- [x] Keep links valid during this phase by updating linked text in the same change or deferring link-only rewrites until Phase 2 moves targets.

### Acceptance criteria

- [x] Template source prose agrees with the new resource/state split.
- [x] Template source prose does not introduce `docs/assets/config/`, `docs/assets/state/`, `docs/assets/manifest.json`, or `docs/assets/conflicts/`.
- [x] Any remaining old-path mentions are clearly transitional or historical, not future-facing instructions.

### Dependencies

- Stage 1 contract language should be drafted first so template wording mirrors it.

## Stage 3: Scan Active Routing Surfaces

### Tasks

- [x] Search active docs and template source for future-facing references to retired paths.
- [x] Classify old-path matches as active, historical, negative, or transitional.
- [x] Fix active matches that route new work to retired hidden directories or docs-tree state paths.

### Acceptance criteria

- [x] No active source-of-truth doc points future work to `docs/.archive/`, `docs/.assets/`, `docs/.prompts/`, `docs/.references/`, `docs/.templates/`, or `docs/.resources/`.
- [x] No active source-of-truth doc points state to `docs/assets/manifest.json`, `docs/assets/conflicts/`, `docs/assets/state/`, or `docs/assets/config/`.
- [x] Remaining retired-path references are acceptable historical or rejection context.

### Dependencies

- Stages 1 and 2 should complete before the final scan.

## Completion Notes

- Completed on 2026-04-22.
- History record: [2026-04-22-w9-r1-p1-resource-contract-and-routing.md](../../../history/2026-04-22-w9-r1-p1-resource-contract-and-routing.md)

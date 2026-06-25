# v2 Library and Archive History IA Correction

## Purpose

Capture the Make Docs v2 corrective information-architecture decision that replaces the W9 R4 `docs/assets/guides/**` and `docs/assets/breadcrumbs/**` targets before downstream package, template, PRD, plan, work, and dogfood migration work proceeds.

This design is a related successor to [v2 Documentation Asset IA Hard Move](2026-06-25-v2-documentation-asset-ia-hard-move.md). W9 R4 remains completed historical evidence for the hard move of top-level artifacts/archive and `.make-docs/**` tool resources. W9 R5 supersedes only the guide/library and history/breadcrumb path decisions.

## Context

The edited seed input in [evolution-direction-structure.md](../assets/artifacts/evolution-direction-structure.md) now names a cleaner documentation asset tree than the W9 R4 implementation closed on. The new target keeps project asset families under `docs/assets/**`, but changes two W9 R4 conclusions:

- `docs/assets/guides/**` becomes `docs/assets/library/**`.
- `docs/assets/breadcrumbs/**` is not the future closeout path; history/breadcrumb records move under `docs/assets/archive/history/**`.

The current make-docs repository has already dogfooded several intermediate layouts. It contains active routers under `docs/assets/guides/**` and `docs/assets/breadcrumbs/**`, older records under `docs/assets/history/**`, legacy guides under `docs/guides/**`, and a transitional playbook copy under `docs/library/playbooks/**`. Those paths are useful migration-lab evidence, but they must not remain shipped v2 contract.

## Decision

Use W9 R5 as the blocking corrective authority for v2 documentation asset IA. The future public documentation interfaces are:

```text
docs/
  assets/
    archive/
      history/
    artifacts/
    library/
    playbooks/
  designs/
  plans/
  prd/
  work/

.make-docs/
  agentics/
  contracts/
  references/
  scripts/
  templates/
  config.yaml
  manifest.json
```

`docs/assets/library/**` is the canonical home for guide and other persona-based project documentation. It serves the same purpose previously assigned to `docs/guides/**` in v1 and to `docs/assets/guides/**` in W9 R3/W9 R4, including maintainer, user, agent, and future configured-persona documentation.

`docs/assets/archive/history/**` is the canonical home for future history and breadcrumb records. It replaces both `docs/assets/history/**` and `docs/assets/breadcrumbs/**`. The parent `docs/assets/archive/` router must explicitly map `history/` to this purpose. As with other archive subdirectories, the `history/` directory is created only when history entries exist; blank new installs must not pre-create it.

No deprecated aliases are shipped for `docs/assets/guides/**`, `docs/assets/breadcrumbs/**`, `docs/assets/history/**`, `docs/guides/**`, or `docs/library/**`. Migration work should move this repo's existing dogfood content now, repair non-historical links, and preserve old path mentions only when they describe completed historical state.

`docs/assets/artifacts/**`, `docs/assets/playbooks/**`, `docs/assets/archive/**`, and `.make-docs/**` keep the W9 R4 meanings. Top-level `docs/artifacts/**` and top-level `docs/archive/**` remain rejected shipped v2 targets.

## Alternatives Considered

### Keep W9 R4 breadcrumbs

Rejected. Keeping `docs/assets/breadcrumbs/**` creates a separate lifecycle-storage family beside the archive even though history records behave like archive evidence. It also leaves `docs/assets/history/**` and `docs/assets/breadcrumbs/**` competing in instructions, templates, package tests, and closeout helpers.

### Keep W9 R4 guides

Rejected. `docs/assets/library/**` is clearer for the broader purpose: guides and other persona-based documentation about using, maintaining, and operating the project. The old `guides` name makes the container too narrow and leaves `docs/library/**` transitional evidence unresolved.

### Support aliases during v2

Rejected. Alias support would keep all five old paths live in routers, templates, compatibility checks, and agent instructions. The purpose of W9 R5 is to reduce path ambiguity before remaining v2 work continues.

## Consequences

The downstream plan uses W9 R5 because W9 R4 is already committed and this design corrects two W9 R4 path decisions. Workers must apply W9 R5 before any future W10, W16, W17, W18, or later v2 work that references project asset paths, template source, closeout history, guide/library coverage, compatibility fallback paths, or dogfood migration.

Active PRDs should be reconciled in place because the affected features are future-forward or still being reworked. No new numbered PRD change doc is required solely for this correction. Primary reconciliation owners are PRD 22 and the risk register; supporting updates belong in architecture, dogfood operations, template source-of-truth, configuration overlay, and any active PRD that still names the old targets as future-facing contract.

Implementation must update package source, package templates, generated CLI template copies, closeout/archive skill helpers, tests, smoke-pack expectations, manifests, dogfood directories, and non-historical docs links together. The migration is not complete while any fresh install or closeout helper can still create `docs/assets/guides/**`, `docs/assets/breadcrumbs/**`, `docs/assets/history/**`, `docs/guides/**`, or `docs/library/**`.

## Design Lineage

Update Mode: `new-doc-related`

Prior Design Docs: [v2 Documentation Asset IA Hard Move](2026-06-25-v2-documentation-asset-ia-hard-move.md), [New Docs Assets, Playbooks, and Persona Model](2026-06-19-new-docs-assets-playbooks-and-persona-model.md), [Template, Package, and Dogfood Source-of-Truth Contract](2026-06-19-template-package-and-dogfood-source-of-truth-contract.md)

Source Inputs: [evolution-direction-structure.md](../assets/artifacts/evolution-direction-structure.md)

Reason: W9 R5 materially corrects W9 R4's guide and breadcrumb targets while preserving W9 R4's completed hard-move evidence for artifacts, archive, and `.make-docs/**`.

## Intended Follow-On

Route: `change-plan`

Next Prompt: [designs-to-plan-change.prompt.md](../../.make-docs/references/system/prompts/designs-to-plan-change.prompt.md)

Why: This design revises active W9 asset IA assumptions and should feed PRD reconciliation plus a W9 R5 delta plan/work backlog, not a fresh baseline.

Coordinate Handoff: Prior completed coordinate is W9 R4 for the v2 documentation asset IA hard move. Use W9 R5 for the downstream corrective change plan, matching work backlog, implementation history, and closeout.

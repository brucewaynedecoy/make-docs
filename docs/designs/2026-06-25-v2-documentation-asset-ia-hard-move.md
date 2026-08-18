# v2 Documentation Asset IA Hard Move

## Purpose

Capture the Make Docs v2 documentation asset information architecture pivot as durable design authority before downstream PRD, plan, work backlog, template, or migration changes are made.

This design resolves the remaining ambiguity around top-level `docs/artifacts/`, top-level `docs/archive/`, the future breadcrumb namespace, and the difference between this repository's dogfooded `docs/` tree and the shipped Make Docs documentation system.

## W9 R5 Supersession

[v2 Library and Archive History IA Correction](2026-06-25-v2-library-and-archive-history-ia-correction.md) supersedes this design's guide/library and history/breadcrumb targets. This design remains authoritative for the hard move from top-level `docs/artifacts/**` to `docs/assets/artifacts/**`, rejection of top-level `docs/archive/**`, and the `.make-docs/**` system machinery split.

## Context

Batch 2 previously established the direction that `.make-docs/**` owns tool resources, runtime state, and configuration while `docs/assets/**` remains available for reusable documentation assets. The accepted [Tool Directory System and Custom Resource Tiers](2026-06-19-tool-directory-system-and-custom-resource-tiers.md) design reserved `.make-docs/**` for make-docs-owned system and custom resources. The accepted [New Docs Assets, Playbooks, and Persona Model](2026-06-19-new-docs-assets-playbooks-and-persona-model.md) design then used `docs/assets/**` for reader-facing guides and playbooks, but it left archive placement and lifecycle-storage cleanup as follow-on work.

The edited seed input in [evolution-direction-structure.md](../assets/artifacts/evolution-direction-structure.md) shows a cleaner future structure than the current generated and dogfooded directory mix. It moves product machinery under `.make-docs/**` and keeps project documentation assets under `docs/assets/**`. It also proposes `docs/assets/artifacts/**` as the future optional pre-design input surface and `docs/assets/breadcrumbs/**` as the future breadcrumb surface.

The current repository state is not the same as the shipped product contract. This repo has already dogfooded several intermediate structures, and it also contains unmanaged or historical material under `docs/`. That makes it useful as a migration laboratory, but dangerous as an accidental source of truth. The shipped template contract must be defined explicitly instead of inferred from whatever exists in this repo's active `docs/` tree today.

## Decision

Use this design as the authority for the v2 asset IA pivot. The move is hard: top-level `docs/artifacts/**` and top-level `docs/archive/**` are not shipped v2 documentation-system targets and should not be retained as deprecated alias surfaces in the product contract.

The future public documentation interfaces are:

```text
.make-docs/
  agentics/
  contracts/
  references/
  scripts/
  templates/
  AGENTS.md
  CLAUDE.md
  config.yaml
  manifest.json

docs/
  assets/
    archive/
    artifacts/
    breadcrumbs/
    guides/
    playbooks/
    AGENTS.md
    CLAUDE.md
  designs/
  plans/
  prd/
  work/
```

`.make-docs/**` owns Make Docs machinery: system and custom contracts, workflow references, deterministic helper scripts, structural templates, shared agentic assets, config, manifest, runtime provenance, and instruction routers for that machinery. Product-owned contracts such as commit-message, design, guide, history-entry, and output contracts belong under `.make-docs/contracts/**` after migration. Workflow references belong under `.make-docs/references/**`. Templates belong under `.make-docs/templates/**`. Scripts belong under `.make-docs/scripts/**`.

`docs/assets/**` owns people-and-agent-managed project documentation assets. It is not a dumping ground for tool resources or runtime state. Its shipped v2 asset families are:

- `docs/assets/archive/**`: managed archive storage, created when archive behavior needs it.
- `docs/assets/artifacts/**`: optional zero-contract pre-design input material, not created by default.
- `docs/assets/breadcrumbs/**`: future history breadcrumb storage, replacing future writes to `docs/assets/history/**`.
- `docs/assets/guides/**`: persona-scoped living guides.
- `docs/assets/playbooks/**`: persona-scoped repeatable process documents.

Existing `docs/assets/history/**` remains historical migration evidence. New design, PRD, plan, work, and closeout breadcrumb records should describe `docs/assets/breadcrumbs/**` as the target. They should describe `docs/assets/history/**` only as pre-migration or preservation evidence.

The current top-level `docs/artifacts/**` material is seed input. It should be moved to `docs/assets/artifacts/**` by a planned migration, not preserved as a product-level alias. After migration, future Make Docs templates and generated routers must point to `docs/assets/artifacts/**` when they need optional pre-design source material.

Top-level `docs/assets/archive/**` is rejected as a future shipped v2 target. Archive storage belongs under `docs/assets/archive/**`, so lifecycle references, output contracts, package templates, and migration rules should stop treating `docs/assets/archive/**` as the planned archive destination.

The make-docs repo's active `docs/` tree is a dogfood and migration-lab surface. Migration logic should be tested against this repo's mixed state, including already-dogfooded files, historical references, and unmanaged local material. That evidence must not redefine the shipped template contract. The template source, package copy, and CLI install surfaces must continue to distinguish product-owned shipped defaults from this repo's local cleanup needs.

Downstream reconciliation should update active future-facing references in place, but it should not rewrite historical records just to make past prose look current. Archived designs, completed work backlogs, and existing breadcrumb/history entries may keep factual references to the paths that existed when they were written. Future-facing contracts, routers, templates, PRDs, plans, and work backlogs must use the new target IA.

## Alternatives Considered

### Keep top-level `docs/artifacts/**` as a deprecated alias

Rejected. Keeping an alias would preserve the messy root shape this pivot is meant to fix and would force agents, routers, package templates, and migration checks to support two live input surfaces indefinitely.

### Move archive storage to top-level `docs/archive/**`

Rejected. This keeps another managed asset family at the root of `docs/` and undermines the cleaner rule that reusable or managed documentation assets live below `docs/assets/**`.

### Infer the shipped structure from this repository's current `docs/` tree

Rejected. This repository is both a dogfood consumer and a workspace with unmanaged historical material. Treating it as the shipped source of truth would let local clutter become product contract.

### Reconcile PRDs and backlogs without a pivot design

Rejected. The pivot changes future structure, migration semantics, and authority boundaries across multiple accepted v2 designs. A dedicated design gives downstream PRD and planning work one durable decision record.

## Consequences

The next lifecycle step is PRD reconciliation against this design. PRD 21 and PRD 22 are the primary owners, with supporting updates in the active index, overview, architecture, risk register, template/generated-assets, CLI lifecycle, dogfood operations, packaging validation, materialization, source-of-truth, metadata handoffs, configuration overlay, playbook/run-playbook, harness bundle, and coverage/adversarial-review PRDs.

The downstream plan should use W9 R4 because this design pivots the completed W9 R2 tool-directory work and W9 R3 docs-assets work. The downstream plan and work backlog must not ask implementers to decide whether `docs/assets/artifacts/**` is a hard move, whether `docs/assets/archive/**` remains a target, whether breadcrumbs live under `docs/assets/breadcrumbs/**`, or whether the local dogfood tree defines shipped structure. Those decisions are made here.

Migration work must separate three classes of content:

- product-owned system resources that move under `.make-docs/**`
- managed project documentation assets that move or remain under `docs/assets/**`
- historical or unmanaged make-docs repo material that may need link repair, archive preservation, or migration-lab coverage without becoming product contract

Validation must prove that future-facing references no longer describe top-level `docs/artifacts/**` or top-level `docs/archive/**` as shipped v2 targets while preserving historical references where they are factual. Package and dogfood validation must prove that shipped templates, CLI template copies, and this repo's dogfood state stay intentionally distinct.

## Design Lineage

Update Mode: `new-doc-related`

Prior Design Docs: [Tool Directory System and Custom Resource Tiers](2026-06-19-tool-directory-system-and-custom-resource-tiers.md), [New Docs Assets, Playbooks, and Persona Model](2026-06-19-new-docs-assets-playbooks-and-persona-model.md), [Template, Package, and Dogfood Source-of-Truth Contract](2026-06-19-template-package-and-dogfood-source-of-truth-contract.md), [System Asset Delivery and Materialization Contract](2026-06-19-system-asset-delivery-and-materialization-contract.md)

Source Inputs: [evolution-direction-structure.md](../assets/artifacts/evolution-direction-structure.md), [v2 Proposed Design and Roadmap](../assets/artifacts/v2-proposed-design-and-roadmap.md)

Reason: This design materially updates prior Batch 2 information-architecture intent by making `docs/assets/artifacts/**` a hard move, rejecting top-level `docs/archive/**` as a shipped target, naming `docs/assets/breadcrumbs/**` as the future breadcrumb location, and defining the current make-docs `docs/` tree as dogfood and migration-lab evidence rather than shipped product contract.

## Intended Follow-On

Route: `change-plan`

Next Prompt: [designs-to-plan-change.prompt.md](../../.make-docs/system/prompts/designs-to-plan-change.prompt.md)

Why: This design revises active W9 tool-directory and docs-assets assumptions, then feeds PRD reconciliation and a delta plan/work backlog rather than creating a new baseline.

Coordinate Handoff: Prior completed coordinates are W9 R2 for tool-directory system/custom resource tiers and W9 R3 for docs-assets, playbooks, and persona model. Use W9 R4 for the downstream change plan and matching work backlog.

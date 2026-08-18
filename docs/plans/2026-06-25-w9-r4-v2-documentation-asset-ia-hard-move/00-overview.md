# v2 Documentation Asset IA Hard Move - PRD Change Plan

## Objective

Reconcile the active Make Docs v2 product requirements and execution path with the accepted [v2 Documentation Asset IA Hard Move](../../designs/2026-06-25-v2-documentation-asset-ia-hard-move.md) design.

This plan captures the W9 R4 delta work for moving future-facing structure from the older `docs/artifacts/**` and `docs/archive/**` assumptions to the hard target of `docs/assets/{archive,artifacts,breadcrumbs,guides,playbooks}/**`, while keeping `.make-docs/**` as the system machinery namespace.

## W9 R5 Supersession

W9 R4 remains historical implementation evidence for the top-level artifact/archive hard move and `.make-docs/**` system machinery split. W9 R5 supersedes W9 R4 for guide/library and history/breadcrumb targets: future work must use `docs/assets/library/**` and `docs/assets/archive/history/**`, not W9 R4's `docs/assets/guides/**` or `docs/assets/breadcrumbs/**` targets.

## Coordinate Decision

- Coordinate: `W9 R4`
- Plan directory: `docs/plans/2026-06-25-w9-r4-v2-documentation-asset-ia-hard-move/`
- Work backlog: `docs/work/2026-06-25-w9-r4-v2-documentation-asset-ia-hard-move/`
- Reason: the pivot revises completed W9 R2 tool-directory work and W9 R3 docs-assets work without starting a new wave. The accepted design explicitly hands downstream planning to W9 R4.

## Change Classification

- Type: Revision
- Route: active-set evolution
- Primary PRDs: [21 Revise Tool Directory System Custom Resource Tiers](../../prd/21-project-tool-directory-and-resource-tiers.md), [22 Revise New Docs Assets Playbooks Persona Model](../../prd/22-project-documentation-asset-model.md#requirements)
- Supporting PRDs: [00 Index](../../prd/00-index.md), [03 Open Questions and Risk Register](../../prd/03-open-questions-and-risk-register.md), [06 Template Contracts and Generated Assets](../../prd/06-template-contracts-and-generated-assets.md), [09 Dogfood and Maintainer Operations](../../prd/09-dogfood-and-maintainer-operations.md), [10 Packaging Validation and Release Reference](../../prd/10-packaging-validation-and-release-reference.md), [17 Revise System Asset Materialization Contract](../../prd/17-system-asset-materialization-and-local-bootstrap.md), [19 Revise Template Package Dogfood Source of Truth Contract](../../prd/06-template-contracts-and-generated-assets.md#template-source-authority), [23 Revise Generated Metadata Lifecycle Handoffs](../../prd/23-generated-document-metadata-and-lifecycle-handoffs.md), [24 Revise Configuration Convention Overlay](../../prd/24-project-configuration-and-convention-overlay.md), [29 Revise Playbook Contract Run Playbook](../../prd/34-playbook-authoring-contract-and-model.md) (historical section: `authoring-location-authority-and-parity-r-auth`), [30 Revise Harness Plugin Substrate Workflow Bundles](../../prd/30-plugin-substrate-and-workflow-bundles.md), and [31 Revise Coverage Pass Extensions Adversarial Review](../../prd/14-lifecycle-workflow-and-coverage-passes.md)

## Change Inputs

- [v2 Documentation Asset IA Hard Move](../../designs/2026-06-25-v2-documentation-asset-ia-hard-move.md)
- [evolution-direction-structure.md](../../assets/artifacts/evolution-direction-structure.md)
- [Tool Directory System and Custom Resource Tiers](../../designs/2026-06-19-tool-directory-system-and-custom-resource-tiers.md)
- [New Docs Assets, Playbooks, and Persona Model](../../designs/2026-06-19-new-docs-assets-playbooks-and-persona-model.md)
- [Template, Package, and Dogfood Source-of-Truth Contract](../../designs/2026-06-19-template-package-and-dogfood-source-of-truth-contract.md)

## Baseline Context

The current active PRD set already distinguishes `.make-docs/**` tool-resource ownership from reader-facing `docs/assets/**` assets, but it still contains future-facing references to top-level `docs/artifacts/**`, top-level `docs/archive/**`, and unresolved history storage. W9 R4 reconciles those references with the accepted hard-move design.

The make-docs repo's current `docs/` tree remains dogfood and migration-lab evidence. It should be used to prove migration behavior, but it must not define shipped Make Docs template structure by accident.

## Output Contract

- Update active future-facing PRDs in place.
- Do not create a new numbered PRD change doc for this pivot.
- Preserve historical references that describe past path state.
- Generate a delta work backlog under the W9 R4 work directory.
- Keep implementation deferred to the work backlog; this plan and PRD reconciliation only define authority and execution shape.

## Phase Map

1. [Active PRD and Risk Reconciliation](01-active-prd-and-risk-reconciliation.md) - update active PRD ownership and risk/register references to make the hard move authoritative.
2. [Asset IA and Router Contract Plan](02-asset-ia-router-contracts.md) - define the future-facing router, lifecycle, output, and migration contract edits required by the pivot.
3. [Template Package and Dogfood Migration Lab](03-template-package-and-dogfood-migration-lab.md) - plan template/package parity and the make-docs repo dogfood migration-lab split.
4. [Validation Breadcrumbs and Closeout](04-validation-breadcrumbs-and-closeout.md) - define validation, breadcrumb/history handling, and closeout criteria for W9 R4.

## Validation

- Confirm W9 R4 is used consistently in the plan and work backlog.
- Confirm future-facing PRD text no longer treats top-level `docs/artifacts/**` or `docs/archive/**` as shipped v2 targets.
- Confirm historical references remain factual instead of being rewritten opportunistically.
- Confirm the generated work backlog does not ask implementers to decide the hard move, breadcrumb path, archive target, or dogfood boundary.
- Run changed-file link checks and `git diff --check`.

## Intended Follow-On

Route: `prd-generation`

Next step: reconcile the active PRD set from this plan, then generate the matching W9 R4 delta work backlog.

Why: the accepted design must become active product contract before implementation changes rewrite routers, templates, CLI path knowledge, or dogfood files.

Coordinate Handoff: carry `W9 R4` into PRD reconciliation, work backlog generation, implementation history, and closeout.

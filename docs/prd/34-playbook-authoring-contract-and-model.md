---
title: "34 Procedural Asset Boundary and Legacy Compatibility"
kind: "prd"
status: "active"
source:
  type: "design"
  path: "docs/designs/2026-06-30-playbook-contract-and-model.md"
---

# 34 Procedural Asset Boundary and Legacy Compatibility

## Purpose

This document defines the current Make Docs boundary for procedural assets and the safe treatment of legacy Playbook- or Protocol-shaped content. Make Docs v2 has no in-product Playbook or Protocol authoring capability; Requirement History and Source Anchors preserve the prior contract as provenance only.

## Scope

This authority owns the present absence of a Playbook/Protocol document kind, schema, catalog, parser, validator, default asset family, or authoring model. It also owns the requirement that historical, project-authored, modified, mixed-ownership, and ambiguous content remains preserved and is never silently reclassified as current Make Docs authority.

General system workflows use first-class contracts, prompts, references, templates, and typed operations owned by the resource, runtime, lifecycle, and capability-specific PRDs. They do not revive a Playbook or Protocol model.

## Component and Capability Map

- Current procedural resources: system contracts, prompts, references, and templates resolved through the installed CLI and native MCP resources where supported.
- Current capability authority: the owning product PRD, such as [46-naive-end-user-acceptance-testing.md](46-naive-end-user-acceptance-testing.md), not a generic procedural document kind.
- Legacy content: former Playbook/Protocol assets and project-authored lookalikes preserved through provenance-aware migration.
- Historical provenance: dated designs, plans, work, archives, and evidence retain their original terminology without becoming current capability authority.

## Requirements

### Current Product Boundary (R-SCOPE)

- R-SCOPE-1 (MUST): Make Docs defines no Playbook or Protocol document kind, filename convention, frontmatter schema, dependency registry, workflow block, step model, stack discriminator, catalog identity, parser, validator, diagnostic family, default procedural asset, or generic authoring contract.
- R-SCOPE-2 (MUST): current templates, routers, manifests, catalogs, CLI/MCP operations, and user guidance must not advertise or require Playbook or Protocol authoring. The frozen P3 legacy surfaces are a staged compatibility exception and do not create a current support claim.
- R-SCOPE-3 (MUST): generic system workflows are composed from the four peer system-resource types and typed operations. They remain owned by their capability PRDs and do not share a hidden Playbook/Protocol schema.
- R-SCOPE-4 (MUST): the standalone Playbooks product is independent and optional. Make Docs does not bundle, discover, depend on, or claim interoperability with it.

### Legacy Content Compatibility (R-LEGACY)

- R-LEGACY-1 (MUST): historical designs, plans, work backlogs, archives, evidence, and completed implementation records retain their terminology and bytes as provenance. Historical references do not create a current product obligation.
- R-LEGACY-2 (MUST): project-authored, modified managed, mixed-ownership, unknown, or ambiguous Playbook/Protocol-shaped files are preserved in place or exported through an explicitly reviewed migration. A path, suffix, heading, or former kind never proves Make Docs ownership.
- R-LEGACY-3 (MUST): only clean files with verified Make Docs ownership and a current trusted hash may be transformed or removed automatically under the migration authority in [18-compatibility-classification-and-migration-safety.md](18-compatibility-classification-and-migration-safety.md).
- R-LEGACY-4 (MUST): preserved/exported legacy content records original path, hash, former classification, disposition, and provenance without claiming current support.
- R-LEGACY-5 (MUST): no compatibility parser, alias, Protocol placeholder, or automatic conversion recreates the former authoring model. Ambiguous content fails closed for review.
- R-LEGACY-6 (MUST): P3 preserves and freezes every existing legacy Playbook and Protocol registry entry, implementation, CLI surface, and MCP surface. It adds no legacy behavior. P5 is the quiescence stop barrier. P8 owns the fresh trace, backup, and removal.

### Capability-Specific Workflow Boundary (R-WORKFLOW)

- R-WORKFLOW-1 (MUST): capability-specific workflows place reusable authored policy in current system resources and deterministic behavior in the TypeScript operation registry.
- R-WORKFLOW-2 (MUST): Naive-UAT qualification, installed-product targeting, anti-coaching, Persona choice, scenario identity, evidence, findings, and gate semantics remain owned by PRD 46 and its paired authorities. A Playbook-shaped facilitator or tester asset is not current authority.
- R-WORKFLOW-3 (MUST): the optional first-party Naive-UAT Skill routes to the same CLI/MCP workflow and contains no copied procedural policy.

### Public and Internal Surface (R-SURFACE)

- R-SURFACE-1 (MUST): outside the frozen P3 compatibility set, no `playbook.*` or `protocol.*` authoring, catalog, validation, or discovery operation appears in the current operation registry, CLI, or MCP surface.
- R-SURFACE-2 (MUST): current support claims and conformance scenarios contain no Playbook/Protocol authoring tuple. Historical conformance records may remain only as provenance.

## Non-Requirements

- No in-product Playbook or Protocol authoring capability.
- No generic procedural document schema, parser, validator, catalog, selection model, or default asset family.
- No automatic reinterpretation or semantic conversion of legacy content.
- No standalone Playbooks product integration or compatibility claim.
- No requirement to rewrite historical records or project-authored content.

## Acceptance Criteria

- Current product authority exposes no Playbook or Protocol authoring model. The frozen P3 compatibility set remains unchanged until the P5 stop barrier and the P8 removal.
- Current workflows use system resources and typed operations owned by their capability PRDs.
- User-authored, modified, mixed, unknown, and ambiguous legacy content is preserved and fails closed for review.
- Only verified clean managed assets are eligible for reviewed migration or removal.
- Naive-UAT anti-coaching and independent installed-product semantics remain current without a Playbook-shaped asset.

## Contracts and Data

The R-SCOPE, R-LEGACY, R-WORKFLOW, and R-SURFACE requirements are normative. Former Playbook schemas, identifiers, diagnostics, and asset paths are historical compatibility evidence only.

## Integrations

PRD 18 owns migration classification and safe disposition; PRD 22 owns project documentation asset namespaces; PRDs 17, 21, 25, and 39 own system-resource and operation surfaces; PRD 46 owns Naive-UAT policy; and PRDs 35 and 36 own the adjacent legacy execution and packaging boundaries.

## Rebuild Notes

A clean-room rebuild must not infer a Playbook/Protocol product from historical filenames, schemas, operations, or source anchors. It must preserve ambiguous user content, use capability-specific system workflows, and keep prior contracts visible only as non-normative history.

## Requirement History

### 2026-08-08 — Not assigned

- Affected requirement or section: `Consolidated capability ownership`
- Previous contract: Current requirements were also represented by standalone editorial PRDs 29, 40.
- Replacement contract: The applicable current requirements are inline in this authority and its linked product owners; the standalone editorial records are retired from the active set.
- Rationale: Active PRDs own product subjects and do not preserve editorial operations as product authority.
- Source: [PRD Authority Maintenance](../../.make-docs/references/system/prd-change-management.md)

### 2026-08-08 — W18 R6

- Affected requirement or section: `Document identity and current authority`
- Previous contract: The capability was represented as a standalone editorial change record whose title and structure described how the PRD set was modified.
- Replacement contract: This document stated the canonical Playbook authoring contract, document schema, dependency registry, workflow model, parser, validator, diagnostics, and default assets as current Make Docs product authority.
- Rationale: Active PRDs describe the current product shape; editorial operations belong in plans, work, and history.
- Source: [Playbook contract and model design](../designs/2026-06-30-playbook-contract-and-model.md)

### 2026-08-14 — W19 R1

- Affected requirement or section: `Purpose; Current Product Boundary; Legacy Content Compatibility; Capability-Specific Workflow Boundary`
- Previous contract: Make Docs owned a canonical Playbook authoring model and was considering a narrower Protocol successor with schemas, catalogs, parsers, validators, diagnostics, and default procedural assets.
- Replacement contract: Make Docs owns no Playbook or Protocol authoring capability; current workflows use system resources and typed operations, while historical and ambiguous legacy content is preserved without reinterpretation or support claims.
- Rationale: The accepted v2 product boundary removes both in-product Playbooks and Protocols while retaining safe migration and useful historical provenance.
- Source: [W19 R1 recovery design](../designs/2026-08-12-make-docs-v2-product-boundary-and-missing-migration-recovery.md) and [accepted W19 R1 plan](../plans/2026-08-13-w19-r1-make-docs-v2-product-boundary-and-missing-migration-recovery/00-overview.md)

### 2026-08-17 — W19 R1 P3

- Date: 2026-08-17
- Coordinate: W19 R1 P3
- Affected requirement or section: `R-SCOPE-2`, `R-LEGACY-6`, `R-SURFACE-1`, and `Acceptance Criteria`
- Previous contract: The target-state absence rule did not state how the current legacy authoring surfaces must remain available during safe staged removal.
- Replacement contract: P3 freezes the existing legacy set without a new support claim. P5 is the stop barrier. P8 owns the fresh trace, backup, and removal.
- Rationale: The approved staged compatibility exception prevents partial removal before quiescence and backup proof.
- Source: [W19 R1 P3](../work/2026-08-14-w19-r1-make-docs-v2-product-boundary-and-missing-migration-recovery/03-operation-registry-cli-and-mcp.md)

## Source Anchors

- [W19 R1 recovery design](../designs/2026-08-12-make-docs-v2-product-boundary-and-missing-migration-recovery.md)
- [W19 R1 plan](../plans/2026-08-13-w19-r1-make-docs-v2-product-boundary-and-missing-migration-recovery/00-overview.md)
- [../designs/2026-06-30-playbook-contract-and-model.md](../designs/2026-06-30-playbook-contract-and-model.md)
- [../assets/artifacts/playbook-architecture.md](../assets/artifacts/playbook-architecture.md)
- [../plans/2026-07-01-w18-r6-playbook-contract-and-model/00-overview.md](../plans/2026-07-01-w18-r6-playbook-contract-and-model/00-overview.md)
- [../work/2026-07-01-w18-r6-playbook-contract-and-model/00-index.md](../work/2026-07-01-w18-r6-playbook-contract-and-model/00-index.md)
- [22 Project Documentation Asset Model](22-project-documentation-asset-model.md)
- [47 Persona Model](47-persona-model.md)
- [30 Agentic Extensibility Boundary](30-plugin-substrate-and-workflow-bundles.md)
- [36 Agentic Packaging and Adapter Boundary](36-playbook-packaging-compiler-and-harness-adapters.md)
- [06 Template Contracts and Generated Assets](06-template-contracts-and-generated-assets.md)
- [25 CLI Separation and MCP Boundary](25-typescript-runtime-cli-mcp-operation-boundaries.md)
- `packages/docs/template/.make-docs/contracts/system/playbook-contract.md`
- `packages/docs/template/docs/assets/playbooks/agent/make-docs-lifecycle.playbook.md`
- `docs/assets/playbooks/agent/make-docs-lifecycle.playbook.md`
- `packages/cli/src/operations/playbook/index.ts`
- `scripts/smoke-pack.mjs`

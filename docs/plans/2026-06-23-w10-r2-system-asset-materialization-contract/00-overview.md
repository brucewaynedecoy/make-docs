# System Asset Materialization Contract - PRD Change Plan

> In v2, plans are directories. This file is the `00-overview.md` entry point; phase detail lives in sibling `0N-<phase>.md` files.

**Date:** 2026-06-23

**Repository:** `make-docs`

**Purpose:** Produce a reviewable active-set evolution plan for system asset delivery, materialization modes, provider-backed resolution, and manifest provenance.

## W10 R7 Runtime Pivot

W10 R7 supersedes this plan's future-facing Rust provider and TypeScript/Rust split assumptions. Future provider/cache work must treat TypeScript CLI/MCP as the v2 runtime authority, MCP as required, and W10 R8 as the implementation backlog for modular operation domains and MCP runtime behavior.

## Objective

Revise the active PRD namespace so Make Docs has one explicit system asset materialization contract across the TypeScript package CLI, required TypeScript MCP provider surface, and later provider or cache-backed asset sources. Completion means the follow-on PRD pass can add one numbered revision doc, annotate affected baseline docs, update the living risk register, and generate a scoped delta backlog without reopening the W10 R1 package identity and deployment ownership decisions.

This plan follows the default lifecycle arc after the upstream roadmap-driven design batch: accepted design -> plan -> PRD reconciliation -> work backlog. The upstream departure was the batch design generation from roadmap artifacts; this plan resumes the normal artifact sequence.

## Coordinate Decision

- Selected coordinate: `W10 R2`.
- Evidence: [2026-06-19-system-asset-delivery-and-materialization-contract.md](../../designs/2026-06-19-system-asset-delivery-and-materialization-contract.md) declares `Route: change-plan` and names prior lineage in W17 R0, W14, W9 R1, and the accepted Batch 1 package boundary design.
- Resolution: W10 R1 is already occupied by [package and deployment boundaries](../2026-06-23-w10-r1-package-and-deployment-boundaries/00-overview.md). This work directly extends that W10 product/package boundary with the next package-adjacent revision rather than starting a new wave.
- Target plan directory: `docs/plans/2026-06-23-w10-r2-system-asset-materialization-contract/`.
- Target work directory: `docs/work/2026-06-23-w10-r2-system-asset-materialization-contract/`.

## Change Classification

Revision and enhancement.

This change revises the active asset, manifest, packaging, and lifecycle contract by naming three explicit materialization modes:

- `full-snapshot`
- `provider-backed`
- `hybrid-pinned-cache`

It enhances the manifest contract with asset-set provenance and preserves the TypeScript package as the full-snapshot source of truth until provider-backed behavior has implementation evidence across package-runner and TypeScript MCP environments.

## Change Inputs

- [2026-06-19-system-asset-delivery-and-materialization-contract.md](../../designs/2026-06-19-system-asset-delivery-and-materialization-contract.md)
- [2026-06-19-package-and-deployment-boundaries.md](../../designs/2026-06-19-package-and-deployment-boundaries.md)
- [2026-04-16-asset-pipeline-completeness.md](../../assets/archive/designs/2026-04-16-asset-pipeline-completeness.md)
- [2026-04-20-docs-assets-state-and-history.md](../../assets/archive/designs/2026-04-20-docs-assets-state-and-history.md)
- [2026-04-22-docs-assets-resource-namespace.md](../../assets/archive/designs/2026-04-22-docs-assets-resource-namespace.md)
- [2026-04-28-cli-skill-selection-simplification.md](../../assets/archive/designs/2026-04-28-cli-skill-selection-simplification.md)
- [2026-06-18-w17-r0-static-template-router-skill-correction.md](../../assets/archive/history/2026-06-18-w17-r0-static-template-router-skill-correction.md)
- [2026-04-28-w14-r0-p3-cli-asset-selection-model-and-manifest.md](../../assets/archive/history/2026-04-28-w14-r0-p3-cli-asset-selection-model-and-manifest.md)
- [2026-06-18-w16-r0-template-dogfood-reconciliation.md](../../assets/archive/history/2026-06-18-w16-r0-template-dogfood-reconciliation.md)
- Current implementation surfaces: `packages/cli/src/rules.ts`, `packages/cli/src/catalog.ts`, `packages/cli/src/utils.ts`, `packages/cli/src/planner.ts`, `packages/cli/src/install.ts`, `packages/cli/src/manifest.ts`, `packages/cli/src/audit.ts`, `packages/cli/src/backup.ts`, `packages/cli/src/uninstall.ts`, `packages/cli/src/skill-catalog.ts`, `packages/cli/src/skill-resolver.ts`, `packages/cli/tests/consistency.test.ts`, and `scripts/smoke-pack.mjs`.

## Baseline Context

The current implementation is full-snapshot and static-template based. `getDesiredAssets()` gathers selected reference, template, prompt, script, and instruction-router assets, `buildAsset()` turns template bytes into sorted `ResolvedAsset[]` entries with `file:<path>` source ids, the planner compares desired content against disk and manifest state, and apply writes `.make-docs/manifest.json`.

The current manifest records package metadata, selections, effective capabilities, per-file hashes, source ids, and `skillFiles`. It does not yet record asset materialization mode, provider identity, provider version, pinned hash sets, offline policy, or recovery guidance.

The PRD set already contains adjacent revisions:

- [11-revise-cli-asset-selection-simplification.md](../../prd/11-revise-cli-asset-selection-simplification.md)
- [12-revise-cli-skill-selection-simplification.md](../../prd/12-revise-cli-skill-selection-simplification.md)
- [13-revise-cli-conflict-resolution.md](../../prd/13-revise-cli-conflict-resolution.md)
- [15-revise-agent-instruction-file-ownership.md](../../prd/15-revise-agent-instruction-file-ownership.md)
- [16-revise-package-and-deployment-boundaries.md](../../prd/16-revise-package-and-deployment-boundaries.md)

This plan does not replace those docs. It appends the next revision and annotates only the affected sections.

## Output Contract

- Plan directory: `docs/plans/2026-06-23-w10-r2-system-asset-materialization-contract/` (this directory).
- New change doc: `docs/prd/17-revise-system-asset-materialization-contract.md`.
- Baseline docs to annotate: `docs/prd/02-architecture-overview.md`, `docs/prd/05-installation-profile-and-manifest-lifecycle.md`, `docs/prd/06-template-contracts-and-generated-assets.md`, `docs/prd/07-cli-command-surface-and-lifecycle.md`, `docs/prd/08-skills-catalog-and-distribution.md`, `docs/prd/10-packaging-validation-and-release-reference.md`, and `docs/prd/16-revise-package-and-deployment-boundaries.md`.
- Risk register updates: `docs/prd/03-open-questions-and-risk-register.md`.
- Delta backlog: `docs/work/2026-06-23-w10-r2-system-asset-materialization-contract/`.

## Change Doc Strategy

Create one revision doc because the change has one coherent product contract: system assets must have explicit materialization modes, local bootstrap invariants, provider/cache pinning rules, manifest provenance, and conflict-safe on-demand writes.

Do not create separate PRDs for provider-backed mode, hybrid cache mode, manifest provenance, or local bootstrap. Splitting those would create artificial boundaries; the asset contract only works when those requirements move together.

## Baseline Annotation Plan

| Baseline doc | Note verb | Required note focus |
| --- | --- | --- |
| `docs/prd/02-architecture-overview.md` | Enhanced by | Runtime boundaries for full-snapshot, provider-backed, and hybrid pinned-cache system assets. |
| `docs/prd/05-installation-profile-and-manifest-lifecycle.md` | Enhanced by | Manifest provenance, offline policy, provider/cache identity, and conflict-safe on-demand materialization. |
| `docs/prd/06-template-contracts-and-generated-assets.md` | Enhanced by | Static-template full-snapshot default, system asset definition, and local bootstrap non-optionality. |
| `docs/prd/07-cli-command-surface-and-lifecycle.md` | Enhanced by | User-visible mode selection, outage messaging, dry-run/review behavior, and managed-file safety for on-demand writes. |
| `docs/prd/08-skills-catalog-and-distribution.md` | Enhanced by | Skills remain selected agentic assets and are not folded into system asset materialization modes. |
| `docs/prd/10-packaging-validation-and-release-reference.md` | Enhanced by | Full-snapshot package validation baseline plus future provider/cache validation checks. |
| `docs/prd/16-revise-package-and-deployment-boundaries.md` | Enhanced by | TypeScript CLI/MCP provider behavior must preserve the same manifest, audit, backup, uninstall, and command contracts. |

Update `docs/prd/03-open-questions-and-risk-register.md` directly for existing D/Q/R entries. Do not add `Change Notes` inside the register.

## Worker Ownership

Delegation is available in this harness, but this round is intentionally single-design and single-change-doc scoped. The coordinator may author the docs directly while preserving disjoint write scopes in the plan.

| Worker | Scope | Write Scope | Dependencies | Deliverables |
| ------ | ----- | ----------- | ------------ | ------------ |
| PRD reconciler | Translate design requirements into the active PRD set. | `docs/prd/17-*`, affected baseline annotations, PRD index, risk register. | Design review and current PRD index. | Updated active PRD namespace. |
| Backlog planner | Convert the reconciled PRD requirements into implementation-ready work. | `docs/work/2026-06-23-w10-r2-system-asset-materialization-contract/`. | PRD reconciler output. | Delta work backlog with source PRD links. |
| Validator | Check naming, links, diff hygiene, task syntax, and local docs index freshness. | None except fixups within touched docs. | All outputs. | Validation results before commit. |

## MCP Strategy

- Use `jdocmunch` for design, plan, PRD, work, and reference-doc discovery and reading.
- Use `jcodemunch` for code symbol discovery around asset catalog, manifest, planner, install, audit, skill resolver, package validation, and smoke tests.
- Reindex after file edits before final closeout.
- Fall back to direct file reads only for exact patch context and validation commands.

## Validation

- `git diff --check`
- Reindex `jdocmunch` after edits.
- Verify no duplicate W/R directory in `docs/plans/` or `docs/work/`.
- Verify PRD index includes `17-revise-system-asset-materialization-contract.md`.
- Verify all work phase files include `## Source PRD Docs`, stage-local `### Tasks`, plain-bullet `### Acceptance criteria`, and `### Dependencies`.
- Source tests are not required for this round because it writes docs only; the generated backlog names the implementation tests that future source work must run.

## Phase Map

| Phase | File | Purpose |
| --- | --- | --- |
| 01 | [01-active-prd-and-risk-reconciliation.md](01-active-prd-and-risk-reconciliation.md) | Add the PRD revision, annotate affected baselines, and update the living risk register. |
| 02 | [02-asset-mode-and-manifest-provenance.md](02-asset-mode-and-manifest-provenance.md) | Define the implementation requirements for materialization modes, local bootstrap, and manifest provenance. |
| 03 | [03-provider-cache-and-safety-validation.md](03-provider-cache-and-safety-validation.md) | Plan provider/cache safety checks, outage behavior, conflict handling, and package validation evidence. |
| 04 | [04-delta-backlog-and-closeout.md](04-delta-backlog-and-closeout.md) | Generate the paired work backlog, validate touched docs, and commit the planning round locally. |

## Intended Follow-On

Route: prd-generation

Next step: Reconcile the active PRD namespace from this plan, then generate the paired delta backlog.

Why: The system asset materialization design changes product requirements. Those requirements must be captured in the active PRD set before implementation work begins.

Coordinate Handoff: Carry `W10 R2` into PRD reconciliation and the delta work backlog.

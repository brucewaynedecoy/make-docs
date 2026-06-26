# Compatibility Audit and Migration Disposition - PRD Change Plan

> In v2, plans are directories. This file is the `00-overview.md` entry point; phase detail lives in sibling `0N-<phase>.md` files.

**Date:** 2026-06-23

**Repository:** `make-docs`

**Purpose:** Produce a reviewable active-set evolution plan for v2 compatibility classification, audit-backed migration dispositions, backup-and-reinstall safety, rollback expectations, and TypeScript CLI/MCP compatibility.

## W10 R7 Runtime Pivot

W10 R7 supersedes this plan's TypeScript/Rust coexistence and PATH-order assumptions. Future compatibility and migration work must classify TypeScript CLI/MCP paths against one shared taxonomy, with no Rust prerequisite for v2.

## Objective

Revise the active PRD namespace so Make Docs has one compatibility classifier and one disposition model for existing installs while package, asset materialization, dogfood, TypeScript CLI, and MCP work are in flight. Completion means the follow-on PRD pass can add one numbered revision doc, annotate affected baseline docs, update the living risk register, and generate a scoped delta backlog without weakening the W10 R1 package-boundary or W10 R2 system asset contracts.

This plan resumes the normal lifecycle arc after the upstream roadmap-driven design batch: accepted design -> plan -> PRD reconciliation -> work backlog.

## Coordinate Decision

- Selected coordinate: `W10 R3`.
- Evidence: [2026-06-19-compatibility-audit-and-migration-disposition.md](../../designs/2026-06-19-compatibility-audit-and-migration-disposition.md) declares `Route: change-plan` and builds on the W10 package and system asset designs plus W7, W9, W14, and W17 lifecycle lineage.
- Resolution: W10 R1 captured package/deployment boundaries and W10 R2 captured system asset materialization. This change applies the next compatibility and migration revision in the same W10 lineage.
- Target plan directory: `docs/plans/2026-06-23-w10-r3-compatibility-audit-and-migration-disposition/`.
- Target work directory: `docs/work/2026-06-23-w10-r3-compatibility-audit-and-migration-disposition/`.

## Change Classification

Revision and enhancement.

This change revises install, manifest, audit, backup, uninstall, conflict-review, package, dogfood, and TypeScript CLI/MCP compatibility requirements by making state classification mandatory before mutation and by naming allowed dispositions for each source state.

## Change Inputs

- [2026-06-19-compatibility-audit-and-migration-disposition.md](../../designs/2026-06-19-compatibility-audit-and-migration-disposition.md)
- [2026-06-19-package-and-deployment-boundaries.md](../../designs/2026-06-19-package-and-deployment-boundaries.md)
- [2026-06-19-system-asset-delivery-and-materialization-contract.md](../../designs/2026-06-19-system-asset-delivery-and-materialization-contract.md)
- [2026-05-06-cli-conflict-resolution.md](../../designs/2026-05-06-cli-conflict-resolution.md)
- [2026-04-18-cli-help-backup-and-uninstall.md](../../assets/archive/designs/2026-04-18-cli-help-backup-and-uninstall.md)
- [2026-04-28-cli-asset-selection-simplification.md](../../assets/archive/designs/2026-04-28-cli-asset-selection-simplification.md)
- [2026-04-28-cli-skill-selection-simplification.md](../../assets/archive/designs/2026-04-28-cli-skill-selection-simplification.md)
- Current implementation surfaces: `packages/cli/src/manifest.ts`, `packages/cli/src/audit.ts`, `packages/cli/src/backup.ts`, `packages/cli/src/uninstall.ts`, `packages/cli/src/install.ts`, `packages/cli/src/planner.ts`, `packages/cli/src/managed-block.ts`, `packages/cli/src/skill-catalog.ts`, `packages/cli/src/skill-resolver.ts`, lifecycle tests, install tests, and smoke-pack.

## Baseline Context

The current code already distinguishes manifest-present from manifest-missing audits and already has a one-audit backup/uninstall safety model. The missing requirement is an explicit source-state classifier that decides whether an install can sync, migrate, migrate with review, backup and reinstall, or stop for manual review before any managed files are written.

This plan depends on the active revisions that already define the adjacent contracts:

- [13-revise-cli-conflict-resolution.md](../../prd/13-revise-cli-conflict-resolution.md)
- [15-revise-agent-instruction-file-ownership.md](../../prd/15-revise-agent-instruction-file-ownership.md)
- [16-revise-package-and-deployment-boundaries.md](../../prd/16-revise-package-and-deployment-boundaries.md)
- [17-revise-system-asset-materialization-contract.md](../../prd/17-revise-system-asset-materialization-contract.md)

## Output Contract

- Plan directory: `docs/plans/2026-06-23-w10-r3-compatibility-audit-and-migration-disposition/` (this directory).
- New change doc: `docs/prd/18-revise-compatibility-audit-and-migration-disposition.md`.
- Baseline docs to annotate: `docs/prd/02-architecture-overview.md`, `docs/prd/05-installation-profile-and-manifest-lifecycle.md`, `docs/prd/06-template-contracts-and-generated-assets.md`, `docs/prd/07-cli-command-surface-and-lifecycle.md`, `docs/prd/08-skills-catalog-and-distribution.md`, `docs/prd/10-packaging-validation-and-release-reference.md`, `docs/prd/16-revise-package-and-deployment-boundaries.md`, and `docs/prd/17-revise-system-asset-materialization-contract.md`.
- Risk register updates: `docs/prd/03-open-questions-and-risk-register.md`.
- Delta backlog: `docs/work/2026-06-23-w10-r3-compatibility-audit-and-migration-disposition/`.

## Change Doc Strategy

Create one revision doc because the classifier and disposition model are one safety contract. The classifier states, disposition meanings, backup-and-reinstall rules, rollback expectations, and TypeScript CLI/MCP compatibility requirements must be read together.

Do not split clean states, malformed manifest handling, missing-manifest fallback, or backup-and-reinstall into separate PRDs.

## Baseline Annotation Plan

| Baseline doc | Note verb | Required note focus |
| --- | --- | --- |
| `docs/prd/02-architecture-overview.md` | Enhanced by | Compatibility classifier as a runtime boundary before mutation. |
| `docs/prd/05-installation-profile-and-manifest-lifecycle.md` | Enhanced by | Source states, manifest validation priority, migration dispositions, and schema migration safety. |
| `docs/prd/06-template-contracts-and-generated-assets.md` | Enhanced by | Root dogfood versus shipped template ownership during migration. |
| `docs/prd/07-cli-command-surface-and-lifecycle.md` | Enhanced by | Dedicated migration flow, no implicit destructive migration in ordinary install/reconfigure, and review-first disposition UX. |
| `docs/prd/08-skills-catalog-and-distribution.md` | Enhanced by | Preserve prior selected skills only when manifest and file evidence are trustworthy; no default skill expansion during migration. |
| `docs/prd/10-packaging-validation-and-release-reference.md` | Enhanced by | Fixture matrix for every source-state and disposition pair. |
| `docs/prd/16-revise-package-and-deployment-boundaries.md` | Enhanced by | TypeScript CLI/MCP runtime paths must share the classifier and disposition taxonomy. |
| `docs/prd/17-revise-system-asset-materialization-contract.md` | Enhanced by | Clean v2 full-snapshot, provider-backed, and hybrid pinned-cache states depend on materialization provenance. |

Update `docs/prd/03-open-questions-and-risk-register.md` directly for existing D/Q/R entries. Do not add `Change Notes` inside the register.

## Worker Ownership

Delegation is available in this harness, but this round is a single-design active-set evolution. The coordinator may author the docs directly while preserving disjoint write scopes.

| Worker | Scope | Write Scope | Dependencies | Deliverables |
| ------ | ----- | ----------- | ------------ | ------------ |
| PRD reconciler | Convert the design classifier into active requirements. | `docs/prd/18-*`, affected baseline annotations, PRD index, risk register. | Design review and current PRD index. | Updated active PRD namespace. |
| Backlog planner | Convert PRD 18 into implementation-ready phases. | `docs/work/2026-06-23-w10-r3-compatibility-audit-and-migration-disposition/`. | PRD reconciler output. | Delta work backlog with fixture matrix and validation tasks. |
| Validator | Check naming, links, task syntax, and local docs index freshness. | None except fixups within touched docs. | All outputs. | Validation results before commit. |

## MCP Strategy

- Use `jdocmunch` for design, plan, PRD, work, and reference-doc reading.
- Use `jcodemunch` for code symbol discovery around manifest validation, audit, backup, uninstall, planner, managed-block migration, and lifecycle tests.
- Reindex after file edits before final closeout.

## Validation

- `git diff --check`
- Reindex `jdocmunch` after edits.
- Verify no duplicate W/R directory in `docs/plans/` or `docs/work/`.
- Verify PRD index includes `18-revise-compatibility-audit-and-migration-disposition.md`.
- Verify all work phase files include source PRD links, phase-local task IDs, plain-bullet acceptance criteria, and dependencies.
- Source tests are not required for this planning round because it writes docs only; the generated backlog names the implementation tests.

## Phase Map

| Phase | File | Purpose |
| --- | --- | --- |
| 01 | [01-active-prd-and-risk-reconciliation.md](01-active-prd-and-risk-reconciliation.md) | Add the PRD revision, annotate affected baselines, and update the risk register. |
| 02 | [02-state-classifier-and-disposition-model.md](02-state-classifier-and-disposition-model.md) | Define the implementation requirements for source-state classification and dispositions. |
| 03 | [03-migration-backup-rollback-safety.md](03-migration-backup-rollback-safety.md) | Plan backup-and-reinstall, rollback, and one-audit safety requirements. |
| 04 | [04-delta-backlog-and-closeout.md](04-delta-backlog-and-closeout.md) | Generate the paired backlog, validate touched docs, and commit the planning round locally. |

## Intended Follow-On

Route: prd-generation

Next step: Reconcile the active PRD namespace from this plan, then generate the paired delta backlog.

Why: The compatibility classifier changes product and safety requirements. Those requirements must be captured in the active PRD set before implementation work begins.

Coordinate Handoff: Carry `W10 R3` into PRD reconciliation and the delta work backlog.

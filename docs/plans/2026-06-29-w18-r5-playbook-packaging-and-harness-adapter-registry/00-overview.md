# W18 R5 Playbook Packaging and Harness Adapter Registry

## Purpose

Define the implementation plan for making Playbook packaging and the harness adapter registry a required v2 deliverable, using [Playbook Packaging and Harness Adapter Registry](../../designs/2026-06-29-playbook-packaging-and-harness-adapter-registry.md) as the accepted authority.

## Objective

This plan is complete when the active PRD set captures Playbook packaging as a required v2 capability, W18 R1/R2/R3 carry W18 R5 guardrails, a decision-complete work backlog exists, and user/developer guides explain the source-to-package model in human-readable terms.

## Coordinate Decision

- Coordinate: `W18 R5`
- Classification: `revision`
- Evidence: The new design explicitly revises the existing W18 Playbook/plugin sequence. W18 R1, W18 R2, W18 R3, and W18 R4 already exist; W18 R5 is the next W18 revision because it adds packaging and adapter-registry authority before those downstream W18 backlogs proceed.

## Change Classification

- Requested change type: `enhancement`
- Effective execution mode: `active-set evolution`
- Cleanup rewrite requested: no
- Full backlog regeneration requested: no

## Phase Map

| File | Purpose |
| ---- | ------- |
| [01-authority-and-prd-reconciliation.md](01-authority-and-prd-reconciliation.md) | Add the active PRD requirements, risk/index updates, and W18 guardrails. |
| [02-package-planner-and-review-model.md](02-package-planner-and-review-model.md) | Define the package-plan state machine, deterministic rails, review gates, and semantic agent-assist boundary. |
| [03-harness-adapter-registry-and-surfaces.md](03-harness-adapter-registry-and-surfaces.md) | Define adapter modules, output kinds, surface profiles, preconditions, and future harness extension rules. |
| [04-output-writers-lifecycle-and-validation.md](04-output-writers-lifecycle-and-validation.md) | Define plugin/skills-bundle writers, manifest/audit/backup/uninstall behavior, package validation, conformance, and guides/history closeout. |

## Dependencies

- [Playbook Packaging and Harness Adapter Registry](../../designs/2026-06-29-playbook-packaging-and-harness-adapter-registry.md)
- [29 Revise Playbook Contract Run Playbook](../../prd/36-playbook-packaging-compiler-and-harness-adapters.md#requirements)
- [30 Revise Harness Plugin Substrate Workflow Bundles](../../prd/30-plugin-substrate-and-workflow-bundles.md)
- [28 Revise Shared Agentics Installation Harness Redirection](../../prd/28-shared-agentics-installation-and-harness-exposure.md)
- [25 Revise CLI Separation and MCP Boundary](../../prd/25-typescript-runtime-cli-mcp-operation-boundaries.md)
- [20 Revise Agent Harness Model Conformance Lab](../../prd/20-agent-harness-conformance-and-support-claims.md)
- [32 Revise Lifecycle Backup State and Agentics Pruning](../../prd/30-plugin-substrate-and-workflow-bundles.md#update-migration-audit-backup-and-uninstall)

W18 R5 is a prerequisite authority for W18 R1, W18 R2, and W18 R3. Implementation phases may still depend on W18 R1 runner primitives and W18 R2 plugin substrate primitives as they land, but those backlogs must not implement metadata, plugin, or bundle behavior that contradicts W18 R5.

## Output Contract

- Plan directory: `docs/plans/2026-06-29-w18-r5-playbook-packaging-and-harness-adapter-registry/`
- PRD change doc: `docs/prd/36-playbook-packaging-compiler-and-harness-adapters.md`
- Work directory: `docs/work/2026-06-29-w18-r5-playbook-packaging-and-harness-adapter-registry/`
- User guide: `docs/assets/library/user/playbooks-packaging-shareable-agent-workflows.md`
- Developer guide: `docs/assets/library/developer/playbooks-development-packaging-and-harness-adapters.md`
- History record: `docs/assets/archive/history/2026-06-29-w18-r5-playbook-packaging-harness-adapter-planning.md`

## Change Doc Strategy

| New doc | Kind | Why it exists | Affected baseline docs |
| ------- | ---- | ------------- | ---------------------- |
| [36-playbook-packaging-compiler-and-harness-adapters.md](../../prd/36-playbook-packaging-compiler-and-harness-adapters.md) | enhancement | Captures Playbook packaging and harness adapter registry as required v2 behavior. | PRD 20, 25, 28, 29, 30, 31, 32, 10, and the PRD index/risk register. |

## Baseline Annotation Plan

| Baseline doc | Impacted sections | Note verb | Target change doc |
| ------------ | ----------------- | --------- | ----------------- |
| [36-playbook-packaging-compiler-and-harness-adapters.md](../../prd/36-playbook-packaging-compiler-and-harness-adapters.md#requirements) | Change Notes; Plugin and Surface Boundary; Non-Requirements; Acceptance Criteria | Enhanced by | [36-playbook-packaging-compiler-and-harness-adapters.md](../../prd/36-playbook-packaging-compiler-and-harness-adapters.md) |
| [30-plugin-substrate-and-workflow-bundles.md](../../prd/30-plugin-substrate-and-workflow-bundles.md) | Change Notes; Plugin Metadata and Manifest Ownership; Workflow Bundle Metadata; Playbook Boundary; Package and Validation Boundary | Enhanced by | [36-playbook-packaging-compiler-and-harness-adapters.md](../../prd/36-playbook-packaging-compiler-and-harness-adapters.md) |
| [25-typescript-runtime-cli-mcp-operation-boundaries.md](../../prd/25-typescript-runtime-cli-mcp-operation-boundaries.md) | Development Contract; No-Scripts Migration Dependency; Acceptance Criteria | Enhanced by | [36-playbook-packaging-compiler-and-harness-adapters.md](../../prd/36-playbook-packaging-compiler-and-harness-adapters.md) |
| [28-shared-agentics-installation-and-harness-exposure.md](../../prd/28-shared-agentics-installation-and-harness-exposure.md) | Plugin Inheritance; Manifest Ownership; Acceptance Criteria | Enhanced by | [36-playbook-packaging-compiler-and-harness-adapters.md](../../prd/36-playbook-packaging-compiler-and-harness-adapters.md) |
| [20-agent-harness-conformance-and-support-claims.md](../../prd/20-agent-harness-conformance-and-support-claims.md) | Effective Requirement; Support-claim gating | Enhanced by | [36-playbook-packaging-compiler-and-harness-adapters.md](../../prd/36-playbook-packaging-compiler-and-harness-adapters.md) |
| [10-packaging-validation-and-release-reference.md](../../prd/10-packaging-validation-and-release-reference.md) | Change Notes | Enhanced by | [36-playbook-packaging-compiler-and-harness-adapters.md](../../prd/36-playbook-packaging-compiler-and-harness-adapters.md) |

## Worker Ownership

This plan is written to be delegation-ready. In a harness with worker support, split implementation by these disjoint write scopes:

| Worker | Scope | Write Scope | Dependencies | Deliverables |
| ------ | ----- | ----------- | ------------ | ------------ |
| Requirements worker | PRD 33, baseline annotations, risk/index updates | `docs/prd/**` | Accepted W18 R5 design | Active-set evolution PRD reconciliation. |
| Planner/backlog worker | Plan and work bundle generation | `docs/plans/2026-06-29-w18-r5-*/**`, `docs/work/2026-06-29-w18-r5-*/**` | PRD reconciliation shape | Decision-complete W18 R5 implementation backlog. |
| Guide worker | User/developer guide coverage | `docs/assets/library/user/**`, `docs/assets/library/developer/**` | Accepted design and PRD 33 | Human-readable Playbook packaging docs. |
| Validation worker | Link, wave, path, task, and diff hygiene | Changed docs only | All writing workers | Validation output and fix-up patches. |

## MCP Strategy

- Preferred servers available: use `jdocmunch` for project-doc search/reads when indexed; fall back to direct file reads only when index coverage is missing or stale.
- Fallback plan: use `rg`, targeted `sed`, and repository contracts under `.make-docs/**` for exact file edits and validation.

## Validation

Validate changed-file Markdown/link hygiene, `git diff --check`, and `bash scripts/check-wave-numbering.sh`. Confirm W18 R1/R2/R3 plan and work indexes identify W18 R5 as prerequisite authority. Confirm the PRD set preserves the content-versus-invocation boundary while adding packaging as a required v2 capability. Confirm the work backlog does not leave open decisions about output kinds, `generic` as a surface rather than a harness, review-gated agent assistance, or adapter modularity.

## Intended Follow-On

This handoff is advisory-default-but-overridable: it is authoritative unless the user explicitly overrides it, and it is not a gate or precondition.

- Route: `prd-generation`
- Next step: Reconcile the active PRD set from this plan.
- Why: The plan should become product requirements before package-planner, adapter-registry, and output-writer implementation begins.
- Coordinate Handoff: Carry `W18 R5` into PRD reconciliation and the downstream work backlog lineage.

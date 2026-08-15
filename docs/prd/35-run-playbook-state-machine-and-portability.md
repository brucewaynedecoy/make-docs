---
title: "35 Workflow Execution and Legacy Run Boundary"
kind: "prd"
status: "active"
source:
  type: "design"
  path: "docs/designs/2026-07-01-run-playbook-state-machine.md"
---

# 35 Workflow Execution and Legacy Run Boundary

## Purpose

This document defines the current Make Docs boundary between capability-specific workflow execution, general lifecycle run capture, and legacy Playbook run data. Make Docs v2 has no generic Run Playbook or Run Protocol engine; Requirement History and Source Anchors preserve the former execution contract as provenance only.

## Scope

This authority owns the present absence of a Playbook/Protocol runner, state machine, progression API, resume model, nesting model, concurrency model, or portable Playbook-run artifact. It also owns the compatibility rule that legacy Playbook run state remains opaque and untouched.

General lightweight lifecycle run capture is owned by [38-global-store-and-project-state.md](38-global-store-and-project-state.md) and [39-cli-command-model-and-operation-registry.md](39-cli-command-model-and-operation-registry.md). Capability-specific workflow and gate semantics remain with their owning PRDs.

## Component and Capability Map

- Current workflow execution: typed capability-specific operations surfaced through CLI and MCP.
- Current lifecycle run capture: the closed `lifecycle` run type and evidence references owned by PRDs 38 and 39.
- Legacy Playbook state: existing `playbook_runs` rows and related historical artifacts preserved opaquely.
- Migration safety: a quiescence barrier prevents new Playbook/Protocol discovery or writes before retirement and migration classification.

## Requirements

### Current Execution Boundary (R-SCOPE)

- R-SCOPE-1 (MUST): Make Docs defines no generic Run Playbook or Run Protocol engine, resolver, state machine, cursor, per-step status model, gate-decision model, dependency snapshot, nested-run model, concurrency policy, digest-aware resume, or hand-followable engine tier.
- R-SCOPE-2 (MUST): no `playbook.start`, `playbook.status`, `playbook.next`, `playbook.advance`, `playbook.gate`, `playbook.resume`, `playbook.close`, `playbook.run.export`, `playbook.run.import`, or Protocol equivalent appears in the current operation registry, CLI, or MCP surface.
- R-SCOPE-3 (MUST): Skills, plugins, hooks, extensions, system workflows, or harness capabilities must not recreate the former generic runner or preserve it as hidden compatibility behavior.
- R-SCOPE-4 (MUST): current workflow behavior is capability-specific. Its operation, gate, evidence, Persona, and safety semantics are owned by the applicable current product PRD rather than this legacy boundary.

### General Lifecycle Run Separation (R-RUN)

- R-RUN-1 (MUST): the general Store run model is limited to the `lifecycle` run type and the lifecycle stages defined by PRDs 38 and 39. It is not a renamed Playbook/Protocol runner.
- R-RUN-2 (MUST): general run records contain bounded current state and evidence references only. They do not contain a procedural document model, per-step Playbook state, dependency registry, child-Playbook links, or Playbook resume hints.
- R-RUN-3 (MUST): a successful general Store receipt proves only the recorded Store mutation. It does not prove a workflow outcome, gate decision, UAT result, or support claim.

### Legacy Store Compatibility (R-LEGACY)

- R-LEGACY-1 (MUST): the existing `playbook_runs` table and rows remain opaque historical data. Make Docs stops creating, updating, interpreting, resuming, exporting, importing, or deriving product state from those rows.
- R-LEGACY-2 (MUST): no table drop, row deletion, semantic conversion, retention-policy change, or migration into the general `runs` model occurs without a future owner-approved data migration that explicitly covers those bytes.
- R-LEGACY-3 (MUST): migration reports legacy state without treating its presence as current support. Corrupt, unknown, newer, or ambiguous legacy state fails closed and remains untouched.
- R-LEGACY-4 (MUST): historical exported run artifacts and evidence retain their terminology and bytes as provenance but cannot be imported to activate the former execution engine.

### Quiescence and Retirement Safety (R-QUIESCE)

- R-QUIESCE-1 (MUST): before migration classifies or mutates any affected surface, the migration holds the exclusive project lock and verifies a durable barrier across every public Playbook/Protocol discovery and write boundary.
- R-QUIESCE-2 (MUST): the barrier remains active through transformation and validation and fails closed when any writer or discovery path can bypass it.
- R-QUIESCE-3 (MUST): quiescence does not delete legacy Store data or prove an implementation surface safe to remove. Removal still requires the accepted current trace and verified ownership.

### Conformance and Support Boundary (R-SUPPORT)

- R-SUPPORT-1 (MUST): current conformance scenarios and public support claims contain no Playbook/Protocol execution, nesting, parallelism, resume, plugin launch, or unattended-run tuple.
- R-SUPPORT-2 (MUST): historical results remain provenance and do not advance a current support tuple.

## Non-Requirements

- No generic Playbook or Protocol execution model.
- No Playbook/Protocol progression, resume, nesting, concurrency, export, or import operations.
- No conversion of legacy `playbook_runs` into current lifecycle runs.
- No deletion or reinterpretation of legacy run data.
- No hidden runner inside a Skill, plugin, hook, extension, or harness adapter.

## Acceptance Criteria

- Current operation, CLI, MCP, Skill, and support surfaces expose no Playbook/Protocol runner behavior.
- General lifecycle run capture remains bounded, capability-neutral, and separate from legacy Playbook state.
- Existing `playbook_runs` rows remain opaque and untouched.
- Migration quiesces every public legacy write/discovery boundary before classification and keeps the barrier active through validation.
- Historical run artifacts cannot reactivate or imply support for the former engine.

## Contracts and Data

The R-SCOPE, R-RUN, R-LEGACY, R-QUIESCE, and R-SUPPORT requirements are normative. Former Playbook run records and exported artifacts are compatibility data only.

## Integrations

PRD 18 owns migration classification, lock, backup, and rollback; PRDs 38 and 39 own the current general lifecycle run model and operations; PRD 25 owns the typed runtime and CLI/MCP projection; PRD 34 owns the adjacent procedural-asset boundary; and PRD 36 owns the adjacent packaging boundary.

## Rebuild Notes

A clean-room rebuild must not map former Playbook runner names into the general lifecycle run model. It must keep legacy rows opaque, preserve quiescence before retirement, and leave capability-specific workflow semantics with their current owners.

## Requirement History

### 2026-08-08 — Not assigned

- Affected requirement or section: `Consolidated capability ownership`
- Previous contract: Current requirements were also represented by standalone editorial PRDs 29, 41.
- Replacement contract: The applicable current requirements are inline in this authority and its linked product owners; the standalone editorial records are retired from the active set.
- Rationale: Active PRDs own product subjects and do not preserve editorial operations as product authority.
- Source: [PRD Authority Maintenance](../../.make-docs/references/system/prd-change-management.md)

### 2026-08-08 — W18 R7

- Affected requirement or section: `Document identity and current authority`
- Previous contract: The capability was represented as a standalone editorial change record whose title and structure described how the PRD set was modified.
- Replacement contract: This document stated portable Playbook execution, resumable state, nesting, concurrency, progression operations, and run import/export as current Make Docs authority.
- Rationale: Active PRDs describe the current product shape; editorial operations belong in plans, work, and history.
- Source: [Run Playbook state-machine design](../designs/2026-07-01-run-playbook-state-machine.md)

### 2026-08-14 — W19 R1

- Affected requirement or section: `Purpose; Current Execution Boundary; General Lifecycle Run Separation; Legacy Store Compatibility`
- Previous contract: Make Docs owned a generic Run Playbook engine with progression, gates, resume, nesting, concurrency, portability, and Playbook-specific Store state, and the unexecuted W19 R0 direction proposed a Protocol successor.
- Replacement contract: Make Docs has no Playbook/Protocol runner; current workflows use capability-specific typed operations, general run capture is limited to lifecycle state, and legacy `playbook_runs` data remains opaque and untouched behind a quiescent migration boundary.
- Rationale: The accepted v2 boundary removes the former engine without converting or deleting historical data and without hiding its semantics inside general run capture.
- Source: [W19 R1 recovery design](../designs/2026-08-12-make-docs-v2-product-boundary-and-missing-migration-recovery.md) and [accepted W19 R1 plan](../plans/2026-08-13-w19-r1-make-docs-v2-product-boundary-and-missing-migration-recovery/00-overview.md)

## Source Anchors

- [W19 R1 recovery design](../designs/2026-08-12-make-docs-v2-product-boundary-and-missing-migration-recovery.md)
- [W19 R1 plan](../plans/2026-08-13-w19-r1-make-docs-v2-product-boundary-and-missing-migration-recovery/00-overview.md)
- [../designs/2026-07-01-run-playbook-state-machine.md](../designs/2026-07-01-run-playbook-state-machine.md)
- [../designs/2026-06-27-run-playbook-orchestration-and-harness-capabilities.md](../designs/2026-06-27-run-playbook-orchestration-and-harness-capabilities.md)
- [../designs/2026-06-30-playbook-contract-and-model.md](../designs/2026-06-30-playbook-contract-and-model.md)
- [../assets/artifacts/playbook-architecture.md](../assets/artifacts/playbook-architecture.md)
- [../assets/artifacts/runtime-and-global-store.md](../assets/artifacts/runtime-and-global-store.md)
- [../assets/artifacts/cli-command-reorganization.md](../assets/artifacts/cli-command-reorganization.md)
- [../plans/2026-07-01-w18-r7-run-playbook-state-machine/00-overview.md](../plans/2026-07-01-w18-r7-run-playbook-state-machine/00-overview.md)
- [../work/2026-07-01-w18-r7-run-playbook-state-machine/00-index.md](../work/2026-07-01-w18-r7-run-playbook-state-machine/00-index.md)
- [34 Procedural Asset Boundary](34-playbook-authoring-contract-and-model.md)
- [30 Agentic Extensibility Boundary](30-plugin-substrate-and-workflow-bundles.md)
- [21 Tool Directory System Custom Resource Tiers](21-project-tool-directory-and-resource-tiers.md)
- [05 Installation Profile and Manifest Lifecycle](05-installation-profile-and-manifest-lifecycle.md)
- [10 Packaging Validation and Release Reference](10-packaging-validation-and-release-reference.md)
- [24 Configuration Convention Overlay](24-project-configuration-and-convention-overlay.md)
- [25 CLI Separation and MCP Boundary](25-typescript-runtime-cli-mcp-operation-boundaries.md)
- `packages/cli/src/operations/playbook/index.ts`
- `packages/cli/src/mcp/tools.ts`
- `scripts/smoke-pack.mjs`

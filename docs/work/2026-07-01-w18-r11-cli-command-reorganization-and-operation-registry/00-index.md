---
title: "W18 R11 CLI Command Reorganization and Operation Registry Work"
kind: "work"
status: "active"
coordinate: "W18 R11"
follow_on:
  route: "implementation-loop"
  next_prompt: ".make-docs/references/system/execution-workflow.md"
  why: "The backlog is the implementation queue derived from the W18 R11 plan and PRD contract."
  coordinate_handoff: "Carry W18 R11 into phase history records and commits, adding the active P coordinate for each phase."
source:
  type: "prd"
  path: "docs/prd/39-cli-command-model-and-operation-registry.md"
---

# W18 R11 CLI Command Reorganization and Operation Registry Work

## Purpose

Implement the reorganized CLI command surface and the formalized operation registry required by [39 Revise CLI Command Reorganization and Operation Registry](../../prd/39-cli-command-model-and-operation-registry.md): the append-only `domain.verb` operation registry and the shared modular operation core with typed contracts, injected execution context, and one-way dependencies; the five-command tree of `setup`, `run`, `mcp`, `update`, and `uninstall` with context-aware bare invocation; machine-footprint tool self-management with pre-v2 detection and no back-compatibility aliases; the pruned `run` surface of `run playbook`, `run package`, and the two retained work operations keyed to the global-store project-state model; registry-derived MCP tool parity; the upstream template command-spelling updates; and the D10 test suite. The source chain is [the design](../../designs/2026-07-01-cli-command-reorganization-and-operation-registry.md), [the W18 R11 plan](../../plans/2026-07-01-w18-r11-cli-command-reorganization-and-operation-registry/00-overview.md), and PRD 39, with [PRD 07](../../prd/07-cli-command-surface-and-lifecycle.md), [PRD 25](../../prd/25-typescript-runtime-cli-mcp-operation-boundaries.md), former PRD 26, [PRD 16](../../prd/16-package-runtime-and-deployment-boundaries.md), [PRD 05](../../prd/05-installation-profile-and-manifest-lifecycle.md), [PRD 35](../../prd/35-run-playbook-state-machine-and-portability.md), [PRD 36](../../prd/36-playbook-packaging-compiler-and-harness-adapters.md), and [PRD 38](../../prd/38-global-store-and-project-state.md) as still-constraining baselines.

## Phase Map

| File | Purpose |
| --- | --- |
| [01-operation-registry-and-shared-core.md](./01-operation-registry-and-shared-core.md) | Establish the append-only operation registry and the shared modular operation core with the uniform operation contract, injected execution context, and one-way dependencies. |
| [02-command-tree-and-bare-command.md](./02-command-tree-and-bare-command.md) | Reorganize the CLI into the five-command tree with the `setup` subtree and implement context-aware bare invocation. |
| [03-tool-self-management-and-pre-v2-migration.md](./03-tool-self-management-and-pre-v2-migration.md) | Implement machine-footprint `uninstall` and detect-and-delegate `update`, and the pre-v2 detection warning-and-backup-or-cancel flow with no back-compatibility aliases. |
| [04-run-surface-pruning-and-retained-work-operations.md](./04-run-surface-pruning-and-retained-work-operations.md) | Land the pruned `run` surface — `run playbook`, `run package`, and the two retained work operations keyed to the global-store project-state model — with the removed cluster absent. |
| [05-mcp-derivation-parity-and-template-doc-updates.md](./05-mcp-derivation-parity-and-template-doc-updates.md) | Derive the MCP tool list and names from the registry and update template-owned routers, guides, and READMEs that name old command spellings upstream, then dogfood. |
| [06-verification-and-testing.md](./06-verification-and-testing.md) | Land the D10 test suite covering registry parity, core isolation, lifecycle separation, migration safety, and pruning absence. |

## Usage Notes

- Read phases in order; they are dependency-ordered and later phases consume earlier deliverables.
- Same-wave rule per R-SEQ-1: the operation core, the registry, and the reorganized command tree land first, and all retained operation logic moves behind the registry in this same wave; do not leave a half-migrated state where some operations are registry-backed and others are hand-wired.
- Cross-design sequencing: the two retained work operations in Phase 4 record and read evidence through the W18 R10 global store per [PRD 38](../../prd/38-global-store-and-project-state.md) and are gated on its store, concurrency, and identity phases landing; the `run playbook` progression semantics remain owned by [PRD 35](../../prd/35-run-playbook-state-machine-and-portability.md), and this backlog fixes only their surface and identifiers.
- Respect R-SCOPE-1: do not redefine the internal logic of the operations or the pruning removals ([migrated-operations-inventory.md](../../assets/artifacts/migrated-operations-inventory.md)), the Playbook model, runner, packaging, or conformance (the W18 R6 through R9 lineages), the global store schema and project-state model ([PRD 38](../../prd/38-global-store-and-project-state.md)), or the CLI/MCP boundary and TypeScript runtime authority ([PRD 25](../../prd/25-typescript-runtime-cli-mcp-operation-boundaries.md), [PRD 16](../../prd/16-package-runtime-and-deployment-boundaries.md)).
- Treat the D9 fixed decisions — the five-command self/project/run/serve structure, context-aware bare, machine-footprint `uninstall` with hard cutover and remote-execution-honest self-management, the registry as single source with derived surfaces, the shared modular core with the uniform contract and one-way dependencies, the registry-operations-only pruned `run` surface, and no aliases plus pre-v2 detection — as non-substitutable acceptance criteria, and leave the D9 implementer freedoms (the exact names of the two retained work operations, the pre-v2 fingerprint set and warning copy, the install-manager detection matrix, and the internal module layout of the operation core) open.
- The reorganization implementation is ordinary source code under `packages/cli/`; the documentation deliverable — updating any template-owned instruction router, guide, or README that names old command spellings such as `operations` or the project-level `uninstall` — is authored upstream in `packages/docs/template/` first and then dogfooded, per the maintainer dogfooding rule.
- Keep task checkboxes as `- [ ] tN: ...` with IDs incrementing across each entire phase file and acceptance criteria as plain bullets.

## Intended Follow-On

This handoff is advisory-default-but-overridable: it is authoritative unless the user explicitly overrides it, and it is not a gate or precondition.

- Route: `implementation-loop`
- Next step: Start with Phase 1 and continue phase-by-phase; Phase 4's retained work operations unblock as the W18 R10 store phases land.
- Why: The backlog is the implementation queue derived from the W18 R11 plan and PRD contract, and R-024 records the hard-cutover and half-migrated-state exposure this dependency-ordered arc is designed to avoid.
- Coordinate Handoff: Carry `W18 R11` into phase history records and commits, adding the active P coordinate for each phase.

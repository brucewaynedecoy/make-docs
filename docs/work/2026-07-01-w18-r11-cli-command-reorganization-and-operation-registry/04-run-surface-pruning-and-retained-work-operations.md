---
title: "Phase 4: Run Surface Pruning and Retained Work Operations"
kind: "work"
status: "active"
coordinate: "W18 R11 P4"
source:
  type: "prd"
  path: "docs/prd/39-revise-cli-command-reorganization-and-operation-registry.md"
---

# Phase 4: Run Surface Pruning and Retained Work Operations

## Purpose

Land the markedly smaller `run` surface the pruning disposition produces — playbook, package, and exactly two retained work operations — so the reorganized tree never carries the removed derivation cluster forward under new spellings.

## Overview

Surface the `run playbook` and `run package` subtrees over the Phase 1 registry, implement the two retained work operations keyed to the W18 R10 global-store project-state model, and keep every pruned operation off the surface. The internal pruning removals and their Python-script retirement remain tracked by the migrated-operations inventory and the PRD 26 removal-safety rules; this phase owns only the surface.

## Source PRD Docs

- [39 Revise CLI Command Reorganization and Operation Registry](../../prd/39-revise-cli-command-reorganization-and-operation-registry.md)
- [35 Revise Run Playbook State Machine](../../prd/35-revise-run-playbook-state-machine.md)
- [36 Revise Playbook Packaging Compiler and Harness Adapters](../../prd/36-revise-playbook-packaging-compiler-and-harness-adapters.md)
- [38 Revise Global Store and Project State](../../prd/38-revise-global-store-and-project-state.md)
- [26 Revise No-Scripts Migration Skill Refactor](../../prd/26-revise-no-scripts-migration-skill-refactor.md)

## Stage 1 - Playbook and Package Subtrees

### Tasks

- [x] t1: Surface `run playbook` with catalog, resolve, capabilities, start, invoke, status, next, advance, gate, resume, and close over the registry identifiers, delegating all progression semantics to the PRD 35 engine unchanged (R-RUN-1).
- [x] t2: Surface `run package` with plan, surface-resolve, and write over the registry identifiers, delegating compiler and adapter behavior to the PRD 36 lineage unchanged (R-RUN-1).

### Acceptance criteria

- Both subtrees map one-to-one to registry identifiers, expose exactly the listed verbs, and contain no operation logic in the surface adapters (R-CORE-1).
- Progression and packaging behavior is byte-identical to the PRD 35 and PRD 36 contracts; only spellings and identifiers are fixed here.

### Dependencies

- Phase 1 registry and core; Phase 2 `run` tree.

## Stage 2 - Retained Work Operations

### Tasks

- [x] t3: Implement the work-item identity resolver as a registry operation: coordinate or path to canonical work-item identity (resolved repo root, wave slug, phase path), without the re-derivable next-incomplete-phase selection (R-RUN-1, R-SEQ-3).
- [x] t4: Implement the work-execution evidence record and read as registry operations keyed to the canonical work-item identity, storing and reading evidence through the W18 R10 global-store project-state model per PRD 38 R-PS-1 through R-PS-3 (R-RUN-1).

### Acceptance criteria

- Exactly two retained work-operation slots exist — one identity resolver and one evidence record-and-read pair — with their exact names left as the D9 implementer freedom.
- Evidence is recorded against the resolver's canonical identity in the global store, never in a repository path, and the store schema itself is consumed from PRD 38, not redefined (R-SCOPE-1).

### Dependencies

- The W18 R10 store, concurrency model, and stable project identifier phases must land first; this stage is gated on them per the cross-design sequencing in the plan.

## Stage 3 - Pruned Cluster Absence

### Tasks

- [x] t5: Remove the pruned operations from the command surface and registry: wave-status, work-phase-state, phase-plan, the phase-gate decision, scope-guard, closeout-probe, closeout-validate, and closeout-history do not appear under `run` or as MCP tools (R-RUN-2).
- [x] t6: Gate the surface removal on traced invocations per the inventory safeguards and PRD 26 removal safety: confirm which skills, MCP consumers, and code paths invoke the old operations before their spellings disappear, and record the Playbook-rebuild disposition rather than blocking the reorganization on it (R-SEQ-2).

### Acceptance criteria

- No pruned operation is reachable from the `run` surface, the registry, or the MCP tool list (R-TEST-4 seam).
- Invocation tracing evidence exists for each removed spelling, and the Playbook rebuild of the removed workflows remains tracked by the inventory disposition without blocking this wave.

### Dependencies

- Stages 1 and 2, so the retained surface exists before the removed one disappears.

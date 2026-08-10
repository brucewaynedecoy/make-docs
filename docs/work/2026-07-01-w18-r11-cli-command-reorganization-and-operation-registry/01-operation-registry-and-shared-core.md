---
title: "Phase 1: Operation Registry and Shared Core"
kind: "work"
status: "active"
coordinate: "W18 R11 P1"
source:
  type: "prd"
  path: "docs/prd/39-cli-command-model-and-operation-registry.md"
---

# Phase 1: Operation Registry and Shared Core

## Purpose

Establish the stable contract everything else in this wave builds on: the append-only operation registry that defines which deterministic operations exist, and the shared modular operation core whose uniform contract and injected execution context make the CLI, the MCP server, and Playbook `operation:` steps three surfaces over one implementation.

## Overview

Create the registry with stable `domain.verb` identifiers and move all retained operation logic into per-operation core modules grouped by domain, so that Phase 2's command tree and Phase 5's MCP derivation are consumers of the registry rather than hand-maintained lists, per R-SEQ-1's same-wave rule.

## Source PRD Docs

- [39 Revise CLI Command Reorganization and Operation Registry](../../prd/39-cli-command-model-and-operation-registry.md)
- [25 Revise CLI Separation and MCP Boundary](../../prd/25-typescript-runtime-cli-mcp-operation-boundaries.md)
- [26 Revise No-Scripts Migration Skill Refactor](../../prd/25-typescript-runtime-cli-mcp-operation-boundaries.md#no-scripts-migration-dependency)

## Stage 1 - Operation Registry

### Tasks

- [x] t1: Define the operation registry as the single source of truth for which deterministic operations exist, as a declarative index mapping operation identifiers to handlers and metadata (R-REG-1).
- [x] t2: Establish the identifier convention — `domain.verb` or `domain.object.verb`, lowercase, dot-separated, hyphenated multiword segments — and enforce it in the registry with stable, append-only semantics (R-REG-1).
- [x] t3: Register every retained operation: the `playbook` domain (catalog, resolve, capabilities, start, invoke, status, next, advance, gate, resume, close per the PRD 35 progression semantics), the `package` domain (plan, surface-resolve, write per PRD 36), and the two retained work operations as identifiers whose exact names are an implementer choice with the fixed shape of one identity resolver and one evidence record-and-read pair (R-RUN-1).

### Acceptance criteria

- The registry is the only place a deterministic operation is declared, every identifier follows the `domain.verb`/`domain.object.verb` convention, and the identifier set is append-only.
- Every registered identifier resolves to a handler and metadata including a mutation classification.
- No pruned operation — wave-status, work-phase-state, phase-plan, the phase-gate decision, scope-guard, closeout-probe, closeout-validate, or closeout-history — appears in the registry (R-RUN-2).

### Dependencies

- The pruning disposition in [migrated-operations-inventory.md](../../assets/artifacts/migrated-operations-inventory.md) fixes what is registered; this phase does not redefine operation internals per R-SCOPE-1.

## Stage 2 - Shared Operation Core

### Tasks

- [x] t4: Implement the shared operation core as modular, per-operation modules grouped by domain — never a monolithic file — with every operation defined by a stable identifier, a typed input, a typed output, a mutation classification, and a handler taking the input and an execution context (R-CORE-1).
- [x] t5: Implement the injected execution context so handlers return structured data and perform effects only through the context, which enforces dry-run, write-permission, and approval uniformly across surfaces, replacing per-surface write gating such as the MCP allow-write flag (R-CORE-1).
- [x] t6: Enforce one-way dependencies: surfaces depend on the core, the core never imports a surface, and no surface imports another surface (R-CORE-2).
- [x] t7: Move all retained operation logic behind the registry and core in this wave, keeping surface adapters free of operation logic and presentation out of handlers (R-SEQ-1, R-CORE-1); track internal modularization of the messiest retained logic as a follow-up where needed rather than blocking (R-SEQ-2).

### Acceptance criteria

- Each operation's implementation lives in its own module grouped by domain; a single shared library is not a single shared file.
- Every handler is invocable through the core without the CLI parser or MCP transport, returns structured data, and mutates only through the injected context (R-TEST-2 seam).
- Dependency direction is one-way and mechanically checkable: no core-to-surface or surface-to-surface import exists.
- No retained operation remains hand-wired outside the registry when this phase completes.

### Dependencies

- Stage 1 registry identifiers.

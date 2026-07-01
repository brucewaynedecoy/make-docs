---
title: "Phase 2: Playbook Model and Parser"
kind: "work"
status: "active"
coordinate: "W18 R6 P2"
source:
  type: "prd"
  path: "docs/prd/34-revise-playbook-contract-and-model.md"
---

# Phase 2: Playbook Model and Parser

## Purpose

Implement the single Playbook model and the staged parser that produces it, so every downstream consumer — reader tooling, the runner, and the packaging compiler — reads one fully resolved model instead of re-parsing Markdown.

## Overview

This phase builds the core library: the in-memory Playbook model and the fixed-stage parser pipeline. The library is pure and modular — source in, model plus diagnostics out, no presentation or filesystem effects beyond reading the provided input, and no monolithic file. The concrete data structures and module layout are implementer choices under D6, provided the required content and staging are present.

## Source PRD Docs

- [34 Revise Playbook Contract and Model](../../prd/34-revise-playbook-contract-and-model.md)
- [29 Revise Playbook Contract Run Playbook](../../prd/29-revise-playbook-contract-run-playbook.md)
- [25 Revise CLI Separation and MCP Boundary](../../prd/25-revise-cli-separation-and-mcp-boundary.md)
- [33 Enhance Playbook Packaging and Harness Adapter Registry](../../prd/33-enhance-playbook-packaging-and-harness-adapter-registry.md)

## Stage 1 - Playbook Model Shape

### Tasks

- [ ] t1: Define the Playbook model containing identity (canonical ref, source path, source digest, document and workflow schema versions, persona, stack, status), the typed dependency registry keyed by identifier, the workflow header and fully resolved steps with every dependency reference linked to its registry record, a narrative-section presence map, and source spans for every parsed element (R-MODEL-2).
- [ ] t2: Model each step with its four dimensions (executor, role, activation, mode with the `delegated` default), conditional `event`, `uses`/`requires` links, `inputs`/`outputs`, the `operation`/`command`/`instructions` invocation split, routing, gate semantics, validation, and safety fields (R-WF-4, R-WF-5).
- [ ] t3: Encode the shared status vocabulary (`pending`, `running`, `blocked`, `waiting-for-user`, `completed`, `failed`, `skipped`, `cancelled`) once so the runtime cannot invent a parallel set (R-WF-6).
- [ ] t4: Include a runnable flag derived from diagnostics so the model is marked runnable only when there are zero errors (R-MODEL-3).

### Acceptance criteria

- The model carries every R-MODEL-2 content family, including source spans precise enough for diagnostics and a future language server.
- Step dependency references are linked registry records, not bare strings.
- Downstream consumers can read everything they need from the model without touching the source Markdown.

### Dependencies

- Phase 1 contract as the specification being modeled.

## Stage 2 - Staged Parser Pipeline

### Tasks

- [ ] t5: Implement the fixed parsing stages: read and split frontmatter from body; parse frontmatter; locate required headings and verify order; parse the dependency table; locate and parse the single `playbook` workflow block; resolve cross-references; assemble the model (R-MODEL-3).
- [ ] t6: Make each stage emit diagnostics while continuing where possible, so one error does not mask the rest (fail-soft for diagnostics, fail-closed for execution).
- [ ] t7: Implement Playbook detection for both the `<slug>.playbook.md` suffix and the deprecated `kind: playbook` plain-file form, emitting PB-FILE-007 for the deprecated form (R-DOC-2).
- [ ] t8: Ignore unknown `##` sections after the required spine and flag unknown sections before or between required sections as errors (R-DOC-7).
- [ ] t9: Keep the library pure and modular per the operation-core ownership rules: no presentation, no filesystem effects beyond reading the provided input, and no single monolithic file (R-MODEL-1).

### Acceptance criteria

- The parser accepts the canonical worked example from the architecture artifact Section 2.6 without error (R-WF-7).
- Exactly one `playbook` fenced block is required; zero or more than one is a validation error, and a `yaml` info string does not match (R-WF-1).
- A file with multiple independent problems yields multiple diagnostics in one pass.
- No parser code path extracts deterministic meaning from narrative free text (R-DOC-6).

### Dependencies

- Stage 1 model shape.

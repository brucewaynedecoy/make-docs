---
title: "Phase 1: Capability Descriptor and Distributable Model"
kind: "work"
status: "active"
coordinate: "W18 R8 P1"
source:
  type: "prd"
  path: "docs/prd/36-playbook-packaging-compiler-and-harness-adapters.md"
---

# Phase 1: Capability Descriptor and Distributable Model

## Purpose

Give the compiler the declarative knowledge it cannot lower a distributable without: what each harness supports, what its native container looks like, and how one abstract distributable maps onto many concrete harness containers. This phase depends on the W18 R6 Playbook model being available as the compiler's input contract.

## Overview

Define the harness capability descriptor as the single home of harness-specific packaging knowledge, share one harness registry between the packaging-time and run-time capability questions, and implement the two-granularities distributable model in which one Playbook projects to one skill, a distributable carries one or more skills plus implied agentics, and `outputKind` selects the native or portable profile. Container selection and degradation become explicit, declared adapter behavior rather than silent assumptions.

## Source PRD Docs

- [36 Revise Playbook Packaging Compiler and Harness Adapters](../../prd/36-playbook-packaging-compiler-and-harness-adapters.md)
- [33 Enhance Playbook Packaging and Harness Adapter Registry](../../prd/36-playbook-packaging-compiler-and-harness-adapters.md)
- [34 Revise Playbook Contract and Model](../../prd/34-playbook-authoring-contract-and-model.md)
- [35 Revise Run Playbook State Machine](../../prd/35-run-playbook-state-machine-and-portability.md)
- [25 Revise CLI Separation and MCP Boundary](../../prd/25-typescript-runtime-cli-mcp-operation-boundaries.md)

## Stage 1 - Capability Descriptor and Shared Registry

### Tasks

- [x] t1: Define the harness capability descriptor shape declaring the harness identifier, the agentic primitives it supports, its native distributable container and the container's file layout including paths and manifest filenames, a lifecycle event map from logical events to harness hook points, the supported exposure modes, its registration model, and its preconditions (R-CAP-2).
- [x] t2: Make the descriptor data the adapters read, replacing the assumed adapter `path templates` declarations as the carrier of harness-specific paths and manifest shapes (R-CAP-2, R-ADAPT-1).
- [x] t3: Serve both capability questions from one harness registry — the packaging-time question of whether a harness can host a given agentic primitive answered here, and the run-time question of whether a harness can execute a step's required surface consumed by the W18 R7 runner without either side redefining the other (R-CAP-1, R-SCOPE-1).

### Acceptance criteria

- The capability descriptor is the single place harness-specific packaging knowledge lives; no harness paths, manifest filenames, hook mappings, or registration steps are declared outside descriptors and their adapters.
- One harness registry answers the packaging-time and run-time capability questions; the run-time semantics remain owned by the W18 R7 lineage.
- The shared planner and surface resolver stay harness-neutral; adding a harness adds a descriptor, an adapter module, fixtures, and conformance scenarios rather than planner conditionals (R-KEEP-1).

### Dependencies

- The W18 R6 Playbook model from [PRD 34](../../prd/34-playbook-authoring-contract-and-model.md) as the compiler input contract.
- The existing W18 R5 adapter registry and planner from former PRD 33, now incorporated in [PRD 36](../../prd/36-playbook-packaging-compiler-and-harness-adapters.md), preserved unchanged.

## Stage 2 - Two-Granularities Distributable Model

### Tasks

- [x] t4: Model the distributable as the distribution unit containing one or more skills plus the agentics the Playbook's steps imply, with authoring granularity fixed at one Playbook projecting to one skill and a bundle being multiple Playbooks compiled into one distributable with multiple skills (R-CAP-3).
- [x] t5: Interpret `outputKind` `plugin` as the harness's richest native container — realized per descriptor as a plugin, an extension, or another native container — and `skills-bundle` as the portable agents-standard skills form, mapping the two values onto the native and portable distributable profiles (R-CAP-3).
- [x] t6: Preserve the W18 R5 target model unchanged around the new interpretation: `generic` is not a harness, `surface` stays `native`/`agents-standard`/`auto`, `scope` stays `project`/`global`/`export-only`, and workflow bundles do not map one-to-one to plugins (R-KEEP-1).

### Acceptance criteria

- One Playbook projects to exactly one skill and the distributable is a separate, adapter-driven distribution unit, so the skill-density question never arises.
- `outputKind` `plugin` resolves to the richest native container per descriptor and `skills-bundle` to the portable agents-standard form; no code hardcodes `plugin` as the only native container.
- The preserved W18 R5 target model fields and their meanings are untouched.

### Dependencies

- Stage 1 descriptor shape.

## Stage 3 - Container Selection and Declared Degradation

### Tasks

- [x] t7: Implement adapter-side container selection: choose the richest container the harness supports for the chosen profile and map the Playbook's implied agentics onto the harness's supported primitives (R-CAP-4).
- [x] t8: Handle the unsupported-primitive case explicitly: degrade by emitting the behavior as a documented manual step or skill instruction, or fail closed with an unsupported-surface stop, with the choice declared in the plan and provenance, never silent (R-CAP-4).
- [x] t9: Compile event-bound steps to the harness's hook points where the descriptor declares hook support, and degrade or fail closed per R-CAP-4 where it does not (R-CAP-5).

### Acceptance criteria

- Container selection is driven by the descriptor and profile; the unsupported case always produces a declared degradation or a fail-closed stop, never a silent omission.
- Event-bound steps lower to hook points only on harnesses whose descriptor declares hook support.
- Degradation choices are visible in the reviewed package plan and recorded in provenance.

### Dependencies

- Stages 1 and 2.
- Step activation and event content from the W18 R6 Playbook model.

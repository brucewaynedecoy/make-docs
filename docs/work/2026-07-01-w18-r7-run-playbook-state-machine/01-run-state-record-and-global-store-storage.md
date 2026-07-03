---
title: "Phase 1: Run-State Record and Global-Store Storage"
kind: "work"
status: "active"
coordinate: "W18 R7 P1"
source:
  type: "prd"
  path: "docs/prd/35-revise-run-playbook-state-machine.md"
---

# Phase 1: Run-State Record and Global-Store Storage

## Purpose

Relocate Playbook run state from the repository into the global store and define the run-state record the progression engine reads and writes. This phase removes the `.make-docs/runs/playbooks/<run-id>/state.json` anti-pattern the W18 R4 lineage established and gives every later phase a single storage seam.

## Overview

Implement the run-state record content required by R-STATE-1, bind its per-step status to the shared W18 R6 vocabulary, and store it in the global store keyed by the stable project identifier plus a run identifier. The global store's physical schema, concurrency model, corruption recovery, and identifier scheme are owned by the [Runtime and Global Store](../../assets/artifacts/runtime-and-global-store.md) lineage (design planned as W18 R10); this phase consumes that store through a narrow storage interface and is sequenced after it exists.

## Source PRD Docs

- [35 Revise Run Playbook State Machine](../../prd/35-revise-run-playbook-state-machine.md)
- [29 Revise Playbook Contract Run Playbook](../../prd/29-revise-playbook-contract-run-playbook.md)
- [34 Revise Playbook Contract and Model](../../prd/34-revise-playbook-contract-and-model.md)
- [21 Revise Tool Directory System Custom Resource Tiers](../../prd/21-revise-tool-directory-system-custom-resource-tiers.md)

## Stage 1 - Storage Seam and Keying

### Tasks

- [x] t1: Define the runner's storage interface against the global store — read, create, and transition a run record keyed by project identifier plus run identifier — without defining the store schema, locking, or recovery (R-STORE-1, R-STORE-3).
- [x] t2: Source the stable project identifier from the project manifest as minted at setup, and reject any code path that keys run state by directory path (R-STORE-2).
- [x] t3: Remove or retarget every code path that writes run state under `.make-docs/runs/` or any other repository path, including the existing create and read capabilities in `packages/cli/src/operations/playbook/index.ts` (R-STORE-1).

### Acceptance criteria

- Run state is stored in the global store at `~/.make-docs/` and is never written under `.make-docs/runs/` or any other repository path.
- Run state is keyed by the stable project identifier plus a run identifier, never by directory path.
- For run state the global store is canonical and relocated with no in-repo copy, in contrast to mirrored install information.
- No store schema, concurrency model, recovery behavior, or identifier scheme is defined in runner code; those are consumed from the Runtime and Global Store lineage.

### Dependencies

- The global store, its concurrency model, and the stable project identifier from the Runtime and Global Store lineage (planned as W18 R10); defer these tasks until that store is available rather than inventing an interim location.

## Stage 2 - Run-State Record Content

### Tasks

- [x] t4: Implement the run-state record carrying at least run identifier, root run identifier, parent run identifier, project identifier, playbook ref, source digest, document and workflow schema versions, stack, harness, capability snapshot, routing model, per-step status, gate decisions, dependency availability snapshot, claimed output surfaces, output and evidence references, the current cursor of step or gate, child run references, resume hints, timestamps, and terminal status (R-STATE-1).
- [x] t5: Bind per-step status to exactly the shared vocabulary `pending`, `running`, `blocked`, `waiting-for-user`, `completed`, `failed`, `skipped`, `cancelled` from the W18 R6 Playbook model, with no parallel status vocabulary anywhere in the runner (R-STATE-2).
- [x] t6: Choose and document the concrete run-state serialization within the store as an implementer decision, verifying it carries the full R-STATE-1 content (D9 open choice).

### Acceptance criteria

- The record extends the PRD 29 field set with the project identifier, the source digest, the dependency availability snapshot, and evidence references.
- Step status values are exactly the eight shared values and the runner defines no additional or renamed status values.
- The serialization choice is recorded as an implementer decision and carries every required field.

### Dependencies

- Stage 1 storage seam.
- The parsed Playbook model and shared status vocabulary from the W18 R6 lineage (PRD 34).

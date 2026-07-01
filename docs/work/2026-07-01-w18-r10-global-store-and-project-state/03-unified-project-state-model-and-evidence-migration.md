---
title: "Phase 3: Unified Project-State Model and Evidence Migration"
kind: "work"
status: "active"
coordinate: "W18 R10 P3"
source:
  type: "prd"
  path: "docs/prd/38-revise-global-store-and-project-state.md"
---

# Phase 3: Unified Project-State Model and Evidence Migration

## Purpose

Give the store its content model: one project-state model whose two facets — Playbook run-state and work-execution evidence — share a schema and a migration path, plus the install and directory registry that mirrors project manifests. This phase is what removes the per-repo checkpoint JSON pattern and resolves the storage question the migrated-operations inventory raised.

## Overview

Implement the unified project-state model keyed by the project identifier, hold the run-state facet as the storage seam the W18 R7 runner consumes without redefining its record shape or progression semantics, migrate the genuine-state fields of the per-repo checkpoint JSON at `.make-docs/runs/<wave-slug>/state.json` into work-execution evidence keyed to canonical work-item identity, and keep the install registry a mirror whose canonical source remains each project's manifest.

## Source PRD Docs

- [38 Revise Global Store and Project State](../../prd/38-revise-global-store-and-project-state.md)
- [35 Revise Run Playbook State Machine](../../prd/35-revise-run-playbook-state-machine.md)
- [21 Revise Tool Directory System Custom Resource Tiers](../../prd/21-revise-tool-directory-system-custom-resource-tiers.md)
- [05 Installation Profile and Manifest Lifecycle](../../prd/05-installation-profile-and-manifest-lifecycle.md)

## Stage 1 - The Project-State Model

### Tasks

- [ ] t1: Implement the project-state model as one schema with two facets keyed by the project identifier — Playbook run-state as defined by the W18 R7 lineage, and work-execution evidence as the recorded sign-offs and decisions that cannot be re-derived from the repository or git (R-PS-1).
- [ ] t2: Expose the run-state facet as the storage seam PRD 35's R-STORE-1 and R-STORE-2 consume — read, create, and transition records keyed by project identifier plus run identifier — without redefining the run-state record shape or progression semantics owned by the W18 R7 lineage (R-SCOPE-1).
- [ ] t3: Keep both facets on the shared model and shared migration path; reject any design that gives run-state and work-execution evidence separate ad-hoc stores or parallel vocabularies (R-PS-2).

### Acceptance criteria

- Run-state and work-execution evidence rows live in one project-state model with one schema version and one migration path.
- The run-state seam satisfies what PRD 35 requires of the store — global-store location and identifier-plus-run-id keying — and defines nothing about progression, status vocabulary, or record content that PRD 35 owns.

### Dependencies

- Phase 1 database and Phase 2 identity.

## Stage 2 - Work-Execution Evidence and the Checkpoint Migration

### Tasks

- [ ] t4: Implement work-execution evidence keyed to the canonical work-item identity — resolved repo root, wave slug, and phase path — produced by the retained work-item identity resolver; the store records evidence against that identity and never re-derives it (R-PS-3).
- [ ] t5: Migrate the per-repo checkpoint JSON's genuine-state fields — validation-passed, review-passed or waived, closeout-approved, and equivalent recorded decisions — into work-execution evidence, and drop its re-derivable fields per the disposition in [migrated-operations-inventory.md](../../assets/artifacts/migrated-operations-inventory.md); the checkpoint JSON is not ported verbatim (R-PS-2).
- [ ] t6: Retire `.make-docs/runs/<wave-slug>/state.json` as a write target in `packages/cli/src/operations/lifecycle/index.ts` and its readers, so no work-execution evidence is written to any repository path (R-BND-2).
- [ ] t7: Review the checkpoint-to-evidence field mapping against the inventory's keep/remove disposition so no genuine sign-off is dropped and no re-derivable field is ported (guards R-023).

### Acceptance criteria

- Work-execution evidence rows are keyed by project identifier plus canonical work-item identity, never by path-derived identity.
- After migration, every genuine-state field from the checkpoint JSON is queryable as evidence and no re-derivable field was carried over.
- No code path writes work-lifecycle state under `.make-docs/runs/` or any other repository path.

### Dependencies

- Stage 1 model; the retained work-item identity resolver from the migrated-operations disposition (its CLI surfacing is owned by the W18 R11 reorganization lineage and is consumed, not defined, here).

## Stage 3 - The Install Registry as Mirror

### Tasks

- [ ] t8: Implement the install and directory registry in the store as a mirror and index for cross-project queries and quick access, populated from project manifests (R-MIR-1).
- [ ] t9: Keep the mirror subordinate: every authoritative read of a project's install record resolves to that project's `.make-docs/manifest.json`, and the registry is rebuildable from manifests rather than being a second source of truth (R-MIR-1).
- [ ] t10: Encode the mirror-versus-relocated distinction in the model: registry rows are mirror data, project-state rows are relocated canonical data with no in-repo copy (R-MIR-2).

### Acceptance criteria

- The registry answers cross-project queries but never overrides a project manifest, and a stale or deleted registry is rebuildable from manifests without data loss.
- Run-state and work-execution evidence have no in-repo copy anywhere.

### Dependencies

- Stage 1 model and Phase 2 identity.

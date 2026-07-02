---
title: "Phase 3: Validator and Diagnostics"
kind: "work"
status: "active"
coordinate: "W18 R6 P3"
source:
  type: "prd"
  path: "docs/prd/34-revise-playbook-contract-and-model.md"
---

# Phase 3: Validator and Diagnostics

## Purpose

Implement the layered validator and the diagnostic catalog as the executable enforcement of the Phase 1 contract, kept in strict parity with it.

## Overview

Validation is layered so diagnostics are specific, and diagnostics are a first-class output because Playbooks are co-authored by humans and agents. Each diagnostic carries a stable code, a severity, a precise location naming the section, field, and source span, a message, and an expected-shape or fix hint. The exact human wording of messages is an implementer choice under D6.

## Source PRD Docs

- [34 Revise Playbook Contract and Model](../../prd/34-revise-playbook-contract-and-model.md)
- [29 Revise Playbook Contract Run Playbook](../../prd/29-revise-playbook-contract-run-playbook.md)
- [22 Revise New Docs Assets Playbooks Persona Model](../../prd/22-revise-new-docs-assets-playbooks-persona-model.md)

## Stage 1 - Layered Validation

### Tasks

- [x] t1: Implement structural validation: heading presence and order for the eleven-heading spine, frontmatter field presence and enum values (including `stack`, `status`, `schemaVersion`, `workflowSchemaVersion`), persona/folder agreement, and the file-naming convention (R-DOC-1, R-DOC-3, R-DOC-5, R-MODEL-4).
- [x] t2: Implement registry validation: the exact six-column schema, kind and requirement enums with `asset` as an optional kind, and unique dependency IDs (R-DEP-2, R-DEP-3).
- [x] t3: Implement workflow validation: workflow header fields, step schema, the executor/role/activation/mode enums, per-executor and per-mode required fields including `event` for event-bound steps, gate semantics for gate steps, and an `operation` or `command` for deterministic steps (R-WF-3, R-WF-4, R-WF-5).
- [x] t4: Implement cross-reference integrity: every `uses`/`requires` resolves to a registry ID, every routing target resolves to a defined step id, and no step id is duplicated (R-DEP-4).
- [x] t5: Implement consistency validation: a `requires` may not target an `optional` dependency, event names come from the known set, and unreferenced declared dependencies produce warnings rather than errors (R-DEP-4, R-MODEL-4).
- [x] t6: Validate the optional orchestration policy shape (`requires_capabilities`, `prefers_capabilities`, `child_playbooks`, `concurrency`) without evaluating or enforcing its runtime semantics (R-WF-8).

### Acceptance criteria

- Every rule stated in the Phase 1 contract is enforced by the validator, and the validator enforces no rule the contract omits (R-AUTH-3).
- Validation layers report independently so a registry error does not suppress workflow diagnostics.
- Contract violations are detectable at validate time, before any run or packaging attempt (R-TEST-4).

### Dependencies

- Phase 2 parser and model.

## Stage 2 - Diagnostic Catalog

### Tasks

- [x] t7: Implement the diagnostic record shape: stable code, severity, precise location with section, field, and source span, message, and expected-shape or fix hint (R-MODEL-5).
- [x] t8: Implement at least the seven catalog codes with their fixed severities: PB-DOC-001 (error), PB-FM-002 (error), PB-DEP-003 (error), PB-DEP-004 (warning), PB-WF-005 (error), PB-WF-006 (error), PB-FILE-007 (warning) (R-MODEL-5).
- [x] t9: Expose the catalog from the library so the validate operation and a future language server share identical diagnostics (R-MODEL-6).
- [x] t10: Reconcile the Phase 1 contract text against the implemented catalog and validator behavior, updating whichever side drifted so parity holds before closeout (R-AUTH-3).

### Acceptance criteria

- Every emitted diagnostic carries all five required elements; none is a bare message string.
- The catalog codes, severities, and meanings match the contract table exactly.
- No diagnostic is produced by narrative free-text interpretation.

### Dependencies

- Stage 1 validation layers.

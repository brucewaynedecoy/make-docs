---
title: "Phase 1: Playbook Contract Authoring"
kind: "work"
status: "active"
coordinate: "W18 R6 P1"
source:
  type: "prd"
  path: "docs/prd/34-playbook-authoring-contract-and-model.md"
---

# Phase 1: Playbook Contract Authoring

## Purpose

Create the normative Playbook contract as a first-class system contract, upstream first, so the parser and validator in later phases have an authoritative specification to enforce and stay in parity with.

## Overview

This phase authors `playbook-contract.md` in the shipped template and dogfoods it into this repository's installed instance. The contract states the document schema, the workflow contract and step model, the dependency registry, and the diagnostic expectations — exactly what the validator will enforce and nothing more. An optional reader-facing guide may project the contract for humans without adding, relaxing, or contradicting any requirement.

## Source PRD Docs

- [34 Revise Playbook Contract and Model](../../prd/34-playbook-authoring-contract-and-model.md)
- [29 Revise Playbook Contract Run Playbook](../../prd/34-playbook-authoring-contract-and-model.md#requirements)
- [22 Revise New Docs Assets Playbooks Persona Model](../../prd/22-project-documentation-asset-model.md#requirements)
- [19 Revise Template Package Dogfood Source of Truth Contract](../../prd/06-template-contracts-and-generated-assets.md#template-source-authority)

## Stage 1 - Upstream Contract Authoring

### Tasks

- [x] t1: Author `packages/docs/template/.make-docs/contracts/system/playbook-contract.md` as the normative authority covering the document schema (R-DOC-1 through R-DOC-7), the workflow contract and step model (R-WF-1 through R-WF-8), the dependency registry (R-DEP-1 through R-DEP-5), and the model/validator/diagnostic expectations (R-MODEL-1 through R-MODEL-6), including the eleven-heading spine, the required and optional frontmatter fields with enums, the `playbook` info string, the executor/role/activation/mode dimensions with the `delegated` default, the shared eight-value status vocabulary, and the six-column dependency table with its kind and requirement enums.
- [x] t2: State the authoritative-versus-narrative line in the contract: only frontmatter, the dependency registry table, and the single workflow contract block carry machine meaning, and narrative sections are checked only for presence and non-emptiness (R-DOC-6).
- [x] t3: State the filename rule in the contract: new Playbooks use `<slug>.playbook.md`, plain `<slug>.md` files with `kind: playbook` are a deprecated form that triggers PB-FILE-007, and the `persona` frontmatter must match the folder (R-DOC-1, R-DOC-2).
- [x] t4: Record the contract's boundary statements: standalone workflow files are not required (R-WF-2), the orchestration policy fields are shape-only here with runtime semantics owned by the Run Playbook lineage (R-WF-8), dependency `Kind` materialization is owned by packaging (R-DEP-5), and `operation` references registry identifiers rather than CLI command strings (R-SCOPE-2).
- [x] t5: Include or reference the canonical worked example consistent with the architecture artifact Section 2.6 so authors see one conformant `## Workflow Contract` block with a deterministic `operation` step, a `human` `gate` step, and an `event-bound` step (R-WF-7).

### Acceptance criteria

- The upstream contract exists at `packages/docs/template/.make-docs/contracts/system/playbook-contract.md` and states every rule the Phase 3 validator will enforce, with no rule stated in only one of the two (R-AUTH-2, R-AUTH-3).
- Every D6 fixed decision appears in the contract verbatim in substance: the heading spine and order, the authoritative-versus-narrative line, the `playbook` info string, all enumerations and the `delegated` default, the single-model rule, and the `operation`-versus-`command` split.
- The contract does not restate or redefine runner progression, packaging, conformance, CLI-reorganization, or global-store behavior (R-SCOPE-1).

### Dependencies

- PRD 34 and the accepted W18 R6 design.

## Stage 2 - Dogfood and Optional Guide

### Tasks

- [x] t6: Dogfood the contract to `./.make-docs/contracts/system/playbook-contract.md` and confirm the upstream and downstream copies match (R-AUTH-1, R-AUTH-2).
- [x] t7: Decide whether to create the optional reader-facing guide under `docs/assets/library/<persona-slug>/`; if created, author it upstream first, dogfood it, and keep it a pure projection that adds no requirements (R-AUTH-4).
- [x] t8: Update any system routers or references that must point at the new contract so contract discovery works from `.make-docs/contracts/system/`, without moving or renaming existing contracts.

### Acceptance criteria

- The dogfood copy matches the upstream template copy byte-for-byte or with only sanctioned instance differences.
- If a guide exists, it adds, relaxes, or contradicts nothing in the contract.
- No Make Docs-owned resource introduced by this phase was authored directly in the downstream instance.

### Dependencies

- Stage 1 upstream contract.

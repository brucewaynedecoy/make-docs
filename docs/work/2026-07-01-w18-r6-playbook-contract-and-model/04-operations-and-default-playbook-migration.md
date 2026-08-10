---
title: "Phase 4: Operations Wiring and Default Playbook Migration"
kind: "work"
status: "active"
coordinate: "W18 R6 P4"
source:
  type: "prd"
  path: "docs/prd/34-playbook-authoring-contract-and-model.md"
---

# Phase 4: Operations Wiring and Default Playbook Migration

## Purpose

Expose the library through the `playbook.validate` and `playbook.catalog` operations and migrate the shipped default Playbook to the new contract, so the contract is both invocable and satisfied by the assets Make Docs ships.

## Overview

The operations wrap the Phase 2/3 library without duplicating its logic, consuming stable operation identifiers as an external contract from the operation registry. The default Playbook migrates to the `<slug>.playbook.md` suffix and the full contract shape, upstream first and then dogfooded. The runner and packaging surfaces are consumers of the model, not implementations in this phase.

## Source PRD Docs

- [34 Revise Playbook Contract and Model](../../prd/34-playbook-authoring-contract-and-model.md)
- [29 Revise Playbook Contract Run Playbook](../../prd/34-playbook-authoring-contract-and-model.md#requirements)
- [25 Revise CLI Separation and MCP Boundary](../../prd/25-typescript-runtime-cli-mcp-operation-boundaries.md)
- [33 Enhance Playbook Packaging and Harness Adapter Registry](../../prd/36-playbook-packaging-compiler-and-harness-adapters.md)

## Stage 1 - Operations Wiring

### Tasks

- [x] t1: Implement `playbook.validate` as a wrapper over the library that parses one or more Playbooks and reports the full diagnostic set with codes, severities, locations, and fix hints (R-MODEL-6).
- [x] t2: Implement `playbook.catalog` as a wrapper over the library that enumerates Playbooks by canonical `persona/slug` reference with their frontmatter identity, detecting both the suffix form and the deprecated plain form (R-MODEL-6, R-DOC-2, R-DOC-4).
- [x] t3: Keep both operations inside the modular TypeScript operation-domain boundary so CLI, MCP, plugin, skill, or agent surfaces call the same operations, per PRD 25.
- [x] t4: Consume operation identifiers from the operation registry as an external contract; do not mint identifiers locally or hardcode CLI command strings in library or operation code (R-SCOPE-2).

### Acceptance criteria

- `playbook.validate` and `playbook.catalog` produce their results solely by reading the library's Playbook model and diagnostics; neither re-parses Markdown independently (R-MODEL-2).
- A future language server could wrap the same library and produce identical diagnostics; nothing diagnostic-shaped lives only in the operation layer (R-MODEL-6).
- No runner progression, packaging, or conformance behavior is implemented in this phase (R-SCOPE-1).

### Dependencies

- Phase 3 validator and diagnostic catalog.

## Stage 2 - Default Playbook Migration

### Tasks

- [x] t5: Migrate `packages/docs/template/docs/assets/playbooks/agent/make-docs-lifecycle.md` to the `<slug>.playbook.md` suffix form upstream, restructuring it to the eleven-heading spine with conformant frontmatter, a dependency registry table, and a single `playbook` workflow contract block (R-DOC-2, R-AUTH-5).
- [x] t6: Dogfood the migrated default Playbook into `./docs/assets/playbooks/agent/` and remove or supersede the deprecated plain-file form in both locations without stranding links (R-AUTH-1, R-AUTH-5).
- [x] t7: Audit and update references to the old default-Playbook filename across routers, contracts, references, tests, and package validation so no live surface points at the deprecated form.
- [x] t8: Confirm the build-time copy under `packages/cli/template/` is generated, not hand-edited, and that package validation covers the migrated file (R-AUTH-5).

### Acceptance criteria

- The migrated default Playbook validates with zero errors in both the upstream template and the dogfood instance (R-TEST-3).
- All shipped default Playbooks validate with zero errors (R-TEST-3).
- No hand-authored edits land in `packages/cli/template/`.

### Dependencies

- Stage 1 operations for validation runs; Phase 1 contract for the target shape.

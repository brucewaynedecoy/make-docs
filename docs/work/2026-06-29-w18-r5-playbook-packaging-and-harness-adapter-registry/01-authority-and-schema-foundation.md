# Phase 1: Authority and Schema Foundation

## Purpose

Establish the implementation authority, package-plan schema, generated-output schema, and adapter-registry schema before planner or writer code lands.

## Overview

This phase should be completed before W18 R1, W18 R2, or W18 R3 implementation proceeds further. It prevents downstream Playbook, plugin, bundle, and adversarial-review code from choosing shapes that cannot support required v2 packaging.

## Source PRD Docs

- [33 Enhance Playbook Packaging and Harness Adapter Registry](../../prd/33-enhance-playbook-packaging-and-harness-adapter-registry.md)
- [29 Revise Playbook Contract Run Playbook](../../prd/29-revise-playbook-contract-run-playbook.md)
- [30 Revise Harness Plugin Substrate Workflow Bundles](../../prd/30-revise-harness-plugin-substrate-workflow-bundles.md)
- [25 Revise CLI Separation and MCP Boundary](../../prd/25-revise-cli-separation-and-mcp-boundary.md)

## Stage 1 - Requirements Trace

### Tasks

- [x] t1: Confirm PRD 33, PRD 29, PRD 30, PRD 25, PRD 28, PRD 20, PRD 32, and the W18 R1/R2/R3 backlogs agree on the W18 R5 packageability guardrails.
- [x] t2: Identify the TypeScript operation-domain home for package planning, harness adapters, surface resolution, and output writing without adding monolithic catch-all files.
- [x] t3: Add focused architecture notes or code comments only where necessary to make the domain split discoverable.

### Acceptance criteria

- W18 R1/R2/R3 workers have a clear W18 R5 prerequisite and do not need to decide output kinds, surface model, or adapter modularity.
- Package planning, adapter registry, surface resolution, and output writers have named implementation homes.
- No code path treats `generic` as a harness id.

### Dependencies

- W18 R5 design and PRD 33.

## Stage 2 - Schema Foundation

### Tasks

- [x] t4: Define package-plan data structures for source Playbook refs, digests, target harness, output kind, surface, scope, generated artifacts, review state, support status, and lifecycle behavior.
- [x] t5: Define generated-output ownership records that distinguish source Playbooks, generated plugins, generated skills bundles, generated adapters, symlink exposures, copy mirrors, export-only files, user-authored files, and legacy generated outputs.
- [x] t6: Define harness adapter declarations for supported output kinds, surfaces, path templates, preconditions, exposure modes, lifecycle rules, and conformance requirements.
- [x] t7: Add schema/unit tests for valid and invalid package plans, generated-output records, adapter declarations, surface profiles, and review-state transitions.

### Acceptance criteria

- Package-plan records are serializable and suitable for CLI/MCP dry-run output.
- Generated-output records can feed manifest, audit, backup, uninstall, migration, and diagnostics.
- Adapter declarations make future harness support additive.
- Tests fail closed for unknown output kinds, unknown surfaces, invalid harness ids, and missing review state when review is required.

### Dependencies

- Stage 1 implementation homes.

---
title: "Phase 2: Compiler Output Writer and Dependency Materialization"
kind: "work"
status: "active"
coordinate: "W18 R8 P2"
source:
  type: "prd"
  path: "docs/prd/36-revise-playbook-packaging-compiler-and-harness-adapters.md"
---

# Phase 2: Compiler Output Writer and Dependency Materialization

## Purpose

Fix the triggering defect: the output writer emits a Make Docs descriptor that no harness treats as an installable artifact. This phase rebuilds the writer into a compiler that lowers Playbook models plus a reviewed package plan into the multi-file harness-native distributable inventory, writing through the exposure plumbing that already works.

## Overview

Replace the descriptor payload with a faithful harness-native artifact tree, emit the full distributable inventory as a function of the Playbook model and the target, keep generation two-tier with the deterministic/agent-assisted boundary recorded in field provenance, fail closed before any write when review is required, and materialize each dependency according to its declared kind. The internal compiler structure is an implementer freedom provided it produces the required inventory and honors the generation split (D9).

## Source PRD Docs

- [36 Revise Playbook Packaging Compiler and Harness Adapters](../../prd/36-revise-playbook-packaging-compiler-and-harness-adapters.md)
- [33 Enhance Playbook Packaging and Harness Adapter Registry](../../prd/33-enhance-playbook-packaging-and-harness-adapter-registry.md)
- [34 Revise Playbook Contract and Model](../../prd/34-revise-playbook-contract-and-model.md)
- [28 Revise Shared Agentics Installation Harness Redirection](../../prd/28-revise-shared-agentics-installation-harness-redirection.md)
- [25 Revise CLI Separation and MCP Boundary](../../prd/25-revise-cli-separation-and-mcp-boundary.md)

## Stage 1 - Output Writer Correction Through Existing Plumbing

### Tasks

- [ ] t1: Rebuild the output writer to produce a real, harness-native, multi-file distributable and remove the code path that emits a Make Docs descriptor as the installable artifact (R-COMP-1).
- [ ] t2: Write the corrected payload through the existing exposure plumbing unchanged — canonical payload under the staging area, exposure mirror placed at the harness path by symlink or copy-mirror, and manifest ownership records tracking both — so only the payload content changes (R-COMP-2).
- [ ] t3: Preserve the reviewed pipeline and deterministic rails around the new writer: source validation, package intent, reviewed package plan, adapter resolution, manifest and provenance records, audit, backup before destructive changes, owned-output-only uninstall, and package/lifecycle/conformance validation (R-KEEP-1).

### Acceptance criteria

- The installable artifact is a multi-file harness-native tree; no output path emits a descriptor whose kind is a Make Docs type.
- Staging payload, exposure mirror, and manifest ownership behavior are byte-for-byte the existing PRD 28 plumbing semantics; no new storage is introduced.
- Every preserved W18 R5 rail still runs in order around the corrected writer.

### Dependencies

- Phase 1 capability descriptor and distributable model.
- The exposure plumbing from [PRD 28](../../prd/28-revise-shared-agentics-installation-harness-redirection.md), consumed unchanged.

## Stage 2 - Distributable Inventory Emission

### Tasks

- [ ] t4: Emit a `SKILL.md` per source Playbook preserving workflow intent, trigger description, step instructions, references, and safety boundaries from the rich Playbook model (R-COMP-3).
- [ ] t5: Emit references extracted or copied from Playbook authority sources where redistribution is allowed, and linked otherwise (R-COMP-3, R-DEPMAT-1).
- [ ] t6: Emit deterministic helper scripts and dependency-check scripts, each with provenance and lifecycle ownership, only when needed (R-COMP-3).
- [ ] t7: Emit the harness-native manifest the target requires, hooks from event-bound steps per the Phase 1 mapping, tool and dependency declarations, marketplace or registration files per the Phase 4 seam, lifecycle records, and conformance records, as applicable per target (R-COMP-3, R-CAP-5).

### Acceptance criteria

- The emitted inventory is a function of the Playbook model and the target, and every inventory category in R-COMP-3 is producible when the target and model call for it.
- Skill content preserves the Playbook's intent, triggers, steps, references, and safety boundaries rather than summarizing them away.
- The exact organization of generated files within the harness's layout constraints remains an implementer decision recorded with the code (D9).

### Dependencies

- Stage 1 writer correction.
- The W18 R6 Playbook model's rich step, dependency, and activation content.

## Stage 3 - Two-Tier Generation and Fail-Before-Write

### Tasks

- [ ] t8: Generate schema-owned fields deterministically — file paths, manifest structure, dependency checks, provenance, and digests — and record the tier boundary in field provenance (R-GEN-1).
- [ ] t9: Route semantic fields — skill descriptions and triggers, bundle grouping, and harness-facing prose — through review-gated agent-assisted proposals that gain authority only when the package plan is accepted (R-GEN-1, R-KEEP-1).
- [ ] t10: Fail closed before any write when unresolved semantic decisions, ownership conflicts, missing dependencies, unsupported surfaces, or missing conformance evidence require review, preserving the W18 R5 planner's fail-before-write behavior (R-GEN-2).

### Acceptance criteria

- Field provenance classifies every generated field as deterministic, user-supplied, agent-proposed, or unresolved, and the deterministic/semantic boundary matches R-GEN-1.
- No write occurs while any reviewed-required condition is unresolved; non-interactive runs stop before writing.
- Agent assistance remains limited to package-plan drafting; the prompt wording used to elicit proposals is an implementer freedom (D9).

### Dependencies

- Stages 1 and 2.

## Stage 4 - Dependency Materialization Per Kind

### Tasks

- [ ] t11: Materialize `cli` and `package-manager` dependencies as deterministic check scripts plus human instructions, with `cli` dependencies on Make Docs itself referencing stable operation identifiers from the registry rather than CLI command strings (R-DEPMAT-1, R-SCOPE-1).
- [ ] t12: Materialize `skill` and `plugin` dependencies as harness-native manifest references where the target supports them, and degrade explicitly where it does not (R-DEPMAT-1, R-CAP-4).
- [ ] t13: Materialize `mcp` and `external-service` dependencies as Make Docs metadata plus a runtime availability check (R-DEPMAT-1).
- [ ] t14: Materialize `reference` dependencies by copy or extraction where redistribution is allowed and by link otherwise, and `playbook` dependencies as an additional skill when bundled or a reference when not (R-DEPMAT-1).

### Acceptance criteria

- Every dependency kind in the Playbook dependency registry has exactly the materialization behavior R-DEPMAT-1 assigns it.
- Generated Make Docs dependency checks reference operation identifiers and survive CLI reorganization; no generated output hardcodes CLI command strings.
- Unsupported skill/plugin dependency targets degrade with a declared choice, never silently.

### Dependencies

- Stage 2 inventory emission.
- The typed dependency registry from the W18 R6 Playbook model and the operation registry from the CLI command reorganization lineage.

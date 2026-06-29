# Phase 2: Package Planner and Review Flow

## Purpose

Implement the package planner as a deterministic, review-first bridge from Playbook source to generated package intent.

## Overview

This phase creates package plans but should not require full plugin or skills-bundle writers to be complete. It gives users and agents a safe dry-run surface before any generated package outputs are written.

## Source PRD Docs

- [33 Enhance Playbook Packaging and Harness Adapter Registry](../../prd/33-enhance-playbook-packaging-and-harness-adapter-registry.md)
- [29 Revise Playbook Contract Run Playbook](../../prd/29-revise-playbook-contract-run-playbook.md)
- [25 Revise CLI Separation and MCP Boundary](../../prd/25-revise-cli-separation-and-mcp-boundary.md)
- [20 Revise Agent Harness Model Conformance Lab](../../prd/20-revise-agent-harness-model-conformance-lab.md)

## Stage 1 - Source Validation

### Tasks

- [ ] t1: Reuse the W18 R4/W18 R1 Playbook resolver and validation path for explicit path, `persona/slug`, and unique bare slug/title source selection.
- [ ] t2: Validate required Playbook frontmatter, `stack`, persona/path drift, source assets, relative Markdown links, output-surface claims, and run metadata before planning.
- [ ] t3: Compute source digests and package-source references for all Playbooks included in a plan.

### Acceptance criteria

- Package planning cannot proceed from an invalid, ambiguous, or broken Playbook source.
- Validation errors identify whether the stop is source-invalid, unresolved-target, ambiguous-source, or manual-review-required.
- Source digests remain stable across repeated dry runs.

### Dependencies

- W18 R4 resolver primitives and W18 R1 Playbook validation hooks.

## Stage 2 - Reviewable Package Plans

### Tasks

- [ ] t4: Implement package-plan generation for `plugin` and `skills-bundle` output intents.
- [ ] t5: Mark plan fields as deterministic, user-supplied, agent-proposed, or unresolved.
- [ ] t6: Add non-interactive stop behavior when semantic interpretation, ownership ambiguity, unsafe rewrite, unsupported surface, or support-claim evidence is missing.
- [ ] t7: Expose package-plan dry-run output through CLI operation and MCP read-first surfaces without writing generated package outputs.

### Acceptance criteria

- A user can inspect a package plan before accepting writes.
- Agent-assisted fields are visibly marked as proposed and require review.
- Non-interactive runs fail before writing when review is required.
- CLI and MCP surfaces delegate to the same operation-domain planner.

### Dependencies

- Phase 1 schema foundation.

## Stage 3 - Package Plan Tests

### Tasks

- [ ] t8: Add fixture coverage for deterministic single-Playbook package plans.
- [ ] t9: Add fixture coverage for multi-Playbook skills bundles.
- [ ] t10: Add failure coverage for semantic-review requirements, missing metadata, broken links, missing assets, ambiguous source refs, user-modified generated outputs, unsupported output kinds, and unsupported surfaces.
- [ ] t11: Add package-plan snapshot or structured-output tests that are stable enough for review without overfitting generated prose.

### Acceptance criteria

- Tests prove package plans are deterministic where the inputs are deterministic.
- Tests prove semantic and ownership ambiguity stops before writes.
- Tests prove dry-run output contains enough information for a user or agent to review the plan.

### Dependencies

- Stages 1 and 2.

---
title: "Phase 5: Tests and Verification"
kind: "work"
status: "active"
coordinate: "W18 R8 P5"
source:
  type: "prd"
  path: "docs/prd/36-revise-playbook-packaging-compiler-and-harness-adapters.md"
---

# Phase 5: Tests and Verification

## Purpose

Prove the corrected compiler and verified adapters behave as specified, and keep the evidence honest: unit and integration tests prove the code, while real-harness recognition is proven only by the conformance design. This phase consumes every earlier deliverable.

## Overview

Land the D10 test suite: the harness-native-tree assertion, the Codex shape assertions, fixture-adapter fail-closed coverage, dependency-materialization and generation-gate coverage, provenance and lifecycle cleanliness coverage, and the explicit boundary that none of it constitutes harness-recognition evidence.

## Source PRD Docs

- [36 Revise Playbook Packaging Compiler and Harness Adapters](../../prd/36-revise-playbook-packaging-compiler-and-harness-adapters.md)
- [33 Enhance Playbook Packaging and Harness Adapter Registry](../../prd/33-enhance-playbook-packaging-and-harness-adapter-registry.md)
- [20 Revise Agent Harness Model Conformance Lab](../../prd/20-revise-agent-harness-model-conformance-lab.md)
- [25 Revise CLI Separation and MCP Boundary](../../prd/25-revise-cli-separation-and-mcp-boundary.md)

## Stage 1 - Distributable and Adapter Shape Tests

### Tasks

- [x] t1: Assert that a generated distributable is a multi-file, harness-native tree and not a Make Docs descriptor (R-TEST-1).
- [x] t2: Assert that generated Codex plugin output contains `.codex-plugin/plugin.json` and a marketplace registration entry (R-TEST-2).
- [x] t3: Assert that Codex skills-bundle output uses `.agents/skills/{id}/SKILL.md` (R-TEST-2).

### Acceptance criteria

- R-TEST-1 fails against the descriptor-era writer and passes against the Phase 2 compiler.
- The R-TEST-2 Codex shape assertions pin both the plugin folder shape with its marketplace registration entry and the skills-bundle discovery path.

### Dependencies

- Phase 2 compiler output and the Phase 3 Codex adapter correction.

## Stage 2 - Fail-Closed and Pipeline Behavior Tests

### Tasks

- [x] t4: Cover adapter fail-closed behavior for an unknown harness, an unsupported output kind, and an unsupported surface, using the fixture adapter (R-TEST-3).
- [x] t5: Cover dependency materialization per kind, including that Make Docs `cli` dependency checks reference operation identifiers rather than command strings (R-TEST-4, R-DEPMAT-1).
- [x] t6: Cover the deterministic-versus-agent-assisted generation gate, including fail-before-write on unresolved semantic decisions, ownership conflicts, missing dependencies, unsupported surfaces, and missing conformance evidence (R-TEST-4, R-GEN-2).
- [x] t7: Cover provenance and ownership records and backup and uninstall cleanliness for generated outputs (R-TEST-4, R-PROV-1, R-PROV-2).

### Acceptance criteria

- Every fail-closed stop reason in R-ADAPT-5 has a fixture-adapter test that proves no write occurred.
- Every dependency kind's materialization behavior, the generation gate, provenance records, and lifecycle cleanliness have direct coverage.

### Dependencies

- Phases 2 through 4.

## Stage 3 - Evidence Boundary

### Tasks

- [x] t8: Record in the test suite and its documentation that real-harness recognition, installation, and invocation are proven by the conformance design (planned as W18 R9), and that unit and integration tests here must not be read as evidence that a harness recognizes the output (R-TEST-5).
- [x] t9: Verify that no adapter support status advanced beyond provisional on the strength of this suite alone, and that support claims remain bound to the exact tuple (R-PROV-3, R-ADAPT-1).

### Acceptance criteria

- The R-TEST-5 boundary is stated where the tests live, and no support wording, README claim, or manifest status cites this suite as harness-recognition evidence.
- All adapter support statuses remain provisional pending conformance scenarios for their tuples.

### Dependencies

- Stages 1 and 2.
- The conformance design (W18 R9) as the owner of the recognition evidence bar.

---
title: "Phase 3: Test-Layer Separation and Meta-Verification"
kind: "work"
status: "active"
coordinate: "W18 R9 P3"
source:
  type: "prd"
  path: "docs/prd/37-enhance-playbook-and-package-conformance.md"
---

# Phase 3: Test-Layer Separation and Meta-Verification

## Purpose

Keep the evidence honest structurally: organize coverage into three named layers so one layer's passing never masquerades as another's, and land the D9 meta-verification checks that police the registry, the scenarios, and the maintainer-only boundary. This phase depends on the Phase 1 registry and the Phase 2 scenarios as the things being checked.

## Overview

Unit tests cover the operation core, parser, and validator as pure functions without a CLI; integration tests cover the CLI and MCP surfaces over the core including the manifest and exposure plumbing; conformance tests cover the real-harness user outcome per tuple through the maintainer lab. The layer rule is the direct corrective for the failure mode that let the descriptor output look correct while not being recognized. The meta-verification checks assert that no tuple is conformance-validated without a qualifying run, that the required scenarios exist and report honestly, and that conformance assets never ship.

## Source PRD Docs

- [37 Enhance Playbook and Package Conformance](../../prd/37-enhance-playbook-and-package-conformance.md)
- [20 Revise Agent Harness Model Conformance Lab](../../prd/20-revise-agent-harness-model-conformance-lab.md)
- [36 Revise Playbook Packaging Compiler and Harness Adapters](../../prd/36-revise-playbook-packaging-compiler-and-harness-adapters.md)
- [10 Packaging Validation and Release Reference](../../prd/10-packaging-validation-and-release-reference.md)
- [19 Revise Template Package Dogfood Source of Truth Contract](../../prd/19-revise-template-package-dogfood-source-of-truth-contract.md)

## Stage 1 - Three Named Test Layers

### Tasks

- [x] t1: Organize existing and new coverage into the three named layers — unit (operation core, parser, validator as pure functions without a CLI), integration (CLI and MCP surfaces over the core, including manifest and exposure plumbing), and conformance (real-harness user outcome per tuple through the maintainer lab) — and name the layer each suite belongs to where the tests live (R-LAYER-1).
- [x] t2: Record the boundary rule where the unit and integration tests live: internal tests passing is never evidence that a harness recognizes or can use the output, aligning with PRD 36 R-TEST-5 (R-LAYER-2).

### Acceptance criteria

- Every packaging-related test is attributable to exactly one named layer, and no suite is cited across layers (R-LAYER-1).
- No support wording, README claim, registry status, or manifest status cites unit or integration tests as harness-recognition evidence (R-LAYER-2).

### Dependencies

- Phase 1 registry statuses as the consumer of layer-correct evidence.

## Stage 2 - Meta-Verification Checks

### Tasks

- [x] t3: Land a check asserting that no tuple is marked `conformance-validated` without a recorded run that meets the D4 bar (R-TEST-1).
- [x] t4: Land a check asserting that the required first-pass scenarios exist and are runnable, and that unavailable ones report `blocked` rather than silently passing (R-TEST-2).
- [x] t5: Land a packaging or exclusion check asserting that conformance assets are absent from the shipped template, the packaged copy, and npm tarballs, wired into the packaging validation surface (R-TEST-3).

### Acceptance criteria

- The R-TEST-1 check fails when any registry tuple claims `conformance-validated` without a qualifying recorded run.
- The R-TEST-2 check fails when a required R-SCEN-1 scenario is missing, unrunnable, or silently passing while its preconditions are unmet; blocked scenarios report `blocked`.
- The R-TEST-3 check fails when any `docs/assets/conformance/**` content appears in `packages/docs/template/`, the generated `packages/cli/template/` copy, or an npm tarball, and it runs as part of package validation without making a green validation run a support claim (R-KEEP-1).

### Dependencies

- Stage 1 layer organization; Phase 1 registry; Phase 2 scenario specs.

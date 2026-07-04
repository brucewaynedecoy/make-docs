---
title: "Phase 1: Support Tuple and Tuple Registry"
kind: "work"
status: "active"
coordinate: "W18 R9 P1"
source:
  type: "prd"
  path: "docs/prd/37-enhance-playbook-and-package-conformance.md"
---

# Phase 1: Support Tuple and Tuple Registry

## Purpose

Give support status a single queryable home before any scenario runs: define the expanded support tuple for generated outputs and land the tuple registry data file whose statuses derive from run verdicts. Every later phase records into or checks against this registry, so it lands first.

## Overview

Define the eight-field support tuple that extends the lab's scenario-harness-model tuple with the surface, scope, output kind, and generated-output kind introduced by packaging, then create the registry under `docs/assets/conformance/` carrying every tuple with exactly one of the three statuses and the verdict-derivation rules that govern transitions. The concrete file format is an implementer choice provided it stays queryable and carries each tuple and status.

## Source PRD Docs

- [37 Enhance Playbook and Package Conformance](../../prd/37-enhance-playbook-and-package-conformance.md)
- [20 Revise Agent Harness Model Conformance Lab](../../prd/20-revise-agent-harness-model-conformance-lab.md)
- [36 Revise Playbook Packaging Compiler and Harness Adapters](../../prd/36-revise-playbook-packaging-compiler-and-harness-adapters.md)
- [33 Enhance Playbook Packaging and Harness Adapter Registry](../../prd/33-enhance-playbook-packaging-and-harness-adapter-registry.md)

## Stage 1 - Expanded Support Tuple

### Tasks

- [x] t1: Define the support tuple record for generated outputs — scenario, harness, surface, scope, output kind, generated-output kind, model or provider, and runtime — as the unit every support claim binds to (R-TUPLE-1).
- [x] t2: Map the tuple onto the existing lab result contract so model, provider, and runtime stay run metadata per PRD 20 and the tuple's packaging fields align with the PRD 36 distributable model (surface `native`/`agents-standard`/`auto`, scope `project`/`global`/`export-only`, output kind `plugin`/`skills-bundle`) without redefining either.

### Acceptance criteria

- A support claim for a generated output is bound to the exact eight-field tuple, and no claim may be broader than the evidence for its tuple (R-TUPLE-1).
- The tuple extends, and does not replace, the lab's scenario/harness/model/provider/runtime tuple; the lab's result contract and scenario protocol are consumed unchanged (R-SCOPE-1, R-KEEP-1).

### Dependencies

- PRD 37 accepted; the PRD 36 distributable and target model as the source of the packaging tuple fields.

## Stage 2 - Tuple Registry Data File

### Tasks

- [x] t3: Create the tuple registry as a queryable data file under `docs/assets/conformance/`, choosing and documenting a concrete format that carries every tuple and its status (R-REG-1, D8).
- [x] t4: Encode the three statuses — `provisional`, `implementation-validated`, `conformance-validated` — with their meanings, so each tuple carries exactly one (R-REG-2).
- [x] t5: Encode the verdict-derivation rules for status transitions: `conformance-validated` only on a `pass`, or a `pass-with-caveats` whose caveats are surfaced, that meets the D4 evidence bar; `inconsistent`, `unsupported`, and `blocked` never advance a tuple (R-REG-3).
- [x] t6: Seed the registry with the current W18 R8 adapter tuples at their honest statuses — `provisional` everywhere no internal or harness evidence exists, `implementation-validated` only where internal file and structure tests actually prove the generated output — and link each status to its evidence.

### Acceptance criteria

- The set of tuples and their statuses lives in the queryable data file, not in prose, and support status cannot drift from documentation (R-REG-1).
- Each tuple carries exactly one of the three statuses, and a status transition requires the corresponding evidence (R-REG-2).
- No tuple reaches `conformance-validated` without a recorded run that meets the D4 bar, and no verdict of `inconsistent`, `unsupported`, or `blocked` ever advances a tuple (R-REG-3, R-BAR-2).
- The registry lives under `docs/assets/conformance/` as maintainer-only in-repo content, deliberately not authored upstream in `packages/docs/template/` (R-KEEP-1).

### Dependencies

- Stage 1 tuple definition.

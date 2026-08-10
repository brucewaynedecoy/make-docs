---
title: "Phase 4: Support-Claim Governance"
kind: "work"
status: "active"
coordinate: "W18 R9 P4"
source:
  type: "prd"
  path: "docs/prd/20-agent-harness-conformance-and-support-claims.md"
---

# Phase 4: Support-Claim Governance

## Purpose

Bind public wording to evidence: wire the governance rules so a claim states only what a `conformance-validated` tuple proves, caveats surface, and the provisional support claims carried by the W18 R5 through W18 R8 lineages gain their promotion path. This phase closes the backlog and consumes every earlier deliverable.

## Overview

Governance is the human-facing half of the registry: wording rules for pre-validation outputs, caveat surfacing for `pass-with-caveats`, the one-run minimum and repeated-reviewed-run thresholds preserved from the lab, and the review flow that promotes a tuple's claim when its status advances. It also keeps the maintainer-only boundary visible in claim language — a Make Docs generated output is not called a harness-recognized plugin until the tuple proves it.

## Source PRD Docs

- [37 Enhance Playbook and Package Conformance](../../prd/20-agent-harness-conformance-and-support-claims.md#support-claim-governance)
- [20 Revise Agent Harness Model Conformance Lab](../../prd/20-agent-harness-conformance-and-support-claims.md)
- [33 Enhance Playbook Packaging and Harness Adapter Registry](../../prd/36-playbook-packaging-compiler-and-harness-adapters.md)
- [36 Revise Playbook Packaging Compiler and Harness Adapters](../../prd/36-playbook-packaging-compiler-and-harness-adapters.md)

## Stage 1 - Claim Wording and Thresholds

### Tasks

- [x] t1: Encode the wording rule wherever support language appears (docs, README, manifest support status, generated-output provenance): a public claim states only what a `conformance-validated` tuple proves, and until then wording distinguishes a Make Docs generated output from a harness-recognized plugin (R-GOV-1).
- [x] t2: Encode caveat surfacing: a `pass-with-caveats` result surfaces its caveats in any claim derived from it (R-GOV-1, R-REG-3).
- [x] t3: Preserve the lab thresholds: one passing conformance run per tuple is the minimum for nominal support, and repeated runs with maintainer review are the stronger threshold for a more confident claim (R-GOV-2).

### Acceptance criteria

- No public claim is broader than the tuple its evidence covers, and no claim exists for a tuple below `conformance-validated` (R-TUPLE-1, R-GOV-1).
- Every claim derived from a `pass-with-caveats` run carries its caveats, and stronger commendation language appears only behind repeated maintainer-reviewed runs (R-GOV-1, R-GOV-2).

### Dependencies

- Phase 1 registry statuses; Phase 2 recorded runs.

## Stage 2 - Promotion Path for Provisional Claims

### Tasks

- [x] t4: Wire the W18 R5/PRD 33 provisional support claims for generated plugin and skills-bundle outputs to the registry so their promotion is mechanical: claim wording may advance only when the exact tuple advances (R-GOV-1, R-REG-3).
- [x] t5: Wire the W18 R8/PRD 36 adapter support statuses to the registry so an adapter's status advances beyond provisional only through tuple evidence, consistent with PRD 36 R-ADAPT-1 and R-PROV-3, and unverified or future harnesses (Pi and later) remain honestly reported (R-SCEN-2).
- [x] t6: Confirm end-to-end traceability: following links from a public claim reaches the tuple, its status, and the recorded run that justified it, and the risk-register items R-021 and R-022 reflect the implemented state.

### Acceptance criteria

- Every provisional claim from the W18 R5 through W18 R8 lineages has a registry tuple, and none advanced without a qualifying D4-bar run (R-BAR-2, R-REG-3).
- Adapter support statuses in packaging records agree with the tuple registry, with no parallel or prose-only support surface (R-REG-1).
- Blocked or future-harness scenarios remain visibly `blocked` or unrun in every claim surface; absence is reported, never implied as covered (R-SCEN-2).

### Dependencies

- Stages of Phases 1 through 3; Stage 1 of this phase.

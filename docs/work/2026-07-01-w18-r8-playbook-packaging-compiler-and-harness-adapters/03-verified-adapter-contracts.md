---
title: "Phase 3: Verified Adapter Contracts"
kind: "work"
status: "active"
coordinate: "W18 R8 P3"
source:
  type: "prd"
  path: "docs/prd/36-revise-playbook-packaging-compiler-and-harness-adapters.md"
---

# Phase 3: Verified Adapter Contracts

## Purpose

Fix the second triggering defect: the Codex adapter declares an assumed `.agents/plugins/{packageId}` path that does not match the real Codex plugin shape. This phase makes verification against the real harness a structural requirement of every adapter declaration and lands the verified Codex, Claude Code, and Pi contracts.

## Overview

Attach a verification reference and status to every adapter declaration, gate output and support behavior on that status, correct the Codex adapter's path and payload to the verified contract, implement the Claude Code and Pi adapters against their verified shapes, and prove the fail-closed behavior for unknown and unsupported targets with the fixture adapter. The internal structure of each adapter module is an implementer freedom provided its declared contract is verified (D9).

## Source PRD Docs

- [36 Revise Playbook Packaging Compiler and Harness Adapters](../../prd/36-revise-playbook-packaging-compiler-and-harness-adapters.md)
- [33 Enhance Playbook Packaging and Harness Adapter Registry](../../prd/33-enhance-playbook-packaging-and-harness-adapter-registry.md)
- [30 Revise Harness Plugin Substrate Workflow Bundles](../../prd/30-revise-harness-plugin-substrate-workflow-bundles.md)
- [20 Revise Agent Harness Model Conformance Lab](../../prd/20-revise-agent-harness-model-conformance-lab.md)

## Stage 1 - Verification References and Status Gating

### Tasks

- [ ] t1: Add a verification reference — naming where the harness contract was confirmed — and a verification status to every adapter declaration (R-ADAPT-1).
- [ ] t2: Gate adapter behavior on verification status: an adapter whose contract is unverified may produce only export-only or provisional output and must not carry a support claim (R-ADAPT-1, R-PROV-3).
- [ ] t3: Require re-verification whenever an adapter's declared paths, manifest shapes, or registration steps change, keeping the verification reference current in review.

### Acceptance criteria

- No adapter ships without a verification reference and status, and no path, manifest shape, or registration step is assumed from a template.
- Unverified adapters are structurally limited to export-only or provisional output.
- Support claims remain tuple-bound and provisional pending conformance evidence owned by the W18 R9 conformance design (R-PROV-3, R-TEST-5).

### Dependencies

- Phase 1 capability descriptors as the carrier of verified contract data.

## Stage 2 - Codex Adapter Correction

### Tasks

- [ ] t4: Correct the Codex plugin contract: a plugin is a folder containing `.codex-plugin/plugin.json`, registered through a marketplace entry such as `.agents/plugins/marketplace.json` or a configured marketplace source, replacing the assumed `.agents/plugins/{packageId}` path (R-ADAPT-2).
- [ ] t5: Correct the Codex plugin payload from the descriptor to the harness-native artifact tree produced by the Phase 2 compiler (R-ADAPT-2, R-COMP-1).
- [ ] t6: Implement the Codex skills bundle as direct `.agents/skills/{id}/SKILL.md` discovery with symlink or copy-mirror exposure (R-ADAPT-2).

### Acceptance criteria

- The Codex adapter declares no `.agents/plugins/{packageId}` plugin path; both the path and the payload of the prior adapter are corrected.
- Codex plugin output is a `.codex-plugin/plugin.json` folder plus marketplace registration entry, and skills-bundle output lands at `.agents/skills/{id}/SKILL.md`.
- The Codex adapter carries a verification reference for these shapes and no Codex support claim precedes conformance evidence.

### Dependencies

- Stage 1 verification gating and the Phase 2 compiler output.

## Stage 3 - Claude Code and Pi Adapters

### Tasks

- [ ] t7: Implement the Claude Code adapter lowering a plugin to `.claude/plugins/{id}/plugin.json` and a skill to `.claude/skills/{id}/SKILL.md`, or to agents-standard `.agents/skills` for the portable profile (R-ADAPT-3).
- [ ] t8: Lower event-bound steps to Claude Code hook points per its descriptor's hook support (R-ADAPT-3, R-CAP-5).
- [ ] t9: Keep the Claude Code adapter's support status provisional until it is reviewed against the actual Claude Code plugin and skill contract (R-ADAPT-3, R-ADAPT-1).
- [ ] t10: Implement the Pi adapter with skills, MCP, and extension support but no hooks, selecting an extension bundled with one or more skills as its richest native container, and degrading event-bound steps to a documented manual step or skill instruction or failing closed per R-CAP-4 (R-ADAPT-4).

### Acceptance criteria

- Claude Code plugin, skill, portable-profile, and hook lowering match R-ADAPT-3 exactly, and the adapter stays provisional until reviewed against the real contract.
- The Pi adapter never emits hook artifacts; event-bound steps degrade with a declared choice or stop, and its native profile lowers to an extension bundled with skills.
- Adding Pi required no shared-planner changes: a descriptor, an adapter module, fixtures, and conformance scenarios only (R-KEEP-1).

### Dependencies

- Stages 1 and 2, plus Phase 1 container selection and degradation.

## Stage 4 - Fail-Closed Paths and the Fixture Adapter

### Tasks

- [ ] t11: Fail closed before any write on an unknown harness identifier, an unsupported output kind, an unsupported surface, or a scope the adapter cannot honor, consistent with the existing stop reasons (R-ADAPT-5).
- [ ] t12: Implement or extend the fixture adapter so it exercises the unsupported path and the fail-closed behavior is itself tested (R-ADAPT-5).

### Acceptance criteria

- Every unknown or unsupported target stops before any write with an explicit stop reason.
- The fixture adapter covers the unsupported path and is consumed by the Phase 5 test suite.

### Dependencies

- Stages 1 through 3.

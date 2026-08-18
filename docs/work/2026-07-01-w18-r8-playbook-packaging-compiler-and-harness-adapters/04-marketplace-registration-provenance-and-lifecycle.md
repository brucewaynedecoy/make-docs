---
title: "Phase 4: Marketplace Seam, Provenance, and Lifecycle"
kind: "work"
status: "active"
coordinate: "W18 R8 P4"
source:
  type: "prd"
  path: "docs/prd/36-playbook-packaging-compiler-and-harness-adapters.md"
---

# Phase 4: Marketplace Seam, Provenance, and Lifecycle

## Purpose

Make distribution safe: generated distributables must be discoverable by their harness without Make Docs mutating a user's global registration surfaces, and every generated artifact must remain traceable, removable, and honestly labeled. This phase depends on the corrected compiler output and the verified adapters.

## Overview

Generate marketplace and registration files into the distributable with generate-but-do-not-auto-register as the default, define the additive config-gated opt-in seam whose home is the global store, bind Playbook provenance to every generated artifact, keep backup and uninstall scoped to Make Docs-owned outputs, and hold every support claim provisional and tuple-bound until conformance evidence exists.

## Source PRD Docs

- [36 Revise Playbook Packaging Compiler and Harness Adapters](../../prd/36-playbook-packaging-compiler-and-harness-adapters.md)
- [33 Enhance Playbook Packaging and Harness Adapter Registry](../../prd/36-playbook-packaging-compiler-and-harness-adapters.md)
- [32 Revise Lifecycle Backup State and Agentics Pruning](../../prd/30-plugin-substrate-and-workflow-bundles.md) (historical section: `update-migration-audit-backup-and-uninstall`)
- [28 Revise Shared Agentics Installation Harness Redirection](../../prd/28-shared-agentics-installation-and-harness-exposure.md)
- [20 Revise Agent Harness Model Conformance Lab](../../prd/20-agent-harness-conformance-and-support-claims.md)

## Stage 1 - Marketplace and Registration Seam

### Tasks

- [x] t1: Generate registration and marketplace files into the distributable per the target's registration model from its capability descriptor (R-MKT-1, R-CAP-2).
- [x] t2: Enforce that a user's global marketplace is never auto-mutated without an explicit global scope and approval; the default is generate but do not install (R-MKT-1).
- [x] t3: Define the config-gated policy seam through which auto-registration may later be opted into, additive and off by default, with its configuration home in the global store owned by the Runtime and Global Store lineage; define only what the seam requires, never the store schema (R-MKT-2, R-SCOPE-1).

### Acceptance criteria

- Marketplace and registration files exist inside the generated distributable, and no packaging run mutates a global marketplace without explicit global scope and approval.
- The auto-registration opt-in is a documented seam, additive, and off by default; no auto-registration behavior ships enabled.
- The seam's store dependency is recorded, and nothing in this phase defines global-store internals.

### Dependencies

- Phase 2 compiler output and Phase 3 adapter registration models.
- The global store from the Runtime and Global Store lineage for the R-MKT-2 opt-in configuration home.

## Stage 2 - Provenance and Ownership Records

### Tasks

- [x] t4: Carry Playbook provenance on every generated artifact: source ref and digest, package profile, adapter id, output kind, generated files, ownership status, and support status (R-PROV-1).
- [x] t5: Keep manifest and audit records distinguishing source Playbooks, generated outputs, symlink exposures, copy mirrors, export-only files, user-authored files, and legacy generated outputs, preserving the W18 R5 classification (R-KEEP-1).

### Acceptance criteria

- Every generated file is traceable to its source Playbook ref and digest, package profile, adapter, and output kind.
- Ownership and support status are queryable per artifact, and generated outputs never masquerade as Playbook source.

### Dependencies

- Stage 1 and the Phase 2 field-provenance records.

## Stage 3 - Backup, Uninstall, and Support Binding

### Tasks

- [x] t6: Scope backup and uninstall to Make Docs-owned generated outputs only, without orphaning empty managed directories or deleting user-authored files, inheriting the PRD 32 lifecycle rules (R-PROV-2).
- [x] t7: Record that backup/uninstall cleanliness is proven by a conformance scenario owned by the conformance design; reference that scenario rather than defining conformance here (R-PROV-2, R-SCOPE-1).
- [x] t8: Bind every support claim to the exact tuple of scenario, harness, surface, scope, output kind, model or provider, and runtime, and hold it provisional until conformance evidence exists (R-PROV-3).

### Acceptance criteria

- Uninstall removes only Make Docs-owned generated outputs and leaves user-authored files and non-empty managed directories intact.
- No public support wording for any generated-output tuple ships from this work; support statuses stay provisional pending W18 R9 conformance evidence.
- The conformance scenario dependency is referenced, not reimplemented.

### Dependencies

- Stage 2 ownership records.
- The conformance design (planned as W18 R9) for the evidence bar and the cleanliness scenario.

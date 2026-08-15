---
title: "Phase 9: Optional Agentics"
kind: "work"
status: "active"
coordinate: "W19 R1 P9"
source:
  type: "prd"
  path: "docs/prd/28-shared-agentics-installation-and-harness-exposure.md"
---

# Phase 9: Optional Agentics

## Purpose

Implement migration checkpoint 12 only for explicitly selected, purpose-traced, evidence-backed optional agentic integrations while keeping the core product complete without them.

## Overview

This phase may legitimately resolve to `not applicable` when no integration is explicitly selected or D-005 remains unresolved for the required payload delivery. It does not recreate a general plugin namespace, workflow bundle, Playbook/Protocol payload, guessed harness support, or default Skill installation.

## Source PRD Docs

- [PRD 08 — Skills Catalog and Distribution](../../prd/08-skills-catalog-and-distribution.md)
- [PRD 20 — Agent Harness Conformance and Support Claims](../../prd/20-agent-harness-conformance-and-support-claims.md)
- [PRD 25 — TypeScript Runtime, CLI, and MCP Operation Boundaries](../../prd/25-typescript-runtime-cli-mcp-operation-boundaries.md)
- [PRD 28 — Shared Agentics Installation and Harness Exposure](../../prd/28-shared-agentics-installation-and-harness-exposure.md)
- [PRD 30 — Agentic Extensibility Boundary](../../prd/30-plugin-substrate-and-workflow-bundles.md)
- [PRD 43 — Conformance Scenario Model and Execution Kits](../../prd/43-conformance-scenario-model-and-execution-kits.md)
- [PRD 44 — Conformance Lab Sessions and Evidence](../../prd/44-conformance-lab-sessions-and-evidence.md)
- [PRD 46 — Naive End-User Acceptance Testing](../../prd/46-naive-end-user-acceptance-testing.md)
- [PRD 03 — Open Questions and Risk Register](../../prd/03-open-questions-and-risk-register.md)

## Source Obligations, Scenarios, And Findings

- O-001 remains separate W18 R3 work; O-002 remains superseded.
- Open D-005 owns selected-Skill payload delivery. This phase cannot settle it through implementation or a work note.
- Canonical `NUAT-###`, conformance, and support evidence are consumed only when a selected integration changes a user-visible path or support claim; no placeholder identity is invented.
- No selection means a recorded `not applicable` checkpoint disposition, not automatic installation.

## Stage 1 - Phase-Entry PRD Question And Risk Gate

### Tasks

- [ ] t1: Verify the exact worktree, branch, HEAD, free disk, dirty-state allowlist, accepted P1–P8 closeouts, checkpoint-12 readiness, active quiescence, and implementation authorization; stop on unexpected user work or unsafe growth.
- [ ] t2: Reread every Source PRD and PRD 03 from the live worktree and record each revision or content digest.
- [ ] t3: Reevaluate at minimum Q-001, Q-007, Q-012, Q-013, Q-022, R-001, R-002, R-008, R-017, R-021, and R-022 plus Open D-005 selected-Skill payload delivery; add newly relevant items.
- [ ] t4: Record each relevant item's ID, digest, impact, classification (`blocking`, `impacted-nonblocking`, `unrelated`, `closed-regression-check`, or `new-authority-gap`), disposition, and rationale, including the exact selected-integration list or `none`.
- [ ] t5: If no integration is explicitly selected, record an explicit no-blocker/not-applicable checkpoint result and skip mutation tasks; otherwise record the no-blocker determination and finite integration/conformance/correction/review budget before unlocking t8.
- [ ] t6: Stop before implementation for D-005 when its unresolved delivery contract affects the selected integration, or for any other blocker/gap, and present an owner decision package with source anchors, affected phase and PRDs, bounded options and trade-offs, recommendation, consequences, exact PRD/register/history edits, focused validation, and a decision-only commit boundary; create no standalone decision file.
- [ ] t7: Require canonical authority updates, focused validation, a separate decision commit, and its recorded SHA before unlock; implementation cannot close D-005, questions, risks, claims, scenarios, or findings implicitly.
- [ ] t8: Record the Stage 1 result, authority digests, selected-integration or `none` disposition, D-005 status, checkpoint evidence, and implementation unlock/skip/stop result.

### Acceptance criteria

- Every live Skill, harness, conformance, support, and extensibility item has an explicit current classification.
- No integration is installed without explicit selection and evidence-backed authority.
- D-005 is resolved by canonical decision commit when required or the affected work remains stopped.
- A `none` selection yields an explicit not-applicable checkpoint without mutation.

### Dependencies

- Accepted P1–P8 core and retirement evidence.
- Current PRD authority and separate P9 implementation authorization.

### Closeout Notes

- Testing-mode decision(s): selected integrations receive their canonical conformance/UAT candidates; `none` selection records no execution.
- Phase / capability status: gate result pending.

## Stage 2 - Prove Core Completeness And Bound Selection

### Tasks

- [ ] t9: Prove resource access, lifecycle, Store, and Naive-UAT behavior is complete through direct CLI/MCP/system-workflow paths with all optional agentics absent.
- [ ] t10: Resolve the effective trusted skills/integration manifest, explicit selection, purpose IDs, source policy, provenance, supported harness candidates, install scope, entry point, and uninstall contract for each selected item.
- [ ] t11: Reject untrusted alternate manifests, implicit dependencies, default-all behavior, guessed capability metadata, and selections whose evidence or payload-delivery authority is incomplete.
- [ ] t12: For a `none` selection, record checkpoint 12 as not applicable and preserve the complete core without creating placeholder assets or claims.

### Acceptance criteria

- Core capability is complete with zero optional integrations.
- Every selected integration has trusted purpose, provenance, payload, scope, and lifecycle authority.
- Unsupported or ambiguous selections fail closed.
- `none` performs no install mutation.

### Dependencies

- Stage 1 unlock or explicit not-applicable result.
- P7 direct workflow completeness and P8 retired-surface absence.

### Closeout Notes

- Testing-mode decision(s): absent-integration core tests, manifest trust, explicit selection, and rejection fixtures.
- Phase / capability status: selection bounded; installation may be skipped or remain open.

## Stage 3 - Install Only Selected Evidence-Backed Integrations

### Tasks

- [ ] t13: Install canonical shared selected-Skill payloads and only the validated native harness symlink or managed copy-mirror exposures authorized for each selected integration.
- [ ] t14: Keep adapters and shims thin over canonical CLI/typed operations; do not embed product policy, Store logic, UAT logic, resource resolution, Playbook/Protocol behavior, or a general plugin/workflow model.
- [ ] t15: Apply project/home/external scope-aware planning, backup, update, uninstall, symlink non-following, copy-mirror drift, and custom-content preservation rules.
- [ ] t16: Publish only evidence-backed support status: qualified supported surfaces may claim support, lab-only targets remain lab-only, and absent or stale evidence yields honest unsupported/unknown status.
- [ ] t17: Bind any user-observable selected integration to canonical testing/UAT and conformance records without allowing one mode to substitute for another.

### Acceptance criteria

- Only explicit trusted selections are installed.
- Integrations remain thin and cannot become a second product authority.
- Lifecycle operations preserve custom and user-owned harness content.
- Support claims match current evidence and mode-specific gates.

### Dependencies

- Stage 2 validated non-`none` selection.
- Canonical D-005 disposition when required.

### Closeout Notes

- Testing-mode decision(s): selected payload/install/uninstall, harness exposure, conformance, support-claim, and applicable naive-UAT candidates.
- Phase / capability status: selected integrations installed or phase correctly skipped; confirmation remains open.

## Stage 4 - Validate Checkpoint 12

### Tasks

- [ ] t18: Run focused absent-core, selected-install, update/uninstall, manifest trust, symlink/copy-mirror, custom-content, CLI delegation, conformance, support-claim, applicable UAT, path, and whitespace checks within the finite budget.
- [ ] t19: Prove no Playbook/Protocol runtime, general plugin namespace, workflow bundle, duplicate business logic, unsupported claim, or implicit selection was reintroduced.
- [ ] t20: Obtain independent review of selection, D-005 compliance, core completeness, lifecycle safety, thinness, conformance, and support honesty; correct only actionable defects within budget.
- [ ] t21: Record checkpoint-12 completion or not-applicable evidence, exact selected integrations or `none`, scenario/finding/support traces, remaining nonblocking items, and the locked checkpoint-13/P10 handoff while keeping quiescence active.

### Acceptance criteria

- Focused checks pass for the exact selection disposition.
- Independent review finds no unresolved material authority, selection, lifecycle, thinness, or support-claim defect.
- Checkpoint 12 is complete or explicitly not applicable without hidden installation.
- Checkpoint 13 remains separately gated and quiescence remains active.

### Dependencies

- Stage 2 and, when applicable, Stage 3.
- Finite integration/conformance/correction/review budget.

### Closeout Notes

- Testing-mode decision(s): exact selected integration modes or `none` are recorded independently.
- Phase / capability status: P9/checkpoint 12 may close with evidence; P10/checkpoint 13 remains separately gated.

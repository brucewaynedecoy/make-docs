---
title: "Phase 9: Optional Agentics"
kind: "work"
status: "completed"
coordinate: "W19 R1 P9"
source:
  type: "prd"
  path: "docs/prd/28-shared-agentics-installation-and-harness-exposure.md"
---

# Phase 9: Optional Agentics

## Purpose

Implement migration checkpoint 12 only for explicitly selected, purpose-traced, evidence-backed optional agentic integrations while keeping the core product complete without them.

## Overview

This phase resolves to `not applicable` because the owner selected no optional integration. It does not recreate a general plugin namespace, workflow bundle, Playbook/Protocol payload, guessed harness support, or default Skill installation.

## Source PRD Docs

- [PRD 08 — Skills Catalog and Distribution](../../prd/08-skills-catalog-and-distribution.md)
- [PRD 25 — TypeScript Runtime, CLI, and MCP Operation Boundaries](../../prd/25-typescript-runtime-cli-mcp-operation-boundaries.md)
- [PRD 28 — Shared Agentics Installation and Harness Exposure](../../prd/28-shared-agentics-installation-and-harness-exposure.md)
- [PRD 30 — Agentic Extensibility Boundary](../../prd/30-plugin-substrate-and-workflow-bundles.md)
- [PRD 46 — Naive End-User Acceptance Testing](../../prd/46-naive-end-user-acceptance-testing.md)
- [PRD 50 — Proportionate Testing and Human-Centered Validation](../../prd/50-proportionate-testing-and-human-centered-validation.md)
- [PRD 03 — Open Questions and Risk Register](../../prd/03-open-questions-and-risk-register.md)

## Source Obligations, Scenarios, And Findings

- O-001 remains separate W18 R3 work; O-002 remains superseded.
- D-005 is closed by the W19 R5 first-party Skill delivery and lifecycle evidence. This phase consumes that result and does not reopen it.
- Canonical `NUAT-###`, direct installed-product, and support evidence are consumed only when a selected integration changes a user-visible path or support claim; no placeholder identity is invented.
- No selection means a recorded `not applicable` checkpoint disposition, not automatic installation.

## Stage 1 - Phase-Entry PRD Question And Risk Gate

### Tasks

- [x] t1: Verify the exact worktree, branch, HEAD, free disk, dirty-state allowlist, accepted P1–P8 closeouts, checkpoint-12 readiness, active quiescence, and implementation authorization; stop on unexpected user work or unsafe growth.
- [x] t2: Reread every Source PRD and PRD 03 from the live worktree and record each revision or content digest.
- [x] t3: Reevaluate at minimum Q-001, Q-007, Q-012, Q-013, Q-022, R-001, R-002, R-008, R-017, R-021, and R-022 plus closed D-005 selected-Skill payload delivery; add newly relevant items.
- [x] t4: Record each relevant item's ID, digest, impact, classification (`blocking`, `impacted-nonblocking`, `unrelated`, `closed-regression-check`, or `new-authority-gap`), disposition, and rationale, including the exact selected-integration list or `none`.
- [x] t5: If no integration is explicitly selected, record an explicit no-blocker/not-applicable checkpoint result and skip mutation tasks; otherwise record the no-blocker determination and finite integration, direct installed-product, correction, and review budget before unlocking t8.
- [x] t6: Confirm that closed D-005 covers the selected-Skill delivery boundary. Stop before implementation for any other blocker or gap and present an owner decision package with source anchors, affected phase and PRDs, bounded options and trade-offs, recommendation, consequences, exact PRD/register/history edits, focused validation, and a decision-only commit boundary; create no standalone decision file.
- [x] t7: Require canonical authority updates, focused validation, a separate decision commit, and its recorded SHA before unlock; implementation cannot close questions, risks, claims, scenarios, or findings implicitly.
- [x] t8: Record the Stage 1 result, authority digests, selected-integration or `none` disposition, D-005 status, checkpoint evidence, and implementation unlock/skip/stop result.

### Acceptance criteria

- Every live Skill, harness, direct installed-product, support, and extensibility item has an explicit current classification.
- No integration is installed without explicit selection and evidence-backed authority.
- D-005 is resolved by canonical decision commit when required or the affected work remains stopped.
- A `none` selection yields an explicit not-applicable checkpoint without mutation.

### Dependencies

- Accepted P1–P8 core and retirement evidence.
- Current PRD authority and separate P9 implementation authorization.

### Closeout Notes

- Testing-mode decision(s): selected integrations receive their canonical direct installed-product and UAT candidates; `none` selection records no integration execution.
- Owner preflight choice (2026-09-05): “No integrations in P9 (Recommended)”. The exact P9 selection is `none`.
- Basis: [PRD 08](../../prd/08-skills-catalog-and-distribution.md), [PRD 28](../../prd/28-shared-agentics-installation-and-harness-exposure.md), and [PRD 30](../../prd/30-plugin-substrate-and-workflow-bundles.md) permit complete core use without optional integrations. Requirement-change disposition: `none`; current product requirements already cover this choice.
- [D-005](../../prd/03-open-questions-and-risk-register.md#d-005-skills-delivery-diverges-from-earlier-bundled-payload-expectations) is closed by W19 R5. Q-001 and Q-007 do not block this `none` selection. The bundled `naive-uat` Skill remains available unchanged.
- Scope: no integration mutation or new support claim. Current core checks and the phase review pass. Checkpoint 12 is `not applicable`. P10/checkpoint 13 remained separately gated until its own reconciliation.
- Phase / capability status: Stage 1 complete with a no-blocker, not-applicable result.

## Stage 2 - Prove Core Completeness And Bound Selection

### Tasks

- [x] t9: Prove resource access, lifecycle, Store, and Naive-UAT behavior is complete through direct CLI/MCP/system-workflow paths with all optional agentics absent.
- [x] t10: Resolve the effective trusted skills/integration manifest, explicit selection, purpose IDs, source policy, provenance, supported harness candidates, install scope, entry point, and uninstall contract for each selected item.
- [x] t11: Reject untrusted alternate manifests, implicit dependencies, default-all behavior, guessed capability metadata, and selections whose evidence or payload-delivery authority is incomplete.
- [x] t12: For a `none` selection, record checkpoint 12 as not applicable and preserve the complete core without creating placeholder assets or claims.

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

- [x] t13: Install canonical shared selected-Skill payloads and only the validated native harness symlink or managed copy-mirror exposures authorized for each selected integration.
- [x] t14: Keep adapters and shims thin over canonical CLI/typed operations; do not embed product policy, Store logic, UAT logic, resource resolution, Playbook/Protocol behavior, or a general plugin/workflow model.
- [x] t15: Apply project, home, and external scope-aware planning, backup, update, uninstall, symlink non-following, copy-mirror drift, and custom-content preservation rules.
- [x] t16: Publish only evidence-backed support status: qualified supported surfaces may claim support, lab-only targets remain lab-only, and absent or stale evidence yields honest unsupported/unknown status.
- [x] t17: Bind any user-observable selected integration to canonical testing/UAT and direct installed-product records without allowing one mode to substitute for another.

### Acceptance criteria

- Only explicit trusted selections are installed.
- Integrations remain thin and cannot become a second product authority.
- Lifecycle operations preserve custom and user-owned harness content.
- Support claims match current evidence and mode-specific gates.

### Dependencies

- Stage 2 validated non-`none` selection.
- Canonical D-005 disposition when required.

### Closeout Notes

- Testing-mode decision(s): selected payload/install/uninstall, harness exposure, direct installed-product, support-claim, and applicable naive-UAT candidates.
- Phase / capability status: selected integrations installed or phase correctly skipped; confirmation remains open.

## Stage 4 - Validate Checkpoint 12

### Tasks

- [x] t18: Run focused absent-core, selected-install, update/uninstall, manifest trust, symlink/copy-mirror, custom-content, CLI delegation, direct installed-product, support-claim, applicable UAT, path, and whitespace checks within the finite budget.
- [x] t19: Prove no Playbook/Protocol runtime, general plugin namespace, workflow bundle, duplicate business logic, unsupported claim, or implicit selection was reintroduced.
- [x] t20: Obtain independent review of selection, D-005 compliance, core completeness, lifecycle safety, thinness, installed evidence, and support honesty; correct only actionable defects within budget.
- [x] t21: Record checkpoint-12 completion or not-applicable evidence, exact selected integrations or `none`, scenario/finding/support traces, remaining nonblocking items, and the locked checkpoint-13/P10 handoff while keeping quiescence active.

### Acceptance criteria

- Focused checks pass for the exact selection disposition.
- Independent review finds no unresolved material authority, selection, lifecycle, thinness, or support-claim defect.
- Checkpoint 12 is complete or explicitly not applicable without hidden installation.
- Checkpoint 13 remains separately gated and quiescence remains active.

### Dependencies

- Stage 2 and, when applicable, Stage 3.
- Finite integration, direct installed-product, correction, and review budget.

### Closeout Notes

- Testing-mode decision(s): `none` is the exact selection. Conditional install and support-claim work is not applicable.
- Authority reconciliation (2026-09-15): PRDs 20, 43, and 44 are retired. Their dynamic conformance model is not current authority. Current proof uses the typed CLI/shared core, static harness adapters, and direct installed-product evidence.
- Core proof: W19 R5 proves complete first-party Skill delivery with no private plugin layer. W19 R6 P3 proves direct CLI/MCP resource and Store behavior, static Codex and Claude Code methods, honest blocked-method status, package smoke, and no dynamic conformance assets.
- Mutation result: no optional integration was installed, updated, or removed. No placeholder asset, support claim, scenario, or finding was created.
- Checkpoint 12: `not applicable` and complete. P10/checkpoint 13 remained separately gated until its own reconciliation.
- Phase / capability status: complete. The `none` selection adds no capability claim.

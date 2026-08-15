---
title: "Phase 1: PRD Authority and Target Inventory"
kind: "work"
status: "active"
coordinate: "W19 R2 P1"
source:
  type: "plan"
  path: "docs/plans/2026-08-13-w19-r2-performance-evidence-governance/01-prd-authority-and-target-inventory.md"
---

# Phase 1: PRD Authority and Target Inventory

## Purpose

Record the completed W19 R2 P1 PRD work as durable work history. This file repairs the missing link between the accepted plan phase and the current PRD authority. It does not create an executable rerun queue.

## Overview

P1 inventoried performance-shaped claims, created PRD 48, updated the exact current PRD owners, preserved adjacent proof and runtime boundaries, and passed focused review and validation. The PRD work is completed and validated in the current worktree. Its commit and mainline integration are pending.

This is a faithful closeout record that was added after the work finished. All checked tasks describe work that was completed before this record existed. Future authority drift reopens the phase-entry gate. This record does not authorize P2 implementation.

## Source PRD Docs

- [PRD 00 — Make Docs PRD Index](../../prd/00-index.md)
- [PRD 03 — Open Questions and Risk Register](../../prd/03-open-questions-and-risk-register.md)
- [PRD 06 — Template Contracts and Generated Assets](../../prd/06-template-contracts-and-generated-assets.md)
- [PRD 10 — Packaging, Validation, and Release Reference](../../prd/10-packaging-validation-and-release-reference.md)
- [PRD 14 — Lifecycle Workflow and Coverage Passes](../../prd/14-lifecycle-workflow-and-coverage-passes.md)
- [PRD 18 — Compatibility Classification and Migration Safety](../../prd/18-compatibility-classification-and-migration-safety.md)
- [PRD 20 — Agent Harness Conformance and Support Claims](../../prd/20-agent-harness-conformance-and-support-claims.md)
- [PRD 21 — Project Tool Directory and Resource Tiers](../../prd/21-project-tool-directory-and-resource-tiers.md)
- [PRD 25 — TypeScript Runtime, CLI, MCP, and Operation Boundaries](../../prd/25-typescript-runtime-cli-mcp-operation-boundaries.md)
- [PRD 38 — Global Store and Project State](../../prd/38-global-store-and-project-state.md)
- [PRD 39 — CLI Command Model and Operation Registry](../../prd/39-cli-command-model-and-operation-registry.md)
- [PRD 43 — Conformance Scenario Model and Execution Kits](../../prd/43-conformance-scenario-model-and-execution-kits.md)
- [PRD 44 — Conformance Lab Sessions and Evidence](../../prd/44-conformance-lab-sessions-and-evidence.md)
- [PRD 45 — Deferred Obligation Governance](../../prd/45-deferred-obligation-governance.md)
- [PRD 46 — Naive End-User Acceptance Testing](../../prd/46-naive-end-user-acceptance-testing.md)
- [PRD 48 — Performance Evidence Governance](../../prd/48-performance-evidence-governance.md)

## Source Obligations, Scenarios, And Findings

- `O-###: none` — P1 created no deferred obligation.
- `NUAT-###: none` — P1 was PRD authority work and ran no naive-UAT scenario.
- `Finding: none` — the final PRD review found no remaining P0–P3 finding.
- Risks [R-029 through R-032](../../prd/03-open-questions-and-risk-register.md#r-029-unsupported-performance-targets-could-become-de-facto-product-authority) remain open implementation risks. P1 did not close them by task completion.

## Stage 1 - Phase-Entry PRD Question And Risk Gate

This stage is a faithful closeout of the gate that the coordinator and delegated PRD workers performed before and during reconciliation. It does not claim that the phase file existed at that time.

### Tasks

- [x] t1: Verified the approved worktree, branch `brucewaynedecoy/codex-v2-recovery-designs`, baseline HEAD `8dd9a6e209fed76a785fca4cceba8a12c8793d30`, dirty-state allowlist, and safe free-disk state before the PRD work.
- [x] t2: Reread current PRD 03 and the W19 R2 owner PRDs, then checked the accepted [Performance Testing Guardrails design](../../designs/2026-08-12-performance-testing-guardrails.md) and [P1 plan](../../plans/2026-08-13-w19-r2-performance-evidence-governance/01-prd-authority-and-target-inventory.md).
- [x] t3: Classified R-029, R-030, R-031, and R-032 as impacted but nonblocking for P1 PRD maintenance. Their current decisions gave P1 enough authority to write the governing requirements, while their shipment and lifecycle close conditions remain open for P2 through P5.
- [x] t4: Found no additional open, confirming, deferred, or closed-regression item that blocked the completed P1 PRD work. Recorded the no-blocker result without treating any risk as closed.
- [x] t5: Confirmed that no blocking owner decision package or decision-only commit was required for P1. The owner accepted the design and plan, approved the reconciled PRD authority, and later authorized work-backlog generation.
- [x] t6: Recorded the current PRD content digests below. Future changes to these authorities must reopen this gate and repeat the live question and risk review before affected implementation starts.

### Acceptance criteria

- The record names the live authority and risk state that governed P1.
- The no-blocker result applies only to the completed PRD work.
- R-029 through R-032 remain open until their stated close conditions are met.
- No missing decision commit SHA is invented.
- Future PRD drift reopens the gate before affected implementation.

### Dependencies

- Owner-accepted [Performance Testing Guardrails design](../../designs/2026-08-12-performance-testing-guardrails.md).
- Owner-accepted [W19 R2 plan](../../plans/2026-08-13-w19-r2-performance-evidence-governance/00-overview.md) and separate PRD-reconciliation authorization.
- W19 R1 PRD reconciliation of the shared resource, workflow, state, Persona, and naive-UAT boundaries.

### Closeout Notes

- Testing-mode decision(s): focused documentation authority review and PRD question/risk review; benchmark execution, naive UAT, accessibility review, and visual review were not applicable.
- Phase / capability status: P1 PRD work is completed and validated in the current worktree. Commit and mainline integration are pending. W19 R2 implementation remains open.
- Gate result: no P1 PRD-maintenance blocker. R-029 through R-032 stay open as implementation controls. A future change to an owning PRD or risk disposition reopens this gate.
- Worktree revision record: branch `brucewaynedecoy/codex-v2-recovery-designs`; baseline HEAD `8dd9a6e209fed76a785fca4cceba8a12c8793d30`; current PRD digests are listed below.

| PRD | SHA-256 |
| --- | --- |
| `00-index.md` | `95624b23d99e482a461a8a65e3c62c4464cdbb671c66ab5913eb4fd87f61edd0` |
| `03-open-questions-and-risk-register.md` | `830786d1d77fdf5d33abc3f6ce13d0d94ba22531b0ef02a651386b6de6d46ec5` |
| `06-template-contracts-and-generated-assets.md` | `b2df92f72c9e2dda251a7b051e66876bb8ed73638527acb67cc198e968437578` |
| `10-packaging-validation-and-release-reference.md` | `764cca82f8ab826bc9f1a318f532e71ec26edd0245a1277e04bb0488930281fe` |
| `14-lifecycle-workflow-and-coverage-passes.md` | `d3f47526bd56c084b3c418d3eb0f53553d3d50e1442c7236dcde91e1d84ecfda` |
| `18-compatibility-classification-and-migration-safety.md` | `180a3a89032f8577a7cef7f03fdb6cce9885c90e3f9cf959d4f42e868bd8a4ae` |
| `20-agent-harness-conformance-and-support-claims.md` | `00ca263941904023d23c002f05495e51fbada820634371c71586ae28cd3e9428` |
| `21-project-tool-directory-and-resource-tiers.md` | `b044071a6829b7812cad23fc6ade12ab8d703cfb7af2c224f0aae1d928442cf3` |
| `25-typescript-runtime-cli-mcp-operation-boundaries.md` | `7ae999e5221c09b5e3f40a9f60431f65784f537f602334031a1fd7ddd3e69b90` |
| `38-global-store-and-project-state.md` | `1fd77b3af764d287e8b85ee90e7c0c733da4240a161fe23f0b778a29502e94b0` |
| `39-cli-command-model-and-operation-registry.md` | `9e6267e35bb0e09e2cead9f169f558407ed5cc12c4436ecd8973ee6fabe3a155` |
| `43-conformance-scenario-model-and-execution-kits.md` | `0670a45e6cf72c3aa82d437ba2d78a5d887ec94046a8d77003e7a3a43d18e8a0` |
| `44-conformance-lab-sessions-and-evidence.md` | `966800f9f7a33c674f48d97a4187709b62b1d3b164e20ba94cff92694a3316df` |
| `45-deferred-obligation-governance.md` | `a955f547f02c7c7fd272732955a2362d1c3b202d96fe43577a228d3e11890046` |
| `46-naive-end-user-acceptance-testing.md` | `6328b038bf3abe110a97fbe30a34dd654718112376cf2f79aca8b00be847cf97` |
| `48-performance-evidence-governance.md` | `b6707ffa01dd261a84c15efa4b04825f305949b94fc6ff01a4fc49ea28e876fd` |

## Stage 2 - Inventory Targets And Set Authority Boundaries

### Tasks

- [x] t7: Ran the bounded target inventory across active PRDs for numeric targets, target-shaped language, work guardrails, evidence claims, and proof rules that could be mistaken for performance authority.
- [x] t8: Confirmed that the active PRDs contained no numeric performance target. Identified PRD 38's qualitative `quick access` wording and replaced it with neutral discovery wording.
- [x] t9: Preserved PRD 20's one-result conformance minimum and PRD 46's one-run naive-UAT minimum as separate proof rules. Neither rule became a performance sample count.
- [x] t10: Set one authority rule by target class. PRDs alone own hard product requirements. Approved plan or work profiles can own bounded non-product engineering, characterization, or experiment work. Such profiles cannot silently change product authority.
- [x] t11: Preserved characterization before threshold promotion, stable `PERF-###` identity and version lineage, finite budgets, unchanged-result reuse, affected-only reruns, diminishing-return stops, normalized outcomes, singular authorized requalification, and non-sacrificable constraints.
- [x] t12: Preserved separate applicability, fields, evidence, outcome, and gate rules for performance, conformance, lab, naive UAT, release, and support claims.

### Acceptance criteria

- Every target candidate has an explicit performance and PRD-maintenance disposition.
- No arbitrary target, sample count, statistical recipe, environment matrix, or benchmark runner became product authority.
- Product targets and plan or work guardrails have one clear owner by class.
- Characterization data cannot become a threshold without owner-approved promotion and PRD maintenance.
- Adjacent proof modes remain separate.

### Dependencies

- Stage 1 no-blocker result.
- Current active PRD set and accepted P1 plan.

### Closeout Notes

- Testing-mode decision(s): bounded documentation inventory and authority review only.
- Phase / capability status: target inventory and authority decisions are completed. PRD edits and validation are recorded in Stages 3 and 4.

## Stage 3 - Maintain Current PRD Authority

### Tasks

- [x] t13: Created [PRD 48](../../prd/48-performance-evidence-governance.md) as the coherent new authority for performance qualification, profiles, evidence, outcomes, expiry, and proof-mode boundaries.
- [x] t14: Updated [PRD 00](../../prd/00-index.md) with the new capability and exact navigation links. Added open risks R-029 through R-032 to [PRD 03](../../prd/03-open-questions-and-risk-register.md).
- [x] t15: Updated delivery and lifecycle owners [PRD 06](../../prd/06-template-contracts-and-generated-assets.md), [PRD 10](../../prd/10-packaging-validation-and-release-reference.md), [PRD 14](../../prd/14-lifecycle-workflow-and-coverage-passes.md), and [PRD 18](../../prd/18-compatibility-classification-and-migration-safety.md).
- [x] t16: Updated proof, state, and obligation owners [PRD 20](../../prd/20-agent-harness-conformance-and-support-claims.md), [PRD 38](../../prd/38-global-store-and-project-state.md), [PRD 43](../../prd/43-conformance-scenario-model-and-execution-kits.md), [PRD 44](../../prd/44-conformance-lab-sessions-and-evidence.md), [PRD 45](../../prd/45-deferred-obligation-governance.md), and [PRD 46](../../prd/46-naive-end-user-acceptance-testing.md).
- [x] t17: Preserved [PRD 21](../../prd/21-project-tool-directory-and-resource-tiers.md) as the W19 R1 resource-layout owner. Preserved [PRD 25](../../prd/25-typescript-runtime-cli-mcp-operation-boundaries.md) and [PRD 39](../../prd/39-cli-command-model-and-operation-registry.md) without W19 R2 validator-operation authority.
- [x] t18: Applied the Requirement History rule. PRD 48 is new, and the W19 R2 consumer changes are additive. No W19 R2 history entry was required. Existing W19 R1 history remained unchanged.

### Acceptance criteria

- PRD 48 owns one coherent new product capability.
- Existing owner updates are surgical and preserve unrelated authority.
- PRDs 21, 25, and 39 do not gain duplicate performance or validator authority.
- Current normative text stays in the PRD body.
- No false history or implementation claim is added.

### Dependencies

- Stage 2 authority decisions.
- Authoritative PRD-maintenance rules and exact worker file allowlists.

### Closeout Notes

- Testing-mode decision(s): delegated PRD authoring, shared-surface assembly, and independent documentation review.
- Phase / capability status: PRD authority work is completed in the worktree. Commit and integration are pending.

## Stage 4 - Validate, Review, And Close P1

### Tasks

- [x] t19: Checked PRD frontmatter, required headings, current index ownership, relative links, anchors, source paths, Requirement History decisions, and whitespace.
- [x] t20: Ran the repository PRD-authority validator as a regression check and received zero diagnostics.
- [x] t21: Ran repository path-hygiene validation and received zero errors.
- [x] t22: Completed independent review and one bounded correction in PRD 14 so the phase gate names `fail` and limits `waived` continuation without treating a waiver as success.
- [x] t23: Received owner acceptance of the reconciled W19 R2 PRD authority and later separate authorization to generate this work backlog.
- [x] t24: Linked this closeout to [P2](./02-governance-resources-and-routing.md), [P3](./03-lifecycle-evidence-compatibility-and-state.md), [P4](./04-optional-validator-operation.md), and [P5](./05-packaging-validation-and-delta-handoff.md) without authorizing those implementation phases.

### Acceptance criteria

- Focused design-contract, PRD-authority, link, path, and whitespace checks pass.
- Independent review has no remaining P0–P3 finding.
- The worktree contains the authorized PRD, design, plan, and backlog documents only.
- P1 is visible as completed PRD work in the running work history.
- Commit and mainline integration remain pending and are not reported as complete.

### Dependencies

- Stage 3 current PRD authority.
- Independent review and accepted correction disposition.
- Owner acceptance of the reconciled PRD authority.

### Closeout Notes

- Testing-mode decision(s): focused PRD contract, relative-link, anchor, path-hygiene, and whitespace validation plus independent review; no package, implementation, benchmark, or full-suite execution.
- Phase / capability status: W19 R2 P1 PRD work is completed and validated in the current worktree. This phase file was added after execution to repair the missing work-history link. Commit and mainline integration are pending. P2 through P5 remain separate work.
- Current validation evidence: PRD authority passed across 37 PRD files, 1,028 Markdown files, 19 structured files, and 668 links with zero diagnostics; path hygiene checked 82 files with zero errors; focused W19 R2 work-contract validation checked six bundle files, five phase files, 129 continuous task IDs, and 82 relative links; whitespace and final-newline checks passed.
- This phase is not an executable rerun queue. Reopen only if current authority drifts, review finds a material defect, or the owner changes the accepted requirement.

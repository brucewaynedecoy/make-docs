---
title: "Phase 6: Real Platform Package Proof and Closeout"
kind: "work"
status: "draft"
coordinate: "W22 R0 P6"
source:
  type: "prd"
  path: "docs/prd/10-packaging-validation-and-release-reference.md"
---

# Phase 6: Real Platform Package Proof and Closeout

## Purpose

Prove one release candidate on real Windows, macOS, and Linux environments. Reconcile current authority and close the recovery from installed evidence.

## Overview

P6 builds one package after P3 through P5 pass. It runs one comparable installed matrix across the three platform families. It completes the Human Experience Review, guide and dogfood reconciliation, risk closure, and final limits report.

## Human Experience Outcome

- Impact and governing promise or preserved boundary: Direct impact. Prove HX-1 through HX-6.
- Intended human outcome: A person can set up, move, update, repair, and recover a Make Docs project with the same meaning and safety result on every supported platform.
- Human-facing surface or indirect effect: Installed CLI, setup, system setup, status, verify, repair, recovery, resource reads, native harness access, JSON, and MCP.
- Implementation work: One package candidate, real-platform matrix, installed evidence, authority and guide reconciliation, Human Experience Review, and closeout.
- Evidence source or testing type selected under current authority: Automated Implementation Testing, optional Guided Progress Review, installed-package evidence, and Human Experience Review.
- Executor: Platform evidence owner runs the matrix. Validation owner assembles the review. The owner may try the final result and give optional feedback.
- Accepted obligation or deferral route: None. A missing required platform result or release-blocking defect keeps P6 open.

Authority: [Human Experience Contract](../../../.make-docs/system/contracts/human-experience-contract.md), [PRD 10](../../prd/10-packaging-validation-and-release-reference.md), [PRD 16](../../prd/16-package-runtime-and-deployment-boundaries.md), and all W22-updated owner PRDs.

## Current Testing Decisions

| Testing type | Current decision | Decision record or `not-needed-now` reason |
| --- | --- | --- |
| Automated Implementation Testing | Required; blocking | Full source, package, migration, platform, authority, link, path, and regression checks decide release-candidate fitness. |
| Performance Testing | `not-needed-now` | The package has no accepted performance target. Safety retry and interruption cases remain functional checks. |
| Guided Progress Review | Useful and non-blocking unless later authority creates a specific gate | The owner can try setup, moved checkout, Store-unavailable work, package update, and recovery on an available platform. Feedback can reopen a material claim. |
| Unassisted Goal Testing | `not-needed-now` | The current package goal is architecture parity and safety. Reassess only if a real normal-use discoverability question remains and a qualified isolated executor is available. |

Human Experience Review is separate and required. The agent inspects real installed results. Owner feedback is optional. A missing response does not block close unless later accepted authority defines a specific human gate.

## Source PRD Docs

- [02 Architecture Overview](../../prd/02-architecture-overview.md)
- [03 Open Questions and Risk Register](../../prd/03-open-questions-and-risk-register.md)
- [06 Template Contracts and Generated Assets](../../prd/06-template-contracts-and-generated-assets.md)
- [07 CLI Command Surface and Lifecycle](../../prd/07-cli-command-surface-and-lifecycle.md)
- [10 Packaging, Validation, and Release Reference](../../prd/10-packaging-validation-and-release-reference.md)
- [16 Package Runtime and Deployment Boundaries](../../prd/16-package-runtime-and-deployment-boundaries.md)
- [18 Compatibility Classification and Migration Safety](../../prd/18-compatibility-classification-and-migration-safety.md)
- [24 Project Configuration and Convention Overlay](../../prd/24-project-configuration-and-convention-overlay.md)
- [25 TypeScript Runtime, CLI, MCP, and Operation Boundaries](../../prd/25-typescript-runtime-cli-mcp-operation-boundaries.md)
- [28 Shared Agentics Installation and Harness Exposure](../../prd/28-shared-agentics-installation-and-harness-exposure.md)
- [38 Global Store and Project State](../../prd/38-global-store-and-project-state.md)
- [39 CLI Command Model and Operation Registry](../../prd/39-cli-command-model-and-operation-registry.md)
- [49 Human Experience Standard and Intent](../../prd/49-human-experience-standard-and-intent.md)
- [50 Proportionate Testing and Human-Centered Validation](../../prd/50-proportionate-testing-and-human-centered-validation.md)

## Source Obligations, Scenarios, And Findings

- P1 decision ledger, P5 symptom table, and all P2 W22 risk items.
- Accepted obligations: none unless an owner-approved later outcome was added in P2-P5.
- Activated Unassisted Goal Test scenarios: none under the current decision.

## Stage 1 - One Candidate and Real-Platform Matrix

### Tasks

- [ ] t1: Run focused tests, the full CLI suite, default validation, PRD authority validation, links, path hygiene, and `git diff --check` before packaging.
- [ ] t2: Build one package. Record the source revision, package name, version, and digest. Use that exact package in every installed case.
- [ ] t3: Install the package with the repository unavailable in isolated Windows, macOS, and Linux homes and Store roots.
- [ ] t4: Run fresh, current, old-state bridge, moved checkout, valid package update, changed native entry, Store failure, interrupted apply, stale lock, concurrent writer, projection, repeat, repair, removal, and all symptom cases.
- [ ] t5: Compare public state, safety result, next action, files, Store evidence, and native entries across platforms.
- [ ] t6: Fix bounded defects and rerun only affected cases plus required regression cases. Build a new identified package after code changes.

### Acceptance criteria

- A36: Every installed case uses the recorded package. Source checkout execution is not accepted as package proof.
- A37: Windows, macOS, and Linux pass the same required matrix on real operating systems.
- A38: Equivalent cases return the same public state, preservation result, and next safe action. Any platform-specific detail stays behind the accepted platform boundary.
- A39: Store-free reads and independent project work pass on every platform when Store access is absent, denied, unsafe, or unavailable.
- A40: Moved checkout, valid package update, interruption, restart, and recovery pass without durable low-level file identity or a second recovery engine.

### Dependencies

- P3 through P5 are complete.
- Required real operating-system runners and supported harnesses are available.

### Closeout Notes

- Four testing decisions: Automated Implementation Testing required; Performance Testing `not-needed-now`; Guided Progress Review optional after Stage 2 assembly; Unassisted Goal Testing `not-needed-now`.
- Human Experience Review: Prepare per-promise installed observations and limits.
- Evidence report: Retain package identity, environment facts, case results, and comparable platform summary.
- Phase / capability status: P6 remains active.

## Stage 2 - Authority, Human Experience, and Recovery Closeout

### Tasks

- [ ] t7: Reconcile current PRDs, risk items, public guides, help, release claims, and architecture docs with the proved candidate.
- [ ] t8: Dogfood the candidate only through the normal installed path after Stage 1 passes. Record any maintainer-only limit.
- [ ] t9: Complete the Human Experience Review for HX-1 through HX-6 with evidence, observations, conclusions, reviewer, limits, and next actions.
- [ ] t10: Prepare one to three optional normal-use steps for owner feedback. Do not make a response a gate unless later authority explicitly requires it.
- [ ] t11: Close only risk and symptom items whose exact close evidence passes. Keep other items open with a next action.
- [ ] t12: Confirm every P1 mechanism decision is implemented or has an explicit accepted obligation. Remove temporary migration authority that no longer applies.
- [ ] t13: Run final full validation and prepare the phase closeout for separate staging and commit decisions.

### Acceptance criteria

- A41: Current PRDs, risk items, guides, help, and release claims match the proved candidate and contain no stale platform or identity rule.
- A42: Every retained mechanism has a current purpose, authority class, owner, proof, and rebuild rule. Every removed mechanism has migration and regression evidence.
- A43: The Human Experience Review states the promised surface, evidence, direct observation, conclusion, reviewer, limits, and next action for HX-1 through HX-6.
- A44: The final report identifies the package, platforms, tested scope, unresolved limits, open obligations, and actions that still need separate approval.

### Dependencies

- Stage 1 installed matrix passes.
- Dogfood uses the same accepted candidate or a later candidate that reruns the full required matrix.

### Closeout Notes

- Four testing decisions: Record final Automated Implementation Testing, Performance Testing, Guided Progress Review, and Unassisted Goal Testing decisions without changing their meanings.
- Human Experience Review: Record per-promise evidence and limits. Record optional owner feedback if provided.
- Optional experience handoff: Try setup or status, move a disposable checkout, and repeat after a valid package update. Notice the state and next action before technical detail. Feedback is optional.
- Explicit human acceptance gate: None under current authority.
- Evidence report: Link A36-A44 and all required platform results.
- Phase / capability status: Close P6 only when all required evidence passes. Publication and release still need separate authority.

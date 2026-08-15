---
title: "Phase 3: Lifecycle, Evidence, Compatibility, and State"
kind: "work"
status: "active"
coordinate: "W19 R2 P3"
source:
  type: "prd"
  path: "docs/prd/48-performance-evidence-governance.md"
---

# Phase 3: Lifecycle, Evidence, Compatibility, and State

## Purpose

Connect Performance Evidence Governance to lifecycle qualification, work packets, evidence, normalized results, expiry, phase gates, compatibility, adjacent proof modes, and optional operational state without allowing any result, Store projection, or task status to redefine product or support authority.

## Overview

P3 consumes the canonical resources from P2, uses documentation fixtures rather than real benchmarks, and preserves independent correctness, naive-UAT, accessibility, visual/manual, conformance, release, and support gates. The phase permits at most two materially distinct correction attempts and two review cycles.

## Source PRD Docs

- [PRD 03 — Open Questions and Risk Register](../../prd/03-open-questions-and-risk-register.md)
- [PRD 14 — Lifecycle Workflow and Coverage Passes](../../prd/14-lifecycle-workflow-and-coverage-passes.md)
- [PRD 18 — Compatibility Classification and Migration Safety](../../prd/18-compatibility-classification-and-migration-safety.md)
- [PRD 20 — Agent Harness Conformance and Support Claims](../../prd/20-agent-harness-conformance-and-support-claims.md)
- [PRD 38 — Global Store and Project State](../../prd/38-global-store-and-project-state.md)
- [PRD 43 — Conformance Scenario Model and Execution Kits](../../prd/43-conformance-scenario-model-and-execution-kits.md)
- [PRD 44 — Conformance Lab Sessions and Evidence](../../prd/44-conformance-lab-sessions-and-evidence.md)
- [PRD 45 — Deferred Obligation Governance](../../prd/45-deferred-obligation-governance.md)
- [PRD 46 — Naive End-User Acceptance Testing](../../prd/46-naive-end-user-acceptance-testing.md)
- [PRD 48 — Performance Evidence Governance](../../prd/48-performance-evidence-governance.md)

## Source Obligations, Scenarios, And Findings

- `O-###: none` — no deferred obligation is assigned at backlog generation; a `defer-required` disposition must use a real PRD 45 record before execution.
- `NUAT-###: none` — no naive-UAT scenario is assigned; performance remains a separate non-persona coverage mode.
- `Finding: none` — no finding is assigned; a task result cannot close a later performance or adjacent-mode finding.

## Stage 1 - Phase-Entry PRD Question And Risk Gate

### Tasks

- [ ] t1: Verify the exact branch, HEAD, worktree, free disk, phase write allowlist, current dirty state, and completed P2 evidence; stop on unexpected user work or unsafe resource pressure.
- [ ] t2: Reread the current normative bodies of PRDs 14, 18, 20, 38, 43, 44, 45, 46, and 48 plus PRD 03, and record each current revision or content digest before implementation.
- [ ] t3: Reevaluate at minimum R-009, R-017, closed R-023 as a regression guard, and R-029 through R-032; reevaluate Q-018 only if this phase changes configuration ownership and Q-019 only if it changes Persona setup or configuration; use PRDs 46 and 48, not Q-019, as the authority for cross-mode non-substitution, and add newly relevant items from the live reread.
- [ ] t4: For every relevant `Open`, `Confirming`, `Deferred`, or closed regression item, record its ID, authority revision or digest, impact, classification (`blocking`, `impacted-nonblocking`, `unrelated`, `closed-regression-check`, or `new-authority-gap`), disposition, and rationale.
- [ ] t5: If no blocking item or authority gap remains, record an explicit no-blocker result and the finite phase correction/review budget before unlocking t8.
- [ ] t6: If a blocking item or authority gap exists, stop before implementation writes and present an owner decision package with the source anchor, affected phase/PRDs, bounded options and trade-offs, recommendation, consequences, exact PRD/register/history changes, validation, and decision-only commit boundary; do not create a standalone decision file.
- [ ] t7: After an owner decision, require canonical PRD/register/history updates, focused validation, a separate decision-only commit, and the recorded decision commit SHA before marking this gate unlocked.

### Acceptance criteria

- Current owning PRDs and PRD 03 were reread and revisions or digests are recorded.
- Q-018 is evaluated only if configuration ownership is affected, and Q-019 only if Persona setup or configuration is affected; cross-mode non-substitution is governed by PRDs 46 and 48 rather than Q-019.
- R-023 remains closed and is used only as a Store-authority regression check.
- The gate records either an explicit no-blocker result or a complete owner decision package.
- No implementation write occurred before unlock, and any blocking decision was validated and separately committed.
- No task completion closes a question, risk, finding, waiver, deferred obligation, or capability.

### Dependencies

- P2 accepted with canonical resources and routing available.
- Current reconciled PRDs.

### Closeout Notes

- Testing-mode decision(s): focused documentation fixtures and independent review; naive UAT, accessibility, and visual review remain `none` unless a material surface change activates them.
- Phase / capability status: `blocked` until this gate records an unlock; gate completion alone does not complete P3.

## Stage 2 - Wire Qualification, Profiles, And Finite Execution Packets

### Tasks

- [ ] t8: Add the bounded performance-candidate inventory and dual disposition to design, plan, PRD, work, implementation, coverage, and closeout touchpoints without making evidence mandatory for every change.
- [ ] t9: Require every `required-now` or `characterize-now` execution candidate to link exactly one repository-canonical, append-only `PERF-###` ID, version, source digest, target class, owner, and lineage.
- [ ] t10: Keep hard product targets solely in their owning PRDs; keep engineering guardrail, characterization, and experiment profiles in their approved finite plan/work authority and prevent execution packets from copying or redefining product targets.
- [ ] t11: Render finite execution packets that bind build, dependency/configuration identity, environment, workload, fixture, instrument, measurement/comparability protocol, non-sacrificable constraints, run/correction/review/time/compute/external-resource budgets, stops, fingerprint, reuse rule, and evidence destinations.
- [ ] t12: Require correctness and the measurement seam to be validated before optimization or blocking performance execution, and route inadequate resolution or variance to `revise` or `blocked`.
- [ ] t13: Prove with fixtures that characterization is an uncertain observed distribution and cannot become a threshold until source, comparability, variance, resolution, protected-outcome rationale, trade-offs, owner approval, and superseding lineage are established.

### Acceptance criteria

- Lifecycle artifacts link to one canonical profile authority and never copy live targets into competing records.
- Each executable packet has finite budgets, explicit stops, and a complete fingerprint/comparability contract.
- Plan/work guardrails remain explicitly non-product authority and cannot establish support claims.
- Characterization precedes threshold promotion.
- Correctness, durability, safety, security, privacy, accessibility, portability, cost, and maintainability remain non-sacrificable.

### Dependencies

- Stage 1 unlocked.
- P2 canonical resources.

### Closeout Notes

- Testing-mode decision(s): representative documentation fixtures; no real performance execution.
- Phase / capability status: execution-packet contract wired; results, gates, compatibility, and state remain open.

## Stage 3 - Normalize Results, Findings, Expiry, And Phase Gates

### Tasks

- [ ] t14: Define unique result records bound to the exact profile ID/version/digest, build, fingerprint, raw and analyzed evidence, uncertainty, exclusions, budget ledger, supported scope, owner/reviewer disposition, and one normalized `pass`, `fail`, `revise`, `blocked`, or `waived` outcome.
- [ ] t15: Preserve finding and waiver records as independent authority: task completion cannot close a finding, and `waived` is bounded risk acceptance with explicit scope and expiry rather than success.
- [ ] t16: Implement bidirectional traceability from qualification through profile, plan budget, work packet, result, finding, PRD or `O-###` disposition, phase gate, and history.
- [ ] t17: Enforce unchanged-fingerprint result reuse outside requalification, affected-only reruns after material change, remaining-budget accounting, and stop/escalation at exhaustion or diminishing return.
- [ ] t18: Encode expiry or release requalification as a separately owner- or phase-authorized event with a new finite budget and exactly one bounded qualification execution when unchanged; prohibit further unchanged repeats until another valid trigger and explicit authorization.
- [ ] t19: Make phase gates consume evidence validity, outcome, critical/major findings, reproducibility, waiver scope/expiry, deferred obligations, budget state, unchanged-check compliance, and supported scope; treat `fail`, `revise`, `blocked`, expired, or unrun required proof as non-passing.
- [ ] t20: Add fixtures for hard profile, engineering guardrail, characterization, deferred, unsupported, expired, non-comparable, blocked, waived, unchanged reuse, affected rerun, and valid versus repeated requalification cases.

### Acceptance criteria

- Result, finding, waiver, budget, and expiry records preserve exact profile and supported-scope authority.
- Outcomes use only `pass`, `fail`, `revise`, `blocked`, and `waived` with their bounded gate meanings.
- Unchanged results are reused; material changes rerun only affected checks; budgets cannot self-replenish.
- Each expiry/release event permits at most one newly budgeted unchanged-fingerprint qualification execution.
- Gates cannot infer a favorable result from missing, expired, invalid, non-comparable, waived, or adjacent-mode evidence.

### Dependencies

- Stage 2 accepted.
- PRDs 14, 45, and 48 current.

### Closeout Notes

- Testing-mode decision(s): documentation fixtures and gate-contract review only.
- Phase / capability status: result and gate semantics complete; proof-mode, compatibility, state, and closeout remain open.

## Stage 4 - Preserve Proof-Mode, Compatibility, And State Boundaries

### Tasks

- [ ] t21: Preserve independent applicability, evidence, outcomes, and gates for performance, functional correctness, architecture/owner review, naive UAT, visual/manual review, accessibility, visual regression, conformance, release, and support promotion.
- [ ] t22: Allow one physical execution to contribute to multiple modes only when every mode's authority, fields, evidence, and verdict remain explicit; prevent perceived slowness, performance pass, waiver, or Store receipt from certifying another mode.
- [ ] t23: At the first qualifying lifecycle event after adoption, inventory active current numeric thresholds, relative claims, resource budgets, absolute performance language, benchmark assets, and evidence without retroactively failing completed phases or rerunning, certifying, moving, deleting, or rewriting existing assets.
- [ ] t24: Route ambiguous or modified managed resources through PRD 18 conflict-stop and explicit disposition, and require owner authority for keeping, reclassifying, deferring, narrowing, or removing current candidates.
- [ ] t25: Keep repository knowledge canonical and any Project State or Global Store projection rebuildable and non-authoritative; add no new table, daemon, retry loop, hidden mutation, or self-authorizing budget ledger in documentation-first delivery.
- [ ] t26: Prove closed R-023 regressions: operational projection or receipt cannot override profile, target, outcome, expiry, waiver, finding, obligation, ownership, or history authority.
- [ ] t27: Prove performance outcomes cannot promote conformance, release readiness, public support, or a broader harness tuple, and apply R-021/R-022 only when this phase actually touches those claims.

### Acceptance criteria

- Cross-mode outcomes never substitute for one another.
- Compatibility is conservative, non-retroactive, conflict-stopping, and evidence-honest.
- Existing benchmark assets are neither executed nor reclassified by inference.
- Repository authority remains canonical; optional state is rebuildable and proves recording only.
- R-023 remains closed and guarded, and no performance result broadens conformance or support scope.

### Dependencies

- Stage 3 accepted.
- PRDs 18, 20, 38, 43, 44, and 46.

### Closeout Notes

- Testing-mode decision(s): cross-mode, compatibility, and Store-boundary fixtures; no real harness or benchmark session unless separately authorized by its own mode.
- Phase / capability status: integration complete; P3 validation and closeout remain open.

## Stage 5 - Validate And Close P3

### Tasks

- [ ] t28: Run focused documentation-contract, template, fixture, link, anchor, path-hygiene, PRD-authority regression, and affected tests without a platform/environment benchmark matrix.
- [ ] t29: Retry only affected failed checks after a material correction, reuse unchanged valid evidence, and stop at the declared correction/review budget or diminishing return.
- [ ] t30: Independently review the P3 diff for target copies, implicit budgets, outcome shopping, expiry loopholes, correctness trade-offs, cross-mode substitution, retroactive failure, and Store authority drift.
- [ ] t31: Record exact changed files, validations, fixture coverage, remaining questions/risks/findings/waivers/obligations, budget consumption, and phase-versus-capability status.
- [ ] t32: Hand off P4 as `blocked / not-authorized` and P5 as the next documentation-first phase unless the owner separately admits the validator.

### Acceptance criteria

- Focused validation and independent review pass within finite budgets.
- No real benchmark, arbitrary threshold, universal count, support promotion, or hidden state mutation occurred.
- Closeout distinguishes P3 task completion from open risks, findings, obligations, and W19 R2 capability status.
- P4 remains blocked absent separate owner admission; P5 can proceed with an explicit P4 disposition.

### Dependencies

- Stages 2 through 4 accepted.

### Closeout Notes

- Testing-mode decision(s): focused automated checks and independent review complete; `O-###`, `NUAT-###`, and finding remain `none` unless execution created an authority-backed reference.
- Phase / capability status: P3 may close when acceptance passes; W19 R2 remains open through P5.

---
title: "Phase 7: Naive-UAT Workflow, Persona, and Evidence"
kind: "work"
status: "active"
coordinate: "W19 R1 P7"
source:
  type: "prd"
  path: "docs/prd/46-naive-end-user-acceptance-testing.md"
---

# Phase 7: Naive-UAT Workflow, Persona, and Evidence

## Purpose

Deliver the first-party Naive-UAT system workflow, configured Persona resolution, thin CLI-delegating Skill, canonical evidence routing, findings, and phase-gate integration without weakening qualification or duplicating policy.

## Overview

This phase implements migration checkpoint 10. Every activated execution resolves exactly one eligible configured `user` or `maintainer` Persona, defaulting to canonical `user` when none is supplied. Persona identity controls audience framing and evidence location; it never substitutes for independent tester isolation, installed-product scope, public information, or anti-coaching. Canonical evidence lives only under `docs/assets/<persona-slug>/testing/**`.

P7 is paused during the W19 R1 P4 authority and router recovery. Preserve the accepted `P7-AUTHORITY` decision, the open D-005 and P7-BUDGET decisions, Persona and scenario meaning, and the six-operation meaning. After recovery, refresh the P7 baseline and re-prove the P4 dependency before preflight continues. Do not restart the completed preflight decisions, and do not authorize P7 implementation.

## Source PRD Docs

- [PRD 08 — Skills Catalog and Distribution](../../prd/08-skills-catalog-and-distribution.md)
- [PRD 14 — Lifecycle Workflow and Coverage Passes](../../prd/14-lifecycle-workflow-and-coverage-passes.md)
- [PRD 20 — Agent Harness Conformance and Support Claims](../../prd/20-agent-harness-conformance-and-support-claims.md)
- [PRD 22 — Project Documentation Asset Model](../../prd/22-project-documentation-asset-model.md)
- [PRD 25 — TypeScript Runtime, CLI, and MCP Operation Boundaries](../../prd/25-typescript-runtime-cli-mcp-operation-boundaries.md)
- [PRD 28 — Shared Agentics Installation and Harness Exposure](../../prd/28-shared-agentics-installation-and-harness-exposure.md)
- [PRD 38 — Global Store and Project State](../../prd/38-global-store-and-project-state.md)
- [PRD 43 — Conformance Scenario Model and Execution Kits](../../prd/43-conformance-scenario-model-and-execution-kits.md)
- [PRD 44 — Conformance Lab Sessions and Evidence](../../prd/44-conformance-lab-sessions-and-evidence.md)
- [PRD 45 — Deferred Obligation Governance](../../prd/45-deferred-obligation-governance.md)
- [PRD 46 — Naive End-User Acceptance Testing](../../prd/46-naive-end-user-acceptance-testing.md)
- [PRD 47 — Persona Model](../../prd/47-persona-model.md)
- [PRD 03 — Open Questions and Risk Register](../../prd/03-open-questions-and-risk-register.md)

## Source Obligations, Scenarios, And Findings

- O-001 remains separate W18 R3 surface-neutral adversarial-review work and is not closed here; O-002 remains superseded.
- Existing canonical `NUAT-###` scenarios and findings are consumed when applicable. This backlog never invents a placeholder ID.
- If a user-observable slice lacks canonical scenario authority, Stage 1 records a new-authority gap and stops before execution.
- Task completion cannot close a scenario, finding, waiver, deferred obligation, phase gate, or capability status.

## Stage 1 - Phase-Entry PRD Question And Risk Gate

### Tasks

- [ ] t1: Verify the exact worktree, branch, HEAD, free disk, dirty-state allowlist, accepted P1–P6 closeouts, checkpoint-10 readiness, active quiescence, and implementation authorization; stop on unexpected user work or unsafe growth.
- [ ] t2: Reread every Source PRD and PRD 03 from the live worktree and record each revision or content digest.
- [ ] t3: Reevaluate at minimum Q-001, Q-007, D-005, R-001, R-002, R-008, R-017, R-021, and R-022; classify Q-019 and Q-022 as nonblocking unless interactive setup UX or an agentics-production pipeline enters scope, and add newly relevant items.
- [ ] t4: Record each relevant item's ID or bounded gap label, authority digest, impact, classification (`blocking`, `impacted-nonblocking`, `unrelated`, `closed-regression-check`, or `new-authority-gap`), disposition, and rationale.
- [ ] t5: For D-005 specifically, if current PRD authority fully specifies the P7 thin selected-Skill payload delivery, record `impacted-nonblocking` with exact authority anchors; otherwise classify it as blocking or a new-authority gap and follow t6-t7. Record an explicit no-blocker determination, canonical scenario references or complete `none` routes, and finite execution/correction/review budget before unlocking t8 when no blocker or gap remains.
- [ ] t6: Stop before implementation for any blocker, missing scenario authority, or authority gap and present an owner decision package with source anchors, affected phase and PRDs, bounded options and trade-offs, recommendation, consequences, exact PRD/register/history edits, focused validation, and a decision-only commit boundary; create no standalone decision file.
- [ ] t7: Require canonical PRD/register/history updates, focused validation, a separate decision commit, and its recorded SHA before unlock; task completion never closes governed records implicitly.
- [ ] t8: Record the Stage 1 result, authority digests, checkpoint evidence, applicable scenario/obligation/finding trace, and implementation unlock or stop result.

### Acceptance criteria

- Every live UAT, Persona, coverage, evidence, harness, and gate item has a current classification.
- Missing scenario authority stops before execution rather than minting a backlog-local ID.
- Q-019/Q-022 remain bounded unless their triggering scope actually appears.
- Stage 4 remains locked until D-005 has an explicit impact disposition: `impacted-nonblocking` with exact anchors when current authority is sufficient, or a canonically resolved decision package, validated PRD/register/history update, separate decision-only commit, and recorded SHA when it is not.
- Checkpoint 10 remains locked until all blockers are canonically resolved.

### Dependencies

- Accepted P1 resources, P2/P3 operations, P4 lifecycle, P5 migration safety, and P6 Store projection.
- Current PRD authority and separate P7 implementation authorization.

### Closeout Notes

- Testing-mode decision(s): activated naive UAT, separate automated/conformance/accessibility/performance modes, and complete `none` routing are recorded distinctly.
- Phase / capability status: gate result pending.

## Stage 2 - Install The System Workflow And Typed Access Paths

### Tasks

- [ ] t9: Install the P1-authored Naive-UAT contracts, prompts, references, and applicable templates as provider-backed system workflow resources available without local projection.
- [ ] t10: Compose qualification, facilitator framing, Persona selection, scenario binding, execution, evidence, finding, disposition, and gate behavior from those governing resources without embedding policy in routers or transports.
- [ ] t11: Activate the P3-pending `uat.scenario.validate`, `uat.persona.resolve`, `uat.target.validate`, `uat.evidence-reference.validate`, `uat.finding.validate`, and `uat.result.validate` handlers. Preserve their six `make-docs run uat` CLI paths and derived MCP tools. Connect system-workflow entry paths to the same operations and normalized outcomes. Reuse the P6 lifecycle operations instead of defining UAT lifecycle duplicates.
- [ ] t12: Preserve the documentation-first sequence: canonical workflow resources and schemas must validate before runtime automation or optional Skill delivery is enabled.

### Acceptance criteria

- The system workflow is usable through provider resources without a local snapshot or Skill.
- CLI, MCP, and workflow paths share one operation model.
- Governing policy has one resource authority and is not duplicated in adapters.
- Runtime automation cannot precede validated documentation authority.
- P7 clears `pendingLineage: W19 R1 P7` only after all six handlers, CLI projections, MCP tools, and focused tests pass.

### Dependencies

- Stage 1 unlock.
- P1 resource bundle and P3 access-path contracts.

### Closeout Notes

- Testing-mode decision(s): resource composition, access-path parity, and policy-duplication checks.
- Phase / capability status: core workflow available; Persona/evidence behavior remains open.

## Stage 3 - Resolve Persona And Canonical Evidence Routing

### Tasks

- [ ] t13: Resolve exactly one configured Persona for every activated run, accepting only eligible `user` or `maintainer` primitives, failing closed on explicit unknown/ineligible values, and defaulting to canonical `user` only when no Persona is supplied.
- [ ] t14: Keep selected Persona identity distinct from `target_user` and tester qualification; a `maintainer` Persona changes framing and evidence slug but grants no private implementation knowledge.
- [ ] t15: Derive and validate the canonical Persona slug, record explicit/default resolution provenance, and route packets, executions, outcomes, findings, dispositions, and evidence only under `docs/assets/<persona-slug>/testing/**`.
- [ ] t16: Reject UAT evidence destinations under `.make-docs/archive/**`, `docs/artifacts/**`, a generic non-Persona testing directory, or any path that escapes the selected Persona scope.
- [ ] t17: Preserve project ownership and conflict review for existing Persona testing content; migration may move only proven material and never treats directory placement as scenario or Persona authority.

### Acceptance criteria

- No-input resolution is canonical `user`; explicit eligible `maintainer` is honored; invalid explicit input fails closed.
- Persona identity, target user, and tester qualification remain separate.
- All canonical UAT material is Persona-scoped under the required testing path.
- Prohibited destinations and ambiguous existing content stop before mutation.

### Dependencies

- Stage 2 workflow operations.
- PRD 47 configured Persona authority and P5 ownership safeguards.

### Closeout Notes

- Testing-mode decision(s): user default, maintainer selection, invalid Persona, slug, path escape, prohibited destination, and existing-content fixtures.
- Phase / capability status: Persona/evidence routing complete; optional Skill remains open.

## Stage 4 - Deliver The Thin Optional Naive-UAT Skill

### Tasks

- [ ] t18: Add the first-party Naive-UAT Skill to upstream shipped Skill authority as an explicit optional selection, never a bare-install or automatic dependency.
- [ ] t19: Limit the Skill to thin CLI-delegating shims for discovery and invocation; keep qualification, Persona, scenario, evidence, finding, and gate business logic in governing resources and typed operations.
- [ ] t20: Use the canonical shared selected-Skill payload and validated harness-native exposure contract without creating Playbook-generated content, a plugin namespace, workflow bundle, or harness-adapter registry.
- [ ] t21: Prove uninstall, update, backup, and copy-mirror/symlink behavior preserves user and custom harness content and removes only proven owned Skill material.

### Acceptance criteria

- The Skill is optional, explicitly selected, thin, and CLI-delegating.
- The Skill contains no duplicated UAT policy or business logic.
- Core workflow behavior remains complete without the Skill.
- Skill lifecycle behavior follows existing evidence-backed ownership contracts.

### Dependencies

- Stages 2 and 3.
- P4 selected-Skill lifecycle contracts; P7 consumes its Stage 1 D-005 disposition for this exact Naive-UAT Skill payload, while any broader selected-Skill payload integration remains separately gated in P9.

### Closeout Notes

- Testing-mode decision(s): explicit-selection, absent-Skill core completeness, shim line/scope, delegation, install/update/uninstall, and harness exposure checks.
- Phase / capability status: optional Skill complete; activated execution semantics remain open.

## Stage 5 - Preserve Qualification, Scenario, Finding, And Gate Semantics

### Tasks

- [ ] t22: Enforce independent tester qualification, separate context, no repository/private memory, installed-product scope, public-information limits, anti-coaching, and isolation evidence before an activated run begins.
- [ ] t23: Bind each activated execution to a canonical versioned `NUAT-###` scenario, installed-build identity, target user/goal, supported scope, starting state, public resources, prohibited context, tester prompt, hidden operator outcomes, setup/teardown, evidence requirements, severity rules, and finding route.
- [ ] t24: Preserve separate coverage candidates and the `create`, `update-existing`, `link-only`, and `none` verdict spine; complete `none` routes must carry future triggers/obligations rather than disappearing.
- [ ] t25: Record run, observation, outcome, evidence, severity, reproducibility, finding, disposition, waiver, and phase-gate linkage without allowing automated tests, conformance, performance, knowledgeable walkthroughs, or owner review to substitute.
- [ ] t26: Preserve the exact `pass`, `fail`, `revise`, `blocked`, and valid `none` gate semantics: pass is bounded to the executed scenario/scope; fail or revise leaves acceptance unsatisfied; blocked proves no valid attempt; none applies only to the current internal/headless classification; an obligation, waiver, expiration, timebox, or missing evidence cannot change the run outcome or silently satisfy the gate; preserve one-valid-run sufficiency for its exact scenario/scope and affected-only reruns.
- [ ] t27: Project only bounded non-authoritative run/evidence references and receipts to the Store while keeping scenarios, findings, evidence, and gate authority in the repository.

### Acceptance criteria

- Persona selection never weakens qualification, installed-product, public-information, isolation, or anti-coaching rules.
- Every activated run has canonical scenario and build/scope traceability.
- Evidence, findings, and outcomes preserve current PRD semantics and canonical locations.
- One valid run is sufficient only for its exact bounded scenario/scope; reruns remain affected-only and finite.
- Store projection cannot replace repository authority.

### Dependencies

- Stages 2 through 4.
- P6 general run/evidence reference interfaces.

### Closeout Notes

- Testing-mode decision(s): true naive UAT plus separate automated, conformance, performance, accessibility, and manual-review verdicts.
- Phase / capability status: end-to-end semantics complete; confirmation remains open.

## Stage 6 - Validate Checkpoint 10

### Tasks

- [ ] t28: Run focused resource, CLI/MCP/workflow/Skill parity, Persona default/selection, qualification, anti-coaching, installed-product, scenario, evidence-path, finding, gate, Store-projection, migration, and whitespace tests within the finite budget.
- [ ] t29: Prove no UAT evidence is written under `.make-docs/archive/**` or `docs/artifacts/**`, no policy is duplicated in the Skill, and no Playbook/Protocol/plugin business surface is reintroduced.
- [ ] t30: Obtain independent review of the paired PRD 46/47 implementation and preservation of qualification, scenario, evidence, finding, and gate semantics; correct only actionable defects within budget.
- [ ] t31: Record checkpoint-10 evidence, exact scenario/obligation/finding traces or `none` dispositions, remaining nonblocking items, and the locked checkpoint-11/P8 handoff while keeping quiescence active.

### Acceptance criteria

- Focused end-to-end and failure-path tests pass.
- Independent review finds no unresolved material Persona, qualification, policy-duplication, evidence, finding, or gate defect.
- Checkpoint 10 closes without invented scenario IDs or prohibited evidence paths.
- Checkpoint 11 remains separately gated and quiescence remains active.
- All six UAT operation identifiers are active without a transport or identifier change. UAT lifecycle actions use the P6 lifecycle identifiers.

### Dependencies

- Stages 2 through 5 complete.
- Finite execution/correction/review budget.

### Closeout Notes

- Testing-mode decision(s): activated naive UAT and every separate coverage mode retain independent outcomes.
- Phase / capability status: P7/checkpoint 10 may close with evidence; P8/checkpoint 11 remains separately gated.

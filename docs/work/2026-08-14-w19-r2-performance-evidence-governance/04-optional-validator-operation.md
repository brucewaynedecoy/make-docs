---
title: "Phase 4: Dual-Path Performance Evidence Validation"
kind: "work"
status: "active"
coordinate: "W19 R2 P4"
source:
  type: "prd"
  path: "docs/prd/48-performance-evidence-governance.md"
---

# Phase 4: Dual-Path Performance Evidence Validation

> **Phase status: DIRECTION ADMITTED / IMPLEMENTATION NOT AUTHORIZED.** Do not begin validator code, tests, registry activation, CLI/MCP implementation, resource changes, or package work until Stage 1 records the separate decision commit SHA and the owner gives separate implementation authority.

## Purpose

Define the executable queue for the owner-admitted dual-path Performance Evidence validator. One read-only deterministic TypeScript core projects through CLI and MCP. One canonical agent method supports CLI-absent projects and judgment-only review. This authority update does not authorize implementation.

## Overview

The deterministic operation may report only admitted structural and traceability facts. The agent method may review mapped structure and traceability and handle only catalog-marked judgment questions. Neither method may run benchmarks, choose targets, decide product authority, approve waivers, fulfill obligations, promote support, rewrite files, renew budgets, or loop on results.

P4 is now required before P5. The phase permits at most two materially distinct correction attempts and two review cycles after implementation authority. It consumes current PRD 49 and PRD 50 review and testing boundaries without adding a human-response gate.

## Source PRD Docs

- [PRD 03 — Open Questions and Risk Register](../../prd/03-open-questions-and-risk-register.md)
- [PRD 25 — TypeScript Runtime, CLI, MCP, and Operation Boundaries](../../prd/25-typescript-runtime-cli-mcp-operation-boundaries.md)
- [PRD 39 — CLI Command Model and Operation Registry](../../prd/39-cli-command-model-and-operation-registry.md)
- [PRD 48 — Performance Evidence Governance](../../prd/48-performance-evidence-governance.md)
- [PRD 49 — Human Experience Standard and Intent](../../prd/49-human-experience-standard-and-intent.md)
- [PRD 50 — Proportionate Testing and Human-Centered Validation](../../prd/50-proportionate-testing-and-human-centered-validation.md)

## Source Obligations, Scenarios, And Findings

- `O-###: none` — no deferred obligation is assigned at backlog generation.
- `NUAT-###: none` — no Unassisted Goal Test is assigned to a structural validator.
- `Finding: none` — no finding is assigned; validator output cannot close a finding by itself.

## Stage 1 - Phase-Entry PRD Question And Risk Gate

### Tasks

- [x] t1: Verify the exact branch, HEAD, worktree, free disk, dirty-state allowlist, and P2/P3 closeout. Entry used branch `make-docs-v2`, clean HEAD `a4a84e1f`, 123 GB free disk, P2 commit `f79ec885`, and P3 commit `b840b746`. No implementation write occurred.
- [x] t2: Reread current PRDs 25, 39, 48, and 03 plus the deterministic/agentic twin guide. Pre-edit SHA-256 digests were PRD 25 `038b8e86eb260220c264d297749f02cb1ddfe790c7686ac82488bbc644407174`, PRD 39 `a5d4918b6fcba87424a62cae01df37578b8e2474d85bd2b693dd51d319b9ca67`, PRD 48 `8ff466996e1da56714dbdc910e3a4e95933ca1fced29a8af8bad5c52aab32125`, PRD 03 `575823ba6ef617e5b1b3fc20417c82f30d83ae8630fbf270a7a9abdd83da10e8`, and the guide `32e58a23f01123f8a0332abf83eaf70870f7fa2063abbe242fdc7144f026bdbd`.
- [x] t3: Reevaluate the hard validator-admission question and R-025, R-029 through R-032, and R-034. Add R-035 for deterministic/agent drift, repeated cost, and proof substitution.
- [x] t4: Classify R-025, R-029 through R-032, R-034, and R-035 as `impacted-nonblocking`. The decision-only edits reconcile phase links, prevent target promotion, preserve finite budgets and repository authority, reject stale proof, keep proportional review, and add twin-parity controls.
- [x] t5: Record the owner's 2026-09-17 admission of the dual-path P4 direction. Keep implementation blocked until the authority commit and separate implementation authority exist.
- [x] t6: Reconcile PRDs 03, 25, 39, and 48 plus plan, work, P5, and history surfaces. Do not create a standalone decision file.
- [ ] t7: Validate the authority changes, obtain separate staging and commit authority, create the decision-only commit, record its SHA here, and obtain separate P4 implementation authority. Then record the no-blocker/no-authority-gap result and unlock t8 with at most two materially distinct correction attempts and two review cycles.

### Acceptance criteria

- P4 implementation remains blocked until explicit owner admission and separately committed current PRD authority both exist. Owner admission is complete.
- Current PRDs 25, 39, 48, and PRD 03 were reread and revisions or digests are recorded.
- R-025, R-029 through R-032, R-034, and R-035 have explicit phase classifications and rationales.
- After all admission items are classified and resolved, the phase-entry record states an explicit no-blocker/no-authority-gap result and the finite correction/review budget before t8 unlocks.
- No validator implementation, test, registry, CLI, MCP, or package write occurred before unlock.
- The owner decision is documented in canonical PRDs, the risk register, requirement history, plan, and work records. Validation, the separate commit, and its recorded SHA remain open.
- No standalone decision file exists, and task completion cannot close a risk, finding, obligation, or capability.

### Dependencies

- P2 and P3 accepted.
- Owner admission decision: complete on 2026-09-17.
- Separately reconciled, validated, and committed PRDs 03, 25, 39, and 48: authority edits in progress; commit pending.

### Closeout Notes

- Testing-mode decision(s): decision-only PRD and documentation validation applies now. Automated Implementation Testing remains locked until implementation authority. Performance Testing, Guided Progress Review, and Unassisted Goal Testing are `not-needed-now`. No Human Experience handoff is invented for an unimplemented surface.
- Human Experience Review: the promise is that a maintainer can tell what the owner admitted, what remains blocked, and what action comes next. Evidence is the P4 plan authority gate, the active backlog admission record and phase map, this Stage 1 record, and the P5 dependency. The documents state that the direction is admitted, implementation is not authorized, validation and a separate decision commit come next, and P5 waits for accepted P4. Conclusion: `satisfied` for the decision-only maintainer path. Limit: no CLI, MCP, or installed agent surface exists yet, so this review supports no implementation-use claim. Next action: finish focused validation and stop for separate staging and commit authority.
- Phase / capability status: direction admitted; decision-only authority changes active; implementation not authorized; t8 locked until t7 completes.

## Stage 2 - Implement The Rule Catalog, Deterministic Core, And Agent Method

### Tasks

- [ ] t8: Use jcodemunch to name the exact operation, registry, CLI, MCP, resource, catalog, fixture, and package modules. Record supported document roots, access metadata, failure behavior, and one shared structured result before code changes.
- [ ] t9: Implement one stable rule catalog. Each rule records its stable ID, fact-or-decision class, deterministic support state, agent instruction location, judgment requirement, diagnostic code, focused fixtures or tests, and parity mapping or explicit one-sided reason.
- [ ] t10: Implement one read-only TypeScript core that inventories candidate language and validates only admitted structural facts: `PERF-###` identity and version, required fields, links, class-based owner and location, approval, expiry, finite budget and stops, traceability, evidence references, stricter work criteria, and declared fingerprint equality.
- [ ] t11: Emit stable diagnostic codes, complete structured results, reasons, remediation text, catalog identity, and honest proof state for missing, contradictory, unsupported, unreadable, unsafe, or escaping targets. Fail closed before mutation.
- [ ] t12: Add the canonical agent method to the upstream Performance Evidence Governance contract and its explanatory reference. It must work from repository authority when the CLI is absent, handle catalog-marked judgment questions, and report evidence, observation, conclusion, limit, and next action without claiming the deterministic operation ran.
- [ ] t13: Enforce non-capabilities for both methods. They cannot decide applicability, maturity, target/statistic/environment value, comparability judgment, user impact, severity, trade-offs, waiver approval, obligation fulfillment, supported scope, requirement change, or support promotion. They execute no benchmark, rewrite no file, choose no remediation, renew no budget, and loop on no result.

### Acceptance criteria

- The two methods match the exact owner-admitted PRDs 25, 39, and 48 contract and no broader scope.
- The rule catalog maps every rule or records an explicit one-sided reason.
- One TypeScript core owns parsing, validation, and the complete structured result.
- Canonical installed instructions own the agent method and preserve repository authority.
- Unsafe or ambiguous inputs fail closed with stable diagnostics before mutation.
- Judgment boundaries are enforced as tested non-capabilities.
- Fingerprint reporting cannot authorize an execution or retry.
- No method certifies the other method or promotes its proof state into a performance outcome.
- No benchmark framework, universal profile library, arbitrary target, Store table, daemon, retry service, or self-replenishing budget is created.

### Dependencies

- Stage 1 unlocked with decision commit SHA recorded.

### Closeout Notes

- Testing-mode decision(s): focused Automated Implementation Testing for structural facts, catalog mapping, agent instructions, proof-state honesty, and non-capabilities; no benchmark execution.
- Phase / capability status: catalog, core, and agent method implemented; projections, package delivery, and parity remain open.

## Stage 3 - Project, Package, And Prove Both Validation Paths

### Tasks

- [ ] t14: Register `performance.evidence.validate` with exact read-only metadata, inputs, outputs, project access, pending-lineage activation, and failure modes.
- [ ] t15: Derive human CLI rendering and MCP tool output from the same complete result schema with no separate validation or business logic. Preserve typed failed, blocked, and refused statuses without a favorable proof state. Preserve `validator-passed`, `agent-reviewed`, and `combined` only as earned evidence-path states.
- [ ] t16: Rebuild generated package resources from the upstream template. Prove that the packed and disposable installed project contain the canonical agent method and rule-catalog anchors without project-specific profiles, results, findings, waivers, obligations, or evidence.
- [ ] t17: Add bounded fixtures for each target class, invalid or duplicate identity, wrong owner, unsupported stricter work criterion, expired evidence, unchanged fingerprint, valid single-event requalification declaration, prohibited repeat, broken evidence link, unsafe target root, all five outcomes, judgment-only rules, explicit one-sided rules, and absent CLI use.
- [ ] t18: Prove CLI/MCP result parity, complete diagnostics, read-only behavior, fail-closed path handling, installed agent fallback, twin-change review, explicit one-sided reasons, honest proof states, and absence of output-triggered retries. Prove neither method can admit itself, update PRDs, approve a waiver, close an obligation or finding, execute a profile, promote a result, or change support status.

### Acceptance criteria

- CLI and MCP project one operation core and preserve complete diagnostics.
- Packed installed resources contain the canonical agent method and its rule mappings.
- Registry metadata and permissions match the admitted read-only contract.
- Fixtures cover positive, negative, unsafe-path, expiry, rerun, outcome, proof-state, one-sided, absent-CLI, and judgment-boundary cases.
- No adapter, CLI renderer, or MCP tool contains separate business policy.
- Neither method can mutate authority or execution state, certify the other, or substitute for adjacent proof.

### Dependencies

- Stage 2 accepted.
- Admitted CLI/MCP scope in the decision commit.

### Closeout Notes

- Testing-mode decision(s): focused operation, registry, CLI/MCP, catalog, installed-resource, router, proof-state, twin-change, and unsafe-path tests.
- Phase / capability status: both paths and projections complete; final review and closeout remain open.

## Stage 4 - Validate And Close Or Reblock P4

### Tasks

- [ ] t19: Run only the focused operation, registry, catalog, type/build, fixture, CLI/MCP, installed-agent, proof-state, twin-change, router, path-hygiene, link, package, and affected tests required by the admitted surface.
- [ ] t20: Retry only affected failed checks after a material correction, reuse unchanged valid results, and stop at the finite correction/review budget or diminishing return.
- [ ] t21: Independently review the exact diff for scope creep, judgment automation, mutation, benchmark execution, incomplete diagnostics, rule drift, CLI/MCP difference, missing installed fallback, false cross-certification, hidden retry, and target-authority promotion.
- [ ] t22: Record exact changed files, decision commit SHA, validation evidence, remaining risks, findings, obligations, correction and review budget, and one disposition: `validated dual-path operation`, `blocked`, or `deferred`.

### Acceptance criteria

- Focused tests and independent review pass within the admitted and finite scope.
- The deterministic operation remains read-only, complete, and non-judgmental. The agent method stays within the catalog-marked judgment boundary.
- The rule catalog, CLI/MCP result, installed agent method, and proof states remain consistent without cross-certification.
- No benchmark was run and no product target, waiver, obligation, result, or support claim changed.
- Closeout preserves open risks and distinguishes P4 task status from W19 R2 capability status.
- Any unresolved authority or safety issue reblocks the phase rather than broadening scope.

### Dependencies

- Stages 2 and 3 accepted.

### Closeout Notes

- Testing-mode decision(s): focused Automated Implementation Testing and agent Human Experience Review apply only after admission and implementation. Performance Testing, Guided Progress Review, and Unassisted Goal Testing remain `not-needed-now` unless a current decision activates them. `O-###`, `NUAT-###`, and finding remain `none` unless authority-backed records are created separately.
- Phase / capability status: report `validated` only for the exact admitted dual-path capability; otherwise remain `blocked` or `deferred`.

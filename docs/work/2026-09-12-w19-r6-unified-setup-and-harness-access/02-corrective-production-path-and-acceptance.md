---
title: "Phase 2: Corrective Production Path and Acceptance"
kind: "work"
status: "superseded"
coordinate: "W19 R6 P2"
source:
  type: "design"
  path: "../../designs/2026-09-14-static-harness-adapters-and-conformance-retirement.md"
---

# Phase 2: Corrective Production Path and Acceptance

P3 supersedes this backlog. Completed boxes record work that occurred under the former P2 authority. They do not prove current product acceptance. Do not resume the open P2 tasks. Use the current P3 design, plan, work record, and active PRDs for all new decisions.

## Purpose

Complete the W19 R6 production path and prove the installed result. This phase starts from the P1 foundation. It does not treat P1 component tests as feature acceptance.

## Overview

Stage 1 reconciles authority. Stage 2 connects the production CLI, project config, native methods, and support registry. Stage 3 runs real disposable harness sessions and Human Experience acceptance. The stages run in this order.

## Human Experience Outcome

- Impact and governing promise: Direct. A person can select a harness, choose a safe working method, review exact computer and project changes, and finish setup without a repeated Store-access failure.
- Intended human outcome: The person sees honest support state, completes an available method, or gets one useful action that can change the blocked state.
- Human-facing surface: Interactive setup, `setup system`, dry-run and non-interactive setup, native Codex and Claude Code configuration, project config, and final results.
- Implementation work: Central support loading, seven-part tuple cleanup, lab bootstrap, exact caller identity, complete setup orchestration, config writing, rule safety, repeat state, and installed proof.
- Evidence source or testing type: Automated Implementation Testing, Guided Progress Review, real-harness conformance, and Human Experience Review.
- Executor: Implementation agents run automated and lab proof in disposable homes. The owner or maintainer reviews the installed terminal experience.
- Accepted obligation or deferral route: None. A missing method result blocks that method and the W19 R6 close gate.

## Current Testing Decisions

| Testing type | Current decision | Decision record or reason |
| --- | --- | --- |
| Automated Implementation Testing | selected | Production-path, schema, config, safety, package, and repeat behavior need exact assertions. |
| Performance Testing | not-needed-now | P2 adds no new speed claim. The W19 R3 shared Store session tests remain regression coverage. |
| Guided Progress Review | selected | The installed screen order, explanations, state, and blocker actions need review during completion. |
| Unassisted Goal Testing | not-needed-now | Exact installed review and fresh real-harness sessions can close the current decisions without a separate naive-user claim. |

Human Experience Review is a separate required acceptance lens.

## Source PRD Docs

- [07 CLI Command Surface and Lifecycle](../../prd/07-cli-command-surface-and-lifecycle.md)
- [10 Packaging, Validation, and Release Reference](../../prd/10-packaging-validation-and-release-reference.md)
- [16 Package Runtime and Deployment Boundaries](../../prd/16-package-runtime-and-deployment-boundaries.md)
- [24 Project Configuration and Convention Overlay](../../prd/24-project-configuration-and-convention-overlay.md)
- [25 TypeScript Runtime, CLI, MCP, and Operation Boundaries](../../prd/25-typescript-runtime-cli-mcp-operation-boundaries.md)
- [28 Shared Agentics Installation and Harness Exposure](../../prd/28-shared-agentics-installation-and-harness-exposure.md)
- [39 CLI Command Model and Operation Registry](../../prd/39-cli-command-model-and-operation-registry.md)
- [50 Proportionate Testing and Human-Centered Validation](../../prd/50-proportionate-testing-and-human-centered-validation.md)
- [D-033 W19 R6 Setup Uses Retired Dynamic Conformance Authority](../../prd/03-open-questions-and-risk-register.md#d-033-w19-r6-setup-uses-retired-dynamic-conformance-authority)

## Source Obligations, Scenarios, And Findings

- Obligations: none.
- Unassisted Goal Testing scenarios: `not-needed-now`.
- Finding: D-033 is open and blocks W19 R6 release readiness.
- P1 evidence: [evidence.md](evidence.md) records useful component checks and the missing production proof.

## Promise Trace and Close Evidence

| Promise | PRD requirement | P2 task | Production test | Real harness result | Human Experience observation | Current status | Blocker action |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Explain computer, project, and Store effects before approval. | PRD 07 R-SETUP-CLI-7 through 10; PRD 39 R-SETUP-9 through 12 | t12, t14, t23 | Interactive order, dry-run, JSON, and installed package checks pass | [Claude Code MCP](../../../conformance/results/claude-code/2026-09-14-mcp-store-operations-001.json) and unavailable-method records | Reviewer identifies each scope, effect, access need, and next action | Automated pass; Human Experience Review open | Complete owner or maintainer review. |
| Complete missing system setup inside project setup. | PRD 07 R-SETUP-CLI-7 and 9; PRD 39 R-SETUP-11 | t11, t12, t13, t24 | Shared machine and project setup and failure-recovery tests pass | Claude Code MCP passed; Codex MCP is blocked | Reviewer completes setup without leaving the project flow | Automated pass; installed review open | Complete Codex proof and installed review. |
| Keep resource reads Store-free. | PRD 25 R-ACCESS-2; PRD 39 R-SETUP-8 | t16, t25 | Source and packed tests cover absent, locked, unreadable, and unsafe Store | [Claude Code direct CLI passed](../../../conformance/results/claude-code/2026-09-14-direct-resource-read-001.json); Codex is blocked | Reviewer sees that no rule, MCP server, extension, or Store access is required | Partial real-harness proof | Run the Codex case from a logged-in disposable home. |
| Use all four document families without a fresh choice and preserve partial projects. | PRD 07 R-SETUP-CLI-1; PRD 39 R-SETUP-1 | t12, t17, t23 | Fresh, partial, current, and repeat setup tests pass | Claude Code sessions preserved project content | Reviewer sees no document-type question and no silent partial expansion | Automated pass; Human Experience Review open | Complete owner or maintainer review. |
| Show only exact proved native methods. | PRD 20 R-TUPLE and R-REG; PRD 28 R-HARNESS-8 through 10; PRDs 43 and 44 | t5 through t10, t18 through t22 | Registry loader, tuple, result, identity, and package checks pass | Two Claude Code tuples passed. Four other tuples stay provisional. | Reviewer can tell supported, unavailable, and why | Material production-selection gap | Settle an exact runtime-fact input path. Then complete the three blocked Codex runs. Keep Claude permission rules unavailable under A35. |
| Keep repeat setup safe and visible. | PRD 24 R-CONFIG-HARNESS-6; PRD 28 R-HARNESS-7; PRD 39 R-SETUP-12 | t13 through t15, t24 | Current, drifted, blocked, unsupported, incomplete, pending, and recovery tests pass | Native cleanup passed for all completed Claude Code sessions | Reviewer sees current state and one useful action with no rerun loop | Automated pass; installed review open | Complete owner or maintainer review. |
| Preserve a valid machine change after project failure. | PRD 07 R-SETUP-CLI-3 and 9; PRD 39 R-SETUP-4 and 6 | t13, t24 | Injected project failure keeps verified machine state and resumes the project operation | Production adapter cleanup and content preservation passed | Reviewer sees machine success, project failure, and exact resume step | Automated pass; installed review open | Complete the installed observation. |

## Stage 1 — Authority Reconciliation

### Tasks

- [x] t1: Update the W19 R6 design and plan to classify P1 as an incomplete acceptance attempt and define P2.
- [x] t2: Reconcile PRDs 07, 20, 24, 25, 28, 39, 43, and 44 around one seven-part tuple and one production support authority.
- [x] t3: Add D-033 with the verified P1 gap, release effect, correction, and close evidence.
- [x] t4: Update the work index, P1 state, P2 trace, and evidence report without creating a new package or coordinate.

### Acceptance criteria

- A23: Current authority names one seven-part tuple and one central support registry. No current PRD requires a six-part setup-support tuple.
- A24: Current authority requires production registry loading, lab-only bootstrap, exact caller identity, project config writing, machine-only setup, explicit non-interactive methods, repeat state, and useful blocker actions.
- A25: P1 is recorded as a foundation code candidate and incomplete acceptance attempt. No package text calls it accepted feature delivery.

### Dependencies

- Existing W19 R6 design, plan, PRDs, work, and P1 evidence.

## Stage 2 — Production-Path Completion

### Tasks

- [x] t5: Replace the active eight-part conformance tuple type and every current six-part result contract with the exact seven-part tuple.
- [x] t6: Add or complete the validated central registry loader for production setup. Permit tests to select a temporary registry file only through this loader.
- [x] t7: Remove `reviewedAdapterPlansForTests` and every support or apply path that production cannot use.
- [x] t8: Add the maintainer-only bootstrap that creates an exact provisional tuple and disposable lab inputs without promoting support.
- [x] t9: Make `resolveHarnessMethodSupport` return selectable only for an admitted method with eligible exact central evidence.
- [x] t10: Project the same support result into interactive, dry-run, non-interactive, JSON, and MCP-safe output without progress noise.
- [x] t11: Implement the exact interactive order: project state, harness selection, one method-and-Skills screen per selected harness, resource placement, grouped review, machine apply and verify, project apply and verify, final result.
- [x] t12: Make `setup system` use the same per-harness machine planner without project initialization.
- [x] t13: Add the preserving project-config writer and commit reviewed `harnessIntegrations` only in the project operation.
- [x] t14: Add `--codex-method` and `--claude-code-method`. Make `--yes` approval-only. Make missing or unsupported non-interactive choices fail before writes.
- [x] t15: Make repeat setup classify current, drifted, blocked, unsupported, incomplete, and pending state. Give one action that can change each blocker.
- [x] t16: Preserve Store-free `resource list` and `resource read` across all setup and harness-policy changes.
- [x] t17: Preserve the W19 R3 shared Store session gate, checkout writer, pending operation, and retry rules. Add no new Store architecture or project undo path.

### Acceptance criteria

- A26: Production setup loads only the central registry and can select an exact eligible method.
- A27: A test-only plan or evidence object cannot make a method selectable or apply a native change.
- A28: Fresh interactive setup and machine-only setup follow the exact stated order and scope.
- A29: Non-interactive setup needs explicit valid method inputs. Dry-run and apply resolve the same plan.
- A30: Project setup writes exact reviewed intent while preserving comments and unrelated config.
- A31: Every final blocked result names the failed condition, what Make Docs tried, mutation state, and one useful recovery action.
- A32: Store-free resource reads and the shared Store session baseline remain unchanged.

### Dependencies

- Stage 1 authority.
- Existing P1 access, adapter, receipt, setup-state, and operation-policy code.

## Stage 3 — Installed Conformance and Human Experience Acceptance

### Tasks

- [x] t18: Add current setup-access scenarios and target bindings for each admitted Codex and Claude Code connection method.
- [x] t19: Bootstrap provisional exact tuples through the real maintainer-only lab path.
- [ ] t20: Run Codex MCP and Codex command-rule scenarios in disposable homes. Prove exact native files, outside-sandbox rule behavior, caller identity, Store read and write, and cleanup.
- [x] t21: Run Claude Code MCP in a disposable home. Prove exact native files, caller identity, Store read and write, and cleanup.
- [x] t22: Run Claude Code permission-rule and sandbox proof in a disposable home. If safe narrow access fails, record the result and keep the method unavailable.
- [ ] t23: Run the installed interactive flow for fresh, current, partial, no-method, supported, unsupported, drifted, blocked, failed, recovered, and repeated states.
- [ ] t24: Run installed machine-success and project-failure recovery. Prove the valid machine change remains and repeat setup resumes only the project part.
- [ ] t25: Run Store-free resource list and read from restricted Codex and Claude Code tasks with the Store absent, locked, and unreadable.
- [x] t26: Run focused tests, the full CLI suite, Store verification, packed CLI smoke, MCP conformance, lab meta-verification, PRD authority validation, path hygiene, link checks, and `git diff --check`.
- [ ] t27: Apply Human Experience Review to every promise. Record the promised surface, evidence, observation, conclusion, reviewer, limits, and useful next action.
- [ ] t28: Update central evidence, close D-033 only if all ten hard close rules pass, and prepare the P2 closeout without staging, committing, installing, publishing, or releasing.

### Acceptance criteria

- A33: Every method shown as supported has one eligible real-harness result for its exact seven-part tuple and exact installed product.
- A34: Codex command rules prove exact allowed prefixes and no broader sandbox escape.
- A35: Claude Code permission rules prove separate narrow sandbox access or remain unavailable with a clear reason and safe alternative.
- A36: Installed setup writes and reports exact machine and project state across fresh, repeat, drift, failure, and recovery.
- A37: Restricted tasks can read installed system resources without a Store, rule, MCP server, or extension.
- A38: Every Human Experience promise has a `satisfied`, `material gap`, or `insufficient evidence` conclusion. Any material gap keeps P2 open.
- A39: All automated, package, authority, and link checks pass on the final candidate.
- A40: D-033 closes only after the central evidence report links every required production test, real harness result, and Human Experience observation.

### Dependencies

- Stages 1 and 2.
- Installed Codex and Claude Code in disposable lab homes.
- No real user home or project.

### Closeout Notes

- Four testing decisions: Automated Implementation Testing selected; Performance Testing `not-needed-now`; Guided Progress Review selected; Unassisted Goal Testing `not-needed-now`.
- Human Experience Review: Not started. The owner or maintainer must record each observation and limit.
- Evidence report: [evidence.md](evidence.md) records the current implementation, package proof, real-harness results, and blockers.
- Phase / capability status: The specified production code and automated validation pass. P2 remains open because normal setup cannot establish exact runtime facts, Codex proof is blocked, and installed Human Experience Review is incomplete.

## Hard Close Rules

1. One seven-part runtime tuple exists across PRDs, code, registry, scenarios, and results.
2. Production setup uses the validated central registry loader and no alternate support source.
3. No test-only reviewed plan can stand in for production behavior.
4. Every shown method is selectable only from eligible exact evidence.
5. The real lab bootstrap and result path work in disposable homes.
6. MCP and rule routes prove exact caller and method identity.
7. Codex rules pass, and Claude rules pass both permission and sandbox proof or stay unavailable.
8. Interactive, machine-only, dry-run, and non-interactive setup preserve exact reviewed state.
9. Repeat and failure states give one useful action and do not create a rerun loop.
10. Real harness, Store-free resource, full automated, installed screen, and Human Experience proof all pass.

## Implementation Gate

The owner authorized W19 R6 P2 implementation and real disposable Codex and Claude Code lab runs. The implementation and allowed lab work occurred.

The authority still excludes the real user home, Pi, a new Store architecture, broad home access, staging, commit, installation, publication, and release.

---
title: "Phase 1: Unified Setup and Harness Access"
kind: "work"
status: "active"
coordinate: "W19 R6 P1"
source:
  type: "prd"
  path: "../../prd/07-cli-command-surface-and-lifecycle.md"
---

# Phase 1: Unified Setup and Harness Access

## Purpose

Record the first W19 R6 implementation attempt. This phase produced useful foundation code and automated evidence. It did not produce one complete production setup path and is not accepted feature delivery.

## Overview

Stage 1 established access, adapter, config-reader, and receipt parts. Stages 2 and 3 built candidate setup and adapter parts. Stage 4 proved several components and found that real setup and acceptance were still open. The later gap review found deeper production-path defects. [Phase 2](02-corrective-production-path-and-acceptance.md) now owns correction and acceptance.

## P1 Reassessment

- The central conformance registry has no current tuples.
- Production setup does not load the central registry.
- Every connection method resolves as unselectable.
- Reviewed adapter plans can enter only through a test-only input.
- Project setup reads `harnessIntegrations` but does not write the reviewed choice.
- The runtime tuple still uses the retired eight-part package shape. PRD 20 requires seven parts. PRDs 43 and 44 also required correction from six parts.
- Rule routes do not yet prove exact caller and method identity. Claude Code rules do not yet prove the separate sandbox boundary.
- Real harness and installed Human Experience acceptance did not occur.

Checked tasks below show P1 implementation activity. They do not prove feature acceptance. Any checked task that depends on the missing production path must be reworked or re-proved in P2.

## Human Experience Outcome

- Impact and governing promise: Direct. A person can configure Make Docs once and understand each system, project, Store, Skill, and resource choice.
- Intended human outcome: The person can finish setup, know what changed, and know the next action without learning internal Store or harness configuration details.
- Human-facing surface: The interactive CLI, human CLI results, project routers, and harness-native Make Docs entries.
- Implementation work: Access metadata, state-aware setup, native adapters, config precedence, receipts, drift, recovery, and proof.
- Evidence source or testing type: Automated Implementation Testing, Guided Progress Review, real-harness conformance, and Human Experience Review.
- Executor: Implementation agents for automated proof. A maintainer or owner reviews the installed terminal flow.
- Accepted obligation or deferral route: None.

## Current Testing Decisions

| Testing type | Current decision | Decision record or reason |
| --- | --- | --- |
| Automated Implementation Testing | selected | Exact access, config, file, recovery, package, and parity results can be asserted. |
| Performance Testing | not-needed-now | This work makes no new speed or capacity claim. Existing Store busy and concurrency tests remain required regression coverage. |
| Guided Progress Review | selected | The setup screens and grouped effects need review in the installed terminal as work proceeds. |
| Unassisted Goal Testing | not-needed-now | Current decisions can be closed through exact terminal review, fresh-context conformance tasks, and functional evidence. No separate naive-user claim is made. |

Human Experience Review remains required for every listed promise.

## Source PRD Docs

- [05 Installation Profile and Manifest Lifecycle](../../prd/05-installation-profile-and-manifest-lifecycle.md)
- [07 CLI Command Surface and Lifecycle](../../prd/07-cli-command-surface-and-lifecycle.md)
- [08 Skills Catalog and Distribution](../../prd/08-skills-catalog-and-distribution.md)
- [17 System Asset Materialization and Local Bootstrap](../../prd/17-system-asset-materialization-and-local-bootstrap.md)
- [20 Agent Harness Conformance and Support Claims](../../prd/20-agent-harness-conformance-and-support-claims.md)
- [24 Project Configuration and Convention Overlay](../../prd/24-project-configuration-and-convention-overlay.md)
- [25 TypeScript Runtime, CLI, MCP, and Operation Boundaries](../../prd/25-typescript-runtime-cli-mcp-operation-boundaries.md)
- [28 Shared Agentics Installation and Harness Exposure](../../prd/28-shared-agentics-installation-and-harness-exposure.md)
- [30 Agentic Extensibility Boundary](../../prd/30-plugin-substrate-and-workflow-bundles.md)
- [38 Global Store and Project State](../../prd/38-global-store-and-project-state.md)
- [39 CLI Command Model and Operation Registry](../../prd/39-cli-command-model-and-operation-registry.md)

## Source Obligations, Scenarios, And Findings

- Obligations: none.
- Unassisted Goal Testing scenarios: `not-needed-now`.
- Findings: none at package creation. Route later findings through current authority.

## Stage 1 — Access, Adapter, and Configuration Contracts

### Tasks

- [x] t1: Add `store`, `project`, and `hostConfig` access metadata to the operation definition and every admitted operation. Reject missing or inconsistent declarations.
- [x] t2: Make Store session admission depend on operation access. Prove `store: none` opens no Store root, database, lock, or session file.
- [x] t3: Derive registry descriptors, MCP tool details, command-rule candidates, and conformance facts from the same access metadata.
- [x] t4: Add the bounded first-party harness adapter contract for detection, methods, scope, native files, plan, apply, verify, removal, and support state.
- [x] t5: Extend global config with per-harness user intent and maximum approved method. Preserve unknown fields under the current global-config safety policy.
- [x] t6: Add project integration settings that can inherit, narrow, or disable the machine choice. Do not reuse `harnessCapabilities`.
- [x] t7: Add Store-owned applied receipts for exact native entries, verified executable identity, content or rule fingerprints, result, and drift state.
- [x] t8: Add validation for precedence, unsupported combinations, unsafe paths, symlinks, malformed native files, and user-owned entries.

### Acceptance criteria

- A1: Foundation evidence passed. P2 must prove the production registry and adapter path use it.
- A2: Foundation evidence passed. P2 must repeat Store-free proof through the installed source and packed CLI.
- A3: Parser and policy evidence passed. P2 must add and prove the production project-config writer.
- A4: Foundation receipt evidence passed. P2 must prove it through real native routes.
- A5: Adapter definitions exist. No connection method is supported or selectable.

### Dependencies

- Current operation registry and Store session services.
- Current global and project config loaders.
- Verified native harness configuration formats.

## Stage 2 — Unified Setup and Native Harness Delivery

### Tasks

- [x] t9: Replace the fresh wizard sequence with project state, harness selection, per-harness support, inline system setup, resource placement, and grouped review.
- [x] t10: Remove document-type selection from fresh setup. Resolve the complete project shape internally. Preserve existing partial shapes unless a separate reviewed expansion is requested.
- [x] t11: Add `make-docs setup system`. Route `setup`, `setup system`, `setup reconfigure`, and `setup skills` through one state model while keeping their stated scope.
- [x] t12: Show detected, not detected, configured, drifted, and unsupported harness state without treating detection as support proof or limiting choices.
- [x] t13: Implement Codex MCP and bounded command-rule planning and apply through the adapter contract.
- [x] t14: Implement Claude Code MCP and bounded native permission-rule planning and apply through the adapter contract.
- [x] t15: Use a verified Make Docs executable for rules. Never approve shell wrappers, package runners, system setup, update, uninstall, backup, or removal commands.
- [x] t16: Place optional Skills within each harness's support screen and keep `setup skills` as the focused shortcut to the same selection and lifecycle behavior.
- [x] t17: Place system-resource projection under project initialization. State that resource reads need no Store access and that local copies reduce CLI dependence only.
- [x] t18: Group the final plan as This computer and This project. Require separate explicit approval for each system-wide write set.
- [x] t19: Apply and verify the system operation before the project operation. Return exact next steps for skip, block, failure, partial completion, and recovery.

### Acceptance criteria

- A6: The fresh document default passed component tests. Installed flow acceptance remains open.
- A7: Partial-state component tests passed. Installed repeat acceptance remains open.
- A8: Store-free behavior passed component tests. Installed restricted-task proof remains open.
- A9: Not met. Production setup has no selectable connection option.
- A10: Not met as a complete production flow. Candidate rendering and separate services exist.
- A11: Not met on the production path. The strongest proof uses a test-only reviewed adapter plan.

### Dependencies

- Stage 1 access, adapter, config, and receipt contracts.
- Existing planner, conflict review, installation state, and Skill lifecycle.

## Stage 3 — Compatibility, Drift, and Recovery

### Tasks

- [x] t20: Classify existing global intent, project settings, harness-native entries, Skills, resource projections, and partial document surfaces without granting ownership from location alone.
- [x] t21: Preserve current `setup reconfigure`, `setup skills`, `setup backup`, and `setup remove` behavior outside the changed wizard scope.
- [x] t22: Add idempotent repeat setup and drift reporting for system and project scopes. Repair only reviewed Make Docs-owned entries.
- [x] t23: Preserve unknown, malformed, user-owned, remote, newer, or changed native configuration and give one safe next action.
- [x] t24: Prove that old config and manifests do not gain machine trust during migration. Require current explicit approval for a new connection.
- [x] t25: Reuse the current shared Store session, checkout writer, pending operation, and recovery services. Add no local Store, local receipt, or new project undo path.
- [x] t26: Prove retry and resume never invoke a project mutation callback twice.

### Acceptance criteria

- A12: Candidate idempotence tests passed. P2 must prove the installed repeat state and project intent write.
- A13: Not met. All methods remain unselectable, and blocker guidance can create a rerun loop.
- A14: Foundation preservation tests passed. P2 must retain them.
- A15: Candidate recovery tests passed through test-only injection. Production proof remains open.
- A16: Foundation safety evidence passed. P2 must retain the shared Store session gate and current recovery engine.

### Dependencies

- Stages 1 and 2.
- Current compatibility classification and Store recovery authority.

## Stage 4 — Conformance, Package Proof, and Human Review

### Tasks

- [x] t27: Add focused unit and integration tests for every access declaration, setup state, adapter plan, config precedence, receipt, drift state, failure boundary, and retry rule.
- [x] t28: Add isolated-home exact-file tests for Codex MCP, Codex rules, Claude Code MCP, and Claude Code permission rules. Preserve unrelated native configuration in every case.
- [ ] t29: Run real Codex and Claude Code tasks for every method shown as supported. Record exact support tuples, evidence, and caveats.
- [ ] t30: Prove Store-free resource reads from restricted tasks and prove Store-backed reads and writes only through the selected connection.
- [x] t31: Run full CLI, Store verification, packed CLI smoke, MCP conformance, config, migration, Skill, and dogfood suites.
- [ ] t32: Review the installed terminal screens for fresh, existing, partial, skipped, waiting, drifted, failed, recovered, and repeated setup.
- [ ] t33: Apply Human Experience Review to every promise. Record the evidence, observation, conclusion, reviewer, and limit.
- [x] t34: Update user and maintainer guidance with the same access distinctions and current support claims. See [the user guide](../../assets/user/cli-setting-up-projects-and-harness-access.md) and [the maintainer guide](../../assets/maintainer/cli-maintaining-setup-and-harness-access.md).
- [ ] t35: Run PRD authority validation and link checks. Prepare a phase closeout. Do not publish, install, stage, or commit without separate authority.

### Acceptance criteria

- A17: Every supported method has one passing real-harness conformance result for its exact tuple. Missing evidence blocks the support label for that method only. Status: Open. No method is supported.
- A18: The packed component checks passed. They do not prove a usable supported method.
- A19: The installed screen always names the subject, scope, planned effect, access need, next action, and recovery path. Status: Open. Installed terminal review remains.
- A20: Candidate text and component tests passed. P2 must confirm the installed screen and restricted task.
- A21: All Human Experience promises have `satisfied`, `material gap`, or `insufficient evidence` conclusions with reviewer limits. Status: Open. Human Experience Review remains.
- A22: The P1 automated suite and authority validator passed. This is foundation evidence, not final W19 R6 acceptance.

### Dependencies

- Stages 1 through 3.
- Real installed Codex and Claude Code environments.

### Closeout Notes

- Four testing decisions: Automated Implementation Testing selected; Performance Testing `not-needed-now`; Guided Progress Review selected; Unassisted Goal Testing `not-needed-now`.
- Human Experience Review: Not accepted. The installed terminal review and promise conclusions did not occur.
- Evidence report: See [W19 R6 evidence](evidence.md) for the useful P1 checks and the production gaps they did not cover.
- Phase / capability status: P1 is an incomplete acceptance attempt and foundation code candidate. Tasks t29, t30, t32, t33, and t35 remain open here and are superseded by the complete P2 close gate. Acceptance cases A9, A10, A11, A13, A15, A17, A19, A20, A21, and A22 require P2 proof before W19 R6 can close.

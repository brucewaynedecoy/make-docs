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

Implement one complete setup path for projects and supported harnesses. Keep all release work in this phase. Use ordered stages to control dependencies.

## Overview

Stage 1 establishes access, adapter, config, and receipt contracts. Stage 2 builds the setup experience and Codex and Claude Code adapters. Stage 3 preserves old state and adds drift and recovery. Stage 4 proves the installed experience and package.

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

- [ ] t1: Add `store`, `project`, and `hostConfig` access metadata to the operation definition and every admitted operation. Reject missing or inconsistent declarations.
- [ ] t2: Make Store session admission depend on operation access. Prove `store: none` opens no Store root, database, lock, or session file.
- [ ] t3: Derive registry descriptors, MCP tool details, command-rule candidates, and conformance facts from the same access metadata.
- [ ] t4: Add the bounded first-party harness adapter contract for detection, methods, scope, native files, plan, apply, verify, removal, and support state.
- [ ] t5: Extend global config with per-harness user intent and maximum approved method. Preserve unknown fields under the current global-config safety policy.
- [ ] t6: Add project integration settings that can inherit, narrow, or disable the machine choice. Do not reuse `harnessCapabilities`.
- [ ] t7: Add Store-owned applied receipts for exact native entries, verified executable identity, content or rule fingerprints, result, and drift state.
- [ ] t8: Add validation for precedence, unsupported combinations, unsafe paths, symlinks, malformed native files, and user-owned entries.

### Acceptance criteria

- A1: Every admitted operation reports one complete access declaration in human-readable registry data and structured output.
- A2: Resource list/read and other `store: none` cases succeed when the Store is absent, busy, permission denied, or replaced with an unsafe path. They create no Store artifacts.
- A3: A project setting can reduce access or select `none`. It cannot select a method or access class above the approved machine setting.
- A4: A harness receipt identifies only exact Make Docs-owned native entries. A path, process age, or matching display name alone never proves ownership.
- A5: The adapter registry contains Codex and Claude Code definitions. Pi is absent or explicitly unsupported with no public support claim.

### Dependencies

- Current operation registry and Store session services.
- Current global and project config loaders.
- Verified native harness configuration formats.

## Stage 2 — Unified Setup and Native Harness Delivery

### Tasks

- [ ] t9: Replace the fresh wizard sequence with project state, harness selection, per-harness support, inline system setup, resource placement, and grouped review.
- [ ] t10: Remove document-type selection from fresh setup. Resolve the complete project shape internally. Preserve existing partial shapes unless a separate reviewed expansion is requested.
- [ ] t11: Add `make-docs setup system`. Route `setup`, `setup system`, `setup reconfigure`, and `setup skills` through one state model while keeping their stated scope.
- [ ] t12: Show detected, not detected, configured, drifted, and unsupported harness state without treating detection as support proof or limiting choices.
- [ ] t13: Implement Codex MCP and bounded command-rule planning and apply through the adapter contract.
- [ ] t14: Implement Claude Code MCP and bounded native permission-rule planning and apply through the adapter contract.
- [ ] t15: Use a verified Make Docs executable for rules. Never approve shell wrappers, package runners, system setup, update, uninstall, backup, or removal commands.
- [ ] t16: Place optional Skills within each harness's support screen and keep `setup skills` as the focused shortcut to the same selection and lifecycle behavior.
- [ ] t17: Place system-resource projection under project initialization. State that resource reads need no Store access and that local copies reduce CLI dependence only.
- [ ] t18: Group the final plan as This computer and This project. Require separate explicit approval for each system-wide write set.
- [ ] t19: Apply and verify the system operation before the project operation. Return exact next steps for skip, block, failure, partial completion, and recovery.

### Acceptance criteria

- A6: Fresh setup has no document-type screen and plans all four document directories and routers.
- A7: Existing partial setup shows its current surface and plans no expansion on a normal repeat.
- A8: A person can select a harness, choose no Store-backed connection, and still use project instructions, Skills, and resource reads that do not need Store access.
- A9: Each connection option states the operations it enables, the machine files it changes, and the effect of choosing none.
- A10: System and project changes appear in separate review groups. Project approval never writes machine configuration.
- A11: A successful system setup remains configured after an injected project failure. The result names the failed scope and exact recovery action.

### Dependencies

- Stage 1 access, adapter, config, and receipt contracts.
- Existing planner, conflict review, installation state, and Skill lifecycle.

## Stage 3 — Compatibility, Drift, and Recovery

### Tasks

- [ ] t20: Classify existing global intent, project settings, harness-native entries, Skills, resource projections, and partial document surfaces without granting ownership from location alone.
- [ ] t21: Preserve current `setup reconfigure`, `setup skills`, `setup backup`, and `setup remove` behavior outside the changed wizard scope.
- [ ] t22: Add idempotent repeat setup and drift reporting for system and project scopes. Repair only reviewed Make Docs-owned entries.
- [ ] t23: Preserve unknown, malformed, user-owned, remote, newer, or changed native configuration and give one safe next action.
- [ ] t24: Prove that old config and manifests do not gain machine trust during migration. Require current explicit approval for a new connection.
- [ ] t25: Reuse the current shared Store session, checkout writer, pending operation, and recovery services. Add no local Store, local receipt, or new project undo path.
- [ ] t26: Prove retry and resume never invoke a project mutation callback twice.

### Acceptance criteria

- A12: A repeat with no change produces no system or project writes.
- A13: Owned drift, user-owned differences, unknown entries, and unsupported methods have distinct states and safe actions.
- A14: Legacy partial projects, selections, Skills, and projections remain unchanged until reviewed.
- A15: An interrupted system operation and an interrupted project operation recover independently through current Store state.
- A16: No compatibility path creates broad executable trust, a local operational manifest, or a second recovery engine.

### Dependencies

- Stages 1 and 2.
- Current compatibility classification and Store recovery authority.

## Stage 4 — Conformance, Package Proof, and Human Review

### Tasks

- [ ] t27: Add focused unit and integration tests for every access declaration, setup state, adapter plan, config precedence, receipt, drift state, failure boundary, and retry rule.
- [ ] t28: Add isolated-home exact-file tests for Codex MCP, Codex rules, Claude Code MCP, and Claude Code permission rules. Preserve unrelated native configuration in every case.
- [ ] t29: Run real Codex and Claude Code tasks for every method shown as supported. Record exact support tuples, evidence, and caveats.
- [ ] t30: Prove Store-free resource reads from restricted tasks and prove Store-backed reads and writes only through the selected connection.
- [ ] t31: Run full CLI, Store verification, packed CLI smoke, MCP conformance, config, migration, Skill, and dogfood suites.
- [ ] t32: Review the installed terminal screens for fresh, existing, partial, skipped, waiting, drifted, failed, recovered, and repeated setup.
- [ ] t33: Apply Human Experience Review to every promise. Record the evidence, observation, conclusion, reviewer, and limit.
- [ ] t34: Update user and maintainer guidance with the same access distinctions and current support claims.
- [ ] t35: Run PRD authority validation and link checks. Prepare a phase closeout. Do not publish, install, stage, or commit without separate authority.

### Acceptance criteria

- A17: Every supported method has one passing real-harness conformance result for its exact tuple. Missing evidence blocks the support label for that method only.
- A18: The packed CLI produces the same setup plans, native files, resource results, and structured errors as the source build.
- A19: The installed screen always names the subject, scope, planned effect, access need, next action, and recovery path.
- A20: No screen says or implies that `resource list` or `resource read` needs Store access, MCP, rules, or an extension.
- A21: All Human Experience promises have `satisfied`, `material gap`, or `insufficient evidence` conclusions with reviewer limits.
- A22: The full required suite and `make-docs run prd authority validate --target-root .` pass from the final candidate.

### Dependencies

- Stages 1 through 3.
- Real installed Codex and Claude Code environments.

### Closeout Notes

- Four testing decisions: Automated Implementation Testing selected; Performance Testing `not-needed-now`; Guided Progress Review selected; Unassisted Goal Testing `not-needed-now`.
- Human Experience Review: Pending implementation evidence and human review. An agent cannot certify lived ease or confidence.
- Evidence report: Create `evidence.md` only when execution has durable findings to retain.
- Phase / capability status: Not started. Implementation is not authorized.

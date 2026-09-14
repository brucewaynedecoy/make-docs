---
title: "Phase 1: Unified Setup and Harness Access"
kind: "plan"
status: "active"
coordinate: "W19 R6 P1"
source:
  type: "design"
  path: "../../designs/2026-09-12-unified-setup-and-harness-access.md"
---

# Phase 1: Unified Setup and Harness Access

## Purpose

Record the first implementation attempt for the setup and harness-access change. The attempt produced useful foundation code. It did not complete the production path or acceptance and is not a release unit.

## Fixed Decisions

- Fresh projects use Designs, Plans, PRD, and Work without a document-type question.
- Existing partial projects remain partial unless the person reviews an expansion.
- `make-docs setup`, `setup system`, `setup reconfigure`, and `setup skills` share one internal state model.
- `setup backup` and `setup remove` stay outside the wizard.
- Codex and Claude Code can use MCP or their native command permission method after conformance.
- Pi is a future extension adapter. It is not supported by this phase.
- Resource list/read need no Store access and no harness connection.
- System and project approval, apply, receipt, and recovery stay separate.
- Project config can narrow or disable machine trust. It cannot grant new trust.
- The existing shared Store session gate remains unchanged unless focused evidence shows a defect.

## Stage 1 — Access, Adapter, and Configuration Contracts

Add explicit `store`, `project`, and `hostConfig` access metadata to each admitted operation. Make Store admission depend on this metadata. Make registry descriptors, MCP projection, command-rule selection, and conformance checks consume the same data.

Add a first-party harness adapter contract. It must cover detection, supported methods and scopes, native files, read/plan/apply/verify/remove behavior, executable identity, and support status. Add Codex and Claude Code definitions. Keep Pi unregistered or explicitly unsupported until a first-party extension passes admission.

Extend global config with per-harness machine intent and maximum access. Add Store-owned applied receipts and drift state. Extend project config with a separate harness integration field that can inherit, narrow, or disable an approved machine method. Do not reuse `harnessCapabilities`.

Primary code areas:

- `packages/cli/src/operations/registry.ts`
- `packages/cli/src/operations/**`
- `packages/cli/src/store/global-config.ts`
- `packages/cli/src/store/**`
- `packages/cli/src/config.ts`
- new bounded harness adapter modules under `packages/cli/src/`
- `packages/cli/src/mcp/**`

## Stage 2 — Unified Setup and Native Harness Delivery

Replace the current wizard order with project state, harness selection, per-harness support, inline missing system setup, resource placement, and exact grouped review.

Add `make-docs setup system`. Keep `setup reconfigure` and `setup skills` as focused entries into the same model. Remove document-type selection from fresh setup. Show an existing partial project as current state, not as an error or an automatic expansion target.

For Codex and Claude Code, plan exact MCP or rule changes from live native configuration. Preserve unknown entries. Use the verified Make Docs executable and bounded command prefixes for rules. Keep system administration and destructive setup commands outside agent rules and MCP tools.

Apply and verify the system operation before the project operation. Keep valid system state if project apply fails. Return the exact next setup or recovery action.

Primary code areas:

- `packages/cli/src/cli.ts`
- `packages/cli/src/wizard.ts`
- `packages/cli/src/types.ts`
- `packages/cli/src/profile.ts`
- `packages/cli/src/install.ts`
- `packages/cli/src/planner.ts`
- `packages/cli/src/skills-command.ts`
- native harness adapter modules and renderers

## Stage 3 — Compatibility, Drift, and Recovery

Preserve old selections and partial project shapes. Migrate no machine trust without approval. Classify existing Make Docs-owned harness entries from exact receipts and live identity. Preserve user-owned, unknown, changed, remote, or malformed entries.

Make repeat setup idempotent. Report configured, missing, changed, unverified, or unsupported method state. Repair only reviewed owned drift. Never treat elapsed time, a matching path, or a generated file as ownership or support proof.

Prove that a system success plus project failure resumes cleanly. Prove that project config can narrow but not broaden the machine setting. Prove that no local Store or new project undo path appears.

## Stage 4 — Conformance, Package Proof, and Human Review

Run focused and full tests from isolated project roots and isolated homes. Verify official or installed harness configuration behavior before final fixtures are accepted.

Exercise real Codex and Claude Code tasks for each method that the setup shows as supported. Record the exact tuple and caveats under PRD 20. If a method lacks real evidence, label it unavailable or experimental and do not recommend it.

Review the installed setup screens for orientation, honest permission text, grouped effects, waiting, drift, failure, recovery, and repeat use. Confirm that the screen never implies that resource reads require Store access.

Run package build, pack smoke, MCP conformance, PRD authority validation, and project dogfood verification. Do not publish or install a release without separate authority.

## Worker Ownership

| Workstream | Write scope | Dependency | Deliverable |
| --- | --- | --- | --- |
| Access and config core | Registry, operation definitions, config, Store receipts, focused tests | None | Typed access and precedence model |
| Setup experience | CLI setup orchestration, wizard, renderers, setup tests | Stage 1 contracts | One state-aware flow |
| Harness adapters | Adapter modules, native fixtures, exact-file tests | Stage 1 contracts | Codex and Claude Code methods |
| Compatibility and recovery | Migration, drift, resume tests | Stages 1 and 2 | Safe existing-state behavior |
| Assembly and validation | Shared types, full tests, conformance, docs | All stages | Release-ready evidence package |

Workers are not alone in the codebase. They must preserve other changes and adjust to concurrent edits. At the live implementation baseline, `wizard.ts` and `wizard.test.ts` were clean. They did not need reconciliation before implementation started.

## Acceptance Matrix

| Case | Pass condition |
| --- | --- |
| P1-A1 Access metadata | Every admitted operation has exact access data. `store: none` operations open no Store session. |
| P1-A2 Fresh setup | The wizard asks no document-type question and creates the complete document surface after review. |
| P1-A3 Partial setup | Repeat setup preserves the existing partial surface until a reviewed expansion. |
| P1-A4 Honest resource path | Resource list/read work with absent, locked, and unreadable Store state. Text says no Store permission is needed. |
| P1-A5 Codex methods | Exact MCP and rule plans preserve unrelated config and pass real Codex conformance before support is shown. |
| P1-A6 Claude Code methods | Exact MCP and permission-rule plans preserve unrelated config and pass real Claude Code conformance before support is shown. |
| P1-A7 Pi boundary | Setup does not show Pi as supported without an admitted first-party extension and real evidence. |
| P1-A8 Trust precedence | Project settings inherit, narrow, or disable. They never grant a method or access level absent from machine approval. |
| P1-A9 Grouped review | System and project changes, approvals, receipts, and errors remain distinct. |
| P1-A10 Failure and resume | A project failure does not remove verified system setup. Repeat setup resumes the incomplete part. |
| P1-A11 Idempotence and drift | A repeat with no drift plans no writes. Owned drift is named and requires review. Unknown state is preserved. |
| P1-A12 No duplicate mutation | Retry and recovery logic never invokes a project mutation callback twice. |
| P1-A13 Package parity | Source, built CLI, packed CLI, MCP, fixtures, and dogfood guidance agree. |
| P1-A14 Human experience | A reviewer can identify the subject, effect, access need, next action, and recovery path on every setup state. |

## Stops and Risks

- Stop if current official harness configuration rules differ from the planned adapter model.
- Stop support for one method if real conformance cannot prove it.
- Stop before changing an unknown or user-owned harness entry.
- Stop if access metadata would make a Store-free command open the Store.
- Stop if implementation would require a new Store schema, broad command cleanup, or Pi extension delivery without explicit scope approval.
- Preserve all unrelated working-tree edits.

## Implementation Gate

The owner authorized this P1 implementation. The code candidate exists. Later product review found that production support loading, method selection, project intent writing, exact rule identity, real harness proof, and installed Human Experience acceptance are incomplete.

P1 is an incomplete acceptance attempt. [Phase 2](02-corrective-production-path-and-acceptance.md) owns the correction.

This plan does not authorize staging, commit, release, publication, installation, or a change to a real harness.

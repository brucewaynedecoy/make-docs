---
title: "W19 R6 Unified Setup and Harness Access Plan"
kind: "plan"
status: "active"
coordinate: "W19 R6"
source:
  type: "design"
  path: "../../designs/2026-09-12-unified-setup-and-harness-access.md"
follow_on:
  route: "implementation-loop"
  next_prompt: ".make-docs/system/references/execution-workflow.md"
  why: "The corrected design, PRDs, and backlog now define the W19 R6 P2 implementation and acceptance work."
  coordinate_handoff: "Keep P1 as incomplete and carry W19 R6 P2 into corrective implementation and evidence."
---

# W19 R6 Unified Setup and Harness Access Plan

## Purpose

Turn the accepted and corrected [Unified Setup and Harness Access design](../../designs/2026-09-12-unified-setup-and-harness-access.md) into current PRD authority and a complete production result. P1 produced useful foundation code but did not complete the production support path or acceptance. P2 corrects that gap inside this same W19 R6 package.

## Objective

- Replace fresh-project document-type selection with the complete Designs, Plans, PRD, and Work project shape.
- Give Codex and Claude Code clear native choices for Store-backed work.
- Keep Store-free resource reads free from special harness setup.
- Use one state-aware setup model for new and existing projects.
- Keep system and project approval, receipts, and recovery separate.
- Preserve existing partial installs and user-owned harness configuration.
- Admit future native adapters without making MCP the common architecture.
- Finish the implementation through one corrective phase with three ordered stages and one hard acceptance gate.

## Governing Invariant

Setup must grant no broader access than the person reviewed. A project setting can narrow machine trust but cannot grant it. An operation with `store: none` must not open or require the Store.

## Coordinate Decision

- Coordinate: `W19 R6`
- Classification: `revision`
- Evidence: This work corrects the user setup and restricted-agent boundary of W19 R3 Store ownership and W19 R5 managed Skills. W19 R5 is the latest revision in this lineage. No W19 R6 plan or work package exists.
- Phase count: Two phases in the same revision. P1 is an incomplete acceptance attempt and foundation code candidate. P2 has three ordered stages for authority, production delivery, and installed acceptance. No partial stage is a complete release.

## Maintenance Inputs

| Input | Role | Confidence |
| --- | --- | --- |
| [Unified Setup and Harness Access](../../designs/2026-09-12-unified-setup-and-harness-access.md) | Current product decision | Accepted direction from the owner discussion |
| [Store-Owned Installation and Migration State](../../designs/2026-09-09-store-owned-installation-and-migration-state.md) | Store and recovery baseline | Implemented authority |
| [First-Party Skills and Managed Adoption](../../designs/2026-09-09-first-party-skills-and-managed-adoption.md) | Skill selection and ownership baseline | Implemented authority |
| Current `packages/cli/src/wizard.ts`, `cli.ts`, `types.ts`, `config.ts`, `store/`, `operations/registry.ts`, and `mcp/` | Implementation baseline | Current working tree; `wizard.ts` has unrelated local edits and must be reconciled without loss |
| Current harness rules, MCP configuration formats, and conformance records | External behavior to verify | Must be checked during implementation; no support claim can rely on memory alone |
| W19 R6 P1 code and evidence | Foundation and gap evidence | Useful implementation input; not accepted feature delivery |

## Human Experience Propagation

| Promise | Owning PRD | Surface or effect | Work phase | Evidence | Accepted obligation |
| --- | --- | --- | --- | --- | --- |
| Explain computer, project, and Store effects before approval. | PRDs 07, 28, 39 | Interactive setup and exact review | P2, stages 2 and 3 | Installed terminal review and transcript assertions | None |
| Complete missing system setup inside project setup. | PRDs 07, 24, 28, 39 | Setup continuity and recovery | P2, stages 2 and 3 | System/project fault matrix and repeat setup | None |
| Keep resource reads available without Store access. | PRDs 25 and 39 | CLI, MCP, and restricted task | P2, stages 2 and 3 | Store-absent, locked, denied, and no-session tests | None |
| Remove fresh document-type choice without expanding old partial projects. | PRDs 07 and 39 | Project setup | P2, stages 2 and 3 | Fresh and legacy project inventories | None |
| Show only admitted and conformance-proved native methods. | PRDs 20, 28, 43, and 44 | Harness selection and support claims | P2, stages 1 through 3 | Central registry checks and real Codex and Claude Code conformance | None |
| Keep repeat setup safe and show drift. | PRDs 24, 28, and 39 | Machine and project configuration | P2, stages 2 and 3 | Idempotence, drift, and ownership tests | None |
| Preserve a valid system change after a project failure. | PRDs 07, 28, and 39 | Apply and recovery | P2, stages 2 and 3 | Injected failure and resume proof | None |

## Candidate Decision Matrix

| Candidate | Decision | Owner and reason |
| --- | --- | --- |
| Fresh complete project shape and partial-install preservation | `update-existing` | PRD 05 owns installation selections and PRD 07 owns setup flow. |
| State-aware setup, `setup system`, current subcommands, and grouped review | `update-existing` | PRDs 07 and 39 own the human command surface and exact grammar. |
| Skills inside harness setup and the focused shortcut | `update-existing` | PRD 08 owns Skill selection and lifecycle. |
| Resource placement and Store-free reads | `update-existing` | PRD 17 owns system resources. PRD 25 owns shared operation surfaces. |
| Method-specific support proof | `update-existing` | PRD 20 owns support tuples and claims. |
| Project harness integration settings | `update-existing` | PRD 24 owns project config. The new field does not reuse `harnessCapabilities`. |
| Per-operation access metadata and surface derivation | `update-existing` | PRDs 25 and 39 own the operation core and registry. |
| Native MCP, rule, permission, and extension adapters | `update-existing` | PRD 28 owns installed harness exposure. |
| Adapter admission and future Pi boundary | `update-existing` | PRD 30 owns admission. Pi is not claimed in this delivery. |
| Global harness defaults, receipts, and drift | `update-existing` | PRD 38 owns global config and operational evidence. |
| Human Experience standard | `none` | PRD 49 already owns the cross-cutting standard. This package applies it and does not change it. |
| PRD index | `none` | No PRD is created, removed, renamed, or reclassified. |
| Risk register | `update-existing` | D-033 records the verified gap between W19 R6 authority and its P1 production path. |

## Existing PRDs To Update

| PRD | Current normative update | Preserved authority |
| --- | --- | --- |
| [07 CLI Lifecycle](../../prd/07-cli-command-surface-and-lifecycle.md) | State-aware screens, exact explanations, and resource placement. | Existing lifecycle commands and review-first behavior. |
| [20 Harness Conformance](../../prd/20-agent-harness-conformance-and-support-claims.md) | Make the central seven-part tuple registry the only production support authority. | Exact evidence and no broad claims. |
| [24 Project Configuration](../../prd/24-project-configuration-and-convention-overlay.md) | Require the production setup flow to write reviewed project intent. | Project ownership and canonical ids. |
| [25 Runtime Boundaries](../../prd/25-typescript-runtime-cli-mcp-operation-boundaries.md) | Require exact caller and method identity for every native route. | Shared core, write gates, and parity. |
| [28 Harness Exposure](../../prd/28-shared-agentics-installation-and-harness-exposure.md) | Define safe Codex and Claude Code rule behavior and production adapter proof. | Skill ownership and safe lifecycle. |
| [39 Command Model](../../prd/39-cli-command-model-and-operation-registry.md) | Define the exact interactive and non-interactive production setup grammar. | Current top-level command family and operation identifiers. |
| [43 Conformance Scenarios](../../prd/43-conformance-scenario-model-and-execution-kits.md) | Use the seven-part tuple and add a real lab-only adapter bootstrap path. | Scenario and kit safety. |
| [44 Conformance Lab](../../prd/44-conformance-lab-sessions-and-evidence.md) | Record `connectionMethod` and disposable-harness proof through the normal result seam. | Session and evidence safety. |

## Genuinely New Product PRDs

None. PRD 28 already owns harness installation and exposure. A new PRD would split one capability across two owners.

## Requirement History Entries

Each corrected PRD gets one `2026-09-14 — W19 R6 P2` entry. The entry records the incomplete P1 contract and the P2 replacement. Current requirements stay in the main body.

## Phase Map

| File | Purpose |
| --- | --- |
| [01-unified-setup-and-harness-access.md](01-unified-setup-and-harness-access.md) | Record the P1 foundation implementation and its incomplete acceptance result. |
| [02-corrective-production-path-and-acceptance.md](02-corrective-production-path-and-acceptance.md) | Reconcile authority, complete the production path, and prove the installed human experience. |

## Output Contract and Ownership

- Plan: `docs/plans/2026-09-12-w19-r6-unified-setup-and-harness-access/`
- Updated PRDs for P2: 07, 20, 24, 25, 28, 39, 43, and 44, plus D-033 in the risk register
- Delta backlog: `docs/work/2026-09-12-w19-r6-unified-setup-and-harness-access/`
- New PRDs: none
- Implementation files: selected `packages/cli/src/**`, `packages/cli/tests/**`, package docs, harness fixtures, and conformance assets named by P2
- Existing unrelated edits in `packages/cli/src/wizard.ts`, `packages/cli/tests/wizard.test.ts`, and W20 work files must be preserved and reconciled before implementation edits begin.

Implementation can use disjoint workers for the access/config core, setup UI, native adapters, and verification. The final assembly owner must reconcile shared types and tests. The coordinator writes no files when delegation is available.

## Dependencies

- The implemented shared Store session gate and cause-specific Store errors remain the baseline.
- Current Codex and Claude Code configuration formats must be verified from official or installed harness sources during implementation.
- A verified Make Docs executable path and identity must be available before rule generation.
- Real harness conformance must run in disposable lab homes before a method appears as supported.
- Pi remains outside the first delivery unless its first-party extension receives separate implementation authority and passes admission.

## Validation

- Run focused setup, config, Store, registry, MCP, resource, Skill, migration, and recovery tests.
- Run a true restricted-task check that proves `resource.read` works without Store access and Store-backed operations work through each selected method.
- Run isolated-home exact-file tests for each supported harness method.
- Run fresh, current, partial, drifted, failed, and repeated setup flows.
- Prove separate system and project receipts and recovery.
- Prove no system write occurs without explicit system approval.
- Run the full CLI suite, Store verification suite, packed CLI smoke tests, MCP conformance tests, and real Codex and Claude Code scenarios.
- Apply Human Experience Review to each promise. Record the evidence, observation, conclusion, reviewer, and limit.
- Run `make-docs run prd authority validate --target-root .` after PRD reconciliation.

## Intended Follow-On

This handoff is advisory-default-but-overridable. The owner has authorized the later P2 implementation scope and real disposable Codex and Claude Code lab runs. This documentation turn does not start that work.

- Route: `prd-generation`
- Next step: Implement P2 from the reconciled PRDs and corrective backlog.
- Why: Implementation must use current setup, access, resource, Store, and harness requirements instead of this maintenance plan alone.
- Coordinate Handoff: Keep P1 as an incomplete acceptance attempt. Use `W19 R6 P2` for corrective implementation, evidence, and later commits.

---
title: "W19 R6 Unified Setup and Harness Access Plan"
kind: "plan"
status: "active"
coordinate: "W19 R6"
source:
  type: "design"
  path: "../../designs/2026-09-12-unified-setup-and-harness-access.md"
follow_on:
  route: "prd-generation"
  next_prompt: "make-docs://system/prompt/plan-to-prd-change.prompt.md"
  why: "Make the setup and harness-access decisions current product authority before implementation."
  coordinate_handoff: "Carry W19 R6 into PRD requirement history and the delta backlog."
---

# W19 R6 Unified Setup and Harness Access Plan

## Purpose

Turn the accepted [Unified Setup and Harness Access design](../../designs/2026-09-12-unified-setup-and-harness-access.md) into current PRD authority and one implementation phase. This plan changes setup, harness integration, access classification, configuration, and proof. It does not authorize implementation.

## Objective

- Replace fresh-project document-type selection with the complete Designs, Plans, PRD, and Work project shape.
- Give Codex and Claude Code clear native choices for Store-backed work.
- Keep Store-free resource reads free from special harness setup.
- Use one state-aware setup model for new and existing projects.
- Keep system and project approval, receipts, and recovery separate.
- Preserve existing partial installs and user-owned harness configuration.
- Admit future native adapters without making MCP the common architecture.
- Finish the implementation through one phase with ordered stages and one final acceptance gate.

## Governing Invariant

Setup must grant no broader access than the person reviewed. A project setting can narrow machine trust but cannot grant it. An operation with `store: none` must not open or require the Store.

## Coordinate Decision

- Coordinate: `W19 R6`
- Classification: `revision`
- Evidence: This work corrects the user setup and restricted-agent boundary of W19 R3 Store ownership and W19 R5 managed Skills. W19 R5 is the latest revision in this lineage. No W19 R6 plan or work package exists.
- Phase count: One implementation phase. Four ordered stages keep contracts, delivery, compatibility, and proof separate inside that phase. No partial stage is a complete release.

## Maintenance Inputs

| Input | Role | Confidence |
| --- | --- | --- |
| [Unified Setup and Harness Access](../../designs/2026-09-12-unified-setup-and-harness-access.md) | Current product decision | Accepted direction from the owner discussion |
| [Store-Owned Installation and Migration State](../../designs/2026-09-09-store-owned-installation-and-migration-state.md) | Store and recovery baseline | Implemented authority |
| [First-Party Skills and Managed Adoption](../../designs/2026-09-09-first-party-skills-and-managed-adoption.md) | Skill selection and ownership baseline | Implemented authority |
| Current `packages/cli/src/wizard.ts`, `cli.ts`, `types.ts`, `config.ts`, `store/`, `operations/registry.ts`, and `mcp/` | Implementation baseline | Current working tree; `wizard.ts` has unrelated local edits and must be reconciled without loss |
| Current harness rules, MCP configuration formats, and conformance records | External behavior to verify | Must be checked during implementation; no support claim can rely on memory alone |

## Human Experience Propagation

| Promise | Owning PRD | Surface or effect | Work phase | Evidence | Accepted obligation |
| --- | --- | --- | --- | --- | --- |
| Explain computer, project, and Store effects before approval. | PRDs 07, 28, 39 | Interactive setup and exact review | Phase 1, stages 2 and 4 | Installed terminal review and transcript assertions | None |
| Complete missing system setup inside project setup. | PRDs 05, 07, 28, 38 | Setup continuity and recovery | Phase 1, stages 2 and 3 | System/project fault matrix and repeat setup | None |
| Keep resource reads available without Store access. | PRDs 17, 25, 39 | CLI, MCP, and restricted task | Phase 1, stages 1 and 4 | Store-absent, locked, denied, and no-session tests | None |
| Remove fresh document-type choice without expanding old partial projects. | PRDs 05 and 07 | Project setup | Phase 1, stages 2 and 3 | Fresh and legacy project inventories | None |
| Show only admitted and conformance-proved native methods. | PRDs 20, 28, and 30 | Harness selection and support claims | Phase 1, stages 2 and 4 | Real Codex and Claude Code conformance | None |
| Keep repeat setup safe and show drift. | PRDs 24, 28, and 38 | Machine and project configuration | Phase 1, stages 1, 3, and 4 | Idempotence, drift, and ownership tests | None |
| Preserve a valid system change after a project failure. | PRDs 05, 28, and 38 | Apply and recovery | Phase 1, stages 2 and 4 | Injected failure and resume proof | None |

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
| Risk register | `none` | The current delivery boundary and future admission rule resolve the product choice. Implementation findings still use the live register when needed. |

## Existing PRDs To Update

| PRD | Current normative update | Preserved authority |
| --- | --- | --- |
| [05 Installation Profile](../../prd/05-installation-profile-and-manifest-lifecycle.md) | Complete fresh shape, preserved partial state, and separate system/project apply. | Conflict, ownership, and Store safety. |
| [07 CLI Lifecycle](../../prd/07-cli-command-surface-and-lifecycle.md) | State-aware screens, exact explanations, and resource placement. | Existing lifecycle commands and review-first behavior. |
| [08 Skills](../../prd/08-skills-catalog-and-distribution.md) | Skill choice is one harness-support option and remains separately callable. | Explicit opt-in and standard native paths. |
| [17 System Resources](../../prd/17-system-asset-materialization-and-local-bootstrap.md) | Resource reads need no Store or harness permission. Projection is a portability choice. | Provider authority and managed projection safety. |
| [20 Harness Conformance](../../prd/20-agent-harness-conformance-and-support-claims.md) | Add native method to the support tuple and require setup choice proof. | Exact evidence and no broad claims. |
| [24 Project Configuration](../../prd/24-project-configuration-and-convention-overlay.md) | Add project integration settings that only narrow machine trust. | Project ownership and canonical ids. |
| [25 Runtime Boundaries](../../prd/25-typescript-runtime-cli-mcp-operation-boundaries.md) | Add operation access metadata and make MCP one adapter method. | Shared core, write gates, and parity. |
| [28 Harness Exposure](../../prd/28-shared-agentics-installation-and-harness-exposure.md) | Add the first-party adapter model, native connection choices, receipts, and drift. | Skill ownership and safe lifecycle. |
| [30 Extensibility](../../prd/30-plugin-substrate-and-workflow-bundles.md) | Admit bounded first-party harness adapters without a general plugin product. | No speculative or implicit integrations. |
| [38 Global Store](../../prd/38-global-store-and-project-state.md) | Store global harness intent and applied receipts. | Store boundary and shared session gate. |
| [39 Command Model](../../prd/39-cli-command-model-and-operation-registry.md) | Add `setup system`, state-aware setup, and registry access metadata. | Current top-level command family and operation identifiers. |

## Genuinely New Product PRDs

None. PRD 28 already owns harness installation and exposure. A new PRD would split one capability across two owners.

## Requirement History Entries

Each changed PRD gets one `2026-09-12 — W19 R6` entry. The entry records the prior narrow setup, selection, MCP, or configuration boundary and links to the current design and this plan. Current requirements stay in the main body.

## Phase Map

| File | Purpose |
| --- | --- |
| [01-unified-setup-and-harness-access.md](01-unified-setup-and-harness-access.md) | Implement access contracts, unified setup, native adapters, compatibility, and acceptance as one release unit. |

## Output Contract and Ownership

- Plan: `docs/plans/2026-09-12-w19-r6-unified-setup-and-harness-access/`
- Updated PRDs: 05, 07, 08, 17, 20, 24, 25, 28, 30, 38, and 39
- Delta backlog: `docs/work/2026-09-12-w19-r6-unified-setup-and-harness-access/`
- New PRDs: none
- Implementation files: selected `packages/cli/src/**`, `packages/cli/tests/**`, package docs, harness fixtures, and conformance assets named by Phase 1
- Existing unrelated edits in `packages/cli/src/wizard.ts`, `packages/cli/tests/wizard.test.ts`, and W20 work files must be preserved and reconciled before implementation edits begin.

Implementation can use disjoint workers for the access/config core, setup UI, native adapters, and verification. The final assembly owner must reconcile shared types and tests. The coordinator writes no files when delegation is available.

## Dependencies

- The implemented shared Store session gate and cause-specific Store errors remain the baseline.
- Current Codex and Claude Code configuration formats must be verified from official or installed harness sources during implementation.
- A verified Make Docs executable path and identity must be available before rule generation.
- Real harness conformance must run before a method appears as supported.
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

This handoff is advisory-default-but-overridable. It does not authorize implementation.

- Route: `prd-generation`
- Next step: Use the reconciled PRDs in this package as product authority for the linked delta backlog.
- Why: Implementation must use current setup, access, resource, Store, and harness requirements instead of this maintenance plan alone.
- Coordinate Handoff: Carry `W19 R6` into the backlog, phase history, and later commits.

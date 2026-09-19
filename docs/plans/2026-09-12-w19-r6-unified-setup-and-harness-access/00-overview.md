---
title: "W19 R6 Unified Setup and Harness Access Plan"
kind: "plan"
status: "complete"
coordinate: "W19 R6"
source:
  type: "design"
  path: "../../designs/2026-09-14-static-harness-adapters-and-conformance-retirement.md"
follow_on:
  route: "implementation-loop"
  next_prompt: ".make-docs/system/references/execution-workflow.md"
  why: "P3 and W19 R6 are complete. Keep P1 and P2 as superseded history and use the P3 evidence for the accepted static-adapter result."
  coordinate_handoff: "Carry later work as a new accepted coordinate. Do not reopen P1 or P2."
---

# W19 R6 Unified Setup and Harness Access Plan

## Purpose

Turn the current [Static Harness Adapters and Conformance Retirement design](../../designs/2026-09-14-static-harness-adapters-and-conformance-retirement.md) into corrected PRD authority and a complete production result.

P1 produced useful foundation code. P2 added more useful setup and access code. P2 also made an obsolete Playbooks conformance system a production setup gate. P3 corrects the authority, classifies the P2 diff, and completes the current product through static harness adapters.

## Objective

- Replace fresh-project document-type selection with the complete Designs, Plans, PRD, and Work project shape.
- Give Codex and Claude Code clear native choices for Store-backed work.
- Keep Store-free resource reads free from special harness setup.
- Use one state-aware setup model for new and existing projects.
- Keep system and project approval, receipts, and recovery separate.
- Preserve existing partial installs and user-owned harness configuration.
- Admit future native adapters through source-owned product review.
- Remove dynamic tuple, registry, scenario, provider, model, and runtime gates from setup.
- Finish the implementation through P3 with three ordered stages and one hard acceptance gate.

## Governing Invariant

Setup must grant no broader access than the person reviewed. A project setting can narrow machine trust but cannot grant it. An operation with `store: none` must not open or require the Store.

## Coordinate Decision

- Coordinate: `W19 R6`
- Classification: `revision`
- Evidence: This work corrects the user setup and restricted-agent boundary of W19 R3 Store ownership and W19 R5 managed Skills. P2 exposed retained Playbooks conformance authority that does not match the current product.
- Phase count: Three phases in the same revision. P1 is superseded and incomplete. P2 is superseded. P3 has three ordered stages for authority reset, product correction, and installed acceptance. No partial stage is a complete release.

## Maintenance Inputs

| Input | Role | Confidence |
| --- | --- | --- |
| [Static Harness Adapters and Conformance Retirement](../../designs/2026-09-14-static-harness-adapters-and-conformance-retirement.md) | Current product decision | Accepted direction from the owner discussion |
| [Unified Setup and Harness Access](../../designs/2026-09-12-unified-setup-and-harness-access.md) | Prior P1 and P2 direction | Superseded where it requires dynamic conformance |
| [Store-Owned Installation and Migration State](../../designs/2026-09-09-store-owned-installation-and-migration-state.md) | Store and recovery baseline | Implemented authority |
| [First-Party Skills and Managed Adoption](../../designs/2026-09-09-first-party-skills-and-managed-adoption.md) | Skill selection and ownership baseline | Implemented authority |
| Current `packages/cli/src/wizard.ts`, `cli.ts`, `types.ts`, `config.ts`, `store/`, `operations/registry.ts`, and `mcp/` | Implementation baseline | Current working tree; `wizard.ts` has unrelated local edits and must be reconciled without loss |
| Current harness rules and MCP configuration formats | External behavior to verify | Must be checked during implementation from installed or official harness sources |
| W19 R6 P1 and P2 code and evidence | Foundation and gap evidence | Useful implementation input; not accepted feature delivery |

## Human Experience Propagation

The accepted P3 design replaces this early seven-row planning trace with the six P3 promises. The P3 promise set is the current closeout set. The rows below remain planning lineage and do not create a second review.

| Promise | Owning PRD | Surface or effect | Work phase | Evidence | Accepted obligation |
| --- | --- | --- | --- | --- | --- |
| Explain computer, project, and Store effects before approval. | PRDs 07, 28, 39 | Interactive setup and exact review | P3, stages 2 and 3 | Installed terminal review and transcript assertions | None |
| Complete missing system setup inside project setup. | PRDs 07, 24, 28, 39 | Setup continuity and recovery | P3, stages 2 and 3 | System/project fault matrix and repeat setup | None |
| Keep resource reads available without Store access. | PRDs 17, 25, 39 | CLI, MCP, and restricted task | P3, stages 2 and 3 | Store-absent, locked, denied, and no-session tests | None |
| Remove fresh document-type choice without expanding old partial projects. | PRDs 07 and 39 | Project setup | P3, stages 2 and 3 | Fresh and legacy project inventories | None |
| Show only safe methods from static product-owned adapters. | PRDs 25 and 28 | Harness selection and native access | P3, stages 2 and 3 | Direct adapter tests and real Codex and Claude Code runs | None |
| Keep repeat setup safe and show drift. | PRDs 24, 28, 38, 39 | Machine and project configuration | P3, stages 2 and 3 | Idempotence, drift, and ownership tests | None |
| Preserve a valid system change after a project failure. | PRDs 07, 28, 39 | Apply and recovery | P3, stages 2 and 3 | Injected failure and resume proof | None |

## Candidate Decision Matrix

| Candidate | Decision | Owner and reason |
| --- | --- | --- |
| Fresh complete project shape and partial-install preservation | `update-existing` | PRD 05 owns installation selections and PRD 07 owns setup flow. |
| State-aware setup, `setup system`, current subcommands, and grouped review | `update-existing` | PRDs 07 and 39 own the human command surface and exact grammar. |
| Skills inside harness setup and the focused shortcut | `update-existing` | PRD 08 owns Skill selection and lifecycle. |
| Resource placement and Store-free reads | `update-existing` | PRD 17 owns system resources. PRD 25 owns shared operation surfaces. |
| Static method support | `update-existing` | PRD 28 owns built-in harness adapters. |
| Project harness integration settings | `link-only` | PRD 24 already owns project config and the separate `harnessIntegrations` field. P3 preserves that contract. |
| Per-operation access metadata and surface derivation | `update-existing` | PRDs 25 and 39 own the operation core and registry. |
| Native MCP, rule, permission, and extension adapters | `update-existing` | PRD 28 owns installed harness exposure. |
| Adapter admission and future Pi boundary | `update-existing` | PRD 30 owns source review. Dynamic conformance is removed. Pi is not claimed. |
| Global harness defaults, receipts, and drift | `link-only` | PRD 38 already owns global config and operational evidence. P3 preserves that contract. |
| Human Experience standard | `none` | PRD 49 already owns the cross-cutting standard. This package applies it and does not change it. |
| Harness conformance claims | `remove-from-active` | Retire PRD 20 after valid safety rules move to PRDs 25 and 28. |
| Conformance scenarios and lab sessions | `remove-from-active` | Retire PRDs 43 and 44. Direct product tests replace their setup role. |
| Test and review rules | `update-existing` | PRDs 48 and 50 keep valid test rules without PRD 20. |
| PRD index | `update-existing` | Remove PRDs 20, 43, and 44 from the active set. |
| Risk register | `update-existing` | D-033 records the invalid retained authority and the P3 correction. |

## P3 Authority Changes

| PRD | P3 change | Preserved authority |
| --- | --- | --- |
| [07 CLI Lifecycle](../../prd/07-cli-command-surface-and-lifecycle.md) | Keep state-aware screens, method choice, exact explanations, and recovery. | Existing lifecycle commands and review-first behavior. |
| [24 Project Configuration](../../prd/24-project-configuration-and-convention-overlay.md) | Keep reviewed `harnessIntegrations` intent and safe YAML edits. | Project ownership and canonical ids. |
| [25 Runtime Boundaries](../../prd/25-typescript-runtime-cli-mcp-operation-boundaries.md) | Own caller identity, narrow Store access, and Store-free reads. | Shared core, write gates, and parity. |
| [28 Harness Exposure](../../prd/28-shared-agentics-installation-and-harness-exposure.md) | Replace conformance admission with static Codex and Claude Code adapters. | Skill ownership, native entries, and safe lifecycle. |
| [39 Command Model](../../prd/39-cli-command-model-and-operation-registry.md) | Keep the exact interactive and non-interactive setup grammar. | Current commands and operation ids. |
| PRDs 08, 10, 14, 16, 17, 30, 34, 35, 36, 46, 48, and 50 | Remove old conformance links and keep each document's current Skill, package, lifecycle, resource, Playbook boundary, testing, performance, or evidence scope. | Existing non-Playbook requirements and no-capability boundaries. |
| PRDs 20, 43, and 44 | Remove from the active PRD set. | Git history preserves prior meaning. |

## Genuinely New Product PRDs

None. PRD 28 already owns harness installation and exposure. A new PRD would split one capability across two owners.

## Requirement History Entries

Each changed current PRD gets one `2026-09-14 — W19 R6 P3` entry. It records the invalid retained Playbooks authority and the static adapter replacement. Retired PRDs keep no current requirement body after removal from the active set.

## Phase Map

| File | Purpose |
| --- | --- |
| [01-unified-setup-and-harness-access.md](01-unified-setup-and-harness-access.md) | Record the P1 foundation implementation and its incomplete acceptance result. |
| [02-corrective-production-path-and-acceptance.md](02-corrective-production-path-and-acceptance.md) | Record P2 work performed under invalid retained conformance authority. This phase is superseded. |
| [03-static-harness-adapters-and-conformance-retirement.md](03-static-harness-adapters-and-conformance-retirement.md) | Reset authority, complete static harness setup, remove unused conformance code, and prove the installed human experience. |

## Output Contract and Ownership

- Plan: `docs/plans/2026-09-12-w19-r6-unified-setup-and-harness-access/`
- P3 PRD changes: update 00, 07, 08, 10, 14, 16, 17, 25, 28, 30, 34, 35, 36, 39, 46, 48, and 50; retire 20, 43, and 44; update D-033
- Delta backlog: `docs/work/2026-09-12-w19-r6-unified-setup-and-harness-access/`
- New PRDs: none
- Implementation files: selected `packages/cli/src/**`, `packages/cli/tests/**`, package docs, harness fixtures, and traced conformance-only paths named by P3
- Existing unrelated edits in `packages/cli/src/wizard.ts`, `packages/cli/tests/wizard.test.ts`, and W20 work files were preserved during implementation. Review and closeout must continue to preserve them.

Implementation must classify the existing P2 diff by changed block before it edits or removes code.

## Dependencies

- The implemented shared Store session gate and cause-specific Store errors remain the baseline.
- Current Codex and Claude Code configuration formats must be verified from official or installed harness sources during implementation.
- A verified Make Docs executable path and identity must be available before rule generation.
- Direct installed product checks must run in disposable harness homes before release.
- Pi remains outside the first delivery unless its first-party extension receives separate implementation authority and passes admission.

## Validation

- Run focused setup, config, Store, static adapter, MCP, resource, Skill, migration, and recovery tests.
- Run a true restricted-task check that proves `resource.read` works without Store access and Store-backed operations work through each selected method.
- Run isolated-home exact-file tests for each built-in harness method.
- Run fresh, current, partial, drifted, failed, and repeated setup flows.
- Prove separate system and project receipts and recovery.
- Prove no system write occurs without explicit system approval.
- Run the full CLI suite, Store verification suite, packed CLI smoke tests, MCP checks, and real Codex and Claude Code operations.
- Apply the agent-owned Human Experience Review to each promise. Record the evidence, observation, conclusion, reviewer, and limit. Do not require an owner response unless accepted authority explicitly defines a human acceptance gate.
- Run `make-docs run prd authority validate --target-root .` after PRD reconciliation.

## Intended Follow-On

This handoff is advisory-default-but-overridable. P3 and W19 R6 are complete. P1 and P2 remain superseded history.

- Route: `implementation-loop`
- Next step: Use a new accepted coordinate for later setup or harness-access changes.
- Why: All ten P3 hard close rules pass. The agent-owned review records `satisfied` for all six promises. No explicit human acceptance gate applies.
- Coordinate Handoff: Keep P1 and P2 as superseded evidence. Keep `W19 R6 P3` as the completed correction and closeout record.

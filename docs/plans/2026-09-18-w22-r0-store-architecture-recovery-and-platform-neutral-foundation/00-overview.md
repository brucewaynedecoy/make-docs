---
title: "W22 R0 Store Architecture Recovery and Platform-Neutral Foundation Plan"
kind: "plan"
status: "draft"
coordinate: "W22 R0"
source:
  type: "design"
  path: "docs/designs/2026-09-18-store-architecture-recovery-and-platform-neutral-foundation.md"
follow_on:
  route: "prd-generation"
  next_prompt: "../../../.make-docs/system/prompts/plan-to-prd-change.prompt.md"
  why: "Settle the reduced target and update current product authority before implementation."
  coordinate_handoff: "Carry W22 R0 into requirement history, risk items, and the draft delta backlog."
---

# W22 R0 Store Architecture Recovery and Platform-Neutral Foundation Plan

## Purpose

Plan the architecture recovery defined by the [source design](../../designs/2026-09-18-store-architecture-recovery-and-platform-neutral-foundation.md). The plan first tests the value of each current mechanism. It then settles current authority, creates a platform-neutral safety boundary, simplifies Store and harness state, migrates existing installations, closes known symptoms, and proves one installed result on Windows, macOS, and Linux.

This is a draft package. It does not authorize PRD edits, code changes, Store changes, real-project repair, installation, staging, commit, push, publication, or release.

## Objective

Produce a smaller and explainable Store foundation without losing proved safety. Completion requires:

- one complete mechanism inventory with a `keep`, `rework`, or `remove` decision and evidence for each item;
- accepted product decisions for repository authority, Store authority, checkout identity, harness ownership, current execution proof, setup composition, resource projection, and platform parity;
- surgical updates to all owning PRDs and the living risk register;
- one compatibility plan for old schemas, receipts, ledgers, and pending operations;
- one implementation that does not use device or inode values as durable product identity;
- one thin platform boundary with equal public behavior on Windows, macOS, and Linux;
- one installed-package matrix on real operating systems;
- closure evidence for the known symptoms and any added in-scope symptoms; and
- a Human Experience Review that reports the real result and its limits.

## Governing Invariant

- The repository owns versioned project knowledge and desired product state.
- The Store owns only non-rebuildable operational state, machine state, and minimum safe-change evidence.
- Rebuildable data cannot become the only authority.
- Project content remains useful without Store access.
- One operation has one journal and one recovery path.
- A platform-specific rule stays behind one platform boundary.
- Current normative requirements live in their owning PRDs before implementation relies on them.
- Existing user files and useful recovery evidence survive migration.
- No mechanism remains only because another removable mechanism depends on it.

## Coordinate Decision

- Coordinate: `W22 R0`.
- Classification: `new-wave`.
- Evidence: The owner explicitly selected W22 R0. The package introduces a new architecture goal and a new end-to-end acceptance boundary. It is not another W19 setup or Store repair.
- Departure from default lineage: The prior symptoms and most affected code are in W19. The owner-directed new wave overrides revision lineage under the wave model.

## Maintenance Inputs

| Input | Format and location | Confidence and use |
| --- | --- | --- |
| Owner concern and architecture question | Current task direction | High confidence for the desired review boundary and W22 R0 coordinate. |
| Source design | [Store Architecture Recovery and Platform-Neutral Foundation](../../designs/2026-09-18-store-architecture-recovery-and-platform-neutral-foundation.md) | Governs the recovery goal, promises, guardrails, and proposed target. |
| Current Store authority | [PRD 38](../../prd/38-global-store-and-project-state.md) | Current authority for Store, project identity, operations, recovery, and harness state. |
| Current harness authority | [PRD 28](../../prd/28-shared-agentics-installation-and-harness-exposure.md) | Current authority for harness adapters, native entries, methods, and ownership. |
| Current runtime and release authority | [PRD 10](../../prd/10-packaging-validation-and-release-reference.md) and [PRD 16](../../prd/16-package-runtime-and-deployment-boundaries.md) | Current authority for package proof, supported runtime, and deployment boundaries. |
| Current migration and command authority | [PRD 18](../../prd/18-compatibility-classification-and-migration-safety.md) and [PRD 39](../../prd/39-cli-command-model-and-operation-registry.md) | Current authority for migration, setup, state, recovery, CLI, JSON, and MCP. |
| Current code | `packages/cli/src/store/`, `packages/cli/src/harness-access/`, `packages/cli/src/setup-system.ts`, `packages/cli/src/project-projection.ts`, and `packages/cli/src/operations/resource/` | High confidence for the present implementation. Reindex and recheck before each implementation phase. |
| Change history | Commits `dabd0b36`, `7ca65f40`, `afbeaab2`, `56800c35`, and `0e5e90be` | High confidence for growth, correction, removal, and repair sequence. It is evidence for review, not proof of a defect by itself. |
| Symptom inventory | Current confirmed findings plus later owner details | Incomplete. P1 keeps one append-only inventory and maps each symptom to an existing mechanism and promise. |

## Human Experience Propagation

| Promise | Existing or planned owning PRD | Human-facing surface or indirect effect | Work phase | Evidence source or selected testing type | Accepted obligation, if any |
| --- | --- | --- | --- | --- | --- |
| HX-1: equal action meaning and recovery on Windows, macOS, and Linux | PRDs 10, 16, 28, and 38 | Installed CLI, native harness access, file safety, and recovery | [P3](03-platform-neutral-filesystem-and-checkout-safety.md) and [P6](06-real-platform-package-proof-and-closeout.md) | Automated implementation checks plus real-OS installed-package matrix | None |
| HX-2: clear project state and next safe action before internal detail | PRDs 07, 38, and 39 | Setup, status, verify, repair, and recovery output | [P4](04-harness-trust-setup-and-resource-simplification.md) and [P6](06-real-platform-package-proof-and-closeout.md) | Output fixtures, installed transcripts, and Human Experience Review | None |
| HX-3: independent project work continues without Store access | PRDs 07, 25, 38, and 39 | Resource reads, project docs, validation, and Store-backed writes | [P2](02-product-authority-and-minimal-state-model.md), [P4](04-harness-trust-setup-and-resource-simplification.md), and [P6](06-real-platform-package-proof-and-closeout.md) | Access matrix and denial/unavailable installed cases | None |
| HX-4: moves and package updates do not fail only because durable low-level identity changed | PRDs 16, 18, 28, and 38 | Moved checkout, package upgrade, harness verification, and repair | [P2](02-product-authority-and-minimal-state-model.md), [P3](03-platform-neutral-filesystem-and-checkout-safety.md), and [P5](05-compatibility-bridge-and-symptom-closure.md) | Migration fixtures and real-platform installed cases | None |
| HX-5: setup and repair have one open recovery path | PRDs 07, 18, 38, and 39 | Setup, system setup, status, recover, and repair | [P4](04-harness-trust-setup-and-resource-simplification.md) and [P5](05-compatibility-bridge-and-symptom-closure.md) | State-transition tests and interruption/restart proof | None |
| HX-6: every retained mechanism has an explainable purpose and authority class | PRDs 02, 03, 25, 28, and 38 | Maintainer architecture, review, debugging, and rebuild | [P1](01-architecture-inventory-and-decision-gates.md), [P2](02-product-authority-and-minimal-state-model.md), and [P6](06-real-platform-package-proof-and-closeout.md) | Decision ledger, PRD review, source anchors, and final review | None |

## Performance Evidence Plan

| Candidate | Base maintenance action | Performance applicability | Target class | Canonical `PERF-###` or next record | Finite budget and stop reference | Lifecycle point |
| --- | --- | --- | --- | --- | --- | --- |
| None. This package addresses architecture, safety, parity, and recovery. | `none` | `not-needed` | `none` | None | Not applicable | None |

## Active Authority Baseline

- Active `docs/prd/` status: Current and in use. No archive gate applies.
- Current index: [docs/prd/00-index.md](../../prd/00-index.md).
- Discovery pass required: yes.
- Discovery scope: PRDs 02, 03, 06, 07, 10, 16, 18, 24, 25, 28, 38, and 39, plus all linked current Store, harness, setup, resource, and release rules.
- Known noncompliance or legacy notes: Current Store documents contain competing descriptions of installation authority. Current code uses device and inode data in both temporary and durable roles. Windows native rule launch identity is not implemented. The exact symptom list is still incomplete.

## Candidate Decision Matrix

| Candidate | Decision | Owning PRD or new product subject | Reason | Evidence |
| --- | --- | --- | --- | --- |
| Store and repository state boundary | `update-existing` | PRDs 02 and 38 | Existing owners must state one minimal authority rule. | Current PRD and source conflict. |
| Stable project and checkout identity | `update-existing` | PRD 38 | Existing Store owner covers identity and checkout records. | Durable device and inode fields in current schema. |
| Operation journal, locks, and recovery | `update-existing` | PRDs 18 and 38 | The need remains valid, but the minimum data and one recovery path need review. | Current operation and recovery implementation. |
| Platform-neutral file behavior | `update-existing` | PRDs 10, 16, 18, and 38 | Existing runtime, release, migration, and Store owners cover the product result. | Windows gap and cross-platform file semantics. |
| Harness receipt and current execution proof | `update-existing` | PRDs 28 and 38 | Existing owners cover native ownership and Store access. | Current receipt and executable fingerprint coupling. |
| Setup composition and Store access policy | `update-existing` | PRDs 07, 25, 38, and 39 | Existing CLI and runtime owners cover setup and operation access. | Current closed-loop recovery risk and large coordinator surface. |
| Resource projection state | `update-existing` | PRDs 06, 24, 25, and 38 | Existing resource, config, runtime, and Store owners cover projection. | Duplicate manifest, Store, and live-file facts require classification. |
| Confirmed drift, open choices, and rebuild risk | `update-existing` | PRD 03 | The living register owns unresolved and confirmed state. | W22 R0 findings and decisions. |
| New product PRD | `none` | Existing PRDs own every affected product subject. | This is an architecture recovery, not a new product capability. | Ownership map above. |
| PRD index | `link-only` unless discovery changes document relationships | PRD 00 | No new PRD is planned. | Current document map remains structurally valid. |

## Existing PRDs To Update

| Existing PRD | Owning sections | Planned current normative update | Preserved surrounding authority |
| --- | --- | --- | --- |
| [02 Architecture Overview](../../prd/02-architecture-overview.md) | Runtime zones, data flow, authority boundaries | State the accepted repository, Store, platform, setup, and harness boundaries. | Unrelated product topology. |
| [03 Risk Register](../../prd/03-open-questions-and-risk-register.md) | Confirmed Drift, Open Questions, Rebuild Risks | Record architecture coupling, durable file identity, platform parity, authority conflict, and migration risk. | Existing IDs and unrelated findings. |
| [06 Template Contracts and Generated Assets](../../prd/06-template-contracts-and-generated-assets.md) | Projection and ownership rules | State the accepted local projection and rebuildable-state boundary. | Template source authority and unrelated assets. |
| [07 CLI Command Surface](../../prd/07-cli-command-surface-and-lifecycle.md) | Setup, status, repair, and recovery | State one understandable path and Store-free behavior. | Command identity outside this scope. |
| [10 Packaging and Release](../../prd/10-packaging-validation-and-release-reference.md) | Validation matrix and installed proof | Require real Windows, macOS, and Linux installed-package cases. | Other package and release checks. |
| [16 Runtime Boundaries](../../prd/16-package-runtime-and-deployment-boundaries.md) | Supported platform and runtime rules | Define equal platform support and the small platform adapter. | Package layout and unrelated deployment rules. |
| [18 Migration Safety](../../prd/18-compatibility-classification-and-migration-safety.md) | Migration, rollback, and preservation | Define the compatibility bridge and ambiguous-state handling. | User content and backup rules. |
| [24 Configuration Overlay](../../prd/24-project-configuration-and-convention-overlay.md) | Desired selections and harness settings | Keep declarative desired state separate from applied proof. | Unrelated project configuration. |
| [25 TypeScript Runtime Boundaries](../../prd/25-typescript-runtime-cli-mcp-operation-boundaries.md) | Operation and adapter boundaries | Define the platform layer and thin setup coordinator. | General CLI and MCP parity rules. |
| [28 Harness Exposure](../../prd/28-shared-agentics-installation-and-harness-exposure.md) | Receipts, methods, ownership, and safety | Separate managed-entry ownership from current caller proof. | Supported harness list and unrelated Skill rules. |
| [38 Global Store](../../prd/38-global-store-and-project-state.md) | Store data, identity, operations, recovery, and tests | Replace durable low-level identity and state duplication with the accepted minimal model. | Stable project identity and proved non-rebuildable state. |
| [39 Command Model](../../prd/39-cli-command-model-and-operation-registry.md) | Setup, access, status, repair, JSON, and MCP | State one operation policy and one recovery path. | Registry identity and unrelated commands. |

## Genuinely New Product PRDs

None planned. P1 must stop and request an owner decision if discovery finds a coherent new product boundary with no current owner.

## Requirement History Entries

After target acceptance, add one `2026-09-18 — W22 R0` entry to each materially changed PRD. Each entry must name the former contract, the accepted replacement, the reason, and this design and plan. PRD 03 uses its own item history and does not receive a requirement-history section.

## Affected Links, Risks, Plans, And Work

| Surface | Artifact | Required maintenance | Authority role |
| --- | --- | --- | --- |
| Links and index | [PRD index](../../prd/00-index.md) | Update relationships only when the accepted target changes navigation. | Navigation only. |
| Risks and decisions | [PRD 03](../../prd/03-open-questions-and-risk-register.md) | Add or update numbered W22 findings during P2. | Living risk and decision register. |
| Plan | This directory | Keep decision order, limits, and phase dependencies current. | Sequencing and rationale. |
| Work | [W22 R0 draft backlog](../../work/2026-09-18-w22-r0-store-architecture-recovery-and-platform-neutral-foundation/00-index.md) | Keep tasks draft until product authority is accepted and implementation is separately approved. | Future implementation queue. |
| Prior plans and work | W19 Store, setup, harness, and recovery packages | Link as evidence. Do not rewrite completed records. | Historical context and prior proof. |
| History | Future W22 phase records | Create only during authorized phase closeout. | Execution provenance. |

## Phase Map

| File | Purpose |
| --- | --- |
| [01-architecture-inventory-and-decision-gates.md](01-architecture-inventory-and-decision-gates.md) | Freeze growth, inventory mechanisms and symptoms, and prepare proof-based decisions. |
| [02-product-authority-and-minimal-state-model.md](02-product-authority-and-minimal-state-model.md) | Accept the target boundaries and reconcile all owning PRDs. |
| [03-platform-neutral-filesystem-and-checkout-safety.md](03-platform-neutral-filesystem-and-checkout-safety.md) | Define the platform layer and replace durable low-level file identity. |
| [04-harness-trust-setup-and-resource-simplification.md](04-harness-trust-setup-and-resource-simplification.md) | Separate trust concerns and reduce setup and projection coupling. |
| [05-compatibility-bridge-and-symptom-closure.md](05-compatibility-bridge-and-symptom-closure.md) | Migrate existing state safely and close every in-scope symptom. |
| [06-real-platform-package-proof-and-closeout.md](06-real-platform-package-proof-and-closeout.md) | Prove one installed result on real platforms and complete the recovery review. |

## Output Contract

- Design: `docs/designs/2026-09-18-store-architecture-recovery-and-platform-neutral-foundation.md`.
- Plan: this directory with `00-overview.md` and six phase files.
- PRDs: surgical maintenance of existing owners only after P1 decisions are accepted.
- Risk register: numbered updates during P2, not during this package draft.
- Draft delta backlog: `docs/work/2026-09-18-w22-r0-store-architecture-recovery-and-platform-neutral-foundation/` with `00-index.md` and six phase files.
- No code, Store, real-project, installed CLI, template, archive, branch, commit, push, publication, or release change is part of this package-writing pass.

## Worker Ownership

Use the highest delegation tier that the authorized implementation session permits. Keep write scopes disjoint. Every worker must preserve concurrent edits and must not revert work outside its scope.

| Worker role | Scope | Write scope | Dependencies | Deliverables |
| --- | --- | --- | --- | --- |
| Architecture evidence owner | Mechanism, data, call-path, and symptom inventory | Evidence and decision-ledger paths only | Current code, docs, and history | Complete keep/rework/remove packet. |
| Product authority owner | PRD decision matrix, normative rules, history, and risk items | Assigned PRD owners only | Accepted P1 decisions | Current authority with no duplicate owner. |
| Platform safety owner | Paths, comparison, atomic writes, locks, liveness, and short-lived guards | Platform and Store safety modules plus focused tests | Accepted P2 contracts | One bounded platform layer. |
| Store model owner | Checkout, operation, ledger, and migration schema | Store modules and fixtures | Accepted P2 contracts | Minimal compatible state model. |
| Harness and setup owner | Receipts, current execution proof, access policy, setup, and projection | Harness, operation policy, setup, and projection modules plus tests | P3 safety services | Thin coordinated flows with one recovery path. |
| Compatibility owner | Old schema, receipt, ledger, and pending-operation bridge | Migration modules and compatibility fixtures | P3 and P4 target behavior | Safe read, classify, convert, quarantine, and rollback. |
| Platform evidence owner | Installed candidates and real-OS matrix | CI, package fixtures, and evidence paths only | P3-P5 complete | One identified package with comparable platform proof. |
| Validation owner | Authority, links, package, Human Experience, and regression review | Bounded fixes returned to owners | Assembled candidate | Final verdicts and visible limits. |

## MCP Strategy

Use jdocmunch for project documents and jcodemunch for code and function signatures. Resolve each index first. Reindex when an index is missing or stale. Use narrow direct reads only when reindexing fails. Use current files and owner direction as authority.

## Dependencies

P1 is the first gate. P2 cannot set product authority until the owner accepts the decision package. P3 and P4 depend on the accepted P2 contracts. P5 depends on the target state from P3 and P4. P6 depends on a complete migration bridge and one candidate built after all required source checks pass.

New symptom details can enter P1 and P5. They do not authorize implementation. A symptom that conflicts with the target or adds a new product capability returns to the owner before the affected phase continues.

## Validation

Validate every phase against the source design promises and current accepted PRDs. Require complete keep/rework/remove coverage. Require one authority owner for each durable fact. Require migration tests for old supported state. Require interruption and restart proof. Require Store-free access cases. Require real Windows, macOS, and Linux installed-package evidence. Run focused and full tests, default validation, package smoke checks, PRD authority validation, links, path hygiene, and `git diff --check` at the proper close gates.

Automated Implementation Testing is required in every implementation phase. Performance Testing is `not-needed-now` unless a later accepted product decision creates a real performance question. Guided Progress Review is useful for decision review and final installed flows. Unassisted Goal Testing is `not-needed-now` for the architecture decision because the owner has the needed product context. Reassess it for final normal-use discoverability only if current testing authority and executor isolation make it useful.

The agent must complete a Human Experience Review for the installed result. Human feedback is optional unless the owner later defines a specific human acceptance gate.

## Intended Follow-On

- Route: `prd-generation`
- Next Prompt: [plan-to-prd-change.prompt.md](../../../.make-docs/system/prompts/plan-to-prd-change.prompt.md).
- Why: Settle the reduced target and update current product authority before implementation.
- Coordinate Handoff: Carry W22 R0 into requirement history, risk items, and the draft delta backlog.

The user asked for a complete package in one pass. This draft therefore includes the downstream backlog before PRD reconciliation. That is an explicit lifecycle departure. The backlog remains draft and cannot govern implementation until P1 decisions are accepted, P2 updates current PRDs, and the owner gives separate implementation approval.

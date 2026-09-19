---
title: "W19 R3 Store-Owned Installation and Migration State Plan"
kind: "plan"
status: "active"
coordinate: "W19 R3"
source:
  type: "design"
  path: "docs/designs/2026-09-09-store-owned-installation-and-migration-state.md"
follow_on:
  route: "prd-generation"
  next_prompt: "../../../.make-docs/system/prompts/plan-to-prd-change.prompt.md"
  why: "Make the existing product authorities consistent before deriving the interrupt backlog."
  coordinate_handoff: "Carry W19 R3 into requirement history and a single-phase delta backlog."
---

# W19 R3 Store-Owned Installation and Migration State Plan

## Purpose

Prepare a complete, bounded repair of Make Docs tool-state ownership. This plan follows the [design](../../designs/2026-09-09-store-owned-installation-and-migration-state.md) and selects authoritative PRD maintenance. It keeps the active PRD tree and creates a scoped delta backlog.

The user reviewed and accepted the design, plan, PRD updates, and work backlog on 2026-09-09. The default lifecycle order is preserved. The backlog review gate is satisfied. The current request is a package commit followed by an implementation plan. Implementation has not started. This acceptance record does not authorize a live transfer.

## Objective

After accepted implementation, the global Store owns all live installation and migration state. The CLI safely transfers known local records, removes only verified obsolete inputs, and never recreates project-local operational state. Users keep project knowledge and file-copy backups. One CLI path reports installation state and recovers interrupted operations.

## Governing Invariant

`docs/prd/` states the current product contract. This plan owns change sequencing. Requirement history preserves prior contracts without making them current instructions. Neither plan completion nor PRD editing proves runtime completion.

## Coordinate Decision

- Coordinate: `W19 R3`.
- Classification: `revision`; interrupt work.
- Evidence: This corrects Store and migration behavior delivered under W19 R1 and the unresolved D-031 cleanup. W19 R2 already exists. Later unrelated waves do not change the source lineage.
- Pause: W20 R0 stays paused until W19 R3 completes its accepted exit checks. Its prior accepted work remains accepted. Resume from its recorded next step; do not restart it or infer new implementation authority.
- Phase count: Exactly one implementation phase. Ordered stages carry dependencies within that phase. Drafting these lifecycle documents is not a separate implementation phase.

## Maintenance Inputs

| Input | Format and location | Confidence and use |
| --- | --- | --- |
| User direction, September 9 | Task request | Explicit authority for global-only tool state, interrupt pause, drafting scope, and implementation gate. |
| Accepted repair | [Design](../../designs/2026-09-09-store-owned-installation-and-migration-state.md) | Decision set D1-D9 accepted with the work backlog on 2026-09-09. Implementation has not started. |
| Current Store contract | [PRD 38](../../prd/38-global-store-and-project-state.md) | Current owner; local manifest and receipt rules need correction. |
| Current installation and migration contracts | [PRD 05](../../prd/05-installation-profile-and-manifest-lifecycle.md), [PRD 18](../../prd/18-compatibility-classification-and-migration-safety.md), [PRD 39](../../prd/39-cli-command-model-and-operation-registry.md) | Current owners for persistence, recovery, and public command behavior. |
| Defect record | [Risk register, D-031](../../prd/03-open-questions-and-risk-register.md) | Open defect, not a completed cleanup. |
| September 9 investigation | Task evidence; `packages/cli/src/migration.ts` and installed CLI writer behavior | Confirms runtime recreation and test coverage gaps. Recheck bounded call sites during implementation. |

## Active Authority Baseline

The PRD set is active. [The index](../../prd/00-index.md) remains the entry point. Existing PRD numbers and product ownership stay in place. No full-set replacement or archive gate is needed. A bounded consumer pass is required because local operational-manifest and state rules appear outside PRD 38.

The current documentation validator passes 39 PRDs. The defaults suite has one known baseline failure: a consistency test hard-codes D-001 through D-030 and misses existing D-031. Record that baseline separately. Repair the brittle check during implementation; do not use it to dismiss new failures.

## Candidate Decision Matrix

| Candidate | Decision | Owning PRD | Reason and source |
| --- | --- | --- | --- |
| Global-only state, installation ledger, checkout identity, Store roots, preparation, journal, legacy transfer | `update-existing` | 38 | Existing Store boundary; design D1-D7. |
| Installation writes, preview, apply, removal, file ownership | `update-existing` | 05 | Existing install/update owner; D1-D6. |
| Locks, checkpoint order, frozen snapshots, recovery and rollback | `update-existing` | 18 | Existing migration safety owner; D3-D7. |
| Status and recovery grammar, typed results, registry/MCP parity, compatibility | `update-existing` | 39 | Existing command owner; D7-D8. |
| Declarative project identity/settings | `update-existing` | 24 | Preserve knowledge-only configuration; D2-D3. |
| Asset topology and runtime-state classification | `update-existing` | 02, 21 | Remove contradictory local-state topology and operational metadata classification; D1-D2. |
| Local resource availability and managed ownership | `update-existing` | 17 | Resource content stays local when selected; its operational ledger moves to Store; D1-D2. |
| Agent router guidance | `update-existing` | 15 | Route installation state through CLI/Store; preserve project-work freedom; D9. |
| Conformance ownership | `link-only` | 43 | Reuse its conformance rules for verification; no new admission model or capability. |
| Generic event engine or new Store PRD | `none` | Existing 38 remains owner | No distinct new subsystem is needed. |
| Project history and work-specific state | `link-only` | Existing documentation/work owners | User explicitly preserves these local forms; no general ban on local project knowledge. |

## Existing PRDs To Update

| Existing PRD | Owning sections | Normative change | Preserved authority |
| --- | --- | --- | --- |
| [38 Global Store and Project State](../../prd/38-global-store-and-project-state.md) | R-BND, R-MIR, R-ID, R-DB, R-LIFE, R-TEST and related scope | Replace local canonical manifest/mirror split with Store ledger; distinguish checkout binding; define bootstrap, operation journal, safe transfer, no local fallback. | Platform/privacy rules, opaque legacy-table preservation, scoped Store deletion, general lifecycle runs. |
| [05 CLI Install and Update](../../prd/05-installation-profile-and-manifest-lifecycle.md) | Manifest/persistence, project registration, review/apply, removal | Read and write installation authority through Store; itemize local manifest/state removal; stop on unknown ownership. | Reviewed file plan, user-content safety, selected assets. |
| [18 CLI Safety and Migrations](../../prd/18-compatibility-classification-and-migration-safety.md) | Locks, migration checkpoints, snapshot and rollback rules | Store preparation precedes project mutation; retire checkpoint-9-only bootstrap and local marker/receipt paths; pending operation controls recovery. | Frozen source snapshots, conservative legacy recognition, bounded backup and rollback. |
| [39 CLI Command Model and Operation Registry](../../prd/39-cli-command-model-and-operation-registry.md) | Project surface, R-MIG-4, registry parity and testability | Add exact D8 grammar; remove receipt projection/retry contract; define compatible writer rejection and shared typed results. | Existing command tree and shared core; no compatibility aliases. |
| [24 Project Configuration and Convention Overlay](../../prd/24-project-configuration-and-convention-overlay.md) | Configuration boundary and identity | Declarative project ID/settings only; no renamed operational manifest. | Overlay order, formatting and configuration behavior. |
| PRDs 02, 15, 17, 21 | Topology, router, materialization, and runtime-state passages | Replace specific local-manifest/state ownership claims and add links to 38. | Unrelated product topology, document authority, and optional local content. |

## Genuinely New Product PRDs

None. The existing owners cover the full repair. Do not add a PRD named after this correction or its migration work.

## Requirement History Entries

Add September 9, W19 R3 entries only where a material contract changes. Record the affected requirement, prior contract, replacement, reason, and links to this plan and design. Preserve the old local-manifest, Store-mirror, local-receipt, checkpoint-9, and local-lock rules only as non-normative history. Do not put task lists or editorial steps in current PRD requirements.

## Phase Map

| Phase | Outcome | Ordered stages | Exit |
| --- | --- | --- | --- |
| [P1 — Store State Cutover](01-store-state-cutover.md) | All supported Make Docs operations use Store-owned state; verified legacy records are transferred; packaged and dogfood proof agree. | Store foundation; writer and manifest cutover; legacy transfer and compatibility; verification and shipped guidance; acceptance and closeout. | All safety and human-result evidence passes; user accepts the result; W20 pause can be lifted at its recorded gate. |

One phase is enough because these changes form one indivisible storage boundary. It must not close after only moving receipts. Stages remain dependency ordered. Failed evidence keeps P1 open.

## Output Contract

- Design: `docs/designs/2026-09-09-store-owned-installation-and-migration-state.md`.
- Plan bundle: this `00-overview.md` and `01-store-state-cutover.md` only.
- PRDs: surgical owner updates listed above, their requirement history, shared index, and risk links.
- Delta backlog: `docs/work/2026-09-09-w19-r3-store-owned-installation-and-migration-state/`, with `00-index.md` and `01-store-state-cutover.md`.
- Pause records: W20 R0 plan/work entry points and shared navigation, with prior completion intact.
- No runtime, Store, installed output, backup, or receipt changes in this drafting pass. No memory edits, archive, branch, commit, push, or publication is included.

## Affected Links, Risks, Plans, And Work

| Surface | Required action | Authority role |
| --- | --- | --- |
| PRD index and D-031 | Link current owners and this interrupt. Keep D-031 open until runtime evidence meets its exit criteria. | Navigation and living risk record. |
| W19 R1 P5/P6 and prior design lineage | Add a bounded supersession pointer where active navigation could route work to old state rules. Preserve completed evidence. | Historical source, not current storage authority. |
| W20 R0 | Record pause for W19 R3 and retain its exact next action. | Execution queue; no restart or acceptance reset. |
| W21 dependent work | Preserve its existing W20 dependency. Do not expand this interrupt. | Downstream dependency. |
| Shipped defaults and local projections | Backlog the upstream correction and later CLI dogfood. | Product guidance; not edited during this drafting pass. |
| Personal agent memory | No current write. Optional separately authorized update may point to accepted authority. | Non-authoritative assistance, never a product completion dependency. |

## Worker Ownership

Use delegated authors with disjoint write scopes when the harness supports them. The coordinator owns no document-writing scope. Workers must preserve concurrent edits. Reuse an available worker for the final contract-fix pass after assembly.

| Worker role | Write scope | Dependency | Deliverable |
| --- | --- | --- | --- |
| Design and plan author | New design and this plan bundle | User direction and governing contracts | Proposed decisions and one-phase plan. |
| Product authority author | Listed owning PRDs | Design and plan available | Current inline requirements and non-normative history. |
| Assembly and backlog author | Shared PRD index/risk links, pause records, new work bundle | Owner matrix, then completed PRD changes | Consistent navigation and gated executable work. |
| Validation/fix role | Only explicitly returned document defects in assigned scope | All drafts assembled | Link, structure, ownership, phase-count and acceptance-gate corrections. |

## MCP Strategy

Use jdocmunch for project documents and jcodemunch for code/signatures. Resolve the index first. Reindex immediately when missing or stale. Use narrow direct reads only when reindexing fails or the target remains unavailable. Inspect all validation results. The index is a retrieval aid; the files and current user instruction remain authority.

## Dependencies

The design, plan, owning PRDs, and work backlog were drafted in order and accepted on 2026-09-09. The requested next action after the package commit is an implementation plan. Implementation has not started. The phase's Store foundation precedes writer cutover; cutover precedes legacy removal; packaged verification precedes dogfood transfer; accepted completion precedes W20 resumption. External publication follows its own later approval.

## Validation

For these drafts, verify required metadata and headings, one Human Experience Intent section, portable working links, one implementation phase, requirement ownership, standardized history, and clear implementation gates. Verify each candidate has one disposition. Verify no active requirement still orders a local operational receipt or manifest. Run the relevant documentation validators. Report baseline failures separately.

P1 uses verification set V1-V8 in the [phase plan](01-store-state-cutover.md). It covers functional and failure behavior, packaged output, compatibility, full-tree absence checks, guidance coverage, and the four design experience promises. Human Experience Review is required. It uses real CLI evidence; a schema check alone does not prove a usable result.

Unassisted Goal Testing is `not-needed-now` for drafting. The current uncertainty is state ownership and recoverability, which planned fault tests and a reviewed public CLI path can answer. At implementation coverage selection, reassess actual discoverability findings under the existing test contract. If evidence is inadequate, activate the smallest eligible test before closeout. Do not claim that an agent-authored test proves a user's lived experience.

## Intended Follow-On

- Route: `prd-generation`
- Next Prompt: [plan-to-prd-change.prompt.md](../../../.make-docs/system/prompts/plan-to-prd-change.prompt.md).
- Why: Make the existing product authorities consistent before deriving the interrupt backlog.
- Coordinate Handoff: Carry W19 R3 into requirement history and a single-phase delta backlog.

The current PRD updates and [work backlog](../../work/2026-09-09-w19-r3-store-owned-installation-and-migration-state/00-index.md) are accepted as of 2026-09-09. After the requested package commit, prepare the requested implementation plan. Implementation has not started. W20 R0 stays paused until the interrupt is complete. The prompt's stable identity is `make-docs://system/prompt/plan-to-prd-change.prompt.md`.

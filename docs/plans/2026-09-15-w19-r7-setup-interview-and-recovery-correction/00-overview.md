---
title: "W19 R7 Setup Interview and Recovery Correction Plan"
kind: "plan"
status: "draft"
coordinate: "W19 R7"
source:
  type: "design"
  path: "docs/designs/2026-09-15-setup-interview-and-recovery-correction.md"
follow_on:
  route: "prd-generation"
  next_prompt: "../../../.make-docs/system/prompts/plan-to-prd-change.prompt.md"
  why: "Make the existing product owners exact before the corrective implementation starts."
  coordinate_handoff: "Carry W19 R7 into requirement history and the one-phase delta backlog."
---

# W19 R7 Setup Interview and Recovery Correction Plan

## Purpose

Plan one bounded correction for the installed Skills interview and setup recovery failures. This plan follows the [problem statement and proposed design](../../designs/2026-09-15-setup-interview-and-recovery-correction.md). It uses authoritative PRD maintenance and one implementation phase.

This package does not authorize implementation. It also does not authorize a write to the affected real project or its Store records.

## Objective

Deliver one packaged CLI candidate that uses one Skills interview, blocks setup before editable questions when recovery owns the checkout, gives only valid recovery actions, safely closes a proved zero-effect pending operation, retains useful failure detail, and passes isolated legacy-project proof before any real-project use.

Completion requires all automated cases, packaged cases, the Human Experience Review, and the owner response. A source-only or unit-only pass is not complete.

## Governing Invariant

`docs/prd/` states the current product contract. This plan owns correction order. The work backlog owns implementation tasks. The Store owns live operation and recovery state. No plan, transcript, or evidence file can replace Store authority.

## Coordinate Decision

- Coordinate: `W19 R7`.
- Classification: `revision`.
- Evidence: The work corrects W19 R3 Store recovery, W19 R5 Skills adoption, and W19 R6 setup behavior. W19 R6 is the latest used revision in this lineage. The next unused revision is R7.
- Phase count: Exactly one implementation phase. Three ordered stages keep the change safe without creating partial release points.

## Maintenance Inputs

| Input | Format and location | Confidence and use |
| --- | --- | --- |
| User report and terminal transcript, September 15 | Direct task evidence | High confidence for the observed human path and exact public errors. |
| Current installed and built CLI comparison | Executable hash and version evidence | High confidence that the current source produced the installed behavior. |
| Current source diagnosis | `packages/cli/src/wizard.ts`, `packages/cli/src/skills-ui.ts`, `packages/cli/src/cli.ts`, and `packages/cli/src/store/installation-state.ts` | High confidence for the duplicate interview and invalid recovery hint. Recheck the active checkout before implementation. |
| Store operation diagnosis | Read-only Store query for the affected checkout | High confidence for an incomplete zero-step pending operation with equal ledgers and no active lock. Do not copy its raw local path into product docs. |
| Current product authority | PRDs 07, 08, 10, 18, 38, and 39 | Current owners for the affected behavior. |
| Existing setup correction | [W19 R6 static adapter design](../../designs/2026-09-14-static-harness-adapters-and-conformance-retirement.md) and its plan/work package | Current setup lineage. R7 narrows to the new observed faults. |

## Human Experience Propagation

| Promise | Existing owning PRD | Human-facing surface or indirect effect | Work phase | Evidence source or selected testing type | Accepted obligation, if any |
| --- | --- | --- | --- | --- | --- |
| HX-1: one Skills interview | [PRD 07](../../prd/07-cli-command-surface-and-lifecycle.md) and [PRD 08](../../prd/08-skills-catalog-and-distribution.md) | Full setup and `setup skills` terminal frames and keys | [P1](01-setup-interview-and-recovery-correction.md) | Automated transcript/snapshot parity plus owner Guided Progress Review | None |
| HX-2: recovery check before questions | [PRD 07](../../prd/07-cli-command-surface-and-lifecycle.md) and [PRD 39](../../prd/39-cli-command-model-and-operation-registry.md) | All project setup entries | [P1](01-setup-interview-and-recovery-correction.md) | Focused no-question and no-write tests plus packaged transcript | None |
| HX-3: valid resume or rollback advice | [PRD 18](../../prd/18-compatibility-classification-and-migration-safety.md), [PRD 38](../../prd/38-global-store-and-project-state.md), and [PRD 39](../../prd/39-cli-command-model-and-operation-registry.md) | Status, setup error, recovery dry-run, JSON, and MCP | [P1](01-setup-interview-and-recovery-correction.md) | Recovery matrix and installed-package proof | None |
| HX-4: safe no-effect rollback | [PRD 18](../../prd/18-compatibility-classification-and-migration-safety.md) and [PRD 38](../../prd/38-global-store-and-project-state.md) | `project state recover --rollback` | [P1](01-setup-interview-and-recovery-correction.md) | Zero-step fixture with before/after file and Store proof | None |
| HX-5: useful retained failure detail | [PRD 38](../../prd/38-global-store-and-project-state.md) and [PRD 39](../../prd/39-cli-command-model-and-operation-registry.md) | Plain status, recovery output, JSON, and MCP | [P1](01-setup-interview-and-recovery-correction.md) | Schema migration, failure injection, process restart, and output parity tests | None |
| HX-6: verified backup promise | [PRD 10](../../prd/10-packaging-validation-and-release-reference.md), [PRD 18](../../prd/18-compatibility-classification-and-migration-safety.md), and [PRD 38](../../prd/38-global-store-and-project-state.md) | Pre-v2 backup-and-install review and apply | [P1](01-setup-interview-and-recovery-correction.md) | Extracted-package backup and rollback inventory | None |

## Active Authority Baseline

The active PRD set remains the product authority. No archive gate or new PRD is needed. The maintenance is surgical. It adds two confirmed drift records and makes six current owners more exact.

The affected PRD files already include concurrent W19 R6 edits. Execution must preserve those edits and patch the current text. It must not restore older file versions.

## Candidate Decision Matrix

| Candidate | Decision | Owning PRD or product subject | Reason | Evidence |
| --- | --- | --- | --- | --- |
| Skills interview parity and early setup admission | `update-existing` | PRD 07 | Existing CLI lifecycle owner. | Duplicate source paths and installed transcript. |
| Shared selected-Skill interview contract | `update-existing` | PRD 08 | Existing Skills selection owner. | Current R-SKILL-SETUP contract lacks exact frame parity. |
| Legacy installed-project candidate gate | `update-existing` | PRD 10 | Existing package and release-proof owner. | Current package proof did not catch this installed path. |
| Plan-aware rollback and no-effect cleanup | `update-existing` | PRD 18 | Existing migration and rollback owner. | Resume is invalid when the saved plan is incomplete. |
| Failure fields and recovery evidence | `update-existing` | PRD 38 | Existing Store operation owner. | Current operation row cannot explain the first fault. |
| Early stop and safe command grammar | `update-existing` | PRD 39 | Existing setup, state, JSON, and MCP command owner. | Current setup error recommends a command that recovery rejects. |
| Confirmed installed drift | `update-existing` | PRD 03 | Living drift and risk owner. | Two distinct faults are confirmed. |
| New product PRD | `none` | Existing owners cover the full change. | This is a correction, not a new product boundary. | Ownership review above. |
| PRD index change | `none` | Current index remains accurate. | No PRD is created, renamed, removed, or moved. | Current document map. |
| New `NUAT-###` scenario | `none` | PRDs 46 and 50 remain sufficient. | The owner has implementation knowledge. Automated proof and a knowledgeable owner review answer the current decision. | Current testing authority. |

## Existing PRDs To Update

| Existing PRD | Owning sections | Current normative update | Preserved surrounding authority |
| --- | --- | --- | --- |
| [03 Risk Register](../../prd/03-open-questions-and-risk-register.md) | Confirmed Drift | Add separate records for interview divergence and self-contradictory recovery. | All current numbers, states, and unrelated risks. |
| [07 CLI Command Surface](../../prd/07-cli-command-surface-and-lifecycle.md) | Interactive Selection Contract; Lifecycle Commands | Require one exact Skills interview and an early pending-operation stop. | Command names, selection model, review/apply, backup, remove, and audit rules. |
| [08 Skills Catalog](../../prd/08-skills-catalog-and-distribution.md) | Explicit Selected-Skill Model | Require both entry points to use one frame and interaction contract. | Catalog, sources, trust, scope, payloads, ownership, and adoption rules. |
| [10 Packaging](../../prd/10-packaging-validation-and-release-reference.md) | Package Projection Proof | Add a fixed installed legacy-project candidate matrix. | Existing smoke, package, release, and Skill proof. |
| [18 Migration Safety](../../prd/18-compatibility-classification-and-migration-safety.md) | Ordered Migration, rollback | Derive resume/rollback from plan completeness and add proved no-effect rollback. | Backup, drift, ownership, path, and user-content rules. |
| [38 Global Store](../../prd/38-global-store-and-project-state.md) | R-LIFE, R-XFER, R-TEST | Retain safe failure detail and define plan-aware recovery state. | Store-only state, checkout binding, privacy, locks, and scoped recovery. |
| [39 Command Model](../../prd/39-cli-command-model-and-operation-registry.md) | R-SETUP, R-STATE, R-TEST | Stop before questions and render one permitted recovery action across CLI, JSON, and MCP. | Command tree, registry identity, and agent invariance. |

## Genuinely New Product PRDs

None. The current CLI, Skills, package, migration, Store, and command PRDs own the full result.

## Requirement History Entries

Add a `2026-09-15 — W19 R7` entry to PRDs 07, 08, 10, 18, 38, and 39. Each entry states the prior incomplete contract, the exact current rule, the observed reason, and a link to this plan and the design. The risk register uses its own numbered drift records and receives no requirement-history section.

## Affected Links, Risks, Plans, And Work

| Surface | Artifact | Required maintenance | Authority role |
| --- | --- | --- | --- |
| Risks | [PRD 03](../../prd/03-open-questions-and-risk-register.md) | Add D-034 and D-035. Keep them open until accepted installed proof closes them. | Living confirmed-drift record. |
| Plan | This directory | Keep one phase and the candidate gate. | Correction order and limits. |
| Work | [W19 R7 delta backlog](../../work/2026-09-15-w19-r7-setup-interview-and-recovery-correction/00-index.md) | Carry tasks, evidence decisions, target freeze, and owner gate. | Implementation queue. |
| Prior plans and work | W19 R3, R5, and R6 | `link-only`; preserve prior evidence. Do not rewrite completed records. | Lineage and past evidence. |
| History | Future P1 closeout record | Create only during an authorized closeout. | Execution history, not current product authority. |

## Phase Map

| File | Purpose |
| --- | --- |
| [01-setup-interview-and-recovery-correction.md](01-setup-interview-and-recovery-correction.md) | Implement the shared interview, early state gate, plan-aware recovery, failure detail, packaged proof, and owner acceptance in one phase. |

## Output Contract

- Design: `docs/designs/2026-09-15-setup-interview-and-recovery-correction.md`.
- Plan: this directory with `00-overview.md` and one phase file.
- PRDs: surgical changes to 03, 07, 08, 10, 18, 38, and 39.
- Delta backlog: `docs/work/2026-09-15-w19-r7-setup-interview-and-recovery-correction/` with `00-index.md` and one phase file.
- No code, Store, real-project, backup, installed CLI, archive, branch, commit, push, or publication change is part of this package-writing pass.

## Worker Ownership

Use the highest delegation tier that the implementation session permits. Keep write scopes separate where practical. Every worker must preserve concurrent edits and must not revert work outside its assigned scope.

| Worker role | Scope | Write scope | Dependencies | Deliverables |
| --- | --- | --- | --- | --- |
| Setup interaction owner | Shared Skills interview and early state admission | Setup and Skills UI modules plus focused tests | Current PRDs and saved-state contract | One interview and no-question pending stop. |
| Store recovery owner | Schema, status, recovery routing, and failure detail | Store and installation-state modules plus focused tests | Frozen recovery cases | Safe action derivation and compatible migration. |
| Package evidence owner | Isolated fixtures, packed candidate, and evidence report | Test/evidence paths only | Both code owners complete | One tested tarball and review-ready proof. |
| Validation owner | Cross-surface and contract checks | Bounded fixes returned to owners | Assembled candidate | Final results with no hidden baseline failure. |

## MCP Strategy

Use jdocmunch for project documents and jcodemunch for code and function signatures. Resolve each index first. Reindex when it is missing or stale. Use narrow direct reads only if reindexing fails. Treat the current files and user direction as authority.

## Dependencies

The shared interview must exist before both entry points can pass parity. The early recovery check must run before any interview. The Store schema and recovery rule must land before recovery output tests. All source and focused tests must pass before the tarball is built. The same tarball must pass isolated legacy cases before the owner reviews it. The real project remains unchanged until a later explicit approval.

## Validation

The phase uses V1-V8 in the [phase plan](01-setup-interview-and-recovery-correction.md). It covers exact interview parity, early no-write admission, incomplete and complete recovery cases, failure detail after restart, legacy backup and rollback, one extracted package, and Human Experience Review.

Automated Implementation Testing is required. Performance Testing is `not-needed-now` because no speed or load decision is open. Guided Progress Review is required for the owner to use the exact packaged terminal paths. Unassisted Goal Testing is `not-needed-now` because the current reviewer knows the defect and implementation context. A qualified separate executor can be considered only if a material unknown remains after the other proof.

Run the focused CLI suite, the full CLI suite, default validation, package smoke proof, PRD authority validation, link checks, path checks, and `git diff --check`. Report any old failure separately. Do not call the phase complete because a smaller suite passed.

## Intended Follow-On

- Route: `prd-generation`
- Next Prompt: [plan-to-prd-change.prompt.md](../../../.make-docs/system/prompts/plan-to-prd-change.prompt.md).
- Why: The current PRDs must state the exact correction before implementation.
- Coordinate Handoff: Carry `W19 R7` into requirement history and the one-phase work backlog.

The requested PRD reconciliation and backlog are included in this package. The next user decision is package acceptance. Implementation starts only after separate explicit approval.

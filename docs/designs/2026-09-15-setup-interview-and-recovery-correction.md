---
title: "Setup Interview and Recovery Correction"
kind: "design"
status: "draft"
coordinate: "W19 R7"
follow_on:
  route: "change-plan"
  next_prompt: "../../.make-docs/system/prompts/designs-to-plan-change.prompt.md"
  why: "Correct the shipped setup interview and recovery path before another CLI candidate is used on an existing project."
  coordinate_handoff: "Carry W19 R7 as the next revision of the W19 setup, Skills, Store, and migration line."
---

# Setup Interview and Recovery Correction

## Purpose

Define one bounded correction for two installed CLI failures. The correction makes `make-docs setup skills` use the normal Skills interview. It also makes setup detect and explain pending Store work before it asks the user to make new choices.

## Context

The installed `2.0.0-rc` CLI and the current built CLI have the same executable bytes. The failure is therefore in the current CLI source and not in an old global install.

The full setup flow renders its Skills interview in `packages/cli/src/wizard.ts`. The focused Skills command uses a second interview in `packages/cli/src/skills-ui.ts`. The two paths have different words, order, detail, and selection behavior. Full setup can also collect a changed Skill choice and reject that choice after the interview in `packages/cli/src/cli.ts`.

The affected existing project has a pending `setup.migration` Store operation. The record has an incomplete saved plan, no steps, equal before and after ledgers, and no active lock. The normal write path tells the user to preview resume. The recovery path then blocks resume because the plan is incomplete. This gives the user a command that cannot work.

The Store record does not retain a safe failure code and summary for this operation. The first fault can no longer be explained from the record. The terminal transcript does not prove that backup creation failed. The flow offered a backup choice and then stopped on a later validation error.

The real project has current user changes. This design does not authorize any write to that project or its Store records. Candidate proof must use an isolated project copy and an isolated Store first.

## Human Experience Intent

Impact: `direct`

Affected humans: People who add or change Skills, people who update an existing Make Docs project, and maintainers who recover a stopped setup operation.

Human goal or effect: Use one familiar setup interview, see a pending operation before making new choices, and receive a recovery command that can complete safely.

Experience promises:

- HX-1: Full setup and `setup skills` show the same Skills list, detail panel, selected summary, instructions, words, and key behavior for the same state.
- HX-2: Setup checks pending Store work before it asks an editable project, harness, resource, or Skill question.
- HX-3: The CLI offers resume only when the Store has a complete, verified plan that can resume. It offers rollback when the plan is incomplete.
- HX-4: An incomplete zero-step operation with equal ledgers and no active lock can finish a safe no-effect rollback. The user does not edit SQLite or delete a journal.
- HX-5: A stopped operation keeps a safe failure code, short summary, stage, and next action. Human output leads with the problem and action. Machine output keeps the same facts.
- HX-6: A backup promise is proved before any destructive project write. The CLI does not call a backup complete until the copy and Store index are verified.

Complexity kept out of the human path:

- People do not choose between two Skills interview models.
- People do not inspect `plan_complete`, step rows, ledger JSON, or lock rows.
- People do not guess whether resume or rollback is valid.
- People do not use the real project as the first test of a new candidate.

Evidence required:

- Exact interactive transcript and snapshot comparisons for full setup and `setup skills` from the same saved state.
- Focused tests that prove pending work stops all three setup entries before the first editable question and before any write.
- Store fixtures for an incomplete zero-step operation and a complete partial operation. The fixtures must prove the permitted next action and both dry-run and apply results.
- Failure-record tests that prove safe detail survives process exit and appears in plain text and JSON.
- One extracted-package candidate installed into isolated homes. It must pass a pre-v2 project, old managed blocks, backup, rollback, repeat setup, and Skills selection.
- A knowledgeable owner terminal review of the packaged candidate. Record each promise, the observed result, the owner response, the reviewer limit, and any follow-up.

## Decision

### Use one Skills interview component

Create one source-owned Skills interview model and renderer. Full setup and `setup skills` call that component with the same effective manifest, saved selection, scope, harness support, and trust data. The focused command can limit the final plan to Skill changes. It cannot change the interview grammar or selection rules.

The shared contract includes the list, active row, detail panel, selected summary, instructions, navigation keys, labels, empty state, and cancellation result. Snapshot and transcript tests compare both entry points from the same state.

### Check recovery state before the interview

All project setup entries read project and Store status before an editable question. If a pending operation owns the checkout, setup stops. It reports the operation type, saved-plan state, affected checkout, last safe stage, and one permitted next action. It does not collect choices that it cannot apply.

Read-only status keeps its current no-bootstrap rule. A missing or unreadable Store still fails safely for operations that need Store state.

### Derive the recovery action from saved proof

Recovery uses saved evidence, not a fixed resume hint.

- A complete plan with verified remaining steps can offer resume and rollback.
- An incomplete plan cannot offer resume. It offers rollback when rollback can be proved.
- An incomplete operation with zero steps, equal ledgers, and no active lock has no project effect to restore. Rollback marks that operation `rolled-back` in one Store transaction and leaves project files and the installation ledger unchanged.
- Changed, unknown, conflicting, or active-writer evidence blocks mutation. The CLI states what prevents a safe action.
- A completed, failed, or rolled-back operation does not block a new setup operation.

The same rule drives setup errors, `project state status`, `project state recover`, JSON output, and MCP output.

### Retain safe failure detail

The Store schema retains a stable failure code, a short safe summary, the stage that failed, and the last safe next action for installation operations. The fields do not store document bodies, secrets, raw terminal output, or private file content. A schema migration must preserve old rows and treat missing new fields as unknown.

The write path records failure detail before it releases the operation context when the Store is still safe to write. A second failure while recording the first fault does not erase the original project evidence or claim success.

### Gate the real project behind packaged proof

Build one tarball candidate. Install that exact tarball in isolated homes. Use separate Store roots and disposable project copies. The proof set includes a clean pre-v2 project with Skills off, a project with old managed blocks, the two recovery fixtures, verified backup and rollback, repeat setup, and exact Skills interview parity.

Do not apply the candidate to the real project until the automated proof passes and the owner accepts the Human Experience Review. A later real-project action needs separate approval and a fresh read-only state check.

### Use one implementation phase

The interview, state gate, recovery rule, Store detail, packaged proof, and acceptance form one release correction. Split them into ordered stages inside one phase. Do not close the phase after only the prompt fix or only the Store fix.

## Alternatives Considered

### Keep two interviews and copy the text

Rejected. Two renderers can drift again. Text parity alone would not preserve key behavior, detail state, or selection rules.

### Always tell the user to resume

Rejected. An incomplete plan cannot prove the missing steps. This is the current failed path.

### Delete an empty pending row automatically

Rejected. A raw delete hides history and can be unsafe when the evidence is not truly empty. A proved no-effect rollback keeps an explicit final result.

### Repair the real project first

Rejected. The project contains user changes. It is evidence for a later acceptance case, not the first place to test new recovery code.

### Add more phases

Rejected. The two faults share setup admission, Store state, package proof, and one release gate. More phases would allow a partial result to look ready.

## Consequences

The CLI will have less duplicate prompt code. Setup will stop earlier when recovery owns the checkout. Recovery output will become plan-aware. The Store will need a compatible schema change. Package tests will need disposable homes, Store roots, and legacy fixtures. The release gate will take longer than a unit-only fix, but it will test the form that failed for the user.

This design does not change the command names, Skill catalog, selected-Skill data model, backup location, Store ownership boundary, or real project content.

## Design Lineage

- Update Mode: `new-doc-related`
- Prior Design Docs: [Make Docs v2 Product Boundary and Missing Migration Recovery](2026-08-12-make-docs-v2-product-boundary-and-missing-migration-recovery.md), [Store-Owned Installation and Migration State](2026-09-09-store-owned-installation-and-migration-state.md), [First-Party Skills and Managed Adoption](2026-09-09-first-party-skills-and-managed-adoption.md), and [Static Harness Adapters and Conformance Retirement](2026-09-14-static-harness-adapters-and-conformance-retirement.md).
- Reason: This design corrects shipped behavior that breaks the accepted shared-setup, selected-Skill, Store, and recovery rules. A new design keeps the observed failure and release gate together without rewriting earlier completed evidence.

## Intended Follow-On

- Route: `change-plan`
- Next Prompt: [designs-to-plan-change.prompt.md](../../.make-docs/system/prompts/designs-to-plan-change.prompt.md).
- Why: Make the active CLI, Skills, Store, migration, and package requirements exact before implementation.
- Coordinate Handoff: Carry `W19 R7` into the PRD maintenance record and one-phase delta backlog.

This design is part of the requested package. It does not authorize implementation, a real-project recovery, a CLI install, a commit, or publication.

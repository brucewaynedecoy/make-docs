---
title: "Phase 1: Template Resources and Dogfood"
kind: "work"
status: "completed"
coordinate: "W28 R0 P1"
source:
  type: "plan"
  path: "docs/plans/2026-11-18-w28-r0-wave-revision-rules/02-resource-and-code-changes.md"
---

# Phase 1: Template Resources and Dogfood

## Purpose

Make the shipped agent instructions state the coordinate selection and amendment rules. Without this phase, agents keep the old rule, which sends any revise, rework, correct, standardize, or finish request to the next Revision.

## Overview

This phase changes four kinds of resources in `packages/docs/template/`:

- the Wave Model reference and the workflows that repeat its old trigger list;
- the contracts and prompts that require a separate delta backlog;
- the plan and work templates, which gain Change History and new classification values;
- the plan and work routers.

After review, each changed template-owned file is reseeded into `./.make-docs/` and `./docs/`. Project-owned files are not overwritten.

The phase also rewrites the user concept guide so a reader can understand both the new rules and older records.

## Human Experience Outcome

- **Impact and governing promise:** `direct`. A coordinate tells the reader the kind of change. Gated actions produce one self-contained owner question. Other choices name the choice and the reason. Change History shows scope changes.
- **Intended human outcome:** an agent that follows the shipped instructions picks the coordinate that the PRD 14 rules give, and asks the owner only at the gates. A maintainer who reads the concept guide can tell what a new `W`, `R`, or `P` means.
- **Human-facing surface:** `wave-model.md`, the plan and work templates, the routers, and `docs/assets/user/concepts-wave-revision-phase-coordinates.md`.
- **Implementation work:** Stages 1 to 3.
- **Evidence source:**
  - text checks with `grep` and `cmp`;
  - the PRD authority validator and the path-hygiene validator;
  - the P4 walkthrough and the P4 Human Experience Review.
- **Executor:** the implementing agent.
- **Accepted obligation:** none.

The governing requirements are [PRD 14](../../prd/14-lifecycle-workflow-and-coverage-passes.md#coordinate-selection-and-amendment) R-COORD-1 to R-COORD-21, and [the Human Experience Contract](../../../.make-docs/system/contracts/human-experience-contract.md).

## Current Testing Decisions

| Testing type | Current decision | Decision record or `not-needed-now` reason |
| --- | --- | --- |
| Automated Implementation Testing | selected | Run the PRD authority and path-hygiene validators, a `cmp` of each template and dogfood pair, and a `grep` for retired rule text. |
| Performance Testing | not-needed-now | This phase changes text only. No performance candidate applies. |
| Guided Progress Review | not-needed-now | P4 reviews the shipped instructions as a whole. An earlier review cannot change a current decision. |
| Unassisted Goal Testing | not-needed-now | No current decision needs an unassisted human run. |

There are no performance candidates.

## Source PRD Docs

- [14 Lifecycle Workflow and Coverage Passes](../../prd/14-lifecycle-workflow-and-coverage-passes.md)
- [04 Glossary](../../prd/04-glossary.md)
- [06 Template Contracts and Generated Assets](../../prd/06-template-contracts-and-generated-assets.md) (upstream-first mutation order only)

## Source Obligations, Scenarios, And Findings

- `none`
- `none`
- `none`

## Stage 1 - Wave Model and References

### Tasks

- [x] T1: Rewrite `packages/docs/template/.make-docs/system/references/wave-model.md`. Change four parts:
  - **Terms:** Wave as the scope, Revision as a revision Wave, and new rows for revision Phase and Phase complete. Remove the "redesigned design" example.
  - **Line 7:** remove the claim that the encoding "is extended to designs".
  - **`## Resolution Rules`:** replace it with `## Decision Procedure`. That section holds the five steps, the significant deviation test, the revision Wave test, and the owner gates. Keep the scan, `w1-r0`, and "no drift to newer Waves" rules.
  - **New sections:** add `## Change History`, `## Rebuild From The PRD`, and `## Adoption`. Follow PRD 14 R-COORD-1 to R-COORD-21.
- [x] T2: In `planning-workflow.md`, change two parts:
  - **Line 37:** replace the lineage line with the decision procedure.
  - **Lines 65, 92, and 109:** replace "scoped delta vs regenerated full backlog" with three choices: in-place amendment, rebuild (owner gate), or a new backlog for a new Wave or a revision Wave.
- [x] T3: In `execution-workflow.md` (around line 161) and `prd-change-management.md` (lines 120–121), replace the delta-backlog rule. PRD maintenance work goes into the lineage Wave's backlog, under PRD 14 R-COORD-17.
- [x] T4: In `lifecycle.md` `## Default Ordering`, add one pointer: approved plans and backlogs are amended under `wave-model.md`, with a Change History entry.

### Acceptance criteria

- A1: `wave-model.md` states the five-step procedure, both tests, the gate list, the Change History format (five `Kind` values and eight fields), the rebuild rule, and the adoption rule. Each one matches PRD 14 R-COORD-1 to R-COORD-21.
- A2: No shipped reference keeps "revises, reworks, corrects, standardizes, or finishes" as a rule for choosing a Revision.
- A3: No shipped reference requires a separate delta backlog for PRD maintenance.

### Dependencies

- PRD 14, PRD 51, and PRD 04 pass the PRD authority validator. They passed on 2026-11-18.

## Stage 2 - Contracts, Prompts, and Templates

### Tasks

- [x] T5: In `contracts/output-contract.md`, change four parts:
  - **Line 37:** change-oriented work uses the lineage W/R directory.
  - **Line 220:** keep the task-ID rule.
  - **Line 261:** replace the delta-directory rule.
  - **Line 264:** active-work updates also need a Change History entry after the first commit.
- [x] T6: In `contracts/design-contract.md` line 51, `Coordinate Handoff` names the classification from the decision procedure and its test evidence. Remove the old trigger list.
- [x] T7: In `prompts/designs-to-plan-change.prompt.md` line 16 and in `prompts/prd-change-to-work.prompt.md`, resolve the coordinate with the decision procedure, stop at owner gates, and amend the lineage plan or backlog with Change History. Otherwise, create a new one only for a new Wave or a revision Wave.
- [x] T8: In `templates/plan-overview.md`, `plan-prd.md`, `plan-prd-change.md`, and `plan-prd-decompose.md`, make four changes:
  - Classification becomes `new-wave` or `revision-wave`, with a note that legacy `revision` means `revision-wave`.
  - The Evidence line names the test that applied.
  - Add an optional `## Change History` with the PRD 14 R-COORD-14 entry shape.
  - In `plan-prd-change.md`, change "Delta backlog" to "Work backlog (lineage or new)".
- [x] T9: In `templates/work-index.md`, add the optional `## Change History` at the end. In `templates/work-phase.md`, add an optional `Revises:` line under `## Purpose`.

### Acceptance criteria

- A4: The four plan templates offer `new-wave` or `revision-wave` and explain the legacy `revision` alias.
- A5: The plan and work index templates carry an optional `## Change History` whose entry heading and eight fields match PRD 14 R-COORD-14. The work phase template carries the optional `Revises:` line.
- A6: No shipped contract or prompt requires a delta backlog or gives the next Revision for every correction.

### Dependencies

- Stage 1 fixes the `wave-model.md` section names that these files link to.

## Stage 3 - Routers, Dogfood, and Concept Guide

### Tasks

- [x] T10: In `packages/docs/template/docs/plans/AGENTS.md` and `CLAUDE.md`, replace "Plans are written before execution, not retroactively" with the amendment rule. In `packages/docs/template/docs/work/AGENTS.md` and `CLAUDE.md`, add the in-place edit and Change History line.
- [x] T11: Reseed each template-owned file changed in T1 to T10 into `./.make-docs/` and `./docs/`, with review. Confirm that each pair is byte-identical. Confirm that no project-owned file changed. Do not edit `packages/cli/template/` by hand.
- [x] T12: Rewrite the coordinate-choice sections of `docs/assets/user/concepts-wave-revision-phase-coordinates.md` (around lines 74–79 and 108–111) for the PRD 14 procedure. Add a short note on older records: before W28, Revisions were also used for fixes and add-ons.
- [x] T13: Run `grep` over `packages/docs/template/` and the dogfood copies for the retired trigger list and the delta-backlog rule. Run `make-docs run prd authority validate --target-root .` and `make-docs project path-hygiene validate`.
- [x] T14: Check the resource catalog and digests with the repository's existing tooling. Follow these steps:
  1. Confirm that `packages/docs/template/.make-docs/system-resources.catalog.json` and its dogfood copy still list every changed resource under an unchanged URI. If a resource was added, renamed, or removed, update both catalog copies.
  2. Run `npm run validate:defaults -w packages/cli`, which runs the consistency, template-link, and package-safety tests.
  3. Run `node scripts/copy-template-to-cli.mjs` and `npm run build -w packages/cli` to refresh the bundled template.
  4. With that built CLI, run `make-docs setup --dry-run --json` on this repository. Confirm that the reseeded local resource bodies match the provider digests that `packages/cli/src/operations/resource/provider.ts` computes. Do not apply setup without Tyler's go-ahead.
  5. Record the results in `evidence.md`.

### Acceptance criteria

- A7: Each changed template-owned file and its dogfood copy match under `cmp`. The reseed changes no project-owned file.
- A8: The concept guide lets a reader tell what a new `W`, `R`, or `P` means for a new change, and recognize the older Revision pattern, without opening `wave-model.md`.
- A9: The `grep` finds no retired rule text outside history or explanatory notes. Both validators pass.
- A30: Both catalog copies list every shipped resource under its current URI. `npm run validate:defaults -w packages/cli` passes. The built-CLI setup dry run reports no changed or conflicting reseeded resource body. Any remaining digest mismatch is recorded with its cause, and it blocks P1 closeout.

### Dependencies

- Stages 1 and 2 are complete.

### Closeout Notes

- Four testing decisions: Automated Implementation Testing selected and passed (PRD authority and path-hygiene validators, router check, `cmp` parity, retired-text search, and `validate:defaults`). Performance Testing, Guided Progress Review, and Unassisted Goal Testing are `not-needed-now`.
- Performance evidence: none. This phase changes text only.
- Human Experience Review: P4 reviews the owner-facing samples against the shipped text. Within P1, the concept guide and `wave-model.md` give the coordinate meaning before internal detail. The `## Deterministic Support` section describes P2 facts that do not exist until P2 lands.
- Optional experience handoff: not applicable until P4.
- Explicit human acceptance gate: none.
- Evidence report: [P1 Template Resources and Dogfood](evidence.md#p1-template-resources-and-dogfood).
- Phase / capability status: Phase complete on commit. Capability partial: the snapshot facts (P2), Skills (P3), and validation and review (P4) remain.

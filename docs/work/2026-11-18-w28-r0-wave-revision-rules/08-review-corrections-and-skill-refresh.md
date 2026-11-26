---
title: "Phase 8: Review Corrections and Skill Refresh"
kind: "work"
status: "completed"
coordinate: "W28 R0 P8"
source:
  type: "plan"
  path: "docs/plans/2026-11-18-w28-r0-wave-revision-rules/02-resource-and-code-changes.md"
---

# Phase 8: Review Corrections and Skill Refresh

## Purpose

Correct the CodeRabbit findings on PR #64 that arrived after P7. Fix the setup and Skill adoption defects that blocked the installed Skill refresh (D-054 and D-055). Refresh the installed Skills so the installed `backlog-review` Skill accepts version 2 snapshots.

Revises: [P2](02-cli-snapshot-facts-and-rule.md)

## Overview

This is a revision Phase under the `wave-model.md` decision procedure.

- P2 and P7 are complete and committed. The snapshot fix corrects a defect inside P2's result. The design and guide fixes state rules that the owner already decided. No fix reverses an approach, redoes two completed Phases, or needs its own design, so no revision Wave test passes.
- D-054 and D-055 are CLI defects outside W28's plan. They blocked P7's Skill refresh. The owner chose to fix them in W28 on 2026-11-19, and the index Change History records that decision.
- The owner approved each Store write: the setup run, the resource choice repair, and the Skill sync.

## Human Experience Outcome

- **Impact and governing promise:** `direct`. A reviewed setup or adoption plan does what it shows. A routine sync never plans to delete local system resources because a choice was never saved. The installed backlog review works with the current CLI.
- **Intended human outcome:** full setup names `make-docs setup skills` when it leaves Skill changes. An adoption review of an older install names `make-docs setup` as the first step instead of reporting ready. A commented-out heading no longer counts as a live section.
- **Human-facing surface:** `make-docs setup` and `make-docs setup skills --adopt-existing` plans and results, the installed Skills, the snapshot output, the design, and the user route guide.
- **Implementation work:** Stage 1.
- **Evidence source:** Automated Implementation Testing, the real Store repair and Skill sync, and document review.
- **Executor:** the implementing agent, with the owner installing each package build.
- **Accepted obligation:** none.

## Current Testing Decisions

| Testing type | Current decision | Decision record or `not-needed-now` reason |
| --- | --- | --- |
| Automated Implementation Testing | selected | Regression tests for each defect, the focused setup, Skill, and backlog suites, `npm test`, `validate:defaults`, the build, `smoke:pack:local`, and two candidate packs. |
| Performance Testing | not-needed-now | No change affects a performance decision. |
| Guided Progress Review | not-needed-now | The owner reviewed each Store step as it ran. |
| Unassisted Goal Testing | not-needed-now | No current decision needs an unassisted human run. |

There are no performance candidates.

## Source PRD Docs

- [51 Backlog Review and Reporting](../../prd/51-backlog-review-and-reporting.md) (R-BACKLOG-SNAPSHOT-27, R-BACKLOG-RULES-11)
- [14 Lifecycle Workflow and Coverage Passes](../../prd/14-lifecycle-workflow-and-coverage-passes.md) (R-COORD-4, R-COORD-21)
- [08 Skills Catalog and Distribution](../../prd/08-skills-catalog-and-distribution.md) (R-SKILL-SETUP-6)
- [03 Open Questions and Risk Register](../../prd/03-open-questions-and-risk-register.md) (D-054, D-055)

## Source Obligations, Scenarios, And Findings

- `none`
- `none`
- The CodeRabbit review of PR #64 at `0e6262ed`, D-054, and D-055

## Stage 1 - Corrections

### Tasks

- [x] T1: Blank HTML comments in the whole phase or index body, keeping line breaks, before `snapshot.ts` finds the Closeout Notes or Change History section. Add tests for a commented-out Closeout Notes heading, a commented-out Change History heading, and the evidence line after an earlier comment.
- [x] T2: State in the design's CLI twin section that `committed` describes the current working tree, and that the agent decides prior completion from history. State in the user route guide that completed work gets a revision Phase unless the revision Wave test passes.
- [x] T3: D-055: keep an unset resource choice unset in the setup migration stage plan. Show Skill file changes that full setup leaves as `skip`, and name `make-docs setup skills` in the dry run and the result. Add a regression test for each.
- [x] T4: D-054: validate the prepared Store record in the Skill adoption review, and block an older install record with the `make-docs setup` route. Add a regression test.
- [x] T5: Repair this repository's saved resource choice with `make-docs setup reconfigure --project-resources all`, then refresh the installed Skills with `make-docs setup skills`, using the owner-installed build.
- [x] T6: Last, pack the 2.0.9 candidate twice and save its matching SHA-256 in `.github/release-candidates/v2.0.9.sha256`.

### Acceptance criteria

- A45: A Closeout Notes or Change History heading inside an HTML comment does not start a section. The evidence line of a live section stays exact after an earlier multi-line comment.
- A46: The design and the user route guide agree with `wave-model.md` on the `committed` fact and on the revision Wave test for completed work.
- A47: After a sync of an older install with no saved resource choice, the choice stays unset and a repeat dry run plans no removal. Full setup shows the Skill changes it leaves as `skip` and names `make-docs setup skills`. Each test fails without its fix.
- A48: An adoption review of an install recorded by an older CLI is blocked with the `make-docs setup` route, and the apply refuses it. The test fails without the fix.
- A49: `preflight`, `backlog-review`, `factory`, and `human-experience` under `.agents/skills/` match `packages/skills/`. Repeat dry runs of `make-docs setup` and `make-docs setup skills` plan no change. The `.claude/skills/*` entries stay links, and the MCP entries keep their command path.
- A50: Two packs of the 2.0.9 candidate have the same SHA-256, and `.github/release-candidates/v2.0.9.sha256` holds it as one lowercase hex line.

### Dependencies

- P1 to P7 are complete.

### Closeout Notes

- Four testing decisions: Automated Implementation Testing selected and passed. See the [evidence](evidence.md#p8-review-corrections-and-skill-refresh). Performance Testing, Guided Progress Review, and Unassisted Goal Testing are `not-needed-now`.
- Performance evidence: none.
- Human Experience Review: setup and adoption plans now match what they apply, and each names the next command when it leaves work to another command. The installed backlog review works with the current CLI again.
- Optional experience handoff: not applicable.
- Explicit human acceptance gate: none.
- Evidence report: [P8 Review Corrections and Skill Refresh](evidence.md#p8-review-corrections-and-skill-refresh).
- Phase / capability status: Phase complete on commit. D-054 and D-055 are closed.

---
title: "Phase 10: Third Review Corrections"
kind: "work"
status: "completed"
coordinate: "W28 R0 P10"
source:
  type: "plan"
  path: "docs/plans/2026-11-18-w28-r0-wave-revision-rules/02-resource-and-code-changes.md"
---

# Phase 10: Third Review Corrections

## Purpose

Correct the CodeRabbit findings on PR #64 at `73f0ae00` that are defects in W28's own code. Record the backlog review display and widget findings as open drift for a separate Wave.

Revises: [P9](09-second-review-corrections.md)

## Overview

This is a revision Phase under the `wave-model.md` decision procedure.

- P8 and P9 are complete and committed. Two fixes correct defects inside their results: the `make-docs setup skills` route and the snapshot code scan. No fix reverses an approach, redoes two completed Phases, or needs its own design, so no revision Wave test passes.
- The other findings are W25 R0 backlog review display and MCP App widget behavior, outside W28's plan. One needs a product decision. On 2026-11-20 the owner chose to defer them. PRD 03 records them as D-056 and D-057.
- No Skill bundle or widget changes, so no installed Skill sync or Store write is needed.

## Human Experience Outcome

- **Impact and governing promise:** `direct`. Setup names a route that works from the folder where the person ran it. Snapshot facts treat code as literal text.
- **Intended human outcome:** a person who runs setup with `--target` gets a `make-docs setup skills` route with the same target. A fence marker inside an HTML comment, or a line that mixes fence markers, no longer hides a live section.
- **Human-facing surface:** the `make-docs setup` dry run and result, and the snapshot output.
- **Implementation work:** Stage 1.
- **Evidence source:** Automated Implementation Testing and document review.
- **Executor:** the implementing agent.
- **Accepted obligation:** none.

## Current Testing Decisions

| Testing type | Current decision | Decision record or `not-needed-now` reason |
| --- | --- | --- |
| Automated Implementation Testing | selected | Regression tests for each defect, the focused suites, `npm test`, `validate:defaults`, the build, `smoke:pack:local`, and two candidate packs. |
| Performance Testing | not-needed-now | The code scan stays linear in the body text. No target can change a current decision. |
| Guided Progress Review | not-needed-now | The owner chose which findings to fix and which to defer. |
| Unassisted Goal Testing | not-needed-now | No current decision needs an unassisted human run. |

There are no performance candidates.

## Source PRD Docs

- [51 Backlog Review and Reporting](../../prd/51-backlog-review-and-reporting.md) (R-BACKLOG-SNAPSHOT-27, R-BACKLOG-RULES-11)
- [08 Skills Catalog and Distribution](../../prd/08-skills-catalog-and-distribution.md) (R-SKILL-SETUP-6)
- [03 Open Questions and Risk Register](../../prd/03-open-questions-and-risk-register.md) (D-056, D-057)

## Source Obligations, Scenarios, And Findings

- `none`
- `none`
- The CodeRabbit review of PR #64 at `73f0ae00`

## Stage 1 - Corrections

### Tasks

- [x] t1: Name `--target <folder>` in the `make-docs setup skills` route when setup ran with a target, and quote a folder that is not shell-safe. Count the Skill changes setup leaves again after setup plans again. Update the tests.
- [x] t2: Track HTML comment and fenced code state together when the snapshot masks code, so a fence marker inside a comment opens no block. Close a fenced block only on a line of the same marker, at least as long as the opener. Add tests.
- [x] t3: Record the deferred backlog review display findings as D-056 and the widget refresh finding as D-057 in PRD 03.
- [x] t4: Last, pack the 2.0.9 candidate twice and save its matching SHA-256 in `.github/release-candidates/v2.0.9.sha256`.

### Acceptance criteria

- A56: The dry run and the result name `make-docs setup skills --target <folder>` when setup ran with a target. A folder with a space is quoted. The count matches the final plan.
- A57: A fence marker inside an HTML comment does not hide a later live Closeout Notes section. A line that mixes fence markers does not close a fenced block. Each test fails without the fix.
- A58: PRD 03 records D-056 and D-057 as open, with the owner's deferral. The Skill bundle and widget generators produce no change.
- A59: Two packs of the 2.0.9 candidate have the same SHA-256, and `.github/release-candidates/v2.0.9.sha256` holds it as one lowercase hex line.

### Dependencies

- P1 to P9 are complete.

### Closeout Notes

- Four testing decisions: Automated Implementation Testing selected. The focused suites, `validate:defaults`, the build, and `smoke:pack:local` passed. `npm test` had 2 failures, both the known Node 26 stdio cases in `mcp-app-contract.test.ts`. See the [evidence](evidence.md#p10-third-review-corrections). Performance Testing, Guided Progress Review, and Unassisted Goal Testing are `not-needed-now`.
- Performance evidence: none.
- Human Experience Review: the setup route works from any folder. Comment and fence edge cases no longer change snapshot facts.
- Optional experience handoff: not applicable.
- Explicit human acceptance gate: none.
- Evidence report: [P10 Third Review Corrections](evidence.md#p10-third-review-corrections).
- Phase / capability status: Phase complete on commit. D-056 and D-057 stay open for a separate Wave.

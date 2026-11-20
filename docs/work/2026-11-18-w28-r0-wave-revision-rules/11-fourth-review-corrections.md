---
title: "Phase 11: Fourth Review Corrections"
kind: "work"
status: "completed"
coordinate: "W28 R0 P11"
source:
  type: "plan"
  path: "docs/plans/2026-11-18-w28-r0-wave-revision-rules/02-resource-and-code-changes.md"
---

# Phase 11: Fourth Review Corrections

## Purpose

Correct the CodeRabbit findings on PR #64 at `9a017abf`.

Revises: [P10](10-third-review-corrections.md)

## Overview

This is a revision Phase under the `wave-model.md` decision procedure.

- P10 is complete and committed. Each fix corrects a defect inside P10's result: the target quoting in the `make-docs setup skills` route, two fence cases in the snapshot code scan, and the P10 testing closeout text. No fix reverses an approach, redoes two completed Phases, or needs its own design, so no revision Wave test passes.
- No Skill bundle or widget changes, so no installed Skill sync or Store write is needed.

## Human Experience Outcome

- **Impact and governing promise:** `direct`. Setup names a route that a person can copy into the shell they use. Snapshot facts treat code as literal text.
- **Intended human outcome:** a Windows path with a space in the `make-docs setup skills` route works in Command Prompt. A CRLF fenced block, or a line of inline code that starts with three backticks, no longer hides a live section.
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
| Guided Progress Review | not-needed-now | The owner told the agent to keep correcting review findings. |
| Unassisted Goal Testing | not-needed-now | No current decision needs an unassisted human run. |

There are no performance candidates.

## Source PRD Docs

- [51 Backlog Review and Reporting](../../prd/51-backlog-review-and-reporting.md) (R-BACKLOG-SNAPSHOT-27, R-BACKLOG-RULES-11)
- [08 Skills Catalog and Distribution](../../prd/08-skills-catalog-and-distribution.md) (R-SKILL-SETUP-6)

## Source Obligations, Scenarios, And Findings

- `none`
- `none`
- The CodeRabbit review of PR #64 at `9a017abf`

## Stage 1 - Corrections

### Tasks

- [x] t1: Quote the target in the `make-docs setup skills` route with the double-quoted form that other make-docs next actions use. Make the tests expect that form on every platform.
- [x] t2: Accept a CRLF closing fence in the snapshot code scan. Open no backtick fence when the rest of the line contains a backtick. Add tests.
- [x] t3: State the P10 `npm test` result in its testing closeout.
- [x] t4: Last, pack the 2.0.9 candidate twice and save its matching SHA-256 in `.github/release-candidates/v2.0.9.sha256`.

### Acceptance criteria

- A60: The route quotes the target as `"<folder>"`, for a POSIX path and for a Windows path with a space. The tests build the expected route from the same form, so they pass on Windows.
- A61: A CRLF fenced block closes and does not hide later live Closeout Notes. A line such as ```` ```literal``` ```` opens no fenced block. Each test fails without the fix.
- A62: The P10 closeout names the 2 known `npm test` failures.
- A63: Two packs of the 2.0.9 candidate have the same SHA-256, and `.github/release-candidates/v2.0.9.sha256` holds it as one lowercase hex line.

### Dependencies

- P1 to P10 are complete.

### Closeout Notes

- Four testing decisions: Automated Implementation Testing selected. The focused suites, `validate:defaults`, the build, and `smoke:pack:local` passed. `npm test` had only the known environment failures. See the [evidence](evidence.md#p11-fourth-review-corrections). Performance Testing, Guided Progress Review, and Unassisted Goal Testing are `not-needed-now`.
- Performance evidence: none.
- Human Experience Review: the setup route can be copied into Command Prompt. More code shapes stay literal in snapshot facts.
- Optional experience handoff: not applicable.
- Explicit human acceptance gate: none.
- Evidence report: [P11 Fourth Review Corrections](evidence.md#p11-fourth-review-corrections).
- Phase / capability status: Phase complete on commit.

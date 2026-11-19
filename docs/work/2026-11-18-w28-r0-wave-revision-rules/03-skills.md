---
title: "Phase 3: Skills"
kind: "work"
status: "active"
coordinate: "W28 R0 P3"
source:
  type: "plan"
  path: "docs/plans/2026-11-18-w28-r0-wave-revision-rules/02-resource-and-code-changes.md"
---

# Phase 3: Skills

## Purpose

Make the first-party Skills that plan, review, or prepare work follow the PRD 14 rules and the P2 catalog entries.

## Overview

Three Skills under `packages/skills/` change:

- `decompose-codebase` offers `new-wave` or `revision-wave`.
- `backlog-review` maps `BACKLOG-RULE-017` and `BACKLOG-AGENT-018`. It also explains reopened Waves.
- `preflight` applies the decision procedure and stops at owner gates.

## Human Experience Outcome

- **Impact and governing promise:** `direct`. Gated actions produce one self-contained owner question. Each other choice names the choice and the reason.
- **Intended human outcome:** two outcomes.
  - An owner who runs preflight on a change gets the coordinate choice and its reason, or one gated question.
  - A backlog review names the revision Phase when it explains why a completed Wave is active again.
- **Human-facing surface:** Skill replies and backlog-review reports.
- **Implementation work:** Stage 1.
- **Evidence source:** a parity check against the catalog, and the P4 Human Experience Review samples.
- **Executor:** the implementing agent.
- **Accepted obligation:** none.

The governing requirements are [PRD 14](../../prd/14-lifecycle-workflow-and-coverage-passes.md#coordinate-selection-and-amendment) R-COORD-11 and R-COORD-12, and [PRD 51](../../prd/51-backlog-review-and-reporting.md) R-BACKLOG-RULES-3, -11, and -12. See also [the Human Experience Contract](../../../.make-docs/system/contracts/human-experience-contract.md).

## Current Testing Decisions

| Testing type | Current decision | Decision record or `not-needed-now` reason |
| --- | --- | --- |
| Automated Implementation Testing | selected | Run any existing Skill packaging or rule-map tests, plus a text parity check against `catalog.ts`. |
| Performance Testing | not-needed-now | This phase changes text only. |
| Guided Progress Review | not-needed-now | P4 covers the review of the sample replies. |
| Unassisted Goal Testing | not-needed-now | No current decision needs an unassisted human run. |

There are no performance candidates.

## Source PRD Docs

- [14 Lifecycle Workflow and Coverage Passes](../../prd/14-lifecycle-workflow-and-coverage-passes.md)
- [51 Backlog Review and Reporting](../../prd/51-backlog-review-and-reporting.md)
- [08 Skills Catalog and Distribution](../../prd/08-skills-catalog-and-distribution.md) (distribution rules, unchanged)

## Source Obligations, Scenarios, And Findings

- `none`
- `none`
- `none`

## Stage 1 - Skill Text

### Tasks

- [ ] t1: In `packages/skills/decompose-codebase/assets/templates/decomposition-plan.md` line 16, set Classification to `new-wave` or `revision-wave`.
- [ ] t2: In `packages/skills/backlog-review/references/rule-map.md`, add rows for `BACKLOG-RULE-017` and `BACKLOG-AGENT-018` that match the P2 catalog entries.
- [ ] t3: In `packages/skills/backlog-review/references/review-method.md`, add two rules. The status reason for a reopened Wave names its revision Phase. A `BACKLOG-VAL-017` finding is an Attention item.
- [ ] t4: In `packages/skills/preflight/SKILL.md`, add one line: classify each requested change with the `wave-model.md` decision procedure, and stop at its owner gates.
- [ ] t5: Run any existing Skill tests, and compare the rule-map rows with `catalog.ts`.

### Acceptance criteria

- A19: The rule-map rows for 017 and 018 match the catalog's identifiers, rule class, support state, and one-sided reason.
- A20: No changed Skill offers the bare `revision` classification, or sends every correction to a new Revision.

### Dependencies

- P2 Stage 3 is complete.

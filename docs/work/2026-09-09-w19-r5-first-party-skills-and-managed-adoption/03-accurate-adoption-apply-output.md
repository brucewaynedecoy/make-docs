---
title: "Phase 3: Accurate Adoption Apply Output"
kind: "work"
status: "completed"
coordinate: "W19 R5 P3"
source:
  type: "prd"
  path: "docs/prd/39-cli-command-model-and-operation-registry.md"
---

# Phase 3: Accurate Adoption Apply Output

## Purpose

Make the `make-docs setup skills --adopt-existing … --review <digest>` output tell the truth about what happens. Today a real apply first prints the dry-run summary, which says "No adoption changes have been applied." and tells the person to repeat the command with `--review`. It then applies the adoption, but prints no readable result.

Revises: [P1](01-skills-and-managed-adoption.md)

## Overview

This is a revision Phase under the `wave-model.md` decision procedure. P1 delivered the adoption command and its output, and P1 and P2 are complete and committed. The fix changes one P1 result, the adoption output. It reverses no approach, redoes no other completed Phase, and needs no design or multi-phase plan, so no revision Wave test passes.

The command builds one summary for every mode. Each mode now gets its own summary:

- A dry run keeps its current text and its `--review <digest>` next action.
- An apply with the matching digest says that it is applying the reviewed adoption, then prints a result line after the apply.
- An apply with a different digest says that the digest does not match and that nothing was applied.
- `--yes` without a digest, and an interactive confirmation, name the step that applies the review, not a dry run that the person did not run.

The apply JSON keeps the review it applied, without the review's own next action. A top-level `nextAction` describes the result. The defect is recorded as D-058 in [PRD 03](../../prd/03-open-questions-and-risk-register.md). The released `make-docs` 2.0.8 has the same output.

## Human Experience Outcome

- **Impact and governing promise:** `direct`. A maintainer who applies a reviewed adoption reads output that matches what the command did.
- **Intended human outcome:** the apply output says that the adoption is applying and then that it completed. It never says that nothing was applied after it applied changes, and it never asks for a repeat of a step that already ran.
- **Human-facing surface:** the `make-docs setup skills` adoption summary on stderr and the JSON result on stdout.
- **Implementation work:** Stage 1.
- **Evidence source:** Automated Implementation Testing, plus a real built-CLI adoption in a throwaway project.
- **Executor:** the implementing agent.
- **Accepted obligation:** none.

The governing requirements are [PRD 39](../../prd/39-cli-command-model-and-operation-registry.md) R-SKILL-ADOPT-CMD-4, which requires output to explain the material effect and the safe next action, and R-SKILL-ADOPT-CMD-5, which forbids a success claim without verified completion. They already state the correct behavior, so no requirement changes.

## Current Testing Decisions

| Testing type | Current decision | Decision record or `not-needed-now` reason |
| --- | --- | --- |
| Automated Implementation Testing | selected | Output assertions for each mode in `w19-r5-skills-command.test.ts`, the focused adoption suites, `npm test`, `validate:defaults`, the build, and `smoke:pack:local`. |
| Performance Testing | not-needed-now | The change only selects output text. No performance decision depends on it. |
| Guided Progress Review | not-needed-now | A real built-CLI adoption shows the output. |
| Unassisted Goal Testing | not-needed-now | No current decision needs an unassisted human run. |

There are no performance candidates.

## Source PRD Docs

- [39 CLI Command Model and Operation Registry](../../prd/39-cli-command-model-and-operation-registry.md) (R-SKILL-ADOPT-CMD-4 and -5, unchanged)
- [28 Shared Agentics Installation and Harness Exposure](../../prd/28-shared-agentics-installation-and-harness-exposure.md) (R-SKILL-ADOPT-2, unchanged)
- [03 Open Questions and Risk Register](../../prd/03-open-questions-and-risk-register.md) (D-058)

## Source Obligations, Scenarios, And Findings

- `none`
- `none`
- D-058 in [PRD 03](../../prd/03-open-questions-and-risk-register.md), found during the W19 R5 P2 throwaway adoption on 2026-11-20

## Stage 1 - Adoption Output By Mode

### Tasks

- [x] t1: In `packages/cli/src/skills-command.ts`, select the adoption summary text and next action by mode: dry run, apply with the matching digest, apply with another digest, `--yes` without a digest, and interactive confirmation.
- [x] t2: After an apply, print a result line on stderr. In the JSON result, add a top-level `nextAction` for the result and leave out the applied review's own `nextAction`.
- [x] t3: Add output assertions for each mode to `packages/cli/tests/w19-r5-skills-command.test.ts`, and confirm that they fail without the change.
- [x] t4: Describe the apply output in `docs/assets/user/skills-installing-and-managing-skills.md`.
- [x] t5: Run the focused tests, `npm test`, `validate:defaults`, the build, `smoke:pack:local`, and a real built-CLI adoption in a throwaway project.

### Acceptance criteria

- A20: An apply with the matching digest prints "Applying this reviewed adoption now." and then a completed result line. Its output does not contain "No adoption changes have been applied." or a `--review` next action.
- A21: An apply with a different digest, `--yes` without a digest, and an interactive confirmation each say that nothing was applied and name the step that applies the review. None of them says to replace `--dry-run`.
- A22: The apply JSON has a top-level `status` and `nextAction` for the result. Its nested `review` keeps the reviewed facts and has no `nextAction`. The dry-run JSON does not change.

### Dependencies

- P1 and P2 are complete.

### Closeout Notes

- Four testing decisions: Automated Implementation Testing selected and passed. See the [evidence](evidence.md#p3-accurate-adoption-apply-output). Performance Testing, Guided Progress Review, and Unassisted Goal Testing are `not-needed-now`.
- Performance evidence: none.
- Human Experience Review: in a throwaway project, the apply output says "Applying this reviewed adoption now." and then "Skill adoption completed." It no longer says that nothing was applied, and it asks for no repeat. The dry run still names the exact `--review` digest. Limit: the public CLI rejects `--yes` without `--review` before this summary runs, so that mode is shown only by the command tests.
- Optional experience handoff: run an adoption dry run and its `--review` apply, and read the stderr lines. Feedback is optional.
- Explicit human acceptance gate: none.
- Evidence report: [P3 Accurate Adoption Apply Output](evidence.md#p3-accurate-adoption-apply-output).
- Phase / capability status: Phase complete on commit. D-058 is closed. The 2.0.9 candidate digest is recorded by [W22 R0 P9](../2026-09-18-w22-r0-store-architecture-recovery-and-platform-neutral-foundation/09-windows-store-session-admission-retry.md), the last Phase in the same PR.

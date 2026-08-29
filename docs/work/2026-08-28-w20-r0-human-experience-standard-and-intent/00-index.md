---
title: "W20 R0 Human Experience Standard and Intent Work Backlog"
kind: "work"
status: "active"
coordinate: "W20 R0"
follow_on:
  route: "implementation-loop"
  next_prompt: ".make-docs/references/system/execution-workflow.md"
  why: "The backlog is the implementation queue derived from the plan and PRD contract."
  coordinate_handoff: "Carry this backlog's W/R coordinate into phase history records and commits, adding the active P coordinate for each phase."
source:
  type: "prd"
  path: "docs/prd/49-human-experience-standard-and-intent.md"
---

# W20 R0 Human Experience Standard and Intent Work Backlog

This backlog is a directory. Use this index first. Then use the phase files in order.

## Purpose

Implement the Human Experience Standard as a small, shared Make Docs rule that stays visible from design through acceptance.

The work responds to a repeatable failure. An agent can produce a technically correct system that is hard for a person to understand or use. Complete records, valid JSON, passing checks, and correct internal models do not prove that a person can see meaning, continuity, state, or the next useful action.

The enhancement must keep Make Docs strong at complex technical work. It must also make the intended human result a normal product constraint. It must do this without a new lifecycle stage, copied policy in every prompt, mandatory Skills, experience frontmatter, or a claim that deterministic checks can prove beauty or joy.

Current PRD bodies are normative. The accepted plan supplies order and rationale. The design preserves the originating decision and Human Experience Intent.

Authority inputs:

- [Accepted design](../../designs/2026-08-28-human-experience-standard-and-intent.md)
- [Accepted W20 R0 plan](../../plans/2026-08-28-w20-r0-human-experience-standard-and-intent/00-overview.md)
- [PRD 49 — Human Experience Standard and Intent](../../prd/49-human-experience-standard-and-intent.md)
- [PRD 50 — Proportionate Testing and Human-Centered Validation](../../prd/50-proportionate-testing-and-human-centered-validation.md)
- [PRD 00 — Active PRD Index](../../prd/00-index.md)
- The current owner PRDs listed in each phase file

## W21 Testing Alignment

This revision preserves the W20 R0 coordinate and every phase task ID. W20 owns Human Experience Intent, propagation, and required Human Experience Review. W21 owns the four testing types and the rules that select, bound, run, stop, reuse, and gate them.

Human Experience Review is mandatory acceptance work against each applicable promise. It is not a fifth testing type. It reuses suitable evidence. When evidence is insufficient, PRD 50 selects the smallest added testing activity that can answer the current question.

After both backlogs are ready, implement W20 first. Then implement W21 against the Human Experience capability delivered by W20.

## Phase Map

| Phase | File | Outcome |
| --- | --- | --- |
| 1 | [01-prd-authority-and-requirement-trace.md](01-prd-authority-and-requirement-trace.md) | Lock current PRD authority, requirement trace, product surfaces, and proof ownership before source edits. |
| 2 | [02-contract-reference-and-design-entry.md](02-contract-reference-and-design-entry.md) | Add the canonical contract, interpretation reference, conditional design section, stable resource access, and structural checks. |
| 3 | [03-lifecycle-propagation-and-routing.md](03-lifecycle-propagation-and-routing.md) | Carry the human goal and promises through plans, PRDs, work, routers, prompts, handoffs, and durable deferrals. |
| 4 | [04-evidence-review-and-acceptance.md](04-evidence-review-and-acceptance.md) | Apply required Human Experience Review and select only the proportionate testing needed for current decisions. |
| 5 | [05-delivery-conformance-and-delta-closeout.md](05-delivery-conformance-and-delta-closeout.md) | Prove package, dogfood, installed-project, agent, adoption, and real human outcomes before W20 R0 closeout. |

## Usage Notes

- Start Phase 1 only after the owner gives separate implementation authority.
- Complete phases in order. A later phase can inspect future work, but it cannot close before its dependencies close.
- Use phase-local task IDs. IDs start at `t1` in each phase and continue across that phase's stages.
- Treat PRD 49 and the listed owner PRDs as product authority. Use the plan only for order, context, and scope provenance.
- Author shipped system resources in `packages/docs/template/` first. Project the reviewed source into the package and dogfood copies only after upstream work is ready.
- Preserve user-owned and project-owned content during install and update work.
- Use focused Automated Implementation Testing during implementation. Use one justified expanded integration pass at closeout. Do not add release-grade testing without separate authority.
- Start Performance Testing as `not-needed-now`. Reconsider it only if implementation reveals a current performance decision.
- Offer one optional Guided Progress Review after a meaningful result exists. It is advisory and never blocks completion.
- Do not pre-activate Unassisted Goal Testing. Select at most one bounded scenario when a material current uncertainty remains. Its result is advisory unless explicit authority gives it a gate effect.
- Apply Human Experience Review to every applicable promise. Record `satisfied`, `material gap`, or `insufficient evidence`. Do not create a duplicate run or verdict.
- No `NUAT-###` or `O-###` item is active at backlog creation. Create one only when its current contract applies.
- Give every material finding a disposition. Create a durable obligation only when the owner accepts a future outcome that is still owed.
- Stop for a product choice when the human path cannot be inferred from accepted authority.
- Stop before staging, commit, publication, or release unless the owner gives that separate authority.

## Intended Follow-On

This handoff is advisory-default-but-overridable. It is authoritative unless the user explicitly overrides it. It is not an implementation approval.

- Route: `implementation-loop`
- Next step: After owner approval, start with Phase 1 and continue phase by phase.
- Why: This backlog turns the accepted Human Experience design, plan, and PRDs into a bounded implementation and proof queue.
- Coordinate Handoff: Carry `W20 R0` into phase history records and commits. Add the active P coordinate for each phase.

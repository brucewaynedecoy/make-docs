---
title: "W20 R0 Human Experience Standard and Intent Work Backlog"
kind: "work"
status: "active"
coordinate: "W20 R0"
follow_on:
  route: "implementation-loop"
  next_prompt: ".make-docs/system/references/execution-workflow.md"
  why: "The backlog is the implementation queue derived from the plan and PRD contract."
  coordinate_handoff: "Carry this backlog's W/R coordinate into phase history records and commits, adding the active P coordinate for each phase."
source:
  type: "prd"
  path: "docs/prd/49-human-experience-standard-and-intent.md"
---

# W20 R0 Human Experience Standard and Intent Work Backlog

This backlog is a directory. Use this index first. Then use the phase files in order.

## Interrupt Pause

The W19 recovery interrupt is closed. P1 through P4 are accepted and closed. Their commits are `cc113d3` for P1, `c09adb9` for P2, `da10a5e` for P3, and `df0080a` for P4. P5 is active. Tasks t1 through t18 have evidence. Stage 1 is not accepted because no real-agent result exists. Supported-agent conformance is blocked by an unresolved tuple authority and implementation gap. P5, W20 R0, publication, and release remain open. W21 stays paused.

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
- [W20 R0 central evidence report](evidence.md)
- The current owner PRDs listed in each phase file

## W21 Testing Alignment

This revision preserves the W20 R0 coordinate and every phase task ID. W20 owns Human Experience Intent, propagation, and required Human Experience Review. W21 owns the four testing types and the rules that select, bound, run, stop, reuse, and gate them.

Human Experience Review is mandatory acceptance work against each applicable promise. It is not a fifth testing type. It reuses suitable evidence. When evidence is insufficient, PRD 50 selects the smallest added testing activity that can answer the current question.

After both backlogs are ready, implement W20 first. Then implement W21 against the Human Experience capability delivered by W20.

## 2026-09-15 W20 R2 Supersession

[W20 R2](../../plans/2026-09-15-w20-r2-human-experience-review-and-feedback-boundary/00-overview.md) supersedes only the default owner-response rule in this active P5 record. The agent now prepares and records the Human Experience Review. A normal review does not require an owner response or approval. Completed direct human-facing work normally includes a short optional experience handoff. Silence, refusal, or no feedback does not block completion or create an obligation.

Human acceptance remains blocking only when the user, an accepted design or PRD, release authority, or safety authority explicitly defines a gate with its scope, human reviewer, surface, acceptance question, and gate effect. This correction does not close P5. It preserves all non-Human-Experience blockers, tasks, and evidence. P1 through P4 stay accepted and closed.

## Phase Map

| Phase | File | Outcome |
| --- | --- | --- |
| 1 | [01-prd-authority-and-requirement-trace.md](01-prd-authority-and-requirement-trace.md) | Accepted and closed at `cc113d3`: [authority, source/test ownership, and proof map](01-prd-authority-and-requirement-trace.md#read-this-first). The bounded P1 result does not claim later delivery proof. |
| 2 | [02-contract-reference-and-design-entry.md](02-contract-reference-and-design-entry.md) | Accepted and closed at `c09adb9`: shared rules, design entry, checks, and owner-approved local sync. Source, package, and installed copies match. |
| 3 | [03-lifecycle-propagation-and-routing.md](03-lifecycle-propagation-and-routing.md) | Accepted and closed at `da10a5e`: the human goal and promises pass through plans, PRDs, work, routers, prompts, handoffs, and durable deferrals. Source, package, installed files, and Store evidence agree. |
| 4 | [04-evidence-review-and-acceptance.md](04-evidence-review-and-acceptance.md) | Accepted and closed at `df0080a`: implementation and validation are complete, and independent review found no defect after repairs. The [central evidence](evidence.md#phase-4-review) records the bounded result. Guided Progress Review and Unassisted Goal Testing remain `not-needed-now` for P4. |
| 5 | [05-delivery-conformance-and-delta-closeout.md](05-delivery-conformance-and-delta-closeout.md) | Active. Package, dogfood, clean-install, constructed update, and structural tasks have evidence. Stage 1 is not accepted because real-agent reach is not proved. Agent, adoption, real-human, reconciliation, and closeout work remain open. |

## Usage Notes

- The owner accepted and closed P1 through P4. Their commits are `cc113d3`, `c09adb9`, `da10a5e`, and `df0080a`. The owner authorized P5 implementation in the current task. Staging, commit, publication, and release still need separate authority.
- Complete phases in order. A later phase can inspect future work, but it cannot close before its dependencies close.
- Use phase-local task IDs. IDs start at `t1` in each phase and continue across that phase's stages.
- Treat PRD 49 and the listed owner PRDs as product authority. Use the plan only for order, context, and scope provenance.
- Author shipped system resources in `packages/docs/template/` first. Project the reviewed source into the package and dogfood copies only after upstream work is ready.
- Preserve user-owned and project-owned content during install and update work.
- Use focused Automated Implementation Testing during implementation. Use one justified expanded integration pass at closeout. Do not add release-grade testing without separate authority.
- Start Performance Testing as `not-needed-now`. Reconsider it only if implementation reveals a current performance decision.
- Offer one optional Guided Progress Review after a meaningful result exists. It is advisory and never blocks completion.
- Do not pre-activate Unassisted Goal Testing. Select at most one bounded scenario when a material current uncertainty remains. Its result is advisory unless explicit authority gives it a gate effect.
- Apply Human Experience Review to every applicable promise. The agent inspects the available real surface, records the evidence, observation, conclusion, reviewer, and limit, and keeps each claim within that evidence. For completed direct human-facing work, normally give one to three normal-use steps, what to notice, and an invitation for optional feedback. Do not require an owner response unless accepted authority explicitly defines a human acceptance gate.
- No `NUAT-###` or `O-###` item is active at backlog creation. Create one only when its current contract applies.
- Give every material finding a disposition. Create a durable obligation only when the owner accepts a future outcome that is still owed.
- Stop for a product choice when the human path cannot be inferred from accepted authority.
- Stop before staging, commit, publication, or release unless the owner gives that separate authority.

## Intended Follow-On

This handoff is advisory-default-but-overridable. It is authoritative unless the user explicitly overrides it. It is not an implementation approval.

- Route: `implementation-loop`
- Next Prompt: `.make-docs/system/references/execution-workflow.md`
- Why: The backlog is the implementation queue derived from the plan and PRD contract.
- Coordinate Handoff: Carry this backlog's W/R coordinate into phase history records and commits, adding the active P coordinate for each phase.

Current next step: Resolve authority for the PRD 20 `connectionMethod` implementation and the separate PRD 43 tuple reconciliation. Then resume P5 agent evidence. Use the [central evidence report](evidence.md) as the handoff. P5 implementation is authorized. W19 R6 implementation, PRD 43 changes, staging, commit, publication, and release remain outside the current authority.

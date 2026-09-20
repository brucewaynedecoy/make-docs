---
title: "W20 R0 Human Experience Standard and Intent Work Backlog"
kind: "work"
status: "completed"
coordinate: "W20 R0"
follow_on:
  route: "none"
  next_prompt: "none"
  why: "All five phases are complete. W21 R0 remains a separate testing-governance backlog."
  coordinate_handoff: "Carry this backlog's W/R coordinate into phase history records and commits, adding the active P coordinate for each phase."
source:
  type: "prd"
  path: "docs/prd/49-human-experience-standard-and-intent.md"
---

# W20 R0 Human Experience Standard and Intent Work Backlog

This backlog is a directory. Use this index first. Then use the phase files in order.

## Interrupt Pause

The W19 recovery interrupt is closed. P1 through P4 remain accepted at `cc113d3`, `c09adb9`, `da10a5e`, and `df0080a`. P5 is complete under current static-adapter and agent-review authority. W20 R0 is complete. Publication and release remain separate actions. W21 R0 can now proceed under its own authority.

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

This revision preserves the W20 R0 coordinate and every phase task ID. W20 owns Human Experience Intent, propagation, and agent Human Experience Review. W21 owns the four testing types and the rules that select, bound, run, stop, reuse, and gate them.

Human Experience Review is required agent work against each applicable promise. It is not a fifth testing type. It reuses suitable evidence. When evidence is insufficient, PRD 50 selects the smallest added testing activity that can answer the current question. A person can try the result and give feedback, but that response is optional unless accepted authority defines an explicit human gate.

W20 is complete. W21 can now reconcile and implement its testing rules against the delivered Human Experience capability.

## 2026-09-15 W20 R2 Supersession

[W20 R2](../../plans/2026-09-15-w20-r2-human-experience-review-and-feedback-boundary/00-overview.md) supersedes only the former default owner-response rule. The agent prepares and records the Human Experience Review. A normal review does not require an owner response or approval. Completed direct human-facing work normally includes a short optional experience handoff. Silence, refusal, or no feedback does not block completion or create an obligation.

Human acceptance remains blocking only when the user, an accepted design or PRD, release authority, or safety authority explicitly defines a gate with its scope, human reviewer, surface, acceptance question, and gate effect. P5 applies this boundary and closes from agent-owned installed-product evidence. P1 through P4 stay accepted and closed.

## Phase Map

| Phase | File | Outcome |
| --- | --- | --- |
| 1 | [01-prd-authority-and-requirement-trace.md](01-prd-authority-and-requirement-trace.md) | Accepted and closed at `cc113d3`: [authority, source/test ownership, and proof map](01-prd-authority-and-requirement-trace.md#read-this-first). The bounded P1 result does not claim later delivery proof. |
| 2 | [02-contract-reference-and-design-entry.md](02-contract-reference-and-design-entry.md) | Accepted and closed at `c09adb9`: shared rules, design entry, checks, and owner-approved local sync. Source, package, and installed copies match. |
| 3 | [03-lifecycle-propagation-and-routing.md](03-lifecycle-propagation-and-routing.md) | Accepted and closed at `da10a5e`: the human goal and promises pass through plans, PRDs, work, routers, prompts, handoffs, and durable deferrals. Source, package, installed files, and Store evidence agree. |
| 4 | [04-evidence-review-and-acceptance.md](04-evidence-review-and-acceptance.md) | Accepted and closed at `df0080a`: implementation and validation are complete, and independent review found no defect after repairs. The [central evidence](evidence.md#phase-4-review) records the bounded result. Guided Progress Review and Unassisted Goal Testing remain `not-needed-now` for P4. |
| 5 | [05-delivery-conformance-and-delta-closeout.md](05-delivery-conformance-and-delta-closeout.md) | Complete. Package, dogfood, install, update, real-agent, real-surface, preservation, recovery, and agent Human Experience evidence support the bounded W20 R0 claim. Claude Code permission rules remain safely blocked. |

## Usage Notes

- The owner accepted and closed P1 through P4. Their commits are `cc113d3`, `c09adb9`, `da10a5e`, and `df0080a`. The owner authorized P5 implementation and commit in the current task. Publication and release still need separate authority.
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

W20 R0 has no incomplete follow-on work.

- Route: `none`
- Next Prompt: `none`
- Why: All five phases and `R-033` are complete.
- Separate work: W21 R0 remains the active backlog for testing governance. Its reconciliation does not reopen W20 R0.

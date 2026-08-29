---
title: "W21 R0 Proportionate Testing and Human-Centered Validation Work Backlog"
kind: "work"
status: "active"
coordinate: "W21 R0"
follow_on:
  route: "implementation-loop"
  next_prompt: ".make-docs/references/system/execution-workflow.md"
  why: "The backlog is the implementation queue derived from the accepted testing design, plan, and reconciled PRD set."
  coordinate_handoff: "Carry this backlog's W/R coordinate into phase history records and commits, adding the active P coordinate for each phase."
source:
  type: "prd"
  path: "docs/prd/50-proportionate-testing-and-human-centered-validation.md"
---

# W21 R0 Proportionate Testing and Human-Centered Validation Work Backlog

This backlog is a directory. Use this index first. Then use the phase files in order.

## Purpose

Make testing in Make Docs a small, clear decision system instead of a routine demand for more proof.

This work responds to two linked failures. Agents can under-test a material current risk. Agents can also over-test, invent production-grade targets too early, ask a person to repeat automated checks, confuse a progress review with acceptance, or turn a human activity into a hard gate without authority.

Both failures make the product worse. One hides important uncertainty. The other spends time and money, creates false confidence, and makes collaboration with an agent difficult and joyless.

W21 R0 defines exactly four testing types: Automated Implementation Testing, Performance Testing, Guided Progress Review, and Unassisted Goal Testing. It requires an agent to select only the types that can change a current decision. It also requires clear effort, stop, evidence, executor, and gate boundaries.

Human Experience Review remains required acceptance work from W20 R0. It is a lens over the built result and suitable evidence. It is not a fifth testing type. It does not create a duplicate run or verdict.

Current PRD bodies are normative. The accepted plan supplies order and rationale. The design preserves the original concern and the intended human testing experience.

Authority inputs:

- [Accepted testing design](../../designs/2026-08-28-proportionate-testing-and-human-centered-validation.md)
- [Accepted W21 R0 plan](../../plans/2026-08-28-w21-r0-proportionate-testing-and-human-centered-validation/00-overview.md)
- [PRD 50 — Proportionate Testing and Human-Centered Validation](../../prd/50-proportionate-testing-and-human-centered-validation.md)
- [PRD 49 — Human Experience Standard and Intent](../../prd/49-human-experience-standard-and-intent.md)
- [Revised W20 R0 backlog](../2026-08-28-w20-r0-human-experience-standard-and-intent/00-index.md)
- [PRD 00 — Active PRD Index](../../prd/00-index.md)
- The current owner PRDs listed in each phase file

## W20 Dependency and Scope Boundary

Implement W20 R0 first. W20 must supply the Human Experience Intent, its lifecycle propagation, and the required Human Experience Review that W21 consumes.

Start W21 implementation only after the owner accepts enough W20 evidence for this dependency. A later W20 finding can still become a W21 input through normal finding and obligation rules.

W21 owns the four testing types and the common rules that select, bound, run, stop, reuse, and gate them. W21 does not reimplement Human Experience Intent. It does not change W20 task IDs. It does not rewrite W20 evidence.

If W21 implementation reveals a new W20 product decision, stop and return that decision to the owner. Do not silently edit W20 authority or backlog scope.

## Phase Map

| Phase | File | Outcome |
| --- | --- | --- |
| 1 | [01-prd-authority-and-testing-model.md](01-prd-authority-and-testing-model.md) | Lock accepted testing authority, the W20 dependency, resource identities, implementation owners, and proof boundaries before source edits. |
| 2 | [02-system-resources-and-lifecycle-routing.md](02-system-resources-and-lifecycle-routing.md) | Add the shared testing contract, interpretation reference, body record, lifecycle routing, prompts, routers, and stable resource delivery. |
| 3 | [03-proportionate-technical-testing.md](03-proportionate-technical-testing.md) | Make automated and performance testing affected-first, maturity-qualified, finite, evidence-aware, and authority-bound. |
| 4 | [04-human-centered-testing.md](04-human-centered-testing.md) | Give guided and unassisted human activities distinct purposes, safe executor boundaries, and short goal-led instructions. |
| 5 | [05-conformance-delivery-and-w20-handoff.md](05-conformance-delivery-and-w20-handoff.md) | Prove under-testing and over-testing failures, deliver the upstream resource set, test an installed product, and close W21 without false gates or obligations. |

## Usage Notes

- Start Phase 1 only after W20 R0 is implemented and the owner gives separate W21 implementation authority.
- Complete phases in order. Phases 3 and 4 can prepare independent fixtures after Phase 2 closes, but Phase 5 owns their joint proof.
- Use phase-local task IDs. IDs start at `t1` in each phase and continue across that phase's stages.
- Treat PRD 50 and the listed owner PRDs as product authority. Use the plan only for order, context, and scope provenance.
- Preserve exactly four testing types. Do not create a generic fifth type, a duplicate Human Experience verdict, or a second specialist evidence model.
- Record the current decision first. Select only testing that can change that decision.
- Use the common body record: testing type, decision informed, reason now, product maturity, scope, executor, gate effect, effort budget, stop condition, evidence retained, and rerun trigger.
- Accept `not-needed-now` when evidence cannot change a current decision. Do not treat it as missing rigor.
- Use focused Automated Implementation Testing during implementation. Use expanded proof only with a short reason. Do not run release-grade proof without separate product or release authority.
- Start Performance Testing for W21 itself as `not-needed-now`. Reconsider it only if implementation reveals a current performance decision.
- Offer one optional Guided Progress Review after a meaningful installed result exists. It is advisory or informational. A person can decline without failed work or a future obligation.
- Do not pre-activate Unassisted Goal Testing. Select it only when an unassisted attempt can reveal a material current uncertainty. It is advisory unless explicit current authority states otherwise.
- Apply the required Human Experience Review to W21's human testing instructions and installed-product result. Reuse suitable evidence. Add testing only when the current evidence is insufficient.
- Keep human requests short, goal-led, honest about effort and gate effect, and separate from optional technical help.
- No `NUAT-###`, `PERF-###`, or W21-specific `O-###` item is active at backlog creation. Create one only when its current owner contract applies.
- Give every material finding a disposition. Create a durable obligation only when the owner accepts a future outcome that remains owed.
- Author shipped system resources in `packages/docs/template/` first. Project the reviewed source into package and dogfood copies only after upstream work is ready.
- Preserve user-owned and project-owned content during install and update work.
- Stop before staging, commit, publication, release, or any support claim unless the owner gives that separate authority.

## Intended Follow-On

This handoff is advisory-default-but-overridable. It is authoritative unless the user explicitly overrides it. It is not an implementation approval.

- Route: `implementation-loop`
- Next step: After W20 R0 acceptance and separate owner approval, start with Phase 1 and continue phase by phase.
- Why: This backlog turns the accepted testing design, plan, and PRD set into a bounded implementation and proof queue.
- Coordinate Handoff: Carry `W21 R0` into phase history records and commits. Add the active P coordinate for each phase.

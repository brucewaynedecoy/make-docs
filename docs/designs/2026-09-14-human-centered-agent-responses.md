---
title: "Human-Centered Agent Responses"
kind: "design"
status: "draft"
follow_on:
  route: "change-plan"
  next_prompt: "make-docs://system/prompt/designs-to-plan-change.prompt.md"
  why: "This design revises existing Human Experience and managed-router authority before implementation changes shipped and dogfood resources."
  coordinate_handoff: "Use W20 R1 as a revision of W20 R0."
---

# Human-Centered Agent Responses

## Purpose

Refine the Human Experience Standard so an agent treats its own material replies as human-facing results.

The reply must help the user understand what changed, what it means, what state the work is in, and what useful action comes next. The user must not need to decode implementation names, logs, or proof before they can decide what to do.

## Context

The current local `Agent Responses` rule asks agents to describe work in concrete terms and end technical replies with a short statement about what the user will see or experience. An earlier rule asked for a more detailed tactile outcome.

Both forms improve some replies. Both also treat the human result as a final add-on. The result can become a fixed closing paragraph that claims how the user should feel. It can also remove useful technical detail when the user needs that detail.

The existing Human Experience Contract already says to start with the human goal, keep the person oriented, show clear state and next action, and disclose machine detail when it becomes useful. The missing part is discovery. The root agent router does not tell agents to apply that authority to their own material task updates, decisions, errors, or completion replies.

The owner supplied this North Star:

> “When users don't know what to *expect*, they are less likely to *act*.”

In this design, an expectation is an honest account of the likely result, current state, limit, or next action. It is not a promise of certainty. If the agent is unsure, the reply must make that uncertainty clear.

The owner also supplied this Human Experience principle:

> “Data-driven design has its part, but it [shouldn't] lead the process. What matters *most* is being *personally involved*, testing everything *yourself*...And a huge part of that is paying attention to *how the product feels to you*, while always keeping its *core idea* in mind.”

This principle makes evidence serve human judgment. It does not reject data, automation, or delegated work. It requires an accountable reviewer to use or inspect the real result, keep the core idea in view, and record direct observations. One reviewer's reaction is evidence from that reviewer. It is not proof of every person's experience.

## Human Experience Intent

- **Impact:** `direct`
- **Affected people:** Users and maintainers who receive material task updates, proposals, decisions, error reports, or completion reports from an agent.
- **Human goal:** Understand the result, current state, meaning, recommendation, and next useful action without first decoding internal evidence.
- **Experience promises:**
  - The agent adapts the reply to what the user needs next: orientation, a decision, an action, or supporting detail.
  - The agent leads with the result, meaning, or current state. It restores needed context after long or interrupted work.
  - The agent makes complete, partial, waiting, blocked, failed, and unverified states distinct.
  - The agent gives a recommendation or next useful action when one exists.
  - The agent puts technical proof after human meaning. It keeps exact detail available when that detail helps the user verify or continue the work.
  - The agent does not claim what the user feels. It does not add a separate experience summary to satisfy the rule.
  - The agent sets a clear and honest expectation so the user can act without guessing. It keeps limits and uncertainty visible.
- **Review promise:** Data and automated checks inform the review. An accountable person also inspects or uses the real response, keeps the core idea in view, and records observations and limits.
- **Complexity kept out of the normal path:** Tool logs, internal identifiers, function names, document coordinates, and process names that do not help the current decision. The user also does not need to remember the full prior task after a long agent run.
- **Evidence:** Resource and router checks, package and dogfood parity checks, and representative agent replies for long completion, partial completion, blocked or failed work, a proposal, an expert technical explanation, and a no-action status. Human Experience Review must judge the actual replies. Structural checks alone cannot prove the result.

## Decision

Treat a material agent reply as a human-facing result under the Human Experience Standard.

A material reply is one that reports task state, presents a decision, recommends action, explains an error or limit, or closes work. Routine short acknowledgements do not need added structure.

Keep the Human Experience Contract unchanged. Its short standard is already broad enough. Add the North Star and agent-response guidance to the Human Experience Reference, where explanation and examples belong.

The reference will tell an agent to:

1. Identify what the user needs next.
2. Lead with the result, meaning, or current state.
3. Restore context when time or task length may have broken continuity.
4. Name the work state and the next useful action.
5. Place proof and implementation detail after the human account.
6. Keep material limits and uncertainty visible.
7. Shape the whole reply around the user. Do not add a closing paragraph that claims an experience or feeling.

Add one short discovery rule to managed root routers. The rule will point to lifecycle and Human Experience authority for governed work and material agent replies. It will not copy the full guidance.

Make direct, first-hand review part of Human Experience evidence. Metrics, test results, and agent analysis can find problems and support a conclusion. They do not replace an accountable person's review of the actual result against its core idea.

During implementation, remove the current unmanaged `Agent Responses` section from this maintainer repo after the managed router carries the new route. This prevents two competing instructions. Apply the same managed route upstream first in `packages/docs/template/`. Then dogfood it into the maintainer repo. Preserve all unrelated user-owned text outside managed blocks.

Do not add a new Skill, lifecycle stage, schema, response template, or runtime service.

## Alternatives

### Keep the current short local rule

This is small, but it remains local to one repo. It also requires a closing statement and makes reduced technical language the default even when technical detail is useful.

### Put the full response rule in each agent router

This makes discovery easy. It also copies policy into files that should remain short. The copies can drift from the Human Experience authority.

### Add the North Star to the Human Experience Contract

The line is useful guidance. It does not need to become a second canonical standard. The reference can explain how expectation supports action while the contract stays stable.

### Require one reply template

A fixed template can make output easy to scan. It cannot read the room. It would make simple replies heavy and expert replies shallow.

### Make only a local plan-mode edit

This would improve the dogfood repo without changing the shipped source of truth. New and upgraded projects would not receive the behavior.

## Consequences

Agents get one clear route to existing Human Experience authority. The detailed guidance stays in one reference.

Replies can remain brief, technical, or detailed when the user needs that form. The rule governs order and meaning. It does not set one tone or layout.

The change can remove a visible local `Agent Responses` section. That removal is intentional. The managed router will replace its role and will preserve unrelated local instructions.

Agent models can apply the guidance in different ways. The implementation therefore needs representative response review. Static text checks are necessary, but they are not enough.

This revision does not close or change the open W20 R0 P5 validation work. It adds a separate response-focused requirement and evidence set.

## Design Lineage

- **Update Mode:** `new-doc-related`
- **Prior Design:** [Human Experience Standard and Intent](2026-08-28-human-experience-standard-and-intent.md)
- **Reason:** W20 R0 established the cross-cutting standard. This design applies that authority to the agent's own material communication.

## Intended Follow-On

- **Route:** `change-plan`
- **Next Prompt:** [Designs to Plan Change](../../.make-docs/system/prompts/designs-to-plan-change.prompt.md)
- **Why:** This is a small revision to existing Human Experience and agent-router authority. It needs surgical PRD changes and one bounded implementation phase.
- **Coordinate Handoff:** Revise W20 R0 as W20 R1. No earlier W20 R1 package exists.

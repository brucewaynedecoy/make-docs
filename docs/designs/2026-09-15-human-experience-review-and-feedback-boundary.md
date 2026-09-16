---
title: "Human Experience Review and Feedback Boundary"
kind: "design"
status: "accepted"
follow_on:
  route: "change-plan"
  next_prompt: "make-docs://system/prompt/designs-to-plan-change.prompt.md"
  why: "This design corrects current Human Experience authority without removing the capability or rewriting its history."
  coordinate_handoff: "Use W20 R2 as the next unused revision of W20."
---

# Human Experience Review and Feedback Boundary

## Purpose

Keep agents responsible for the human quality of their work without making every owner answer a closeout request.

This design separates the agent review, the optional human experience handoff, and an explicit human acceptance gate.

## Context

W20 R0 established Human Experience Intent, lifecycle propagation, real-surface review, and bounded evidence. W20 R1 applied the same standard to material agent replies. W21 R0 made human testing proportionate and rejected false phase gates.

The current Human Experience rule still joins three different actions. The agent prepares the review. The owner must respond. The agent then records an approved result. The owner does not have to write a report, but a response is still required before normal completion.

That rule creates a recurring human close gate. It can interrupt the owner and turn human-centered work into ceremony. It also conflicts with the rule that advisory human activity must not silently become a gate.

## Human Experience Intent

Impact: `direct`

Affected humans: Owners and maintainers who receive completed human-facing work, and agents that must review and explain that work.

Human goal or effect: The agent remains careful about human quality and gives the person an easy way to try the result without requiring a response for normal completion.

Experience promises:

- The agent reviews every applicable experience promise and inspects the real surface when it is available.
- Completed direct human-facing work normally includes one to three normal-use steps, what to notice, and an invitation for optional feedback.
- Silence, refusal, or no feedback does not block completion or create an obligation.
- A human response blocks only the scope named by explicit accepted authority.
- Later feedback creates a normal finding and changes only the claim that the finding affects.

Complexity kept out of the human path:

- The person does not have to restate promises, write a report, learn conclusion words, repeat automated checks, or answer a routine closeout request.
- The correction adds no command, schema, lifecycle stage, or required document field.

Evidence required:

- Prove the agent-owned review and optional handoff rules in current PRDs and shipped resources.
- Prove that the normal path closes without a human response.
- Prove that an explicit human acceptance gate remains blocking for only its named scope.
- Prove upstream, package, and dogfood resource parity.
- Reconcile active W20 R0 and W19 R6 work without changing completed W20 R0 or W20 R1 evidence.

## Decision

Human Experience Review remains required agent work. The agent records evidence, observations, conclusions, reviewer identity, limits, and next actions for each applicable promise. The agent can support observable conclusions within the evidence. It cannot claim a person's lived ease, confidence, joy, or acceptance without evidence from that person.

Completed direct human-facing work normally includes a short optional experience handoff. It gives one to three normal-use steps, states what is worth noticing, and invites optional feedback. It is completion communication. It is not a test, sign-off request, or gate. Indirect work uses a handoff only when it gives the person useful information. `none` work does not invent one.

Human acceptance becomes a gate only when the user, an accepted design or PRD, release authority, or safety authority explicitly defines it. The gate names its scope, human reviewer, surface, acceptance question, and gate effect. The agent prepares the review. The human can correct it, add feedback, acknowledge it, or accept it. The response affects only the named scope.

The existing `satisfied`, `material gap`, and `insufficient evidence` conclusions remain. A material gap blocks the affected claim. Insufficient evidence limits the claim. It does not create a human-response gate by itself. Technical implementation can close with a bounded claim when only optional lived-human feedback is absent and no explicit gate exists.

Later feedback becomes a finding. A material defect can reopen or narrow the affected claim. It does not make unrelated completed work incomplete.

## Alternatives Considered

### Keep the low-friction owner approval rule

This removes report-writing burden. It still requires a response and keeps the recurring close gate.

### Remove Human Experience Review

This removes the gate. It also removes the agent duty, promise trace, real-surface inspection, and honest evidence limits that Make Docs should preserve.

### Make every experience handoff a Guided Progress Review

This would turn simple completion communication into a testing activity. A handoff becomes a selected test only when it is meant to answer a current decision.

### Treat all human feedback as non-blocking

This would prevent product, release, and safety authority from requiring real human acceptance when it is needed. Explicit gates must remain available.

## Consequences

Agents must still do the review. They cannot use missing owner feedback to avoid their own judgment.

Owners receive a useful and small path to experience completed work. They can ignore it without creating an incomplete phase or future obligation.

Explicit human gates become easier to audit because their scope and effect must be named.

Older W20 R0 and W20 R1 evidence remains true history. Current authority changes through a new requirement-history entry and clear supersession notes in active work.

## Design Lineage

- Update Mode: `new-doc-related`
- Prior Design Docs: [Human Experience Standard and Intent](2026-08-28-human-experience-standard-and-intent.md) and [Human-Centered Agent Responses](2026-09-14-human-centered-agent-responses.md)
- Reason: This design preserves the standard and response guidance while correcting the default completion boundary.

## Intended Follow-On

- Route: `change-plan`
- Next Prompt: [Designs to Plan Change](../../.make-docs/system/prompts/designs-to-plan-change.prompt.md)
- Why: Current PRDs, system resources, tests, and active work need a small coordinated correction.
- Coordinate Handoff: Use W20 R2. It is the next unused W20 revision after W20 R1.

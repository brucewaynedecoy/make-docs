---
title: "W21 R0 Phase 4 Human-Centered Testing"
kind: "plan"
status: "draft"
coordinate: "W21 R0 P4"
source:
  type: "plan"
  path: "docs/plans/2026-08-28-w21-r0-proportionate-testing-and-human-centered-validation/00-overview.md"
---

# W21 R0 Phase 4: Human-Centered Testing

## Purpose

Give guided and unassisted human activities distinct purposes, correct executor boundaries, and a humane experience.

## Guided Progress Review

Guided Progress Review lets the owner, maintainer, or developer experience meaningful progress.

The agent prepares:

- safe starting state;
- one small realistic goal;
- public product commands or interfaces;
- normally one to five steps;
- what is worth noticing;
- optional troubleshooting outside the normal path; and
- cleanup or restoration when needed.

The review must not duplicate automated assertions. It must not ask for formal sign-off. The person can decline without failed work or a deferred obligation.

Valid results are `experienced`, `feedback-recorded`, `declined`, `blocked-by-environment`, and `not-applicable`.

## Unassisted Goal Testing

Unassisted Goal Testing asks whether an intended person can understand and attempt a meaningful goal from the product and allowed starting information without private coaching.

Activate it only when an unassisted attempt can reveal a material current uncertainty. Useful triggers include a new mental model, discoverability risk, costly wrong assumptions, weak recovery, a human-facing relationship that implementers may understand only from internal knowledge, a new public goal without prior evidence, or explicit acceptance authority.

The qualified person receives a realistic starting point, one or a few goals, real safety limits, and no hidden path.

Valid results are `clear`, `friction`, `blocked`, `invalid-run`, and `not-needed-now`.

The result is diagnostic and advisory by default. A gate requires explicit current product or release authority.

## Human Experience Review Lens

Human Experience Review checks evidence and the built result against accepted experience promises.

It can guide a Guided Progress Review, an Unassisted Goal Test, expert review, indirect evidence interpretation, or remediation. It must reuse suitable evidence and must not create a fifth test run merely because the lens exists.

## Testing Experience Standard

Every request to a person must state:

- why the activity is useful now;
- the goal;
- expected time and effort;
- what the agent already prepared;
- what to notice without coaching toward a verdict;
- whether the result is advisory or blocking;
- how to stop, recover, or clean up; and
- how feedback will be used.

Instructions must start from the person's goal. They must use the public path, stay brief, keep optional detail separate, avoid raw payloads and internal IDs unless needed, and preserve the person's control.

## Persona and Qualification

Persona identifies the intended audience and helps choose realistic goals and language.

Persona alone does not prove that a person is qualified for an unassisted run. Qualification must also consider prior private knowledge, coaching exposure, environment condition, and evidence integrity.

The owner, maintainer, or developer is the normal Guided Progress Review participant. That role does not imply qualification for an unassisted test.

## Failure-Revealing Scenarios

Include scenarios where:

- a guided review gives a recognizable result without duplicate technical checks;
- the owner declines and the phase remains valid;
- an unassisted attempt reveals a hidden relationship or mental model;
- coaching invalidates a run;
- a user-visible slice validly records `not-needed-now`;
- a Human Experience Review reuses existing evidence; and
- technically correct but needlessly difficult instructions fail the testing-experience standard.

## Acceptance

- Guided and unassisted testing cannot be confused.
- Guided review is never a hard gate.
- Unassisted testing is conditional and anti-coached.
- Human Experience Review is a lens.
- Human instructions are short, goal-led, and honest about effort and gate effect.
- Skipped advisory work does not create false obligations.

## Handoff

Provide scenario, executor, and evidence needs to Phase 5.

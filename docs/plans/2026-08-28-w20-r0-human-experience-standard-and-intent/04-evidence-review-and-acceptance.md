---
title: "W20 R0 Phase 4 Evidence Review and Acceptance"
kind: "plan"
status: "draft"
coordinate: "W20 R0 P4"
source:
  type: "plan"
  path: "docs/plans/2026-08-28-w20-r0-human-experience-standard-and-intent/00-overview.md"
---

# W20 R0 Phase 4: Evidence, Review, and Acceptance

## Purpose

Require proof that matches the human effect without claiming that a checklist can prove beauty or joy.

This phase protects the product from the original failure mode. Technical success, valid JSON, complete records, or a passing template check cannot hide a poor human result.

## Sources

- [Plan overview](00-overview.md)
- [Phase 2](02-contract-reference-and-design-entry.md)
- [Phase 3](03-lifecycle-propagation-and-routing.md)
- Approved PRDs 14, 45, 46, 49, and 50

## Preconditions

- Experience promises trace to current PRD requirements.
- Human-facing and indirect product surfaces are named.
- The W20 implementation can record the current testing decision without waiting for W21 system-resource delivery.

## Evidence Levels

Use proportionate evidence.

| Impact | Minimum evidence direction |
| --- | --- |
| `direct` | Structural and functional checks plus required Human Experience Review of the real human surface. Select Unassisted Goal Testing only when it can answer a material current uncertainty. |
| `indirect` | Technical evidence for the affected quality plus an explanation of the material human effect. Add human review when the effect is perceivable or decision-relevant. |
| `none` | Evidence that the claimed boundary remains internal and that existing human behavior or quality is preserved. |

Higher-risk work can require accessibility, security, privacy, performance, visual, or specialist review. The Human Experience Standard does not weaken those owners.

## Human Experience Review

Apply Human Experience Review as required acceptance work for every applicable experience promise. It is not an optional secondary objective.

The review asks whether suitable evidence and the built result satisfy the local experience promises and support the stated human goal or effect. It records whether each applicable promise is satisfied, has a material gap, or lacks enough evidence.

For applicable direct paths, inspect:

- orientation: can the person tell where they are and what subject is in view;
- continuity: can the person see how the current result relates to prior or surrounding state;
- meaning: are important relationships and outcomes visible in human terms;
- information amount: is the default neither starved nor overloaded;
- next action: is the useful next step clear when action is needed;
- recovery: do errors explain what happened and how to continue;
- control: can the person inspect more detail without being forced through it;
- terminology: does the normal path avoid needless internal terms and opaque identifiers.

The review can use expert judgment and must reuse suitable evidence. If evidence is insufficient, PRD 50 selects the smallest additional testing activity that can answer the question. The review is not a fifth testing type, does not require a duplicate run only to obtain a separate verdict, and cannot certify unassisted success unless the Unassisted Goal Testing contract is satisfied.

## Testing Selection And Evidence Reuse

Use exactly four core testing types when their current decisions activate them:

- Automated Implementation Testing;
- Performance Testing;
- Guided Progress Review; and
- Unassisted Goal Testing.

Specialist architecture, accessibility, visual, security, privacy, and other authorities remain separate. Human Experience Review applies its required acceptance lens over suitable evidence from these sources or the four testing types. One activity can support more than one question. Evidence is reused while each authority retains its own scope, executor, sufficiency, and gate rules.

For W20 R0, use focused automated proof during implementation and one justified expanded integration pass at closeout. Release-grade testing is out of scope without separate authority. Performance Testing begins as `not-needed-now` and is reconsidered only if implementation reveals a current performance decision.

## Human Testing Decisions

Offer one short Guided Progress Review after a meaningful installed-product result exists. The agent prepares a safe starting state, one small realistic goal, the result worth noticing, optional troubleshooting, and cleanup. The review is advisory, can be declined, and must not ask the owner to repeat automated assertions or certify completeness.

Do not pre-activate Unassisted Goal Testing. When the real human surface exists, decide whether one bounded unassisted attempt can reveal a material current uncertainty that other evidence cannot answer well enough. If it activates, preserve the qualified human, installed or public path, anti-coaching, stable `NUAT-###` identity, evidence, and finding rules in PRD 46. Its result is advisory unless explicit current product or release authority assigns a blocking effect.

If Guided Progress Review is declined or Unassisted Goal Testing is `not-needed-now`, record the reason without creating a failed phase or deferred obligation.

## Failure-Revealing Proof

Evidence must be able to show that the experience is wrong.

Bad evidence examples:

- the section exists;
- the command returned success;
- all fields are present;
- an agent says the output is intuitive;
- a screenshot exists without a stated goal or finding rule.

Useful evidence examples:

- a person can connect an alias to the primary record without reading raw identifiers;
- a person can distinguish current state from revision history;
- a person can recover from an invalid input through the public error guidance;
- a person can complete the public goal without private implementation knowledge;
- a measurable indirect effect stays within the human-facing reliability, wait, cost, or risk boundary.

## Findings And Obligations

- A finding cannot close merely because the underlying operation succeeded.
- Every material finding receives a disposition.
- A finding is remediated with affected proof repeated, accepted through a bounded caveat that narrows the claim, or preserved as partial capability status with a valid obligation when an accepted future outcome remains owed.
- A durable obligation names the outcome, owner, trigger, target, and exit criteria. `not-needed-now`, declined advisory work, and skipped advisory testing do not create obligations.
- A valid none result names the preserved experience and proof.
- Release claims stay within the tested path and evidence.

## Acceptance

- Human Experience Review is explicitly applied to every applicable promise and records a clear acceptance conclusion.
- The review reuses suitable evidence without becoming a fifth testing type or duplicate test verdict.
- Existing testing and specialist authorities retain their scope.
- Direct-impact review inspects the real human surface.
- Guided Progress Review remains optional and non-blocking.
- Unassisted Goal Testing remains conditional, qualified, and advisory by default.
- Indirect impact has technical proof tied to a material human effect.
- None cases have boundary proof.
- Findings cannot be hidden by technical success.
- No validator or agent-only review claims to prove beauty, elegance, intuition, or joy.
- At least one fixture fails because required fields exist but the human path is incoherent.

## Handoff

Phase 5 combines structural, delivery, agent-conformance, and real human evidence. Final close requires explicit testing decisions, required Human Experience conclusions, and a disposition for every material finding.

# P4 Failure-Revealing Review Fixture

[Source intent](./design.md#human-experience-intent)

This file contains synthetic failure-revealing fixture evidence. It is not P5 installed-product proof or lived-human proof.

[E-P4-01 synthetic result transcript](./result.md)

Completion claim: `blocked`

## Current Testing Decisions

| Testing type | Decision informed | Reason now | Product maturity | Scope | Executor | Gate effect | Effort budget | Stop condition | Evidence retained | Rerun trigger | Decision |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Automated Implementation Testing | Does the synthetic transcript satisfy the required technical output shape? | The fixture must prove that the synthetic command transcript completed and contains every required field. | Synthetic P4 fixture | One synthetic success result and one invalid-resume result | Fixture test runner | blocking-claim-only | Focused fixture pass and one expanded closeout pass | Stop after the technical shape and success result are reproduced. | [E-P4-01](./result.md) fixture transcript | Output shape or command behavior changes. | selected |
| Performance Testing | Can performance evidence change a current speed, load, cost, or resource decision? | No current speed, load, cost, or resource decision exists. | Synthetic P4 fixture | Synthetic release-result timing | Not assigned | not-applicable | None | Stop while no quantitative claim exists. | This decision record | A quantitative outcome is accepted. | not-needed-now |
| Guided Progress Review | Would a short fixture review reveal the incoherent result and useful replacement? | A short fixture review can reveal the incoherent output and useful replacement. | Synthetic P4 fixture | One synthetic installed-output fixture | Delivery reviewer | advisory | One fixture result with no more than five steps | Stop after the fixture result has been inspected. | [E-P4-01](./result.md) fixture transcript | The human-facing order, labels, or recovery text changes. | selected |
| Unassisted Goal Testing | Can an unassisted attempt reveal a material uncertainty that other current evidence cannot answer? | The fixture transcript already reveals the current material gaps, so an unassisted attempt cannot change the fixture decision. | Synthetic P4 fixture | Synthetic release-result understanding goal | Not assigned | not-applicable | None | Stop without adding a ceremonial attempt. | This decision record | None in this fixture. A later authority makes a new current decision. | not-needed-now |

not-needed-now obligation: None. No accepted future performance or unassisted outcome is owed.

## Specialist Review

| Specialist authority | Decision | Reason now | Evidence |
| --- | --- | --- | --- |
| Accessibility Review | escalated-separately | The fixture terminal also uses color as the only severity signal. This needs its own authority and does not become a fifth core testing decision. | [E-P4-01](./result.md) fixture transcript |

## Human Experience Review

| Promise | Evidence | Observation | Conclusion | Reviewer | Reviewer limit | Disposition |
| --- | --- | --- | --- | --- | --- | --- |
| [HX-REL-01](./design.md#human-experience-intent) | [E-P4-01](./result.md) fixture transcript | The relationship appears only as `rel_7f20 -> rec_9c11`; no product name or relationship meaning is visible. | `material gap` | Independent fixture reviewer | Review of one synthetic transcript; no operator attempt. | Fixture disposition: remediate with human names and repeat the affected fixture proof. |
| [HX-STATE-01](./design.md#human-experience-intent) | [E-P4-01](./result.md) fixture transcript | Current state and revision history use the same label, timestamp style, and placement, so the operator cannot tell which is current. | `material gap` | Independent fixture reviewer | Review of one synthetic transcript; no visual accessibility finding is closed. | Fixture disposition example: an owner could accept a bounded caveat that narrows the claim to status reporting only. This fixture records no approval or W20 R1 commitment. |
| [HX-REC-01](./design.md#human-experience-intent) | [E-P4-01](./result.md) fixture transcript | Invalid resume input returns `E_RESUME_17` and a retry token, but no valid example, correction, or safe next action. | `material gap` | Independent fixture reviewer | The synthetic fixture provides no working resumable-upload path. | Fixture disposition example: partial status could continue through the synthetic [O-901 obligation fixture](./obligation.md) under fixture-only accepted authority. This fixture does not create a real obligation or approve future work. |

Human Experience Review conclusion: `material gap`

## Synthetic Bounded Caveat Disposition Example

This example proves the required record shape. It records no owner approval.

Promise: `HX-STATE-01`

Evidence limit: One synthetic fixture transcript with no operator attempt or P5 installed-product evidence.

Risk: An operator could mistake history for current state and act on stale information.

Owner: Example release tooling maintainer. No owner is assigned.

Follow-on route: Example future owner decision only. No task, coordinate, or W20 R1 work is approved.

## Evidence Reuse

| Evidence | Automated use | Human Experience Review use |
| --- | --- | --- |
| [E-P4-01](./result.md) | Proves technical completion and required fields in the fixture transcript. | Supports the relationship, continuity, and recovery observations without a duplicate run or verdict. |

## Valid Boundary Cases

| Case | Impact | Evidence | Human effect or preserved boundary | Conclusion |
| --- | --- | --- | --- | --- |
| Valid indirect | `indirect` | E-P4-02 measured 99.4 percent of accepted jobs visible within 30 seconds after one worker restart, with no manual replay. | Operators can trust that accepted work will appear without manual replay at the accepted load profile. | `satisfied` |
| Valid none | `none` | E-P4-03 matched public output and error bytes, exit status, operating steps, and the accepted timing boundary before and after the private extraction. | The public command behavior and quality boundary are preserved. | `satisfied` |

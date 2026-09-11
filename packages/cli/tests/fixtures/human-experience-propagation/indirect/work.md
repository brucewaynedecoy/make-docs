---
title: "Queue recovery work"
kind: "work"
status: "active"
coordinate: "W20 R0 P3"
source:
  type: "prd"
  path: "prd.md"
---

# Queue Recovery Work

[Owning PRD](./prd.md)

Source promise: [HX-IND-01](./design.md#human-experience-intent)

Owning requirement: `R-QUEUE-07`

Intended human outcome: Operators can trust that accepted work will appear without manual replay.

Affected effect: Accepted-to-visible wait and manual replay risk.

Implementation work: Persist the queue wake-up before acceptance and replay it once after a worker restart.

Observable acceptance: The measured run shows at least 99% of accepted jobs in results within 30 seconds and no operator replay.

## Current Testing Decisions

| Testing type | Decision informed | Reason now | Product maturity | Scope | Executor | Gate effect | Effort budget | Stop condition | Evidence retained | Rerun trigger |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Automated Implementation Testing | not-needed-now | This fixture evaluates the accepted-to-visible effect rather than product logic. | Lifecycle propagation fixture | Queue result timing | Not assigned | Does not block this fixture. | None | Stop while no product-code claim is added. | This decision record | Product logic changes. |
| Performance Testing | selected | The promise sets a 99 percent and 30-second threshold. | Lifecycle propagation fixture | 1,000 accepted jobs across one worker restart | Performance reviewer | Supplies quantitative acceptance evidence. | One controlled 1,000-job run | Stop after the threshold and replay count are measured. | [Evidence](./evidence.md) | Load profile, restart model, or threshold changes. |
| Guided Progress Review | not-needed-now | The measured indirect effect supplies the current proof. | Lifecycle propagation fixture | Operator wait and replay risk | Not assigned | Does not block this fixture. | None | Stop when the quantitative result answers the claim. | This decision record | The result needs a guided diagnosis. |
| Unassisted Goal Testing | not-needed-now | This indirect promise does not require a person to exercise a changed path in P3. | Lifecycle propagation fixture | Operator trust effect | Not assigned | Cannot support a lived-human claim. | None | Stop without simulating an operator. | This decision record | A direct human path or P4 review calls for it. |

Human Experience Review: Required for HX-IND-01.

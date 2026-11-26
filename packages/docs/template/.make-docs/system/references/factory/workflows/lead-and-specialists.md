# Lead and Specialists

This is a shipped factory workflow type. Its name is `lead-and-specialists`. The rules in `make-docs://system/contract/factory-contract.md` apply to every step.

## Purpose

The foreman leads one unit. It splits the unit across specialists, for example a researcher, a builder who proves a hypothesis, and a writer, then integrates their results.

Type version: 1.

## When to Use

Use this type for one unit that needs several kinds of skill, or parts that can run side by side.

Do not use it for a unit that one worker can do alone. Use `build-then-review` for that.

## Roles

| Role | Job | Capabilities needed |
| --- | --- | --- |
| Foreman | Claims the unit, splits it into parts, briefs each specialist, integrates the parts, judges the whole, and accepts or escalates. | `read-write-files`, `run-commands`, `launch-agent`, `wait-for-agent`, `read-agent-result` |
| Specialist | Does one part. A specialist is a builder or a custom role, such as a researcher, an analyst, or a writer. | The capabilities of its role. A part that changes files needs `read-write-files`. A software part needs `edit-code`. |
| Reviewer | Checks the integrated result against the requirements. It is never a session that built a part. | `read-write-files`, `run-commands` |

The front desk passes the unit to the foreman. It needs the capabilities of the workflow's human channel.

## Steps

1. The foreman claims the unit and opens its lifecycle run.
2. The foreman splits the unit into parts. Each part has one specialist, a bounded brief, and the evidence to return. The foreman names the order of parts that depend on each other.
3. The foreman starts the specialists and records one assignment for each part. Parts without a dependency can run at the same time.
4. Each specialist returns its actual result and evidence.
5. The foreman inspects each actual result, not the summary.
6. The integration owner joins the parts into one result.
7. The foreman starts a reviewer who built no part. The reviewer checks the joined result against the requirements of the whole unit.
8. If the reviewer finds defects, the foreman first checks the limit. If the loop fails the same way again, or the round limit is reached, the foreman stops and escalates. It does not send the defects back.
9. Otherwise, the foreman sends each defect to the specialist who owns that part, or to the integration owner for a defect in the join. Then the steps repeat from step 4 for those parts.
10. If the reviewer passes the result, the foreman accepts the unit inside the given scope, records the evidence, and closes the unit.

## Optional Steps

- Preflight: run preflight on the unit before the claim in step 1. The person turns this on at setup.

## Limits

| Limit | Default |
| --- | --- |
| Correction rounds before escalation | 3, counted for the whole unit |
| Parallel workers | No more than the wired tools allow |

## Parallel Work

One writer works on each file in each working copy. Each specialist that changes files works in its own working copy, or on files that no other specialist changes. The workflow names one integration owner for the unit. The default is the foreman. The integration owner merges the parts and settles conflicts.

## Returns

- The accepted, integrated result.
- Each specialist's result and evidence.
- The reviewer's evidence for the whole unit.
- The number of correction rounds used.
- Each escalation, if the loop stopped.

## Added Escalation Events

None. The escalation floor applies.

## Examples

Each example names only the capabilities the tools need.

- Software: a researcher reads the docs of a library. A builder with `edit-code` and `isolate-working-copy` proves in its own working copy that the library can do the job. A writer updates the project guide. The foreman joins the parts, and a fresh reviewer checks the whole change.
- Personal: a researcher compares three places for a family trip. An analyst with `run-commands` works out the cost of each. A writer drafts the plan. A reviewer checks the plan against the dates and the budget.
- Business: a researcher collects market facts. An analyst builds the numbers from a data file. A writer drafts the proposal. A reviewer checks each claim against its source.

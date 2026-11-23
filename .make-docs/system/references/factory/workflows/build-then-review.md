# Build Then Review

This is a shipped factory workflow type. Its name is `build-then-review`. The rules in `make-docs://system/contract/factory-contract.md` apply to every step.

## Purpose

One builder does the job. A separate reviewer checks it. The foreman returns defects and repeats within the limit.

Type version: 1.

## When to Use

Use this type for a unit that one worker can do alone, with a clear result that a second worker can check against the requirements.

Do not use it for a unit that needs several kinds of skill at once. Use `lead-and-specialists` for that. Do not use it to work through many units in order. Use `staged-backlog` for that.

## Roles

| Role | Job | Capabilities needed |
| --- | --- | --- |
| Foreman | Claims the unit, writes the briefs, judges the result, accepts or escalates. | `read-write-files`, `run-commands`, `launch-agent`, `wait-for-agent`, `read-agent-result` |
| Builder | Does the job in the brief and returns the actual result and its evidence. | `read-write-files`, `run-commands`; `edit-code` for software work |
| Reviewer | Checks the result against the requirements. It is never the session that built the work. | `read-write-files`, `run-commands` |

The front desk passes the unit to the foreman. It needs the capabilities of the workflow's human channel.

## Steps

1. The foreman claims the unit and opens its lifecycle run.
2. The foreman writes a bounded brief: the outcome, the requirements, the limits, and the evidence to return.
3. The foreman starts the builder and records the assignment.
4. The builder does the job and returns the actual result and its evidence.
5. The foreman inspects the actual result, not the builder's summary.
6. The foreman starts a reviewer who did not build the work. The reviewer's brief names the requirements and the result. It does not repeat the builder's conclusions.
7. If the reviewer finds defects, the foreman first checks the limit. If the loop fails the same way again, or the round limit is reached, the foreman stops and escalates. It does not send the defects back.
8. Otherwise, the foreman sends the defects back to the builder for correction. Then the steps repeat from step 4.
9. If the reviewer passes the result, the foreman accepts the unit inside the given scope, records the evidence, and closes the unit.

## Optional Steps

- Preflight: run preflight on the unit before the claim in step 1. The person turns this on at setup.

## Limits

| Limit | Default |
| --- | --- |
| Correction rounds before escalation | 3 |
| Parallel workers | 1 builder and 1 reviewer at a time for each unit |

## Parallel Work

One unit has one builder, so one writer works on each file. When the foreman runs this type on several units at the same time, each builder works in its own working copy. If two builders change the same file, the foreman is the integration owner unless the workflow names another one. The integration owner merges the work and settles conflicts.

## Returns

- The accepted result.
- The reviewer's evidence that it meets the requirements.
- The number of correction rounds used.
- Each escalation, if the loop stopped.

## Added Escalation Events

None. The escalation floor applies.

## Examples

Each example names only the capabilities the tools need.

- Software: a builder with `edit-code` fixes one reported defect and runs the tests. A reviewer, started fresh with `launch-agent`, reads the change and the defect report and checks the fix.
- Personal: a builder with `read-write-files` drafts a week of meal plans from a list of foods the person likes. A reviewer checks the plans against the list and the budget.
- Business: a builder with `read-write-files` and `run-commands` writes a monthly sales summary from a data file. A reviewer checks each number against the data file.

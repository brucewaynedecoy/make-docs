# Staged Backlog

This is a shipped factory workflow type. Its name is `staged-backlog`. The rules in `make-docs://system/contract/factory-contract.md` apply to every step.

## Purpose

The foreman works through ready units in dependency order. Each unit uses one of the other two types: `build-then-review` or `lead-and-specialists`.

## When to Use

Use this type when the person gives a scope with many units, for example a whole wave, and wants to accept once at the end.

Do not use it for one unit. Use `build-then-review` or `lead-and-specialists` for that.

## Roles

| Role | Job | Capabilities needed |
| --- | --- | --- |
| Front desk | Takes the scope from the person and passes it to the foreman. Carries escalations and the acceptance request to the person. | `message-person` and `receive-answer`, or "wait in session" |
| Foreman | Takes ready units in dependency order, picks a type for each unit, runs it, accepts units inside the scope, and asks the person to accept at the end. | `read-write-files`, `run-commands`, `launch-agent`, `wait-for-agent`, `read-agent-result` |
| Unit roles | The builders, specialists, and reviewers of the type that each unit uses. | The capabilities that the unit's type names. |

For a run that goes on while the person is away, the foreman also needs `wake-on-schedule` or `wake-on-event`. Without either one, the run goes on only while a person keeps a session open.

## Steps

1. The front desk takes the scope from the person and passes it to the foreman.
2. The foreman syncs the work queue and asks for the next ready unit inside the scope (`make-docs work next`, MCP `work_next`, planned). A unit is ready only when the units it depends on are closed.
3. The foreman picks the type for the unit: `build-then-review` for a unit that one worker can do, or `lead-and-specialists` for a unit that needs several kinds of skill.
4. The foreman runs the unit through that type, from claim to close.
5. The foreman accepts the unit inside the given scope on the reviewer's evidence and closes it.
6. The foreman goes back to step 2 while the scope and the limits allow.
7. When every unit in the scope is closed, the foreman sends the person one acceptance request with the reviewed results and their evidence.

At each wake, the foreman runs the loop in the factory contract. It checks open assignments first, then takes new work.

## Optional Steps

- Preflight: run preflight on each unit before its claim. The person turns this on at setup.

## Limits

| Limit | Default |
| --- | --- |
| Correction rounds before escalation | 3 for each unit |
| Parallel workers | No more than the wired tools allow |
| Units at the same time | Only units with no open dependency on each other |
| Claim size | A phase |

## Parallel Work

The foreman can run units side by side when they do not depend on each other. One writer works on each file in each working copy. Each unit that changes files works in its own working copy. The workflow names one integration owner for the scope. The default is the foreman. The integration owner merges the units and settles conflicts, in dependency order.

## Returns

- Each accepted unit, with its reviewer's evidence.
- One acceptance request for the whole scope.
- Each escalation, with the units it blocked.

## Added Escalation Events

None. The escalation floor applies. The fifth floor event, work ready to accept, fires once at the end of the scope, not after each unit.

## Examples

Each example names only the capabilities the tools need.

- Software: the person gives a wave of six phases. The foreman, woken by a tool with `wake-on-event` each time a worker finishes, runs each phase in order. Most phases use `build-then-review`. One phase that needs research uses `lead-and-specialists`. The person accepts the wave once.
- Personal: the person gives a home move as a backlog: a packing list, a price comparison of movers, an address change list, and a plan for the new rooms. The foreman works through the tasks in order and sends questions through a channel with `message-person` and `receive-answer`. Booking a mover spends money, so it goes to the person as a floor event.
- Business: the person gives a quarter-end close: collect the reports, check each account, write the summary, and prepare the board pack. Each step waits for the one before it. The person accepts the full close at the end.

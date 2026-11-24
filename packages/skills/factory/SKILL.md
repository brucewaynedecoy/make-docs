---
name: factory
description: Run one ready Make Docs factory workflow on approved backlog work, with workers, separate review, correction, and escalation to the person. Use only when the user explicitly requests $factory or this factory skill.
---

# Factory

Run one saved factory workflow of one project. You are the foreman. You take ready work, give jobs to the tools that the workflow binds, judge the results, have them reviewed, correct them within the limit, and bring decisions and the final result back to the person. Make Docs plans the work and records the run. It never starts a tool. You do the work through the bound tools.

The rules are in the factory contract. Read `.make-docs/system/contracts/factory-contract.md`, or `make-docs://system/contract/factory-contract.md` with `make-docs resource read` when the local body is absent. Where this Skill and the contract differ, the contract wins.

This Skill runs only when it is named. A wake from a schedule or an event names it. The backlog review action "Work on this wave" names it when a workflow is `ready`. Installation, a keyword, or another Skill never starts it (rule `backlog-review-handoff`).

## Name the project

Every run is for one project and one workflow. Take both from the request, the wake, or the handed wave. Never take the project from the folder where you work (rule `skill-names-project`).

- Name the project in every factory call: `--project <name>` or `--target-root <checkout>`, or the MCP `project` or `targetRoot` input. Do this for reads too.
- The first read gives the project's checkout. Use that checkout path in every other call: `--target-root <checkout>` for `make-docs work` commands, and `--repo-root <checkout>` for `make-docs lifecycle` and `make-docs work evidence` commands.
- Name the project in every message to the person.
- On `project-missing`, `project-not-found`, `project-mismatch`, or `project-checkout-unclear`, stop that call. Send no work. Tell the person the fix from the project refusals in [the messages](references/messages.md).

## Load the workflow

1. Read the workflow: `make-docs factory workflow show <workflow> --project <name>` (MCP `factory_workflow_show`). It gives the readiness, the plan revision, each drift reason code, and the grants beside the plan.
2. Read its workflow type. A shipped type is `make-docs://system/reference/factory/workflows/<type>.md`. A project type is `docs/assets/project/factory/workflows/<type>.md` in the checkout.
3. Read the factory contract.
4. Refuse a workflow that is not `ready` (rule `only-ready-takes-work`). Take no new work. Tell the person the state and the smallest fix:
   - `draft`: run the `factory-setup` Skill to bind each role and prove it.
   - `wired`: run the `factory-setup` Skill to pass the test task under the current plan.
   - `drifted`: explain each drift reason code in plain words, and give its next step. Send this as floor event 4 (rule `drift-escalates`).
   - No workflow or no Store: run the `factory-setup` Skill. The factory has no zero-config mode.
5. Read the plan of the `ready` revision. It names the tool of each role, the round limit, the claim size, the added escalation events, the integration owner, the human channel, and whether the preflight step is on.

## Run the loop

Read [the run loop](references/run-loop.md) before the first step. It gives each command. At each wake, do these steps in order (rule `loop-order`):

1. Sync the work queue and read the readiness again. If the workflow is `drifted`, escalate and take no new work.
2. Check each open assignment through its task handle. Settle each `unknown` assignment first (rule `unknown-first`). Renew each claim.
3. Judge each returned result. Send it to a reviewer who did not build it. Return defects for correction within the limit.
4. Accept each unit inside the given scope on the reviewer's evidence. Record the evidence. Close the unit.
5. Take the next ready unit when the scope and the limits allow. Run preflight first only when the workflow turns that step on (rule `preflight-opt-in`).
6. Escalate each floor event. At the end of the given scope, send one acceptance request.

A finished worker returns control to you. Go on with the loop. Do not ask the person to start the run again after each unit (rule `completion-returns-control`).

## Keep the working rules

Read [the working rules](references/working-rules.md). In short:

- Judge the actual work, not a summary. Green tests do not prove the right behavior.
- A reviewer never reviews work it built, and never gets the builder's summary.
- Hand each role only the context kinds that its plan lists.
- Keep the claim ID private. Give it only to your own calls that need it.
- Never write file contents, prompts, briefs, environment values, transcripts, or credentials into a factory record or a progress note.
- Move an assignment only along the move table. The CLI counts the correction rounds.
- Before an action outside the default authority, such as a merge or a deploy, record the use of a grant: on an open assignment of the unit, or on the unit's live claim when each of its assignments is final.
- In a folder without git, save a backup of each file before a worker changes it.

## Talk to the person

Use the workflow's human channel. The person hears only the five floor events and the events that the workflow adds. Read [the messages](references/messages.md) for the message rules, a form for each event, and the acceptance request.

## Finish

At the end of the given scope, send one acceptance request with each accepted unit and its evidence. A reviewed and accepted unit is not the person's acceptance. A Store receipt is never product acceptance (rule `receipt-not-acceptance`).

Never merge, deploy, publish, or spend money without a recorded grant use. For one unit, record the use in the same save that accepts the builder's assignment, before the unit closes.

Some actions wait for the person's acceptance of the whole scope, such as the merge of the scope. For such an action:

1. Keep the claim of the unit that the action belongs to. For an action on the whole scope, that is the last unit of the scope. Accept its assignments, but do not close the unit and do not complete its lifecycle run yet. Renew the claim at each check.
2. Send the acceptance request, and wait for the person's answer.
3. After the person accepts, record the grant use on the live claim: `make-docs factory grant-use record <unit> --workflow <workflow> --action <action> --run-id <run-id> --claim-id <claim-id> --project <name>` (MCP `factory_grant_use_record`).
4. Do the action only after the CLI records the use. Then close the unit and complete its lifecycle run.

If the CLI refuses the grant, do not do the action. Ask the person, as in the Grants section of [the working rules](references/working-rules.md). No action outside the default authority happens without a recorded grant use.

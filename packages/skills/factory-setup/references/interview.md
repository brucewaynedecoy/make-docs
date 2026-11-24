# Interview

Use this reference for setup Step 3. The interview asks for preferences and permissions only. The person does not need to know tool names, adapters, task handles, or Store tables.

## How to Ask

- Ask one decision at a time.
- Put your recommendation first, with its main reason.
- Show at most two options in one question: your recommendation and the one best other choice, each with what it changes. When more choices exist, say so in one line and name where the person can see them, such as a section of the factory contract. List them only when the person asks.
- Use a choice control when your session has one. Otherwise use a short list.
- Accept a clear "yes" as the recommendation. Allow a different answer or a free-form answer.
- Explain each internal term in plain words beside it, for example "a grant (a permission that you give the factory for one kind of action)".
- Offer only choices that the found tools can do. Do not offer a human channel or a wake method that no tool claims. Step 4 proves the chosen one. When its proof fails, tell the person and ask the question again without that choice.
- When only one choice is possible, do not ask. Say what setup will use and why.

## Never Ask

Never ask a question whose answer you can find. Find these facts yourself:

- which tools are on the machine, what each one can do, and its version;
- the project's name and ID, and its checkout folder;
- whether the folder uses git;
- whether a repository or user rule forbids worktrees;
- the version of a workflow type, from its `Type version: N` line;
- which roles a workflow type needs, from its `## Roles` table.

## The Questions

Ask these in order. Skip a question when the person already answered it in their request, or when only one answer is possible.

1. Workflow type. The shipped types are `build-then-review` (one builder and a separate reviewer), `lead-and-specialists` (the foreman splits one unit across specialists), and `staged-backlog` (the foreman works through ready units in order). Project-owned types are in `docs/assets/project/factory/workflows/`. Show two options. For most work, recommend `build-then-review`, and give `staged-backlog` as the other choice for whole waves. When the person asked for whole waves, swap the two. Then say that other types exist, in the Workflow Types section of `make-docs://system/contract/factory-contract.md` and in the project's own type folder. If a project type uses a shipped name, stop, name both files, and ask the person to rename the project type. Save nothing until it is fixed (`no-silent-replace`).
2. Human channel: how the factory reaches the person when it needs a decision. The choices are each tool that claims both `message-person` and `receive-answer`, and "wait in session" (the factory asks in the chat and waits for the person to come back). Show two options. When the person wants work to go on while they are away, recommend the tool with the most proved and the shortest "does not cover" list, and give "wait in session" as the other choice. Otherwise recommend "wait in session", and give that tool as the other choice. When more tools fit, say how many more there are, and list them only when the person asks. A workflow has one human channel (`one-human-channel`).
3. Wake method: what starts the foreman again. The methods are `event` (a tool with `wake-on-event` starts it when something happens, such as a finished agent), `schedule` (a tool with `wake-on-schedule` starts it at set times), and `person` (the person starts each run in a session). Show two options: the first method that a tool can do in the order `event`, `schedule`, `person` as the recommendation, and the next one in that order as the other choice. When a third method is possible, say so, and name the Waking section of `make-docs://system/contract/factory-contract.md`. A scheduled wake must come more often than the claim time limit (30 minutes by default), so recommend every 10 minutes (`wake-before-expiry`). With `person`, say that the factory runs only while the person keeps a session open (`no-wake-said`).
4. Limits. Show the defaults in one question: 3 correction rounds before the foreman asks the person, no more parallel workers than the tools allow, and a claim size of one phase. Recommend the defaults. A limit never removes one of the five escalation floor events.
5. Optional steps. Ask whether the factory runs preflight on each unit before it claims the unit (preflight settles the owner choices that the unit needs). Recommend off unless the person wants those choices settled before each unit starts. Without this step, the factory never starts preflight (`preflight-opt-in`).
6. Added escalation events and gates. Ask whether any other event must always reach the person, beyond the five floor events. Recommend none. The floor events always reach the person, and a workflow cannot remove them (`escalation-floor`).
7. Grants. See [Grants](#grants).
8. Working-copy method. See [Working Copies](#working-copies).
9. Which tool fills a role, only when two or more proved tools fit the same role. Show two options: the tool that proved the most of what the role needs, with the shortest "does not cover" list, as the recommendation, and the next best tool as the other choice. When more tools fit, say how many more there are.
10. Each known loss. See [Known Losses](#known-losses).

Custom roles: ask only when the person wants a role that the workflow type does not have, such as a researcher or a writer. A custom role uses a new name and never replaces a standard role (`custom-role-new-name`). It names its job, its capability IDs, what it returns (`custom-role-fields`), and its context kinds (`custom-role-context`).

## Grants

A grant (a permission for one kind of action outside the default authority) lets the foreman act without asking first. Ask about each action that the workflow can need: `merge`, `deploy`, `publish`, and `spend`. Ask about one action at a time.

For each action, ask for its scope, and recommend the narrowest scope that does the job (`grant-scope`). Show two options: no grant (recommended) and `once`. Then say that a `standing` grant is also possible, and that the Grants section of `make-docs://system/contract/factory-contract.md` explains each scope. When the person asked for a grant that holds for every run, show `standing` with an expiry time (recommended, because it is the narrowest scope that does that job) and `once` as the other choice. The scopes are:

| Choice | What it means | When to recommend it |
| --- | --- | --- |
| No grant | The foreman asks the person each time, through the human channel. | The default for every action. Recommend it first. |
| `once` | One use. The first use spends it. | The person wants one action done without a question. |
| `standing` | Every run of the workflow, until the person revokes it. | Only when the person asks for it. |

A `run` grant (one lifecycle run, until that run ends) names a run. A run does not exist at setup. So the foreman asks for a `run` grant during a run, after the person answers an escalation.

Then ask for an optional expiry time, and recommend one for a `standing` grant. Record who granted it as a short label, such as "the person", never as an account or an email address. No grant is saved without a scope. Grants never go in the config file or a local copy (`grants-not-committed`). `factory workflow save` writes them in the Store (`grant-written`).

## Working Copies

Save one working-copy method for each workflow (`worktree-policy`).

1. Read the repository instructions and the person's instructions first. When a rule forbids worktrees, use `none`. Do not ask, and say which rule decided it.
2. When the folder does not use git, use `none`. There, the run Skill saves a backup of each file before a worker changes it, and the Store records each backup.
3. Otherwise, when a tool proved `isolate-working-copy`, ask. Recommend a separate working copy for each worker (method `worktree`) when parallel workers can change files at the same time. Otherwise recommend `none`.
4. When parallel workers can change the same files, the workflow names one integration owner (the role that merges the work and settles conflicts). Recommend the foreman (`one-writer`).

## Known Losses

A known loss is something that the workflow runs without:

- a capability that no tool could prove;
- each item on a proof's "does not cover" list;
- no way to wake on its own;
- a tool that reports no version, so the factory cannot see when it changes.

Name each known loss in plain words, and say what it means for the person. Ask the person to accept it. When one proof has several "does not cover" lines, show them together, and let the person accept all of them or name the ones they do not accept. For a loss that the person does not accept, show two fixes: the one that you recommend and the one best other fix. The fixes are another tool, another proof, or a smaller workflow. When a third fix is possible, say so. Setup does not run the test task until each known loss is accepted or fixed. Save each accepted loss as one short line, at most 120 characters, in the binding's `knownLosses` list.

## Context Kinds

Do not ask about context kinds for the standard roles. Use the defaults from the contract (`role-context`): a builder gets `unit-record`, `requirements`, `project-files`, and `defect-list`. A reviewer gets `unit-record`, `requirements`, `project-files`, `candidate-result`, and `evidence-links`, and never `builder-summary` by default, so the brief does not steer the reviewer. The front desk and the foreman need no list. Ask for a list only for a custom role, from the fixed set: `unit-record`, `requirements`, `project-files`, `candidate-result`, `defect-list`, `evidence-links`, and `builder-summary`. When the person asks to give the reviewer `builder-summary`, explain that it can steer the review, and recommend against it.

## Example Question

> **How should the factory reach you when it needs a decision?**
>
> I recommend **tool C**. Its docs say that it can send you a message and read your answer, so work can go on while you are away. Next, setup sends you one test message there to prove it.
>
> - **Tool C** (recommended): the factory messages you there, and you answer there.
> - **Wait in session**: the factory asks in this chat and waits until you come back. Work that needs you stops until then.

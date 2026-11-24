# Messages to the Person

Send each message through the workflow's human channel. When the channel is "wait in session", ask in the chat and wait for the person to come back. Describe each tool by what it does, never by its name.

## What the Person Hears

The person hears only these events (rule `escalation-floor`):

1. An action outside the granted authority, such as a merge, a deploy, a publish, or spending money.
2. A scope change: a change to the outcome, the scope, or the acceptance criteria.
3. A correction loop that stops, because it fails the same way again or reaches its round limit.
4. A missing tool, a missing permission, or wiring that has broken. A `drifted` workflow is this event.
5. Work that is ready for the person to accept at the end of the given scope.

Also send each added event that the workflow type or the plan names. An `escalations` entry in the workflow config can only add an event. Nothing in the config can remove a floor event, and the config check refuses a key that tries to change the floor.

Do not send routine progress, polling, or state mechanics. The person can read `make-docs factory status` at any time.

## Message Rules

Each message is a self-contained request (rule `message-rules`). The person must not need to open a link or read a transcript to understand it. Each message says:

- the project, by its name;
- what happened;
- what the factory needs from the person;
- whether the need is required or optional;
- what work it blocks;
- what happens after the person answers.

Explain each internal term, code, and identifier in plain words. A link can add detail. Never put a claim ID, a secret, a prompt, or file contents in a message (rule `skill-names-project`, rule `never-log`).

## Escalation Form

Use this form. Fill each part with plain words. The angle brackets are placeholders.

```text
Project <project name>: <one line: what happened>.

What happened: <the event, in plain words, with the unit and the evidence that matters>.
What I need: <the one answer or action that the factory needs>.
Required or optional: <required | optional>. <why>
What it blocks: <the units or steps that wait for the answer>.
After you answer: <what the factory does next>.
```

Example for a correction loop at its limit (floor event 3):

```text
Project <project name>: the fix for phase 3 stopped after 3 correction rounds.

What happened: The reviewer found the same defect three times. The export still drops the last row of the data file. The CLI refused a fourth round (code round-limit-reached: the job used its limit of correction rounds).
What I need: Choose one: allow 3 more rounds, or change the requirement for the last row.
Required or optional: Required. The factory cannot accept phase 3 without it.
What it blocks: Phase 3, and phase 4, which needs the export.
After you answer: The factory sends the defect back with your choice, or records the new requirement. Then it reviews the fix again.
```

Example for a spent grant (floor event 1):

```text
Project <project name>: phase 2 is ready to merge, but the merge permission was used.

What happened: You gave a one-time permission to merge, and the factory used it for phase 1. The CLI refused a second merge (code grant-spent: a one-time permission was already used).
What I need: Say yes or no to one merge of phase 2.
Required or optional: Required for the merge. Other work goes on.
What it blocks: The merge of phase 2.
After you answer: On yes, the factory records your permission, accepts phase 2, and merges it. On no, phase 2 stays reviewed, not accepted, and not merged.
```

## Project Refusals

When a factory call is refused for its project, stop that call and send no work. Tell the person the fix, and name the project that the run is for, as the request or the wake named it:

| Code | Plain words | Fix |
| --- | --- | --- |
| `project-missing` | The call named no project. | Name the project with its name or its checkout path. |
| `project-not-found` | The Store knows no project with that name. | Check the project name with `make-docs project list`. |
| `project-mismatch` | The name and the path give two different projects. | Name one project. |
| `project-checkout-unclear` | The project has no single checkout on this machine. | Name the checkout path. |

## Acceptance Request

At the end of the given scope, send one acceptance request (rule `scope-acceptance`). It lists each accepted unit and links its evidence.

```text
Project <project name>: <scope> is ready for you to accept.

What happened: The factory finished <scope>. A separate reviewer checked each unit against its requirements.
- <unit 1>: <one line on the result>. Correction rounds: <n>. Evidence: <link>.
- <unit 2>: <one line on the result>. Correction rounds: <n>. Evidence: <link>.
Open limits: <each known limit, or "none">.
What I need: Accept the result, or name what to change.
Required or optional: Required. The work is reviewed, but it is not accepted until you accept it.
What it blocks: <the next scope, or "nothing else">.
After you answer: On accept, the factory <records your answer and ends the run>. On a change, it opens the change as new work and tells you the plan.
```

## Status Report

When the person asks for status, answer in plain words first, with the project name. Use `make-docs factory status --project <name>` as the source.

```text
Project <project name>, workflow <workflow>: <readiness in plain words>.
- <unit>: <what the tool is doing>, last checked <time>, round <n> of <limit>.
Next: <what the factory does next>.
```

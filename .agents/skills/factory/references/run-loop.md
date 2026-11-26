# Run Loop

Use this reference for each step of the factory loop. Every command is also an MCP tool: join the command path with underscores, for example `factory_assignment_save`. Use the actual help or tool schema of the installed CLI when a flag is unclear.

In each command below, `<name>` is the project name, `<checkout>` is the checkout path that the first factory read gave, and `<workflow>` is the workflow that you run. Never leave out the project, also for a read (rule `skill-names-project`).

## Roles and Tools

The `ready` plan revision names one tool for each role. Use only that tool for that role. To use another tool, the person runs the `factory-setup` Skill, which saves a new plan that needs its own test task.

Describe each tool by what it can do, never by its name, in a brief or a message. Start a job through the bound tool's own way to start an agent, wait for it, and read its result: the capabilities `launch-agent`, `wait-for-agent`, and `read-agent-result`. In the smallest setup, the one agent is the front desk and the foreman, and each builder and reviewer is a fresh agent that it starts. If a bound tool cannot do a step that its proof covered, stop that job and escalate floor event 4.

## 1. Sync and Read Readiness

- `make-docs work sync --target-root <checkout>` (MCP `work_sync`). Every other work command syncs first, so this step can be the next work command.
- `make-docs factory status --project <name>` (MCP `factory_status`). It shows the readiness of each checkout, each lifecycle run, each claimed unit, its tool, its state, and the last check time.
- If the workflow is `drifted`, take no new work. Escalate floor event 4 with each drift reason code in plain words and its next step. Go on only with step 2 for work that already runs: an open assignment keeps the plan revision that it names.
- A project type with the name of a shipped type is `type-name-clash`. Escalate it as floor event 4 and take no new work (rule `no-silent-replace`).
- If the workflow is `wired` with the readiness code `test-failed`, the latest test task under its plan failed. Take no new work. Tell the person what the status says, and that the `factory-setup` Skill must pass the test task again (rule `latest-test-decides`).

### Check the Bound Tools Again

Do this before you take new work: at the start of a run, and before step 5 at each wake (rule `tools-rechecked`). Make Docs never contacts a tool, so only you can find a change.

1. Read the saved tools: `make-docs factory tools list` (MCP `factory_tools_list`). It takes no project. `make-docs factory status --project <name>` shows the age of each bound tool's proofs, and calls a proof older than 30 days old.
2. For each tool that the `ready` plan binds, look at the tool itself. Find its version, and whether it is `available`, `missing`, or `blocked`.
3. When the version and the state match the saved record, change nothing.
4. When one differs, save what you found: `make-docs factory tools save` (MCP `factory_tools_save`), with the tool's record version as `expectedVersion`. Keep each proof as it is. A proof names the tool version that it ran under, so do not give an old proof the new version.
5. Read the readiness again. A changed tool makes the workflow `drifted`. Then take no new work, and escalate floor event 4 as in the list above.
6. When a proof is old but the version and the state are the same, go on. Tell the person in the next message that the proof is old, and that the `factory-setup` Skill can prove the tool again.

## 2. Check Open Assignments and Renew Claims

List them: `make-docs factory assignment list --workflow <workflow> --project <name>` (MCP `factory_assignment_list`).

A task handle is the ID that the bound tool gives a job, for example `task-1234`. It is an ID, not text for a person. For `make-docs factory assignment start` and `make-docs factory assignment save`, `--task-handle` takes one line of at most 1024 characters with no space, no tab, and no other white space. It must not look like a credential or an environment setting, such as `NAME=value` or `$NAME`. The CLI refuses another value and names the field, never the value. `make-docs work claim --task-handle` checks only that the handle is not empty. Use the same form there, so that one handle fits each command.

Settle each `unknown` assignment before any other step (rule `unknown-first`). An assignment is `unknown` when the factory lost track of the job, for example a lost reply from the tool. Check its task handle through the bound tool:

| What the handle check shows | Move |
| --- | --- |
| The job is still running | `running`, reason `handle-checked` |
| The job returned a result | `returned`, reason `result-returned` |
| The job was not started | `offered`, reason `handle-checked`, then start the job through the bound tool |
| The job is gone or failed | `failed`, reason `handle-not-found` or `tool-failed` |

Never send a job again after an unclear handoff. Check the handle first (rule `check-before-resend`). If the check finds the job, use it. Send the job again only when the check shows that it never started. A new assignment for the same job is refused with `assignment-open` while the `unknown` one is open, so settle that one first.

Check each other open assignment through its handle too. A check that changes no status records only the check time:

`make-docs factory assignment save <assignment> --expected-version <n> --claim-id <claim-id> --project <name>`

Renew each claim that you hold at each check: `make-docs work claim <unit> --claimant <you> --expected-version <n> --claim-id <claim-id> --target-root <checkout>`. Claim timing:

| Claim time | Value |
| --- | --- |
| Check at least every | 10 minutes |
| A claim lasts, by default | 30 minutes |
| Shortest claim | 20 minutes |
| Longest claim | 24 hours |

A wake must come more often than the claim time (rule `wake-before-expiry`).

### An Expired Claim

If a claim ran out, the unit can be taken again only after a check of every open task handle of that unit (rule `check-handles-before-takeover`). This holds for a claim of another foreman, and for your own claim that ran out while you waited.

1. List the unit's open assignments, and check each task handle through its bound tool.
2. Take over: `make-docs work claim <unit> --claimant <you> --expected-version <n> --takeover-from <old-claimant> --handle <seen> --task-handle <handle> --target-root <checkout>`. For your own expired claim, `<old-claimant>` is your own claimant name.
   - `<seen>` is what the check of the old claim's task handle saw. It is one of these values:
     - `running`
     - `stopped`
     - `finished`
     - `not-found`
     - `no-handle`
   - `<handle>` is your own task handle, so that the next foreman can check it. Without it, a later takeover has no handle to check.
3. The CLI refuses a takeover while the old handle shows the job still running. When the old claim has no task handle, it refuses too: ask the person to release the claim (`make-docs work release`).
4. Load the exact plan revision that each open assignment names: `make-docs factory workflow show <workflow> --revision <n> --project <name>`. Go on under that revision. The round count of each job goes on from where it was.
5. Record each check with the new claim ID. Use reason `taken-over` for a status move after the takeover.

## 3. Judge, Review, and Correct

### Start a Job

1. Record the assignment first: `make-docs factory assignment start <unit> --workflow <workflow> --role <role> --run-id <run-id> --claim-id <claim-id> --part <label> --target-root <checkout>`. The new assignment is `offered` under the `ready` plan revision. The CLI refuses with `not-ready` when the workflow is not `ready`, and with `assignment-open` when the job already has an open assignment.
2. For a builder job in a folder without git, save a backup of each file that the job will change, before the job starts (rule `backup-before-change`). See [the working rules](working-rules.md#backups-outside-git).
3. Write the brief from the context kinds that the role's plan lists (rule `role-context`). See [the working rules](working-rules.md#context-for-each-role).
4. Start the job through the bound tool. Record its task handle and the move: `make-docs factory assignment save <assignment> --expected-version <n> --claim-id <claim-id> --status running --reason tool-started --task-handle <handle> --project <name>`.
5. If the tool's reply is lost or unclear, move the assignment to `unknown` with reason `handle-not-found`, and settle it as in step 2 of the loop. Do not start the job again first.

A job is one unit, one role, and one part label. Give each part of a unit its own part label, such as `research` or `draft`, so that the parts run as separate jobs. A unit with one part uses `main`.

### Judge the Result

When the builder returns, move its assignment to `returned` with reason `result-returned`. Inspect the actual result: the changed files, the outputs, and the evidence. Do not judge the builder's summary (rule `judge-actual-work`).

### Review

1. Move the builder's assignment to `in-review` with reason `sent-to-review`.
2. Start a reviewer job for the same unit and part, with role `reviewer`. The reviewer is never the session that built the work (rule `reviewer-not-builder`). Its brief holds only the reviewer's context kinds, never `builder-summary`.
3. When the review returns, move the reviewer's assignment to `returned`, then `in-review` while you check that the review covers the actual result, then `accepted` with reason `review-passed` for a pass or `defects-found` for a list of defects.

### Correct

When the review finds defects:

1. Compare them with the defects of the round before. If the loop fails the same way again, stop. Do not send the defects back. Escalate floor event 3 with the evidence (rule `stop-repeat-failure`).
2. Otherwise, move the builder's assignment to `needs-correction` with reason `defects-found`. The CLI counts the round.
3. If the CLI refuses with `round-limit-reached`, stop. Escalate floor event 3 with the evidence. Do not start a new assignment to get around the limit. A new assignment for the same job starts at the same round count.
4. Send the defects to the builder. Move the assignment to `running` with reason `correction-sent`. Then judge and review again.

### More Rounds After the Limit

Only the person can reset the round count. When the person allows more rounds:

1. Record the answer as a `once` grant for the action `reset-correction-rounds`, with a grant-only save: `make-docs factory workflow save <workflow> --grants-json <file> --target-root <checkout>`.
2. Move the builder's assignment to `cancelled` with reason `round-limit-reached`: `make-docs factory assignment save <assignment> --expected-version <n> --claim-id <claim-id> --status cancelled --reason round-limit-reached --project <name>`.
3. Start a new assignment for the same job with `--reset-rounds`: `make-docs factory assignment start <unit> --workflow <workflow> --role builder --run-id <run-id> --claim-id <claim-id> --part <label> --reset-rounds --target-root <checkout>`. The CLI spends the grant, and the new assignment starts at round 0.
4. Send the defects to the builder through the new assignment.

### Status Moves

Move each assignment only along this table (rule `status-moves`). `accepted`, `failed`, and `cancelled` are final. Never change a final assignment. A job that must run again after a final status gets a new assignment.

| From | Allowed next status |
| --- | --- |
| `offered` | `running`, `unknown`, `failed`, `cancelled` |
| `running` | `returned`, `unknown`, `failed`, `cancelled` |
| `returned` | `in-review`, `needs-correction`, `unknown`, `failed`, `cancelled` |
| `in-review` | `accepted`, `needs-correction`, `unknown`, `failed`, `cancelled` |
| `needs-correction` | `offered`, `running`, `unknown`, `failed`, `cancelled` |
| `unknown` | `offered`, `running`, `returned`, `in-review`, `needs-correction`, `failed`, `cancelled` |
| `accepted`, `failed`, `cancelled` | None |

Give each move one status history reason code. These are the status history codes:

- `assigned`
- `tool-started`
- `result-returned`
- `sent-to-review`
- `review-passed`
- `defects-found`
- `correction-sent`
- `handle-not-found`
- `handle-checked`
- `taken-over`
- `stopped-by-person`
- `stopped-by-foreman`
- `tool-failed`
- `round-limit-reached`
- `scope-changed`

The CLI refuses another move with `illegal-move`, and a change to a final assignment with `final-status`.

## 4. Accept and Close

Inside the given scope, accept each unit on the reviewer's evidence (rule `scope-acceptance`):

1. Accept the builder's assignment: `make-docs factory assignment save <assignment> --expected-version <n> --claim-id <claim-id> --status accepted --reason review-passed --project <name>`.
2. Record the evidence: `make-docs work evidence record <unit> --kind <kind> --payload-json <file> --repo-root <checkout>` (MCP `work_evidence_record`), then `make-docs lifecycle attach-evidence --run-id <run-id> --expected-version <n> --evidence-id <id> --kind <kind> --project-path <path> --repo-root <checkout>` (MCP `lifecycle_attach_evidence`). Give `--project-path` or `--external-reference`, never both. The optional `--digest <digest>` takes only the form `sha256:` and then 64 lower-case hex characters. The CLI refuses another form, and nothing changes. `work evidence record` has no digest flag and no such rule. Evidence is a link, not content.
3. Close the unit: `make-docs work close <unit> --expected-version <n> --claim-id <claim-id> --target-root <checkout>` (MCP `work_close`). The work queue refuses with `factory-assignment-open` while an assignment of the unit is open. Settle that assignment first. Never close a unit with an open assignment.
   - `<n>` is the current unit revision. An edit to the unit's work file, such as a checked task box, raises the unit revision at the next sync. So after each edit to that file, and before `work close`, apply the sync and read the revision again: first `make-docs work sync --target-root <checkout>` (MCP `work_sync`), then `make-docs work next --level <claim-size> --claimant <you> --target-root <checkout> --json` (MCP `work_next`). `work next` alone only checks the sync, so it still shows the old revision. Your claimed unit is in the `waiting` list, because you hold its claim, and its `revision` field is the number to use. A close with an old revision is refused with `version-conflict`, and the unit stays open and claimed.
4. Integrate the result. When parallel workers changed the same file in separate working copies, the integration owner of the plan merges the work (rule `one-writer`).
5. When the claimed unit is closed, complete its lifecycle run: `make-docs lifecycle complete --run-id <run-id> --expected-version <n> --repo-root <checkout>`.

### An Action Outside the Default Authority

A merge, a deploy, a publish, or spending money is outside the default authority, also inside the scope (rule `grant-for-merge-deploy`). Never do one without a recorded grant use. There are two ways to record a grant use, and both make the same grant checks: on an open assignment of the unit, or on the unit's live claim when each of its assignments is final. Both need the live claim, so record the use before the unit closes. After the close, the CLI refuses with `claim-not-held`.

- For the merge or deploy of one unit, record the grant use in the same save that accepts the builder's assignment: `make-docs factory assignment save <assignment> --expected-version <n> --claim-id <claim-id> --status accepted --reason review-passed --grant-use <action> --project <name>`. The move and the grant use are one write. If the CLI refuses the grant, the assignment stays `in-review` and nothing changes. Then do not do the action. Ask the person, as in [the working rules](working-rules.md#grants), and save the accept again with the grant use after the answer.
- For an action during a job, such as spending money, record the grant use on the open assignment before the action: `make-docs factory assignment save <assignment> --expected-version <n> --claim-id <claim-id> --grant-use <action> --project <name>`.
- For an action that waits for the person's acceptance of the whole scope, such as the merge of the scope, record the grant use on the live claim. See [An Action at the End of the Scope](#an-action-at-the-end-of-the-scope).

### An Action at the End of the Scope

Some actions wait until the person accepts the whole scope. Then each assignment is final, so the grant use goes on the live claim of a unit.

1. Keep the claim of the unit that the action belongs to. For an action on the whole scope, that is the last unit of the scope. Accept its assignments and record its evidence, but do not close the unit and do not complete its lifecycle run yet.
2. Renew the claim at each check while you wait. If the claim ran out, take it over as in [An Expired Claim](#an-expired-claim).
3. Send the acceptance request, as in step 6, and wait for the person's answer.
4. After the person accepts, record the grant use: `make-docs factory grant-use record <unit> --workflow <workflow> --action <action> --run-id <run-id> --claim-id <claim-id> --project <name>` (MCP `factory_grant_use_record`). `<run-id>` is the lifecycle run of the unit's assignments. The result names the grant, the action, the lifecycle run, and the time.
5. Do the action only after the CLI records the use. Make Docs records the use and never does the action.
6. Then close the unit and complete its lifecycle run, as in step 4.

The CLI refuses the call with `assignment-open` while an assignment of the unit is open. Then record the use on that assignment, or settle it first. If the CLI refuses with `grant-missing`, `grant-out-of-scope`, `grant-spent`, or `grant-expired`, nothing changed. Do not do the action. Ask the person, as in [the working rules](working-rules.md#grants), and record the use again after the answer.

When no unit of the scope has a live claim any more, the factory cannot record the grant use. Do not do the action. Tell the person which action waits, so that the person can do it.

## 5. Take the Next Unit

Before the first step, [check the bound tools again](#check-the-bound-tools-again).

1. Find ready work inside the scope: `make-docs work next --level <claim-size> --claimant <you> --target-root <checkout>` (MCP `work_next`). The claim size comes from the plan. The default is `phase`. These are the claim sizes:
   - `wave`
   - `phase`
   - `stage`
   - `task`
2. When the workflow turns on the preflight step, run the `preflight` Skill on the unit before the claim. Without that step, never start preflight (rule `preflight-opt-in`).
3. Claim it: `make-docs work claim <unit> --claimant <you> --expected-version <n> --task-handle <handle> --target-root <checkout>` (MCP `work_claim`). A new claim shows its claim ID once. Keep it private.
4. Open one lifecycle run for the claim at stage `implementation`: `make-docs lifecycle start --stage implementation --checkpoint <short-progress> --repo-root <checkout>` (MCP `lifecycle_start`) (rule `claim-opens-run`). Each assignment of the claim names that run.
5. Choose the team from the plan and the workflow type, then start the jobs as in step 3.

Report progress with `make-docs work report <unit> --expected-version <n> --claim-id <claim-id> --note <text> --target-root <checkout>` (MCP `work_report`). The note follows the never-log list (rule `work-note-never-log`).

### Workflow Types

- `build-then-review`: one builder job with part `main`, then a reviewer job.
- `lead-and-specialists`: one job for each part, each with its own part label. The integration owner joins the parts. The reviewer built no part.
- `staged-backlog`: take the ready units inside the scope in dependency order, and run each one as `build-then-review` or `lead-and-specialists`. Send the acceptance request once, at the end of the scope.

### Quick Items

The front desk turns a small request into a quick item: `make-docs work add <title> --target-root <checkout>` (MCP `work_add`). Route it by capability, like any other unit. A small job can still go to a separate agent (rule `match-by-capability`).

### A Wave from Backlog Review

When the backlog review action "Work on this wave" hands you a wave, the wave is the given scope. The handoff names the project and the ready workflow. Use them, never the folder where you work. Check readiness as in [Load the workflow](../SKILL.md#load-the-workflow). Then take the ready units inside the wave, one claim at a time, at the plan's claim size.

## 6. Escalate and Ask to Accept

Send each floor event and each added event to the person through the human channel. See [the messages](messages.md). Go on with independent work while you wait for an answer. Pause only the work that the answer blocks.

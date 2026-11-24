# Working Rules

These rules apply to every job in every workflow type. The factory contract holds the full rules.

## Judge and Review

- Judge the actual work: the changed files, the outputs, and the evidence. A worker's summary is not the work (rule `judge-actual-work`).
- Green tests do not prove the right behavior. Do not weaken a requirement to make a result pass.
- A reviewer never reviews work it built. In a smallest setup, the reviewer is a fresh agent, never the session that built the work (rule `reviewer-not-builder`).
- Do not steer the reviewer. Its brief names the requirements and the result. It never repeats the builder's conclusions.
- Stop a correction loop that fails the same way again, even before the round limit (rule `stop-repeat-failure`).
- The factory cannot authorize work by itself. Authority comes from the person's grants and the accepted backlog (rule `no-self-authority`).

## Context for Each Role

Hand each role only the context kinds that its plan lists (rule `role-context`). The content is handed over at run time and is never saved.

| Role | Context kinds |
| --- | --- |
| Builder (default) | `unit-record`, `requirements`, `project-files`, `defect-list` |
| Reviewer (default) | `unit-record`, `requirements`, `project-files`, `candidate-result`, `evidence-links` |
| Custom role | The list that the plan names for it |
| Front desk and foreman | No list |

The fixed context kinds are `unit-record`, `requirements`, `project-files`, `candidate-result`, `defect-list`, `evidence-links`, and `builder-summary`. Never hand `builder-summary` to a reviewer, so that the brief does not steer the review.

## Never Log

Never write these into a factory record, a status history, or the progress note of `make-docs work report --note` (rules `never-log` and `work-note-never-log`):

- file contents;
- prompts or briefs;
- environment values;
- transcripts;
- credentials, such as keys, tokens, or passwords.

A record holds IDs, short labels, times, digests, and reason codes. A progress note is one line of at most 256 characters, such as `P3 builder returned; review started.` The CLI refuses a factory field that looks like a secret with `never-log-field`, and names the field, never the value.

## Claim IDs

A claim ID is a private key. A new claim shows it once.

- Pass it only to your own calls that need it: `make-docs work claim` (renew), `work report`, `work close`, `work release`, `factory assignment start`, `factory assignment save`, `factory file-backup save`, and `factory grant-use record`.
- Never write it into a record, a note, a brief, a task handle, or a message. Never give it to a builder or a reviewer.
- A caller that does not hold the live claim is refused with `claim-not-held` (rule `claim-held`).

## Plan Revisions

Each assignment runs under the plan revision that it names (rule `assignment-plan-revision`). A new plan revision never changes an assignment that has already started. After a takeover, load that exact revision with `make-docs factory workflow show <workflow> --revision <n> --project <name>`, and go on with the same round count.

Take no new work while the workflow is `drifted`. Explain each drift reason code in plain words. Use the text and the next step that the CLI gives. This table gives the meaning of each code:

| Drift code | Plain words |
| --- | --- |
| `config-changed` | The workflow's entry in the config file changed without a save. |
| `binding-changed` | The saved tool choices no longer match the plan. |
| `type-changed` | The workflow type file changed. |
| `type-name-clash` | A project type uses the name of a shipped type. |
| `tool-missing` | A bound tool is gone from this machine. |
| `tool-version-changed` | A bound tool reports a version that its proof does not cover. |
| `proof-contradicted` | A proof that a role needs now fails. |
| `permission-lost` | A bound tool lost a permission that it needs, such as a sign-in. |

## Grants

A grant permits one action outside the default authority, such as `merge`, `deploy`, `publish`, or `spend` (rule `grant-scope`). These are the grant scopes:

| Grant scope | The grant holds for |
| --- | --- |
| `once` | One use. The first recorded use spends it. |
| `run` | The one lifecycle run that it names, until that run ends. |
| `standing` | Every run of the workflow, until the person revokes it. |

The person resets a job's correction rounds with a `once` grant for the action `reset-correction-rounds`. See [More Rounds After the Limit](run-loop.md#more-rounds-after-the-limit).

Never do an action outside the default authority without a recorded grant use.

1. Record the use on an open assignment of the unit, before the action. For the merge or deploy of one unit, record it in the same save that accepts the builder's assignment: `make-docs factory assignment save <assignment> --expected-version <n> --claim-id <claim-id> --status accepted --reason review-passed --grant-use <action> --project <name>`. A final assignment refuses it with `final-status`, and a closed unit with `claim-not-held`. See [An Action Outside the Default Authority](run-loop.md#an-action-outside-the-default-authority).
2. If the CLI refuses with `grant-missing`, `grant-out-of-scope`, `grant-spent`, or `grant-expired`, nothing changed: an accept in the same save did not happen. Do not do the action. Ask the person again through the human channel. That is floor event 1.
3. When the person answers yes, record the answer with a grant-only save: `make-docs factory workflow save <workflow> --grants-json <file> --target-root <checkout>`. The file adds one grant: its action, its scope, the lifecycle run for a `run` grant, an optional expiry time, and who granted it. Suggest the narrowest scope that does the job.
4. Record the use again. Act only after the CLI records it.

For an action after the person accepts the whole scope, each assignment is final. Then record the use on the unit's live claim, before the unit closes: `make-docs factory grant-use record <unit> --workflow <workflow> --action <action> --run-id <run-id> --claim-id <claim-id> --project <name>`. The grant checks and the refusal codes are the same. See [An Action at the End of the Scope](run-loop.md#an-action-at-the-end-of-the-scope).

Each recorded use adds one use row to the Store: the grant, the action, the unit, the lifecycle run, and the time. `make-docs factory workflow show <workflow> --project <name>` lists the use rows beside the grants, also after a grant is revoked. A use spends a `once` grant, and it does not change a `standing` or a `run` grant.

A spent or expired grant never changes readiness. It only makes you ask again.

## Refusal Codes

When the CLI refuses a factory call, nothing changed. Use the CLI's own words and next step. This table gives the meaning of each refusal code:

| Refusal code | Plain words | What to do |
| --- | --- | --- |
| `not-ready` | The workflow is not `ready`. | Take no new work. Tell the person the fix. |
| `claim-not-held` | This caller does not hold the unit's live claim. | Renew the claim, or take it over after a handle check. |
| `illegal-move` | The move is not in the move table. | Use a move from the table. |
| `final-status` | The assignment is final. | Start a new assignment for a job that must run again. |
| `round-limit-reached` | The job used all its correction rounds. | Stop, and escalate floor event 3. |
| `assignment-open` | The job already has an open assignment. | Settle the open assignment first. |
| `plan-digest-mismatch` | A test task result names another plan. | Run the `factory-setup` Skill. |
| `proof-missing` | No passed test task covers the plan. | Run the `factory-setup` Skill. |
| `unknown-capability` | A capability ID is not in the catalog. | Run the `factory-setup` Skill. |
| `type-version-mismatch` | The config names another version of the workflow type. | Run the `factory-setup` Skill. |
| `grant-missing` | No grant names the action. | Ask the person: floor event 1. |
| `grant-out-of-scope` | The grant does not cover this use. | Ask the person: floor event 1. |
| `grant-spent` | A `once` grant was used. | Ask the person: floor event 1. |
| `grant-expired` | The grant's time ran out. | Ask the person: floor event 1. |
| `never-log-field` | A value looks like a secret, a prompt, or file contents. | Leave the value out. Never send it again. |
| `project-missing` | The call named no project. | Name the project. |
| `project-not-found` | The Store knows no project with that name. | Check the project name. |
| `project-mismatch` | The name and the path give two different projects. | Name one project. |
| `project-checkout-unclear` | The project has no single checkout on this machine. | Name the checkout path. |

## Capabilities

Describe a tool only by the capability IDs that setup proved for it. These are the capability IDs:

- `read-write-files`
- `run-commands`
- `launch-agent`
- `wait-for-agent`
- `read-agent-result`
- `wake-on-schedule`
- `wake-on-event`
- `message-person`
- `receive-answer`
- `isolate-working-copy`
- `edit-code`

## Files and Working Copies

- One writer works on a file in each working copy (rule `one-writer`).
- When parallel workers change the same file in separate working copies, the plan's integration owner merges the work and settles conflicts. When the plan names none, you are the integration owner.
- The harness and the repository instructions own the worktree policy. Use the working-copy method that setup saved. Obey a repository or user rule that forbids worktrees (rule `worktree-policy`).

## Backups Outside Git

In a folder without git, a file must be backed up before a worker changes it, and the Store records each backup with its file, its hash, and its assignment (rule `backup-before-change`). Make Docs cleans up the backups when the work is accepted or closed.

Save each backup with the CLI. Never copy a file into `.make-docs/backup/factory/` yourself, and never write to the Store directly.

1. Before a builder job starts, and before each correction round, list the files that the job will change. Take them from the unit record, the requirements, and the defect list. A file that a command changes counts too, for example a formatter that the builder runs.
2. Save the backups for the job's open assignment: `make-docs factory file-backup save <assignment> --file <path> --claim-id <claim-id> --target-root <checkout>` (MCP `factory_file_backup_save`). Give `--file` once for each file. Name the checkout that the assignment runs in.
3. Tell the builder in its brief to change only the listed files, also through a command that it runs. When the builder must change another file, it stops before that change and returns the names of the files that it still must change. Do not assume that a tool can pause a worker. Then save the backups of those files, and run the job again with the longer list. The assignment stays `running`: record the new task handle with `make-docs factory assignment save <assignment> --expected-version <n> --claim-id <claim-id> --task-handle <handle> --project <name>`. Never give the builder the claim ID.
4. Read the result. It names each file with one of these words: `backed-up`, `already-backed-up` (the first backup of the file for this assignment stays), or `no-file` (the file does not exist yet, so it needs no backup).
5. The result `not-needed` means that the folder uses git, and git is the undo there. Nothing changed, and the job can start.
6. If the CLI refuses the call, nothing changed, and no file was copied. Do not let the worker change the file. Fix what the refusal names, and save the backup again.

The backup folder has a `README.md` that says how to get a file back. Tell the person about it when a result must be undone.

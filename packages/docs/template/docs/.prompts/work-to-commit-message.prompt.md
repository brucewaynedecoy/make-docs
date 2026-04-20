___
name: Work to Commit Message
description: Instructs the agent to draft or create a commit message that follows the project wave/revision/phase convention.
___

Please prepare a commit message for the current work using the starter-docs commit message convention.

Before drafting or committing, read `docs/.references/commit-message-convention.md`. Use it as the authority for subject shape, body source, and commit execution rules.

Inspect the local context first:

- `git status --short`
- recent commit subjects with `git log --format='%h %s' -n 30`
- the relevant design, plan, work, and agent history docs for the requested coordinate
- `docs/.assets/history/` for current agent history records, falling back to legacy `docs/guides/agent/` only when needed

If the user explicitly asks you to commit, stage only the requested change set, create the commit with the drafted subject/body, and verify it with `git log -1 --format=%B`. Do not stage unrelated edits, do not rewrite user work, and do not create a commit when the request is only to draft a message.

If the user does not explicitly ask you to commit, return only the proposed commit message in a fenced `text` block plus any brief source note needed to explain where the body came from.

Optional hints (leave blank to infer from the repository):

- Intent: {{INTENT}}
- Coordinate: {{COORDINATE}}
- Agent history record: {{HISTORY_RECORD}}
- Plan or design path: {{PLAN_OR_DESIGN_PATH}}
- Commit mode: {{COMMIT_MODE}}


# Work Methods

Use the same brief, evidence, scope, and review expectations for every method. Read only the selected method below. A profile selects preferences; current tool rules still apply.

## Native Subagents

Use the current harness's subagent tools. Spawn a worker only for a concrete assignment. Keep the coordinator available to judge results and answer questions. Use file ownership to prevent collisions. Reuse an existing worker for related corrections when helpful.

Wait for completion or required input through the tool's native event or bounded wait. Inspect the output and changed files. A worker's successful tool call is not acceptance of its work. Preserve raw evidence for the reviewer.

## Separate Agent Tasks

Use existing task APIs only when the user selects this method and the needed task actions are authorized. In Codex, creating a new task requires an explicit request to create it. Do not infer that permission merely from the word “factory.” A user-selected existing task can receive a bounded assignment through the supported tool.

Keep the returned task ID and host in the tool's existing task context. Prefer native status and completion tools over transcript polling. Read additional output only when needed to judge the result. If the tool reports setup pending, do not treat a client setup ID as a ready task ID.

Keep worktree and branch permission separate from task creation. A new task tool that creates a worktree by default cannot override the user's repository rule. Choose an authorized environment or explain the missing permission.

## Another Agent Application

An agent application is also called a harness. Use a tool already selected by the user or profile. Check its available help or API and its actual access before dispatch. Confirm the supported way to set the workspace, pass a brief, receive completion, and inspect the result. Do not guess flags, install a launcher, change authentication, or switch billing methods.

Reuse the selected tool's records for running work. Constrain file writes and outside actions with the tool's controls where available; a prompt alone is not isolation. If a required control is missing, report it before dispatching affected work. Do not promise crash recovery or independent review that the tool cannot provide.

No external executable is required by this skill. An unverified tool is a candidate method, not a supported integration. Verify its first bounded assignment before relying on it for a longer run. Report whether the check proved only command availability or a complete work-and-return path.

## Manual Handoff

If the selected tool cannot dispatch work, offer a short copyable brief with the source paths, allowed changes, checks, and expected return. Use this method only when the owner accepts it. Report “brief prepared; awaiting returned work.” Do not claim an agent was started. Keep the same review expectations when the result returns.

# Optional Profiles

A profile saves the owner's work-method and role preferences. It is configuration, not run state or a replacement backlog. Read the profile the user names. Do not require a profile for an ordinary factory request.

Use this small form when the owner asks to create one. Omit fields without a current use. The agent reads it directly; there is no custom runtime or schema extension.

```yaml
name: Local workers
method: subagents
roles:
  builder: Implement the assigned outcome and return changes with evidence.
  reviewer: Inspect the candidate against the requirements and report defects.
```

`method` can name subagents, existing or new agent tasks, a selected external tool, or an agreed manual handoff. For an external method, identify the actual tool. Role values may instead point to short local role instructions. Resolve relative paths from the profile location. Do not copy the whole product authority into a role file.

Only add model, effort, concurrency, attempt, time, or cost preferences when the owner supplies them. Use inherited model settings otherwise. Validate preferences against current tools. Explain a material unsupported setting; do not silently substitute another model, method, or budget.

The current request overrides saved preferences. Neither a role nor a profile grants new write, commit, network, branch, or worktree permission. Keep secret values out of the file. Tool declarations are intent until checked against the running agent.

Party can be evaluated later as a context source or work handoff. It must not duplicate Make Docs lifecycle state or launch agents. Do not make it a dependency without a selected and verified use.

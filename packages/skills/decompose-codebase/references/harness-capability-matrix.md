# Harness Capability Matrix

## Purpose

Use this matrix to choose safe delegation defaults. The tools that the current session lists are the only proof of what the session can do. Config files and environment variables can suggest a harness, but they do not prove that the session has an MCP tool or an agent tool.

## Session Tool Check

Before planning or execution, list the tools that this session gives you:

- MCP tools, by capability: a document index tool, a code index tool, and the Make Docs tools.
- Agent tools: a tool that starts parallel agents, a tool that starts subagents, or neither.

Write the list in the plan. A worker that starts in a new session makes its own list.

## Matrix

| Harness | Delegation default | MCP note |
| --- | --- | --- |
| Codex | Parallel agents first, then subagents, then single-agent fallback. Coordinator write scope `none` when delegation works. | Use only the MCP tools that the session lists. |
| Claude Code | Parallel agents first, then subagents, then single-agent fallback. Coordinator write scope `none` when delegation works. | Use only the MCP tools that the session lists. |
| OpenCode | Subagents first if the session lists an agent tool, otherwise single-agent fallback. Coordinator write scope `none` when delegation works. | Use only the MCP tools that the session lists. |
| Unknown | Single-agent fallback only after the session lists no agent tool. | Treat MCP access as unknown until the session lists a tool. |

## Detection Notes

- The session tool list is stronger evidence than environment variables or config files.
- A config file shows a likely local setup, not a current-session capability.
- When the harness is not clear, use the session tool list and the Unknown row.

## Planning Default

Regardless of harness, default to planning mode first unless the user explicitly approves direct execution.

## Execution Default

When execution is approved, use this delegation ladder:

1. parallel agents
2. subagents
3. single-agent fallback

When execution is approved and the harness supports parallel agents:

- split work by subsystem or doc family
- keep scopes disjoint
- keep coordinator write scope at `none`
- require each agent to build its own indexes in its own session if it uses index tools

When the harness supports only subagents:

- still delegate before broad single-agent execution
- keep the coordinator focused on workstream management, routing, and status reporting
- keep coordinator write scope at `none`
- require each delegated worker to list its own session tools

When the harness does not clearly support delegated workers:

- execute sequentially
- keep the same output contract
- keep the same output check

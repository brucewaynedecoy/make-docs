# MCP Playbook

## Purpose

Use this playbook when `jdocmunch` and `jcodemunch` are available. These MCP servers are the preferred path because they reduce token use, speed up repo inspection, and make parallel decomposition safer.

## Preferred Servers

- `jdocmunch` for documentation indexing and section retrieval
- `jcodemunch` for code indexing, symbol discovery, references, and dependency analysis

## Session Rule

Configured MCP servers do not prove that the current session can access them. Confirm live session access first, then index.

## Recommended Sequence

1. Confirm live session access.
2. Index repository docs with `jdocmunch`.
3. Index the codebase with `jcodemunch`.
4. Use indexed search and retrieval for planning or execution.

## Documentation Workflow

When `jdocmunch` is available:

- index the repo root or the docs subtree
- search sections before reading full docs
- use section-level retrieval to inspect decomposition plans, existing PRDs, and other internal docs

## Code Workflow

When `jcodemunch` is available:

- resolve the repo and inspect the outline or tree first
- use symbol search, file outlines, references, and dependency graphs before broad raw reads
- use raw file content only when indexed views are insufficient

## Parallel Agent Rule

MCP indexes are session-scoped for this workflow. If execution uses spawned agents or parallel workers, each agent must:

1. confirm live MCP access in its own session
2. create its own indexes
3. proceed with its assigned scope only after indexing

Do not assume the coordinator's indexes are visible to spawned agents.

## Fallback Workflow

If one or both servers are unavailable:

1. Recommend the missing servers to the user.
2. Ask whether to proceed without them.
3. Fall back to local repo exploration with fast tools such as `rg`, `find`, manifest inspection, and targeted file reads.
4. Keep the same output contract and doc templates.

## When To Re-index

Re-index when:

- a long execution span changes the repo materially
- a spawned agent starts a new session
- the current session loses index state
- the plan expands from one repo area into the full codebase

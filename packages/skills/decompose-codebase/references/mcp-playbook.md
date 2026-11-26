# MCP Playbook

## Purpose

Use this playbook when the session has index tools. An index tool reduces token use, speeds up repo inspection, and makes parallel decomposition safer. Make Docs does not require a particular tool.

## Preferred Tools

- A document index tool, for documentation indexing and section retrieval.
- A code index tool, for code indexing, symbol discovery, references, and dependency analysis.

## Session Rule

A tool in a config file does not prove that the current session can use it. Use only the tools that the session lists, then index.

## Recommended Sequence

1. List the tools that this session gives you.
2. Index the repository docs with the document index tool.
3. Index the codebase with the code index tool.
4. Use indexed search and retrieval for planning or execution.

## Documentation Workflow

When the session has a document index tool:

- index the repo root or the docs subtree
- search sections before reading full docs
- use section-level retrieval to inspect decomposition plans, existing PRDs, and other internal docs

## Code Workflow

When the session has a code index tool:

- resolve the repo and inspect the outline or tree first
- use symbol search, file outlines, references, and dependency graphs before broad raw reads
- use raw file content only when indexed views are insufficient

## Parallel Agent Rule

Indexes are session-scoped for this workflow. If execution uses spawned agents or parallel workers, each agent must:

1. list the tools that its own session gives it
2. create its own indexes
3. proceed with its assigned scope only after indexing

Do not assume the coordinator's indexes are visible to spawned agents.

## Fallback Workflow

If the session has no document index tool or no code index tool:

1. Tell the user which kind of tool is missing.
2. Ask whether to proceed without it.
3. Fall back to local repo exploration: local search, file listing, manifest inspection, and targeted file reads.
4. Keep the same output contract and doc templates.

Do not install a tool without the person's consent.

## When To Re-index

Re-index when:

- a long execution span changes the repo materially
- a spawned agent starts a new session
- the current session loses index state
- the plan expands from one repo area into the full codebase

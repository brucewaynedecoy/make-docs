# Agent Instructions

This is a pseudo-monorepo. The publishable CLI lives at `packages/cli/`; the shippable docs template lives at `packages/docs/template/`. Use the repo-root `docs/` to design, plan, and track this project's own evolution. Read each directory's `AGENTS.md`/`CLAUDE.md` before writing.

Never forget to use the jcodemunch mcp server for searching and reading code files and function signatures, and the jdocmunch mcp server for searching and reading project docs (if these mcp servers are available); these mcp servers are much faster and far more token-efficient than using ls and grep and batch reading files. If you can't find something because it isn't indexed, it just means the index is stale; when this happens, go ahead and reindex and then try searching again.

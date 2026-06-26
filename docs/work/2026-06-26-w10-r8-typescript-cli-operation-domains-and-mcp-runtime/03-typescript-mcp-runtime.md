# Phase 03: TypeScript MCP Runtime

## Purpose

Ship the required TypeScript-owned MCP server surface by delegating tools to the same operation domains as CLI commands.

## Tasks

- [ ] t1: Add the TypeScript MCP server entrypoint and package exposure required by the selected MCP runtime library.
- [ ] t2: Map initial MCP tools to existing operation domains for installed-state inspection, manifest/config reads, compatibility classification, closeout/work lifecycle operations, and dry-run planning where available.
- [ ] t3: Keep MCP write behavior behind the same permission and review semantics as equivalent CLI operations.
- [ ] t4: Add parity tests proving MCP tools and CLI commands call the same operation-domain functions.
- [ ] t5: Update public and developer docs to describe shipped MCP support only after tests pass.

## Acceptance Criteria

- MCP is a shipped TypeScript package surface.
- MCP does not duplicate deterministic logic.

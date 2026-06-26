# Phase 03: TypeScript MCP Runtime

## Purpose

Ship the required TypeScript-owned MCP server surface by delegating tools to the same operation domains as CLI commands.

## Tasks

- [x] t1: Add the TypeScript MCP server entrypoint and package exposure required by the selected MCP runtime library.
- [x] t2: Map initial MCP tools to existing operation domains for installed-state inspection, manifest/config reads, compatibility classification, closeout/work lifecycle operations, and dry-run planning where available.
- [x] t3: Keep MCP write behavior behind the same permission and review semantics as equivalent CLI operations.
- [x] t4: Add parity tests proving MCP tools and CLI commands call the same operation-domain functions.
- [x] t5: Update public and developer docs to describe shipped MCP support only after tests pass.

## Acceptance Criteria

- MCP is a shipped TypeScript package surface.
- MCP does not duplicate deterministic logic.

## Implementation Notes

Phase 3 ships the first TypeScript-owned MCP stdio surface through the existing package command: `make-docs mcp`.

- Added `@modelcontextprotocol/sdk` and `zod` runtime dependencies for the selected MCP runtime library.
- Added `packages/cli/src/mcp/server.ts` to create and run the MCP stdio server.
- Added `packages/cli/src/mcp/tools.ts` to register read-first and plan-first MCP tools for:
  - operation-domain listing;
  - installed-state inspection;
  - manifest reads;
  - config reads;
  - compatibility classification;
  - dry-run install planning;
  - closeout probe and validation planning;
  - work phase parsing, wave resolution, wave status, and phase planning;
  - lifecycle scope guard and phase gate checks.
- Added `make-docs mcp` as a package subcommand on the existing `make-docs` binary instead of adding a second installed command.
- Kept mutation out of the first MCP surface. The closeout validation tool rejects `run=true` unless the request also passes `allowRun=true`.
- Updated public and developer docs after the focused MCP tests and build passed.

## Coverage Decisions

Manual/UAT coverage remains deferred until W10 R8 wave closeout per the requested workflow.

Automated coverage now includes `packages/cli/tests/mcp.test.ts`, which verifies server construction, CLI help exposure, dry-run install planning without writes, direct operation-domain parity for MCP work/closeout tools, and explicit approval gating before validation command execution.

## Validation Evidence

- `npm test -w packages/cli -- mcp operation-domains operations --reporter=dot`
- `npm test -w packages/cli -- --reporter=dot`
- `npm run build -w packages/cli`
- Built-server MCP client smoke: spawned `node packages/cli/dist/index.js mcp`, listed 14 tools, and called `make_docs_operation_domains` to confirm the shared `closeout`, `work`, and `lifecycle` domains.
- `npm audit --omit dev --json`
- `git diff --check`
- `python3 .make-docs/scripts/check_path_hygiene.py --repo-root . --format json`
- Changed-file Markdown link check
- `bash scripts/check-instruction-routers.sh` reported the known root-router baseline (`./AGENTS.md` and `./CLAUDE.md` differ; `./CLAUDE.md` exceeds the 12-line budget). No Phase 3 router regression was introduced.

---
client: "Codex Desktop"
date: "2026-06-26"
coordinate: "W10 R8 P3"
repo: "make-docs"
branch: "make-docs-v2"
status: "completed"
summary: "Shipped the first TypeScript MCP runtime surface."
---

# W10 R8 P3 TypeScript MCP Runtime

## Changes

Phase 3 shipped the first TypeScript-owned MCP stdio surface through `make-docs mcp`, using the official TypeScript MCP SDK and delegating read-first and plan-first tools to existing make-docs operation domains, loaders, classifiers, and planners.

- Added `@modelcontextprotocol/sdk` and `zod` as CLI package runtime dependencies.
- Added `packages/cli/src/mcp/server.ts` for MCP stdio server creation and startup.
- Added `packages/cli/src/mcp/tools.ts` for MCP tool descriptors and handlers that call existing TypeScript operation domains and shared planner/classifier modules.
- Added `make-docs mcp` as a subcommand on the existing `make-docs` binary, preserving the single-command package posture.
- Shipped initial MCP tools for operation-domain listing, installed-state inspection, manifest reads, config reads, compatibility classification, dry-run install planning, closeout probe/validation planning, work phase and wave helpers, and lifecycle scope/gate checks.
- Kept mutation out of the first MCP surface. The closeout validation tool rejects command execution unless `run=true` is paired with `allowRun=true`.
- Added `packages/cli/tests/mcp.test.ts` for MCP server construction, CLI help exposure, dry-run planning, direct operation-domain parity, and run-approval gating.
- Updated package, public, user, developer, and PRD documentation to describe shipped read-first MCP support while preserving future write/provider/plugin/shared-agentics constraints.

Validation run:

- `npm test -w packages/cli -- mcp operation-domains operations --reporter=dot`
- `npm test -w packages/cli -- --reporter=dot`
- `npm run build -w packages/cli`
- Built-server MCP client smoke against `node packages/cli/dist/index.js mcp`
- `npm audit --omit dev --json`
- `git diff --check`
- `python3 .make-docs/scripts/check_path_hygiene.py --repo-root . --format json`
- Changed-file Markdown link check

`bash scripts/check-instruction-routers.sh` still reports the known root-router baseline (`./AGENTS.md` and `./CLAUDE.md` differ; `./CLAUDE.md` exceeds the 12-line budget). No Phase 3 router regression was introduced.

Manual/UAT coverage remains deferred until W10 R8 wave closeout per the requested workflow.

## Documentation

### Project

| Path | Description |
| --- | --- |
| [docs/work/2026-06-26-w10-r8-typescript-cli-operation-domains-and-mcp-runtime/03-typescript-mcp-runtime.md](../../../work/2026-06-26-w10-r8-typescript-cli-operation-domains-and-mcp-runtime/03-typescript-mcp-runtime.md) | Marked Phase 3 tasks complete and recorded implementation, coverage, and validation evidence. |
| [docs/prd/03-open-questions-and-risk-register.md](../../../prd/03-open-questions-and-risk-register.md) | Updated R-008 and R-014 with Phase 3 read-first MCP evidence while leaving broader write, plugin, shared-agentics, and skill-delivery risks open. |
| [docs/prd/16-revise-package-and-deployment-boundaries.md](../../../prd/16-revise-package-and-deployment-boundaries.md) | Recorded `make-docs mcp` as the first shipped read-first TypeScript MCP package surface. |
| [docs/prd/25-revise-cli-separation-and-mcp-boundary.md](../../../prd/25-revise-cli-separation-and-mcp-boundary.md) | Updated the MCP boundary with the Phase 3 shipped surface and remaining future expansion constraints. |
| [README.md](../../../../README.md) | Updated public package guidance to mention the shipped read-first MCP stdio server. |

### Developer

| Path | Description |
| --- | --- |
| [packages/cli/README.md](../../../../packages/cli/README.md) | Added `make-docs mcp` to package command examples and package-surface guidance. |
| [packages/cli/src/README.md](../../../../packages/cli/src/README.md) | Added maintainer guidance for the MCP module boundary. |
| [packages/cli/src/cli.ts](../../../../packages/cli/src/cli.ts) | Added the `make-docs mcp` subcommand and help output. |
| [packages/cli/src/mcp/server.ts](../../../../packages/cli/src/mcp/server.ts) | Added MCP server construction and stdio startup. |
| [packages/cli/src/mcp/tools.ts](../../../../packages/cli/src/mcp/tools.ts) | Added MCP tool descriptors and shared-domain handlers. |
| [packages/cli/tests/mcp.test.ts](../../../../packages/cli/tests/mcp.test.ts) | Added MCP runtime and parity coverage. |
| [docs/assets/library/developer/cli-development-local-build-and-install.md](../../library/developer/cli-development-local-build-and-install.md) | Updated local development guidance for the shipped MCP surface. |
| [docs/assets/library/developer/cli-mcp-operation-parity-and-permissions.md](../../library/developer/cli-mcp-operation-parity-and-permissions.md) | Reworked the MCP capability map to distinguish shipped tools from planned expansions. |

### User

| Path | Description |
| --- | --- |
| [docs/assets/library/user/cli-lifecycle-managing-installations.md](../../library/user/cli-lifecycle-managing-installations.md) | Updated user-facing CLI lifecycle guidance to describe `make-docs mcp` as a tool-client surface, not an ordinary install workflow. |

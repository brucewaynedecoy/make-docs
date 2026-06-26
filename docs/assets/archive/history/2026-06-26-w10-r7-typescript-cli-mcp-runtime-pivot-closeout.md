---
date: "2026-06-26"
coordinate: "W10 R7"
repo: "make-docs"
branch: "make-docs-v2"
status: "completed"
summary: "Captured the TypeScript CLI and required MCP runtime pivot and generated the W10 R8 implementation backlog."
---

# W10 R7 TypeScript CLI and MCP Runtime Pivot Closeout

## Changes

Captured W10 R7 as the blocking v2 runtime correction. The new design supersedes future-facing Rust runtime ownership, same-command npm/Rust behavior, PATH-order runtime selection, and optional/deferred MCP assumptions. TypeScript now owns the v2 package CLI, deterministic operation domains, remote package execution, and the required MCP server surface.

Generated the W10 R7 plan/work bundle for authority capture and PRD reconciliation, then generated W10 R8 as the follow-on implementation backlog for modular TypeScript operation domains, required TypeScript MCP behavior, remote execution validation across npm/pnpm/Bun, CLI/MCP parity tests, and package smoke updates.

Reconciled active PRDs in place. PRD 16, PRD 25, and PRD 26 now carry the primary runtime authority; supporting PRDs and the risk register now reference TypeScript CLI/MCP behavior instead of Rust parity or PATH-order runtime assumptions. Added W10 R7 guardrails to older runtime-sensitive plan/work entry points so completed W10 R1, W10 R2, W10 R3, W10 R6, W16 R3, and W18 R2 evidence is preserved without remaining future authority.

No code modularization or MCP server implementation was performed in W10 R7. W10 R8 owns that implementation work.

## Validation

- Required design headings, `Route: change-plan`, intended follow-on, and coordinate handoff were checked in the new W10 R7 design.
- Active PRD scan now leaves Rust/PATH-order language only in explicit supersession/shelving text.
- Active plan/work guardrails point future workers to W10 R7 and W10 R8 where older completed backlogs mention Rust, PATH-order, or deferred MCP assumptions.
- `git diff --check`
- Changed-file Markdown link checks.
- `bash scripts/check-wave-numbering.sh`

## Documentation

### Project

| Path | Description |
| --- | --- |
| [docs/designs/2026-06-26-typescript-cli-and-mcp-runtime-pivot.md](../../../designs/2026-06-26-typescript-cli-and-mcp-runtime-pivot.md) | Captures W10 R7 runtime authority. |
| [docs/plans/2026-06-26-w10-r7-typescript-cli-mcp-runtime-pivot/00-overview.md](../../../plans/2026-06-26-w10-r7-typescript-cli-mcp-runtime-pivot/00-overview.md) | Defines the W10 R7 authority, reconciliation, guardrail, backlog-generation, and closeout plan. |
| [docs/work/2026-06-26-w10-r7-typescript-cli-mcp-runtime-pivot/00-index.md](../../../work/2026-06-26-w10-r7-typescript-cli-mcp-runtime-pivot/00-index.md) | Records the completed W10 R7 documentation-work backlog. |
| [docs/plans/2026-06-26-w10-r8-typescript-cli-operation-domains-and-mcp-runtime/00-overview.md](../../../plans/2026-06-26-w10-r8-typescript-cli-operation-domains-and-mcp-runtime/00-overview.md) | Defines the follow-on implementation plan for modular operation domains and MCP runtime behavior. |
| [docs/work/2026-06-26-w10-r8-typescript-cli-operation-domains-and-mcp-runtime/00-index.md](../../../work/2026-06-26-w10-r8-typescript-cli-operation-domains-and-mcp-runtime/00-index.md) | Provides the executable implementation backlog for W10 R8. |

### Developer

No developer guide changes were made in W10 R7.

### User

No user guide changes were made in W10 R7.

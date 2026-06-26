# Follow-On Implementation Backlog

## Coordinate

Use W10 R8 for the implementation follow-on because W10 R7 is the corrective authority and PRD reconciliation wave.

## Required Implementation Backlog

Generate [W10 R8 TypeScript CLI Operation Domains and MCP Runtime](../2026-06-26-w10-r8-typescript-cli-operation-domains-and-mcp-runtime/00-overview.md) and its paired work backlog.

The W10 R8 backlog must cover:

- modularizing the current `make-docs operations` implementation into domain modules;
- preserving existing `make-docs operations ...` behavior;
- adding the required TypeScript MCP server surface;
- proving CLI/MCP parity through shared operation-domain tests;
- validating remote package execution through `npx`, `pnpm dlx`, and `bunx` / `bun x`;
- updating smoke-pack validation for the new package-runner and MCP expectations.

## Acceptance Criteria

- The W10 R8 backlog leaves no open product decisions about runtime ownership or MCP shipping.
- W10 R8 implementers do not need to infer the operation-domain module standard from the current `operations.ts` file.

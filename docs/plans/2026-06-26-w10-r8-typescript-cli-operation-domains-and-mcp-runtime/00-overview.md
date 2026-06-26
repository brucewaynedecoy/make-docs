# W10 R8 TypeScript CLI Operation Domains and MCP Runtime Plan

## Purpose

Implement the W10 R7 runtime pivot by modularizing the TypeScript operation boundary, adding the required TypeScript MCP server surface, and proving remote package execution across npm, pnpm, and Bun.

## Source Authority

- [W10 R7 TypeScript CLI and MCP Runtime Pivot](../2026-06-26-w10-r7-typescript-cli-mcp-runtime-pivot/00-overview.md)
- [TypeScript CLI and MCP Runtime Pivot Design](../../designs/2026-06-26-typescript-cli-and-mcp-runtime-pivot.md)
- [PRD 25](../../prd/25-revise-cli-separation-and-mcp-boundary.md)
- [PRD 26](../../prd/26-revise-no-scripts-migration-skill-refactor.md)

## Target State

- `make-docs operations ...` remains behavior-compatible.
- Operation logic is organized into modular TypeScript domains rather than one catch-all file.
- CLI and MCP dispatch share the same operation-domain modules.
- MCP ships from the TypeScript package and is validated as a v2 surface.
- `npx`, `pnpm dlx`, and `bunx` / `bun x` remote execution paths are validated from the packed package.

## PRD Strategy

No new PRD is required. Implement against PRD 16, PRD 25, PRD 26, and the W10 R7 reconciled supporting PRDs.

## Validation Plan

- Focused operation-domain tests.
- CLI behavior regression tests for existing `make-docs operations ...` commands.
- MCP tool parity tests proving shared operation-domain delegation.
- Remote package-runner smoke tests for npm, pnpm, and Bun.
- Existing package gates: CLI test suite, defaults validation, build, smoke-pack, path hygiene, and Markdown hygiene.

## Intended Follow-On

- Implement the paired work backlog under `docs/work/2026-06-26-w10-r8-typescript-cli-operation-domains-and-mcp-runtime/`.
- Do not reopen Rust runtime ownership, MCP shipping, or W16 R3 preservation decisions.

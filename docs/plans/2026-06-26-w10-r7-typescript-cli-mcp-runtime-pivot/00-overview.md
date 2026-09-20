# W10 R7 TypeScript CLI and MCP Runtime Pivot Plan

## Purpose

Reconcile the v2 package/runtime authority so future Make Docs work treats the TypeScript package/CLI as the v2 runtime owner, treats MCP as required, and stops consuming Rust/PATH-order assumptions as future product contract.

## Source Design

- Design: [TypeScript CLI and MCP Runtime Pivot](../../designs/2026-06-26-typescript-cli-and-mcp-runtime-pivot.md)
- Route: `change-plan`
- Update Mode: `new-doc-related`
- Coordinate: `W10 R7`

## Current State

- PRD 16 and PRD 25 still describe future Rust ownership, same-command npm/Rust behavior, and PATH-order runtime selection.
- PRD 26 correctly moved deterministic behavior into the TypeScript CLI first, but still treats MCP and Rust parity as downstream concerns rather than a required TypeScript v2 surface.
- W16 R3 implemented `make-docs operations` in the TypeScript package and rewrote selected lifecycle skills, but the implementation is consolidated in one operations file.
- Active future backlogs still contain guardrails based on Rust, optional MCP, or deferred MCP claims.

## Target State

- TypeScript package/CLI is the v2 runtime authority for remote execution, install/maintenance, deterministic operations, migration, and MCP.
- MCP is required for v2 and delegates to the same TypeScript operation domains as CLI commands.
- Rust is shelved indefinitely and is not a v2 prerequisite or validation target.
- `npx`, `pnpm dlx`, and `bunx` / `bun x` are first-class remote execution targets.
- The W16 R3 operation boundary is preserved as proof but identified as a first pass that must be modularized.

## PRD Strategy

- Reconcile PRD 16, PRD 25, and PRD 26 as primary owners.
- Reconcile PRD 02, PRD 03, PRD 07, PRD 08, PRD 10, PRD 17, PRD 18, PRD 20, PRD 21, PRD 24, PRD 28, PRD 30, PRD 31, and the PRD index as supporting surfaces.
- Do not create a new numbered PRD change doc; the affected requirements are future-forward corrections to active revisions.

## Follow-On Implementation

Generate W10 R8 as the implementation backlog for modular TypeScript operation domains and the required TypeScript MCP runtime. W10 R7 itself does not change code.

## Validation Plan

- Run `git diff --check`.
- Run changed-file Markdown link checks.
- Run `bash scripts/check-wave-numbering.sh`.
- Search future-facing docs for Rust runtime, PATH-order runtime, and optional/deferred MCP claims.
- Confirm W10 R8 leaves no open decision about MCP shipping, TypeScript runtime ownership, remote execution targets, modular operation domains, or W16 R3 preservation.

## Intended Follow-On

- Use [W10 R8 TypeScript CLI Operation Domains and MCP Runtime](../2026-06-26-w10-r8-typescript-cli-operation-domains-and-mcp-runtime/00-overview.md) for implementation.
- Keep W10 R7 as blocking authority for future v2 package, CLI, MCP, plugin, playbook, conformance, and no-scripts work.

# Phase 01: Authority Capture and Supersession Design

## Purpose

Capture W10 R7 as durable design authority for the TypeScript CLI and MCP runtime pivot.

## Tasks

- [x] t1: Create the W10 R7 corrective design under `docs/designs/`.
- [x] t2: Set `Route: change-plan` and coordinate handoff to W10 R7.
- [x] t3: State that MCP is required for v2 and TypeScript-owned.
- [x] t4: State that Rust is shelved indefinitely and not a v2 prerequisite.
- [x] t5: Preserve W16 R3 as operation-boundary proof while marking its implementation shape as first-pass.

## Implementation Notes

- Added [TypeScript CLI and MCP Runtime Pivot](../../designs/2026-06-26-typescript-cli-and-mcp-runtime-pivot.md).
- Used W10 R7 because this corrects the W10 package/CLI runtime line after W10 R6.

## Acceptance Criteria

- The design has all required generated-design headings.
- The design leaves no open decision about TypeScript runtime ownership, MCP shipping, Rust shelving, remote package-runner support, or W16 R3 preservation.

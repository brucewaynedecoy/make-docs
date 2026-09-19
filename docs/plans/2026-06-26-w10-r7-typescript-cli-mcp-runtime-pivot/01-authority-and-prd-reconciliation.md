# Authority and PRD Reconciliation

## Design Authority

Create [TypeScript CLI and MCP Runtime Pivot](../../designs/2026-06-26-typescript-cli-and-mcp-runtime-pivot.md) as W10 R7 corrective authority.

The design supersedes future-facing Rust runtime ownership, same-command npm/Rust runtime behavior, PATH-order runtime selection, and optional/deferred MCP assumptions. Historical references remain valid only when they describe completed past work.

## PRD Updates

Primary updates:

- PRD 16: replace Rust deployment/MCP ownership with TypeScript v2 runtime ownership and remote package-runner requirements.
- PRD 25: replace CLI separation with TypeScript CLI/MCP runtime authority.
- PRD 26: add the modular operation-domain development contract and required MCP parity.

Supporting updates:

- PRD 02, 07, 08, 10, 17, 18, 20, 21, 24, 28, 30, and 31: remove future-facing Rust assumptions and require TypeScript-owned CLI/MCP operation parity where relevant.
- PRD 03: update Q/R entries for shared install, no-command workflow, audit safety, skill refactor, and no-scripts migration.
- PRD 00: update reading order, map, and audience language.

## Acceptance Criteria

- Active PRDs no longer require Rust for v2.
- Active PRDs make MCP required and TypeScript-owned.
- Active PRDs preserve W16 R3 as implementation evidence without treating `operations.ts` as final architecture.

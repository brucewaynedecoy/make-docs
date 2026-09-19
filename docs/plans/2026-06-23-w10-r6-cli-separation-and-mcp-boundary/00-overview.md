# W10 R6 CLI Separation and MCP Boundary Plan

## Purpose

Define the v2 boundary between the TypeScript package CLI, modular operation-domain behavior, and the required MCP surface before deterministic scripts and skills are rewired.

## W10 R7 Runtime Pivot

W10 R7 supersedes this plan's Rust runtime ownership, same-command npm/Rust, PATH-order, and optional/deferred MCP assumptions. Future work must treat TypeScript as the v2 runtime authority, MCP as required and TypeScript-owned, and W16 R3 as operation-boundary proof to be modularized by W10 R8.

## Source Design

- Design: [CLI Separation and MCP Boundary](../../designs/2026-06-20-cli-separation-and-mcp-boundary.md)
- Route: `change-plan`
- Update Mode: `new-doc-related`
- Coordinate: `W10 R6`

## Current State

- The TypeScript npm package is the live implementation authority for `make-docs` and `npx @brucewaynedecoy/make-docs`.
- The no-command workflow installs or syncs depending on manifest presence.
- Explicit TypeScript CLI commands are `reconfigure`, `skills`, `backup`, and `uninstall`.
- Removed `init`, `update`, `--reconfigure`, and `--skills` paths remain intentionally rejected.
- The completed W10 R6 implementation did not ship MCP runtime behavior; W10 R7/W10 R8 now own the required TypeScript MCP surface.

## Target State

- `npx @brucewaynedecoy/make-docs` remains installer-first and must not become an `init`/`update` command-router-first interface.
- TypeScript remains owner for installer-maintainer, deterministic-operation, package-runner, and MCP behavior in v2.
- W10 R8 modularizes operation domains and adds the required TypeScript MCP runtime.
- MCP tools delegate to the same deterministic operation contracts used by ordinary CLI commands or shared core operations.
- The first MCP surface is read-first and plan-first; writes require a later explicit permission model.
- Config overlays are rendering inputs only across CLI, MCP, plugin, and skill surfaces.

## PRD Strategy

- Add PRD 25 for the CLI/MCP boundary.
- Annotate PRDs 07, 10, 16, 17, 18, 20, 21, and 24 with the new boundary.
- Update the risk register entries for public command docs, package docs, shared plugin/skill routing, no-scripts migration, and CLI/MCP parity risk.

## Validation Plan

- Run `git diff --check`.
- Run `bash scripts/check-wave-numbering.sh`.
- Reindex project docs with jdocmunch after edits.
- Scan new and touched docs for unfinished tokens.
- Check touched Markdown local links before committing.

## Intended Follow-On

- Generate the paired implementation backlog under `docs/work/2026-06-23-w10-r6-cli-separation-and-mcp-boundary/`.
- Feed the next Batch 3 no-scripts migration and skill-refactor design without treating standalone scripts as the long-term automation surface.

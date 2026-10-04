---
title: "W24 R0 P3 MCP Tool Profiles - Resources And Transports"
kind: "history"
status: "completed"
date: "2026-10-03"
client: "Codex Desktop"
coordinate: "W24 R0 P3"
repo: "make-docs"
branch: "w24-r0-mcp-tool-profiles"
summary: "Closed P3 native resource profiles and selected stdio proof."
---

# W24 R0 P3 MCP Tool Profiles - Resources And Transports

## Changes

Adds explicit profile metadata for system-resource URIs and guards native MCP lists and reads before hidden content is resolved. Preserves CLI and common resource tools, allowed bytes and source data, and the stdio default. Reserves the W25 Backlog Review UI for `backlog` and `all`, and closes W24 R0 P3 with retained local evidence.

The user authorized the P3 local commit on 2026-10-03. The root suite passed before three help-string corrections. Final focused help tests, the build, and stdio replay passed after those corrections. Agent review found no remaining issue. HTTP was not needed or implemented. P4 needs separate authority. W24 remains incomplete. No commit hash, push, release, fresh installed-host acceptance, or app completion is claimed.

## Documentation

### Project

| Path | Description |
| --- | --- |
| [P3 work](../../../docs/work/2026-09-24-w24-r0-mcp-tool-profiles/03-resources-and-transports.md) | Complete tasks and conditional transport dispositions. |
| [Central evidence](../../../docs/work/2026-09-24-w24-r0-mcp-tool-profiles/evidence.md#w24-r0-p3-resources-and-transports) | A6–A10, testing decisions, agent review, identities, and limits. |
| [Work index](../../../docs/work/2026-09-24-w24-r0-mcp-tool-profiles/00-index.md) | P1–P3 complete; P4 next under separate authority. |
| [Plan overview](../../../docs/plans/2026-09-24-w24-r0-mcp-tool-profiles/00-overview.md) | Current phase status and handoff. |
| [Upstream resource contract](../../../packages/docs/template/.make-docs/system/contracts/system-resource-contract.md#native-mcp-profiles) | Explicit URI metadata and strict native list/read checks. |
| [Dogfood resource contract](../../system/contracts/system-resource-contract.md#native-mcp-profiles) | Exact upstream copy. |

### Maintainer

| Path | Description |
| --- | --- |
| [CLI/MCP parity guide](../../../docs/assets/maintainer/cli-mcp-operation-parity-and-permissions.md#native-resource-profiles) | Metadata, read guards, preserved contracts, and host limits. |

### User

| Path | Description |
| --- | --- |
| [CLI lifecycle guide](../../../docs/assets/user/cli-lifecycle-managing-installations.md#choose-mcp-tools-for-a-task) | Task profiles, native resources, denied reads, and launch guidance. |

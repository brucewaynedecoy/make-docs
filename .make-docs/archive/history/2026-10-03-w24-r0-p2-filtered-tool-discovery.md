---
title: "W24 R0 P2 Filtered Tool Discovery"
kind: "history"
status: "completed"
date: "2026-10-03"
client: "Codex Desktop"
coordinate: "W24 R0 P2"
repo: "make-docs"
branch: "w24-r0-mcp-tool-profiles"
summary: "Select MCP tools by task profile while keeping the default full stdio connection."
---

# W24 R0 P2 Filtered Tool Discovery

## Changes

Implemented the four P2 tasks from base `75db93e49e8aa77b570ab25ac8133921b54d9376`. Added checked profile options to the MCP server and direct tool helpers. The CLI now selects one task profile and keeps `all` as the default. Hidden tool calls fail before arguments, access checks, or handlers run. Updated help and both guides with task names and a backlog host example. Added 55 CLI and discovery tests.

The same descriptor list owns names, schemas, handlers, and profile assignments. Visible calls keep the prior target, access, and write checks. Native resource behavior remains outside P2.

Validation passed: 92 focused tests, 1,582 full CLI tests, 19 smoke-harness tests, TypeScript checks, CLI build, and seven built stdio launches. Five existing installed-upgrade tests were skipped. The completed full run replaces an interrupted attempt with no final verdict. The [P2 evidence](../../../docs/work/2026-09-24-w24-r0-mcp-tool-profiles/evidence.md#w24-r0-p2-filtered-tool-discovery) retains the source and built-file hashes, results, review, and limits.

Agent review found no open P2 issue. Guided review passed for help, the error, and the host example. Performance Testing and Unassisted Goal Testing are `not-needed-now` for P2. No scenario or deferred obligation was created. No human acceptance gate applies.

P1 and P2 are complete. W24 remains in progress. P3 is next and needs separate implementation authorization. The user authorized this local P2 commit on 2026-10-03. No push, release, or host configuration change was made. The tested source identity describes the candidate before this commit.

## Documentation

### Project

| Path | Description |
| --- | --- |
| [W24 plan overview](../../../docs/plans/2026-09-24-w24-r0-mcp-tool-profiles/00-overview.md) | Advance the plan handoff to P3 with separate implementation authorization. |
| [W24 work index](../../../docs/work/2026-09-24-w24-r0-mcp-tool-profiles/00-index.md) | Record P1 and P2 complete while W24 remains in progress. |
| [P2 work](../../../docs/work/2026-09-24-w24-r0-mcp-tool-profiles/02-filtered-tool-discovery.md) | Check four tasks and link the A1 through A5 acceptance evidence. |
| [Central evidence](../../../docs/work/2026-09-24-w24-r0-mcp-tool-profiles/evidence.md) | Record P2 validation, four testing decisions, agent review, coverage, and limits. |
| [P2 validation summary](../../../docs/work/2026-09-24-w24-r0-mcp-tool-profiles/evidence/a4/validation-results.json) | Link retained tests, built stdio replay, source identity, help, and authority checks. |

### Maintainer

| Path | Description |
| --- | --- |
| [CLI/MCP Operation Parity and Permissions](../../../docs/assets/maintainer/cli-mcp-operation-parity-and-permissions.md#mcp-tool-profiles) | Explain factory and direct-helper profile options and preserved access behavior. |

### User

| Path | Description |
| --- | --- |
| [Managing Installations with the Make Docs CLI](../../../docs/assets/user/cli-lifecycle-managing-installations.md#choose-mcp-tools-for-a-task) | Explain task groups, the default launch, and one backlog host configuration example. |

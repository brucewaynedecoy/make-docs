---
title: "W33 R0 P1 Name Catalog and Rules Closeout"
kind: "history"
status: "completed"
date: "2026-11-22"
client: "T3 Code"
model: "Claude Opus 5.5"
coordinate: "W33 R0 P1"
repo: "make-docs"
branch: "docs/w29-w30-work-store-and-factory"
---

# W33 R0 P1 Name Catalog and Rules Closeout

## Changes

Adds one name catalog in code for the command tree and MCP tool names, before any command moves. It has 73 entries: the 43 current registry operations, the 6 hand-defined MCP tools, and the 24 operations that W29 R0, W30 R0, W31 R0, and W32 R0 plan. Each entry has its current CLI path and MCP name and its new CLI path and MCP name under PRD 39 R-NAME-1 to R-NAME-4. Seven paths were shortened because their MCP names would pass 26 characters. The owner decided the ten open choices on 2026-11-22: six as proposed, and four changed. `project state status` and `recover` and `work item resolve` keep their paths, checkout register becomes `project checkout preview` and `apply`, and performance evidence becomes `check performance-evidence`. PRD 39 R-NAME-2 now holds the `check` exception, PRD 39 R-RUN-1 lists every current `run` path and calls the work queue and factory commands planned, and PRD 25 R-MCP-PROFILE-10 names `project_list`. Nothing reads the catalog yet. No CLI route, MCP name, help text, alias, Skill, template, or router changed.

Validation passed: 39 catalog tests, the type check, and the PRD authority validator with no diagnostics. The tests check the rules, unique names, end words, read-only `check` entries, prefix collisions, registry and tool coverage, and the PRD 52, PRD 53, R-DOCTOR, R-STORE-CMD, R-RUN-1, R-RUN-4, R-MCP-PROFILE, and R-BACKLOG-APP-1 lists. Broken fixtures and changed PRD text prove that each check fails. The full suite has the 3 known failures and one CLI test that timed out under load and passes alone. Automated Implementation Testing and Guided Progress Review are selected. Performance Testing and Unassisted Goal Testing are `not-needed-now`. The owner accepted the names. The owner's final look at the updated table comes before P2.

## Documentation

### Project

| Path | Description |
| --- | --- |
| [P1 work](../../../docs/work/2026-11-22-w33-r0-command-tree-and-tool-names/01-name-catalog-and-rules.md) | Closes T1–T5 and A1–A3. |
| [Evidence report](../../../docs/work/2026-11-22-w33-r0-command-tree-and-tool-names/evidence.md) | Holds the full name table, the owner decisions, and the drift found and fixed. |
| [W33 R0 backlog](../../../docs/work/2026-11-22-w33-r0-command-tree-and-tool-names/00-index.md) | Links the evidence report. |
| [PRD 39](../../../docs/prd/39-cli-command-model-and-operation-registry.md) | R-NAME-2 `check` exception, R-RUN-1 list, and a W33 R0 P1 history entry. |
| [PRD 25](../../../docs/prd/25-typescript-runtime-cli-mcp-operation-boundaries.md) | R-MCP-PROFILE-10 names `project_list`, and a W33 R0 P1 history entry. |

### Maintainer

None this session.

### User

None this session.

---
title: "W26 R1 Clear MCP Tool Names"
kind: "design"
status: "draft"
coordinate: "W26 R1"
follow_on:
  route: "change-plan"
  next_prompt: "../../.make-docs/system/prompts/designs-to-plan-change.prompt.md"
  why: "PRD 25 and PRD 39 own the current MCP surface and name rule. This revision needs a scoped plan, PRD redline, and work record."
  coordinate_handoff: "W26 R0 owns simplified Store access. The owner directed MCP names into W26 R1 in the same branch and worktree."
lifecycle:
  default_arc: "design -> plan -> PRD -> work -> implementation"
  departure: "The owner directed W26 R1 while W26 R0 source work remains local. The R1 plan and work record were drafted before source edits."
  reason: "The names need a separate coordinate, but the owner chose the existing W26 worktree."
source:
  type: "manual-request"
---

# W26 R1 Clear MCP Tool Names

## Purpose

Give each Make Docs MCP tool a short, clear name. Keep the operation registry, CLI paths, profile limits, and Store access rules stable.

## Context

[W26 R0](../plans/2026-10-09-w26-r0-shared-access-and-data-foundation/00-overview.md) excludes a broad name change from its Store access scope. The owner has now asked for a separate W26 R1 package and source change in the same W26 worktree. [PRD 25](../prd/25-typescript-runtime-cli-mcp-operation-boundaries.md) and [PRD 39](../prd/39-cli-command-model-and-operation-registry.md) own the current MCP and registry rules.

The old MCP names start with `make_docs_` and then repeat the full registry ID. A saved call with an old name will fail after a package with new names is installed.

## Human Experience Intent

Impact: `direct`

Affected humans: People who select Make Docs tools in an MCP host and people who maintain saved tool calls.

Human goal or effect: Find the needed tool from a short name and know how to update an old call.

Experience promises:

- A tool list shows 43 distinct names with no `make_docs_` prefix. Each name has at most 26 characters.
- A call with a new name reaches the same handler and operation as its old name did.
- An old name fails as unknown. A name list tells the caller which new name to use.

Complexity kept out of the human path:

- People do not need to know the full registry ID to select a tool.
- The rename does not ask people to rotate a Store key or change an MCP launch entry.

Evidence required:

- Compare the name list to the [43-row map](../plans/2026-10-23-w26-r1-mcp-tool-names/01-name-contract.md).
- Run profile, dispatch, parity, and old-name tests.
- Review the user guide and first-party Skill for current names.

## Performance Evidence Candidates

| Candidate | Base maintenance action | Performance applicability | Protected outcome | Decision informed | Canonical owner or next record |
| --- | --- | --- | --- | --- | --- |
| None | Name map and tests | `not-needed-now` | No performance target changes | Name correctness | W26 R1 work record |

## Decision

Use one explicit map from each admitted registry operation ID to a short MCP name. Keep six hand-defined tools in the same descriptor list with short names. Check missing, extra, and duplicate names when the module loads. Keep each tool's handler, schema, access rule, and profile. Publish no old-name aliases.

The exact map is in the [W26 R1 P1 name contract](../plans/2026-10-23-w26-r1-mcp-tool-names/01-name-contract.md). The source and test steps are in [W26 R1 P2](../plans/2026-10-23-w26-r1-mcp-tool-names/02-implementation-and-proof.md).

## Alternatives Considered

- Keep the old mechanical names. This keeps saved calls working but does not meet the owner's request.
- Keep aliases for all old names. This doubles the visible name set and keeps the long names in the host.
- Change registry IDs. This would affect CLI and shared operation contracts that the request does not change.

## Consequences

The new package has a breaking MCP name change. Saved prompts and tool calls need the [name list](../plans/2026-10-23-w26-r1-mcp-tool-names/01-name-contract.md). Source tests can prove list and call behavior. A live installed-host check needs a later package install and, if needed, a reviewed change to the selected host entry. Neither is part of this source edit.

## Intended Follow-On

- Route: `change-plan`.
- Next Prompt: [designs-to-plan-change.prompt.md](../../.make-docs/system/prompts/designs-to-plan-change.prompt.md).
- Why: PRD 25 and PRD 39 need current rule updates. The [W26 R1 plan](../plans/2026-10-23-w26-r1-mcp-tool-names/00-overview.md) and [work record](../work/2026-10-23-w26-r1-mcp-tool-names/00-index.md) track the scoped change.
- Coordinate Handoff: W26 R0 keeps Store access. W26 R1 owns MCP names in the same W26 branch and worktree by owner direction.

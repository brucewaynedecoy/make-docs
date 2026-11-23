---
title: "W33 R0 P1 Name Catalog and Rules"
kind: "plan"
status: "draft"
coordinate: "W33 R0 P1"
source:
  type: "design"
  path: "docs/designs/2026-11-22-command-tree-and-tool-names.md"
---

# W33 R0 P1 Name Catalog and Rules

## Purpose

Settle every name before any command moves. No rename starts before the owner accepts the table.

## Outcome

One name catalog in code lists every operation and tool with its current and new CLI path and MCP name. A test enforces the naming rules.

## Scope

- List all 45 registry operations, the six hand-defined MCP tools, and every operation planned by W29 R0, W30 R0, W31 R0, and W32 R0, with current and new CLI paths and MCP names.
- Apply the design's rules 1 to 5: one capability per group, group then object then verb, MCP name from the CLI path, at most 26 characters by shortening the path, and hand-defined tools named by the same rule.
- Give each hand-defined tool (`compatibility`, `config`, `domains`, `install_plan`, `install_status`, `manifest`) a group and a CLI path, or record why it has an MCP name only.
- Add a test that fails when an entry breaks a rule, when two entries share a name, or when a PRD command list and the registry differ.
- Present the table to the owner for review.

## Exclusions

- No CLI, MCP, or text change. P2 to P4 own those.

## Acceptance

- Every operation and tool has one entry with all four names.
- The naming-rule test passes on the table and fails on a broken fixture entry.
- The owner accepts the table.

## Dependencies

- Accepted PRD 39 and PRD 25 changes.

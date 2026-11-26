---
title: "W33 R0 P2 Command Tree and Tool Names"
kind: "plan"
status: "draft"
coordinate: "W33 R0 P2"
source:
  type: "design"
  path: "docs/designs/2026-11-22-command-tree-and-tool-names.md"
---

# W33 R0 P2 Command Tree and Tool Names

## Purpose

Build the new tree and the derived MCP names.

## Outcome

The CLI has eleven top-level groups. `run` is no longer a root. Every MCP name is derived from its CLI path. `make-docs --help` lists the groups by capability.

## Scope

- Move each registry operation's CLI projection to its new path from the P1 table.
- Derive each MCP name from the CLI path by the rule, and remove the hand-picked name map.
- Name the hand-defined tools by the P1 table.
- Rewrite `make-docs --help` and each group's help to list commands by capability, in plain words.
- Update profile lists in code to the new names, with the same membership.
- Rename the W31 R0 and W32 R0 commands that already exist, if the table changes them.

## Exclusions

- No aliases yet. P3 adds them in the same release.
- No shipped text change. P4 owns it.

## Acceptance

- Every operation has CLI and MCP parity under its new name.
- The naming-rule test passes on the live registry.
- Profile membership is the same as before, by operation.

## Dependencies

- P1, W31 R0 P3, and W32 R0 P4.

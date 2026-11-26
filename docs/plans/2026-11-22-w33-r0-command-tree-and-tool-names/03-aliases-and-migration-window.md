---
title: "W33 R0 P3 Aliases and Migration Window"
kind: "plan"
status: "draft"
coordinate: "W33 R0 P3"
source:
  type: "design"
  path: "docs/designs/2026-11-22-command-tree-and-tool-names.md"
---

# W33 R0 P3 Aliases and Migration Window

## Purpose

Keep every current name working through the migration window.

## Outcome

Old CLI paths and MCP names run the same operation for two minor releases and name the new command. Then they return `command-renamed` for one more minor release, and then they are removed.

## Scope

- Add each old CLI path as a hidden alias. It runs the same operation, prints one line that names the new command, and adds `renamedTo` to JSON output.
- Add each old MCP name as a hidden alias that is not in `tools/list`. A call runs the same operation and adds `renamedTo` to the result.
- Record the release that introduced the rename. After two minor releases, an alias returns a typed `command-renamed` result that names the new command. After one more, it is removed.
- Keep profile rules: an alias works only in the profiles of its operation.

## Exclusions

- No alias for a name that never shipped, such as a planned W29 or W30 command.

## Acceptance

- Every old name runs the same operation and returns `renamedTo` during the window.
- After the window, every old name returns `command-renamed`, and after one more release it is gone.
- `tools/list` shows only new names.

## Dependencies

- P2.

---
title: "W33 R0 P3 Aliases and Migration Window Closeout"
kind: "history"
status: "completed"
date: "2026-11-23"
client: "T3 Code"
model: "Claude Opus 5.5"
coordinate: "W33 R0 P3"
repo: "make-docs"
branch: "docs/w29-w30-work-store-and-factory"
---

# W33 R0 P3 Aliases and Migration Window Closeout

## Changes

Keeps every name that W33 R0 renamed working through the PRD 39 R-MIG-1 migration window. A new alias layer reads old names only from the name catalog's `formerCli` and `formerMcp` fields, which gives 32 CLI aliases and 31 MCP aliases. A name that never shipped gets no alias. One constant, `RENAME_RELEASE = "2.1.0"`, starts the window, and the state comes from the running package version: 2.1.x and 2.2.x run the alias, 2.3.x returns a typed `command-renamed` result that names the new command, and 2.4.0 removes the alias. In the window an old CLI path runs the same operation, adds `renamedTo` to its JSON output, and, after it succeeds, prints one stderr line that names the new command. A failing alias call writes only one JSON error with `renamedTo`. An old MCP name runs the same tool in its profiles only, adds `renamedTo`, and never appears in `tools/list`. Any other `make-docs run` spelling names the groups that took its commands, and a former `run` group word names the new group's help. Server startup fails with a typed error if old names cannot be kept out of `tools/list`. P2 review items are folded in: an unknown `make-docs project` command lists the real project commands, `make-docs resource --help` has a title and a plain-words summary, and a test proves that old `run ...` native command rules show as drift and that `make-docs setup` plans an update that a person approves. No Skill, template, router, guide, or PRD changed.

Validation passed: the type check, the build, 178 alias tests that run every old CLI path and MCP name in all three window states and check `tools/list` in every profile, and 3 native-rule tests. Before the review fixes, the full suite had 2546 tests: 2537 passed, 3 failed, and 6 skipped. After the fixes, the P3, CLI, name-catalog, and MCP tests have 528 tests: 526 passed and 2 failed. The failures are the known stdio and sandbox failures. Automated Implementation Testing is selected. Performance Testing, Guided Progress Review, and Unassisted Goal Testing are `not-needed-now`. The owner's decision on the 2.1.0 rename release is pending. A 3.0.0 release before 2.3.0 would skip the `command-renamed` step. P5 owns the `--help` failure on leaf commands.

## Documentation

### Project

| Path | Description |
| --- | --- |
| [P3 work](../../../docs/work/2026-11-22-w33-r0-command-tree-and-tool-names/03-aliases-and-migration-window.md) | Closes T1–T4 and A7–A9. |
| [Evidence report](../../../docs/work/2026-11-22-w33-r0-command-tree-and-tool-names/evidence.md) | Holds the window rule, sample alias output, the alias and native-rule tests, and the limits. |

### Maintainer

None this session.

### User

None this session.

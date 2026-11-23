---
title: "W33 R0 P2 Command Tree and Tool Names Closeout"
kind: "history"
status: "completed"
date: "2026-11-23"
client: "T3 Code"
model: "Claude Opus 5.5"
coordinate: "W33 R0 P2"
repo: "make-docs"
branch: "docs/w29-w30-work-store-and-factory"
---

# W33 R0 P2 Command Tree and Tool Names Closeout

## Changes

Moves every registry operation to its new CLI path from the W33 R0 P1 name catalog and retires `run` as a root. The CLI now has the eleven PRD 39 R-TOP-1 groups. One dispatcher runs `work`, `backlog`, `lifecycle`, `factory`, and `check` from the registry projection, so `check prd` runs `prd.authority.validate`. `project move`, `project checkout`, and `project paths` replace `project checkout-move`, `project checkout-register`, and `project path-hygiene`. The hand-picked MCP name map is gone. Every MCP name is the CLI path after `make-docs` with underscores, and the six hand-defined tools take their catalog names, such as `setup_status` and `mcp_domains_list`. `make-docs --help` lists the groups by capability, in plain words, and each group's help lists its commands. `factory` says that it has no commands yet. Profile membership by operation did not change. The catalog's current names are now the new names, and new `formerCli` and `formerMcp` fields keep the old names for the P3 aliases. No alias was added, and no shipped text, Skill, router, template, or PRD changed.

Validation passed: the type check, the build, 42 name-catalog tests, the CLI group, MCP derivation, parity, and profile tests, a new help snapshot, and a new profile test that maps the W24 inventory through the catalog. The full suite has 2368 tests: 2359 passed, 3 failed, and 6 skipped. The 3 failures are the known stdio and sandbox failures. Automated Implementation Testing is selected. Performance Testing, Guided Progress Review, and Unassisted Goal Testing are `not-needed-now`. Old names fail until P3, and shipped text names the old commands until P4.

## Documentation

### Project

| Path | Description |
| --- | --- |
| [P2 work](../../../docs/work/2026-11-22-w33-r0-command-tree-and-tool-names/02-command-tree-and-tool-names.md) | Closes T1–T6 and A4–A6. |
| [Evidence report](../../../docs/work/2026-11-22-w33-r0-command-tree-and-tool-names/evidence.md) | Holds the new help text, the name rule, the profile check, and every test whose expectation changed. |

### Maintainer

None this session.

### User

None this session.

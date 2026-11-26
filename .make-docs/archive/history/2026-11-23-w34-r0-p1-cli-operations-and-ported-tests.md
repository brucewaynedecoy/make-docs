---
title: "W34 R0 P1 CLI Operations and Ported Tests Closeout"
kind: "history"
status: "completed"
date: "2026-11-23"
client: "T3 Code"
model: "Claude Opus 5.5"
coordinate: "W34 R0 P1"
repo: "make-docs"
branch: "docs/w29-w30-work-store-and-factory"
---

# W34 R0 P1 CLI Operations and Ported Tests Closeout

## Changes

Adds four registry operations that replace the logic of three Python Skill scripts. `make-docs check decomposition` (MCP `check_decomposition`, profiles `quality` and `all`) checks a decompose-codebase result with 43 rules under the `decomposition.` prefix, and reads task lines and task IDs through the shared work phase reader. `make-docs project relations list` (MCP `project_relations_list`, `workflow` and `all`) lists Markdown links, `related:` front matter, W/R coordinates, and same-slug matches, each with its kind and source file, and finds guide folders from the effective Persona set. The owner approved on 2026-11-23 that it skips `docs/assets/` folders that are not a Persona and names each one. `make-docs project markdown validate` (MCP `project_markdown_validate`, `setup`, `quality`, and `all`) and `make-docs project markdown repair` (MCP `project_markdown_repair`, `setup` and `all`) share 3 `markdown-style.` rules. Both skip `AGENTS.md` and `CLAUDE.md` routers, files with a `<!-- make-docs:begin -->` managed block, and the folders that `project paths validate` protects, and they list each skip. Repair previews each exact change unless `--apply` is given, as `project paths repair` does, uses that pair's exit codes, and needs the project write permission. Each command has leaf help, plain words first, and `--json`.

The name catalog holds the four entries as current, with a new `addedBy: "W34 R0"` field and no former names. A planned `check` entry now passes the registry coverage rule until the registry holds it. PRD 39 R-SKILL-CHECK names the paths and tools in a new table, R-RUN-1 lists `decomposition`, and PRD 25 gains R-MCP-PROFILE-11. After an independent review, R-SKILL-CHECK-2 records that `check decomposition` reads PRD sections with its own reader, a departure from the plan, and R-SKILL-CHECK-3 to R-SKILL-CHECK-5 name the skips, the exact preview, and the exit codes. P5 gains T8 to adopt W29 R0 P3's shared task line reader when it lands. The tests that list every operation or tool now include the four.

All 58 Python test cases pass as vitest cases, and 27 more tests cover parity, repair safety, the review fixes, Persona folders, rule IDs, help, and the PRD 25 profile line. A side-by-side run of each script and its command on three fixtures, one a copy of this repository's docs, gave the same findings except seven recorded differences: two from the shared task reader, one Persona folder change, one skip of files that Make Docs owns (12 routers whose managed blocks the script's `--fix` changed), and three script defect fixes (CRLF line ends, `#fragment` links, and `r1` matching `r10`). No Python file changed. The scripts stay until P4. The owner's review of the plain output (A7) is open.

## Documentation

### Project

| Path | Description |
| --- | --- |
| [P1 work](../../../docs/work/2026-11-23-w34-r0-skill-scripts-into-the-cli/01-cli-operations-and-ported-tests.md) | Closes T1–T8 and records A1–A8, with A7 open. |
| [Evidence report](../../../docs/work/2026-11-23-w34-r0-skill-scripts-into-the-cli/evidence.md) | Rule ID lists, the Python-to-vitest map, parity, and the side-by-side differences. |
| [PRD 39](../../../docs/prd/39-cli-command-model-and-operation-registry.md) | R-RUN-1, R-SKILL-CHECK-1, R-SKILL-CHECK-5, and the new command table. |
| [PRD 25](../../../docs/prd/25-typescript-runtime-cli-mcp-operation-boundaries.md) | New R-MCP-PROFILE-11. |

### Maintainer

None this session.

### User

None this session.

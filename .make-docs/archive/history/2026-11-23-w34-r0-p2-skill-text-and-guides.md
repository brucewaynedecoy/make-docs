---
title: "W34 R0 P2 Skill Text and Guides Closeout"
kind: "history"
status: "completed"
date: "2026-11-23"
client: "T3 Code"
model: "Claude Opus 5.5"
coordinate: "W34 R0 P2"
repo: "make-docs"
branch: "docs/w29-w30-work-store-and-factory"
---

# W34 R0 P2 Skill Text and Guides Closeout

## Changes

Moves the `decompose-codebase`, `archive-docs`, and `cleanup-docs` Skills from their Python scripts to the four P1 operations. Each check now uses the Make Docs MCP tool, then the CLI command, then the agent form in the Skill text by hand. A manual result says that it is a manual review, uses the proof state `agent-reviewed`, does not say that a Make Docs check ran, and installs nothing without the person's consent. A manual repair needs the person's agreement first.

`decompose-codebase` checks its output with `check_decomposition` or `make-docs check decomposition`, and its output contract has a new `## Check Rules` list with all 43 `decomposition.` rule IDs. The probe step is gone: the agent lists the MCP tools and agent tools of its own session and writes them in the plan. Under owner decision PD-1 option A, the Skill names tools by capability, such as "a document index tool" and "a code index tool", and names no MCP server. `archive-docs` traces relationships with `project_relations_list` or `make-docs project relations list`, and its manual tracing steps carry the four `relations.` kind IDs. `cleanup-docs` keeps the check, sample review, then repair flow with `project_markdown_validate` and `project_markdown_repair` or their commands, and its formatting rules carry the three `markdown-style.` rule IDs.

A new twin test fails when a rule ID exists in an operation or in its Skill text only, and checks the MCP, CLI, manual order and wording, no script path, and no MCP server name in `decompose-codebase`. Two older tests now expect the `archive-docs` Skill to name the relations command, not its script. The two guides that named the scripts or the index servers changed. The Python files stay until P4.

## Documentation

### Project

| Path | Description |
| --- | --- |
| [P2 work](../../../docs/work/2026-11-23-w34-r0-skill-scripts-into-the-cli/02-skill-text-and-guides.md) | Closes T1–T7 and records A9–A12. |
| [Evidence report](../../../docs/work/2026-11-23-w34-r0-skill-scripts-into-the-cli/evidence.md) | Changed files per Skill, the twin test, the standalone check, and the commands run. |

### Maintainer

| Path | Description |
| --- | --- |
| [Skills catalog and distribution model](../../../docs/assets/maintainer/skills-catalog-and-distribution-model.md) | Drops the helper scripts, names the MCP, CLI, manual order and the twin rule. |

### User

| Path | Description |
| --- | --- |
| [Decomposing an existing codebase](../../../docs/assets/user/skills-decomposing-an-existing-codebase.md) | Names index tools by capability and adds the output check. |

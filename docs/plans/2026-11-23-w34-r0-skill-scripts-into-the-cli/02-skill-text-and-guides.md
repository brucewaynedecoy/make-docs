---
title: "W34 R0 P2 Skill Text and Guides"
kind: "plan"
status: "draft"
coordinate: "W34 R0 P2"
source:
  type: "design"
  path: "docs/designs/2026-11-23-skill-scripts-into-the-cli.md"
---

# W34 R0 P2 Skill Text and Guides

## Purpose

Move the three Skills to the new operations, and keep an agent form for a session without the CLI. This is step 3 of the PRD 25 operation-first order.

## Outcome

The `decompose-codebase`, `archive-docs`, and `cleanup-docs` Skills name no script path. Each check uses this order: the MCP tool, then the CLI command, then the agent form by hand. Each agent form uses the same rule IDs as its operation, and a test proves it.

## Scope

- Change `SKILL.md` and the references of each Skill under `packages/skills/`. Do not edit `scripts/` here.
- `decompose-codebase`: replace `scripts/validate_output.py` with `check_decomposition` or `make-docs check decomposition`. Keep `references/output-contract.md` as the agent form and give each rule its ID. Remove every step that runs `probe_environment.py`. Tell the agent to list the MCP tools and the subagent or parallel agent tools that its session gives it, and to write them in the plan. Apply owner decision PD-1 to the server names in `mcp-playbook.md`, `planning-workflow.md`, `execution-workflow.md`, and `harness-capability-matrix.md`.
- `archive-docs`: replace the optional `trace_relationships.py` helper with `project_relations_list` or `make-docs project relations list`. Keep the manual tracing steps in `references/archive-workflow.md` as the agent form, with relation kind IDs.
- `cleanup-docs`: keep the flow of check, review a sample, then repair only when the sample is clean. Use `project_markdown_validate` and `project_markdown_repair`, or their CLI commands. Keep the formatting rules in `SKILL.md` as the agent form, with rule IDs.
- In every Skill, without the CLI the agent says that the result is a manual review, uses the proof state `agent-reviewed`, and does not claim that a Make Docs check ran. It installs nothing without consent. A manual repair needs the person's agreement first.
- Add a twin test that reads each operation's rule list and the Skill text, and fails when a rule ID exists on one side only.
- Change the shipped guides that name Skill helper scripts, under PRD 39 R-NAME-6: `docs/assets/maintainer/skills-catalog-and-distribution-model.md` and `docs/assets/user/skills-decomposing-an-existing-codebase.md`. Check the other Skill guides too.
- Check that each Skill still works alone under PRD 08 R-SKILL-BUNDLE-2.

## Exclusions

- No registry or file removal. P4 owns them.
- No template change. No file in `packages/docs/template/` names these scripts, and the agent forms stay in the Skills.
- This repository has no installed copy of these three Skills, so no dogfood Skill copy changes in this phase.

## Acceptance

- A search of the three Skills finds no `.py` path and no `scripts/` path.
- The twin test passes, and fails on a fixture with a one-sided rule ID.
- The shipped-text name test passes.
- The Skill standalone tests pass.

## Testing Decisions

- Automated Implementation Testing: required.
- Performance Testing: `not-needed`.
- Guided Progress Review: `not-needed-now`. P5 reviews the text in the Human Experience Review.
- Unassisted Goal Testing: `not-needed-now`.

## Dependencies

- P1.
- Owner decision PD-1: option A, chosen on 2026-11-23. Describe the tools by capability and remove the MCP server names.

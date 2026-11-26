---
title: "W34 R0 P1 CLI Operations and Ported Tests"
kind: "plan"
status: "draft"
coordinate: "W34 R0 P1"
source:
  type: "design"
  path: "docs/designs/2026-11-23-skill-scripts-into-the-cli.md"
---

# W34 R0 P1 CLI Operations and Ported Tests

## Purpose

Build the four operations before any Skill text or file changes. This is step 1 of the PRD 25 operation-first order.

## Outcome

Four registry operations run through the CLI and MCP with the same results. Every case from the three Python test files passes as a vitest case. A recorded run shows the same findings from each old script and its new operation.

| Operation ID | CLI path | MCP name | Characters | Access | MCP profiles |
| --- | --- | --- | --- | --- | --- |
| `decomposition.output.validate` | `make-docs check decomposition` | `check_decomposition` | 19 | Project read | `quality`, `all` |
| `project.relations.list` | `make-docs project relations list` | `project_relations_list` | 22 | Project read | `workflow`, `all` |
| `project.markdown-style.validate` | `make-docs project markdown validate` | `project_markdown_validate` | 25 | Project read | `setup`, `quality`, `all` |
| `project.markdown-style.repair` | `make-docs project markdown repair` | `project_markdown_repair` | 23 | Project write | `setup`, `all` |

Each path follows PRD 39 R-NAME-1 to R-NAME-4. `check decomposition` ends with its object under owner decision ND-01. The other three end with a verb from `NAME_END_WORDS`. `markdown-style` stays in the operation IDs, but the paths use `markdown`, because `project_markdown_style_validate` has 31 characters. The profile column is new in this plan.

## Scope

- T1: add the four entries to `packages/cli/src/operations/name-catalog.ts` as `planned` with `plannedBy: "W34 R0"`, and add `W34 R0` to `NameCatalogPlanner`. Add name catalog test checks for the new PRD 39 tables. This task unblocks the PRD edits that name the commands.
- One task for each Skill's logic, in this order: `check decomposition`, then `project markdown validate` and `repair`, then `project relations list`. Each task adds the operation module, its registry entry, its CLI command, its MCP tool, and its tests, and turns its catalog entries `current`.
- Each operation has one rule list with a stable ID for each rule. P2 uses the same IDs in the Skill text.
- `check decomposition` reports every finding that `validate_output.py` reports, with a rule ID and a plain message. It reuses the task line and task ID reader of the work phase parser and the PRD reader of `check prd` through their public functions.
- `project relations list` reports Markdown links, `related:` front matter, W/R coordinates in history records, and same-slug matches. Each relation names its source. An optional `--path` input lists one artifact's inbound and outbound relations. It finds guide folders from the effective Persona set.
- `project markdown validate` reports rule, lines, whether a fix exists, and a short preview. `project markdown repair` makes only the fixes that the script makes with `--fix`, needs the project write permission, and has `--dry-run`.
- Each command prints plain words first and returns JSON with `--json`.
- Port every case of `test_validate_output.py` (46), `test_check_markdown_style.py` (11), and `test_trace_relationships.py` (1) to vitest, with the same inputs and expected findings.
- Add CLI and MCP parity tests for each operation.
- Run each old script and its new operation on the same fixtures before P4 removes the script. Record both outputs and each difference in `evidence.md`. A difference that fixes a script defect is listed, not hidden.
- Update the registry inventory and profile count tests.

## Exclusions

- No Skill text change. P2 owns it.
- No script removal. P4 owns it.
- No Python change, apart from running the old scripts for the side-by-side evidence.

## Acceptance

- The name catalog test passes with the four entries `current`, and the PRD 39 and PRD 25 lists match.
- Every ported case passes.
- CLI and MCP results match for each operation.
- `project markdown repair --dry-run` writes nothing, and `repair` without write permission refuses.
- The side-by-side evidence names each difference.

## Testing Decisions

- Automated Implementation Testing: required.
- Performance Testing: `not-needed`.
- Guided Progress Review: selected. The owner sees the plain output of each command on one fixture.
- Unassisted Goal Testing: `not-needed-now`.

## Dependencies

- The PRD pass, except its R-RUN-1 and R-MCP-PROFILE-11 edits, which land with or after T1.
- Merge risk with W29 R0 P3 and P4. See the overview.

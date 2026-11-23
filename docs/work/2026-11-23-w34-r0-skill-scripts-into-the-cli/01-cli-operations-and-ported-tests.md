---
title: "Phase 1: CLI Operations and Ported Tests"
kind: "work"
status: "active"
coordinate: "W34 R0 P1"
source:
  type: "prd"
  path: "docs/prd/39-cli-command-model-and-operation-registry.md"
---

# Phase 1: CLI Operations and Ported Tests

## Purpose

Build the four operations before any Skill text or file changes. This is step 1 of the [PRD 25](../../prd/25-typescript-runtime-cli-mcp-operation-boundaries.md) operation-first order. It depends only on the PRD pass.

## Overview

This phase adds four registry operations with CLI and MCP parity, one rule list for each, and vitest tests that run every case from the three Python test files. It also lands the PRD lines that name the four commands and tools, because the name catalog must hold a name before a PRD line can name it. A recorded side-by-side run shows the findings of each old script and its new operation on the same fixtures.

| Operation ID | CLI path | MCP name | Characters | Access | MCP profiles |
| --- | --- | --- | --- | --- | --- |
| `decomposition.output.validate` | `make-docs check decomposition` | `check_decomposition` | 19 | Project read | `quality`, `all` |
| `project.relations.list` | `make-docs project relations list` | `project_relations_list` | 22 | Project read | `workflow`, `all` |
| `project.markdown-style.validate` | `make-docs project markdown validate` | `project_markdown_validate` | 25 | Project read | `setup`, `quality`, `all` |
| `project.markdown-style.repair` | `make-docs project markdown repair` | `project_markdown_repair` | 23 | Project write | `setup`, `all` |

## Human Experience Outcome

- Impact and governing promise or preserved boundary: `direct`. Each check is one Make Docs command and one MCP tool with a name from the W33 rules, and it gives the same findings through both, in plain words first ([PRD 39](../../prd/39-cli-command-model-and-operation-registry.md) R-SKILL-CHECK-1 and R-SKILL-CHECK-6).
- Intended human outcome: a person or agent runs one command and reads the totals, then each finding with its rule ID and a plain message.
- Human-facing surface or indirect effect: the four commands, their help, their plain and `--json` output, and `tools/list`.
- Implementation work: the operation modules, registry entries, CLI commands, MCP tools, rule lists, and tests.
- Evidence source or testing type selected under current authority: name catalog test, CLI and MCP parity tests, ported tests, Guided Progress Review of the plain output.
- Executor: the implementing agent runs the tests. The owner reviews the plain output.
- Accepted obligation or deferral route: none.

Authority: [Human Experience Contract](../../../.make-docs/system/contracts/human-experience-contract.md).

## Current Testing Decisions

| Testing type | Current decision | Decision record or `not-needed-now` reason |
| --- | --- | --- |
| Automated Implementation Testing | selected | Name catalog, ported, parity, permission, and dry-run tests. |
| Performance Testing | not-needed-now | The checks read local Markdown files, as the scripts do now. No performance candidate exists. |
| Guided Progress Review | selected | The owner sees the plain output of each command on one fixture. |
| Unassisted Goal Testing | not-needed-now | The commands follow the W33 grammar, and agents reach them through Skill text. No current decision needs an unassisted human run. |

## Source PRD Docs

- [39 CLI Command Model and Operation Registry](../../prd/39-cli-command-model-and-operation-registry.md): R-TOP-1, R-RUN-1, R-NAME-1 to R-NAME-6, R-SKILL-CHECK-1 to R-SKILL-CHECK-7
- [25 TypeScript Runtime, CLI, MCP, and Operation Boundaries](../../prd/25-typescript-runtime-cli-mcp-operation-boundaries.md): R-MCP-PROFILE-1 to R-MCP-PROFILE-4, R-MCP-PROFILE-11, R-SKILL-RUNTIME-7, `Operation-First Migration Sequence`
- [47 Persona Model](../../prd/47-persona-model.md): the effective Persona set that `project relations list` reads

## Source Obligations, Scenarios, And Findings

- [D-064](../../prd/03-open-questions-and-risk-register.md)
- `O-###`: none
- `NUAT-###`: none

## Stage 1 - Name catalog entries and PRD names

### Tasks

- [x] T1: Add the four entries to `packages/cli/src/operations/name-catalog.ts` as `planned` with `plannedBy: "W34 R0"`, and add `W34 R0` to `NameCatalogPlanner`. The registry coverage rule fails a `check` entry that the registry does not hold, so let a planned `check` entry pass that rule until the registry holds it. Keep the rule for current `check` entries. In the same change, land the PRD lines that the PRD pass left out:
  - [PRD 39](../../prd/39-cli-command-model-and-operation-registry.md) R-SKILL-CHECK: the canonical CLI path and MCP name of each operation, and a `Registry identifier | Canonical CLI` table with the inputs `--path`, `--dry-run`, `--target-root`, and `--json`.
  - [PRD 25](../../prd/25-typescript-runtime-cli-mcp-operation-boundaries.md) R-MCP-PROFILE-11: `check_decomposition` in `quality` and `all`; `project_relations_list` in `workflow` and `all`; `project_markdown_validate` in `setup`, `quality`, and `all`; `project_markdown_repair` in `setup` and `all`; the read and write access of each.
  - A `2026-11-23 — W34 R0 P1` Requirement History entry in PRD 39 and PRD 25.
  - A name catalog test check that compares the new PRD 39 table with the catalog, as the R-DOCTOR and R-STORE-CMD tables are checked.

### Acceptance criteria

- A1: The name catalog test passes with the four planned entries, and fails on a broken fixture row in the new PRD 39 table. The shipped-text test and `make-docs check prd` pass with the PRD lines that name the four commands and tools.

### Dependencies

- The PRD pass.
- Merge risk with W29 R0 P4 in `name-catalog.ts`. See the [index](00-index.md#wave-sequence).

## Stage 2 - Operations and ported tests

### Tasks

- [x] T2: Add `decomposition.output.validate`: the operation module, registry entry, CLI command, MCP tool, and a rule list with one stable ID for each `validate_output.py` rule, under one prefix such as `decomposition.task-id`. Read task lines and task IDs through the public function of the shared work phase reader, and PRD files through the reader of `prd.authority.validate`. If W29 R0 P3 has landed, use its reader. Port all 46 cases of `test_validate_output.py` to vitest with the same inputs and expected findings. Turn the catalog entry `current`, and in the same change add `decomposition` to the active `check` list in PRD 39 R-RUN-1.
- [x] T3: Add `project.markdown-style.validate` and `project.markdown-style.repair`, with one shared rule list under the `markdown-style` prefix. `validate` reports rule, lines, whether a fix exists, and a short preview. `repair` makes only the fixes that the script makes with `--fix`, needs the project write permission, and has `--dry-run`. Port all 11 cases of `test_check_markdown_style.py`. Turn both catalog entries `current`.
- [x] T4: Add `project.relations.list`, with one relation kind ID for each kind of fact: Markdown links, `related:` front matter, W/R coordinates in history records, and same-slug matches. Each relation names its kind and source. Add the optional `--path` input for one artifact's inbound and outbound relations. Find guide folders from the effective Persona set. Port the 1 case of `test_trace_relationships.py`, and add a case for a custom Persona folder. Turn the catalog entry `current`.
- [x] T5: Add CLI and MCP parity tests for each operation, in plain and `--json` output. Each command prints plain words first, with totals before detail.
- [x] T6: Update the registry inventory and the MCP profile count tests.
- [x] T7: Record the final rule ID list of each operation in [evidence.md](evidence.md). P2 uses the same IDs.

### Acceptance criteria

- A2: All 58 ported cases pass: 46 from `test_validate_output.py`, 11 from `test_check_markdown_style.py`, and 1 from `test_trace_relationships.py`. The evidence maps each Python test method to its vitest case.
- A3: For each of the four operations, the CLI and MCP return the same result for the same input, in plain and JSON output.
- A4: `project markdown repair --dry-run` writes nothing. `project markdown repair` without write permission refuses and changes nothing.
- A5: The name catalog test passes with the four entries `current`. PRD 39 R-RUN-1 lists `decomposition` as an active `check` command, and PRD 25 R-MCP-PROFILE-11 matches the profile lists in code.
- A6: `project relations list` finds a guide in a custom Persona folder, and each relation in its output names its kind and source file.
- A7: The plain output of each command shows the totals first, then each finding with its rule ID and a plain message. The owner reviews it on one fixture for each command.

### Dependencies

- Stage 1.
- Merge risk with W29 R0 P3 (work phase reader) and P4 (registry, MCP tool lists, profile counts). See the [index](00-index.md#wave-sequence).

## Stage 3 - Side-by-side evidence

### Tasks

- [x] T8: Before P4 removes the scripts, run each old script and its new operation on the same fixtures. Record both outputs and each difference in [evidence.md](evidence.md). List a difference that fixes a script defect or comes from a planned change, such as Persona folders or the `--path` input name. Do not hide it. Do not change any Python file.

### Acceptance criteria

- A8: The side-by-side evidence names each difference between each script and its operation, with its reason.

### Dependencies

- Stage 2.

### Closeout Notes

- Four testing decisions: Automated Implementation Testing `selected` and done: `packages/cli/tests/w34-r0-p1-ported-skill-checks.test.ts` runs all 58 Python test cases, and `packages/cli/tests/w34-r0-p1-skill-check-surfaces.test.ts` (27 tests) covers CLI and MCP parity in plain and JSON output, the repair preview and write refusal, the review fixes (skipped routers, managed-block files, and protected folders, the exact preview, exit codes, linked files, and skipped asset folders), the Persona guide folders, the rule ID lists, the help, and PRD 25 R-MCP-PROFILE-11 against the code. The name catalog test checks the new PRD 39 table. Performance Testing `not-needed-now`: the commands read local Markdown files, as the scripts did. Guided Progress Review `selected` and open: the plain output of each command on one fixture is in the evidence for the owner. Unassisted Goal Testing `not-needed-now`.
- Performance evidence: none needed. No measurement was taken.
- Human Experience Review: prepared, not done. The plain output of the four commands is in the [evidence](evidence.md#guided-progress-review-a7) for the owner's review.
- Independent review: seven findings, all addressed with tests. The Markdown commands now skip router files, files with a managed block, and the `project paths validate` protected folders, so a repair never changes bytes that `make-docs setup` owns. The repair preview shows each exact change. Exit codes match `project paths validate|repair`. `check decomposition` skips linked files. `relations list` names each skipped `docs/assets/` folder. [P5](05-acceptance.md) T8 switches the acceptance task ID check to W29 R0 P3's `readTaskLine` when it lands.
- Owner decision, approved 2026-11-23: `project relations list` skips `docs/assets/` folders that are not a configured Persona (option A) and names each one with a skipped line in text and JSON.
- Recorded deviation from the plan: T2 asked `check decomposition` to read PRD files through the `prd.authority.validate` reader. That validator has no public reader and no rule in common, so the check reads PRD sections with its own reader. PRD 39 R-SKILL-CHECK-2 and its Requirement History record this. T2 stays checked.
- Optional experience handoff: none.
- Explicit human acceptance gate: the owner reviews the plain output (A7) and the listed script differences (A8).
- Evidence report: [P1 CLI Operations and Ported Tests](evidence.md#p1-cli-operations-and-ported-tests).
- Phase / capability status: implementation complete and uncommitted, on `71096981`. A1 to A6 and A8 have automated or recorded evidence. A7 waits for the owner's review. P4 removes the Python files.

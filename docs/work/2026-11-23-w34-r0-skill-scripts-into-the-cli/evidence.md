---
title: "W34 R0 Evidence Report"
kind: "work"
status: "active"
coordinate: "W34 R0"
---

# W34 R0 Evidence Report

This report explains the acceptance evidence for the [W34 R0 backlog](00-index.md). Each section names the acceptance cases it covers, what was run, what it showed, and its limits.

## PRD Pass

Evidence date: 2026-11-23. Base commit: `96b2b6cf` on `docs/w29-w30-work-store-and-factory`.

### What Changed

- [PRD 39](../../prd/39-cli-command-model-and-operation-registry.md): R-TOP-1 names Markdown style and document relations in `project`, and decomposition output in `check`. New R-SKILL-CHECK-1 to R-SKILL-CHECK-7 define the four operations by operation ID, with their access, inputs, output, and shared rule IDs.
- [PRD 25](../../prd/25-typescript-runtime-cli-mcp-operation-boundaries.md): new R-SKILL-RUNTIME-7 sets the MCP, CLI, agent-form order, the manual-review result, and the twin rule ID test. `Domain and Script Classification` says that a first-party Skill ships no Python and no hand-written script.
- [PRD 08](../../prd/08-skills-catalog-and-distribution.md): new R-SKILL-BUNDLE-7, a line in `Explicit Selected-Skill Model`, and two Validation Boundary items.
- [PRD 51](../../prd/51-backlog-review-and-reporting.md): R-BACKLOG-SKILL-21 says that CLI source holds the collector and the render wrapper, and that the Skill ships generated bundles.
- [Register](../../prd/03-open-questions-and-risk-register.md): D-064 names W34 R0 as its closing Wave and stays open. R-008 says that W34 R0 retires the remaining helper scripts.
- Each changed PRD has a `2026-11-23 — W34 R0` Requirement History entry.

### Left to P1

The name catalog does not hold the four commands and tools yet. The name catalog test fails a PRD 25 R-MCP-PROFILE line that names a tool outside the catalog. The shipped-text test fails a PRD line that names a `make-docs` path outside the catalog. `compareRRun1` accepts a planned path only in the `work` and `factory` groups. So these lines wait:

- P1 T1: the CLI paths and MCP names in PRD 39 R-SKILL-CHECK, its registry table, and PRD 25 R-MCP-PROFILE-11.
- P1 T2: `decomposition` in the active `check` list of PRD 39 R-RUN-1, when its operation is current.

The plan did not name one more fact. The catalog's registry coverage rule fails any `check` entry that is not a read-only registry operation, so a planned `check decomposition` entry fails it today. P1 T1 lets a planned `check` entry pass that rule until the registry holds it.

### Checks

- `npx vitest run tests/name-catalog.test.ts tests/w33-r0-shipped-text-names.test.ts tests/consistency.test.ts` in `packages/cli`: 3 files and 92 tests passed.
- `make-docs check prd --target-root .` with a temporary `MAKE_DOCS_HOME`: passed with 0 diagnostics.

## P1 CLI Operations and Ported Tests

Covers A1 to A8 in [P1](01-cli-operations-and-ported-tests.md). Evidence date: 2026-11-23. Base commit: `71096981` on `docs/w29-w30-work-store-and-factory`. The work is uncommitted.

### What Changed

| Operation ID | CLI path | MCP name | MCP profiles | Access | Source |
| --- | --- | --- | --- | --- | --- |
| `decomposition.output.validate` | `make-docs check decomposition` | `check_decomposition` | `quality`, `all` | Project read | `packages/cli/src/operations/decomposition/output.ts` |
| `project.relations.list` | `make-docs project relations list` | `project_relations_list` | `workflow`, `all` | Project read | `packages/cli/src/operations/project/relations.ts` |
| `project.markdown-style.validate` | `make-docs project markdown validate` | `project_markdown_validate` | `setup`, `quality`, `all` | Project read | `packages/cli/src/operations/project/markdown-style.ts` |
| `project.markdown-style.repair` | `make-docs project markdown repair` | `project_markdown_repair` | `setup`, `all` | Project write | `packages/cli/src/operations/project/markdown-style.ts` |

- Registry: the four IDs, their CLI paths, and their handlers in `packages/cli/src/operations/decomposition/ops.ts` and `packages/cli/src/operations/project/skill-check-ops.ts`. The MCP tools derive from the registry. Each operation has a leaf help entry, a typed result, and a plain-words renderer.
- CLI: `check decomposition` runs through the `check` group dispatcher, like `check prd`, and exits 1 when it finds a problem. The `project` router runs `markdown validate`, `markdown repair`, and `relations list`. `markdown validate` exits 1 when it finds a problem.
- `project markdown repair` matches `project paths repair`: without `--apply` it shows each exact change and writes nothing, `--dry-run` does the same, and `--apply` with `--dry-run` fails. The plain output shows the lines each change removes and adds. `--json` gives each change's edits and the whole file before and after. MCP needs `allowWrite: true` and `apply: true` to write. It reads each file again before it writes and stops if the file changed.
- `project markdown validate` and `repair` read the same files. They skip the folders that `project paths validate` skips (`isProtectedContentPath` in `packages/cli/src/path-hygiene.ts`: `node_modules`, `.git`, `.backup`, `__pycache__`, `.venv`, `.make-docs/state`, `.make-docs/backup`, `.make-docs/conflicts`, and `.make-docs/archive`), every `AGENTS.md` and `CLAUDE.md` router, and every file that holds a `<!-- make-docs:begin -->` managed block. Each result lists what it skipped, with the reason. A `--path` inside a protected folder fails closed. Of the two safe choices, skip a file with a managed block or edit around the block, the change takes the safer one: it never opens such a file for repair.
- Exit codes match the `project paths` pair: `markdown validate` exits 0 with no finding and 1 with a finding. `markdown repair` exits 0 when no finding is left and 1 when a finding is left, so a preview with something to fix exits 1. An error exits 2 with a `Markdown style error:` line. The leaf help states the codes.
- `project relations list` names each `docs/assets/` folder that it skips because it is not a configured Persona (`skippedFolders` in JSON, a `Skipped:` line in plain words). Reserved project folders, such as `project`, are not listed.
- `check decomposition` skips a symbolic link when it walks Markdown files under `docs/prd` and `docs/work`.
- Name catalog (T1): the four entries, `W34 R0` in `NameCatalogPlanner`, and a new `addedBy` field. The entries are `current` with `addedBy: "W34 R0"` and no former names, so no migration alias exists for them. The registry coverage rule now lets a planned `check` entry pass until the registry holds it. A current `check` entry, or one that the registry holds, must still be a read-only registry operation. A fixture test proves both sides.
- PRD 39: R-SKILL-CHECK-1 names each CLI path and MCP name. A new `Registry identifier | Canonical CLI | MCP tool` table lists the four commands with `--path`, `--apply`, `--dry-run`, `--target-root`, and `--json`. R-RUN-1 lists `decomposition` as an active `check` command. R-SKILL-CHECK-5 says that repair previews unless `--apply` is given. A `2026-11-23 — W34 R0 P1` Requirement History entry records the change.
- PRD 25: new R-MCP-PROFILE-11 and a `2026-11-23 — W34 R0 P1` Requirement History entry.
- Help text: the `project` and `check` group summaries name the new capabilities.
- Tests that list every operation or tool now include the four: the registry inventory, operation domains, MCP tool list, MCP derivation, MCP profile members and counts (`setup` 25, `workflow` 15, `quality` 13, `all` 58), the leaf help count (52), and the root help text.

### Rule ID Lists (T7)

P2 uses these IDs in the Skill text. Each finding names one of them.

`check decomposition` (43 rules, prefix `decomposition.`):

| Rule ID | Rule |
| --- | --- |
| `decomposition.prd.root-missing` | The project has a docs/prd folder. |
| `decomposition.prd.core-file-missing` | docs/prd holds the five core files 00-index.md to 04-glossary.md. |
| `decomposition.prd.legacy-archive` | docs/prd has no archive folder. Archived PRD sets live in .make-docs/archive/prds/. |
| `decomposition.prd.root-non-markdown` | Each file in the docs/prd root is a Markdown file. |
| `decomposition.prd.file-name` | Each PRD file name is NN-slug.md. |
| `decomposition.prd.duplicate-prefix` | No two top-level PRD files or folders share a number. |
| `decomposition.prd.file-prefix-range` | A top-level PRD file number is 00 to 04, or 05 to 97. |
| `decomposition.prd.backlog-in-prd` | Rebuild backlog files live under docs/work, not docs/prd. |
| `decomposition.prd.folder-name` | Each PRD subfolder name is NN-slug. |
| `decomposition.prd.folder-prefix-range` | A PRD subfolder number is 05 to 97. |
| `decomposition.prd.nested-too-deep` | A PRD subfolder holds no folders. |
| `decomposition.prd.nested-non-markdown` | A PRD subfolder holds only Markdown files. |
| `decomposition.prd.nested-file-name` | Each file in a PRD subfolder is named NN-slug.md. |
| `decomposition.prd.section-missing` | Each PRD document has the required `##` sections for its kind: core, subsystem, or reference. |
| `decomposition.prd.anchor-missing` | Each anchor section of a PRD document holds a code anchor, such as a backticked path. |
| `decomposition.archive.not-directory` | .make-docs/archive/prds is a folder. |
| `decomposition.archive.loose-file` | .make-docs/archive/prds holds only dated folders, not files. |
| `decomposition.archive.unexpected-entry` | .make-docs/archive/prds holds only folders. |
| `decomposition.archive.folder-name` | Each archive folder name is YYYY-MM-DD or YYYY-MM-DD-XX. |
| `decomposition.work.root-missing` | The project has a docs/work folder. |
| `decomposition.work.no-backlog` | docs/work holds at least one backlog folder. |
| `decomposition.work.loose-file` | Each backlog in docs/work is a folder, not a file. |
| `decomposition.work.folder-name` | Each backlog folder name is YYYY-MM-DD-wW-rR-slug. |
| `decomposition.work.index-missing` | Each backlog folder holds 00-index.md. |
| `decomposition.work.section-missing` | A backlog index has Purpose, Phase Map, and Usage Notes. A phase file has Purpose, Overview, and Source PRD Docs. |
| `decomposition.work.nested-folder` | A backlog folder holds no folders. |
| `decomposition.work.non-markdown` | A backlog folder holds only Markdown files. |
| `decomposition.work.phase-file-name` | Each phase file name is NN-slug.md, from 01. |
| `decomposition.work.no-phase-file` | Each backlog folder holds at least one phase file. |
| `decomposition.work.no-valid-backlog` | docs/work holds at least one backlog folder with a valid name. |
| `decomposition.work.unexpected-entry` | docs/work holds only backlog folders. |
| `decomposition.work.stage-missing` | Each phase file has at least one `## Stage` section. |
| `decomposition.work.stage-subsection-missing` | Each stage has Tasks, Acceptance criteria, and Dependencies subsections. |
| `decomposition.task-id.no-task` | Each stage lists at least one task. |
| `decomposition.task-id.line-format` | Each task line is `- [ ] TN: ...` or `- [x] TN: ...`. The task ID letter may be t or T. |
| `decomposition.task-id.duplicate` | No two tasks in a phase share a task ID. t1 and T1 are the same ID. |
| `decomposition.task-id.sequence` | Task IDs count up from T1 across all stages of a phase, with no gap or reset. |
| `decomposition.acceptance.empty` | Each stage lists at least one acceptance criterion. |
| `decomposition.acceptance.checkbox` | Acceptance criteria are plain bullets, not checkboxes. |
| `decomposition.acceptance.task-id` | Acceptance criteria do not start with a task ID. |
| `decomposition.acceptance.bullet` | Each acceptance criterion is a plain `- ...` bullet. |
| `decomposition.link.escapes-root` | A relative link in docs/prd or docs/work stays inside the project. |
| `decomposition.link.broken` | A relative link in docs/prd or docs/work points to a file or folder that exists. |

`project markdown validate` and `project markdown repair` (3 rules, prefix `markdown-style.`):

| Rule ID | Repair fixes it | Rule |
| --- | --- | --- |
| `markdown-style.block-spacing` | Yes | Put one blank line between two blocks. |
| `markdown-style.paragraph-wrap` | Yes | Write a top-level paragraph on one source line. |
| `markdown-style.list-continuation-wrap` | No | A list item goes on to an indented next line. Review it by hand. |

`project relations list` (4 relation kinds, prefix `relations.`):

| Kind ID | Relation |
| --- | --- |
| `relations.markdown-link` | A Markdown link: work to plan, plan to design, and back. |
| `relations.related-front-matter` | An entry in a guide's `related:` front matter. |
| `relations.history-coordinate` | A history record and a plan or work backlog with the same W/R coordinate. |
| `relations.same-slug` | Two artifacts with the same slug after the date and W/R parts. It is a guess. |

### Name Catalog and PRD Lines (A1, A5)

- The name catalog test passes with the four entries `current`. It checks the new PRD 39 table against the catalog, and it fails on a broken table row: a changed path, a changed tool name, and a missing row. It also fails an R-RUN-1 line without `check decomposition`.
- PRD 39 R-SKILL-CHECK-2 now says that `check decomposition` reads PRD sections with its own reader, because it shares no rule with `prd.authority.validate`. This is a recorded departure from the plan, which asked for the `check prd` reader. R-SKILL-CHECK-3 to R-SKILL-CHECK-5 name the skips, the exact preview, and the exit codes. A `2026-11-23 — W34 R0 P1 Review Fixes` Requirement History entry records them.
- `w34-r0-p1-skill-check-surfaces.test.ts` reads PRD 25 R-MCP-PROFILE-11 and checks each tool's profiles and access against the code.
- The shipped-text test and `make-docs check prd` pass with the new PRD lines.

### Ported Tests (A2)

All 58 Python test cases pass as vitest cases in `packages/cli/tests/w34-r0-p1-ported-skill-checks.test.ts`: 46 from `test_validate_output.py`, 11 from `test_check_markdown_style.py`, and 1 from `test_trace_relationships.py`. Each vitest case has the title `<Python class>.<Python method>`. The Python tests also still pass (`python3 -B -m unittest` in each scripts folder: 46, 1, and 11). Input changes, each one planned:

- A rule name is a rule ID: `block-spacing` is `markdown-style.block-spacing`.
- The two markdown output cases run the command, not the script: `--json --path sample.md` for `--format json sample.md`. The JSON keys are camelCase, and `rule` is `ruleId`.
- The relations case declares the custom `reviewer` Persona in `.make-docs/config.yaml`, because guide folders now come from the effective Persona set. Paths are project-relative, so `assets/reviewer/custom.md` is `docs/assets/reviewer/custom.md`.

| Python file | Python test method | vitest case |
| --- | --- | --- |
| `test_validate_output.py` | `TestStripCodeRegions.test_fenced_backtick_block` | `TestStripCodeRegions.test_fenced_backtick_block` |
| `test_validate_output.py` | `TestStripCodeRegions.test_fenced_tilde_block` | `TestStripCodeRegions.test_fenced_tilde_block` |
| `test_validate_output.py` | `TestStripCodeRegions.test_fenced_block_with_language` | `TestStripCodeRegions.test_fenced_block_with_language` |
| `test_validate_output.py` | `TestStripCodeRegions.test_line_count_preserved` | `TestStripCodeRegions.test_line_count_preserved` |
| `test_validate_output.py` | `TestStripCodeRegions.test_consecutive_fences` | `TestStripCodeRegions.test_consecutive_fences` |
| `test_validate_output.py` | `TestStripCodeRegions.test_closing_fence_must_match_character` | `TestStripCodeRegions.test_closing_fence_must_match_character` |
| `test_validate_output.py` | `TestStripCodeRegions.test_closing_fence_must_be_at_least_as_long` | `TestStripCodeRegions.test_closing_fence_must_be_at_least_as_long` |
| `test_validate_output.py` | `TestStripCodeRegions.test_inline_single_backtick` | `TestStripCodeRegions.test_inline_single_backtick` |
| `test_validate_output.py` | `TestStripCodeRegions.test_inline_double_backtick` | `TestStripCodeRegions.test_inline_double_backtick` |
| `test_validate_output.py` | `TestStripCodeRegions.test_non_code_content_untouched` | `TestStripCodeRegions.test_non_code_content_untouched` |
| `test_validate_output.py` | `TestStripCodeRegions.test_empty_code_span` | `TestStripCodeRegions.test_empty_code_span` |
| `test_validate_output.py` | `TestStripCodeRegions.test_unclosed_fence_treats_rest_as_code` | `TestStripCodeRegions.test_unclosed_fence_treats_rest_as_code` |
| `test_validate_output.py` | `TestStripCodeRegions.test_no_link_matches_after_stripping` | `TestStripCodeRegions.test_no_link_matches_after_stripping` |
| `test_validate_output.py` | `TestIsPlausibleLinkTarget.test_rejects_comma` | `TestIsPlausibleLinkTarget.test_rejects_comma` |
| `test_validate_output.py` | `TestIsPlausibleLinkTarget.test_rejects_ellipsis` | `TestIsPlausibleLinkTarget.test_rejects_ellipsis` |
| `test_validate_output.py` | `TestIsPlausibleLinkTarget.test_rejects_leading_single_quote` | `TestIsPlausibleLinkTarget.test_rejects_leading_single_quote` |
| `test_validate_output.py` | `TestIsPlausibleLinkTarget.test_rejects_trailing_double_quote` | `TestIsPlausibleLinkTarget.test_rejects_trailing_double_quote` |
| `test_validate_output.py` | `TestIsPlausibleLinkTarget.test_rejects_unescaped_space` | `TestIsPlausibleLinkTarget.test_rejects_unescaped_space` |
| `test_validate_output.py` | `TestIsPlausibleLinkTarget.test_accepts_relative_path` | `TestIsPlausibleLinkTarget.test_accepts_relative_path` |
| `test_validate_output.py` | `TestIsPlausibleLinkTarget.test_accepts_parent_path` | `TestIsPlausibleLinkTarget.test_accepts_parent_path` |
| `test_validate_output.py` | `TestIsPlausibleLinkTarget.test_accepts_bare_filename` | `TestIsPlausibleLinkTarget.test_accepts_bare_filename` |
| `test_validate_output.py` | `TestIsPlausibleLinkTarget.test_accepts_path_with_fragment` | `TestIsPlausibleLinkTarget.test_accepts_path_with_fragment` |
| `test_validate_output.py` | `TestIsPlausibleLinkTarget.test_accepts_escaped_spaces` | `TestIsPlausibleLinkTarget.test_accepts_escaped_spaces` |
| `test_validate_output.py` | `TestIsPlausibleLinkTarget.test_accepts_subdirectory_path` | `TestIsPlausibleLinkTarget.test_accepts_subdirectory_path` |
| `test_validate_output.py` | `TestIsPlausibleLinkTarget.test_rejects_empty_string` | `TestIsPlausibleLinkTarget.test_rejects_empty_string` |
| `test_validate_output.py` | `TestValidateLinksEndToEnd.test_no_false_positives_on_code_patterns` | `TestValidateLinksEndToEnd.test_no_false_positives_on_code_patterns` |
| `test_validate_output.py` | `TestValidateLinksEndToEnd.test_catches_genuinely_broken_links` | `TestValidateLinksEndToEnd.test_catches_genuinely_broken_links` |
| `test_validate_output.py` | `TestValidateLinksEndToEnd.test_valid_links_pass` | `TestValidateLinksEndToEnd.test_valid_links_pass` |
| `test_validate_output.py` | `TestValidateLinksEndToEnd.test_skips_fragment_and_url_links` | `TestValidateLinksEndToEnd.test_skips_fragment_and_url_links` |
| `test_validate_output.py` | `TestValidateLinksEndToEnd.test_mixed_fixture` | `TestValidateLinksEndToEnd.test_mixed_fixture` |
| `test_validate_output.py` | `TestValidateLinksEndToEnd.test_bare_bracket_paren_with_heuristic` | `TestValidateLinksEndToEnd.test_bare_bracket_paren_with_heuristic` |
| `test_validate_output.py` | `TestValidateLinksEndToEnd.test_work_directory_also_filtered` | `TestValidateLinksEndToEnd.test_work_directory_also_filtered` |
| `test_validate_output.py` | `TestValidateLinksEndToEnd.test_build_result_accepts_phase_local_task_ids_across_stages` | `TestValidateLinksEndToEnd.test_build_result_accepts_phase_local_task_ids_across_stages` |
| `test_validate_output.py` | `TestValidateLinksEndToEnd.test_build_result_accepts_upper_and_mixed_case_task_ids` | `TestValidateLinksEndToEnd.test_build_result_accepts_upper_and_mixed_case_task_ids` |
| `test_validate_output.py` | `TestValidateLinksEndToEnd.test_build_result_rejects_duplicate_task_ids_across_case` | `TestValidateLinksEndToEnd.test_build_result_rejects_duplicate_task_ids_across_case` |
| `test_validate_output.py` | `TestValidateLinksEndToEnd.test_build_result_rejects_numbered_task_items` | `TestValidateLinksEndToEnd.test_build_result_rejects_numbered_task_items` |
| `test_validate_output.py` | `TestValidateLinksEndToEnd.test_build_result_rejects_missing_task_ids` | `TestValidateLinksEndToEnd.test_build_result_rejects_missing_task_ids` |
| `test_validate_output.py` | `TestValidateLinksEndToEnd.test_build_result_rejects_acceptance_checkboxes` | `TestValidateLinksEndToEnd.test_build_result_rejects_acceptance_checkboxes` |
| `test_validate_output.py` | `TestValidateLinksEndToEnd.test_build_result_rejects_upper_case_task_id_in_acceptance` | `TestValidateLinksEndToEnd.test_build_result_rejects_upper_case_task_id_in_acceptance` |
| `test_validate_output.py` | `TestValidateLinksEndToEnd.test_build_result_rejects_task_id_reset_in_later_stage` | `TestValidateLinksEndToEnd.test_build_result_rejects_task_id_reset_in_later_stage` |
| `test_validate_output.py` | `TestValidateLinksEndToEnd.test_build_result_integration` | `TestValidateLinksEndToEnd.test_build_result_integration` |
| `test_validate_output.py` | `TestValidateLinksEndToEnd.test_build_result_accepts_current_archive_namespace` | `TestValidateLinksEndToEnd.test_build_result_accepts_current_archive_namespace` |
| `test_validate_output.py` | `TestValidateLinksEndToEnd.test_build_result_rejects_loose_files_in_current_archive` | `TestValidateLinksEndToEnd.test_build_result_rejects_loose_files_in_current_archive` |
| `test_validate_output.py` | `TestValidateLinksEndToEnd.test_build_result_rejects_legacy_archive_namespace` | `TestValidateLinksEndToEnd.test_build_result_rejects_legacy_archive_namespace` |
| `test_validate_output.py` | `TestValidateLinksEndToEnd.test_build_result_rejects_legacy_single_file_backlog` | `TestValidateLinksEndToEnd.test_build_result_rejects_legacy_single_file_backlog` |
| `test_validate_output.py` | `TestValidateLinksEndToEnd.test_build_result_rejects_legacy_backlog_directory_naming` | `TestValidateLinksEndToEnd.test_build_result_rejects_legacy_backlog_directory_naming` |
| `test_check_markdown_style.py` | `MarkdownStyleTests.test_flags_block_boundary_violations` | `MarkdownStyleTests.test_flags_block_boundary_violations` |
| `test_check_markdown_style.py` | `MarkdownStyleTests.test_flags_list_followed_by_paragraph_or_heading_without_blank_line` | `MarkdownStyleTests.test_flags_list_followed_by_paragraph_or_heading_without_blank_line` |
| `test_check_markdown_style.py` | `MarkdownStyleTests.test_flags_code_fence_followed_by_paragraph_without_blank_line` | `MarkdownStyleTests.test_flags_code_fence_followed_by_paragraph_without_blank_line` |
| `test_check_markdown_style.py` | `MarkdownStyleTests.test_flags_wrapped_top_level_paragraphs` | `MarkdownStyleTests.test_flags_wrapped_top_level_paragraphs` |
| `test_check_markdown_style.py` | `MarkdownStyleTests.test_fix_mode_spaces_blocks_before_unwrapping_paragraphs` | `MarkdownStyleTests.test_fix_mode_spaces_blocks_before_unwrapping_paragraphs` |
| `test_check_markdown_style.py` | `MarkdownStyleTests.test_fix_mode_preserves_frontmatter_and_code_fences` | `MarkdownStyleTests.test_fix_mode_preserves_frontmatter_and_code_fences` |
| `test_check_markdown_style.py` | `MarkdownStyleTests.test_fix_mode_preserves_tables_blockquotes_comments_and_lists` | `MarkdownStyleTests.test_fix_mode_preserves_tables_blockquotes_comments_and_lists` |
| `test_check_markdown_style.py` | `MarkdownStyleTests.test_html_comment_bang_close_does_not_hide_following_text` | `MarkdownStyleTests.test_html_comment_bang_close_does_not_hide_following_text` |
| `test_check_markdown_style.py` | `MarkdownStyleTests.test_reports_but_does_not_fix_wrapped_list_continuation` | `MarkdownStyleTests.test_reports_but_does_not_fix_wrapped_list_continuation` |
| `test_check_markdown_style.py` | `MarkdownStyleTests.test_json_output_schema_and_order_are_stable` | `MarkdownStyleTests.test_json_output_schema_and_order_are_stable` |
| `test_check_markdown_style.py` | `MarkdownStyleTests.test_text_output_groups_by_file_and_rule` | `MarkdownStyleTests.test_text_output_groups_by_file_and_rule` |
| `test_trace_relationships.py` | `CurrentLayoutTest.test_history_and_custom_audience_relationships` | `CurrentLayoutTest.test_history_and_custom_audience_relationships` |

### CLI and MCP Parity (A3)

For each command, the CLI `--json` result equals the MCP tool result in each profile that holds the tool, and the CLI plain output equals the plain renderer of that result. A tool outside its profiles is not found. `project markdown repair` gives the same preview through the CLI and MCP, and the same repair on two copies of one fixture, with equal file bytes after.

### Repair Safety (A4)

- `--dry-run`, and a run without `--apply`, write nothing. `--apply --dry-run` fails and writes nothing.
- An MCP call with `allowWrite`, `apply`, and `dryRun` writes nothing.
- An MCP call without `allowWrite`, and a direct call without write permission, fail with the typed write refusal and change nothing.
- The three read-only commands change no file.
- A `--path` outside the project fails closed.

### Persona Guide Folders (A6)

Owner decision, approved 2026-11-23: `relations list` skips each `docs/assets/` folder that is not a configured Persona (option A, as PRD 39 R-SKILL-CHECK-3 says) and names each skipped folder: one `Skipped:` line in plain words and one `skippedFolders` entry in JSON.

On a fixture with a configured `reviewer` Persona, `project relations list` reads `docs/assets/user`, `docs/assets/maintainer`, and `docs/assets/reviewer`, finds `docs/assets/reviewer/review-guide.md` as a guide of the `reviewer` Persona, and leaves out `docs/assets/undeclared/`. Each relation names its kind and its source file. `--path` shows one artifact with its upstream, downstream, and lateral relations.

### Independent Review Fixes

An independent review asked for seven changes. Each one is done and tested in `w34-r0-p1-skill-check-surfaces.test.ts` (`W34 R0 P1 review fixes`).

| Finding | Fix | Test |
| --- | --- | --- |
| MEDIUM-HIGH: the default `docs` scope included each `AGENTS.md` and `CLAUDE.md` router, and `repair --apply` added blank lines inside the managed blocks of 12 routers in this repository. `--path .` reached `node_modules/` and `.make-docs/backup/`. | Skip the `project paths validate` protected folders, router files, and files with a managed block, in validate and repair alike, and list each skip. | Routers, a managed-block file, and protected folders keep their bytes after `repair --apply`. `--path .` skips the protected folders. A protected `--path` fails. |
| MEDIUM: PRD 39 R-SKILL-CHECK-2 asked for the `prd.authority.validate` reader. | R-SKILL-CHECK-2 now says that the check uses its own PRD section reader, with a Requirement History entry. | Name catalog and `check prd` pass. |
| LOW: the repair preview did not show the exact change. | Each change lists its edits (lines removed and added) in plain words and JSON, and JSON holds the file before and after. | Applying the edits gives the repaired text, for every file. |
| LOW: exit codes did not match the `project paths` pair. | 0, 1, and 2 as that pair uses them, stated in the leaf help. | Clean, findings, preview, apply with and without a finding left, and an error. |
| INFO: `check decomposition` followed a linked Markdown file. | The walk skips symbolic links. | A linked file outside the project adds no finding. |
| Owner decision, approved 2026-11-23: skip non-Persona `docs/assets/` folders (option A), with one skipped line per folder. | Done: `relations list` skips them and names each one in text and JSON. | Text and JSON name `docs/assets/undeclared`, and not `docs/assets/project`. |
| Follow-up: use W29 R0 P3's shared `readTaskLine` for the acceptance task ID check. | P5 T8 records it. See Limits. | Not yet: W29 R0 P3 has not landed. |

### Guided Progress Review (A7)

Passed: the owner accepted this plain output on 2026-11-23 with no changes. The samples below come from the built CLI after the review fixes. Each command prints its totals first, then each finding with its rule ID and a plain message. The fixture is the mixed side-by-side fixture below.

`make-docs check decomposition` (a terminal shows this; a pipe gets JSON, as for every `check` command):

```text
Decomposition output check: failed. Found 30 findings in 9 files or folders. Changed nothing.
Project: <temp>/fixtures/mixed
By rule: decomposition.prd.core-file-missing 1, decomposition.prd.file-prefix-range 1, decomposition.prd.section-missing 14, decomposition.prd.anchor-missing 1, decomposition.archive.folder-name 1, decomposition.archive.loose-file 1, decomposition.task-id.sequence 2, decomposition.task-id.line-format 1, decomposition.acceptance.checkbox 1, decomposition.acceptance.task-id 1, decomposition.acceptance.bullet 1, decomposition.work.stage-subsection-missing 2, decomposition.task-id.no-task 1, decomposition.work.loose-file 1, decomposition.link.broken 1.

docs/prd/04-glossary.md
  decomposition.prd.core-file-missing: missing required core PRD file

docs/prd/98-late.md
  decomposition.prd.file-prefix-range: top-level PRD prefix must be 05-97 or a fixed core number
  decomposition.prd.section-missing: missing required section '## Scope'
  decomposition.prd.section-missing: missing required section '## Component and Capability Map'
  decomposition.prd.section-missing: missing required section '## Contracts and Data'
  decomposition.prd.section-missing: missing required section '## Integrations'
  decomposition.prd.section-missing: missing required section '## Rebuild Notes'
  decomposition.prd.section-missing: missing required section '## Source Anchors'

docs/prd/03-open-questions-and-risk-register.md
  decomposition.prd.section-missing: missing required section '## Source Anchors'

docs/prd/05-capital-api.md
  decomposition.prd.section-missing: missing required section '## Source Anchors'
  decomposition.prd.anchor-missing: section '## Reference' does not contain a code anchor

docs/prd/07-sub/01-nested.md
  decomposition.prd.section-missing: missing required section '## Scope'
  decomposition.prd.section-missing: missing required section '## Component and Capability Map'
  decomposition.prd.section-missing: missing required section '## Contracts and Data'
  decomposition.prd.section-missing: missing required section '## Integrations'
  decomposition.prd.section-missing: missing required section '## Rebuild Notes'
  decomposition.prd.section-missing: missing required section '## Source Anchors'

.make-docs/archive/prds/bad-name
  decomposition.archive.folder-name: archive directories must use YYYY-MM-DD or YYYY-MM-DD-XX naming

.make-docs/archive/prds/loose.md
  decomposition.archive.loose-file: .make-docs/archive/prds must contain dated directories only

docs/work/2026-01-03-w1-r0-example/01-phase.md
  decomposition.task-id.sequence (line 10): task item in '## Stage 1 - Build' expected T2 but found T3
  decomposition.task-id.sequence (line 11): task item in '## Stage 1 - Build' expected T3 but found T4
  decomposition.task-id.line-format (line 12): task item in '## Stage 1 - Build' must use '- [ ] TN: ...' or '- [x] TN: ...': - [ ] T5: Indented.
  decomposition.acceptance.checkbox: acceptance criteria in '## Stage 1 - Build' must be plain bullets, not checkboxes: - [ ] Done.
  decomposition.acceptance.task-id: acceptance criteria in '## Stage 1 - Build' must not use task ids: - T1: Bad.
  decomposition.acceptance.bullet: acceptance criteria in '## Stage 1 - Build' must use plain '- ...' bullets: Plain line.
  decomposition.work.stage-subsection-missing: stage '## Stage 2 - Empty' missing required subsection '### Acceptance criteria'
  decomposition.work.stage-subsection-missing: stage '## Stage 2 - Empty' missing required subsection '### Dependencies'
  decomposition.task-id.no-task: stage '## Stage 2 - Empty' must include at least one task item
  decomposition.link.broken: broken link -> ../../prd/09-missing.md

docs/work/loose.md
  decomposition.work.loose-file: backlog entries must be directories named YYYY-MM-DD-w{W}-r{R}-<slug>

Next: fix each finding, then run make-docs check decomposition again.
```

`make-docs project markdown validate --path docs/designs`:

```text
Markdown style check: Checked 1 Markdown file. Found 2 findings in 1 file: 2 repair can fix, 0 to review by hand. Changes nothing.
Project: <temp>/fixtures/mixed
Scope: docs/designs
By rule: markdown-style.block-spacing 1, markdown-style.paragraph-wrap 1, markdown-style.list-continuation-wrap 0.

docs/designs/2026-01-01-example.md
  markdown-style.block-spacing (line 2, repair can fix): Block `paragraph` must be separated from previous `heading` block by one blank line.
    A design paragraph that wraps onto a second line.
  markdown-style.paragraph-wrap (lines 2-3, repair can fix): Paragraph spans multiple source lines; use one logical source line unless Markdown structure requires otherwise.
    A design paragraph that wraps onto a second line.

Next: review a sample of the findings, then run `make-docs project markdown repair` to see the planned fixes.
```

`make-docs project markdown repair --path docs/designs`:

```text
Markdown style repair: Checked 1 Markdown file. Repair would change 1 file. Changed nothing.
Project: <temp>/fixtures/mixed
Scope: docs/designs

Would change: docs/designs/2026-01-01-example.md (3 lines -> 3 lines)
  markdown-style.block-spacing: add a blank line before line 2
  markdown-style.paragraph-wrap: join lines 2-3 into one line
    - A design paragraph that wraps
    - onto a second line.
    + A design paragraph that wraps onto a second line.

Next: Review the planned changes. Then run `make-docs project markdown repair --apply` with the same paths.
```

`make-docs project relations list --path docs/plans/2026-01-02-w1-r0-example`:

```text
Document relations: Showing 1 artifact that matches docs/plans/2026-01-02-w1-r0-example, with 4 relations. Changes nothing.
Project: <temp>/fixtures/mixed
Guide folders from the Persona set: docs/assets/user, docs/assets/maintainer, docs/assets/reviewer
Skipped: docs/assets/undeclared (not a configured Persona folder; make-docs project persona list shows the Personas)

docs/plans/2026-01-02-w1-r0-example/ (plan)
  upstream -> docs/designs/2026-01-01-example.md [relations.markdown-link, in docs/plans/2026-01-02-w1-r0-example/00-overview.md]
  downstream -> docs/work/2026-01-03-w1-r0-example/ [relations.same-slug, in docs/plans/2026-01-02-w1-r0-example/]
  lateral -> docs/assets/reviewer/review-guide.md [relations.related-front-matter, in docs/assets/reviewer/review-guide.md]
  lateral -> .make-docs/archive/history/2026-01-04-w1-r0-p1-example.md [relations.history-coordinate, in .make-docs/archive/history/2026-01-04-w1-r0-p1-example.md]
```

### Side-by-Side Run (A8)

Each old script and its new command ran on the same three fixtures with the built CLI and Python 3.14.10. No Python file changed. The fixtures:

- `clean`: a minimal decomposition output with no problem.
- `mixed`: 23 files with at least one finding of most rules, a configured `reviewer` Persona, a folder that is not a Persona, a link with a `#fragment`, a `W2 R10` history record beside a `w2-r1` plan, a CRLF file, an indented task line, and a task line with no space after the colon.
- `repo-copy`: a copy of this repository's `docs/` and `.make-docs/` (866 Markdown files under `docs/`, 1,236 artifacts).

The first run was before the review fixes. After fix 1 the Markdown rows were run again on all three fixtures; the decomposition and relations rows gave the same counts again. The comparison turned each command finding into the script's form (`<absolute path>: <message>`, or the script's finding keys) and compared the two lists.

| Check | Fixture | Script | Command | Same findings | Differences |
| --- | --- | --- | --- | --- | --- |
| `validate_output.py` / `check decomposition` | `clean` | 0, exit 0 | 0, exit 0 | Yes | None |
| | `mixed` | 30, exit 1 | 30, exit 1 | 28 of 30 | 2, from the shared task reader (D1, D2) |
| | `repo-copy` | 705, exit 1 | 705, exit 1 | Yes, same order | None |
| `check_markdown_style.py` / `project markdown validate` | `clean` | 0 | 0 | Yes | None |
| | `mixed` | 72 in 16 files | 72 | Yes, same order | None |
| | `repo-copy` | 269 in 866 files | 243 in 853 files | 243, same order | 26 findings in 12 skipped router files (D7) |
| `check_markdown_style.py --fix` / `project markdown repair --apply` | `clean` | 0 files changed | 0 | Same bytes | None |
| | `mixed` | 13 files changed | 13 | 15 of 16 files same bytes | 1 CRLF file (D3) |
| | `repo-copy` | 53 files changed | 41 | 1,666 of 1,678 files same bytes | 12 router files that the script changed and the command skips (D7) |
| `trace_relationships.py` / `project relations list` | `clean` | 3 artifacts, 0 relations | 3, 0 | Yes | None |
| | `mixed` | 14 artifacts, 20 relation entries | 13, 20 | 16 of 20 | 4 entries each side (D4, D5) |
| | `repo-copy` | 1,236 artifacts, 11,186 relation entries | 1,236, 11,148 | 11,084 | 102 script-only, 64 command-only (D5, D6) |

Each difference and its reason. None is hidden, and every one was counted by a script that checks its cause:

- D1, a task line with no space after the colon (`- [ ] T4:no space.`): the script rejects it, and the command accepts it as task T4. Planned: the command reads task lines through the shared work phase reader (`parseWorkPhase`, PRD 14 R-COORD-22), as T2 asks. So the next task, T5, gets a different sequence message.
- D2, an indented task line (`  - [ ] T5: Indented.`): the script strips the indent and accepts it, and the command reports `decomposition.task-id.line-format`. Planned: the shared reader does not read an indented line as a task, so the backlog snapshot and the work tools never saw it either.
- D3, a file with `\r\n` line ends: the script wrote it back with `\n`, and the command keeps `\r\n`. Script defect fix: a repair changes only the style findings.
- D4, `docs/assets/undeclared/` is not a configured Persona: the script read it as a guide folder, and the command does not (2 entries). Planned change: guide folders come from the effective Persona set (PRD 39 R-SKILL-CHECK-3).
- D5, a link with a `#fragment`, such as `../../designs/x.md#decision`: the script kept the fragment in the target, so it missed the link and at most guessed a same-slug match. The command drops the fragment and finds the link. Script defect fix. Mixed: 2 same-slug entries became link entries, plus 2 more link entries for the plan's file. Repo copy: 14 same-slug entries became link entries, and 64 link entries are new.
- D7, files that Make Docs owns: `project markdown validate` and `repair` skip router files, files with a managed block, and protected folders (review fix 1). In the repo copy, the script reported 26 findings in 12 `docs/**/AGENTS.md` and `CLAUDE.md` routers and added blank lines inside their managed blocks with `--fix`. The command skips the 12 routers and 1 plan file that names the managed block marker, reports the other 243 findings exactly as the script does, and leaves the 12 routers as they were. A check counted each script-only finding and each differing file: all are in a skipped file. The `clean` and `mixed` fixtures hold no such file, so their rows did not change. Planned change after review: a repair must not change bytes that `make-docs setup` owns.
- D6, a W/R coordinate that is the start of a longer number: the script matched `w18-r1` inside `w18-r10` to `w18-r16`, and `w2-r1` inside `w2-r10`. The command does not (88 entries in the repo copy). Script defect fix.

The plain output of the scripts and the commands differs on purpose: the commands print totals first and name each rule ID (R-SKILL-CHECK-6), and the relation paths are project-relative.

### Commands and Results

All commands ran in `packages/cli` or the repository root with a temporary `MAKE_DOCS_HOME`. No run read or wrote the real Store. These results are after the review fixes.

- `npx tsc --noEmit -p .`: passed.
- `npm run build`: passed.
- `npx vitest run tests/w34-r0-p1-ported-skill-checks.test.ts tests/w34-r0-p1-skill-check-surfaces.test.ts`: 2 files and 85 tests passed (58 ported, 27 surface and review-fix tests).
- `npx vitest run tests/w34-r0-p1-*.test.ts tests/name-catalog.test.ts tests/w33-r0-*.test.ts tests/mcp*.test.ts tests/consistency.test.ts tests/path-hygiene-cli.test.ts tests/w19-r3-path-hygiene.test.ts`: 17 files and 837 tests; 835 passed. The 2 failures are the known `mcp-app-contract` cases.
- `npm run validate:defaults -w packages/cli`: 3 files and 53 tests passed.
- `bash scripts/check-instruction-routers.sh`: passed. It ran outside the sandbox, because the sandbox blocks its `mktemp` folder.
- `make-docs check prd --target-root .`: passed with 0 diagnostics.
- `make-docs project paths validate --target .`: passed, 0 findings.
- `python3 -B -m unittest` in each of the three scripts folders: 46, 1, and 11 tests passed. Python ran only for the comparison.
- Full suite, `npx vitest run --reporter=json`, counted from the JSON: 140 files and 3015 tests: 3005 passed, 4 failed, 6 skipped. The 4 failures are known: `mcp-app-contract` (2, a Node deprecation warning on stderr), `p5-migration-safety` fixture 11 (sandbox only), and one `cli.test.ts` case that hit its 15-second timeout under load and passed when run alone. The suite ran after `npm run build` and `node scripts/copy-template-to-cli.mjs`; without them, many package identity and template tests fail before any change.

### Limits

- `check decomposition` prints plain words on a terminal and JSON to a pipe or with `--json`, as every `check` group command does under R-RENDER. The three `project` commands print plain words unless `--json` is given.
- `check decomposition` reads PRD sections with its own reader, with the script's rules. `prd.authority.validate` has no public file or section reader and no rule in common. PRD 39 R-SKILL-CHECK-2 now says so; this is a recorded departure from the plan. Task lines and task IDs use the shared work phase reader.
- The managed-block skip is by text: a file that contains `<!-- make-docs:begin -->` anywhere, even in prose or a code span, is skipped whole. In the repo copy this skips one plan file that names the marker. This is the safer choice over repairing around the block.
- The command keeps one script behavior that looks odd, so that the findings match: a PRD file whose path holds a reference keyword anywhere, such as `api` in `capital`, is checked as a reference document.
- The acceptance task ID check still uses its own pattern (`TASK_LABEL_IN_ACCEPTANCE_RE` in `packages/cli/src/operations/decomposition/output.ts`). After W29 R0 P3 lands its shared task line reader (`readTaskLine`), this Wave switches that check to it and reruns the ported tests and the side-by-side run. [P5](05-acceptance.md) T8 holds this task.
- W29 R0 P3 may change the work phase reader. `check decomposition` calls only `parseWorkPhase` and needs each task's `line` and `id`. If P3 lands first, rerun the ported tests and this side-by-side run.
- The side-by-side scripts live outside the repository, because the Wave adds no Python. The method above repeats the run.

## P2 Skill Text and Guides

Covers A9 to A12 in [P2](02-skill-text-and-guides.md). Evidence date: 2026-11-23. Base commit: `83073f13` on `docs/w29-w30-work-store-and-factory`. The work is uncommitted.

### What Changed

| Skill | Files | Change |
| --- | --- | --- |
| `decompose-codebase` | `SKILL.md`, `references/output-contract.md`, `references/planning-workflow.md`, `references/execution-workflow.md`, `references/mcp-playbook.md`, `references/harness-capability-matrix.md`, `assets/README.md`, `assets/templates/decomposition-plan.md` | The output check uses `check_decomposition`, then `make-docs check decomposition`, then a manual review of a new `## Check Rules` list in the output contract with all 43 `decomposition.` rule IDs. The probe step is gone: the agent lists the MCP tools and agent tools of its own session and writes them in the plan (OD-2). The plan template has `## Session Tools` and `## Output Check` in place of `## MCP Strategy` and `## Validation`. Tools are named by capability, and no MCP server is named (PD-1). |
| `archive-docs` | `SKILL.md`, `references/archive-workflow.md` | A new `## Relationship Tracing` section uses `project_relations_list`, then `make-docs project relations list`, then the manual steps. The manual steps carry the four `relations.` kind IDs, a kind table, the Persona folder skip, the `#fragment` rule, and whole-number W/R matching. The two index server names became capability words. |
| `cleanup-docs` | `SKILL.md` | A new `## Check and Repair` section uses `project_markdown_validate` and `project_markdown_repair`, then the `make-docs project markdown validate` and `repair` commands, then a manual review. The flow stays: check, review a sample, then repair only when the sample is clean, with a preview before `--apply`. A `## Formatting Rules` table holds the three `markdown-style.` rule IDs. A manual repair needs the person's agreement. The text names the router and managed-block skips. |

Each of the three manual paths says that the result is a manual review, uses the proof state `agent-reviewed`, does not say that a Make Docs check ran, and installs nothing without the person's consent. A sample, from `decompose-codebase/SKILL.md`:

> 1. MCP tool: when the session has the Make Docs `check_decomposition` tool, call it for the repository root.
> 2. CLI: otherwise run `make-docs check decomposition --target-root <repo-root>`.
> 3. Manual review: otherwise check each rule in the `## Check Rules` section of [references/output-contract.md](./references/output-contract.md) by hand. Name the rule ID of each problem that you find.
>
> A manual result says that it is a manual review and uses the proof state `agent-reviewed`. It does not say that a Make Docs check ran. Do not install the CLI or any other tool without the person's consent.

Guides (T6): `docs/assets/maintainer/skills-catalog-and-distribution-model.md` no longer lists helper scripts. It names the MCP, CLI, and manual order and the twin rule. `docs/assets/user/skills-decomposing-an-existing-codebase.md` names index tools by capability and has a new `## Output check` section. No other guide under `docs/assets/user/` or `docs/assets/maintainer/` names a removed script. Files under `docs/assets/project/` that name the scripts are project content, not shipped guides: dated records (an audit, design prompts, a migration inventory, and retired local state) and one planned-restructure note (`evolution-direction-structure.md`). They keep the names they recorded. No file in `packages/docs/template/` changed. This repository has no installed copy of the three Skills.

### Twin Test (A10, A11)

`packages/cli/tests/w34-r0-p2-skill-check-twins.test.ts` imports `DECOMPOSITION_RULE_IDS`, `RELATION_KIND_IDS`, and `MARKDOWN_STYLE_RULE_IDS` and reads every Markdown file of each Skill outside `scripts/`. It collects the inline-code IDs with the operation's prefix and fails when an ID exists on one side only. For each Skill it also checks:

- `SKILL.md` names the MCP tool, then the CLI command, then a `Manual review:` step, in that order, with each tool and command of the pair.
- `SKILL.md` says that a manual result is a manual review, names `agent-reviewed`, says that it does not claim a Make Docs check ran, and installs nothing without consent.
- No Markdown or YAML file of the Skill outside `scripts/` holds a `.py` name or a `scripts/` path (A9).
- `decompose-codebase` names no `jdocmunch`, `jcodemunch`, or `probe_environment` (PD-1).

Fixture cases prove the comparison: it passes on equal sides, reports `fixture.beta` on a fixture with that ID in the operation only, reports `fixture.gamma` on a fixture with that ID in the Skill text only, and reads only inline code with the prefix. A live break also fails it: renaming `markdown-style.list-continuation-wrap` in `cleanup-docs/SKILL.md` gave `operationOnly: ["markdown-style.list-continuation-wrap"]` and `skillOnly: ["markdown-style.list-wrap"]`, and the file was restored.

### Standalone Check (T7)

A link scan of the three Skills found no relative link that leaves the Skill folder, points to a missing file, or points to a file that `packages/cli/skill-registry.json` does not declare. The new text names only CLI commands and MCP tools, which need no maintainer checkout, and the manual paths need no tool.

### Commands and Results

All commands ran in `packages/cli` or the repository root with a temporary `MAKE_DOCS_HOME`. No run read or wrote the real Store.

- `npx tsc --noEmit -p .` in `packages/cli`: passed.
- `npm run build`: passed.
- `npx vitest run tests/w34-r0-p2-skill-check-twins.test.ts`: 15 tests passed.
- `npx vitest run` on the twin, shipped-text, Skill registry, catalog, embedded, byte, layout, install, consistency, name catalog, and P1 test files: 12 files and 330 tests passed, after one fix. The first run failed one consistency case, because the copied `decomposition.task-id.duplicate` text held a lowercase task ID. The Skill text now says that the letter case does not matter.
- `npm run validate:defaults -w packages/cli`: 3 files and 53 tests passed.
- Full suite, `npx vitest run --reporter=json`, counted from the JSON: 3030 tests: 3019 passed, 5 failed, 6 skipped. The 5 failures are known or load-related: `mcp-app-contract` (2, a Node deprecation warning on stderr), `p5-migration-safety` fixture 11 (sandbox only), and two 15-second timeouts under load, one in `cli.test.ts` and one in `backup.test.ts`. Each of the two timed-out cases passed when run alone.
- `make-docs project paths validate --target .`: valid, 0 failing findings.
- `make-docs check prd --target-root .`: 0 diagnostics.
- `bash scripts/check-instruction-routers.sh`: passed, outside the sandbox.
- `make-docs project markdown validate` on the three Skills and the two guides: 5 findings in 4 files. The same 5 findings are in the `83073f13` copies of the same files, so P2 adds none. The new `cleanup-docs` text does not quote the managed-block marker, so the check does not skip that file.

### Limits

- `packages/skills/README.md` step 3 still says that deterministic helpers go in `scripts/`. P4 changes it, as the design's migration step 6 says.
- The Python files, their registry entries, and the closeout `python3` commands stay until P4.
- The twin test checks rule IDs, not rule wording. The `relations.` rule text in the Skill matches the operation descriptions word for word, and the `decomposition.` text does too except `decomposition.task-id.duplicate`, which avoids a lowercase task ID that the consistency test bans. The `markdown-style.` text is close but not equal.

## P3 Backlog-Review Bundles

Covers A13 to A15 in [P3](03-backlog-review-bundles.md). Evidence date: 2026-11-23. Base commit: `83073f13` on `docs/w29-w30-work-store-and-factory`. The work is uncommitted.

### What Changed

| Skill script | CLI source (one home for the logic) | Build flag |
| --- | --- | --- |
| `report-contract.mjs` | `packages/cli/src/operations/work/backlog/presentation.ts` (unchanged) | none |
| `agent-contract.mjs` | `packages/cli/src/operations/work/backlog/agent-contracts.ts` (unchanged) | `--agent` |
| `render-report.mjs` | new `packages/cli/src/operations/work/backlog/report-file.ts` | `--render` |
| `collect-project-lead-context.mjs` | new `packages/cli/src/operations/work/backlog/project-lead-context.ts` | `--collector` |

- `project-lead-context.ts` holds the argument parser, the path safety checks, the Markdown section and introduction readers, the bounded excerpt, the source order, and the script body. A refused input throws `ProjectLeadContextUsageError`. The script body prints the message and the usage line and exits 2, as before.
- `report-file.ts` holds the argument parser, the output path checks, the template path, the file write, and the script body. The caller passes the renderer. The generated script takes `renderBacklogStaticHtml` from the sibling `./report-contract.mjs`, as the hand-written script did, so the report contract is not bundled twice.
- `packages/cli/scripts/build-backlog-presentation.mjs` uses the same esbuild `buildSync` call for all four files. The two new files come from a two-line entry that calls the CLI source. They keep a `#!/usr/bin/env node` line, then the `// Generated by packages/cli/scripts/build-backlog-presentation.mjs --render. Do not edit.` (or `--collector`) header. They are not minified, so a person or agent can read them. The two old files did not change (their bytes match before and after).
- The build script exports `portableBacklogSkillScripts` (each file, its flag, and its build) and `checkPortableBacklogSkillScripts()`. The check returns each file whose bytes differ from a fresh build, each missing file, and each file in the Skill `scripts/` folder that no build makes. P4 can reuse it in the guard test.
- `node packages/cli/scripts/build-backlog-presentation.mjs --all` writes all four files. No flag and `--agent` keep their old meaning.
- The CLI barrel `packages/cli/src/operations/work/backlog/index.ts` does not export the two new modules, and no registry operation uses them. No snapshot code changed.

### Byte-Match Test (A13)

`packages/cli/tests/backlog-review-skill-bundles.test.ts` has 14 tests:

- The list of builds names exactly the four files in `packages/skills/backlog-review/scripts/`.
- Each file matches a fresh build byte for byte and starts with its "Generated by ... Do not edit." header.
- The shared check passes. It then fails for each file when a test reader changes one byte, and reports only that file.
- The shared check fails a missing file and an extra `helper.mjs`.
- The two executable scripts import only `node:` modules and `./report-contract.mjs`.
- Each of the four bundles runs from a copy of the Skill in a temporary folder with no `node_modules`, with a `MAKE_DOCS_HOME` that the run never creates (A14).
- Direct tests of the moved source: the argument parsers, unsafe record paths, the excerpt bounds, and the output path checks.

A real hand edit also fails. A change of `excerptLimit = 2e3` to `3e3` in the generated collector failed two tests (the byte match and the shared check). After the file was put back, all 14 passed.

### Before and After Comparison

A script outside the repository copied the hand-written Skill (before) and the generated Skill (after) into separate temporary folders and ran both on the same inputs. It compared exit codes, standard output, standard error, and the written HTML bytes. Result: 124 cases, 124 the same, 0 different.

- Collector on this repository: the root with no record, every one of the 85 work records (61 live in `docs/work/` and 24 in `.make-docs/archive/work/`) in groups of three, 20 records named by their `00-index.md` file, and a relative `--target-root .`.
- Collector fixtures: an empty project, the product overview with nested headings, a heading with closing `#` marks, a front-matter introduction, README overview, a CRLF README introduction, package description, blank and malformed package files, a long excerpt with and without a sentence boundary, an empty `Purpose` section with a README fallback, records with `Purpose`, `Objective`, `Overview`, and no match, a missing record, a link to a file outside the project, `../`, absolute, and backslash paths, four records, and six argument errors.
- Render wrapper: the `small` presentation report and the `mixedPortfolioFixture` report, each as is, with hostile project text, with no project lead, with an unknown field, and with a dangling Next and Attention reference. For each written file it also compared the refusal to replace it and the `--force` replace. It also compared a non-HTML output, the same input and output path, a missing input file, broken JSON, and six argument errors.
- In 8 cases the old and new script both end with an uncaught `Error` (non-HTML output, same path, or an output that exists without `--force`). The exit code (1), standard output, and error message line are the same. The stack lines that follow name a different file and line, so these cases compare the message line only.

### Installed Dogfood Copy (A15)

Not done. It waits for the owner's Store. With a temporary `MAKE_DOCS_HOME`, `make-docs setup skills --target . --dry-run --yes` selected no Skill, and `--selected-skills backlog-review` planned `skip` for all 15 `backlog-review` files and the `.claude/skills/backlog-review` link, because that Store has no record of them. The phase says not to copy the files by hand. `.agents/skills/backlog-review/scripts/` still holds the old hand-written `render-report.mjs` and `collect-project-lead-context.mjs`. They behave the same as the new files (see the comparison above), but their bytes differ.

### Merge Risk With W29 R0

- The two new bundles read only `project-lead-context.ts` and `report-file.ts`. No bundle reads `snapshot.ts`. An esbuild metafile shows that `report-contract.mjs` reads `schemas.ts`, `live-contracts.ts`, and `presentation.ts`, and `agent-contract.mjs` also reads `catalog.ts` and `cache-key.ts`. So W29 R0 P3's switch of the backlog snapshot to `readTaskLine` does not change any bundle bytes.
- W29 R0 P4 changes the backlog presentation source. If it changes one of the files above, the bundle bytes change. After either merge, run `node packages/cli/scripts/build-backlog-presentation.mjs --all`, then the byte-match test.
- This phase did not touch `skill-registry.json`, `packages/skills/README.md`, or any snapshot code.

### Commands and Results

All commands ran in `packages/cli` or the repository root with a temporary `MAKE_DOCS_HOME`. No run read or wrote the real Store.

- `npx tsc --noEmit -p .` in `packages/cli`: passed.
- `npm run build`: passed.
- `node packages/cli/scripts/build-backlog-presentation.mjs --render --collector`: wrote the two new files. A fresh build of `report-contract.mjs` and `agent-contract.mjs` matched the files before any change.
- `npx vitest run tests/backlog-review-skill-bundles.test.ts tests/backlog-review-skill.test.ts tests/backlog-presentation.test.ts tests/backlog-request-controller.test.ts tests/backlog-snapshot-schema-version.test.ts`: 5 files and 108 tests passed.
- `npm run validate:defaults`: 3 files and 53 tests passed. This includes the consistency test.
- `bash scripts/check-instruction-routers.sh`: passed. It ran outside the sandbox, because the sandbox blocks its `mktemp` folder.
- `make-docs check prd --target-root .`: passed with 0 diagnostics.
- `make-docs project paths validate --target .`: passed, 0 findings.
- Full suite, `npx vitest run --reporter=json`, counted from the JSON: 141 files and 3029 tests: 3020 passed, 3 failed, 6 skipped. The 3 failures are known: `mcp-app-contract` (2, a Node deprecation warning on stderr) and `p5-migration-safety` fixture 11 (sandbox only). The suite ran after `npm ci`, `node scripts/copy-template-to-cli.mjs`, and `npm run build`.

### Limits

- The generated scripts are readable, not minified, so they are larger than before: `render-report.mjs` 2,110 to 3,458 bytes and `collect-project-lead-context.mjs` 6,813 to 7,705 bytes.
- The before and after script lives outside the repository. The method above repeats the run.

## P4 Removal and Guard

Covers A16 to A19 in [P4](04-removal-and-guard.md). Evidence date: 2026-11-23. Base commit: `83ee1f5f` on `docs/w29-w30-work-store-and-factory`. The work is uncommitted.

### What Changed

| Area | Change |
| --- | --- |
| Skill source | Deleted the seven Python files and the tracked `decompose-codebase/scripts/__pycache__/validate_output.cpython-314.pyc`. Only `backlog-review/scripts/` remains, with its four generated bundles. |
| Registry | `packages/cli/skill-registry.json` drops the four `.py` entries: `archive-docs/scripts/trace_relationships.py`, `cleanup-docs/scripts/check_markdown_style.py`, `decompose-codebase/scripts/probe_environment.py`, and `decompose-codebase/scripts/validate_output.py`. The three test files were never registered. |
| Closeout code | `packages/cli/src/operations/closeout/index.ts` drops the three `python3` hints, two of which named the `closeout-commit` and `closeout-phase` Skills that D-020 deleted, and the `test_validate_output.py` case in `classifyPath`. `classifyPath` keeps the `_test.py` name rule, because a project may hold Python tests; it runs no Python. A change under `packages/skills/` or to `packages/cli/skill-registry.json` gives `npm test -w packages/cli -- w34-r0-p4-skill-scripts-guard w34-r0-p1-ported-skill-checks w34-r0-p2-skill-check-twins backlog-review-skill-bundles w34-r0-p4-removed-skill-scripts`, but only in the Make Docs repository: the closeout workspace check must pass and `packages/cli/package.json` must name `@brucewaynedecoy/make-docs`. Another project gets no W34 hint. |
| `setup skills` output | New (PRD 08 R-SKILL-SETUP-8): `make-docs setup skills` names each changed file that it keeps, with the plain reason "You changed this file, so Make Docs kept it. Review it, then delete it or keep it." An applied run prints "Changed files kept for your review:" after its result. A dry run prints "Changed files that setup would keep for your review:" after its plan. When an applied run stages a conflict copy of a file's new bytes, the file appears only under "Conflicts were staged for manual review:". The plan line for a kept file still says `skip`, as `cli.test.ts` requires. |
| Source comments | The three P1 operation files name the retired script by Skill and kind, not by file name (A19). |
| Tests | `skill-registry.test.ts`, `skill-catalog.test.ts`, `install.test.ts`, and `operations.test.ts` now expect no Python. Two new files: `w34-r0-p4-removed-skill-scripts.test.ts` and `w34-r0-p4-skill-scripts-guard.test.ts`. |
| Smoke pack | `scripts/smoke-pack.mjs` refuses a packed registry with a `.py` or `.pyc` entry, adds the four installed `.agents/skills/.../*.py` paths to `LEGACY_SKILL_PATHS`, and refuses any `.py`, `.pyc`, or `__pycache__` under the installed `.agents/skills/` and `.claude/skills/`. |
| Docs | `packages/skills/README.md` step 3 and Validation now give the CLI-operation and generated-bundle rule (T6). The user guide [Installing and Managing Skills](../../assets/user/skills-installing-and-managing-skills.md) has a troubleshooting entry for the removal. One sentence in the project note [migrated-operations-inventory.md](../../assets/project/migrated-operations-inventory.md) now says that W34 R0 P4 removed the two Skill scripts. |

### Managed Removal (A17)

`packages/cli/tests/w34-r0-p4-removed-skill-scripts.test.ts` (23 tests) runs with the temporary `MAKE_DOCS_HOME` from `tests/setup.ts`. Each case installs the three Skills into a temporary project, then turns it into an older install: it writes each removed script where an older release put it and records it in the Store manifest with the hash that the older release wrote. For each of the four files:

- `make-docs setup` (existing install): the plan has `remove-managed` for an unchanged copy and `skip-conflict` with the reason "Existing managed file differs from the recorded manifest and will not be removed automatically." for a changed copy. Both are in `skillChangesLeftForSkillsSetup`, so setup shows them and routes them to `make-docs setup skills` (PRD 08 R-SKILL-SETUP-6).
- `make-docs setup skills --yes` (the real `runSkillsCommand`): an unchanged copy shows as `- remove: Skill files: <path>`, is deleted, and leaves the Store manifest. A changed copy shows as `- skip: Skill files: <path>` and under "Changed files kept for your review:" with the plain reason. Its bytes stay the same, and it stays in the manifest. The other three unchanged files are removed in the same run.

Three more cases:

- An old script with no Store record (a copy that Make Docs never recorded) is not in the `setup` plan or the `setup skills` output, and it stays as it was. The planner reads only the Store's Skill file list, so it never removes a file that it did not record.
- `make-docs setup skills --remove` removes the three unchanged old scripts with the current Skill files, and keeps and lists the changed one with its reason.
- A Claude-only project install puts the Skill payload in `.claude/skills/` with no `.agents/skills/`. There, `setup skills` removes the unchanged old scripts and keeps and lists the changed one.

Three cases for R-SKILL-SETUP-8:

- The kept list gives the plain reason and never the planner's internal reason ("... recorded manifest ...").
- A dry run prints "Changed files that setup would keep for your review:" with the changed file, never the applied heading, and changes no file and no Store record.
- A changed current `cleanup-docs/SKILL.md` gets a staged conflict copy under `.make-docs/conflicts/<run>/`. It appears under "Conflicts were staged for manual review:" and not in the kept list, which still names a changed old script.

Mutation check: when `planStaleSkillFile` treats every recorded file as unchanged, the four `setup skills` changed-copy cases fail. The planner was restored. `setup` plans these files with the planner's general managed-file rule, because the recorded entries have no Skill exposure. `setup skills` uses `planStaleSkillFile`.

`make-docs update` updates only the CLI itself and changes no project file, so the phase's "`make-docs update`" means the project update that follows it: `make-docs setup`, then `make-docs setup skills`.

### Guard Test (A18)

`packages/cli/tests/w34-r0-p4-skill-scripts-guard.test.ts` (11 tests) walks `packages/skills/` and the Skill registry. It reports a `.py` file (`python-file`), a `.pyc` file (`python-bytecode`), a `__pycache__` folder (`pycache-folder`), a registry `.py` or `.pyc` entry (`registry-python-entry`), and a file in a Skill `scripts/` folder with no generator (`not-generated`). For `backlog-review/scripts/` it calls the P3 `checkPortableBacklogSkillScripts()`, pointed at the tree under test, which reports `bytes-differ`, `missing`, and `not-generated`. Hidden files such as `.DS_Store` are ignored, as in P3. `.agents/skills/` is out of scope: it is installed dogfood output, and P3 T7 and A15 keep its older scripts until the owner refreshes it after the release.

Each planted case runs on a temporary copy of `packages/skills/`, and a clean copy passes first. Planted cases and their exact findings:

| Planted case | Finding |
| --- | --- |
| `decompose-codebase/references/helper.py` | `python-file` |
| `cleanup-docs/scripts/check.py` | `python-file` and `not-generated` |
| `archive-docs/references/trace.cpython-314.pyc` | `python-bytecode` |
| empty `preflight/__pycache__/` | `pycache-folder` |
| registry entry `archive-docs/scripts/trace_relationships.py` | `registry-python-entry` (source and install path) |
| `decompose-codebase/scripts/check-output.mjs` | `not-generated` |
| `backlog-review/scripts/helper.mjs` | `not-generated` |
| one appended line in `backlog-review/scripts/render-report.mjs` | `bytes-differ` |

A live break also fails it: with `check_markdown_style.py` put back into the real `packages/skills/cleanup-docs/scripts/`, all 11 tests failed, because each case reads the real tree or a copy of it. The file was removed again.

### Search (A19)

`git grep -E 'python3|trace_relationships|check_markdown_style|probe_environment|validate_output|closeout-commit/scripts|closeout-phase/scripts' -- packages ':!packages/cli/tests'` finds nothing. In `packages/cli/tests/`, the names stay only in tests that check the removal (`install.test.ts`, `skill-catalog.test.ts`, `operations.test.ts`, `w34-r0-p2-skill-check-twins.test.ts`, and the two new files) and in `w34-r0-p1-ported-skill-checks.test.ts`, whose `describe` names trace each ported case to its source test. The built `dist/virtual_make-docs-first-party-skills-*.js` holds no `.py"` path.

### Owner Decision (Finding 1)

On 2026-11-23 an independent review raised finding 1: the new "Changed files kept for your review:" list in `packages/cli/src/skills-command.ts` was new behavior with no PRD line. The owner chose option A: keep the list, and:

- PRD 08 gains R-SKILL-SETUP-8 with a Requirement History entry, and the code comment cites it.
- The reason uses plain words: "You changed this file, so Make Docs kept it. Review it, then delete it or keep it."
- Each file appears in only one list. A file with a staged conflict copy is listed only under "Conflicts were staged for manual review:".
- A dry run says what would happen: "Changed files that setup would keep for your review:".

All four points are done and tested (see Managed Removal above). The same review's low findings 2 to 7 are also fixed: the `_test.py` name rule is back in `classifyPath`; the W34 closeout hint appears only in the Make Docs repository; the removal test covers an unrecorded copy, `setup skills --remove`, and a Claude-only install; the smoke pack checks `.claude/skills/`; one sentence in `docs/assets/project/migrated-operations-inventory.md` names the removal; and the T3 task line notes the `setup` then `setup skills` path.

### Commands and Results

All commands ran in `packages/cli` or the repository root with a temporary `MAKE_DOCS_HOME`. No run read or wrote the real Store.

- `npx tsc --noEmit -p .` in `packages/cli`: passed.
- `npm run build`: passed.
- `npx vitest run` on the guard, managed-removal, Skill registry, embedded, install, Skill catalog, operations (closeout), consistency, the three W34 P1 and P2 files, the bundle, `skills-ui`, `w19-r5-skills-command`, `w33-r0-shipped-text-names`, and `audit` test files: 16 files and 353 tests passed.
- `npx vitest run` on `uninstall`, `self-management`, `p8-retirement-migration`, and `skills-adoption-cli`: 4 files and 57 tests passed.
- `npm run validate:defaults`: 3 files and 53 tests passed.
- `bash scripts/check-instruction-routers.sh`: passed, outside the sandbox, because the sandbox blocks its `mktemp` folder.
- `make-docs project paths validate --target .`: valid, 0 failing findings.
- `make-docs check prd --target-root .`: 0 diagnostics.
- `npm run smoke:pack:local`, outside the sandbox for the npm registry: passed (A16). It ran the new packed-registry and installed-tree Python checks with all eight Skills installed.
- Full suite, `npx vitest run --reporter=json`, counted from the JSON: 145 files and 3163 tests: 3154 passed, 3 failed, 6 skipped. The 3 failures are known: `mcp-app-contract` (2, a Node deprecation warning on stderr) and `p5-migration-safety` fixture 11 (sandbox only). This run was before the review fixes.
- After the independent review fixes: `npx tsc --noEmit -p .` and `npm run build` passed. The focused files above, plus `uninstall`, `self-management`, `p8-retirement-migration`, `skills-adoption-cli`, and `cli`: 21 files and 560 tests passed. `npm run validate:defaults`: 3 files and 53 tests passed. The smoke pack change (`.claude/skills/` check) passed `node --check`; the smoke pack was not run again.
- After the owner decision on finding 1: `npx tsc --noEmit -p .` and `npm run build` passed. The same 21 focused files: 563 tests passed, including all 23 managed-removal tests and `w19-r5-skills-command`. `npm run validate:defaults`: 53 passed. `make-docs check prd --target-root .`: 0 diagnostics. `make-docs project paths validate --target .`: valid, 0 failing findings. `bash scripts/check-instruction-routers.sh`: passed, outside the sandbox. `make-docs project markdown validate` on PRD 08, the user guide, and the P4 phase file: no findings. Full suite, `npx vitest run --reporter=json`, counted from the JSON: 145 files and 3170 tests: 3161 passed, 3 failed, 6 skipped. The 3 failures are the known `mcp-app-contract` (2) and `p5-migration-safety` fixture 11.

### Limits

- The kept list is new output. The owner chose option A on 2026-11-23 (see Owner Decision below). The plan line for a kept file still says `skip`, because `cli.test.ts` requires plan lines without parentheses or `skip-conflict`. Full `make-docs setup` shows the file in its plan and routes it to `setup skills`; it does not print the list. A dry run lists a file even when the applied run would stage a conflict copy for it, because a dry run prints no staged list.
- The removal tests build the older install by writing the old files and their Store records, not by running an older released CLI. The bytes are a stand-in; the planner compares only hashes.
- `.agents/skills/` in this repository is outside the guard. It holds no Python, but its `backlog-review/scripts/` still has the two older hand-written scripts until P3 T7 and A15 close after the release.
- `w34-r0-p1-ported-skill-checks.test.ts` keeps the removed test file names in its `describe` names, so each ported case traces to its source.

## P5 Acceptance

Covers A20 to A22 in [P5](05-acceptance.md). Not started.

### P3 Integration

- Review result: ready to commit, with three small fixes made at integration.
  - The two new bundles name their entry as `generated-entry:render-report` and `generated-entry:collect-project-lead-context`, so the source comment no longer looks like a real file path.
  - `checkPortableBacklogSkillScripts` and the bundle test ignore hidden files such as `.DS_Store` in the Skill `scripts/` folder.
  - `.gitattributes` pins `packages/skills/backlog-review/scripts/*.mjs` to LF, so a Windows checkout keeps the bytes that the byte-match test expects.
- Open: T7 and A15, the installed copy under `.agents/skills/backlog-review/`. It still has the two older hand-written scripts, which behave the same as the generated ones (124 builder cases and 30 reviewer cases matched). Running `setup skills` now would either install the released 2.0.9 Skill or move the maintainer Store to the unreleased schema v8, so the owner decides how and when it is refreshed.
- Follow-up: `esbuild` is held only by the lockfile (through `tsup` and `tsx`). A new patch version can change bundle bytes until someone rebuilds with `node packages/cli/scripts/build-backlog-presentation.mjs --all`.

### P2 Integration

- Review result: needs one medium fix, made at integration with five low fixes.
  - `cleanup-docs` now says that a planned MCP repair needs `allowWrite: true` without `apply`, and that a write adds `apply: true`. The registry refuses a write operation without `allowWrite: true`, even for a preview.
  - `archive-docs` no longer names vendor delegation tools. `decompose-codebase` no longer gives `rg` as an example. The `archive-docs` workflow says to read only configured Persona guide folders and never a reserved folder such as `project`.
  - The twin test's no-server guard now covers all three Skills and also refuses `spawn_agent`.
  - The guides note above now names the planned-restructure note under `docs/assets/project/`.
- Accepted as is: `decompose-codebase/references/harness-capability-matrix.md` names harnesses in its rows. It sets no default, so it stays.

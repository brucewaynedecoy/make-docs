---
title: "W34 R0 Skill Scripts Into the CLI Plan"
kind: "plan"
status: "draft"
coordinate: "W34 R0"
follow_on:
  route: "prd-generation"
  next_prompt: "make-docs://system/prompt/plan-to-prd-change.prompt.md"
  why: "The plan should become the product contract before the work backlog is written."
  coordinate_handoff: "Carry W34 R0 into the requirement-history entries and docs/work/2026-11-23-w34-r0-skill-scripts-into-the-cli/."
source:
  type: "design"
  path: "docs/designs/2026-11-23-skill-scripts-into-the-cli.md"
---

# W34 R0 Skill Scripts Into the CLI Plan

## Purpose

Plan the [skill scripts into the CLI design](../../designs/2026-11-23-skill-scripts-into-the-cli.md). The logic of three Python Skill scripts moves into four CLI operations. `probe_environment.py` is removed. The two hand-written backlog-review `.mjs` scripts move into CLI source and ship as generated bundles. After the Wave, no first-party Skill ships Python, and a guard test keeps it that way. The Wave closes register [D-064](../../prd/03-open-questions-and-risk-register.md) and the helper-script part of R-008.

This plan, its PRD changes, and its work backlog are review material. They do not authorize CLI, MCP, Skill, registry, installation, commit, push, or release changes. Implementation needs separate owner authority. The Wave must not touch W22 R2 files, branches, or worktrees, or the real Store.

## Objective

Completion requires:

- four registry operations with CLI and MCP parity: `make-docs check decomposition` (`check_decomposition`), `make-docs project relations list` (`project_relations_list`), `make-docs project markdown validate` (`project_markdown_validate`), and `make-docs project markdown repair` (`project_markdown_repair`);
- vitest tests that run every case from the three Python test files, and one recorded side-by-side run of each old script and its new operation on the same fixtures;
- one rule list for each operation and its agent form, with the same rule IDs on both sides, and a test that fails when an ID exists on one side only;
- the `decompose-codebase`, `archive-docs`, and `cleanup-docs` Skill text in the order MCP tool, then CLI command, then agent form, with no script path;
- `render-report.mjs` and `collect-project-lead-context.mjs` built from CLI source, and a test that each backlog-review script matches a fresh build byte for byte;
- no `.py` file, `.pyc` file, or `__pycache__` folder under `packages/skills/`, no `.py` entry in `packages/cli/skill-registry.json`, and a guard test for both;
- managed removal of unchanged installed Python copies on update, with a changed copy kept as a conflict;
- no `python3` command in the closeout code;
- PRDs 03, 08, 25, 39, and 51 describing the result.

## Human Experience Propagation

The source design has `direct` impact. Authority: [Human Experience Contract](../../../.make-docs/system/contracts/human-experience-contract.md).

| Promise | Owning PRD | Human-facing surface or indirect effect | Work phase | Evidence source or selected testing type | Accepted obligation, if any |
| --- | --- | --- | --- | --- | --- |
| Each check is one Make Docs command and one MCP tool with a name from the W33 rules. | [PRD 39](../../prd/39-cli-command-model-and-operation-registry.md), [PRD 25](../../prd/25-typescript-runtime-cli-mcp-operation-boundaries.md) | The four commands, their help, and `tools/list` | [P1](01-cli-operations-and-ported-tests.md) | Name catalog test, CLI and MCP parity tests | None |
| A check gives the same findings through the CLI and MCP, in plain words first, with a JSON form for agents. | PRD 39, PRD 25 | Plain and `--json` output, MCP results | [P1](01-cli-operations-and-ported-tests.md), [P5](05-acceptance.md) | Parity tests, Guided Progress Review of plain output | None |
| Without the CLI, the Skill tells the agent how to do the same check by hand, and the agent says that the result is a manual review. | PRD 25, [PRD 08](../../prd/08-skills-catalog-and-distribution.md) | `SKILL.md` and references of the three Skills | [P2](02-skill-text-and-guides.md) | Twin rule ID test, Human Experience Review of the Skill text | None |
| An update removes the old Python files from an installed Skill when Make Docs wrote them, and keeps any file that a person changed. | PRD 08, PRD 25 | `make-docs update` and `make-docs setup skills` plans and results | [P4](04-removal-and-guard.md) | Managed-removal tests for each removed file | None |
| A rule change in the CLI fails a test until the Skill text changes with it, and the other way around. | PRD 25 | Maintainer test results | [P2](02-skill-text-and-guides.md) | Twin rule ID test with a broken fixture | None |

## Performance Evidence Plan

| Candidate | Base maintenance action | Performance applicability | Target class | Canonical `PERF-###` or next record | Finite budget and stop reference | Lifecycle point |
| --- | --- | --- | --- | --- | --- | --- |
| None | `none` | `not-needed` | None | None | None | None |

The checks read local Markdown files, as the scripts do now.

## Coordinate Decision

- Coordinate: `W34 R0`
- Classification: `new-wave`
- Evidence: Explicit owner guidance on 2026-11-23 (design OD-3 option A). The outcome test agrees. W16 R3 named these conversions only as optional ("may include"), and its closeout kept the scripts installed, so no Wave promised the outcome. The four operations are new capabilities. The highest Wave in `docs/plans/`, `docs/work/`, and their archives is W33. This plan does not amend a committed plan, so it needs no Change History entry.

## Maintenance Inputs

| Input | Format | Location | Confidence |
| --- | --- | --- | --- |
| Skill scripts design | Markdown | [2026-11-23-skill-scripts-into-the-cli.md](../../designs/2026-11-23-skill-scripts-into-the-cli.md) | High. Owner chose OD-1, OD-2, and OD-3 option A on 2026-11-23. |
| Register entries | Markdown | [D-064 and R-008](../../prd/03-open-questions-and-risk-register.md) | High. D-064 is open, high priority. |
| Python scripts and tests | Python | `packages/skills/decompose-codebase/scripts/`, `packages/skills/archive-docs/scripts/`, `packages/skills/cleanup-docs/scripts/` | High. 46, 1, and 11 test methods at `93814f27`. |
| Backlog-review scripts | JavaScript | `packages/skills/backlog-review/scripts/`, `packages/cli/scripts/build-backlog-presentation.mjs` | High. |
| Name catalog | TypeScript | `packages/cli/src/operations/name-catalog.ts` | High. |
| Twins guide | Markdown | [developing-deterministic-agentic-twins.md](../../assets/project/developing-deterministic-agentic-twins.md) | High. |
| Prior no-scripts design | Markdown | [2026-06-20 design](../../designs/2026-06-20-no-scripts-migration-and-skill-refactor.md) | High. Departs on environment probing (OD-2). |

## Facts Found While Planning

These facts are not in the design. The plan uses them.

- This repository has an installed copy of `backlog-review` at `.agents/skills/backlog-review/`, with `.claude/skills/backlog-review` as a link to it. Its `scripts/` files match the source today. Under OD-1, P3 changes two of those files, so this dogfood copy changes. The design's "no dogfood copy changes" holds only for the three Python Skills.
- The `decompose-codebase` references `mcp-playbook.md`, `planning-workflow.md`, and `execution-workflow.md` name two fixed MCP servers. The design says that the Skill text names no MCP server. Owner decision PD-1 asks how far P2 goes.
- The name catalog test reads PRD 39 R-RUN-1 and PRD 25 R-MCP-PROFILE lines. A PRD line that names a command or tool before the catalog holds it fails the test. So the PRD edits that name the four commands land with or after P1 T1, which adds the catalog entries.
- `compareRRun1` in `name-catalog.ts` accepts planned paths only in the `work` and `factory` groups. A planned `check decomposition` in R-RUN-1 fails it. The PRD pass lists `decomposition` as active in R-RUN-1 only when P1 makes it current.
- The `platform-safety` workflow runs the full vitest suite of `packages/cli`. The guard test runs there with no workflow change.

## New In This Plan

These parts are not in the design or in current docs. The owner should know they are new:

- MCP profile membership. The plan follows the path hygiene tools: `project_markdown_validate` in `setup`, `quality`, and `all`; `project_markdown_repair` in `setup` and `all`; `check_decomposition` in `quality` and `all`, as `check_prd` is; `project_relations_list` in `workflow` and `all`, because it gives project-state context.
- PRD 39 command sections and registry tables for the four commands, and name catalog test checks that compare those tables with the catalog, as the R-DOCTOR and R-STORE-CMD tables are checked.
- New requirement IDs: PRD 25 R-MCP-PROFILE-11 and R-SKILL-RUNTIME-7, and PRD 08 R-SKILL-BUNDLE-7.
- Rule ID form for the twins. P1 names each rule from the Python rule names, with one prefix for each operation, such as `decomposition.task-id`. P1 records the final list.
- The guard also fails for a hand-written file in any Skill `scripts/` folder, not only Python. This is the design's OD-1 rule as a test.
- Phases grouped by layer, not one change set for each Skill. See the Phase Map.

## Product Authority Decision

| Candidate | Decision | Owner | Reason |
| --- | --- | --- | --- |
| The four commands, their inputs, permissions, and groups; `check` and `project` group contents | `update-existing` | [PRD 39](../../prd/39-cli-command-model-and-operation-registry.md) | PRD 39 owns R-TOP-1, R-RUN-1, the command tables, and the name catalog. |
| MCP profile membership of the four tools | `update-existing` | [PRD 25](../../prd/25-typescript-runtime-cli-mcp-operation-boundaries.md) | PRD 25 owns R-MCP-PROFILE. |
| The Skill check twins: shared rule IDs, the MCP, CLI, agent-form order, and the manual-review label | `update-existing` | PRD 25 | PRD 25 owns the no-scripts rule, R-SKILL-RUNTIME, and the twin pattern. |
| No Python in first-party Skills; `scripts/` holds only generated bundles that match a fresh build; managed removal of the old files | `update-existing` | [PRD 08](../../prd/08-skills-catalog-and-distribution.md) | PRD 08 owns Skill contents and delivery. |
| The project-lead collector and render wrapper as generated bundles of CLI source | `update-existing` | [PRD 51](../../prd/51-backlog-review-and-reporting.md) | PRD 51 R-BACKLOG-SKILL-21 owns the collector. |
| D-064 status and the helper-script part of R-008 | `update-existing` | [Risk register](../../prd/03-open-questions-and-risk-register.md) | The register holds both items. |
| Template resources | `none` | None | No file in `packages/docs/template/` names these scripts. The agent forms stay in the Skills. |
| Glossary | `none` | None | No new shared term. "Agent form" and "twin" are already used in PRD 25 without a glossary entry. |
| A new product PRD | `none` | None | PRDs 08, 25, 39, and 51 own every part. |

## Existing PRDs To Update

| Existing PRD | Owning sections | Current normative update | Preserved surrounding authority |
| --- | --- | --- | --- |
| [PRD 39](../../prd/39-cli-command-model-and-operation-registry.md) | R-TOP-1; R-RUN-1; new command sections with registry tables | `project` also owns Markdown style and document relations. `check` also owns decomposition output. R-RUN-1 lists `decomposition` as an active `check` command. New sections define `check decomposition` (read only), `project relations list` (read only, `--path`, Persona folders), and `project markdown validate` and `repair` (repair needs project write permission and has `--dry-run`), each with a registry table. | Naming rules, alias window, other groups, and other command sections. |
| [PRD 25](../../prd/25-typescript-runtime-cli-mcp-operation-boundaries.md) | New R-MCP-PROFILE-11; new R-SKILL-RUNTIME-7; `Domain and Script Classification` | Profile membership for the four tools. Skill checks use MCP, then CLI, then the agent form; a manual result says so and uses `agent-reviewed`. Each Skill check twin shares one rule ID list, and a test fails on a one-sided ID. | The performance twin, the operation-first sequence, and other profiles. |
| [PRD 08](../../prd/08-skills-catalog-and-distribution.md) | New R-SKILL-BUNDLE-7; `Validation Boundary`; the selected-Skills script line | No first-party Skill ships a `.py` file. A Skill `scripts/` file must be a generated bundle of CLI source whose bytes match a fresh build. The registry declares no `.py` file. Validation proves the packed CLI embeds no `.py` file and an update removes unchanged old copies. | The nine-Skill catalog, selection, trust, and delivery rules. |
| [PRD 51](../../prd/51-backlog-review-and-reporting.md) | R-BACKLOG-SKILL-21 | The collector's logic lives in CLI source and ships as a generated bundle. | Every other backlog review requirement. |
| [Risk register](../../prd/03-open-questions-and-risk-register.md) | D-064; R-008 | D-064 points to this plan, then closes at P5. R-008 records that the helper-script part is closed. | Other entries. |

## Genuinely New Product PRDs

None. The four operations are commands and tools under existing owners.

## Requirement History Entries

| Owning PRD | Date / coordinate | Affected requirement or section | Previous contract | Replacement contract | Rationale | Source |
| --- | --- | --- | --- | --- | --- | --- |
| PRD 39 | 2026-11-23 / W34 R0 | R-TOP-1, R-RUN-1, new command sections | `project` and `check` had no Markdown style, relations, or decomposition commands. | Four new commands in `project` and `check`. | Skill script logic moves into the CLI. | [Design](../../designs/2026-11-23-skill-scripts-into-the-cli.md) |
| PRD 25 | 2026-11-23 / W34 R0 | R-MCP-PROFILE-11, R-SKILL-RUNTIME-7, `Domain and Script Classification` | Skills could ship helper scripts beside the CLI. | Skill checks are twins of CLI operations with shared rule IDs. | One home for the logic. | Same |
| PRD 08 | 2026-11-23 / W34 R0 | R-SKILL-BUNDLE-7, `Validation Boundary` | Skills shipped `.py` helpers. | No Python. `scripts/` holds only byte-matched generated bundles. | Owner rule of 2026-11-22. | Same |
| PRD 51 | 2026-11-23 / W34 R0 | R-BACKLOG-SKILL-21 | A hand-written Skill script held the collector. | CLI source holds it; the Skill ships a generated bundle. | OD-1 option A. | Same |

## Affected Links, Risks, Plans, And Work

| Surface | Artifact | Required maintenance | Authority role |
| --- | --- | --- | --- |
| Links and index | [PRD index](../../prd/00-index.md) | None. No new PRD. | Navigation only |
| Risks and decisions | `docs/prd/03-open-questions-and-risk-register.md` | D-064 and R-008 as above. | Living register |
| Plans | This plan; the [W29 R0 plan](../2026-11-21-w29-r0-work-store/00-overview.md) | None in W29. Merge risks below. | Sequencing |
| Work | `docs/work/2026-11-23-w34-r0-skill-scripts-into-the-cli/` | New backlog with `00-index.md`, five phase files, and `evidence.md`. W29 to W33 Wave Sequence sections name this Wave. | Implementation queue |
| History | `.make-docs/archive/history/` | One record for each phase at closeout. | Provenance |

## Phase Map

| File | Purpose |
| --- | --- |
| [01-cli-operations-and-ported-tests.md](01-cli-operations-and-ported-tests.md) | Add the four operations, their catalog entries, CLI and MCP parity, and the ported tests. |
| [02-skill-text-and-guides.md](02-skill-text-and-guides.md) | Move the three Skills to the MCP, CLI, agent-form order with shared rule IDs. |
| [03-backlog-review-bundles.md](03-backlog-review-bundles.md) | Build the two hand-written backlog-review scripts from CLI source, with a byte-match test. |
| [04-removal-and-guard.md](04-removal-and-guard.md) | Remove the Python files from the registry, the closeout code, and Git, and add the guard test. |
| [05-acceptance.md](05-acceptance.md) | Prove the Wave and close D-064. |

The design asks for one change set for each Skill. This plan groups the work by layer instead, so the Skill text and the removal follow the PRD 25 operation-first order across all three Skills. P1 still adds one Skill's operation in each task, and each task can land as its own commit.

## Dependencies

- The PRD pass comes first. Its R-RUN-1 and R-MCP-PROFILE-11 edits land with or after P1 T1.
- P1 has no code dependency.
- P2 depends on P1.
- P3 depends only on the PRD pass. It can run beside P1 and P2.
- P4 depends on P2 and P3.
- P5 depends on P4.

## Wave Order

W34 R0 does not depend on W29 R0 or W30 R0, and they do not depend on it. W34 touches Skills and new `check` and `project` operations. It does not touch the Store schema. It can run beside W29 R0. The D-064 hold stays until P5: no new Python file and no new logic in these scripts.

Files that W34 and W29 R0 both touch are merge risks:

| File or surface | W29 R0 change | W34 R0 change | Risk and handling |
| --- | --- | --- | --- |
| `packages/cli/src/operations/name-catalog.ts` and its test | P4 turns the planned `work` entries current. | P1 adds four entries and `W34 R0` to the planner list. | Text conflict near the same lines. The second branch rebases and reruns the name catalog test. |
| PRD 39 R-TOP-1 and R-RUN-1 | P4 moves the `work` commands from planned to active. | Adds `decomposition` to the active `check` list and new `project` contents. | Each requirement is one long line, so both edits conflict on the same line. Merge by hand. |
| PRD 25 R-MCP-PROFILE and Requirement History | Edits R-MCP-PROFILE-8. | Adds R-MCP-PROFILE-11 and R-SKILL-RUNTIME-7. | History entries append at the same place. Merge by hand. |
| `packages/cli/src/operations/registry.ts`, MCP tool lists, and profile count tests | P4 adds the `work` operations. | P1 adds four operations. | Both change lists and counts. Rebase and rerun the parity tests. |
| Work phase parser in `packages/cli/src/operations/work/` | P3 builds a round-trip parser for work files. | `check decomposition` reuses the task line and task ID reader. | A meaning risk, not only a text risk. `check decomposition` calls the shared reader through its public function. If W29 P3 lands first, P1 uses the W29 reader. |
| Backlog presentation source under `packages/cli/src/operations/work/backlog/` | P4 makes the snapshot read the work store. | P3 adds generated bundles and a byte-match test. | A source change on either side changes the bundle bytes. After each merge, run the bundle build and the byte-match test. |
| PRD 51 and the register | Edits the snapshot source and adds entries. | Edits R-BACKLOG-SKILL-21 and D-064. | History and register appends. Merge by hand. |

W30 R0 also changes `packages/cli/skill-registry.json` and `packages/skills/README.md` for the factory Skills. P4 changes both. Treat them the same way.

Recommended order: start W34 P1 and P3 now. Merge whichever of W34 P1 and W29 P4 is ready first. The other one rebases.

## Output Contract

- Design: `docs/designs/2026-11-23-skill-scripts-into-the-cli.md`.
- Plan: this directory with `00-overview.md` and five phase files.
- New product authority: none.
- Updated owners: PRDs 03, 08, 25, 39, and 51.
- Work backlog: `docs/work/2026-11-23-w34-r0-skill-scripts-into-the-cli/` with `00-index.md`, five phase files, and `evidence.md`.
- Wave Sequence sections in the W29 to W33 backlogs name this Wave.
- No implementation source, Skill, template, registry, installation, staging, commit, push, or release change is part of this plan-writing pass.

## Worker Ownership

Use disjoint write scopes when implementation is authorized.

| Worker role | Responsibility | Primary write scope | Dependencies | Deliverable |
| --- | --- | --- | --- | --- |
| Operation owner | Four operations, catalog entries, parity, ported tests, side-by-side evidence | New operation modules under `packages/cli/src/operations/`, `registry.ts`, `name-catalog.ts`, their tests | PRD pass | P1 operations |
| Skill text owner | Skill text, rule IDs, twin test, guides | `packages/skills/decompose-codebase/`, `packages/skills/archive-docs/`, `packages/skills/cleanup-docs/` (not `scripts/`), `docs/assets/maintainer/`, `docs/assets/user/`, twin test | P1 | P2 text |
| Bundle owner | Backlog-review bundles and byte-match test | `packages/cli/scripts/build-backlog-presentation.mjs`, new source under `packages/cli/src/operations/work/backlog/`, `packages/skills/backlog-review/scripts/`, tests | PRD pass | P3 bundles |
| Removal owner | Registry, package, managed removal, closeout code, deletion, guard | `packages/cli/skill-registry.json`, `scripts/smoke-pack.mjs`, `packages/cli/src/operations/closeout/index.ts`, `packages/skills/*/scripts/*.py`, `packages/skills/README.md`, guard and install tests | P2, P3 | P4 removal |
| Validation owner | Acceptance evidence, Human Experience Review, register | Evidence file, PRD 03, bounded fixes returned to owners | P4 | P5 evidence |

## MCP Strategy

Use jdocmunch for project documents and jcodemunch for code during implementation. Reindex before falling back to direct reads. The registry stays the single source: CLI paths and MCP names come from it and from the name catalog.

## Validation

- Validate design, plan, PRD, work, path, link, and metadata contracts, and run `make-docs check prd` before the work backlog is used.
- Prove each new name passes R-NAME-1 to R-NAME-4 and fits 26 characters: `check_decomposition` (19), `project_relations_list` (22), `project_markdown_validate` (25), `project_markdown_repair` (23).
- Prove CLI and MCP parity for the four operations, in plain and JSON output.
- Prove every Python test case passes as a vitest case, and record the side-by-side run with each difference listed.
- Prove the twin rule ID test passes and fails on a one-sided fixture.
- Prove each backlog-review script matches a fresh build byte for byte.
- Prove the guard test passes and fails on a planted `.py` file, `__pycache__` folder, registry `.py` entry, and hand-written `scripts/` file.
- Prove an update removes each unchanged installed Python file and keeps a changed one.
- Prove `npm run smoke:pack` passes and the packed CLI embeds no `.py` file.
- Prove no shipped text names a removed script, apart from history sections.
- Run the full test suite and record known failures.
- Complete a Human Experience Review for each promise above.

Testing decisions for each phase:

| Phase | Automated Implementation Testing | Performance Testing | Guided Progress Review | Unassisted Goal Testing |
| --- | --- | --- | --- | --- |
| P1 | Required | `not-needed` | Selected: the plain output of the four commands on one fixture each | `not-needed-now` |
| P2 | Required | `not-needed` | `not-needed-now` | `not-needed-now` |
| P3 | Required | `not-needed` | `not-needed-now` | `not-needed-now` |
| P4 | Required | `not-needed` | `not-needed-now` | `not-needed-now` |
| P5 | Required | `not-needed` | Selected: the Human Experience Review result | `not-needed-now` |

Unassisted Goal Testing is `not-needed-now`. The new commands follow the existing W33 grammar, and agents reach them through Skill text. No current decision needs proof that a person finds them unaided. Human Experience Review covers the Skill text and output.

## Owner Decisions

**PD-1: How far does P2 go with MCP server names in the `decompose-codebase` references?**

The owner chose option A on 2026-11-23: describe the tools by capability and remove the server names.

The design says that the Skill text names no MCP server. Today `mcp-playbook.md`, `planning-workflow.md`, and `execution-workflow.md` name two fixed MCP servers as the preferred path.

- A (recommended): describe the tools by capability, such as "a document index tool" and "a code index tool", and remove the server names. This matches the design and PRD 08 R-SKILL-BUNDLE-6, which keeps the factory Skills tool-agnostic.
- B: keep the server names in the references. Remove only the probe script and its recommended-server output.

Why A: a Skill that names one vendor's servers is not tool-agnostic. The probe removal already changes these files, so the extra edit is small.

## Intended Follow-On

This handoff is advisory-default-but-overridable.

- Route: `prd-generation`
- Next step: Update PRDs 03, 08, 25, 39, and 51 from this plan. Land the R-RUN-1 and R-MCP-PROFILE-11 edits with or after P1 T1. Then write the work backlog.
- Why: The plan should become the product contract before the work backlog is written.
- Coordinate Handoff: Carry W34 R0 into the requirement-history entries and docs/work/2026-11-23-w34-r0-skill-scripts-into-the-cli/.

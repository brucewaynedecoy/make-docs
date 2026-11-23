---
title: "Skill Scripts Into the CLI"
kind: "design"
status: "draft"
coordinate: "W34 R0"
follow_on:
  route: "change-plan"
  next_prompt: "make-docs://system/prompt/designs-to-plan-change.prompt.md"
  why: "PRD 25 owns the no-scripts rule and the twin pattern, PRD 39 owns the command tree and the name catalog, and PRD 08 owns the Skill contents. This design adds four CLI operations, removes every Python file from the first-party Skills, and changes the Skill text, the registry, and the tests together."
  coordinate_handoff: "Recommended W34 R0 as new work. It closes register D-064. W16 R3 named these conversions only as optional and its closeout left them out, so no Wave promised them. The owner chose W34 R0 on 2026-11-23 (OD-3). The planner checks the choice under the wave-model decision procedure."
---

# Skill Scripts Into the CLI

## Purpose

Move the logic of the first-party Skill scripts into the Make Docs CLI. Each check becomes one typed operation that the CLI and the MCP server share. The Skill text keeps the agent form of each check, so an agent without the CLI can still do the work by hand. After this change, no first-party Skill ships a Python file, and a test keeps it that way.

This design closes register [D-064](../prd/03-open-questions-and-risk-register.md). It also closes the remaining helper-script part of R-008 in the same register.

## Context

### The owner's rule

On 2026-11-22 the owner set this rule: avoid Python and build all logic in the CLI, unless the logic must be in Python, or it must be portable and is meant to work without the CLI. On 2026-11-23 the owner made D-064 a high priority.

The rule agrees with current authority:

- [PRD 25](../prd/25-typescript-runtime-cli-mcp-operation-boundaries.md) says that deterministic logic lives in TypeScript operation domains, "not skill-local scripts". It also says that derivation and judgment that an agent can do from contracts and project files do not become registry operations.
- The [twins guide](../assets/project/developing-deterministic-agentic-twins.md) puts deterministic logic in the CLI and its agent form in written instructions. A project can use Make Docs without the CLI, so the agent form must exist.
- The [no-scripts design](2026-06-20-no-scripts-migration-and-skill-refactor.md) of 2026-06-20 already put "markdown cleanup and style checks; archive relationship tracing; decompose-codebase environment probing and output validation" in the CLI. [W16 R3](../plans/2026-06-23-w16-r3-no-scripts-migration-skill-refactor/03-skill-and-script-migration-sequence.md) moved only the four lifecycle Skills. It listed these three Skills as conversions that it "may include", and its closeout kept them installed.

### Precedent: the path checker

[D-019](../prd/03-open-questions-and-risk-register.md) handled `.make-docs/scripts/check_path_hygiene.py`. The CLI now owns that check as `make-docs project paths validate` and `make-docs project paths repair`. `packages/cli/src/retired-path-helper.ts` removes an old installed copy only when its hash proves that Make Docs wrote it. This design follows the same shape for the Skill scripts.

### The files today

A read-only check of the code on 2026-11-23 found these facts.

| File | What it does | Shipped to users | Who calls it | Same logic in the CLI |
| --- | --- | --- | --- | --- |
| `packages/skills/decompose-codebase/scripts/validate_output.py` (620 lines) | Checks a decomposition result: PRD file names and folder order, required sections in each PRD document, source anchors, work backlog folders, task lines, task IDs, acceptance criteria, archive folder names, and relative links. Report only. | Yes, through `packages/cli/skill-registry.json`. | `SKILL.md` and `references/execution-workflow.md` tell the agent to run it before it finishes. | Partly. The work phase parser in `packages/cli/src/operations/work/index.ts`, the backlog snapshot, and `check prd` read the same task lines and PRD files. W31 R0 P1 had to change the task ID reader in both languages. |
| `packages/skills/decompose-codebase/scripts/probe_environment.py` (367 lines) | Guesses the current harness from environment variables and harness config files in the person's home folder. Lists configured MCP servers, and names two fixed MCP servers as recommended. Its own notes say that its output does not prove what the session can use. | Yes. | `SKILL.md`, `references/planning-workflow.md`, and `references/execution-workflow.md` tell the agent to run it first. | No. The harness adapters in `packages/cli/src/harness-access/` know harness config paths, but only to write the Make Docs MCP entry. |
| `packages/skills/decompose-codebase/scripts/test_validate_output.py` (578 lines) | Tests for `validate_output.py`. | No. Tests assert that it is not installed. | People run it by hand. `packages/cli/src/operations/closeout/index.ts` adds it to its validation commands when a decompose-codebase script changes. | Not applicable. |
| `packages/skills/archive-docs/scripts/trace_relationships.py` (445 lines) | Builds a relationship graph of designs, plans, work, history records, and guides: Markdown links, `related:` front matter, W/R coordinates in history records, and same-slug matches. Can focus on one artifact. Report only. | Yes. | `SKILL.md` calls it an optional helper for large doc trees. | No. |
| `packages/skills/archive-docs/scripts/test_trace_relationships.py` (33 lines) | Tests for `trace_relationships.py`. | No. | People run it by hand. | Not applicable. |
| `packages/skills/cleanup-docs/scripts/check_markdown_style.py` (404 lines) | Finds Markdown source drift: missing blank lines between blocks, hard-wrapped paragraphs, and hard-wrapped list items. Its `--fix` flag rewrites files. | Yes. | `SKILL.md` tells the agent to run a report, check a sample, then run `--fix`. | No. |
| `packages/skills/cleanup-docs/scripts/test_check_markdown_style.py` (196 lines) | Tests for `check_markdown_style.py`. | No. | People run it by hand. | Not applicable. |

More facts:

- `packages/skills/decompose-codebase/scripts/__pycache__/validate_output.cpython-314.pyc` is tracked in Git. It was committed before `.gitignore` gained its `__pycache__` line, and the ignore rule does not untrack it. The registry does not declare it, so the CLI does not embed or install it, and the npm package does not contain it.
- No CI workflow runs Python. The Python tests ran only by hand or through the closeout validation commands.
- No registry operation or MCP tool reaches the closeout code today. D-020 left it as dormant code. Its validation commands still name `python3` for the decompose-codebase tests, and for two `closeout-commit` and `closeout-phase` test files that D-020 already deleted.
- This repository's installed Skills under `.agents/skills/` and `.claude/skills/` do not include the three Skills, so no installed Python copy exists here. Other projects that selected these Skills have installed copies.
- No file in `packages/docs/template/` names these scripts.
- The scripts are not truly portable. They need Python 3.9 or later, and `probe_environment.py` needs Python 3.11 to read TOML files. The CLI needs Node 24, and the CLI installs these Skills.

### The backlog-review scripts

`packages/skills/backlog-review/scripts/` holds four JavaScript files, not Python:

- `report-contract.mjs` and `agent-contract.mjs` are build outputs of `packages/cli/scripts/build-backlog-presentation.mjs`. Their logic lives in CLI source. Each file starts with "Generated by ... Do not edit."
- `render-report.mjs` is a 49-line wrapper. It reads a report file, calls `report-contract.mjs`, and writes an HTML file.
- `collect-project-lead-context.mjs` is 210 lines of hand-written logic. It collects short excerpts from project summary files for the report lead. No CLI source holds this logic.

The Skill README says that `agent-contract.mjs` "needs no CLI, `node_modules`, Store, or network". The Skill uses these files as the portable path for hosts that can run Node. OD-1 asks whether the owner's rule covers them.

## Human Experience Intent

Impact: `direct`

Affected humans: the `user` and `maintainer` Personas, human or agent, who run the `decompose-codebase`, `archive-docs`, and `cleanup-docs` Skills, read their results, or maintain the Skills.

Human goal or effect: a person or agent runs each Skill check with the Make Docs tools that the Skill already needs, gets one clear result, and does not need Python.

Experience promises:

- Each check is one Make Docs command and one MCP tool with a name from the W33 rules, such as `make-docs check decomposition` and `check_decomposition`.
- A check gives the same findings through the CLI and MCP, in plain words first, with a JSON form for agents.
- Without the CLI, the Skill tells the agent how to do the same check by hand, and the agent says that the result is a manual review.
- An update removes the old Python files from an installed Skill when Make Docs wrote them, and keeps any file that a person changed.
- A rule change in the CLI fails a test until the Skill text changes with it, and the other way around.

Complexity kept out of the human path:

- The person does not install Python or know which language a check uses.
- The person does not find or call a script path inside a Skill folder.

Evidence required:

- Vitest tests that run every case from the old Python tests through the new operations, plus CLI and MCP parity tests.
- One run of the old script and the new operation on the same fixtures, with the same findings, before the script is removed.
- An update test that removes unchanged installed Python files and keeps a changed one.
- A Human Experience Review of the three Skills' text and of the plain output of each new command.

## Performance Evidence Candidates

| Candidate | Base maintenance action | Performance applicability | Protected outcome | Decision informed | Canonical owner or next record |
| --- | --- | --- | --- | --- | --- |
| None | `none` | `not-needed` | None. The checks read local Markdown files, as the scripts do now. | None. | None. |

## Decision

### Decisions for each file

| File | Decision | New CLI path | MCP name | Operation ID |
| --- | --- | --- | --- | --- |
| `validate_output.py` | Move into the CLI. Remove the file. | `make-docs check decomposition` | `check_decomposition` | `decomposition.output.validate` |
| `test_validate_output.py` | Move every case to vitest. Remove the file. | Not applicable. | Not applicable. | Not applicable. |
| `trace_relationships.py` | Move into the CLI. Remove the file. | `make-docs project relations list` | `project_relations_list` | `project.relations.list` |
| `test_trace_relationships.py` | Move every case to vitest. Remove the file. | Not applicable. | Not applicable. | Not applicable. |
| `check_markdown_style.py` | Move into the CLI as a check and a repair. Remove the file. | `make-docs project markdown validate` and `make-docs project markdown repair` | `project_markdown_validate` and `project_markdown_repair` | `project.markdown-style.validate` and `project.markdown-style.repair` |
| `test_check_markdown_style.py` | Move every case to vitest. Remove the file. | Not applicable. | Not applicable. | Not applicable. |
| `probe_environment.py` | Remove. The Skill text tells the agent to check its own session (OD-2). | None. | None. | None. |
| `__pycache__/validate_output.cpython-314.pyc` | Remove from Git. | Not applicable. | Not applicable. | Not applicable. |

No file keeps a recorded reason to stay. None of the logic must be in Python. None of it must work without the CLI in a way that a script gives and the agent form does not: the agent form covers the no-CLI case, and the scripts need Python anyway.

### `check decomposition`

- It reads a project and reports every finding that `validate_output.py` reports today, with a stable rule ID and a plain message for each.
- It reuses the CLI's work phase parser for task lines and task IDs, and the PRD reader of `check prd` where the rules are the same. One reader then serves every task ID check, so a reader change is made once.
- It reads only. It needs the project read permission.
- Its home is the `check` group, because it is a read-only validator that no other group owns. The path ends with its object, under owner decision ND-01.
- The decompose-codebase Skill keeps its output contract in `references/output-contract.md`. That contract is the agent form.

### `project relations list`

- It reports the same relationship facts as `trace_relationships.py`: Markdown links, `related:` front matter, W/R coordinates in history records, and same-slug matches. Each relation names its source, so a person can tell a link from a same-slug match.
- An optional `--path` input focuses the result on one artifact and lists its inbound and outbound relations.
- It finds guide folders from the effective Persona set, as `project persona list` does. The script reads only `docs/assets/user/` and `docs/assets/maintainer/`, so it misses custom Persona folders. This is a change from the script.
- It reads only. It needs the project read permission.
- Its home is the `project` group, next to path hygiene, because it reads the project's documents and is not a validator.
- The archive-docs Skill keeps its manual tracing steps in `references/archive-workflow.md`. Those steps are the agent form.

### `project markdown validate` and `project markdown repair`

- `validate` reports the same findings as the script's report mode, with rule, lines, whether a fix exists, and a short preview.
- `repair` makes only the fixes the script makes with `--fix`. It needs the project write permission, as `project paths repair` does. It has a dry run that shows each planned change and writes nothing.
- The check and the repair stay together in the `project` group, as path hygiene does. A `check markdown` path with a repair in another group would split one capability across two groups, which PRD 39 R-NAME-1 forbids.
- The cleanup-docs Skill keeps its flow: run the check, review a sample for false positives, and repair only when the sample is clean. Its formatting rules in `SKILL.md` are the agent form.

### `probe_environment.py`

- The agent knows its own session better than a script that reads config files. The Skill text tells the agent to list the MCP tools and the subagent or parallel agent tools that its session gives it, and to write them in the plan.
- The script also names two fixed MCP servers as recommended. Make Docs stays tool-agnostic, so the Skill text names no MCP server.
- This departs from the 2026-06-20 design, which put environment probing in the CLI. OD-2 asks the owner to confirm.

### Names

All four command paths follow PRD 39 R-NAME-1 to R-NAME-4. Each MCP name has at most 26 characters: `check_decomposition` has 19, `project_relations_list` has 22, `project_markdown_validate` has 25, and `project_markdown_repair` has 23. `markdown-style` is the object in the operation IDs, but the CLI path uses `markdown`, because `project_markdown_style_validate` has 31 characters. The name catalog in `packages/cli/src/operations/name-catalog.ts` adds the four entries, and its planner list gains `W34 R0`.

### Twin rules

Each new operation and its agent form share one rule list, as the performance evidence twin in PRD 25 does. Each rule has one ID in the operation and the same ID in the Skill text. A test fails when an ID exists on one side only. A change to a rule on one side needs a review of the other side in the same change set, as the twins guide asks.

### When the CLI is not there

Make Docs installs these Skills, so the CLI was present at install time. It can still be missing when the Skill runs: the person removed it, the harness cannot run it, or the Skill folder was copied to another machine. The Skill text tells the agent to use this order:

1. Use the MCP tool when the session has it.
2. Otherwise run the CLI command.
3. Otherwise follow the agent form in the Skill text by hand.

In step 3 the agent says that the result is a manual review, uses the proof state `agent-reviewed` from PRD 25, and does not claim that a Make Docs check ran. It does not install the CLI, Python, or anything else without the person's consent. For a repair, it makes the same fixes by hand only after the person agrees, as the cleanup-docs Skill asks today. This matches PRD 25 R-SKILL-RUNTIME-3 and the project router, which let ordinary work continue without the CLI and with a truthful result.

### Migration

One change set for each Skill. Each one follows the PRD 25 operation-first order.

1. **Operation and tests.** Add the operation, its CLI command, its MCP tool, and vitest tests. The tests run every case from the Python test file with the same inputs and the same expected findings. Before the script is removed, run it and the new operation on the same fixtures and record the same findings as evidence.
2. **Skill text.** Change `SKILL.md` and its references to the MCP, CLI, and agent-form order above. Remove every script path. Update the agent forms and give each rule its ID.
3. **Registry and package.** Remove the Python entries from `packages/cli/skill-registry.json`. Update `skill-registry.test.ts`, `install.test.ts`, `skill-catalog.test.ts`, and the legacy path list in `scripts/smoke-pack.mjs`. Confirm that `npm run smoke:pack` passes and that the packed CLI embeds no `.py` file.
4. **Installed copies.** The existing stale-file rule in `packages/cli/src/planner.ts` (`planStaleSkillFile`) removes a managed file that leaves the registry on `make-docs update` or `make-docs setup skills`. A file that a person changed stays and shows as a conflict for review. A test proves both cases for each removed file. This repository has no installed copy of the three Skills, so no dogfood copy changes.
5. **Closeout code.** Remove the `python3` commands and the `test_validate_output.py` special case from `packages/cli/src/operations/closeout/index.ts`. Also remove the two stale `closeout-commit` and `closeout-phase` commands. Name the new vitest files in its test command instead.
6. **Removal.** Delete the Python files and the tracked `.pyc` file. Change step 3 of "Adding a Skill" in `packages/skills/README.md`: deterministic logic goes in a CLI operation, not in `scripts/`.
7. **Shipped text and PRDs.** Update the shipped guides that name Skill helper scripts, such as `docs/assets/maintainer/skills-catalog-and-distribution-model.md` and `docs/assets/user/skills-decomposing-an-existing-codebase.md`, under PRD 39 R-NAME-6. Update PRD 39 (R-TOP-1 `project` contents, R-RUN-1 `check` list, the command tables), PRD 25 (MCP tool list), PRD 08 (Skill contents), and the register (D-064 and the R-008 helper part).
8. **Template-first.** No file in `packages/docs/template/` names these scripts today. If the plan adds or changes a shipped system resource, such as an agent form that moves into `.make-docs/system/`, write it first in `packages/docs/template/`, then copy it byte for byte to this repository's `.make-docs/` or `docs/`. The Skills keep `packages/skills/` as their only authoring source.

CI needs no Python change, because no workflow runs Python. The new tests run in the normal vitest suite. The plan decides whether the `platform-safety` workflow also lists the guard test.

### Guard

A vitest test walks `packages/skills/` and fails when it finds a `.py` file, a `.pyc` file, or a `__pycache__` folder. The same test fails when `packages/cli/skill-registry.json` declares a `.py` file. If the owner takes OD-1 option A, the test also fails for any file under a Skill's `scripts/` folder that is not a generated bundle whose bytes match a fresh build from CLI source.

### Order

W34 R0 does not depend on W29 R0 or W30 R0, and they do not depend on it. It can run beside them. Until it closes, the D-064 hold stays: no new Python file and no new logic in these scripts.

### New ideas in this design

These parts do not come from existing docs. The owner should know they are new:

- The four command paths, MCP names, and operation IDs.
- Removing `probe_environment.py` with no CLI operation, in place of the CLI probe that the 2026-06-20 design named (OD-2).
- `project relations list` reads guide folders from the effective Persona set, not from two fixed folders.
- The `--path` input name for one artifact. The script calls it `--target`.
- The dry run for `project markdown repair`.
- The rule that a Skill `scripts/` folder holds only generated bundles (OD-1 option A).
- The proof step that runs each old script and its new operation on the same fixtures before removal.

### Owner decisions

The owner chose option A for OD-1, OD-2, and OD-3 on 2026-11-23: the rule covers the backlog-review `.mjs` scripts with the generated-bundle exception, `probe_environment.py` is removed, and the coordinate is W34 R0.

**OD-1: Do the backlog-review `.mjs` scripts fall under the rule?**

- A (recommended): yes, with one exception. A Skill script may stay only when it is a generated bundle of CLI source and a test proves that its bytes match a fresh build. `report-contract.mjs` and `agent-contract.mjs` already pass. `render-report.mjs` and `collect-project-lead-context.mjs` move into CLI source and become generated bundles, so their logic has one home and the portable no-CLI path stays.
- B: no. This Wave covers Python only. The guard checks only Python. The `.mjs` files stay as they are, and a later design looks at them.

Why A: the owner's rule says to build all logic in the CLI. `collect-project-lead-context.mjs` is the one hand-written file with logic that no CLI source holds, so it can drift in the same way. Generated bundles keep the portable path that the Skill promises without a second copy of the logic.

**OD-2: Remove `probe_environment.py`, or move it into the CLI?**

- A (recommended): remove it. The Skill text tells the agent to check its own session tools.
- B: move it into the CLI as a read-only check, such as `make-docs check environment` (`check_environment`), with no recommended server names.

Why A: the script guesses, and its own notes say that the guess does not prove access. The agent knows its session tools directly. PRD 25 keeps judgment that an agent can do out of the registry. A CLI probe would also read harness files in the person's home folder that Make Docs does not own.

**OD-3: W34 R0 or W16 R4?**

- A (recommended): W34 R0, new work.
- B: W16 R4, a revision Wave of W16 R3.

Why A: W16 R3 named these conversions only as optional, and its closeout kept the scripts installed. No Wave promised the outcome. The new operations are new capabilities.

## Alternatives Considered

- **Keep the scripts and record why.** Rejected. No reason meets the owner's rule. The logic does not need Python, and the scripts are not portable without Python.
- **Keep the scripts as thin wrappers that call the CLI.** Rejected. PRD 25 allows thin wrappers only for compatibility. These Skills have no outside callers that need a script path, and the owner already rejected thin script shims under D-019.
- **Port the scripts to JavaScript inside the Skills.** Rejected. The logic would still live outside the CLI and could still drift from the CLI readers.
- **One `check` command for all three Skills.** Not chosen. The three checks read different things and have different permissions. One command per capability keeps the names clear.
- **`check markdown` for the report and a repair in another group.** Not chosen. It splits one capability across two groups. Path hygiene already keeps its check and repair together under `project`.
- **Keep the old test files and run Python in CI.** Rejected. It keeps Python as a repository need, and it tests code that this design removes.

## Consequences

- No first-party Skill ships Python. The three Skills need only the Make Docs CLI or MCP server, which installs them, or the agent form.
- A task ID or PRD reader change is made once in the CLI, not also in a Python file.
- The CLI gains four commands and four MCP tools. The `project` group gains markdown and relations commands, and the `check` group gains `decomposition`. PRD 39, PRD 25, and PRD 08 change, and the name catalog gains four entries.
- People who call the scripts by path, outside the Skills, lose them on update. The removal follows the managed-file rules, and a changed copy stays.
- D-064 can close. The helper-script part of R-008 can close.
- Risk: the TypeScript port finds a little more or less than the script. The tests run every old case, and the side-by-side run records any difference before removal. A difference that fixes a script defect is listed in the evidence, not hidden.
- Risk: the agent form drifts from the operation. The shared rule IDs and the parity test catch a one-sided change.
- Risk: OD-2 option A removes a hint that some agents used. The Skill text gives the agent a direct way to get the same facts from its own session.

## Design Lineage

- Update Mode: `new-doc-related`
- Prior Design Docs: [No-Scripts Migration and Skill Refactor](2026-06-20-no-scripts-migration-and-skill-refactor.md), [Command Tree and Tool Names](2026-11-22-command-tree-and-tool-names.md)
- Reason: the 2026-06-20 design put this logic in the CLI, and W16 R3 moved only the lifecycle Skills. This design finishes the three remaining Skills under the W33 command tree. It departs from the 2026-06-20 design in one place: environment probing becomes agent work, not a CLI operation (OD-2).

## Intended Follow-On

- Route: `change-plan`
- Next Prompt: [designs-to-plan-change.prompt.md](../../.make-docs/system/prompts/designs-to-plan-change.prompt.md). Read `make-docs://system/prompt/designs-to-plan-change.prompt.md` with `make-docs resource read`.
- Why: PRD 25 owns the no-scripts rule and the twin pattern, PRD 39 owns the command tree and the name catalog, and PRD 08 owns the Skill contents. This design adds four CLI operations, removes every Python file from the first-party Skills, and changes the Skill text, the registry, and the tests together.
- Coordinate Handoff: Recommended W34 R0 as new work, by the outcome test: no Wave promised these conversions. The related completed coordinate is W16 R3, which named them as optional and left them out. If the owner picks OD-3 option B, use W16 R4 as a revision Wave. W34 R0 closes register D-064. The planner checks the choice under the wave-model decision procedure.

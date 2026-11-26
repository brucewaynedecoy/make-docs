---
title: "W33 R0 Command Tree and Tool Names Plan"
kind: "plan"
status: "draft"
coordinate: "W33 R0"
follow_on:
  route: "prd-generation"
  next_prompt: "make-docs://system/prompt/plan-to-prd-change.prompt.md"
  why: "The plan should become the product contract before the work backlog is written."
  coordinate_handoff: "Carry W33 R0 into the requirement-history entries and docs/work/2026-11-22-w33-r0-command-tree-and-tool-names/."
source:
  type: "design"
  path: "docs/designs/2026-11-22-command-tree-and-tool-names.md"
---

# W33 R0 Command Tree and Tool Names Plan

## Purpose

Plan the [command tree and tool names design](../../designs/2026-11-22-command-tree-and-tool-names.md). `run` is retired as a root. Each capability becomes its own top-level group: `setup`, `project`, `resource`, `work`, `backlog`, `lifecycle`, `factory`, `check`, `mcp`, `update`, and `uninstall`. Every MCP tool name is its CLI path after `make-docs`, joined with underscores. Old names keep working for two minor releases, then return a typed `command-renamed` result for one more. The Wave closes register D-065 and must close before W29 R0 P4 and W30 R0 P3.

This plan, its PRD changes, and its work backlog are review material. They do not authorize CLI, MCP, template, Skill, installation, commit, push, or release changes. Implementation needs separate owner authority. The Wave must not touch W22 R2 files, branches, or worktrees.

## Objective

Completion requires:

- one name catalog in code that lists every registry operation, hand-defined MCP tool, and planned W29 R0 and W30 R0 operation with its current CLI path, current MCP name, new CLI path, and new MCP name;
- a naming-rule test that fails when an operation or tool breaks the design's rules 1 to 5, or when a PRD lists a command that the registry does not have or misses one it has;
- the eleven top-level groups, with `run` retired as a root and `make-docs --help` listing the groups by capability;
- MCP names derived from CLI paths by one rule, with the W26 R1 hand-picked map removed;
- old CLI paths and MCP names as hidden aliases that run the same operation, print or return the new name, and add `renamedTo` to JSON results, for two minor releases, then a typed `command-renamed` result for one more minor release;
- every shipped Skill, router, reference, prompt, guide, PRD, and this repository's own instructions using the new names, upstream in `packages/docs/template/` first and then in the dogfood copy;
- the W29 R0 and W30 R0 backlogs naming their planned commands and tools by the new rules.

## Human Experience Propagation

The source design has `direct` impact. Authority: [Human Experience Contract](../../../.make-docs/system/contracts/human-experience-contract.md).

| Promise | Owning PRD | Human-facing surface or indirect effect | Work phase | Evidence source or selected testing type | Accepted obligation, if any |
| --- | --- | --- | --- | --- | --- |
| Every command for one capability starts with that capability's group. | [PRD 39](../../prd/39-cli-command-model-and-operation-registry.md) | The CLI tree and `make-docs --help` | [P1](01-name-catalog-and-rules.md), [P2](02-command-tree-and-tool-names.md) | Naming-rule test, Guided Progress Review of the name table and help | None |
| Each MCP tool name is the CLI path after `make-docs`, joined with underscores. | [PRD 25](../../prd/25-typescript-runtime-cli-mcp-operation-boundaries.md), PRD 39 | `tools/list` in every MCP profile | [P2](02-command-tree-and-tool-names.md) | Naming-rule test, CLI and MCP parity | None |
| A current command or tool name keeps working for the migration window and names the new one. | PRD 39, PRD 25 | Old CLI paths, old MCP calls, `renamedTo`, `command-renamed` | [P3](03-aliases-and-migration-window.md) | Alias tests for every current name | None |
| `make-docs --help` lists the groups by capability, in plain words. | PRD 39 | Help output | [P2](02-command-tree-and-tool-names.md), [P5](05-acceptance.md) | Help snapshot test, Human Experience Review | None |

## Performance Evidence Plan

| Candidate | Base maintenance action | Performance applicability | Target class | Canonical `PERF-###` or next record | Finite budget and stop reference | Lifecycle point |
| --- | --- | --- | --- | --- | --- | --- |
| None | `none` | `not-needed` | None | None | None | None |

Command names do not change run time.

## Coordinate Decision

- Coordinate: `W33 R0`
- Classification: `new-wave`
- Evidence: Explicit owner guidance on 2026-11-22: retire `run`, one rule for MCP names, and old names kept for two minor releases. The outcome test agrees: no earlier Wave promised a capability-grouped tree or a derived MCP name rule. The W18 R11 command design and W26 R1 name map are prior lineage, but the owner chose a new Wave rather than revising them. The highest Wave in `docs/plans/`, `docs/work/`, and their archives is W32.

## Maintenance Inputs

| Input | Format | Location | Confidence |
| --- | --- | --- | --- |
| Command tree and tool names design | Markdown | [2026-11-22-command-tree-and-tool-names.md](../../designs/2026-11-22-command-tree-and-tool-names.md) | High. Owner-confirmed choices. |
| Register entry | Markdown | [D-065](../../prd/03-open-questions-and-risk-register.md) | High. |
| Operation registry and MCP name map | TypeScript | `packages/cli/src/operations/registry.ts`, `packages/cli/src/mcp/tools.ts` | High. 45 operations and six hand-defined tools at `0a2a836c`. |
| Prior command design | Markdown | [2026-07-01 command design](../../designs/2026-07-01-cli-command-reorganization-and-operation-registry.md) | High. |
| W26 R1 name contract | Markdown | [W26 R1 name contract](../2026-10-23-w26-r1-mcp-tool-names/01-name-contract.md) | High. Replaced by this Wave. |

## Product Authority Decision

| Candidate | Decision | Owner | Reason |
| --- | --- | --- | --- |
| Top-level groups, the naming rules, the retired `run` root, canonical CLI tables, and the alias window | `update-existing` | [PRD 39](../../prd/39-cli-command-model-and-operation-registry.md) | PRD 39 owns the command tree, R-TOP, R-RUN, and R-MIG. |
| The MCP name rule, the removed hand-picked map, profile lists by new name, and MCP aliases | `update-existing` | [PRD 25](../../prd/25-typescript-runtime-cli-mcp-operation-boundaries.md) | PRD 25 owns the MCP surface and profiles. |
| Backlog command and tool names, and the stale `make_docs_` prefix | `update-existing` | [PRD 51](../../prd/51-backlog-review-and-reporting.md) | PRD 51 names its operations' CLI and MCP projections. |
| Work command and tool names | `update-existing` | [PRD 52](../../prd/52-work-store-and-work-queue.md) | PRD 52 names its operations. |
| Factory command and tool names | `update-existing` | [PRD 53](../../prd/53-factory-setup-and-orchestration.md) | PRD 53 names its operations. |
| Store maintenance and project list tool names | `update-existing` | [PRD 38](../../prd/38-global-store-and-project-state.md) | `project_register_list` becomes `project_list`. |
| Glossary entries that name commands | `update-existing` | [PRD 04](../../prd/04-glossary.md) | Shared terms name commands. |
| D-065 status | `update-existing` | [Risk register](../../prd/03-open-questions-and-risk-register.md) | The register holds the gap. |
| Other PRDs that mention a command in passing | `link-only` | Each owner | P4 updates the text; no requirement changes. |
| A new product PRD | `none` | None | PRD 39 and PRD 25 own the tree and the names. |

## Requirement History Entries

| Owning PRD | Date / coordinate | Affected requirement or section | Previous contract | Replacement contract | Rationale | Source |
| --- | --- | --- | --- | --- | --- | --- |
| PRD 39 | 2026-11-22 / W33 R0 | R-TOP, R-RUN, R-MIG, canonical CLI tables | Seven top-level commands with `run` as the operation root; MCP names from a hand-picked map. | Eleven capability groups, `run` retired, one derived MCP rule, aliases for two minor releases. | One capability, one group, one name rule. | [Design](../../designs/2026-11-22-command-tree-and-tool-names.md) |
| PRD 25 | 2026-11-22 / W33 R0 | MCP names and profiles | Short hand-picked names, no aliases. | Names derived from CLI paths, hidden aliases for the window. | Tools match commands and keep working on upgrade. | Same |
| PRD 51, 52, 53, 38 | 2026-11-22 / W33 R0 | Named operations | Names under `run` and hand-picked tool names. | Names under the capability groups by the rule. | Same | Same |

## Phase Map

| File | Purpose |
| --- | --- |
| [01-name-catalog-and-rules.md](01-name-catalog-and-rules.md) | Settle the full name table and the naming-rule test. |
| [02-command-tree-and-tool-names.md](02-command-tree-and-tool-names.md) | Build the eleven groups and derive MCP names by the rule. |
| [03-aliases-and-migration-window.md](03-aliases-and-migration-window.md) | Keep old names working for the window, then return `command-renamed`. |
| [04-shipped-text-and-skills.md](04-shipped-text-and-skills.md) | Move every shipped Skill, router, reference, prompt, guide, and PRD to the new names. |
| [05-acceptance.md](05-acceptance.md) | Prove parity, aliases, help, and the Human Experience promises. |

## Dependencies

- W22 R2 files, branches, and worktrees stay untouched.
- P1 can start now. It is the contract gate: no rename starts before the owner accepts the name table.
- P2 depends on P1, W31 R0 P3, and W32 R0 P4, so their new commands are renamed in the same change.
- P3 depends on P2.
- P4 depends on P2. It can run beside P3.
- P5 depends on P3 and P4.
- W29 R0 P4 and W30 R0 P3 depend on P5.

## Output Contract

- Design: `docs/designs/2026-11-22-command-tree-and-tool-names.md`.
- Plan: this directory with `00-overview.md` and five phase files.
- New product authority: none.
- Updated owners: PRDs 03, 04, 25, 38, 39, 51, 52, and 53.
- Work backlog: `docs/work/2026-11-22-w33-r0-command-tree-and-tool-names/` with `00-index.md` and five phase files.
- W29 R0 and W30 R0 backlogs: rename their planned commands and tools, with Change History entries. Wave Sequence sections in W29 to W33 name this Wave.
- No implementation source, Skill, template, installation, staging, commit, push, or release change is part of this plan-writing pass.

## Worker Ownership

Use disjoint write scopes when implementation is authorized.

| Worker role | Responsibility | Primary write scope | Dependencies | Deliverable |
| --- | --- | --- | --- | --- |
| Contract owner | Name catalog and naming-rule test | New name catalog module, its test | Accepted PRD changes | P1 table |
| Surface owner | Groups, CLI tree, help, derived MCP names | `packages/cli/src/operations/registry.ts`, `packages/cli/src/cli.ts`, `packages/cli/src/mcp/`, tests | P1, W31 R0 P3, W32 R0 P4 | P2 tree |
| Migration owner | CLI and MCP aliases, `renamedTo`, `command-renamed`, window tracking | Alias layer and its tests | P2 | P3 aliases |
| Text owner | Skills, routers, references, prompts, guides, PRDs, reseed | `packages/docs/template/`, `packages/skills/`, `.agents/skills/`, dogfood copy, `docs/` | P2 | P4 text |
| Validation owner | Parity, help review, Human Experience Review, evidence | Evidence file, bounded fixes returned to owners | P3, P4 | P5 evidence |

## MCP Strategy

Use jdocmunch for project documents and jcodemunch for code during implementation. Reindex before falling back to direct reads. The registry stays the single source: operation IDs do not change, and CLI paths and MCP names are derived from it.

## Validation

- Validate design, plan, PRD, work, path, link, and metadata contracts.
- Run PRD authority validation before the work backlog is treated as implementation authority.
- Prove every operation and tool passes the naming rules, and every PRD command list matches the registry.
- Prove CLI and MCP parity for every operation under its new name.
- Prove every old CLI path and MCP name runs the same operation during the window, returns `renamedTo`, and later returns `command-renamed`.
- Prove no shipped Skill, router, reference, prompt, or guide names an old command, apart from migration tables that list old names on purpose.
- Prove template and dogfood bytes match.
- Run the full test suite and record known failures.
- Complete a Human Experience Review for each promise above.

Automated Implementation Testing is required for every implementation phase. Guided Progress Review is selected for the name table in P1 and for `make-docs --help` in P5. Performance Testing and Unassisted Goal Testing are `not-needed-now`.

## Intended Follow-On

This handoff is advisory-default-but-overridable.

- Route: `prd-generation`
- Next step: Update PRDs 03, 04, 25, 38, 39, 51, 52, and 53 from this plan, then rename the planned commands in the W29 R0 and W30 R0 backlogs.
- Why: The plan should become the product contract before the work backlog is written.
- Coordinate Handoff: Carry W33 R0 into the requirement-history entries and docs/work/2026-11-22-w33-r0-command-tree-and-tool-names/.

---
title: "Command Tree and Tool Names"
kind: "design"
status: "draft"
coordinate: "W33 R0"
follow_on:
  route: "change-plan"
  next_prompt: "make-docs://system/prompt/designs-to-plan-change.prompt.md"
  why: "PRD 39 owns the command tree and PRD 25 owns MCP tool names and profiles. This design replaces their grouping and naming rules, and every Skill, router, and guide that names a command follows."
  coordinate_handoff: "Recommended W33 R0 as new work. It closes register D-065 and must close before W29 R0 P4 and W30 R0 P3 build their commands. The planner checks the choice under the wave-model decision procedure."
---

# Command Tree and Tool Names

## Purpose

Give every Make Docs command and MCP tool a name that a person or agent can guess from the capability. One capability lives in one command group, and its MCP tools share one prefix. The CLI path and the MCP name follow one rule, so they always match. Current names keep working for a set time and point to the new name.

This design closes register [D-065](../prd/03-open-questions-and-risk-register.md). It must close before [W29 R0 P4](../work/2026-11-21-w29-r0-work-store/04-work-queue-operations.md) and [W30 R0 P3](../work/2026-11-21-w30-r0-factory/03-factory-operations.md) add about twenty commands.

## Context

The CLI has seven top-level commands under [PRD 39](../prd/39-cli-command-model-and-operation-registry.md) R-TOP-1: `setup`, `project`, `resource`, `run`, `mcp`, `update`, and `uninstall`. The [2026-07-01 command design](2026-07-01-cli-command-reorganization-and-operation-registry.md) made `run` the root for every registry operation and said that a multi-operation family uses a subtree under a domain object. W26 R1 then gave MCP tools short hand-picked names through a checked map, at most 26 characters, with no aliases.

Each later Wave added its commands where it saw fit. On 2026-11-22 the registry held 45 operations and the MCP server six more hand-defined tools (`compatibility`, `config`, `domains`, `install_plan`, `install_status`, `manifest`).

Problems:

- **One capability in two places.** Backlog review lives in `run work backlog snapshot`, `run work backlog-cache lookup` and `write` (W23 R0), and `run backlog review open` and `refresh` (W25 R0).
- **`run` mixes unrelated groups.** It holds validators (`run prd authority validate`, `run performance evidence validate`, six `run uat ... validate`), the lifecycle (ten `run lifecycle` commands), work (six `run work` commands), and backlog review. W29 and W30 plan nineteen more under `run work` and `run factory`.
- **`run` says nothing.** The most used commands, such as `make-docs run work next`, start with a word that adds no meaning.
- **MCP names follow no one rule.** Some keep the group (`lifecycle_start`, `work_item_resolve`). Some drop it (`evidence_record` for `work.evidence.record`, `personas` for `project.persona.list`, `paths_validate` for `project.path-hygiene.validate`, `checkout_move_preview` for `project.checkout-move.preview`). Some change the verb (`backlog_cache_read` for `lookup`, `prd_validate` for `authority validate`). PRD 51 R-BACKLOG-APP-1 still names `make_docs_backlog_review_open`, but the server exposes `backlog_review_open`.
- **Lists drift.** PRD 39 R-RUN-1 lists the W29 work commands but leaves out `add`.

The owner rated this a very serious problem on 2026-11-22 and asked that W29 not make it worse.

## Human Experience Intent

Impact: `direct`

Affected humans: the `user` and `maintainer` Personas, human or agent, who type commands, call MCP tools, write Skills and scripts, or read guides.

Human goal or effect: a person or agent finds the right command or tool from the capability name, without a lookup.

Experience promises:

- Every command for one capability starts with that capability's group, such as `make-docs work next` or `make-docs backlog review open`.
- Each MCP tool name is the CLI path after `make-docs`, joined with underscores, such as `work_next` or `backlog_review_open`.
- A current command or tool name keeps working for the migration window and says which new name to use.
- `make-docs --help` lists the groups by capability, in plain words.

Complexity kept out of the human path:

- The person does not need to know which Wave added a command, or what the registry is.
- The person does not learn a second set of MCP names.

Evidence required:

- A naming-rule test over every registry operation and hand-defined tool.
- CLI and MCP parity tests, and alias tests for every current name.
- A Human Experience Review of `make-docs --help` and the group help pages.

## Performance Evidence Candidates

| Candidate | Base maintenance action | Performance applicability | Protected outcome | Decision informed | Canonical owner or next record |
| --- | --- | --- | --- | --- | --- |
| None | `none` | `not-needed` | None. Command names do not change run time. | None. | None. |

## Decision

### Naming rules

1. **One capability, one group.** A top-level command names one capability that a person thinks in, such as `work` or `backlog`. Every command for that capability lives under it. No capability spans two groups.
2. **Words order: group, object if needed, verb.** For example `make-docs work evidence record`, `make-docs backlog review open`, `make-docs lifecycle start`. A verb comes last. Words are lower-case, and a multi-word word uses a hyphen.
3. **One MCP rule.** The MCP name is the CLI path after `make-docs`, with spaces and hyphens replaced by underscores: `work evidence record` becomes `work_evidence_record`. No other mapping exists.
4. **Short paths, not short tool names alone.** A name stays at most 26 characters. When a path is too long, the CLI path gets shorter, so the two still match. For example `project checkout-move preview` becomes `project move preview` and `project_move_preview`.
5. **Hand-defined MCP tools follow the same rule.** Each one gets a CLI path in its group, or an MCP name built as if it had one.
6. **A test enforces the rules.** It fails when a registry operation or hand-defined tool breaks rules 1 to 5, or when a PRD lists a command that the registry does not have, or misses one it has.

### Top-level groups

`run` is retired as a root. Each capability becomes its own top-level group:

| Group | Holds |
| --- | --- |
| `setup` | Project install lifecycle, machine setup, Skills, backup, Store maintenance, remove. |
| `project` | Project state, checkouts, Personas, layout, surfaces, path hygiene, the project list, the doctor. |
| `resource` | System resources. |
| `work` | Work items, work evidence, and the W29 work queue. |
| `backlog` | Backlog snapshot, review cache, and the live review app. |
| `lifecycle` | Lifecycle runs. |
| `factory` | The W30 factory. |
| `check` | Read-only validators that are not owned by another group: PRD authority, performance evidence, and Unassisted Goal Testing records. |
| `mcp`, `update`, `uninstall` | Unchanged. |

### Moves for the problem areas

These rows show the rules on the commands that D-065 names. W33 R0 P1 produces the full table for every operation and tool, and the owner reviews it.

| Current CLI | Current MCP | New CLI | New MCP |
| --- | --- | --- | --- |
| `run work item resolve` | `work_item_resolve` | `work resolve` | `work_resolve` |
| `run work evidence record` | `evidence_record` | `work evidence record` | `work_evidence_record` |
| `run work evidence read` | `evidence_read` | `work evidence read` | `work_evidence_read` |
| `run work backlog snapshot` | `backlog_snapshot` | `backlog snapshot` | `backlog_snapshot` |
| `run work backlog-cache lookup` | `backlog_cache_read` | `backlog cache lookup` | `backlog_cache_lookup` |
| `run work backlog-cache write` | `backlog_cache_write` | `backlog cache write` | `backlog_cache_write` |
| `run backlog review open` | `backlog_review_open` | `backlog review open` | `backlog_review_open` |
| `run lifecycle start` | `lifecycle_start` | `lifecycle start` | `lifecycle_start` |
| `run prd authority validate` | `prd_validate` | `check prd` | `check_prd` |
| `project persona list` | `personas` | `project personas` | `project_personas` |
| planned `run work next` | planned `work_next` | `work next` | `work_next` |
| planned `run factory workflow save` | planned `factory_workflow_save` | `factory workflow save` | `factory_workflow_save` |

The W31 and W32 commands already fit the rules: `project doctor check`, `project list`, and `setup store check` give `project_doctor_check`, `project_list`, and `setup_store_check`. W32's planned `project_register_list` becomes `project_list`.

### Migration

- Every current CLI path keeps working for two minor releases after the change. It runs the same operation and prints one line that names the new command. JSON output adds a `renamedTo` field.
- Every current MCP name keeps working for the same window as a hidden alias. It is not listed in `tools/list`. A call runs the same operation and adds a `renamedTo` field to the result. This differs from W26 R1, which removed old names at once, because many Skills and scripts now call these tools.
- After the window, an old name returns a typed `command-renamed` result that names the new one, for one more minor release. Then it is removed.
- Shipped Skills, routers, references, prompts, guides, PRDs, and this repository's own instructions move to the new names in the same change set.
- Operation IDs in the registry stay stable. Only CLI paths and MCP names change.

### Order

W33 R0 runs after W31 R0 and W32 R0 build their commands, so it renames everything at once. It closes before W29 R0 P4 and W30 R0 P3.

## Alternatives Considered

- **Keep `run` and regroup under it.** For example `make-docs run work next` and `make-docs run backlog snapshot`. Not chosen. It fixes the split but keeps a root word that adds nothing to the most used commands.
- **Keep the W26 R1 hand-picked MCP names and fix only the CLI.** Rejected. Hand-picked names are why the MCP side drifted.
- **One top-level group per validator** (`make-docs prd validate`, `make-docs uat ...`). Not chosen. It adds many top-level words for read-only checks. `check` holds them in one place.
- **Rename with no aliases.** Rejected. Skills, scripts, and saved MCP calls in other projects would break on upgrade.
- **Raise the MCP name limit above 26 characters.** Not chosen. Shorter CLI paths keep both surfaces short and matched.

## Consequences

- The CLI grows from seven to eleven top-level groups. `make-docs --help` lists them by capability.
- PRD 39 R-TOP, R-RUN, and the canonical CLI tables change. PRD 25 changes its MCP name rule and profile lists. PRD 51 changes the backlog command and tool names and drops the stale `make_docs_` prefix. PRD 52, 53, 38, and 14 change the commands they name.
- W29 R0 P4 and W30 R0 P3 build on the new tree. Their backlogs change their command and tool names.
- Every shipped Skill, router, reference, prompt, and guide that names a command changes. The template and dogfood copies change together.
- Risk: an alias hides a broken caller until the window ends. The `renamedTo` field and the printed line make each old call visible.
- Risk: a large rename touches many files at once. The naming-rule test and the alias tests catch a missed name.

## Design Lineage

- Update Mode: `new-doc-related`
- Prior Design Docs: [CLI Command Reorganization and Operation Registry](2026-07-01-cli-command-reorganization-and-operation-registry.md)
- Reason: that design created the `run` root and the registry. This design keeps the registry and operation IDs, retires `run` as a root, and replaces the W26 R1 hand-picked MCP names with one rule.

## Intended Follow-On

- Route: `change-plan`
- Next Prompt: [designs-to-plan-change.prompt.md](../../.make-docs/system/prompts/designs-to-plan-change.prompt.md). Read `make-docs://system/prompt/designs-to-plan-change.prompt.md` with `make-docs resource read`.
- Why: PRD 39 owns the command tree and PRD 25 owns MCP tool names and profiles. This design replaces their grouping and naming rules, and every Skill, router, and guide that names a command follows.
- Coordinate Handoff: Recommended W33 R0 as new work. It closes register D-065 and must close before W29 R0 P4 and W30 R0 P3 build their commands. The planner checks the choice under the wave-model decision procedure.

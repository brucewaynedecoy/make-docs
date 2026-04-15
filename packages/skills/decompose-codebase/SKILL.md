---
name: decompose-codebase
description: Plan and reverse-engineer software repositories into a structured PRD set and rebuild backlog. Use when the agent needs to decompose a codebase, preserve product knowledge, create `docs/plans/...` decomposition plans, generate one active `docs/prd/...` PRD tree with archived prior PRD sets, or produce `docs/work/...` rebuild backlogs. Triggers include requests to reverse engineer a repo, document features/modules/capabilities, create a clean-room rebuild spec, or standardize decomposition outputs across projects.
---

# Decompose Codebase

## Overview

Use this skill to turn a repository into a code-first, plain-English documentation set and rebuild backlog. Treat planning and execution as separate capabilities in one skill, with planning-first as the default unless the user explicitly approves direct execution. Treat `docs/prd/` as the single active PRD tree for the repository and archive earlier PRD sets under `docs/prd/archive/`. Treat decomposition as a delegation-first workflow because single-agent execution degrades quickly on context-heavy repos. When delegation is available, the coordinating agent is coordination-only and must not author or edit output documents.

## Workflow

1. Run `scripts/probe_environment.py --format json` before deep analysis.
2. Determine whether the user wants planning or execution.
3. Default to planning when the request is broad or when no approved plan exists.
4. Confirm live session MCP access separately from local config detection.
5. Read the relevant reference files and templates before writing docs or delegating work.

## Planning Mode

- Use planning mode when the user wants a decomposition approach, output catalog, workstream design, or wants to review the structure before generating docs.
- Inspect the repo shape, existing docs, and any current `docs/plans`, `docs/prd`, or `docs/work` artifacts.
- If `docs/prd/` already contains active content outside `docs/prd/archive/`, surface that in the reviewed plan and note that execution will require an archive-approval step before writing a new PRD set.
- For very large repositories, use the same delegation ladder during planning when the harness supports it: parallel agents first, subagents next, single-agent planning only as a fallback.
- Make the reviewed plan explicit about coordinator behavior. If delegated workers are available, the coordinator write scope is `none`, and every output-writing task must belong to a worker.
- Ask for user preferences only when there is a real structure or tradeoff decision to make.
- Produce the plan in chat first.
- Write `docs/plans/YYYY-MM-DD-decomposition-plan.md` only after the user approves the plan or explicitly asks for the file.
- When handing off after the plan is presented, keep plan approval and execution approval separate. Ask whether the user wants `plan only` or `plan plus execution`. If the user approves the plan without explicitly authorizing execution, write the plan file only and stop.
- Follow [references/planning-workflow.md](./references/planning-workflow.md).
- Start from [assets/templates/decomposition-plan.md](./assets/templates/decomposition-plan.md).

## Execution Mode

- Use execution mode only after the user explicitly authorizes execution, either by requesting direct execution from the start or by approving a plan and then asking to execute it.
- At the start of execution, determine the highest supported delegation tier and use it immediately: parallel agents first, subagents second, single-agent execution only as a last fallback.
- If delegation is available, the coordinator is non-authoring. Its responsibilities are limited to preflight checks, approval handling, workstream definition, worker spawning, progress tracking, blocker routing, and final status reporting.
- If delegation is available, the coordinator must not draft PRD docs, create backlog files, fill shared docs, run assembly sweeps, or perform fix-up edits. Those tasks belong to delegated workers.
- For context-heavy decomposition, spawn delegated workers before broad repo analysis or document drafting by the coordinator.
- Before writing a fresh PRD set, inspect `docs/prd/`. If it already contains active root entries outside `archive/`, summarize what will be moved and ask for approval to archive those entries under `docs/prd/archive/YYYY-MM-DD` or `docs/prd/archive/YYYY-MM-DD-XX`. If the user declines, stop before writing to `docs/prd/`.
- Generate the PRD core, adaptive subsystem/reference docs, and rebuild backlog using the templates under `assets/templates/`.
- Always attempt delegated workstreams before single-agent execution when the harness or session policy allows it.
- When delegation is available, assign shared-doc assembly and validation/fix work to dedicated workers rather than keeping those tasks on the coordinator.
- Give each spawned agent a disjoint scope and require it to re-run its own MCP indexing in its own session when MCP tools are in use.
- Run `scripts/validate_output.py --repo-root <repo-root>` before finishing.
- Follow [references/execution-workflow.md](./references/execution-workflow.md).

## MCP-first Behavior

- Prefer the workflow in [references/mcp-playbook.md](./references/mcp-playbook.md).
- If `jdocmunch` is available, index the repository docs first and use it for doc discovery, section search, and reading.
- If `jcodemunch` is available, index the codebase and use it for file trees, outlines, symbols, references, and dependency analysis.
- If one or both recommended MCP servers are missing, recommend them, ask whether to proceed, and then fall back to local repo exploration without blocking the user.

## Output Contract

- Follow [references/output-contract.md](./references/output-contract.md) exactly.
- Keep exactly one active PRD set under `docs/prd/`.
- Archive prior PRD sets under `docs/prd/archive/YYYY-MM-DD/` or `docs/prd/archive/YYYY-MM-DD-XX/`.
- Keep the fixed core under `docs/prd/`:
  - `00-index.md`
  - `01-product-overview.md`
  - `02-architecture-overview.md`
  - `03-open-questions-and-risk-register.md`
  - `04-glossary.md`
  - adaptive numbered subsystem/reference docs starting at `05-*`
- Place rebuild work in `docs/work/`, not `docs/prd/`.
- Use flat numbering by default and introduce numbered subfolders only when a subsystem is too large for one file.

## Templates

- Use [assets/templates/prd-index.md](./assets/templates/prd-index.md) for the PRD index.
- Use [assets/templates/prd-overview.md](./assets/templates/prd-overview.md) for the product overview.
- Use [assets/templates/prd-architecture.md](./assets/templates/prd-architecture.md) for the architecture overview.
- Use [assets/templates/prd-subsystem.md](./assets/templates/prd-subsystem.md) for adaptive subsystem docs.
- Use [assets/templates/prd-reference.md](./assets/templates/prd-reference.md) for API, schema, config, and operations reference docs.
- Use [assets/templates/prd-risk-register.md](./assets/templates/prd-risk-register.md) for `03-open-questions-and-risk-register.md`.
- Use [assets/templates/prd-glossary.md](./assets/templates/prd-glossary.md) for `04-glossary.md`.
- Use [assets/templates/rebuild-backlog.md](./assets/templates/rebuild-backlog.md) for the default backlog file.
- Use [assets/templates/rebuild-backlog-index.md](./assets/templates/rebuild-backlog-index.md) and [assets/templates/rebuild-backlog-phase.md](./assets/templates/rebuild-backlog-phase.md) only when a single backlog file must split into a dated folder.

## Harness Guidance

- Use [references/harness-capability-matrix.md](./references/harness-capability-matrix.md) to choose parallelization and config-inspection behavior.
- Treat `probe_environment.py` as a capability hint, not a proof of live session access.
- Default to planning even when the harness and MCP setup look execution-ready.

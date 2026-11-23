# Planning Workflow

## Purpose

Use this workflow to produce a reviewable decomposition plan before generating documentation. Planning mode exists to lock the output structure, workstream boundaries, and validation approach before the repo is mutated.

## Preflight

1. List the tools that this session gives you: the MCP tools, such as a document index tool, a code index tool, and the Make Docs tools, and the subagent or parallel agent tools. Config files do not prove that the session has a tool.
2. Inspect the repo root, current doc folders, any existing decomposition artifacts, and whether `docs/prd/` already contains active root entries. Archived PRD sets live under `.make-docs/archive/prds/YYYY-MM-DD/`.
3. If an active PRD set exists, determine whether the request is an explicit full-set decomposition/re-baseline or ordinary PRD maintenance. Do not infer replacement authority from the presence of existing PRDs.
4. If the session has a document index tool or a code index tool, index docs and code before planning the catalog.

## Planning Goals

Produce a plan that makes the execution step decision-complete. The plan should settle:

- the doc tree shape
- the fixed core docs plus adaptive docs
- whether the request is an explicit full-set re-baseline or authoritative in-place maintenance
- for in-place maintenance, which existing PRDs own the change, which genuinely new product PRDs are justified, which candidates require no PRD change, and which requirement-history entries are needed
- whether an explicitly authorized full-set re-baseline will require archiving an existing active PRD set
- the delegation tier and workstream split for execution
- the coordinator role and write scope
- the backlog placement under `docs/work/YYYY-MM-DD-w{W}-r{R}-<slug>/`
- the output check and any follow-up review

## User Preference Questions

Ask the user only when the answer affects the output shape or execution style. Typical planning questions include:

- whether a large subsystem should split into a numbered folder
- whether reference-style docs should stay separate from subsystem docs
- whether the user explicitly wants to forbid delegation and force single-agent execution despite the default

Do not ask questions that can be answered by repo inspection.

## Plan Structure

Start from `assets/templates/decomposition-plan.md` and use it as the overview content shape for a plan directory at `docs/plans/YYYY-MM-DD-w{W}-r{R}-<slug>/`, with `00-overview.md` as the entry point and one or more `0N-<phase>.md` files. Fill it with:

- coordinate decision
- repo summary
- output contract
- existing PRD handling
- authoritative-PRD decisions: update existing, genuinely new capability, or none; never editorial change documents
- coordinator policy and delegation tier
- adaptive document catalog
- worker ownership, write scopes, and dependencies
- the session tool list, the index tool strategy, and the fallback strategy
- the output check and review steps

## File Writing Rule

Planning mode should present the plan in chat first. Write only after the user approves the plan or explicitly asks for the files, using `docs/plans/YYYY-MM-DD-w{W}-r{R}-<slug>/` with `00-overview.md` plus one or more `0N-<phase>.md` files.

## Approval Prompt Rule

After presenting the plan, separate the two user decisions:

- whether to save the plan file
- whether to start execution now

Do not imply that approving the plan automatically authorizes execution. Use compact wording that makes the choice explicit, such as:

- approve and save the plan only
- approve, save the plan, and start execution

If the user approves the plan without explicitly choosing execution, default to saving the plan only and stop.

## Workstream Rules

- Design workstreams to be delegation-ready first, not single-agent first.
- For context-heavy repos, prefer using the same delegation ladder during planning if the harness supports it: parallel agents, then subagents, then single-agent fallback.
- If delegation is available, the coordinator write scope is `none`.
- Assign every output-writing task to a worker, including shared docs such as `docs/prd/00-index.md`, `docs/prd/03-open-questions-and-risk-register.md`, `docs/prd/04-glossary.md`, and the rebuild backlog.
- Reserve a dedicated assembly worker for shared docs and a dedicated validation/fix worker for contract cleanup when the harness can support them.
- Describe workstreams, dependencies, and merge order.
- Do not hard-code Agent A, Agent B, or panel-specific assignments in the saved plan.
- Keep scopes disjoint so an execution harness can parallelize safely.
- The coordinator should never appear as the owner of document-writing tasks when delegation is available.

## Flat vs Nested Decision

Use a flat PRD tree when:

- the repo is small or medium
- the subsystem count is manageable
- one file per subsystem remains readable

Use a numbered subfolder when:

- a subsystem would become too large for one doc
- the repo has strong backend/frontend or service/domain boundaries
- a deep subsystem needs multiple docs but still needs one top-level number

## Handoff to Execution

Before leaving planning mode, make the execution prerequisites explicit:

- approved plan exists
- the user has not necessarily approved execution yet
- the session tool list is in the plan, and a missing index tool is accepted
- target output paths are fixed
- execution should use the delegation ladder by default: parallel agents, then subagents, then single-agent fallback
- if delegation is available, the coordinator write scope is `none`
- if `docs/prd/` already has active root entries, archival approval is required before execution can write the new PRD set
- workstreams are disjoint
- the output check is mandatory: the `check_decomposition` MCP tool, else `make-docs check decomposition`, else a manual review of the `## Check Rules` in `references/output-contract.md`

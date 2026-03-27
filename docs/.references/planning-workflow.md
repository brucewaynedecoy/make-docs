# Planning Workflow

## Purpose

Use this workflow to produce a reviewable plan before generating or evolving PRD documentation. Planning mode exists to lock the output structure, workstream boundaries, and validation approach before the repo is mutated.

This workflow supports three planning modes:

1. baseline PRD generation from a new idea or design
2. decomposition of an existing codebase into a fresh PRD set
3. active-set evolution through additive change, enhancement, revision, or removal

## Preflight

Inspect:

- the repo root and current documentation tree
- any existing plans, PRD docs, and work backlogs
- whether `docs/prd/` already contains active content outside `archive/`
- whether the user request is best classified as baseline generation, decomposition, or active-set evolution

If the request is ambiguous, infer the likely mode from the repo and prompt. Ask the user only when the ambiguity materially changes the output shape.

## Planning Goals

Produce a plan that makes the execution step decision-complete. The plan should settle:

- the execution mode
- the doc tree shape
- the fixed core docs plus adaptive docs or change docs
- whether execution requires an archive gate or an active-set evolution path
- the delegation tier and workstream split
- the coordinator role and write scope
- the backlog placement under `docs/work`
- the validation pass and any follow-up review

For active-set evolution, the plan should also settle:

- the change taxonomy (`addition`, `enhancement`, `revision`, `removal`)
- the impacted baseline docs
- the new numbered change docs that will be created
- the `### Change Notes` backlinks required in existing PRD docs
- whether a scoped delta backlog is sufficient or the user explicitly wants a regenerated full backlog

## User Preference Questions

Ask the user only when the answer affects the output shape or execution style. Typical planning questions include:

- whether a large subsystem should split into a numbered folder
- whether reference-style docs should stay separate from subsystem docs
- whether a change should stay a scoped delta or force a wider PRD rewrite
- whether the user explicitly wants a cleanup rewrite of baseline PRD text instead of the default non-destructive annotations
- whether the backlog should remain one file or move into a dated folder
- whether the user explicitly wants to forbid delegation and force single-agent execution despite the default

Do not ask questions that can be answered by repo inspection.

## Plan Structure

Start from the relevant template in `docs/.templates/`:

- `plan-prd.md` for baseline PRD generation from a new idea or design
- `plan-prd-decompose.md` for reverse-engineering an existing codebase into a fresh PRD set
- `plan-prd-change.md` for additive changes, enhancements, revisions, or removals within the active PRD namespace

Every plan should cover:

- repo summary
- output contract
- execution mode and PRD lifecycle handling
- coordinator policy and delegation tier
- planned document catalog
- worker ownership, write scopes, and dependencies
- MCP strategy and fallback strategy
- validation and review steps

Change plans should additionally cover:

- the change classification
- impacted baseline docs
- new change docs to be created
- required baseline annotations
- delta backlog scope

## File Writing Rule

Planning mode should present the plan in chat first.

Write only after approval, using the matching path:

- baseline or decomposition plan: `docs/plans/YYYY-MM-DD-{{PLAN NAME}}.md`
- change plan: `docs/plans/YYYY-MM-DD-{{CHANGE NAME}}-change-plan.md`

## Approval Prompt Rule

After presenting the plan, separate the two user decisions:

- whether to save the plan file
- whether to start execution now

Do not imply that approving the plan automatically authorizes execution. If the user approves the plan without explicitly choosing execution, default to saving the plan only and stop.

## Workstream Rules

- Design workstreams to be delegation-ready first, not single-agent first.
- For context-heavy repos, prefer using the same delegation ladder during planning if the harness supports it: parallel agents, then subagents, then single-agent fallback.
- If delegation is available, the coordinator write scope is `none`.
- Assign every output-writing task to a worker, including shared docs such as `docs/prd/00-index.md`, `docs/prd/03-open-questions-and-risk-register.md`, `docs/prd/04-glossary.md`, and the backlog.
- Reserve a dedicated assembly worker for shared docs and a dedicated validation or fix worker for contract cleanup when the harness can support them.
- Describe workstreams, dependencies, and merge order.
- Do not hard-code Agent A, Agent B, or panel-specific assignments in the saved plan.
- Keep scopes disjoint so an execution harness can parallelize safely.
- The coordinator should never appear as the owner of document-writing tasks when delegation is available.

For active-set evolution:

- keep change-doc authoring, baseline annotations, index updates, and delta backlog generation as separate write scopes whenever practical
- route cross-doc status updates and backlink validation to assembly or validation workers rather than the coordinator

## Flat Vs Nested Decision

Use a flat PRD tree when:

- the repo is small or medium
- the subsystem count is manageable
- one file per subsystem remains readable
- change docs can be appended cleanly without creating navigation debt

Use a numbered subfolder when:

- a subsystem would become too large for one doc
- the repo has strong backend or frontend or service or domain boundaries
- a deep subsystem needs multiple docs but still needs one top-level number

## Handoff To Execution

Before leaving planning mode, make the execution prerequisites explicit:

- approved plan exists
- the user has not necessarily approved execution yet
- MCP availability has been confirmed or fallback is accepted
- target output paths are fixed
- execution should use the delegation ladder by default: parallel agents, then subagents, then single-agent fallback
- if delegation is available, the coordinator write scope is `none`
- if the task is full-set replacement and `docs/prd/` already has active content, archival approval is required before execution can write the new PRD set
- if the task is active-set evolution, the plan names the new change docs, impacted baseline docs, annotation targets, and delta backlog scope
- workstreams are disjoint
- validation is mandatory

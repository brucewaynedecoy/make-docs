# Planning Workflow

See `.make-docs/system/references/wave-model.md` for W/R semantics and resolution rules.

## Purpose

Use this workflow to produce a reviewable plan before generating or maintaining PRD documentation. Planning mode exists to lock the output structure, workstream boundaries, and validation approach before the repo is mutated.

This workflow supports three planning modes:

1. baseline PRD generation from a new idea or design
2. decomposition of an existing codebase into a fresh PRD set
3. authoritative PRD maintenance for changed, deprecated, removed, or genuinely new product requirements

## Preflight

Inspect:

- the repo root and current documentation tree
- any `docs/assets/project/` inputs; if present, read them to hydrate the design and
  plan
- any referenced design docs and whether they include `## Intended Follow-On`
- the impact and Human Experience Intent in each applicable source design, using the [Human Experience Contract](../contracts/human-experience-contract.md) and [Human Experience Reference](human-experience.md)
- any `Coordinate Handoff` or source-lineage notes in referenced designs
- any existing plans, PRD docs, and work backlogs
- any history records for prior phases that the request revises, reworks, corrects, standardizes, or finishes
- whether `docs/prd/` already contains active content (archives live under `.make-docs/archive/prds/YYYY-MM-DD/`)
- whether the user request is best classified as baseline generation, decomposition, or authoritative PRD maintenance

If a referenced design doc includes `## Intended Follow-On`, treat that route as authoritative unless the user explicitly overrides it.

Treat architecture notes, diagrams, meeting notes, transcripts, sketches,
requirements, and similar source material as artifacts.
Use `docs/assets/project/` as the optional input home; do not create or require an
architecture-specific seed directory name.

Resolve the W/R coordinate using `.make-docs/system/references/wave-model.md` before writing. Explicit user guidance and source lineage from designs, prior plans, prior work backlogs, and history records take precedence over the highest existing wave. If source lineage points to an earlier wave but later unrelated waves exist, keep the lineage wave and increment its revision.

If the request is ambiguous, infer the likely mode from the repo, prompt, and explicit design handoff. Ask the user only when the ambiguity materially changes the output shape.

## Planning Goals

Produce a plan that makes the execution step decision-complete. The plan should settle:

- the execution mode
- the doc tree shape
- the fixed core docs plus adaptive product-authority docs
- whether execution requires an archive gate or an authoritative-maintenance path
- the delegation tier and workstream split
- the coordinator role and write scope
- the backlog placement under `docs/work/YYYY-MM-DD-w{W}-r{R}-<slug>/`
- the validation pass and any follow-up review
- for `direct` or `indirect` impact, a per-promise map to the owning PRD, affected human-facing surface or indirect effect, work phase, evidence source or selected testing type, and any accepted obligation
- for `none`, the preserved human boundary and the evidence that will prove it unchanged

For authoritative PRD maintenance, the plan should also settle:

- one `update-existing`, `create`, `link-only`, or `none` decision and reason for every candidate requirement
- the existing PRD owners and exact current sections to update
- the genuinely new capability, subsystem, or product-boundary PRDs to create, if any
- the standardized, non-normative requirement-history entries to add
- the affected links, risks, plans, work artifacts, and downstream source-authority relationships
- whether a scoped delta backlog is sufficient or the user explicitly wants a regenerated full backlog
- any deferred-obligation dispositions, material current human-experience uncertainties, proposed `NUAT-###` ownership for activated tests, and `not-needed-now` reasons needed before implementation

## Human Experience Planning

Use the accepted Human Experience Intent as a cross-cutting planning input. Keep the full standard in the canonical contract and reference. Do not copy it into the plan.

For `direct` or `indirect` impact, map each accepted promise to:

- the current or planned PRD that owns the capability;
- the affected human-facing surface or indirect human effect;
- the phase that implements it;
- the evidence source or testing type selected by current testing authority; and
- an accepted `O-###` obligation only when authorized work remains owed after the current closeout.

For `none`, state the human boundary that must remain unchanged and the evidence that will prove the boundary. Do not invent a human flow for a change with no human effect.

The map preserves the human goal through planning. It does not replace product requirements, testing decisions, specialist reviews, or the obligation register.

## User Preference Questions

Ask the user only when the answer affects the output shape or execution style. Typical planning questions include:

- whether a large subsystem should split into a numbered folder
- whether reference-style docs should stay separate from subsystem docs
- whether maintenance should stay a scoped delta or requires coordinated updates across several existing PRD owners
- whether an apparent new subject is coherent enough for its own product PRD or belongs in an existing owner
- whether the backlog directory should be scoped to a delta or regenerated as a full backlog
- whether the user explicitly wants to forbid delegation and force single-agent execution despite the default

Do not ask questions that can be answered by repo inspection. Do not ask the user which planning route to use when the referenced design docs already declare `## Intended Follow-On`, unless the user is explicitly reconsidering that route.

## Plan Structure

Plans are always directories. The chosen template describes the shape of the `00-overview.md` entry point inside the plan directory, plus the referenced `0N-<phase>.md` files.

Start from the relevant template in `.make-docs/system/templates/`:

- `plan-prd.md` for baseline PRD generation from a new idea or design
- `plan-prd-decompose.md` for reverse-engineering an existing codebase into a fresh PRD set
- `plan-prd-change.md` for authoritative maintenance of an existing PRD namespace

Every plan should cover:

- coordinate decision, including whether the plan is a new wave or a revision and the evidence used
- repo summary
- output contract
- execution mode and PRD lifecycle handling
- coordinator policy and delegation tier
- planned document catalog
- intended follow-on, including route, next step, why, and coordinate handoff
- worker ownership, write scopes, and dependencies
- MCP strategy and fallback strategy
- validation and review steps
- the Human Experience promise map or preserved `none` boundary, with links to the source design and canonical authority

PRD authority-maintenance plans should additionally cover:

- existing PRDs to update
- genuinely new product PRDs, if any
- requirement-history entries
- affected links, risks, plans, and work artifacts
- delta backlog scope and downstream authority links
- obligation routing, current-uncertainty planning, and separate testing decisions when Unassisted Goal Testing is implicated

## File Writing Rule

Planning mode should present the plan in chat first.

Plans are always directories. Write only after approval, using the matching path:

- baseline or decomposition plan: `docs/plans/YYYY-MM-DD-w{W}-r{R}-<slug>/` (with `00-overview.md` as the entry point and `0N-<phase>.md` files for each phase)
- PRD authority-maintenance plan: same directory pattern — `docs/plans/YYYY-MM-DD-w{W}-r{R}-<slug>/` — using a slug that identifies the maintenance scope (for example, `...-notification-delivery-maintenance`). Do not hard-code a `-change-plan` suffix.

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

For authoritative PRD maintenance:

- keep existing-owner updates, genuinely new product PRDs, shared index/risk updates, and delta backlog generation as separate write scopes whenever practical
- route cross-doc status updates and backlink validation to assembly or validation workers rather than the coordinator

## Flat Vs Nested Decision

Use a flat PRD tree when:

- the repo is small or medium
- the subsystem count is manageable
- one file per subsystem remains readable
- capability, subsystem, and reference authorities remain easy to navigate

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
- if the task is authoritative PRD maintenance, the plan names existing owners, any genuinely new product PRDs, requirement-history entries, affected links/risks/plans/work, and delta backlog scope
- workstreams are disjoint
- validation is mandatory
- the plan keeps each accepted Human Experience promise or preserved boundary traceable to current PRD authority, work, evidence, and any accepted obligation

Every plan `00-overview.md` includes `## Intended Follow-On` recommending PRD
generation as the next step.
That handoff is advisory-default-but-overridable: it is authoritative unless the
user explicitly overrides it, and it is not a gate or precondition.
Include:

- `Route:` `prd-generation`
- `Next step:` generate or update the PRD set from the plan
- `Why:` why the plan should become the product or documentation contract before
  backlog generation
- `Coordinate Handoff:` the W/R lineage the downstream PRD and work backlog
  should carry, or the coordinate question that must be resolved before writing

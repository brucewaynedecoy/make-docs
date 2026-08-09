# Execution Workflow

See `.make-docs/references/system/wave-model.md` for W/R semantics; archive rules are authoritative in `docs/assets/archive/AGENTS.md`.

## Purpose

Use this workflow to generate or maintain the active PRD namespace and the related backlog in a consistent way. Execution mode is allowed only after the user explicitly authorizes execution, either after plan approval or as direct execution from the start.

## Preconditions

Execution mode requires one of:

- an approved plan plus an explicit instruction to execute it
- a direct user instruction that explicitly authorizes immediate execution

If neither exists, switch back to planning mode.

## Execution Modes

Classify the task before writing:

1. `full-set generation` — create or replace the active PRD namespace from a plan, design, or decomposition workflow
2. `authoritative PRD maintenance` — update current product authorities in place and create a new PRD only for a coherent product subject with no current owner

Use `authoritative PRD maintenance` when a decision, design, implementation, or finding may change an existing requirement, establish a genuinely new capability, or deprecate or remove behavior already represented in the active PRD namespace.

In every mode, `docs/prd/` describes the current authoritative shape of the product and never the editorial operation used to change that authority.

## Preflight

1. Determine the highest usable delegation tier for the current session: parallel agents, then subagents, then single-agent fallback.
2. Re-check existing docs so you avoid duplicating or clobbering useful material.
3. Inspect `docs/prd/` and determine whether active root entries already exist outside the archive.
4. Classify the task as `full-set generation` or `authoritative PRD maintenance`.
5. If the task is authoritative PRD maintenance, identify current owner PRDs and genuinely ownerless product subjects before spawning authoring work.

## Delegation Ladder

- PRD work is delegation-first by default because this workflow is highly context-intensive.
- Use this priority order:
  1. parallel agents
  2. subagents
  3. single-agent fallback
- If the harness likely supports delegation, decide the workstream split and spawn workers before broad repo analysis or document drafting by the coordinator.
- If delegation is available, the coordinator write scope is `none`.
- The coordinating agent must not draft PRD docs, create backlog files, fill shared docs, run assembly sweeps, or perform fix-up edits when those tasks can be delegated.
- Any task that creates or edits output files must be assigned to a worker whenever delegation is available.
- Single-agent execution is the fallback only when the harness or session policy does not permit delegation.

## Coordinator Role

If delegation is available, the coordinator is limited to:

- capability and preflight checks
- approval handling
- workstream definition and task routing
- worker spawning and monitoring
- blocker resolution and reassignment
- final user-facing status reporting

If delegation is available, the coordinator must not:

- author PRD docs
- author backlog docs
- own shared-doc assembly
- merge glossary or risk-register content itself
- run validator-driven document fixes itself
- perform broad deep-dive reads that belong to a worker's authoring scope

## Full-Set Replacement Gate

Apply this gate only in `full-set generation` mode:

- Treat `docs/prd/` as a single active PRD namespace.
- If root entries already exist in `docs/prd/`, summarize them and ask for approval before moving them.
- On approval, archive every root entry into `docs/assets/archive/prds/YYYY-MM-DD/` or `docs/assets/archive/prds/YYYY-MM-DD-XX/`.
- Include stray or hidden root entries in the archive summary and move set when they are part of the active namespace.
- If archival is declined, stop before writing anything into `docs/prd/`.
- Treat archived PRD sets as historical records, not active output targets.

## Authoritative PRD Maintenance Gate

Apply this gate only in `authoritative PRD maintenance` mode:

- Do not archive the active PRD namespace.
- Assign `update-existing`, `create`, `link-only`, or `none` with a reason to every candidate requirement.
- Update current normative requirements inline in their existing owners.
- Determine the next available `NN-` number only when a coherent, wholesale new capability, subsystem, or product boundary has no suitable owner.
- Add standardized, non-normative `## Requirement History` entries when a material prior contract needs to remain visible.
- Express removals and deprecations as current scope, non-goal, limitation, status, or boundary text before recording history.
- Update `docs/prd/00-index.md` so current product ownership, status, focus, and navigation are accurate.
- Do not create PRDs whose filename, title, kind, or subject describes an editorial operation.

## Writing Order

### Full-set generation

1. Determine the delegation tier and spawn workstreams if supported.
2. Resolve the active-PRD archive gate if one is required.
3. Determine the final PRD catalog shape.
4. Route domain and subsystem docs to delegated workers.
5. Route shared-doc assembly for `00-index.md`, `03-open-questions-and-risk-register.md`, `04-glossary.md`, and the backlog to a dedicated worker.
6. Route contract validation and fix-up work to a dedicated validation worker.
7. Keep the coordinator focused on status, blockers, and final reporting.

### Authoritative PRD maintenance

1. Determine the delegation tier and spawn workstreams if supported.
2. Confirm candidate decisions, existing owner PRDs, and any genuinely new product subjects.
3. Route surgical current-requirement updates and requirement-history entries to existing-owner workers.
4. Route genuinely new product PRDs and shared index/risk updates to disjoint authoring or assembly workers when possible.
5. Route delta backlog generation to a dedicated worker.
6. Route product-authority, status, link, and traceability validation to a dedicated validation worker.
7. Keep the coordinator focused on status, blockers, and final reporting.

## Parallelization Rules

If the harness supports delegated workers, do not postpone delegation until the coordinator has already consumed most of its context budget.

- Prefer multiple concurrent workers when the harness supports parallel agents.
- If the harness does not support concurrent workers but does support delegated workers, use subagents before falling back to single-agent execution.
- Split work by subsystem or document family.
- Keep write scopes disjoint.
- Reserve final assembly, cross-linking, and validation for delegated workers, not the coordinator.
- Tell each spawned agent to build its own MCP indexes in its own session before deep analysis.

For authoritative PRD maintenance, prefer these separate write scopes when possible:

- existing owner PRD updates and requirement history
- genuinely new product-authority PRDs
- PRD index, risk register, and shared-doc status updates
- delta backlog generation
- validation and fix-up

## Existing Documentation Rule

- Supplement and cite useful existing docs.
- Do not silently overwrite docs that serve another audience or purpose.
- If existing docs drift from the code, record the drift in `03-open-questions-and-risk-register.md`.
- If the task is full-set generation and an older active PRD set already exists under `docs/prd/`, archive it to `docs/assets/archive/prds/YYYY-MM-DD/` before writing the replacement active PRD set.
- If the task is authoritative PRD maintenance, update the owning current requirement surgically and preserve material prior state only in non-normative requirement history.

## Work Backlog Source Authority

When generating or revising `docs/work/**`, use this authority order:

1. Explicit user direction plus the accepted design, plan, PRD, and existing work artifacts for the current coordinate.
2. Live repository contracts: `docs/work/AGENTS.md`, this workflow, `output-contract.md`, `wave-model.md`, and the current work templates.
3. Product/template source contracts when maintaining make-docs-owned shipped assets; dogfood copies validate those assets but do not replace their source.
4. Archived backlogs as examples of style or lineage only.
5. Bundled skill references, generated harness stubs, and mirrored or installed skill copies only when live repo contracts are unavailable or the task explicitly concerns those assets.

If a fallback source is used, record which fallback was used and why.

## Backlog Rules

- Work is always a directory in v2. Full-set generation writes `docs/work/YYYY-MM-DD-w{W}-r{R}-<slug>/` containing `00-index.md` plus `0N-<phase>.md` phase files.
- Authoritative PRD maintenance writes `docs/work/YYYY-MM-DD-w{W}-r{R}-<slug>/` as a delta backlog directory containing `00-index.md` plus `0N-<phase>.md` phase files.
- Plans use the same form: `docs/plans/YYYY-MM-DD-w{W}-r{R}-<slug>/` containing `00-overview.md` plus `0N-<phase>.md` phase files.
- Keep backlog phases dependency-ordered across the `0N-<phase>.md` files.
- In every stage, write `### Tasks` as markdown task list items using phase-local task IDs (`- [ ] t1: ...`, `- [x] t1: ...`) and write `### Acceptance criteria` as plain unordered bullets only.
- Increment task IDs across the entire phase file without resetting in later stages. Do not renumber existing task IDs when inserting or completing work.
- Include phase-level PRD traceability via `Source PRD Docs`.
- Delta backlogs cite the updated or genuinely new authoritative PRDs that constrain implementation. Maintenance plans provide sequencing and history provides provenance; neither replaces current PRD authority.

## Final Validation

Before closing the task:

1. Resolve broken links, missing core docs, missing required headings, or misplaced backlog files.
2. Confirm the PRD index reflects the final catalog, status, and lineage.
3. Confirm the backlog links to the relevant PRD docs.
4. For authoritative PRD maintenance, confirm current requirements are inline, history is non-normative, every new PRD is a coherent product authority, and delta backlog traceability points to current PRDs rather than retired change records.

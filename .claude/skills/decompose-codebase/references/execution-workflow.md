# Execution Workflow

## Purpose

Use this workflow to generate the approved PRD set and rebuild backlog in a consistent way. Execution mode is allowed only after the user explicitly authorizes execution, either after plan approval or as direct execution from the start.

## Preconditions

Execution mode requires one of:

- an approved decomposition plan plus an explicit instruction to execute it
- a direct user instruction that explicitly authorizes immediate execution

If neither exists, switch back to planning mode.

## Preflight

1. Re-run `scripts/probe_environment.py --format json`.
2. Confirm live MCP access for the current session.
3. If available, index docs with `jdocmunch` and code with `jcodemunch`.
4. Determine the highest usable delegation tier for the current session: parallel agents, then subagents, then single-agent fallback.
5. Re-check existing docs so you avoid duplicating or clobbering useful material.
6. Inspect `docs/prd/` and determine whether active root entries already exist. Archived PRD sets live under `docs/assets/archive/prds/`.

## Delegation Ladder

- Decomposition is delegation-first by default because this workflow is highly context-intensive.
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

- Treat `docs/prd/` as a single active PRD namespace.
- If root entries already exist in `docs/prd/`, summarize them and ask for approval before moving them.
- On approval, archive every root entry into `docs/assets/archive/prds/YYYY-MM-DD/` or `docs/assets/archive/prds/YYYY-MM-DD-XX/`.
- Include stray or hidden root entries in the archive summary and move set when they are part of the active namespace.
- If archival is declined, stop before writing anything into `docs/prd/`.
- Treat archived PRD sets as historical records, not active output targets.

## Writing Order

Use this order to reduce churn:

1. Determine the delegation tier and spawn workstreams if supported.
2. Resolve the active-PRD archive gate if one is required.
3. Determine the final PRD catalog shape.
4. Route domain and subsystem docs to delegated workers.
5. Route shared-doc assembly for `00-index.md`, `03-open-questions-and-risk-register.md`, `04-glossary.md`, and the backlog to a dedicated worker.
6. Route contract validation and fix-up work to a dedicated validation worker.
7. Keep the coordinator focused on status, blockers, and final reporting.

## Parallelization Rules

If the harness supports delegated workers, do not postpone delegation until the coordinator has already consumed most of its context budget.

- Prefer multiple concurrent workers when the harness supports parallel agents.
- If the harness does not support concurrent workers but does support delegated workers, use subagents before falling back to single-agent execution.
- Split work by subsystem or document family.
- Keep write scopes disjoint.
- Reserve final assembly, cross-linking, and validation for delegated workers, not the coordinator.
- Tell each spawned agent to build its own MCP indexes in its own session before deep analysis.

## MCP Rules

- Use indexed retrieval instead of repeated raw-file reads when MCP tools are available.
- Index once per session, not once per question.
- Re-index if the repo changes materially during a long execution.
- If only one of `jdocmunch` or `jcodemunch` is available, still use it and fall back for the missing half.

## Existing Documentation Rule

- Supplement and cite useful existing docs.
- Do not silently overwrite docs that serve another audience or purpose.
- If existing docs drift from the code, record the drift in `03-open-questions-and-risk-register.md`.
- Treat `03-open-questions-and-risk-register.md` as the living register for gap state, open questions, resolved decisions, confirmed drift, and rebuild risks.
- Do not create separate questions, decisions, risks, gaps, or architecture-decision files when the active PRD risk register exists unless the user explicitly asks for a new convention.
- Risk-register items use one `###` item heading with a `Status` / `Decision` / `Follow-Up` table, then `Question` or `Issue`, `Why it matters`, `Recommendation`, and `To close`.
- If an older active PRD set already exists under `docs/prd/`, archive it before writing the replacement active PRD set.

## Backlog Rules

- Work is always a directory in v2. Write the rebuild backlog to `docs/work/YYYY-MM-DD-w{W}-r{R}-<slug>/` with `00-index.md` plus one or more `0N-<phase>.md` files.
- Keep the backlog dependency-ordered across the `0N-<phase>.md` files.
- Include phase-level PRD traceability through `## Source PRD Docs`.
- Include task-level acceptance criteria in every stage.

## Final Validation

Before closing the task:

1. Run `scripts/validate_output.py --repo-root <repo-root>`.
2. Resolve broken links, missing core docs, missing required headings, or misplaced backlog files.
3. Confirm the PRD index reflects the final catalog.
4. Confirm the backlog links to the relevant PRD docs.

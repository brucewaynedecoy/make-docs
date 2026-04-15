# Decompose Codebase Skill

This document is the user-facing guide for the `decompose-codebase` skill. The skill itself lives at `skills/decompose-codebase/` and is written for agents. This doc explains what the skill does, how to use it across sessions, and what outputs to expect.

## What The Skill Does

`decompose-codebase` helps an agent reverse-engineer a repository into a consistent documentation set with two capabilities:

- planning the decomposition
- executing the decomposition

The skill is designed to keep those as separate steps by default. In most cases, the agent should produce a reviewed plan first and only perform the decomposition after that plan is approved and execution is explicitly authorized.

## Default Behavior

If the request is broad, the skill defaults to planning mode.

Planning mode is expected to:

- inspect the repository and current documentation
- check whether `jdocmunch` and `jcodemunch` are available in the current session
- ask for user preferences only when they affect the output structure
- present the plan in chat first
- write `docs/plans/YYYY-MM-DD-decomposition-plan.md` only after approval
- treat approval to save the plan as separate from approval to start execution

Execution mode is expected to:

- start from an approved plan plus an explicit instruction to execute it, or from an explicit direct-execution instruction
- re-check MCP availability in the current session
- use delegated workers first whenever the harness supports them: parallel agents first, subagents next, single-agent only as a fallback
- keep the coordinating agent in a non-authoring role whenever delegation is available
- use `jdocmunch` and `jcodemunch` if available
- generate the PRD set and rebuild backlog
- validate the final output structure before finishing

## MCP Behavior

The skill prefers `jdocmunch` and `jcodemunch` when they are available.

- `jdocmunch` is used for indexing and reading documentation efficiently.
- `jcodemunch` is used for indexing the codebase, browsing symbols, references, outlines, and dependencies.

Important: MCP availability is checked per session. A previous session having access does not guarantee that a new session will have access too. The skill re-checks availability every time it starts planning or execution.

If one or both MCP servers are unavailable, the skill should recommend them, ask whether to proceed, and then fall back to local repo exploration.

## Output Structure

The skill writes three kinds of artifacts:

- plans in `docs/plans/`
- one active PRD set in `docs/prd/`
- dated rebuild backlogs in `docs/work/`

The active PRD set is expected to include:

- `docs/prd/00-index.md`
- `docs/prd/01-product-overview.md`
- `docs/prd/02-architecture-overview.md`
- `docs/prd/03-open-questions-and-risk-register.md`
- `docs/prd/04-glossary.md`
- adaptive numbered subsystem and reference docs starting at `05-*`

Rebuild work belongs in `docs/work/`, not `docs/prd/`.

## Existing PRD Behavior

`docs/prd/` is treated as the location for exactly one active PRD set.

If execution finds active content already present in `docs/prd/`, the skill should:

- inspect and summarize the existing root entries
- ask for approval before archiving them
- move all root entries except `docs/prd/archive/` into a dated archive folder if approval is given
- stop before writing to `docs/prd/` if approval is not given

Archive paths follow this pattern:

- `docs/prd/archive/YYYY-MM-DD/`
- `docs/prd/archive/YYYY-MM-DD-XX/`

This keeps `docs/prd/` clean and ensures there is only one current PRD set at a time.

## Recommended Session Pattern

The most reliable workflow is:

1. start one session for planning
2. review and approve the plan
3. start a second session for execution
4. point the second session at the approved plan

This works well because execution mode re-checks MCP availability and re-indexes the repo in the new session when those servers are available.

If planning happens in one session and execution in another, approving and saving the plan does not itself authorize same-session execution. That helps keep the user choice clear.

For execution, the preferred pattern is delegation-first: the coordinating agent should split the work into disjoint workstreams and spawn workers early, rather than consuming most of the context window before delegation.

When delegation is available, the coordinating agent should not draft PRD docs, edit shared docs, build the backlog, or do assembly/fix-up sweeps itself. Those tasks should belong to delegated workers with explicit write scopes.

## Example Prompts

### Planning session

```text
Use `decompose-codebase` to plan the decomposition of this repository.

Inspect the repo and existing docs first. Check whether `jdocmunch` and `jcodemunch` are available in this session and use them if they are. Ask me only where a real preference affects the output structure. Present the decomposition plan in chat first, and do not write `docs/plans/...` until I approve it.
```

Expected handoff after the plan is presented:

```text
If you approve this plan, I can either save the plan only or save it and start execution. Which do you want?
```

### Execution session

```text
Use `decompose-codebase` to execute the approved decomposition plan at `docs/plans/YYYY-MM-DD-decomposition-plan.md`.

Treat the plan as approved and proceed with decomposition rather than re-planning unless you hit a real blocker. Re-check whether `jdocmunch` and `jcodemunch` are available in this session and use them if they are. This is a context-heavy decomposition task, so use delegated workers first: parallel agents if supported, otherwise subagents, and only fall back to single-agent execution if delegation is not available. Keep the coordinating agent in a routing-only role and assign all document-writing work, including shared docs, backlog assembly, and validation fixes, to delegated workers. Split the work into disjoint workstreams early instead of waiting until the context window is nearly full. Generate the PRD and work outputs according to the plan. If `docs/prd` already contains active PRD content, stop and ask before archiving it.
```

### Stricter execution variant

```text
Use `decompose-codebase` to execute the already-approved plan at `docs/plans/YYYY-MM-DD-decomposition-plan.md`. Do not create a new plan unless the existing one is unusable or conflicts with the repo state. Re-check MCP availability in this session and use `jdocmunch` and `jcodemunch` if available. This is a context-heavy decomposition task, so use delegated workers first: parallel agents if supported, otherwise subagents, and only fall back to single-agent execution if delegation is not available. Keep the coordinating agent in a routing-only role and assign all document-writing work, including shared docs, backlog assembly, and validation fixes, to delegated workers. Split the work into disjoint workstreams early instead of waiting until the context window is nearly full. If `docs/prd` already has active content, ask before archiving it.
```

## Related Files

- Skill entry point: `skills/decompose-codebase/SKILL.md`
- Output contract: `skills/decompose-codebase/references/output-contract.md`
- MCP guidance: `skills/decompose-codebase/references/mcp-playbook.md`
- Planning workflow: `skills/decompose-codebase/references/planning-workflow.md`
- Execution workflow: `skills/decompose-codebase/references/execution-workflow.md`

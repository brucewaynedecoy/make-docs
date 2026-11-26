---
title: Decomposing an Existing Codebase
path: skills
persona: user
status: draft
order: 20
tags:
  - skills
  - decomposition
  - prd
  - backlog
applies-to:
  - skills
  - docs
related:
  - "skills-installing-and-managing-skills.md"
  - "workflows-choosing-the-right-route-for-your-project.md"
  - "../maintainer/skills-catalog-and-distribution-model.md"
  - "../../prd/08-skills-catalog-and-distribution.md"
---

# Decomposing an Existing Codebase

This guide covers the user-facing workflow for the `decompose-codebase` skill: when to install it, how to invoke it, and what outputs to expect.

## What the skill is for

Use `decompose-codebase` when the repository already exists and the codebase is the main source of truth you need to reverse-engineer.

The skill is built for two distinct steps:

1. planning the decomposition
2. executing the approved decomposition

In normal use, planning happens first and execution starts only after the plan is approved.

## Install the skill

Enable the optional skill through the skills lifecycle:

```bash
make-docs setup skills --yes --selected-skills decompose-codebase
```

Preview the installation first if needed:

```bash
make-docs setup skills --dry-run --yes --selected-skills decompose-codebase
```

For the broader skills model, see [Installing and Managing Skills](skills-installing-and-managing-skills.md).

## Recommended session pattern

The most reliable pattern is a two-session flow:

1. use one session to create and review the decomposition plan
2. approve and save the plan
3. use a second session to execute the approved plan

This matters because each session has its own tools. A session that had a document index tool and a code index tool earlier does not guarantee a later session will have them too. The agent lists the tools of its session and writes them in the plan.

## Planning prompt

Use a planning request when you want the agent to inspect the repo, gather context, and produce an approval-ready plan before writing the decomposition outputs.

```text
Use `decompose-codebase` to plan the decomposition of this repository.

Inspect the repo and existing docs first. List the tools that this session gives you, and use a document index tool and a code index tool if you have them. Ask me only where a real preference affects the output structure. Present the decomposition plan in chat first, and do not write `docs/plans/...` until I approve it.
```

## Execution prompt

Use an execution request only after you have an approved plan or you intentionally want direct execution.

```text
Use `decompose-codebase` to execute the approved decomposition plan at `docs/plans/YYYY-MM-DD-decomposition-plan.md`.

Treat the plan as approved and proceed with decomposition rather than re-planning unless you hit a real blocker. List the tools that this session gives you, and use a document index tool and a code index tool if you have them. Generate the PRD and work outputs according to the plan. If `docs/prd` already contains active PRD content, stop and ask before archiving it.
```

## Expected outputs

The skill writes three classes of artifacts:

| Output class | Location |
| --- | --- |
| decomposition plan | `docs/plans/` |
| active PRD set | `docs/prd/` |
| rebuild backlog | `docs/work/` |

The expected PRD outcome includes:

- `docs/prd/00-index.md`
- `docs/prd/01-product-overview.md`
- `docs/prd/02-architecture-overview.md`
- `docs/prd/03-open-questions-and-risk-register.md`
- `docs/prd/04-glossary.md`
- adaptive numbered subsystem and reference docs starting at `05-*`

Rebuild work belongs in `docs/work/`, not in `docs/prd/`.

## Existing PRD behavior

The skill expects exactly one active PRD set in `docs/prd/`.

If active PRD content already exists, the skill should:

- inspect the current root entries
- summarize what is already there
- ask for approval before archiving it
- stop before writing new PRD docs if approval is not given

That approval step is part of the contract. The skill should not silently replace an active PRD set.

## Tool behavior

The skill prefers index tools when the session has them. It does not need a particular product:

- a document index tool for documentation indexing and reads
- a code index tool for code indexing, symbols, and dependency-aware exploration

If the session has no index tool, the skill can fall back to ordinary repo exploration. It installs nothing without your consent.

## Output check

Before it finishes, the skill checks the decomposition output. It uses the first way that works:

1. the Make Docs `check_decomposition` MCP tool
2. the `make-docs check decomposition` command
3. a manual review of the check rules in the Skill's output contract

Each finding names a rule ID, such as `decomposition.link.broken`. A manual result says that it is a manual review. It does not claim that a Make Docs check ran.

## Troubleshooting

### I already have an active PRD set

Expect the skill to stop and ask before archiving anything under `docs/prd/`.

### I want execution, but the agent started planning

Use an explicit execution prompt that points at the approved plan file.

### I want this behavior available in future projects too

Install the skill in global scope with the skills command instead of project scope.

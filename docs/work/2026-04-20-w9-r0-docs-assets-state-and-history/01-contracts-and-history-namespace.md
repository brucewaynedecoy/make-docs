# Phase 1: Contracts and History Namespace

> Derives from [Phase 1 of the plan](../../plans/2026-04-20-w9-r0-docs-assets-state-and-history/01-contracts-and-history-namespace.md).

## Purpose

Establish the `.assets` documentation namespace and update the session-history contract, template, and prompt before any history records are moved.

## Overview

This phase owns documentation authority. It should update the project docs and shippable template in parallel so new instructions, checked-in sources, and future CLI-rendered routers agree on `docs/.assets/history/` and `docs/.assets/starter-docs/`.

## Source PRD Docs

None. This backlog is derived from the `w9-r0` plan and design, not from an active PRD namespace.

## Source Plan Phases

- [01-contracts-and-history-namespace.md](../../plans/2026-04-20-w9-r0-docs-assets-state-and-history/01-contracts-and-history-namespace.md)

## Stage 1 - Revise the history contract

### Tasks

1. Update `docs/.references/agent-guide-contract.md` to describe agent-authored history records under `docs/.assets/history/`.
2. Mirror the same contract change into `packages/docs/template/docs/.references/agent-guide-contract.md`.
3. Change the required path to `docs/.assets/history/YYYY-MM-DD-<slug>.md`.
4. Remove guidance that requires `w{W}-r{R}-p{P}` in the filename.
5. Add the flexible YAML frontmatter model with recommended `client`, `model`, `date`, and `coordinate` fields.
6. Add optional `provider`, `repo`, `branch`, `status`, and `summary` fields.
7. Document that `coordinate` replaces separate `wave`, `revision`, `phase`, `stage`, and `task` frontmatter fields.
8. Formalize coordinate examples such as `W9 R0 P1` and `W9 R0 P1 S2 T4`.

### Acceptance criteria

- [ ] The repo contract names `docs/.assets/history/` as the required history path.
- [ ] The template contract names `docs/.assets/history/` as the required history path.
- [ ] The contract includes YAML frontmatter examples.
- [ ] The contract states that coordinate details are captured in one `coordinate` string.
- [ ] The contract no longer tells agents to create new records in `docs/guides/agent/`.

### Dependencies

- None.

## Stage 2 - Update the history template and prompt

### Tasks

1. Add a YAML frontmatter scaffold to `docs/.templates/agent-guide.md`.
2. Mirror the same template update into `packages/docs/template/docs/.templates/agent-guide.md`.
3. Keep the body focused on concise session history: `## Changes` and `## Documentation`.
4. Update `docs/.prompts/session-to-agent-guide.prompt.md` to route new records to `docs/.assets/history/`.
5. Mirror the prompt update into `packages/docs/template/docs/.prompts/session-to-agent-guide.prompt.md`.
6. Update prompt wording so filename W/R/P encoding is no longer required.
7. Ensure prompt wording tells agents to fill only known frontmatter fields and not invent unknown client/model/provider values.

### Acceptance criteria

- [ ] The repo history template includes frontmatter.
- [ ] The template copy includes the same frontmatter model.
- [ ] The repo prompt writes new records under `docs/.assets/history/`.
- [ ] The template prompt writes new records under `docs/.assets/history/`.
- [ ] The prompt preserves the concise breadcrumb style.

### Dependencies

- Stage 1.

## Stage 3 - Update shared references and routers

### Tasks

1. Update `docs/.references/wave-model.md` and the template copy to replace the old agent guide path with the new history path.
2. Update `docs/.references/output-contract.md` and the template copy so required-path tables refer to agent history records under `docs/.assets/history/`.
3. Update `docs/.references/guide-contract.md` and the template copy to stop describing agent records as a `docs/guides/agent/` guide subtype.
4. Update `docs/AGENTS.md` and `docs/CLAUDE.md` to route history work to `docs/.assets/history/`.
5. Update `packages/docs/template/docs/AGENTS.md` and `CLAUDE.md` with matching routing.
6. Update `docs/guides/AGENTS.md` and `docs/guides/CLAUDE.md` so guides are limited to user and developer guide work.
7. Mirror guide-router changes into `packages/docs/template/docs/guides/AGENTS.md` and `CLAUDE.md`.

### Acceptance criteria

- [ ] `wave-model.md` uses the new history path.
- [ ] `output-contract.md` uses the new history path.
- [ ] `guide-contract.md` no longer references `docs/guides/agent/` as an active guide subtype.
- [ ] Root routers direct history work to `docs/.assets/history/`.
- [ ] Guide routers no longer route agent session history.

### Dependencies

- Stage 1.

## Stage 4 - Create `.assets` router files

### Tasks

1. Create `docs/.assets/AGENTS.md` and `docs/.assets/CLAUDE.md` as top-level operational-assets routers.
2. Create `docs/.assets/history/AGENTS.md` and `docs/.assets/history/CLAUDE.md` as history-specific routers.
3. Create `docs/.assets/starter-docs/AGENTS.md` and `docs/.assets/starter-docs/CLAUDE.md` as CLI-state routers.
4. Mirror all six router files under `packages/docs/template/docs/.assets/`.
5. Keep router wording minimal: what belongs there, which contract/template to read, and what not to hand-edit.
6. Do not create `docs/.assets/memories/` or `docs/.assets/preferences/`.

### Acceptance criteria

- [ ] Repo `.assets` routers exist.
- [ ] Template `.assets` routers exist.
- [ ] History routers point to `docs/.references/agent-guide-contract.md` and `docs/.templates/agent-guide.md`.
- [ ] Starter-docs routers identify `docs/.assets/starter-docs/` as CLI-managed state.
- [ ] No deferred namespaces are created.

### Dependencies

- Stages 1-3.

## Stage 5 - Validate contract namespace changes

### Tasks

1. Run an exact-match search across active contracts, templates, prompts, and routers for `docs/guides/agent`.
2. Run an exact-match search across active contracts, templates, prompts, and routers for `docs/.assets/history`.
3. Check relative links introduced by this phase.
4. Run `git diff --check`.

### Acceptance criteria

- [ ] Active contract/template/prompt/router files no longer direct new history records to `docs/guides/agent/`.
- [ ] Active contract/template/prompt/router files mention `docs/.assets/history/` where history routing is needed.
- [ ] Relative links introduced by this phase resolve.
- [ ] `git diff --check` passes.

### Dependencies

- Stages 1-4.

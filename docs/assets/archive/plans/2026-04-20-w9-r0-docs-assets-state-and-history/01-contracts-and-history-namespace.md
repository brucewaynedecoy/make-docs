# Phase 1 - Contracts and History Namespace

## Objective

Establish the `.assets` documentation namespace and update the session-history contract, template, and prompt so later phases can move generated history records without ambiguity.

## Depends On

- [2026-04-20-docs-assets-state-and-history.md](../../designs/2026-04-20-docs-assets-state-and-history.md)
- The current `docs/.references/agent-guide-contract.md`, `docs/.templates/agent-guide.md`, and `docs/.prompts/session-to-agent-guide.prompt.md`
- The checked-in template copies under `packages/docs/template/docs/`

## Files to Modify

| File | Change Summary |
| ---- | -------------- |
| `docs/.references/agent-guide-contract.md` | Reframe agent-authored breadcrumbs as history records under `docs/.assets/history/`; add YAML frontmatter and `coordinate` rules. |
| `docs/.templates/agent-guide.md` | Add optional YAML frontmatter scaffold and update body wording for history records. |
| `docs/.prompts/session-to-agent-guide.prompt.md` | Route new session summaries to `docs/.assets/history/` and instruct agents to use frontmatter. |
| `docs/.references/wave-model.md` | Replace the agent guide path with `docs/.assets/history/` and describe combined display coordinates for history frontmatter. |
| `docs/.references/output-contract.md` | Update required-path tables from agent session guide to agent history record. |
| `docs/.references/guide-contract.md` | Remove obsolete statements that agent records are a guide subtype under `docs/guides/agent/`. |
| `docs/AGENTS.md` and `docs/CLAUDE.md` | Route history work to `docs/.assets/history/` and leave `docs/guides/` for user/developer guides. |
| `docs/guides/AGENTS.md` and `docs/guides/CLAUDE.md` | Remove agent-history routing from guides and clarify that guides are user/developer-facing. |
| `docs/.assets/AGENTS.md` and `docs/.assets/CLAUDE.md` | Create top-level assets routers. |
| `docs/.assets/history/AGENTS.md` and `docs/.assets/history/CLAUDE.md` | Create history-specific routers. |
| `docs/.assets/config/AGENTS.md` and `docs/.assets/config/CLAUDE.md` | Create CLI-state-specific routers that explain state ownership and editing cautions. |
| `packages/docs/template/docs/**` matching the files above | Apply the same source-template changes so future installs receive the new contract and routers. |

## Detailed Changes

### 1. Update the history contract without renaming it

Keep the existing `agent-guide-contract.md` path in this wave to avoid unnecessary asset-pipeline churn. Change its content to make clear that the artifact is now an agent history record, not a guide.

The required path becomes:

```text
docs/.assets/history/YYYY-MM-DD-<slug>.md
```

The filename no longer needs to encode `w{W}-r{R}-p{P}` because the coordinate is captured in frontmatter.

### 2. Add flexible YAML frontmatter

The contract and template should show recommended fields when known:

```yaml
---
client: "Codex Desktop"
model: "gpt-5.4"
date: "2026-04-20"
coordinate: "W9 R0 P1"
---
```

Optional fields include:

```yaml
provider: "OpenAI"
repo: "make-docs"
branch: "main"
status: "completed"
summary: "Short summary of the session."
```

Fields are optional except where the session knows them. The template should not imply that every history record must contain every possible measurement field.

### 3. Formalize the combined coordinate

Use one string field named `coordinate`. Do not add separate `wave`, `revision`, `phase`, `stage`, or `task` frontmatter fields.

Valid examples:

```yaml
coordinate: "W9 R0 P1"
coordinate: "W9 R0 P1 S2 T4"
```

The contract should restate the hierarchy:

- A wave may contain multiple revisions.
- A revision may contain multiple phases.
- A phase may contain multiple stages.
- A stage may contain multiple tasks.

Unknown deeper levels are omitted.

### 4. Add `.assets` routers

Create minimal router instructions:

- `docs/.assets/AGENTS.md` and `docs/.assets/CLAUDE.md` route to `history/` and `make-docs/`.
- `docs/.assets/history/AGENTS.md` and `CLAUDE.md` point to `docs/.references/agent-guide-contract.md` and `docs/.templates/agent-guide.md`.
- `docs/.assets/config/AGENTS.md` and `CLAUDE.md` explain that this namespace is CLI-managed state and should not be hand-edited except for deliberate recovery or diagnostics.

### 5. Remove guide-router responsibility for history

Update root and guides routers so:

- `docs/` routes history requests to `docs/.assets/history/`.
- `docs/guides/` only routes user and developer guides.
- No active router tells agents to create session records under `docs/guides/agent/`.

## Parallelism

The project-root docs and `packages/docs/template/docs/` copies can be updated in parallel as long as the final contents stay intentionally aligned. Do not move existing history files in this phase.

## Acceptance Criteria

- [ ] `docs/.references/agent-guide-contract.md` describes history records under `docs/.assets/history/`.
- [ ] `docs/.templates/agent-guide.md` includes YAML frontmatter with `client`, `model`, `date`, and `coordinate` examples.
- [ ] The prompt writes new records to `docs/.assets/history/`.
- [ ] `wave-model.md`, `output-contract.md`, and `guide-contract.md` no longer define agent records under `docs/guides/agent/`.
- [ ] `.assets`, `.assets/history`, and `.assets/config` routers exist in both repo docs and the package template.
- [ ] Root and guide routers no longer direct new session summaries to `docs/guides/agent/`.

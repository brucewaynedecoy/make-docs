# History Record Contract

## Purpose

Use this contract for session history records under `docs/.assets/history/`.

History records are **breadcrumbs**: concise, point-in-time references for a future auditor. A reader should be able to skim one and know what was touched and why, then follow links to deeper detail. They are not verbose narratives and not live logs.

## Required Path

- When wave, revision, and phase are known: `docs/.assets/history/YYYY-MM-DD-w{W}-r{R}-p{P}-<slug>.md`
- When only wave and revision are known: `docs/.assets/history/YYYY-MM-DD-w{W}-r{R}-<slug>.md`
- When no coordinate is known: `docs/.assets/history/YYYY-MM-DD-<slug>.md`

Use today's date in `YYYY-MM-DD`. Never backdate.

## Frontmatter

Use flexible YAML frontmatter. Include fields when the session knows them and omit fields when it does not. Do not invent unknown `client`, `model`, or `provider` values.

Recommended fields when known:

```yaml
---
client: "Codex Desktop"
model: "gpt-5.4"
date: "2026-04-20"
coordinate: "W9 R0 P1"
---
```

Useful optional dimensions:

```yaml
provider: "OpenAI"
repo: "make-docs"
branch: "main"
status: "completed"
summary: "Updated history routing and documentation contracts."
```

The `coordinate` field replaces separate `wave`, `revision`, `phase`, `stage`, and `task` frontmatter fields.

## Naming Components

| Component | Meaning |
| --- | --- |
| `YYYY-MM-DD` | Date the session summary is written. |
| `w{W}-r{R}-p{P}` | Coordinate prefix for phase-scoped work when wave, revision, and phase are known. |
| `w{W}-r{R}` | Coordinate prefix when only wave and revision are known. |
| `<slug>` | Lowercase, hyphens only, no special characters. Default is `summary`. Use a more specific slug (for example `auth-refactor`) when the session's focus is narrower. |

Encode known wave/revision/phase position in the filename for phase-scoped history records. Keep stage and task detail only in `coordinate` frontmatter, not in filenames. Do not invent missing coordinate levels.

## Coordinate Rules

See `docs/.references/wave-model.md` for W/R/P semantics and general resolution rules. The rules below are specific to history records and extend (do not replace) the general model.

Coordinates use one combined abbreviation that captures as much positioning as is known for the session:

```yaml
coordinate: "W9 R0 P1"
```

When deeper granularity is known, append stage and task suffixes:

```yaml
coordinate: "W9 R0 P1 S2 T4"
```

Unknown deeper levels should be omitted rather than filled with placeholders.

## Required Headings

Each history record must include, in order:

- `# {{TITLE}}` — level-1 title capturing the session focus.
- `## Changes` — free-form prose, markdown tables, and/or file trees summarizing what was touched. May use sub-headings.
- `## Documentation` — contains all required sub-sections below.
  - `### Project`
  - `### Developer`
  - `### User`

## Documentation Tables

All sub-sections under `## Documentation` are markdown tables with columns `Path` and `Description`.

- `### Project` — project-level documentation created or updated in the session: READMEs, agent instructions (`AGENTS.md`/`CLAUDE.md`), designs, plans, work backlogs, and reference or template files.
- `### Developer` — developer guides created or updated in the session.
- `### User` — user guides created or updated in the session.

If a sub-section has no entries, state `None this session.` in place of the table.

Example:

```markdown
## Documentation

### Project

| Path | Description |
| --- | --- |
| [docs/designs/2026-04-16-w2-r0-auth-redesign.md](../../designs/2026-04-16-w2-r0-auth-redesign.md) | New design for the auth module redesign. |

### Developer

| Path | Description |
| --- | --- |
| [docs/guides/developer/auth-module.md](../developer/auth-module.md) | New developer reference for the auth module. |

### User

None this session.
```

## When to Create

Create a history record:

- at the end of a work session,
- on an explicit "summarize this session" request, or
- at a meaningful checkpoint.

History records are written once at the end of the relevant span. Do not maintain them as live logs during the session.

## Update Rules

- Each session gets its own new file. History records are immutable breadcrumbs.
- Edit a prior history record in place only to correct factual errors.
- Never append new session work to a prior session's summary; write a new file instead.

## Link Rules

- Use relative Markdown links when referencing specific files, plans, designs, or work items that the session touched.
- Make sure every internal link resolves.
- Link back to the active plan, design, or backlog phase that frames the session whenever one exists.

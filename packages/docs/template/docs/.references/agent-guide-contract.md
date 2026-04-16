# Agent Guide Contract

## Purpose

Use this contract for agent-authored session summaries under `docs/guides/agent/`.

Agent guides are **breadcrumbs**: concise, point-in-time references for a future auditor. A reader should be able to skim one and know what was touched and why, then follow links to deeper detail. They are not verbose narratives and not live logs.

## Required Path

- `docs/guides/agent/YYYY-MM-DD-w{W}-r{R}-p{P}-<slug>.md`

Use today's date in `YYYY-MM-DD`. Never backdate.

## Naming Components

| Component | Meaning |
| --- | --- |
| `YYYY-MM-DD` | Date the session summary is written. |
| `w{W}` | Wave number. A wave is one end-to-end iteration: design → plan → work cycle. Wave 1 is the initial wave. |
| `r{R}` | Revision within the wave. `r0` is the initial revision; `r1+` are subsequent revisions. |
| `p{P}` | Phase within the active plan or work backlog. |
| `<slug>` | Lowercase, hyphens only, no special characters. Default is `summary`. Use a more specific slug (for example `auth-refactor`) when the session's focus is narrower. |

This W/R/P encoding is piloted here ahead of broader adoption across designs, plans, and work in a future `starter-docs` iteration. The encoding is forward-compatible.

## W/R/P Resolution Rules

See `docs/.references/wave-model.md` for W/R/P semantics and general resolution rules. The rules below are specific to agent session guides and extend (do not replace) the general model.

Resolve `w{W}-r{R}-p{P}` in this order:

1. If the active plan or work backlog encodes `w{W}-r{R}-p{P}` in its path or filenames, match those values.
2. Else if prior files exist in `docs/guides/agent/`, continue the active wave and revision and increment the phase.
3. Else default to `w1-r0-p1` and add a blockquote note at the top of the file:

   ```markdown
   > Note: No active wave context detected; defaulted to w1-r0-p1.
   ```

## Required Headings

Each agent guide must include, in order:

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

Create an agent guide:

- at the end of a work session,
- on an explicit "summarize this session" request, or
- at a meaningful checkpoint.

Agent guides are written once at the end of the relevant span. Do not maintain them as live logs during the session.

## Update Rules

- Each session gets its own new file. Agent guides are immutable breadcrumbs.
- Edit a prior guide in place only to correct factual errors.
- Never append new session work to a prior session's summary; write a new file instead.

## Link Rules

- Use relative Markdown links when referencing specific files, plans, designs, or work items that the session touched.
- Make sure every internal link resolves.
- Link back to the active plan, design, or backlog phase that frames the session whenever one exists.

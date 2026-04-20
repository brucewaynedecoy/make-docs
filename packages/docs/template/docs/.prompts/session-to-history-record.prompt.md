___
name: Session to History Record
description: Instructs the agent to summarize the current session into a new dated history record under `docs/.assets/history/`.
___

Please summarize this session into a new history record.

Before writing anything, read `docs/.references/history-record-contract.md`, `docs/.templates/history-record.md`, and the router at `docs/.assets/history/AGENTS.md` (or `CLAUDE.md`). Do not restate their rules — follow them.

Use today's date for `YYYY-MM-DD` and never backdate. If the active plan or work context gives a known position, record it in one `coordinate` frontmatter field such as `W9 R0 P1` or `W9 R0 P1 S2 T4`; omit unknown coordinate levels.

Create a new file at `docs/.assets/history/YYYY-MM-DD-<slug>.md` (default slug `summary`). Fill only known frontmatter fields; do not invent unknown `client`, `model`, or `provider` values. Follow the required headings exactly: `## Changes`, then `## Documentation` containing `### Project`, `### Developer`, and `### User` tables. State `None this session.` for any empty sub-section.

Keep the summary concise — breadcrumbs for a future auditor, not a verbose narrative. Use relative Markdown links to any touched files, plans, designs, or backlog phases.

Optional hints (leave blank to accept defaults):

- Focus: {{FOCUS}}
- Slug: {{SLUG}}

___
name: Session to Agent Guide
description: Instructs the agent to summarize the current session into a new dated agent guide under `docs/guides/agent/`.
___

Please summarize this session into a new agent guide.

Before writing anything, read `docs/.references/agent-guide-contract.md`, `docs/.templates/agent-guide.md`, and the router at `docs/guides/agent/AGENTS.md` (or `CLAUDE.md`). Do not restate their rules — follow them.

Resolve the `w{W}-r{R}-p{P}` components using the contract's resolution rules. If no active wave context exists, default to `w1-r0-p1` and include the `> Note:` blockquote at the top of the file. Use today's date for `YYYY-MM-DD` and never backdate.

Create a new file at `docs/guides/agent/YYYY-MM-DD-w{W}-r{R}-p{P}-<slug>.md` (default slug `summary`). Follow the required headings exactly: `## Changes`, then `## Documentation` containing `### Developer` and `### User` tables. State `None this session.` for any empty sub-section.

Keep the summary concise — breadcrumbs for a future auditor, not a verbose narrative. Use relative Markdown links to any touched files, plans, designs, or backlog phases.

Optional hints (leave blank to accept defaults):

- Focus: {{FOCUS}}
- Slug: {{SLUG}}

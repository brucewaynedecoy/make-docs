___
name: Session to History Record
description: Instructs the agent to summarize the current session into a new dated history record under `docs/assets/archive/history/`.
___

When generating or materially rewriting make-docs documents, include PRD 23 YAML frontmatter: common `title`, `kind`, and `status`; add `coordinate`, `persona`, `source`, `lifecycle`, and `follow_on` only when their conditions apply; omit unknown coordinate levels rather than inserting placeholders.

Please summarize this session into a new history record.

Before writing anything, read `.make-docs/contracts/system/history-record-contract.md`, `.make-docs/contracts/system/coverage-pass-contract.md`, `.make-docs/templates/system/history-record.md`, and the router at `docs/assets/archive/AGENTS.md` (or `CLAUDE.md`). Do not restate their rules — follow them.

If this history record is part of a coverage pass, apply the history idempotency rule in `coverage-pass-contract.md` before deciding whether to create a new file or update the current session's record.

Use today's date for `YYYY-MM-DD` and never backdate. If the active plan or work context gives a known position, record it in one `coordinate` frontmatter field such as `W9 R0 P1` or `W9 R0 P1 S2 T4`; omit unknown coordinate levels.

Create a new file under `docs/assets/archive/history/` (default slug `summary`). If W/R/P is known, name it `YYYY-MM-DD-w{W}-r{R}-p{P}-<slug>.md`. If only W/R is known, name it `YYYY-MM-DD-w{W}-r{R}-<slug>.md`. If no coordinate is known, name it `YYYY-MM-DD-<slug>.md`. Fill only known frontmatter fields; do not invent unknown `client`, `model`, or `provider` values. Follow the required headings exactly: `## Changes`, then `## Documentation` containing `### Project`, `### Developer`, and `### User` tables. State `None this session.` for any empty sub-section.

Keep the summary concise — breadcrumbs for a future auditor, not a verbose narrative. Use relative Markdown links to any touched files, plans, designs, or backlog phases.

Optional hints (leave blank to accept defaults):

- Focus: {{FOCUS}}
- Slug: {{SLUG}}

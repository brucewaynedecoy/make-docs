# History Assets Router

This directory stores session history records.
- Before writing, read `docs/.references/history-record-contract.md` and `docs/.templates/history-record.md`.
- When W/R/P is known, create records at `docs/.assets/history/YYYY-MM-DD-w{W}-r{R}-p{P}-<slug>.md`.
- If only W/R is known, create records at `docs/.assets/history/YYYY-MM-DD-w{W}-r{R}-<slug>.md`.
- If no coordinate is known, create records at `docs/.assets/history/YYYY-MM-DD-<slug>.md`.
- Keep stage and task detail only in `coordinate` frontmatter, not filenames.
- Include only known frontmatter fields; do not invent unknown client, model, or provider values.
- Keep records concise: breadcrumbs for a future auditor, not live logs.
- Use relative Markdown links when referencing files touched during the session.

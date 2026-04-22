---
date: "{{YYYY-MM-DD}}"
client: "{{CLIENT}}"
model: "{{MODEL}}"
coordinate: "{{COORDINATE}}"
# provider: "{{PROVIDER}}"
# repo: "{{REPO}}"
# branch: "{{BRANCH}}"
# status: "{{STATUS}}"
# summary: "{{ONE_LINE_SUMMARY}}"
---
<!-- Remove unknown frontmatter keys instead of leaving placeholders or inventing values. -->
<!-- Filename: docs/assets/history/YYYY-MM-DD-w{W}-r{R}-p{P}-<slug>.md when W/R/P is known. If only W/R is known, omit p{P}; if no coordinate is known, use YYYY-MM-DD-<slug>.md. Keep stage/task details only in coordinate frontmatter. -->

# {{TITLE}}

## Changes

Summarize what was touched this session. Use prose, a short file tree, a table, or optional sub-sections — whichever best fits the work.

```text
{{REPO_ROOT}}/
└── {{PATH_TOUCHED}}
```

| Area | Summary |
| --- | --- |
| {{AREA}} | {{ONE_LINE_SUMMARY}} |

## Documentation

### Project

Project-level docs: READMEs, agent instructions, designs, plans, work backlogs, references, or templates.

| Path | Description |
| --- | --- |
| {{DOCS_PATH}} | {{ONE_LINE_DESCRIPTION}} |

If none, state "None this session."

### Developer

Docs intended for engineers, maintainers, or internal contributors.

| Path | Description |
| --- | --- |
| {{DOCS_PATH}} | {{ONE_LINE_DESCRIPTION}} |

If none, state "None this session."

### User

Docs intended for end users, operators, or external readers.

| Path | Description |
| --- | --- |
| {{DOCS_PATH}} | {{ONE_LINE_DESCRIPTION}} |

If none, state "None this session."

# Phase 1: Guide Structure Contract — Authority and Templates

## Changes

Created the three foundational files for the guide structure contract in the template package (`packages/docs/template/`).

| Area | Summary |
| --- | --- |
| Reference file | Created `guide-contract.md` — 9 sections defining frontmatter schema, slug convention, path rules, status lifecycle, scope, cross-audience rules, and link rules. |
| Developer template | Created `guide-developer.md` — YAML frontmatter skeleton with placeholder tokens, blockquote referencing the contract, 6 suggested developer-audience headings. |
| User template | Created `guide-user.md` — YAML frontmatter skeleton matching the developer template, 6 suggested user-audience headings. |

Files created:

```text
packages/docs/template/
└── docs/
    ├── .references/
    │   └── guide-contract.md        (new)
    └── .templates/
        ├── guide-developer.md       (new)
        └── guide-user.md            (new)
```

All three files are scoped-static assets — they ship as-is in the template and are not dynamically rendered by the CLI.

## Documentation

### Project

| Path | Description |
| --- | --- |
| [docs/work/2026-04-16-w2-r0-guide-structure-contract/01-authority-and-templates.md](../../work/2026-04-16-w2-r0-guide-structure-contract/01-authority-and-templates.md) | Work backlog phase — acceptance criteria checked off. |

### Developer

None this session.

### User

None this session.

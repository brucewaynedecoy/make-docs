---
date: "2026-04-16"
coordinate: "W2 R0 P2"
---

# Phase 2: Guide Structure Contract — Router Updates

## Changes

Updated six router/instruction files (three AGENTS.md/CLAUDE.md pairs) in the template package to reference the new guide contract and templates.

| Area | Summary |
| --- | --- |
| Guide-level routers | Replaced full content of `docs/guides/AGENTS.md` and `CLAUDE.md` — added bold audience labels, contract and template references for developer/user guides, explicit agent guide exemption, trimmed quality paragraph. |
| Docs-level routers | Updated the guides routing line in `docs/AGENTS.md` and `CLAUDE.md` — now references `guide-contract.md` and guide templates for developer/user guides; shortened "Agent session summary breadcrumbs" to "Agent session summaries". |
| Templates-level routers | Updated template listing in `docs/.templates/AGENTS.md` and `CLAUDE.md` — added `guide-developer.md` and `guide-user.md` between `design.md` and the `plan-*`/`prd-*`/`work-*` families. |

All six files verified byte-identical within their AGENTS.md/CLAUDE.md pairs.

Files modified:

```text
packages/docs/template/
└── docs/
    ├── AGENTS.md                    (updated)
    ├── CLAUDE.md                    (updated)
    ├── .templates/
    │   ├── AGENTS.md                (updated)
    │   └── CLAUDE.md                (updated)
    └── guides/
        ├── AGENTS.md                (updated)
        └── CLAUDE.md                (updated)
```

## Documentation

### Project

| Path | Description |
| --- | --- |
| [docs/work/2026-04-16-w2-r0-guide-structure-contract/02-router-updates.md](../../work/2026-04-16-w2-r0-guide-structure-contract/02-router-updates.md) | Work backlog phase — acceptance criteria checked off. |

### Developer

None this session.

### User

None this session.

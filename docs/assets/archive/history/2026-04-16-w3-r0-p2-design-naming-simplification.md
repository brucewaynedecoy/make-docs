---
date: "2026-04-16"
coordinate: "W3 R0 P2"
---

# Phase 2: Design Naming Simplification — Template and Routers

## Changes

Updated the design document template and design directory routers in the template package to reflect the simplified `YYYY-MM-DD-<slug>.md` naming convention.

| Area | Summary |
| --- | --- |
| `design.md` template | Updated filename blockquote from `YYYY-MM-DD-w{W}-r{R}-<slug>.md` to `YYYY-MM-DD-<slug>.md`. Changed reference from `wave-model.md` to `design-contract.md`. |
| Design directory routers | Updated naming convention pattern and example in `designs/AGENTS.md` and `CLAUDE.md`. Removed wave-model.md reference line. Both files verified byte-identical. |

Files modified:

```text
packages/docs/template/docs/
├── .templates/
│   └── design.md                (updated)
└── designs/
    ├── AGENTS.md                (updated)
    └── CLAUDE.md                (updated)
```

## Documentation

### Project

| Path | Description |
| --- | --- |
| [docs/assets/archive/work/2026-04-16-w3-r0-design-naming-simplification/02-template-and-routers.md](../archive/work/2026-04-16-w3-r0-design-naming-simplification/02-template-and-routers.md) | Work backlog phase — acceptance criteria checked off. |

### Developer

None this session.

### User

None this session.

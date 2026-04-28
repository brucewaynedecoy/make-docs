---
date: "2026-04-16"
coordinate: "W3 R0 P1"
---

# Phase 1: Design Naming Simplification — Template References and Contract

## Changes

Updated three reference files in the template package (`packages/docs/template/docs/assets/references/`) to exempt designs from W/R encoding and simplify the design naming pattern to `YYYY-MM-DD-<slug>.md`.

| Area | Summary |
| --- | --- |
| `wave-model.md` | Removed Design row from Naming Patterns table (8 → 7 rows). Removed `docs/designs/` from Resolution Rules opening and step 2. Added `## Design Exemption` section after `## PRD Exemption`. |
| `design-contract.md` | Updated Required Path from `YYYY-MM-DD-w{W}-r{R}-<slug>.md` to `YYYY-MM-DD-<slug>.md`. Replaced wave-model.md reference with inline date/slug description. |
| `design-workflow.md` | Replaced all occurrences of `w{W}-r{R}` in path patterns (2 occurrences). Removed standalone wave-model.md reference line. Updated validation checklist to simplified pattern. |

Files modified:

```text
packages/docs/template/docs/assets/references/
├── wave-model.md            (updated)
├── design-contract.md       (updated)
└── design-workflow.md       (updated)
```

Verified: zero occurrences of `w{W}-r{R}` remain in design-related path patterns across all three files.

## Documentation

### Project

| Path | Description |
| --- | --- |
| [docs/assets/archive/work/2026-04-16-w3-r0-design-naming-simplification/01-template-references-and-contract.md](../archive/work/2026-04-16-w3-r0-design-naming-simplification/01-template-references-and-contract.md) | Work backlog phase — acceptance criteria checked off. |

### Developer

None this session.

### User

None this session.

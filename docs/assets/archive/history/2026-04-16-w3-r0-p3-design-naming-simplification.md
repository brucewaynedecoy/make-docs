---
date: "2026-04-16"
coordinate: "W3 R0 P3"
---

# Phase 3: Design Naming Simplification — CLI Renderers

## Changes

Updated three design-related renderer functions in `packages/cli/src/renderers.ts` to emit the simplified `YYYY-MM-DD-<slug>.md` path pattern instead of `YYYY-MM-DD-w{W}-r{R}-<slug>.md`.

| Area | Summary |
| --- | --- |
| `renderDesignWorkflow` | Replaced path patterns in both variants (full and reduced). Removed standalone `wave-model.md` reference lines. Updated validation checklist entries. |
| `renderDesignContract` | Replaced Required Path from `w{W}-r{R}` pattern to simplified. Replaced wave-model.md reference with inline date/slug description. |
| `renderDesignTemplate` | Updated filename blockquote to simplified pattern. Changed reference from `wave-model.md` to `design-contract.md`. |

Files modified:

```text
packages/cli/src/
└── renderers.ts      (updated — 6 occurrences replaced across 3 functions)
```

Build succeeded. All 43 tests passed with no regressions. The full-default profile short-circuits to static template files (unchanged behavior); the dynamic renderers now match the updated templates from Phases 1-2.

## Documentation

### Project

| Path | Description |
| --- | --- |
| [docs/assets/archive/work/2026-04-16-w3-r0-design-naming-simplification/03-cli-renderers.md](../archive/work/2026-04-16-w3-r0-design-naming-simplification/03-cli-renderers.md) | Work backlog phase — acceptance criteria checked off. |

### Developer

None this session.

### User

None this session.

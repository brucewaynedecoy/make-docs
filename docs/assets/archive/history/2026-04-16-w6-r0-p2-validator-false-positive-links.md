---
date: "2026-04-16"
coordinate: "W6 R0 P2"
---

# Phase 2 — Validator False-Positive Links: Heuristic Target Rejection

## Changes

Added post-match heuristic filtering to `validate_links` in `validate_output.py`. After `LINK_RE` extracts a match target, the new `is_plausible_link_target()` function rejects values that cannot be filesystem paths — acting as a safety net for bracket-paren code patterns that survive code-region stripping (e.g., unbalanced backticks in source material).

| Area | Summary |
| --- | --- |
| `is_plausible_link_target()` | New helper function that returns `False` for targets containing commas, ellipsis (`...`), leading/trailing quote characters, or unescaped spaces. Pure function with no filesystem access. |
| `validate_links()` | Both the `docs/prd/` and `docs/work/` loops now call `is_plausible_link_target()` after the existing skip-filters (fragment, URL, mailto) and before path resolution. Implausible targets are silently skipped. |

Files modified:

```text
packages/skills/decompose-codebase/scripts/
└── validate_output.py    (updated — is_plausible_link_target added; validate_links updated)
```

Derives from the [design](../archive/designs/2026-04-16-validator-false-positive-links.md), [plan phase 2](../archive/plans/2026-04-16-w6-r0-validator-false-positive-links/02-heuristic-rejection.md), and [work phase 2](../archive/work/2026-04-16-w6-r0-validator-false-positive-links/02-heuristic-rejection.md).

## Documentation

### Project

| Path | Description |
| --- | --- |
| [docs/assets/archive/work/2026-04-16-w6-r0-validator-false-positive-links/02-heuristic-rejection.md](../archive/work/2026-04-16-w6-r0-validator-false-positive-links/02-heuristic-rejection.md) | Work backlog phase for heuristic target rejection. |

### Developer

None this session.

### User

None this session.

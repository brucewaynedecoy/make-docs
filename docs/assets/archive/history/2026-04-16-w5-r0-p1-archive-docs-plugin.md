---
date: "2026-04-16"
coordinate: "W5 R0 P1"
---

# Phase 1: Archive Docs Plugin — Scaffold and Shared Assets

## Changes

Created the plugin directory structure, manifest, shared workflow reference, and relationship-tracing script under `packages/skills/archive-docs/`.

| Area | Summary |
| --- | --- |
| Directory scaffold | Created 7 directories: `skills/archive/`, `skills/staleness-check/`, `skills/deprecate/`, `skills/archive-impact/`, `agents/`, `references/`, `scripts/`. |
| `plugin.json` | Plugin manifest with name, version (0.1.0), description, and 4 skills listed with paths and descriptions. |
| `archive-workflow.md` | Shared authority file (~120 lines) covering all 9 required sections: archival modes, relationship tracing (upstream/downstream/lateral/slug), interview flow, replacement detection, link rewriting, staleness signals, deprecation rules, impact analysis format, and hard rules. |
| `trace_relationships.py` | Stdlib-only Python 3.9+ script (~280 lines). Scans docs tree, extracts markdown links, builds upstream/downstream/lateral relationship graph with slug-based heuristic fallback. Validated against dogfood docs: 80 artifacts, 202 relationships (170 link-based + 32 heuristic). |

Files created:

```text
packages/skills/archive-docs/
├── plugin.json                  (new)
├── references/
│   └── archive-workflow.md      (new)
└── scripts/
    └── trace_relationships.py   (new)
```

## Documentation

### Project

| Path | Description |
| --- | --- |
| [docs/assets/archive/work/2026-04-16-w5-r0-archive-docs-plugin/01-scaffold-and-shared-assets.md](../archive/work/2026-04-16-w5-r0-archive-docs-plugin/01-scaffold-and-shared-assets.md) | Work backlog phase — acceptance criteria checked off. |

### Developer

None this session.

### User

None this session.

---
date: "2026-04-16"
coordinate: "W5 R0 P4"
---

# Phase 4: Archive Docs Plugin — Supporting Skills

## Changes

Created three supporting SKILL.md files for the archive-docs plugin, each following the decompose-codebase pattern and referencing the shared archive-workflow.md.

| Area | Summary |
| --- | --- |
| `staleness-check/SKILL.md` | Advisory scanning skill. Detects 6 staleness signals (downstream completion, deprecated status, superseded artifacts, no active references). Produces grouped candidate report without modifying any files. |
| `deprecate/SKILL.md` | In-place deprecation skill. Adds blockquote deprecation notice, sets `status: deprecated` on guides, records replacement. Supports batch deprecation by tag or relationship. Does not move files. |
| `archive-impact/SKILL.md` | Dry-run impact analysis skill. Read-only — produces structured report: files to move, links that would break, proposed rewrites, guide reference counts, incomplete downstream warnings. Supports multi-target analysis. |

Files created:

```text
packages/skills/archive-docs/skills/
├── staleness-check/
│   └── SKILL.md     (new — 2.8 KB)
├── deprecate/
│   └── SKILL.md     (new — 2.8 KB)
└── archive-impact/
    └── SKILL.md     (new — 2.9 KB)
```

All three skills reference `references/archive-workflow.md` for shared tracing and archival rules. `just validate` passed (44 tests, router check, wave numbering check).

## Documentation

### Project

| Path | Description |
| --- | --- |
| [docs/work/2026-04-16-w5-r0-archive-docs-plugin/04-supporting-skills.md](../../work/2026-04-16-w5-r0-archive-docs-plugin/04-supporting-skills.md) | Work backlog phase — all acceptance criteria checked off. |

### Developer

None this session.

### User

None this session.

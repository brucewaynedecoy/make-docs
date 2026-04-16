# Phase 3: Archive Docs Plugin — Core Archive Skill

## Changes

Created the core `archive` SKILL.md — the plugin's primary skill with 4 archival modes, user interview flow, replacement detection, and post-archive link rewriting.

| Area | Summary |
| --- | --- |
| `archive/SKILL.md` | ~150 lines. YAML frontmatter with name and trigger-rich description. 10+ sections: Overview, Workflow (7-step), Archival Modes (direct/related/replacement/project with trigger examples), Relationship Tracing (upstream/downstream/lateral with reference to shared workflow), User Interview Flow (6-step with question templates), Replacement Detection (4 signals), Link Rewriting (scan + transform + confirm), Archive Rules (hard rule: never without approval), Scope, Error Handling, References. |

Files created:

```text
packages/skills/archive-docs/skills/archive/
└── SKILL.md     (new — 16.4 KB)
```

Follows the `decompose-codebase/SKILL.md` pattern (frontmatter + structured procedural sections). References the shared `references/archive-workflow.md` for tracing rules and archive structure.

## Documentation

### Project

| Path | Description |
| --- | --- |
| [docs/work/2026-04-16-w5-r0-archive-docs-plugin/03-core-archive-skill.md](../../work/2026-04-16-w5-r0-archive-docs-plugin/03-core-archive-skill.md) | Work backlog phase — all acceptance criteria checked off. |

### Developer

None this session.

### User

None this session.

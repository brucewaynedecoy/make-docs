# Archive Docs Plugin — Work Backlog

> See `docs/.references/wave-model.md` for W/R semantics.

## Purpose

This backlog tracks execution of the archive-docs plugin. It derives from [the plan](../../plans/2026-04-16-w5-r0-archive-docs-plugin/00-overview.md) and the originating [design](../../designs/2026-04-16-archive-docs-skill.md).

## Phase Map

| File | Purpose |
| --- | --- |
| [01-scaffold-and-shared-assets.md](./01-scaffold-and-shared-assets.md) | Create plugin directory structure, plugin.json, archive-workflow.md, and trace_relationships.py. |
| [02-archive-router-updates.md](./02-archive-router-updates.md) | Update docs/.archive/ routers to include guide sub-directories; re-seed to dogfood. |
| [03-core-archive-skill.md](./03-core-archive-skill.md) | Write the core `archive` SKILL.md with 4 modes, interview flow, and link rewriting. |
| [04-supporting-skills.md](./04-supporting-skills.md) | Write `staleness-check`, `deprecate`, and `archive-impact` SKILL.md files. |
| [05-agent-configuration.md](./05-agent-configuration.md) | Create openai.yaml, register skills in .claude/ and .agents/, dogfood validation. |

## Usage Notes

- Phases 1 and 2 can execute in parallel (disjoint file sets).
- Phases 3 and 4 can execute in parallel (both depend on Phase 1).
- Phase 5 depends on Phases 2, 3, and 4.
- Keep phase files dependency-ordered.

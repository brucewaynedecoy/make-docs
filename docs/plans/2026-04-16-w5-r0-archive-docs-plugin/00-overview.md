# Archive Docs Plugin — Implementation Plan

## Purpose

Implement the archive-docs plugin designed in [2026-04-16-archive-docs-skill.md](../../designs/2026-04-16-archive-docs-skill.md). This plan delivers a self-contained plugin under `packages/skills/archive-docs/` with four skills (archive, staleness-check, deprecate, archive-impact), a shared workflow reference, a relationship-tracing script, archive router updates, and project-level agent configuration for both Claude Code and Codex.

## Objective

- A `packages/skills/archive-docs/` plugin exists with the full directory structure specified in the design.
- The shared `archive-workflow.md` reference defines all four archival modes, relationship tracing rules, interview flow, replacement detection, link rewriting, staleness signals, deprecation rules, and impact analysis output format.
- The `trace_relationships.py` script automates relationship scanning across the doc tree.
- Four SKILL.md files provide focused entry points for each capability.
- A `plugin.json` manifest describes the plugin and its skills.
- An `openai.yaml` agent config supports Codex.
- The `docs/.archive/AGENTS.md` and `CLAUDE.md` (template and dogfood) include guide archive sub-directory mappings.
- The plugin is registered at the project level for both Claude Code (`.claude/`) and Codex (`.agents/`).
- Dogfood validation confirms the plugin works against the existing doc tree.

## Phase Map

| File | Purpose |
| ---- | ------- |
| `01-scaffold-and-shared-assets.md` | Create plugin directory structure, plugin.json, archive-workflow.md reference, and trace_relationships.py script. |
| `02-archive-router-updates.md` | Update docs/.archive/ routers in the template to include guide sub-directories; re-seed to dogfood. |
| `03-core-archive-skill.md` | Write the core `archive` SKILL.md with 4 modes, interview flow, and link rewriting. |
| `04-supporting-skills.md` | Write the `staleness-check`, `deprecate`, and `archive-impact` SKILL.md files. |
| `05-agent-configuration.md` | Create openai.yaml, register skills in .claude/ and .agents/, dogfood validation. |

## Dependencies

- Phases 1 and 2 can run in parallel (disjoint file sets).
- Phase 3 depends on Phase 1 (core skill references the shared workflow).
- Phase 4 depends on Phase 1 (supporting skills reference the shared workflow). Phases 3 and 4 can run in parallel.
- Phase 5 depends on Phases 2, 3, and 4 (all skills and router updates must exist before registration and validation).

## Validation

1. All plugin files exist at the expected paths under `packages/skills/archive-docs/`.
2. `plugin.json` is valid JSON and lists all four skills.
3. Each SKILL.md follows the pattern established by `decompose-codebase/SKILL.md` (frontmatter + structured sections).
4. `archive-workflow.md` covers all topics specified in the design (modes, tracing, interview, replacement, link rewriting, staleness, deprecation, impact analysis).
5. `trace_relationships.py` runs without errors against the dogfood doc tree.
6. `docs/.archive/AGENTS.md` and `CLAUDE.md` include guide sub-directory mappings (template and dogfood, byte-identical pairs).
7. `bash scripts/check-instruction-routers.sh` passes.
8. Project-level agent registrations are in place (`.claude/settings.json` or `.claude/skills/`, `.agents/`).
9. `just validate` passes (tests, router check, wave numbering check).

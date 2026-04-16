# Phase 5: Agent Configuration and Dogfood Validation

> Derives from [Phase 5 of the plan](../../plans/2026-04-16-w5-r0-archive-docs-plugin/05-agent-configuration.md).

## Purpose

Create agent configuration files for Claude Code and Codex, register the plugin at the project level, and validate the full plugin against the dogfood doc tree.

## Overview

Three configuration deliverables (openai.yaml, .claude/ registration, .agents/ setup) plus a dogfood validation pass against the existing doc tree.

## Source Plan Phases

- [05-agent-configuration.md](../../plans/2026-04-16-w5-r0-archive-docs-plugin/05-agent-configuration.md)

## Stage 1 — Create openai.yaml

### Tasks

1. Create `packages/skills/archive-docs/agents/openai.yaml` following the pattern from `packages/skills/decompose-codebase/agents/openai.yaml`.
2. Add `interface` section with `display_name: "Archive Docs"`, `short_description`, and `default_prompt`.
3. Add `policy` section with `allow_implicit_invocation: true`.

### Acceptance criteria

- [x] File exists at `packages/skills/archive-docs/agents/openai.yaml`
- [x] Valid YAML with `interface` and `policy` sections
- [x] Follows the same structural pattern as `packages/skills/decompose-codebase/agents/openai.yaml`

### Dependencies

- None

## Stage 2 — Register skills in .claude/

### Tasks

1. Create or update `.claude/settings.json` (project-level, committed to source control -- NOT `.claude/settings.local.json` which is user-local).
2. Register each of the 4 archive-docs skills plus the existing decompose-codebase skill in the `skills` array.
3. Check whether Claude Code expects skills in `settings.json` or in a `.claude/skills/` directory -- use whichever convention the harness supports.
4. Ensure no `permissions` key appears in `.claude/settings.json` (that belongs in the user-local file).

### Acceptance criteria

- [x] `.claude/settings.json` exists at the repo root
- [x] Contains a `skills` array listing all five SKILL.md paths (1 decompose-codebase + 4 archive-docs)
- [x] Does NOT contain a `permissions` key
- [x] Agent can discover all registered skills

### Dependencies

- Phases 3 and 4 (all SKILL.md files must exist)

## Stage 3 — Set up .agents/ directory

### Tasks

1. Create `.agents/` at the project root if it doesn't exist.
2. Add Codex agent registration pointing to the plugin's `openai.yaml`.
3. Create `.agents/README.md` documenting the Codex agent discovery convention with a table of registered plugins.

### Acceptance criteria

- [x] `.agents/` directory exists at the project root
- [x] `.agents/README.md` exists with appropriate registration table
- [x] References both `decompose-codebase` and `archive-docs` plugin configs

### Dependencies

- Stage 1 (openai.yaml must exist)

## Stage 4 — Dogfood validation

### Tasks

1. Run `python packages/skills/archive-docs/scripts/trace_relationships.py --doc-root docs/` -- verify it produces valid JSON and identifies design-plan-work chains.
2. Verify the tracer finds relationships for `guide-structure-contract` (design -> plan -> work) and `design-naming-simplification` (design -> plan -> work).
3. Run `just validate` -- verify all tests pass, no router drift, wave numbering checks pass.
4. Run `bash scripts/check-instruction-routers.sh` -- verify exit code 0 and no drift.
5. Manually review each SKILL.md to confirm it reads coherently and all references resolve.

### Acceptance criteria

- [x] `trace_relationships.py` exits 0 and produces valid JSON output (84 artifacts, 218 relationships, 32 heuristic)
- [x] Tracer identifies `guide-structure-contract` chain (design → plan → work — 20 artifacts)
- [x] Tracer identifies `design-naming-simplification` chain (design → plan → work — 17 artifacts)
- [x] `just validate` passes (44 tests, router check, wave numbering)
- [x] `bash scripts/check-instruction-routers.sh` passes with exit code 0
- [ ] Manual review of all four SKILL.md files complete — deferred to user review

### Dependencies

- Phases 2, 3, and 4 (all skills and router updates must exist)
- Stages 1, 2, and 3 of this phase (all configuration must be in place)

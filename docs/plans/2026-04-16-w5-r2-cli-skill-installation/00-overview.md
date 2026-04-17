# CLI Skill Installation R2 — Implementation Plan

## Purpose

Implement the harness-aware, registry-based skill delivery designed in [2026-04-16-cli-skill-installation-r2.md](../../designs/2026-04-16-cli-skill-installation-r2.md). This is **Wave 5 Revision 2** (`w5-r2`). It replaces the instruction-kind selection model with harness selection, adds a skill registry with `local:` protocol support, implements multi-target skill installation (Claude Code + Codex) with project/global scope, and updates the wizard and CLI flags accordingly.

> Implemented divergence: the shipped CLI uses remote-only registry sources, installs directory-based skills under `.claude/skills/<name>/` and `.agents/skills/<name>/`, treats `archive-docs` as a single required skill, and publishes registry metadata instead of a staged skill bundle. Treat this plan as historical execution intent. See the [updated design](../../designs/2026-04-16-cli-skill-installation-r2.md) and [phase-5 agent guide](../../guides/agent/2026-04-17-w5-r2-p5-cli-skill-installation.md) for the final shipped behavior.

## Objective

- `InstallSelections` uses `harnesses: Record<Harness, boolean>` instead of `instructionKinds`.
- The wizard asks "Which agent platforms?" instead of "Which instruction files?".
- A `skill-registry.json` lists available skills with `local:` sources.
- Skills install into harness-specific directories (`.claude/skills/`, `.agents/skills/`) based on selected harnesses.
- Users choose project vs. global scope for skill installation.
- Instruction files (`CLAUDE.md`, `AGENTS.md`) are derived from harness selection.
- Old CLI flags (`--no-claude`, `--no-agents`) are accepted as backward-compat aliases.
- Selective prepack bundles only registry-declared files for publishing.
- Manifest handles both old `instructionKinds` and new `harnesses` schemas.
- Dogfood validation confirms Claude Code discovers installed skills.

## Phase Map

| File | Purpose |
| ---- | ------- |
| `01-type-system-and-harness-model.md` | Replace instructionKinds with harnesses in types, profile, manifest migration. |
| `02-registry-and-resolver.md` | Create skill-registry.json, registry loader, local: protocol resolver. |
| `03-instruction-derivation.md` | Update catalog.ts and renderers to derive instruction files from harness selection. |
| `04-skill-install-pipeline.md` | Skill catalog, multi-target path computation, path rewriting, planner/installer integration. |
| `05-selective-prepack.md` | Update prepack to selectively copy only registry-declared files. |
| `06-wizard-and-cli-flags.md` | Harness step, skills+scope step, new flags, backward-compat aliases, help text. |
| `07-tests-and-validation.md` | Full test updates, smoke-pack, dogfood skill discovery. |

## Dependencies

- Phase 1 has no dependencies (type system foundation).
- Phase 2 has no dependencies (registry is independent). Phases 1 and 2 can run in parallel.
- Phase 3 depends on Phase 1 (needs harness types to derive instruction files).
- Phase 4 depends on Phases 1 and 2 (needs harness types + registry).
- Phase 5 depends on Phase 2 (reads registry for selective copy).
- Phase 6 depends on Phases 1 and 2 (needs harness types + registry for wizard).
- Phases 3, 4, 5, and 6 can all run in parallel once their dependencies are met.
- Phase 7 depends on all prior phases.

## Validation

1. `npm test -w starter-docs` — all tests pass.
2. `bash scripts/check-instruction-routers.sh` — passes.
3. `bash scripts/check-wave-numbering.sh` — passes.
4. `node scripts/smoke-pack.mjs` — pack/install/verify succeeds with skills.
5. Dogfood: CLI installs skills into `.claude/skills/` and `.agents/skills/`, Claude Code discovers them.
6. Backward compat: old `--no-claude` and `--no-agents` flags still work.
7. Old manifests with `instructionKinds` are loaded correctly.

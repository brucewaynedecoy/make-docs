---
title: Strategic Roadmap — Skills, Plugins, Multi-Harness, and Extensibility
path: roadmap
status: draft
order: 1
tags:
  - strategy
  - roadmap
  - agentics
  - plugins
  - multi-harness
applies-to:
  - cli
  - template
  - skills
---

# Strategic Roadmap — Skills, Plugins, Multi-Harness, and Extensibility

## Overview

This document captures the strategic direction for evolving `starter-docs` from a documentation template installer into an ecosystem of skills, plugins, hooks, and multi-harness agent tooling. It addresses four interconnected concerns that shape the project's roadmap:

1. **Skills vs. Plugins** — when to use each packaging model
2. **Agentics ecosystem** — how to sequence the infrastructure without over-building
3. **Multi-harness support** — how to support Claude Code, Codex, Cursor, and others without duplicating content
4. **Extensibility** — when and how to provide SDK, CI/CD, and pipeline capabilities

The guiding principle: **each phase delivers standalone value and validates assumptions for the next.** No phase requires building infrastructure on spec.

## Skills vs. Plugins

### Definitions

- **Skill**: A single markdown instruction file (`SKILL.md`) that teaches an agent how to follow a specific workflow. Self-contained, easy to create, highly customizable. Example: `decompose-codebase`.
- **Plugin**: An installable bundle that combines multiple skills, hooks, agent definitions, shared references, and scripts under a single manifest (`plugin.json`). Used when capabilities share infrastructure or serve a unified purpose. Example: `archive-docs`.

### When to use each

| Use a skill when... | Use a plugin when... |
| --- | --- |
| The capability is a single workflow | The capability spans multiple workflows |
| No shared state or references needed | Skills share references, scripts, or hooks |
| Trigger surface is narrow and clear | Trigger surface is broad (multiple entry points) |
| No hooks or agent definitions needed | Hooks, agent configs, or scripts are part of the package |

### Current state

The `decompose-codebase` skill is a skill (one SKILL.md, self-contained). The planned `archive-docs` is a plugin (4+ skills sharing a workflow reference and tracing script). The plugin model is the right abstraction for anything that bundles multiple capabilities — but a full plugin runtime or registry is not needed yet. A `plugin.json` manifest plus a convention for where shared assets live is enough to ship plugins today.

## Agentics Ecosystem Strategy

### The vision

The [agentics ecosystem design](../../designs/2026-04-15-w2-r0-agentics-ecosystem.md) proposes a registry, gateway skill, modules, roles, and 8 capability types. This is the right long-term architecture for a platform. However, building registry/gateway/module infrastructure before there are enough plugins to justify it risks over-engineering.

### The strategy

**Let the plugins drive the infrastructure, not the other way around.**

1. Build `archive-docs` as a plugin.
2. Build one or two more plugins (e.g., `docs-healthcheck`, `draft-design`).
3. Observe what registry/gateway patterns emerge naturally from how those plugins are structured, installed, and invoked.
4. Build the ecosystem infrastructure to formalize the patterns that are already working — not to anticipate patterns that might be needed.

The agentics design becomes a *target* to iterate toward, not a prerequisite to build first.

## Multi-Harness Support

### The landscape

| Harness | Instruction file | Skills support | Hooks support | Agent definitions |
| --- | --- | --- | --- | --- |
| Claude Code | `CLAUDE.md` | Yes (`.claude/skills/`) | Yes (PreToolUse, PostToolUse, Stop) | Yes (`.claude/agents/`) |
| Codex (OpenAI) | `AGENTS.md` | Yes (markdown instructions) | No | Yes (`.agents/`, YAML) |
| Cursor | `.cursorrules`, `.cursor/rules/` | Partial (rules files) | No | No |
| Windsurf | `.windsurfrules` | Partial (rules files) | No | No |
| Aider | `CONVENTIONS.md`, `.aider.conf.yml` | Partial (conventions) | No | No |
| Cline | `.clinerules` | Partial (rules files) | No | No |

### What's already portable

Most of what `starter-docs` ships is harness-agnostic:

| Layer | Portable? | Notes |
| --- | --- | --- |
| AGENTS.md / CLAUDE.md routers | Mostly | AGENTS.md has cross-harness traction; CLAUDE.md is Claude-specific but content-identical |
| Skills (SKILL.md) | Yes | Markdown instructions work everywhere |
| References / templates | Yes | Plain files, harness-agnostic |
| Hooks | No | Claude Code-specific; no equivalent in most harnesses |
| Agent definitions | Partially | Each harness has its own format |
| Settings (`.claude/settings.json`) | No | Fully Claude Code-specific |

### The strategy: single source, harness adapters

The canonical skill/reference/template lives in `packages/skills/<name>/`. A thin adapter layer generates harness-specific registration files:

- **Claude Code**: skill registration in `.claude/settings.json` or `.claude/skills/`
- **Codex**: agent YAML in `.agents/`
- **Cursor**: rules injection into `.cursor/rules/`
- **Generic**: AGENTS.md sections that any harness can read

The key principle: **never duplicate content across harness directories.** One canonical source, multiple projections. Adapters can be scripts in the CLI (`starter-docs adapt --harness claude-code`) or documented conventions.

For hooks specifically: accept that they're Claude Code-only for now. For other harnesses, the same behavior can be approximated via git pre-commit hooks or CI/CD scripts.

## Extensibility Strategy

### What extensibility means for starter-docs

The full extensibility surface includes: custom contracts, multi-step workflows, CI/CD integration, headless/pipeline mode, an SDK, specialized extensibility agents, and tooling for running starter-docs touch-free in automations customized to user requirements.

### Why to defer the heavy build

Before building an SDK or pipeline framework, the project needs:

1. At least 3-5 external consumers using starter-docs with real projects
2. Evidence of what they actually customize (contracts? templates? naming? something unexpected?)
3. Evidence of pipeline demand (are consumers manually running starter-docs in CI today?)

### Cheap extensibility wins available now

These require no new infrastructure and deliver immediate value:

- **Headless mode**: already exists (`starter-docs init --yes`). Making skills invocable non-interactively (e.g., `starter-docs run staleness-check --json`) is a small CLI addition.
- **Custom contracts**: supported by convention — consumers override a reference file in their own `docs/.references/` and the router picks it up.
- **CI/CD integration**: starts with existing scripts (`check-instruction-routers.sh`, `smoke-pack.mjs`). Adding `staleness-check` as a CLI-invocable script is the natural next step.

## Roadmap

### Phase sequence

| Phase | Scope | Dependencies | Complexity |
| --- | --- | --- | --- |
| **Now** | Finish in-progress work: asset-pipeline-completeness → plan → implement. Closes a real gap in the CLI's managed asset pipeline. | None | Small |
| **Next** | Build the `archive-docs` base plugin (4 skills). Proves the plugin model and delivers immediate user value. | None | Medium |
| **Then** | Multi-harness adapter convention. Design how skills/references project into different harness directories. Implement for Claude Code + Codex first, Cursor as a stretch. | Informed by plugin experience | Medium |
| **After** | Minimal plugin infrastructure in the CLI: `plugin.json` manifest, `starter-docs add/remove <plugin>`, `starter-docs list --plugins`. Just enough to install the archive-docs plugin into a consumer project. | Archive-docs exists as proof case | Medium |
| **Later** | Archive-docs extended (completion hooks, search, wave lifecycle, PRD rotation, provenance). Builds on the validated base plugin. | Base plugin working, hooks decided | Medium-Large |
| **Eventually** | Agentics ecosystem infrastructure (registry, gateway, modules, roles). Build when there are 3+ plugins and external consumer feedback. | Multiple plugins, consumer feedback | Large |
| **Horizon** | Extensibility SDK, CI/CD pipeline integration, headless skill invocation. Build when demand is validated by real external usage. | Ecosystem infrastructure, external adoption | Large |

### Sequencing principles

1. **Each phase ships standalone value.** No phase exists solely to enable a future phase.
2. **Plugins prove the model before infrastructure formalizes it.** Archive-docs validates the plugin pattern. Multi-harness adapters validate portability. CLI plugin commands validate distribution. Each step retires a risk.
3. **External adoption gates the heavy investment.** The agentics ecosystem and extensibility SDK are valuable but expensive. They should be built in response to validated demand, not in anticipation of it.
4. **Multi-harness support is a cross-cutting concern, not a phase.** Every skill, plugin, and CLI feature should be designed with portability in mind from the start, even if adapter implementation happens in a dedicated phase.

## Related Design Documents

- [Agentics Ecosystem](../../designs/2026-04-15-w2-r0-agentics-ecosystem.md) — the long-term platform vision
- [Archive Docs Plugin](../../designs/2026-04-16-archive-docs-skill.md) — base plugin (4 skills)
- [Archive Docs Extended](../../designs/2026-04-16-archive-docs-extended.md) — follow-on capabilities (4 more skills + hooks + provenance)
- [Asset Pipeline Completeness](../../designs/2026-04-16-w2-r0-asset-pipeline-completeness.md) — in-progress gap fix
- [CLI Publishing](../../designs/2026-04-15-w2-r0-cli-publishing.md) — first npm release plan

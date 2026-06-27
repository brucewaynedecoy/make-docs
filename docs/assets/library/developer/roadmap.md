---
title: Strategic Roadmap — Skills, Agentics, Multi-Harness, and Extensibility
path: roadmap
status: draft
order: 1
tags:
  - strategy
  - roadmap
  - agentics
  - multi-harness
applies-to:
  - cli
  - template
  - skills
related:
  - ../../archive/designs/2026-04-16-cli-skill-installation-r2.md
  - ../../archive/designs/2026-04-16-archive-docs-skill.md
---

# Strategic Roadmap — Skills, Agentics, Multi-Harness, and Extensibility

## Overview

`make-docs` is no longer just a docs-template installer. It now has a real distribution surface for harness-aware skills, while still carrying a broader long-term ambition around “agentics” such as hooks, MCP servers, agent definitions, and other reusable add-ons.

The current roadmap should reflect two realities at the same time:

1. The shipped platform is **skill-first**, not plugin-first.
2. The long-term direction can still grow into a broader agentics ecosystem when there is enough real usage to justify it.

The governing principle is unchanged: **ship the smallest real abstraction that solves the current problem, and let repeated demand justify the next layer.**

## Current Product Shape

### What is shipped now

- A publishable CLI installs docs scaffolding plus harness-aware skills.
- Skills are selected explicitly through the packaged registry and resolved payload sources.
- Selected skills install one canonical shared payload under `.make-docs/agentics/skills/<name>/`.
- Enabled harnesses receive generated `SKILL.md` stubs under `.claude/skills/<name>/` and `.agents/skills/<name>/`.
- Bare default installs write no selected skill payloads or harness stubs.

### What that means strategically

The project has validated a useful base abstraction:

- one canonical skill package
- one registry entry per installable skill
- one installer that can project the same skill to multiple harnesses

That is enough to keep moving. It does **not** yet justify a more complex plugin or agentics runtime in the CLI.

## Packaging Direction

### Skills are the primary packaging unit

Use a skill when:

- the capability can be expressed as one root `SKILL.md`
- sibling references, scripts, and agent files can travel with the canonical shared payload
- the same logical workflow should expose generated entrypoint stubs to Claude Code and Codex with minimal harness-specific behavior

That is the current state of first-party selectable skills:

| Skill | Role | Status |
| --- | --- | --- |
| `archive-docs` | Relationship-aware archival, deprecation, staleness checking, and impact analysis | Selectable, shipped |
| `decompose-codebase` | Reverse-engineering and PRD/backlog decomposition | Selectable, shipped |
| `cleanup-docs`, `closeout-*`, `work-on-*` | Documentation hygiene, closeout, and work execution helpers | Selectable, shipped |

### Agentics remains a future expansion layer

The longer-term agentics direction still matters, but it should be treated as an expansion of the registry and installer model, not as something that had to be built first.

Potential future installable types include:

- plugins
- hooks
- MCP servers
- agent definitions
- harness-specific settings integrations

Those should be introduced when there is a concrete need to install and manage them as first-class units, not as speculative infrastructure.

## Multi-Harness Strategy

### Current rule: one skill source, multiple harness targets

Canonical skill content lives once under `packages/skills/<name>/`. The CLI installs the selected payload once into `.make-docs/agentics/skills/<name>/` per scope and then exposes generated entrypoint stubs to the selected harness roots:

| Surface | Path |
| --- | --- |
| Canonical payload | `.make-docs/agentics/skills/<name>/` |
| Claude Code stub | `.claude/skills/<name>/SKILL.md` |
| Codex stub | `.agents/skills/<name>/SKILL.md` |

This is the right level of abstraction today:

- shared content stays shared
- harness differences stay in generated stubs and router logic
- skills remain easy to author and reason about

### Why `archive-docs` became one skill

`archive-docs` was briefly modeled as a plugin-style bundle of multiple related skills. That turned out to be the wrong near-term packaging decision.

Converting it into one skill was the better move because it:

- kept the full capability together
- preserved required scripts and references
- avoided inventing a cross-harness plugin contract prematurely
- matched the current installer’s real strengths

That decision should be treated as the current baseline, not as a compromise to undo immediately.

## Extensibility Direction

### Near-term

The next worthwhile extensions are still small and practical:

- more remote-registry skills
- better headless CLI coverage
- stronger docs and schema/tooling around the registry
- broader harness verification and smoke testing

### Later

Deeper extensibility should come only after repeated consumer demand:

- richer registry metadata
- new installable agentics types
- harness adapters beyond Claude Code and Codex
- CI-oriented automation and validation workflows
- higher-level APIs or SDKs

The constraint is intentional: do not build an ecosystem framework before there is enough ecosystem to deserve one.

## Roadmap

| Horizon | Focus | Why it belongs there |
| --- | --- | --- |
| Now | Finish CLI parity, schema correctness, and documentation truthfulness for the shipped skill installer | Removes friction and makes the current platform coherent |
| Next | Add more high-value remote skills and tighten skill-authoring conventions | Expands real utility without changing the core abstraction |
| Then | Validate harness portability with more install/test coverage and selective new harness targets | Proves where adapter complexity is actually needed |
| Later | Introduce broader agentics registry types when there are concrete install/use cases beyond skills | Lets usage shape the abstraction |
| Horizon | Consider SDK, automation, and advanced extensibility layers | Worth doing only after external demand is clear |

## Related Design Documents

- [CLI Skill Installation R2](../../archive/designs/2026-04-16-cli-skill-installation-r2.md) — current source of truth for remote registry skill delivery
- [Archive Docs Skill](../../archive/designs/2026-04-16-archive-docs-skill.md) — `archive-docs` capability design
- [Archive Docs Extended](../../../designs/2026-04-16-archive-docs-extended.md) — longer-term follow-on ideas
- [Agentics Ecosystem](../../../designs/2026-04-15-agentics-ecosystem.md) — long-term platform direction, intentionally deferred behind real demand

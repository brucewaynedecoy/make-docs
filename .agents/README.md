# Agent Registrations

This directory contains agent configuration for non-Claude-Code harnesses (e.g., OpenAI Codex).

## Registered Plugins

| Plugin | Config path | Description |
| --- | --- | --- |
| `decompose-codebase` | `packages/skills/decompose-codebase/agents/openai.yaml` | Plan and reverse-engineer repos into structured PRDs. |
| `archive-docs` | `packages/skills/archive-docs/agents/openai.yaml` | Relationship-aware archival, staleness detection, deprecation, and impact analysis. |

## Convention

Each plugin ships its own agent config under `packages/skills/<plugin>/agents/`. This directory serves as a discovery index — harnesses that scan `.agents/` can find registered plugins here.

For Claude Code, skills are registered in `.claude/settings.json` instead.

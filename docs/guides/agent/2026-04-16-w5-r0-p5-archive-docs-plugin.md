# Phase 5: Archive Docs Plugin — Agent Configuration and Dogfood Validation

## Changes

Created agent configuration files for Claude Code and Codex, registered the plugin at the project level, and validated the full plugin against the dogfood doc tree.

| Area | Summary |
| --- | --- |
| `openai.yaml` | Created Codex agent config at `packages/skills/archive-docs/agents/openai.yaml` with display name, description, default prompt, and implicit invocation policy. Follows `decompose-codebase` pattern. |
| `.claude/settings.json` | Created project-level settings (committed to source control) with 5 skill registrations: 1 decompose-codebase + 4 archive-docs skills. No `permissions` key (that stays in user-local `settings.local.json`). |
| `.agents/` directory | Created `.agents/README.md` as a discovery index listing both `decompose-codebase` and `archive-docs` plugins with config paths. |
| Dogfood validation | `trace_relationships.py` ran clean: 84 artifacts, 218 relationships (186 link-based + 32 heuristic). Confirmed `guide-structure-contract` chain (20 artifacts) and `design-naming-simplification` chain (17 artifacts). `just validate` passed (44 tests, router check, wave numbering). |

Files created:

```text
packages/skills/archive-docs/agents/
└── openai.yaml                  (new)

.claude/
└── settings.json                (new — project-level)

.agents/
└── README.md                    (new)
```

## Documentation

### Project

| Path | Description |
| --- | --- |
| [docs/work/2026-04-16-w5-r0-archive-docs-plugin/05-agent-configuration.md](../../work/2026-04-16-w5-r0-archive-docs-plugin/05-agent-configuration.md) | Work backlog phase — acceptance criteria checked off (manual SKILL.md review deferred to user). |

### Developer

None this session.

### User

None this session.

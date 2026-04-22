---
date: "2026-04-16"
coordinate: "W5 R1 P1"
---

# Phase 1: CLI Skill Installation — Cleanup and Bundling

## Changes

Cleaned up invalid Wave 5 Phase 5 artifacts and extended the CLI prepack pipeline to bundle `packages/skills/` into the published CLI package alongside the docs template.

| Area | Summary |
| --- | --- |
| Deleted artifacts | Removed `.claude/settings.json` (invalid `skills` array not recognized by Claude Code) and `.agents/` directory (README discovery index no harness reads). `.claude/` retains `settings.local.json`. |
| `copy-template-to-cli.mjs` | Extended to copy `packages/skills/` → `packages/cli/skills/` after the existing template copy. Includes existence check and cleanup of prior bundled skills. |
| `packages/cli/package.json` | Added `"skills"` to the `files` array so skills ship in the published tarball. |
| Bundling verification | `npm run prepack` confirmed both `decompose-codebase/` and `archive-docs/` (with all 5 SKILL.md files) are bundled into `packages/cli/skills/`. |

Files modified:

```text
scripts/
└── copy-template-to-cli.mjs    (updated — skills copy step added)

packages/cli/
└── package.json                 (updated — "skills" added to files array)
```

Files deleted:

```text
.claude/settings.json            (deleted — invalid)
.agents/README.md                (deleted — invalid)
.agents/                         (deleted — empty)
```

## Documentation

### Project

| Path | Description |
| --- | --- |
| [docs/work/2026-04-16-w5-r1-cli-skill-installation/01-cleanup-and-bundling.md](../../work/2026-04-16-w5-r1-cli-skill-installation/01-cleanup-and-bundling.md) | Work backlog phase — all acceptance criteria checked off. |

### Developer

None this session.

### User

None this session.

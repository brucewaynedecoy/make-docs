---
date: "2026-04-16"
coordinate: "W4 R0 P1"
---

# Phase 1: Asset Pipeline Completeness — CLI Source Changes

## Changes

Updated `packages/cli/src/rules.ts` and `packages/cli/src/catalog.ts` to add 7 previously unmanaged template files to the CLI's managed asset pipeline. After this phase, every install profile — full or reduced — produces a complete doc tree with no missing references, templates, prompts, or archive routers.

| Area | Summary |
| --- | --- |
| `rules.ts` — always-installed references | Extended `ALWAYS_REFERENCE_PATHS` with `wave-model.md` and `agent-guide-contract.md` (now 3 entries total). |
| `rules.ts` — always-installed templates | Renamed `GUIDE_TEMPLATE_PATHS` to `ALWAYS_TEMPLATE_PATHS` and added `agent-guide.md` (now 3 entries total). Updated loop in `getTemplatePaths` to reference the renamed constant. |
| `rules.ts` — plan templates | Added `plan-overview.md` to `PLAN_TEMPLATE_PATHS` (now 4 entries, gated on plans capability). |
| `rules.ts` — prompt rules | Added `session-to-agent-guide.prompt.md` to `PROMPT_RULES` with `requires: []` (installed whenever prompts are enabled, regardless of capabilities). |
| `catalog.ts` — archive instruction assets | Added `docs/.archive/${instructionKind}` to `addInstructionAssets` (unconditional, not capability-gated). |
| `install.test.ts` — test fix | Updated "plans-only install without prompts" test to explicitly set `selections.prompts = false`, since the new capability-agnostic prompt now causes the `.prompts/` directory to be created when prompts are enabled. |

Files modified:

```text
packages/cli/
├── src/
│   ├── rules.ts        (updated — 5 changes across 4 constants)
│   └── catalog.ts      (updated — 1 line added)
└── tests/
    └── install.test.ts (updated — 1 test fix)
```

Build succeeded. All 43 tests passed (one existing test updated to match new behavior).

## Documentation

### Project

| Path | Description |
| --- | --- |
| [docs/assets/archive/work/2026-04-16-w4-r0-asset-pipeline-completeness/01-cli-source-changes.md](../archive/work/2026-04-16-w4-r0-asset-pipeline-completeness/01-cli-source-changes.md) | Work backlog phase — all 6 stages' acceptance criteria checked off. |

### Developer

None this session.

### User

None this session.

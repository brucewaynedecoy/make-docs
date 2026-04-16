# Phase 3: Guide Structure Contract — CLI Integration

## Changes

Wired guide-related files into the CLI's managed asset pipeline across three source files so they are included in every install profile (not just the full-default).

| Area | Summary |
| --- | --- |
| `rules.ts` | Added `ALWAYS_REFERENCE_PATHS` constant (with `guide-contract.md`) and unconditional loop in `getReferencePaths()`. Added `GUIDE_TEMPLATE_PATHS` constant (with `guide-developer.md`, `guide-user.md`) and unconditional loop in `getTemplatePaths()`. |
| `catalog.ts` | Added `docs/guides/${instructionKind}` and `docs/guides/agent/${instructionKind}` to `addInstructionAssets()` — unconditional (not capability-gated). |
| `renderers.ts` | Added `GUIDES_ROUTER_INSTRUCTIONS` constant. Updated `isBuildablePath()` and `renderBuildableAsset()` dispatch. Added `renderGuidesRouter()` function. Added unconditional guides routing line in `renderDocsRouter()`. Added unconditional guide template listing in `renderTemplatesRouter()`. |

Files modified:

```text
packages/cli/src/
├── rules.ts          (updated)
├── catalog.ts        (updated)
└── renderers.ts      (updated)
```

Build succeeded. All 40 existing tests passed with no regressions.

## Documentation

### Project

| Path | Description |
| --- | --- |
| [docs/work/2026-04-16-w2-r0-guide-structure-contract/03-cli-integration.md](../../work/2026-04-16-w2-r0-guide-structure-contract/03-cli-integration.md) | Work backlog phase — acceptance criteria checked off. |

### Developer

None this session.

### User

None this session.

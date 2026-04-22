---
date: "2026-04-21"
coordinate: "W10 R0 P2"
---

# Template, Renderers, and Assets Rename

## Changes

This session completed Wave 10 Phase 2 from [02-template-renderers-and-assets.md](../../work/2026-04-21-w10-r0-make-docs-rename/02-template-renderers-and-assets.md), based on the source plan at [docs/plans/2026-04-21-w10-r0-make-docs-rename/02-template-renderers-and-assets.md](../../plans/2026-04-21-w10-r0-make-docs-rename/02-template-renderers-and-assets.md). The phase updated shippable template text and generated router output so fresh installs receive `make-docs` guidance.

| Area | Summary |
| --- | --- |
| Template-owned files | Updated template routers, prompts, and reference files under `packages/docs/template/` to use `make-docs` copy while preserving `docs/.assets/config/manifest.json`. |
| Renderer output | Updated generated config-router headings and reconfiguration next steps in `packages/cli/src/renderers.ts` to use `make-docs` and `npx make-docs reconfigure`. |
| Template sync | Ran the normal template sync so `packages/cli/template/` mirrors `packages/docs/template/`. |
| Tests | Updated renderer assertions for the new generated command text; consistency tests required no source change. |
| Validation | Renderer and consistency tests passed, synced templates matched, scoped old-name string/pathname searches passed, and `git diff --check` passed. |

## Documentation

### Project

| Path | Description |
| --- | --- |
| [docs/.assets/history/2026-04-21-w10-r0-p2-template-renderers-and-assets.md](2026-04-21-w10-r0-p2-template-renderers-and-assets.md) | New history record for the Wave 10 Phase 2 template and renderer rename. |
| `packages/docs/template/docs/.assets/config/AGENTS.md` | Template router copy updated to identify make-docs-managed config state. |
| [packages/docs/template/docs/assets/prompts/work-to-commit-message.prompt.md](../../../packages/docs/template/docs/assets/prompts/work-to-commit-message.prompt.md) | Template prompt copy updated for the new product name. |
| [packages/docs/template/docs/assets/references/commit-message-convention.md](../../../packages/docs/template/docs/assets/references/commit-message-convention.md) | Template reference copy updated for the new product name. |
| [packages/docs/template/docs/assets/references/guide-contract.md](../../../packages/docs/template/docs/assets/references/guide-contract.md) | Template guide contract copy updated for the new product name. |
| [packages/docs/template/docs/assets/references/history-record-contract.md](../../../packages/docs/template/docs/assets/references/history-record-contract.md) | Template history contract copy updated for the new product name. |
| [packages/docs/template/docs/assets/references/wave-model.md](../../../packages/docs/template/docs/assets/references/wave-model.md) | Template wave model copy updated for the new product name. |
| [packages/cli/src/renderers.ts](../../../packages/cli/src/renderers.ts) | Generated router and next-step output updated to use `make-docs`. |
| [packages/cli/tests/renderers.test.ts](../../../packages/cli/tests/renderers.test.ts) | Renderer expectations updated for generated `make-docs` guidance. |

### Developer

None this session.

### User

None this session.

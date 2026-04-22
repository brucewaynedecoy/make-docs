---
date: "2026-04-20"
coordinate: "W9 R0 P2"
---

# Docs Assets, State, and History - Phase 2: Template Assets and Renderers

## Changes

Completed Wave 9 Phase 2, framed by [the Phase 2 plan](../../plans/2026-04-20-w9-r0-docs-assets-state-and-history/02-template-assets-and-renderers.md) and [the Phase 2 backlog](../../work/2026-04-20-w9-r0-docs-assets-state-and-history/02-template-assets-and-renderers.md). This phase closed the template asset and renderer coverage for the new `.assets` namespace and confirmed fresh installs no longer create `docs/guides/agent/`.

| Area | Summary |
| --- | --- |
| Backlog closeout | Marked the Phase 2 acceptance criteria complete and corrected the always-installed asset references to the renamed history record contract, template, and prompt. |
| Renderer coverage | [`packages/cli/tests/renderers.test.ts`](../../../packages/cli/tests/renderers.test.ts) now compares every `.assets` router against the checked-in package template for reduced profiles. |
| Install coverage | [`packages/cli/tests/install.test.ts`](../../../packages/cli/tests/install.test.ts) now asserts full and reduced installs include all `.assets` routers and do not recreate `docs/guides/agent/`. |
| Validation | The phase backlog records focused consistency, renderer, and install test coverage as passing for the `.assets` template pipeline. |

## Documentation

### Project

| Path | Description |
| --- | --- |
| [docs/work/2026-04-20-w9-r0-docs-assets-state-and-history/02-template-assets-and-renderers.md](../../work/2026-04-20-w9-r0-docs-assets-state-and-history/02-template-assets-and-renderers.md) | Phase 2 work item with acceptance criteria marked complete. |
| [packages/cli/tests/install.test.ts](../../../packages/cli/tests/install.test.ts) | Added install assertions for the new `.assets` routers and absence of fresh `docs/guides/agent/` output. |
| [packages/cli/tests/renderers.test.ts](../../../packages/cli/tests/renderers.test.ts) | Added checked-in-template parity coverage for every `.assets` router path. |
| [docs/.assets/history/2026-04-20-w9-r0-p2-template-assets-and-renderers.md](./2026-04-20-w9-r0-p2-template-assets-and-renderers.md) | History record for the Phase 2 template assets and renderer coverage pass. |

### Developer

None this session.

### User

None this session.

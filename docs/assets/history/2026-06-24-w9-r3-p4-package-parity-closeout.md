---
date: 2026-06-24
coordinate: W9 R3 P4
repo: make-docs
branch: make-docs-v2
status: completed
summary: "Completed package parity and closeout for the new docs assets, playbooks, and persona model wave."
---

# New Docs Assets Package Parity Closeout

## Changes

Completed W9 R3 Phase 4 by adding catalog/install assertions and packed-package smoke coverage for the canonical reader-facing guide, playbook, and archive routers, proving prepack package-template parity, and narrowing the remaining PRD 22 risks to future configuration-overlay and broader restructure work.

| Area | Summary |
| --- | --- |
| Catalog parity | Added consistency coverage that requires the default scaffold to include the canonical `docs/assets/guides/**`, `docs/assets/playbooks/**`, and `docs/archive/**` routers. |
| Install manifest parity | Added install assertions for reader-facing router `file:` source IDs so managed-file ownership remains visible in installed manifests. |
| Packed package parity | Extended `scripts/smoke-pack.mjs` to assert packed template contents, installed reader-facing assets, manifest tracking, and unmanaged custom guide/playbook/archive preservation during uninstall. |
| Generated package template | Ran `node scripts/copy-template-to-cli.mjs`; `packages/cli/template/**` is ignored/generated, and `npm run smoke:pack` re-runs prepack before packing the tarball. |
| PRD and risk reconciliation | Updated `R-011` and `R-013` with W9 R3 P4 evidence. `R-011` remains open for PRD 24 configuration-overlay integration; `R-013` remains open for broader restructure relocation. |
| Coverage decisions | Developer-guide verdict is `none` because package parity evidence lives in tests, smoke-pack, and this history record. User-guide verdict is `none` because installed command behavior is unchanged. No new PRD was created because PRD 22 owns the package-flow requirements. UAT was completed through `npm run smoke:pack`, the repo's packed CLI smoke scenario. |

## Documentation

### Project

| Path | Description |
| --- | --- |
| [../../prd/03-open-questions-and-risk-register.md](../../prd/03-open-questions-and-risk-register.md) | Narrows `R-011` and `R-013` after Phase 4 package parity validation. |
| [../../work/2026-06-23-w9-r3-new-docs-assets-playbooks-persona-model/04-package-parity-and-closeout.md](../../work/2026-06-23-w9-r3-new-docs-assets-playbooks-persona-model/04-package-parity-and-closeout.md) | Records Phase 4 completion evidence, validation, and the final UAT decision. |
| [../../../packages/cli/tests/consistency.test.ts](../../../packages/cli/tests/consistency.test.ts) | Verifies the default scaffold includes canonical reader-facing router assets. |
| [../../../packages/cli/tests/install.test.ts](../../../packages/cli/tests/install.test.ts) | Verifies installed manifests track canonical reader-facing routers with `file:` source IDs. |
| [../../../scripts/smoke-pack.mjs](../../../scripts/smoke-pack.mjs) | Proves packed-template parity and unmanaged reader-facing asset preservation through the packed CLI scenario. |

### Developer

None this session.

### User

None this session.

---
date: "2026-04-16"
coordinate: "W4 R0 P2"
---

# Phase 2: Asset Pipeline Completeness — Tests and Validation

## Changes

Added a template-completeness test to prevent future asset pipeline gaps, extended reduced-profile test assertions for all 7 newly managed files, and ran the full validation suite.

| Area | Summary |
| --- | --- |
| `consistency.test.ts` | Added template-completeness test: walks `packages/docs/template/` recursively, compares every file against `getDesiredAssets(fullDefaultProfile)`, fails if any template file is unmanaged. Imported `getDesiredAssets`, `TEMPLATE_ROOT`, `readdirSync`, `statSync`, and `path`. |
| `install.test.ts` | Extended "includes guide files even when all capabilities are disabled" test with assertions for `wave-model.md`, `agent-guide-contract.md`, `agent-guide.md`, `docs/.archive/AGENTS.md`, `docs/.archive/CLAUDE.md`, and `session-to-agent-guide.prompt.md`. Added `plan-overview.md` assertion to the "disabling prd" test (plans enabled). |

Files modified:

```text
packages/cli/tests/
├── consistency.test.ts    (updated — 1 new test, new imports)
└── install.test.ts        (updated — 8 new assertions across 2 existing tests)
```

### Validation results

| Check | Result |
| --- | --- |
| `npm test -w make-docs` | 44 tests, 6 files, all pass (1 new test) |
| `bash scripts/check-instruction-routers.sh` | Exits 0 |
| `node scripts/smoke-pack.mjs` | Pack/install/verify succeeds |

The template-completeness test is the safety net: any future file added to `packages/docs/template/` without being registered in `rules.ts` or `catalog.ts` will cause a test failure listing the unmanaged files.

## Documentation

### Project

| Path | Description |
| --- | --- |
| [docs/assets/archive/work/2026-04-16-w4-r0-asset-pipeline-completeness/02-tests-and-validation.md](../archive/work/2026-04-16-w4-r0-asset-pipeline-completeness/02-tests-and-validation.md) | Work backlog phase — all 3 stages' acceptance criteria checked off. |

### Developer

None this session.

### User

None this session.

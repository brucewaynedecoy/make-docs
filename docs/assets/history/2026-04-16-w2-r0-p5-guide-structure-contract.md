---
date: "2026-04-16"
coordinate: "W2 R0 P5"
---

# Phase 5: Guide Structure Contract — Tests and Validation

## Changes

Updated the test suite to cover guide-related additions and ran the full validation sequence.

| Area | Summary |
| --- | --- |
| `consistency.test.ts` | Added `docs/guides/AGENTS.md` and `docs/guides/CLAUDE.md` to `BUILDABLE_PATHS` constant. |
| `install.test.ts` | Added assertions to the full-default install test verifying `guide-contract.md`, both guide templates, and guide routers exist and reference the contract. Added a new reduced-profile test confirming guide files are installed even when all capabilities are disabled. |
| `check-instruction-routers.sh` | No changes needed — script auto-discovers routers via `find`, so `docs/guides/` and `docs/guides/agent/` are already covered. |

Files modified:

```text
packages/cli/tests/
├── consistency.test.ts    (updated)
└── install.test.ts        (updated)
```

### Validation results

| Check | Result |
| --- | --- |
| `npm test -w make-docs` | 43 tests, 6 files, all pass (3 new tests) |
| `bash scripts/check-instruction-routers.sh` | Exits 0 |
| `node scripts/smoke-pack.mjs` | Pack/install/verify succeeds |

Smoke-pack output confirmed `guide-contract.md`, `guide-developer.md`, `guide-user.md`, and guide routers are all included in the installed output.

## Documentation

### Project

| Path | Description |
| --- | --- |
| [docs/assets/archive/work/2026-04-16-w2-r0-guide-structure-contract/05-tests-and-validation.md](../archive/work/2026-04-16-w2-r0-guide-structure-contract/05-tests-and-validation.md) | Work backlog phase — acceptance criteria checked off. |

### Developer

None this session.

### User

None this session.

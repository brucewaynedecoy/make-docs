---
date: "2026-04-16"
coordinate: "W3 R0 P4"
---

# Phase 4: Design Naming Simplification — Re-seed and Validation

## Changes

Re-seeded 6 template-owned files from the template package into the repo-root dogfood `docs/`, then ran the full validation suite.

### Re-seed

| Target | Change |
| --- | --- |
| `docs/.references/wave-model.md` | Design row removed from Naming Patterns, Design Exemption section added. |
| `docs/.references/design-contract.md` | Required Path simplified to `YYYY-MM-DD-<slug>.md`. |
| `docs/.references/design-workflow.md` | All W/R path patterns replaced with simplified form. |
| `docs/.templates/design.md` | Filename blockquote simplified. |
| `docs/designs/AGENTS.md` | Naming convention, example, and wave-model reference updated. |
| `docs/designs/CLAUDE.md` | Mirror of AGENTS.md. |

All 6 targets verified byte-identical to their template source. Existing design files (7 `w2-r0` designs + `2026-04-16-design-naming-simplification.md`) confirmed untouched.

### Validation results

| Check | Result |
| --- | --- |
| `npm test -w make-docs` | 43 tests, 6 files, all pass |
| `bash scripts/check-instruction-routers.sh` | Exits 0 |
| `node scripts/smoke-pack.mjs` | Pack/install/verify succeeds |

## Documentation

### Project

| Path | Description |
| --- | --- |
| [docs/assets/archive/work/2026-04-16-w3-r0-design-naming-simplification/04-reseed-and-validation.md](../archive/work/2026-04-16-w3-r0-design-naming-simplification/04-reseed-and-validation.md) | Work backlog phase — acceptance criteria checked off. |

### Developer

None this session.

### User

None this session.

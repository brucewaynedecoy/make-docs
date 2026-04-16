# Phase 2: Archive Docs Plugin — Archive Router Updates

## Changes

Updated the archive router files to include guide sub-directory mappings for archived guides, then re-seeded to dogfood.

| Area | Summary |
| --- | --- |
| Template routers | Added 3 guide sub-directory entries to `packages/docs/template/docs/.archive/AGENTS.md` and `CLAUDE.md`: `guides/agent/`, `guides/developer/`, `guides/user/`. Pair verified byte-identical. |
| Dogfood re-seed | Copied updated routers to `docs/.archive/AGENTS.md` and `CLAUDE.md`. Verified byte-identical to template source. |

Files modified:

```text
packages/docs/template/docs/.archive/
├── AGENTS.md                    (updated)
└── CLAUDE.md                    (updated)

docs/.archive/
├── AGENTS.md                    (re-seeded)
└── CLAUDE.md                    (re-seeded)
```

`bash scripts/check-instruction-routers.sh` passed. `just validate` passed (44 tests, router check, wave numbering check).

## Documentation

### Project

| Path | Description |
| --- | --- |
| [docs/work/2026-04-16-w5-r0-archive-docs-plugin/02-archive-router-updates.md](../../work/2026-04-16-w5-r0-archive-docs-plugin/02-archive-router-updates.md) | Work backlog phase — acceptance criteria checked off. |

### Developer

None this session.

### User

None this session.

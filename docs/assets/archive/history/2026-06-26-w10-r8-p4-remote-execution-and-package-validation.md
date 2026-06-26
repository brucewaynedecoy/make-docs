---
client: "Codex Desktop"
date: "2026-06-26"
coordinate: "W10 R8 P4"
repo: "make-docs"
branch: "make-docs-v2"
status: "completed"
summary: "Extended smoke-pack validation across npx, pnpm dlx, and Bun package runners."
---

# W10 R8 P4 Remote Execution and Package Validation

## Changes

Phase 4 extended packed-package smoke validation so the generated tarball is executed through `npx --package`, `pnpm dlx`, and `bun x --package` before the existing direct unpacked-bin install, skills, backup, and uninstall assertions continue.

- Added package-runner smoke cases to `scripts/smoke-pack.mjs` for npm, pnpm, and Bun remote execution from the packed tarball.
- Isolated each package-runner pass with its own temp root, working directory, target directory, `HOME`, `XDG_CACHE_HOME`, and package-manager cache/store roots.
- Asserted each remote runner creates the expected manifest, root docs router, installed instruction routers, reader-facing assets, managed-file tracking, no default skill files, and no optional project config.
- Preserved the existing deeper smoke-pack coverage for direct unpacked-bin help, repo-backed skill registry fixtures, base install, idempotent sync, selected-skill install, backup, uninstall, and unmanaged-file preservation.
- Updated the maintainer release guide and PRD 10 to record smoke-pack as the maintained package-runner proof for `npx`, `pnpm dlx`, and Bun.

Validation run:

- `npm run smoke:pack`
- `npm test -w packages/cli -- --reporter=dot`
- `npm run validate:defaults -w packages/cli`
- `npm run build -w packages/cli`
- `python3 .make-docs/scripts/check_path_hygiene.py --repo-root . --format json`
- `bash scripts/check-wave-numbering.sh`
- Refreshed the local jdocmunch docs index
- Changed-file Markdown link check
- `git diff --check`

Manual/UAT coverage remains deferred until W10 R8 wave closeout per the requested workflow.

`bash scripts/check-instruction-routers.sh` still reports the known root-router baseline (`./AGENTS.md` and `./CLAUDE.md` differ; `./CLAUDE.md` exceeds the 12-line budget). No Phase 4 router regression was introduced.

## Documentation

### Project

| Path | Description |
| --- | --- |
| [docs/work/2026-06-26-w10-r8-typescript-cli-operation-domains-and-mcp-runtime/04-remote-execution-and-package-validation.md](../../../work/2026-06-26-w10-r8-typescript-cli-operation-domains-and-mcp-runtime/04-remote-execution-and-package-validation.md) | Marked Phase 4 tasks complete and recorded implementation, coverage, and validation evidence. |
| [docs/prd/10-packaging-validation-and-release-reference.md](../../../prd/10-packaging-validation-and-release-reference.md) | Updated the packaging validation reference to make smoke-pack the maintained proof for `npx`, `pnpm dlx`, and Bun package-runner execution. |

### Developer

| Path | Description |
| --- | --- |
| `scripts/smoke-pack.mjs` | Added isolated package-runner smoke validation for `npx`, `pnpm dlx`, and Bun. |
| [docs/assets/library/developer/release-packaging-validation-and-release-reference.md](../../library/developer/release-packaging-validation-and-release-reference.md) | Updated the maintainer guide for the expanded smoke-pack validation contract and release procedure. |

### User

None this session.

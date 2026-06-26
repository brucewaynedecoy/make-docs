---
client: "Codex Desktop"
date: "2026-06-26"
coordinate: "W10 R8 P5"
repo: "make-docs"
branch: "make-docs-v2"
status: "completed"
summary: "Closed W10 R8 with support evidence for the TypeScript operation-domain and MCP runtime surfaces."
---

# W10 R8 P5 Closeout and Support Evidence

## Changes

Phase 5 closed W10 R8 by recording bounded support evidence for the TypeScript operation-domain and MCP runtime implementation: existing `make-docs operations ...` compatibility is preserved through modular closeout, work, and lifecycle domains; `make-docs mcp` ships a read-first and plan-first TypeScript stdio surface over the same operation domains and planner/classifier modules; MCP validation execution remains explicitly gated by `allowRun=true`; and packed-package execution is validated through npm, pnpm, and Bun package runners.

- Updated PRD 25 with the Phase 4 package-runner proof and the closeout support boundary for validated TypeScript CLI/MCP surfaces.
- Updated PRD 16 to record W10 R8 Phase 4 as the first packed-tarball proof for npm, pnpm, and Bun remote execution.
- Updated the risk register to preserve W16 R3 as lifecycle-helper mitigation evidence, W10 R8 Phase 2 as modular operation-domain evidence, W10 R8 Phase 3 as initial MCP parity evidence, and W10 R8 Phase 4 as release-boundary package-runner evidence.
- Marked Phase 5 complete and recorded the manual/UAT decision as not worthwhile because the remaining human-runnable scenario would duplicate package-runner, operation-domain, MCP parity, and built-server smoke coverage.

Validation run:

- `npm test -w packages/cli -- --reporter=dot`
- `npm run validate:defaults -w packages/cli`
- `npm run build -w packages/cli`
- `npm run smoke:pack`
- `python3 .make-docs/scripts/check_path_hygiene.py --repo-root . --format json`
- `bash scripts/check-wave-numbering.sh`
- Refreshed the local jdocmunch docs index
- Changed-file Markdown link check
- `git diff --check`

`bash scripts/check-instruction-routers.sh` still reports the known root-router baseline (`./AGENTS.md` and `./CLAUDE.md` differ; `./CLAUDE.md` exceeds the 12-line budget). No Phase 5 router regression was introduced.

## Documentation

### Project

| Path | Description |
| --- | --- |
| [docs/work/2026-06-26-w10-r8-typescript-cli-operation-domains-and-mcp-runtime/05-closeout-and-support-evidence.md](../../../work/2026-06-26-w10-r8-typescript-cli-operation-domains-and-mcp-runtime/05-closeout-and-support-evidence.md) | Marked Phase 5 complete and recorded support evidence, remaining MCP limits, validation, and manual/UAT coverage decisions. |
| [docs/prd/16-revise-package-and-deployment-boundaries.md](../../../prd/16-revise-package-and-deployment-boundaries.md) | Recorded W10 R8 Phase 4 as packed-tarball proof for npm, pnpm, and Bun remote execution. |
| [docs/prd/25-revise-cli-separation-and-mcp-boundary.md](../../../prd/25-revise-cli-separation-and-mcp-boundary.md) | Recorded the W10 R8 support boundary for validated TypeScript CLI/MCP runtime surfaces and remaining permission limits. |
| [docs/prd/03-open-questions-and-risk-register.md](../../../prd/03-open-questions-and-risk-register.md) | Updated no-scripts and skill-refactor risks with W10 R8 Phase 4 release-boundary evidence while leaving broader helper, write, plugin, shared-agentics, and delivery-model work open. |
| [docs/assets/archive/history/2026-06-26-w10-r8-p5-closeout-and-support-evidence.md](2026-06-26-w10-r8-p5-closeout-and-support-evidence.md) | Added this phase and wave closeout breadcrumb. |

### Developer

No additional developer guide changes this session.

### User

No additional user guide changes this session.

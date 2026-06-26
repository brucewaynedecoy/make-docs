---
client: "Codex Desktop"
date: "2026-06-26"
coordinate: "W10 R8 P1"
repo: "make-docs"
branch: "make-docs-v2"
status: "completed"
summary: "Established the TypeScript operation-domain architecture scaffold."
---

# W10 R8 P1 Operation Domain Architecture

## Changes

Phase 1 established the modular TypeScript operation-domain home for future CLI and MCP behavior while preserving the existing `make-docs operations ...` compatibility dispatch.

- Added `packages/cli/src/operations/` with `closeout`, `work`, and `lifecycle` domain descriptors and shared direct-call wrappers.
- Extracted shared operation JSON, error, provenance, render-mode, domain, command, and result types into `packages/cli/src/operations/types.ts`.
- Kept `packages/cli/src/operations.ts` as the current public dispatch layer and re-exported the shared error/type contract from the new module boundary.
- Added `packages/cli/tests/operation-domains.test.ts` so operation-domain logic can be invoked without CLI parser or MCP transport setup.
- Updated maintainer notes for operation-domain placement and removed stale Rust-forward wording from the CLI/MCP parity guide.

Validation run:

- `npm test -w packages/cli -- operation-domains operations --reporter=dot`
- `npm run build -w packages/cli`
- `git diff --check`

Manual/UAT coverage remains deferred until W10 R8 wave closeout per the requested workflow.

## Documentation

### Project

| Path | Description |
| --- | --- |
| [docs/work/2026-06-26-w10-r8-typescript-cli-operation-domains-and-mcp-runtime/01-operation-domain-architecture.md](../../../work/2026-06-26-w10-r8-typescript-cli-operation-domains-and-mcp-runtime/01-operation-domain-architecture.md) | Marked Phase 1 tasks complete and recorded implementation, coverage, and validation evidence. |
| [packages/cli/src/README.md](../../../../packages/cli/src/README.md) | Added maintainer guidance for the new operation-domain module layout. |

### Developer

| Path | Description |
| --- | --- |
| [docs/assets/library/developer/cli-mcp-operation-parity-and-permissions.md](../../library/developer/cli-mcp-operation-parity-and-permissions.md) | Updated the existing CLI/MCP operation parity guide with TypeScript-owned operation-domain guidance and W10 R7 Rust-shelving language. |

### User

None this session.

# Phase 01: Operation Domain Architecture

## Purpose

Define and implement the modular TypeScript operation-domain structure before moving behavior.

## Tasks

- [x] t1: Define operation domain folders that mirror CLI/MCP command domains.
- [x] t2: Extract shared operation input, output, error, provenance, and rendering types.
- [x] t3: Keep dispatch layers thin and free of domain logic.
- [x] t4: Add focused tests for direct operation-domain invocation without CLI parser or MCP transport.
- [x] t5: Update developer-facing architecture notes for future operation additions.

## Acceptance Criteria

- New deterministic behavior has an obvious module home.
- Operation-domain tests can run without CLI parser setup.

## Implementation Notes

- Added `packages/cli/src/operations/` with initial `closeout`, `work`, and `lifecycle` domains that mirror the `make-docs operations ...` command families.
- Moved shared `JsonValue`, `OperationError`, operation provenance, render-mode, domain, command, and result types into `packages/cli/src/operations/types.ts`.
- Kept the existing `packages/cli/src/operations.ts` command dispatch in place for compatibility while exporting the shared error/type contract from the new module boundary.
- Added parser-free direct domain coverage in `packages/cli/tests/operation-domains.test.ts`.
- Updated maintainer documentation in `packages/cli/src/README.md` and `docs/assets/library/developer/cli-mcp-operation-parity-and-permissions.md`.

## Coverage Decisions

- Developer guide: `update-existing`; `docs/assets/library/developer/cli-mcp-operation-parity-and-permissions.md` already owns operation parity and permission guidance, so it was updated rather than creating a duplicate guide.
- User guide: `none`; this phase defines internal maintainer architecture and does not create a new end-user workflow.
- PRD reconciliation: `none`; PRD 25 and PRD 26 already require modular TypeScript operation domains and parser-free tests, so no new PRD change doc was needed for this implementation phase.
- Manual/UAT: deferred until the full W10 R8 wave closeout per the requested workflow.

## Validation Evidence

- `npm test -w packages/cli -- operation-domains operations --reporter=dot`
- `npm run build -w packages/cli`
- `git diff --check`

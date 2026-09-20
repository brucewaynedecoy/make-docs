# Phase 02: CLI Shared-Core Operation Boundary

## Purpose

Create the deterministic operation surface that first-party skills can call before helper scripts are removed. W10 R7/W10 R8 later require the same operation surface to be modularized and exposed through TypeScript MCP tools.

## Tasks

- [x] t1: Inventory script-shaped behavior from `packages/cli/skill-registry.json`, `packages/skills/**/scripts/`, and `.make-docs/scripts/check_path_hygiene.py`.
- [x] t2: Define operation contracts for lifecycle-critical helpers first: closeout probing, closeout validation selection, closeout history drafting, work phase state, wave resolution, wave status, phase planning, checkpointing, scope guarding, and phase gates.
- [x] t3: Implement TypeScript CLI/shared-core operations before changing skill references.
- [x] t4: Add focused tests for deterministic inputs, outputs, dry-run/read-only behavior, provenance, and error semantics.
- [x] t5: Preserve existing script behavior through wrappers only after the equivalent operation exists.

## Implementation Notes

- Added `packages/cli/src/operations.ts` as the packaged TypeScript operation boundary for closeout probing, closeout validation selection, closeout history drafting, work phase state, wave resolution, wave status, phase planning, checkpointing, scope guarding, and phase gates.
- Exposed the operation boundary through `make-docs operations <operation>` from `packages/cli/src/cli.ts`, leaving existing installer, reconfigure, skills, backup, and uninstall behavior unchanged.
- Added focused tests in `packages/cli/tests/operations.test.ts` for deterministic phase parsing, wave status, phase planning, checkpoint state, scope guarding, phase gate evidence, closeout probe output, and CLI JSON output.
- Updated PRD 26 source anchors with the new operation module and test file.
- Script wrappers and skill references are intentionally deferred to Phase 3 now that equivalent packaged operations exist.
- UAT is intentionally deferred until the full W16 R3 wave is complete.

## Validation Evidence

- `npm test -w packages/cli -- --run tests/operations.test.ts`
- `npm test -w packages/cli -- --run tests/cli.test.ts tests/operations.test.ts`
- `npm run build -w packages/cli`

## Acceptance Criteria

- Each targeted helper has an equivalent CLI/shared-core operation.
- Focused tests prove operation parity before registry or skill assets are changed.
- No MCP implementation was required for W16 R3 itself; W10 R8 owns the required TypeScript MCP implementation.

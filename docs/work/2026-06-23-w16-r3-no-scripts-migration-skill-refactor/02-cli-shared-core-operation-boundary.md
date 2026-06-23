# P2 CLI Shared-Core Operation Boundary

## Purpose

Create the deterministic operation surface that first-party skills and future MCP tools can call before helper scripts are removed.

## Tasks

- [ ] Inventory script-shaped behavior from `packages/cli/skill-registry.json`, `packages/skills/**/scripts/`, and `.make-docs/scripts/check_path_hygiene.py`.
- [ ] Define operation contracts for lifecycle-critical helpers first: closeout probing, closeout validation selection, closeout history drafting, work phase state, wave resolution, wave status, phase planning, checkpointing, scope guarding, and phase gates.
- [ ] Implement TypeScript CLI/shared-core operations before changing skill references.
- [ ] Add focused tests for deterministic inputs, outputs, dry-run/read-only behavior, provenance, and error semantics.
- [ ] Preserve existing script behavior through wrappers only after the equivalent operation exists.

## Acceptance Criteria

- Each targeted helper has an equivalent CLI/shared-core operation.
- Focused tests prove operation parity before registry or skill assets are changed.
- No Rust or MCP implementation is required for this phase.

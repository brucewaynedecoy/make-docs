# Active PRD and Risk Reconciliation

## New PRD

- Add [25 Revise CLI Separation and MCP Boundary](../../prd/25-typescript-runtime-cli-mcp-operation-boundaries.md).
- Treat it as a W10 revision because it extends the package/deployment and CLI identity lineage while constraining future Rust and MCP ownership.

## Existing PRDs to Update

- [00-index.md](../../prd/00-index.md): add PRD 25 to reading order, document map, source anchors, audience paths, and intended follow-on.
- [07-cli-command-surface-and-lifecycle.md](../../prd/07-cli-command-surface-and-lifecycle.md): preserve no-command install/sync behavior and the explicit command set.
- [10-packaging-validation-and-release-reference.md](../../prd/10-packaging-validation-and-release-reference.md): add package proof for dual-runtime/version disclosure and CLI/MCP parity when implemented.
- [16-package-runtime-and-deployment-boundaries.md](../../prd/16-package-runtime-and-deployment-boundaries.md): clarify TypeScript npm installer ownership and Rust long-term MCP/runtime ownership.
- [17-system-asset-materialization-and-local-bootstrap.md](../../prd/17-system-asset-materialization-and-local-bootstrap.md): constrain MCP/Rust asset-provider behavior to accepted materialization contracts.
- [18-compatibility-classification-and-migration-safety.md](../../prd/18-compatibility-classification-and-migration-safety.md): require CLI/MCP write paths to classify source state before mutation.
- [20-agent-harness-conformance-and-support-claims.md](../../prd/20-agent-harness-conformance-and-support-claims.md): require conformance evidence before public CLI/MCP support claims.
- [21-project-tool-directory-and-resource-tiers.md](../../prd/21-project-tool-directory-and-resource-tiers.md): keep `scripts/` and `agentics/` as future CLI/MCP-owned resource surfaces, not independent behavior models.
- [24-project-configuration-and-convention-overlay.md](../../prd/24-project-configuration-and-convention-overlay.md): config labels remain rendering inputs across CLI, MCP, plugin, and skill surfaces.

## Risk Register Updates

- D-002 and D-006 remain open until public command docs and package README/tarball guidance describe the accepted no-command flow and dual-runtime posture.
- Q-012 remains open for shared skill/plugin install, but PRD 25 constrains routing through canonical CLI/MCP contracts.
- R-003, R-004, R-005, R-006, R-008, R-013, and R-014 remain active and gain CLI/MCP parity validation expectations.

## No-New-PRD Rationale Not Used

This design introduces a new product boundary for npm, Rust, MCP, and deterministic automation, so the active PRD set needs a dedicated change doc instead of only annotations.

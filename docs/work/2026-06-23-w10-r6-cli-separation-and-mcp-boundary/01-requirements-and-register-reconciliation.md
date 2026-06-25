# Requirements and Register Reconciliation

## Objective

Land the PRD and risk-register updates needed before CLI/MCP implementation starts.

## Tasks

- [x] t1: Add PRD 25 to the active PRD index and source anchors.
- [x] t2: Annotate affected PRDs with TypeScript installer ownership, Rust MCP ownership, and MCP parity constraints.
- [x] t3: Update risk register entries for command docs, package docs, shared skill/plugin routing, no-scripts migration, and parity validation.
- [x] t4: Keep unresolved remote skill, alternate manifest, and shared plugin install questions open.

## Acceptance Criteria

- PRD 25 is discoverable from the active PRD set.
- No affected PRD implies MCP can define a separate behavior model.
- Open risks preserve unresolved downstream decisions instead of over-closing them.

## Implementation Notes

| Task | Evidence |
| --- | --- |
| t1 | [PRD 25](../../prd/25-revise-cli-separation-and-mcp-boundary.md) is present and linked from [PRD index](../../prd/00-index.md) reading order, document map, source anchors, audience paths, and intended follow-on. |
| t2 | The affected PRD set already references PRD 25 where needed: [PRD 07](../../prd/07-cli-command-surface-and-lifecycle.md), [PRD 10](../../prd/10-packaging-validation-and-release-reference.md), [PRD 16](../../prd/16-revise-package-and-deployment-boundaries.md), [PRD 17](../../prd/17-revise-system-asset-materialization-contract.md), [PRD 18](../../prd/18-revise-compatibility-audit-and-migration-disposition.md), [PRD 20](../../prd/20-revise-agent-harness-model-conformance-lab.md), [PRD 21](../../prd/21-revise-tool-directory-system-custom-resource-tiers.md), and [PRD 24](../../prd/24-revise-configuration-convention-overlay.md). |
| t3 | [Risk register](../../prd/03-open-questions-and-risk-register.md) entries D-002, D-006, Q-012, R-003, R-004, R-005, R-006, R-008, R-013, and R-014 already carry the CLI/MCP package, command, shared-operation, no-scripts, and parity-validation constraints. |
| t4 | The unresolved remote skill, alternate manifest, shared plugin install, no-scripts migration, and parity-validation risks remain open; no open item was closed without implementation evidence. |

## Coverage Decisions

- PRD coverage: no PRD files changed in this phase because PRD 25 and its active-set annotations were already present and aligned with the W10 R6 source plan.
- Developer-guide coverage: no developer guide change was needed for Phase 1 because this phase reconciled requirements state rather than adding maintainer workflow beyond the PRD/register boundary.
- User-guide coverage: no user guide change was needed for Phase 1 because this phase did not change usable CLI behavior.
- UAT: deferred until the full W10 R6 wave is complete, per the active wave instruction.

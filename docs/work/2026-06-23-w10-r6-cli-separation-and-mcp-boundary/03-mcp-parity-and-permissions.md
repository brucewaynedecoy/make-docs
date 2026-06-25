# MCP Parity and Permissions

## Objective

Define MCP parity and permission checks before any MCP write surface is implemented.

## Tasks

- [x] t1: Map planned MCP tools to equivalent CLI/shared-core operations.
- [x] t2: Define read-first inspection outputs for manifest, harnesses, skills, materialization mode, and compatibility state.
- [x] t3: Define dry-run planning output for future installer-maintainer operations.
- [x] t4: Specify permission requirements before write tools.
- [x] t5: Add parity fixtures for manifest reads, config interpretation, asset provenance, compatibility classification, conflict handling, dry-run output, and write permissions.

## Acceptance Criteria

- Every MCP tool has an equivalent CLI/shared-core operation.
- Write tools remain blocked until permission and parity requirements are accepted.
- Provider-backed asset resolution preserves manifest provenance and local bootstrap readability.

## Implementation Notes

| Task | Evidence |
| --- | --- |
| t1 | Added [CLI/MCP Operation Parity and Permissions](../../assets/library/developer/cli-mcp-operation-parity-and-permissions.md), which maps planned MCP capability labels to CLI/shared-core owners and states that labels are not shipped tool ids. |
| t2 | The guide defines read-first output families for installed project state, manifest provenance, harnesses, skills, materialization mode, config overlay, and compatibility classification. |
| t3 | The guide defines dry-run planning vocabulary for install/sync/reconfigure/skills plans and lifecycle backup/uninstall review plans without approving mutation. |
| t4 | The guide keeps MCP writes blocked until a later permission model defines target scope, user approval, noninteractive behavior, conflict handling, backup/uninstall snapshot handling, provider/cache failure behavior, and result evidence. |
| t5 | The guide specifies fixture families for manifest reads, config interpretation, asset provenance, compatibility classification, conflict handling, dry-run output, write permissions, runtime identity, and conformance evidence. |

## Coverage Decisions

- PRD coverage: no PRD file changed. [PRD 25](../../prd/25-revise-cli-separation-and-mcp-boundary.md) already owns the effective MCP parity and permission boundary.
- Developer-guide coverage: created [CLI/MCP Operation Parity and Permissions](../../assets/library/developer/cli-mcp-operation-parity-and-permissions.md) and linked it from [Building and Installing the CLI Locally](../../assets/library/developer/cli-development-local-build-and-install.md) plus [Packaging, Validation, and Release Reference](../../assets/library/developer/release-packaging-validation-and-release-reference.md).
- User-guide coverage: no user guide change was needed. Phase 3 defines future maintainer implementation gates and does not expose current user-facing MCP behavior.
- UAT: deferred until the full W10 R6 wave is complete, per the active wave instruction.

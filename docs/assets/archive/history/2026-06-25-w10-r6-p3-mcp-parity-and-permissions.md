---
date: "2026-06-25"
coordinate: "W10 R6 P3"
repo: "make-docs"
branch: "make-docs-v2"
status: "completed"
summary: "Defined the W10 R6 maintainer contract for future MCP parity and write permissions."
---

# W10 R6 P3 MCP Parity and Permissions

## Changes

Completed W10 R6 Phase 3 by adding a maintainer-facing CLI/MCP parity guide that maps planned MCP capability labels to CLI/shared-core owners, defines read-first output and dry-run planning contracts, blocks writes behind a later permission model, and records parity fixture families for manifest reads, config interpretation, asset provenance, compatibility classification, conflict handling, dry-run output, write permissions, runtime identity, and conformance evidence.

### Coverage Decisions

- PRD coverage: no PRD files changed. [historical closeout](2026-06-25-w10-r6-p4-package-validation-and-closeout.md) (retired action-PRD: `docs/prd/25-revise-cli-separation-and-mcp-boundary.md`) already owns the effective MCP parity and permission requirement.
- Developer-guide coverage: created [CLI/MCP Operation Parity and Permissions](../../../assets/library/developer/cli-mcp-operation-parity-and-permissions.md) and linked it from adjacent CLI/package maintainer guides.
- User-guide coverage: no user guide was needed. Phase 3 defines future maintainer implementation gates and does not expose current user-facing MCP behavior.
- UAT: deferred until the full W10 R6 wave is complete, per the active wave instruction.

### Validation

- `python3 packages/skills/closeout-phase/scripts/work_phase_state.py docs/work/2026-06-23-w10-r6-cli-separation-and-mcp-boundary/03-mcp-parity-and-permissions.md --json`
- `git diff --check`
- `python3 .make-docs/scripts/check_path_hygiene.py --repo-root . --format json`
- Changed-file Markdown link resolver for the new guide, linked guides, Phase 3 work file, and this history record.
- `python3 packages/skills/closeout-phase/scripts/guide_coverage_probe.py --repo-root . --changed-files-json /tmp/w10-r6-p3-closeout-probe.json`

## Documentation

### Project

| Path | Description |
| --- | --- |
| [docs/work/2026-06-23-w10-r6-cli-separation-and-mcp-boundary/03-mcp-parity-and-permissions.md](../../../work/2026-06-23-w10-r6-cli-separation-and-mcp-boundary/03-mcp-parity-and-permissions.md) | Marked Phase 3 tasks complete and recorded MCP parity, permission, fixture, and coverage evidence. |
| [docs/assets/archive/history/2026-06-25-w10-r6-p3-mcp-parity-and-permissions.md](2026-06-25-w10-r6-p3-mcp-parity-and-permissions.md) | Added this phase closeout breadcrumb. |

### Developer

| Path | Description |
| --- | --- |
| [docs/assets/library/developer/cli-mcp-operation-parity-and-permissions.md](../../../assets/library/developer/cli-mcp-operation-parity-and-permissions.md) | Added the maintainer contract for future MCP operation mapping, read-first outputs, dry-run planning, permissions, and parity fixtures. |
| [docs/assets/library/developer/cli-development-local-build-and-install.md](../../../assets/library/developer/cli-development-local-build-and-install.md) | Linked maintainers to the new MCP parity guide before Rust or MCP work. |
| [docs/assets/library/developer/release-packaging-validation-and-release-reference.md](../../../assets/library/developer/release-packaging-validation-and-release-reference.md) | Linked package validation guidance to the MCP parity guide so smoke-pack proof is not mistaken for MCP support evidence. |

### User

None this session.

# MCP Parity and Permissions

## Objective

Define MCP parity and permission checks before any MCP write surface is implemented.

## Tasks

- Map planned MCP tools to equivalent CLI/shared-core operations.
- Define read-first inspection outputs for manifest, harnesses, skills, materialization mode, and compatibility state.
- Define dry-run planning output for future installer-maintainer operations.
- Specify permission requirements before write tools.
- Add parity fixtures for manifest reads, config interpretation, asset provenance, compatibility classification, conflict handling, dry-run output, and write permissions.

## Acceptance Criteria

- Every MCP tool has an equivalent CLI/shared-core operation.
- Write tools remain blocked until permission and parity requirements are accepted.
- Provider-backed asset resolution preserves manifest provenance and local bootstrap readability.

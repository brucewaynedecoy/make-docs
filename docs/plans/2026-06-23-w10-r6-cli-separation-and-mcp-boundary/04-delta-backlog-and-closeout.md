# Delta Backlog and Closeout

## Work Backlog Shape

Generate the paired work backlog under:

`docs/work/2026-06-23-w10-r6-cli-separation-and-mcp-boundary/`

The backlog should split implementation into:

1. Requirements and register reconciliation.
2. CLI runtime and command-boundary documentation.
3. MCP parity, read-first tooling, and permission model planning.
4. Package validation, public docs alignment, and closeout.

## Acceptance Criteria

- PRD 25 exists and is linked from the active PRD index.
- Affected PRDs record TypeScript package CLI runtime ownership and required TypeScript MCP ownership.
- MCP write behavior remains deferred behind explicit permission and parity planning.
- The paired work backlog references PRD 25 and affected baseline PRDs.
- Validation commands pass before local commit.

## Commit Plan

```text
plan: [W10 R6] CLI Separation and MCP Boundary

Define the v2 boundary between the TypeScript package CLI, modular operation-domain behavior, and the required MCP surface before deterministic scripts and skills are rewired.
```

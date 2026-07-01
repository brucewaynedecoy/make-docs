---
title: "Phase 5: MCP Derivation Parity and Template Doc Updates"
kind: "work"
status: "active"
coordinate: "W18 R11 P5"
source:
  type: "prd"
  path: "docs/prd/39-revise-cli-command-reorganization-and-operation-registry.md"
---

# Phase 5: MCP Derivation Parity and Template Doc Updates

## Purpose

End the CLI/MCP drift by deriving the agent surface from the same registry as the human surface, and finish the hard cutover in documentation by updating every template-owned file that teaches old command spellings, upstream first.

## Overview

Derive the MCP tool list and tool names from the Phase 1 registry so the renames follow the registry rather than a second hand-maintained list, keep the MCP delegation contract from PRD 25 intact, and update template-owned routers, guides, and READMEs in `packages/docs/template/` before dogfooding them into this repo's installed instance per the maintainer dogfooding rule.

## Source PRD Docs

- [39 Revise CLI Command Reorganization and Operation Registry](../../prd/39-revise-cli-command-reorganization-and-operation-registry.md)
- [25 Revise CLI Separation and MCP Boundary](../../prd/25-revise-cli-separation-and-mcp-boundary.md)
- [07 CLI Command Surface and Lifecycle](../../prd/07-cli-command-surface-and-lifecycle.md)

## Stage 1 - MCP Derivation Parity

### Tasks

- [ ] t1: Generate the MCP tool list from, or conformance-check it against, the registry so no operation is present in one surface and absent in the other (R-REG-2).
- [ ] t2: Derive MCP tool names from the registry identifiers so the MCP renames follow the same registry as the CLI (R-MIG-3).
- [ ] t3: Route MCP write gating through the injected execution context's uniform dry-run, write-permission, and approval enforcement, replacing the per-surface allow-write flag while preserving the PRD 25 delegation rule that each tool shares the equivalent CLI operation's reads, config interpretation, provenance, audit, dry-run, and write permissions (R-CORE-1, R-KEEP-1).

### Acceptance criteria

- The MCP tool list and the CLI `run` tree resolve from one registry, and a conformance check fails on any one-surface-only operation (R-TEST-1 seam).
- Every MCP tool name derives from its registry identifier, and no hand-maintained tool-name list remains.
- MCP safety gating flows through the shared execution context with behavior identical to the CLI surface for the same operation.

### Dependencies

- Phase 1 registry and core; Phase 4 final operation set.

## Stage 2 - Template-Owned Command-Spelling Updates

### Tasks

- [ ] t4: Inventory template-owned instruction routers, guides, and READMEs in `packages/docs/template/` (and the package README surfaces that ship) for old command spellings such as `operations`, the project-level `uninstall`, bare-sync descriptions, and `reconfigure`/`skills`/`backup` as top-level commands.
- [ ] t5: Update those files upstream in `packages/docs/template/` to the five-command tree spellings and the context-aware bare behavior, then dogfood the updates into this repo's `.make-docs/` and `docs/` installed instance per the maintainer dogfooding rule.

### Acceptance criteria

- No shipped template-owned router, guide, or README names a removed command spelling, and the upstream template and dogfood copies agree.
- The updates were authored upstream first and dogfooded downstream, never authored directly in this repo's installed instance.

### Dependencies

- Phases 2 through 4 fix the final spellings before documentation states them.

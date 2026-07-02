---
title: "Phase 2: Command Tree and Bare Command"
kind: "work"
status: "active"
coordinate: "W18 R11 P2"
source:
  type: "prd"
  path: "docs/prd/39-revise-cli-command-reorganization-and-operation-registry.md"
---

# Phase 2: Command Tree and Bare Command

## Purpose

Reorganize the flat top level into the five-command self/project/run/serve tree so the install lifecycle, the operation surface, and the MCP server stop sharing one mixed namespace, and make bare invocation context-aware without breaking the installer-first posture.

## Overview

Move the install lifecycle under `setup`, rename project uninstall to `setup remove`, expose the operation surface as `run` derived from the Phase 1 registry, keep `mcp` as the serve command, and reserve the top-level `update` and `uninstall` names for Phase 3's tool self-management. The wizard, review, conflict-resolution, lifecycle-safety, and shared audit-snapshot semantics from PRD 07 and PRD 05 remain active under the new spellings.

## Source PRD Docs

- [39 Revise CLI Command Reorganization and Operation Registry](../../prd/39-revise-cli-command-reorganization-and-operation-registry.md)
- [07 CLI Command Surface and Lifecycle](../../prd/07-cli-command-surface-and-lifecycle.md)
- [05 Installation Profile and Manifest Lifecycle](../../prd/05-installation-profile-and-manifest-lifecycle.md)
- [16 Revise Package and Deployment Boundaries](../../prd/16-revise-package-and-deployment-boundaries.md)

## Stage 1 - Five-Command Tree

### Tasks

- [x] t1: Implement the `setup` subtree — `setup`, `setup reconfigure`, `setup skills`, `setup backup`, `setup remove` — mapping from the current default install, `reconfigure`, `skills`, `backup`, and project-level `uninstall`, preserving the wizard, review, conflict, permission, and audit-snapshot semantics unchanged (R-TOP-1, R-TOP-2).
- [x] t2: Implement the `run` command as the operation surface generated from, or conformance-checked against, the Phase 1 registry, with multi-operation families as subtrees under a domain object mapping one-to-one to registry identifiers and standalone utilities flat (R-TOP-1, R-TOP-3, R-REG-2).
- [x] t3: Keep `mcp` as the top-level serve command and reserve top-level `update` and `uninstall` for tool self-management, removing the old top-level `operations` command and the old project-level `uninstall` spelling with no aliases (R-TOP-1, R-MIG-1).

### Acceptance criteria

- The top level is exactly `setup`, `run`, `mcp`, `update`, and `uninstall`, organized as self, project, run, and serve.
- `setup remove` performs the former project-level uninstall behavior, including its two-checkpoint confirmation and reviewed audit snapshot, and no `operations` or project-level `uninstall` spelling parses.
- Every `run` subtree maps one-to-one to registry identifiers, and no operation is reachable on the CLI outside the registry-derived tree.

### Dependencies

- Phase 1 registry and core; the tree is a consumer, never a second declaration (R-SEQ-1).

## Stage 2 - Context-Aware Bare Command

### Tasks

- [x] t4: Implement context-aware bare `make-docs`: with no install detected in the working directory, start a guided `setup` that asks before writing; with an install present, show status and help and do not auto-sync (R-BARE-1).

### Acceptance criteria

- Bare invocation with no install present begins guided setup and writes nothing without asking; bare invocation with an install present shows status and help and performs no sync writes.
- The installer-first no-command posture is preserved with no forced command-router (R-KEEP-1).

### Dependencies

- Stage 1 `setup` subtree.

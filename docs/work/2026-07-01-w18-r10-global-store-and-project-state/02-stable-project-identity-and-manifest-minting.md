---
title: "Phase 2: Stable Project Identity and Manifest Minting"
kind: "work"
status: "active"
coordinate: "W18 R10 P2"
source:
  type: "prd"
  path: "docs/prd/38-revise-global-store-and-project-state.md"
---

# Phase 2: Stable Project Identity and Manifest Minting

## Purpose

Give every project a stable identity so project-scoped state in the store survives clones, moves, and worktrees. This identity is the key the W18 R7 run-state records and the work-execution evidence rows both require, and minting it at setup is the manifest enhancement PRD 05 now carries.

## Overview

Mint a stable project identifier at setup, record it in the project's `.make-docs/manifest.json`, and make identifier-plus-row-key the only keying scheme for project-scoped rows in the store. Directory path may be recorded as secondary lookup metadata but is never identity.

## Source PRD Docs

- [38 Revise Global Store and Project State](../../prd/38-revise-global-store-and-project-state.md)
- [05 Installation Profile and Manifest Lifecycle](../../prd/05-installation-profile-and-manifest-lifecycle.md)
- [35 Revise Run Playbook State Machine](../../prd/35-revise-run-playbook-state-machine.md)

## Stage 1 - Identifier Minting and Manifest Recording

### Tasks

- [ ] t1: Choose and document the project-identifier generation algorithm as an implementer decision (D10 open choice), verifying it is stable across clones, moves, and worktrees and is manifest-recorded.
- [ ] t2: Mint the identifier during setup and record it in the project's `.make-docs/manifest.json`, extending the manifest schema with compatibility handling for existing installs that predate the identifier (R-ID-1).
- [ ] t3: Preserve PRD 05's manifest lifecycle safety: the identifier addition must not break bare sync, reconfigure, audit, backup, or uninstall behavior for manifests with or without an identifier.

### Acceptance criteria

- Setup on a fresh project writes a stable project identifier into `.make-docs/manifest.json`, and re-running setup or sync never re-mints or changes an existing identifier.
- Existing manifests without an identifier are migrated or handled explicitly rather than rejected or silently rewritten.
- The generation algorithm is recorded as an implementer decision and is not fixed in any PRD or template asset.

### Dependencies

- Phase 1 store bootstrap, so minted identity has a store to key into.

## Stage 2 - Identity as the Only Project-Scoped Key

### Tasks

- [ ] t4: Key every project-scoped row in the store by the project identifier plus the row's own key, and reject any code path that keys project-scoped state by directory path (R-ID-1, R-ID-2).
- [ ] t5: Record directory path only as secondary lookup metadata — usable for queries and display, never for identity resolution (R-ID-2).

### Acceptance criteria

- No store table or query resolves project identity from a path; identity resolution goes through the manifest-minted identifier.
- Project-scoped state written before a simulated directory move or clone is fully readable after it, because rows are keyed by identifier (feeds the R-TEST-2 assertion in Phase 5).

### Dependencies

- Stage 1 minting and the Phase 1 database.

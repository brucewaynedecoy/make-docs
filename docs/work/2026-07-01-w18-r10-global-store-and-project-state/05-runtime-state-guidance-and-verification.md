---
title: "Phase 5: Runtime-State Guidance and Verification"
kind: "work"
status: "active"
coordinate: "W18 R10 P5"
source:
  type: "prd"
  path: "docs/prd/38-global-store-and-project-state.md"
---

# Phase 5: Runtime-State Guidance and Verification

## Purpose

Close the relocation's documentation consequence and prove the whole change: the `.make-docs/` runtime-state guidance must stop naming `.make-docs/runs/` as a runtime-state location, and the D11 test suite must assert the store's contract holds.

## Overview

Update the upstream template's `.make-docs/` routers to reflect that run and work-execution state live in the global store while project `.make-docs/` retains the manifest and project config, dogfood the update into this repo, and land the R-TEST-1 through R-TEST-4 assertions plus packaged validation coverage.

## Source PRD Docs

- [38 Revise Global Store and Project State](../../prd/38-global-store-and-project-state.md)
- [21 Revise Tool Directory System Custom Resource Tiers](../../prd/21-project-tool-directory-and-resource-tiers.md)
- [17 Revise System Asset Materialization Contract](../../prd/17-system-asset-materialization-and-local-bootstrap.md)
- [35 Revise Run Playbook State Machine](../../prd/35-run-playbook-state-machine-and-portability.md)

## Stage 1 - Template Runtime-State Guidance, Upstream Then Dogfood

### Tasks

- [x] t1: Update `packages/docs/template/.make-docs/AGENTS.md` and `packages/docs/template/.make-docs/CLAUDE.md` so the runtime-state guidance no longer names `.make-docs/runs/` as a runtime-state location and instead states that run-state and work-execution evidence live in the machine-level global store while project `.make-docs/` retains `manifest.json`, `conflicts/`, and project config (upstream-first per the maintainer dogfooding rule).
- [x] t2: Sweep the upstream template for any other `.make-docs/runs/` runtime-state references and reconcile them the same way, preserving historical lineage text only where it is explicitly historical.
- [x] t3: Dogfood the updated guidance into this repo's installed instance — `.make-docs/AGENTS.md` and `.make-docs/CLAUDE.md` — through the reviewed re-seed flow, and confirm template/dogfood parity for the changed files.

### Acceptance criteria

- No current-guidance text in the upstream template or the dogfood instance names `.make-docs/runs/` as a live runtime-state location.
- The guidance names the global store as the home of run-state and work-execution evidence and keeps `manifest.json`, `conflicts/`, and project config as project `.make-docs/` state.
- The template copy was edited first and the dogfood copy matches it after the re-seed.

### Dependencies

- Phase 3 evidence migration, so the guidance describes shipped behavior rather than intent.

## Stage 2 - The D11 Test Suite and Packaged Validation

### Tasks

- [x] t4: Land a test asserting run-state and work-execution evidence are written to the global store and never to a repository path (R-TEST-1).
- [x] t5: Land a test asserting project-scoped state survives a simulated directory move or clone because it is keyed by the manifest identifier, not the path (R-TEST-2).
- [x] t6: Land a test asserting graceful degradation when the store database is missing or unreadable — the repository remains readable and state can be re-established (R-TEST-3).
- [x] t7: Land a test asserting `setup remove` prunes only the target project's rows and tool `uninstall` does not delete repository content (R-TEST-4).
- [x] t8: Extend packaged validation so the packed CLI proves store bootstrap, no repository-path state writes, and template/dogfood guidance parity for the changed `.make-docs/` routers.

### Acceptance criteria

- The four D11 assertions pass in the focused CLI test suite.
- State written before a simulated move or clone is fully readable after it; a missing database degrades gracefully; setup remove pruning is scoped to one project; uninstall leaves repository content intact.
- Packaged validation covers the store-backed behavior and fails if any state write lands under a repository path.

### Dependencies

- Phases 1 through 4 complete; Stage 1 guidance shipped so parity checks have final bytes to compare.

---
title: "Phase 6: Verification and Testing"
kind: "work"
status: "active"
coordinate: "W18 R11 P6"
source:
  type: "prd"
  path: "docs/prd/39-revise-cli-command-reorganization-and-operation-registry.md"
---

# Phase 6: Verification and Testing

## Purpose

Prove the reorganization's non-substitutable properties with the D10 test suite so registry parity, core isolation, lifecycle separation, migration safety, and pruning absence are pinned rather than asserted.

## Overview

Land the R-TEST-1 through R-TEST-4 assertions as focused tests, extend the packaged smoke validation to the new spellings, and confirm the whole wave leaves no half-migrated state per R-SEQ-1 and the R-024 register guards.

## Source PRD Docs

- [39 Revise CLI Command Reorganization and Operation Registry](../../prd/39-revise-cli-command-reorganization-and-operation-registry.md)
- [07 CLI Command Surface and Lifecycle](../../prd/07-cli-command-surface-and-lifecycle.md)
- [25 Revise CLI Separation and MCP Boundary](../../prd/25-revise-cli-separation-and-mcp-boundary.md)
- [38 Revise Global Store and Project State](../../prd/38-revise-global-store-and-project-state.md)

## Stage 1 - D10 Test Suite

### Tasks

- [ ] t1: Add a test asserting the CLI `run` tree and the MCP tool list are both derived from or conformance-checked against the registry, failing when any operation is present in one surface and absent in the other (R-TEST-1).
- [ ] t2: Add a test asserting surfaces contain no operation logic by invoking an operation through the core without the CLI parser or MCP transport (R-TEST-2).
- [ ] t3: Add a test asserting `run` exposes no `setup`, `mcp`, `update`, or `uninstall` operation and that a Playbook step cannot invoke tool lifecycle (R-TEST-3).
- [ ] t4: Add tests asserting pre-v2 detection triggers the warning-and-choice flow, `uninstall` confirms and does not delete repository content, and the pruned operations are absent from the `run` surface (R-TEST-4).

### Acceptance criteria

- No operation is present in one surface and absent in the other, proven by a failing conformance test on an injected mismatch (R-TEST-1).
- An operation executes through the core with no CLI parser or MCP transport loaded, proving surfaces carry no operation logic (R-TEST-2).
- `run` exposes no lifecycle command as an operation, and a Playbook `operation:` step cannot resolve to install, serve, update, or uninstall (R-TEST-3).
- The pre-v2 warning flow fires on `update`, `setup`, and `setup reconfigure` against a pre-v2 fixture; `uninstall` requires confirmation and leaves repository content intact; and wave-status, work-phase-state, phase-plan, phase-gate, scope-guard, closeout-probe, closeout-validate, and closeout-history are absent from the `run` surface (R-TEST-4).

### Dependencies

- Phases 1 through 5 complete.

## Stage 2 - Wave Closure Checks

### Tasks

- [ ] t5: Extend the packaged smoke validation to exercise the new spellings — `setup`, `setup remove`, `run playbook status`, `run package plan`, bare invocation in both contexts, `update`, and `uninstall` — through the packed tarball paths per the PRD 16 validation boundary.
- [ ] t6: Verify the R-SEQ-1 same-wave property at closure: every retained operation is registry-backed, no hand-wired surface entry remains, and no removed spelling parses anywhere, closing the half-migrated-state exposure recorded as R-024.

### Acceptance criteria

- Packed-package smoke runs cover the five-command tree and both bare-invocation contexts without regressing the existing install, skills, backup, and remove assertions.
- A closure check demonstrates zero non-registry operations on any surface and zero accepted legacy spellings, satisfying the R-024 close conditions attributable to this wave.

### Dependencies

- Stage 1 test suite green.

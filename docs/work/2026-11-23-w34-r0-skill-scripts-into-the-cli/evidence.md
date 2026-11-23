---
title: "W34 R0 Evidence Report"
kind: "work"
status: "active"
coordinate: "W34 R0"
---

# W34 R0 Evidence Report

This report explains the acceptance evidence for the [W34 R0 backlog](00-index.md). Each section names the acceptance cases it covers, what was run, what it showed, and its limits.

## PRD Pass

Evidence date: 2026-11-23. Base commit: `96b2b6cf` on `docs/w29-w30-work-store-and-factory`.

### What Changed

- [PRD 39](../../prd/39-cli-command-model-and-operation-registry.md): R-TOP-1 names Markdown style and document relations in `project`, and decomposition output in `check`. New R-SKILL-CHECK-1 to R-SKILL-CHECK-7 define the four operations by operation ID, with their access, inputs, output, and shared rule IDs.
- [PRD 25](../../prd/25-typescript-runtime-cli-mcp-operation-boundaries.md): new R-SKILL-RUNTIME-7 sets the MCP, CLI, agent-form order, the manual-review result, and the twin rule ID test. `Domain and Script Classification` says that a first-party Skill ships no Python and no hand-written script.
- [PRD 08](../../prd/08-skills-catalog-and-distribution.md): new R-SKILL-BUNDLE-7, a line in `Explicit Selected-Skill Model`, and two Validation Boundary items.
- [PRD 51](../../prd/51-backlog-review-and-reporting.md): R-BACKLOG-SKILL-21 says that CLI source holds the collector and the render wrapper, and that the Skill ships generated bundles.
- [Register](../../prd/03-open-questions-and-risk-register.md): D-064 names W34 R0 as its closing Wave and stays open. R-008 says that W34 R0 retires the remaining helper scripts.
- Each changed PRD has a `2026-11-23 — W34 R0` Requirement History entry.

### Left to P1

The name catalog does not hold the four commands and tools yet. The name catalog test fails a PRD 25 R-MCP-PROFILE line that names a tool outside the catalog. The shipped-text test fails a PRD line that names a `make-docs` path outside the catalog. `compareRRun1` accepts a planned path only in the `work` and `factory` groups. So these lines wait:

- P1 T1: the CLI paths and MCP names in PRD 39 R-SKILL-CHECK, its registry table, and PRD 25 R-MCP-PROFILE-11.
- P1 T2: `decomposition` in the active `check` list of PRD 39 R-RUN-1, when its operation is current.

The plan did not name one more fact. The catalog's registry coverage rule fails any `check` entry that is not a read-only registry operation, so a planned `check decomposition` entry fails it today. P1 T1 lets a planned `check` entry pass that rule until the registry holds it.

### Checks

- `npx vitest run tests/name-catalog.test.ts tests/w33-r0-shipped-text-names.test.ts tests/consistency.test.ts` in `packages/cli`: 3 files and 92 tests passed.
- `make-docs check prd --target-root .` with a temporary `MAKE_DOCS_HOME`: passed with 0 diagnostics.

## P1 CLI Operations and Ported Tests

Covers A1 to A8 in [P1](01-cli-operations-and-ported-tests.md). Not started. This section will hold the rule ID lists, the map from each Python test method to its vitest case, the parity results, the Guided Progress Review, and the side-by-side run.

## P2 Skill Text and Guides

Covers A9 to A12 in [P2](02-skill-text-and-guides.md). Not started.

## P3 Backlog-Review Bundles

Covers A13 to A15 in [P3](03-backlog-review-bundles.md). Not started.

## P4 Removal and Guard

Covers A16 to A19 in [P4](04-removal-and-guard.md). Not started.

## P5 Acceptance

Covers A20 to A22 in [P5](05-acceptance.md). Not started.

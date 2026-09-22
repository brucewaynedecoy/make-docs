---
title: "Phase 2: Deterministic Snapshot Operation"
kind: "work"
status: "complete"
coordinate: "W23 R0 P2"
source:
  type: "prd"
  path: "docs/prd/51-backlog-review-and-reporting.md"
---

# Phase 2: Deterministic Snapshot Operation

## Purpose

Implement the accepted snapshot contract in the shared TypeScript operation architecture.

## Overview

This phase builds private collectors, one public read-only operation, and registry-derived CLI and MCP projections. It cannot begin until W22 settles the applicable shared boundary.

## Human Experience Outcome

- Impact and governing promise or preserved boundary: Direct. Open phases, remaining tasks, closeout gaps, blockers, and conflicts remain visible and traceable.
- Intended human outcome: A reviewer receives stable facts and honest limits without needing Store setup or raw file reconstruction.
- Human-facing surface or indirect effect: CLI human output, JSON output, MCP result, and downstream Skill input.
- Implementation work: Safe discovery, collectors, diagnostics, operation handler, registry entry, surfaces, and parity tests.
- Evidence source or testing type selected under current authority: Automated operation-core, fixture, path-safety, CLI, MCP, and parity tests.
- Executor: Operation and surface implementation agents.
- Accepted obligation or deferral route: None.

This phase follows [PRD 51](../../prd/51-backlog-review-and-reporting.md) and the [Human Experience Contract](../../../.make-docs/system/contracts/human-experience-contract.md).

## Current Testing Decisions

| Testing type | Current decision | Decision record or `not-needed-now` reason |
| --- | --- | --- |
| Automated Implementation Testing | Required | Operation-core, fixture, path-safety, CLI, MCP, parity, and no-write coverage. |
| Performance Testing | `not-needed-now` | No accepted performance target or current performance decision exists. |
| Guided Progress Review | `not-needed-now` | P2 proves structured facts. Report presentation is reviewed in P3 and P4. |
| Unassisted Goal Testing | `not-needed-now` | This phase exposes a machine contract and supporting CLI result, not the final normal-use review flow. |

- Base maintenance action: `create`
- Performance applicability: `not-needed-now`
- Canonical `PERF-###` profile link or `none`: none
- Finite evidence budget and stop-rule reference or `not-applicable`: not-applicable
- Execution packet link or `not-applicable`: not-applicable
- Outcome and evidence handoff or `none`: none
- Gate disposition and supported-scope limit or `not-applicable`: not-applicable

## Source PRD Docs

- [PRD 51 Backlog Review and Reporting](../../prd/51-backlog-review-and-reporting.md)
- [PRD 25 TypeScript Runtime, CLI, MCP, and Operation Boundaries](../../prd/25-typescript-runtime-cli-mcp-operation-boundaries.md)
- [PRD 39 CLI Command Model and Operation Registry](../../prd/39-cli-command-model-and-operation-registry.md)
- [PRD 38 Global Store and Project State](../../prd/38-global-store-and-project-state.md)

## Source Obligations, Scenarios, And Findings

- `O: none`
- `NUAT: not-needed-now`
- `Finding: none`

## Stage 1 - Core collection and validation

### Tasks

- [x] t1: Run the W22 preflight. Confirm that the checkout contains W22 R0 P6 closeout commit `edd9d7e4` or later accepted authority. Reread current PRD 38 and PRD 39 authority. Confirm project-read, Store-none, and host-configuration-none access. Run the existing registry, access, CLI, and MCP contract tests. Stop P2 and report drift if any check fails. Do not create a temporary workaround. W22 publication or release is not required.
- [x] t2: Implement safe target-root resolution and bounded discovery of every live and archived backlog record, including directory-derived creation date and the accepted scoped Git and file-time hierarchy for deterministic last-updated evidence.
- [x] t3: Implement the private source-reader adapter, current-frontmatter reader, unsupported inventory reader, phase-map handling, unlinked-current-phase diagnostics, supported semantic collectors, discovered-file inventory, and optional Git facts. Do not implement legacy body parsing.
- [x] t4: Implement the accepted version 1 snapshot schema, rule catalog, fixed capability map, required-key rules, partial results, and diagnostics.
- [x] t5: Prove the operation core makes no project, Git, Store, or installation write.

### Acceptance criteria

- A10: Unsafe, missing, unreadable, symbolic-link, and escaping roots fail with stable typed diagnostics.
- A11: Repository facts remain available for Store absent, denied, unsafe, and unavailable cases.
- A12: Git unavailable and not-a-repository cases return labeled capability limits without losing repository facts. Last-updated evidence then uses the newest scoped file modification time or the explicit created-date fallback.
- A13: Recorded status and task or closeout conflicts remain separate visible facts.
- A14: The core passes all fixture classes without CLI or MCP transport. Contract fixtures cover supported current frontmatter, malformed and incomplete current frontmatter, no-frontmatter inventory-only records, unlinked current-format phases, the no-legacy-parse boundary, required keys, `null` values, empty arrays, record-count invariants, duplicate coordinates, each last-updated evidence source, fallback diagnostics, excluded product-source changes, and stable sort ties.

### Dependencies

- P1 accepted.
- Separate owner implementation authority.
- W22 preflight passed against P6 closeout commit `edd9d7e4` or later accepted authority.

## Stage 2 - Registry, CLI, MCP, and parity

### Tasks

- [x] t6: Register `work.backlog.snapshot` through the shared post-W22 registry path.
- [x] t7: Add the canonical CLI projection and human rendering without operation logic in the parser or renderer.
- [x] t8: Derive the MCP tool from the registry and preserve matching typed errors.
- [x] t9: Add CLI JSON, MCP, registry inventory, and bidirectional parity tests.
- [x] t10: Add package-boundary checks for the operation and all required runtime files.

### Acceptance criteria

- A15: Exactly one public backlog snapshot operation is active and its private collectors have no public identities.
- A16: CLI JSON and MCP results match for success, partial, conflict, unsupported, and failure cases.
- A17: Human CLI output leads with useful status and limits while exact structured data remains available through JSON.

### Dependencies

- A10-A14 complete.
- W22 shared registry, CLI, and MCP boundary stable enough for implementation.

### Closeout Notes

- Result: P2 is complete. It adds the read-only, Store-free `work.backlog.snapshot` operation, its canonical CLI path, its registry-derived MCP tool, and private repository collectors.
- Preflight: W22 R0 P6 closeout commit `edd9d7e4` is an ancestor of the tested checkout. Current PRD 38 and PRD 39 authority was reread. The operation declares project-read, Store-none, and host-configuration-none access. The existing six-file registry, access, CLI, and MCP set passed 74 of 74 tests before implementation.
- Verification: 87 of 87 focused P2 and shared-surface tests passed. The full CLI suite passed 88 files and 1,417 tests, with 1 file and 5 tests skipped. TypeScript, the CLI package build, and `git diff --check` passed.
- Repository proof: The built CLI found 70 records: 46 live and 24 archived. It interpreted 22 current-frontmatter records, kept 48 no-frontmatter records as inventory only, read 88 linked phases and 1,504 tasks, kept Store at `not-used`, and reported stable conflict, source-link, and unsupported-shape diagnostics.
- Human Experience Review: `satisfied` for the P2 CLI surface. Human text leads with record counts and the live/archive split. It then states detail limits and directs the reader to JSON for exact evidence and safe next actions. The reviewer was Codex. This agent review does not claim a person's lived response or the final report experience.
- Coverage: Guide and system-resource edits are `none`; P3 owns the shipped Skill and agent guidance. PRD edits are `none` because the implementation matches PRD 51. Performance Testing, Guided Progress Review, and Unassisted Goal Testing are `not-needed-now` for P2.
- Evidence: [Central evidence report](evidence.md).
- History: [P2 closeout record](../../../.make-docs/archive/history/2026-09-20-w23-r0-p2-deterministic-snapshot-operation.md).
- Boundary: P3 had not started at P2 closeout. P2 adds no Skill, report model execution, HTML report, Store integration, setup behavior, package publication, or release. After the accepted phase insertion, final capability acceptance is P6.

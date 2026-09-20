---
title: "W19 R0 Phase 2: Automation, State, and Packaging Retirement"
kind: "plan"
status: "draft"
coordinate: "W19 R0"
---

# W19 R0 Phase 2: Automation, State, and Packaging Retirement

## Purpose

Remove the workflow-engine surface from the Make Docs CLI: the run-state machine, progression, gates, resume, execution modes, portability, the packaging compiler, the harness adapter registry, capability descriptors, distributables, materialization, the registration seam, the persisted run table, and the test layer that exists solely to verify them. This is the phase that makes Protocol narrow in fact rather than in name.

## Removal Discipline

Every deletion in this phase is gated on North Star principle 5: trace what actually calls a symbol before removing it, using `jcodemunch` `find_references`, `check_references`, `find_importers`, and `get_blast_radius`, and record the trace. Nothing is removed on the inference that a contract or reference "must cover" the behavior.

Where a trace shows a caller outside the retired boundary, the caller is the finding: either the caller is itself in scope for retirement, or the symbol is load-bearing and must be preserved and re-scoped, with the exception recorded in the phase history record. North Star principle 4 governs the residual risk: removed logic stays recoverable in version history, so a step that later proves painful is promoted back as a targeted operation rather than a rewrite.

## Removal Inventory

### Runtime — run state and progression

| Surface | Path | Disposition |
| --- | --- | --- |
| Run state records, cursors, evidence, staleness, child runs, transitions | `packages/cli/src/operations/playbook/run-state.ts` | Remove |
| Progression engine | `packages/cli/src/operations/playbook/progression.ts` | Remove |
| Execution modes and digest-aware resume | `packages/cli/src/operations/playbook/execution.ts` | Remove |
| Portability, export and import shapes | `packages/cli/src/operations/playbook/portability.ts` | Remove |
| Contract bindings for run operations | `packages/cli/src/operations/playbook/contract.ts` | Reduce to the surviving shape-validation contract, or remove if empty |
| Progression operations | `packages/cli/src/operations/playbook/ops/start.ts`, `next.ts`, `advance.ts`, `gate.ts`, `resume.ts`, `close.ts`, `status.ts`, `invoke.ts`, `capabilities.ts`, `run-export.ts`, `run-import.ts` | Remove |
| Surviving operations | `packages/cli/src/operations/playbook/ops/catalog.ts`, `resolve.ts`, `validate.ts` | Rename to `protocol.*` in phase 4; keep only what phase 4's trace confirms |

The eleven removed operation IDs are `playbook.start`, `playbook.next`, `playbook.advance`, `playbook.gate`, `playbook.resume`, `playbook.close`, `playbook.status`, `playbook.invoke`, `playbook.capabilities`, `playbook.run.export`, and `playbook.run.import`.

### Runtime — packaging and compiler

All fourteen files under `packages/cli/src/operations/playbook-packaging/` are removed: `adapters.ts`, `capability-descriptor.ts`, `compiler.ts`, `descriptors.ts`, `distributable.ts`, `index.ts`, `materialization.ts`, `planner.ts`, `registration-seam.ts`, `support-binding.ts`, `surface-resolution.ts`, `types.ts`, `validation.ts`, `writers.ts`.

The four `package.*` operations in `packages/cli/src/operations/package/ops/` — `package.plan`, `package.surface-resolve`, `package.write`, `package.ship` — are traced. Any part of the package pipeline that exists only to lower a Playbook model is removed with it. Any part that serves a non-Playbook purpose is preserved and re-scoped, and the split is recorded. `packages/cli/src/plugin-substrate/` is traced the same way: the substrate keeps responsibilities that stand alone and loses the Playbook-sourced bundle path.

Export paths of the form `.make-docs/exports/playbook-packages/{packageId}` are removed, including any cleanup or backup handling that targets them.

### Frontend — parser and validator reduction

`packages/cli/src/playbook/` is reduced, not wholly removed, because Protocol keeps shape validation. Phase 3 authors the narrowed contract; this phase implements the reduction against it.

| Component | Disposition |
| --- | --- |
| `parser/workflow-block.ts`, `parser/dependencies-block.ts`, `parser/yaml-nodes.ts` (if only these consume it), `parser/resolve.ts` | Remove — no workflow block, no dependency registry, no resolved execution model |
| `parser/frontmatter.ts`, `parser/headings.ts`, `parser/markdown-scan.ts`, `source-span.ts` | Keep — shape validation needs frontmatter, the heading spine, and spans for diagnostics |
| `validator/workflow.ts`, `validator/orchestration-policy.ts`, `validator/cross-reference.ts` | Remove |
| `validator/structural.ts`, `validator/consistency.ts`, `validator/registry.ts`, `validator/index.ts` | Keep, narrowed to the surviving diagnostics |
| `model.ts` | Reduce to the Protocol document model; remove step, mode, event, gate, dependency, and child-policy types including `PLAYBOOK_CHILD_PLAYBOOK_POLICIES`, `PLAYBOOK_DEFAULT_STEP_MODE`, and `PLAYBOOK_WORKFLOW_BLOCK_INFO` |
| `detection.ts` | Keep, retargeted at the Protocol file suffix chosen in phase 3 |
| `diagnostics.ts` | Keep; retire the diagnostic codes whose rules no longer exist |

Diagnostic families retired with their rules include the `PB-WF-*` workflow codes (005, 006, 010, 011, 016 through 024), the `PB-DEP-*` dependency codes (003, 004, 009, 014, 015, 022, 025, 030), and any packaging-hint code. Surviving families are the frontmatter, heading-spine, narrative-section, and file-form codes, renamed in phase 3 if the contract renames the prefix.

### Storage

| Surface | Path | Disposition |
| --- | --- | --- |
| `playbook_runs` table definition | `packages/cli/src/store/database.ts` | Remove, with a schema-version step so existing stores drop it cleanly rather than failing to open |
| Insert, update, select, and delete statements for run records | `packages/cli/src/store/state-rows.ts` | Remove |
| `playbook_runs: "relocated-canonical"` project-state classification | `packages/cli/src/store/project-state.ts` | Remove |
| Legacy run-state directories under `.make-docs/runs/` | `.make-docs/runs/` | Retain existing dated run records as provenance; the code that writes new ones is removed. Deleting historical run records is a separate, separately authorized decision. |

### Tests

Removed with their subjects: `playbook-packaging.test.ts`, `playbook-packaging-adapters.test.ts`, `playbook-packaging-capability.test.ts`, `playbook-packaging-compiler.test.ts`, `playbook-packaging-lifecycle.test.ts`, `playbook-packaging-registration-seam.test.ts`, `playbook-packaging-verification.test.ts`, `playbook-progression.test.ts`, `playbook-run-guardrails.test.ts`, `playbook-run-portability.test.ts`, `playbook-three-tiers.test.ts`.

Narrowed rather than removed: `playbook-parser.test.ts`, `playbook-validator.test.ts`, `playbook-fixtures.test.ts`, `playbook-operations.test.ts`, `registry-playbook-ops.test.ts`. These are renamed to `protocol-*` in phase 4 and retained at the coverage the narrowed contract needs.

Fixtures under `packages/cli/tests/fixtures/playbooks/` are re-cut against the Protocol contract: the `pb-wf-*` and `pb-dep-*` invalid fixtures are removed with their rules, the frontmatter, heading, and file-form fixtures are retained and retargeted, and the valid fixtures are rewritten as Protocol documents.

Suites are **deleted, not skipped**. A skipped suite is a false claim of coverage.

### Scripts

`scripts/smoke-pack.mjs` carries 40 playbook references. It is traced and reduced to the surviving pack surface, or removed if its only purpose is the retired packaging pipeline.

## Sequencing Within The Phase

1. Trace and record invocations for every symbol in the inventory. Produce the trace evidence before any deletion.
2. Remove packaging first. It is the outermost consumer and has the fewest inbound dependencies.
3. Remove run state, progression, execution, and portability next, together with their operations.
4. Remove the store table and its statements, with the schema-version step.
5. Reduce the parser, validator, and model against the phase-3 contract.
6. Delete the retired suites and re-cut fixtures.
7. Run the full test suite and the repository's validation commands. A green run with retired suites deleted is the phase gate.

## Acceptance

- Every removal cites a recorded trace; no symbol was removed on inference.
- No `playbook_runs` table, run record, cursor, gate decision, or execution-evidence type survives in the codebase.
- No compiler, adapter registry, capability descriptor, distributable, materialization, or registration-seam code survives.
- The eleven retired operation IDs are absent from the operation registry and from both projections.
- No test is skipped in place of being deleted; the suite is green.
- Load-bearing exceptions found during tracing are recorded with their disposition in the phase history record at `docs/assets/archive/history/2026-08-11-w19-r0-p2-automation-state-and-packaging-retirement.md`.

## Non-Goals For This Phase

- Renaming anything. Phase 4 owns naming; this phase removes.
- Authoring the Protocol contract. Phase 3 owns it; this phase implements the reduction against it.
- Editing Persona or Naive UAT implementation files.
- Deleting historical run records under `.make-docs/runs/` or anything under `docs/assets/archive/`.

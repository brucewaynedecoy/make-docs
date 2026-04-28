# CLI Lifecycle Clack Standardization - Implementation Plan

## Purpose

Implement the lifecycle UX change request designed in [2026-04-22-cli-lifecycle-clack-standardization.md](../../designs/2026-04-22-cli-lifecycle-clack-standardization.md). This is **Wave 7 Revision 1** (`w7-r1`): a revision of the Wave 7 lifecycle work that standardizes `make-docs backup` and `make-docs uninstall` on the same Clack-backed interaction model used by the rest of the CLI.

## Objective

- `backup` and `uninstall` production workflow rendering is routed through a lifecycle renderer abstraction backed by Clack primitives.
- Direct stdout boxes and raw path group writers stop being the primary production UI for lifecycle audit, warning, noop, cancellation, completion, and failure states.
- Existing lifecycle behavior remains unchanged: audit rules, backup copy rules, uninstall removal semantics, `.backup/` exclusions, `uninstall --backup` single-audit behavior, `--yes`, and non-TTY confirmation failures stay stable.
- Tests assert the rendering contract semantically instead of only asserting behavioral side effects.
- Full CLI validation proves this rework does not regress apply, reconfigure, skills, backup, or uninstall flows.

## Change Classification

- Requested change type: `revision`
- Effective execution mode: focused implementation plan from a `change-plan` design route
- Active PRD namespace status: `docs/prd/` currently contains router files only, so this plan does not create PRD change docs unless a future execution step first seeds an active PRD set.
- Cleanup rewrite requested: no
- Full backlog regeneration requested: no

## Phase Map

| File | Purpose |
| ---- | ------- |
| `01-renderer-boundary.md` | Refactor lifecycle presentation behind a Clack-backed renderer contract while preserving command behavior. |
| `02-backup-clack-workflow.md` | Route backup audit, prompt, noop, cancellation, and completion output through the lifecycle renderer. |
| `03-uninstall-clack-workflow.md` | Route uninstall warning, audit, final confirmation, backup-before-remove, cancellation, success, and partial-failure output through the lifecycle renderer. |
| `04-tests-and-validation.md` | Add semantic renderer coverage and run the final build, test, and smoke validation pass. |

## Dependencies

- Phase 1 depends on the design doc and the existing Clack renderer patterns in `packages/cli/src/wizard.ts` and `packages/cli/src/skills-ui.ts`.
- Phase 2 depends on Phase 1 because backup should consume the renderer boundary rather than adding more direct output helpers.
- Phase 3 depends on Phase 1 and should reuse any backup-facing renderer primitives from Phase 2 where the workflow states overlap.
- Phase 4 depends on Phases 1-3 and is the final validation and cleanup pass.

## Worker Ownership

| Worker | Scope | Write Scope | Dependencies | Deliverables |
| ------ | ----- | ----------- | ------------ | ------------ |
| Lifecycle renderer worker | Define the renderer interface and Clack-backed implementation. | `packages/cli/src/lifecycle-ui.ts` plus narrowly required type exports in `packages/cli/src/types.ts` if needed. | Existing lifecycle UI functions and Clack patterns. | A production renderer that owns lifecycle warnings, audit summaries, prompts, noop/cancelled states, success, and failure summaries. |
| Backup workflow worker | Convert backup execution to use the renderer boundary. | `packages/cli/src/backup.ts`, backup-specific lifecycle UI call sites, and focused backup tests. | Phase 1 renderer contract. | Backup workflow output no longer relies on raw stdout boxes as the production surface. |
| Uninstall workflow worker | Convert uninstall execution to use the renderer boundary. | `packages/cli/src/uninstall.ts`, uninstall-specific lifecycle UI call sites, and focused uninstall tests. | Phase 1 renderer contract and any shared primitives from Phase 2. | Uninstall warning, review, backup-before-remove, cancellation, completion, and partial-failure states render through Clack-backed lifecycle UI. |
| Validation worker | Add coverage and run final checks. | `packages/cli/tests/*` and documentation examples only if output examples are affected. | Phases 1-3. | Semantic renderer tests, stable existing behavior tests, and passing build/test/smoke commands. |

## MCP Strategy

- Use `jcodemunch` for code symbol discovery and file outlines before implementation, especially for `backup.ts`, `uninstall.ts`, `lifecycle-ui.ts`, `wizard.ts`, `skills-ui.ts`, and `cli.ts`.
- Use `jdocmunch` for design, plan, history, and project-doc lookup when the relevant docs are indexed.
- Fallback to targeted `rg`, `sed`, and local file reads only when new local files have not yet been indexed or when exact local content is required.

## Validation

1. `make-docs backup` still audits once, shows review information, honors `--yes`, preserves noop behavior, and creates the same backup layout.
2. `make-docs uninstall` still shows the two-step safety model when interactive, honors `--yes`, preserves `uninstall --backup` single-audit behavior, and removes only audited paths.
3. Lifecycle audit and result presentation is routed through a Clack-backed lifecycle renderer in production.
4. Tests cover backup and uninstall cancellation, noop, success, partial failure, `--yes`, and non-TTY confirmation guidance.
5. `npm run build -w make-docs`, `npm test -w make-docs`, and `node scripts/smoke-pack.mjs` pass.

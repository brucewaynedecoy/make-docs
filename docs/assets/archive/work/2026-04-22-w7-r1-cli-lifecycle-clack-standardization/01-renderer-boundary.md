# Phase 1: Renderer Boundary

> Derives from [Phase 1 of the W7 R1 plan](../../plans/2026-04-22-w7-r1-cli-lifecycle-clack-standardization/01-renderer-boundary.md).

## Purpose

Create the lifecycle UI boundary that makes Clack the production rendering path for backup and uninstall workflow presentation without changing audit, backup, or removal semantics.

## Overview

This phase owns the shared renderer contract in `packages/cli/src/lifecycle-ui.ts`. It should turn lifecycle rendering into semantic methods that backup and uninstall can call, backed by Clack primitives for production and by a deterministic adapter or recording renderer for tests.

## Source PRD Docs

- None. This backlog is derived from a design and implementation plan; no active PRD namespace exists for this repo change.

## Source Design and Plan Docs

- [2026-04-22-cli-lifecycle-clack-standardization.md](../../designs/2026-04-22-cli-lifecycle-clack-standardization.md)
- [01-renderer-boundary.md](../../plans/2026-04-22-w7-r1-cli-lifecycle-clack-standardization/01-renderer-boundary.md)
- [2026-04-18-cli-help-backup-and-uninstall.md](../../designs/2026-04-18-cli-help-backup-and-uninstall.md)

## Stage 1 - Inventory Current Lifecycle Rendering

### Tasks

1. Review `packages/cli/src/lifecycle-ui.ts` and identify every direct stdout production helper: audit boxes, path groups, noop output, cancellation output, completion summaries, and failure summaries.
2. Review current backup and uninstall call sites in `packages/cli/src/backup.ts` and `packages/cli/src/uninstall.ts`.
3. Review existing Clack renderer patterns in `packages/cli/src/wizard.ts` and `packages/cli/src/skills-ui.ts`.
4. Record which current lifecycle messages are behaviorally significant and must remain semantically present after the renderer change.

### Acceptance criteria

- [x] Current lifecycle rendering helpers are mapped to future renderer methods.
- [x] Backup and uninstall call sites that need conversion are identified.
- [x] Existing Clack patterns that should be reused are identified.
- [x] Safety-critical labels, totals, and guidance strings are listed before refactoring begins.

### Dependencies

- W7 R1 plan Phase 1.
- Existing W7 R0 lifecycle implementation.

## Stage 2 - Define the Renderer Contract

### Tasks

1. Add a lifecycle renderer interface or equivalent typed contract in `packages/cli/src/lifecycle-ui.ts`.
2. Include methods for workflow intro/title, warning panels, audit summaries, grouped path reviews, confirmation prompts, noop summaries, cancellation summaries, success summaries, and failure summaries.
3. Make the contract payloads carry semantic data rather than preformatted terminal strings.
4. Keep the contract narrow enough that backup and uninstall do not need to know how terminal output is formatted.

### Acceptance criteria

- [x] `lifecycle-ui.ts` exposes a clear lifecycle renderer contract.
- [x] Renderer methods cover all current backup and uninstall workflow states.
- [x] Payloads contain operation mode, target, destination or backup status, path groups, counts, and error details where needed.
- [x] Backup and uninstall can depend on semantic renderer methods rather than direct formatting helpers.

### Dependencies

- Stage 1 inventory.

## Stage 3 - Implement the Clack-Backed Renderer

### Tasks

1. Implement a production lifecycle renderer using Clack primitives such as `intro`, `note`, `confirm`, `isCancel`, and `outro` where appropriate.
2. Preserve the current lifecycle permission model: `allow-all` skips prompts; `confirm` prompts with a TTY; missing TTY throws actionable guidance.
3. Keep summary copy concise and safety-oriented.
4. Avoid decorative output that forces brittle snapshot tests.
5. Remove or demote direct stdout box helpers from the production rendering path.

### Acceptance criteria

- [x] Production lifecycle rendering uses Clack primitives for warnings, summaries, prompts, and workflow closure.
- [x] `allow-all` and non-TTY confirmation behavior remain stable.
- [x] Direct stdout helpers are no longer the core production lifecycle UI abstraction.
- [x] Safety-critical labels and totals remain visible through the Clack-backed renderer.

### Dependencies

- Stage 2 renderer contract.

## Stage 4 - Add Test Adapter Support

### Tasks

1. Add a recording or fake renderer that tests can use to assert semantic lifecycle events.
2. Keep the test adapter local to tests unless production injection requires a narrow exported helper.
3. Cover prompt outcomes without requiring live TTY behavior.
4. Ensure test scaffolding can verify event order for review, confirmation, execution, and completion.

### Acceptance criteria

- [x] Tests can inspect lifecycle rendering semantically without snapshotting decorative output.
- [x] Prompt approval, prompt cancellation, and prompt skipping can be simulated.
- [x] Event order can be asserted for backup and uninstall.
- [x] Existing TTY-oriented tests still have a path to verify non-TTY errors.

### Dependencies

- Stage 2 renderer contract.
- Stage 3 production renderer behavior.

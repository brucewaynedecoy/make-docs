# Phase 1 - Renderer Boundary

## Objective

Create a lifecycle UI boundary that makes Clack the production rendering path for backup and uninstall workflow presentation without changing audit, backup, or removal semantics.

## Depends On

- [2026-04-22-cli-lifecycle-clack-standardization.md](../../designs/2026-04-22-cli-lifecycle-clack-standardization.md)
- Existing lifecycle presentation helpers in `packages/cli/src/lifecycle-ui.ts`.
- Existing Clack-backed patterns in `packages/cli/src/wizard.ts` and `packages/cli/src/skills-ui.ts`.

## Files to Modify

| File | Change Summary |
| ---- | -------------- |
| `packages/cli/src/lifecycle-ui.ts` | Replace direct production stdout helpers with a renderer interface plus Clack-backed implementation. |
| `packages/cli/src/types.ts` | Add shared lifecycle renderer types only if they need to be reused across modules. |
| `packages/cli/tests/lifecycle.test.ts` or new lifecycle UI tests | Cover renderer behavior without over-snapshotting decorative output. |

## Detailed Changes

### 1. Define the lifecycle renderer contract

Add a small renderer abstraction that owns the lifecycle workflow states:

- workflow intro or title
- warning panels
- audit summaries
- grouped path review sections
- confirmation prompts
- noop summaries
- cancellation summaries
- success summaries
- failure or partial-failure summaries

The contract should be specific enough that backup and uninstall call semantic methods instead of formatting their own terminal output.

### 2. Provide a Clack-backed production renderer

The production renderer should use Clack primitives such as `intro`, `note`, `confirm`, `isCancel`, and `outro` where they fit the workflow state.

The renderer should keep terminal copy concise and safety-oriented:

- operation name
- target directory
- destination or backup-before-removal status
- counts for files, directories, preserved paths, and skipped paths
- final irreversible-action wording for uninstall
- clear completion or partial-failure status

The implementation should not introduce decorative formatting that makes tests brittle. Prefer semantic grouping through Clack notes and concise labels.

### 3. Preserve non-interactive behavior

The renderer must keep the current permission model:

- `permissions: "allow-all"` skips confirmation prompts
- `permissions: "confirm"` prompts when TTYs are available
- missing TTY for required prompts throws the same actionable guidance shape as today

Do not add a quiet mode in this phase. `--yes` skips prompts only; it should not suppress audit or completion output.

### 4. Keep a test-friendly adapter path

If tests need deterministic inspection, provide a narrow fake or recording renderer rather than asserting raw terminal box characters.

The test path should prove:

- backup calls the expected renderer methods in order
- uninstall calls the expected renderer methods in order
- cancellation is represented through renderer outcomes
- prompt skipping with `allow-all` does not bypass review or completion rendering

## Parallelism

This phase should land before backup and uninstall call-site conversions. Test scaffolding for a recording renderer can be developed in parallel with the production renderer once the interface names are stable.

## Acceptance Criteria

- [ ] `lifecycle-ui.ts` exposes a clear lifecycle renderer contract.
- [ ] Production lifecycle rendering uses Clack primitives for warnings, summaries, prompts, and workflow closure.
- [ ] Direct stdout helpers are no longer the core production abstraction for lifecycle workflow UI.
- [ ] Non-interactive `allow-all` and non-TTY confirmation errors preserve current behavior.
- [ ] Tests can inspect lifecycle rendering semantically without snapshotting decorative box output.

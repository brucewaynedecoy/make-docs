# Phase 4 - Tests, Delta Backlog, and Validation

## Objective

Convert the approved plan and PRD change into an execution-ready delta backlog, update focused tests, and run validation that proves the shorter CLI interview did not reduce managed asset coverage.

## Depends On

- Phase 1 PRD changes
- Phase 2 CLI selection-surface changes
- Phase 3 normalization and compatibility changes

## Files To Modify

Expected:

- `docs/work/2026-04-28-w14-r0-cli-asset-selection-simplification/00-index.md`
- `docs/work/2026-04-28-w14-r0-cli-asset-selection-simplification/0N-<phase>.md`
- `packages/cli/tests/wizard.test.ts`
- `packages/cli/tests/cli.test.ts`
- `packages/cli/tests/profile.test.ts`
- `packages/cli/tests/install.test.ts`

Possible after discovery:

- `packages/cli/tests/consistency.test.ts`
- `packages/cli/tests/renderers.test.ts`
- `packages/cli/tests/helpers.ts`
- `docs/assets/history/2026-04-28-w14-r0-pN-cli-asset-selection-simplification.md` after implementation phases complete

## Detailed Changes

### 1. Generate the scoped delta backlog

Create `docs/work/2026-04-28-w14-r0-cli-asset-selection-simplification/`.

The backlog should cite:

- `docs/prd/11-revise-cli-asset-selection-simplification.md`
- impacted baseline docs `03`, `05`, `06`, and `07`
- this plan directory

Recommended backlog phases:

1. PRD change and baseline annotations
2. CLI wizard and public option surface
3. Selection normalization and manifest compatibility
4. Tests and validation

Do not regenerate the full `docs/assets/archive/work/2026-04-23-w12-r0-make-docs-prd-decomposition/` backlog.

### 2. Update wizard tests

Test expectations should prove:

- the options step no longer asks the three removed asset questions
- `renderWizardReviewSummary` omits asset rows
- review navigation back to options still works
- optional skill behavior still works with and without optional skills
- cancellation behavior still works for the remaining prompts

### 3. Update CLI and compatibility tests

Depending on the Phase 2 flag decision, tests should prove either:

- legacy asset flags are rejected with clear migration guidance, or
- legacy asset flags are accepted but normalize to always-managed values and do not reduce managed assets

Add coverage for:

- first install
- bare sync with an old manifest
- explicit reconfigure with an old manifest
- non-interactive `--yes` behavior

### 4. Update profile and install tests

Profile tests should prove the normalized effective selection behavior and any intended `profileId` changes.

Install tests should prove:

- all prompt starters that satisfy capability requirements are managed
- all templates for effective capabilities are managed
- all references for effective capabilities are managed
- assets previously gated by required/all modes are included under the always-managed contract
- a manifest with older reduced asset settings does not remove now-included assets on sync

### 5. Run focused validation

Minimum validation:

```sh
npm test -w make-docs -- wizard
npm test -w make-docs -- cli
npm test -w make-docs -- profile
npm test -w make-docs -- install
npm test -w make-docs -- consistency
npm test -w make-docs -- renderers
npm run build -w make-docs
```

Supplement with exact string checks:

```sh
rg "Install starter prompts\\?|Which document templates should be installed\\?|Which reference files should be installed\\?" packages/cli/src packages/cli/tests
rg "Starter prompts|Template mode|Reference mode|templatesMode|referencesMode|no-prompts" packages/cli/src packages/cli/tests docs/prd docs/work
```

The second check may find legitimate compatibility references; review every hit instead of treating the command as a required zero-output gate.

## Parallelism

Backlog generation can start after Phase 1 and be updated after Phases 2 and 3 settle. Test updates should be split by file ownership if delegated, but final validation should be owned by one validation worker to avoid inconsistent acceptance notes.

## Acceptance Criteria

- A scoped delta backlog exists under `docs/work/2026-04-28-w14-r0-cli-asset-selection-simplification/`.
- Focused wizard, CLI, profile, install, consistency, and renderer tests are updated for the always-managed asset contract.
- Build and focused tests pass, or failures are documented with exact commands and failure causes.
- Stale removed prompt strings are absent from runtime code.
- Any remaining asset-mode references are intentional compatibility, PRD, or history references.
- `jdocmunch` and `jcodemunch` indexes are refreshed after edits.

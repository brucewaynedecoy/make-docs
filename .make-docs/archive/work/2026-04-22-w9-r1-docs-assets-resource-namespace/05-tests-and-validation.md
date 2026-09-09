# Phase 5: Tests and Validation

> Derives from [Phase 5 of the plan](../../plans/2026-04-22-w9-r1-docs-assets-resource-namespace/05-tests-and-validation.md).

## Purpose

Validate that the template, CLI, dogfood docs tree, and active documentation all implement the W9 R1 resource/state split.

## Overview

This phase is the final proof pass. It verifies focused CLI behavior, template completeness, dogfood migration, stale references, link integrity, formatting, and repository hygiene.

## Source PRD Docs

None. This backlog is derived from the W9 R1 plan and design, not from an active PRD namespace.

## Source Plan Phases

- [Phase 5 - Tests and Validation](../../plans/2026-04-22-w9-r1-docs-assets-resource-namespace/05-tests-and-validation.md)

## Stage 1: Run Focused CLI Tests

### Tasks

- [ ] Run the focused tests that cover managed asset consistency.
- [ ] Run renderer tests for buildable `docs/assets/**` router paths.
- [ ] Run install tests for fresh installs, reduced installs, manifest writes, and conflict staging.
- [ ] Run audit tests for `.make-docs/manifest.json` present and missing cases.
- [ ] Run backup tests for root `.make-docs/` state handling.
- [ ] Run uninstall tests for CLI-owned state cleanup and user-owned resource preservation.
- [ ] Run lifecycle and smoke-pack tests that exercise generated output.

### Acceptance criteria

- [ ] Focused CLI tests pass or any failures are documented with a concrete follow-up.
- [ ] Test assertions use `.make-docs/manifest.json` and `.make-docs/conflicts/` for state.
- [ ] Test assertions use `docs/assets/**` for managed document resources.

### Dependencies

- Phases 2 and 3.

## Stage 2: Validate Template Completeness

### Tasks

- [ ] Confirm every file under `packages/docs/template/docs/assets/**` is emitted or otherwise accounted for by the CLI managed asset pipeline.
- [ ] Confirm no active checked-in template file remains under retired resource roots.
- [ ] Confirm the template does not include `.make-docs/`.
- [ ] Confirm no `manifest.json`, `conflicts/`, `state/`, or `config/` child exists under `packages/docs/template/docs/assets/`.

### Acceptance criteria

- [ ] Template completeness checks pass.
- [ ] Template resource files and CLI managed assets agree on paths.
- [ ] Template state paths are absent because runtime state is created by CLI behavior.

### Dependencies

- Phases 2 and 3.

## Stage 3: Validate Dogfood Tree

### Tasks

- [ ] Confirm `docs/assets/` is the only active support-resource namespace inside this repository's `docs/` tree.
- [ ] Confirm `docs/assets/` contains `archive/`, `history/`, `prompts/`, `references/`, and `templates/`.
- [ ] Confirm `.make-docs/manifest.json` exists when dogfood CLI state exists.
- [ ] Confirm conflict staging uses `.make-docs/conflicts/`.
- [ ] Confirm `docs/assets/manifest.json`, `docs/assets/conflicts/`, `docs/assets/state/`, `docs/assets/config/`, `docs/.assets/config/`, and `docs/.make-docs/` do not exist.

### Acceptance criteria

- [ ] Dogfood resource migration is complete.
- [ ] Dogfood CLI state migration is complete.
- [ ] Retired dogfood directories are removed after content is preserved.

### Dependencies

- Phase 4.

## Stage 4: Run Stale-Path Searches

### Tasks

- [ ] Run a broad old-resource-path scan:

```sh
rg -n "docs/\.(archive|assets|prompts|references|templates|resources)" docs packages scripts README.md
```

- [ ] Run a docs-tree state-path scan:

```sh
rg -n "docs/assets/(manifest|conflicts|state|config)|docs/\.assets/config|docs/\.assets/history|docs/\.archive" docs packages scripts README.md
```

- [ ] Run a source/test generated-output scan:

```sh
rg -n "docs/assets/(manifest|conflicts|state|config)|docs/\.assets|docs/\.prompts|docs/\.references|docs/\.templates|docs/\.archive" packages/cli/src packages/cli/tests scripts/smoke-pack.mjs
```

- [ ] Run a positive state-path scan:

```sh
rg -n "\.make-docs/(manifest\.json|conflicts)" docs packages scripts README.md
```

- [ ] Classify any old-path matches and fix active future-facing references.

### Acceptance criteria

- [ ] Active future-facing references to retired hidden resource paths are removed.
- [ ] Active future-facing references to retired docs-tree state paths are removed.
- [ ] `.make-docs/manifest.json` and `.make-docs/conflicts/` appear in design, plan, source, tests, and user-facing docs where state behavior is described.
- [ ] Remaining old-path references are historical, negative, or retired-path context.

### Dependencies

- Phases 1 through 4.

## Stage 5: Final Hygiene

### Tasks

- [ ] Run link validation or the repository's docs validation command if available.
- [ ] Run `git diff --check`.
- [ ] Run a trailing-whitespace check over edited docs if untracked files are involved.
- [ ] Review `git status --short` and confirm only intended files changed.
- [ ] Capture any skipped validations and the reason they were skipped.

### Acceptance criteria

- [ ] Link validation passes or any remaining issue is documented.
- [ ] `git diff --check` passes.
- [ ] Edited files have no trailing whitespace.
- [ ] The final status contains only intentional W9 R1 implementation and backlog changes.

### Dependencies

- Stages 1 through 4.


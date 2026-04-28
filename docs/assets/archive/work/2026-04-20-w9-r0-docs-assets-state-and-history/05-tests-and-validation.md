# Phase 5: Tests and Validation

> Derives from [Phase 5 of the plan](../../plans/2026-04-20-w9-r0-docs-assets-state-and-history/05-tests-and-validation.md).

## Purpose

Validate that `.assets` state and history are fully integrated across source, template assets, docs, tests, and packed CLI behavior.

## Overview

This phase is a dedicated validation and fixup pass. It should not introduce new product scope. Fix only issues required to make the approved `.assets` model coherent and tested.

## Source PRD Docs

None. This backlog is derived from the `w9-r0` plan and design, not from an active PRD namespace.

## Source Plan Phases

- [05-tests-and-validation.md](../../plans/2026-04-20-w9-r0-docs-assets-state-and-history/05-tests-and-validation.md)

## Stage 1 - Run focused test suites

### Tasks

1. Run `npm test -w make-docs -- tests/consistency.test.ts`.
2. Run `npm test -w make-docs -- tests/renderers.test.ts`.
3. Run `npm test -w make-docs -- tests/install.test.ts`.
4. Run `npm test -w make-docs -- tests/cli.test.ts`.
5. Run `npm test -w make-docs -- tests/audit.test.ts`.
6. Run `npm test -w make-docs -- tests/backup.test.ts`.
7. Run `npm test -w make-docs -- tests/uninstall.test.ts`.
8. Run `npm test -w make-docs -- tests/lifecycle.test.ts`.
9. Fix failures caused by incomplete `.assets` path, renderer, template, or documentation updates.

### Acceptance criteria

- [x] Consistency tests pass.
- [x] Renderer tests pass.
- [x] Install tests pass.
- [x] CLI tests pass.
- [x] Audit tests pass.
- [x] Backup tests pass.
- [x] Uninstall tests pass.
- [x] Lifecycle tests pass.

### Dependencies

- Phases 1-4.

## Stage 2 - Run full package validation

### Tasks

1. Run `npm run build -w make-docs`.
2. Run `npm test -w make-docs`.
3. Run `node scripts/smoke-pack.mjs`.
4. Run `bash scripts/check-instruction-routers.sh`.
5. Fix failures without expanding scope beyond the approved `.assets` migration.

### Acceptance criteria

- [x] `npm run build -w make-docs` passes.
- [x] `npm test -w make-docs` passes.
- [x] `node scripts/smoke-pack.mjs` passes.
- [x] `bash scripts/check-instruction-routers.sh` passes.

### Dependencies

- Stage 1.

## Stage 3 - Validate links and stale references

### Tasks

1. Run a Markdown link check over changed docs and moved history records.
2. At minimum, validate `docs/.assets/history/*.md`.
3. Validate `docs/.references/history-record-contract.md`, `docs/.templates/history-record.md`, and `docs/.prompts/session-to-history-record.prompt.md`.
4. Validate `docs/guides/user/getting-started-installing-make-docs.md` and `docs/guides/developer/cli-development-local-build-and-install.md`.
5. Validate this work backlog and the `w9-r0` plan docs.
6. Run `rg -n "docs/\\.make-docs|\\.make-docs/conflicts|docs/guides/agent" docs packages scripts`.
7. Run `rg -n "docs/\\.assets/config|docs/\\.assets/history" docs packages scripts`.
8. Separate active source-of-truth references from historical references.

### Acceptance criteria

- [x] Changed docs and moved history records have resolving internal links.
- [x] Active source-of-truth files no longer point new work at retired paths.
- [x] Historical old-path references are left only where they describe prior behavior.
- [x] The implementation has enough notes to explain any intentional stale-reference allowlist.

### Dependencies

- Stage 2.

## Stage 4 - Final repository hygiene

### Tasks

1. Run `git diff --check`.
2. Review `git status --short --untracked-files=all`.
3. Confirm no unintended files, generated artifacts, packed tarballs, or temp install directories are left in the worktree.
4. Confirm no unrelated user changes were reverted.
5. Summarize validation outcomes and any residual risks in the final implementation response.

### Acceptance criteria

- [x] `git diff --check` passes.
- [x] Worktree changes are limited to the intended implementation and docs.
- [x] No temporary artifacts remain.
- [x] Final response reports any validation command that could not be run.

### Dependencies

- Stages 1-3.

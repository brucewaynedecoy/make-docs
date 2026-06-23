# Phase 04: Delta Backlog and Closeout

## Purpose

Convert the approved PRD change into a scoped implementation backlog and closeout checklist without regenerating the full active backlog.

## What to Build

- Create `docs/work/2026-06-23-w10-r1-package-and-deployment-boundaries/` after PRD approval.
- Add `00-index.md` plus phase files that trace to `docs/prd/16-revise-package-and-deployment-boundaries.md` and the affected baseline docs.
- Separate work for PRD/risk reconciliation, command/runtime disclosure, package validation, documentation updates, and closeout validation.
- Include touched-file validation for docs, package metadata, package READMEs, CLI help/version behavior, and smoke-pack coverage.
- Record final manual-test or UAT guidance for package and release-adjacent work.

## Key Decisions

- A scoped delta backlog is sufficient because the change revises a known package identity and release boundary; it does not require full active backlog regeneration.
- Closeout should update history only after implementation completes. This plan does not create a history breadcrumb by itself.
- Real publish, registry, Homebrew, Crates, or tag operations remain blocked unless the user explicitly expands the scope.

## Acceptance Criteria

- The delta backlog cites the PRD change doc, affected baseline docs, package/deployment design, and current package/CLI code surfaces.
- Backlog phase files use ordinal task IDs without renumbering existing work.
- Validation includes `git diff --check`, Markdown link checks where available, targeted CLI/package tests when source changes, smoke-pack or npm dry-run checks when package contents change, and touched-doc hygiene.
- The closeout checklist keeps unrelated baseline debt separate from regressions introduced by this change.

## Dependencies

- Phase 01 PRD reconciliation
- Phase 02 shared command contract
- Phase 03 package validation boundary
- `docs/assets/references/execution-workflow.md`
- `docs/assets/references/history-record-contract.md`

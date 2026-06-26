# Phase 02: CLI Operation Refactor

## Purpose

Move the W16 R3 `make-docs operations` behavior into modular operation domains while preserving public behavior.

## Tasks

- [x] t1: Refactor closeout operations into a closeout domain.
- [x] t2: Refactor wave and phase operations into work/lifecycle domains.
- [x] t3: Refactor checkpoint, scope guard, and phase gate behavior into reusable domain modules.
- [x] t4: Preserve all existing `make-docs operations ...` command names, JSON shapes, and error semantics unless a task explicitly records an intentional compatibility change.
- [x] t5: Keep W16 R3 selected-skill references working without edits unless module paths appear in shipped prose.

## Acceptance Criteria

- Existing W16 R3 operation tests pass.
- Public CLI behavior is unchanged while source organization improves.

## Implementation Notes

Phase 2 moved the previously consolidated W16 R3 operations implementation out of the monolithic `packages/cli/src/operations.ts` file and into domain modules:

- `packages/cli/src/operations/cli.ts` owns the thin compatibility dispatch for `make-docs operations ...`.
- `packages/cli/src/operations/shared.ts` owns shared repository, JSON, state-path, timestamp, and git helpers.
- `packages/cli/src/operations/closeout/index.ts` owns closeout probe, validation, and history behavior.
- `packages/cli/src/operations/work/index.ts` owns work phase parsing, wave resolution, wave status, and phase-plan behavior.
- `packages/cli/src/operations/lifecycle/index.ts` owns checkpoint, scope guard, and phase-gate behavior.
- `packages/cli/src/operations.ts` remains as the compatibility facade for existing imports and public CLI command wiring.

No intentional compatibility changes were made to the `make-docs operations ...` command names, JSON result shapes, or error semantics. W16 R3 selected-skill prose remains valid because shipped prose does not require direct imports from the old monolithic source file.

## Coverage Decisions

Manual/UAT coverage remains deferred until W10 R8 wave closeout per the requested workflow.

Automated coverage was expanded in `packages/cli/tests/operation-domains.test.ts` to prove lifecycle and closeout behavior can be invoked directly through domain APIs without going through the CLI parser or future MCP transport.

## Validation Evidence

- `npm test -w packages/cli -- operation-domains operations --reporter=dot`
- `npm test -w packages/cli -- --reporter=dot`
- `npm run build -w packages/cli`
- `git diff --check`
- `python3 .make-docs/scripts/check_path_hygiene.py --repo-root . --format json`
- Changed-file Markdown link check
- `bash scripts/check-instruction-routers.sh` reported the known root-router baseline (`./AGENTS.md` and `./CLAUDE.md` differ; `./CLAUDE.md` exceeds the 12-line budget). No Phase 2 router regression was introduced.

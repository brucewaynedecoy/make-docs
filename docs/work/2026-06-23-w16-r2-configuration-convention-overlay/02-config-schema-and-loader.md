# Phase 02: Config Schema and Loader

## Objective

Implement optional `.make-docs/config.yaml` parsing, defaults, and diagnostics without changing canonical routing behavior.

## Inputs

- [Configuration Schema and Loader plan](../../plans/2026-06-23-w16-r2-configuration-convention-overlay/02-configuration-schema-and-loader.md)
- [PRD 24](../../prd/24-revise-configuration-convention-overlay.md)
- [Configuration and Convention Overlay design](../../designs/2026-06-20-configuration-and-convention-overlay.md)

## Tasks

- [x] t1: Define TypeScript types for the config schema.
- [x] t2: Provide shipped defaults for display labels, coordinate labels, and persona entries.
- [x] t3: Parse `.make-docs/config.yaml` when present.
- [x] t4: Reject invalid structural rename attempts with actionable diagnostics.
- [x] t5: Preserve absent-config behavior.
- [x] t6: Keep config separate from manifest schema and provider/cache state.
- [x] t7: Add tests for missing config, valid config, malformed YAML, unknown keys, invalid structural keys, invalid primitive values, and duplicate persona slugs.

## Acceptance Criteria

- Missing config produces current behavior.
- Valid config changes only rendered labels or persona data.
- Invalid config reports the file and key path.
- No routing, catalog, manifest, or metadata reader uses display labels as identifiers.

## Implementation Notes

- Added [the config loader](../../../packages/cli/src/config.ts) with typed schema defaults for lifecycle labels, document-kind labels, coordinate labels, generated prose defaults, and persona entries.
- Mirrored the accepted W9 R3 default persona set: `agent`, `developer`, and `user`, with canonical primitives `agent`, `maintainer`, and `user`.
- Added YAML parsing through the `yaml` package instead of a bespoke parser.
- Config validation accepts presentation-only labels and persona overlays, but rejects top-level or nested structural rename attempts for paths, metadata fields, kind values, route identifiers, schema keys, primitive values, manifest keys, prompt paths, skill names, contract names, and coordinate model rewrites.
- `loadMakeDocsConfig` returns shipped defaults when config is absent or blank. Invalid config returns diagnostics and default config; `loadMakeDocsConfigOrThrow` turns those diagnostics into a CLI-stopping error.
- Wired apply/reconfigure startup in [the CLI](../../../packages/cli/src/cli.ts) to load config after target resolution and before compatibility classification or install planning, so invalid `.make-docs/config.yaml` fails before writes.
- Kept config outside manifest/provider/cache state. The loader reads only `.make-docs/config.yaml`, and no routing, catalog, manifest, or metadata reader uses configured labels as identifiers.

## Coverage Decisions

- PRD coverage: no PRD or risk-register change was needed. This phase implements the existing PRD 24 schema/loader requirements without changing the requirement surface.
- Developer-guide coverage: no guide change was needed. The durable maintainer behavior is still evolving across W16 R2; Phase 3 will decide whether rendering and validation usage needs guide coverage.
- User-guide coverage: no user guide was needed. A user-facing configuration workflow is not complete until rendering surfaces consume the loader.
- UAT: deferred until the full W16 R2 wave is complete, per the active wave instruction.

## Validation Evidence

- `python3 packages/skills/closeout-phase/scripts/work_phase_state.py docs/work/2026-06-23-w16-r2-configuration-convention-overlay/02-config-schema-and-loader.md --json`
- `npm test -w packages/cli -- --run tests/config.test.ts tests/cli.test.ts --reporter=dot`
- `npm test -w packages/cli -- --reporter=dot`
- `npm run build -w packages/cli`
- `git diff --check`
- `python3 .make-docs/scripts/check_path_hygiene.py --repo-root . --format json`
- Changed-file Markdown link resolver for this phase work item and history entry.
- Refreshed jdocmunch and jcodemunch local indexes.

---
title: "W16 R2 P2 Config Schema and Loader"
kind: "history"
status: "completed"
date: "2026-06-25"
coordinate: "W16 R2 P2"
repo: "make-docs"
branch: "make-docs-v2"
summary: "Added the optional make-docs config schema loader and CLI validation guard."
---

# W16 R2 P2 Config Schema and Loader

## Changes

Implemented W16 R2 Phase 2 by adding the optional `.make-docs/config.yaml` loader, shipped presentation/persona defaults, strict diagnostics for malformed YAML and structural rename attempts, and CLI apply/reconfigure validation that fails before writing when project config is invalid.

### Coverage Decisions

- PRD coverage: no new PRD or risk-register text was needed. [PRD 24](../../../prd/24-revise-configuration-convention-overlay.md) already defines the config schema, presentation-only boundary, invalid structural rename diagnostics, persona validation, and package/dogfood validation requirements.
- Developer-guide coverage: no developer guide was needed. This phase adds the loader and validation foundation; durable maintainer guidance should wait until rendering and validation surfaces consume the config context.
- User-guide coverage: no user guide was needed. User-facing configuration behavior is not complete until generated prose and CLI output render configured labels.
- UAT: deferred until the full W16 R2 wave is complete, per the active wave instruction.

### Validation

- `python3 packages/skills/closeout-phase/scripts/work_phase_state.py docs/work/2026-06-23-w16-r2-configuration-convention-overlay/02-config-schema-and-loader.md --json`
- `npm test -w packages/cli -- --run tests/config.test.ts tests/cli.test.ts --reporter=dot`
- `npm test -w packages/cli -- --reporter=dot`
- `npm run build -w packages/cli`
- `git diff --check`
- `python3 .make-docs/scripts/check_path_hygiene.py --repo-root . --format json`
- Changed-file Markdown link resolver for this phase work item and history entry.
- Refreshed jdocmunch and jcodemunch local indexes.

## Documentation

### Project

| Path | Description |
| --- | --- |
| [packages/cli/src/config.ts](../../../../packages/cli/src/config.ts) | Adds the typed `.make-docs/config.yaml` loader, defaults, diagnostics, and structural rename guardrails. |
| [packages/cli/src/cli.ts](../../../../packages/cli/src/cli.ts) | Loads and validates project config before apply/reconfigure compatibility checks or writes. |
| [packages/cli/tests/config.test.ts](../../../../packages/cli/tests/config.test.ts) | Covers missing config, valid overlays, malformed YAML, unknown keys, structural rename attempts, invalid primitives, and duplicate persona slugs. |
| [packages/cli/tests/cli.test.ts](../../../../packages/cli/tests/cli.test.ts) | Proves invalid project config stops non-interactive apply before writing a manifest. |
| [docs/work/2026-06-23-w16-r2-configuration-convention-overlay/02-config-schema-and-loader.md](../../../work/2026-06-23-w16-r2-configuration-convention-overlay/02-config-schema-and-loader.md) | Marks Phase 2 complete and records evidence. |
| [docs/assets/archive/history/2026-06-25-w16-r2-p2-config-schema-and-loader.md](2026-06-25-w16-r2-p2-config-schema-and-loader.md) | Adds this phase closeout breadcrumb. |

### Developer

None this session.

### User

None this session.

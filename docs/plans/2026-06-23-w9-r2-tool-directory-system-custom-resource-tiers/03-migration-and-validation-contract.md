# Migration and Validation Contract

## Purpose

Define how current product-owned resources migrate from `docs/assets/**` toward `.make-docs/**` without breaking Batch 1 safety contracts.

## Requirements

- Current template-owned `docs/assets/{prompts,references,templates}/` content migrates only through a later implementation plan.
- `docs/assets/**` becomes available for future reader-facing guides, playbooks, and reusable documentation assets after tool resources have a migration path.
- Full-snapshot mode materializes selected system resources locally.
- Provider-backed and hybrid-pinned-cache modes identify non-local system resources through manifest provenance.
- Local bootstrap remains materialized in every mode.
- Managed instruction routers must not send agents into hidden provider-only state without local explanation.
- Template/package/dogfood propagation follows PRD 19.

## Acceptance Criteria

- Migration tasks do not move runtime state into `docs/assets/`.
- Provider/cache state retains PRD 17 provenance and PRD 18 compatibility safety.
- Validation covers source path changes, managed blocks, audit/backup/uninstall, package copy, smoke-pack, and template/dogfood parity.

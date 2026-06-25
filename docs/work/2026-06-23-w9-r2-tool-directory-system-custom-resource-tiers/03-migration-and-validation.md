# Migration and Validation

## Purpose

Move toward the tool-directory model without breaking Batch 1 safety contracts.

## Source PRD Docs

- `docs/prd/21-revise-tool-directory-system-custom-resource-tiers.md`
- `docs/prd/17-revise-system-asset-materialization-contract.md`
- `docs/prd/18-revise-compatibility-audit-and-migration-disposition.md`
- `docs/prd/19-revise-template-package-dogfood-source-of-truth-contract.md`

## Stage 1 - Migration Plan

### Tasks

- [x] t1: Inventory current `docs/assets/{prompts,references,templates}/` tool resources.
- [x] t2: Define migration fixtures for `.make-docs/{prompts,references,templates}/system/`.
- [x] t3: Preserve local bootstrap readability in full-snapshot, provider-backed, and hybrid-pinned-cache modes.
- [x] t4: Update router guidance so agents are not sent into hidden provider-only state.
- [x] t5: Add validation for package copy, smoke-pack, template/dogfood parity, audit, backup, uninstall, and managed blocks.

### Acceptance Criteria

- Current installed shape remains valid until implementation explicitly migrates it.
- Provider/cache provenance and compatibility classification are preserved.
- Validation covers both local and packed package paths.

### Dependencies

- Phase 2 directory model.

### Implementation Notes

Phase 3 keeps the current installed shape valid while defining the code and router contracts for a later migration. No files were moved from `docs/assets/**` into `.make-docs/**` in this phase.

Documentation tree moves that affect Markdown content must not be accepted from this phase alone. W9 R2 fixture and router work may seed W10 R3 migration tests, but shipped V2 migration must compute move/rewrite plans, rewrite owned Markdown links deterministically, require review for modified or user-authored docs, and validate the full destination tree from packaged CLI/shared-core code.

| Surface | Implementation |
| --- | --- |
| Current inventory | The live repo contains 19 prompt resources, 16 reference resources, and 24 template resources under `docs/assets/{prompts,references,templates}/`. Matching copies remain present in `packages/docs/template/docs/assets/{prompts,references,templates}/` and `packages/cli/template/docs/assets/{prompts,references,templates}/`. |
| Migration fixtures | `packages/cli/src/tool-directory.ts` now maps current legacy roots to system-tier targets: `docs/assets/prompts/**` to `.make-docs/prompts/system/**`, `docs/assets/references/**` to `.make-docs/references/system/**`, and `docs/assets/templates/**` to `.make-docs/templates/system/**`. Non-tool resources such as `docs/assets/history/**` are ignored. |
| Local bootstrap | The directory model defines full-snapshot, provider-backed, and hybrid-pinned-cache modes and keeps `.make-docs/manifest.json` plus `.make-docs/config.yaml` as local bootstrap paths in every mode. |
| Router guidance | `docs/assets/AGENTS.md`, `docs/assets/CLAUDE.md`, `packages/docs/template/docs/assets/AGENTS.md`, and `packages/docs/template/docs/assets/CLAUDE.md` now tell agents to treat current tool resources as locally readable and avoid hidden provider-only `.make-docs/**` resources without local manifest/bootstrap provenance. `npm run smoke:pack` confirms package copy carries that template content into the packed CLI template path. |
| Validation | Phase validation covers the targeted `packages/cli/tests/tool-directory.test.ts` contract test, CLI build, default-template validation, smoke-pack, whitespace checks, path hygiene, doc/code index refresh, and scope guard. Phase 4 remains responsible for the full wave validation matrix and final manual/UAT decision. |

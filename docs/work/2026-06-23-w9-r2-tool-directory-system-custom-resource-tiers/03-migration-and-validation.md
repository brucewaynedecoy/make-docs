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

- [ ] t1: Inventory current `docs/assets/{prompts,references,templates}/` tool resources.
- [ ] t2: Define migration fixtures for `.make-docs/{prompts,references,templates}/system/`.
- [ ] t3: Preserve local bootstrap readability in full-snapshot, provider-backed, and hybrid-pinned-cache modes.
- [ ] t4: Update router guidance so agents are not sent into hidden provider-only state.
- [ ] t5: Add validation for package copy, smoke-pack, template/dogfood parity, audit, backup, uninstall, and managed blocks.

### Acceptance Criteria

- Current installed shape remains valid until implementation explicitly migrates it.
- Provider/cache provenance and compatibility classification are preserved.
- Validation covers both local and packed package paths.

### Dependencies

- Phase 2 directory model.

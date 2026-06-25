# Phase 3: Template Package and Dogfood Migration Lab

## Purpose

Update shipped template/package surfaces and use the make-docs repo's current `docs/` tree as migration-lab evidence without letting it define shipped contract.

## Overview

This phase handles source-of-truth order. Template-owned defaults must start in `packages/docs/template/**`, package copies must come through the established copy/prepack path, and repo-root dogfood must validate behavior rather than replace the template source.

## Source PRD Docs

- [../../prd/09-dogfood-and-maintainer-operations.md](../../prd/09-dogfood-and-maintainer-operations.md)
- [../../prd/10-packaging-validation-and-release-reference.md](../../prd/10-packaging-validation-and-release-reference.md)
- [../../prd/17-revise-system-asset-materialization-contract.md](../../prd/17-revise-system-asset-materialization-contract.md)
- [../../prd/19-revise-template-package-dogfood-source-of-truth-contract.md](../../prd/19-revise-template-package-dogfood-source-of-truth-contract.md)
- [../../prd/22-revise-new-docs-assets-playbooks-persona-model.md](../../prd/22-revise-new-docs-assets-playbooks-persona-model.md)

## Stage 1 - Template Source Updates

### Tasks

- [ ] t1: Update `packages/docs/template/**` with the accepted `.make-docs/**` and `docs/assets/**` router/source layout.
- [ ] t2: Add or update template router files for `docs/assets/archive/**`, `docs/assets/artifacts/**`, `docs/assets/breadcrumbs/**`, `docs/assets/guides/**`, and `docs/assets/playbooks/**`.
- [ ] t3: Remove shipped-template assumptions that create or advertise top-level `docs/artifacts/**` or top-level `docs/archive/**`.
- [ ] t4: Classify existing prompt-starter files into contracts, references, templates, or scripts according to PRD 21.

### Acceptance criteria

- Template source matches the W9 R4 IA.
- Prompt-starter content is not left as an undecided top-level `.make-docs/prompts/**` family.
- Template routers are coherent for both people and agents.

### Dependencies

- Phase 2 contract updates.

## Stage 2 - Package Copy and Dogfood Proof

### Tasks

- [ ] t5: Regenerate or update `packages/cli/template/**` from the template source using the existing package-copy flow.
- [ ] t6: Reseed the repo-root dogfood files that are selected template-owned surfaces.
- [ ] t7: Use current top-level `docs/artifacts/**`, current `docs/assets/history/**`, and other mixed local material as migration-lab inputs, not template source.
- [ ] t8: Update `.make-docs/manifest.json` only for managed template-owned assets selected by the implementation.

### Acceptance criteria

- Template source, CLI package copy, and dogfood copies agree where they should.
- Unmanaged local dogfood material is not silently promoted into shipped template defaults.
- Migration-lab evidence proves old-path classification and link preservation.

### Dependencies

- Stage 1 complete.

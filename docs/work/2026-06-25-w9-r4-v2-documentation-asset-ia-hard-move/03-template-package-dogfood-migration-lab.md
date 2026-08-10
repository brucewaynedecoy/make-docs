# Phase 3: Template Package and Dogfood Migration Lab

## Purpose

Update shipped template/package surfaces and use the make-docs repo's current `docs/` tree as migration-lab evidence without letting it define shipped contract.

## Overview

This phase handles source-of-truth order. Template-owned defaults must start in `packages/docs/template/**`, package copies must come through the established copy/prepack path, and repo-root dogfood must validate behavior rather than replace the template source.

## Source PRD Docs

- [../../prd/09-dogfood-and-maintainer-operations.md](../../prd/09-dogfood-and-maintainer-operations.md)
- [../../prd/10-packaging-validation-and-release-reference.md](../../prd/10-packaging-validation-and-release-reference.md)
- [../../prd/17-system-asset-materialization-and-local-bootstrap.md](../../prd/17-system-asset-materialization-and-local-bootstrap.md)
- [../../prd/09-dogfood-and-maintainer-operations.md](../../prd/09-dogfood-and-maintainer-operations.md#dogfood-projection-boundary)
- [../../prd/22-project-documentation-asset-model.md](../../prd/22-project-documentation-asset-model.md#requirements)

## Stage 1 - Template Source Updates

### Tasks

- [x] t1: Update `packages/docs/template/**` with the accepted `.make-docs/**` and `docs/assets/**` router/source layout.
- [x] t2: Add or update template router files for `docs/assets/archive/**`, `docs/assets/artifacts/**`, `docs/assets/breadcrumbs/**`, `docs/assets/guides/**`, and `docs/assets/playbooks/**`.
- [x] t3: Remove shipped-template assumptions that create or advertise top-level `docs/artifacts/**` or top-level `docs/archive/**`.
- [x] t4: Classify existing prompt-starter files into contracts, references, templates, or scripts according to PRD 21.

### Acceptance criteria

- Template source matches the W9 R4 IA.
- Prompt-starter content is not left as an undecided top-level `.make-docs/prompts/**` family.
- Template routers are coherent for both people and agents.

### Dependencies

- Phase 2 contract updates.

### Implementation Evidence

- `packages/docs/template/.make-docs/**` now owns system contracts, workflow references, prompt starters, templates, and helper scripts.
- `packages/docs/template/docs/assets/{archive,artifacts,breadcrumbs,guides,playbooks}/**` now owns the shipped people-and-agent-managed asset routers.
- The shipped template no longer contains `docs/archive/**`, `docs/artifacts/**`, `docs/assets/history/**`, or `docs/assets/{prompts,references,templates}/**`.
- Prompt starters are classified under `.make-docs/references/system/prompts/**`; no shipped `.make-docs/prompts/**` family was introduced.

## Stage 2 - Package Copy and Dogfood Proof

### Tasks

- [x] t5: Regenerate or update `packages/cli/template/**` from the template source using the existing package-copy flow.
- [x] t6: Reseed the repo-root dogfood files that are selected template-owned surfaces.
- [x] t7: Use current top-level `docs/artifacts/**`, current `docs/assets/history/**`, and other mixed local material as migration-lab inputs, not template source.
- [x] t8: Update `.make-docs/manifest.json` only for managed template-owned assets selected by the implementation.

### Acceptance criteria

- Template source, CLI package copy, and dogfood copies agree where they should.
- Unmanaged local dogfood material is not silently promoted into shipped template defaults.
- Migration-lab evidence proves old-path classification and link preservation.

### Dependencies

- Stage 1 complete.

### Validation Evidence

- `npm run smoke:pack` copied `packages/docs/template/**` into the packed CLI template and passed the W9 R4 package/install/uninstall assertions.
- Root dogfood now has `docs/assets/artifacts/**` for former top-level artifact material and `docs/assets/breadcrumbs/**` for new breadcrumb records.
- Root dogfood preserves existing `docs/assets/history/**` as migration evidence rather than using it as the future closeout target.
- A root dogfood sync updated `.make-docs/manifest.json`; the clean dry-run proof is recorded in Phase 4 closeout.
- Phase 2 and Phase 3 were validated together because router contracts, template source, package copy, and dogfood manifest hashes must agree for a meaningful installed-state proof.

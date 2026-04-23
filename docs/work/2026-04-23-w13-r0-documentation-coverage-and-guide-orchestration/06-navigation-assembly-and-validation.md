# Phase 6: Navigation, Assembly, and Validation

> Derives from [Phase 6 of the plan](../../plans/2026-04-23-w13-r0-documentation-coverage-and-guide-orchestration/06-navigation-assembly-and-validation.md).

## Purpose

Finish `W13 R0` by making the guide set discoverable, internally consistent, and traceable back to the ledger. This phase owns shared navigation, deferred cross-bundle links, contract compliance review, and scoped mechanical cleanup.

## Overview

Assembly begins only after the drafting bundles are complete. Once this phase starts, bundle workers should no longer reopen each other's files. The assembly and validation workers own `README.md`, final `related` normalization, ledger-to-guide traceability checks, and the last mechanical fixes needed to satisfy the guide contract.

## Source PRD Docs

- [../../prd/00-index.md](../../prd/00-index.md)
- [../../prd/01-product-overview.md](../../prd/01-product-overview.md)
- [../../prd/02-architecture-overview.md](../../prd/02-architecture-overview.md)
- [../../prd/06-template-contracts-and-generated-assets.md](../../prd/06-template-contracts-and-generated-assets.md)
- [../../prd/07-cli-command-surface-and-lifecycle.md](../../prd/07-cli-command-surface-and-lifecycle.md)
- [../../prd/08-skills-catalog-and-distribution.md](../../prd/08-skills-catalog-and-distribution.md)
- [../../prd/09-dogfood-and-maintainer-operations.md](../../prd/09-dogfood-and-maintainer-operations.md)
- [../../prd/10-packaging-validation-and-release-reference.md](../../prd/10-packaging-validation-and-release-reference.md)

## Source Plan Phases

- [06-navigation-assembly-and-validation.md](../../plans/2026-04-23-w13-r0-documentation-coverage-and-guide-orchestration/06-navigation-assembly-and-validation.md)

## Stage 1 - Shared navigation and cross-bundle normalization

### Tasks

1. [x] Update `README.md` with a compact guide-discovery section that routes readers by need: onboarding, workflows and concepts, CLI and skills, and maintainer or release operations.
2. [x] Normalize deferred `related` links and companion-audience links across the guide files touched in Phases 3 through 5.
3. [x] Add shared authority references where multiple bundles point back to the same PRD or contract sources.
4. [x] Keep shared navigation work centralized in this phase and do not let bundle workers reopen each other's files.

### Acceptance criteria

- [x] `README.md` contains a guide-discovery entry point outside the guide directories.
- [x] Deferred cross-bundle `related` links are normalized after bundle drafting completes.
- [x] Shared navigation ownership remains centralized in this phase.

### Dependencies

- Phases 3 through 5.

## Stage 2 - Validation and traceability review

### Tasks

1. [x] Verify frontmatter presence, required fields, path and slug consistency, and `status: draft` on every new guide touched by `W13 R0`.
2. [x] Verify internal Markdown links and `related` references across the touched guide set.
3. [x] Check that every touched guide maps back to one or more ledger rows and the evidence links that justified it.
4. [x] Check that no duplicate or conflicting guide coverage remains for the same capability row.
5. [x] Use `jdocmunch` broken-link checks where useful and supplement them with exact local searches for stale filenames, unresolved relative links, or missing frontmatter values.
6. [x] Confirm that historical-vs-current mismatches recorded in the ledger were resolved in favor of current PRD or code truth.

### Acceptance criteria

- [x] Every touched guide passes the guide-contract checks.
- [x] Internal guide links resolve.
- [x] Every touched guide is traceable to ledger rows and evidence links.
- [x] Duplicate coverage conflicts are removed or explicitly resolved.
- [x] Mismatch rows in the ledger resolve in favor of current truth.

### Dependencies

- Stage 1 - Shared navigation and cross-bundle normalization.
- Phases 1 and 2.

## Stage 3 - Scoped fixups and final acceptance summary

### Tasks

1. [x] Apply only scoped, mechanical fixes discovered by validation: `related` entries, broken links, frontmatter corrections, or small wording fixes needed to restore current-state accuracy.
2. [x] Update `supporting/capability-coverage-ledger.md` with final resolution notes where validation changed or clarified a row outcome.
3. [x] Update `supporting/guide-delivery-map.md` with final delivery status, accepted deviations, and any intentionally deferred rows.
4. [x] Record a final acceptance summary that names rows satisfied, rows left as `link-only` or `none`, and any unresolved questions that remain.
5. [x] Run `git diff --check` as the final whitespace and patch-integrity gate.

### Acceptance criteria

- [x] Validation fixes remain scoped to mechanical cleanup.
- [x] The ledger and guide delivery map reflect final delivery status.
- [x] The acceptance summary leaves a clear audit trail for coordinator review.
- [x] `git diff --check` passes.

### Dependencies

- Stage 2 - Validation and traceability review.

## Implementation notes

- Phase 6 is complete. `README.md` now contains the shared guide-discovery entry point, the deferred cross-bundle `related` links are normalized across onboarding, CLI lifecycle, skills, maintainer, and release guides, and the remaining stale "future guide" or "Phase 6 assembly" wording in landed guides has been removed.
- Validation stayed scoped to mechanical cleanup. No guide filenames, path families, audience assignments, or ledger outcomes changed during assembly.

### Validation results

- Frontmatter, required-field, `status: draft`, and path-family checks passed across the 16 guides touched by W13 Phases 3 through 5.
- Exact local relative-link resolution passed across the same 16-guide set for both body links and `related` frontmatter entries.
- A repo-wide `jdocmunch` broken-link scan still reports substantial pre-existing unrelated link debt outside the W13 guide set. Phase 6 used that scan as a broad sanity check and then relied on exact local resolution for the owned files.
- Current-truth validation for the recorded L10 mismatch remains anchored to code and PRD truth: `packages/cli/src/manifest.ts` still defines runtime state under `.make-docs/`, including `.make-docs/manifest.json` and `.make-docs/conflicts`.

### Final acceptance summary

- `rows satisfied`: `L01` through `L12`
- `rows left as link-only`: `L07`, `L11`
- `rows left as none`: none
- `accepted deviations`: none
- `unresolved questions`: none

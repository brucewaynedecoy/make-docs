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

1. Update `README.md` with a compact guide-discovery section that routes readers by need: onboarding, workflows and concepts, CLI and skills, and maintainer or release operations.
2. Normalize deferred `related` links and companion-audience links across the guide files touched in Phases 3 through 5.
3. Add shared authority references where multiple bundles point back to the same PRD or contract sources.
4. Keep shared navigation work centralized in this phase and do not let bundle workers reopen each other's files.

### Acceptance criteria

- [ ] `README.md` contains a guide-discovery entry point outside the guide directories.
- [ ] Deferred cross-bundle `related` links are normalized after bundle drafting completes.
- [ ] Shared navigation ownership remains centralized in this phase.

### Dependencies

- Phases 3 through 5.

## Stage 2 - Validation and traceability review

### Tasks

1. Verify frontmatter presence, required fields, path and slug consistency, and `status: draft` on every new guide touched by `W13 R0`.
2. Verify internal Markdown links and `related` references across the touched guide set.
3. Check that every touched guide maps back to one or more ledger rows and the evidence links that justified it.
4. Check that no duplicate or conflicting guide coverage remains for the same capability row.
5. Use `jdocmunch` broken-link checks where useful and supplement them with exact local searches for stale filenames, unresolved relative links, or missing frontmatter values.
6. Confirm that historical-vs-current mismatches recorded in the ledger were resolved in favor of current PRD or code truth.

### Acceptance criteria

- [ ] Every touched guide passes the guide-contract checks.
- [ ] Internal guide links resolve.
- [ ] Every touched guide is traceable to ledger rows and evidence links.
- [ ] Duplicate coverage conflicts are removed or explicitly resolved.
- [ ] Mismatch rows in the ledger resolve in favor of current truth.

### Dependencies

- Stage 1 - Shared navigation and cross-bundle normalization.
- Phases 1 and 2.

## Stage 3 - Scoped fixups and final acceptance summary

### Tasks

1. Apply only scoped, mechanical fixes discovered by validation: `related` entries, broken links, frontmatter corrections, or small wording fixes needed to restore current-state accuracy.
2. Update `supporting/capability-coverage-ledger.md` with final resolution notes where validation changed or clarified a row outcome.
3. Update `supporting/guide-delivery-map.md` with final delivery status, accepted deviations, and any intentionally deferred rows.
4. Record a final acceptance summary that names rows satisfied, rows left as `link-only` or `none`, and any unresolved questions that remain.
5. Run `git diff --check` as the final whitespace and patch-integrity gate.

### Acceptance criteria

- [ ] Validation fixes remain scoped to mechanical cleanup.
- [ ] The ledger and guide delivery map reflect final delivery status.
- [ ] The acceptance summary leaves a clear audit trail for coordinator review.
- [ ] `git diff --check` passes.

### Dependencies

- Stage 2 - Validation and traceability review.

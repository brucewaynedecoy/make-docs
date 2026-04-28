# Phase 04: Dogfood Packaging and Validation

## Purpose

This phase rebuilds the repo-root dogfood workflow, the actual package surface, and the release-validation chain that proves a packed `make-docs` artifact still behaves like the source tree. The critical anchors are `packages/docs/README.md:50-121`, `packages/cli/src/utils.ts:33-55`, `packages/cli/package.json:9-25`, `scripts/copy-template-to-cli.mjs:24-32`, and `scripts/smoke-pack.mjs:60-246`.

## Overview

The repo-root `docs/` tree is a first-class product rehearsal surface, not just contributor notes. Local development reads `packages/docs/template/` directly through `packages/cli/src/utils.ts:33-55`, packed artifacts read the bundled copy produced by `prepack`, and `scripts/smoke-pack.mjs:60-246` is the current proof that installer, skills, backup, uninstall, and packaging still agree. This phase therefore closes the loop after Phases 01 through 03 have stabilized runtime behavior.

## Source PRD Docs

- [../../prd/01-product-overview.md](../../../../prd/01-product-overview.md)
- [../../prd/02-architecture-overview.md](../../../../prd/02-architecture-overview.md)
- [../../prd/09-dogfood-and-maintainer-operations.md](../../../../prd/09-dogfood-and-maintainer-operations.md)
- [../../prd/10-packaging-validation-and-release-reference.md](../../../../prd/10-packaging-validation-and-release-reference.md)
- [../../prd/06-template-contracts-and-generated-assets.md](../../../../prd/06-template-contracts-and-generated-assets.md)
- [../../prd/03-open-questions-and-risk-register.md](../../../../prd/03-open-questions-and-risk-register.md)
- [../../prd/04-glossary.md](../../../../prd/04-glossary.md)

## Stage 1 - Dogfood Surface and Reseed Workflow

### Tasks

- Preserve the repo-root `docs/` tree as a dogfood copy of template-owned routers, references, and templates while leaving project-authored plans, PRDs, and work logs in place, as described in `README.md:313-3056` and `packages/docs/README.md:50-121`.
- Keep mutable installer state outside the docs tree, preserving root `.make-docs/manifest.json` and `.make-docs/conflicts/` from `packages/cli/src/manifest.ts:18-20`.
- Define how manual re-seeding stays reviewable while still giving maintainers a reliable freshness signal for template-owned files.

### Acceptance criteria

- The template-owned versus repo-authored boundary is explicit enough that maintainers know what may be re-seeded and what must remain project-specific.
- Historical hidden-dot paths stay isolated to migration history and do not masquerade as current routing authority.
- There is a deliberate freshness-check strategy for dogfood docs, whether automated or explicitly manual with proof steps.

### Dependencies

- Phase 02, because dogfood correctness depends on the template and asset contract being stable.

## Stage 2 - Packaging Surface and Release Artifact Truth

### Tasks

- Rebuild the actual CLI allowlist and prepack flow from `packages/cli/package.json:9-25` and `scripts/copy-template-to-cli.mjs:24-32`.
- Align the packaged README, maintainer README, and manual packaged-install instructions with the files that truly ship in the tarball.
- Decide what public-release metadata and legal prerequisites are required before treating the current package as publicly releasable.
- Resolve how `packages/content` participates in packaging if it remains part of the product plan after Phase 02.

### Acceptance criteria

- Tarball contents match the documented package surface exactly, including template, registry, and README files.
- The packaged README no longer references non-existent tarball-root `docs/`, `AGENTS.md`, or `CLAUDE.md` paths.
- Release metadata and licensing decisions are explicit enough that a public publish checklist can pass or fail deterministically.

### Dependencies

- Stage 1 - Dogfood Surface and Reseed Workflow.
- Phase 03 Stage 3, because skills delivery choices affect what the package must ship and validate.

## Stage 3 - Validation and Release Gate

### Tasks

- Rebuild and preserve the validation chain described by `package.json:13-18`, `packages/cli/src/README.md:165-204`, `scripts/check-instruction-routers.sh:1-58`, `scripts/check-wave-numbering.sh:15-58`, and `scripts/smoke-pack.mjs:60-246`.
- Keep packaged validation end-to-end: installer, skills, backup, uninstall, manifest safety, and dogfood-sensitive router checks must all stay in the same release gate.
- Add one clear manual packaged-run checkpoint beyond automation, using the tarball install pattern described in `packages/cli/src/README.md:135-148`.

### Acceptance criteria

- The release gate proves both local-dev template resolution and packed-template resolution, not only one of them.
- Packaged installation, skills install, backup, uninstall, and conflict-safe manifest behavior all pass under the same validation regime.
- Router parity, wave hygiene, and packaged smoke checks fail loudly enough that maintainers cannot publish a drifted artifact by accident.

### Dependencies

- Stage 2 - Packaging Surface and Release Artifact Truth.
- Phase 01 Stage 3, because lifecycle validation depends on the shared audit boundary being correct.

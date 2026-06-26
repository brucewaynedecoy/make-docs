# Package and Deployment Boundaries - PRD Change Plan

**Date:** 2026-06-23

**Repository:** `make-docs`

**Purpose:** Produce a reviewable change plan for turning [2026-06-19-package-and-deployment-boundaries.md](../../designs/2026-06-19-package-and-deployment-boundaries.md) into an active PRD evolution, scoped delta backlog, and validation path for the Make Docs package, command, release-channel, and deployment-ownership boundary.

## W10 R7 Runtime Pivot

W10 R7 supersedes this plan's future-facing Rust, same-command npm/Rust, and PATH-order runtime assumptions. Future work must use [W10 R7 TypeScript CLI and MCP Runtime Pivot](../2026-06-26-w10-r7-typescript-cli-mcp-runtime-pivot/00-overview.md) as the active runtime authority: TypeScript owns v2 CLI/MCP behavior, MCP is required, and W10 R8 owns modular operation-domain implementation.

## Objective

Revise the active PRD namespace so Make Docs has one stable product, command, package-runner, and TypeScript runtime contract. Completion means the follow-on PRD pass can add one numbered change doc, annotate affected baseline docs, reconcile the open questions and risk register, and generate a scoped delta backlog without reopening unrelated v2 package/materialization decisions.

This plan returns the v2 package-boundary work to the normal lifecycle arc after the roadmap-driven design batch. The departure has already happened upstream: the design was generated from roadmap artifacts before this plan stage. This plan resumes the default design -> plan -> PRD -> work order.

## Coordinate Decision

- Coordinate: `W10 R1`
- Classification: `revision`
- Evidence: The design declares `Route: change-plan` and its coordinate handoff points to prior coordinate `W10 R0 P1` plus the accepted npm publishing design. The live checkout has archived `W10 R0` plan/work directories for the prior Make Docs rename work, and no `W10 R1` plan or work directory exists. Per the wave model, this revises W10 package identity and deployment lineage rather than starting a newer unrelated wave.

## Change Classification

- Requested change type: revision
- Effective execution mode: `active-set evolution`
- Cleanup rewrite requested: no
- Full backlog regeneration requested: no

## Change Inputs

| Input | Format | Location | Confidence |
| --- | --- | --- | --- |
| Package and deployment boundary design | design doc | `docs/designs/2026-06-19-package-and-deployment-boundaries.md` | high |
| First npm publishing design | design doc | `docs/designs/2026-04-15-cli-publishing.md` | high |
| Prior package identity work | archived plan/work/history | `docs/assets/archive/plans/2026-04-21-w10-r0-make-docs-rename/`; `docs/assets/archive/work/2026-04-21-w10-r0-make-docs-rename/`; `docs/assets/archive/history/2026-04-21-w10-r0-p1-core-package-and-cli-identity.md` | high |
| Active PRD namespace | PRD docs | `docs/prd/00-index.md`; `docs/prd/03-open-questions-and-risk-register.md` | high |
| Current TypeScript CLI package surface | package/code | `packages/cli/package.json`; `packages/cli/src/cli.ts`; `packages/cli/src/manifest.ts`; `packages/cli/src/audit.ts`; `packages/cli/src/backup.ts`; `packages/cli/src/uninstall.ts`; `scripts/smoke-pack.mjs` | high |

Open questions from the design should be promoted or updated in `docs/prd/03-open-questions-and-risk-register.md` during execution. In particular, Q-008 should be reconciled as stale or closed against the stable `make-docs` naming decision, while Q-001, Q-007, and Q-012 remain open unless a later design explicitly resolves skills delivery, remote-source integrity, or plugin/skill install coupling.

## Baseline Context

- Active `docs/prd/` status: active namespace, slots `00`-`15`.
- Impacted baseline docs: `01`, `02`, `03`, `05`, `07`, `08`, `10`, and `12`.
- Discovery pass required: yes, light.
- Discovery scope if required: confirm the current package metadata and `make-docs` binary surface, the CLI runtime/version disclosure behavior, manifest and audit safety anchors, smoke-pack validation coverage, package README/tarball drift, and whether any existing PRD baseline text conflicts with the active no-alias, TypeScript runtime, and required-MCP decisions.

## Output Contract

- Plan directory: `docs/plans/2026-06-23-w10-r1-package-and-deployment-boundaries/` (this directory).
- New change doc: `docs/prd/16-revise-package-and-deployment-boundaries.md`.
- Baseline docs to annotate: `docs/prd/01-product-overview.md`, `docs/prd/02-architecture-overview.md`, `docs/prd/05-installation-profile-and-manifest-lifecycle.md`, `docs/prd/07-cli-command-surface-and-lifecycle.md`, `docs/prd/08-skills-catalog-and-distribution.md`, `docs/prd/10-packaging-validation-and-release-reference.md`, and `docs/prd/12-revise-cli-skill-selection-simplification.md`.
- Risk register updates: `docs/prd/03-open-questions-and-risk-register.md`.
- Delta backlog: `docs/work/2026-06-23-w10-r1-package-and-deployment-boundaries/`.

## Change Doc Strategy

| New doc | Kind | Why it exists | Affected baseline docs |
| --- | --- | --- | --- |
| `16-revise-package-and-deployment-boundaries.md` | revision | Records the effective v2 package identity, command, release-channel, TypeScript runtime ownership, remote package-runner, required MCP, no-alias, and shared-contract requirements that supersede or extend prior package-identity and npm-only assumptions. | `01`, `02`, `05`, `07`, `08`, `10`, `12`, `03` |

Do not split this into multiple PRD change docs unless the execution pass discovers materially separate requirement areas that need independent rationale or sequencing. The design intentionally resolves one boundary first so later Batch 1 designs can stay constrained.

## Baseline Annotation Plan

| Baseline doc | Impacted sections | Note verb | Target change doc |
| --- | --- | --- | --- |
| `docs/prd/01-product-overview.md` | product identity, system boundary, current limitations | Superseded by | `16-revise-package-and-deployment-boundaries.md` |
| `docs/prd/02-architecture-overview.md` | runtime zones, module map, deployment boundaries | Enhanced by | `16-revise-package-and-deployment-boundaries.md` |
| `docs/prd/05-installation-profile-and-manifest-lifecycle.md` | manifest state, audit safety, install provenance | Enhanced by | `16-revise-package-and-deployment-boundaries.md` |
| `docs/prd/07-cli-command-surface-and-lifecycle.md` | public command model, help/version behavior, lifecycle routing | Superseded by | `16-revise-package-and-deployment-boundaries.md` |
| `docs/prd/08-skills-catalog-and-distribution.md` | skills delivery boundary and unresolved shared install questions | Enhanced by | `16-revise-package-and-deployment-boundaries.md` |
| `docs/prd/10-packaging-validation-and-release-reference.md` | npm allowlist, release channels, package verification, future distribution references | Enhanced by | `16-revise-package-and-deployment-boundaries.md` |
| `docs/prd/12-revise-cli-skill-selection-simplification.md` | no-default-skills behavior for bare installs | Enhanced by | `16-revise-package-and-deployment-boundaries.md` |

Do not add `### Change Notes` to `docs/prd/03-open-questions-and-risk-register.md`; update its existing numbered D/Q/R items directly.

## Worker Ownership

Execution is delegation-first when workers are available; the coordinator's write scope is review and integration only.

| Worker | Scope | Write Scope | Dependencies | Deliverables |
| --- | --- | --- | --- | --- |
| PRD reconciler | Phase 01 | `docs/prd/` | this plan | PRD change doc, index update, baseline annotations, risk register updates |
| Command contract worker | Phase 02 | CLI contract docs and tests, plus work backlog detail | Phase 01 | shared command/name/runtime disclosure requirements and implementation tasks |
| Package validation worker | Phase 03 | package/release docs and validation tasks | Phase 01 | npm/pnpm/Bun package-runner validation and no-publish guardrails |
| Backlog and closeout worker | Phase 04 | `docs/work/` plus touched-doc validation | Phases 01-03 | scoped delta backlog and validation/closeout checklist |

## MCP Strategy

- Preferred servers available: `jdocmunch` for project docs and `jcodemunch` for package/CLI code surfaces.
- Fallback plan if unavailable: reindex first; fall back to direct reads only if reindexing does not resolve stale or missing results.

## Validation

- The new change doc uses the revision template and the `revision` change type.
- `docs/prd/00-index.md` includes `16-revise-package-and-deployment-boundaries.md` with active status and related-doc links.
- Every affected baseline doc has the required `### Change Notes` backlink, and no active PRD doc is renumbered.
- `docs/prd/03-open-questions-and-risk-register.md` updates D-005, D-006, Q-001, Q-007, Q-008, Q-012, R-003, R-006, and R-014 without duplicating existing items.
- The delta backlog traces to the new change doc, affected baseline docs, package/deployment design, and current TypeScript CLI/package surfaces.
- Package/release validation remains dry-run only unless the user separately authorizes irreversible registry or npm publish actions.

## Phase Map

| Phase | File | Builds |
| --- | --- | --- |
| 01 | [01-active-prd-and-risk-reconciliation.md](01-active-prd-and-risk-reconciliation.md) | Active PRD change doc, baseline notes, index update, and risk-register reconciliation. |
| 02 | [02-shared-command-and-runtime-contract.md](02-shared-command-and-runtime-contract.md) | The shared `make-docs` package binary, runtime/version disclosure, no-alias, TypeScript runtime, and required MCP contract. |
| 03 | [03-package-validation-and-release-boundaries.md](03-package-validation-and-release-boundaries.md) | npm package validation plus first-class `npx`, `pnpm dlx`, and `bunx` / `bun x` release-boundary requirements. |
| 04 | [04-delta-backlog-and-closeout.md](04-delta-backlog-and-closeout.md) | Scoped delta backlog, validation commands, and closeout rules. |

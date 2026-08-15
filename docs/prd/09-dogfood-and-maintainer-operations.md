# 09 Dogfood and Maintainer Operations

## Purpose

This subsystem captures how `make-docs` maintains its own documentation system by using the same structural assets it ships to consumers. The repo-root `docs/` tree is an active dogfood instance of `packages/docs/template/`, not a separate internal-only docs site, so maintainers use it to validate routers, references, templates, and runtime-state boundaries before release (`README.md:7-20`, `packages/docs/README.md:62-76`).

Internal dogfood operations are a first-class capability because local development resolves template assets straight from `packages/docs/template/` through the sibling-first logic in `packages/cli/src/utils.ts:33-55`, while publish/pack flows consume the bundled copy created by `scripts/copy-template-to-cli.mjs:24-32`. If the dogfood docs drift from the template, maintainers lose the main in-repo proof that consumer-facing instructions and contracts still behave correctly.

## Scope

This doc covers the operational surface formed by the repo-root `.make-docs/` and `docs/` trees, the reviewed re-seed workflow from `packages/docs/template/.make-docs/` into `.make-docs/` and from `packages/docs/template/docs/` into `docs/`, and the maintainer checks that keep those projections trustworthy (`packages/docs/README.md`, `README.md`, `packages/cli/src/README.md`).

It also defines the ownership boundary between template-owned files and project-authored docs. Template-owned system resources are authored upstream for machine service and project only when explicitly selected under `.make-docs/system/**`; lifecycle archives use `.make-docs/archive/**`; project artifacts use `docs/artifacts/**`; persona test assets use `docs/assets/<persona-slug>/testing/**`; and paired instruction routers project only where the template declares them. Project-authored material such as `docs/designs/`, `docs/plans/`, `docs/prd/`, `docs/work/`, artifacts, testing assets, and local guides is never overwritten by reseeding. Make Docs v2 has no Library, Playbook, or Protocol dogfood target family.

## Contracts and Data

The key boundary is that mutable installer state belongs under root `.make-docs/`, not under `docs/`. The repo README states that `docs/assets/` contains document resources only and that mutable CLI state lives outside the docs tree (`README.md:46`). The installer code makes this concrete by defining `.make-docs`, `.make-docs/manifest.json`, and `.make-docs/conflicts` in `packages/cli/src/manifest.ts:18-20`.

Apply and sync stay intentionally non-destructive. Changed paths are classified from manifest, snapshot, hash, and ownership/provenance evidence; review may preserve project ownership, export then replace, overwrite proven clean managed content, skip, or stop, and unresolved or non-verified evidence fails closed. Conflict staging under `.make-docs/conflicts/<run-id>` is a preservation mechanism, not authority to overwrite or infer ownership.

Re-seeding is deliberately manual. The docs package README requires maintainers to copy only template-owned files from `packages/docs/template/` back into `docs/`, verify the copies, and avoid bulk automation unless they are deliberately reviewing the change set (`packages/docs/README.md:86-121`). That manual step is part of the contract, not an omission: the same README says the process stays manual for reviewability, selective propagation, and conflict awareness (`packages/docs/README.md:115-121`).

### Scoped Reseed and Freshness Proof

- Reseeding is reviewed and scoped, never a blind recursive copy. It selects only affected template-owned files, skips project-owned files or surfaces them for explicit review, and routes locally changed managed files through compatibility classification and managed-file conflict rules.
- Any reseed helper must preserve the same ownership boundary. It may not infer ownership solely from directory membership, including inside mixed system-projection, archive, artifact, persona-testing, or legacy Library/Playbook/Protocol paths.
- Dogfood freshness is proven with targeted parity checks for files expected to match exactly. Router and managed-block checks remain mandatory for instruction surfaces; manual visual inspection alone is insufficient proof for an asset claimed current.
- A managed ownership manifest or expanded parity allowlist may replace manual file enumeration only when it preserves project-owned exclusions and produces reviewable evidence.

Historical migration docs still matter, but only as background. `docs/assets/archive/plans/2026-04-22-w9-r1-docs-assets-resource-namespace/04-dogfood-docs-migration.md` records earlier hidden and `docs/assets/**` resource layouts. Current routing authority is the live PRD set, machine-served system resources with optional `.make-docs/system/{contracts,prompts,references,templates}/**` projection, `.make-docs/archive/**`, `docs/artifacts/**`, and `docs/assets/<persona-slug>/testing/**`; old path names remain migration evidence, not active dogfood authority.

## Integrations

Dogfood operations integrate directly with the packaging pipeline in the fixed order `packages/docs/template/` upstream authority, generated `packages/cli/template/` package projection, reviewed repo-root dogfood projection, then installed-project validation. The generated package copy and root dogfood are downstream evidence, never an alternate source; drift is repaired upstream or in the projection pipeline and never by hand-editing the generated package copy or copying root recovery edits back into upstream authority.

They also integrate with packaged validation. `scripts/smoke-pack.mjs` runs `npm run prepack`, packs the CLI, installs it into a temporary target, verifies `.make-docs/manifest.json`, checks skill installation and legacy-skill absence, exercises project-scoped `setup backup` and `setup remove` while preserving unmanaged files, and separately proves that top-level `uninstall` removes only the sandboxed machine-level footprint. This makes the dogfood surface and the packaged surface meet at the same operational boundary: generated docs plus root runtime state.

Finally, the subsystem integrates with repo hygiene and release prep. The root workspace scripts in `package.json:13-18` wrap `build`, `test`, `validate:defaults`, and `smoke:pack`; `scripts/check-wave-numbering.sh:48-58` audits duplicate `wN-rN` directories across both the repo-root docs tree and `packages/docs/template/docs`; and `packages/cli/src/README.md:179-204` acts as the maintainer-side release checklist that turns dogfood validation into publish readiness.

## Rebuild Notes

A clean-room rebuild needs to preserve the idea that the repo-root `docs/` tree is part of the product validation loop, not merely contributor notes. That means preserving the template-as-source-of-truth rule from `packages/docs/README.md:50-60`, the sibling-first development resolver in `packages/cli/src/utils.ts:33-55`, and the manual re-seed workflow in `packages/docs/README.md:86-121`.

Do not move runtime state back under `docs/`. The current contract puts `.make-docs/manifest.json` and `.make-docs/conflicts/` at the project root (`packages/cli/src/manifest.ts:18-20`, `README.md:46`, `packages/docs/README.md:48`), and older hidden-path layouts survive only in migration records under `docs/`.

Candidate items that should also surface in `03-open-questions-and-risk-register.md`:

- Manual reseeding requires a scoped, reviewable freshness proof for every affected template-owned file; missing parity automation remains a release blocker rather than permission to rely on visual inspection alone.
- Historical docs still reference superseded hidden-dot paths such as `docs/.references/`, `docs/.templates/`, and `docs/assets/config/manifest.json` in migration plans like `docs/assets/archive/plans/2026-04-22-w9-r1-docs-assets-resource-namespace/04-dogfood-docs-migration.md`. Those references are factual history, but easy to mistake for current routing authority.
- `packages/content/` is described as reserved for future CLI-rendered fragments in `README.md:10-17` and exists as a top-level workspace directory, but this subsystem does not yet define active ownership or dogfood behavior for it.

## Dogfood Evidence and Obligation Boundaries

The maintainer repo must dogfood deferred-obligation and naive-UAT resources only after their system versions are authored under `packages/docs/template/`. Maintainers must not make the installed `.make-docs/` or project `docs/` projection the upstream product authority. Project-authored obligation records, scenarios, and evidence remain editable consumer content in their repository-authoritative locations.

Dogfood validation must prove that upstream resources project into this repo without overwriting project-authored records or confusing repository authority with operational evidence in Project State, as required by [R-OBL-AUTH](45-deferred-obligation-governance.md#r-obl-auth-authority-chain-and-backlinks) and [R-NUAT-COMPAT](46-naive-end-user-acceptance-testing.md#r-nuat-compat-existing-artifact-adoption).

## Dogfood Projection Boundary

Repository-root installed Make Docs resources are dogfood projections of `packages/docs/template/`; project-authored designs, plans, PRDs, work, history, artifacts, persona testing, and other local content remain project authority edited in place. Maintainer synchronization must preserve that boundary, use manifest provenance and the same conflict review as a consumer install, and prohibit recovery shortcuts that reseed from root into upstream, hand-edit generated package copies, bypass classification, or overwrite project-owned content.

## Requirement History

### 2026-08-08 — Not assigned

- Affected requirement or section: `Consolidated capability ownership`
- Previous contract: Current requirements were also represented by standalone editorial PRDs 19.
- Replacement contract: The applicable current requirements are inline in this authority and its linked product owners; the standalone editorial records are retired from the active set.
- Rationale: Active PRDs own product subjects and do not preserve editorial operations as product authority.
- Source: [PRD Authority Maintenance](../../.make-docs/references/system/prd-change-management.md)


### 2026-08-08 — Not assigned

- Affected requirement or section: `Cross-cutting capability annotations`
- Previous contract: Later capability decisions were recorded as nested Change Notes that pointed to standalone editorial PRDs.
- Replacement contract: Current requirements remain inline in this owning PRD and related product authorities are linked by product subject.
- Rationale: The active PRD set must describe current product authority rather than the editorial operation that produced it.
- Source: [PRD Authority Maintenance](../../.make-docs/references/system/prd-change-management.md)

## Source Anchors

- `docs/designs/2026-08-12-make-docs-v2-product-boundary-and-missing-migration-recovery.md`
- `docs/plans/2026-08-13-w19-r1-make-docs-v2-product-boundary-and-missing-migration-recovery/00-overview.md`
- `README.md`
- `package.json`
- `packages/docs/README.md`
- `packages/docs/package.json`
- `packages/cli/src/utils.ts`
- `packages/cli/src/README.md`
- `packages/cli/src/install.ts`
- `packages/cli/src/manifest.ts`
- `packages/cli/tests/consistency.test.ts`
- `packages/cli/tests/install.test.ts`
- `packages/cli/tests/uninstall.test.ts`
- `scripts/check-instruction-routers.sh`
- `scripts/check-wave-numbering.sh`
- `scripts/copy-template-to-cli.mjs`
- `scripts/smoke-pack.mjs`
- `docs/assets/archive/plans/2026-04-16-w2-r0-guide-structure-contract/04-migration-and-reseed.md`
- `docs/assets/archive/plans/2026-04-22-w9-r1-docs-assets-resource-namespace/04-dogfood-docs-migration.md`
- `docs/prd/22-project-documentation-asset-model.md`
- `docs/prd/34-playbook-authoring-contract-and-model.md`
- `docs/designs/2026-06-20-playbook-contract-and-run-playbook.md`
- `docs/plans/2026-06-23-w18-r1-playbook-contract-run-playbook/00-overview.md`

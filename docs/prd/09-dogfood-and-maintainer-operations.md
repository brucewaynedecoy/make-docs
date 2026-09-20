# 09 Dogfood and Maintainer Operations

## Purpose

This subsystem captures how `make-docs` maintains its own documentation system by using the same structural assets it ships to consumers. The repo-root `docs/` tree is an active dogfood instance of `packages/docs/template/`, not a separate internal-only docs site, so maintainers use it to validate routers, references, templates, and runtime-state boundaries before release (`README.md:7-20`, `packages/docs/README.md:62-76`).

Internal dogfood operations are a first-class capability because local development resolves template assets straight from `packages/docs/template/` through the sibling-first logic in `packages/cli/src/utils.ts:33-55`, while publish/pack flows consume the bundled copy created by `scripts/copy-template-to-cli.mjs:24-32`. If the dogfood docs drift from the template, maintainers lose the main in-repo proof that consumer-facing instructions and contracts still behave correctly.

## Scope

This doc covers the operational surface formed by the repo-root `.make-docs/` and `docs/` trees, the reviewed re-seed workflow from `packages/docs/template/.make-docs/` into `.make-docs/` and from `packages/docs/template/docs/` into `docs/`, and the maintainer checks that keep those projections trustworthy (`packages/docs/README.md`, `README.md`, `packages/cli/src/README.md`).

It also defines the ownership boundary between template-owned files and project-authored docs. Template-owned system resources are authored upstream for machine service and project only when explicitly selected under `.make-docs/system/**`; lifecycle archives use `.make-docs/archive/**`; project artifacts use `docs/assets/project/**`; persona test assets use `docs/assets/<persona-slug>/testing/**`; and instruction routers project only for configured harnesses where the template declares them. Project-authored material such as `docs/designs/`, `docs/plans/`, `docs/prd/`, `docs/work/`, artifacts, testing assets, and local guides is never overwritten by reseeding. Make Docs v2 has no Library, Playbook, or Protocol dogfood target family.

## Contracts and Data

The global Store owns installation state, ownership, conflict decisions, and migration or recovery progress under PRD 38. Declarative identity/config and approved backup or conflict file copies remain local. `.make-docs/manifest.json` is legacy transfer input, never current authority or a fallback.

Apply and sync stay intentionally non-destructive. Changed paths are classified from manifest, snapshot, hash, and ownership/provenance evidence; review may preserve project ownership, export then replace, overwrite proven clean managed content, skip, or stop, and unresolved or non-verified evidence fails closed. Conflict staging under `.make-docs/conflicts/<run-id>` is a preservation mechanism, not authority to overwrite or infer ownership.

Reseeding must be explicitly scoped and reviewed. Use the installed CLI and the shared ownership, conflict, and Store operation service for managed changes. A manual or agent-assisted layout move follows a prepared Store plan and returns to the CLI for byte and link verification; it does not replace installation ownership with handwritten state.

### Scoped Reseed and Freshness Proof

- Reseeding is reviewed and scoped, never a blind recursive copy. It selects only affected template-owned files, skips project-owned files or surfaces them for explicit review, and routes locally changed managed files through compatibility classification and managed-file conflict rules.
- Any reseed helper must preserve the same ownership boundary. It may not infer ownership solely from directory membership, including inside mixed system-projection, archive, artifact, persona-testing, or legacy Library/Playbook/Protocol paths.
- Dogfood freshness is proven with targeted parity checks for files expected to match exactly. Router and managed-block checks remain mandatory for instruction surfaces; manual visual inspection alone is insufficient proof for an asset claimed current.
- A managed ownership manifest or expanded parity allowlist may replace manual file enumeration only when it preserves project-owned exclusions and produces reviewable evidence.

Historical migration docs still matter, but only as background. `docs/assets/archive/plans/2026-04-22-w9-r1-docs-assets-resource-namespace/04-dogfood-docs-migration.md` records earlier hidden and `docs/assets/**` resource layouts. Current routing authority is the live PRD set, machine-served system-resource bodies, an always-local router skeleton with optional bodies under `.make-docs/system/{contracts,prompts,references,templates}/**`, `.make-docs/archive/**`, `docs/assets/project/**`, and `docs/assets/<persona-slug>/testing/**`; old path names remain migration evidence, not active dogfood authority.

## Integrations

Dogfood operations integrate directly with the packaging pipeline in the fixed order `packages/docs/template/` upstream authority, generated `packages/cli/template/` package projection, reviewed repo-root dogfood projection, then installed-project validation. The generated package copy and root dogfood are downstream evidence, never an alternate source; drift is repaired upstream or in the projection pipeline and never by hand-editing the generated package copy or copying root recovery edits back into upstream authority.

Packaged validation installs into an isolated target, verifies Store-owned installation evidence and absence of local operational state, exercises idempotent setup, selected skills, backup, and project removal, and proves that machine uninstall preserves the Store unless the separate explicit removal choice is authorized. Local backup payloads and project-owned content remain protected.

Finally, the subsystem integrates with repo hygiene and release prep. The root workspace scripts in `package.json:13-18` wrap `build`, `test`, `validate:defaults`, and `smoke:pack`; `scripts/check-wave-numbering.sh:48-58` audits duplicate `wN-rN` directories across both the repo-root docs tree and `packages/docs/template/docs`; and `packages/cli/src/README.md:179-204` acts as the maintainer-side release checklist that turns dogfood validation into publish readiness.

## Rebuild Notes

A clean-room rebuild needs to preserve the idea that the repo-root `docs/` tree is part of the product validation loop, not merely contributor notes. That means preserving the template-as-source-of-truth rule from `packages/docs/README.md:50-60`, the sibling-first development resolver in `packages/cli/src/utils.ts:33-55`, and the reviewed CLI delivery and layout verification boundary stated here.

Keep all CLI installation and migration state in the external Store. Local conflict and backup payload copies remain content, not restoration authority. Do not restore a project-local manifest or operational receipt.

Candidate items that should also surface in `03-open-questions-and-risk-register.md`:

- Manual reseeding requires a scoped, reviewable freshness proof for every affected template-owned file; missing parity automation remains a release blocker rather than permission to rely on visual inspection alone.
- Historical docs still reference superseded hidden-dot paths such as `docs/.references/`, `docs/.templates/`, and `docs/assets/config/manifest.json` in migration plans like `docs/assets/archive/plans/2026-04-22-w9-r1-docs-assets-resource-namespace/04-dogfood-docs-migration.md`. Those references are factual history, but easy to mistake for current routing authority.
- Rendered JSON content fragments are a current non-goal. The owner approved retirement of the unused `packages/content/` placeholder. Future content-fragment work requires a new accepted design and owning PRD authority.

## Dogfood Evidence and Obligation Boundaries

The maintainer repo must dogfood deferred-obligation and naive-UAT resources only after their system versions are authored under `packages/docs/template/`. Maintainers must not make the installed `.make-docs/` or project `docs/` projection the upstream product authority. Project-authored obligation records, scenarios, and evidence remain editable consumer content in their repository-authoritative locations.

Dogfood validation must prove that upstream resources project into this repo without overwriting project-authored records or confusing repository authority with operational evidence in Project State, as required by [R-OBL-AUTH](45-deferred-obligation-governance.md#r-obl-auth-authority-chain-and-backlinks) and [R-NUAT-COMPAT](46-naive-end-user-acceptance-testing.md#r-nuat-compat-existing-artifact-adoption).

## Dogfood Projection Boundary

Repository-root installed Make Docs resources are dogfood projections of `packages/docs/template/`; project-authored designs, plans, PRDs, work, history, artifacts, persona testing, and other local content remain project authority edited in place. Maintainer synchronization must preserve that boundary, use manifest provenance and the same conflict review as a consumer install, and prohibit recovery shortcuts that reseed from root into upstream, hand-edit generated package copies, bypass classification, or overwrite project-owned content.

### Asset Recovery and Dogfood Proof

R-ASSET-DOGFOOD-1 (MUST): implement shipped assets upstream, prepare and test the package, refresh the installed `make-docs` CLI, then perform the reviewed dogfood layout operation through that CLI. Inspect the full actual tree, including empty directories. Preserve project-owned bytes and repair only the explicit reviewed links. Local shell cleanup is not a replacement for the permanent migration path.

R-ASSET-DOGFOOD-2 (MUST): compare prepared CLI and manual or agent-assisted layout results against the same expected content and link map. Completion requires verified destinations and no unexplained legacy leftovers. Named archival and backup exclusions remain non-active provenance. This proof does not require a second Store or a local receipt.

## First-Party Skill Adoption Proof

R-SKILL-DOGFOOD-1 (MUST): first-party Skill changes are authored only in `packages/skills/<name>/`; the build reads declared bytes there directly and embeds them in compiled CLI output. Prove the extracted CLI artifact before live adoption. Inspect actual disk under `packages`, including ignored or temporary paths and empty folders, to reject duplicate Skill trees and obsolete empty mirror directories. Do not create replicated Skill payloads under `packages/cli` or `packages/docs` as part of preparation. Use `just install-cli` to refresh the installed CLI, then use its public `setup skills` review and adoption flow. Do not hand-copy native Skill directories into shared payload locations or write ownership records directly.

R-SKILL-DOGFOOD-2 (MUST): maintainer proof covers the existing local `preflight`, `factory`, and `human-experience` copies. The reviewed package, complete current file inventory, selected tools/scope, preservation backups, and Store ownership must match apply. The result must prove usable native exposure, recorded adoption even for unchanged bytes, and no unresolved pending operation. Existing local copies are preserved until the reviewed CLI operation handles them.

R-SKILL-DOGFOOD-3 (MUST): destructive removal checks use isolated projects and homes. Retain independent code-review findings and a fresh-context review of the public selection, adoption, and recovery path. Report tested package identity, observations, limits, and follow-up in the backlog's central evidence report. Technical proof does not itself authorize publication, a commit, or unrelated wave work.

[PRD 28](28-shared-agentics-installation-and-harness-exposure.md) owns adoption and native exposure; [PRD 38](38-global-store-and-project-state.md) owns required state; [PRD 10](10-packaging-validation-and-release-reference.md) owns package proof.

## Requirement History

### 2026-08-08 — Not assigned

- Affected requirement or section: `Consolidated capability ownership`
- Previous contract: Current requirements were also represented by standalone editorial PRDs 19.
- Replacement contract: The applicable current requirements are inline in this authority and its linked product owners; the standalone editorial records are retired from the active set.
- Rationale: Active PRDs own product subjects and do not preserve editorial operations as product authority.
- Source: [PRD Authority Maintenance](../../.make-docs/system/references/prd-change-management.md)


### 2026-08-08 — Not assigned

- Affected requirement or section: `Cross-cutting capability annotations`
- Previous contract: Later capability decisions were recorded as nested Change Notes that pointed to standalone editorial PRDs.
- Replacement contract: Current requirements remain inline in this owning PRD and related product authorities are linked by product subject.
- Rationale: The active PRD set must describe current product authority rather than the editorial operation that produced it.
- Source: [PRD Authority Maintenance](../../.make-docs/system/references/prd-change-management.md)

### 2026-09-09 — W19 R4 Asset and Persona Recovery

- Affected requirement or section: `Asset Recovery and Dogfood Proof` and current asset, bootstrap, migration, or storage statements in this owner.
- Previous contract: Dogfood prose named docs/artifacts/ and project-local installer state, and described manual reseeding without the current Store operation boundary. Prior dated records retain their historical claims.
- Replacement contract: Shared material uses `docs/assets/project/`; audience assets use on-demand Persona children; archives remain `.make-docs/archive/`. Short routing exposes defaults and configured harness files without a CLI. Reviewed layout moves use the R3 Store service and verify content and links. Existing local-state prose is aligned with the completed R3 boundary.
- Rationale: Finish the missed consolidation requirement and remove active instructions that can restore legacy paths. This is the W19 R4 draft implementation target, not a runtime completion claim.
- Source: [asset and Persona design](../designs/2026-09-09-project-assets-and-persona-discovery.md); [W19 R4 plan](../plans/2026-09-09-w19-r4-project-assets-and-persona-discovery/00-overview.md).

### 2026-09-09 — W19 R5

- Affected requirement or section: `First-Party Skill Adoption Proof`
- Previous contract: Dogfood proof focused on selected system resources and layout recovery without a managed-adoption path for locally authored Skills.
- Replacement contract: Skill promotion is followed by isolated bundled-package proof, the installed CLI recipe, and reviewed public adoption of the three existing local copies.
- Rationale: Maintainer validation must exercise the same ownership and recovery path offered to consumers.
- Source: [First-Party Skills and Managed Adoption design](../designs/2026-09-09-first-party-skills-and-managed-adoption.md) and [W19 R5 plan](../plans/2026-09-09-w19-r5-first-party-skills-and-managed-adoption/00-overview.md).

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

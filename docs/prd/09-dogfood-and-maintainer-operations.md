# 09 Dogfood and Maintainer Operations

## Purpose

This subsystem captures how `make-docs` maintains its own documentation system by using the same structural assets it ships to consumers. The repo-root `docs/` tree is an active dogfood instance of `packages/docs/template/`, not a separate internal-only docs site, so maintainers use it to validate routers, references, templates, and runtime-state boundaries before release (`README.md:7-20`, `packages/docs/README.md:62-76`).

Internal dogfood operations are a first-class capability because local development resolves template assets straight from `packages/docs/template/` through the sibling-first logic in `packages/cli/src/utils.ts:33-55`, while publish/pack flows consume the bundled copy created by `scripts/copy-template-to-cli.mjs:24-32`. If the dogfood docs drift from the template, maintainers lose the main in-repo proof that consumer-facing instructions and contracts still behave correctly.

## Scope

This doc covers the operational surface formed by the repo-root `docs/`, the manual re-seed workflow from `packages/docs/template/docs/` into `docs/`, and the maintainer checks that keep that surface trustworthy (`packages/docs/README.md:86-121`, `README.md:205-230`, `packages/cli/src/README.md:47-52`).

It also defines the ownership boundary between template-owned files and project-authored docs. Template-owned files are the routers, reference docs, and structural templates under `docs/assets/` plus the paired top-level instruction routers; project-authored material such as `docs/designs/`, `docs/plans/`, `docs/prd/`, `docs/work/`, and guides is never supposed to be overwritten by re-seeding (`packages/docs/README.md:68-76`). Packaging mechanics, tarball inspection, and publish commands are referenced here only when they constrain dogfood behavior; the operational checklist lives in [10-packaging-validation-and-release-reference.md](./10-packaging-validation-and-release-reference.md).

## Component and Capability Map

The source-of-truth template is `packages/docs/template/`, which the docs package README describes as the tree that ultimately ships to consumer projects (`packages/docs/README.md:7-37`). In local development, the CLI does not require a pre-copied bundle because `packages/cli/src/utils.ts:33-55` resolves `../docs/template` first and only falls back to `packages/cli/template` when the package has been packed.

The repo-root dogfood surface is the checked-in `docs/` tree described in `README.md:16-20`. That surface is expected to mirror template-owned routers, references, and templates while still holding project-specific authored artifacts such as plans, PRDs, and work logs (`packages/docs/README.md:70-76`). This split is why dogfood operations are not just documentation housekeeping: they are the in-repo rehearsal space for the same contracts consumers follow.

Maintainer capability gates sit on top of that surface. `scripts/check-instruction-routers.sh:1-58` enforces byte-identical `AGENTS.md` and `CLAUDE.md` pairs plus line-budget and heading rules. `packages/cli/tests/consistency.test.ts:33-77` ensures the default asset pipeline still matches the checked-in full-profile template and that every file under `TEMPLATE_ROOT` is covered by the installer asset catalog. `packages/cli/tests/install.test.ts:148-213` confirms a default install produces the expected docs assets and skill roots, while `packages/cli/tests/uninstall.test.ts:155-189` verifies managed cleanup without deleting preserved content.

The maintainer runbook for exercising this surface lives in `packages/cli/src/README.md:64-177`. That README treats dogfood-sensitive changes differently depending on what moved: router or packaged-asset changes call for `npm run validate:defaults` and `npm run smoke:pack`, while profile, manifest, or conflict behavior calls for the full test suite (`packages/cli/src/README.md:47-52`).

## Contracts and Data

The key boundary is that mutable installer state belongs under root `.make-docs/`, not under `docs/`. The repo README states that `docs/assets/` contains document resources only and that mutable CLI state lives outside the docs tree (`README.md:46`). The installer code makes this concrete by defining `.make-docs`, `.make-docs/manifest.json`, and `.make-docs/conflicts` in `packages/cli/src/manifest.ts:18-20`.

Apply and sync stay intentionally non-destructive. The consumer README explains that changed managed files are skipped and proposed replacements are staged under `.make-docs/conflicts/<run-id>` (`README.md:101-106`), and the install pipeline implements that behavior by routing conflicting replacements through `toConflictRelativePath` in `packages/cli/src/install.ts:166-240`.

Re-seeding is deliberately manual. The docs package README requires maintainers to copy only template-owned files from `packages/docs/template/` back into `docs/`, verify the copies, and avoid bulk automation unless they are deliberately reviewing the change set (`packages/docs/README.md:86-121`). That manual step is part of the contract, not an omission: the same README says the process stays manual for reviewability, selective propagation, and conflict awareness (`packages/docs/README.md:115-121`).

Historical migration docs still matter, but only as background. `docs/assets/archive/plans/2026-04-22-w9-r1-docs-assets-resource-namespace/04-dogfood-docs-migration.md` records the shift from hidden-dot resource paths such as `docs/.references/` and `docs/.templates/` to the current `docs/assets/...` tree and root `.make-docs/...` state. Current routing authority remains the live README and `docs/assets/references/*`; old path names should be read as migration history, not active contract.

## Integrations

Dogfood operations integrate directly with the packaging pipeline. `scripts/copy-template-to-cli.mjs:24-32` copies `packages/docs/template/` into `packages/cli/template/` during `prepack`, so any template edit that was never re-seeded into repo-root `docs/` can still ship correctly while leaving the maintainers' own working docs stale. That is precisely why the project keeps manual re-seed instructions in `packages/docs/README.md:86-121`.

They also integrate with packaged validation. `scripts/smoke-pack.mjs:60-246` runs `npm run prepack`, packs the CLI, installs it into a temp target, verifies `.make-docs/manifest.json`, checks skill installation and legacy-skill absence, and exercises `backup` and `uninstall` while preserving an unmanaged file. This makes the dogfood surface and the packaged surface meet at the same operational boundary: generated docs plus root runtime state.

Finally, the subsystem integrates with repo hygiene and release prep. The root workspace scripts in `package.json:13-18` wrap `build`, `test`, `validate:defaults`, and `smoke:pack`; `scripts/check-wave-numbering.sh:48-58` audits duplicate `wN-rN` directories across both the repo-root docs tree and `packages/docs/template/docs`; and `packages/cli/src/README.md:179-204` acts as the maintainer-side release checklist that turns dogfood validation into publish readiness.

## Rebuild Notes

A clean-room rebuild needs to preserve the idea that the repo-root `docs/` tree is part of the product validation loop, not merely contributor notes. That means preserving the template-as-source-of-truth rule from `packages/docs/README.md:50-60`, the sibling-first development resolver in `packages/cli/src/utils.ts:33-55`, and the manual re-seed workflow in `packages/docs/README.md:86-121`.

Do not move runtime state back under `docs/`. The current contract puts `.make-docs/manifest.json` and `.make-docs/conflicts/` at the project root (`packages/cli/src/manifest.ts:18-20`, `README.md:46`, `packages/docs/README.md:48`), and older hidden-path layouts survive only in migration records under `docs/`.

Candidate items that should also surface in `03-open-questions-and-risk-register.md`:

- Manual re-seeding has no automated freshness check. The workflow is intentional, but there is no code path that proves repo-root `docs/` still matches template-owned files after template edits (`packages/docs/README.md:103-121`).
- Historical docs still reference superseded hidden-dot paths such as `docs/.references/`, `docs/.templates/`, and `docs/assets/config/manifest.json` in migration plans like `docs/assets/archive/plans/2026-04-22-w9-r1-docs-assets-resource-namespace/04-dogfood-docs-migration.md`. Those references are factual history, but easy to mistake for current routing authority.
- `packages/content/` is described as reserved for future CLI-rendered fragments in `README.md:10-17` and exists as a top-level workspace directory, but this subsystem does not yet define active ownership or dogfood behavior for it.

## Source Anchors

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

# 01 Product Overview

## Purpose

`make-docs` is a Node-based installer and lifecycle CLI that turns a target repository into an AI-friendly documentation workspace with opinionated structure, templates, references, router instructions, and optional agent skills. The public contract in `README.md:1-46` and `packages/cli/README.md:1-29` is implemented by `packages/cli/src/cli.ts:77-265`, which chooses between first install, manifest-backed sync, explicit reconfigure, skills-only management, backup, and uninstall, then routes the run into the matching planning and apply flow.

The product is not only a file copier. Profile resolution in `packages/cli/src/profile.ts:10-93` and shared types in `packages/cli/src/types.ts:38-97` convert user selections into a dependency-aware `InstallProfile`; asset selection in `packages/cli/src/rules.ts:8-194` and `packages/cli/src/catalog.ts:64-85` decides which contracts, templates, prompts, and router files belong to that profile; and the planner/apply path in `packages/cli/src/planner.ts:19-202`, `packages/cli/src/install.ts:26-157`, and `packages/cli/src/manifest.ts:17-101` preserves that managed footprint over time through `.make-docs/manifest.json`.

The product also treats maintainer and dogfood workflows as first-class capabilities. The repo-root `docs/` tree is an active dogfood instance of the shipped template rather than an unrelated internal wiki, as described in `README.md:7-20` and `packages/docs/README.md:62-121`, and the full subsystem map now lives across `docs/prd/05-installation-profile-and-manifest-lifecycle.md`, `docs/prd/06-template-contracts-and-generated-assets.md`, `docs/prd/07-cli-command-surface-and-lifecycle.md`, `docs/prd/08-skills-catalog-and-distribution.md`, `docs/prd/09-dogfood-and-maintainer-operations.md`, and `docs/prd/10-packaging-validation-and-release-reference.md`.

## Users

- Project maintainers and technical leads install `make-docs` into an existing repo to standardize `docs/`, root harness instructions, and the runtime state under `.make-docs/`, either interactively or through non-interactive flags such as `--yes`, `--no-work`, and `reconfigure` in `README.md:48-107` and `packages/cli/src/cli.ts:455-723`.
- AI agent operators use the routed instruction surface that `packages/cli/src/catalog.ts:23-62` installs for the enabled harnesses and capabilities. The Codex and Claude mappings in `packages/cli/src/types.ts:13-21` and the router renderers in `packages/cli/src/renderers.ts:99-277` make the installed tree legible to the selected agent environments.
- Documentation authors use the shipped contract and template set under `packages/docs/template/docs/assets/references/` and `packages/docs/template/docs/assets/templates/`, including the fixed PRD core described in `README.md:182-194` and the output contract enforced by `packages/docs/template/docs/assets/references/output-contract.md`.
- Internal maintainers and release engineers use the same system to validate the product against itself. `packages/docs/README.md:62-121` defines manual dogfood re-seeding, `packages/cli/src/README.md:47-52` maps code changes to the right validation commands, and `scripts/smoke-pack.mjs:60-246` exercises the packaged CLI end to end before release.

## Key Capabilities

- Profile-scoped scaffold installation: the default selections in `packages/cli/src/profile.ts:17-35` enable `designs`, `plans`, `prd`, and `work`, while the dependency graph in `packages/cli/src/profile.ts:10-15` ensures `prd` depends on `plans` and `work` depends on both `plans` and `prd`. This gives the product a single install model for both full and partial documentation systems.
- Contract-aware asset delivery: `packages/docs/template/` is the authoring source of truth, while `packages/cli/src/rules.ts:55-182`, `packages/cli/src/catalog.ts:64-85`, and `packages/cli/src/renderers.ts:40-97` choose and materialize the profile-valid subset of prompts, references, templates, and router instructions that should land in the consumer repo.
- Non-destructive sync and reconfigure: `packages/cli/src/cli.ts:119-219` infers whether the user is syncing saved selections or explicitly reconfiguring; `packages/cli/src/planner.ts:51-189` classifies create, update, generate, remove-managed, and conflict actions; and `packages/cli/src/install.ts:177-223` writes managed files while staging unresolved replacements under `.make-docs/conflicts/<run-id>/`.
- Harness and skill distribution: `make-docs skills` is a first-class surface in `packages/cli/src/cli.ts:104-116` and `packages/cli/src/skills-command.ts:32-103`, while `packages/cli/skill-registry.json:3-112`, `packages/cli/src/skill-catalog.ts:18-127`, and `packages/cli/src/skill-resolver.ts:40-244` install required and optional skills into `.claude/skills`, `.agents/skills`, or the user home directory.
- Managed lifecycle operations: `packages/cli/src/backup.ts:49-158`, `packages/cli/src/uninstall.ts:52-177`, and `packages/cli/src/audit.ts:41-87` give the product a safety-first story for backup and uninstall that is separate from install/sync but still driven by manifest and canonical-content auditing.
- Packaging and dogfood validation: `packages/cli/package.json:9-25` defines the publishable surface, `scripts/copy-template-to-cli.mjs:24-32` prepares the bundled template, `packages/cli/tests/consistency.test.ts:33-77` proves the full-profile template stays aligned with renderer output, and `scripts/check-instruction-routers.sh:1-75` plus `scripts/smoke-pack.mjs:60-246` enforce dogfood and tarball integrity.

## System Boundaries

In scope, `make-docs` owns the publishable CLI at `packages/cli/`, the template authoring tree at `packages/docs/template/`, the shipped skill source tree at `packages/skills/`, the packaged registry at `packages/cli/skill-registry.json`, the repo-level packaging and validation scripts under `scripts/`, and the consumer-facing managed footprint consisting of `docs/**`, root `AGENTS.md` / `CLAUDE.md`, `.make-docs/manifest.json`, `.make-docs/conflicts/`, and optional skill installs under project or home directories (`README.md:24-46`, `packages/cli/src/types.ts:38-97`, `packages/cli/src/skill-catalog.ts:18-127`).

The product deliberately separates authoring assets from installed runtime state. Template-owned contracts and templates live under `packages/docs/template/docs/assets/**`, consumer-facing runtime state lives under root `.make-docs/` rather than `docs/assets/` (`README.md:46`, `packages/docs/README.md:48`, `packages/cli/src/manifest.ts:17-20`), and user-authored plans, PRDs, guides, and work items are not treated as template source even when the repo is dogfooding the system (`packages/docs/README.md:70-76`).

Out of scope, the product does not currently publish `packages/docs`, `packages/skills`, or `packages/content` as standalone packages (`packages/docs/package.json:2-5`, `packages/skills/package.json:2-5`, `packages/content/package.json:2-5`), does not automate dogfood re-seeding (`packages/docs/README.md:103-121`), does not define a live rendered-fragment pipeline for `packages/content/` despite reserving it in `README.md:10-17`, and does not guarantee offline skill installs because skill payload resolution currently depends on remote URLs in `packages/cli/src/skill-registry.ts:79-84` and `packages/cli/src/skill-resolver.ts:118-244`.

## Current Limitations

- The UI and CLI expose `required` versus `all` modes for templates and references in `packages/cli/src/wizard.ts:93-104` and `packages/cli/src/wizard.ts:838-888`, but the current selector logic in `packages/cli/src/rules.ts:130-182` only adds one extra reference for `referencesMode === "all"` and does not branch on `templatesMode` at all. The product surface promises more granularity than the live asset selector currently enforces.
- Skills are distributed through a packaged registry plus remote fetches, not through bundled local skill payloads. The registry loader in `packages/cli/src/skill-registry.ts:25-84` requires remote-style sources, and the resolver in `packages/cli/src/skill-resolver.ts:226-244` fetches content over the network, so skill installation is more fragile than the base docs scaffold.
- Dogfood freshness is manual by design. `packages/docs/README.md:86-121` requires contributors to copy updated template-owned files back into repo-root `docs/`, but there is no automated freshness check that proves `docs/assets/**` still mirrors `packages/docs/template/docs/assets/**` after template edits.
- Package-surface documentation is currently inconsistent with the actual tarball allowlist. The live `files` set in `packages/cli/package.json:9-15` ships `dist`, `template`, the registry files, and `README.md`, while the maintainer and packaged READMEs still describe older package contents in `packages/cli/src/README.md:179-204` and `packages/cli/README.md:91-120`.
- `packages/content/` remains a reserved future capability rather than an active subsystem. It is described in `README.md:10-17` and `packages/content/package.json:2-5`, but the current template resolver in `packages/cli/src/utils.ts:33-55`, asset catalog in `packages/cli/src/catalog.ts:64-85`, and renderers in `packages/cli/src/renderers.ts:40-570` do not consume it.

## Source Anchors

- `README.md`
- `package.json`
- `packages/cli/package.json`
- `packages/cli/README.md`
- `packages/cli/src/README.md`
- `packages/docs/package.json`
- `packages/docs/README.md`
- `packages/skills/package.json`
- `packages/skills/README.md`
- `packages/content/package.json`
- `packages/cli/src/cli.ts`
- `packages/cli/src/profile.ts`
- `packages/cli/src/types.ts`
- `packages/cli/src/rules.ts`
- `packages/cli/src/catalog.ts`
- `packages/cli/src/renderers.ts`
- `packages/cli/src/planner.ts`
- `packages/cli/src/install.ts`
- `packages/cli/src/manifest.ts`
- `packages/cli/src/skill-registry.ts`
- `packages/cli/src/skill-catalog.ts`
- `packages/cli/src/skill-resolver.ts`
- `packages/cli/src/skills-command.ts`
- `packages/cli/src/backup.ts`
- `packages/cli/src/uninstall.ts`
- `packages/cli/src/audit.ts`
- `packages/cli/tests/consistency.test.ts`
- `scripts/copy-template-to-cli.mjs`
- `scripts/check-instruction-routers.sh`
- `scripts/smoke-pack.mjs`
- `docs/prd/05-installation-profile-and-manifest-lifecycle.md`
- `docs/prd/06-template-contracts-and-generated-assets.md`
- `docs/prd/07-cli-command-surface-and-lifecycle.md`
- `docs/prd/08-skills-catalog-and-distribution.md`
- `docs/prd/09-dogfood-and-maintainer-operations.md`
- `docs/prd/10-packaging-validation-and-release-reference.md`

# 01 Product Overview

## Purpose

`make-docs` is a Node-based installer and lifecycle CLI that turns a target repository into an AI-friendly documentation workspace with opinionated structure, templates, references, router instructions, and optional agent skills. The public contract in `README.md` and `packages/cli/README.md` is implemented by `runCli`, `inferInstallIntent`, and `runSkillsCommand` in `packages/cli/src/cli.ts`, which choose and route first install, manifest-backed sync, explicit reconfigure, skills-only management, backup, and uninstall.

The product is not only a file copier. `resolveInstallProfile` in `packages/cli/src/profile.ts` converts `InstallSelections` into the dependency-aware `InstallProfile` defined in `packages/cli/src/types.ts`; the rule collections in `packages/cli/src/rules.ts` and `getDesiredAssets` in `packages/cli/src/catalog.ts` decide which contracts, templates, prompts, and router files belong to that profile; and `createInstallPlan`, `applyInstallPlan`, and `writeManifest` in `packages/cli/src/planner.ts`, `packages/cli/src/install.ts`, and `packages/cli/src/manifest.ts` preserve that managed footprint over time through `.make-docs/manifest.json`.

The product also treats maintainer and dogfood workflows as first-class capabilities. The repo-root `docs/` tree is an active dogfood instance of the shipped template rather than an unrelated internal wiki, as described in `README.md` and `packages/docs/README.md`, and the full subsystem map now lives across `docs/prd/05-installation-profile-and-manifest-lifecycle.md`, `docs/prd/06-template-contracts-and-generated-assets.md`, `docs/prd/07-cli-command-surface-and-lifecycle.md`, `docs/prd/08-skills-catalog-and-distribution.md`, `docs/prd/09-dogfood-and-maintainer-operations.md`, and `docs/prd/10-packaging-validation-and-release-reference.md`.

## Users

- Project maintainers and technical leads install `make-docs` into an existing repo to standardize `docs/`, root harness instructions, and the runtime state under `.make-docs/`, either interactively or through non-interactive flags such as `--yes`, `--no-work`, and `reconfigure` in `README.md` and the `ParsedArgs`, `parseArgs`, and `validateParsedArgs` command boundary in `packages/cli/src/cli.ts`.
- AI agent operators use the routed instruction surface that `getDesiredAssets` in `packages/cli/src/catalog.ts` installs for the enabled harnesses and capabilities. `Harness`, `InstructionKind`, and `HARNESS_TO_INSTRUCTION` in `packages/cli/src/types.ts` plus the static managed-block router files in `packages/docs/template/**` make the installed tree legible to the selected agent environments.
- Documentation authors use the shipped contract and template set under `packages/docs/template/.make-docs/{contracts,references,templates}/system/`, including the fixed PRD core described in `README.md` and the output contract enforced by `packages/docs/template/.make-docs/contracts/system/output-contract.md`.
- Internal maintainers and release engineers use the same system to validate the product against itself. `packages/docs/README.md` defines manual dogfood re-seeding, `packages/cli/src/README.md` maps code changes to the right validation commands, and `scripts/smoke-pack.mjs` exercises the packaged CLI end to end before release.

## Key Capabilities

- Profile-scoped scaffold installation: `defaultSelections` in `packages/cli/src/profile.ts` enables `designs`, `plans`, `prd`, and `work`, while `CAPABILITY_DEPENDENCIES` ensures `prd` depends on `plans` and `work` depends on both `plans` and `prd`. This gives the product a single install model for both full and partial documentation systems.
- Contract-aware asset delivery: `packages/docs/template/` is the authoring source of truth, while the rule collections in `packages/cli/src/rules.ts` and `getDesiredAssets` in `packages/cli/src/catalog.ts` choose and materialize the profile-valid subset of prompts, references, templates, and router instructions that should land in the consumer repo without rewriting template file contents.
- Non-destructive sync and reconfigure: `inferInstallIntent` and `resolveSelections` in `packages/cli/src/cli.ts` distinguish saved-selection sync from explicit reconfiguration; `createInstallPlan` in `packages/cli/src/planner.ts` classifies create, update, generate, remove-managed, and conflict actions; and `applyInstallPlan` in `packages/cli/src/install.ts` writes managed files while staging unresolved replacements under `.make-docs/conflicts/<run-id>/`.
- Harness and skill distribution: `make-docs setup skills` is the project-lifecycle surface defined by [39-cli-command-model-and-operation-registry.md](./39-cli-command-model-and-operation-registry.md), while `packages/cli/skill-registry.json`, `packages/cli/src/skill-catalog.ts`, and `packages/cli/src/skill-resolver.ts` install explicitly selected skills once under `.make-docs/agentics/skills/<skill-name>/` per scope and expose them as native harness skill directories under `.claude/skills/<skill-name>/` and `.agents/skills/<skill-name>/` using symlink-preferred behavior with managed copy-mirror fallback.
- Managed lifecycle operations: `runBackupCommand`, `runUninstallCommand`, and `createAuditReport` in `packages/cli/src/backup.ts`, `packages/cli/src/uninstall.ts`, and `packages/cli/src/audit.ts` give the product a safety-first story for backup and uninstall that is separate from install/sync but still driven by manifest and canonical-content auditing.
- Deferred-obligation governance: [R-OBL-ID](45-deferred-obligation-governance.md#r-obl-id-canonical-register-and-identity) and [R-OBL-AUDIT](45-deferred-obligation-governance.md#r-obl-audit-phase-close-orphan-audit) give every accepted incomplete outcome a durable owner, trigger, target coordinate, exit criteria, lifecycle status, and phase-close orphan audit so later work cannot silently lose it.
- True naive end-user acceptance testing: [R-NUAT-ACTIVATE](46-naive-end-user-acceptance-testing.md#r-nuat-activate-user-observable-slices-and-valid-none) and [R-NUAT-EVIDENCE](46-naive-end-user-acceptance-testing.md#r-nuat-evidence-setup-outcomes-findings-and-reproducibility) require isolated, goal-oriented UAT when work produces a genuinely user-observable slice, preserve a justified `none` path for internal work, and capture discoverability, interaction, accessibility, and completion evidence without coaching the tester.
- Packaging and dogfood validation: `packages/cli/package.json` defines the publishable surface, `scripts/copy-template-to-cli.mjs` prepares the bundled template, `packages/cli/tests/consistency.test.ts` proves desired scaffold assets match static template bytes, and `scripts/check-instruction-routers.sh` plus `scripts/smoke-pack.mjs` enforce dogfood and tarball integrity.

## System Boundaries

In scope, `make-docs` owns the publishable CLI at `packages/cli/`, the template authoring tree at `packages/docs/template/`, the shipped skill source tree at `packages/skills/`, the packaged registry at `packages/cli/skill-registry.json`, the repo-level packaging and validation scripts under `scripts/`, and the consumer-facing managed footprint consisting of `docs/**`, root `AGENTS.md` / `CLAUDE.md`, `.make-docs/manifest.json`, `.make-docs/conflicts/`, shared selected-skill payloads under `.make-docs/agentics/skills/**`, and generated harness skill stubs under project or home directories (`README.md`, `InstallManifest` in `packages/cli/src/types.ts`, and `getDesiredSkillAssets` in `packages/cli/src/skill-catalog.ts`).

The product deliberately separates authoring assets from installed runtime state. Template-owned contracts, references, prompts, and templates live under `packages/docs/template/.make-docs/{contracts,references,templates}/system/**`, managed project-asset routers live under `packages/docs/template/docs/assets/**`, consumer-facing runtime state lives under root `.make-docs/` rather than `docs/assets/` (`README.md`, `packages/docs/README.md`, and `loadManifest` / `writeManifest` in `packages/cli/src/manifest.ts`), and user-authored plans, PRDs, guides, and work items are not treated as template source even when the repo is dogfooding the system (`packages/docs/README.md`).

Out of scope, the product does not currently publish `packages/docs`, `packages/skills`, or `packages/content` as standalone packages (`packages/docs/package.json`, `packages/skills/package.json`, `packages/content/package.json`), does not automate dogfood re-seeding (`packages/docs/README.md`), does not define a live rendered-fragment pipeline for `packages/content/` despite reserving it in `README.md`, and does not guarantee offline installation of the built-in remote skill payloads: `loadSkillRegistry` in `packages/cli/src/skill-registry.ts` reads their packaged metadata, while `resolveSkillSource` and `fetchRemote` in `packages/cli/src/skill-resolver.ts` retrieve their content.

## Current Limitations

- Prompt starters, document templates, and references are invariant managed asset families for their owning capabilities. Any remaining UI, CLI, or manifest footprint that exposes prompt inclusion or template/reference modes is implementation drift from the current contract; those inputs are removed, and manifests that persist the retired fields are stale rather than migration inputs.
- Built-in skills are distributed through a packaged registry plus remote fetches, not through bundled local skill payloads. `loadSkillRegistry` and `validateSkillRegistryManifest` in `packages/cli/src/skill-registry.ts` also support explicit local or pinned alternate-manifest policies, but the built-in entries still resolve through `resolveSkillSource` and `fetchRemote` in `packages/cli/src/skill-resolver.ts`; built-in skill installation is therefore more network-dependent than the base docs scaffold.
- Dogfood freshness is manual by design. `packages/docs/README.md` requires contributors to copy updated template-owned files back into repo-root `docs/`, but there is no automated freshness check that proves template-owned docs asset copies, including reader-facing guide/playbook defaults, still mirror `packages/docs/template/docs/assets/**` after template edits.
- `packages/content/` remains a reserved future capability rather than an active subsystem. It is described in `README.md` and `packages/content/package.json`, but the current template resolver in `packages/cli/src/utils.ts` and static asset catalog in `packages/cli/src/catalog.ts` do not consume it.

## Requirement History

### 2026-08-08 — Not assigned

- Affected requirement or section: `Cross-cutting capability annotations`
- Previous contract: Later capability decisions were recorded as nested Change Notes that pointed to standalone editorial PRDs.
- Replacement contract: Current requirements remain inline in this owning PRD and related product authorities are linked by product subject.
- Rationale: The active PRD set must describe current product authority rather than the editorial operation that produced it.
- Source: [PRD Authority Maintenance](../../.make-docs/references/system/prd-change-management.md)

## Source Anchors

- `docs/prd/45-deferred-obligation-governance.md`
- `docs/prd/46-naive-end-user-acceptance-testing.md`
- `docs/designs/2026-07-27-deferred-obligations-and-anti-orphan-governance.md`
- `docs/designs/2026-07-27-true-naive-end-user-acceptance-testing.md`

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

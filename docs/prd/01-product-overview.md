# 01 Product Overview

## Purpose

Make Docs preserves technical rigor and also requires coherent human outcomes. A result is not complete only because its contracts and operations are correct. People must be able to understand and use the result for a real goal.

`make-docs` is a TypeScript/Node installer, lifecycle CLI, and MCP server that turns a target repository into an AI-friendly documentation workspace with opinionated structure, stable system-resource identities, router instructions, and optional agent skills. Contracts, prompts, references, and templates are peer system-resource types identified as `make-docs://system/<type>/<posix-relative-path>` and served by the installed CLI without requiring a project-local resource snapshot.

The product is not only a file copier. A shared TypeScript operation registry owns deterministic resource resolution, list/read behavior, lifecycle operations, and typed receipts for CLI and MCP projections. `resolveInstallProfile` in `packages/cli/src/profile.ts` converts `InstallSelections` into the dependency-aware `InstallProfile` defined in `packages/cli/src/types.ts`; planning and apply behavior preserve manifest-backed ownership and provenance; `.make-docs/system/{contracts,prompts,references,templates}/` always keeps configured-harness routers; and optional resource bodies are selected explicitly rather than required for core operation.

The product also treats maintainer and dogfood workflows as first-class capabilities. The repo-root `docs/` tree is an active dogfood instance of the shipped template rather than an unrelated internal wiki, as described in `README.md` and `packages/docs/README.md`, and the full subsystem map now lives across `docs/prd/05-installation-profile-and-manifest-lifecycle.md`, `docs/prd/06-template-contracts-and-generated-assets.md`, `docs/prd/07-cli-command-surface-and-lifecycle.md`, `docs/prd/08-skills-catalog-and-distribution.md`, `docs/prd/09-dogfood-and-maintainer-operations.md`, and `docs/prd/10-packaging-validation-and-release-reference.md`.

## Users

- Project maintainers and technical leads install `make-docs` into an existing repo to standardize `docs/`, root harness instructions, and the runtime state under `.make-docs/`, either interactively or through non-interactive flags such as `--yes`, `--no-work`, and `reconfigure` in `README.md` and the `ParsedArgs`, `parseArgs`, and `validateParsedArgs` command boundary in `packages/cli/src/cli.ts`.
- AI agent operators use the routed instruction surface that `getDesiredAssets` in `packages/cli/src/catalog.ts` installs for the enabled harnesses and capabilities. `Harness`, `InstructionKind`, and `HARNESS_TO_INSTRUCTION` in `packages/cli/src/types.ts` plus the static managed-block router files in `packages/docs/template/**` make the installed tree legible to the selected agent environments.
- Documentation authors use the peer contract, prompt, reference, and template resource set authored upstream under `packages/docs/template/`, including the fixed PRD core described in `README.md` and the output contract enforced by `packages/docs/template/.make-docs/system/contracts/output-contract.md`.
- Internal maintainers and release engineers use the same system to validate the product against itself. `packages/docs/README.md` defines manual dogfood re-seeding, `packages/cli/src/README.md` maps code changes to the right validation commands, and `scripts/smoke-pack.mjs` exercises the packaged CLI end to end before release.

## Key Capabilities

- **Human Experience Standard and Intent**: Make Docs provides one product-wide standard for human quality. Governed work classifies its human impact, states the intended human outcome, and carries observable experience promises into evidence and acceptance. See [PRD 49](49-human-experience-standard-and-intent.md).
- **Proportionate testing and human-centered validation**: Make Docs selects only the testing that can change a current decision. It separates Automated Implementation Testing, Performance Testing, Guided Progress Review, and Unassisted Goal Testing; applies explicit effort, stop, evidence, and gate rules; and makes every request to a person short, goal-led, and non-redundant. See [PRD 50](50-proportionate-testing-and-human-centered-validation.md).

- Profile-scoped scaffold installation: `defaultSelections` in `packages/cli/src/profile.ts` enables `designs`, `plans`, `prd`, and `work`, while `CAPABILITY_DEPENDENCIES` ensures `prd` depends on `plans` and `work` depends on both `plans` and `prd`. This gives the product a single install model for both full and partial documentation systems.
- Contract-aware resource delivery: `packages/docs/template/` is the upstream authoring source of truth for contracts, prompts, references, templates, routers, and default structure. The installed CLI exposes deterministic `resource list` and `resource read` behavior over stable `make-docs://system/...` identities, native MCP resources expose the same effective URI set and bytes where supported, the configured-harness router skeleton is always local, and optional local resource bodies preserve explicit ownership and provenance without rewriting source content.
- Non-destructive sync and reconfigure: `inferInstallIntent` and `resolveSelections` in `packages/cli/src/cli.ts` distinguish saved-selection sync from explicit reconfiguration; `createInstallPlan` in `packages/cli/src/planner.ts` classifies create, update, generate, remove-managed, and conflict actions; and `applyInstallPlan` in `packages/cli/src/install.ts` writes managed files while staging unresolved replacements under `.make-docs/conflicts/<run-id>/`.
- Harness and skill distribution: `make-docs setup skills` is the project-lifecycle surface defined by [39-cli-command-model-and-operation-registry.md](./39-cli-command-model-and-operation-registry.md), while `packages/cli/skill-registry.json`, `packages/cli/src/skill-catalog.ts`, and `packages/cli/src/skill-resolver.ts` install explicitly selected skills once under `.make-docs/agentics/skills/<skill-name>/` per scope and expose them as native harness skill directories under `.claude/skills/<skill-name>/` and `.agents/skills/<skill-name>/` using symlink-preferred behavior with managed copy-mirror fallback.
- Managed lifecycle operations: `runBackupCommand`, `runUninstallCommand`, and `createAuditReport` in `packages/cli/src/backup.ts`, `packages/cli/src/uninstall.ts`, and `packages/cli/src/audit.ts` give the product a safety-first story for backup and uninstall that is separate from install/sync but still driven by manifest and canonical-content auditing.
- Deferred-obligation governance: [R-OBL-ID](45-deferred-obligation-governance.md#r-obl-id-canonical-register-and-identity) and [R-OBL-AUDIT](45-deferred-obligation-governance.md#r-obl-audit-phase-close-orphan-audit) give every accepted incomplete outcome a durable owner, trigger, target coordinate, exit criteria, lifecycle status, and phase-close orphan audit so later work cannot silently lose it.
- Conditional Unassisted Goal Testing: [R-NUAT-ACTIVATE](46-naive-end-user-acceptance-testing.md#r-nuat-activate-user-observable-slices-and-valid-none) activates a qualified, anti-coached human attempt only when it can reveal a material current uncertainty or explicit authority requires it. The result is advisory by default, preserves existing `NUAT-###` compatibility, and permits `not-needed-now` without a false obligation.
- General lifecycle run capture: bounded `lifecycle` runs and `run_evidence` references may record stages from design through retrospective. Typed Store receipts prove only the requested mutation, and a visible `run-capture-unavailable` outcome never weakens repository authority or implies a background retry.
- Packaging and dogfood validation: `packages/cli/package.json` defines the publishable surface, `scripts/copy-template-to-cli.mjs` prepares the bundled template, and validation preserves the order `packages/docs/template/` upstream -> package projection -> root dogfood -> representative installed project.

## System Boundaries

Correct machine contracts do not define the default human presentation. A human surface and a machine surface can use different forms and information density. Both must preserve the same meaning, truth, safety, and auditability. The normal human path must preserve context, reveal meaning and relationships, show state and useful next actions, and keep internal detail out of the way until it is useful. See [PRD 49](49-human-experience-standard-and-intent.md).

In scope, `make-docs` owns the publishable CLI at `packages/cli/`, the template authoring tree at `packages/docs/template/`, the shipped skill source tree at `packages/skills/`, the packaged registry at `packages/cli/skill-registry.json`, the repo-level packaging and validation scripts under `scripts/`, and the consumer-facing managed footprint consisting of the always-local configured-harness router skeleton from the project root through `.make-docs/system/{contracts,prompts,references,templates}/`; `.make-docs/manifest.json`; `.make-docs/conflicts/`; optional system-resource bodies; on-demand `.make-docs/archive/**`, `docs/artifacts/**`, and persona asset directories; shared selected-skill payloads under `.make-docs/agentics/skills/**`; and generated harness skill stubs under project or home directories.

The product deliberately separates authoring authority, packaged provider content, optional project resource bodies, project documentation, and runtime state. Template-owned contracts, prompts, references, and templates are authored under `packages/docs/template/.make-docs/system/{contracts,prompts,references,templates}/**`; package preparation projects those bytes into the CLI provider; selected clean managed bodies or explicit project-owned overrides may live under `.make-docs/system/{contracts,prompts,references,templates}/`; the router skeleton remains local without those bodies; consumer runtime and provenance state stays under root `.make-docs/`; and user-authored designs, plans, PRDs, guides, evidence, and work items are not template source even when this repository dogfoods the system.

Out of scope, Make Docs v2 owns neither Playbooks nor Protocols as document kinds, workflow engines, run models, package/compiler surfaces, default assets, interoperability promises, or Store APIs. Historical Playbook and Protocol designs, plans, work, evidence, and opaque legacy Store rows remain provenance, while a future standalone-product integration requires new owner-approved design and PRD authority. The product also does not currently publish `packages/docs` or `packages/skills` as standalone packages. Rendered Markdown built from JSON content fragments is a current non-goal and has no reserved package.

## Current Limitations

- Human Experience adoption is prospective. Existing authority remains valid until substantial work changes its human path. Structural checks can prove that required intent exists and uses the correct form. They cannot prove beauty, intuition, usefulness, or joy.
- Testing governance is documentation-first in its first release. It can standardize selection, explanation, evidence, and gates before a future typed helper exists. It cannot remove the need for judgment about current decisions, maturity, qualified human execution, or material findings.

- The installed provider inventory is complete for the selected product capabilities even when no local resource bodies are projected. Local `none`, per-resource-type, or `all` resource-body selection is separate from provider availability and never removes the router skeleton; legacy prompt-inclusion or template/reference-mode fields are stale migration inputs rather than current selectors.
- Built-in skills are distributed through a packaged registry plus remote fetches, not through bundled local skill payloads. `loadSkillRegistry` and `validateSkillRegistryManifest` in `packages/cli/src/skill-registry.ts` also support explicit local or pinned alternate-manifest policies, but the built-in entries still resolve through `resolveSkillSource` and `fetchRemote` in `packages/cli/src/skill-resolver.ts`; built-in skill installation is therefore more network-dependent than the base docs scaffold.
- Dogfood freshness is manual by design. `packages/docs/README.md` requires contributors to copy updated template-owned files back into repo-root `docs/`, but there is no automated freshness check that proves template-owned root copies still mirror `packages/docs/template/` after upstream edits.
- The unused `packages/content/` placeholder is approved for retirement. Any future content-fragment capability requires a new accepted design and owning PRD authority before implementation.

## Requirement History

### 2026-08-08 — Not assigned

- Affected requirement or section: `Cross-cutting capability annotations`
- Previous contract: Later capability decisions were recorded as nested Change Notes that pointed to standalone editorial PRDs.
- Replacement contract: Current requirements remain inline in this owning PRD and related product authorities are linked by product subject.
- Rationale: The active PRD set must describe current product authority rather than the editorial operation that produced it.
- Source: [PRD Authority Maintenance](../../.make-docs/references/system/prd-change-management.md)

### 2026-08-14 — W19 R1

- Date: 2026-08-14
- Coordinate: W19 R1
- Affected requirement or section: `Purpose`, `Key Capabilities`, `System Boundaries`, and `Current Limitations`
- Previous contract: The product overview treated Playbooks and Playbook assets as current capability surfaces, treated local snapshots as the ordinary resource path, and did not state a stable peer-resource or general lifecycle-run contract.
- Replacement contract: Make Docs owns no Playbook or Protocol product capability; contracts, prompts, references, and templates are peer resources with stable URI identity and CLI/native-MCP read parity through one resolver; local projection is optional and provenance-aware; upstream/package/dogfood boundaries remain ordered; bounded lifecycle runs return typed receipts; and Naive UAT uses persona-scoped system workflow resources, a thin optional Skill, and persona testing evidence.
- Rationale: Current product authority must match the accepted v2 boundary and missing-migration recovery direction before downstream work is derived.
- Source: [Accepted recovery design](../designs/2026-08-12-make-docs-v2-product-boundary-and-missing-migration-recovery.md) and [W19 R1 recovery plan](../plans/2026-08-13-w19-r1-make-docs-v2-product-boundary-and-missing-migration-recovery/00-overview.md)

### 2026-08-28 — W20 R0

- Affected requirement or section: `Key Capabilities`, `Human Experience Product and Quality Boundary`, and `Current Limitations`.
- Previous contract: Make Docs required correct lifecycle and product artifacts but did not define one product-wide standard for human understanding and experience.
- Replacement contract: Make Docs now owns a canonical Human Experience Standard, conditional impact and intent, semantic alignment between human and machine surfaces, proportionate evidence, and prospective adoption through [PRD 49](49-human-experience-standard-and-intent.md).
- Rationale: Technically correct artifacts can still expose internal models, lose continuity, hide relationships, and impose needless effort on people.
- Source: [W20 R0 Human Experience Standard and Intent plan](../plans/2026-08-28-w20-r0-human-experience-standard-and-intent/00-overview.md)

### 2026-08-28 — W21 R0

- Affected requirement or section: `Key Capabilities` and `Current Limitations`.
- Previous contract: The overview treated naive UAT as the main human testing capability and did not name one product-wide proportional testing model.
- Replacement contract: The product exposes exactly four core testing types, current-decision selection, explicit gate effects, a humane testing experience, and conditional Unassisted Goal Testing.
- Rationale: Make Docs must protect correctness without producing excess, early, duplicate, or needlessly difficult testing.
- Source: [W21 R0 Proportionate Testing and Human-Centered Validation plan](../plans/2026-08-28-w21-r0-proportionate-testing-and-human-centered-validation/00-overview.md)

## Source Anchors

- [Proportionate Testing and Human-Centered Validation design](../designs/2026-08-28-proportionate-testing-and-human-centered-validation.md)
- [W21 R0 Proportionate Testing and Human-Centered Validation plan](../plans/2026-08-28-w21-r0-proportionate-testing-and-human-centered-validation/00-overview.md)
- [Proportionate Testing and Human-Centered Validation](50-proportionate-testing-and-human-centered-validation.md)

- [Human Experience Standard and Intent design](../designs/2026-08-28-human-experience-standard-and-intent.md)
- [W20 R0 Human Experience Standard and Intent plan](../plans/2026-08-28-w20-r0-human-experience-standard-and-intent/00-overview.md)
- [Human Experience Standard and Intent](49-human-experience-standard-and-intent.md)

- [Accepted recovery design](../designs/2026-08-12-make-docs-v2-product-boundary-and-missing-migration-recovery.md)
- [W19 R1 recovery plan](../plans/2026-08-13-w19-r1-make-docs-v2-product-boundary-and-missing-migration-recovery/00-overview.md)
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

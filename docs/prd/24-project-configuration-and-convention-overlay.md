# 24 Project Configuration and Convention Overlay

## Purpose

Accepted result: the owner accepted the implemented W19 R3 Store-state boundary on 2026-09-09. The [closed phase and evidence](../work/2026-09-09-w19-r3-store-owned-installation-and-migration-state/01-store-state-cutover.md) record package proof, reviewed live transfer, preservation checks, final fault checks, and installed CLI status. This acceptance does not close unrelated W19 R1 work.

This document defines the current product contract for project-owned configuration and convention overlays over canonical Make Docs semantics. Normative requirements are stated in the sections below; Requirement History is provenance only.
## Scope

This authority owns project-owned configuration and convention overlays over canonical Make Docs semantics. Related PRDs own adjacent capabilities and are linked where a cross-boundary contract is required.
## Component and Capability Map

The requirements below define the owned components, behaviors, boundaries, and evidence expectations for this capability.
## Requirements

### Optional Project-Owned Config

`.make-docs/config.yaml` is project-owned declarative configuration. Presentation fields remain optional and use shipped defaults when absent. Setup preserves or adds a stable project identifier for Store binding. This identity is project knowledge, not evidence of installed ownership.

Install, reconfigure, provider refresh, package sync, cache recovery, audit, backup, and uninstall planning must preserve existing project-owned config unless a later accepted plan defines an explicit user-approved replacement flow.

### Declarative Identity and Settings

- R-CONFIG-STATE-1 (MUST): local config may hold stable project identity and desired settings that are meaningful to share, including selected capabilities, harnesses, Skills, and resource projection intent. It must not hold applied versions, effective installation facts, ownership hashes, receipts, checkpoints, checkout ids, locks, writer records, or recovery data.
- R-CONFIG-STATE-2 (MUST): setup previews and preserves existing config fields and comments when adding identity or supported desired settings. Unsupported, conflicting, or malformed config stops automatic transfer. The CLI must not replace a user's config merely to remove a local manifest.
- R-CONFIG-STATE-3 (MUST): a clone may share project identity and desired settings. Only the Store's verified checkout binding proves local installation ownership. Changes to desired settings require the normal reviewed setup path before applied state changes.

### Presentation Overlay

Presentation configuration may affect only the approved overlay fields below. Persona entries carry the stable audience mapping owned by Persona authority; all other entries in this section are presentation-only:

- Display labels for lifecycle concepts and document kinds in generated prose.
- Display labels for coordinate parts in generated prose and CLI output.
- Prompt or CLI wording that describes configured audiences, lifecycle stages, or handoff labels.
- Persona entries that follow the accepted persona schema.
- Future generator defaults for prose wording, provided generated files still satisfy their owning contracts.
- Evidence-backed labels for an optional harness integration only when that integration's owning PRD defines the canonical evidence and support status.

### Canonical Structure

Configuration must not rename or redirect canonical structure:

- Repository paths such as `docs/designs/`, on-demand `.make-docs/archive/`, `docs/assets/project/`, `docs/assets/<persona-slug>/`, `.make-docs/`, or optional resource bodies under the always-local `.make-docs/system/{contracts,prompts,references,templates}/` router skeleton.
- Frontmatter fields such as `title`, `kind`, `status`, `coordinate`, `persona`, `source`, `lifecycle`, or `follow_on`.
- `kind` values, lifecycle departure slugs, source type values, route identifiers, prompt paths, skill names, harness names, manifest keys, operation ids, resource types, or `make-docs://system/<type>/<posix-relative-path>` identities.
- Bounded lifecycle run stages, statuses, receipt fields, evidence types, or failure codes.
- Persona schema keys or primitive values.
- W/R/P lineage as the machine-readable coordinate contract.

### Persona Configuration

Configured Persona entries follow [PRD 47](47-persona-model.md#persona-schema) and retain `slug`, `label`, `description`, and `primitive`. `slug` is the stable value; `label` and `description` are display fields; `primitive` is either `user` or `maintainer`. Either audience role can be filled by a person or an agent.

Resolve shipped `user -> user` and `maintainer -> maintainer` entries first, then merge configured entries by slug. An absent or empty/comment-only config, absent `personas`, or empty list retains both defaults. An explicit null or wrong-type config value or Persona value is invalid and produces a diagnostic. Custom entries extend the set. Built-in entries can override display fields while retaining their fixed slug and primitive; omitted display fields inherit defaults. Custom entries require all four fields.

Reject duplicate or unsafe slugs, reserved `project`, invalid primitives, malformed entries, and built-in removal or reclassification. Do not rewrite config on error. Keep project comments and unrelated fields. The former shipped `developer` and `agent` values are migration inputs, not new implicit defaults. Ambiguous custom meanings require a reviewed choice. Ordinary file authoring without the CLI can continue, but it must not claim that invalid custom config was resolved.

Where its owning contract requires `persona` frontmatter, store the effective slug. Directory placement remains secondary discovery structure.

### Effective Persona Discovery

The shared config resolver in `packages/cli/src/config.ts` supplies the effective entries and the origin of their display fields to all consumers. `make-docs project persona list` reads this result without creating or opening the Store, minting project identity, changing config, or creating directories. It works before `docs/assets/` exists and reports malformed config clearly.

The always-present `docs/` router states the two defaults, `docs/assets/project/`, and `.make-docs/config.yaml`, with a canonical resource pointer. The docs router also declares the exact selected asset-router filenames with an `Asset router files:` line. This bounded declaration is routing guidance, not a second installation record. An agent without the CLI can use the declaration, shared rules, and valid local config for ordinary file authoring and the required root routers. It must not infer harnesses from its own actor type or read raw Store tables. Missing or invalid router declarations require an explicit project choice before router creation; ordinary content can continue. Missing tooling does not authorize substitute operational state in the project. Command syntax and CLI/MCP parity belong to PRDs [39](39-cli-command-model-and-operation-registry.md#persona-and-layout-commands-r-layout) and [25](25-typescript-runtime-cli-mcp-operation-boundaries.md#asset-and-config-boundaries).

### Coordinate Labels

Coordinate configuration is presentation-only. A project may prefer words such as batch, revision, phase, milestone, or stage in generated prose, but tooling still stores and validates canonical coordinate metadata.

A configured prefix-style label may influence generated explanations of filenames or coordinates. It must not cause generators to create structurally different filenames, directory names, or frontmatter.

### Rendering Surfaces

CLI, MCP, plugin, and skill surfaces consume presentation fields as rendering input. Declarative identity and desired settings use their typed setup contracts. Config does not rename routes or supply operational authority. Commands, validators, resource resolvers, lifecycle handlers, and package-template checks resolve canonical paths and identifiers before applying configured labels to user-visible text. [25-typescript-runtime-cli-mcp-operation-boundaries.md](25-typescript-runtime-cli-mcp-operation-boundaries.md) applies this rule to CLI/MCP parity: config cannot change operation inputs, stable system-resource URIs, resolver precedence, or returned resource bytes. [08-skills-catalog-and-distribution.md](08-skills-catalog-and-distribution.md), [28-shared-agentics-installation-and-harness-exposure.md](28-shared-agentics-installation-and-harness-exposure.md), and [30-plugin-substrate-and-workflow-bundles.md](30-plugin-substrate-and-workflow-bundles.md) apply the same boundary to optional agentics: labels appear only after canonical ids, payload paths, harnesses, and source provenance resolve. [14-lifecycle-workflow-and-coverage-passes.md](14-lifecycle-workflow-and-coverage-passes.md) applies the rule to lifecycle review: labels may affect presentation only after canonical target, stage, status, verdict, handoff owner, and receipt data resolve.

### Harness Capability Records

The Playbook-oriented `harnessCapabilities` section and its capability ids are not current configuration authority. Existing values are compatibility inputs that migration preserves or removes only through the reviewed config-preservation path; they never activate behavior.

This PRD does not mint a replacement harness-capability schema. An optional agentics capability may add presentation for evidence-backed support only through its owning PRD and validated loader, after canonical operation, lifecycle stage, harness, provenance, and support status resolve. Unknown capabilities are never guessed, and config never creates a workflow model, resource type, operation, lifecycle transition, package format, or support claim.

### Validation

Validation must reject structural rename attempts, including attempts to rename `persona`, redefine `kind` values, replace route identifiers, redirect canonical paths, or change primitive names.

Validation must cover absent config, absent and empty Persona lists, inherited built-ins, valid custom extensions, built-in label/description overrides, attempted built-in removal or reclassification, reserved and unsafe slugs, invalid primitive values, duplicate persona slugs, invalid structural rename attempts, legacy Playbook-oriented harness capability inputs as non-activating compatibility data, generated prose that uses configured labels, CLI output that applies labels without changing routing, package-template parity, dogfood parity, local config preservation, and unchanged behavior for canonical metadata readers.

### Source-First Templates

If a default config template is introduced, it starts in `packages/docs/template/`, is copied through the accepted package-preparation path, and is dogfooded into repo-root `docs/` or `.make-docs/` only through planned template work.
## Non-Requirements

- No structural path, filename, metadata-key, route-id, prompt-path, skill-name, contract-name, harness-name, manifest-key, or coordinate-model rename.
- No configuration-driven change to setup or reconfiguration command ownership; [39-cli-command-model-and-operation-registry.md](./39-cli-command-model-and-operation-registry.md) owns the public command surface.
- No requirement to backfill all existing docs with config-rendered prose.
- No permission for plugins, skills, or MCP surfaces to use configured labels as schema authority.
- No current `harnessCapabilities` schema and no permission for compatibility records to rename operation ids, resource URIs, route ids, lifecycle states, harness ids, or manifest keys.
- No permission for config to define Playbook- or Protocol-specific metadata, operations, packages, or lifecycle authority.
## Acceptance Criteria

- `.make-docs/config.yaml` has a documented schema and loader boundary, and every current reader and writer uses that boundary.
- Config readers preserve canonical routing and metadata behavior when config is absent, valid, or invalid.
- Structural rename attempts produce diagnostics rather than alternate schemas.
- Persona discovery works with no config, no assets directory, and no Store. Validation covers the two defaults, custom extensions, safe overrides, invalid entries, and unknown frontmatter slugs. A no-CLI reader can find the same defaults and config boundary in the always-present docs router.
- Legacy harness capability records do not activate behavior or become an alternate routing schema; any future evidence-backed presentation requires separate owning authority.
- Resource and lifecycle surfaces may consume reviewed presentation or harness hints without treating config as URI, resolver, operation, state-machine, receipt, or support-claim authority.
- Package and dogfood validation prove any default config template follows source-first copy rules and local config preservation.
## Contracts and Data

The named paths, schemas, state records, metadata fields, and evidence shapes in Requirements are normative contracts for this capability.
## Integrations

This capability integrates with the adjacent current authorities linked from Requirements and Source Anchors; those authorities remain owners of their own boundaries.
## Rebuild Notes

A rebuild must preserve the requirement identifiers, stable semantic anchors, ownership boundaries, and failure-safe behavior stated here. Implementation evidence does not silently weaken this authority.
## Requirement History

### 2026-08-08 — W16 R2

- Affected requirement or section: `Document identity and current authority`
- Previous contract: The capability was represented as a standalone editorial change record whose title and structure described how the PRD set was modified.
- Replacement contract: This document now states the current project-owned configuration and convention overlays over canonical Make Docs semantics requirements inline as product authority.
- Rationale: Active PRDs describe the current product shape; editorial operations belong in plans, work, and history.
- Source: [Configuration overlay design](../designs/2026-06-20-configuration-and-convention-overlay.md)

### 2026-08-14 — W19 R1

- Date: 2026-08-14
- Coordinate: W19 R1
- Affected requirement or section: `Presentation Overlay`, `Canonical Structure`, `Persona Configuration`, `Rendering Surfaces`, `Harness Capability Records`, `Validation`, `Non-Requirements`, and `Acceptance Criteria`
- Previous contract: Configuration carried Playbook selection, execution, concurrency, packaging, and handoff hints and recognized Playbook plus old archive/artifact/library paths, metadata, and ids as canonical structures.
- Replacement contract: Config remains a presentation overlay over canonical resource URIs, operation ids, lifecycle stages/statuses, receipts, and accepted on-demand archive/artifact/persona-asset paths; legacy Playbook-oriented harness capability values do not activate behavior and no replacement schema is minted here; and Playbooks and Protocols define no metadata, configuration, operation, or package authority.
- Rationale: Project-owned configuration must not recreate the retired workflow product model or fork the accepted resource and lifecycle contracts.
- Source: [Accepted recovery design](../designs/2026-08-12-make-docs-v2-product-boundary-and-missing-migration-recovery.md) and [W19 R1 recovery plan](../plans/2026-08-13-w19-r1-make-docs-v2-product-boundary-and-missing-migration-recovery/00-overview.md)

### 2026-09-09 — W19 R3

- Affected requirement or section: Optional Project-Owned Config; Declarative Identity and Settings; Rendering Surfaces
- Previous contract: Config was optional and mainly a presentation/Persona overlay. Stable project identity lived in the operational manifest.
- Replacement contract: Config carries portable declarative identity and desired settings. Applied installation facts and checkout bindings remain Store-only. At package acceptance on 2026-09-09, implementation had not started. The owner later accepted the delivered result recorded in the W19 R3 phase closeout.
- Rationale: Make Docs tool state needs one Store authority. Project knowledge remains local.
- Source: [Store-owned installation and migration state design](../designs/2026-09-09-store-owned-installation-and-migration-state.md) and [W19 R3 plan](../plans/2026-09-09-w19-r3-store-owned-installation-and-migration-state/00-overview.md).

### 2026-09-09 — W19 R4

- Date: 2026-09-09
- Coordinate: W19 R4
- Affected requirement or section: Persona Configuration; Effective Persona Discovery; Validation.
- Previous contract: Configured entries used agent, maintainer, or user primitives without a guaranteed merge of two built-ins or pre-assets discovery.
- Replacement contract: Defaults are fixed user and maintainer mappings. Custom entries extend them; safe display overrides inherit omitted fields. Store-free discovery and the docs router expose the same effective rules.
- Rationale: Make defaults discoverable with missing config, assets, CLI, or Store while preserving declarative ownership.
- Source: [Project Assets and Persona Discovery](../designs/2026-09-09-project-assets-and-persona-discovery.md), [W19 R4 plan](../plans/2026-09-09-w19-r4-project-assets-and-persona-discovery/00-overview.md). Delivery is tracked by the single-phase R4 backlog; runtime implementation has not started.

## Source Anchors

- [Accepted recovery design](../designs/2026-08-12-make-docs-v2-product-boundary-and-missing-migration-recovery.md)
- [W19 R1 recovery plan](../plans/2026-08-13-w19-r1-make-docs-v2-product-boundary-and-missing-migration-recovery/00-overview.md)
- [../designs/2026-06-20-configuration-and-convention-overlay.md](../designs/2026-06-20-configuration-and-convention-overlay.md)
- [../plans/2026-06-23-w16-r2-configuration-convention-overlay/00-overview.md](../plans/2026-06-23-w16-r2-configuration-convention-overlay/00-overview.md)
- [../work/2026-06-23-w16-r2-configuration-convention-overlay/00-index.md](../work/2026-06-23-w16-r2-configuration-convention-overlay/00-index.md)
- [../designs/2026-06-20-no-scripts-migration-and-skill-refactor.md](../designs/2026-06-20-no-scripts-migration-and-skill-refactor.md)
- [../plans/2026-06-23-w16-r3-no-scripts-migration-skill-refactor/00-overview.md](../plans/2026-06-23-w16-r3-no-scripts-migration-skill-refactor/00-overview.md)
- [../designs/2026-06-20-skill-purpose-registry-and-alternate-skills-manifest.md](../designs/2026-06-20-skill-purpose-registry-and-alternate-skills-manifest.md)
- [../plans/2026-06-23-w17-r1-skill-purpose-registry-alternate-skills-manifest/00-overview.md](../plans/2026-06-23-w17-r1-skill-purpose-registry-alternate-skills-manifest/00-overview.md)
- [25 TypeScript Runtime CLI MCP Operation Boundaries](25-typescript-runtime-cli-mcp-operation-boundaries.md)
- [08 Skills Catalog and Distribution](08-skills-catalog-and-distribution.md)
- [28 Shared Agentics Installation Harness Redirection](28-shared-agentics-installation-and-harness-exposure.md)
- [30 Harness Plugin Substrate Workflow Bundles](30-plugin-substrate-and-workflow-bundles.md)
- [14 Lifecycle Workflow and Coverage Passes](14-lifecycle-workflow-and-coverage-passes.md)
- [21 Tool Directory System Custom Resource Tiers](21-project-tool-directory-and-resource-tiers.md)
- [22 Project Documentation Asset Model](22-project-documentation-asset-model.md)
- [47 Persona Model](47-persona-model.md)
- [23 Generated Metadata Lifecycle Handoffs](23-generated-document-metadata-and-lifecycle-handoffs.md)
- [../designs/2026-06-20-shared-agentics-installation-and-harness-redirection.md](../designs/2026-06-20-shared-agentics-installation-and-harness-redirection.md)
- [../plans/2026-06-23-w17-r2-shared-agentics-installation-harness-redirection/00-overview.md](../plans/2026-06-23-w17-r2-shared-agentics-installation-harness-redirection/00-overview.md)
- [../designs/2026-06-20-harness-plugin-substrate-and-workflow-bundles.md](../designs/2026-06-20-harness-plugin-substrate-and-workflow-bundles.md)
- [../plans/2026-06-23-w18-r2-harness-plugin-substrate-workflow-bundles/00-overview.md](../plans/2026-06-23-w18-r2-harness-plugin-substrate-workflow-bundles/00-overview.md)
- [../designs/2026-06-20-coverage-pass-extensions-and-adversarial-review.md](../designs/2026-06-20-coverage-pass-extensions-and-adversarial-review.md)
- [../plans/2026-06-23-w18-r3-coverage-pass-extensions-adversarial-review/00-overview.md](../plans/2026-06-23-w18-r3-coverage-pass-extensions-adversarial-review/00-overview.md)
- `packages/cli/src/cli.ts`
- `packages/cli/src/profile.ts`
- `packages/cli/src/types.ts`
- `packages/cli/src/manifest.ts`
- `packages/cli/src/install.ts`
- `packages/cli/src/catalog.ts`
- `packages/cli/src/rules.ts`
- `packages/cli/src/wizard.ts`
- `packages/cli/src/skills-ui.ts`

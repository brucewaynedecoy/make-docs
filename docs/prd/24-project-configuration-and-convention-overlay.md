# 24 Project Configuration and Convention Overlay

## Purpose

This document defines the current product contract for project-owned configuration and convention overlays over canonical Make Docs semantics. Normative requirements are stated in the sections below; Requirement History is provenance only.
## Scope

This authority owns project-owned configuration and convention overlays over canonical Make Docs semantics. Related PRDs own adjacent capabilities and are linked where a cross-boundary contract is required.
## Component and Capability Map

The requirements below define the owned components, behaviors, boundaries, and evidence expectations for this capability.
## Requirements

### Optional Project-Owned Config

`.make-docs/config.yaml` is optional project-owned configuration. If absent, make-docs uses shipped defaults.

Install, reconfigure, provider refresh, package sync, cache recovery, audit, backup, and uninstall planning must preserve existing project-owned config unless a later accepted plan defines an explicit user-approved replacement flow.

### Presentation Overlay

Configuration may affect only the approved overlay fields below. Persona entries carry the stable audience mapping owned by Persona authority; all other entries in this section are presentation-only:

- Display labels for lifecycle concepts and document kinds in generated prose.
- Display labels for coordinate parts in generated prose and CLI output.
- Prompt or CLI wording that describes configured audiences, lifecycle stages, or handoff labels.
- Persona entries that follow the accepted persona schema.
- Future generator defaults for prose wording, provided generated files still satisfy their owning contracts.
- Evidence-backed labels for an optional harness integration only when that integration's owning PRD defines the canonical evidence and support status.

### Canonical Structure

Configuration must not rename or redirect canonical structure:

- Repository paths such as `docs/designs/`, on-demand `.make-docs/archive/`, `docs/artifacts/`, `docs/assets/<persona-slug>/`, `.make-docs/`, or optional resource bodies under the always-local `.make-docs/system/{contracts,prompts,references,templates}/` router skeleton.
- Frontmatter fields such as `title`, `kind`, `status`, `coordinate`, `persona`, `source`, `lifecycle`, or `follow_on`.
- `kind` values, lifecycle departure slugs, source type values, route identifiers, prompt paths, skill names, harness names, manifest keys, operation ids, resource types, or `make-docs://system/<type>/<posix-relative-path>` identities.
- Bounded lifecycle run stages, statuses, receipt fields, evidence types, or failure codes.
- Persona schema keys or primitive values.
- W/R/P lineage as the machine-readable coordinate contract.

### Persona Configuration

Configured persona entries follow the current schema in [47-persona-model.md](./47-persona-model.md) and use `slug`, `label`, `description`, and `primitive`.

`slug` is the stable automation value. `label` is display text. `description` explains the audience boundary. `primitive` maps to one of `agent`, `maintainer`, or `user`.

Persona-scoped guide frontmatter stores the persona slug. Directory placement remains secondary discovery structure.

### Coordinate Labels

Coordinate configuration is presentation-only. A project may prefer words such as batch, revision, phase, milestone, or stage in generated prose, but tooling still stores and validates canonical coordinate metadata.

A configured prefix-style label may influence generated explanations of filenames or coordinates. It must not cause generators to create structurally different filenames, directory names, or frontmatter.

### Rendering Surfaces

CLI, MCP, plugin, and skill surfaces consume config as rendering input, not routing authority. Commands, validators, resource resolvers, lifecycle handlers, and package-template checks resolve canonical paths and identifiers before applying configured labels to user-visible text. [25-typescript-runtime-cli-mcp-operation-boundaries.md](25-typescript-runtime-cli-mcp-operation-boundaries.md) applies this rule to CLI/MCP parity: config cannot change operation inputs, stable system-resource URIs, resolver precedence, or returned resource bytes. [08-skills-catalog-and-distribution.md](08-skills-catalog-and-distribution.md), [28-shared-agentics-installation-and-harness-exposure.md](28-shared-agentics-installation-and-harness-exposure.md), and [30-plugin-substrate-and-workflow-bundles.md](30-plugin-substrate-and-workflow-bundles.md) apply the same boundary to optional agentics: labels appear only after canonical ids, payload paths, harnesses, and source provenance resolve. [14-lifecycle-workflow-and-coverage-passes.md](14-lifecycle-workflow-and-coverage-passes.md) applies the rule to lifecycle review: labels may affect presentation only after canonical target, stage, status, verdict, handoff owner, and receipt data resolve.

### Harness Capability Records

The Playbook-oriented `harnessCapabilities` section and its capability ids are not current configuration authority. Existing values are compatibility inputs that migration preserves or removes only through the reviewed config-preservation path; they never activate behavior.

This PRD does not mint a replacement harness-capability schema. An optional agentics capability may add presentation for evidence-backed support only through its owning PRD and validated loader, after canonical operation, lifecycle stage, harness, provenance, and support status resolve. Unknown capabilities are never guessed, and config never creates a workflow model, resource type, operation, lifecycle transition, package format, or support claim.

### Validation

Validation must reject structural rename attempts, including attempts to rename `persona`, redefine `kind` values, replace route identifiers, redirect canonical paths, or change primitive names.

Validation must cover absent config defaults, valid custom personas, invalid primitive values, duplicate persona slugs, invalid structural rename attempts, legacy Playbook-oriented harness capability inputs as non-activating compatibility data, generated prose that uses configured labels, CLI output that applies labels without changing routing, package-template parity, dogfood parity, local config preservation, and unchanged behavior for canonical metadata readers.

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
- Persona config validation covers defaults, custom entries, duplicate slugs, invalid primitives, and unknown frontmatter persona slugs.
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

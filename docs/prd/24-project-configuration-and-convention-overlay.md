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

Configuration may affect only presentation:

- Display labels for lifecycle concepts and document kinds in generated prose.
- Display labels for coordinate parts in generated prose and CLI output.
- Prompt or CLI wording that describes configured audiences, lifecycle stages, or handoff labels.
- Persona entries that follow the accepted persona schema.
- Future generator defaults for prose wording, provided generated files still satisfy their owning contracts.
- Reviewed harness capability facts used by Run Playbook as execution hints after canonical playbook and harness resolution.

### Canonical Structure

Configuration must not rename or redirect canonical structure:

- Repository paths such as `docs/designs/`, `docs/assets/archive/`, `docs/assets/archive/history/`, `docs/assets/artifacts/`, `docs/assets/library/`, `docs/assets/playbooks/`, or `.make-docs/`.
- Frontmatter fields such as `title`, `kind`, `status`, `coordinate`, `persona`, `source`, `lifecycle`, or `follow_on`.
- `kind` values, lifecycle departure slugs, source type values, route identifiers, prompt paths, skill names, contract names, harness names, or manifest keys.
- Persona schema keys or primitive values.
- W/R/P lineage as the machine-readable coordinate contract.

### Persona Configuration

Configured persona entries follow the current schema in [47-persona-model.md](./47-persona-model.md) and use `slug`, `label`, `description`, and `primitive`.

`slug` is the stable automation value. `label` is display text. `description` explains the audience boundary. `primitive` maps to one of `agent`, `maintainer`, or `user`.

Persona-scoped guide and playbook frontmatter stores the persona slug. Directory placement remains secondary discovery structure.

### Coordinate Labels

Coordinate configuration is presentation-only. A project may prefer words such as batch, revision, phase, milestone, or stage in generated prose, but tooling still stores and validates canonical coordinate metadata.

A configured prefix-style label may influence generated explanations of filenames or coordinates. It must not cause generators to create structurally different filenames, directory names, or frontmatter.

### Rendering Surfaces

CLI, MCP, plugin, and skill surfaces consume config as rendering input, not routing authority. Commands, scripts, validators, and package-template checks route through canonical paths and identifiers, then apply configured labels only when producing user-visible text. [25-typescript-runtime-cli-mcp-operation-boundaries.md](25-typescript-runtime-cli-mcp-operation-boundaries.md) reinforces that TypeScript MCP tools, plugins, and skills must route by canonical paths, manifest keys, route ids, prompt paths, skill names, contract names, and harness names before applying labels. [25-typescript-runtime-cli-mcp-operation-boundaries.md](25-typescript-runtime-cli-mcp-operation-boundaries.md) extends the same rule to migrated helper behavior: config validation and deterministic script-replacement logic belong in canonical CLI/shared-core operations, not label-driven script routing. [08-skills-catalog-and-distribution.md](08-skills-catalog-and-distribution.md) applies the rule to purpose-led skills: purpose labels may be presented from config, but purpose ids, manifest ids, skill names, and source-policy classes remain canonical routing values. [28-shared-agentics-installation-and-harness-exposure.md](28-shared-agentics-installation-and-harness-exposure.md) applies the same boundary to native harness exposure and shared payloads: config-derived labels may appear in generated diagnostics only after the canonical resolver identifies payload path, harness, skill name, purpose id, and source provenance. [34-playbook-authoring-contract-and-model.md](34-playbook-authoring-contract-and-model.md) applies the rule to Run Playbook: configured labels may affect selection and handoff messages, but `kind`, `persona`, `stack`, authority order, output routing, and artifact ownership remain canonical. [30-plugin-substrate-and-workflow-bundles.md](30-plugin-substrate-and-workflow-bundles.md) applies the rule to plugins and workflow bundles: configured labels may appear only after canonical plugin id, playbook id, route id, harness, bundle metadata, and manifest ownership records are resolved. [14-lifecycle-workflow-and-coverage-passes.md](14-lifecycle-workflow-and-coverage-passes.md) applies the rule to adversarial review: configured persona labels may affect candidate display only after the canonical `target`, `persona_target`, surface, verdict, and handoff owner are resolved. [36-playbook-packaging-compiler-and-harness-adapters.md](36-playbook-packaging-compiler-and-harness-adapters.md) applies the rule to Playbook packaging: config may inform display and reviewed capability hints, but output kinds, harness adapter ids, surface profiles, package-plan ids, source digests, generated artifact paths, review states, and support states remain canonical package-planner data.

### Harness Capability Records

`harnessCapabilities` is an optional reviewed configuration section for Run Playbook execution strategy. It records local knowledge about active harness support for canonical capability ids such as `goal_managed_execution`, `long_running_runs`, `resume_after_interrupt`, `parallel_playbook_runs`, `subagent_delegation`, and `user_gate_prompts`.

Harness capability records are operational hints, not routing authority. They may influence whether Run Playbook uses a harness goal feature, serial gated execution, subagent delegation, or manual-review stop after the playbook ref, stack, harness, and output surfaces are resolved canonically.

Unknown capabilities must not be guessed. An agent may investigate the active harness and propose a config update, but persistence requires review. Required unknown or unsupported capabilities stop the run; optional unknown capabilities fall back to serial gated execution.

Playbook package planning may consult reviewed harness capability records when choosing safe execution assists for generated outputs, but it must not infer package support from config alone. Generated package support still requires adapter declarations and conformance evidence.

### Validation

Validation must reject structural rename attempts, including attempts to rename `persona`, redefine `kind` values, replace route identifiers, redirect canonical paths, or change primitive names.

Validation must cover absent config defaults, valid custom personas, invalid primitive values, duplicate persona slugs, invalid structural rename attempts, valid harness capability records, invalid capability ids, reviewed versus unreviewed capability persistence, generated prose that uses configured labels, CLI output that applies labels without changing routing, package-template parity, dogfood parity, local config preservation, and unchanged behavior for canonical metadata readers.

### Source-First Templates

If a default config template is introduced, it starts in `packages/docs/template/`, is copied through the accepted package-preparation path, and is dogfooded into repo-root `docs/` or `.make-docs/` only through planned template work.
## Non-Requirements

- No structural path, filename, metadata-key, route-id, prompt-path, skill-name, contract-name, harness-name, manifest-key, or coordinate-model rename.
- No configuration-driven change to setup or reconfiguration command ownership; [39-cli-command-model-and-operation-registry.md](./39-cli-command-model-and-operation-registry.md) owns the public command surface.
- No requirement to backfill all existing docs with config-rendered prose.
- No permission for plugins, skills, or MCP surfaces to use configured labels as schema authority.
- No permission for harness capability records to rename playbook paths, stacks, refs, route ids, harness ids, or manifest keys.
- No permission for config to define package-plan schemas, output kinds, harness adapters, surface profiles, generated artifact paths, or support claims.
## Acceptance Criteria

- `.make-docs/config.yaml` has a documented schema and loader boundary, and every current reader and writer uses that boundary.
- Config readers preserve canonical routing and metadata behavior when config is absent, valid, or invalid.
- Structural rename attempts produce diagnostics rather than alternate schemas.
- Persona config validation covers defaults, custom entries, duplicate slugs, invalid primitives, and unknown frontmatter persona slugs.
- Harness capability records validate canonical capability ids and cannot become alternate routing schema.
- Playbook package planning may consume reviewed harness capability hints without treating config as package-plan, adapter, generated-output, or support-claim authority.
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
## Source Anchors

- [../designs/2026-06-20-configuration-and-convention-overlay.md](../designs/2026-06-20-configuration-and-convention-overlay.md)
- [../designs/2026-06-27-run-playbook-orchestration-and-harness-capabilities.md](../designs/2026-06-27-run-playbook-orchestration-and-harness-capabilities.md)
- [../designs/2026-06-29-playbook-packaging-and-harness-adapter-registry.md](../designs/2026-06-29-playbook-packaging-and-harness-adapter-registry.md)
- [../plans/2026-06-23-w16-r2-configuration-convention-overlay/00-overview.md](../plans/2026-06-23-w16-r2-configuration-convention-overlay/00-overview.md)
- [../plans/2026-06-27-w18-r4-run-playbook-orchestration-and-harness-capabilities/00-overview.md](../plans/2026-06-27-w18-r4-run-playbook-orchestration-and-harness-capabilities/00-overview.md)
- [../plans/2026-06-29-w18-r5-playbook-packaging-and-harness-adapter-registry/00-overview.md](../plans/2026-06-29-w18-r5-playbook-packaging-and-harness-adapter-registry/00-overview.md)
- [../work/2026-06-23-w16-r2-configuration-convention-overlay/00-index.md](../work/2026-06-23-w16-r2-configuration-convention-overlay/00-index.md)
- [../designs/2026-06-20-no-scripts-migration-and-skill-refactor.md](../designs/2026-06-20-no-scripts-migration-and-skill-refactor.md)
- [../plans/2026-06-23-w16-r3-no-scripts-migration-skill-refactor/00-overview.md](../plans/2026-06-23-w16-r3-no-scripts-migration-skill-refactor/00-overview.md)
- [../designs/2026-06-20-skill-purpose-registry-and-alternate-skills-manifest.md](../designs/2026-06-20-skill-purpose-registry-and-alternate-skills-manifest.md)
- [../plans/2026-06-23-w17-r1-skill-purpose-registry-alternate-skills-manifest/00-overview.md](../plans/2026-06-23-w17-r1-skill-purpose-registry-alternate-skills-manifest/00-overview.md)
- [25 TypeScript Runtime CLI MCP Operation Boundaries](25-typescript-runtime-cli-mcp-operation-boundaries.md)
- [08 Skills Catalog and Distribution](08-skills-catalog-and-distribution.md)
- [28 Shared Agentics Installation Harness Redirection](28-shared-agentics-installation-and-harness-exposure.md)
- [34 Playbook Authoring Contract and Model](34-playbook-authoring-contract-and-model.md)
- [30 Harness Plugin Substrate Workflow Bundles](30-plugin-substrate-and-workflow-bundles.md)
- [14 Lifecycle Workflow and Coverage Passes](14-lifecycle-workflow-and-coverage-passes.md)
- [36 Playbook Packaging Compiler and Harness Adapters](36-playbook-packaging-compiler-and-harness-adapters.md)
- [21 Tool Directory System Custom Resource Tiers](21-project-tool-directory-and-resource-tiers.md)
- [22 Project Documentation Asset Model](22-project-documentation-asset-model.md)
- [47 Persona Model](47-persona-model.md)
- [23 Generated Metadata Lifecycle Handoffs](23-generated-document-metadata-and-lifecycle-handoffs.md)
- [../designs/2026-06-20-shared-agentics-installation-and-harness-redirection.md](../designs/2026-06-20-shared-agentics-installation-and-harness-redirection.md)
- [../plans/2026-06-23-w17-r2-shared-agentics-installation-harness-redirection/00-overview.md](../plans/2026-06-23-w17-r2-shared-agentics-installation-harness-redirection/00-overview.md)
- [../designs/2026-06-20-playbook-contract-and-run-playbook.md](../designs/2026-06-20-playbook-contract-and-run-playbook.md)
- [../plans/2026-06-23-w18-r1-playbook-contract-run-playbook/00-overview.md](../plans/2026-06-23-w18-r1-playbook-contract-run-playbook/00-overview.md)
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

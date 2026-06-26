# 24 Revise Configuration Convention Overlay

## Purpose

Define the v2 configuration overlay boundary for make-docs. The configuration file gives a project room to adapt user-visible vocabulary, persona labels, and generated text conventions without turning the canonical information architecture into a project-specific schema.

## Change Type

Revision. This PRD extends the accepted v2 Batch 2 tool-directory, persona, and generated metadata contracts by defining what optional project configuration may influence.

Route: `change-plan`

Coordinate: `W16 R2`

## Change Notes

This PRD narrows older terminology-overlay intent into a presentation-only configuration boundary. It answers the structural side of Q-011: make-docs may render configured labels, but canonical paths, metadata keys, enum values, route identifiers, prompt paths, skill names, contract names, manifest keys, and W/R/P coordinate lineage remain stable until a later accepted design supersedes them.

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

### Canonical Structure

Configuration must not rename or redirect canonical structure:

- Repository paths such as `docs/designs/`, `docs/assets/archive/`, `docs/assets/archive/history/`, `docs/assets/artifacts/`, `docs/assets/library/`, `docs/assets/playbooks/`, or `.make-docs/`.
- Frontmatter fields such as `title`, `kind`, `status`, `coordinate`, `persona`, `source`, `lifecycle`, or `follow_on`.
- `kind` values, lifecycle departure slugs, source type values, route identifiers, prompt paths, skill names, contract names, harness names, or manifest keys.
- Persona schema keys or primitive values.
- W/R/P lineage as the machine-readable coordinate contract.

### Persona Configuration

Configured persona entries use `slug`, `label`, `description`, and `primitive`.

`slug` is the stable automation value. `label` is display text. `description` explains the audience boundary. `primitive` maps to one of `agent`, `maintainer`, or `user`.

Persona-scoped guide and playbook frontmatter stores the persona slug. Directory placement remains secondary discovery structure.

### Coordinate Labels

Coordinate configuration is presentation-only. A project may prefer words such as batch, revision, phase, milestone, or stage in generated prose, but tooling still stores and validates canonical coordinate metadata.

A configured prefix-style label may influence generated explanations of filenames or coordinates. It must not cause generators to create structurally different filenames, directory names, or frontmatter.

### Rendering Surfaces

CLI, MCP, plugin, and skill surfaces consume config as rendering input, not routing authority. Commands, scripts, validators, and package-template checks route through canonical paths and identifiers, then apply configured labels only when producing user-visible text. [25-revise-cli-separation-and-mcp-boundary.md](25-revise-cli-separation-and-mcp-boundary.md) reinforces that TypeScript MCP tools, plugins, and skills must route by canonical paths, manifest keys, route ids, prompt paths, skill names, contract names, and harness names before applying labels. [26-revise-no-scripts-migration-skill-refactor.md](26-revise-no-scripts-migration-skill-refactor.md) extends the same rule to migrated helper behavior: config validation and deterministic script-replacement logic belong in canonical CLI/shared-core operations, not label-driven script routing. [27-revise-skill-purpose-registry-alternate-skills-manifest.md](27-revise-skill-purpose-registry-alternate-skills-manifest.md) applies the rule to purpose-led skills: purpose labels may be presented from config, but purpose ids, manifest ids, skill names, and source-policy classes remain canonical routing values. [28-revise-shared-agentics-installation-harness-redirection.md](28-revise-shared-agentics-installation-harness-redirection.md) applies the same boundary to generated stubs and shared payloads: config-derived labels may appear in generated text only after the canonical resolver identifies payload path, harness, skill name, purpose id, and source provenance. [29-revise-playbook-contract-run-playbook.md](29-revise-playbook-contract-run-playbook.md) applies the rule to Run Playbook: configured labels may affect selection and handoff messages, but `kind`, `persona`, `stack`, authority order, output routing, and artifact ownership remain canonical. [30-revise-harness-plugin-substrate-workflow-bundles.md](30-revise-harness-plugin-substrate-workflow-bundles.md) applies the rule to plugins and workflow bundles: configured labels may appear only after canonical plugin id, playbook id, route id, harness, bundle metadata, and manifest ownership records are resolved. [31-revise-coverage-pass-extensions-adversarial-review.md](31-revise-coverage-pass-extensions-adversarial-review.md) applies the rule to adversarial review: configured persona labels may affect candidate display only after the canonical `target`, `persona_target`, surface, verdict, and handoff owner are resolved.

### Validation

Validation must reject structural rename attempts, including attempts to rename `persona`, redefine `kind` values, replace route identifiers, redirect canonical paths, or change primitive names.

Validation must cover absent config defaults, valid custom personas, invalid primitive values, duplicate persona slugs, invalid structural rename attempts, generated prose that uses configured labels, CLI output that applies labels without changing routing, package-template parity, dogfood parity, local config preservation, and unchanged behavior for canonical metadata readers.

### Source-First Templates

If a default config template is introduced, it starts in `packages/docs/template/`, is copied through the accepted package-preparation path, and is dogfooded into repo-root `docs/` or `.make-docs/` only through planned template work.

## Non-Requirements

- No structural path, filename, metadata-key, route-id, prompt-path, skill-name, contract-name, harness-name, manifest-key, or coordinate-model rename.
- No change to current `make-docs reconfigure` command ownership before the CLI/MCP boundary design decides the public command surface.
- No requirement to backfill all existing docs with config-rendered prose.
- No permission for plugins, skills, or MCP surfaces to use configured labels as schema authority.

## Affected Baseline Docs

- [02 Architecture Overview](02-architecture-overview.md)
- [03 Open Questions and Risk Register](03-open-questions-and-risk-register.md)
- [05 Installation Profile and Manifest Lifecycle](05-installation-profile-and-manifest-lifecycle.md)
- [06 Template Contracts and Generated Assets](06-template-contracts-and-generated-assets.md)
- [10 Packaging Validation and Release Reference](10-packaging-validation-and-release-reference.md)
- [14 Add Lifecycle Workflow Foundation](14-add-lifecycle-workflow-foundation.md)
- [21 Revise Tool Directory System Custom Resource Tiers](21-revise-tool-directory-system-custom-resource-tiers.md)
- [22 Revise New Docs Assets Playbooks Persona Model](22-revise-new-docs-assets-playbooks-persona-model.md)
- [23 Revise Generated Metadata Lifecycle Handoffs](23-revise-generated-metadata-lifecycle-handoffs.md)
- [25 Revise CLI Separation and MCP Boundary](25-revise-cli-separation-and-mcp-boundary.md)
- [26 Revise No-Scripts Migration Skill Refactor](26-revise-no-scripts-migration-skill-refactor.md)
- [27 Revise Skill Purpose Registry Alternate Skills Manifest](27-revise-skill-purpose-registry-alternate-skills-manifest.md)
- [28 Revise Shared Agentics Installation Harness Redirection](28-revise-shared-agentics-installation-harness-redirection.md)
- [29 Revise Playbook Contract Run Playbook](29-revise-playbook-contract-run-playbook.md)
- [30 Revise Harness Plugin Substrate Workflow Bundles](30-revise-harness-plugin-substrate-workflow-bundles.md)
- [31 Revise Coverage Pass Extensions Adversarial Review](31-revise-coverage-pass-extensions-adversarial-review.md)
- [../designs/2026-06-20-cli-separation-and-mcp-boundary.md](../designs/2026-06-20-cli-separation-and-mcp-boundary.md)
- [../plans/2026-06-23-w10-r6-cli-separation-and-mcp-boundary/00-overview.md](../plans/2026-06-23-w10-r6-cli-separation-and-mcp-boundary/00-overview.md)

## Acceptance Criteria

- `.make-docs/config.yaml` has a documented schema and loader boundary before implementation.
- Config readers preserve canonical routing and metadata behavior when config is absent, valid, or invalid.
- Structural rename attempts produce diagnostics rather than alternate schemas.
- Persona config validation covers defaults, custom entries, duplicate slugs, invalid primitives, and unknown frontmatter persona slugs.
- Package and dogfood validation prove any default config template follows source-first copy rules and local config preservation.

## Source Anchors

- [../designs/2026-06-20-configuration-and-convention-overlay.md](../designs/2026-06-20-configuration-and-convention-overlay.md)
- [../plans/2026-06-23-w16-r2-configuration-convention-overlay/00-overview.md](../plans/2026-06-23-w16-r2-configuration-convention-overlay/00-overview.md)
- [../work/2026-06-23-w16-r2-configuration-convention-overlay/00-index.md](../work/2026-06-23-w16-r2-configuration-convention-overlay/00-index.md)
- [../designs/2026-06-20-no-scripts-migration-and-skill-refactor.md](../designs/2026-06-20-no-scripts-migration-and-skill-refactor.md)
- [../plans/2026-06-23-w16-r3-no-scripts-migration-skill-refactor/00-overview.md](../plans/2026-06-23-w16-r3-no-scripts-migration-skill-refactor/00-overview.md)
- [../designs/2026-06-20-skill-purpose-registry-and-alternate-skills-manifest.md](../designs/2026-06-20-skill-purpose-registry-and-alternate-skills-manifest.md)
- [../plans/2026-06-23-w17-r1-skill-purpose-registry-alternate-skills-manifest/00-overview.md](../plans/2026-06-23-w17-r1-skill-purpose-registry-alternate-skills-manifest/00-overview.md)
- [26 Revise No-Scripts Migration Skill Refactor](26-revise-no-scripts-migration-skill-refactor.md)
- [27 Revise Skill Purpose Registry Alternate Skills Manifest](27-revise-skill-purpose-registry-alternate-skills-manifest.md)
- [28 Revise Shared Agentics Installation Harness Redirection](28-revise-shared-agentics-installation-harness-redirection.md)
- [29 Revise Playbook Contract Run Playbook](29-revise-playbook-contract-run-playbook.md)
- [30 Revise Harness Plugin Substrate Workflow Bundles](30-revise-harness-plugin-substrate-workflow-bundles.md)
- [31 Revise Coverage Pass Extensions Adversarial Review](31-revise-coverage-pass-extensions-adversarial-review.md)
- [21 Revise Tool Directory System Custom Resource Tiers](21-revise-tool-directory-system-custom-resource-tiers.md)
- [22 Revise New Docs Assets Playbooks Persona Model](22-revise-new-docs-assets-playbooks-persona-model.md)
- [23 Revise Generated Metadata Lifecycle Handoffs](23-revise-generated-metadata-lifecycle-handoffs.md)
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

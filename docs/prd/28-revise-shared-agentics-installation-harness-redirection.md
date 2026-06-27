# 28 Revise Shared Agentics Installation Harness Redirection

## Purpose

Decide how make-docs v2 installs selected agentic artifacts once while exposing them to each supported harness without duplicating authoritative payloads.

This design covers the shared installed-state model for skills first, with enough plugin shape to unblock later Batch 4 plugin and playbook decisions. It chooses the cross-platform redirection mechanism, the relationship between shared payloads and harness-specific entrypoints, the manifest and audit boundary, and the way installed agentic artifacts consume configuration overlays.

## Change Type

Revision. This PRD extends the active skills, manifest, lifecycle, compatibility, package, tool-directory, configuration, CLI/MCP, purpose-manifest, and no-scripts requirements.

Route: `change-plan`

Coordinate: `W17 R2`

## Change Notes

This PRD defines the v2 shared installed-state model for selected skills and reserves the same primitive for future plugins. It does not implement plugin runtime behavior, Run Playbook behavior, symlink mode, or MCP writes.

W17 R2 Phase 2 implements the selected-skill shared payload and generated harness-stub path shape for the current TypeScript CLI. Structured agentic ownership records, migrated duplicated-payload disposition, richer dry-run labeling, and full audit/backup/uninstall classification remain owned by later W17 R2 phases.

W17 R2 Phase 3 implements the transitional classification layer for the current TypeScript CLI: planned actions and audit metadata now distinguish shared payloads, generated harness stubs, and legacy duplicated payloads; dry-run, audit, backup, and uninstall output expose that role distinction; and clean manifest-owned duplicated per-harness payload installs migrate to shared payload plus generated stubs. A future richer manifest schema may replace the interim `skillFiles` representation, but it must preserve these distinctions.

## Requirements

### Shared Agentics Store

Selected agentic payloads are installed once into a shared make-docs-owned store:

- project scope: `.make-docs/agentics/`
- global scope: the user's home-scoped `.make-docs/agentics/`

Within that store, reserve:

- `skills/<skill-name>/` for selected skill payloads
- `plugins/<plugin-id>/` for future selected plugin payloads
- `manifests/` or equivalent metadata records for resolved purpose, source, trust, integrity, and provenance data

### Generated Harness Stubs

Harness directories receive generated entrypoint stubs, not duplicated authoritative payloads.

For current harnesses, project-scoped selected skills expose harness entrypoints under `.claude/skills/<skill-name>/` and `.agents/skills/<skill-name>/`; global selected skills expose equivalent entrypoints under home-scoped harness roots.

The generated stub is a normal text file and is the harness-native discovery boundary. It may include minimal metadata, purpose summary, and the exact canonical shared-payload path.

Symlinks are not the v2 default. A later symlink mode may be added only if the manifest records link type, target, fallback behavior, and audit classification. Windows behavior must not depend on developer mode, elevated privileges, junction behavior, or shell-specific link semantics.

### Manifest Ownership

`selectedSkills` remains the behavior-level selected-skill list.

`skillFiles` remains a managed-output ownership list during transition, but the schema should grow structured agentic ownership records that identify:

- selected artifact kind, name, source manifest, immutable ref, digest, trust/provenance, and scope
- canonical shared payload paths
- generated harness stub paths
- exposure mode, with `generated-stub` as the default
- harness name and path scope
- previous per-harness duplicated payloads that were migrated, preserved, or skipped

Until that schema exists, implementation may represent shared payload files and harness stubs through `skillFiles`, but it must not lose the distinction in audit, backup, uninstall, migration diagnostics, or user-visible dry-run output.

### Migration and Lifecycle Safety

Migration is state-classification first.

A clean manifest-owned per-harness skill install may migrate to shared payload plus generated stubs.

A modified skill file, custom user skill, malformed manifest, or missing-manifest ambiguous state must flow through existing review, backup-and-reinstall, or manual-review disposition rules.

Migration must never infer ownership over a user-authored harness skill because its path matches a make-docs skill name.

Audit, backup, uninstall, and migration must classify shared payloads, generated stubs, old duplicated per-harness payloads, modified local skill files, home-scoped skill files, and custom user skills separately.

The single reviewed audit snapshot rule remains mandatory before destructive migration or uninstall.

### Config and Behavior Boundary

Config overlays are read through a make-docs config resolver contract, not plugin-specific or skill-specific routing maps.

Installed skills and plugins may render configured labels only after resolving canonical ids, paths, kinds, purpose ids, skill names, plugin ids, and harness names.

If the config resolver is not yet implemented, generated stubs and shared payloads must preserve canonical wording rather than inventing local config parsing.

Stubs and shared payloads may instruct agents to call make-docs CLI or MCP operations for deterministic behavior, but selected artifact discovery must remain inspectable without a live CLI process.

### Plugin Inheritance

Plugin installation inherits the shared storage and generated exposure primitive, while [30-revise-harness-plugin-substrate-workflow-bundles.md](30-revise-harness-plugin-substrate-workflow-bundles.md) owns full plugin substrate and workflow bundle metadata.

Selected plugin payloads use `.make-docs/agentics/plugins/<plugin-id>/` per scope and generated harness exposure files unless a later accepted design supersedes PRD 30.

[29-revise-playbook-contract-run-playbook.md](29-revise-playbook-contract-run-playbook.md) owns the playbook content contract and generic Run Playbook model. PRD 30 allows plugin payloads to expose that model, but this PRD continues to own only shared storage and generated harness exposure primitives.

### No-Default-Skills

Bare install and default sync write no selected skill payloads and no skill stubs.

Shared agentics are written only when the user explicitly selects skills or later explicitly selects plugins through an accepted manifest and selection flow.

## Non-Requirements

- No symlink-based default behavior.
- No full plugin substrate, workflow bundle metadata, or per-bundle UX contract in this shared-agentics PRD; [30-revise-harness-plugin-substrate-workflow-bundles.md](30-revise-harness-plugin-substrate-workflow-bundles.md) owns the substrate and bundle boundary.
- No Run Playbook contract in this shared-agentics PRD; [29-revise-playbook-contract-run-playbook.md](29-revise-playbook-contract-run-playbook.md) owns that contract.
- No MCP write surface.
- No bundled-local versus remote-fetch skills delivery decision.
- No automatic selected skill or plugin installation.

## Affected Baseline Docs

- [05 Installation Profile and Manifest Lifecycle](05-installation-profile-and-manifest-lifecycle.md)
- [07 CLI Command Surface and Lifecycle](07-cli-command-surface-and-lifecycle.md)
- [08 Skills Catalog and Distribution](08-skills-catalog-and-distribution.md)
- [10 Packaging Validation and Release Reference](10-packaging-validation-and-release-reference.md)
- [12 Revise CLI Skill Selection Simplification](12-revise-cli-skill-selection-simplification.md)
- [16 Revise Package and Deployment Boundaries](16-revise-package-and-deployment-boundaries.md)
- [18 Revise Compatibility Audit and Migration Disposition](18-revise-compatibility-audit-and-migration-disposition.md)
- [21 Revise Tool Directory System Custom Resource Tiers](21-revise-tool-directory-system-custom-resource-tiers.md)
- [24 Revise Configuration Convention Overlay](24-revise-configuration-convention-overlay.md)
- [25 Revise CLI Separation and MCP Boundary](25-revise-cli-separation-and-mcp-boundary.md)
- [26 Revise No-Scripts Migration Skill Refactor](26-revise-no-scripts-migration-skill-refactor.md)
- [27 Revise Skill Purpose Registry Alternate Skills Manifest](27-revise-skill-purpose-registry-alternate-skills-manifest.md)
- [30 Revise Harness Plugin Substrate Workflow Bundles](30-revise-harness-plugin-substrate-workflow-bundles.md)

## Acceptance Criteria

- Selected project-scope skills install one shared payload plus harness stubs.
- Selected global-scope skills install one home-scoped shared payload plus home-scoped harness stubs.
- Bare installs write no selected agentic payloads or stubs.
- Manifest/dry-run output distinguishes shared payloads from harness exposure files.
- Modified or custom harness skills are preserved or reviewed rather than inferred as make-docs-owned.
- Backup and uninstall use one reviewed audit snapshot.
- Cross-platform validation does not depend on symlink behavior.

## Source Anchors

- [../designs/2026-06-20-shared-agentics-installation-and-harness-redirection.md](../designs/2026-06-20-shared-agentics-installation-and-harness-redirection.md)
- [../plans/2026-06-23-w17-r2-shared-agentics-installation-harness-redirection/00-overview.md](../plans/2026-06-23-w17-r2-shared-agentics-installation-harness-redirection/00-overview.md)
- [../work/2026-06-23-w17-r2-shared-agentics-installation-harness-redirection/00-index.md](../work/2026-06-23-w17-r2-shared-agentics-installation-harness-redirection/00-index.md)
- [08 Skills Catalog and Distribution](08-skills-catalog-and-distribution.md)
- [18 Revise Compatibility Audit and Migration Disposition](18-revise-compatibility-audit-and-migration-disposition.md)
- [21 Revise Tool Directory System Custom Resource Tiers](21-revise-tool-directory-system-custom-resource-tiers.md)
- [27 Revise Skill Purpose Registry Alternate Skills Manifest](27-revise-skill-purpose-registry-alternate-skills-manifest.md)
- [29 Revise Playbook Contract Run Playbook](29-revise-playbook-contract-run-playbook.md)
- [30 Revise Harness Plugin Substrate Workflow Bundles](30-revise-harness-plugin-substrate-workflow-bundles.md)
- [../designs/2026-06-20-playbook-contract-and-run-playbook.md](../designs/2026-06-20-playbook-contract-and-run-playbook.md)
- [../plans/2026-06-23-w18-r1-playbook-contract-run-playbook/00-overview.md](../plans/2026-06-23-w18-r1-playbook-contract-run-playbook/00-overview.md)
- [../designs/2026-06-20-harness-plugin-substrate-and-workflow-bundles.md](../designs/2026-06-20-harness-plugin-substrate-and-workflow-bundles.md)
- [../plans/2026-06-23-w18-r2-harness-plugin-substrate-workflow-bundles/00-overview.md](../plans/2026-06-23-w18-r2-harness-plugin-substrate-workflow-bundles/00-overview.md)
- `packages/cli/src/skill-catalog.ts`
- `packages/cli/src/manifest.ts`
- `packages/cli/src/planner.ts`
- `packages/cli/src/install.ts`
- `packages/cli/src/audit.ts`
- `packages/cli/src/backup.ts`
- `packages/cli/src/uninstall.ts`
- `packages/cli/src/skills-ui.ts`
- `packages/cli/tests/skill-catalog.test.ts`
- `packages/cli/tests/install.test.ts`
- `packages/cli/tests/audit.test.ts`
- `packages/cli/tests/backup.test.ts`
- `packages/cli/tests/uninstall.test.ts`
- `scripts/smoke-pack.mjs`

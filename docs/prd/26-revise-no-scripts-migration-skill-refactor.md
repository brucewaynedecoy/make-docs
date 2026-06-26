# 26 Revise No-Scripts Migration Skill Refactor

## Purpose

Decide how make-docs v2 removes standalone deterministic script dependencies from shipped system resources and first-party skills without breaking installed workflows. The migration target is a CLI/shared-core operation boundary that ordinary CLI commands and future MCP tools can expose consistently, while skills become guidance and routing layers instead of carrying make-docs-owned deterministic logic.

## Change Type

Revision. This PRD extends the active CLI, skills, lifecycle, package validation, source-of-truth, materialization, compatibility, tool-directory, configuration, and CLI/MCP boundary requirements.

Route: `change-plan`

Coordinate: `W16 R3`

## Change Notes

This PRD turns the no-scripts design into active requirements. It does not delete scripts, rewrite skills, implement Rust, or implement MCP. It defines the required migration order and safety gates for later implementation.

## Requirements

### CLI Shared-Core Operations

Deterministic make-docs-owned behavior must move behind CLI/shared-core operations before first-party scripts are removed or downgraded.

The current TypeScript CLI is the first implementation target because it owns the shipped installer, template, manifest, audit, backup, uninstall, skill selection, and package validation behavior.

Each migrated operation must expose deterministic inputs, outputs, dry-run or read-only behavior where applicable, provenance, and error semantics that ordinary CLI commands and future MCP tools can share.

### Script Classification

Script-shaped behavior falls into three categories:

- Core deterministic operations belong in CLI/shared-core operations with focused tests.
- Skill guidance and reference content may remain installed skill assets when selected, but must not own deterministic make-docs behavior.
- Thin compatibility wrappers may remain only after an equivalent CLI/shared-core operation exists.

Custom user scripts remain custom and are outside this migration unless a later accepted design explicitly opts them in.

### Required Migration Order

1. Add the CLI/shared-core operation and focused tests.
2. Update manifest, planner, audit, backup, uninstall, and installer handling for the old and new asset shape.
3. Rewrite affected first-party skills in the same implementation window so they call the CLI/MCP boundary instead of skill-local helper scripts.
4. Remove a first-party helper script from the skill registry, package template, dogfood tree, or mirrored harness only after the corresponding CLI operation and skill rewrite are both present.
5. Validate install, selected-skills, audit, package, and template synchronization before accepting the migration.

### First Migration Scope

The first migration wave should cover lifecycle-breaking helpers first:

- `closeout-commit`
- `closeout-phase`
- `work-on-wave`
- `work-on-phase`

The same change plan may include archive tracing, markdown cleanup/style checking, decompose-codebase probing/validation, and path hygiene, but no acceptance checkpoint may leave a selected first-party skill requiring a missing script or a missing CLI replacement.

### Skills Contract

The no-default-skills contract still holds. Default installs must not install skills or skill scripts.

Explicit selected-skill installs may still install first-party skill prose, references, examples, agent metadata, and prompt routing. Deterministic make-docs logic must be available from the CLI package rather than depending on remote or skill-local script payloads as the only executable source.

[27-revise-skill-purpose-registry-alternate-skills-manifest.md](27-revise-skill-purpose-registry-alternate-skills-manifest.md) may add purpose metadata, alternate manifest provenance, and source-policy display around selected skills, but that metadata must not become a second owner of deterministic workflow behavior.

[28-revise-shared-agentics-installation-harness-redirection.md](28-revise-shared-agentics-installation-harness-redirection.md) may install shared payloads and generated harness stubs that tell agents how to reach CLI/shared-core operations, but those payloads and stubs remain guidance and routing surfaces. They must not become the only owner of deterministic make-docs behavior.

### Managed Removal Safety

Removed first-party helper scripts must be classified through managed-asset ownership and compatibility rules, not deleted as anonymous files.

Audit, backup, uninstall, and migration flows must distinguish managed old skill scripts, managed wrapper scripts, modified local files, and custom user scripts. Any removal plan must be reviewable before mutation.

### MCP Shape

No immediate MCP implementation is required. The migration must shape each operation so a future MCP tool can expose the same contract without a second behavior model.

MCP write behavior and Rust parity remain downstream implementation concerns governed by [25-revise-cli-separation-and-mcp-boundary.md](25-revise-cli-separation-and-mcp-boundary.md).

## Non-Requirements

- No immediate script deletion.
- No immediate Rust implementation.
- No immediate MCP implementation or MCP write surface.
- No resolution of remote versus bundled skills.
- No resolution of remote skill pinning, alternate skill manifests, or shared plugin/skill install redirection.
- No migration of custom user scripts.

## Affected Baseline Docs

- [07 CLI Command Surface and Lifecycle](07-cli-command-surface-and-lifecycle.md)
- [08 Skills Catalog and Distribution](08-skills-catalog-and-distribution.md)
- [10 Packaging Validation and Release Reference](10-packaging-validation-and-release-reference.md)
- [14 Add Lifecycle Workflow Foundation](14-add-lifecycle-workflow-foundation.md)
- [16 Revise Package and Deployment Boundaries](16-revise-package-and-deployment-boundaries.md)
- [17 Revise System Asset Materialization Contract](17-revise-system-asset-materialization-contract.md)
- [18 Revise Compatibility Audit and Migration Disposition](18-revise-compatibility-audit-and-migration-disposition.md)
- [19 Revise Template Package Dogfood Source of Truth Contract](19-revise-template-package-dogfood-source-of-truth-contract.md)
- [21 Revise Tool Directory System Custom Resource Tiers](21-revise-tool-directory-system-custom-resource-tiers.md)
- [24 Revise Configuration Convention Overlay](24-revise-configuration-convention-overlay.md)
- [25 Revise CLI Separation and MCP Boundary](25-revise-cli-separation-and-mcp-boundary.md)
- [27 Revise Skill Purpose Registry Alternate Skills Manifest](27-revise-skill-purpose-registry-alternate-skills-manifest.md)
- [28 Revise Shared Agentics Installation Harness Redirection](28-revise-shared-agentics-installation-harness-redirection.md)

## Acceptance Criteria

- No selected first-party skill requires a missing script or missing CLI replacement at any acceptance checkpoint.
- Each migrated operation has focused tests and deterministic CLI/shared-core semantics.
- Selected-skill install/update/remove tests cover rewritten skills and removed or wrapper script assets.
- Audit, backup, uninstall, and migration tests distinguish managed old scripts, managed wrappers, modified local files, and custom scripts.
- Package/template validation covers source-first edits, dogfood reseeding, `packages/cli/template/` refresh, and packed npm behavior when shipped files change.
- Risk register entries for R-008 and R-014 remain open until implementation proves parity or are explicitly updated with evidence.

## Source Anchors

- [../designs/2026-06-20-no-scripts-migration-and-skill-refactor.md](../designs/2026-06-20-no-scripts-migration-and-skill-refactor.md)
- [../plans/2026-06-23-w16-r3-no-scripts-migration-skill-refactor/00-overview.md](../plans/2026-06-23-w16-r3-no-scripts-migration-skill-refactor/00-overview.md)
- [../work/2026-06-23-w16-r3-no-scripts-migration-skill-refactor/00-index.md](../work/2026-06-23-w16-r3-no-scripts-migration-skill-refactor/00-index.md)
- [07 CLI Command Surface and Lifecycle](07-cli-command-surface-and-lifecycle.md)
- [08 Skills Catalog and Distribution](08-skills-catalog-and-distribution.md)
- [10 Packaging Validation and Release Reference](10-packaging-validation-and-release-reference.md)
- [14 Add Lifecycle Workflow Foundation](14-add-lifecycle-workflow-foundation.md)
- [16 Revise Package and Deployment Boundaries](16-revise-package-and-deployment-boundaries.md)
- [17 Revise System Asset Materialization Contract](17-revise-system-asset-materialization-contract.md)
- [18 Revise Compatibility Audit and Migration Disposition](18-revise-compatibility-audit-and-migration-disposition.md)
- [19 Revise Template Package Dogfood Source of Truth Contract](19-revise-template-package-dogfood-source-of-truth-contract.md)
- [21 Revise Tool Directory System Custom Resource Tiers](21-revise-tool-directory-system-custom-resource-tiers.md)
- [24 Revise Configuration Convention Overlay](24-revise-configuration-convention-overlay.md)
- [25 Revise CLI Separation and MCP Boundary](25-revise-cli-separation-and-mcp-boundary.md)
- [27 Revise Skill Purpose Registry Alternate Skills Manifest](27-revise-skill-purpose-registry-alternate-skills-manifest.md)
- [28 Revise Shared Agentics Installation Harness Redirection](28-revise-shared-agentics-installation-harness-redirection.md)
- [../designs/2026-06-20-skill-purpose-registry-and-alternate-skills-manifest.md](../designs/2026-06-20-skill-purpose-registry-and-alternate-skills-manifest.md)
- [../plans/2026-06-23-w17-r1-skill-purpose-registry-alternate-skills-manifest/00-overview.md](../plans/2026-06-23-w17-r1-skill-purpose-registry-alternate-skills-manifest/00-overview.md)
- [../designs/2026-06-20-shared-agentics-installation-and-harness-redirection.md](../designs/2026-06-20-shared-agentics-installation-and-harness-redirection.md)
- [../plans/2026-06-23-w17-r2-shared-agentics-installation-harness-redirection/00-overview.md](../plans/2026-06-23-w17-r2-shared-agentics-installation-harness-redirection/00-overview.md)
- `packages/cli/skill-registry.json`
- `packages/cli/src/cli.ts`
- `packages/cli/src/operations.ts`
- `packages/cli/src/catalog.ts`
- `packages/cli/src/skill-catalog.ts`
- `packages/cli/src/rules.ts`
- `packages/cli/src/manifest.ts`
- `packages/cli/src/planner.ts`
- `packages/cli/src/install.ts`
- `packages/cli/src/audit.ts`
- `packages/cli/src/backup.ts`
- `packages/cli/src/uninstall.ts`
- `packages/cli/tests/audit.test.ts`
- `packages/cli/tests/backup.test.ts`
- `packages/cli/tests/install.test.ts`
- `packages/cli/tests/operations.test.ts`
- `packages/cli/tests/skill-catalog.test.ts`
- `packages/cli/tests/skill-registry.test.ts`
- `packages/cli/tests/uninstall.test.ts`
- `packages/docs/template/.make-docs/scripts/check_path_hygiene.py`
- `packages/cli/template/.make-docs/scripts/check_path_hygiene.py`
- `packages/skills/closeout-commit/`
- `packages/skills/closeout-phase/`
- `packages/skills/work-on-wave/`
- `packages/skills/work-on-phase/`

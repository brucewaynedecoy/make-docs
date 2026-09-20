# Active PRD and Risk Reconciliation

## Purpose

Record how the no-scripts migration design changes the active PRD set and existing risk register before implementation work is scheduled.

## New PRD

Create [25-typescript-runtime-cli-mcp-operation-boundaries.md](../../prd/25-typescript-runtime-cli-mcp-operation-boundaries.md#no-scripts-migration-dependency).

The new PRD is required because the design introduces a cross-cutting migration contract spanning CLI/shared-core operations, selected first-party skills, package/template synchronization, manifest/audit classification, backup/uninstall safety, and future MCP parity. Updating only baseline docs would hide the migration sequence and acceptance gates.

## Baseline PRDs to Annotate

- [07 CLI Command Surface and Lifecycle](../../prd/07-cli-command-surface-and-lifecycle.md): add deterministic operation boundary expectations.
- [08 Skills Catalog and Distribution](../../prd/08-skills-catalog-and-distribution.md): make skills guidance/routing assets, not owners of deterministic behavior.
- [10 Packaging Validation and Release Reference](../../prd/10-packaging-validation-and-release-reference.md): add selected-skill, package-template, removed-script, and wrapper validation expectations.
- [14 Add Lifecycle Workflow Foundation](../../prd/14-lifecycle-workflow-and-coverage-passes.md): connect the W16 R0 deferred skill refactor to this migration.
- [16 Revise Package and Deployment Boundaries](../../prd/16-package-runtime-and-deployment-boundaries.md): keep TypeScript as current source of truth and Rust/MCP as inheritors of shared contracts.
- [17 Revise System Asset Materialization Contract](../../prd/17-system-asset-materialization-and-local-bootstrap.md): treat system helper scripts and wrappers as managed system resources.
- [18 Revise Compatibility Audit and Migration Disposition](../../prd/18-compatibility-classification-and-migration-safety.md): classify old managed skill scripts, wrappers, modified files, and custom scripts before mutation.
- [19 Revise Template Package Dogfood Source of Truth Contract](../../prd/06-template-contracts-and-generated-assets.md#template-source-authority): keep shipped script/template changes source-first.
- [21 Revise Tool Directory System Custom Resource Tiers](../../prd/21-project-tool-directory-and-resource-tiers.md): reserve `.make-docs/scripts/{system,custom}` for the migration outcome.
- [24 Revise Configuration Convention Overlay](../../prd/24-project-configuration-and-convention-overlay.md): keep future config validation in canonical CLI/shared-core operations rather than label-driven helper scripts.
- [25 Revise CLI Separation and MCP Boundary](../../prd/25-typescript-runtime-cli-mcp-operation-boundaries.md): make the no-scripts migration the concrete downstream operation-boundary proof.

## Risk Register Updates

Update [03 Open Questions and Risk Register](../../prd/03-open-questions-and-risk-register.md):

- Keep Q-001, Q-007, and Q-012 open.
- Add PRD 26 as a constraint on skills delivery, remote skill source trust, and shared plugin/skill routing.
- Keep R-014 open until implementation proves CLI/shared-core parity and rewrites affected skills in the same window.
- Update R-002, R-004, R-006, and R-008 because script removal changes audit, path duplication, single-snapshot safety, and skill-refactor risk.

## No-New-PRD Rationale Rejected

A no-new-PRD reconciliation is not sufficient. The design creates new acceptance gates for migration order and selected first-party skill safety, and those gates are not fully captured by PRD 25. PRD 25 defines the boundary; PRD 26 defines the concrete no-scripts migration rule.

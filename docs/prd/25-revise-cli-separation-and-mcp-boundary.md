# 25 Revise CLI Separation and MCP Boundary

## Purpose

Define the v2 boundary between the current TypeScript npm installer-maintainer CLI, the future standalone Rust agent-facing CLI, and the first MCP surface before deterministic scripts and skills are rewired.

## Change Type

Revision. This PRD extends the active package/deployment, CLI lifecycle, asset materialization, compatibility, tool-directory, configuration, and conformance requirements.

Route: `change-plan`

Coordinate: `W10 R6`

## Change Notes

This PRD preserves the current TypeScript npm CLI as the installer-maintainer authority while assigning long-term standalone agent automation and MCP runtime ownership to Rust. It does not implement Rust or MCP behavior; it constrains later implementation so npm, Rust, and MCP surfaces share the same contracts.

## Requirements

### npm Installer Posture

`npx @brucewaynedecoy/make-docs` remains installer-first. Its primary job is project install, sync, reconfigure, selected-skills maintenance, backup, uninstall, and package-delivered template validation.

The no-command workflow remains meaningful and must not be replaced by an `init`/`update` command-router model.

### TypeScript Ownership

The TypeScript CLI owns installer-maintainer behavior until an accepted Rust parity plan proves shared contracts. TypeScript may add transitional setup commands or internal wiring for future Rust CLI/MCP setup, but it must not become the long-term agent automation runtime.

### Rust Ownership

The Rust CLI is the long-term owner for the standalone agent-facing command surface and MCP runtime. Its installed command remains `make-docs`, matching the npm binary.

When both npm and Rust distributions are installed, PATH order chooses the runtime. Both runtimes must expose clear version/runtime output before dual-runtime support is considered acceptable.

### Product Roles

Installer-maintainer role:

- install, sync, reconfigure, selected-skills maintenance, backup, uninstall, audit review, compatibility classification, package/template validation, and future migration flows;
- TypeScript-owned until Rust parity is planned and validated.

Agent automation role:

- deterministic inspection, validation, asset resolution, generation preparation, script-replacement helpers, and typed access to make-docs contracts for agents;
- Rust CLI/MCP destination, with TypeScript bridge behavior allowed only as a temporary implementation path.

### MCP Parity

MCP tools must not define a second behavior model. Each MCP tool must delegate to the same deterministic operation contract used by the CLI command or shared core operation it represents.

Parity includes manifest reads, config interpretation, asset provenance, audit classification, compatibility classification, conflict handling, dry-run output, and write permissions.

### First MCP Surface

The first MCP surface is read-first and plan-first:

- inspect installed project state, manifest provenance, selected harnesses, selected skills, materialization mode, and compatibility classification;
- list or resolve immutable system assets only through the accepted materialization contract;
- run deterministic validators and no-scripts replacement operations only after CLI/shared-core equivalents exist;
- produce dry-run plans for installer-maintainer operations before mutation.

MCP writes require a later implementation plan with an explicit permission model and parity proof.

### Asset and Config Boundaries

MCP must not expose hidden provider-backed state as the only way to understand a repository. Local bootstrap remains mandatory.

If a tool resolves a provider-backed or cached system asset, the manifest must identify the provider, version or immutable ref, hash algorithm, hash set, offline expectation, and recovery guidance.

Configuration overlays are presentation inputs. CLI commands, MCP tools, plugin surfaces, and skills route through canonical paths, manifest keys, route identifiers, prompt paths, skill names, contract names, and harness names.

### No-Scripts Migration Dependency

The no-scripts migration must move deterministic logic into CLI/shared-core operations first, then expose it through ordinary CLI commands and MCP tools. Existing system scripts may remain only as thin wrappers after an equivalent CLI operation exists.

Skills that currently depend on standalone scripts must be rewritten in the same migration window so they call the CLI/MCP boundary instead of carrying independent deterministic logic.

[26-revise-no-scripts-migration-skill-refactor.md](26-revise-no-scripts-migration-skill-refactor.md) is the concrete migration contract for this dependency. It defines the required operation-first sequence, same-window first-party skill rewrites, managed old-script and wrapper classification, and validation gates before standalone helper scripts are removed or downgraded.

[27-revise-skill-purpose-registry-alternate-skills-manifest.md](27-revise-skill-purpose-registry-alternate-skills-manifest.md) supplies the skills-manifest metadata contract that future MCP or plugin surfaces must reuse. MCP and plugin tools may present purpose-led choices, but they must use one effective manifest, canonical purpose ids, resolved skill names, and the same source-policy validation as the CLI.

[28-revise-shared-agentics-installation-harness-redirection.md](28-revise-shared-agentics-installation-harness-redirection.md) supplies the selected-agentics store and harness exposure primitive that future MCP or plugin surfaces must reuse. Discovery, dry-run planning, and installed-state inspection can read manifest ownership records and generated stubs without a live CLI process, but deterministic writes still delegate to CLI/shared-core operations.

[29-revise-playbook-contract-run-playbook.md](29-revise-playbook-contract-run-playbook.md) supplies the generic Run Playbook execution model that future CLI, MCP, plugin, skill, or agent surfaces must reuse. MCP tools may inspect, validate, select, and dry-run playbooks under the read-first/plan-first surface, but writes or unattended execution still require a later permission and parity plan.

## Non-Requirements

- No immediate Rust implementation.
- No immediate MCP write surface.
- No direct MCP asset source policy outside the accepted materialization contract.
- No replacement of the no-command npm workflow with `init` or `update`.
- No resolution of remote versus bundled skills, plugin runtime flow, or public plugin exposure.

## Affected Baseline Docs

- [07 CLI Command Surface and Lifecycle](07-cli-command-surface-and-lifecycle.md)
- [10 Packaging Validation and Release Reference](10-packaging-validation-and-release-reference.md)
- [16 Revise Package and Deployment Boundaries](16-revise-package-and-deployment-boundaries.md)
- [17 Revise System Asset Materialization Contract](17-revise-system-asset-materialization-contract.md)
- [18 Revise Compatibility Audit and Migration Disposition](18-revise-compatibility-audit-and-migration-disposition.md)
- [20 Revise Agent Harness Model Conformance Lab](20-revise-agent-harness-model-conformance-lab.md)
- [21 Revise Tool Directory System Custom Resource Tiers](21-revise-tool-directory-system-custom-resource-tiers.md)
- [24 Revise Configuration Convention Overlay](24-revise-configuration-convention-overlay.md)
- [28 Revise Shared Agentics Installation Harness Redirection](28-revise-shared-agentics-installation-harness-redirection.md)
- [29 Revise Playbook Contract Run Playbook](29-revise-playbook-contract-run-playbook.md)

## Acceptance Criteria

- Public docs preserve the no-command npm workflow and explicit lifecycle commands.
- TypeScript npm installer behavior remains the implementation authority until Rust parity is accepted.
- Rust/MCP plans include version/runtime disclosure and PATH-order behavior.
- MCP tools have one shared operation contract with CLI/shared-core behavior.
- MCP writes remain gated by explicit permission and parity planning.
- Validation covers CLI/MCP parity, noninteractive/dry-run behavior, provider/cache failure behavior, manifest TypeScript/Rust compatibility, and conformance-lab scenarios before public support claims.

## Source Anchors

- [../designs/2026-06-20-cli-separation-and-mcp-boundary.md](../designs/2026-06-20-cli-separation-and-mcp-boundary.md)
- [../plans/2026-06-23-w10-r6-cli-separation-and-mcp-boundary/00-overview.md](../plans/2026-06-23-w10-r6-cli-separation-and-mcp-boundary/00-overview.md)
- [../work/2026-06-23-w10-r6-cli-separation-and-mcp-boundary/00-index.md](../work/2026-06-23-w10-r6-cli-separation-and-mcp-boundary/00-index.md)
- [07 CLI Command Surface and Lifecycle](07-cli-command-surface-and-lifecycle.md)
- [16 Revise Package and Deployment Boundaries](16-revise-package-and-deployment-boundaries.md)
- [17 Revise System Asset Materialization Contract](17-revise-system-asset-materialization-contract.md)
- [18 Revise Compatibility Audit and Migration Disposition](18-revise-compatibility-audit-and-migration-disposition.md)
- [20 Revise Agent Harness Model Conformance Lab](20-revise-agent-harness-model-conformance-lab.md)
- [21 Revise Tool Directory System Custom Resource Tiers](21-revise-tool-directory-system-custom-resource-tiers.md)
- [24 Revise Configuration Convention Overlay](24-revise-configuration-convention-overlay.md)
- [26 Revise No-Scripts Migration Skill Refactor](26-revise-no-scripts-migration-skill-refactor.md)
- [27 Revise Skill Purpose Registry Alternate Skills Manifest](27-revise-skill-purpose-registry-alternate-skills-manifest.md)
- [28 Revise Shared Agentics Installation Harness Redirection](28-revise-shared-agentics-installation-harness-redirection.md)
- [29 Revise Playbook Contract Run Playbook](29-revise-playbook-contract-run-playbook.md)
- [../designs/2026-06-20-shared-agentics-installation-and-harness-redirection.md](../designs/2026-06-20-shared-agentics-installation-and-harness-redirection.md)
- [../plans/2026-06-23-w17-r2-shared-agentics-installation-harness-redirection/00-overview.md](../plans/2026-06-23-w17-r2-shared-agentics-installation-harness-redirection/00-overview.md)
- [../designs/2026-06-20-playbook-contract-and-run-playbook.md](../designs/2026-06-20-playbook-contract-and-run-playbook.md)
- [../plans/2026-06-23-w18-r1-playbook-contract-run-playbook/00-overview.md](../plans/2026-06-23-w18-r1-playbook-contract-run-playbook/00-overview.md)
- `packages/cli/src/cli.ts`
- `packages/cli/src/profile.ts`
- `packages/cli/src/manifest.ts`
- `packages/cli/src/install.ts`
- `packages/cli/src/audit.ts`
- `packages/cli/src/backup.ts`
- `packages/cli/src/uninstall.ts`
- `packages/cli/src/rules.ts`
- `scripts/smoke-pack.mjs`

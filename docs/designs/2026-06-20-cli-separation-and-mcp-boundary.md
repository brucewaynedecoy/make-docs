# CLI Separation and MCP Boundary

## Purpose

Define the v2 boundary between the current TypeScript npm installer-maintainer CLI, the future standalone Rust agent-facing CLI, and the first MCP surface before deterministic scripts and skills are rewired.

This design decides the public `npx` posture, the long-term MCP owner, the relationship between MCP tools and ordinary CLI commands, and the asset-materialization constraints that later Batch 3 designs must preserve.

## Context

[v2 Proposed Design and Roadmap](../assets/artifacts/v2-proposed-design-and-roadmap.md) places this design first in "Batch 3 - CLI, MCP, and Deterministic Automation" because no-scripts migration and skill refactoring depend on a stable command boundary. This is an intentional lifecycle departure: the v2 design set is being generated from artifact roadmap inputs as a source-to-design straddle before returning to the default design -> plan -> PRD -> work -> implementation flow.

The current TypeScript npm package is the live implementation authority. [07 CLI Command Surface and Lifecycle](../prd/07-cli-command-surface-and-lifecycle.md) records a meaningful no-command workflow: `make-docs` installs when no manifest exists and syncs saved selections when a manifest exists. The explicit commands are `reconfigure`, `skills`, `backup`, and `uninstall`; removed `init`, `update`, `--reconfigure`, and `--skills` paths are intentionally rejected.

[Package and Deployment Boundaries](2026-06-19-package-and-deployment-boundaries.md) already decided that the TypeScript npm package remains the canonical npm and `npx` entry point, while the standalone Rust CLI is a separate deployment artifact for Homebrew and Crates. It also decided that long-term MCP startup ownership belongs to the Rust CLI, with TypeScript allowed to bootstrap, configure, or bridge MCP setup during transition.

[System Asset Delivery and Materialization Contract](2026-06-19-system-asset-delivery-and-materialization-contract.md) allows future Rust CLI or MCP surfaces to act as approved providers for immutable system assets only after they preserve manifest provenance, local bootstrap readability, conflict review, audit, backup, and uninstall safety. Full-snapshot materialization remains the safe default until provider-backed behavior has evidence.

[Compatibility, Audit, and Migration Disposition](2026-06-19-compatibility-audit-and-migration-disposition.md) requires every install, reconfigure, migration, backup, uninstall, and future Rust execution path to classify source state before writing. Destructive flows must keep one reviewed audit snapshot from approval through backup/removal/reinstall.

[Tool Directory System and Custom Resource Tiers](2026-06-19-tool-directory-system-and-custom-resource-tiers.md) reserves `.make-docs/` for tool resources and runtime state, including future `scripts/` and `agentics/` surfaces. [Configuration and Convention Overlay](2026-06-20-configuration-and-convention-overlay.md) constrains CLI, MCP, plugin, and skill surfaces to consume config as rendering input, not routing authority.

The relevant PRD/risk-register entries are referenced, not changed, in [03 Open Questions and Risk Register](../prd/03-open-questions-and-risk-register.md): D-002, D-005, D-006, D-009, Q-001, Q-007, Q-011, Q-012, R-003, R-004, R-005, R-006, R-008, R-013, and R-014.

## Decision

`npx @brucewaynedecoy/make-docs` remains installer-first. Its primary job is project install, sync, reconfigure, selected-skills maintenance, backup, uninstall, and package-delivered template validation. The no-command workflow remains meaningful and must not be replaced by an `init`/`update` command-router model.

The TypeScript CLI may add transitional setup commands or internal wiring that installs, configures, or explains the future Rust CLI/MCP runtime, but it must not become the long-term agent automation runtime. During transition, TypeScript remains the source of truth for current behavior until a change plan proves Rust parity for the shared contracts.

The Rust CLI is the long-term owner for the standalone agent-facing command surface and MCP runtime. Its installed command remains `make-docs`, matching the npm binary. When both npm and Rust distributions are installed, PATH order chooses the runtime; both runtimes must expose clear version/runtime output before dual-runtime support is considered acceptable.

Separate the command surface into two product roles:

- Installer-maintainer role: install, sync, reconfigure, skills selection, backup, uninstall, audit review, compatibility classification, package/template validation, and future migration flows. These are TypeScript-owned until Rust parity is explicitly planned and validated.
- Agent automation role: deterministic inspection, validation, asset resolution, generation preparation, script-replacement helpers, and typed access to make-docs contracts for agents. This is the Rust CLI/MCP destination, with TypeScript bridge behavior allowed only as a temporary implementation path.

MCP tools must not define a second behavior model. Each MCP tool must delegate to the same deterministic operation contract used by the CLI command or shared core operation it represents. The tool name may be more structured than the CLI command, but the manifest reads, config interpretation, asset provenance, audit classification, conflict handling, dry-run output, and write permissions must be identical to the equivalent CLI operation.

The first MCP surface should be read-first and plan-first:

- inspect installed project state, manifest provenance, selected harnesses, selected skills, materialization mode, and compatibility classification;
- list or resolve immutable system assets only through the accepted materialization contract;
- run deterministic validators and no-scripts replacement operations once those operations have CLI/shared-core equivalents;
- produce dry-run plans for installer-maintainer operations before any mutation;
- perform writes only after a later implementation plan defines an explicit permission model and proves parity with existing CLI safety.

MCP must not expose hidden provider-backed state as the only way to understand a repository. The local bootstrap remains mandatory. If a tool resolves a provider-backed or cached system asset, the manifest must identify the provider, version or immutable ref, hash algorithm, hash set, offline expectation, and recovery guidance. MCP may serve or resolve assets only by consuming that contract; it does not create a separate remote-source policy.

Configuration overlays are presentation inputs. CLI commands, MCP tools, plugin surfaces, and skills route through canonical paths, manifest keys, route identifiers, prompt paths, skill names, contract names, and harness names. Configured labels may appear in user-visible text after canonical routing has already happened.

The no-scripts migration that follows this design must move deterministic logic into CLI/shared-core operations first, then expose it through ordinary CLI commands and MCP tools. Existing system scripts may remain only as thin wrappers after an equivalent CLI operation exists. Skills that currently depend on standalone scripts must be rewritten in the same migration window so they call the CLI/MCP boundary instead of carrying independent deterministic logic.

## Alternatives Considered

### Make `npx` Command-Router-First

Rejected. Treating `npx` as the primary router for all future agent commands would blur installer-maintainer behavior with automation behavior and would reopen R-005. The current no-command install/sync workflow is accepted product behavior and remains the safest public npm entry point.

### Make TypeScript the Long-Term MCP Runtime

Rejected. The accepted package boundary already assigns long-term MCP startup ownership to Rust. TypeScript can bridge setup during transition, but making it the long-term runtime would duplicate the Rust distribution boundary and increase the parity surface.

### Let MCP Define Its Own Workflows

Rejected. A separate MCP behavior model would fork audit, manifest, conflict, config, and asset-resolution semantics. MCP must be typed access to the same deterministic operations as CLI, not a parallel product.

### Expose Direct Asset Retrieval Through MCP

Rejected as a default. MCP may resolve or serve assets only through the accepted system asset materialization contract. Direct remote retrieval remains deferred until Q-007 and the provider/cache provenance model are resolved.

### Move All Installer Behavior to Rust Immediately

Rejected for v2 planning. The TypeScript CLI is the current tested implementation and npm package source of truth. Rust should take ownership through planned parity, not by replacing install, audit, backup, uninstall, and manifest behavior before the shared contracts have implementation evidence.

## Consequences

The next Batch 3 design, "No-Scripts Migration and Skill Refactor", has a stable target: deterministic script behavior moves into CLI/shared-core operations that can be called by both ordinary CLI commands and MCP tools. It should not design standalone scripts as the long-term automation surface.

The TypeScript CLI remains responsible for not regressing existing npm install behavior while Rust catches up. In particular, bare installs keep no-default-skills behavior, explicit skill installs remain opt-in, and backup/uninstall continue to use one reviewed audit snapshot.

The Rust CLI and MCP implementation inherit all accepted compatibility and materialization contracts. They must preserve `.make-docs/manifest.json`, compatibility classification, asset provenance, local bootstrap readability, conflict review, config-as-rendering-input, and package/template validation expectations.

Public documentation will need later alignment work. D-002 and D-006 remain open because public command docs and package README/tarball guidance must describe the accepted no-command flow, explicit lifecycle commands, and dual-runtime posture once implementation plans land.

Q-001, Q-007, and Q-012 remain open. This design does not choose remote versus bundled skills, remote source pinning, alternate skills manifests, or cross-platform shared skills/plugins redirection. It only constrains those later designs so skills/plugins do not bypass the CLI/MCP boundary or the no-default-skills contract.

R-003, R-004, R-005, R-006, R-008, R-013, and R-014 remain active implementation risks. Future implementation validation should include current package checks plus CLI/MCP parity checks, noninteractive/dry-run behavior, provider/cache failure behavior, manifest TS/Rust compatibility, version/PATH output, and conformance-lab scenarios before public support claims.

Package/template/dogfood work is not changed by this design. If later implementation adds shipped command routers, bootstrap instructions, MCP setup files, or system-resource metadata, those changes must start in `packages/docs/template/`, update code/tests/manifest expectations, reseed root dogfood only for affected template-owned files, refresh `packages/cli/template/` through the copy/prepack path, and run package validation.

## Design Lineage

Update Mode: new-doc-related

Prior Design Docs:

- [Package and Deployment Boundaries](2026-06-19-package-and-deployment-boundaries.md)
- [System Asset Delivery and Materialization Contract](2026-06-19-system-asset-delivery-and-materialization-contract.md)
- [Compatibility, Audit, and Migration Disposition](2026-06-19-compatibility-audit-and-migration-disposition.md)
- [Tool Directory System and Custom Resource Tiers](2026-06-19-tool-directory-system-and-custom-resource-tiers.md)
- [Configuration and Convention Overlay](2026-06-20-configuration-and-convention-overlay.md)
- [Agent Harness and Model Conformance Lab](2026-06-19-agent-harness-and-model-conformance-lab.md)

Reason: This design is a new Batch 3 decision doc, but it directly extends the accepted package/runtime boundary, materialization contract, compatibility/audit safety model, tool-directory split, config-overlay rules, and future conformance evidence requirements.

## Intended Follow-On

Route: change-plan

Next Prompt: [designs-to-plan-change.prompt.md](../../.make-docs/references/system/prompts/designs-to-plan-change.prompt.md)

Why: This design constrains and extends active CLI/package/install/audit behavior rather than creating a greenfield baseline. It must feed targeted planning for no-scripts migration, CLI/MCP parity, public command documentation, and eventual Rust ownership without disturbing accepted install safety.

Coordinate Handoff: Prior coordinate W10 R0 P1 and PRD 07 CLI lifecycle work are the nearest lineage anchors; recommended downstream W/R coordinate unresolved; planner must resolve before writing.

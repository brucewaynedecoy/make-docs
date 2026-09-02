# 30 Agentic Extensibility Boundary

## Purpose

This document defines the current Make Docs boundary for optional agentic extensibility. Make Docs has no general plugin or workflow-bundle product; the core product is complete through routers, system resources, typed CLI operations, and MCP surfaces, while explicitly selected Skills remain governed by [08-skills-catalog-and-distribution.md](08-skills-catalog-and-distribution.md) and [28-shared-agentics-installation-and-harness-exposure.md](28-shared-agentics-installation-and-harness-exposure.md).

## Scope

This authority owns the admission boundary for optional plugins, hooks, extensions, harness adapters, and other agentic integrations. It defines when Make Docs must report an integration as absent, what evidence would be required before a future integration could become current product authority, and how legacy or user-authored extension artifacts remain protected.

It does not create a plugin manifest, plugin store, workflow-bundle catalog, Playbook packaging path, extension API, hook API, or selection UX. Any such coherent capability requires a later owner-approved design and authoritative PRD maintenance.

## Component and Capability Map

- Core deterministic behavior: the TypeScript operation registry, CLI, and MCP surfaces owned by PRDs [25](25-typescript-runtime-cli-mcp-operation-boundaries.md) and [39](39-cli-command-model-and-operation-registry.md).
- Current selected agentics: explicit Skills and their native harness exposure, owned by PRDs [08](08-skills-catalog-and-distribution.md) and [28](28-shared-agentics-installation-and-harness-exposure.md).
- Optional integration admission: the evidence and authority gate defined in this document.
- Support claims: exact evidence-bound tuples owned by PRDs [20](20-agent-harness-conformance-and-support-claims.md), [43](43-conformance-scenario-model-and-execution-kits.md), and [44](44-conformance-lab-sessions-and-evidence.md).
- Legacy and project-owned extension artifacts: preservation and ownership classification shared with PRD [18](18-compatibility-classification-and-migration-safety.md).

## Requirements

### Current Extensibility Boundary (R-BOUND)

- R-BOUND-1 (MUST): Make Docs exposes no general plugin substrate, workflow-bundle product, plugin payload store, plugin manifest, plugin selection flow, plugin lifecycle API, hook registry, extension registry, or Playbook-to-agentics packaging compiler.
- R-BOUND-2 (MUST): the product must not advertise, discover, install, update, invoke, package, or claim support for a plugin, workflow bundle, hook, extension, generated Skill bundle, or harness adapter unless that exact integration has passed R-ADMIT.
- R-BOUND-3 (MUST): optional agentic surfaces delegate deterministic behavior to the same typed CLI/shared-core operations used without agentics. They do not contain independent manifest, configuration, audit, backup, uninstall, validation, migration, evidence, or lifecycle-routing logic.
- R-BOUND-4 (MUST): project routers, machine-served resources, CLI, and MCP provide complete core behavior when no optional agentic artifact is installed.
- R-BOUND-5 (MUST NOT): Playbooks and Protocols are not extension primitives, workflow-bundle sources, plugin inputs, or compatibility targets. PRDs [34](34-playbook-authoring-contract-and-model.md), [35](35-run-playbook-state-machine-and-portability.md), and [36](36-playbook-packaging-compiler-and-harness-adapters.md) preserve the present no-capability and legacy-compatibility boundaries.

### Integration Admission (R-ADMIT)

- R-ADMIT-1 (MUST): a future optional integration requires a traced current non-Playbook consumer and purpose, a coherent owning PRD, explicit selection, a real harness capability contract, install and uninstall behavior, ownership and provenance records, safe audit/backup/migration handling, and honest support status.
- R-ADMIT-2 (MUST): production imports, registrations, or public call sites establish a traced consumer. Tests, fixtures, archived designs, historical work, documentation proposals, generated examples, or an unused schema do not establish current product use.
- R-ADMIT-3 (MUST): absence of a traced consumer means the surface is absent or a removal candidate. It is not preserved as speculative compatibility, a provisional plugin product, or a dormant workflow-bundle promise.
- R-ADMIT-4 (MUST): unsupported harness APIs are reported as unsupported. Make Docs does not simulate hooks, extensions, native plugins, background daemons, hidden mutations, or hidden retries.

### Selection, Configuration, and Manifest Boundary (R-SELECT)

- R-SELECT-1 (MUST): bare setup, default sync, and Skills selection install no plugin, hook, extension, workflow bundle, or other unadmitted agentic artifact. `--selected-skills all` expands only within the effective Skills manifest.
- R-SELECT-2 (MUST): configuration overlays may render labels after canonical resolution but cannot invent an integration, plugin id, hook, extension point, harness contract, selection, or routing rule.
- R-SELECT-3 (MUST): current manifests track selected Skills and their ownership. They do not reserve or imply a plugin payload namespace or a generic extension selection schema.
- R-SELECT-4 (MUST): an admitted future integration must use explicit, inspectable selection and must not become a correctness prerequisite for the core operation it exposes.

### Legacy and User-Authored Artifacts (R-LEGACY)

- R-LEGACY-1 (MUST): migration, audit, backup, and uninstall preserve user-authored, modified, ambiguous, or unowned harness plugin, hook, extension, bundle, and adapter files. A matching name or path never proves Make Docs ownership.
- R-LEGACY-2 (MUST): only files with verified Make Docs ownership and matching trusted bytes may be removed automatically under an accepted migration. Removal unlinks symlinks without following targets and never prunes a parent containing unmanaged descendants.
- R-LEGACY-3 (MUST): historical designs, plans, work, archives, evidence, and legacy manifests retain their terminology as provenance. They do not activate current plugin, workflow-bundle, Playbook, or Protocol behavior.

### System Workflow and Skill Boundary (R-WORKFLOW)

- R-WORKFLOW-1 (MUST): a reusable Make Docs workflow is composed from current system contracts, prompts, references, templates, and typed operations. It is not a plugin or workflow bundle.
- R-WORKFLOW-2 (MUST): the first-party Naive-UAT Skill is an optional access adapter. Any shim delegates to the typed CLI, adapts arguments or receipt formatting only, and contains no tester qualification, installed-product targeting, anti-coaching, Persona, scenario, evidence, finding, gate, or run-state policy.
- R-WORKFLOW-3 (MUST): optional Skill exposure never changes the canonical system workflow, scenario authority, evidence destination, or correctness of direct CLI/MCP use.

### Support Claims (R-SUPPORT)

- R-SUPPORT-1 (MUST): support wording is limited to current, admitted surfaces with reviewed evidence for the exact tuple defined by PRD 20.
- R-SUPPORT-2 (MUST): capability declarations, configuration, documentation, unit tests, and generated files do not establish harness support. Missing, stale, non-comparable, or absent evidence cannot be described as provisional plugin or workflow-bundle support.

## Non-Requirements

- No default or implicit optional-agentics installation.
- No in-product Playbook or Protocol model.
- No plugin or workflow-bundle catalog, selection UX, payload store, packaging compiler, or harness-adapter registry.
- No one-plugin-per-workflow or one-workflow-per-plugin model.
- No untraced compatibility promise for a hook, extension, adapter, marketplace, or native plugin API.
- No plugin-local deterministic business logic or alternate UAT policy.
- No support claim without exact reviewed conformance evidence.

## Acceptance Criteria

- Core routers, resources, CLI, and MCP remain complete with no optional agentics installed.
- Default setup, sync, and Skills selection create no plugin, hook, extension, workflow-bundle, or generated package output.
- Every current optional integration has a traced non-Playbook purpose, an owning PRD, explicit selection, lifecycle authority, real harness capability evidence, and an honest support state.
- Untraced plugin and Playbook-derived packaging surfaces are absent from current manifests, discovery, selection, support claims, and conformance scenarios.
- User-authored, modified, ambiguous, and legacy extension artifacts are preserved unless verified ownership and an accepted migration authorize removal.
- The optional Naive-UAT Skill delegates to typed CLI operations and contains no duplicated policy.

## Contracts and Data

The R-BOUND, R-ADMIT, R-SELECT, R-LEGACY, R-WORKFLOW, and R-SUPPORT requirements are the normative contract. This authority intentionally defines no plugin, workflow-bundle, hook, extension, or adapter schema.

## Integrations

PRDs 08 and 28 own current Skills selection and exposure; PRDs 25 and 39 own typed operations and public projections; PRDs 20, 43, and 44 own support evidence; PRD 18 owns migration classification and safety; and PRD 46 owns Naive-UAT policy and anti-coaching semantics.

## Rebuild Notes

A clean-room rebuild must keep core operation independent of agentics, admit no integration without R-ADMIT evidence and authority, preserve ambiguous user artifacts, and resist recreating former Playbook, Protocol, plugin, or workflow-bundle behavior from historical names or paths.

## Requirement History

### 2026-08-08 — Not assigned

- Affected requirement or section: `Consolidated capability ownership`
- Previous contract: Current requirements were also represented by standalone editorial PRDs 29, 32.
- Replacement contract: The applicable current requirements are inline in this authority and its linked product owners; the standalone editorial records are retired from the active set.
- Rationale: Active PRDs own product subjects and do not preserve editorial operations as product authority.
- Source: [PRD Authority Maintenance](../../.make-docs/system/references/prd-change-management.md)

### 2026-08-08 — W18 R2

- Affected requirement or section: `Document identity and current authority`
- Previous contract: The capability was represented as a standalone editorial change record whose title and structure described how the PRD set was modified.
- Replacement contract: This document stated an active plugin substrate, workflow-bundle product, plugin lifecycle, and Playbook-derived packaging boundary.
- Rationale: Active PRDs describe the current product shape; editorial operations belong in plans, work, and history.
- Source: [Plugin substrate design](../designs/2026-06-20-harness-plugin-substrate-and-workflow-bundles.md)

### 2026-08-14 — W19 R1

- Affected requirement or section: `Purpose; Current Extensibility Boundary; Integration Admission; System Workflow and Skill Boundary`
- Previous contract: Make Docs treated plugins, workflow bundles, a shared plugin payload store, Playbook invocation, generated packaging outputs, and future plugin selection as active or provisional product surfaces.
- Replacement contract: Make Docs has no general plugin or workflow-bundle product; core behavior is complete through resources and typed CLI/MCP operations, selected Skills remain separate, and any future optional integration must have a traced non-Playbook consumer, an owning PRD, explicit selection, lifecycle authority, real capability evidence, and honest conformance status.
- Rationale: Unsupported and untraced plugin infrastructure must not remain a current product promise, while evidence-backed optional extensibility retains a clear admission seam.
- Source: [W19 R1 recovery design](../designs/2026-08-12-make-docs-v2-product-boundary-and-missing-migration-recovery.md) and [accepted W19 R1 plan](../plans/2026-08-13-w19-r1-make-docs-v2-product-boundary-and-missing-migration-recovery/00-overview.md)

## Source Anchors

- [W19 R1 recovery design](../designs/2026-08-12-make-docs-v2-product-boundary-and-missing-migration-recovery.md)
- [W19 R1 plan](../plans/2026-08-13-w19-r1-make-docs-v2-product-boundary-and-missing-migration-recovery/00-overview.md)
- [../designs/2026-06-20-harness-plugin-substrate-and-workflow-bundles.md](../designs/2026-06-20-harness-plugin-substrate-and-workflow-bundles.md)
- [../designs/2026-06-27-run-playbook-orchestration-and-harness-capabilities.md](../designs/2026-06-27-run-playbook-orchestration-and-harness-capabilities.md)
- [../plans/2026-06-23-w18-r2-harness-plugin-substrate-workflow-bundles/00-overview.md](../plans/2026-06-23-w18-r2-harness-plugin-substrate-workflow-bundles/00-overview.md)
- [../plans/2026-06-27-w18-r4-run-playbook-orchestration-and-harness-capabilities/00-overview.md](../plans/2026-06-27-w18-r4-run-playbook-orchestration-and-harness-capabilities/00-overview.md)
- [../work/2026-06-23-w18-r2-harness-plugin-substrate-workflow-bundles/00-index.md](../work/2026-06-23-w18-r2-harness-plugin-substrate-workflow-bundles/00-index.md)
- [../work/2026-06-27-w18-r4-run-playbook-orchestration-and-harness-capabilities/00-index.md](../work/2026-06-27-w18-r4-run-playbook-orchestration-and-harness-capabilities/00-index.md)
- [20 Agent Harness Model Conformance Lab](20-agent-harness-conformance-and-support-claims.md)
- [21 Tool Directory System Custom Resource Tiers](21-project-tool-directory-and-resource-tiers.md)
- [24 Configuration Convention Overlay](24-project-configuration-and-convention-overlay.md)
- [25 CLI Separation and MCP Boundary](25-typescript-runtime-cli-mcp-operation-boundaries.md)
- [28 Shared Agentics Installation Harness Redirection](28-shared-agentics-installation-and-harness-exposure.md)
- [34 Playbook Authoring Boundary](34-playbook-authoring-contract-and-model.md)
- [14 Lifecycle Workflow and Coverage Passes](14-lifecycle-workflow-and-coverage-passes.md)
- [36 Agentic Packaging Boundary](36-playbook-packaging-compiler-and-harness-adapters.md)
- [../designs/2026-06-29-playbook-packaging-and-harness-adapter-registry.md](../designs/2026-06-29-playbook-packaging-and-harness-adapter-registry.md)
- [../plans/2026-06-29-w18-r5-playbook-packaging-and-harness-adapter-registry/00-overview.md](../plans/2026-06-29-w18-r5-playbook-packaging-and-harness-adapter-registry/00-overview.md)
- [../designs/2026-06-20-coverage-pass-extensions-and-adversarial-review.md](../designs/2026-06-20-coverage-pass-extensions-and-adversarial-review.md)
- [../plans/2026-06-23-w18-r3-coverage-pass-extensions-adversarial-review/00-overview.md](../plans/2026-06-23-w18-r3-coverage-pass-extensions-adversarial-review/00-overview.md)
- `packages/cli/src/types.ts`
- `packages/cli/src/profile.ts`
- `packages/cli/src/manifest.ts`
- `packages/cli/src/skill-catalog.ts`
- `packages/cli/src/skill-registry.ts`
- `packages/cli/src/skill-resolver.ts`
- `packages/cli/src/skills-command.ts`
- `packages/cli/src/skills-ui.ts`
- `packages/cli/src/planner.ts`
- `packages/cli/src/install.ts`
- `packages/cli/src/audit.ts`
- `packages/cli/src/backup.ts`
- `packages/cli/src/uninstall.ts`
- `scripts/smoke-pack.mjs`

---
title: "36 Agentic Packaging and Adapter Boundary"
kind: "prd"
status: "active"
source:
  type: "design"
  path: "docs/designs/2026-07-01-playbook-packaging-compiler-and-harness-adapters.md"
---

# 36 Agentic Packaging and Adapter Boundary

## Purpose

This document defines the current Make Docs boundary for agentic packaging and harness adapters. Make Docs v2 has no Playbook/Protocol packaging compiler, generated plugin or skills-bundle product, or packaging-specific harness-adapter registry; Requirement History and Source Anchors preserve the former contract as provenance only.

## Scope

This authority owns the present absence of Playbook/Protocol package plans, deterministic compilation, dependency materialization, generated distributables, marketplace registration, and packaging-specific adapters. It also defines the safe treatment of legacy generated outputs and untraced adapter surfaces.

The general Skills catalog and explicitly selected Skill exposure remain current under PRDs [08](08-skills-catalog-and-distribution.md) and [28](28-shared-agentics-installation-and-harness-exposure.md). This document does not narrow those traced, non-Playbook capabilities.

## Component and Capability Map

- Current Skill distribution: explicitly selected canonical Skill payloads and native harness exposure.
- Current extensibility admission: traced-consumer and evidence boundary in [30-plugin-substrate-and-workflow-bundles.md](30-plugin-substrate-and-workflow-bundles.md).
- Absent packaging surfaces: Playbook/Protocol package planner, compiler, generated plugin/skills bundle, marketplace writer, and packaging adapter registry.
- Legacy generated artifacts: manifest-owned or user-modified outputs preserved and classified through migration safety.
- Support evidence: current installed-product, Skill, CLI, MCP, and resource scenarios only.

## Requirements

### Current Packaging Boundary (R-SCOPE)

- R-SCOPE-1 (MUST): Make Docs defines no Playbook/Protocol package plan, packaging compiler, `outputKind` profile, generated plugin, generated skills bundle, generated hook, generated extension, marketplace registration output, dependency materializer, or package-intent workflow.
- R-SCOPE-2 (MUST): no Playbook/Protocol packaging operation, command, MCP tool, manifest field, planner action, writer, adapter declaration, or product support claim appears in the current public or internal registry surface.
- R-SCOPE-3 (MUST): general Skill installation resolves authored Skill payloads from the effective Skills manifest. It does not compile procedural documents or derive agentic payloads from Playbook/Protocol sources.
- R-SCOPE-4 (MUST): no plugin, workflow bundle, generated package, or adapter surface is retained merely for future compatibility. Admission requires the traced current purpose and authority in PRD 30.

### Harness Adapter Boundary (R-ADAPTER)

- R-ADAPTER-1 (MUST): Make Docs maintains no packaging-specific harness capability descriptor, adapter module, marketplace registry, output-shape registry, hook lowering, or generated registration seam.
- R-ADAPTER-2 (MUST): current harness knowledge is limited to evidence-backed routing, Skill exposure, CLI/MCP projection, and maintainer conformance needs owned by their current PRDs. It must not revive a compiler or plugin substrate.
- R-ADAPTER-3 (MUST): an untraced adapter, hook, extension, plugin importer, or packaging registration is absent or a removal candidate. Tests, fixtures, archived plans, and historical generated files are not production consumers.
- R-ADAPTER-4 (MUST): immediately before implementation-time deletion, one current import/registration trace confirms the candidate has no production consumer. A newly found consumer stops that deletion and routes to its existing owner PRD.

### Legacy Generated Output Compatibility (R-LEGACY)

- R-LEGACY-1 (MUST): user-authored, modified managed, ambiguous, mixed-ownership, or unknown generated plugin, Skill bundle, adapter, hook, extension, marketplace, or registration artifacts are preserved and never inferred as Make Docs-owned from path or shape alone.
- R-LEGACY-2 (MUST): only verified clean Make Docs-owned outputs may be removed under an accepted migration snapshot after backup. Symlink exposure is unlinked without following the target, and no parent with unmanaged descendants is pruned.
- R-LEGACY-3 (MUST): legacy manifest provenance, source references, digests, and package-plan records remain historical evidence only. They do not establish current validity, installability, recognition, or support.
- R-LEGACY-4 (MUST): migration does not compile, regenerate, upgrade, or semantically convert a legacy generated output. Preserve/export, verified removal, skip, or stop are the available dispositions.

### Skill and System Workflow Boundary (R-SKILL)

- R-SKILL-1 (MUST): current first-party Skills are authored Skills with explicit manifest identity and trust metadata; they are not projections of a Playbook, Protocol, plugin, or workflow bundle.
- R-SKILL-2 (MUST): the first-party Naive-UAT Skill remains a thin CLI-delegating adapter with no copied UAT policy, templates, state machine, evidence semantics, findings, gates, or anti-coaching logic.
- R-SKILL-3 (MUST): reusable workflow policy lives in system contracts, prompts, references, and templates, while deterministic behavior lives behind typed CLI/shared-core operations.

### Conformance and Support Boundary (R-SUPPORT)

- R-SUPPORT-1 (MUST): current conformance definitions contain no Playbook package, plugin marketplace, generated skills-bundle, compiler, adapter-installation, or dependency-materialization scenario.
- R-SUPPORT-2 (MUST): public support claims cover only current evidence-backed installed-product, Skill, CLI, MCP, system-resource, and optional-agentics surfaces. Unit tests or historical package results never imply harness recognition.

## Non-Requirements

- No Playbook/Protocol package plan or compiler.
- No generated plugin, Skill bundle, hook, extension, marketplace, or registration artifact.
- No packaging-specific harness descriptor or adapter registry.
- No dependency materialization from a procedural document model.
- No regeneration or semantic upgrade of legacy generated outputs.
- No packaging-specific conformance or support tuple.

## Acceptance Criteria

- Current registries, commands, MCP tools, manifests, conformance scenarios, and support claims expose no Playbook/Protocol packaging surface.
- General selected Skills continue to install from the effective Skills manifest without procedural compilation.
- Untraced adapters and package importers remain absent or removal candidates, with one current trace required immediately before deletion.
- User-authored, modified, ambiguous, mixed, and unknown legacy outputs are preserved; only verified clean managed outputs are eligible for backed-up removal.
- The optional Naive-UAT Skill delegates only to typed CLI operations and does not duplicate policy.

## Contracts and Data

The R-SCOPE, R-ADAPTER, R-LEGACY, R-SKILL, and R-SUPPORT requirements are normative. Former package plans, compiler schemas, adapter declarations, and generated-output provenance are historical compatibility records only.

## Integrations

PRDs 08 and 28 own current Skills distribution and exposure; PRD 30 owns optional integration admission; PRD 18 owns migration classification and preservation; PRDs 20, 43, and 44 own current support evidence; and PRDs 34 and 35 own the adjacent legacy procedural and execution boundaries.

## Rebuild Notes

A clean-room rebuild must keep authored Skills distinct from former Playbook compilation, admit no untraced adapter, preserve ambiguous legacy outputs, and avoid using historical harness shapes or package records as current support evidence.

## Requirement History

### 2026-08-08 — Not assigned

- Affected requirement or section: `Consolidated capability ownership`
- Previous contract: Current requirements were also represented by standalone editorial PRDs 29, 33, 41.
- Replacement contract: The applicable current requirements are inline in this authority and its linked product owners; the standalone editorial records are retired from the active set.
- Rationale: Active PRDs own product subjects and do not preserve editorial operations as product authority.
- Source: [PRD Authority Maintenance](../../.make-docs/references/system/prd-change-management.md)

### 2026-08-08 — W18 R8

- Affected requirement or section: `Document identity and current authority`
- Previous contract: The capability was represented as a standalone editorial change record whose title and structure described how the PRD set was modified.
- Replacement contract: This document stated Playbook package planning, deterministic compilation, dependency materialization, generated plugins and skills bundles, marketplace registration, and harness adapters as current Make Docs authority.
- Rationale: Active PRDs describe the current product shape; editorial operations belong in plans, work, and history.
- Source: [Playbook packaging design](../designs/2026-07-01-playbook-packaging-compiler-and-harness-adapters.md)

### 2026-08-14 — W19 R1

- Affected requirement or section: `Purpose; Current Packaging Boundary; Harness Adapter Boundary; Legacy Generated Output Compatibility`
- Previous contract: Make Docs required a Playbook packaging compiler, package plans, generated plugins and skills bundles, dependency materialization, marketplace outputs, and packaging-specific harness adapters.
- Replacement contract: Make Docs has no Playbook/Protocol packaging product or adapter registry; current Skills remain authored and explicitly selected, while legacy generated outputs are preserved or removed only through verified migration and untraced adapters require a current deletion trace.
- Rationale: The accepted v2 boundary retains useful general Skills and evidence-backed agentics while removing Playbook-only packaging, adapters, scenarios, and support promises.
- Source: [W19 R1 recovery design](../designs/2026-08-12-make-docs-v2-product-boundary-and-missing-migration-recovery.md) and [accepted W19 R1 plan](../plans/2026-08-13-w19-r1-make-docs-v2-product-boundary-and-missing-migration-recovery/00-overview.md)

## Source Anchors

- [W19 R1 recovery design](../designs/2026-08-12-make-docs-v2-product-boundary-and-missing-migration-recovery.md)
- [W19 R1 plan](../plans/2026-08-13-w19-r1-make-docs-v2-product-boundary-and-missing-migration-recovery/00-overview.md)
- [../designs/2026-07-01-playbook-packaging-compiler-and-harness-adapters.md](../designs/2026-07-01-playbook-packaging-compiler-and-harness-adapters.md)
- [../designs/2026-06-29-playbook-packaging-and-harness-adapter-registry.md](../designs/2026-06-29-playbook-packaging-and-harness-adapter-registry.md)
- [../designs/2026-06-30-playbook-contract-and-model.md](../designs/2026-06-30-playbook-contract-and-model.md)
- [../designs/2026-07-01-run-playbook-state-machine.md](../designs/2026-07-01-run-playbook-state-machine.md)
- [../assets/artifacts/playbook-architecture.md](../assets/artifacts/playbook-architecture.md)
- [../assets/artifacts/cli-command-reorganization.md](../assets/artifacts/cli-command-reorganization.md)
- [../assets/artifacts/runtime-and-global-store.md](../assets/artifacts/runtime-and-global-store.md)
- [../plans/2026-07-01-w18-r8-playbook-packaging-compiler-and-harness-adapters/00-overview.md](../plans/2026-07-01-w18-r8-playbook-packaging-compiler-and-harness-adapters/00-overview.md)
- [../work/2026-07-01-w18-r8-playbook-packaging-compiler-and-harness-adapters/00-index.md](../work/2026-07-01-w18-r8-playbook-packaging-compiler-and-harness-adapters/00-index.md)
- [34 Procedural Asset Boundary](34-playbook-authoring-contract-and-model.md)
- [35 Workflow Execution and Legacy Run Boundary](35-run-playbook-state-machine-and-portability.md)
- [28 Shared Agentics Installation Harness Redirection](28-shared-agentics-installation-and-harness-exposure.md)
- [30 Agentic Extensibility Boundary](30-plugin-substrate-and-workflow-bundles.md)
- [20 Agent Harness Model Conformance Lab](20-agent-harness-conformance-and-support-claims.md)
- [25 CLI Separation and MCP Boundary](25-typescript-runtime-cli-mcp-operation-boundaries.md)
- `packages/cli/src/operations/playbook-packaging/index.ts`
- `packages/cli/src/operations/playbook/index.ts`
- `packages/cli/src/manifest.ts`
- `packages/cli/src/audit.ts`
- `scripts/smoke-pack.mjs`

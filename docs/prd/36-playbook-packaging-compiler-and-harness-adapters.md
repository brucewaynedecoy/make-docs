---
title: "36 Playbook Packaging Compiler and Harness Adapters"
kind: "prd"
status: "active"
source:
  type: "design"
  path: "docs/designs/2026-07-01-playbook-packaging-compiler-and-harness-adapters.md"
---

# 36 Playbook Packaging Compiler and Harness Adapters

## Purpose

This document defines the current product contract for playbook packaging, deterministic compilation, and harness adapters. Normative requirements are stated in the sections below; Requirement History is provenance only.
## Scope

This authority owns playbook packaging, deterministic compilation, and harness adapters. Related PRDs own adjacent capabilities and are linked where a cross-boundary contract is required.
## Component and Capability Map

The requirements below define the owned components, behaviors, boundaries, and evidence expectations for this capability.
## Requirements

The requirements below are the normative authority. Their stable identifiers preserve traceability to the originating [playbook packaging and adapters design](../designs/2026-07-01-playbook-packaging-compiler-and-harness-adapters.md), which is provenance rather than product authority.

### Scope, Boundaries, and Packaging Invariants (R-SCOPE, R-KEEP)

- R-SCOPE-1 (MUST NOT): this authority owns the packaging compiler and multi-file distributable inventory, deterministic and agent-assisted generation boundary, dependency materialization, harness capability and distributable model, verified adapter contracts, marketplace and registration seam, and provenance, lifecycle, and support binding. [34-playbook-authoring-contract-and-model.md](34-playbook-authoring-contract-and-model.md) owns the Playbook document and model; [35-run-playbook-state-machine-and-portability.md](35-run-playbook-state-machine-and-portability.md) owns run-time execution; PRDs [20](20-agent-harness-conformance-and-support-claims.md), [43](43-conformance-scenario-model-and-execution-kits.md), and [44](44-conformance-lab-sessions-and-evidence.md) own conformance; [39-cli-command-model-and-operation-registry.md](39-cli-command-model-and-operation-registry.md) owns registry materialization and CLI grammar; and [38-global-store-and-project-state.md](38-global-store-and-project-state.md) owns the global store. This authority does not redefine those contracts.
- R-KEEP-1 (MUST): the reviewed pipeline proceeds from source validation through package intent, package plan, harness-adapter resolution, output writing, manifest and provenance recording, and package/lifecycle/conformance validation. Deterministic rails parse and validate, resolve assets and links, compute digests, classify ownership, evaluate output kinds, select surfaces, write accepted outputs, record manifest ownership, audit, back up before destructive changes, uninstall only Make Docs-owned outputs, and validate. Agent assistance is limited to package-plan drafting, proposals gain authority only through plan acceptance, and unresolved judgment stops non-interactive writes. The target model separates a real harness from its surface profile: `generic` is not a harness; `outputKind` is `plugin` or `skills-bundle`; `surface` is `native`, `agents-standard`, or `auto`; and `scope` is `project`, `global`, or `export-only`. The adapter registry owns harness-specific behavior; the planner and surface resolver remain harness-neutral. Generated outputs carry provenance, workflow bundles do not map one-to-one to plugins, and support claims bind to exact conformance tuples.

### Package Plan Contract (R-PLAN)

- R-PLAN-1 (MUST): Playbook packaging is a required v2 capability, but packaging is optional for an individual Playbook and never determines whether that Playbook is valid. Source Playbooks remain authoritative under `docs/assets/playbooks/<persona>/<slug>.playbook.md`; generated plugins, skills bundles, adapters, exposure mirrors, and export-only packages are distribution artifacts.
- R-PLAN-2 (MUST): the package planner produces a reviewable package plan before any write. Every plan records `sourcePlaybookRefs`, `sourceDigests`, `packageId`, `title`, `summary`, `outputKind`, `targetHarness`, `selectedSurface`, `scope`, `generatedArtifactInventory`, `deterministicDerivations`, `agentAssistedProposals`, `unresolvedDecisions`, `reviewStatus`, `supportStatus`, `lifecycleBehavior`, and `validationRequirements`.
- R-PLAN-3 (MUST): deterministic derivations include source parsing and validation, persona/slug and stack resolution, asset and relative-link validation, ownership classification, digest calculation, adapter compatibility, output-inventory planning, manifest provenance, audit classification, backup-before-destructive-change behavior, safe uninstall, and package/conformance validation. Agent-assisted values remain proposals until the plan is explicitly accepted.
- R-PLAN-4 (MUST): non-interactive planning or shipping fails before writing when semantic review, an unresolved user decision, ambiguous ownership, an unsafe rewrite, an unsupported surface, an unverified adapter contract, or missing required conformance evidence remains. An accepted plan never grants authority beyond its exact target, scope, surface, inventory, and source digests.

### Harness Adapter Declaration Schema (R-DECL)

- R-DECL-1 (MUST): each adapter declaration records `harnessId`, `supportedOutputKinds`, `supportedSurfaces`, supported `scopes` (`project`, `global`, `export-only`), the native container and verified path/layout declarations including manifest filenames, lifecycle-event mappings, preconditions, `preferredExposureMode`, `fallbackMode`, registration model and steps, ownership classes, audit rules, backup rules, uninstall rules, conformance scenario bindings, a verification reference and status, and the lab-facing interrogation block used to list installed plugins or skills and locate invocation evidence.
- R-DECL-2 (MUST): path/layout declarations, manifest shapes, and registration steps are verified against the real harness; they are not speculative path templates. Unverified declarations may plan only export-only or provisional outputs and cannot support an install or recognition claim.
- R-DECL-3 (MUST): harness-specific behavior lives in adapter modules that implement this declaration. Adding a harness primarily adds its declaration and adapter module, fixtures, and conformance bindings; it must not add harness conditionals to the package planner or create a second harness-knowledge registry.

### Packaging Is a Compiler (R-COMP)

- R-COMP-1 (MUST): the output writer produces a real, harness-native, multi-file distributable and MUST NOT emit a Make Docs descriptor as the installable artifact.
- R-COMP-2 (MUST): exposure uses a canonical payload under the staging area, an exposure mirror placed at the harness path by symlink or copy-mirror, and manifest ownership records tracking both, per [28-shared-agentics-installation-and-harness-exposure.md](28-shared-agentics-installation-and-harness-exposure.md). The canonical payload is a faithful harness-native artifact tree.
- R-COMP-3 (MUST): the distributable is a multi-file tree whose contents are a function of the Playbook model and the target, and the compiler can emit, as applicable: a `SKILL.md` per source Playbook preserving workflow intent, trigger description, step instructions, references, and safety boundaries; references extracted or copied from authority sources where redistribution is allowed and linked otherwise; deterministic helper scripts and dependency-check scripts with provenance; tool and dependency declarations per R-DEPMAT-1; hooks generated from event-bound steps per R-CAP-5; the harness-native manifest the target requires; marketplace or registration files per R-MKT-1; lifecycle records; and conformance records.

### Deterministic and Agent-Assisted Generation (R-GEN)

- R-GEN-1 (MUST): generation is two-tier with the boundary recorded in field provenance — schema-owned fields (file paths, manifest structure, dependency checks, provenance, digests) are generated deterministically, and semantic fields (skill descriptions and triggers, the grouping of Playbooks into a bundle, harness-facing prose) are review-gated agent-assisted proposals.
- R-GEN-2 (MUST): the compiler fails closed before any write when unresolved semantic decisions, ownership conflicts, missing dependencies, unsupported surfaces, or missing conformance evidence require review.

### Dependency Materialization (R-DEPMAT)

- R-DEPMAT-1 (MUST): the dependency kind declared in the Playbook dependency registry determines materialization — `cli` and `package-manager` emit as deterministic check scripts plus human instructions, with a `cli` dependency on Make Docs itself referencing operation identifiers from the registry rather than CLI command strings so generated outputs survive CLI reorganization; `skill` and `plugin` emit as harness-native manifest references where the target supports them and degrade explicitly where it does not; `mcp` and `external-service` emit as Make Docs metadata plus a runtime availability check; `reference` is copied or extracted where redistribution is allowed and linked otherwise; and `playbook` is included as an additional skill when bundled or referenced when not.

- R-DEPMAT-2 (MUST): the probe target for generated `cli` and `package-manager` checks is the dependency's declared `probe` field from the dependencies block, defaulting to the dependency `id`; no code derives a target from `source` prose or parses `source` for machine meaning. For `skill` and `plugin` kinds, `probe` carries the manifest reference identifier. R-DEPMAT-1 otherwise requires per-kind emission, operation identifiers over CLI strings, and explicit degradation.

### Harness Capability and Distributable Model (R-CAP)

- R-CAP-1 (MUST): packaging-time hosting of agentic primitives and run-time execution of a step's required surface share one harness registry. [35-run-playbook-state-machine-and-portability.md](35-run-playbook-state-machine-and-portability.md) owns the run-time decision; this authority owns the packaging decision.
- R-CAP-2 (MUST): each harness has a capability descriptor declaring its identifier, the agentic primitives it supports, its native distributable container and the container's file layout including paths and manifest filenames, a lifecycle event map from logical events to harness hook points, the exposure modes it supports, its registration model, and its preconditions; the descriptor is the single place harness-specific packaging knowledge lives.
- R-CAP-3 (MUST): authoring granularity and distribution granularity are separate — one Playbook projects to one skill as the authoring unit, a distributable is the distribution unit containing one or more skills plus the agentics the Playbook's steps imply, and a bundle is multiple Playbooks compiled into one distributable with multiple skills; `outputKind` `plugin` is interpreted as the harness's richest native container, which the adapter realizes as a plugin, an extension, or another native container per the descriptor, and `skills-bundle` is interpreted as the portable agents-standard skills form — the native and portable distributable profiles.
- R-CAP-4 (MUST): the adapter selects the richest container the harness supports for the chosen profile, maps the Playbook's implied agentics onto the harness's supported primitives, and handles the unsupported case explicitly — degrading to a documented manual step or skill instruction, or failing closed with an unsupported-surface stop — with the choice always declared, never silent.
- R-CAP-5 (MUST): event-bound steps compile to the harness's hook points where the descriptor declares hook support, and degrade or fail closed per R-CAP-4 where it does not.

- The capability descriptor carries a verification-marked lab-facing interrogation block describing how to list installed plugins and skills, where the harness logs invocation, and other interrogation knowledge required by [43-conformance-scenario-model-and-execution-kits.md](./43-conformance-scenario-model-and-execution-kits.md). R-CAP-2's single-home rule applies to this lab knowledge: the kit generator consumes the descriptors, and a kit-local table of harness facts is prohibited. The conformance kit generator is the packaging pipeline's first end-to-end internal consumer; this PRD remains the owner of the compiler, adapters, and distributable model.

- R-ADAPT-1 (MUST): every adapter's paths, manifest shapes, and registration steps are verified against the real harness, not assumed from a path template; each adapter declaration carries a verification reference naming where the contract was confirmed and a verification status, and an adapter whose contract is unverified may produce only export-only or provisional output and MUST NOT carry a support claim.
- R-ADAPT-2 (MUST): the Codex adapter follows the verified Codex contract — a plugin is a folder containing `.codex-plugin/plugin.json`, registered through a marketplace entry such as `.agents/plugins/marketplace.json` or a configured marketplace source, and a skills bundle uses direct `.agents/skills/{id}/SKILL.md` discovery with symlink or copy-mirror exposure. A descriptor payload or bare `.agents/plugins/{packageId}` placement is invalid.
- R-ADAPT-3 (MUST): the Claude Code adapter lowers a plugin to `.claude/plugins/{id}/plugin.json` and a skill to `.claude/skills/{id}/SKILL.md`, or to agents-standard `.agents/skills` for the portable profile; Claude Code supports hooks, so event-bound steps lower to its hook points, and the adapter must be reviewed against the actual Claude Code plugin and skill contract before its support status moves beyond provisional.
- R-ADAPT-4 (MUST): the Pi adapter supports skills, MCP, and extensions but not hooks; its richest native container is an extension bundled with one or more skills, and event-bound steps degrade to a documented manual step or skill instruction, or fail closed, per R-CAP-4.
- R-ADAPT-5 (MUST): an unknown harness identifier, an unsupported output kind, an unsupported surface, or a scope the adapter cannot honor fails closed before any write, consistent with the existing stop reasons, and a fixture adapter exercises the unsupported path so the fail-closed behavior is itself tested.

### Marketplace and Registration Seam (R-MKT)

- R-MKT-1 (MUST): registration and marketplace files are generated into the distributable, but a user's global marketplace MUST NOT be auto-mutated without an explicit global scope and approval; the default is to generate but not install.
- R-MKT-2 (MAY): the [PRD 38](38-global-store-and-project-state.md)-owned Global Store may expose a config-gated opt-in for auto-registration where a stop-and-approve step would disrupt a deliberate workflow cadence; the opt-in is additive and off by default.

### Provenance, Lifecycle, and Support (R-PROV)

- R-PROV-1 (MUST): every generated artifact carries Playbook provenance — source ref and digest, package profile, adapter id, output kind, generated files, ownership status, and support status.
- R-PROV-2 (MUST): backup and uninstall remove only Make Docs-owned generated outputs, without orphaning empty managed directories or deleting user-authored files; the applicable scenario and reviewed evidence are governed by PRDs 43 and 44.
- R-PROV-3 (MUST): support claims remain provisional until conformance evidence exists and bind to the exact tuple of scenario, harness, surface, scope, output kind, generated-output kind, model or provider, and runtime, further narrowed by the source refs, digests, package plan, and adapter provenance recorded for the distributable.

### Template Package and Source Boundary

- Accepted shipped Playbook defaults are authored first in `packages/docs/template/docs/assets/playbooks/**`, re-seeded into the repo-root dogfood `docs/assets/playbooks/**` for review, copied into `packages/cli/template/**` only through the build/prepack flow, and validated in both local-development and packed-npm execution.
- Generated distributables never replace the upstream Playbook source of truth. Existing accepted Playbooks use the current `docs/assets/playbooks/**` and v2 authoring contract directly; no parallel legacy Playbook home or compatibility parser is created.
- Manifest, catalog, audit, backup, uninstall, installer, CLI, MCP, plugin, and template behavior changes only when implementation changes how Playbooks or their generated distributables are shipped, selected, enumerated, installed, or executed. [39-cli-command-model-and-operation-registry.md](39-cli-command-model-and-operation-registry.md) owns package command spellings and rendering; this PRD owns the package-plan, compiler, adapter, and fail-before-write semantics those commands invoke.

### Verification and Testability (R-TEST)

- R-TEST-1 (MUST): a test asserts that a generated distributable is a multi-file, harness-native tree and not a Make Docs descriptor.
- R-TEST-2 (MUST): a test asserts that generated Codex plugin output contains `.codex-plugin/plugin.json` and a marketplace registration entry, and that the Codex skills-bundle output uses `.agents/skills/{id}/SKILL.md`.
- R-TEST-3 (MUST): tests cover adapter fail-closed behavior for an unknown harness, an unsupported output kind, and an unsupported surface, using the fixture adapter.
- R-TEST-4 (MUST): tests cover dependency materialization per kind, the deterministic-versus-agent-assisted generation gate, provenance and ownership records, and backup and uninstall cleanliness.
- R-TEST-5 (MUST): real-harness recognition, installation, and invocation require the conformance scenarios and reviewed evidence governed by PRDs 43 and 44, not unit tests; unit and integration tests here MUST NOT be read as evidence that a harness recognizes the output.

The harness-native multi-file distributable, verified adapter contracts and harness shapes, single-home capability descriptor, authoring-versus-distribution granularity, native-versus-portable `outputKind` profiles, fail-before-write review boundary, and generate-but-do-not-auto-register default are non-substitutable. Implementations may choose the internal compiler structure, exact generated-file organization within verified harness constraints, agent-assisted proposal wording, and adapter-module internals.

Code anchors:

- `packages/cli/src/operations/playbook-packaging/index.ts`
- `packages/cli/src/operations/playbook/index.ts`
- `packages/cli/src/manifest.ts`
- `packages/cli/src/audit.ts`
## Contracts and Data

The named paths, schemas, state records, metadata fields, and evidence shapes in Requirements are normative contracts for this capability.
## Integrations

This capability integrates with the adjacent current authorities linked from Requirements and Source Anchors; those authorities remain owners of their own boundaries.
## Rebuild Notes

A rebuild must preserve the requirement identifiers, stable semantic anchors, ownership boundaries, and failure-safe behavior stated here. Implementation evidence does not silently weaken this authority.
## Package Grammar Boundary

Package-oriented CLI grammar and rendering are owned by PRD 39. This authority owns deterministic compilation and adapter packaging, which must remain invocable through the shared operation registry without harness-specific semantic drift.

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
- Replacement contract: This document now states the current playbook packaging, deterministic compilation, and harness adapters requirements inline as product authority.
- Rationale: Active PRDs describe the current product shape; editorial operations belong in plans, work, and history.
- Source: [Playbook packaging design](../designs/2026-07-01-playbook-packaging-compiler-and-harness-adapters.md)
## Source Anchors

- [../designs/2026-07-01-playbook-packaging-compiler-and-harness-adapters.md](../designs/2026-07-01-playbook-packaging-compiler-and-harness-adapters.md)
- [../designs/2026-06-29-playbook-packaging-and-harness-adapter-registry.md](../designs/2026-06-29-playbook-packaging-and-harness-adapter-registry.md)
- [../designs/2026-06-30-playbook-contract-and-model.md](../designs/2026-06-30-playbook-contract-and-model.md)
- [../designs/2026-07-01-run-playbook-state-machine.md](../designs/2026-07-01-run-playbook-state-machine.md)
- [../assets/artifacts/playbook-architecture.md](../assets/artifacts/playbook-architecture.md)
- [../assets/artifacts/cli-command-reorganization.md](../assets/artifacts/cli-command-reorganization.md)
- [../assets/artifacts/runtime-and-global-store.md](../assets/artifacts/runtime-and-global-store.md)
- [../plans/2026-07-01-w18-r8-playbook-packaging-compiler-and-harness-adapters/00-overview.md](../plans/2026-07-01-w18-r8-playbook-packaging-compiler-and-harness-adapters/00-overview.md)
- [../work/2026-07-01-w18-r8-playbook-packaging-compiler-and-harness-adapters/00-index.md](../work/2026-07-01-w18-r8-playbook-packaging-compiler-and-harness-adapters/00-index.md)
- [34 Playbook Contract and Model](34-playbook-authoring-contract-and-model.md)
- [35 Run Playbook State Machine](35-run-playbook-state-machine-and-portability.md)
- [28 Shared Agentics Installation Harness Redirection](28-shared-agentics-installation-and-harness-exposure.md)
- [30 Harness Plugin Substrate Workflow Bundles](30-plugin-substrate-and-workflow-bundles.md)
- [20 Agent Harness Model Conformance Lab](20-agent-harness-conformance-and-support-claims.md)
- [25 CLI Separation and MCP Boundary](25-typescript-runtime-cli-mcp-operation-boundaries.md)
- `packages/cli/src/operations/playbook-packaging/index.ts`
- `packages/cli/src/operations/playbook/index.ts`
- `packages/cli/src/manifest.ts`
- `packages/cli/src/audit.ts`
- `scripts/smoke-pack.mjs`

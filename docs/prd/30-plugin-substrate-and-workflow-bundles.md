# 30 Plugin Substrate and Workflow Bundles

## Purpose

This document defines the current product contract for the plugin substrate, workflow bundles, and their lifecycle boundaries. Normative requirements are stated in the sections below; Requirement History is provenance only.
## Scope

This authority owns the plugin substrate, workflow bundles, and their lifecycle boundaries. Related PRDs own adjacent capabilities and are linked where a cross-boundary contract is required.
## Component and Capability Map

The requirements below define the owned components, behaviors, boundaries, and evidence expectations for this capability.
## Requirements

### Plugin Definition and Boundary

A v2 plugin is a harness-visible invocation package. It is not a playbook, not a lifecycle artifact, and not a substitute behavior model.

A plugin may wrap a built-in workflow, invoke the generic Run Playbook model, expose one or more playbooks, present a guided entrypoint for a productized workflow bundle, or delegate deterministic behavior to CLI/MCP/shared-core operations. The governing contracts remain the accepted docs, lifecycle, manifest, configuration, audit, package, CLI/MCP, conformance, and playbook requirements.

Plugin exposure is additive. A playbook remains valid and runnable without plugin packaging, there is no one-plugin-per-playbook rule, and a single plugin or workflow bundle may expose multiple playbooks. Plugins may invoke the generic Run Playbook model, but they may not redefine canonical playbook storage, frontmatter or schema, stack validation, authority order, gate semantics, output routing, resolver identity, or playbook validity.

CLI, MCP, plugin, skill, template-sync, unattended, or model/provider support claims remain provisional until implementation or conformance evidence exists for the exact claimed surface and tuple. Packaging creates generated distribution artifacts with source-playbook provenance; it never replaces the source playbook as authority.

When a plugin invokes a playbook, it must use the resolver and run-state contracts owned by [PRD 34](34-playbook-authoring-contract-and-model.md) and [PRD 35](35-run-playbook-state-machine-and-portability.md) rather than defining plugin-local playbook identity or execution state.

### Canonical Plugin Payload Store

Selected plugin payloads are installed once into the shared make-docs-owned selected-agentics store:

- project scope: `.make-docs/agentics/plugins/<plugin-id>/`
- global scope: the user's home-scoped `.make-docs/agentics/plugins/<plugin-id>/`

Supported harnesses receive native exposure or generated adapters, not duplicated authoritative plugin payloads. Codex and Claude Code are the initial supported harness targets because they are the current make-docs harnesses.

The harness exposure layer is the harness boundary. The canonical plugin payload remains in the shared selected-agentics store. Plugin implementation uses native harness exposure with symlink support and managed copy-mirror fallback; any change to that product contract requires authoritative maintenance of this PRD and PRD 28.

### Plugin Metadata and Manifest Ownership

The manifest schema must grow structured agentic ownership records instead of overloading skill-only state indefinitely.

Plugin records must identify:

- canonical plugin id, title, summary, status, source manifest, source ref or version, digest, provenance, trust policy, supported harnesses, and scope
- canonical payload files under `.make-docs/agentics/plugins/<plugin-id>/`
- native harness exposure paths and their target canonical payload
- exposure mode, with `symlink` preferred and `copy-mirror` fallback unless a plugin-specific adapter requires a generated exposure file
- invocation metadata describing whether the plugin wraps a built-in workflow, one or more playbooks, generic Run Playbook, or a CLI/MCP operation
- generated-from metadata when a plugin is produced by the [PRD 36 package planner](36-playbook-packaging-compiler-and-harness-adapters.md), including source Playbook refs, source digests, package plan id, target harness, output kind, selected surface, adapter id, review status, and support status
- playbook orchestration metadata only by reference to the PRD 34/35 Run Playbook model; plugin metadata must not redefine resolver keys, stack values, harness capability ids, run-state shape, nested-run behavior, or concurrency safety
- bundle metadata when the plugin belongs to a productized workflow bundle
- permission and safety metadata describing whether the plugin is read-only, request-capture only, plan-first, dry-run first, temp-fixture only, or write-capable after explicit approval
- support metadata distinguishing `provisional`, `implementation-validated`, and `conformance-validated` claims per harness and, where applicable, model/provider tuple

Until the schema exists, transitional records may be used, but audit, backup, uninstall, dry-run output, and migration diagnostics must preserve the distinction between canonical plugin payloads, symlink exposures, copy mirrors, plugin-specific generated adapters, and legacy generated exposure files.

### Explicit Plugin Selection

Plugin selection is explicit.

Bare install and default sync install no plugins. `--selected-skills all` and existing skill-selection affordances do not imply plugin installation.

Plugin installation requires a future accepted plugin selection flow, an effective plugin manifest, or explicit user instruction. Reconfigure and sync preserve existing selected plugins unless the user changes the selection or an accepted migration plan defines a reviewed transition.

### Lifecycle and Operation Ownership

Plugin lifecycle behavior follows the TypeScript package runtime and modular operation-domain surface.

Install, update, sync, reconfigure, backup, audit, uninstall, migration review, package validation, and conflict handling remain TypeScript CLI-owned. A plugin may call MCP or shared-core operations only through accepted operation contracts.

A plugin must not carry independent deterministic logic that bypasses no-scripts migration or creates a second implementation of manifest, configuration, audit, backup, uninstall, generation, validation, or lifecycle routing behavior.

### Update, Migration, Audit, Backup, and Uninstall

Update behavior reconciles selected plugins against the effective plugin manifest and manifest-owned state.

A clean managed plugin payload, symlink exposure, copy mirror, or generated adapter may be updated in place. A modified managed payload, modified copy mirror, modified generated adapter, malformed manifest, missing-manifest ambiguous state, or user-authored harness plugin must flow through review, backup, skip, or manual-resolution paths.

Migration and update must never infer ownership over a user-authored harness file just because its name matches a make-docs plugin id.

Uninstall removes only reviewed, make-docs-owned plugin payloads and harness exposures. Backup and uninstall must consume one reviewed audit snapshot before destructive removal. Empty make-docs-owned plugin directories may be pruned only when audit proves there are no unmanaged descendants.

Selected-plugin lifecycle uses `.make-docs/backup/**`, protects legacy root `.backup/**`, and prunes empty Make Docs-owned plugin or agentics directories only when the reviewed snapshot proves no unmanaged descendants remain.

Installed generated plugin and skills-bundle outputs inherit the same lifecycle rules. Backup, uninstall, migration, and cleanup preserve source playbooks and user-modified generated outputs for review, remove only clean manifest-owned generated artifacts, and never prune a parent containing unmanaged harness content.

### Configuration Boundary

Configuration overlays are rendering inputs, not routing authority.

A project may relabel "designs" as "ideas" or change user-facing persona labels, but plugins still route through canonical paths, kind values, lifecycle route identifiers, prompt paths, plugin ids, playbook ids, skill names, harness names, and manifest keys.

A plugin may display configured labels after canonical resolution. It cannot use configuration to rename the structure it reads or writes.

### Workflow Bundle Metadata

Workflow bundles are products on top of the plugin substrate.

Workflow bundles are product capability groupings, not automatic plugin boundaries. A larger first-party plugin may contain multiple bundle families, a bundle may be exposed through generated skills bundles for harnesses without plugin support, and user/project Playbooks may be packaged independently when a reviewed package plan selects that shape.

Initial v2 bundle families are:

- Idea/Brainstorm: captures and refines an idea or request into a lifecycle-ready input. It is request-capture or plan-first by default and must not silently mutate build-stack artifacts.
- Scaffold: creates or expands a make-docs documentation system from accepted inputs. It is maintainer-facing by default unless a later bundle plan defines constrained non-maintainer behavior with explicit gates.
- Change Request/Iterate: captures a bounded change request and, when authorized, routes it through design, plan, PRD, work, and implementation according to lifecycle contracts. It must distinguish "file a request" from "make the change" in metadata and UI.
- Use/Run: exposes run-stack workflows for users operating an installed or already-available system. It may call the generic Run Playbook model, but it cannot redefine playbook storage or make a plugin mandatory for playbook validity.

Every productized bundle must declare its audience and exposure boundary. At minimum, bundle metadata must identify whether the workflow is maintainer-only, non-maintainer request-capture, non-maintainer guided-change, or end-user run-stack usage.

Non-maintainer plugins are sanctioned entrypoints with explicit gates, not hidden write channels into lifecycle artifacts. Q-013 remains open for exact per-bundle UX.

### Playbook Boundary

Playbooks remain valid source documents independently of plugin exposure or packaging. A plugin may invoke one Playbook, offer a catalog of Playbooks, or wrap a built-in workflow that is not authored as a Playbook, but it does not become the authority for Playbook storage, schema, validity, output routing, or execution state.

When a plugin or workflow bundle invokes a Playbook, it must delegate document identity, schema, dependency, and validation rules to [34-playbook-authoring-contract-and-model.md](34-playbook-authoring-contract-and-model.md), and it must delegate resolver identity, run state, progression, gates, nesting, and concurrency to [35-run-playbook-state-machine-and-portability.md](35-run-playbook-state-machine-and-portability.md). Generated plugin and skills-bundle outputs are projections governed by [36-playbook-packaging-compiler-and-harness-adapters.md](36-playbook-packaging-compiler-and-harness-adapters.md); they retain source references, source digests, and package-plan provenance and cannot redefine the source Playbook's validity.

### Support Claims

Support claims are evidence-bound.

Public language about plugin, bundle, playbook, skill, harness, CLI, MCP, unattended, or model/provider support must cite implementation validation or conformance-lab evidence. Until [20-agent-harness-conformance-and-support-claims.md](20-agent-harness-conformance-and-support-claims.md) has scenario records for a plugin/harness/model tuple, support wording for that tuple must remain provisional.

If adversarial review is implemented as a plugin or workflow bundle, it must remain explicit-selection only and must follow [14-lifecycle-workflow-and-coverage-passes.md](14-lifecycle-workflow-and-coverage-passes.md). Bare install, default sync, generic Run Playbook, and plugin selection do not imply adversarial review.

### Package and Validation Boundary

Package validation must prove plugin behavior without accidentally shipping the wrong assets.

Before first-party plugin payloads or plugin manifests become shipped assets, the owning PRDs 06, 10, and 30 must define their source location and package inclusion rules using the template/package source-of-truth order from [06-template-contracts-and-generated-assets.md](06-template-contracts-and-generated-assets.md).

Conformance-lab records, generated local run artifacts, unreviewed local plugin outputs, and unreviewed generated package outputs must not be placed into `packages/docs/template/`, `packages/cli/template/`, npm tarballs, or runtime packages by accident.

Generated plugin or skills-bundle outputs enter shipped templates or tarballs only when a reviewed first-party package plan explicitly selects them as shipped assets and package validation proves the inclusion rule.

Required implementation validation includes `npm run build -w packages/cli`, `npm test -w packages/cli`, `npm run validate:defaults -w packages/cli`, `npm run smoke:pack`, and targeted plugin substrate tests.
## Non-Requirements

- No default plugin installation.
- No skill-selection flag that implicitly selects plugins.
- No one-plugin-per-playbook requirement.
- No one-workflow-bundle-per-plugin requirement.
- No plugin requirement for playbook validity.
- No package output generated without a reviewed or fully deterministic safe package plan.
- No default adversarial-review plugin, workflow bundle, or plugin-selection implication.
- No generated-stub default behavior; [PRD 28](28-shared-agentics-installation-and-harness-exposure.md) owns compatibility handling for legacy generated stubs.
- No symlink-only behavior without copy-mirror fallback.
- No MCP write surface implementation in this PRD.
- No closure of per-bundle UX details for request-vs-change, docs visibility, scaffold exposure, or exact non-maintainer flows.
- No plugin-local replacement for Run Playbook resolver, run-state, harness-capability, nested-run, or concurrency behavior.
- No remote-versus-bundled skills delivery decision.
## Acceptance Criteria

- Plugin payloads install under `.make-docs/agentics/plugins/<plugin-id>/` per selected scope.
- Codex and Claude Code receive native plugin exposure or explicit plugin-specific adapters rather than duplicated authoritative payloads.
- Manifest, audit, backup, uninstall, dry-run, and migration output distinguish canonical plugin payloads from symlink exposures, copy mirrors, generated adapters, and legacy generated harness exposures.
- Bare install, default sync, and selected-skill flows write no plugin files.
- Modified/custom harness plugin files are preserved or reviewed rather than inferred as make-docs-owned.
- Workflow bundle metadata declares audience, exposure boundary, safety mode, and whether the flow captures a request or makes a change.
- Workflow bundle metadata delegates playbook execution semantics to PRDs 34 and 35.
- Plugin support claims remain provisional until implementation or conformance evidence exists for the exact tuple claimed.
- Playbooks remain valid without plugin packaging.
- Generated plugins and skills bundles carry source Playbook provenance and do not replace Playbook source.
- Workflow bundle metadata does not force bundle families to map one-to-one to plugin ids.
- Adversarial review remains explicit-selection only if exposed through a plugin or workflow bundle.
## Contracts and Data

The named paths, schemas, state records, metadata fields, and evidence shapes in Requirements are normative contracts for this capability.
## Integrations

This capability integrates with the adjacent current authorities linked from Requirements and Source Anchors; those authorities remain owners of their own boundaries.
## Rebuild Notes

A rebuild must preserve the requirement identifiers, stable semantic anchors, ownership boundaries, and failure-safe behavior stated here. Implementation evidence does not silently weaken this authority.
## Requirement History

### 2026-08-08 — Not assigned

- Affected requirement or section: `Consolidated capability ownership`
- Previous contract: Current requirements were also represented by standalone editorial PRDs 29, 32.
- Replacement contract: The applicable current requirements are inline in this authority and its linked product owners; the standalone editorial records are retired from the active set.
- Rationale: Active PRDs own product subjects and do not preserve editorial operations as product authority.
- Source: [PRD Authority Maintenance](../../.make-docs/references/system/prd-change-management.md)


### 2026-08-08 — W18 R2

- Affected requirement or section: `Document identity and current authority`
- Previous contract: The capability was represented as a standalone editorial change record whose title and structure described how the PRD set was modified.
- Replacement contract: This document now states the current plugin substrate, workflow bundles, and lifecycle boundaries inline as product authority.
- Rationale: Active PRDs describe the current product shape; editorial operations belong in plans, work, and history.
- Source: [Plugin substrate design](../designs/2026-06-20-harness-plugin-substrate-and-workflow-bundles.md)
## Source Anchors

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
- [34 Playbook Authoring Contract and Model](34-playbook-authoring-contract-and-model.md)
- [14 Lifecycle Workflow and Coverage Passes](14-lifecycle-workflow-and-coverage-passes.md)
- [36 Playbook Packaging Compiler and Harness Adapters](36-playbook-packaging-compiler-and-harness-adapters.md)
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

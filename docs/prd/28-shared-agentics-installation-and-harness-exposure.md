# 28 Shared Agentics Installation and Harness Exposure

## Purpose

This document defines the current product contract for canonical shared agentic payloads and native harness exposure. Normative requirements are stated in the sections below; Requirement History is provenance only.
## Scope

This authority owns canonical shared agentic payloads and native harness exposure. Related PRDs own adjacent capabilities and are linked where a cross-boundary contract is required.
## Component and Capability Map

The requirements below define the owned components, behaviors, boundaries, and evidence expectations for this capability.
## Requirements

### Shared Agentics Store

Selected agentic payloads are installed once into a shared make-docs-owned store:

- project scope: `.make-docs/agentics/`
- global scope: the user's home-scoped `.make-docs/agentics/`

Within that store, reserve:

- `skills/<skill-name>/` for selected skill payloads
- `plugins/<plugin-id>/` for future selected plugin payloads
- `manifests/` or equivalent metadata records for resolved purpose, source, trust, integrity, and provenance data

### Native Harness Exposure

Harness directories receive native skill directories, not generic forwarding stubs.

For current harnesses, project-scoped selected skills expose the selected skill under `.claude/skills/<skill-name>/` and `.agents/skills/<skill-name>/`; global selected skills expose equivalent directories under home-scoped harness roots.

The preferred exposure mode is a directory symlink from the harness-native skill directory to the canonical shared payload directory. The fallback exposure mode is a managed copy mirror of the full canonical skill payload. The harness-visible `SKILL.md` must be the real skill entrypoint with meaningful skill frontmatter, not Make Docs installation metadata.

Windows behavior must be explicit. The CLI may use symlinks where supported, including modern Windows configurations with Developer Mode or elevated permissions, and must use managed copy mirrors when symlink creation is unavailable or explicitly disabled. Non-interactive runs must not silently downgrade to generic stubs.

### Manifest Ownership

`selectedSkills` remains the behavior-level selected-skill list.

`skillFiles` remains a managed-output ownership list during transition, but the schema should grow structured agentic ownership records that identify:

- selected artifact kind, name, source manifest, immutable ref, digest, trust/provenance, and scope
- canonical shared payload paths
- symlink exposure paths, link targets, link type, and fallback status
- managed copy-mirror paths and their canonical source payload
- legacy generated stub paths from earlier installs
- PRD 36 generated plugin and skills-bundle output paths when those outputs are installed through the selected-agentics store
- exposure mode, with `symlink` preferred and `copy-mirror` fallback
- harness name and path scope
- previous per-harness duplicated payloads that were migrated, preserved, or skipped

Until that schema exists, implementation may represent shared payload files and harness exposures through `skillFiles`, but it must not lose the distinction in audit, backup, uninstall, migration diagnostics, or user-visible dry-run output.

### Migration and Lifecycle Safety

Migration is state-classification first.

A clean manifest-owned per-harness skill install may migrate to shared payload plus native harness exposure.

A clean manifest-owned legacy generated stub may migrate to symlink exposure or copy mirror. A modified generated stub, modified copy mirror, wrong-target symlink, custom user skill, malformed manifest, or missing-manifest ambiguous state must flow through existing review, backup-and-reinstall, or manual-review disposition rules.

Migration must never infer ownership over a user-authored harness skill because its path matches a make-docs skill name.

Audit, backup, uninstall, and migration must classify shared payloads, symlink exposures, copy mirrors, legacy generated stubs, old duplicated per-harness payloads, modified local skill files, home-scoped skill files, and custom user skills separately.

The single reviewed audit snapshot rule remains mandatory before destructive migration or uninstall. Link-aware lifecycle operations must unlink symlink exposures without following targets and remove only reviewed Make Docs-owned copy mirrors.

After selected-agentics removal, lifecycle operations prune empty managed parents under project- and home-scoped `.make-docs/agentics/**` only when the same reviewed ownership evidence proves there are no unmanaged descendants. Eligible empty parents include `skills/<skill-name>/`, `skills/`, and `agentics/`.

Pruning must preserve sibling selected skills or plugins; in-use manifests or equivalent metadata; user-authored and modified managed files; wrong-target symlinks; ambiguous missing-manifest state; legacy generated stubs or copy mirrors requiring review; and any future agentics content not approved by the reviewed snapshot. Symlink exposures are unlinked without following targets, and copy mirrors are removed only when classified clean.

### Config and Behavior Boundary

Config overlays are read through a make-docs config resolver contract, not plugin-specific or skill-specific routing maps.

Installed skills and plugins may render configured labels only after resolving canonical ids, paths, kinds, purpose ids, skill names, plugin ids, and harness names.

If the config resolver is not yet implemented, shared payloads and harness-exposure diagnostics must preserve canonical wording rather than inventing local config parsing.

Shared payloads may instruct agents to call make-docs CLI or MCP operations for deterministic behavior, but selected artifact discovery must remain native and inspectable without a live CLI process.

### Plugin Inheritance

Plugin installation inherits the shared storage and native harness exposure primitive, while [30-plugin-substrate-and-workflow-bundles.md](30-plugin-substrate-and-workflow-bundles.md) owns full plugin substrate and workflow bundle metadata.

Selected plugin payloads use `.make-docs/agentics/plugins/<plugin-id>/` per scope and native harness exposure; [30-plugin-substrate-and-workflow-bundles.md](30-plugin-substrate-and-workflow-bundles.md) owns any authoritative change to that plugin contract.

[34-playbook-authoring-contract-and-model.md](34-playbook-authoring-contract-and-model.md) owns the playbook content contract and generic Run Playbook model. PRD 30 allows plugin payloads to expose that model, but this PRD continues to own only shared storage and native harness exposure primitives.

[36-playbook-packaging-compiler-and-harness-adapters.md](36-playbook-packaging-compiler-and-harness-adapters.md) owns generated plugin and skills-bundle outputs from Playbooks. When those outputs are installed, they inherit this PRD's shared payload, native exposure, symlink-preferred, copy-mirror fallback, audit, backup, uninstall, migration, and no-default-agentics rules.

### No-Default-Skills

Bare install and default sync write no selected skill payloads and no harness exposures.

Shared agentics are written only when the user explicitly selects skills or later explicitly selects plugins through an accepted manifest and selection flow.
## Non-Requirements

- No generated-stub default behavior.
- No symlink-only behavior without copy-mirror fallback.
- No silent fallback from native exposure to generic stubs.
- No full plugin substrate, workflow bundle metadata, or per-bundle UX contract in this shared-agentics PRD; [30-plugin-substrate-and-workflow-bundles.md](30-plugin-substrate-and-workflow-bundles.md) owns the substrate and bundle boundary.
- No Run Playbook contract in this shared-agentics PRD; [34-playbook-authoring-contract-and-model.md](34-playbook-authoring-contract-and-model.md) owns that contract.
- No MCP write surface.
- No bundled-local versus remote-fetch skills delivery decision.
- No automatic selected skill or plugin installation.
## Acceptance Criteria

- Selected project-scope skills install one shared payload plus native harness exposure.
- Selected global-scope skills install one home-scoped shared payload plus home-scoped native harness exposure.
- Bare installs write no selected agentic payloads or harness exposures.
- Manifest/dry-run output distinguishes shared payloads, symlink exposures, copy mirrors, legacy stubs, and migrated duplicated payloads.
- Modified or custom harness skills are preserved or reviewed rather than inferred as make-docs-owned.
- Backup and uninstall use one reviewed audit snapshot.
- Empty managed `.make-docs/agentics/**` parent directories are pruned after selected-agentics removal only when audit proves no unmanaged descendants remain.
- Cross-platform validation proves symlink-preferred behavior and copy-mirror fallback without relying on generic stubs.
- Generated plugin and skills-bundle installs reuse shared-agentics ownership records and native exposure rather than creating an unrelated package lifecycle.
## Contracts and Data

The named paths, schemas, state records, metadata fields, and evidence shapes in Requirements are normative contracts for this capability.
## Integrations

This capability integrates with the adjacent current authorities linked from Requirements and Source Anchors; those authorities remain owners of their own boundaries.
## Rebuild Notes

A rebuild must preserve the requirement identifiers, stable semantic anchors, ownership boundaries, and failure-safe behavior stated here. Implementation evidence does not silently weaken this authority.
## Requirement History

### 2026-08-08 — Not assigned

- Affected requirement or section: `Consolidated capability ownership`
- Previous contract: Current requirements were also represented by standalone editorial PRDs 32.
- Replacement contract: The applicable current requirements are inline in this authority and its linked product owners; the standalone editorial records are retired from the active set.
- Rationale: Active PRDs own product subjects and do not preserve editorial operations as product authority.
- Source: [PRD Authority Maintenance](../../.make-docs/references/system/prd-change-management.md)


### 2026-08-08 — W17 R2

- Affected requirement or section: `Document identity and current authority`
- Previous contract: The capability was represented as a standalone editorial change record whose title and structure described how the PRD set was modified.
- Replacement contract: This document now states the current canonical shared agentic payloads and native harness exposure requirements inline as product authority.
- Rationale: Active PRDs describe the current product shape; editorial operations belong in plans, work, and history.
- Source: [Shared agentics design](../designs/2026-06-20-shared-agentics-installation-and-harness-redirection.md)
## Source Anchors

- [../designs/2026-06-20-shared-agentics-installation-and-harness-redirection.md](../designs/2026-06-20-shared-agentics-installation-and-harness-redirection.md)
- [../designs/2026-06-27-shared-agentics-native-harness-exposure-correction.md](../designs/2026-06-27-shared-agentics-native-harness-exposure-correction.md)
- [../plans/2026-06-23-w17-r2-shared-agentics-installation-harness-redirection/00-overview.md](../plans/2026-06-23-w17-r2-shared-agentics-installation-harness-redirection/00-overview.md)
- [../plans/2026-06-27-w17-r3-shared-agentics-native-harness-exposure-correction/00-overview.md](../plans/2026-06-27-w17-r3-shared-agentics-native-harness-exposure-correction/00-overview.md)
- [../work/2026-06-23-w17-r2-shared-agentics-installation-harness-redirection/00-index.md](../work/2026-06-23-w17-r2-shared-agentics-installation-harness-redirection/00-index.md)
- [08 Skills Catalog and Distribution](08-skills-catalog-and-distribution.md)
- [18 Compatibility Audit and Migration Disposition](18-compatibility-classification-and-migration-safety.md)
- [21 Tool Directory System Custom Resource Tiers](21-project-tool-directory-and-resource-tiers.md)
- [08 Skills Catalog and Distribution](08-skills-catalog-and-distribution.md)
- [34 Playbook Authoring Contract and Model](34-playbook-authoring-contract-and-model.md)
- [30 Harness Plugin Substrate Workflow Bundles](30-plugin-substrate-and-workflow-bundles.md)
- [38 Global Store and Project State](38-global-store-and-project-state.md)
- [36 Playbook Packaging Compiler and Harness Adapters](36-playbook-packaging-compiler-and-harness-adapters.md)
- [../designs/2026-06-29-playbook-packaging-and-harness-adapter-registry.md](../designs/2026-06-29-playbook-packaging-and-harness-adapter-registry.md)
- [../plans/2026-06-29-w18-r5-playbook-packaging-and-harness-adapter-registry/00-overview.md](../plans/2026-06-29-w18-r5-playbook-packaging-and-harness-adapter-registry/00-overview.md)
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

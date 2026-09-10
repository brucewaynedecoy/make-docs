# 28 Shared Agentics Installation and Harness Exposure

## Purpose

This document defines the current product contract for canonical shared agentic payloads and native harness exposure. Normative requirements are stated in the sections below; Requirement History is provenance only.
## Scope

This authority owns canonical shared agentic payloads and native harness exposure. Related PRDs own adjacent capabilities and are linked where a cross-boundary contract is required.
## Component and Capability Map

The requirements below define the owned components, behaviors, boundaries, and evidence expectations for this capability.
## Requirements

### Shared Agentics Store

The historical section name does not define a private Make Docs payload directory. Standard agent directories own installed Skill files; the global Store owns operational state.

Install Skill files in standard agent locations, selected by scope and harness:

| Scope and selected harnesses | Real Skill directory | Other selected access |
| --- | --- | --- |
| Project, Claude only | `.claude/skills/<name>/` | None; do not create `.agents/skills/`. |
| Project, Codex only | `.agents/skills/<name>/` | None; do not create `.claude/skills/`. |
| Project, both | `.agents/skills/<name>/` | `.claude/skills/<name>` links to it, or is a supported managed native copy. |
| Global, any selection | `~/.agents/skills/<name>/` | Selected Codex uses `~/.codex/skills/<name>` (or `CODEX_HOME/skills`); selected Claude uses its configured native Skill root, normally `~/.claude/skills/<name>`. Native access links to the canonical directory or uses a supported copy. Direct access applies only if the configured native path equals the canonical path. |

A harness that uses the real directory reads it directly. Never create a self-link or duplicate ownership entry for that same path. `none` creates no Skill directories. Preserve pre-existing unrelated content; absence checks on fresh fixtures must prove no unselected project Skill root was created.

There is no active `.make-docs/agentics/` installation layer, in the project or home. Skill source stays solely in `packages/skills/<name>/`; compiled CLI output embeds declared bytes. Installation identity, ownership, intent and recovery belong only in the global Make Docs Store. A symbolic link to a Make Docs resource URL is unsupported and is not a feature or deferred task in this correction.

### Native Harness Exposure

The native `SKILL.md` is the real entrypoint, never a generic forwarding stub. Direct canonical native directories are not duplicated or linked to themselves. Additional selected access uses an exact directory link to the real Skill path or the supported full-copy fallback. Windows symlink limits retain the existing managed-copy behavior; a copy is written directly under the selected native Skill root.

### Manifest Ownership

`selectedSkills` remains the behavior-level selected-skill list.

`skillFiles` remains a managed-output ownership list during transition, but the schema should grow structured agentic ownership records that identify:

- selected artifact kind, name, source manifest, immutable ref, digest, trust/provenance, and scope
- canonical shared payload paths
- symlink exposure paths, link targets, link type, and fallback status
- managed copy-mirror paths and their canonical source payload
- legacy generated stub paths from earlier installs
- exposure mode, with `symlink` preferred and `copy-mirror` fallback
- harness name and path scope
- previous per-harness duplicated payloads that were migrated, preserved, or skipped

Until that schema exists, implementation may represent shared payload files and harness exposures through `skillFiles`, but it must not lose the distinction in audit, backup, uninstall, migration diagnostics, or user-visible dry-run output.

### Migration and Lifecycle Safety

Wrong-private-layout cutover is forward-resume-only: review must state before apply that rollback would recreate the forbidden private layer and is not offered. Ordinary adoption already using standard locations keeps normal resume/rollback. Older saved operations that would write a retired private root refuse safely; never execute them to restore that layer. This correction adds no new URL-backed installation mode.

Upgrade the wrong private layout through a reviewed CLI operation. The review names every old source, new standard destination, link/copy change, backup and ownership effect. Recheck exact bytes, links, scope, selected tools and Store ownership before mutation. Verify the complete destination tree and access paths before removing clean owned old files. Preserve changed, unknown or conflicting content and stop for an explicit disposition; never infer ownership from a path. Remove the retired `.make-docs/agentics/skills` tree and its ancestors only when proven empty and managed. Success must leave no active private Skill layer or unexplained legacy content. Historical backup byte copies may remain under declared backup/archive roots; they are not active installation paths. Update, removal, scope/tool changes, resume/rollback and repeated normal setup/Skills sync must use the same standard-path rules.

Audit distinguishes direct standard directories, additional native links/copies, legacy private payloads, old generated stubs and unowned user content. Link operations unlink without traversing targets. Removal prunes only reviewed empty managed parents and preserves all unrelated contents and sibling Skills. A same-path canonical/native entry has one effective ownership identity.

### Reviewed Existing-Skill Adoption

The W19 R5 requirements below record accepted product direction. The owner accepted the R5 backlog on 2026-09-09 and authorized implementation. The tasks and evidence remain pending.

- R-SKILL-ADOPT-1 (MUST): `setup skills --adopt-existing <csv>` accepts only selected, proved first-party names from the effective registry. It enables explicit review of existing copies; it does not infer ownership from names. Ordinary `setup` offers bundled Skills without adoption flags. PRD [39](39-cli-command-model-and-operation-registry.md) owns the exact grammar, including rejection of `--review` without adoption and adoption with `--remove`.
- R-SKILL-ADOPT-2 (MUST): dry-run produces a complete read-only review and digest. Show target and scope, selected tools and Skills, effective source and package identity, full existing and desired inventory, file and link identities, native exposure effects, backups, ownership changes, and blockers. Create no Store intent, backup, directory, or local marker. Non-interactive apply requires `--review <digest>` for that snapshot; `--yes` alone is insufficient. Interactive review and confirmation bind to the same facts.
- R-SKILL-ADOPT-3 (MUST): reviewed differences or missing files within the declared file set may be reconciled, with recoverable backups of replaced bytes. Unknown extra files, unsafe links, conflicting copies, or another recorded owner block adoption. Preserve the input and report the blocker and next safe action. No broad overwrite or same-name inference may bypass classification.
- R-SKILL-ADOPT-4 (MUST): under the shared operation lock, recheck target, scope, selected tools and Skills, complete file/link inventory, source and package identity, and Store ownership before required intent and mutation. A relevant change invalidates the review. Use the existing pending-operation and recovery services, not a Skill-specific state engine.
- R-SKILL-ADOPT-5 (MUST): record prospective ownership in the global Store even when desired file bytes already match. Do not claim earlier ownership without evidence. Required Store failure blocks the managed ownership change and file writes. The operation retains package version/hash evidence, scope, canonical payload, native exposure, backup references, and the reviewed ownership transition under PRD [38](38-global-store-and-project-state.md).
- R-SKILL-ADOPT-6 (MUST): after adoption, update, repeat, backup, removal, and recovery use the same managed ownership rules in project and global scope. Clean upgrades use new bundled first-party bytes even when old records name remote sources. Edited managed files remain protected conflicts. No update may depend on the old remote source being available.

### Config and Behavior Boundary

Config overlays are read through a make-docs config resolver contract, not plugin-specific or skill-specific routing maps.

Installed skills may render configured labels only after resolving canonical ids, paths, kinds, purpose ids, skill names, and harness names.

If the config resolver is not yet implemented, shared payloads and harness-exposure diagnostics must preserve canonical wording rather than inventing local config parsing.

Shared payloads may instruct agents to call make-docs CLI or MCP operations for deterministic behavior, but selected artifact discovery must remain native and inspectable without a live CLI process.

### Optional Agentics Boundary

Core Make Docs behavior is complete through project routers, system resources, CLI operations, and MCP surfaces without installed agentics. Selected Skills may improve discovery and sequencing or adapt access for a supported harness, but they must delegate deterministic behavior to the same typed operations and return the same receipts.

The first-party Unassisted Goal Testing Skill is a supported optional payload. Its shims follow [08-skills-catalog-and-distribution.md](08-skills-catalog-and-distribution.md): they adapt arguments or receipt formatting only, carry no tester qualification, anti-coaching, scenario, evidence, finding, gate, or run-state policy, and never become a correctness prerequisite.

All seven first-party Skills use the bundled delivery contract owned by PRD 08. Setup installs selected payloads into the shared content root and exposes them through the native harness paths above. The `naive-uat` adapter follows this common delivery rule without changing the shared UAT workflow or policy.

Make Docs has no general plugin, hook, extension, workflow-bundle, Playbook-generated Skill, or harness-adapter installation contract. An agentic integration may enter this store only after a traced non-Playbook purpose, an existing owning PRD, real harness capability evidence, explicit selection, and install/uninstall authority exist; [30-plugin-substrate-and-workflow-bundles.md](30-plugin-substrate-and-workflow-bundles.md) owns that admission boundary.

### No-Default-Skills

Bare install and default sync write no selected skill payloads and no harness exposures.

Shared agentics are written only when the user explicitly selects Skills through an accepted manifest and selection flow.
## Non-Requirements

- No generated-stub default behavior.
- No symlink-only behavior without copy-mirror fallback.
- No silent fallback from native exposure to generic stubs.
- No plugin, hook, extension, workflow-bundle, Playbook, Protocol, packaging-compiler, or generated-bundle contract in this shared-agentics PRD.
- No MCP write surface.
- No broader alternate-source trust redesign; PRD 08 owns the first-party bundled delivery contract.
- No automatic selected Skill or other agentic installation.
## Acceptance Criteria

- Selected project-scope skills install one shared payload plus native harness exposure.
- Selected global-scope skills install one home-scoped shared payload plus home-scoped native harness exposure.
- Bare installs write no selected agentic payloads or harness exposures.
- Manifest/dry-run output distinguishes shared payloads, symlink exposures, copy mirrors, legacy stubs, and migrated duplicated payloads.
- Modified or custom harness skills are preserved or reviewed rather than inferred as make-docs-owned.
- Backup and uninstall use one reviewed audit snapshot.
- Successful fresh installation and verified upgrade leave no active `.make-docs/agentics` layer. Project single-harness setup creates only that selected standard Skill root; legacy or unselected roots are removed only with exact managed ownership and empty-parent proof.
- Cross-platform validation proves symlink-preferred behavior and copy-mirror fallback without relying on generic stubs.
- The optional Unassisted Goal Testing Skill remains absent from default installs, delegates only to typed CLI operations, and does not duplicate testing policy.
- Core routers, resources, CLI, and MCP remain complete when no Skill is selected or exposed.
- Adoption proof covers read-only review, required digest, stale package/input/selection/ownership refusal, reviewed known-file replacement with backups, and blockers that preserve unsafe or unknown content.
- Ownership-only adoption creates the required Store record; unavailable Store and interrupted apply cannot claim success or create project-local state.
- Isolated project/global lifecycle checks cover native symlink and copy exposure, repeat, update from old first-party remote provenance without fetch, edited-file conflict, removal, and shared recovery.
## Contracts and Data

The named paths, schemas, state records, metadata fields, and evidence shapes in Requirements are normative contracts for this capability.
## Integrations

This capability integrates with the adjacent current authorities linked from Requirements and Source Anchors; those authorities remain owners of their own boundaries.
## Rebuild Notes

A rebuild must preserve the requirement identifiers, stable semantic anchors, ownership boundaries, and failure-safe behavior stated here. Implementation evidence does not silently weaken this authority.
## Requirement History

### 2026-09-09 — W19 R5 Standard-Location Correction

- Prior requirement: private project/home `.make-docs/agentics/skills` payloads with native links/copies.
- Replacement: scope/harness-aware standard agent directories defined above, with Store-only state and reviewed old-path upgrade.
- Rationale: the coordinator repeated a rejected installation-layer assumption; the owner reported a prior Skill installation had already been removed for this same mistake. This is our correction, not a new owner clarification or URL-symlink product.
- Source: [R5 design](../designs/2026-09-09-first-party-skills-and-managed-adoption.md#standard-layout-correction) and [R5 phase](../work/2026-09-09-w19-r5-first-party-skills-and-managed-adoption/01-skills-and-managed-adoption.md#standard-layout-correction).


### 2026-08-08 — Not assigned

- Affected requirement or section: `Consolidated capability ownership`
- Previous contract: Current requirements were also represented by standalone editorial PRDs 32.
- Replacement contract: The applicable current requirements are inline in this authority and its linked product owners; the standalone editorial records are retired from the active set.
- Rationale: Active PRDs own product subjects and do not preserve editorial operations as product authority.
- Source: [PRD Authority Maintenance](../../.make-docs/system/references/prd-change-management.md)


### 2026-08-08 — W17 R2

- Affected requirement or section: `Document identity and current authority`
- Previous contract: The capability was represented as a standalone editorial change record whose title and structure described how the PRD set was modified.
- Replacement contract: This document now states the current canonical shared agentic payloads and native harness exposure requirements inline as product authority.
- Rationale: Active PRDs describe the current product shape; editorial operations belong in plans, work, and history.
- Source: [Shared agentics design](../designs/2026-06-20-shared-agentics-installation-and-harness-redirection.md)

### 2026-08-14 — W19 R1

- Affected requirement or section: `Shared Agentics Store; Manifest Ownership; Optional Agentics Boundary; No-Default-Skills`
- Previous contract: The shared store reserved plugin payloads and inherited Playbook-generated plugin and skills-bundle installation while treating general plugin exposure as a future selected-agentics path.
- Replacement contract: Shared installation and native exposure retain explicitly selected Skills only; core operation is complete without agentics, the first-party Naive-UAT Skill is optional and CLI-delegating, and no plugin, hook, extension, workflow bundle, Playbook-generated output, or untraced adapter is admitted.
- Rationale: Optional agentics must have a traced non-Playbook purpose and honest harness evidence, while unsupported plugin and Playbook packaging infrastructure must not remain a current product promise.
- Source: [W19 R1 recovery design](../designs/2026-08-12-make-docs-v2-product-boundary-and-missing-migration-recovery.md) and [accepted W19 R1 plan](../plans/2026-08-13-w19-r1-make-docs-v2-product-boundary-and-missing-migration-recovery/00-overview.md)

### 2026-09-03 — W19 R1 P7

- Affected requirement or section: `Optional Agentics Boundary`
- Previous contract: The shared lifecycle and native harness projection were fixed, but P7 had no payload origin for the first-party Unassisted Goal Testing Skill.
- Replacement contract: P7 uses a bundled local payload and no remote fetch for this one selected first-party Skill. The general selected-Skill delivery model stays open.
- Rationale: P7 can use the existing ownership and exposure contract without expanding the decision to all Skills.
- Source: [W19 R1 P7 work record](../work/2026-08-14-w19-r1-make-docs-v2-product-boundary-and-missing-migration-recovery/07-naive-uat-workflow-persona-and-evidence.md) and [D-005](03-open-questions-and-risk-register.md#d-005-skills-delivery-diverges-from-earlier-bundled-payload-expectations)

### 2026-09-09 — W19 R5 First-Party Skills and Managed Adoption

- Affected requirement or section: Shared Agentics Store; Reviewed Existing-Skill Adoption; Optional Agentics Boundary; Acceptance Criteria.
- Previous contract: Shared content language permitted local metadata and offered no exact reviewed adoption contract; bundled UAT was a special case.
- Replacement contract: Shared installed content paths stay unchanged, while all operational records stay in the global Store. Selected first-party adoption requires a complete digest-bound review, protected replacement, lock-time rechecks, and durable ownership even with matching bytes.
- Rationale: Allow existing copies to enter management without guessing ownership or losing user content.
- Source: [R5 design](../designs/2026-09-09-first-party-skills-and-managed-adoption.md) and [R5 plan](../plans/2026-09-09-w19-r5-first-party-skills-and-managed-adoption/00-overview.md). The owner accepted the R5 backlog on 2026-09-09 and authorized implementation. Implementation tasks and evidence remain pending.

## Source Anchors

- [W19 R1 recovery design](../designs/2026-08-12-make-docs-v2-product-boundary-and-missing-migration-recovery.md)
- [W19 R1 plan](../plans/2026-08-13-w19-r1-make-docs-v2-product-boundary-and-missing-migration-recovery/00-overview.md)

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

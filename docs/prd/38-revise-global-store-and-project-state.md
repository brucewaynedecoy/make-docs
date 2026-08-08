---
title: "38 Revise Global Store and Project State"
kind: "prd"
status: "active"
coordinate: "W18 R10"
source:
  type: "design"
  path: "docs/designs/2026-07-01-global-store-and-project-state.md"
---

# 38 Revise Global Store and Project State

## Purpose

Make the machine-level global store at `~/.make-docs/` and the unified project-state model it holds an active requirement: the boundary principle that decides what lives in a repository versus the store, the store's contents — a global configuration file, a global manifest, and a SQLite database — the database's schema versioning, migration, concurrency, and recovery obligations, the manifest-minted stable project identity that keys all project-scoped state, the single project-state model whose two facets are Playbook run-state and work-execution evidence, the mirror-versus-relocated distinction, and the store's lifecycle and privacy behavior. This change belongs in the active PRD namespace because Make Docs v2 reintroduced per-repository operational state — the Playbook run files and the work-lifecycle checkpoint files under `.make-docs/runs/**` — which is the same duplication-and-noise pattern the v2 script-to-CLI migration was meant to remove, and because the W18 R7 run-state relocation in [35-revise-run-playbook-state-machine.md](35-revise-run-playbook-state-machine.md) already depends on this store landing as its storage owner.

## Change Type

Revision. Although this PRD introduces the net-new machine-level store, it alters established requirements: it supersedes the in-repo runtime-state placement that kept temporary run state under `.make-docs/**` per the PRD 21 runtime-state family, retires the per-repo checkpoint JSON at `.make-docs/runs/<wave-slug>/state.json` as a state location by absorbing its genuine-state fields into the work-execution evidence facet, and replaces path-keyed state assumptions with manifest-minted stable project identity. It does not redefine the Playbook run-state record shape or its progression semantics, project `.make-docs/config.yaml` and its overlay rules, the local bootstrap guarantee and the pinned global asset cache, the CLI command tree and the operation registry, or the pruning of the removed work and closeout operations; those remain governed by their owning docs, designs, and artifacts.

Route: `change-plan`

Coordinate: `W18 R10`

## Baseline Being Revised or Removed

- [21-revise-tool-directory-system-custom-resource-tiers.md](21-revise-tool-directory-system-custom-resource-tiers.md): the runtime-state family's remaining inclusion of temporary run state as in-repo `.make-docs/**` runtime state is superseded. W18 R7 already relocated Playbook run state; W18 R10 completes the relocation by moving work-execution evidence — the genuine-state core of the work-lifecycle checkpoint files at `.make-docs/runs/<wave-slug>/state.json` — to the global store as well. `manifest.json`, `conflicts/`, provider/cache metadata, audit state, the tool-resource families, and the system/custom tiers are unchanged.
- [05-installation-profile-and-manifest-lifecycle.md](05-installation-profile-and-manifest-lifecycle.md): enhanced rather than superseded — the manifest contract gains the stable project identifier minted at setup and recorded in `.make-docs/manifest.json`, and project removal gains the obligation to prune that project's global-store rows; the install modes, planner/apply flow, conflict staging, and audit-snapshot safety model are unchanged.
- Path-keyed state assumptions anywhere in the active set: any behavior that identifies a project's operational state by its directory path is superseded; identity is the manifest-minted id, with path allowed only as secondary lookup metadata.

## Rationale

A repository folder should not host files that are duplicated in every repository where Make Docs is set up or that are used primarily by Make Docs itself. The Playbook run files and the work-lifecycle checkpoint files reintroduced exactly that per-repo operational-noise pattern, and the checkpoint operation still writes `.make-docs/runs/<wave-slug>/state.json` into each project today. Relocating operational state to a machine-level store removes it from every repository while giving Make Docs one coherent place to manage state across projects, and the work-execution evidence disposition in [../assets/artifacts/migrated-operations-inventory.md](../assets/artifacts/migrated-operations-inventory.md) sharpened what is worth keeping: only recorded decisions and evidence that cannot be re-derived from the repository or git are genuine state, and that genuine state, together with Playbook run-state, is what this store holds. Keying that state by directory path would orphan or misattribute it under clones, moves, and worktrees, so identity must be minted and manifest-recorded.

Code anchors:

- `packages/cli/src/operations/lifecycle/index.ts`
- `packages/cli/src/operations/playbook/index.ts`
- `packages/cli/src/manifest.ts`
- `.make-docs/runs/`
- `docs/assets/artifacts/runtime-and-global-store.md`
- `docs/assets/artifacts/migrated-operations-inventory.md`

## Effective Requirement

The effective requirement set carries the design's requirement IDs so traceability holds; [../designs/2026-07-01-global-store-and-project-state.md](../designs/2026-07-01-global-store-and-project-state.md) is the normative statement of each.

### Scope and Boundaries (R-SCOPE)

- R-SCOPE-1 (MUST NOT): this change owns exactly the global store location and contents, the boundary principle, the SQLite database and its operational concerns, the stable project identity, the unified project-state model, the mirror-versus-relocated distinction, and the store's backup, uninstall, and privacy behavior. The Playbook run-state record shape and its progression semantics (owned by the W18 R7 lineage in [35-revise-run-playbook-state-machine.md](35-revise-run-playbook-state-machine.md)); project `.make-docs/config.yaml` and its overlay rules (owned by [24-revise-configuration-convention-overlay.md](24-revise-configuration-convention-overlay.md)); the local bootstrap guarantee and the pinned global asset cache (owned by [17-revise-system-asset-materialization-contract.md](17-revise-system-asset-materialization-contract.md)); the CLI command tree and the operation registry (owned by the CLI reorganization lineage, see [../assets/artifacts/cli-command-reorganization.md](../assets/artifacts/cli-command-reorganization.md)); and the pruning of the removed work and closeout operations (tracked by [../assets/artifacts/migrated-operations-inventory.md](../assets/artifacts/migrated-operations-inventory.md)) must not be redefined or reinvented here.

### The Boundary Principle (R-BND)

- R-BND-1 (MUST): data placement follows one test — versioned project knowledge stays in the repository; machine-local, tool-operational, or otherwise-duplicative data goes to the global store. The test for a piece of data is whether it is meaningful project knowledge that should be versioned and shared, or operational state that Make Docs uses to do its job.
- R-BND-2 (MUST): by this test, run-state and work-execution evidence are operational state and must live in the global store, not the repository; designs, plans, PRDs, contracts, guides, Playbooks, and history records are project knowledge and must remain in the repository.

### Store Location and Contents (R-STORE)

- R-STORE-1 (MUST): when Make Docs is installed on a system, the CLI creates `~/.make-docs/` containing at least a global configuration file for machine-level settings, a global manifest for tool-level state, and a SQLite database for operational data.
- R-STORE-2 (MUST): the global configuration file is machine-level and tool-level — machine settings such as a self-update preference or the marketplace auto-registration opt-in live there — and it must not be confused with, or override, project `.make-docs/config.yaml`, which remains the project-owned presentation overlay defined by [24-revise-configuration-convention-overlay.md](24-revise-configuration-convention-overlay.md).
- R-STORE-3 (MUST): the global store is distinct from any provider-backed global asset cache; it holds operational state, not shipped template assets, and its presence or absence must not weaken the non-optional local repository bootstrap defined by [17-revise-system-asset-materialization-contract.md](17-revise-system-asset-materialization-contract.md).

### The SQLite Database (R-DB)

- R-DB-1 (MUST): the SQLite database is the operational store; it holds the install and directory registry, the project-state model, and other operational data as needs emerge.
- R-DB-2 (MUST): the database carries a schema version and a defined migration strategy; `update` applies migrations, and a database from a newer schema than the running CLI is handled explicitly rather than corrupted.
- R-DB-3 (MUST): the database tolerates concurrent access from the CLI, the MCP server, and agent sessions; the concurrency model uses write-ahead logging and a defined locking discipline.
- R-DB-4 (MUST): the database has a defined recovery path; lost or corrupt operational state degrades gracefully — because the store holds operational state and not project knowledge, a missing database must not block reading the repository or re-establishing state, and must not be treated as data loss of project knowledge.

### Stable Project Identity (R-ID)

- R-ID-1 (MUST): every project-scoped row in the store is keyed by a stable project identifier plus the row's own key; the identifier is minted at setup and recorded in the project's `.make-docs/manifest.json`.
- R-ID-2 (MUST NOT): the store must not key project-scoped state by directory path, because paths change under clones, moves, and worktrees; path may be recorded as secondary lookup metadata, but identity is the manifest-minted id.

### The Unified Project-State Model (R-PS)

- R-PS-1 (MUST): project state is one model with two facets, both recorded decisions and evidence for a unit of work, keyed by the project identifier — Playbook run-state, meaning the run records defined by the W18 R7 lineage, and work-execution evidence, meaning the recorded sign-offs and decisions that cannot be re-derived from the repository or git, such as validation-passed, review-passed or waived, and closeout-approved, for a unit of work-backlog progression.
- R-PS-2 (MUST): the two facets share the project-state model rather than becoming two parallel, ad-hoc state stores; the current per-repository checkpoint JSON is not ported verbatim — its genuine-state fields become work-execution evidence in this model, and its re-derivable fields are dropped per the disposition in [../assets/artifacts/migrated-operations-inventory.md](../assets/artifacts/migrated-operations-inventory.md).
- R-PS-3 (MUST): work-execution evidence is keyed to a canonical work-item identity — the resolved repo root, wave slug, and phase path — produced by the retained work-item identity resolver; the store records evidence against that identity and does not re-derive the identity.

### Mirror Versus Relocated (R-MIR)

- R-MIR-1 (MUST): the install and directory registry in the store is a mirror and index whose canonical source remains each project's `.make-docs/manifest.json`; it exists for cross-project queries and quick access and must not become a second source of truth for a project's install record.
- R-MIR-2 (MUST): run-state and work-execution evidence are relocated and canonical in the store, with no in-repo copy; the install registry mirrors, while operational state relocates.

### Backup, Uninstall, and Upgrade (R-LIFE)

- R-LIFE-1 (MUST): tool `uninstall`, which removes the CLI itself, handles the global store explicitly rather than orphaning it — either removing it or prompting — and must not delete repository content.
- R-LIFE-2 (MUST): project `setup remove` prunes that project's rows from the store, keyed by the project identifier, without affecting other projects.
- R-LIFE-3 (MUST): `update`, `setup`, and `setup reconfigure` detect a pre-v2 configuration and present the warning-and-backup-or-cancel flow defined by the CLI reorganization, and `update` applies any store schema migration.

### Privacy (R-PRIV)

- R-PRIV-1 (MUST): the store records the paths of every project where Make Docs is set up; this data is local to the machine and must not be transmitted, and any future feature that would export or share it requires explicit opt-in.

### Preserved Prior Decisions (R-KEEP)

- R-KEEP-1 (MUST): project `.make-docs/config.yaml` remains the optional, project-owned presentation overlay that never renames structure and is never routing authority; the global config does not change this.
- R-KEEP-2 (MUST): the local repository bootstrap remains non-optional and cannot be provider-backed, and any global asset cache remains pinned by provider identity, version, and hash; the operational store is separate from both.

### Verification and Testability (R-TEST)

- R-TEST-1 (MUST): a test asserts that run-state and work-execution evidence are written to the global store and never to a repository path.
- R-TEST-2 (MUST): a test asserts that project-scoped state survives a simulated directory move or clone because it is keyed by the manifest identifier, not the path.
- R-TEST-3 (MUST): a test asserts graceful degradation when the store database is missing or unreadable, confirming the repository remains readable and state can be re-established.
- R-TEST-4 (MUST): a test asserts that `setup remove` prunes only the target project's rows and that tool `uninstall` does not delete repository content.

The design's D10 section fixes store-not-repo placement of operational state, the `~/.make-docs/` layout with global config, global manifest, and SQLite database, manifest-minted identity that is never path-keyed, the single project-state model with its two facets, and the mirror-versus-relocated distinction as non-substitutable, while leaving the concrete SQL schema and table layout, the exact migration and locking implementation, the project-identifier generation algorithm, and the global config and manifest file formats to the implementer.

Code anchors:

- `packages/cli/src/manifest.ts`
- `packages/cli/src/operations/lifecycle/index.ts`
- `packages/cli/src/operations/playbook/index.ts`
- `packages/cli/src/uninstall.ts`

## Impacted Docs and Dependencies

### Change Notes

- Enhanced by [39-revise-cli-command-reorganization-and-operation-registry.md](39-revise-cli-command-reorganization-and-operation-registry.md). The CLI reorganization lineage recorded below as planned W18 R11 has landed: PRD 39 owns the command tree and the append-only operation registry, fixes the retained work operations' shape as one work-item identity resolver plus one work-execution evidence record-and-read pair surfaced on the pruned `run` surface and keyed to this PRD's project-state model, and carries the `update` and `uninstall` self-management commands whose store migration and removal behavior R-LIFE-1 through R-LIFE-3 define; the store, identity, and project-state ownership remain here.

- [21-revise-tool-directory-system-custom-resource-tiers.md](21-revise-tool-directory-system-custom-resource-tiers.md): the runtime-state family's remaining temporary run state — the work-lifecycle checkpoint state — leaves the repository; `manifest.json`, `conflicts/`, provider/cache metadata, audit state, and the tool-resource tiers remain governed there.
- [05-installation-profile-and-manifest-lifecycle.md](05-installation-profile-and-manifest-lifecycle.md): the manifest gains the setup-minted stable project identifier, and project removal gains store pruning; install modes, planner/apply behavior, and audit-snapshot safety are unchanged.
- [17-revise-system-asset-materialization-contract.md](17-revise-system-asset-materialization-contract.md): preserved and distinguished — the operational store is not an asset cache, is never pinned provider content, and does not weaken the non-optional local bootstrap; the materialization modes are unchanged.
- [24-revise-configuration-convention-overlay.md](24-revise-configuration-convention-overlay.md): preserved and distinguished — the machine-level global config is a separate surface with a separate lifecycle; project config remains presentation-only and project-owned.
- [32-revise-lifecycle-backup-state-agentics-pruning.md](32-revise-lifecycle-backup-state-agentics-pruning.md): tool uninstall and project setup remove gain global-store handling and pruning obligations; `.make-docs/backup/**` behavior, legacy root `.backup/**` protection, and agentics pruning rules are unchanged.
- [35-revise-run-playbook-state-machine.md](35-revise-run-playbook-state-machine.md): consumed by it — the W18 R7 runner stores run-state in this store keyed by this identity, and its R-STORE-3 reference to the Runtime and Global Store lineage now resolves to this PRD; the run-state record shape and progression semantics remain owned there.
- Cross-design sequencing dependency: the CLI reorganization's retained work operations — the work-execution evidence store and the work-item identity resolver kept by [../assets/artifacts/migrated-operations-inventory.md](../assets/artifacts/migrated-operations-inventory.md) — record and read evidence through this store; the reorganization lineage (planned next as W18 R11) owns the command tree and operation registry those operations surface through, per [../assets/artifacts/cli-command-reorganization.md](../assets/artifacts/cli-command-reorganization.md).
- Documentation consequence: the `.make-docs/` runtime-state guidance that names `.make-docs/runs/` as a runtime-state location — `packages/docs/template/.make-docs/AGENTS.md` and `packages/docs/template/.make-docs/CLAUDE.md`, mirrored in the dogfood `.make-docs/` routers — must be updated upstream in the template first and then dogfooded, per the maintainer dogfooding rule, to reflect that run and work-execution state live in the global store while project `.make-docs/` retains the manifest and project config.
- External contracts consumed: the CLI/MCP operation-boundary rules in [25-revise-cli-separation-and-mcp-boundary.md](25-revise-cli-separation-and-mcp-boundary.md) apply to any store-backed operation surfaced on the CLI or as MCP tools.

Code anchors:

- `packages/cli/src/manifest.ts`
- `packages/cli/src/uninstall.ts`
- `packages/docs/template/.make-docs/AGENTS.md`
- `packages/docs/template/.make-docs/CLAUDE.md`
- `scripts/smoke-pack.mjs`

## Required Baseline Annotations

- [21-revise-tool-directory-system-custom-resource-tiers.md](21-revise-tool-directory-system-custom-resource-tiers.md): `Superseded by` appended newest-last to the existing runtime-state `### Change Notes` block for the remaining temporary run state (work-lifecycle checkpoint state).
- [05-installation-profile-and-manifest-lifecycle.md](05-installation-profile-and-manifest-lifecycle.md): `Enhanced by` appended newest-last to the Contracts and Data `### Change Notes` for the manifest-minted project identifier and setup-remove store pruning.
- [17-revise-system-asset-materialization-contract.md](17-revise-system-asset-materialization-contract.md): `Enhanced by` as a `### Change Notes` block after the system asset boundary requirement text for the store-versus-cache distinction.
- [24-revise-configuration-convention-overlay.md](24-revise-configuration-convention-overlay.md): a W18 R10 paragraph appended newest-last to its doc-level `## Change Notes` for the separate machine-level global config.
- [32-revise-lifecycle-backup-state-agentics-pruning.md](32-revise-lifecycle-backup-state-agentics-pruning.md): a W18 R10 paragraph appended newest-last to its doc-level `## Change Notes` for the global-store uninstall and setup-remove obligations.
- [35-revise-run-playbook-state-machine.md](35-revise-run-playbook-state-machine.md): `Enhanced by` as a `### Change Notes` block under Impacted Docs and Dependencies resolving the planned-W18-R10 dependency to this PRD.
- [00-index.md](00-index.md): add PRD 38 to the reading order, document map, source anchors, audience paths, and intended follow-on.
- [03-open-questions-and-risk-register.md](03-open-questions-and-risk-register.md): advance R-019 in place — the global-store dependency this PRD lands — and add the unified project-state model's migration and mirror-drift exposure as a new rebuild risk at the next available number.

## W18 R15 Capability Reconciliation

[R-OBL-STATE](45-deferred-obligation-governance.md#r-obl-state-repository-and-project-state-boundary) and [R-NUAT-STATE](46-naive-end-user-acceptance-testing.md#r-nuat-state-repository-and-evidence-boundary) keep repository artifacts authoritative for obligation meaning, requirement traceability, scenario definitions, terminal rationales, and durable findings. Project State or the Global Store may hold operational execution progress, run identifiers, evidence pointers, timestamps, environment metadata, resumability state, and bounded projections for discovery.

Screenshots, recordings, logs, and other bulky or machine-local evidence may live outside the repository when policy requires it, but repository records must retain stable references and conclusions. Any database projection is non-authoritative and must be rebuildable from repository authority plus preserved evidence; this PRD round introduces no state schema change.

## Source Anchors

- [../designs/2026-07-01-global-store-and-project-state.md](../designs/2026-07-01-global-store-and-project-state.md)
- [../designs/2026-07-01-run-playbook-state-machine.md](../designs/2026-07-01-run-playbook-state-machine.md)
- [../designs/2026-06-20-configuration-and-convention-overlay.md](../designs/2026-06-20-configuration-and-convention-overlay.md)
- [../designs/2026-06-19-system-asset-delivery-and-materialization-contract.md](../designs/2026-06-19-system-asset-delivery-and-materialization-contract.md)
- [../assets/artifacts/runtime-and-global-store.md](../assets/artifacts/runtime-and-global-store.md)
- [../assets/artifacts/migrated-operations-inventory.md](../assets/artifacts/migrated-operations-inventory.md)
- [../assets/artifacts/cli-command-reorganization.md](../assets/artifacts/cli-command-reorganization.md)
- [../plans/2026-07-01-w18-r10-global-store-and-project-state/00-overview.md](../plans/2026-07-01-w18-r10-global-store-and-project-state/00-overview.md)
- [../work/2026-07-01-w18-r10-global-store-and-project-state/00-index.md](../work/2026-07-01-w18-r10-global-store-and-project-state/00-index.md)
- [21 Revise Tool Directory System Custom Resource Tiers](21-revise-tool-directory-system-custom-resource-tiers.md)
- [05 Installation Profile and Manifest Lifecycle](05-installation-profile-and-manifest-lifecycle.md)
- [17 Revise System Asset Materialization Contract](17-revise-system-asset-materialization-contract.md)
- [24 Revise Configuration Convention Overlay](24-revise-configuration-convention-overlay.md)
- [32 Revise Lifecycle Backup State Agentics Pruning](32-revise-lifecycle-backup-state-agentics-pruning.md)
- [35 Revise Run Playbook State Machine](35-revise-run-playbook-state-machine.md)
- [25 Revise CLI Separation and MCP Boundary](25-revise-cli-separation-and-mcp-boundary.md)
- `packages/cli/src/manifest.ts`
- `packages/cli/src/operations/lifecycle/index.ts`
- `packages/cli/src/operations/playbook/index.ts`
- `packages/cli/src/uninstall.ts`
- `scripts/smoke-pack.mjs`

# Global Store and Project State

## Purpose

This design defines the machine-level global store at `~/.make-docs/` and the unified project-state model it holds. It covers the store's location and contents, the boundary principle that decides what lives in a repository versus the global store, the SQLite database and its operational concerns, the stable project identity that keys project-scoped state, and the single project-state model of which Playbook run-state and work-execution evidence are two facets.

It exists because Make Docs v2 reintroduced per-repository operational state, the Playbook run files and the work-lifecycle checkpoint files, which is the same duplication-and-noise pattern the v2 script-to-CLI migration was meant to remove. Relocating that operational state to a machine-level store removes it from every repository while giving Make Docs one coherent place to manage state.

The full architecture this design draws from is recorded in [Runtime and Global Store](../assets/artifacts/runtime-and-global-store.md). It is consumed by [Run Playbook State Machine](2026-07-01-run-playbook-state-machine.md), which stores run-state here, and it resolves the storage question raised by the work-execution evidence disposition in [migrated-operations-inventory.md](../assets/artifacts/migrated-operations-inventory.md).

## Context

Make Docs manages several kinds of data, and they do not all belong in the same place. Versioned project knowledge, such as designs, plans, contracts, guides, and Playbooks, belongs in the repository. Machine-local operational state, such as which projects have Make Docs installed and how far a run or a wave has progressed, is used primarily by Make Docs itself and does not benefit from living in, and duplicating across, every repository.

Two prior decisions constrain this design and are preserved. The configuration overlay design makes project `.make-docs/config.yaml` an optional, project-owned presentation overlay that is never routing authority and never renames structure; the machine-level global configuration introduced here is a separate thing and does not change that. The system asset delivery design makes a local repository bootstrap non-optional and pins any global asset cache by provider identity, version, and hash; the operational store introduced here is distinct from that asset cache and does not weaken the bootstrap guarantee.

The work-execution evidence disposition sharpened what state is worth keeping. Only recorded decisions and evidence that cannot be re-derived from the repository or git, such as review sign-offs and validation approvals, are genuine state; everything re-derivable is derivation and is being removed or rebuilt as Playbooks. That genuine state, together with Playbook run-state, is what this store holds.

This repository is the Make Docs maintainer repo and a dogfood instance. The global store is machine-level runtime that the CLI creates at `~/.make-docs/`; it is not a repository file, not a shipped template asset, and not authored upstream. The implementation is ordinary source code under the CLI package.

## Decision

### D0. Scope and Boundaries

This design owns exactly: the global store location and contents (D2), the boundary principle (D1), the SQLite database and its operational concerns (D3), the stable project identity (D4), the unified project-state model (D5), the mirror-versus-relocated distinction (D6), and the backup, uninstall, and privacy behavior of the store (D7, D8).

R-SCOPE-1 (MUST NOT). The following are owned elsewhere and MUST NOT be redefined here:

- The Playbook run-state record shape and its progression semantics. Owned by [Run Playbook State Machine](2026-07-01-run-playbook-state-machine.md); this design owns where it is stored and how it fits the project-state model.
- Project `.make-docs/config.yaml` and its overlay rules. Owned by [Configuration and Convention Overlay](2026-06-20-configuration-and-convention-overlay.md).
- The local bootstrap guarantee and the pinned global asset cache. Owned by [System Asset Delivery and Materialization Contract](2026-06-19-system-asset-delivery-and-materialization-contract.md).
- The CLI command tree and the operation registry. Owned by [CLI Command Reorganization](../assets/artifacts/cli-command-reorganization.md).
- The pruning of the removed work and closeout operations. Tracked by [migrated-operations-inventory.md](../assets/artifacts/migrated-operations-inventory.md).

### D1. The Boundary Principle

R-BND-1 (MUST). Data placement MUST follow one test: versioned project knowledge stays in the repository; machine-local, tool-operational, or otherwise-duplicative data goes to the global store. The test for a piece of data is whether it is meaningful project knowledge that should be versioned and shared, or operational state that Make Docs uses to do its job.

R-BND-2 (MUST). By this test, run-state and work-execution evidence are operational state and MUST live in the global store, not the repository. Designs, plans, PRDs, contracts, guides, Playbooks, and history records are project knowledge and MUST remain in the repository.

### D2. Store Location and Contents

R-STORE-1 (MUST). When Make Docs is installed on a system, the CLI MUST create `~/.make-docs/` containing at least a global configuration file for machine-level settings, a global manifest for tool-level state, and a SQLite database for operational data.

R-STORE-2 (MUST). The global configuration file is machine-level and tool-level. It MUST NOT be confused with, or override, project `.make-docs/config.yaml`, which remains the project-owned presentation overlay defined by the configuration overlay design. Machine settings, such as a self-update preference or the marketplace auto-registration opt-in, live in the global config; project presentation labels live in the project config.

R-STORE-3 (MUST). The global store is distinct from any provider-backed global asset cache. It holds operational state, not shipped template assets, and its presence or absence MUST NOT weaken the non-optional local repository bootstrap.

### D3. The SQLite Database

R-DB-1 (MUST). The SQLite database is the operational store. It holds the install and directory registry, the project-state model in D5, and other operational data as needs emerge.

R-DB-2 (MUST). The database MUST carry a schema version and a defined migration strategy, because the schema evolves with Make Docs. `update` applies migrations; a database from a newer schema than the running CLI MUST be handled explicitly rather than corrupted.

R-DB-3 (MUST). The database MUST tolerate concurrent access from the CLI, the MCP server, and agent sessions. The concurrency model MUST use write-ahead logging and a defined locking discipline.

R-DB-4 (MUST). The database MUST have a defined recovery path. Lost or corrupt operational state MUST degrade gracefully: because the store holds operational state and not project knowledge, a missing database MUST NOT block reading the repository or re-establishing state, and MUST NOT be treated as data loss of project knowledge.

### D4. Stable Project Identity

R-ID-1 (MUST). Every project-scoped row in the store MUST be keyed by a stable project identifier plus the row's own key. The project identifier MUST be minted at setup and recorded in the project's `.make-docs/manifest.json`.

R-ID-2 (MUST NOT). The store MUST NOT key project-scoped state by directory path, because paths change under clones, moves, and worktrees. Path MAY be recorded as secondary lookup metadata, but identity is the manifest-minted id.

### D5. The Unified Project-State Model

R-PS-1 (MUST). Project state is one model with two facets, both of which are recorded decisions and evidence for a unit of work, keyed by the project identifier:

- Playbook run-state: the run records defined by the Run Playbook State Machine design.
- Work-execution evidence: the recorded sign-offs and decisions that cannot be re-derived from the repository or git, such as validation-passed, review-passed or waived, and closeout-approved, for a unit of work-backlog progression.

R-PS-2 (MUST). The two facets MUST share the project-state model rather than becoming two parallel, ad-hoc state stores. The current per-repository checkpoint JSON is not ported verbatim; its genuine-state fields become work-execution evidence in this model, and its re-derivable fields are dropped.

R-PS-3 (MUST). Work-execution evidence MUST be keyed to a canonical work-item identity, meaning the resolved repo root, wave slug, and phase path, produced by the retained work-item identity resolver. The store records evidence against that identity; it does not re-derive the identity.

### D6. Mirror Versus Relocated

R-MIR-1 (MUST). The install and directory registry in the store is a mirror and index whose canonical source remains each project's `.make-docs/manifest.json`. It exists for cross-project queries and quick access and MUST NOT become a second source of truth for a project's install record.

R-MIR-2 (MUST). Run-state and work-execution evidence are relocated and canonical in the store, with no in-repo copy. This is the distinction that separates the two roles of the store: the install registry mirrors, while operational state relocates.

### D7. Backup, Uninstall, and Upgrade

R-LIFE-1 (MUST). Tool `uninstall`, which removes the CLI itself, MUST handle the global store explicitly rather than orphaning it, either removing it or prompting, and MUST NOT delete repository content.

R-LIFE-2 (MUST). Project `setup remove` MUST prune that project's rows from the store, keyed by the project identifier, without affecting other projects.

R-LIFE-3 (MUST). `update`, `setup`, and `setup reconfigure` MUST detect a pre-v2 configuration and present the warning-and-backup-or-cancel flow defined by the CLI reorganization, and `update` MUST apply any store schema migration.

### D8. Privacy

R-PRIV-1 (MUST). The store records the paths of every project where Make Docs is set up. This data is local to the machine and MUST NOT be transmitted. Any future feature that would export or share it requires explicit opt-in.

### D9. Preserved Prior Decisions

R-KEEP-1 (MUST). Project `.make-docs/config.yaml` remains the optional, project-owned presentation overlay that never renames structure and is never routing authority. The global config does not change this.

R-KEEP-2 (MUST). The local repository bootstrap remains non-optional and cannot be provider-backed, and any global asset cache remains pinned by provider identity, version, and hash. The operational store is separate from both.

### D10. Non-Negotiable Decisions and Deliberately Open Choices

Fixed by this design and MUST NOT be substituted, relaxed, or reinvented:

- Operational state lives in the global store, never in the repository (R-BND-2).
- The store is `~/.make-docs/` with a global config, a global manifest, and a SQLite database (R-STORE-1).
- Project-scoped state is keyed by a manifest-minted stable identifier, never by path (R-ID-1, R-ID-2).
- One project-state model with run-state and work-execution evidence as facets (R-PS-1, R-PS-2).
- The install registry mirrors; operational state relocates (R-MIR-1, R-MIR-2).

Deliberately left to the implementer and MUST NOT be treated as under-specified gaps:

- The concrete SQL schema and table layout, provided it carries the required content and versioning.
- The exact migration and locking implementation, provided it satisfies R-DB-2 and R-DB-3.
- The project-identifier generation algorithm, provided it is stable and manifest-recorded.
- The global config and manifest file formats.

### D11. Verification and Testability

R-TEST-1 (MUST). A test MUST assert that run-state and work-execution evidence are written to the global store and never to a repository path.

R-TEST-2 (MUST). A test MUST assert that project-scoped state survives a simulated directory move or clone because it is keyed by the manifest identifier, not the path.

R-TEST-3 (MUST). A test MUST assert graceful degradation when the store database is missing or unreadable, confirming the repository remains readable and state can be re-established.

R-TEST-4 (MUST). A test MUST assert that `setup remove` prunes only the target project's rows and that tool `uninstall` does not delete repository content.

## Alternatives Considered

Keep run-state and work-execution state in the repository under `.make-docs/runs/`. Rejected. It reintroduces per-repository operational noise and duplication, which is the pattern the store exists to remove.

Fold the global config into the project `.make-docs/config.yaml`. Rejected. Project config is a project-owned presentation overlay with a preserved contract; machine and tool settings are a different scope and a different lifecycle, so they are a separate global config.

Reuse the pinned global asset cache as the operational store. Rejected. The asset cache is pinned, provider-backed, and about shipped template bytes; the operational store is mutable local state about installs and runs. Conflating them would break both contracts.

Maintain two separate state stores, one for run-state and one for work-execution evidence. Rejected. They are the same kind of thing, recorded evidence for a unit of work, and a single project-state model prevents two parallel vocabularies and two migration paths.

Key project state by directory path. Rejected. Paths change under clones, moves, and worktrees, which would orphan or misattribute state.

## Consequences

Every repository loses its operational-state files, which removes noise and duplication, and Make Docs gains one coherent place to manage state across projects. The unified project-state model means the runner and the work-execution evidence share one schema and one migration path rather than drifting apart.

The relocation has a documentation consequence: the `.make-docs/` runtime-state guidance that currently names `.make-docs/runs/` as a runtime-state location must be updated, upstream in the template per the maintainer dogfooding rule, to reflect that run and work-execution state now live in the global store while the project `.make-docs/` retains the manifest and project config. This design depends on the stable project identifier and is consumed by the runner, so it is sequenced alongside that work. Because the store is machine-local, cross-machine handoff of a run remains the explicit export and import defined by the runner design, not repository sharing.

## Design Lineage

Update Mode: new-doc-related.

Prior Design Docs: [Run Playbook State Machine](2026-07-01-run-playbook-state-machine.md), [Configuration and Convention Overlay](2026-06-20-configuration-and-convention-overlay.md), [System Asset Delivery and Materialization Contract](2026-06-19-system-asset-delivery-and-materialization-contract.md), [Run Playbook Orchestration and Harness Capabilities](2026-06-27-run-playbook-orchestration-and-harness-capabilities.md).

Reason: This design introduces the machine-level global store and the unified project-state model, relocating run-state and work-execution evidence out of the repository. It supersedes the in-repo runtime-state location assumed by the earlier runner work and preserves the project-config overlay and asset-delivery contracts, which remain in force and separate.

## Intended Follow-On

Route: `change-plan`

Next Prompt: [designs-to-plan-change.prompt.md](../../.make-docs/references/system/prompts/designs-to-plan-change.prompt.md)

Why: This is a corrective evolution that relocates active runtime state and introduces the global store against the active PRD namespace rather than starting a fresh baseline.

Coordinate Handoff: Introduces the global store and unified project-state model and relocates run-state and work-execution evidence out of the repository, revising the in-repo runtime-state model assumed by W18 R4 and by the checkpoint operations. Downstream coordinate: W18 R10, planned as [PRD 38](../prd/38-global-store-and-project-state.md) with a generated plan and work backlog.

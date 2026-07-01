# Phase 2: Global Store and Project State Scope

## Scope

Settle the implementation scope the delta backlog must encode, grounded in the design's D0–D11 decisions, so backlog generation is transcription rather than re-derivation. This phase writes no repository files; it fixes the decision boundaries the backlog phases carry.

## Decision Areas

- Boundary principle (D1): versioned project knowledge stays in the repository; machine-local, tool-operational, or otherwise-duplicative data goes to the global store (R-BND-1). Run-state and work-execution evidence are operational state and must live in the store; designs, plans, PRDs, contracts, guides, Playbooks, and history records remain in the repository (R-BND-2).
- Store location and contents (D2): the CLI creates `~/.make-docs/` with at least a global configuration file for machine-level settings, a global manifest for tool-level state, and a SQLite database for operational data (R-STORE-1). The global config is machine-level and tool-level and must not be confused with or override project `.make-docs/config.yaml` (R-STORE-2). The store is distinct from any provider-backed global asset cache and must not weaken the non-optional local bootstrap (R-STORE-3).
- SQLite database (D3): the database holds the install and directory registry, the project-state model, and other operational data (R-DB-1); it carries a schema version and a defined migration strategy, with `update` applying migrations and newer-schema databases handled explicitly (R-DB-2); it tolerates concurrent CLI, MCP server, and agent-session access through write-ahead logging and a defined locking discipline (R-DB-3); and it has a defined recovery path where a missing or corrupt database degrades gracefully and never blocks reading the repository or re-establishing state (R-DB-4).
- Stable project identity (D4): every project-scoped row is keyed by a stable project identifier plus the row's own key, minted at setup and recorded in `.make-docs/manifest.json` (R-ID-1); the store never keys project-scoped state by directory path, with path allowed only as secondary lookup metadata (R-ID-2).
- Unified project-state model (D5): one model with two facets — Playbook run-state as defined by the W18 R7 lineage, and work-execution evidence, the recorded sign-offs and decisions that cannot be re-derived from the repository or git (R-PS-1); the facets share the model rather than becoming parallel stores, and the per-repo checkpoint JSON is not ported verbatim — its genuine-state fields become work-execution evidence and its re-derivable fields are dropped (R-PS-2); work-execution evidence is keyed to the canonical work-item identity (resolved repo root, wave slug, phase path) produced by the retained work-item identity resolver (R-PS-3).
- Mirror versus relocated (D6): the install and directory registry is a mirror and index whose canonical source remains each project's manifest and must not become a second source of truth (R-MIR-1); run-state and work-execution evidence are relocated and canonical in the store with no in-repo copy (R-MIR-2).
- Lifecycle (D7): tool `uninstall` handles the store explicitly — removing or prompting — and never deletes repository content (R-LIFE-1); project `setup remove` prunes only that project's rows keyed by the project identifier (R-LIFE-2); `update`, `setup`, and `setup reconfigure` detect pre-v2 configurations and present the CLI reorganization's warning-and-backup-or-cancel flow, with `update` applying store schema migrations (R-LIFE-3).
- Privacy (D8): the store records every set-up project's path; the data is local to the machine, must not be transmitted, and any future export or sharing feature requires explicit opt-in (R-PRIV-1).
- Preserved decisions (D9): project `.make-docs/config.yaml` remains the optional project-owned presentation overlay (R-KEEP-1), and the local bootstrap remains non-optional with the asset cache pinned by provider identity, version, and hash (R-KEEP-2).
- Fixed versus open (D10): the non-substitutable decisions are store-not-repo placement, the `~/.make-docs/` layout, manifest-minted identity, the single project-state model, and the mirror-versus-relocated distinction; the implementer freedoms are the concrete SQL schema and table layout, the exact migration and locking implementation, the project-identifier generation algorithm, and the global config and manifest file formats — the backlog must treat the former as acceptance criteria and leave the latter open.
- Verification (D11): tests assert store-only writes for run-state and evidence (R-TEST-1), state survival across a simulated directory move or clone (R-TEST-2), graceful degradation with a missing or unreadable database (R-TEST-3), and setup remove pruning only the target project's rows plus uninstall never deleting repository content (R-TEST-4).

## Cross-Design Sequencing

- Consumed by W18 R7: [PRD 35](../../prd/35-revise-run-playbook-state-machine.md) stores run-state here and its storage phases are gated on this store, its concurrency model, and the stable project identifier; R-019 in the risk register records that dependency and advances in place as this plan lands.
- Consumed by the CLI reorganization's retained work operations: the work-execution evidence store and the work-item identity resolver kept by [migrated-operations-inventory.md](../../assets/artifacts/migrated-operations-inventory.md) record and read evidence through this store; the reorganization lineage is planned next as W18 R11 and consumes, not defines, the store.
- Documentation consequence: the `.make-docs/` runtime-state guidance naming `.make-docs/runs/` — `packages/docs/template/.make-docs/AGENTS.md` and `packages/docs/template/.make-docs/CLAUDE.md`, mirrored in the dogfood `.make-docs/` routers — must be updated upstream first and then dogfooded per the maintainer dogfooding rule; this is backlog implementation work, not part of this documentation pass.

## Out of Scope per R-SCOPE-1

The backlog must not redefine the Playbook run-state record shape or progression semantics (W18 R7 lineage), project `.make-docs/config.yaml` overlay rules ([PRD 24](../../prd/24-revise-configuration-convention-overlay.md)), the local bootstrap guarantee and pinned asset cache ([PRD 17](../../prd/17-revise-system-asset-materialization-contract.md)), the CLI command tree and operation registry (CLI reorganization lineage), or the pruning of the removed work and closeout operations (the migrated-operations inventory).

## Validation

- Every D0–D11 decision area above maps to at least one backlog phase, stage, or acceptance criterion in Phase 3's output.
- No backlog task redefines an R-SCOPE-1 exclusion or forecloses a D10 implementer freedom.

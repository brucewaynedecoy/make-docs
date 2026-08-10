# CLI Command Reorganization and Operation Registry

## Purpose

This design reorganizes the Make Docs CLI command surface and formalizes the operation registry and shared operation core. It defines the top-level structure of `setup`, `run`, `mcp`, `update`, and `uninstall`; the operation registry as the stable contract that the CLI, the MCP server, and Playbook steps are three surfaces over; the shared modular operation core; the migration and upgrade approach; and the simplified `run` surface that follows from pruning the derivation operations.

It exists because Make Docs v2 grew the CLI without reorganizing it: the install commands sit at the top level beside two large new top-level commands, `operations` and `mcp`, the tool has no self-management commands although it is now an installed artifact, and the CLI and MCP surfaces are hand-maintained parallel mirrors that drift.

The resolved decisions this design captures are recorded in [cli-command-reorganization.md](../assets/artifacts/cli-command-reorganization.md), and the operation registry is introduced in [Playbook Architecture and Design](../assets/artifacts/playbook-architecture.md), Section 0.6.

## Context

The CLI is the npm package `@brucewaynedecoy/make-docs`, distributed for remote execution and installable as a binary. Two prior designs frame this reorganization and are preserved. The CLI separation and MCP boundary design and the TypeScript runtime pivot establish that TypeScript is the v2 runtime authority, that Rust is shelved and is not a design target, that remote execution through `npx`, `pnpm dlx`, and `bunx` is the primary posture while persistent local installation is not, that the installer-first no-command posture remains meaningful, that MCP tools must delegate to the same deterministic operation contract as the equivalent CLI command rather than defining a second behavior model, and that deterministic logic lives in modular TypeScript operation domains behind thin dispatchers.

This design formalizes those constraints into a registry and a reorganized tree, and it consumes two decisions made in this design set. The operation registry underlies the Playbook `operation:` field and the runner, and the retained work-execution operations key to the project-state model in [Global Store and Project State](2026-07-01-global-store-and-project-state.md). The pruning of the derivation operations, recorded in [migrated-operations-inventory.md](../assets/artifacts/migrated-operations-inventory.md), simplifies the `run` surface.

This repository is the Make Docs maintainer repo and a dogfood instance. The CLI is ordinary source code under the CLI package, authored in place. Any template-owned instruction router, guide, or README that names old command spellings is authored upstream in `packages/docs/template/` and dogfooded downstream, per the maintainer dogfooding rule.

## Decision

### D0. Scope and Boundaries

This design owns exactly: the top-level command structure (D2), bare-command behavior (D3), tool self-management (D4), the operation registry and shared core (D5), the `run` surface (D6), and migration and sequencing (D7, D8).

R-SCOPE-1 (MUST NOT). The following are owned elsewhere and MUST NOT be redefined here:

- The internal logic of the operations and the pruning removals. Tracked by [migrated-operations-inventory.md](../assets/artifacts/migrated-operations-inventory.md).
- The Playbook model, runner, packaging, and conformance. Owned by their respective designs.
- The global store schema and the project-state model. Owned by [Global Store and Project State](2026-07-01-global-store-and-project-state.md).
- The CLI and MCP boundary and the TypeScript runtime authority. Preserved from the predecessor designs and not reopened.

### D1. Preserved Prior Decisions

R-KEEP-1 (MUST). The following are preserved unchanged:

- TypeScript is the v2 runtime authority. Rust is shelved and is not a design target, distribution, or parity requirement.
- Remote execution through `npx`, `pnpm dlx`, and `bunx` is the primary posture. The installed binary exists because package managers require an entry point; persistent local installation is not the primary posture.
- The installer-first no-command posture remains meaningful and MUST NOT be replaced by a forced command-router.
- MCP tools MUST delegate to the same deterministic operation contract as the equivalent CLI command. There is no second behavior model; a tool name may be more structured than the CLI command, but its reads, config interpretation, provenance, audit, dry-run, and write permissions are identical.
- Deterministic logic lives in modular TypeScript operation domains, not skill-local scripts and not monolithic files; public dispatchers are thin; domain logic is testable without the CLI parser or MCP transport.
- Project `.make-docs/config.yaml` is a presentation overlay consumed after canonical routing, never routing authority.

### D2. Top-Level Structure

R-TOP-1 (MUST). The CLI has five top-level commands, organized as self, project, run, and serve:

- `setup`: the project install lifecycle. `setup`, `setup reconfigure`, `setup skills`, `setup backup`, `setup remove`.
- `run`: the operation surface (D6).
- `mcp`: the MCP server.
- `update` and `uninstall`: tool and machine-level self-management (D4).

This replaces the current flat top level where the install commands sit beside `operations` and `mcp`.

R-TOP-2 (MUST). `setup remove` replaces the current project-level `uninstall`, which frees the `uninstall` name for machine-level removal in D4.

R-TOP-3 (MUST). Multi-operation families under `run` use a subtree under a domain object; standalone utilities are flat. Subtrees map one-to-one to registry identifiers.

### D3. Bare Command and the No-Command Posture

R-BARE-1 (MUST). Bare `make-docs`, with no subcommand, is context-aware. With no install detected in the working directory, it starts a guided `setup` that asks before writing. With an install present, it shows status and help and does not auto-sync. This preserves the installer-first no-command posture, because bare still installs when appropriate, without forcing a command-router and without silently re-syncing an existing install.

### D4. Tool Self-Management Reconciled With Remote Execution

Because remote execution is the primary posture, most invocations have no persistent binary to manage, so tool self-management is defined around the machine-level footprint rather than assuming a global install.

R-SELF-1 (MUST). `uninstall` removes Make Docs' machine-level footprint: the global store at `~/.make-docs/`, and the installed binary when one is present. For a remote-execution user with no global install, it removes the global store and reports that no binary is installed. This is a hard cutover to this meaning; project removal is only `setup remove`; and it MUST confirm before removing.

R-SELF-2 (MUST). `update` updates a persistent global install where one exists, as a detect-and-delegate wrapper over the install manager that prints the exact command when detection is ambiguous. For remote execution it reports that there is nothing persistent to update, since the runner fetches the requested version, and it applies any global-store schema migration.

R-SELF-3 (MUST NOT). Neither command may guess and then execute a destructive global change. When the install method or intent is ambiguous, it prints the exact command and the affected store path rather than acting.

### D5. The Operation Registry and Shared Core

R-REG-1 (MUST). A single operation registry is the source of truth for which deterministic operations exist. Identifiers follow a `domain.verb` or `domain.object.verb` convention, lowercase, dot-separated, with hyphenated multiword segments, and are stable and append-only.

R-REG-2 (MUST). The CLI `run` command tree and the MCP tool list are generated from, or at minimum conformance-checked against, the registry, so the two surfaces cannot drift out of parity as they do today.

R-CORE-1 (MUST). Deterministic logic lives in a shared operation core of modular, per-operation modules grouped by domain. It MUST NOT be a monolith; a single shared library does not mean a single shared file. Every operation is a stable identifier, a typed input, a typed output, a mutation classification, and a handler that takes the input and an execution context. Surfaces adapt argv, MCP arguments, or Playbook step inputs into that input and adapt the output back; surfaces contain no operation logic. Handlers return structured data and perform effects only through the injected context, which enforces dry-run, write-permission, and approval uniformly across surfaces; presentation belongs to the surface.

R-CORE-2 (MUST). Dependencies are one-way. Surfaces depend on the core, the core never depends on a surface, and no surface imports another surface.

R-SURF-1 (MUST). The three surfaces over the registry are the CLI `run` command, the MCP tools, and Playbook `operation:` steps. `setup`, `mcp`, `update`, and `uninstall` are CLI lifecycle commands, not registry operations, and a Playbook step MUST NOT install, serve, update, or uninstall the tool.

### D6. The `run` Surface After Pruning

R-RUN-1 (MUST). The `run` surface exposes only registry operations. After pruning it contains:

- `run playbook`: validate, catalog, resolve, capabilities, start, invoke, status, next, advance, gate, resume, close. (`validate` and `catalog` are the operations mandated by R-MODEL-6 of the [Playbook Contract and Model](2026-06-30-playbook-contract-and-model.md) design and MUST both appear on the surface.)
- `run package`: plan, surface-resolve, write.
- The retained work-execution operations only: a work-item identity resolver and the work-execution evidence record and read, keyed to the global-store project-state model. These replace the removed wave, phase, and closeout cluster.

R-RUN-2 (MUST NOT). The derivation, judgment, and generation operations removed by the pruning disposition, meaning the wave-status, work-phase-state, phase-plan, phase-gate decision, scope-guard, and closeout probe, validate, and history logic, MUST NOT be carried into the new `run` surface. They are rebuilt as Playbooks per the inventory disposition.

The exact names of the two retained work operations are an implementation detail; their shape is fixed as one identity resolver and one evidence record-and-read pair.

### D7. Migration and Upgrade Safety

R-MIG-1 (MUST). There are no back-compatibility aliases. The current install base is small enough that aliases add complexity without benefit, so the old command spellings are removed rather than aliased.

R-MIG-2 (MUST). `update`, `setup`, and `setup reconfigure` MUST detect a pre-v2 configuration by its fingerprints and, when found, present a warning that itemizes the changes that could break on upgrade, followed by a choice between backing up and installing the latest version, which is recommended, and cancelling.

R-MIG-3 (MUST). MCP tool names are derived from the registry identifiers, so the MCP renames follow the same registry as the CLI.

### D8. Sequencing

R-SEQ-1 (MUST). Establish the operation core, the registry, and the reorganized command tree first, and move all retained operation logic behind the registry in the same wave to avoid a half-migrated state.

R-SEQ-2 (SHOULD). The internal modularization of the messiest retained logic may be a tracked follow-up. The removal of the pruned operations is tracked separately by the inventory disposition and MUST NOT block the reorganization.

R-SEQ-3 (MUST). The no-scripts migration correctly moved deterministic logic out of skill-local scripts, but the destination for derivation-heavy behavior is a Playbook, not a CLI operation. Only logic that earns a slot by the filter in [NORTHSTAR.md](../assets/artifacts/NORTHSTAR.md), a fact-of-record or a fiddly and genuinely reused canonical-identity or parse primitive, is retained as a registry operation.

### D9. Non-Negotiable Decisions and Deliberately Open Choices

Fixed by this design and MUST NOT be substituted, relaxed, or reinvented:

- The five-command top-level structure and the self, project, run, serve organization (R-TOP-1).
- Context-aware bare preserving the no-command posture (R-BARE-1).
- `uninstall` as machine-footprint removal with a hard cutover, and self-management framed around remote execution (R-SELF-1, R-SELF-2).
- The registry as the single source with surfaces derived from it (R-REG-1, R-REG-2).
- The shared modular core with a uniform operation contract and one-way dependencies (R-CORE-1, R-CORE-2).
- `run` exposes registry operations only, and the pruned run surface (R-SURF-1, R-RUN-1, R-RUN-2).
- No aliases plus pre-v2 detection (R-MIG-1, R-MIG-2).

Deliberately left to the implementer and MUST NOT be treated as under-specified gaps:

- The exact names of the two retained work operations.
- The pre-v2 fingerprint set and the warning copy.
- The install-manager detection matrix for self-management.
- The internal module layout of the operation core.

### D10. Verification and Testability

R-TEST-1 (MUST). A test MUST assert that the CLI `run` tree and the MCP tool list are both derived from or conformance-checked against the registry, with no operation present in one surface and absent in the other.

R-TEST-2 (MUST). A test MUST assert that surfaces contain no operation logic, by invoking an operation through the core without the CLI parser or MCP transport.

R-TEST-3 (MUST). A test MUST assert that `run` exposes no `setup`, `mcp`, `update`, or `uninstall` operation, and that a Playbook step cannot invoke tool lifecycle.

R-TEST-4 (MUST). A test MUST assert that pre-v2 detection triggers the warning-and-choice flow, that `uninstall` confirms and does not delete repository content, and that the pruned operations are absent from the `run` surface.

## Alternatives Considered

Keep the flat top level, with install commands beside `operations` and `mcp`. Rejected. It mixes three concerns and leaves no home for tool self-management.

Replace the no-command install with an init or update command-router. Rejected, preserving the installer-first posture. Bare stays context-aware and still installs when appropriate.

Ship deprecated aliases for the renamed commands. Rejected. The small install base makes aliases pure complexity; pre-v2 detection replaces them.

Use flag style for multi-operation families. Rejected. It hides multiple operations behind one command and breaks the one-to-one map to registry identifiers.

Nest packaging under the playbook object. Rejected. A distributable can bundle unrelated playbooks, so packaging is its own object.

Hand-maintain the CLI and MCP surfaces separately. Rejected. That is the current drift; both surfaces are derived from the registry instead.

Carry the full wave, phase, and closeout operation cluster into the `run` surface. Rejected per the pruning disposition. Derivation logic becomes Playbooks.

Design for a future Rust runtime. Rejected. Rust is shelved and TypeScript is the v2 runtime authority.

## Consequences

The reorganization gives a clean self, project, run, serve separation, and tool self-management exists while being honest about the remote-execution posture. The registry makes the reorganization safe, because Playbooks and MCP reference identifiers rather than command spellings, and it ends the CLI and MCP parity drift by deriving both surfaces from one source. The `run` surface is markedly smaller after pruning: playbook, package, and two retained work operations.

This design depends on the operation-core refactor, on the global store project-state model for the retained work operations, and on the pre-v2 detection flow. Any template-owned instruction router, guide, or README that names old command spellings, such as `operations` or the project-level `uninstall`, must be updated upstream in the template per the maintainer dogfooding rule.

## Design Lineage

Update Mode: new-doc-related.

Prior Design Docs: [CLI Separation and MCP Boundary](2026-06-20-cli-separation-and-mcp-boundary.md), [TypeScript CLI and MCP Runtime Pivot](2026-06-26-typescript-cli-and-mcp-runtime-pivot.md), [No-Scripts Migration and Skill Refactor](2026-06-20-no-scripts-migration-and-skill-refactor.md), [Run Playbook State Machine](2026-07-01-run-playbook-state-machine.md), [Global Store and Project State](2026-07-01-global-store-and-project-state.md).

Reason: This design reorganizes the command tree into self, project, run, and serve, formalizes the operation registry and shared modular core that the CLI, MCP, and Playbook steps are surfaces over, reconciles tool self-management with the remote-execution posture, and reflects the pruning of derivation operations. It preserves the CLI and MCP boundary, the TypeScript runtime authority, and the modular-domains development contract.

## Intended Follow-On

Route: `change-plan`

Next Prompt: [designs-to-plan-change.prompt.md](../../.make-docs/references/system/prompts/designs-to-plan-change.prompt.md)

Why: This is a corrective evolution of the active W18 CLI and operations surface. It formalizes the registry and reorganizes the tree against the active PRD namespace rather than starting a fresh baseline.

Coordinate Handoff: Reorganizes the W18 CLI and operations command surface, formalizes the operation registry and shared core, and reflects the operation pruning. Downstream coordinate: W18 R11, planned as [PRD 39](../prd/39-cli-command-model-and-operation-registry.md) with a generated plan and work backlog.

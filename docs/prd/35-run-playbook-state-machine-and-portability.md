---
title: "35 Run Playbook State Machine and Portability"
kind: "prd"
status: "active"
source:
  type: "design"
  path: "docs/designs/2026-07-01-run-playbook-state-machine.md"
---

# 35 Run Playbook State Machine and Portability

## Purpose

This document defines the current product contract for portable playbook execution, resumable state, nesting, and concurrency. Normative requirements are stated in the sections below; Requirement History is provenance only.
## Scope

This authority owns portable playbook execution, resumable state, nesting, and concurrency. Related PRDs own adjacent capabilities and are linked where a cross-boundary contract is required.
## Component and Capability Map

The requirements below define the owned components, behaviors, boundaries, and evidence expectations for this capability.
## Requirements

The requirements below are the normative authority. Their stable identifiers preserve traceability to the originating [run playbook state-machine design](../designs/2026-07-01-run-playbook-state-machine.md), which is provenance rather than product authority.

### Scope, Boundaries, and Execution Invariants (R-SCOPE, R-KEEP)

- R-SCOPE-1 (MUST NOT): this authority owns run-state record content, progression operations and semantics, execution by step mode, digest-aware resume, run-time guardrails, and run portability. [34-playbook-authoring-contract-and-model.md](34-playbook-authoring-contract-and-model.md) owns the Playbook document and parsed model; [38-global-store-and-project-state.md](38-global-store-and-project-state.md) owns physical store schema, locking, recovery, and project identity; [39-cli-command-model-and-operation-registry.md](39-cli-command-model-and-operation-registry.md) owns registry materialization and CLI grammar; [36-playbook-packaging-compiler-and-harness-adapters.md](36-playbook-packaging-compiler-and-harness-adapters.md) owns packaging; and PRDs [20](20-agent-harness-conformance-and-support-claims.md), [43](43-conformance-scenario-model-and-execution-kits.md), and [44](44-conformance-lab-sessions-and-evidence.md) own conformance. This authority does not redefine those contracts.
- R-SCOPE-2 (MUST): PRD 34 owns resolver identity and the orchestration-policy field shape, while [24-project-configuration-and-convention-overlay.md](24-project-configuration-and-convention-overlay.md) owns the `harnessCapabilities` configuration surface. This PRD consumes those declarations and owns their execution semantics.
- R-KEEP-1 (MUST): `persona/slug` is the resolver identity, `stack` is a required validation discriminator, and ambiguous bare selection fails closed. The workflow header may declare `requires_capabilities`, `prefers_capabilities`, `child_playbooks`, and `concurrency`. Canonical capability identifiers are `goal_managed_execution`, `long_running_runs`, `resume_after_interrupt`, `parallel_playbook_runs`, `subagent_delegation`, and `user_gate_prompts`, with stable ids and configuration-rendered labels. Reviewed `harnessCapabilities` records are hints, never routing authority; unknown capabilities are never guessed, optional unknowns fall back to serial gated execution, and required unknowns stop for manual review. Harness goals and long-running features are assists, while Make Docs-owned run state remains authoritative for recovery, audit, nesting, and overlap checks.

### Generic Run Playbook Model

Run Playbook is a generic execution model, not a plugin or packaging rule. Every Playbook that validates under [34-playbook-authoring-contract-and-model.md](34-playbook-authoring-contract-and-model.md) can be executed by this model or followed by hand without first being packaged.

A Run Playbook surface must:

1. Select exactly one Playbook by explicit path, qualified `persona/slug`, unambiguous bare slug or title, or catalog entry, using PRD 34 R-SELECT.
2. Parse and validate the current document, dependency, and workflow schemas and fail closed before execution when the model has any error or the `kind`, `persona`, `stack`, `schema`, or `workflowSchema` discriminator is missing or invalid.
3. Load the referenced authority sources in the precedence order declared by the Playbook's `## Inputs` section and dependency model; neither configuration nor a harness adapter may reorder those authorities.
4. Resolve configuration overlays for labels, defaults, preconditions, and presentation only. Canonical lifecycle routing, artifact ownership, Playbook identity, operation identifiers, and output destinations remain unchanged by configuration.
5. Execute the parsed procedure step by step using the step mode, dependency, routing, and evidence rules below.
6. Stop at gates and user-decision points unless that gate explicitly permits unattended continuation and the run satisfies that allowance; a harness prompt capability does not itself grant permission to continue.
7. Treat CLI, MCP, plugin, skill, subagent, goal-management, and long-running facilities as assists unless the Playbook marks the corresponding dependency or capability as required. Unknown optional capabilities degrade to serial gated execution; unknown or unsupported required capabilities stop with manual-review guidance.
8. Claim and record outputs only in a surface declared by the Playbook or named by an explicit caller instruction, following [23-generated-document-metadata-and-lifecycle-handoffs.md](23-generated-document-metadata-and-lifecycle-handoffs.md); output claims are established before mutation so the overlap guardrails can serialize or stop unsafe work.

Plugin, skill, CLI, and MCP surfaces may invoke these operations, but they do not redefine selection, authority order, configuration precedence, gates, output routing, state ownership, or Playbook validity.

### Run-State Storage and Record (R-STORE, R-STATE)

- R-STORE-1 (MUST): run state is stored only in the global store at `~/.make-docs/`; it must not be written under `.make-docs/runs/` or any other repository path.
- R-STORE-2 (MUST): run state is keyed by the stable project identifier minted at setup and recorded in the project manifest plus a run identifier, never by directory path; for run state the global store is canonical and relocated with no in-repo copy, in contrast to install information, which is mirrored from the project manifest.
- R-STORE-3 (reference): [PRD 38](38-global-store-and-project-state.md) owns the Global Store's physical schema, concurrency model, and project-identifier scheme; this PRD requires only that run state is stored there and keyed as in R-STORE-2.
- R-STATE-1 (MUST): the run-state record contains at least run identifier, root run identifier, parent run identifier, project identifier, playbook ref, source digest, document and workflow schema versions, stack, harness, capability snapshot, routing model, per-step status, gate decisions, dependency availability snapshot, claimed output surfaces, output and evidence references, the current cursor of step or gate, child run references, resume hints, timestamps, and terminal status.
- R-STATE-2 (MUST): step status values are exactly the shared Playbook vocabulary — `pending`, `running`, `blocked`, `waiting-for-user`, `completed`, `failed`, `skipped`, `cancelled` — and the runner must not introduce a parallel vocabulary.

- R-STATE-1 resume hints are subject-scoped: each hint records the step or gate it advises about, every mutating transition retires hints whose subject has reached a resolved status, and `close` retires all guidance hints so a closed run carries none. Hints are current guidance only; the evidence log is the durable audit trail, and serialization changes are additive under the global store's schema-versioning rules.

### Progression Operations (R-OP)

- R-OP-1 (MUST): the runner exposes `playbook.start` (read then write: create a run from a validated Playbook model), `playbook.status` (read: read the current run state), `playbook.next` (read: compute the next executable step from state plus model, respecting dependencies, gates, and routing, without mutating), `playbook.advance` (write: record completion or failure of the current step, capture its evidence, transition status, and compute the next cursor), `playbook.gate` (write: record a gate decision with its evidence and either unblock or stop), `playbook.resume` (read then write: re-enter a run, digest-checked per R-RESUME-1), and `playbook.close` (write: finalize a run with a terminal status and closeout evidence); each is a Make Docs operation addressed by a stable registry identifier, surfaced on the CLI under `run playbook` and as MCP tools, with mutating operations honoring the uniform operation-core safety gating.
- R-OP-2 (MUST): the complete operation family includes create (`playbook.start`), invoke, read (`playbook.status` and `playbook.next`), progression (`playbook.advance` and `playbook.gate`), re-entry (`playbook.resume`), and finalization (`playbook.close`); every listed operation is available through the registry-derived surfaces.
- R-OP-3 (MUST): `playbook.next` is side-effect free; only `playbook.advance`, `playbook.gate`, and `playbook.close` may transition state, `playbook.start` may create it, and no other operation may write run state.

### Execution by Step Mode (R-MODE)

- R-MODE-1 (MUST): the parsed step execution mode governs `playbook.advance` and the degradation guarantee — `deterministic` resolves the step's `operation` or `command`, executes it (an operation through the operation core, a command through the shell), captures the structured result as run evidence, and transitions automatically, and when the CLI is absent resolves the operation identifier to its human CLI form and presents that command for the reader to run by hand; `delegated` presents the step instructions, sets the step to `waiting-for-user`, and waits for a subsequent `playbook.advance` carrying the reported outcome and evidence, with the same instructions usable directly without the CLI; `manual` is documentation only, recording acknowledgment without executing.
- R-MODE-2 (MUST): a step whose mode is unspecified is treated as `delegated`.

### Digest-Aware Resume (R-RESUME)

- R-RESUME-1 (MUST): on `playbook.resume` the runner compares the stored source digest with the current Playbook digest; a match resumes at the stored cursor, and a mismatch marks the run stale and by default blocks, requires an explicit re-plan, and emits a diagnostic naming the change; the runner must never silently resume against a changed workflow.
- R-RESUME-2 (MAY): an explicit re-plan may offer optional remapping of still-present step identifiers and flag added or absent steps; remapping is never the default response to a digest mismatch.

### Run-Time Guardrails (R-GUARD)

- R-GUARD-1 (MUST): nested Playbooks are allowed only when the parent's orchestration policy permits child Playbooks; a child run links to its parent through child-run references and a shared root run identifier, and serial child runs are the default.
- R-GUARD-2 (MUST): parallel child runs require explicit parent permission, a harness capability or reviewed approval supporting parallel execution, and non-overlapping claimed output surfaces; if overlap cannot be proven safe, the runner serializes the work or stops for review.
- R-GUARD-3 (MUST): when two steps or runs would claim the same output surface, the runner stops rather than interleaving writes.
- R-GUARD-4 (MUST): in unattended mode, only steps whose gates permit unattended continuation proceed without a human; all other gate steps set `waiting-for-user` and hold.

### Portability (R-PORT)

- R-PORT-1 (MUST): because run state is machine-local, cross-machine handoff is served by explicit export and import of a run, which serializes the run record and its evidence into a portable artifact and rehydrates it elsewhere; export and import are opt-in and must not place run state into the repository by default.

### The Three Tiers in Motion (R-TIER)

- R-TIER-1 (MUST): the runner realizes the three-tier degradation guarantee — with neither Make Docs nor the CLI present there is no engine and the Playbook is structured documentation a reader executes by hand; with Make Docs resources present but no CLI an agent reads the same structure and the operation registry's documented command forms and executes without tracking; with the CLI present the full engine runs and records state in the global store.

### Verification and Testability (R-TEST)

- R-TEST-1 (MUST): each progression operation has tests covering its success and failure transitions, including that `playbook.next` never mutates state.
- R-TEST-2 (MUST): resume is tested for both a matching digest, which resumes, and a mismatched digest, which blocks with a diagnostic.
- R-TEST-3 (MUST): each execution mode is tested — a deterministic step that executes and auto-transitions, a delegated step that holds at `waiting-for-user` and advances on a reported outcome, and a manual step that records acknowledgment.
- R-TEST-4 (MUST): the guardrails are tested — a parallel child run blocked by output-surface overlap, and an unattended run that holds at a gate requiring a human.
- R-TEST-5 (MUST): a test asserts that no run state is written under `.make-docs/runs/` or any repository path.

Global-store run state, the shared status vocabulary, the read-versus-mutate operation classification, digest-blocked resume, and the execution invariants above are non-substitutable. Implementations may choose the concrete in-store serialization, internal engine structure, captured-evidence encoding sufficient for audit and resume, and any optional explicit re-plan mapping algorithm.

Code anchors:

- `packages/cli/src/operations/playbook/index.ts`
- `packages/cli/src/cli.ts`
## Contracts and Data

The named paths, schemas, state records, metadata fields, and evidence shapes in Requirements are normative contracts for this capability.
## Integrations

This capability integrates with the adjacent current authorities linked from Requirements and Source Anchors; those authorities remain owners of their own boundaries.
## Rebuild Notes

A rebuild must preserve the requirement identifiers, stable semantic anchors, ownership boundaries, and failure-safe behavior stated here. Implementation evidence does not silently weaken this authority.
## CLI Portability Boundary

Run identifiers, resume hints, and execution flags must retain stable agent semantics across human-friendly renderings. PRD 39 owns command grammar and rendering; this state-machine authority owns the state transitions those commands invoke.

`playbook.run.export` serializes a run and its evidence to a caller-named portable artifact or returns it inline; it never writes into the repository by default. `playbook.run.import` validates that artifact and rehydrates it into the importing repository's Project State in the machine-level Global Store. Both operations are explicit writes and therefore consume the same permission and dry-run gates as other mutating registry operations.

## Requirement History

### 2026-08-08 — Not assigned

- Affected requirement or section: `Consolidated capability ownership`
- Previous contract: Current requirements were also represented by standalone editorial PRDs 29, 41.
- Replacement contract: The applicable current requirements are inline in this authority and its linked product owners; the standalone editorial records are retired from the active set.
- Rationale: Active PRDs own product subjects and do not preserve editorial operations as product authority.
- Source: [PRD Authority Maintenance](../../.make-docs/references/system/prd-change-management.md)


### 2026-08-08 — W18 R7

- Affected requirement or section: `Document identity and current authority`
- Previous contract: The capability was represented as a standalone editorial change record whose title and structure described how the PRD set was modified.
- Replacement contract: This document now states the current portable playbook execution, resumable state, nesting, and concurrency requirements inline as product authority.
- Rationale: Active PRDs describe the current product shape; editorial operations belong in plans, work, and history.
- Source: [Run Playbook state-machine design](../designs/2026-07-01-run-playbook-state-machine.md)
## Source Anchors

- [../designs/2026-07-01-run-playbook-state-machine.md](../designs/2026-07-01-run-playbook-state-machine.md)
- [../designs/2026-06-27-run-playbook-orchestration-and-harness-capabilities.md](../designs/2026-06-27-run-playbook-orchestration-and-harness-capabilities.md)
- [../designs/2026-06-30-playbook-contract-and-model.md](../designs/2026-06-30-playbook-contract-and-model.md)
- [../assets/artifacts/playbook-architecture.md](../assets/artifacts/playbook-architecture.md)
- [../assets/artifacts/runtime-and-global-store.md](../assets/artifacts/runtime-and-global-store.md)
- [../assets/artifacts/cli-command-reorganization.md](../assets/artifacts/cli-command-reorganization.md)
- [../plans/2026-07-01-w18-r7-run-playbook-state-machine/00-overview.md](../plans/2026-07-01-w18-r7-run-playbook-state-machine/00-overview.md)
- [../work/2026-07-01-w18-r7-run-playbook-state-machine/00-index.md](../work/2026-07-01-w18-r7-run-playbook-state-machine/00-index.md)
- [34 Playbook Authoring Contract and Model](34-playbook-authoring-contract-and-model.md)
- [30 Harness Plugin Substrate Workflow Bundles](30-plugin-substrate-and-workflow-bundles.md)
- [21 Tool Directory System Custom Resource Tiers](21-project-tool-directory-and-resource-tiers.md)
- [05 Installation Profile and Manifest Lifecycle](05-installation-profile-and-manifest-lifecycle.md)
- [10 Packaging Validation and Release Reference](10-packaging-validation-and-release-reference.md)
- [34 Playbook Contract and Model](34-playbook-authoring-contract-and-model.md)
- [24 Configuration Convention Overlay](24-project-configuration-and-convention-overlay.md)
- [25 CLI Separation and MCP Boundary](25-typescript-runtime-cli-mcp-operation-boundaries.md)
- `packages/cli/src/operations/playbook/index.ts`
- `packages/cli/src/mcp/tools.ts`
- `scripts/smoke-pack.mjs`

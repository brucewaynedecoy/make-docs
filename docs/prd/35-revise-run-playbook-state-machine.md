---
title: "35 Revise Run Playbook State Machine"
kind: "prd"
status: "active"
coordinate: "W18 R7"
source:
  type: "design"
  path: "docs/designs/2026-07-01-run-playbook-state-machine.md"
---

# 35 Revise Run Playbook State Machine

## Purpose

Make the deterministic Run Playbook state machine an active requirement: the run-state record, the progression operations that advance a run through the Playbook model, execution by step mode, digest-aware resume, run portability, and the nested, parallel, and unattended guardrails as they act at run time. This change belongs in the active PRD namespace because it revises the W18 R4 run-state requirements PRD 29 carries — the current implementation can create and read run state but has no `next`, `advance`, `gate`, `resume`, or `close`, and it writes run state into the repository, reintroducing the per-repo operational-noise pattern Make Docs v2 otherwise removes. This PRD adds the missing engine and relocates run state to the global store while consuming the W18 R6 Playbook model from [34-revise-playbook-contract-and-model.md](34-revise-playbook-contract-and-model.md) unchanged.

## Change Type

Revision. This PRD supersedes the on-disk run-state location `.make-docs/runs/playbooks/<run-id>/state.json` from the PRD 29 W18 R4 lineage, extends the required run-state field set, and replaces the create-and-read-only runner with the full progression engine. It does not revise resolver identity, the orchestration policy fields, the canonical harness-capability identifiers, the `harnessCapabilities` config surface, unknown-capability handling, the Playbook model, the global-store schema, the operation registry and CLI tree, or the packaging compiler and adapters; those remain governed by their owning docs and designs.

Route: `change-plan`

Coordinate: `W18 R7`

## Baseline Being Revised or Removed

- [29-revise-playbook-contract-run-playbook.md](29-revise-playbook-contract-run-playbook.md): under Run State, Nesting, and Concurrency, the `.make-docs/runs/playbooks/<run-id>/state.json` write location is superseded — run state moves to the global store with no in-repo copy — and the required run-state field set is extended with the project identifier, the source digest, the dependency availability snapshot, and evidence references. Under Generic Run Playbook Model, the eight-step generic model remains active and is enhanced: its selection, validation, step execution, gate, and output-recording behavior are now realized by named progression operations with a read-versus-mutate classification rather than left as an abstract surface obligation. Resolver identity, stack semantics, harness capability mediation, nested-playbook permission, and concurrency rules in PRD 29 remain active and are consumed unchanged.
- [30-revise-harness-plugin-substrate-workflow-bundles.md](30-revise-harness-plugin-substrate-workflow-bundles.md): the Playbook Boundary's `.make-docs/runs/playbooks/**` state literal is superseded; plugins and workflow bundles still delegate resolver, capability, run-state, nested-run, and concurrency behavior to the runner, and that delegation now targets global-store run state and the progression operations defined here.
- [21-revise-tool-directory-system-custom-resource-tiers.md](21-revise-tool-directory-system-custom-resource-tiers.md): the runtime-state family's inclusion of temporary run state as in-repo `.make-docs/**` runtime state is superseded for playbook run state, which becomes machine-local global-store data; `manifest.json`, `conflicts/`, provider/cache metadata, and audit state are unchanged, and the broader `.make-docs/` runtime-state guidance reconciliation is owned by the Runtime and Global Store lineage.

## Rationale

The runner today has create, invoke, and read capabilities and nothing else: there is no progression engine, so a structured Playbook cannot actually be advanced, gated, resumed, or closed, and Playbook-driven workflow behavior cannot be tested. Run state is also written into the repository, which duplicates operational data into every project and is the specific anti-pattern the global store exists to remove. The W18 R6 Playbook model now provides the deterministic step model, execution modes, and shared status vocabulary the engine needs, so the engine and the relocation land together as one corrective revision.

Code anchors:

- `packages/cli/src/operations/playbook/index.ts`
- `.make-docs/runs/`
- `docs/assets/artifacts/playbook-architecture.md`
- `docs/assets/artifacts/runtime-and-global-store.md`

## Effective Requirement

The effective requirement set carries the design's requirement IDs so traceability holds; [../designs/2026-07-01-run-playbook-state-machine.md](../designs/2026-07-01-run-playbook-state-machine.md) is the normative statement of each.

### Scope, Boundaries, and Preserved Decisions (R-SCOPE, R-KEEP)

- R-SCOPE-1 (MUST NOT): this change owns exactly the run-state record content, the progression operations and their semantics, execution by step mode, digest-aware resume, the run-time guardrails, and run portability. The Playbook document schema, workflow contract, step model, parser, and validator (owned by the W18 R6 lineage in [34-revise-playbook-contract-and-model.md](34-revise-playbook-contract-and-model.md)); the global store's physical schema, concurrency and locking model, corruption and recovery behavior, and the stable project-identifier scheme (owned by the Runtime and Global Store lineage, see [../assets/artifacts/runtime-and-global-store.md](../assets/artifacts/runtime-and-global-store.md)); the operation registry's materialization and the CLI command tree (see [../assets/artifacts/cli-command-reorganization.md](../assets/artifacts/cli-command-reorganization.md)); and the packaging compiler, harness adapters, and conformance must not be redefined or reinvented here.
- R-SCOPE-2 (MUST): the resolver identity, the optional `run` orchestration policy field set, the canonical harness-capability identifiers, the `harnessCapabilities` config surface, and the unknown-capability handling rules are inherited from the W18 R4 lineage in [29-revise-playbook-contract-run-playbook.md](29-revise-playbook-contract-run-playbook.md) and [24-revise-configuration-convention-overlay.md](24-revise-configuration-convention-overlay.md) and are consumed unchanged; this PRD defines their run-time behavior only where that lineage left it to the runner.
- R-KEEP-1 (MUST): the W18 R4 decisions are preserved unchanged — `persona/slug` resolver identity with `stack` as a required validation discriminator and fail-closed bare selection; the orchestration policy fields `requires_capabilities`, `prefers_capabilities`, `child_playbooks`, and `concurrency` carried on the workflow header per W18 R6; the canonical capability identifiers `goal_managed_execution`, `long_running_runs`, `resume_after_interrupt`, `parallel_playbook_runs`, `subagent_delegation`, and `user_gate_prompts` with stable ids and configuration-rendered labels; reviewed harness capabilities in `.make-docs/config.yaml` under `harnessCapabilities` as a hint surface that is never routing authority; unknown capabilities never guessed, with serial gated fallback for optional capabilities and a manual-review stop for required ones; and harness goal or long-running features treated as assists while Make Docs-owned run state remains the source of truth for recovery, audit, nested runs, and overlap checks.

### Run-State Storage and Record (R-STORE, R-STATE)

- R-STORE-1 (MUST): run state is stored in the global store at `~/.make-docs/`; this supersedes `.make-docs/runs/playbooks/<run-id>/state.json`, and run state must not be written under `.make-docs/runs/` or any other repository path.
- R-STORE-2 (MUST): run state is keyed by the stable project identifier minted at setup and recorded in the project manifest plus a run identifier, never by directory path; for run state the global store is canonical and relocated with no in-repo copy, in contrast to install information, which is mirrored from the project manifest.
- R-STORE-3 (reference): the global store's physical schema, concurrency model, and the project-identifier scheme are owned by the Runtime and Global Store lineage; this PRD requires only that run state is stored there and keyed as in R-STORE-2.
- R-STATE-1 (MUST): the run-state record contains at least run identifier, root run identifier, parent run identifier, project identifier, playbook ref, source digest, document and workflow schema versions, stack, harness, capability snapshot, routing model, per-step status, gate decisions, dependency availability snapshot, claimed output surfaces, output and evidence references, the current cursor of step or gate, child run references, resume hints, timestamps, and terminal status; this extends the PRD 29 field set with the project identifier, the source digest, the dependency availability snapshot, and evidence references.
- R-STATE-2 (MUST): step status values are exactly the shared vocabulary from the W18 R6 lineage — `pending`, `running`, `blocked`, `waiting-for-user`, `completed`, `failed`, `skipped`, `cancelled` — and the runner must not introduce a parallel status vocabulary.

### Progression Operations (R-OP)

- R-OP-1 (MUST): the runner exposes `playbook.start` (read then write: create a run from a validated Playbook model), `playbook.status` (read: read the current run state), `playbook.next` (read: compute the next executable step from state plus model, respecting dependencies, gates, and routing, without mutating), `playbook.advance` (write: record completion or failure of the current step, capture its evidence, transition status, and compute the next cursor), `playbook.gate` (write: record a gate decision with its evidence and either unblock or stop), `playbook.resume` (read then write: re-enter a run, digest-checked per R-RESUME-1), and `playbook.close` (write: finalize a run with a terminal status and closeout evidence); each is a Make Docs operation addressed by a stable registry identifier, surfaced on the CLI under `run playbook` and as MCP tools, with mutating operations honoring the uniform operation-core safety gating.
- R-OP-2 (MUST): `playbook.start`, an invoke-style variant, and `playbook.status` correspond to the create, invoke, and read capabilities that exist today; `playbook.next`, `playbook.advance`, `playbook.gate`, `playbook.resume`, and `playbook.close` are the operations the current implementation lacks and must be implemented.
- R-OP-3 (MUST): `playbook.next` is side-effect free; only `playbook.advance`, `playbook.gate`, and `playbook.close` may transition state, `playbook.start` may create it, and no other operation may write run state.

### Execution by Step Mode (R-MODE)

- R-MODE-1 (MUST): the W18 R6 step execution mode governs what `playbook.advance` does and is the mechanism of the degradation guarantee — `deterministic` resolves the step's `operation` or `command`, executes it (an operation through the operation core, a command through the shell), captures the structured result as run evidence, and transitions automatically, and when the CLI is absent resolves the operation identifier to its human CLI form and presents that command for the reader to run by hand; `delegated` presents the step instructions, sets the step to `waiting-for-user`, and waits for a subsequent `playbook.advance` carrying the reported outcome and evidence, with the same instructions usable directly without the CLI; `manual` is documentation only, recording acknowledgment without executing.
- R-MODE-2 (MUST): a step whose mode is unspecified is treated as `delegated`, consistent with the W18 R6 default.

### Digest-Aware Resume (R-RESUME)

- R-RESUME-1 (MUST): on `playbook.resume` the runner compares the stored source digest with the current Playbook digest; a match resumes at the stored cursor, and a mismatch marks the run stale and by default blocks, requires an explicit re-plan, and emits a diagnostic naming the change; the runner must never silently resume against a changed workflow.
- R-RESUME-2 (MAY): optional migration that re-maps still-present step identifiers and flags added or removed steps may be offered as an enhancement, and it must not be the default behavior for a digest mismatch.

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

The design's D9 section fixes global-store run state, the shared status vocabulary, the operation set with its read-versus-mutate classification, digest-blocked resume, and the D1 preserved decisions as non-substitutable, while leaving the concrete run-state serialization within the store, the internal engine structure, the exact captured-evidence format sufficient for audit and resume, and the optional migration algorithm details to the implementer.

Code anchors:

- `packages/cli/src/operations/playbook/index.ts`
- `packages/cli/src/cli.ts`

## Impacted Docs and Dependencies

### Change Notes

- Enhanced by [38-revise-global-store-and-project-state.md](38-revise-global-store-and-project-state.md). The Runtime and Global Store lineage this PRD sequences after is now active as W18 R10: PRD 38 owns the global store at `~/.make-docs/`, its SQLite schema versioning, migration, WAL concurrency, and graceful-recovery obligations, the manifest-minted stable project identifier, and the unified project-state model in which this PRD's run-state records are one facet; the cross-design sequencing dependency below resolves to the W18 R10 backlog phases that land the store and identifier.
- Enhanced by [39-revise-cli-command-reorganization-and-operation-registry.md](39-revise-cli-command-reorganization-and-operation-registry.md). The CLI reorganization lineage this PRD consumed as an external contract is now active as W18 R11: PRD 39 owns the append-only operation registry, the stable `domain.verb` identifiers, the shared operation core with its uniform safety gating, and the `run playbook` subtree on which the progression operations in R-OP-1 are surfaced, with the MCP tool names derived from the same registry identifiers; the progression semantics remain owned here, and the external-contract reference below to the CLI reorganization artifact resolves to PRD 39.

- [29-revise-playbook-contract-run-playbook.md](29-revise-playbook-contract-run-playbook.md): the run-state write location and required field set under Run State, Nesting, and Concurrency are superseded, and the Generic Run Playbook Model is enhanced by the progression operations; resolver identity, stack semantics, harness capability mediation, nesting permission, and concurrency rules remain active there.
- [30-revise-harness-plugin-substrate-workflow-bundles.md](30-revise-harness-plugin-substrate-workflow-bundles.md): the Playbook Boundary's `.make-docs/runs/playbooks/**` state literal is superseded; plugin and workflow-bundle delegation to the runner is unchanged and now reaches global-store run state through the operations defined here.
- [21-revise-tool-directory-system-custom-resource-tiers.md](21-revise-tool-directory-system-custom-resource-tiers.md): playbook run state leaves the in-repo runtime-state family; the remaining runtime state and tool-resource tiers are unchanged.
- [05-installation-profile-and-manifest-lifecycle.md](05-installation-profile-and-manifest-lifecycle.md): the W18 R4 note placing playbook run state under `.make-docs/runs/playbooks/**` is superseded; manifest and config ownership are unchanged.
- [10-packaging-validation-and-release-reference.md](10-packaging-validation-and-release-reference.md): the W18 R4 packaged-runner validation coverage of `.make-docs/runs/playbooks/**` state is superseded; packaged validation now covers global-store-backed progression operations and proves no run state is written under repository paths or shipped in templates or tarballs.
- [34-revise-playbook-contract-and-model.md](34-revise-playbook-contract-and-model.md): consumed unchanged — the runner advances the single parsed Playbook model, uses its step modes and `delegated` default, and shares its status vocabulary; PRD 34 already records this state machine as a gated downstream consumer, so no annotation is required there.
- [24-revise-configuration-convention-overlay.md](24-revise-configuration-convention-overlay.md): consumed unchanged — reviewed `harnessCapabilities` records stay a hint surface subordinate to canonical resolution; no annotation is required there.
- Cross-design sequencing dependency: run-state storage depends on the global store, its concurrency model, and the stable project identifier owned by the Runtime and Global Store lineage ([../assets/artifacts/runtime-and-global-store.md](../assets/artifacts/runtime-and-global-store.md), design planned as W18 R10); implementation of R-STORE-1 and R-STORE-2 is sequenced after that store is available, and this PRD defines only what run state requires of the store.
- External contracts consumed: the operation registry and stable operation identifiers surfaced under `run playbook` ([../assets/artifacts/cli-command-reorganization.md](../assets/artifacts/cli-command-reorganization.md)), and the CLI/MCP operation-boundary rules in [25-revise-cli-separation-and-mcp-boundary.md](25-revise-cli-separation-and-mcp-boundary.md).

Code anchors:

- `packages/cli/src/operations/playbook/index.ts`
- `packages/cli/src/mcp/tools.ts`
- `scripts/smoke-pack.mjs`

## Required Baseline Annotations

- [29-revise-playbook-contract-run-playbook.md](29-revise-playbook-contract-run-playbook.md): `Superseded by` under Run State, Nesting, and Concurrency; `Enhanced by` under Generic Run Playbook Model; plus a W18 R7 paragraph in its doc-level Change Notes.
- [30-revise-harness-plugin-substrate-workflow-bundles.md](30-revise-harness-plugin-substrate-workflow-bundles.md): `Superseded by` under Playbook Boundary for the `.make-docs/runs/playbooks/**` state literal, appended newest-last to the existing block.
- [21-revise-tool-directory-system-custom-resource-tiers.md](21-revise-tool-directory-system-custom-resource-tiers.md): `Superseded by` after the runtime-state requirement text in Effective Requirement for playbook run state.
- [05-installation-profile-and-manifest-lifecycle.md](05-installation-profile-and-manifest-lifecycle.md): `Superseded by` in the Contracts and Data Change Notes for the W18 R4 run-state location note, appended newest-last.
- [10-packaging-validation-and-release-reference.md](10-packaging-validation-and-release-reference.md): `Superseded by` in its Change Notes for the W18 R4 run-state validation coverage, appended newest-last.
- [00-index.md](00-index.md): add PRD 35 to the reading order, document map, source anchors, audience paths, and intended follow-on.
- [03-open-questions-and-risk-register.md](03-open-questions-and-risk-register.md): extend the existing R-016 decision with the W18 R7 run-state relocation, progression operation set, and digest-blocked resume, and add the run-state relocation's global-store sequencing dependency as a rebuild risk.

## Source Anchors

- [../designs/2026-07-01-run-playbook-state-machine.md](../designs/2026-07-01-run-playbook-state-machine.md)
- [../designs/2026-06-27-run-playbook-orchestration-and-harness-capabilities.md](../designs/2026-06-27-run-playbook-orchestration-and-harness-capabilities.md)
- [../designs/2026-06-30-playbook-contract-and-model.md](../designs/2026-06-30-playbook-contract-and-model.md)
- [../assets/artifacts/playbook-architecture.md](../assets/artifacts/playbook-architecture.md)
- [../assets/artifacts/runtime-and-global-store.md](../assets/artifacts/runtime-and-global-store.md)
- [../assets/artifacts/cli-command-reorganization.md](../assets/artifacts/cli-command-reorganization.md)
- [../plans/2026-07-01-w18-r7-run-playbook-state-machine/00-overview.md](../plans/2026-07-01-w18-r7-run-playbook-state-machine/00-overview.md)
- [../work/2026-07-01-w18-r7-run-playbook-state-machine/00-index.md](../work/2026-07-01-w18-r7-run-playbook-state-machine/00-index.md)
- [29 Revise Playbook Contract Run Playbook](29-revise-playbook-contract-run-playbook.md)
- [30 Revise Harness Plugin Substrate Workflow Bundles](30-revise-harness-plugin-substrate-workflow-bundles.md)
- [21 Revise Tool Directory System Custom Resource Tiers](21-revise-tool-directory-system-custom-resource-tiers.md)
- [05 Installation Profile and Manifest Lifecycle](05-installation-profile-and-manifest-lifecycle.md)
- [10 Packaging Validation and Release Reference](10-packaging-validation-and-release-reference.md)
- [34 Revise Playbook Contract and Model](34-revise-playbook-contract-and-model.md)
- [24 Revise Configuration Convention Overlay](24-revise-configuration-convention-overlay.md)
- [25 Revise CLI Separation and MCP Boundary](25-revise-cli-separation-and-mcp-boundary.md)
- `packages/cli/src/operations/playbook/index.ts`
- `packages/cli/src/mcp/tools.ts`
- `scripts/smoke-pack.mjs`

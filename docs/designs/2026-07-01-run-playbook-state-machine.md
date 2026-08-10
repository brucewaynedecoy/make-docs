# Run Playbook State Machine

## Purpose

This design defines the deterministic Run Playbook state machine: the run-state record, the progression operations that advance a run through a Playbook model, execution by step mode and the degradation guarantee in motion, digest-aware resume, run portability, and the nested, parallel, and unattended guardrails as they act at run time.

It exists to close a verified gap. The current implementation can create and read run state but has no progression engine: there is no next, advance, gate, resume, or close. It also writes run state into the repository, which reintroduces the per-repo operational-noise pattern that Make Docs v2 otherwise works to remove. This design adds the engine and relocates run state to the global store.

The full architecture this design draws from is recorded in [Playbook Architecture and Design](../assets/artifacts/playbook-architecture.md), Section 5. This design consumes the Playbook model defined by [Playbook Contract and Model](2026-06-30-playbook-contract-and-model.md), and it preserves, without redefining, the resolver, harness-capability, run-metadata, and concurrency decisions established by [Run Playbook Orchestration and Harness Capabilities](2026-06-27-run-playbook-orchestration-and-harness-capabilities.md).

## Context

A Playbook is the primitive; the runner is the deterministic consumer of the Playbook model. The runner must let a human or agent progress through a structured workflow, respect gates, record status, and produce expected outputs, and it must degrade gracefully across three environments: neither Make Docs nor its CLI present, Make Docs resources present but no CLI, and the CLI present.

Two prior designs frame this one. The contract-and-model design defines the Playbook model the runner advances through, including the shared step-status vocabulary and the optional workflow-header orchestration policy. The Run Playbook orchestration design hardened the runner with resolver identity, an optional `run` orchestration policy, canonical harness-capability identifiers, reviewed harness capabilities in project config, unknown-capability handling, and nested and concurrent execution safety. Those decisions are inherited here and are not reopened.

Two dependencies are owned elsewhere and are referenced, not redefined. Run state is stored in the global store specified in [Runtime and Global Store](../assets/artifacts/runtime-and-global-store.md), which also owns the store's physical schema, its concurrency model, and the stable project-identifier scheme. The progression operations are Make Docs operations addressed by stable identifiers from the operation registry and surfaced on the CLI under `run playbook`; the registry and CLI tree are specified in [CLI Command Reorganization](../assets/artifacts/cli-command-reorganization.md).

This repository is the Make Docs maintainer repo and a dogfood instance. The runner is implemented as Make Docs operation-core code under the CLI package and is ordinary source code, not a dogfooded template asset. Any Make Docs-owned documentation, contract, or config-schema resource this design implies is authored upstream in `packages/docs/template/` and dogfooded downstream, per the maintainer dogfooding rule.

## Decision

### D0. Scope and Boundaries

This design owns exactly: the run-state record content (D2), the progression operations and their semantics (D3), execution by step mode (D4), digest-aware resume (D5), the run-time guardrails (D6), and run portability (D7). Implementers MUST treat these as the complete surface of this design.

R-SCOPE-1 (MUST NOT). The following are owned elsewhere and MUST NOT be redefined or reinvented in this design's implementation:

- The Playbook document schema, workflow contract, step model, dependency registry, Playbook model, parser, and validator. Owned by [Playbook Contract and Model](2026-06-30-playbook-contract-and-model.md).
- The global store's physical schema, concurrency and locking model, corruption and recovery behavior, and the stable project-identifier scheme. Owned by [Runtime and Global Store](../assets/artifacts/runtime-and-global-store.md).
- The operation registry's materialization and the CLI command tree. Owned by [CLI Command Reorganization](../assets/artifacts/cli-command-reorganization.md).
- The packaging compiler, harness adapters, and conformance.

R-SCOPE-2 (MUST). The resolver identity, the optional `run` orchestration policy field set, the canonical harness-capability identifiers, the `harnessCapabilities` config surface, and the unknown-capability handling rules are inherited from the Run Playbook orchestration design and MUST be consumed unchanged. This design defines their run-time behavior only where that design left it to the runner.

### D1. Preserved Prior Decisions

R-KEEP-1 (MUST). The following decisions from the Run Playbook orchestration design MUST be preserved unchanged:

- Resolver identity is `persona/slug`; `stack` is a required validation discriminator, not a directory level; explicit paths select one file; bare selection is allowed only when it resolves to exactly one candidate, otherwise the runner stops and asks.
- The optional orchestration policy fields `requires_capabilities`, `prefers_capabilities`, `child_playbooks`, and `concurrency`, now carried on the workflow header per the contract-and-model design.
- The canonical harness-capability identifiers `goal_managed_execution`, `long_running_runs`, `resume_after_interrupt`, `parallel_playbook_runs`, `subagent_delegation`, and `user_gate_prompts`. Identifiers are stable; later additions keep ids canonical and treat labels as configuration-rendered text.
- Reviewed harness capabilities live in `.make-docs/config.yaml` under `harnessCapabilities` as a hint surface, subordinate to canonical playbook, stack, harness, and output-surface resolution. Config is never routing authority.
- Unknown capabilities are never guessed: inspect and request review before persisting a finding, fall back to serial gated execution when the capability is optional, or stop with a manual-review requirement when it is required.
- A harness's own goal or long-running feature is an assist; Make Docs-owned run state remains the source of truth for recovery, audit, nested runs, and overlap checks.

### D2. Run-State Storage and Record

R-STORE-1 (MUST). Run state MUST be stored in the global store at `~/.make-docs/`. This SUPERSEDES the prior on-disk location `.make-docs/runs/playbooks/<run-id>/state.json` from the Run Playbook orchestration design. Run state MUST NOT be written under `.make-docs/runs/` or any other repository path.

R-STORE-2 (MUST). Run state MUST be keyed by a stable project identifier plus a run identifier. The project identifier is minted at setup and recorded in the project manifest; the runner MUST NOT key run state by directory path. For run state, the global store is canonical and relocated, with no in-repo copy, in contrast to install information, which is mirrored from the project manifest.

R-STORE-3 (reference). The global store's physical schema, concurrency model, and the project-identifier scheme are owned by the Runtime and Global Store design. This design requires only that run state is stored there and keyed as in R-STORE-2.

R-STATE-1 (MUST). The run-state record MUST contain at least: run identifier, root run identifier, parent run identifier, project identifier, playbook ref, source digest, document and workflow schema versions, stack, harness, capability snapshot, routing model, per-step status, gate decisions, dependency availability snapshot, claimed output surfaces, output and evidence references, the current cursor of step or gate, child run references, resume hints, timestamps, and terminal status. This extends the prior required field set with the project identifier, the source digest, the dependency availability snapshot, and evidence references.

R-STATE-2 (MUST). Step status values MUST be exactly the shared vocabulary defined by the contract-and-model design: `pending`, `running`, `blocked`, `waiting-for-user`, `completed`, `failed`, `skipped`, `cancelled`. The runner MUST NOT introduce a parallel status vocabulary.

### D3. Progression Operations

R-OP-1 (MUST). The runner MUST expose the following progression operations, each a Make Docs operation addressed by a stable registry identifier, surfaced on the CLI under `run playbook` and as MCP tools. Read-only operations compute without mutating; mutating operations transition state and MUST honor the uniform safety gating defined for the operation core.

- `playbook.start` (read then write): create a run from a validated Playbook model.
- `playbook.status` (read): read the current run state.
- `playbook.next` (read): compute the next executable step from the current state plus the Playbook model, respecting dependencies, gates, and routing, without mutating.
- `playbook.advance` (write): record completion or failure of the current step, capture its evidence, transition status, and compute the next cursor.
- `playbook.gate` (write): record a gate decision with its evidence and either unblock or stop.
- `playbook.resume` (read then write): re-enter a run, digest-checked per D5.
- `playbook.close` (write): finalize a run with a terminal status and closeout evidence.

R-OP-2 (MUST). `playbook.start`, an invoke-style variant, and `playbook.status` correspond to the create, invoke, and read capabilities that exist today. `playbook.next`, `playbook.advance`, `playbook.gate`, `playbook.resume`, and `playbook.close` are the operations the current implementation lacks and MUST be implemented.

R-OP-3 (MUST). `playbook.next` MUST be side-effect free. Only `playbook.advance`, `playbook.gate`, and `playbook.close` may transition state, and `playbook.start` may create it. No other operation may write run state.

### D4. Execution by Step Mode

R-MODE-1 (MUST). The step execution mode from the contract-and-model design governs what `playbook.advance` does for a step and is the mechanism of the degradation guarantee:

- `deterministic`: the runner resolves the step's `operation` or `command`, executes it, an operation through the operation core and a command through the shell, captures the structured result as run evidence, and transitions automatically. When the CLI is absent, the runner resolves the operation identifier to its human CLI form and presents that command for the reader to run by hand.
- `delegated`: the runner presents the step instructions, sets the step to `waiting-for-user`, and waits for a subsequent `playbook.advance` carrying the reported outcome and evidence. The same instructions are usable directly without the CLI; the CLI adds tracking.
- `manual`: documentation only; the runner records acknowledgment and does not execute.

R-MODE-2 (MUST). A step whose mode is unspecified MUST be treated as `delegated`, consistent with the contract-and-model default.

### D5. Digest-Aware Resume

R-RESUME-1 (MUST). On `playbook.resume`, the runner MUST compare the stored source digest with the current Playbook digest. If they match, it resumes at the stored cursor. If they differ, the run is stale, and by default the runner MUST block and require an explicit re-plan, emitting a diagnostic that names the change. The runner MUST NOT silently resume against a changed workflow.

R-RESUME-2 (MAY). Optional migration, which re-maps still-present step identifiers and flags added or removed steps, MAY be offered as an enhancement. It MUST NOT be the default behavior for a digest mismatch.

### D6. Run-Time Guardrails

R-GUARD-1 (MUST). Nested Playbooks are allowed only when the parent's orchestration policy permits child Playbooks. A child run MUST link to its parent through the child-run references and a shared root run identifier. Serial child runs are the default.

R-GUARD-2 (MUST). Parallel child runs require explicit parent permission, a harness capability or reviewed approval that supports parallel execution, and non-overlapping claimed output surfaces. If overlap cannot be proven safe, the runner MUST serialize the work or stop for review.

R-GUARD-3 (MUST). When two steps or runs would claim the same output surface, the runner MUST stop rather than interleave writes.

R-GUARD-4 (MUST). In unattended mode, only steps whose gates permit unattended continuation may proceed without a human. All other gate steps MUST set `waiting-for-user` and hold.

### D7. Portability

R-PORT-1 (MUST). Because run state is machine-local, cross-machine handoff MUST be served by explicit export and import of a run, which serializes the run record and its evidence into a portable artifact and rehydrates it elsewhere. Export and import MUST be opt-in and MUST NOT place run state into the repository by default.

### D8. The Three Tiers in Motion

R-TIER-1 (MUST). The runner MUST realize the three-tier degradation guarantee. With neither Make Docs nor the CLI present, there is no engine and the Playbook is structured documentation a reader executes by hand. With Make Docs resources present but no CLI, an agent reads the same structure and the operation registry's documented command forms and executes without tracking. With the CLI present, the full engine runs and records state in the global store.

### D9. Non-Negotiable Decisions and Deliberately Open Choices

Fixed by this design and MUST NOT be substituted, relaxed, or reinvented:

- Run state lives in the global store and never in the repository (R-STORE-1).
- Run state uses the shared step-status vocabulary (R-STATE-2).
- The progression operation set and its read-versus-mutate classification (R-OP-1, R-OP-3).
- Digest mismatch blocks by default (R-RESUME-1).
- The preserved prior decisions in D1.

Deliberately left to the implementer and MUST NOT be treated as under-specified gaps:

- The concrete serialization of the run-state record within the global store, provided it carries the required content.
- The internal structure of the engine, provided the operations keep their required semantics and read-versus-mutate classification.
- The exact format of captured step evidence, provided it is sufficient for audit and resume.
- The details of the optional migration algorithm, if migration is implemented.

### D10. Verification and Testability

R-TEST-1 (MUST). Each progression operation MUST have tests covering its success and failure transitions, including that `playbook.next` never mutates state.

R-TEST-2 (MUST). Resume MUST be tested for both a matching digest, which resumes, and a mismatched digest, which blocks with a diagnostic.

R-TEST-3 (MUST). Each execution mode MUST be tested: a deterministic step that executes and auto-transitions, a delegated step that holds at `waiting-for-user` and advances on a reported outcome, and a manual step that records acknowledgment.

R-TEST-4 (MUST). The guardrails MUST be tested: a parallel child run blocked by output-surface overlap, and an unattended run that holds at a gate requiring a human.

R-TEST-5 (MUST). A test MUST assert that no run state is written under `.make-docs/runs/` or any repository path.

## Alternatives Considered

Keep run state in the repository under `.make-docs/runs/`. Rejected. It reintroduces per-repo operational noise and duplication, which is the pattern the global store exists to remove, and it is the specific location this design supersedes.

Treat the harness's own goal or long-running feature as the source of truth for run state. Rejected, preserving the prior decision. The harness feature is an assist; Make Docs-owned state is required for recovery, audit, nested runs, and overlap checks across harnesses.

Auto-migrate a run on a digest mismatch by default. Rejected as the default. Silently resuming against a changed workflow is unsafe; the default is to block and require an explicit re-plan, with migration available only as an opt-in enhancement.

Store run state in the repository so a team can resume each other's runs. Rejected. It violates the boundary principle; cross-machine handoff is served by explicit export and import instead.

Give the runner its own run-status vocabulary. Rejected. The runner MUST share the step-status vocabulary defined by the contract-and-model design so the static contract and the runtime never diverge.

## Consequences

The progression engine makes it possible to actually run a structured Playbook and to test Playbook-driven workflow behavior, which the current create-and-read-only implementation cannot. Because the operations are addressed by registry identifiers, they are usable identically from the CLI and MCP and are referenced by Playbook steps without hardcoded command strings.

Relocating run state removes repository noise but makes run state machine-local, which is mitigated by explicit export and import. The relocation has a downstream implication: the `.make-docs/` runtime-state guidance and any code that writes run state under `.make-docs/runs/` must change to target the global store. That reconciliation is owned by the Runtime and Global Store design and the affected code, not by this design, but this design is the reason it is required.

This design depends on the global store, the stable project identifier, and the Playbook model, so its implementation is sequenced after those are available. It preserves the Run Playbook orchestration contract, so plugins and workflow bundles continue to delegate execution semantics to this runner rather than inventing their own.

## Design Lineage

Update Mode: new-doc-related.

Prior Design Docs: [Run Playbook Orchestration and Harness Capabilities](2026-06-27-run-playbook-orchestration-and-harness-capabilities.md), [Playbook Contract and Model](2026-06-30-playbook-contract-and-model.md), [Playbook Contract and Run Playbook](2026-06-20-playbook-contract-and-run-playbook.md).

Reason: This design adds the run-progression engine that the prior runner designs assumed but did not provide, binds run state to the shared step-status vocabulary, and relocates run state from the repository into the global store. It supersedes only the on-disk run-state location from the Run Playbook orchestration design and preserves that design's resolver, harness-capability, run-metadata, and concurrency decisions.

## Intended Follow-On

Route: `change-plan`

Next Prompt: [designs-to-plan-change.prompt.md](../../.make-docs/references/system/prompts/designs-to-plan-change.prompt.md)

Why: This is a corrective evolution of active W18 Run Playbook requirements. It completes the progression engine and relocates run-state storage against the active PRD namespace rather than starting a fresh baseline.

Coordinate Handoff: Revises W18 R4 (run playbook orchestration and harness capabilities), whose on-disk run-state location this design supersedes, and completes the run-progression engine W18 R1 assumed. Downstream coordinate: W18 R7, planned as [PRD 35](../prd/35-run-playbook-state-machine-and-portability.md) with a generated plan and work backlog.

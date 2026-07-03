---
title: "Run Playbook Runner Architecture"
kind: "guide"
path: "playbooks/development"
persona: "developer"
status: "draft"
order: 100
tags:
  - playbooks
  - run-playbook
  - cli
  - mcp
  - plugins
applies-to:
  - playbooks
  - cli
  - mcp
  - plugins
related:
  - ../user/playbooks-running-make-docs-workflows.md
  - ./cli-mcp-operation-parity-and-permissions.md
  - ./development-workflows-stage-model-and-artifact-relationships.md
  - ../../../prd/25-revise-cli-separation-and-mcp-boundary.md
  - ../../../prd/29-revise-playbook-contract-run-playbook.md
  - ../../../prd/30-revise-harness-plugin-substrate-workflow-bundles.md
  - ../../../prd/33-enhance-playbook-packaging-and-harness-adapter-registry.md
  - ../../../prd/34-revise-playbook-contract-and-model.md
  - ../../../prd/35-revise-run-playbook-state-machine.md
  - ../../../prd/38-revise-global-store-and-project-state.md
  - ../../../../packages/cli/src/store/README.md
  - ../../../../.make-docs/contracts/system/playbook-contract.md
  - ../../../designs/2026-06-27-run-playbook-orchestration-and-harness-capabilities.md
  - ../../../designs/2026-06-29-playbook-packaging-and-harness-adapter-registry.md
  - ../../../work/2026-06-23-w18-r1-playbook-contract-run-playbook/00-index.md
  - ../../../work/2026-06-27-w18-r4-run-playbook-orchestration-and-harness-capabilities/00-index.md
  - ../../../work/2026-06-29-w18-r5-playbook-packaging-and-harness-adapter-registry/00-index.md
  - ../../../work/2026-07-01-w18-r7-run-playbook-state-machine/00-index.md
---

# Run Playbook Runner Architecture

This guide explains the accepted v2 architecture for Run Playbook after W18 R4, W18 R1, W18 R2, and W18 R3 are implemented. It is a developer guide for contributors and maintainers. The implemented operation primitives are exposed on the CLI as `make-docs run playbook validate|catalog|resolve|capabilities|start|invoke|status|next|advance|gate|resume|close`; later plugin and bundle command names may still be refined by their implementation phases.

## Architectural Shape

Run Playbook should be implemented as a shared TypeScript operation domain. CLI commands, MCP tools, plugins, and harness-native entry points should call that operation domain instead of each building a separate runner.

The runner is responsible for deterministic plumbing: resolution, validation, authority loading, capability mediation, run-state management, gate handling, child-run scheduling, and output-surface protection.

The agent remains responsible for judgment and task execution. The CLI is not expected to become an autonomous LLM. It should provide the rails that let an agent run a Playbook predictably and resume or stop safely.

## Entry Points

Run Playbook can be reached through several surfaces:

- CLI: a command can resolve, validate, dry-run, start, resume, pause, or inspect a Playbook run.
- MCP: tools can expose the same read-first and plan-first behavior to an agent harness.
- Plugin or workflow bundle: a harness-visible entry point can invoke a built-in workflow without reimplementing the runner.
- Direct agent request: an agent can read the Playbook and still use Make Docs contracts, config, and run state as the execution authority.

Each surface should delegate to the same operation module. Public dispatch can stay thin, but the domain logic needs to be testable without invoking the full CLI parser or MCP transport.

W18 R4 Phase 2 added the first read-only playbook operation primitives:

- `make-docs run playbook catalog --repo-root <path>` lists detected Playbooks under `docs/assets/playbooks/<persona>/`; since W18 R6 Phase 4 it is backed by the library `playbook.catalog` operation described under Catalog Contract Validation below.
- `make-docs run playbook resolve <ref> --repo-root <path> [--stack build|run]` resolves an explicit path, `persona/slug`, or unique bare slug/title before any execution behavior starts.
- MCP exposes the same primitives through `make_docs_playbook_catalog` and `make_docs_playbook_resolve`.

W18 R4 Phase 3 adds read-only harness capability evaluation:

- `.make-docs/config.yaml` may include `harnessCapabilities` records with `harness`, `reviewStatus`, `capabilities`, optional `source`, and optional `caveats`.
- Canonical capability ids are `goal_managed_execution`, `long_running_runs`, `resume_after_interrupt`, `parallel_playbook_runs`, `subagent_delegation`, and `user_gate_prompts`.
- `make-docs run playbook capabilities --repo-root <path> --harness <id> --requires-capability <id> --prefers-capability <id>` evaluates a request without mutating config or starting a run.
- MCP exposes the same behavior through `make_docs_playbook_capabilities`.

W18 R4 Phase 4 added Make Docs-owned run-state primitives; since W18 R7 Phase 1 they store to the global store instead of the repository:

- `make-docs run playbook start <ref> --repo-root <path> --harness <id> [--run-id <id>] [--store-root <path>]` creates the run record in the global store's `playbook_runs` facet, keyed by the manifest-minted project identifier plus the run identifier.
- `make-docs run playbook status --repo-root <path> --run-id <id> [--store-root <path>]` reads the stored run record for resume or audit.
- MCP exposes `make_docs_playbook_start` behind `allowWrite=true` and `make_docs_playbook_status` as a read-only state inspection tool; both names derive from the registry identifiers.

W18 R1 Phase 3 adds the first generic invocation primitive:

- `make-docs run playbook invoke <ref> --repo-root <path> --harness <id> [--stack build|run]` resolves a valid Playbook, extracts the authority/procedure/gate/assist/output model, creates run state, and returns the next gated step.
- MCP exposes the same behavior through `make_docs_playbook_invoke` behind `allowWrite=true`.
- The invocation result labels CLI, MCP, plugin, skill, template-sync, and unattended support claims as `provisional` until each surface has validation evidence.

W18 R7 Phase 2 adds the progression operations that carry a run from start to a terminal status over the Phase 1 record:

- `make-docs run playbook next --repo-root <path> --run-id <id>` reports the next executable position without mutating.
- `make-docs run playbook advance --repo-root <path> --run-id <id> [--outcome completed|failed] [--acknowledge] [--present] [--step <id>] [--evidence-ref <ref> ...] [--output-ref <ref> ...] [--note <text>]` advances the cursor step per its execution mode and computes the next cursor; since W18 R7 Phase 3, `--outcome` is optional and, when absent, the step's mode decides what advance does.
- `make-docs run playbook gate --repo-root <path> --run-id <id> --decision approve|reject [--gate <id>] [--evidence-ref <ref> ...] [--note <text>]` records a gate decision.
- `make-docs run playbook resume --repo-root <path> --run-id <id> [--migrate] [--resume-hint <text> ...] [--evidence-ref <ref> ...] [--note <text>]` re-enters a held run at its stored cursor after the W18 R7 Phase 3 source-digest check; `--migrate` is the explicit opt-in step re-mapping after a mismatch.
- `make-docs run playbook close --repo-root <path> --run-id <id> --terminal-status completed|failed|cancelled [--evidence-ref <ref> ...] [--note <text>]` finalizes the run.
- Every subcommand also accepts `--store-root <path>` for tests and sandboxes, and MCP derives `make_docs_playbook_next` (read-only) plus `make_docs_playbook_advance`, `make_docs_playbook_gate`, `make_docs_playbook_resume`, and `make_docs_playbook_close` (behind `allowWrite=true`) from the same registry identifiers.

The engine behind these commands is described under Progression Engine below.

## Runner Pipeline

The expected runner pipeline is:

```text
caller
  -> run-playbook operation domain
  -> load config, manifest, and catalog state
  -> resolve playbook reference
  -> validate playbook metadata and body contract
  -> load declared authority and inputs
  -> evaluate run metadata
  -> mediate harness capabilities
  -> create or resume run state
  -> execute the next step or gate
  -> write allowed outputs
  -> update state
  -> complete, pause, block, or resume
```

The pipeline should be shared by CLI, MCP, plugin, and agent-facing usage. If one surface needs a different permission posture, it should pass policy into the same domain instead of branching into a separate implementation.

The implemented invoke operation behind `run playbook invoke` is still conservative. It does not pretend to be an autonomous LLM runner. It resolves and validates the source, loads referenced authority path facts, evaluates required and preferred assists, creates run state, chooses the next procedure step, and pauses or blocks when gates, missing authority, or required assists require review.

## Resolver And Catalog Semantics

Playbooks live under `docs/assets/playbooks/<persona>/<slug>.playbook.md`; a plain `<slug>.md` file with frontmatter `kind: playbook` is still detected as a deprecated form that carries the PB-FILE-007 rename warning. The stable resolver identity is `persona/slug`.

Selection should follow this order:

1. Explicit path.
2. `persona/slug`.
3. Bare slug or title only when it resolves to exactly one candidate.

The `stack` metadata remains required, but it is not another directory level. It helps validation and disambiguation after candidate resolution.

Ambiguity fails closed. If two Playbooks can match the same bare slug or title, the runner should ask for a more specific reference instead of choosing one.

The implemented resolver validates stack requests before returning a selected Playbook. If `--stack build` is requested for a run-stack Playbook, the resolver fails before authority loading, procedure execution, or output routing can begin.

## Catalog Contract Validation

Contract authority note: since W18 R6 Phase 1, the normative Playbook document schema is owned by [the Playbook contract](../../../../.make-docs/contracts/system/playbook-contract.md) per [PRD 34](../../../prd/34-revise-playbook-contract-and-model.md). The contract defines the `<slug>.playbook.md` filename form, the eleven-heading spine, the expanded frontmatter enums, the embedded `playbook` workflow contract block, and the dependency registry.

W18 R6 Phases 2 and 3 landed the contract's executable enforcement as the pure library at `packages/cli/src/playbook/`. `parsePlaybook` produces the single parsed Playbook model, and the validator at `packages/cli/src/playbook/validator/` layers six semantic passes over that model — structural, registry, workflow, cross-reference, consistency, and orchestration-policy shape — with each layer appending diagnostics independently so a registry error never suppresses workflow diagnostics. `parseAndValidatePlaybook` is the canonical parse-then-validate entry point (it re-derives the runnable flag from the combined diagnostics), and `validatePlaybook` validates an already parsed model. Every diagnostic carries a stable code, fixed severity, section/field/span location, message, and fix hint from the exported catalog (PB-DOC-001 through PB-WF-024, twenty-four codes including the seven whose codes and severities the contract fixes), and a focused test machine-checks the contract's diagnostic table against the exported catalog so contract text and validator behavior fail loudly when they drift. Extenders adding a validation rule should add it to the matching layer, register its code in the catalog, reconcile the contract text in the same change, and add a failing fixture, keeping R-AUTH-3 contract/validator parity. Since W18 R6 Phase 5 the fixture half of that rule is mechanically enforced: the fixture suite at `packages/cli/tests/playbook-fixtures.test.ts` maps every diagnostic code to at least one failing fixture under `packages/cli/tests/fixtures/playbooks/` through a compile-time `Record` keyed by the full diagnostic-code union plus a runtime walk of the exported catalog, so registering a new code without a fixture fails the suite before it can ship, and each fixture asserts the exact code, catalog severity, non-empty message and hint, no undeclared co-diagnostics, and severity-exact runnability. The contract/catalog machine-check likewise reads both the upstream template and dogfood contract copies and asserts they are byte-identical, so a contract edit that lands in only one location also fails.

W18 R6 Phase 4 wires that library into the operation surface at `packages/cli/src/operations/playbook/contract.ts`, so the twenty-four-code catalog is now runtime behavior rather than library-only:

- `playbook.validate` parses one or more Playbooks through `parseAndValidatePlaybook` and reports the full diagnostic set. `make-docs run playbook validate [refs...] --repo-root <path>` accepts explicit `.md` paths or canonical `persona/slug` references and defaults to every detected Playbook; MCP exposes the same behavior through `make_docs_playbook_validate`. Each result carries the canonical ref, file form, runnable flag, and per-file error and warning counts, and each diagnostic carries its stable code, severity, section/field/span location, message, and fix hint; the report is `valid` only at zero errors.
- `playbook.catalog` enumerates Playbooks by canonical reference — the frontmatter `id` when present, otherwise `persona/slug` — with frontmatter identity (title, summary, stack, status, and schema versions), file form, runnable flag, and error/warning counts. `make-docs run playbook catalog --repo-root <path>` and the registry-derived `make_docs_playbook_catalog` MCP tool expose it. The catalog also returns per-file diagnostics, so the PB-FILE-007 rename warning for deprecated plain files surfaces directly in catalog output.

Both operations detect the `<slug>.playbook.md` suffix form and the deprecated plain `<slug>.md` form with frontmatter `kind: playbook`; the deprecated form stays catalogable and validatable but carries PB-FILE-007 until it is renamed. Every parsed fact and every diagnostic comes from the library — the operation layer never re-parses Playbook Markdown — so a future language server wrapping the same library produces identical diagnostics, and the machine-check that pins the contract's diagnostic table to the exported catalog also pins what these operations report. The stable operation identifiers `playbook.validate` and `playbook.catalog` are consumed from the operation registry as an external contract; do not mint identifiers or hardcode CLI command strings inside library or operation code.

The pre-contract W18 R4 catalog validation is no longer what the catalog operation enforces. Its internal implementation is retained only behind the runner lineage — the resolve operation behind `run playbook resolve`, run-state, invoke, and packaging still select candidates through it, with minimal suffix-form support — until W18 R7 moves those surfaces onto the parsed Playbook model. Since W18 R7 Phase 1, run-state creation already parses the selected Playbook through `parseAndValidatePlaybook` and seeds the run record — source digest, schema versions, routing model, step statuses, and the dependency availability snapshot — from the parsed model; candidate selection still flows through the retained resolver. Since W18 R7 Phase 2, the progression engine consumes the same parsed model exclusively through `loadPlaybookRunModel` in `run-state.ts` for every dependency, gate, and routing read (R-SCOPE-1); do not re-parse Playbook Markdown anywhere in the engine.

Do not make transitional paths such as `docs/library/playbooks/**` selectable. Historical playbook files are migration evidence only; the v2 runner and resolver should use the canonical `docs/assets/playbooks/**` tree.

## Shipped Default Playbooks

Accepted shipped Playbook defaults use the PRD 19 source-of-truth path:

1. Author the default in `packages/docs/template/docs/assets/playbooks/**`.
2. Reseed the matching dogfood copy under `docs/assets/playbooks/**`.
3. Regenerate `packages/cli/template/**` through `npm run prepack -w packages/cli` or `npm run smoke:pack`.
4. Validate package behavior with `npm run validate:defaults -w packages/cli` and `npm run smoke:pack`.

The Make Docs lifecycle Playbook is the first reviewed shipped default. Its source-template, dogfood, and generated package copies must stay byte-for-byte aligned at `docs/assets/playbooks/agent/make-docs-lifecycle.playbook.md`. Since W18 R6 Phase 4 it uses the contract's `<slug>.playbook.md` suffix form and full document schema, validates with zero errors and zero warnings in both the upstream template and the dogfood instance, and a consistency test asserts that every shipped default Playbook validates clean, so a contract or default change that introduces diagnostics fails the suite. Since W18 R6 Phase 5 those sweeps enumerate the playbook directories in both the upstream template and the dogfood instance instead of naming files, so any future shipped default is covered automatically the moment it lands.

Do not add recursive catalog ownership for every file under `docs/assets/playbooks/**`. Shipped defaults should be named explicitly in the catalog rules so user-authored project Playbooks do not become managed package files by accident.

## Harness Capability Mediation

Harness features are optional execution assists. Make Docs can use features such as goal-managed execution, long-running runs, resume after interrupt, parallel playbook runs, subagent delegation, or user gate prompts when the harness is known to support them.

Reviewed capability records live in `.make-docs/config.yaml`. The runner must not invent or silently persist a capability record. If a required capability is unknown, the run stops or asks the agent to inspect and request review. If an optional capability is unknown, the runner should fall back to serial gated execution.

The capability model is a mediator between Make Docs and harness-specific behavior. It is not a replacement for Make Docs-owned run state.

The implemented evaluator trusts only `reviewStatus: reviewed` records. Unreviewed records remain visible as evidence, but they are not execution authority. Required unknown or unsupported capabilities return `manual-review-required`; optional unavailable or unknown capabilities return `serial-gated-fallback`.

## Run State

Since W18 R7 Phase 1, Make Docs-owned run state lives in the machine-level global store at `~/.make-docs/`, in the `playbook_runs` facet, keyed by the manifest-minted stable project identifier plus a run identifier. It is never written under `.make-docs/runs/` or any other repository path, and it is never keyed by a directory path; the retired `.make-docs/runs/playbooks/<run-id>/state.json` location is the per-repo anti-pattern this relocation removed.

The runner's storage seam is `packages/cli/src/operations/playbook/run-state.ts`: `createPlaybookRunState`, `readPlaybookRunState`, and `transitionPlaybookRunState` wrap the store's record primitives inside `withStoreDatabase`. Project identity comes exclusively from `resolveProjectIdentity`; an `unminted`, `no-manifest`, or `unreadable` identity fails the operation with actionable setup guidance instead of falling back to a path-keyed or in-repo location. The store's schema, locking, and recovery are consumed from `packages/cli/src/store/` and are never redefined in runner code — read [the store module README](../../../../packages/cli/src/store/README.md) before touching that boundary. Tests and sandboxes may pass an explicit store root (`storeRoot` on the operations, `--store-root` on the CLI adapters); the default resolution is explicit option, then `MAKE_DOCS_HOME`, then `~/.make-docs`.

The `PlaybookRunState` record (`schemaVersion: 2`) carries the full PRD 35 R-STATE-1 content: run, root-run, and parent-run identifiers, project identifier, playbook ref and path, source digest, document and workflow schema versions, stack, harness, capability snapshot, routing model, per-step statuses, gate decisions, a dependency availability snapshot, claimed output surfaces, output and evidence references, a per-event evidence log (since Phase 2, with structured deterministic-execution results since Phase 3), a digest-mismatch staleness marker (since Phase 3; additive, with `schemaVersion` staying 2), the current step-or-gate cursor — seeded at creation to the first sequentially activated workflow step — child policy and concurrency policy, child-run references, resume hints, run status, terminal status, and created/updated timestamps. The serialization is a recorded D9 implementer decision: one JSON document per run in the `playbook_runs` record column, versioned by the record's own `schemaVersion`, so the runner lineage can evolve the record shape without store schema migrations.

Per-step status, run status, and terminal status use exactly the shared eight-value W18 R6 vocabulary from `packages/cli/src/playbook/model.ts` — `pending`, `running`, `blocked`, `waiting-for-user`, `completed`, `failed`, `skipped`, `cancelled` — with the terminal statuses a type-checked subset (`completed`, `failed`, `cancelled`). A fail-closed runtime guard rejects anything else, including the retired W18 R4 `planned`/`paused` run-status vocabulary, which is deleted; the invoke flow translates its invocation-plan statuses into shared values (`ready` becomes `running`, a gate pause becomes `waiting-for-user`). Do not introduce a parallel status set anywhere in the runner.

Manifest state remains for managed installation ownership. It should not become the home for local harness capability knowledge or transient Playbook execution state. The record keeps `stateSource: "make-docs"` and `harnessAssistsAreSourceOfTruth: false` so harness-native goal or long-running features remain assists rather than the recovery authority.

Transitions go only through `transitionPlaybookRunState`, which reads, applies, stamps `updatedAt`, and replaces the record in one store connection; a transition fails explicitly when the run does not exist, so it can never silently create state, and it must not change the run or project identifier. What a valid transition is — statuses, cursors, gate semantics — is owned by the Phase 2 progression engine described in the next section; the storage seam fixes only the record and its storage.

## Progression Engine

Since W18 R7 Phase 2, the five registry identifiers that W18 R11 registered as `pending` are active handlers: `playbook.next` (read) plus `playbook.advance`, `playbook.gate`, `playbook.resume`, and `playbook.close` (write) complete the PRD 35 R-OP-2 operation set alongside the earlier `start` and `status`. The engine is `packages/cli/src/operations/playbook/progression.ts`: position computation over (run state, parsed Playbook model, reported input), layered on the Phase 1 storage seam, with the W18 R7 Phase 3 deterministic step-execution half factored beside it in `packages/cli/src/operations/playbook/execution.ts` (described below). Every mutation flows through `transitionPlaybookRunState`, each operation carries a zod input contract in `packages/cli/src/operations/playbook/ops/`, and each mutating operation registers `mutates: "write"` so registry dispatch applies the uniform operation-core safety gating (R-OP-1). The MCP tools derive automatically from the same registry entries, with CLI/MCP parity pinned by the derivation tests.

The read-versus-mutate classification is exact (R-OP-3) and must stay that way: only `playbook.start` creates run state; only `playbook.advance`, `playbook.gate`, and `playbook.close` — plus the reopen recorded by `playbook.resume` — transition it; and `playbook.next` is side-effect free and never writes. The engine consumes the single parsed W18 R6 model through `loadPlaybookRunModel` for every dependency, gate, and routing read and never re-parses Playbook Markdown (R-SCOPE-1). Do not add another run-state writer, another parser, or a handler that bypasses the registry gating.

`playbook.next` reads the stored cursor and reports the run's position — `step`, `gate`, `blocked`, `closeable`, or `closed` — plus, for an executable position, the step's effective mode with the W18 R6 `delegated` default applied, its invocation identified by stable operation-registry identifier (never a CLI command string), required-dependency availability from the run's snapshot (an `unavailable` requirement blocks the position; `unknown` availability yields probe-first guidance instead of blocking), and the gate's resolved-by/evidence/unattended declarations when the cursor is a gate.

Cursor and routing semantics: a step cursor holds run status `running`; a gate cursor holds `waiting-for-user` until `playbook.gate` records a decision. `playbook.advance` records a `completed` or `failed` outcome for the cursor step — reported by the caller or observed by the engine's own deterministic execution — and computes the next position: graph routing honors the step's `on_success`/`on_failure`/`stop` declarations, while linear routing (or a graph step without declarations) falls through to the next pending sequentially activated step in declaration order; event-bound steps are never cursor-eligible — they activate on their event. A failed step without an `on_failure` route blocks the run, and a rejected gate blocks it at the gate; `approve` moves the cursor past the gate. When routing stops or every reachable step is resolved, the cursor drops and the run holds `waiting-for-user` — only `playbook.close` stamps `terminalStatus` (the type-checked terminal subset `completed`, `failed`, `cancelled`), and a closed run refuses every further transition.

Since W18 R7 Phase 3, `advancePlaybookRun` is async and mode-aware (R-MODE-1..2): what one advance call does is decided by the cursor step's effective execution mode — the W18 R6 `delegated` default applied — and the call returns `{state, execution}`, where the execution report carries the step id, the effective mode, the action taken, the recorded outcome (null while the step holds), the presented command, the presented instructions, and the structured execution evidence. A `deterministic` step executes its single declared invocation and auto-transitions: an `operation:` invocation dispatches through `invokeOperation` in the operation core, and a `command:` invocation runs through `spawnSync` with `shell: true`, `cwd` at the run's repository root, and a ten-minute ceiling (`PLAYBOOK_STEP_COMMAND_TIMEOUT_MS`) so a hung command cannot hang the engine. Execution happens BEFORE the state transition, so a thrown execution error leaves the stored run untouched — the run never records an outcome the engine did not observe — and gating refusals (write denied, missing approval, pending identifier) propagate as advance-level errors instead of being recorded as step failures the step never produced, while a handler failure, non-zero exit, timeout, or spawn failure resolves to a `failed` outcome the routing then handles. A reported `outcome` on a deterministic step is accepted as the by-hand execution report, closing the loop for a previously presented command. With `present: true` (the CLI-absent path, R-TIER-1 groundwork; the full three-tier proof is Phase 4), the engine resolves and presents the human command form instead of executing, holds the step at `waiting-for-user`, and records the presentation as evidence exactly once — a repeated presentation refreshes nothing. A `delegated` step — including a step with no declared mode, per R-MODE-2 — presents the step instructions, holds at `waiting-for-user`, and advances only on a later call carrying the reported outcome and evidence. A `manual` step requires the `acknowledge` flag, refuses reported outcomes, and executes nothing.

The execution half is `packages/cli/src/operations/playbook/execution.ts`. It imports the operation registry lazily at call time because the registry statically imports the playbook operation modules, so a static import back would create a module-initialization cycle. A Playbook `operation:` step runs as the third registry surface: `playbookStepExecutionContext` creates a `playbook-step` execution context that inherits the advancing caller's `writesAllowed`, `dryRun`, and `approvals`, so the uniform operation-core gating still applies to the nested invocation — do not widen the step's permissions past its caller. The presented human command form is derived, never hand-maintained: `operationCliPath` and `operationCliCommand` in `packages/cli/src/operations/registry.ts` are the single identifier-to-`make-docs run ...` derivation rule, `run/cli.ts` consumes the same derivation for the command tree, and `operationCliCommand` validates the identifier against the registry so a Playbook step can never present a command the CLI does not accept.

The captured-evidence format is the recorded D9 implementer decision, documented on `PlaybookRunEvidenceRecord` in `run-state.ts`: every mutating operation appends one structured record to the run's `evidenceLog` — a `scope` of `step`, `gate`, `close`, or `resume`, the `subjectId` it attests, the reported `outcome`, a `recordedAt` timestamp, caller-supplied `refs`, and an optional `note` — while the flat `evidenceRefs` field remains the deduplicated R-STATE-1 roll-up of every record's refs, and gate decisions additionally land in `gateDecisions`. Since Phase 3, a record whose step the engine executed itself also carries a structured `execution` result — `PlaybookRunExecutionEvidence` in `run-state.ts`: the invocation form, the operation identifier or command line, the exit code, stdout/stderr tails and the operation result summary capped at `PLAYBOOK_RUN_OUTPUT_EVIDENCE_LIMIT` (4000 characters, keeping the tail where failures usually surface), the error message when execution failed without a shell result, and a `truncated` flag.

`playbook.resume` is the digest-checked re-entry (R-RESUME-1..2), landed in W18 R7 Phase 3 at the seam the Phase 2 shell marked. Resume compares the stored source digest with the current digest from the single parsed model. A match re-enters at the stored cursor, recomputes the run status from the cursor position, records resume evidence and optional resume hints, never moves the cursor, and clears any staleness marker left by a since-reverted change. A mismatch marks the run stale and blocked durably — the `staleness` marker (`PlaybookRunStaleness` in `run-state.ts`) captures the detection time, both digests, and the added and removed step identifiers — and then throws a diagnostic naming the playbook path, both digests, and the step-id diff, directing the caller to an explicit re-plan (`playbook.start` against the current source) or the opt-in migration; the runner never silently resumes against a changed workflow, and a stale run also refuses `playbook.advance` and `playbook.gate` until the marker clears. The marker is additive: the record's `schemaVersion` stays 2, and records created before the field read as fresh, with the next digest-checked resume deciding.

Migration is opt-in only (`migrate: true`; `--migrate` on the CLI; R-RESUME-2) and must never become the default mismatch behavior. It re-keys the recorded statuses by step identifier onto the current workflow, seeds added steps as `pending`, drops removed steps and names them in the resume evidence, keeps the cursor at its step when that step survived (falling back to the first pending sequential step otherwise), merges the current dependency registry with previously probed availability, and adopts the current digest, schema versions, and routing model before re-entering. The re-mapping algorithm is a D9-style implementer decision recorded on `migratePlaybookRun` in `progression.ts`. The run-time guardrails, portability, and the full three-tier degradation proof remain Phase 4 work.

## Nested And Parallel Playbooks

Nested Playbooks require explicit permission in the parent Playbook metadata. Parallel child runs require explicit permission and non-overlapping output-surface claims.

The runner should treat each child Playbook as its own run with its own state, while the parent records child references and aggregate status. If output claims overlap, or if the runner cannot prove they are separate, execution stops for review.

Default behavior is serial and gated. Parallelism is an opt-in capability, not a default optimization.

The implemented child-run guard reads the parent run record from the store before creating a child record, and links the child into the parent's child-run references in the same store connection, with root-run identity shared through `rootRunId`. Parent Playbooks default to `child_playbooks: none`; serial or parallel children require explicit parent metadata. Parallel child runs also fail when their output-surface claims overlap with the parent run or an existing child run.

## Plugin And Workflow Bundle Boundary

Plugins and workflow bundles are entry points and packaging surfaces. They may provide harness-native commands, prompts, or guided flows, but they must invoke the Run Playbook operation domain for Playbook selection and execution.

This keeps bundle behavior aligned with CLI and MCP behavior. A plugin should not invent separate state, separate capability rules, or separate nested-run logic.

## Playbook Packaging Boundary

W18 R5 adds a separate package-planner boundary around Run Playbook. The runner selects, validates, executes, pauses, resumes, and records Playbook runs. The package planner turns accepted Playbook sources into reviewed generated outputs such as harness-specific plugins or skills bundles.

Those outputs may expose a nicer harness-native entry point, but they are not the source Playbook and they are not a second runner. Generated package outputs should call the same Run Playbook operation domain and should carry package-plan provenance, source Playbook refs, source digests, target harness, output kind, selected surface, adapter id, review status, and support status.

Harness-specific packaging behavior belongs in a harness adapter registry. Future harnesses should be added with adapter declarations, fixtures, conformance evidence, and output-writer tests instead of conditionals inside the runner.

## Permission And Parity Expectations

The CLI, MCP server, and plugin surfaces should preserve the same core decisions:

- read-only inspection is allowed before writes;
- dry-run and plan-first flows should be available before mutation;
- gate prompts are required when Playbook metadata or runner policy requires review;
- unattended runs require explicit permission from the Playbook and the entry surface;
- MCP tools must not expose a capability that lacks a shared operation-domain owner.

When a new runner behavior is added, it needs focused operation tests and parity expectations for every surface that exposes it.

## Future Coverage

This guide should be refreshed when W18 implementation chooses final plugin bundle entry points, package-planner commands, harness adapter modules, and generated-output writers. It should also be updated with links to additional concrete operation modules and tests as W18 R1 through W18 R5 land.

- Blocked by: the W18 R7 Phase 4 guardrails, portability, and three-tier degradation work. Update when: Phase 4 lands the run-time guardrails (R-GUARD-1..4), export/import portability (R-PORT-1), and the three-tier degradation proof (R-TIER-1). Guide change: add the guardrail, portability, and degradation behavior to the Progression Engine and Nested And Parallel Playbooks sections, revisit the "R-TIER-1 groundwork" qualifier on the presented-command path once the full three-tier proof exists, and revisit whether the invoke-centric W18 R1 run description above should collapse into the progression flow. The Phase 3 half of the original bullet is resolved: the digest check landed at the marked `PHASE 3 SEAM (R-RESUME-1)` and per-mode execution replaced the "records reported outcomes" behavior, both documented in the Progression Engine section above.

## Related Resources

- [Running Make Docs Playbooks](../user/playbooks-running-make-docs-workflows.md)
- [CLI/MCP Operation Parity and Permissions](./cli-mcp-operation-parity-and-permissions.md)
- [Understanding the Make Docs Stage Model](./development-workflows-stage-model-and-artifact-relationships.md)
- [25 Revise CLI Separation and MCP Boundary](../../../prd/25-revise-cli-separation-and-mcp-boundary.md)
- [29 Revise Playbook Contract Run Playbook](../../../prd/29-revise-playbook-contract-run-playbook.md)
- [30 Revise Harness Plugin Substrate Workflow Bundles](../../../prd/30-revise-harness-plugin-substrate-workflow-bundles.md)
- [33 Enhance Playbook Packaging and Harness Adapter Registry](../../../prd/33-enhance-playbook-packaging-and-harness-adapter-registry.md)
- [34 Revise Playbook Contract and Model](../../../prd/34-revise-playbook-contract-and-model.md)
- [35 Revise Run Playbook State Machine](../../../prd/35-revise-run-playbook-state-machine.md)
- [38 Revise Global Store and Project State](../../../prd/38-revise-global-store-and-project-state.md)
- [Global Store Module README](../../../../packages/cli/src/store/README.md)
- [Playbook Contract](../../../../.make-docs/contracts/system/playbook-contract.md)
- [Run Playbook Orchestration and Harness Capabilities](../../../designs/2026-06-27-run-playbook-orchestration-and-harness-capabilities.md)
- [Playbook Packaging and Harness Adapter Registry](../../../designs/2026-06-29-playbook-packaging-and-harness-adapter-registry.md)
- [Playbook Packaging and Harness Adapters](./playbooks-development-packaging-and-harness-adapters.md)

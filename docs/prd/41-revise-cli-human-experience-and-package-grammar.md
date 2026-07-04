---
title: "41 Revise CLI Human Experience and Package Grammar"
kind: "prd"
status: "active"
coordinate: "W18 R12"
source:
  type: "plan"
  path: "docs/plans/2026-07-03-w18-r12-playbook-authoring-ergonomics-and-cli-experience-remediation/00-overview.md"
---

# 41 Revise CLI Human Experience and Package Grammar

## Purpose

Give the `run playbook` and `run package` surfaces a human-experience layer without moving a single byte an agent depends on: a TTY render layer over the existing operation results, the intent-named `plan`/`preview`/`write` packaging grammar with `--write` retired, the registered `package.ship` composite operation, run-id prefix resolution with `--last`, root-flag defaults with precondition config absorption, targeted SQLite ExperimentalWarning suppression, and retirement semantics for run-state resume hints (UAT defect F2). Agent invariance is the governing rule: operation results, MCP tool output, and machine-readable CLI output stay byte-identical except for additive fields and flags. Source chain: [the W18 R12 design](../designs/2026-07-03-playbook-authoring-ergonomics-and-cli-experience-remediation.md) and [the W18 R12 plan](../plans/2026-07-03-w18-r12-playbook-authoring-ergonomics-and-cli-experience-remediation/00-overview.md); the confirmed hint defect is register item [D-016](03-open-questions-and-risk-register.md) and the sequencing gate ahead of W18 R9 is [R-026](03-open-questions-and-risk-register.md).

## Change Type

This doc records a `revision`. It supersedes the JSON-dump-only CLI presentation and the `run package write`-without-`--write` dry-run spelling carried through [39-revise-cli-command-reorganization-and-operation-registry.md](39-revise-cli-command-reorganization-and-operation-registry.md), and the accumulate-only resume-hint behavior under [35-revise-run-playbook-state-machine.md](35-revise-run-playbook-state-machine.md) R-STATE-1. It also enhances the PRD 39 operation registry with the `package.ship` composite operation. The operation registry model, the shared operation core, the derived MCP surface, every fail-before-write safety rail from [36-revise-playbook-packaging-compiler-and-harness-adapters.md](36-revise-playbook-packaging-compiler-and-harness-adapters.md), and the progression semantics of PRD 35 remain active and are consumed unchanged.

## Baseline Being Revised or Removed

- [39-revise-cli-command-reorganization-and-operation-registry.md](39-revise-cli-command-reorganization-and-operation-registry.md), The Run Surface After Pruning (R-RUN): the `run package` subtree's CLI spellings are superseded by the intent-named grammar — `plan` (with `--output`), `preview`, `write` (writes; the `--write` flag is retired), and `ship`. The pruned-surface rule itself and the registry-derivation rule are unchanged; the renames are CLI spellings over unchanged operations.
- [39-revise-cli-command-reorganization-and-operation-registry.md](39-revise-cli-command-reorganization-and-operation-registry.md), The Operation Registry and Shared Core (R-REG, R-CORE, R-SURF): enhanced, not superseded — `package.ship` is appended to the registry as a real operation per the append-only rule, and the CLI surface gains a render layer at its presentation seam, which R-CORE-1 already assigns to the surface.
- [35-revise-run-playbook-state-machine.md](35-revise-run-playbook-state-machine.md), Run-State Storage and Record (R-STORE, R-STATE): the resume-hints element of the R-STATE-1 record gains subject scoping and retirement semantics; hints are current guidance only, and the durable audit trail remains the unchanged evidence log. Any serialization change is additive and migrated per the store's schema-versioning rules in [38-revise-global-store-and-project-state.md](38-revise-global-store-and-project-state.md).
- [36-revise-playbook-packaging-compiler-and-harness-adapters.md](36-revise-playbook-packaging-compiler-and-harness-adapters.md): consumed unchanged at the pipeline level — every precondition, digest-mismatch stop, ownership-conflict stop, and fail-before-write rule behaves exactly as mandated; this revision renames how intent is spelled and adds a composite entry point, not what is allowed.

## Rationale

The 2026-07-03 hand-run UAT showed one output channel serving two audiences and a grammar that mismatches intent. Every `run` command dumps the full JSON operation result (`printJson` at the end of the dispatcher in `packages/cli/src/run/cli.ts`); the state echo grows monotonically with the evidence log (~200 lines by close), the capability snapshot repeats verbatim in every echo, and the humanly useful part — the report, the next hint — is buried (X1, X7). `run package write` does not write without `--write` (X2); extracting a plan for the write step requires jq surgery (X3); run IDs are 24-character timestamps (X4); root flags and `--precondition k=v` ride on every command (X5); Node's SQLite ExperimentalWarning prints on every invocation (X6). `OperationRenderMode` already exists unused in `packages/cli/src/operations/types.ts` — the render seam was anticipated and never built. F2 ([D-016](03-open-questions-and-risk-register.md)): `withHint` in `packages/cli/src/operations/playbook/progression.ts` only appends, so hints from long-completed steps persist through `close` and mislead any agent reading hints as current guidance. Finally, the zero-friction path needs one entry point: a plan with nothing to review should ship end-to-end, and per the W18 R11 parity rule that entry point must be a registered operation, not a CLI-only composite.

Code anchors:

- `packages/cli/src/run/cli.ts`
- `packages/cli/src/operations/types.ts`
- `packages/cli/src/operations/playbook/progression.ts`

## Effective Requirement

### Agent Invariance (R-INV)

- R-INV-1 (MUST): operation result objects, MCP tool output, and the machine-readable CLI output remain byte-identical to the pre-remediation shapes, except for additive fields and additive flags. No MCP tool schema changes. Any behavior an agent scripts against today is reachable identically after this round.

### Render Layer (R-RENDER)

- R-RENDER-1 (MUST): the `run` dispatcher gains a render layer at the seam where `printJson(invocation.value)` sits today, keyed by the existing `OperationRenderMode`. On a TTY, the default rendering is human text per operation: what just happened (the execution report), where the run stands (a compact cursor/status line, not the full state echo), and what to do next (the next hint and the exact next command). `--json` always emits the full operation result, byte-identical to today. When stdout is not a TTY, the default remains the full JSON, so existing scripts and agents observe no change without passing any flag.
- R-RENDER-2 (MUST): the evidence log and the capability snapshot are not repeated in text mode — the capability snapshot renders once at `start`, and later text renderings reference rather than restate it; the full record stays available via `--json` and `status --json`.
- R-RENDER-3 (MUST): MCP output derives from the operation result exactly as today; the render layer is CLI-only.

### Package Grammar and Ship (R-GRAM)

- R-GRAM-1 (MUST): the packaging surface becomes intent-named, preserving the same review rails and every fail-before-write stop — `run package plan` (pure computation and review, gaining `--output <path>` to write the plan artifact directly), `run package preview` (the full write pipeline with no writes: every diagnostic, stop, and generated-output record, nothing on disk), and `run package write` (writes; the `--write` flag is retired on the CLI, and all preconditions, digest-mismatch stops, ownership-conflict stops, and fail-before-write semantics are unchanged).
- R-GRAM-2 (MUST): the renames are CLI spellings only — the underlying operations, their dry-run inputs, and the MCP tools are untouched per R-INV-1. The old `write`-as-dry-run spelling is not aliased; the retired `--write` spelling fails with guidance naming the new grammar, and invoking `write` still fails closed before writing whenever any stop applies.
- R-GRAM-3 (MUST): `package.ship` is a composite single-entry operation — a real registered operation in the operation registry per the W18 R11 parity rule that every CLI path mirrors a registry identifier, with no CLI-only composites — surfaced as `run package ship` and derived to MCP like every other operation. It executes plan → preview → write through the operation core, aborting at the first stop, unresolved proposal, or warning with guidance naming the granular command (`plan`, `preview`, or `write`) to continue with; it performs the classification write; every existing fail-before-write rail is preserved. A plan with zero unresolved items proceeds end-to-end without human judgment; anything needing review still stops.

### Run-Id and Flag Ergonomics (R-RUNID, R-FLAG)

- R-RUNID-1 (MUST): run identifiers keep their sortable internal form, but every `--run-id` acceptor resolves an unambiguous prefix, and a `--last` alias selects the most recent run for the resolved project; an ambiguous prefix fails listing the candidates.
- R-FLAG-1 (MUST): `--repo-root` defaults to the nearest ancestor of the working directory carrying `.make-docs/manifest.json`; `--store-root` defaults to the real global store; both flags remain as overrides.
- R-FLAG-2 (SHOULD): the packaging preconditions ceremony is absorbable into project config (for example a packaging preconditions block in `.make-docs/config.yaml`), with explicit flags always overriding; config remains convenience, never authority, consistent with the harness-capabilities precedent in [24-revise-configuration-convention-overlay.md](24-revise-configuration-convention-overlay.md).

### Noise (R-NOISE)

- R-NOISE-1 (MUST): the Node SQLite ExperimentalWarning is suppressed by a targeted process-warning filter at CLI entry that matches only that warning; never a blanket suppression.

### Hint Retirement (R-FIX)

- R-FIX-2 (MUST): resume hints become subject-scoped — each hint records the step or gate it advises about — and on every mutating transition (`advance`, `gate`, `resume`, `close`) hints whose subject has reached a resolved status are retired; `close` retires all guidance hints, so a closed run's state carries none. The durable audit trail is the unchanged evidence log; hints are current guidance only. Any run-state serialization change is additive and migrated per the store's schema-versioning rules. This is the [D-016](03-open-questions-and-risk-register.md) close bar.

### Sequencing (R-SEQ)

- R-SEQ-1 (MUST): the W18 R12 round lands before the W18 R9 conformance wave executes, because R9's evidence bar binds to generated-package content and CLI command spellings this round changes.
- R-SEQ-2 (MUST): this round reconciles [37-enhance-playbook-and-package-conformance.md](37-enhance-playbook-and-package-conformance.md) and the existing [W18 R9 backlog](../work/2026-07-01-w18-r9-playbook-and-package-conformance/00-index.md) for every assumption it invalidates — dependency-block fixtures and generated-check expectations, command spellings in scenario scripts, and any scenario transcript that consumes CLI output, which must pin `--json`. Tracked as register item [R-026](03-open-questions-and-risk-register.md).

### Verification (R-TEST)

- R-TEST-3 (MUST): a run advanced past a delegated step no longer carries that step's waiting hint; a closed run carries no guidance hints; the evidence log is unchanged.
- R-TEST-4 (MUST): render invariance — `--json` output and non-TTY default output are byte-identical to the pre-remediation operation results (modulo additive fields); MCP derivation parity holds.
- R-TEST-5 (MUST): grammar — `plan --output` writes the reviewable plan; `preview` writes nothing under any input; `write` preserves every existing stop; the retired `--write` spelling fails with guidance naming the new grammar.
- R-TEST-6 (MUST): ship — `run package ship` on a plan with zero unresolved items completes plan → preview → write end-to-end with the classification write recorded; on the first stop, unresolved proposal, or warning it aborts before any disk write with guidance naming the granular command to continue with; `package.ship` is present in the operation registry and derives to MCP like every other operation.

Code anchors:

- `packages/cli/src/run/cli.ts`
- `packages/cli/src/operations/types.ts`
- `packages/cli/src/operations/playbook/progression.ts`
- `packages/cli/tests/mcp-derivation.test.ts`
- `packages/cli/tests/consistency.test.ts`

## Impacted Docs and Dependencies

- [39-revise-cli-command-reorganization-and-operation-registry.md](39-revise-cli-command-reorganization-and-operation-registry.md): the `run package` spellings under its pruned run surface are superseded; the registry gains `package.ship` per its own append-only rule; the render layer lives in the CLI surface's presentation responsibility that R-CORE-1 already assigns; registry derivation, MCP naming, and the shared operation core are consumed unchanged.
- [35-revise-run-playbook-state-machine.md](35-revise-run-playbook-state-machine.md): the resume-hints record element gains retirement semantics; progression operation semantics, guardrails, resume, portability, and the evidence log remain active there.
- [36-revise-playbook-packaging-compiler-and-harness-adapters.md](36-revise-playbook-packaging-compiler-and-harness-adapters.md): consumed unchanged at the pipeline level; `package.ship` composes its existing plan, dry-run, and write behavior through the operation core, and every stop is preserved.
- [38-revise-global-store-and-project-state.md](38-revise-global-store-and-project-state.md): consumed unchanged — run-state serialization changes for hint subjects are additive and follow its schema-versioning and migration rules; run-id prefix resolution and `--last` read the store through existing interfaces; no annotation is required there.
- [25-revise-cli-separation-and-mcp-boundary.md](25-revise-cli-separation-and-mcp-boundary.md): consumed unchanged — the render layer is CLI-surface presentation and the MCP boundary is untouched per R-RENDER-3; no annotation is required there.
- [24-revise-configuration-convention-overlay.md](24-revise-configuration-convention-overlay.md): consumed unchanged — the packaging preconditions config block follows the existing convenience-never-authority posture; no annotation is required there.
- [37-enhance-playbook-and-package-conformance.md](37-enhance-playbook-and-package-conformance.md): its first-pass scenarios must run against the remediated grammar and pin `--json` for transcript consumption; the reconciliation is carried by R-SEQ-2 and the [W18 R12 backlog](../work/2026-07-03-w18-r12-playbook-authoring-ergonomics-and-cli-experience-remediation/00-index.md) Phase 4.
- [40-revise-playbook-authoring-contract-v2.md](40-revise-playbook-authoring-contract-v2.md): the sibling W18 R12 change doc; it owns the contract v2 break and the F1 probe fix and shares this doc's delivery sequence.
- Deferred directions: the Clack interactive run mode and the full TUI stay out of scope as register items [Q-015](03-open-questions-and-risk-register.md) and [Q-016](03-open-questions-and-risk-register.md); both inherit the remediated render layer, grammar, and pruned hints as their substrate.

Code anchors:

- `packages/cli/src/run/cli.ts`
- `packages/cli/src/operations/playbook-packaging/`
- `packages/cli/src/operations/playbook/progression.ts`

## Required Baseline Annotations

- [39-revise-cli-command-reorganization-and-operation-registry.md](39-revise-cli-command-reorganization-and-operation-registry.md): `Superseded by` as a new `#### Change Notes` block under The Run Surface After Pruning (R-RUN); `Enhanced by` as a new `#### Change Notes` block under The Operation Registry and Shared Core (R-REG, R-CORE, R-SURF).
- [35-revise-run-playbook-state-machine.md](35-revise-run-playbook-state-machine.md): `Superseded by` as a new `#### Change Notes` block under Run-State Storage and Record (R-STORE, R-STATE).
- [36-revise-playbook-packaging-compiler-and-harness-adapters.md](36-revise-playbook-packaging-compiler-and-harness-adapters.md): `Enhanced by` appended newest-last to the Impacted Docs and Dependencies `### Change Notes`.
- [37-enhance-playbook-and-package-conformance.md](37-enhance-playbook-and-package-conformance.md): `Superseded by` as a new `#### Change Notes` block under Required First-Pass Scenarios (R-SCEN), shared with [40-revise-playbook-authoring-contract-v2.md](40-revise-playbook-authoring-contract-v2.md).

## Source Anchors

- `docs/designs/2026-07-03-playbook-authoring-ergonomics-and-cli-experience-remediation.md`
- `docs/plans/2026-07-03-w18-r12-playbook-authoring-ergonomics-and-cli-experience-remediation/00-overview.md`
- `docs/prd/39-revise-cli-command-reorganization-and-operation-registry.md`
- `docs/prd/35-revise-run-playbook-state-machine.md`
- `docs/prd/36-revise-playbook-packaging-compiler-and-harness-adapters.md`
- `docs/prd/03-open-questions-and-risk-register.md`
- `packages/cli/src/run/cli.ts`
- `packages/cli/src/operations/types.ts`
- `packages/cli/src/operations/playbook/progression.ts`

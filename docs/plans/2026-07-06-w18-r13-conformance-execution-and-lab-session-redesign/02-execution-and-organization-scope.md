---
title: "W18 R13 Phase 2: Execution and Organization Scope"
kind: "plan"
status: "draft"
coordinate: "W18 R13"
---

# W18 R13 Phase 2: Execution and Organization Scope

## Purpose

Settle the implementation scope the delta backlog must encode, grounded in design decisions D1–D14 and the D12 reconciliation inventory, so the backlog phases are decision-complete.

## Fixed Decisions the Backlog Must Encode

### Organization and schema (D2, D3)

- The four committed `conformance/scenarios/codex-*.json` specs are replaced — content re-expressed as the four `packaging/` domain definitions with Codex target bindings — and the old files are removed in the same change (git history preserves them), never left as parallel truths.
- Definition ids are domain-qualified outcome names with no harness token, each at `conformance/scenarios/packaging/<outcome>.json`; Claude Code and Pi are uncovered targets whose absence from a definition's `targets` map is a reported gap (kit generation fails closed naming it; the registry's R-SCEN-2 absence notes continue to report it), extending only as far as their still-provisional descriptors honestly allow.
- The tuple registry's `plannedScenarios` values move to the domain-qualified ids and the `codex-plugin-native-project` note re-points at the discovery kit; no status, evidence, or tuple changes.
- Whatever step text remains committed in the new definitions is executable as written against the current CLI — evidence refs, `--yes` confirmation forms, and precondition establishment are never omitted — with the structural guarantee owned by kit generation (R-KIT-3) and proven by the executability check.
- `packages/cli/src/conformance/scenario.ts` carries the schema revision (`domain`, `targets`, `discoveryKit`; `harness`/`futureHarnesses` removed) and the updated `REQUIRED_FIRST_PASS_SCENARIOS`; `recordConformanceRunOnRegistryEntry` behavior is unchanged.
- `packages/cli/src/conformance/meta-verification.ts` follows the new ids and `scenarios/<domain>/` paths and gains the executability check; the R-TEST-3 markers are verified (not assumed) to survive the `scenarios/<domain>/` nesting, since they match subtree fragments at any depth.
- The four conformance test suites (`conformance-scenarios`, `-meta-verification`, `-tuple-registry`, `-governance`) move their fixture scenario ids, `futureHarnesses` assertions, and `.make-docs/conformance/...` transcript-pointer fixtures to the new forms; layer headers unchanged.
- [conformance/README.md](../../../conformance/README.md) extends its Scope paragraph with the domain axis (neither domain nor scenario ever encodes an execution target — including correcting its "harness belongs in the tuple and the spec filename" clause), updates layout, scenario-id, `futureHarnesses`, and transcript-home mentions, and routes `operator-modes.md`; the `AGENTS.md`/`CLAUDE.md` router stubs follow.

### The kit, instruments, and prompts (D4–D8)

- `kit.ts` lives in `packages/cli/src/conformance/` beside the existing lab modules so it consumes the descriptors, the packaging pipeline, and the scenario loaders in-process and is unit-testable; it is invoked through maintainer tooling (npm script/`scripts/` entry) and is deliberately not registered, not on the CLI tree, and not on MCP.
- Kit contents per (definition, target): materialized fixture project plus distributables shipped through the real plan/preview/write pipeline with session-configuration-supplied evidence refs and precondition attestations; self-assessment prompts; per-stage instrument scripts; a session manifest recording definition id, target, tuple ids, generation inputs (descriptor digest, CLI version), and the expected-evidence table ingestion validates against.
- Workspace layout fixed at `<session-root>/kit/`, `<session-root>/workspace/`, `<session-root>/evidence/`; disposable by default; nothing in it is ever written under the repository; the session root lives under the OS temp root or the store's lab area.
- Instruments are deterministic and offline — install exit codes and placement-root inventories, listing captures per the descriptor's lab-facing interrogation block, the `conformance-skill-probe` invocation marker, byte-level before/after uninstall diffs — and never interpret; interpretation happens at ingestion.
- Prompts: target-agnostic core with the honesty rules verbatim and the claims-are-not-evidence statement, rendered per target from the descriptors; attempt, observe, narrate — never certify.
- The discovery kit carries the committed characterization intent forward as a kit variant whose session precedes bar assertion (pin harness version, hand-author a minimal plugin from harness docs, vary marketplace source shapes, capture the accepted shape, diff generated shapes against it); findings feed descriptor corrections that re-trigger contract-digest re-verification, never bar relaxations; `resolvesProbe` linkage to R-021 preserved verbatim on the plugin definition's Codex target binding.
- Descriptor knowledge the kit needs but the descriptors lack (listing installed plugins, invocation logging) is authored into the descriptor type's interrogation block, verification-marked; no kit-local harness fact table.

### Ingestion, modes, and naming (D9–D11)

- Ingestion assembles `conformance.result.v1` records fail-closed from instrument outputs against the manifest's expected-evidence table; attestations (network, model routing), run metadata (model, provider, runtime), and the narrative reason are the only operator-contributed fields and are recorded as attestations; the validated record commits under `conformance/results/<harness>/` and binds through `recordConformanceRunOnRegistryEntry` with its existing refusals; nothing new writes to the registry.
- `conformance/operator-modes.md` documents the three modes (human-only, human plus assisting agent, agent-multiplexed) as executable protocol content in the maintainer-only directory; the parked `CONFORMANCE-RUN-codex-plugin.md` is the human-only mode's raw material and is never modified by agents; the developer guide summarizes and links rather than duplicating.
- Lab-session vocabulary everywhere operational: no new artifact, path, or identifier uses "run" for lab operations; `.gitignore:90` (`.make-docs/conformance/`) is retired while the adjacent `.make-docs/runs/` entry is explicitly preserved (store-migration lineage); the `scenario.ts` default transcript pointer and the `registry.ts` commentary move off the old path; retained raw evidence goes to `<store-root>/conformance-lab/sessions/<session-id>/` without this round owning store schema.

## Explicit Non-Goals (D13)

- No change to the tuple registry schema, statuses, or derivation rules; the evidence bar or verdict vocabulary; blocked-honesty or simulation-posture semantics; support-claim governance, thresholds, or claim surfaces; or meta-verification semantics beyond the id/path retargeting and the added executability check.
- No real-harness interaction in the implementation round — operating lab sessions against a real Codex install is the subsequent operational work R-021/R-022 gate on.
- Terminal-multiplexer tooling is consumed, not built; no new public claim surface is created; the compiled package's `.make-docs/conformance.json` embedded record (PRD 36) is untouched despite the near-collision; dated docs naming the old transcript home stay historical.

## Implementer Freedoms

The design fixes outcomes, not internals: the kit generator's module decomposition and CLI-invocation ergonomics, instrument script language and file naming, the session manifest's concrete field names beyond the required contents, the expected-evidence table's encoding, prompt wording beyond the required core statements, and the store lab area's internal layout below `sessions/<session-id>/` are open, provided every R-* requirement, the D14 verification bar, and the D12 inventory hold.

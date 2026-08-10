---
title: "W18 R13 Conformance Execution and Lab Session Redesign Work"
kind: "work"
status: "active"
coordinate: "W18 R13"
follow_on:
  route: "implementation-loop"
  next_prompt: ".make-docs/references/system/execution-workflow.md"
  why: "The backlog is the implementation queue derived from the W18 R13 plan and PRD contract, and every operated first-pass lab session — the R-021/R-022 close inputs — is gated behind it."
  coordinate_handoff: "Carry W18 R13 into phase history records and commits, adding the active P coordinate for each phase; operate lab sessions against a real harness only after Phase 4 completes and the reconciliation greps return no live-surface hits (register item R-028)."
source:
  type: "prd"
  path: "docs/prd/43-conformance-scenario-model-and-execution-kits.md"
---

# W18 R13 Conformance Execution and Lab Session Redesign Work

## Purpose

Implement the conformance execution and lab session redesign required by [43 Revise Conformance Scenario Model and Execution Kit](../../prd/43-conformance-scenario-model-and-execution-kits.md) and [44 Revise Conformance Lab Execution Protocol and Evidence Homes](../../prd/44-conformance-lab-sessions-and-evidence.md): harness-agnostic scenario definitions organized by domain under `conformance/scenarios/packaging/` with domain-qualified ids and per-target `targets` bindings replacing the four `codex-*` specs and `futureHarnesses` (register item D-025); the generated per-target conformance kit — real-pipeline artifacts, deterministic instrument scripts per bar stage, target-rendered prompts, the discovery kit carrying R-021's characterization plan, and a session manifest — under the executable-by-construction rule that closes register item D-023; fail-closed ingestion into the unchanged `recordConformanceRunOnRegistryEntry` seam; the three first-class operator modes under "the agent drives, the instruments measure"; and the lab-session evidence homes that retire repo-local `.make-docs/conformance/` (register item D-024). The source chain is [the design](../../designs/2026-07-06-conformance-execution-and-lab-session-redesign.md), [the W18 R13 plan](../../plans/2026-07-06-w18-r13-conformance-execution-and-lab-session-redesign/00-overview.md), and PRDs 43 and 44, with former PRD 37, [PRD 20](../../prd/20-agent-harness-conformance-and-support-claims.md), former PRD 42, [PRD 36](../../prd/36-playbook-packaging-compiler-and-harness-adapters.md), [PRD 38](../../prd/38-global-store-and-project-state.md), [PRD 39](../../prd/39-cli-command-model-and-operation-registry.md), former PRD 40 (now incorporated in [PRD 34](../../prd/34-playbook-authoring-contract-and-model.md)), and former PRD 41 as still-constraining historical baselines. The design's D12 reconciliation inventory (twenty entries) is this backlog's completeness source per register item [R-028](../../prd/03-open-questions-and-risk-register.md): every entry is either changed by a phase below or explicitly preserved with a recorded reason.

## Phase Map

| File | Purpose |
| --- | --- |
| [01-asset-reorganization-and-spec-migration.md](./01-asset-reorganization-and-spec-migration.md) | Land the domain-organized harness-agnostic scenario model: `scenarios/packaging/` with the four domain-qualified definitions and `targets` maps replacing the `codex-*` specs, executable-as-written committed steps, the `scenario.ts` schema revision (`domain`, `targets`, `discoveryKit`), registry `plannedScenarios` re-linkage, `REQUIRED_FIRST_PASS_SCENARIOS` and meta-verification retargeting, test-suite migration, and README/router Scope extension. |
| [02-execution-kit-instruments-and-lab-sessions.md](./02-execution-kit-instruments-and-lab-sessions.md) | Build the per-target kit generator consuming the capability descriptors (with the new lab-facing interrogation block), the per-stage instrument scripts, the discovery kit, prompt rendering, disposable lab-session workspace mechanics, and the lab-session evidence homes that retire the `.gitignore` entry and code defaults naming `.make-docs/conformance/`. |
| [03-ingestion-and-operator-modes.md](./03-ingestion-and-operator-modes.md) | Land fail-closed ingestion — result records assembled solely from instrument outputs into the unchanged recording seam, attestations recorded as attestations — and the `conformance/operator-modes.md` protocol doc covering the three modes. |
| [04-verification-and-reconciliation.md](./04-verification-and-reconciliation.md) | Prove the round: the D14 test bar including executable-by-construction proofs, the reconciliation-inventory sweep with grep proof, guide and claim-surface updates, the W18 R9 backlog reconciliation note, register closures (D-023/D-024/D-025, R-028), and the operator handoff. |

## Usage Notes

- Read phases in order; they are dependency-ordered — Phase 1 owns the definitions and schema everything else loads, Phase 2 generates kits from Phase 1's definitions and the descriptors, Phase 3 ingests what Phase 2's instruments produce, and Phase 4 proves the whole and closes the register items on grep evidence.
- The named rule R-EXEC-1 (PRD 44) is a MUST across every phase: self-assessment is never self-attestation; conformance evidence comes exclusively from deterministic instrument outputs; a target agent's claim is narrative context; a bar stage with no instrument output is unasserted.
- Machinery that must NOT change (design D13; PRD 43/44 preserved scope): the tuple registry schema, statuses, and derivation rules; the install-discover-invoke-uninstall evidence bar and verdict vocabulary; blocked-honesty and simulation-posture semantics; support-claim governance, thresholds, and the four claim surfaces; meta-verification semantics beyond the id/path retargeting and the added executability check; the `recordConformanceRunOnRegistryEntry` recording seam; `conformance/fixtures/`; and PRD 42's repo-root `conformance/` home.
- This round performs no real-harness interaction: it builds the kits, instruments, ingestion, and reorganization; operating lab sessions against a real Codex install is the subsequent operational work R-021/R-022 gate on. Terminal-multiplexer tooling is consumed as an environment capability, never built. No new public claim surface is created; Claude Code and Pi target bindings extend only as far as their still-provisional descriptors honestly allow, with their absence reported, never implied as covered.
- Kit generation is maintainer lab tooling (PRD 43 R-HOME-1): `kit.ts` in `packages/cli/src/conformance/` invoked through an npm script/`scripts/` entry, deliberately NOT registered in the operation registry and NOT on the shipped CLI or MCP surface — the W18 R11 parity rule is preserved vacuously, with the revisit seam recorded on register item Q-022.
- The conformance asset family under `conformance/` is maintainer-only in-repo content edited in place (the recorded exception to the upstream-first rule, enforced outward by R-TEST-3); lab code (kit generator, instruments, ingestion) is ordinary source under `packages/cli/` — nothing this round writes goes upstream to `packages/docs/template/`.
- The untracked repo-root working files are the user's: `CONFORMANCE-RUN-codex-plugin.md` is raw material for the human-only mode and is never modified by agents (the user retires it once absorbed); `UAT-W18-R7-R8.md` is out of this round's scope entirely.
- Unit and integration tests over kits, instruments, and ingestion remain repository test layers and are never cited as harness-recognition evidence (PRD 37 R-LAYER-2); machine-consumed CLI output inside kit and instrument code pins `--json` per the reconciled W18 R9 baseline (PRD 41).
- Keep task checkboxes as `- [ ] tN: ...` with IDs incrementing across each entire phase file and acceptance criteria as plain bullets.

## Intended Follow-On

This handoff is advisory-default-but-overridable: it is authoritative unless the user explicitly overrides it, and it is not a gate or precondition.

- Route: `implementation-loop`
- Next step: Start with Phase 1 and continue phase-by-phase.
- Why: The backlog is the implementation queue derived from the W18 R13 plan and PRD contract, and the first operated lab sessions bind their evidence to the forms this backlog builds.
- Coordinate Handoff: Carry `W18 R13` into phase history records and commits, adding the active P coordinate for each phase; operate first-pass lab sessions only after Phase 4 completes, the reconciliation greps return no live-surface hits, and register items D-023/D-024/D-025 are closed (R-028).

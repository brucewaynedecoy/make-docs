---
title: "Phase 4: Verification and Reconciliation"
kind: "work"
status: "active"
coordinate: "W18 R13 P4"
source:
  type: "prd"
  path: "docs/prd/43-revise-conformance-scenario-model-and-execution-kit.md"
---

# Phase 4: Verification and Reconciliation

## Purpose

Prove the round end-to-end and exhaust the reconciliation surface: run the D14 test bar including the executable-by-construction proofs, sweep the design's twenty-entry reconciliation inventory with grep proof, rewrite the developer guide and verify the claim surfaces, note the completed W18 R9 backlog, close the register items, and hand off to the operator. This phase implements PRD 43's Verification and Reconciliation Obligations (design D14 and D12) and the closure evidence for PRD 44 R-EXEC/R-NAME, closing register items [D-023](../../prd/03-open-questions-and-risk-register.md), [D-024](../../prd/03-open-questions-and-risk-register.md), and [D-025](../../prd/03-open-questions-and-risk-register.md) and satisfying [R-028](../../prd/03-open-questions-and-risk-register.md); it covers reconciliation-inventory entries 1–3, 10, 11, 14, 18, 19, and 20.

## Overview

Phases 1–3 each land their own suites; this phase runs them as one bar, adds the cross-cutting proofs the design's D14 names, and then turns outward to the reconciliation mandate: R-028's completion proof is the inventory greps returning no live-surface hits, not review impression. The phase ends with the lab operable in three modes and the first operated Codex session — the R-021/R-022 close input — unblocked as the subsequent operational work.

## Source PRD Docs

- [43 Revise Conformance Scenario Model and Execution Kit](../../prd/43-revise-conformance-scenario-model-and-execution-kit.md)
- [44 Revise Conformance Lab Execution Protocol and Evidence Homes](../../prd/44-revise-conformance-lab-execution-protocol-and-evidence-homes.md)
- [37 Enhance Playbook and Package Conformance](../../prd/37-enhance-playbook-and-package-conformance.md) and [20 Revise Agent Harness Model Conformance Lab](../../prd/20-revise-agent-harness-model-conformance-lab.md) (annotated baselines whose preserved scope the sweep re-verifies)
- [03 Open Questions and Risk Register](../../prd/03-open-questions-and-risk-register.md) (D-023, D-024, D-025, R-028, R-021, R-022, Q-022 closure state)

## Stage 1 - Full Verification Sweep (D14)

### Tasks

- [ ] t1: Run the complete W18 R13 test bar in one pass and fix regressions before proceeding: kit generation fails closed on an unprojectable definition; the three D-023 defect classes are impossible in generated output (evidence refs, `--yes`, precondition establishment all kit-supplied — asserted over generated kits); ingestion refuses to assert a bar stage without its instrument output; the R-TEST-2 check passes over the domain-organized definitions; and the executability check — a kit-generation dry-run projecting every required definition to a command sequence the current CLI accepts — runs enforcing in the standard suite (PRD 43 R-KIT-3, R-ING-1; PRD 37 R-TEST as enhanced).
- [ ] t2: Confirm the registry loads green with updated `plannedScenarios` and byte-untouched statuses and evidence, and that the kit/instrument/ingestion suites carry repository-layer `Test layer:` headers and are cited nowhere as harness-recognition evidence (PRD 37 R-LAYER-2).
- [ ] t3: Run the standard validation surface — the full CLI suite, build, `npm run validate:defaults`, `npm run smoke:pack`, `python3 .make-docs/scripts/check_path_hygiene.py` — plus a relative-link resolution pass over every document this round touched, and confirm `git diff --check` is clean.

### Acceptance criteria

- Every D14 proof has a passing test and the whole suite is green; the executability check fails the suite when a required definition is made unprojectable.
- The smoke-pack and R-TEST-3 exclusion checks prove no conformance asset — including `scenarios/<domain>/`, `operator-modes.md`, and kit tooling assets — ships in the template, the packaged copy, or the tarball.
- Path hygiene, link resolution, and `git diff --check` pass over the round's changes.

### Dependencies

- Phases 1–3 complete.

## Stage 2 - Reconciliation Inventory Sweep and Guides (R-028)

### Tasks

- [ ] t4: Execute the reconciliation greps as the completion proof and resolve every hit: `.make-docs/conformance` (no live-surface hits — dated designs, plans, and history records stay historical per inventory entry 18, and the preserved `compiler.ts` package record per entry 17 is the recorded exception), the four `codex-*` scenario ids, `futureHarnesses`, and stale `REQUIRED_FIRST_PASS_SCENARIOS` ids — recording the grep evidence in the phase history record (design D12; register R-028).
- [ ] t5: Rewrite the [developer conformance-lab guide](../../assets/library/developer/conformance-lab-scenario-and-result-contracts.md) to the new model — scenario shape (domain-qualified definitions with `targets`), lab-session evidence homes replacing the transcript-home mentions, `discoveryKit` replacing characterization, and an execution section that summarizes and links `conformance/operator-modes.md` — preserving its claim-surface role and `support-claim-state` marker (inventory entry 10).
- [ ] t6: Verify all four claim surfaces (conformance README, [user packaging guide](../../assets/library/user/playbooks-packaging-shareable-agent-workflows.md), [developer packaging guide](../../assets/library/developer/playbooks-development-packaging-and-harness-adapters.md), developer lab guide) unchanged in claim wording — governance derives wording from the registry, which this round does not move, so the markers stay bound to the 0-of-20 state — while updating any prose that cites superseded scenario ids or the old transcript home (inventory entry 11).
- [ ] t7: Add the reconciliation note to the completed [W18 R9 backlog index](../../work/2026-07-01-w18-r9-playbook-and-package-conformance/00-index.md) per the established pattern — its phase text naming the old transcript home and spec forms stays historical, and the R9 P1–P4 history records are never rewritten (inventory entry 14); re-verify the explicitly preserved entries: PRD 42's repo-root home (entry 3), `conformance/fixtures/` (entry 13), and `UAT-W18-R7-R8.md` untouched (entry 20).

### Acceptance criteria

- All four greps return no live-surface hits, with the recorded exceptions exactly the dated-evidence set and the preserved compiler record; the evidence is captured in the phase history record.
- The developer lab guide teaches the new model with its governance marker intact; no claim surface changed in claim wording.
- The W18 R9 backlog index carries the W18 R13 reconciliation note; no history record was modified.

### Dependencies

- Stage 1, so reconciliation targets verified surfaces.

## Stage 3 - Register Closures and Operator Handoff

### Tasks

- [ ] t8: Update the register in place, never renumbering: close D-023 (executable-by-construction landed; the three defect classes proven impossible in generated output), D-024 (no live surface names `.make-docs/conformance/`; the `.gitignore` entry retired; lab-session vocabulary in place), and D-025 (domain-organized harness-agnostic definitions with `targets` bindings; no harness-named id or `futureHarnesses` anywhere) with `Resolution` entries citing the Stage 1–2 evidence; close or update R-028 per its own to-close bar; verify R-021 and R-022 already reference the redesigned forms and update their follow-ups to point at operated-lab-session next steps; and confirm Q-022's kit-as-pipeline-consumer note reflects the landed state (inventory entry 19).
- [ ] t9: Write the phase history record per the history-record contract, including the operator handoff: how to generate the Codex first-pass kits, which of the three modes to choose, where session evidence lands, and that the first operated lab session — including the discovery-kit session resolving R-021's negative Codex v0.142.4 probe — is the next, separately-run operational work; note that `CONFORMANCE-RUN-codex-plugin.md` remains the user's file to retire once its human-mode content is absorbed.

### Acceptance criteria

- D-023, D-024, and D-025 are `Closed` with resolutions citing concrete evidence; R-028 reflects the exhausted inventory with grep proof; no register item was renumbered.
- The history record makes an operator able to start a lab session in any of the three modes without re-deriving decisions, and clearly states that no real-harness evidence was produced by this round.
- The working files `CONFORMANCE-RUN-codex-plugin.md` and `UAT-W18-R7-R8.md` are byte-unchanged.

### Dependencies

- Stages 1–2.

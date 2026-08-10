---
title: "W18 R9 P4: Support-Claim Governance"
kind: "history"
status: "completed"
date: "2026-07-04"
client: "Claude Code"
model: "Fable 5"
coordinate: "W18 R9 P4"
repo: "make-docs"
branch: "make-docs-v2"
summary: "Bound public support wording to the tuple registry: landed the R-GOV-1..2 governance module deriving claim wording, caveat surfacing, and the lab's review thresholds from registry evidence, wired the W18 R5 through W18 R8 provisional claims' mechanical promotion path with registry-agreement and claim-surface checks enforcing in the standard suite, and closed the W18 R9 wave with the register reconciliation — R-021 and R-022 stay open on the operational first-pass runs."
---

# W18 R9 P4: Support-Claim Governance

## Changes

This session implemented Phase 4 — the final phase — of [the W18 R9 backlog](../../../work/2026-07-01-w18-r9-playbook-and-package-conformance/04-support-claim-governance.md) (all six tasks, per PRD 37 R-GOV-1..2; retired action-PRD: `docs/prd/37-enhance-playbook-and-package-conformance.md`) and ran the wave-closing documentation passes.

### Implementation

| Surface | Summary |
| --- | --- |
| `packages/cli/src/conformance/governance.ts` (new) | The R-GOV-1 wording rule as code (t1/t2): `renderConformanceSupportClaim` is the single seam deriving permitted public wording from a registry entry — below `conformance-validated` the wording distinguishes a Make Docs generated output from a harness-recognized plugin; at `conformance-validated` it states only the exact tuple, scenario, bar, and run metadata, embedding every caveat carried by the reviewed qualifying runs. The R-GOV-2 thresholds as data and derivation (t3): `deriveSupportClaimStrength` reads each qualifying run's committed result record via `recordRef` (the Phase 3 receipts discipline) and fails closed to `no-public-claim` on a missing, invalid, or unreviewed record — one reviewed qualifying run is `nominal` (the lab's minimum), repeated reviewed runs with a reviewed `stronger-claim-candidate` are `stronger`, and stronger commendation renders only behind that threshold. A recorded judgment call: registry status and public claim are two gates — a tuple can be conformance-validated while wording stays withheld pending review, because the lab's claim gate requires review for any public wording. |
| Mechanical promotion (t4/t5) | `derivePackageSupportStatusCeilingFromRegistry` and `capSupportStatusForConformanceRegistry` add the third, maintainer-side support-status cap composing with the W18 R8 verification and tuple-binding caps: `validated` only when the exact registry tuple is `conformance-validated`, an unregistered tuple permits nothing. `listPackagingSupportRegistryAgreementErrors` proves the wiring both ways — every first-party descriptor placement claim (the W18 R5/PRD 33 generated-output claims and the W18 R8/PRD 36 R-ADAPT-1/R-PROV-3 adapter statuses, rebuilt from the descriptors via `listFirstPartyDescriptorPlacementTuples`) has exactly one registry tuple as its promotion path, every registry tuple anchors back to a placement (no parallel or prose-only support surface, R-REG-1), and an evidence-empty entry must report its absence in notes (R-SCEN-2). |
| Claim surfaces (t1/t4/t6) | `CONFORMANCE_CLAIM_SURFACES` declares the four reader-facing docs carrying support language; each must carry the R-GOV-1 core phrase, a reference to the tuple registry home (the t6 traceability entry point: surface → registry → tuple → recorded run → committed record), and a machine-checked `support-claim-state` marker asserting the registry's actual conformance-validated count (0/20 today). When a tuple advances, every marker goes stale and `listSupportClaimGovernanceErrors` fails the build until each surface's wording is reviewed and re-marked — wording advancement is mechanical, bound to the exact tuple advancing. A vocabulary sweep over the reader-facing roots flags support-status language on undeclared surfaces, and `listCommittedResultRecordClaimUseErrors` gates claim use on committed result records (review required for stronger candidates, qualifying verdicts only, caveats surfaced). |
| Where the checks run | New ENFORCING `packages/cli/tests/conformance-governance.test.ts` (20 tests, `Test layer: unit`) in the standard suite, following the Phase 3 meta-verification pattern — including the dynamic t4 leg: a fixture qualifying run advancing `codex-plugin-native-project` through `recordConformanceRunOnRegistryEntry` flips exactly that tuple's ceiling to `validated` and stales all four claim-surface markers. |

### Documentation passes

- Developer pass (`update-existing`): the conformance-lab guide gained a Support-Claim Governance section (derived wording, the two-gates decision, the review thresholds, marker mechanics, the packaging promotion wiring, and end-to-end traceability) with the Verdicts and Support Claims gate pointing at its now-encoded form; the packaging guide's Support-Tuple Binding section records the Phase 4 registry-ceiling cap as the third composing gate and the marker binding on the guide itself.
- User pass (`update-existing`): the user packaging guide's support section gained the governed-wording paragraph — why the guide says "generated plugin" and never "Codex-recognized plugin", caveat surfacing, the repeated-reviewed-runs bar for stronger recommendations, and the repository check that forces this guide's wording to update when the first combination is proven.
- PRD pass (`risk-register-update`, wave closeout): R-021 and R-022 advanced in place with the landed governance machinery; the wave-honesty reconciliation is recorded on both — Phases 1 through 4 complete the wave as machinery, and both items stay open on the single operational input the wave deliberately does not produce: maintainer-operated first-pass runs against a real Codex install, recorded through `recordConformanceRunOnRegistryEntry`. No new PRD docs, no renumbering, no other register items affected. The wave index keeps `status: "active"` per repo precedent for work indexes.
- UAT and manual-test coverage pass (wave-deferred per the standing session rule, verdict: `covered-by-deliverable`): no separate user-acceptance scenario is authored for this wave because the wave's committed deliverable is itself the manual-test apparatus — the four operator-run scenario specs under [docs/assets/conformance/scenarios/](../../../../conformance/scenarios/) are the acceptance walkthroughs, each declaring its preconditions, safety mode, and blocked resolution, with results recorded as evidence rather than checklist notes. A bespoke UAT script would duplicate them at lower fidelity. The operational handoff for the maintainer: run the four Codex-first scenarios against a real Codex install, starting with the plugin scenario's characterization preamble that resolves the negative R-021 recognition probe; every outcome — pass, caveated pass, or blocked — lands in the tuple registry through the recording seam.

### Validation

| Check | Result |
| --- | --- |
| `npm test -w packages/cli` | Green — 1007 tests across 59 files (+20 for the governance suite). |
| `npm run build -w packages/cli` | Green. |
| `npm run validate:defaults` | Green (33/33). |
| `npm run smoke:pack` | Green, including the tarball conformance-asset sweep. |
| `python3 .make-docs/scripts/check_path_hygiene.py` | Clean. |
| Changed-file relative-link check | All links resolve. |
| `git diff --check` | Clean. |

## Documentation

### Project

| Path | Description |
| --- | --- |
| [docs/prd/03-open-questions-and-risk-register.md](../../../prd/03-open-questions-and-risk-register.md) | R-021 and R-022 advanced in place with the P4 governance machinery and the wave-complete reconciliation; both close bars unchanged, open on the recorded real-harness first-pass runs. |
| [docs/work/2026-07-01-w18-r9-playbook-and-package-conformance/04-support-claim-governance.md](../../../work/2026-07-01-w18-r9-playbook-and-package-conformance/04-support-claim-governance.md) | All six phase tasks checked complete — the backlog's final phase. |
| [docs/assets/conformance/README.md](../../../../conformance/README.md) | New Support-Claim Governance section (rules, thresholds, claim surfaces, promotion path, traceability) with the `support-claim-state` marker, and the current-state section advanced to the wave-complete posture. |

### Developer

| Path | Description |
| --- | --- |
| [docs/assets/library/developer/conformance-lab-scenario-and-result-contracts.md](../../library/developer/conformance-lab-scenario-and-result-contracts.md) | New Support-Claim Governance section encoding the claim gate as code, with its marker and the P4 work-phase link. |
| [docs/assets/library/developer/playbooks-development-packaging-and-harness-adapters.md](../../library/developer/playbooks-development-packaging-and-harness-adapters.md) | Support-Tuple Binding section records the Phase 4 registry-ceiling cap, the agreement check, and the marker binding. |

### User

| Path | Description |
| --- | --- |
| [docs/assets/library/user/playbooks-packaging-shareable-agent-workflows.md](../../library/user/playbooks-packaging-shareable-agent-workflows.md) | Governed-wording paragraph in the support section with the `support-claim-state` marker. |

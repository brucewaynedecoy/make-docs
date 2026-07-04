---
title: "W18 R9 P2: Evidence Bar and First-Pass Scenarios"
kind: "history"
status: "completed"
date: "2026-07-04"
client: "Claude Code"
model: "Fable 5"
coordinate: "W18 R9 P2"
repo: "make-docs"
branch: "make-docs-v2"
summary: "Implemented the install-discover-invoke-uninstall evidence bar as the packaging scenario shape with the single run-recording seam onto the Phase 1 registry, authored the four Codex-first R-SCEN-1 scenario specs (runnable-or-blocked, none run), and ran the phase-closeout guide, user-guide, and PRD coverage passes."
---

# W18 R9 P2: Evidence Bar and First-Pass Scenarios

## Changes

This session implemented Phase 2 of [the W18 R9 backlog](../../../work/2026-07-01-w18-r9-playbook-and-package-conformance/02-evidence-bar-and-first-pass-scenarios.md) (all nine tasks, per [PRD 37](../../../prd/37-enhance-playbook-and-package-conformance.md)) and ran the closeout documentation passes.

### Implementation

| Surface | Summary |
| --- | --- |
| `packages/cli/src/conformance/scenario.ts` (new) | The D4 install-discover-invoke-uninstall bar as the packaging scenario shape (R-BAR-1): specs keep the lab's `conformance.scenario.v1` schema verbatim plus an additive `packagingExtension` block declaring per-stage bar assertions, preconditions, harness-execution posture, transcript and workspace policies, fixture Playbooks, and future-harness absence. Bar eligibility is checked by `scenarioAssertsFullEvidenceBar`/`listUnassertedEvidenceBarStages`; the schema rejects the retired `--write`, evidence transcripts that do not pin `--json` or run non-TTY (register item R-026), and destructive scenarios outside temp-fixture mode. |
| `recordConformanceRunOnRegistryEntry` | The single seam from a `conformance.result.v1` record (additive fields: per-stage `evidenceBar`, `caveatsSurfaced`, `simulated`, `simulationMechanicsRef`, `transcriptFormat`) onto a Phase 1 registry entry (R-BAR-2, R-REG-3): a qualifying `pass` — or `pass-with-caveats` with surfaced caveats — meeting all four stages advances the tuple and binds the evidence-owned dimensions through `bindRunMetadataOntoConformanceTuple`; it refuses scenario/target/harness mismatches, runs claiming unasserted stages (an incomplete scenario structurally cannot advance a tuple), and simulation-posture mismatches. Internal tests stay capped at `implementation-validated`. |
| Simulation posture (D8, t3) | `harnessExecution` on specs declares `real-harness` or `faithful-simulation` (the latter requiring documented reviewed mechanics); `simulated` rides every result record and recorded run, and the registry's verdict-derivation data gained the drift-checked simulation clause. All four first-pass specs declare `real-harness` — no Codex simulation exists, none is claimed. |
| Four Codex-first specs under [docs/assets/conformance/scenarios/](../../conformance/scenarios/codex-plugin-marketplace-install.json) (new) | JSON, filename = `scenarioId`: skills-bundle discovery and invocation; plugin marketplace install carrying the R-021 characterization preamble (pin the Codex version, hand-author a minimal plugin from the Codex docs, vary marketplace source shapes until accepted, record ground truth, diff the generated shapes — divergences are compiler/descriptor defects, never bar relaxations); dependency checks in both directions with probe-bound v2 expectations (the fixture includes an `rg` entry whose `source` prose begins "ripgrep" and a deliberately absent probe); and uninstall-and-backup cleanliness, which owns PRD 36 R-PROV-2. |
| Safety and preconditions (t8) | All four specs declare `external-provider-run`, non-destructive, disposable-fixture-workspace, and four-plus preconditions with `onUnmet: blocked`: harness CLI and auth via `command-succeeds` probes, network and model routing via operator attestations that default to unmet. `probePackagingScenarioPreconditions` + `blockedPackagingResultRecord` resolve unmet preconditions to valid `blocked` records (`supportClaimUse: none`, all-false bar) that never advance; unattended runs are `blocked` by default. |
| Fixtures and registry linkage (t9) | Two v2-form fixture Playbooks under `docs/assets/conformance/fixtures/agent/`; scenario scripts use the `run package ship` grammar with `--json` pinned. The registry gained `plannedScenarios[]` — forward-looking linkage that never binds the `scenario` dimension — populated on the three targeted Codex tuples, explicitly empty on all others, with scenario-absence notes on all six Pi entries (R-SCEN-2); `listConformanceScenarioRegistryLinkageErrors` enforces the spec↔registry linkage bidirectionally, and `REQUIRED_FIRST_PASS_SCENARIOS` pre-figures Phase 3's R-TEST-2. The `results/` directory is deliberately not created until a run exists ([the README](../../conformance/README.md) documents this). |

### Documentation passes

- Developer pass (`update-existing`): the conformance-lab guide gained a Packaging Conformance Scenarios and the Evidence Bar section (the `packagingExtension` shape and its fail-closed schema rules, the bar-eligibility helpers, the recording seam and its refusal rules, the simulation posture contract, the precondition/blocked machinery, the R-021 characterization preamble, `plannedScenarios` semantics, and where specs/fixtures/result records live), with the overview and orientation table updated. The packaging guide's lifecycle paragraph now records that the referenced R-PROV-2 cleanliness scenario exists as a committed spec, and its promotion-path paragraph notes the scenario end now exists with no status changed. Neither guide's Future Coverage bullet is resolved: both are blocked by recorded real-harness evidence, which this phase deliberately does not produce.
- User pass (`update-existing`, minimal): the packaging user guide's support-status paragraph now states that the four Codex-first scenarios exist and are honestly blocked pending a maintainer operating a real Codex install — with no recognition claimed.
- PRD pass (`risk-register-update`): R-021 advanced in place (the characterization plan is now a committed spec whose `resolvesProbe` names the item; close bar unchanged — the recorded qualifying run), R-022 advanced materially in place (the blocked machinery and operator-attestation preconditions are its close-bar prerequisites; scenarios exist and are runnable-or-blocked; close bar open — the actual first-pass runs and R-TEST-2), and R-007/D-007/Q-005 were checked and deliberately unchanged: the phase touches only `docs/assets/conformance/**` (the recorded upstream-first exception) and CLI conformance code, no template/dogfood parity surface. No new PRD docs, no renumbering.

### Validation

| Check | Result |
| --- | --- |
| `npm test -w packages/cli` | Green — 968 tests across 57 files (+35 for the scenario contract, recording seam, preconditions, and linkage). |
| `npm run build -w packages/cli` | Green. |
| `npm run validate:defaults` | Green. |
| `python3 .make-docs/scripts/check_path_hygiene.py` | Clean. |
| Changed-file relative-link check | All links resolve. |
| `git diff --check` | Clean. |

## Documentation

### Project

| Path | Description |
| --- | --- |
| [docs/prd/03-open-questions-and-risk-register.md](../../../prd/03-open-questions-and-risk-register.md) | R-021 advanced in place with the committed characterization spec; R-022 advanced in place with the runnable-or-blocked scenarios and structural blocked-honesty machinery; both close bars unchanged. |
| [docs/work/2026-07-01-w18-r9-playbook-and-package-conformance/02-evidence-bar-and-first-pass-scenarios.md](../../../work/2026-07-01-w18-r9-playbook-and-package-conformance/02-evidence-bar-and-first-pass-scenarios.md) | All nine phase tasks checked complete. |
| [docs/assets/conformance/README.md](../../conformance/README.md) | Extended for Phase 2: scenario spec format, precondition and blocked-run rules, the four first-pass scenarios, fixtures, result-record format, and the current no-runs state. |

### Developer

| Path | Description |
| --- | --- |
| [docs/assets/library/developer/conformance-lab-scenario-and-result-contracts.md](../../library/developer/conformance-lab-scenario-and-result-contracts.md) | New Packaging Conformance Scenarios and the Evidence Bar section: the `packagingExtension` scenario shape, bar-eligibility helpers, the `recordConformanceRunOnRegistryEntry` seam and refusal rules, simulation posture, precondition/blocked machinery, the R-021 characterization preamble, and planned-scenario linkage. |
| [docs/assets/library/developer/playbooks-development-packaging-and-harness-adapters.md](../../library/developer/playbooks-development-packaging-and-harness-adapters.md) | Lifecycle coverage paragraph records the committed R-PROV-2 cleanliness scenario spec; the W18 R9 promotion-path paragraph notes the scenario end now exists with no status advanced. |

### User

| Path | Description |
| --- | --- |
| [docs/assets/library/user/playbooks-packaging-shareable-agent-workflows.md](../../library/user/playbooks-packaging-shareable-agent-workflows.md) | Support-status wording now says the four Codex-first scenarios exist and are blocked pending a real-harness operator run, with no recognition claimed. |

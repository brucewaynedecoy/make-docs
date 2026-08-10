---
title: "W18 R13 P4: Verification and Reconciliation"
kind: "history"
status: "completed"
date: "2026-07-06"
client: "Claude Code"
model: "Fable 5"
coordinate: "W18 R13 P4"
repo: "make-docs"
branch: "make-docs-v2"
summary: "Closed the W18 R13 conformance execution and lab-session redesign wave: ran the full D14 verification bar (the enforcing dry-run executability check that generates all four required definitions plus the negative tests that mutate the real plugin definition, fail-closed ingestion, and the layer markers all green in one pass), swept the reconciliation inventory with grep proof returning no live-surface hits on the superseded forms, and reconciled the developer conformance-lab guide and the W18 R9 backlog index to the new model with the four claim surfaces verified unchanged at 0/20. Closed D-023 (executable-by-construction with the enforcing check), D-024 (no live surface names the old transcript home), and R-028 (the reconciliation exhausted) with resolutions citing concrete evidence; D-025 was already closed at P1. No source code changed and no real-harness evidence was produced — the registry stays 0/20 — and the operator handoff for the first operated Codex session, opening with the discovery-kit session that resolves R-021's negative probe, is recorded below."
---

# W18 R13 P4: Verification and Reconciliation

## Changes

This session executed Phase 4 — the final phase — of [the W18 R13 backlog](../../../work/2026-07-06-w18-r13-conformance-execution-and-lab-session-redesign/04-verification-and-reconciliation.md) (all nine tasks t1–t9 across the three stages, per [historical closeout](2026-07-06-w18-r13-conformance-execution-and-lab-session-redesign.md) (retired action-PRD: `docs/prd/43-revise-conformance-scenario-model-and-execution-kit.md`) design D14/D12 and this historical record (retired action-PRD: `docs/prd/44-revise-conformance-lab-execution-protocol-and-evidence-homes.md`) R-EXEC/R-NAME closure evidence) and closed the wave. Phase 4 changes no source code: it verifies the round end to end, exhausts the reconciliation surface with grep proof, reconciles the guide and backlog documentation, and closes the register items.

### Full verification sweep (D14, Stage 1)

The complete W18 R13 test bar runs green in one pass, and the executability guarantee this wave exists to establish is an enforcing check in the standard suite, not an authored claim:

- **The enforcing dry-run executability check.** `generateFirstPassConformanceKitSuite` generates all four required `packaging/*` definitions into a temporary session root as part of `packages/cli/tests/conformance-kit.test.ts`, running the full three-layer projection over each — static argv projection through the registry-derived resolver, the authored CLI adapters, and each operation's input schema (`adaptRunCliArgv`); workspace materialization by executing the definition's own setup steps; and every ship step driven end to end through the operation core under the dry-run context. A required definition that could not project to an accepted, stop-free command sequence fails the suite.
- **The check fails when a required definition is made unprojectable.** The negative direction is proven directly against the real committed plugin definition: tests remove the `--support-evidence-ref` (D-023 defect class 1) and the uninstall `--yes` (defect class 2) and assert generation throws, and further tests reject an unprojectable command and an uncovered target — so the three D-023 defect classes are demonstrably impossible in generated output.
- **Ingestion refuses to assert a bar stage without its instrument output** (`packages/cli/tests/conformance-ingestion.test.ts`), the R-TEST-2 runnability check passes over the domain-organized definitions, and the kit, instrument, and ingestion suites all carry repository-layer `Test layer:` header markers cited nowhere as harness-recognition evidence (R-LAYER-2). The tuple registry loads green with its `plannedScenarios` linkage and byte-untouched statuses and evidence.

### Reconciliation inventory sweep with grep proof (R-028, Stage 2)

The four completion greps return no live-surface hits on the superseded forms — completion is proven by grep, not review impression — with only the recorded exceptions surviving:

| Grep | Result |
| --- | --- |
| `.make-docs/conformance` | No live transcript-home surface: the only live-code hits are in `packages/cli/src/conformance/lab-session.ts`, which REJECTS the old home, plus the retirement docs. The `.make-docs/conformance.json` compiled package record (inventory entry 17) and the dated designs, plans, and history records (entry 18) are the preserved exceptions; the adjacent `.make-docs/runs/` `.gitignore` entry (store-migration lineage) is preserved. |
| The four `codex-*` scenario ids | Zero live usage — only the schema-rejection documentation and the tests that prove the rejection spell the retired ids. |
| `futureHarnesses` | Survives only as prose documenting its retirement: the `.strict()` schema rejection in `scenario.ts`, its rejection tests, and the README's "replaces the retired `futureHarnesses` list" note. |
| `REQUIRED_FIRST_PASS_SCENARIOS` | Holds exactly the four domain-qualified `packaging/*` ids; no stale `codex-*` key. |

The developer conformance-lab guide was rewritten to the new model — the old "Harness Adapter Protocol / Future adapter targets reserved" table (the retired copy-per-harness framing) became "Execution Targets and Uncovered-Target Reporting" (a harness is covered by a `targets` binding, an uncovered target is a reported gap), the scenario-spec section now distinguishes the unchanged `conformance.scenario.v1` lab core from the harness-agnostic `targets`-bound packaging shape, and the Phase 1–3 additions (discovery kit, ingestion, discover honesty rule, recording seam, operator modes) were preserved — with its `support-claim-state` marker byte-unchanged at 0/20 and no support-claim wording changed. The completed W18 R9 backlog index gained one forward reconciliation note in the established `(date, register item; PRD)` pattern; its own phase text and the R9 P1–P4 history records stay historical and were not rewritten. The four claim surfaces (conformance README, user packaging guide, developer packaging guide, developer lab guide) were verified unchanged in claim wording, every marker still bound to the registry's 0-of-20 state. The preserved-entry set was re-confirmed untouched: PRD 42's repo-root `conformance/` home, `conformance/fixtures/`, and `UAT-W18-R7-R8.md`.

### Register closures (Stage 3)

- **D-023** (specs never executable as written) — **Closed** on every clause: executability is a generated property proven by the enforcing dry-run check, the three defect classes are structurally impossible in generated output, and P3 exercised the projection end to end through ingestion.
- **D-024** (repo-local transcript home) — **Closed**: no live surface names `.make-docs/conformance/` as a current home, the `.gitignore` entry is retired, the lab-session vocabulary and evidence homes are code, and the PRD 20/PRD 37 clauses are change-managed through PRD 44 R-NAME. The previous attempt's repo-local probe residue was removed as part of the cleanup.
- **D-025** (harness-named scenario identity) — already **Closed** at P1; unchanged.
- **R-028** (reconcile every consumer of the superseded forms) — **Closed**: the inventory is exhausted with grep proof, D-023/D-024/D-025 closed on their own bars, the PRD revisions are change-managed through PRD 43/44, and every consumer is reconciled or preserved with a recorded reason.
- **R-021** and **R-022** stay **Open** by design — they gate on recorded first-pass runs against a real Codex install, which this round deliberately does not produce; their follow-ups now point at the operated-lab-session next step, and R-021's note records that the discover honesty rule keeps its negative recognition probe honest in code. **Q-022** was confirmed: the per-target kit is now a working end-to-end consumer of the packaging pipeline.

## Operator handoff — the first operated Codex lab session

The lab is complete as machinery and operable in three modes; the one input the wave does not produce is recorded real-harness evidence. That is separate, operator-run work. To run the first session:

1. **Generate the kit** from the repo root: `npm run conformance:kit -- --scenario packaging/plugin-marketplace-install --target codex`. This writes a disposable lab session (`kit/`, `workspace/`, `evidence/`) outside the repository; start from `kit/prompts/session-prompt.md`. The plugin definition's Codex binding also renders `kit/prompts/discovery-prompt.md`.
2. **Choose a mode** ([conformance/operator-modes.md](../../../../conformance/operator-modes.md)): human-only (the manual fallback, and the right mode for the open-ended discovery exploration only a human with the real install can do), human plus assisting agent, or agent-multiplexed. All three drive evidence through the same kit → instruments → ingestion path, and none may treat a driver's claim as evidence.
3. **Run the discovery-kit session first.** It records ground truth for what the pinned Codex version accepts as a marketplace source and plugin layout, using a hand-minimal plugin independent of Make Docs, then diffs the generated shapes against it — this is the recorded plan that resolves R-021's negative Codex v0.142.4 recognition probe, and its findings feed descriptor corrections, never bar relaxations.
4. **Ingest**: `npm run conformance:ingest -- --session-root <dir> --attestations attestations.json` assembles the `conformance.result.v1` record from instrument outputs only, previews the measured-vs-attested provenance, and writes it under `conformance/results/<harness>/` with `--write`. Binding the record to its tuple is a separate reviewed step through `recordConformanceRunOnRegistryEntry`.

Two honest expectations for that first session: **discover cannot reach an instrument-confirmed pass for Codex today** — there is no verified machine-readable Codex plugin-listing command, so placement is not recognition and the tuple will not advance on placement alone until the discovery session resolves the recognition surface (R-021); and **a session with unmet preconditions ingests to an honest `blocked`**, never invented evidence. The human walkthrough is the generated kit itself — `kit/prompts/session-prompt.md` (and `kit/prompts/discovery-prompt.md`) plus `conformance/operator-modes.md` — not a hand-maintained file. The earlier codex-* walkthrough (`CONFORMANCE-RUN-codex-plugin.md`) and its repo-local `.make-docs/conformance/` probe residue were removed as previous-attempt waste during this cleanup, with the walkthrough's three defect notes preserved verbatim in register item D-023.

## Validation

| Check | Result |
| --- | --- |
| `npm test -w packages/cli` | Green — 1060 tests across 62 files. |
| `npm run build -w packages/cli` | Green. |
| `npm run validate:defaults` | Green (33/33). |
| `npm run smoke:pack` | Green — no conformance asset (`scenarios/`, `operator-modes.md`, kit tooling) ships. |
| `python3 .make-docs/scripts/check_path_hygiene.py` | Clean (0 errors). |
| Changed-file relative-link check | All links resolve. |
| `git diff --check` | Clean. |

## Documentation

### Project

| Path | Description |
| --- | --- |
| [docs/prd/03-open-questions-and-risk-register.md](../../../prd/03-open-questions-and-risk-register.md) | D-023, D-024, and R-028 closed with resolutions citing the verification and reconciliation evidence; R-021 and R-022 advanced in place (stay open on the operated-session input); Q-022 confirmed. No renumbering. |
| [docs/work/2026-07-06-w18-r13-conformance-execution-and-lab-session-redesign/04-verification-and-reconciliation.md](../../../work/2026-07-06-w18-r13-conformance-execution-and-lab-session-redesign/04-verification-and-reconciliation.md) | All nine phase tasks checked complete — the wave's final phase. |
| [docs/work/2026-07-01-w18-r9-playbook-and-package-conformance/00-index.md](../../../work/2026-07-01-w18-r9-playbook-and-package-conformance/00-index.md) | Forward W18 R13 reconciliation note added; the R9 phase text and history records stay historical. |

### Developer

| Path | Description |
| --- | --- |
| [docs/assets/library/developer/conformance-lab-scenario-and-result-contracts.md](../../library/developer/conformance-lab-scenario-and-result-contracts.md) | Rewritten to the new model: the old copy-per-harness adapter table became Execution Targets and Uncovered-Target Reporting, the scenario-spec section distinguishes the unchanged lab core from the packaging `targets` shape, the Phase 1–3 additions are preserved, and the `support-claim-state` marker stays byte-unchanged at 0/20. |

### User

None this session — Phase 4 changes no user-facing surface, and the four claim surfaces were verified unchanged in wording with their markers bound to the registry's 0-of-20 state.

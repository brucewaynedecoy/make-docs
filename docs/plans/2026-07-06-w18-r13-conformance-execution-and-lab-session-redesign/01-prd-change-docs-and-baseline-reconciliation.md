---
title: "W18 R13 Phase 1: PRD Change Docs and Baseline Reconciliation"
kind: "plan"
status: "draft"
coordinate: "W18 R13"
---

# W18 R13 Phase 1: PRD Change Docs and Baseline Reconciliation

## Purpose

Turn the accepted design into active PRD requirements: author the two revision change docs, annotate the impacted baselines non-destructively, and bring the PRD index to the resolved state. The living risk register already carries this round's items from the design session (D-023, D-024, D-025 open with close bars; R-028 tracking; R-021/R-022 updated in place), so no register edits belong to this phase; closures land at implementation Phase 4.

## Change Doc Shapes

### PRD 43 — Revise Conformance Scenario Model and Execution Kit

Authored from `.make-docs/templates/system/prd-change-revision.md`. It revises PRD 37's execution layer and asset organization while leaving its registry, statuses, bar, layers, and governance untouched:

- R-ORG-1..3 — definitions by domain, evidence by target: harness-agnostic definitions at `conformance/scenarios/<domain>/<outcome>.json` with domain-qualified ids (`packaging/plugin-marketplace-install`, `packaging/skills-bundle-discovery-invocation`, `packaging/dependency-check-both-directions`, `packaging/uninstall-backup-cleanliness`; `playbook-runs` is the named future domain, created only when its first definition lands); committed result records at `conformance/results/<harness>/<YYYY-MM-DD>-<outcome-slug>-<seq>.json` with model-or-provider and runtime living inside each record; the tuple registry stays the single queryable index; the README Scope paragraph survives and extends with the domain axis; `conformance/fixtures/` unchanged.
- R-SCHEMA-1..3 — the `conformance.scenario.v1` lab core untouched; the `packagingExtension` keeps definition-level fields (per-stage `evidenceBar`, `transcriptPolicy`, `workspacePolicy`, `fixturePlaybooks`, the precondition template) and gains `domain`; `harness`, `harnessExecution`, per-target `registryTupleIds`, and target-specific precondition probes move into a `targets` map keyed by harness id; `futureHarnesses` is retired — an absent `targets` entry is an uncovered target, kit generation for it fails closed naming the gap, and the registry's scenario-absence notes keep reporting it; `REQUIRED_FIRST_PASS_SCENARIOS`, the R-TEST-2 check, and the registry's `plannedScenarios` move to the new ids in the same change, with the required first-pass set staying the four packaging outcomes bound to Codex targets.
- R-KIT-1..3 — the per-target kit generated on demand for one (definition, target) pair or one target's full first-pass suite into a disposable lab-session workspace outside the repository; the fixed `<session-root>/kit|workspace|evidence` layout; artifacts shipped through the real packaging pipeline with evidence refs and precondition attestations kit-supplied (the structural fix for all three D-023 defects); executable-by-construction — generation derives every command from the registered operation surface and the capability descriptors and fails closed, before any session starts, on a definition that cannot project to an accepted command sequence.
- R-HOME-1..2 — kit generation as maintainer lab code (`kit.ts` beside the existing lab modules, invoked through an npm script/`scripts/` entry), deliberately NOT a registered operation and NOT on the shipped CLI or MCP surface (W18 R11 parity preserved vacuously; revisit seam on Q-022); the kit consumes the harness capability descriptors and never mints a second harness-knowledge home — missing lab-facing knowledge is authored into a verification-marked interrogation block on the descriptor type (the PRD 36 R-CAP enhancement), and a kit-local harness fact table is prohibited as the R-021 regression vector.
- R-INST-1..2 — one deterministic instrument script per asserted bar stage landing outputs in `evidence/`: install (exit codes plus placement-root file inventory), discover (capture of the harness's own listing surface per the descriptor's interrogation block), invoke (the `conformance-skill-probe` marker file), uninstall (byte-level before/after diff proving managed outputs removed, user content untouched, no orphaned managed directories); instruments capture, never interpret, and spend no network or model routing.
- R-PROMPT-1 — the target-agnostic prompt core (session narrative, honesty rules verbatim, when to run each instrument, the explicit statement that agent claims are not evidence) rendered per target from the descriptors; the prompt never asks the agent to certify.
- R-DISC-1 — the `characterization` block renamed and generalized to `discoveryKit` with the `resolvesProbe` linkage to R-021 preserved verbatim; the first-run discovery kit carries R-021's resolution plan for the negative Codex v0.142.4 probe as its first instance, feeding descriptor corrections, never bar relaxations.
- R-ING-1..2 — deterministic fail-closed ingestion: bar-stage booleans derive solely from instrument outputs validated against the manifest's expected-evidence table (missing or failed instrument output for an asserted stage yields `false`); operator attestations, run metadata, and the narrative reason are recorded as attestations distinguishable from measurement; the assembled record validates against the existing result contract and binds to its tuple exclusively through the unchanged `recordConformanceRunOnRegistryEntry` seam with all existing refusals and the R-TEST-1 receipts discipline intact.
- The D14 verification bar and the D12 reconciliation inventory as explicit requirements on the implementation round.

### PRD 44 — Revise Conformance Lab Execution Protocol and Evidence Homes

Authored from the same revision template. It revises PRD 20's execution protocol and raw-evidence default while leaving the lab's verdicts, safety modes, evidence classes, result contract, and one-run threshold unchanged:

- R-EXEC-1..3 — the named rule "the agent drives, the instruments measure": self-assessment is never self-attestation; in every mode the target agent or human performs the discovery, invocation, and judgment-shaped work while conformance evidence comes exclusively from deterministic instrument outputs; a bar stage with no instrument output is unasserted; uninstrumentable stages are recorded caveats feeding the existing `pass-with-caveats` rules, never trust fallbacks; blocked-honesty semantics are preserved unchanged (unmet preconditions resolve to an honest `blocked` record, `supportClaimUse: none`, all-false bar).
- R-MODE-1..2 — three first-class operator modes producing evidence through the same kit and instruments: human-only (the parked `CONFORMANCE-RUN-codex-plugin.md` walkthrough is raw material for these instructions; the file itself is the user's working file, never modified by agents, retired by the user when absorbed), human plus assisting agent, and agent-multiplexed (multiplexer tooling consumed as an environment capability, not built); mode instructions live at `conformance/operator-modes.md` with the developer conformance-lab guide summarizing and linking.
- R-NAME-1..2 — the operational envelope is a lab session (session id, workspace, evidence, manifest); "run" survives only as the registry's `recordedRuns` evidence-layer noun and the `run` CLI command; the repo-local `.make-docs/conformance/` transcript home is rejected (D-024): transcripts and evidence scratch live in the disposable session workspace and are discarded with it by default, promoted evidence lands in the committed result record, retained raw evidence goes to the machine-level store's lab area (`<store-root>/conformance-lab/sessions/<session-id>/` — defined narrowly, without owning store schema), and the `.gitignore` entry, the `scenario.ts` default transcript pointer, the `registry.ts` commentary, and the test-fixture pointers all move off the old path; `transcriptLogPointer` values point into the store's lab area or state `discarded-with-session`.

## Baseline Annotations

Apply the annotation plan from [00-overview.md](00-overview.md) exactly: PRD 37 — `Superseded by` 43 appended newest-last under R-SCEN's existing `#### Change Notes`, a new `#### Change Notes` under R-TEST with `Enhanced by` 43 (the executability check; R-TEST-1/3 unchanged), and `Superseded by` 43 and 44 appended newest-last under the Contracts and Data `### Change Notes`; PRD 20 — `Superseded by` 44 appended newest-last under the Effective Requirement `### Change Notes`; PRD 42 — a new `### Change Notes` under Effective Requirement with `Superseded by` 44 scoped to the raw-transcripts sentence only, with the repo-root home explicitly preserved; PRD 36 — a new `#### Change Notes` under R-CAP with `Enhanced by` 43 for the lab-facing interrogation block. Never delete or rewrite baseline text.

## Index

`docs/prd/00-index.md`: add document-map rows for 43 and 44 with Current status, extend the reading-order item-3 prose and both long audience-path enumerations with the W18 R13 clause, add source anchors for the new docs, the design, the plan, and the backlog, and add the Intended Follow-On bullet sequencing operated lab sessions behind the W18 R13 backlog per R-028.

## Exit Criteria

- PRD 43 and PRD 44 exist, use the revision template headings, and carry their assigned requirement families with stable IDs matching the design.
- Every planned annotation exists with the planned verb, newest note last.
- The index reflects the new catalog state with no renumbering, and the register is untouched by this phase.

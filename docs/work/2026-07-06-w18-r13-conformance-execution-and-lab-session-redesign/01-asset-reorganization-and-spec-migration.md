---
title: "Phase 1: Asset Reorganization and Spec Migration"
kind: "work"
status: "active"
coordinate: "W18 R13 P1"
source:
  type: "prd"
  path: "docs/prd/43-revise-conformance-scenario-model-and-execution-kit.md"
---

# Phase 1: Asset Reorganization and Spec Migration

## Purpose

Land the scenario model everything else in the round loads: harness-agnostic, domain-organized definitions with per-target bindings replacing the four harness-named specs, the schema revision that carries them, and the retargeted registry linkage, constants, checks, tests, and routers. This phase implements PRD 43 anchors R-ORG-1..3, R-SCHEMA-1..3, and the schema half of R-DISC-1, resolving the identity bifurcation recorded in register item [D-025](../../prd/03-open-questions-and-risk-register.md) and covering reconciliation-inventory entries 4, 5, 6 (schema and ids), 7 (ids/paths), 9, 12, and 13.

## Overview

The four committed `conformance/scenarios/codex-*.json` specs are replaced by four `packaging/` domain definitions whose content is re-expressed, not lost: the definition-level, target-independent material (evidence-bar assertions, transcript policy, workspace policy, fixture playbooks, precondition template) survives in the `packagingExtension`, while everything that names a target (harness execution, tuple linkage, target-specific probes) moves into a `targets` map keyed by harness id, Codex bound for the first pass. The old files are removed in the same change — git history preserves them; no parallel truths. Scenario ids are load-bearing in the tuple registry, the `REQUIRED_FIRST_PASS_SCENARIOS` constant, the R-TEST-2 check, the README, and the test suites, so this phase moves all of them together.

## Source PRD Docs

- [43 Revise Conformance Scenario Model and Execution Kit](../../prd/43-revise-conformance-scenario-model-and-execution-kit.md)
- [37 Enhance Playbook and Package Conformance](../../prd/37-enhance-playbook-and-package-conformance.md) (revised baseline: R-SCEN identity/absence reporting; registry, bar, statuses, layers, governance unchanged)
- [42 Revise Conformance Asset Home Relocation](../../prd/42-revise-conformance-asset-home-relocation.md) (still-constraining: the repo-root `conformance/` home stands)
- [40 Revise Playbook Authoring Contract v2](../../prd/40-revise-playbook-authoring-contract-v2.md) and [41 Revise CLI Human Experience and Package Grammar](../../prd/41-revise-cli-human-experience-and-package-grammar.md) (still-constraining: v2 forms and command spellings in any committed step text)

## Stage 1 - Schema Revision

### Tasks

- [ ] t1: Revise the `packagingExtension` schema in `packages/cli/src/conformance/scenario.ts`: keep the definition-level fields (per-stage `evidenceBar`, `transcriptPolicy`, `workspacePolicy`, `fixturePlaybooks`, the precondition template distinguishing probeable from attestation-only preconditions), add required `domain`, delete the top-level `harness` field and `futureHarnesses`, and move `harnessExecution`, per-target `registryTupleIds`, and target-specific precondition probes into a `targets` map keyed by harness id — leaving the `conformance.scenario.v1` lab core and `recordConformanceRunOnRegistryEntry` untouched (PRD 43 R-SCHEMA-1..2).
- [ ] t2: Rename and generalize the `characterization` block to `discoveryKit`, preserving the `resolvesProbe` linkage to register item R-021 verbatim, carried on the plugin definition's Codex target binding (PRD 43 R-DISC-1, schema half).
- [ ] t3: Update `REQUIRED_FIRST_PASS_SCENARIOS` in `packages/cli/src/conformance/scenario.ts` to the domain-qualified ids (`packaging/plugin-marketplace-install`, `packaging/skills-bundle-discovery-invocation`, `packaging/dependency-check-both-directions`, `packaging/uninstall-backup-cleanliness`), keeping the required set exactly the four packaging outcomes bound to Codex targets (PRD 43 R-SCHEMA-3).

### Acceptance criteria

- The schema accepts a domain-qualified, harness-agnostic definition with a `targets` map and rejects a definition carrying top-level `harness` or `futureHarnesses`.
- The `discoveryKit` block validates with `resolvesProbe` intact; no `characterization` spelling survives in the schema or loaders.
- The result-record contract, verdict vocabulary, and the recording seam are byte-unchanged in behavior.

### Dependencies

- PRD 43 accepted; W18 R12 surfaces (v2 contract, `plan`/`preview`/`write` grammar) already landed.

## Stage 2 - Definition Migration and Registry Re-Linkage

### Tasks

- [ ] t4: Author the four `conformance/scenarios/packaging/<outcome>.json` definitions re-expressing the `codex-*` spec content — evidence-bar assertions, transcript/workspace policy, fixture playbook references (unchanged `conformance/fixtures/`), precondition templates — with Codex `targets` bindings, and remove the four `conformance/scenarios/codex-*.json` files in the same change (PRD 43 R-ORG-1, R-ORG-3; inventory entries 4, 13).
- [ ] t5: Make every committed step in the new definitions executable as written against the current CLI: no ship command without its evidence ref, no non-TTY uninstall without `--yes`, no assumed-but-unestablished precondition attestations — the three D-023 defect classes are absent from committed text, with the structural guarantee owned by Phase 2 kit generation and proven by Phase 4's executability check (register item D-023).
- [ ] t6: Update `conformance/tuple-registry.json`: move every `plannedScenarios` value to the domain-qualified ids and re-point the `codex-plugin-native-project` note from the characterization plan to the discovery kit — changing no status, no evidence, and no tuple (PRD 43 R-SCHEMA-3; inventory entry 5).
- [ ] t7: Create the `conformance/results/<harness>/` layout convention as documentation (README) plus the ingest-side path derivation (`<YYYY-MM-DD>-<outcome-slug>-<seq>.json`) — creating no speculative directories, since zero result records exist and structure follows content (PRD 43 R-ORG-2).

### Acceptance criteria

- `conformance/scenarios/packaging/` holds exactly four definitions with domain-qualified ids and no harness token in id or filename; no `codex-*` spec file remains.
- The registry loads green with updated `plannedScenarios` and byte-identical tuple statuses and evidence.
- Claude Code and Pi appear nowhere as covered: their absence from `targets` maps is reported by the registry's existing scenario-absence notes (PRD 37 R-SCEN-2 as re-expressed by PRD 43 R-SCHEMA-2).

### Dependencies

- Stage 1 schema.

## Stage 3 - Checks, Tests, and Routers

### Tasks

- [ ] t8: Retarget `listRequiredFirstPassScenarioErrors` in `packages/cli/src/conformance/meta-verification.ts` to the new ids and `scenarios/<domain>/` paths, and verify — not assume — that the R-TEST-3 asset-detection markers match the family's subtree fragments through the `scenarios/<domain>/` nesting, adding a regression test if the verification exposes a gap (PRD 43 R-SCHEMA-3; inventory entry 7).
- [ ] t9: Migrate the four conformance test suites (`conformance-scenarios`, `conformance-meta-verification`, `conformance-tuple-registry`, `conformance-governance` in `packages/cli/tests/`): fixture scenario ids to the domain-qualified forms, `futureHarnesses` assertions to `targets`-absence assertions, and the `.make-docs/conformance/...` transcript-pointer fixtures to the Phase 2 forms (store lab area or `discarded-with-session`), keeping every `Test layer:` header unchanged (inventory entry 9).
- [ ] t10: Extend [conformance/README.md](../../../conformance/README.md) per PRD 43 R-ORG-3: the Scope paragraph gains the domain axis (a scenario domain groups outcome definitions by product area; neither domain nor scenario ever encodes an execution target — correcting its current "harness belongs in the tuple and the spec filename" clause), and layout, scenario-id, `futureHarnesses`, and transcript-home mentions update to the new model; update the `conformance/AGENTS.md`/`CLAUDE.md` router stubs to match (inventory entry 12).

### Acceptance criteria

- The full conformance suite and `npm run validate:defaults` pass over the reorganized assets; the R-TEST-2 check passes over `scenarios/packaging/` and fails when a required definition is removed.
- `grep` for the four `codex-*` scenario ids and `futureHarnesses` returns no hits in `conformance/`, `packages/cli/src/`, or `packages/cli/tests/` (dated docs excepted per the dated-evidence rule).
- The README Scope paragraph reads correctly for the domain organization and the router stubs route `scenarios/<domain>/`.

### Dependencies

- Stages 1–2.

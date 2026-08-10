---
title: "W18 R13 P1: Asset Reorganization and Spec Migration"
kind: "history"
status: "completed"
date: "2026-07-06"
client: "Claude Code"
model: "Fable 5"
coordinate: "W18 R13 P1"
repo: "make-docs"
branch: "make-docs-v2"
summary: "Landed the definitions-by-domain, evidence-by-target scenario model: the packagingExtension schema revision with domain-qualified ids and per-target bindings, the four harness-agnostic packaging definitions replacing the codex-* specs with D-023's three defect classes absent from committed step text, the discoveryKit rename preserving the R-021 linkage, the re-linked registry and retargeted checks, and the results/<harness>/ evidence convention — closing D-025 on its bar and advancing D-023, D-024, and R-028 in place."
---

# W18 R13 P1: Asset Reorganization and Spec Migration

## Changes

This session implemented Phase 1 of [the W18 R13 backlog](../../../work/2026-07-06-w18-r13-conformance-execution-and-lab-session-redesign/01-asset-reorganization-and-spec-migration.md) (all ten tasks, per [historical closeout](2026-07-06-w18-r13-conformance-execution-and-lab-session-redesign.md) (retired action-PRD: `docs/prd/43-revise-conformance-scenario-model-and-execution-kit.md`) R-ORG-1..3, R-SCHEMA-1..3, and the schema half of R-DISC-1) and ran the phase-closeout documentation passes.

### Implementation

| Surface | Summary |
| --- | --- |
| `packages/cli/src/conformance/scenario.ts` (t1-t3) | The schema revision: scenario ids are domain-qualified outcome names (`<domain>/<outcome>`, the `splitConformanceScenarioId` helper, a required `domain` field that must match the id prefix) and the `.strict()` `packagingExtension` rejects the retired top-level `harness`, `harnessExecution`, `registryTupleIds`, `futureHarnesses`, and `characterization` spellings. Everything that names a target lives in a `targets` map keyed by harness id — each binding carries `registryTupleIds`, `harnessExecution`, concrete `preconditionProbes` validated exhaustive-and-exact against the definition-level precondition template, optional `parameters`, and an optional `discoveryKit` (the renamed characterization preamble, R-021 `resolvesProbe` linkage preserved verbatim). `getScenarioTargetBinding` fails closed on an uncovered target — a reported gap replacing `futureHarnesses` structurally (R-SCHEMA-2). `REQUIRED_FIRST_PASS_SCENARIOS` is re-keyed to the `packaging/*` ids with the new `REQUIRED_FIRST_PASS_TARGET = "codex"`; loaders recurse `scenarios/<domain>/` and reject flat definition files; the blocked-record transcript pointer defaults to `discarded-with-session` (D-024-aligned). The `conformance.scenario.v1`/`conformance.result.v1` lab core, verdicts, evidence bar, and `recordConformanceRunOnRegistryEntry` semantics are unchanged. |
| `conformance/scenarios/packaging/` (t4-t5) | Four new harness-agnostic definitions (`plugin-marketplace-install`, `skills-bundle-discovery-invocation`, `dependency-check-both-directions`, `uninstall-backup-cleanliness`; `scenarioVersion` 2.0.0) re-expressing the `codex-*` spec content with Codex `targets` bindings; the four `codex-*` files are deleted in the same change. All three D-023 defect classes are absent from the committed step text — ship steps carry `--support-evidence-ref conformance/tuple-registry.json#<tuple-id>`, non-TTY `setup backup`/`setup remove --backup` steps carry `--yes`, and a workspace-setup step writes the `packaging.preconditions` attestations into the fixture workspace's `.make-docs/config.yaml` — each fix attributed to D-023 in the step notes. Claude Code and Pi appear nowhere as covered: their absence from `targets` is a reported gap. |
| `conformance/tuple-registry.json` and `registry.ts` (t6) | Every `plannedScenarios` value moved to the domain-qualified ids (the loader regex now requires them), the `codex-plugin-native-project` note re-points from the characterization plan to the discovery kit, and Pi scenario absence is re-expressed as uncovered-target reporting — no status, no evidence, and no tuple changed. |
| `governance.ts` (t7) | The `conformance/results/<harness>/<YYYY-MM-DD>-<outcome-slug>-<seq>.json` convention as `conformanceResultRecordRelativePath` (sequence zero-padded to three digits, an implementer decision) plus a recursive claim-use record walk so a nested record can never sit outside the claim-use gates; no speculative directories created — zero result records exist. |
| `meta-verification.ts` and test suites (t8-t9) | R-TEST-2 retargeted to the domain-qualified ids and `scenarios/<domain>/` paths, now requiring a Codex binding per required definition with concrete probe commands; the R-TEST-3 detectors verified — not assumed — to survive the nesting, with a regression test. The four conformance suites migrated fixture ids to the domain-qualified forms, `futureHarnesses` assertions to `targets`-absence assertions, and transcript-pointer fixtures to the lab-session forms, keeping every `Test layer:` header unchanged. |
| `conformance/README.md` and router stubs (t10) | The Scope paragraph extended with the definitions-by-domain, evidence-by-target rule (correcting the old "harness belongs in the tuple and the spec filename" clause); layout, scenario-id, `futureHarnesses`, and transcript-home mentions updated; `conformance/AGENTS.md`/`CLAUDE.md` route `scenarios/<domain>/`. |
| Recorded deviation | One fixture prose line in `conformance/fixtures/agent/conformance-dependency-probe.playbook.md` updated from the old scenario id to `packaging/dependency-check-both-directions`; semantics untouched. |

### Documentation passes

- Developer pass (`update-existing`): [the conformance-lab guide](../../library/developer/conformance-lab-scenario-and-result-contracts.md) is rewritten to the P1 scenario model as current behavior — domain-qualified identity and loader recursion, the `targets` map with uncovered-target reported-gap semantics, the `discoveryKit` with its R-021 linkage, the per-binding simulation posture and precondition probes, the `results/<harness>/` convention with the ingest-side path derivation, the D-023 executable-as-written step fixes (with the executable-by-construction guarantee explicitly owned by Phases 2/4), the lab-session raw-evidence posture replacing the repo-local `.make-docs/conformance/` default, and a new Future Coverage section deferring the kit/instruments/ingestion/operator-mode documentation to Phases 2-4 and the first recorded evidence. [The packaging guide](../../library/developer/playbooks-development-packaging-and-harness-adapters.md) had two stale references updated (the promotion-path sentence and the R-PROV-2 cleanliness scenario path/id); its Future Coverage bullet on conformance evidence remains accurate and unchanged. The governance claim-surface `support-claim-state` markers and R-GOV-1 core phrase are untouched on both guides.
- User pass (`update-existing`, minimal): [the user packaging guide](../../library/user/playbooks-packaging-shareable-agent-workflows.md) named no scenario ids; its "four Codex-first scenarios" sentence was updated to the written-once-per-outcome model with Codex as the first bound target and uncovered harnesses reported as gaps. The governed-wording paragraph, the marker, and both Future Coverage bullets are unchanged — support posture is identical (0/20, nothing run, everything provisional).
- PRD pass (`risk-register-update`): [D-025](../../../prd/03-open-questions-and-risk-register.md) closed — every clause of its literal close bar landed in this one reconciled change (definitions, schema rejection of the retired spellings, and all five named id consumers moved together), with a Resolution paragraph recording the completion greps' zero live-usage hits. D-023 advanced in place: the committed text is executable as written, but the close bar is executable-by-construction (P2 kit, P4 proof), so it stays open. D-024 advanced in place: the blocked-record default, test fixtures, README, and guides moved off the repo-local home; the `.gitignore` entry, the `registry.ts` commentary, and the PRD 20/PRD 37 clause revisions remain for the later phases, so it stays open. R-028 advanced in place with the inventory entries P1 covers (4, 5, 6 schema/ids, 7 ids/paths, 9, 12, 13) and the grep posture recorded. No new PRD docs, no renumbering, no index change — the work implemented accepted PRD 43 requirements (`none` on `prd-change-doc`/`index-only`, per the coverage-pass verdict rule).
- Testing/UAT pass (`none`): the phase is a model-and-asset reorganization fully covered by the migrated automated suites and the enforcing meta-verification checks; the operational manual-test apparatus remains the committed scenario definitions themselves, unrun by design until a maintainer operates a real Codex install (unchanged from the W18 R9 P4 posture).

### Validation

| Check | Result |
| --- | --- |
| `npm test -w packages/cli` | Green — 1019 tests across 59 files (+12 over W18 R9 P4). |
| `npm run build -w packages/cli` | Green. |
| `npm run validate:defaults` | Green (33/33). |
| `npm run smoke:pack` | Green, including the tarball conformance-asset sweep over the nested layout. |
| `python3 .make-docs/scripts/check_path_hygiene.py` | Clean. |
| Changed-file relative-link check | All links resolve. |
| `git diff --check` | Clean. |
| Completion greps (four `codex-*` ids, `futureHarnesses`) | Zero live-usage hits in `conformance/`, `packages/cli/src/`, `packages/cli/tests/`, and the guides; only schema-rejection documentation and rejection tests spell the retired forms. |

## Documentation

### Project

| Path | Description |
| --- | --- |
| [docs/prd/03-open-questions-and-risk-register.md](../../../prd/03-open-questions-and-risk-register.md) | D-025 closed on its literal bar with a Resolution record; D-023, D-024, and R-028 advanced in place with the P1 state and the remaining Phase 2-4 obligations named. |
| [docs/work/2026-07-06-w18-r13-conformance-execution-and-lab-session-redesign/01-asset-reorganization-and-spec-migration.md](../../../work/2026-07-06-w18-r13-conformance-execution-and-lab-session-redesign/01-asset-reorganization-and-spec-migration.md) | All ten phase tasks checked complete. |
| [conformance/README.md](../../../../conformance/README.md) | Scope paragraph extended with the domain axis; scenario, result, and current-state sections moved to the definitions-by-domain, evidence-by-target model. |

### Developer

| Path | Description |
| --- | --- |
| [docs/assets/library/developer/conformance-lab-scenario-and-result-contracts.md](../../library/developer/conformance-lab-scenario-and-result-contracts.md) | Scenario sections rewritten to the P1 model: domain-qualified identity, `targets` bindings and reported gaps, `discoveryKit`, results layout, lab-session evidence posture, and a new Future Coverage section for the Phase 2-4 kit machinery. |
| [docs/assets/library/developer/playbooks-development-packaging-and-harness-adapters.md](../../library/developer/playbooks-development-packaging-and-harness-adapters.md) | Two stale scenario references updated to the domain-qualified definitions. |

### User

| Path | Description |
| --- | --- |
| [docs/assets/library/user/playbooks-packaging-shareable-agent-workflows.md](../../library/user/playbooks-packaging-shareable-agent-workflows.md) | The support section's scenario sentence updated to the harness-agnostic model with uncovered harnesses reported as gaps; support posture and governed wording unchanged. |

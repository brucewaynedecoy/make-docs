---
title: "W18 R9 P3: Test-Layer Separation and Meta-Verification"
kind: "history"
status: "completed"
date: "2026-07-04"
client: "Claude Code"
model: "Fable 5"
coordinate: "W18 R9 P3"
repo: "make-docs"
branch: "make-docs-v2"
summary: "Organized coverage into the three named test layers with machine-checked header markers, landed the R-TEST-1..3 meta-verification checks (run qualification with receipts, first-pass runnability with honest-blocked, and the three-surface conformance-asset exclusion sweep), and ran the phase-closeout guide, user-guide, and PRD coverage passes."
---

# W18 R9 P3: Test-Layer Separation and Meta-Verification

## Changes

This session implemented Phase 3 of [the W18 R9 backlog](../../../work/2026-07-01-w18-r9-playbook-and-package-conformance/03-test-layer-separation-and-meta-verification.md) (all five tasks, per [PRD 37](../../../prd/37-enhance-playbook-and-package-conformance.md) R-LAYER-1..2 and R-TEST-1..3) and ran the closeout documentation passes.

### Implementation

| Surface | Summary |
| --- | --- |
| `packages/cli/src/conformance/layers.ts` (new) | The three-layer vocabulary as data (R-LAYER-1): unit (operation core, parser, validator as pure functions without a CLI), integration (CLI and MCP surfaces over the core including manifest and exposure plumbing), and conformance (real-harness user outcome per tuple through the maintainer lab); `REPOSITORY_TEST_LAYERS` restricts repository suites to unit and integration, `TEST_LAYER_BOUNDARY_RULE` carries the R-LAYER-2 boundary verbatim, and `listDeclaredTestLayers` parses the `Test layer:` header marker. |
| Layer markers where the tests live (t1/t2) | All eight `playbook-packaging*.test.ts` suites declare `integration` (a recorded judgment call: manifest/exposure plumbing per the R-LAYER-1 definition, not per-file splits); the conformance suites declare `unit`; the conformance layer is named in [the conformance assets README](../../../../conformance/README.md) where its assets live. Each marker records the R-LAYER-2 boundary verbatim — internal tests passing is never evidence that a harness recognizes or can use the output — extending the W18 R8 P5 header precedent, and the rule is machine-enforced: no repository `*.test.ts` may claim the conformance layer, and `listCrossLayerCitationErrors` verifies every internal-test evidence ref on the registry cites an existing suite declaring exactly one repository layer. |
| `packages/cli/src/conformance/meta-verification.ts` (new) | R-TEST-1 `listConformanceValidatedRunQualificationErrors`: no `conformance-validated` without a D4-bar-qualifying run, drift flagged in both directions, and receipts — every recorded run's `recordRef` must resolve to a committed result record that validates and projects back byte-equal. R-TEST-2 `listRequiredFirstPassScenarioErrors`: all four Codex-first ids authored, bar-eligible, bidirectionally linked, fixtures present, probeable harness-cli preconditions; the dynamic leg is tested — a failing executor resolves not-runnable producing a valid `blocked` record that advances nothing, and a succeeding executor still requires operator attestation for network and model routing. R-TEST-3 `listConformanceAssetExclusionViolations`: path, basename, and schema-id content markers, relocation-proof. |
| R-TEST-3 surfaces (t5) | The exclusion check covers `packages/docs/template/` and `packages/cli/template/` in the standard suite, a new describe in `consistency.test.ts` runs it behind `validate:defaults`, and `assertNoConformanceAssetsInTarball` in `scripts/smoke-pack.mjs` sweeps the real unpacked npm tarball (dist/ code allowed, assets excluded) — all three surfaces state a green run is an exclusion fact, never a support claim. |
| Where the checks run | New ENFORCING `packages/cli/tests/conformance-meta-verification.test.ts` (18 tests) in the standard suite; a new test file must declare its layer or the suite fails — the maintainer rail. |

### Documentation passes

- Developer pass (`update-existing`): the conformance-lab guide gained a Test Layers and Meta-Verification section (the three-layer table and data module, the marker mechanics and maintainer rail, the integration-classification judgment call, the cross-layer citation rule, the three meta-verification checks with their receipts and dynamic legs, and the three-surface exclusion table), with the overview, registry drift-proofing, boundary, and `REQUIRED_FIRST_PASS_SCENARIOS` passages updated from "Phase 3 will" to "since Phase 3 does". The packaging guide's D10 section records that every packaging suite header now also carries a machine-checked `Test layer: integration` marker and what that classification means (never recognition evidence). Neither guide's Future Coverage changed: the packaging guide's bullet stays blocked on recorded real-harness evidence, which this phase deliberately does not produce.
- User pass (`none`): this phase is maintainer evidence machinery with no user-visible behavior; the user packaging guide's support-status paragraph (zero validated tuples, scenarios committed but blocked) remains accurate as written, so no user guide change was warranted.
- PRD pass (`risk-register-update`): R-022 advanced in place — the R-TEST-2 runnability check its close bar names now exists and enforces runnable-or-blocked structurally and dynamically; the close bar remains open on the actual first-pass runs. R-021 advanced in place — the R-TEST-1 check with receipts and the layer-enforced never-cite-internal-tests rule are now enforcing checks; its close bar is likewise unchanged. No new PRD docs, no renumbering, no other register items affected (test-layer separation implements PRD 37 requirements directly and raised no new gap, drift, question, or decision).

### Validation

| Check | Result |
| --- | --- |
| `npm test -w packages/cli` | Green — 987 tests across 58 files (+19 for the meta-verification suite and the consistency R-TEST-3 describe). |
| `npm run build -w packages/cli` | Green. |
| `npm run validate:defaults` | Green (33/33). |
| `npm run smoke:pack` | Green, including the new tarball conformance-asset sweep. |
| `python3 .make-docs/scripts/check_path_hygiene.py` | Clean. |
| Changed-file relative-link check | All links resolve. |
| `git diff --check` | Clean. |

## Documentation

### Project

| Path | Description |
| --- | --- |
| [docs/prd/03-open-questions-and-risk-register.md](../../../prd/03-open-questions-and-risk-register.md) | R-022 advanced in place with the landed R-TEST-2 runnability check and layer enforcement; R-021 advanced in place with the R-TEST-1 receipts check and the machine-enforced never-cite rule; both close bars unchanged. |
| [docs/work/2026-07-01-w18-r9-playbook-and-package-conformance/03-test-layer-separation-and-meta-verification.md](../../../work/2026-07-01-w18-r9-playbook-and-package-conformance/03-test-layer-separation-and-meta-verification.md) | All five phase tasks checked complete. |
| [docs/assets/conformance/README.md](../../../../conformance/README.md) | Boundary paragraph names the three R-TEST-3 enforcement surfaces, and a new test-layer paragraph names this directory as the conformance layer's home with the marker mechanics for the two repository layers. |

### Developer

| Path | Description |
| --- | --- |
| [docs/assets/library/developer/conformance-lab-scenario-and-result-contracts.md](../../library/developer/conformance-lab-scenario-and-result-contracts.md) | New Test Layers and Meta-Verification section: the three-layer vocabulary and marker mechanics with the new-file maintainer rail, the cross-layer citation rule, the R-TEST-1..3 checks with receipts and dynamic legs, and the three-surface exclusion enforcement. |
| [docs/assets/library/developer/playbooks-development-packaging-and-harness-adapters.md](../../library/developer/playbooks-development-packaging-and-harness-adapters.md) | D10 section records the machine-checked `Test layer: integration` marker now carried by every packaging suite header and what the classification means. |

### User

None this session.

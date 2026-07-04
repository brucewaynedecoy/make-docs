---
title: "37 Enhance Playbook and Package Conformance"
kind: "prd"
status: "active"
coordinate: "W18 R9"
source:
  type: "design"
  path: "docs/designs/2026-07-01-playbook-and-package-conformance.md"
---

# 37 Enhance Playbook and Package Conformance

## Purpose

Extend the maintainer conformance lab established by [20-revise-agent-harness-model-conformance-lab.md](20-revise-agent-harness-model-conformance-lab.md) to the Playbook packaging domain so generated Playbook distributables earn evidence-backed support claims. The current tests assert internal file writing and symlink exposure, which can pass while a real harness fails to recognize or use the output — the exact gap that let a generated Codex package look correct while not being recognized by Codex. This change binds every support claim for a generated output to an expanded tuple, records tuple statuses in a queryable registry, defines the install-discover-invoke-uninstall evidence bar, names the required Codex-first first-pass scenarios, separates three test layers, and governs claim wording, turning the provisional support claims left open by the contract-and-model, run-playbook, and packaging lineages into promotable, evidence-bound claims.

## Change Type

Enhancement. This PRD extends the existing conformance-lab capability from PRD 20 into the packaging domain without retiring any established requirement: the lab's maintainer-only nature, model-agnostic scenarios, verdicts, safety modes, evidence classes, storage boundaries, run-record fields, and one-run-minimum threshold are preserved unchanged, and the expanded support tuple, the tuple registry with three statuses, the evidence bar, the required first-pass scenarios, the three test layers, and the support-claim governance are additive extensions of them. It does not redefine the lab's core, the packaging compiler and harness adapters ([36-revise-playbook-packaging-compiler-and-harness-adapters.md](36-revise-playbook-packaging-compiler-and-harness-adapters.md)), the Playbook model ([34-revise-playbook-contract-and-model.md](34-revise-playbook-contract-and-model.md)), the run-state machine ([35-revise-run-playbook-state-machine.md](35-revise-run-playbook-state-machine.md)), or the non-packaging scenario families (install, audit, backup, skills), which remain governed by their owning docs and designs.

Route: `change-plan`

Coordinate: `W18 R9`

## Capability Addition or Enhancement

The effective requirement set carries the design's requirement IDs so traceability holds; [../designs/2026-07-01-playbook-and-package-conformance.md](../designs/2026-07-01-playbook-and-package-conformance.md) is the normative statement of each.

### Scope, Boundaries, and Preserved Decisions (R-SCOPE, R-KEEP)

- R-SCOPE-1 (MUST NOT): this change owns exactly the support tuple for generated outputs, the tuple registry and its statuses, the evidence bar, the required first-pass scenarios, the test-layer separation, and support-claim governance for packaging. The conformance lab's core — verdicts, safety modes, evidence classes, storage boundaries, run-record fields, and the model-agnostic scenario protocol — is owned by PRD 20 and its design and is consumed and extended, never redefined; the packaging compiler, harness adapters, and capability model are owned by the W18 R8 lineage in PRD 36; the Playbook model and the run-state machine are owned by the W18 R6 and W18 R7 lineages in PRD 34 and PRD 35; and non-packaging conformance scenario families remain owned by the lab design.
- R-KEEP-1 (MUST): the lab decisions are preserved unchanged — the lab is maintainer-only and is not shipped in installs, templates, the packaged copy, npm tarballs, or future packages; scenarios are model-agnostic with model, provider, and runtime captured as run metadata, not embedded in scenario logic; the conformance verdicts are `pass`, `pass-with-caveats`, `inconsistent`, `unsupported`, and `blocked`, with a scenario that cannot run for a missing precondition reporting `blocked` rather than inventing evidence; each scenario declares a safety mode and the lab never runs destructive scenarios against a maintainer's working tree; there are two evidence classes, compact normalized records suitable for source control and raw transcripts or logs stored locally and promoted only when a redacted bundle materially supports a disputed or stronger claim; and the lab consumes existing validation without replacing it — a green validation run is not a public support claim.

### The Support Tuple (R-TUPLE)

- R-TUPLE-1 (MUST): a support claim for a generated output is bound to the exact tuple of scenario, harness, surface, scope, output kind, generated-output kind, model or provider, and runtime; this extends the lab's scenario-harness-model tuple with the surface, scope, output kind, and generated-output kind introduced by packaging, and no claim may be broader than the evidence for its tuple.

### The Tuple Registry (R-REG)

- R-REG-1 (MUST): the set of tuples and their statuses lives in a queryable data file, not in prose, under `docs/assets/conformance/`, so that support status is queryable and cannot drift from documentation.
- R-REG-2 (MUST): each tuple carries one of three statuses, and a status transition requires the corresponding evidence — `provisional` (no conformance evidence yet; the output may be generated but its recognition and usability are unverified), `implementation-validated` (internal unit and integration tests prove the generated files and structure, but no real-harness evidence exists), and `conformance-validated` (a real-harness scenario has met the R-BAR-1 evidence bar).
- R-REG-3 (MUST): tuple status is derived from run verdicts — a tuple MAY move to `conformance-validated` only on a `pass`, or a `pass-with-caveats` whose caveats are surfaced, that meets the R-BAR-1 bar, and a verdict of `inconsistent`, `unsupported`, or `blocked` MUST NOT advance a tuple to `conformance-validated`.

### The Evidence Bar (R-BAR)

- R-BAR-1 (MUST): to move a tuple to `conformance-validated`, a scenario installs the generated distributable into the real or a faithfully simulated harness, asserts discovery by confirming the output appears in the harness's listing, asserts invocation by confirming a bundled skill can be invoked or the workflow can be driven, and asserts clean uninstall by confirming managed outputs are removed without orphaning managed directories or deleting user-authored files — the bar is install, discover, invoke, and uninstall.
- R-BAR-2 (MUST): `implementation-validated` requires only internal file and structure tests and no harness, and a tuple MUST NOT skip from `provisional` to `conformance-validated` without meeting the R-BAR-1 bar.

### Required First-Pass Scenarios (R-SCEN)

- R-SCEN-1 (MUST): the first conformance pass proves the outcomes the current tests do not, using the current product harnesses, Codex first — a generated skills bundle appears as a skill in the target and can be invoked; a generated plugin appears through a marketplace, installs, exposes its bundled skills, and is usable in a new thread; generated dependency checks surface missing tools and pass when the dependencies are present; and uninstall and backup remove managed generated outputs without orphaning empty managed directories or deleting user-authored files.
- R-SCEN-2 (MUST): Pi and additional harnesses are future scenarios, run when those adapters and harnesses become supported; they are not required for the first pass, and their absence MUST be reported rather than implied as covered.

#### Change Notes

- Superseded by [40-revise-playbook-authoring-contract-v2.md](40-revise-playbook-authoring-contract-v2.md) and [41-revise-cli-human-experience-and-package-grammar.md](41-revise-cli-human-experience-and-package-grammar.md). The W18 R12 remediation round lands before this conformance wave executes (register item R-026): scenario expectations for generated dependency checks bind to the v2 `probe`-based checks rather than `Source`-derived probes, scenario scripts use the `plan`/`preview`/`write` (and `ship`) command spellings with `--write` retired, and any scenario transcript that consumes CLI output pins `--json` so the render layer never enters evidence. The tuple registry, evidence bar, test layers, and governance rules here are unchanged. The reconciliation landed at W18 R12 P4 on 2026-07-03: the round is fully implemented and verified, the [W18 R9 backlog](../work/2026-07-01-w18-r9-playbook-and-package-conformance/00-index.md) now records the corrected baseline explicitly (its index's W18 R12 reconciliation note, PRD 40/41 added as still-constraining baselines, the Phase 2 dependency-check scenario bound to probe-based checks, and the `--json`-pinned transcript rule in its scenario acceptance criteria), and R-026 is closed — W18 R9 executes against these reconciled surfaces.

### Test Layers (R-LAYER)

- R-LAYER-1 (MUST): coverage is organized in three named layers so that one layer's passing never masquerades as another's — unit tests cover the operation core, parser, and validator as pure functions without a CLI; integration tests cover the CLI and MCP surfaces over the core, including the manifest and exposure plumbing; and conformance tests cover the real-harness user outcome per tuple through the maintainer lab.
- R-LAYER-2 (MUST): unit and integration tests are automated repository tests and conformance tests are the maintainer lab; internal tests passing MUST NOT be read as evidence that a harness recognizes or can use the output — the direct corrective for the failure mode that let the descriptor output look correct while not being recognized.

### Support-Claim Governance (R-GOV)

- R-GOV-1 (MUST): a public claim may state only what a `conformance-validated` tuple proves; until a tuple is conformance-validated, wording MUST distinguish a Make Docs generated output from a harness-recognized plugin, and a `pass-with-caveats` result MUST surface its caveats in any claim.
- R-GOV-2 (MUST): one passing conformance run per tuple is the minimum threshold for nominal support, preserving the lab's threshold, and repeated runs with maintainer review are the stronger threshold for a more confident claim.

### Verification and Meta-Verification (R-TEST)

- R-TEST-1 (MUST): a check asserts that no tuple is marked `conformance-validated` without a recorded run that meets the R-BAR-1 bar.
- R-TEST-2 (MUST): a check asserts that the required first-pass scenarios exist and are runnable, and that unavailable ones report `blocked` rather than silently passing.
- R-TEST-3 (MUST): a packaging or exclusion check asserts that conformance assets are absent from the shipped template, the packaged copy, and npm tarballs.

The design's D8 section fixes tuple-bound support claims, the tuple registry with its three statuses, the install-discover-invoke-uninstall evidence bar, the three test layers with the internal-tests-are-not-evidence rule, and the maintainer-only not-shipped boundary as non-substitutable, while leaving the concrete registry file format (provided it is queryable and carries each tuple and status), the mechanics of faithfully simulating a harness, run-record fields beyond the lab's required set, and the criteria and process for promoting a redacted raw evidence bundle to the implementer.

Code anchors:

- `docs/assets/conformance/`
- `packages/cli/src/operations/plugin.ts`
- `packages/cli/src/operations/playbook.ts`
- `scripts/smoke-pack.mjs`

## Affected Baseline Docs

- [20-revise-agent-harness-model-conformance-lab.md](20-revise-agent-harness-model-conformance-lab.md): the primary baseline being enhanced — its lab is extended into the packaging domain with the expanded tuple, the tuple registry, the evidence bar, the first-pass scenarios, and the test-layer separation, while its lab core is preserved unchanged per R-KEEP-1.
- [33-enhance-playbook-packaging-and-harness-adapter-registry.md](33-enhance-playbook-packaging-and-harness-adapter-registry.md): its provisional support claims for generated plugin and skills-bundle outputs become promotable through the tuple registry and evidence bar defined here.
- [36-revise-playbook-packaging-compiler-and-harness-adapters.md](36-revise-playbook-packaging-compiler-and-harness-adapters.md): the downstream conformance dependency it records as planned W18 R9 lands here, including ownership of its R-PROV-2 backup/uninstall cleanliness scenario and the R-TEST-5 evidence boundary; its distributables are what conformance verifies.
- Consumed unchanged, no annotation required: [34-revise-playbook-contract-and-model.md](34-revise-playbook-contract-and-model.md) and [35-revise-run-playbook-state-machine.md](35-revise-run-playbook-state-machine.md) already record conformance as a gated downstream owner; [30-revise-harness-plugin-substrate-workflow-bundles.md](30-revise-harness-plugin-substrate-workflow-bundles.md) and [31-revise-coverage-pass-extensions-adversarial-review.md](31-revise-coverage-pass-extensions-adversarial-review.md) route support-claim gating through PRD 20's gating text, which is annotated once at its owning heading; [19-revise-template-package-dogfood-source-of-truth-contract.md](19-revise-template-package-dogfood-source-of-truth-contract.md) keeps its upstream-first rule — the maintainer-only conformance location is a deliberate, recorded exception, not a change to the rule; [10-packaging-validation-and-release-reference.md](10-packaging-validation-and-release-reference.md) and [25-revise-cli-separation-and-mcp-boundary.md](25-revise-cli-separation-and-mcp-boundary.md) constrain implementation generically without any requirement text extended or superseded.
- [00-index.md](00-index.md) and [03-open-questions-and-risk-register.md](03-open-questions-and-risk-register.md) carry the catalog and register updates.

## Contracts and Data

The tuple registry is a queryable data file under `docs/assets/conformance/` recording, per tuple, the eight tuple fields (scenario, harness, surface, scope, output kind, generated-output kind, model or provider, runtime) and one of the three statuses, with status transitions derived from recorded run verdicts per R-REG-3; the concrete file format is implementer-chosen provided it stays queryable and carries every tuple and status. Scenario specs and compact normalized result records live beside it under `docs/assets/conformance/` per PRD 20's lab scope, reusing the lab's result contract (harness, model, provider or routing layer, model version, make-docs version, runtime distribution, scenario id and version, run date, produced files, diffs, exit status, transcript pointer, normalized verdict, reason, caveats, reviewer status) with any additional fields left to the implementer per D8. Raw transcripts and provider logs default to `.make-docs/conformance/` or `.make-docs/runs/conformance/` and are not committed unless deliberately redacted and promoted. Conformance assets are maintainer-only in-repo project content, edited in place, and deliberately not authored upstream in `packages/docs/template/` — a stated exception to the upstream-first rule, enforced outward by the R-TEST-3 exclusion check; the lab and check code are ordinary source code under the CLI package.

Code anchors:

- `docs/assets/conformance/`
- `.make-docs/conformance/`
- `packages/cli/src/operations/playbook.ts`

## Integration Impact

This change is sequenced last among the core Playbook-architecture designs: it verifies the W18 R8 distributables from [36-revise-playbook-packaging-compiler-and-harness-adapters.md](36-revise-playbook-packaging-compiler-and-harness-adapters.md) as the artifacts under test, executes workflow-driving scenarios via the W18 R7 runner from [35-revise-run-playbook-state-machine.md](35-revise-run-playbook-state-machine.md), and consumes the W18 R6 Playbook model from [34-revise-playbook-contract-and-model.md](34-revise-playbook-contract-and-model.md) unchanged. [20-revise-agent-harness-model-conformance-lab.md](20-revise-agent-harness-model-conformance-lab.md) remains the lab core and support-claim evidence contract; this PRD supplies the packaging conformance that lab deliberately deferred until the shared-agentics, plugin-substrate, and Run Playbook decisions landed. The provisional support claims carried by [33-enhance-playbook-packaging-and-harness-adapter-registry.md](33-enhance-playbook-packaging-and-harness-adapter-registry.md) and the provisional adapter support statuses required by PRD 36 R-ADAPT-1 and R-PROV-3 gain their promotion path here: a claim advances only when its exact tuple reaches `conformance-validated`. The first pass is Codex-focused because Codex and Claude Code are the current product harnesses; Pi and later adapters gain conformance evidence when they become supported, and until then their tuples report honestly rather than implying coverage. The R-TEST-3 exclusion check lands in the packaging validation surface governed by [10-packaging-validation-and-release-reference.md](10-packaging-validation-and-release-reference.md) and respects the template/package/dogfood source-of-truth order in [19-revise-template-package-dogfood-source-of-truth-contract.md](19-revise-template-package-dogfood-source-of-truth-contract.md).

Code anchors:

- `packages/cli/src/operations/plugin.ts`
- `scripts/smoke-pack.mjs`

## Required Baseline Annotations

- [20-revise-agent-harness-model-conformance-lab.md](20-revise-agent-harness-model-conformance-lab.md): `Enhanced by` under Effective Requirement, scoped to the packaging-domain extension — expanded tuple, tuple registry under `docs/assets/conformance/`, evidence bar, and first-pass scenarios — with the lab core explicitly unchanged.
- [33-enhance-playbook-packaging-and-harness-adapter-registry.md](33-enhance-playbook-packaging-and-harness-adapter-registry.md): `Enhanced by` under Integration Impact, scoped to the promotion path for its provisional generated-output support claims through the tuple registry.
- [36-revise-playbook-packaging-compiler-and-harness-adapters.md](36-revise-playbook-packaging-compiler-and-harness-adapters.md): `Enhanced by` under Impacted Docs and Dependencies, scoped to the landed W18 R9 downstream dependency including the R-PROV-2 cleanliness scenario and the R-TEST-5 evidence boundary.
- [00-index.md](00-index.md): add PRD 37 to the reading order, document map, source anchors, audience paths, and intended follow-on.
- [03-open-questions-and-risk-register.md](03-open-questions-and-risk-register.md): advance the existing R-021 decision in place with the landed tuple registry, statuses, and evidence bar, and add a new rebuild risk for first-pass conformance scenario availability and blocked-evidence honesty.

## Source Anchors

- [../designs/2026-07-01-playbook-and-package-conformance.md](../designs/2026-07-01-playbook-and-package-conformance.md)
- [../designs/2026-06-19-agent-harness-and-model-conformance-lab.md](../designs/2026-06-19-agent-harness-and-model-conformance-lab.md)
- [../designs/2026-07-01-playbook-packaging-compiler-and-harness-adapters.md](../designs/2026-07-01-playbook-packaging-compiler-and-harness-adapters.md)
- [../designs/2026-06-30-playbook-contract-and-model.md](../designs/2026-06-30-playbook-contract-and-model.md)
- [../designs/2026-07-01-run-playbook-state-machine.md](../designs/2026-07-01-run-playbook-state-machine.md)
- [../assets/artifacts/playbook-architecture.md](../assets/artifacts/playbook-architecture.md)
- [../plans/2026-07-01-w18-r9-playbook-and-package-conformance/00-overview.md](../plans/2026-07-01-w18-r9-playbook-and-package-conformance/00-overview.md)
- [../work/2026-07-01-w18-r9-playbook-and-package-conformance/00-index.md](../work/2026-07-01-w18-r9-playbook-and-package-conformance/00-index.md)
- [20 Revise Agent Harness Model Conformance Lab](20-revise-agent-harness-model-conformance-lab.md)
- [33 Enhance Playbook Packaging and Harness Adapter Registry](33-enhance-playbook-packaging-and-harness-adapter-registry.md)
- [34 Revise Playbook Contract and Model](34-revise-playbook-contract-and-model.md)
- [35 Revise Run Playbook State Machine](35-revise-run-playbook-state-machine.md)
- [36 Revise Playbook Packaging Compiler and Harness Adapters](36-revise-playbook-packaging-compiler-and-harness-adapters.md)
- [19 Revise Template Package Dogfood Source of Truth Contract](19-revise-template-package-dogfood-source-of-truth-contract.md)
- [10 Packaging Validation and Release Reference](10-packaging-validation-and-release-reference.md)
- `packages/cli/src/operations/plugin.ts`
- `packages/cli/src/operations/playbook.ts`
- `scripts/smoke-pack.mjs`

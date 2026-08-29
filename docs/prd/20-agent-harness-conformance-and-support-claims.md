# 20 Agent Harness Conformance and Support Claims

## Purpose

This document defines the current product contract for agent-harness conformance evidence, lab boundaries, and support claims. Normative requirements are stated in the sections below; Requirement History is provenance only.
## Scope

This authority owns agent-harness conformance evidence, lab boundaries, and support claims. Related PRDs own adjacent capabilities and are linked where a cross-boundary contract is required.
## Component and Capability Map

The requirements below define the owned components, behaviors, boundaries, and evidence expectations for this capability.
## Requirements

### R-CONF-TEST Proportionate Testing Support Claim

1. A supported agent must select only the testing types that can change the current decision.
2. The agent must state the reason, maturity, scope, executor, gate effect, effort budget, stop condition, evidence, and rerun trigger in plain language when the decision record applies.
3. Support evidence must include both insufficient-testing and excessive-testing failure cases.
4. A passing happy path is not sufficient when the agent invents a gate, repeats unchanged proof, asks a person to duplicate automated assertions, or applies production-grade work without current authority.
5. Guided Progress Review and Unassisted Goal Testing must preserve their different executors, purposes, and default gate effects.

- Result records must capture scenario id and version, harness, installed-product surface, scope, model name, provider or routing layer when known, model version or immutable identifier when available, Make Docs version, runtime distribution, run date, produced files, relevant diffs, exit status, transcript/log pointer, normalized verdict, reason, caveats, and reviewer status. Scenario-specific output metadata may narrow a claim, but retired Playbook, plugin, workflow-bundle, package-compiler, or generated-output dimensions are not required current tuple dimensions.
- Verdicts are `pass`, `pass-with-caveats`, `inconsistent`, `unsupported`, and `blocked`.
- A result applies only to the exact R-TUPLE dimensions and applicable version, distribution, Skill, resource, and execution provenance it records.

Harness and adapter boundary:

- Current executable coverage is Codex and Claude Code because those are the current product harnesses.
- OpenCode, Goose, Pi, and future agentic IDEs are lab adapter targets, not current make-docs install harnesses; changing the executable harness model requires authoritative maintenance of this PRD and the applicable installation and conformance owners.
- Future adapters must exercise the same scenario protocol across default hosted models, alternate hosted models, and open-weight provider-routed models.

Support-claim gating:

- One passing run for an exact R-TUPLE tuple is the minimum threshold for nominal public support for that tuple.
- Repeated reviewed runs are required before stronger commendation language.
- A pass for one model in a harness does not imply support for every model routed through that harness.
- A pass for one scenario does not imply blanket harness support.
- Skill, CLI, MCP, system-resource, installed-product, unattended, adversarial-review, optional-agentics, or model/provider support claims must cite evidence for the exact scenario, harness, surface, scope, model/provider, and runtime tuple claimed. [14-lifecycle-workflow-and-coverage-passes.md](./14-lifecycle-workflow-and-coverage-passes.md) keeps adversarial-review wording provisional until that exact supported surface has implementation validation or conformance records.
- Configuration and `harnessCapabilities` records may guide a session, but they are not public support evidence by themselves. A declaration of Skill exposure, CLI availability, MCP availability, or optional agentics never proves that a harness discovers or can use the surface.
- Plugin, workflow-bundle, Playbook, Protocol, packaging-compiler, and generated package-output support are outside the current Make Docs product boundary and must not appear as provisional or validated current support tuples.

Validation relationship:

- The lab may call existing validation commands as scenario steps.
- A green lab run does not replace package validation.
- A green package validation run is not a public harness/model support claim without conformance evidence.
- [25-typescript-runtime-cli-mcp-operation-boundaries.md](./25-typescript-runtime-cli-mcp-operation-boundaries.md) extends support-claim gating to CLI/MCP surfaces: a claim that an agent or harness can use MCP-backed make-docs behavior must have scenario evidence that the MCP tool delegates to the same CLI/shared-core operation contract and reports runtime/distribution identity.
## Lab and Support Governance

### Lab Boundary and Verdict Contract

The conformance lab evaluates explicit harness, model/provider, runtime, and installed-product surface tuples using isolated scenarios and recorded verdicts. A documentation review alone is not executable conformance evidence.

- R-KEEP-1 (MUST): the lab is maintainer-only and is absent from installed templates, the packaged copy, npm tarballs, and generated product packages. Scenario definitions are model-agnostic; model, provider, routing layer, model version, and runtime are run metadata rather than scenario logic.
- R-KEEP-2 (MUST): normalized verdicts are exactly `pass`, `pass-with-caveats`, `inconsistent`, `unsupported`, and `blocked`. A scenario that cannot execute because a precondition is missing records `blocked`; it never invents a pass or silently disappears.
- R-KEEP-3 (MUST): each scenario declares a safety mode, and destructive scenarios never run against a maintainer working tree. Execution occurs in the disposable lab-session boundary owned by [44-conformance-lab-sessions-and-evidence.md](44-conformance-lab-sessions-and-evidence.md).
- R-KEEP-4 (MUST): evidence has two classes: compact normalized result records suitable for source control, and raw transcripts/provider logs retained locally and promoted only as a deliberately redacted bundle when they materially support a disputed or stronger claim. Existing validation may be invoked by a scenario but is not replaced, and a green validation run is not a public support claim.

### The Support Tuple (R-TUPLE)

- R-TUPLE-1 (MUST): every support claim binds to the exact six-dimension tuple of `scenario`, `harness`, `surface`, `scope`, `modelOrProvider`, and `runtime`. Scenario version, Make Docs version, distribution identity, selected Skill identity, resource URI, and other applicable provenance narrow the claim further; no public wording may broaden beyond the recorded tuple and provenance exercised.
- R-TUPLE-2 (MUST): a pass for one model or provider does not cover other models routed through the same harness; a pass for one scenario, surface, scope, Skill, resource, distribution, or runtime does not imply blanket harness support.

### The Tuple Registry (R-REG)

- R-REG-1 (MUST): [the repo-root tuple registry](../../conformance/tuple-registry.json) is the single queryable index of support tuples and statuses. Support status is data derived from recorded evidence, never a prose assertion; [43-conformance-scenario-model-and-execution-kits.md](43-conformance-scenario-model-and-execution-kits.md) owns the surrounding `conformance/` asset family and scenario organization.
- R-REG-2 (MUST): every tuple status is one of `provisional` (the surface may exist but recognition and usability are unverified), `implementation-validated` (unit/integration evidence proves internal behavior or structure but no real-harness evidence exists), or `conformance-validated` (a real-harness result meets the full evidence bar).
- R-REG-3 (MUST): status is derived from recorded verdicts through the recording seam owned by [44-conformance-lab-sessions-and-evidence.md](44-conformance-lab-sessions-and-evidence.md). Only `pass`, or `pass-with-caveats` with every caveat surfaced and every required evidence-bar stage asserted, may derive `conformance-validated`; `inconsistent`, `unsupported`, and `blocked` never advance a tuple. A tuple cannot skip the real-harness evidence bar merely because internal tests pass.

### Test Layers (R-LAYER)

- R-LAYER-1 (MUST): conformance coverage has three named layers: unit tests cover operation core, parsers, validators, registry derivation, and other pure functions without a CLI; integration tests cover CLI and MCP surfaces over the same core, including manifest and exposure plumbing; conformance tests cover real-harness user outcomes for exact tuples through the maintainer lab.
- R-LAYER-2 (MUST): unit and integration tests are automated repository evidence only. Their success may derive `implementation-validated`, but it never proves that a harness discovers, recognizes, invokes, or cleanly removes the claimed installed-product surface and must never be cited as conformance evidence.

### Support Claim Governance

- R-GOV-1 (MUST): public support claims are projections of the authoritative tuple registry and may state only what a `conformance-validated` tuple proves. Until then, wording distinguishes a Make Docs-declared or installed surface from one the harness has actually recognized and exercised. A `pass-with-caveats` claim states its caveats wherever the claim appears; missing, stale, non-comparable, or absent evidence cannot be described as support.
- R-GOV-2 (MUST): one passing conformance result for an exact tuple is the minimum threshold for nominal support. Stronger recommendation or confidence language requires repeated comparable runs and maintainer review.
- R-GOV-3 (MUST): Skill, CLI, MCP, system-resource, installed-product, unattended, adversarial-review, optional-agentics, and model/provider claims use this same rule. Capability configuration, exposure declarations, documentation, and implementation tests are inputs or lower-layer evidence, never substitutes for the exact conformance result.
- R-GOV-4 (MUST): a `PERF-###` profile, performance outcome, characterization result, or waiver is separate evidence under [48 Performance Evidence Governance](48-performance-evidence-governance.md). None can satisfy the PRD 43 evidence bar, derive `conformance-validated`, or promote a support tuple; R-GOV-2's one passing conformance-result minimum remains independently required.

### Verification and Meta-Verification (R-TEST)

- R-TEST-1 (MUST): an enforcing check proves that no tuple is `conformance-validated` without a recorded result for the same tuple whose verdict is eligible and whose install, discover, invoke, and uninstall assertions satisfy the evidence bar.
- R-TEST-2 (MUST): an enforcing check proves that every current scenario cited by a support tuple exists and projects to runnable current commands or resource operations; an unavailable scenario records `blocked` instead of passing or being omitted. PRD 43 owns scenario identity and executable-kit checks.
- R-TEST-3 (MUST): package-exclusion checks prove that the entire maintainer conformance family is absent from the shipped template, packaged copy, npm tarballs, and generated product packages. PRD 43 owns the canonical root and distinctive path markers, including rejection of the retired `docs/assets/conformance/` home.

## Contracts and Data

The named paths, schemas, state records, metadata fields, and evidence shapes in Requirements are normative contracts for this capability.
## Integrations

This capability integrates with the adjacent current authorities linked from Requirements and Source Anchors; those authorities remain owners of their own boundaries.
## Rebuild Notes

A rebuild must preserve the requirement identifiers, stable semantic anchors, ownership boundaries, and failure-safe behavior stated here. Implementation evidence does not silently weaken this authority.
## Requirement History

### 2026-08-08 — Not assigned

- Affected requirement or section: `Consolidated capability ownership`
- Previous contract: Current requirements were also represented by standalone editorial PRDs 37, 42.
- Replacement contract: The applicable current requirements are inline in this authority and its linked product owners; the standalone editorial records are retired from the active set.
- Rationale: Active PRDs own product subjects and do not preserve editorial operations as product authority.
- Source: [PRD Authority Maintenance](../../.make-docs/references/system/prd-change-management.md)


### 2026-08-08 — W10 R5

- Affected requirement or section: `Document identity and current authority`
- Previous contract: The capability was represented as a standalone editorial change record whose title and structure described how the PRD set was modified.
- Replacement contract: This document now states the current agent-harness conformance evidence, lab boundaries, and support claims requirements inline as product authority.
- Rationale: Active PRDs describe the current product shape; editorial operations belong in plans, work, and history.
- Source: [Agent harness conformance design](../designs/2026-06-19-agent-harness-and-model-conformance-lab.md)

### 2026-08-14 — W19 R1

- Affected requirement or section: `Support-claim gating; The Support Tuple; Support Claim Governance; Verification and Meta-Verification`
- Previous contract: Support tuples and required scenarios centered generated Playbook packages, plugins, workflow bundles, and package-specific output dimensions.
- Replacement contract: Conformance and public claims cover current installed-product, Skill, CLI, MCP, system-resource, optional-agentics, and model/provider surfaces through exact six-dimension tuples; retired Playbook, Protocol, plugin, workflow-bundle, compiler, and generated-package claims are absent.
- Rationale: The support registry must describe only current product capabilities and must not preserve unsupported or untraced extension packaging as a provisional product promise.
- Source: [W19 R1 recovery design](../designs/2026-08-12-make-docs-v2-product-boundary-and-missing-migration-recovery.md) and [accepted W19 R1 plan](../plans/2026-08-13-w19-r1-make-docs-v2-product-boundary-and-missing-migration-recovery/00-overview.md)

### 2026-08-28 — W21 R0

- Affected requirement or section: requirements, lab and support governance, integrations, and support-claim evidence.
- Previous contract: Support claims required exact harness and model evidence but did not require conformance for proportionate testing decisions or the human testing experience.
- Replacement contract: Supported agents must apply the PRD 50 decision model and fail conformance for under-testing, over-testing, false gates, duplicate human work, and poor human instructions.
- Rationale: Technical execution support is incomplete when an agent applies testing in a costly, confusing, or unauthorized way.
- Source: [W21 R0 Proportionate Testing and Human-Centered Validation plan](../plans/2026-08-28-w21-r0-proportionate-testing-and-human-centered-validation/00-overview.md)

## Source Anchors

- [Performance Testing Guardrails design](../designs/2026-08-12-performance-testing-guardrails.md)
- [W19 R2 performance evidence plan](../plans/2026-08-13-w19-r2-performance-evidence-governance/00-overview.md)
- [48 Performance Evidence Governance](48-performance-evidence-governance.md)
- [W19 R1 recovery design](../designs/2026-08-12-make-docs-v2-product-boundary-and-missing-migration-recovery.md)
- [W19 R1 plan](../plans/2026-08-13-w19-r1-make-docs-v2-product-boundary-and-missing-migration-recovery/00-overview.md)

- `docs/designs/2026-06-19-agent-harness-and-model-conformance-lab.md`
- `docs/designs/2026-06-20-cli-separation-and-mcp-boundary.md`
- `docs/designs/2026-06-27-run-playbook-orchestration-and-harness-capabilities.md`
- `docs/plans/2026-06-23-w10-r5-agent-harness-model-conformance-lab/00-overview.md`
- `docs/plans/2026-06-23-w10-r6-cli-separation-and-mcp-boundary/00-overview.md`
- `docs/plans/2026-06-27-w18-r4-run-playbook-orchestration-and-harness-capabilities/00-overview.md`
- `docs/work/2026-06-23-w10-r5-agent-harness-model-conformance-lab/00-index.md`
- `docs/work/2026-06-27-w18-r4-run-playbook-orchestration-and-harness-capabilities/00-index.md`
- `docs/prd/07-cli-command-surface-and-lifecycle.md`
- `docs/prd/08-skills-catalog-and-distribution.md`
- `docs/prd/10-packaging-validation-and-release-reference.md`
- `docs/prd/16-package-runtime-and-deployment-boundaries.md`
- `docs/prd/17-system-asset-materialization-and-local-bootstrap.md`
- `docs/prd/18-compatibility-classification-and-migration-safety.md`
- `docs/prd/06-template-contracts-and-generated-assets.md`
- `docs/prd/25-typescript-runtime-cli-mcp-operation-boundaries.md`
- `docs/prd/30-plugin-substrate-and-workflow-bundles.md`
- `docs/prd/14-lifecycle-workflow-and-coverage-passes.md`
- `docs/prd/36-playbook-packaging-compiler-and-harness-adapters.md`
- `docs/designs/2026-06-29-playbook-packaging-and-harness-adapter-registry.md`
- `docs/plans/2026-06-29-w18-r5-playbook-packaging-and-harness-adapter-registry/00-overview.md`
- `docs/designs/2026-06-20-harness-plugin-substrate-and-workflow-bundles.md`
- `docs/designs/2026-06-20-coverage-pass-extensions-and-adversarial-review.md`
- `docs/plans/2026-06-23-w18-r2-harness-plugin-substrate-workflow-bundles/00-overview.md`
- `docs/plans/2026-06-23-w18-r3-coverage-pass-extensions-adversarial-review/00-overview.md`
- `packages/cli/src/types.ts`
- `packages/cli/src/wizard.ts`
- `packages/cli/src/skill-catalog.ts`
- `packages/cli/src/audit.ts`
- `packages/cli/src/manifest.ts`

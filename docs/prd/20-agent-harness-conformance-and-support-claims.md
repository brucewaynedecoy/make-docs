# 20 Agent Harness Conformance and Support Claims

## Purpose

This document defines the current product contract for agent-harness conformance evidence, lab boundaries, and support claims. Normative requirements are stated in the sections below; Requirement History is provenance only.
## Scope

This authority owns agent-harness conformance evidence, lab boundaries, and support claims. Related PRDs own adjacent capabilities and are linked where a cross-boundary contract is required.
## Component and Capability Map

The requirements below define the owned components, behaviors, boundaries, and evidence expectations for this capability.
## Requirements

- Result records must capture scenario id and version, harness, surface, scope, output kind, generated-output kind, model name, provider or routing layer when known, model version or immutable identifier when available, Make Docs version, runtime distribution, run date, produced files, relevant diffs, exit status, transcript/log pointer, normalized verdict, reason, caveats, and reviewer status.
- Verdicts are `pass`, `pass-with-caveats`, `inconsistent`, `unsupported`, and `blocked`.
- A result applies only to the exact R-TUPLE dimensions and packaging provenance it records.

Harness and adapter boundary:

- Current executable coverage is Codex and Claude Code because those are the current product harnesses.
- OpenCode, Goose, Pi, and future agentic IDEs are lab adapter targets, not current make-docs install harnesses; changing the executable harness model requires authoritative maintenance of this PRD and the applicable installation and conformance owners.
- Future adapters must exercise the same scenario protocol across default hosted models, alternate hosted models, and open-weight provider-routed models.

Support-claim gating:

- One passing run for an exact R-TUPLE tuple is the minimum threshold for nominal public support for that tuple.
- Repeated reviewed runs are required before stronger commendation language.
- A pass for one model in a harness does not imply support for every model routed through that harness.
- A pass for one scenario does not imply blanket harness support.
- Plugin, workflow bundle, playbook, skill, CLI, MCP, unattended, adversarial-review, or model/provider support claims must cite evidence for the exact scenario/harness/model/provider/runtime tuple claimed. [30-plugin-substrate-and-workflow-bundles.md](./30-plugin-substrate-and-workflow-bundles.md) keeps plugin and bundle wording provisional until implementation or conformance evidence exists. [14-lifecycle-workflow-and-coverage-passes.md](./14-lifecycle-workflow-and-coverage-passes.md) keeps adversarial-review support wording provisional until the exact prompt, playbook, plugin, CLI, MCP, package, harness, model, provider, or unattended surface has implementation validation or conformance records.
- [34-playbook-authoring-contract-and-model.md](./34-playbook-authoring-contract-and-model.md) and reviewed local `harnessCapabilities` records may guide a project run, but they are not public support evidence by themselves. Public claims for Run Playbook, nested playbooks, parallel playbooks, harness-managed goals, resume behavior, CLI execution, MCP execution, plugin launch, or unattended operation still require reviewed conformance evidence for the exact tuple claimed.
- [36-playbook-packaging-compiler-and-harness-adapters.md](./36-playbook-packaging-compiler-and-harness-adapters.md) extends support-claim gating to generated plugin and skills-bundle outputs. A support claim applies only to the exact Playbook source, package plan, output kind, harness, surface, scope, model/provider, and runtime tuple that has reviewed evidence.

Validation relationship:

- The lab may call existing validation commands as scenario steps.
- A green lab run does not replace package validation.
- A green package validation run is not a public harness/model support claim without conformance evidence.
- [25-typescript-runtime-cli-mcp-operation-boundaries.md](./25-typescript-runtime-cli-mcp-operation-boundaries.md) extends support-claim gating to CLI/MCP surfaces: a claim that an agent or harness can use MCP-backed make-docs behavior must have scenario evidence that the MCP tool delegates to the same CLI/shared-core operation contract and reports runtime/distribution identity.
## Lab and Support Governance

### Lab Boundary and Verdict Contract

The conformance lab evaluates explicit harness, model, package, and workflow support tuples using isolated scenarios and recorded verdicts. A documentation review alone is not executable conformance evidence.

- R-KEEP-1 (MUST): the lab is maintainer-only and is absent from installed templates, the packaged copy, npm tarballs, and generated product packages. Scenario definitions are model-agnostic; model, provider, routing layer, model version, and runtime are run metadata rather than scenario logic.
- R-KEEP-2 (MUST): normalized verdicts are exactly `pass`, `pass-with-caveats`, `inconsistent`, `unsupported`, and `blocked`. A scenario that cannot execute because a precondition is missing records `blocked`; it never invents a pass or silently disappears.
- R-KEEP-3 (MUST): each scenario declares a safety mode, and destructive scenarios never run against a maintainer working tree. Execution occurs in the disposable lab-session boundary owned by [44-conformance-lab-sessions-and-evidence.md](44-conformance-lab-sessions-and-evidence.md).
- R-KEEP-4 (MUST): evidence has two classes: compact normalized result records suitable for source control, and raw transcripts/provider logs retained locally and promoted only as a deliberately redacted bundle when they materially support a disputed or stronger claim. Existing validation may be invoked by a scenario but is not replaced, and a green validation run is not a public support claim.

### The Support Tuple (R-TUPLE)

- R-TUPLE-1 (MUST): every support claim for a generated output binds to the exact eight-dimension tuple of `scenario`, `harness`, `surface`, `scope`, `outputKind`, `generatedOutputKind`, `modelOrProvider`, and `runtime`. Packaging provenance may narrow the claim further to source Playbook refs, source digests, package plan, and adapter version, but no public wording may broaden beyond the recorded tuple and provenance exercised.
- R-TUPLE-2 (MUST): a pass for one model or provider does not cover other models routed through the same harness; a pass for one scenario, surface, scope, output kind, or runtime does not imply blanket harness support.

### The Tuple Registry (R-REG)

- R-REG-1 (MUST): [the repo-root tuple registry](../../conformance/tuple-registry.json) is the single queryable index of support tuples and statuses. Support status is data derived from recorded evidence, never a prose assertion; [43-conformance-scenario-model-and-execution-kits.md](43-conformance-scenario-model-and-execution-kits.md) owns the surrounding `conformance/` asset family and scenario organization.
- R-REG-2 (MUST): every tuple status is one of `provisional` (generation may exist but recognition and usability are unverified), `implementation-validated` (unit/integration evidence proves internal files and structure but no real-harness evidence exists), or `conformance-validated` (a real-harness result meets the full evidence bar).
- R-REG-3 (MUST): status is derived from recorded verdicts through the recording seam owned by [44-conformance-lab-sessions-and-evidence.md](44-conformance-lab-sessions-and-evidence.md). Only `pass`, or `pass-with-caveats` with every caveat surfaced and every required evidence-bar stage asserted, may derive `conformance-validated`; `inconsistent`, `unsupported`, and `blocked` never advance a tuple. A tuple cannot skip the real-harness evidence bar merely because internal tests pass.

### Test Layers (R-LAYER)

- R-LAYER-1 (MUST): conformance coverage has three named layers: unit tests cover operation core, parsers, validators, registry derivation, and other pure functions without a CLI; integration tests cover CLI and MCP surfaces over the same core, including manifest and exposure plumbing; conformance tests cover real-harness user outcomes for exact tuples through the maintainer lab.
- R-LAYER-2 (MUST): unit and integration tests are automated repository evidence only. Their success may derive `implementation-validated`, but it never proves that a harness discovers, recognizes, invokes, or cleanly uninstalls a generated output and must never be cited as conformance evidence.

### Support Claim Governance

- R-GOV-1 (MUST): public support claims are projections of the authoritative tuple registry and may state only what a `conformance-validated` tuple proves. Until then, wording distinguishes a Make Docs-generated output from a harness-recognized plugin or skill. A `pass-with-caveats` claim states its caveats wherever the claim appears; missing, stale, non-comparable, or absent evidence cannot be described as support.
- R-GOV-2 (MUST): one passing conformance result for an exact tuple is the minimum threshold for nominal support. Stronger recommendation or confidence language requires repeated comparable runs and maintainer review.
- R-GOV-3 (MUST): plugin, workflow-bundle, Playbook, skill, CLI, MCP, unattended, nested, parallel, adversarial-review, model/provider, and generated-output claims use this same rule. Capability configuration, adapter declarations, documentation, and implementation tests are inputs or lower-layer evidence, never substitutes for the exact conformance result.

### Verification and Meta-Verification (R-TEST)

- R-TEST-1 (MUST): an enforcing check proves that no tuple is `conformance-validated` without a recorded result for the same tuple whose verdict is eligible and whose install, discover, invoke, and uninstall assertions satisfy the evidence bar.
- R-TEST-2 (MUST): an enforcing check proves that all four required first-pass packaging scenarios exist and project to runnable current commands; an unavailable scenario records `blocked` instead of passing or being omitted. PRD 43 owns the exact scenario identifiers and executable-kit check.
- R-TEST-3 (MUST): packaging and exclusion checks prove that the entire maintainer conformance family is absent from the shipped template, packaged copy, npm tarballs, and generated product packages. PRD 43 owns the canonical root and distinctive path markers, including rejection of the retired `docs/assets/conformance/` home.

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
## Source Anchors

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

# 20 Revise Agent Harness Model Conformance Lab

## Purpose

Define a maintainer-only conformance lab that can exercise make-docs behavior across agent harnesses and harness-selected models before the project publishes support claims. The lab provides evidence for claims; it does not become part of shipped make-docs installs, templates, npm packages, MCP package surfaces, or provider-backed system asset delivery.

## Change Type

Addition of maintainer-only evidence infrastructure requirements and support-claim gating rules.

## Baseline Being Revised or Removed

- Revises CLI and skills harness requirements by distinguishing current shipped harnesses from future lab adapters.
- Revises package/release validation requirements by clarifying that validation can be scenario evidence but is not a support claim by itself.
- Revises W10 package, materialization, compatibility, and template/dogfood requirements by making them scenario inputs for the lab.
- Updates the living risk register without adding duplicate items.

## Rationale

make-docs needs evidence before claiming support for a harness/model combination. Current product harnesses are Codex and Claude Code, while OpenCode, Goose, Pi, and later IDEs are future targets. A maintainer-only lab gives the project a repeatable way to record scenario evidence without shipping lab assets to consumers, committing raw provider logs by default, or treating one model result as blanket harness support.

## Effective Requirement

### Change Notes

- Enhanced by [37-enhance-playbook-and-package-conformance.md](./37-enhance-playbook-and-package-conformance.md). For generated Playbook distributables, the support tuple expands to scenario, harness, surface, scope, output kind, generated-output kind, model or provider, and runtime; tuple statuses live in a queryable registry under `docs/assets/conformance/` with `provisional`, `implementation-validated`, and `conformance-validated` statuses derived from run verdicts; and `conformance-validated` requires the install-discover-invoke-uninstall evidence bar. The lab's maintainer-only nature, verdicts, safety modes, evidence classes, storage boundaries, and one-run threshold remain unchanged.

Lab scope:

- The lab is maintainer-only repository tooling and documentation evidence.
- It is not installed into consumer projects by default.
- It is not part of shipped templates, npm packages, MCP package surfaces, or provider-backed system asset delivery.
- It is not part of the `.make-docs/**` tool-directory system defined by [21-revise-tool-directory-system-custom-resource-tiers.md](./21-revise-tool-directory-system-custom-resource-tiers.md) unless a later accepted design deliberately promotes a reviewed subset.
- Scenario specs and compact reviewed result records may live under a future `docs/assets/conformance/` tree.
- Raw run artifacts, transcripts, provider logs, and temporary workspaces default to `.make-docs/conformance/` or `.make-docs/runs/conformance/` and are not committed unless deliberately redacted and promoted.

Scenario contract:

- A scenario defines make-docs behavior and expected evidence without assuming a model provider.
- Scenario safety mode must be one of read-only, dry-run, temp-fixture apply, destructive temp-fixture apply, or external-provider run.
- The lab must not run destructive scenarios against a maintainer working tree.
- Scenarios requiring credentials, network access, provider accounts, unavailable harnesses, or model routing must report `blocked` instead of inventing evidence.

Result contract:

- Result records must capture selected harness, model name, provider or routing layer when known, model version or immutable identifier when available, make-docs version, runtime distribution, scenario id, scenario version, run date, produced files, relevant diffs, exit status, transcript/log pointer, normalized verdict, reason, caveats, and reviewer status.
- Verdicts are `pass`, `pass-with-caveats`, `inconsistent`, `unsupported`, and `blocked`.
- A result applies only to the scenario/harness/model/provider/runtime tuple it records.

Harness and adapter boundary:

- Current executable coverage is Codex and Claude Code because those are the current product harnesses.
- OpenCode, Goose, Pi, and future agentic IDEs are lab adapter targets, not current make-docs install harnesses, until a later accepted design changes the executable harness model.
- Future adapters must exercise the same scenario protocol across default hosted models, alternate hosted models, and open-weight provider-routed models.

Support-claim gating:

- One passing run for a scenario/harness/model tuple is the minimum threshold for nominal public support for that tuple.
- Repeated reviewed runs are required before stronger commendation language.
- A pass for one model in a harness does not imply support for every model routed through that harness.
- A pass for one scenario does not imply blanket harness support.
- Plugin, workflow bundle, playbook, skill, CLI, MCP, unattended, adversarial-review, or model/provider support claims must cite evidence for the exact scenario/harness/model/provider/runtime tuple claimed. [30-revise-harness-plugin-substrate-workflow-bundles.md](./30-revise-harness-plugin-substrate-workflow-bundles.md) keeps plugin and bundle wording provisional until implementation or conformance evidence exists. [31-revise-coverage-pass-extensions-adversarial-review.md](./31-revise-coverage-pass-extensions-adversarial-review.md) keeps adversarial-review support wording provisional until the exact prompt, playbook, plugin, CLI, MCP, package, harness, model, provider, or unattended surface has implementation validation or conformance records.
- [29-revise-playbook-contract-run-playbook.md](./29-revise-playbook-contract-run-playbook.md) and W18 R4 local harness capability records may guide a project run, but they are not public support evidence by themselves. Public claims for Run Playbook, nested playbooks, parallel playbooks, harness-managed goals, resume behavior, CLI execution, MCP execution, plugin launch, or unattended operation still require reviewed conformance evidence for the exact tuple claimed.
- [33-enhance-playbook-packaging-and-harness-adapter-registry.md](./33-enhance-playbook-packaging-and-harness-adapter-registry.md) extends support-claim gating to generated plugin and skills-bundle outputs. A support claim applies only to the exact Playbook source, package plan, output kind, harness, surface, scope, model/provider, and runtime tuple that has reviewed evidence.

Validation relationship:

- The lab may call existing validation commands as scenario steps.
- A green lab run does not replace package validation.
- A green package validation run is not a public harness/model support claim without conformance evidence.
- [25-revise-cli-separation-and-mcp-boundary.md](./25-revise-cli-separation-and-mcp-boundary.md) extends support-claim gating to CLI/MCP surfaces: a claim that an agent or harness can use MCP-backed make-docs behavior must have scenario evidence that the MCP tool delegates to the same CLI/shared-core operation contract and reports runtime/distribution identity.

## Impacted Docs and Dependencies

| Area | Effective impact |
| --- | --- |
| `docs/prd/07-cli-command-surface-and-lifecycle.md` | Clarifies that current shipped harness behavior remains Codex and Claude Code until another accepted design changes it. |
| `docs/prd/08-skills-catalog-and-distribution.md` | Clarifies that future lab adapters are not current skills install targets. |
| `docs/prd/10-packaging-validation-and-release-reference.md` | Adds conformance evidence as support-claim proof without replacing package validation. |
| `docs/prd/16-revise-package-and-deployment-boundaries.md` | Keeps lab assets out of shipped packages and MCP package surfaces by default. |
| `docs/prd/17-revise-system-asset-materialization-contract.md` | Keeps lab evidence out of provider-backed system asset delivery. |
| `docs/prd/18-revise-compatibility-audit-and-migration-disposition.md` | Reuses migration/audit scenarios as evidence inputs without changing safety semantics. |
| `docs/prd/19-revise-template-package-dogfood-source-of-truth-contract.md` | Uses template/dogfood/package source-of-truth scenarios as lab inputs without moving lab assets into template copies. |
| `docs/prd/30-revise-harness-plugin-substrate-workflow-bundles.md` | Adds plugin and workflow-bundle support-claim tuples as future conformance inputs without shipping lab artifacts by default. |
| `docs/prd/31-revise-coverage-pass-extensions-adversarial-review.md` | Adds adversarial-review support-claim tuples as future conformance inputs only when a downstream plan selects a shipped or executable surface. |
| `docs/prd/33-enhance-playbook-packaging-and-harness-adapter-registry.md` | Adds generated plugin and skills-bundle package-output tuples as future conformance inputs. |
| `docs/prd/03-open-questions-and-risk-register.md` | Updates existing harness, provider, plugin, dogfood, package, audit, and no-scripts risks without duplicating entries. |

The paired delta backlog should be generated under `docs/work/2026-06-23-w10-r5-agent-harness-model-conformance-lab/`.

## Required Baseline Annotations

- `docs/prd/00-index.md` must route maintainers and agents through PRD 20 before support-claim or conformance implementation work.
- `docs/prd/07-cli-command-surface-and-lifecycle.md`, `docs/prd/08-skills-catalog-and-distribution.md`, and `docs/prd/10-packaging-validation-and-release-reference.md` must point to PRD 20.
- W10 PRDs 16 through 19 should note that the lab consumes their contracts as evidence scenarios without becoming shipped product surface.
- The living risk register must update existing relevant entries without adding duplicate IDs.

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
- `docs/prd/16-revise-package-and-deployment-boundaries.md`
- `docs/prd/17-revise-system-asset-materialization-contract.md`
- `docs/prd/18-revise-compatibility-audit-and-migration-disposition.md`
- `docs/prd/19-revise-template-package-dogfood-source-of-truth-contract.md`
- `docs/prd/25-revise-cli-separation-and-mcp-boundary.md`
- `docs/prd/30-revise-harness-plugin-substrate-workflow-bundles.md`
- `docs/prd/31-revise-coverage-pass-extensions-adversarial-review.md`
- `docs/prd/33-enhance-playbook-packaging-and-harness-adapter-registry.md`
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

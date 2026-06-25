# 31 Revise Coverage Pass Extensions Adversarial Review

## Purpose

Define the v2 contract for adversarial review as an optional coverage-pass extension. The design decides whether adversarial review is part of v2, how it maps to the existing coverage-pass mechanics, and which boundaries keep it from becoming an implied release gate, plugin mandate, or replacement for the normal design -> plan -> PRD -> work -> implementation lifecycle.

## Change Type

Revision. This PRD extends the active lifecycle workflow, coverage-pass, persona, template/package, conformance, CLI/MCP, playbook, plugin, and validation requirements.

Route: `change-plan`

Coordinate: `W18 R3`

## Change Notes

This PRD turns the Coverage-Pass Extensions and Adversarial Review design into active requirements. It defines adversarial review as optional coverage-pass behavior only; it does not create a shipped prompt, playbook, plugin, CLI command, MCP operation, conformance scenario, or release gate by itself.

## Requirements

### Optional Extension

Adversarial review is a real v2 design concept, but it is optional.

It is not a required release, merge, publish, push, implementation, or batch-approval gate. It is also not a plugin by default.

The canonical v2 shape is an adversarial-review coverage-pass extension that can later be exposed through a starter prompt, playbook, plugin bundle, CLI command, MCP operation, or conformance scenario only when a downstream plan explicitly selects that surface.

### Pass Skeleton

The extension inherits the shared coverage-pass skeleton:

1. Load the authority docs for the target surface.
2. Enumerate every adversarial candidate.
3. Assign exactly one verdict to every candidate.
4. Prefer updating an existing owner artifact over creating a new one.
5. Apply history idempotency once for the current session when history recording is required.
6. Validate the changed or intentionally unchanged coverage.
7. Close with a summary of verdicts, reasons, artifacts changed, validation, and handoffs.

### Adversarial Candidate Record

An adversarial candidate is a challenge against a claim, assumption, workflow, support statement, or artifact boundary.

Each candidate must record:

- `id`: stable within the pass output
- `target`: design, plan, PRD, work item, guide, playbook, prompt, package asset, code surface, support claim, or other reviewed surface
- `challenge`: the adversarial concern or counterexample
- `evidence`: the authority or observed surface supporting the challenge
- `persona_target`: configured persona slug or `none`
- `severity`: advisory ordering for review, not a gate by itself
- `verdict`: one of the adversarial verdicts
- `reason`: why the verdict is correct
- `handoff`: artifact, owner surface, or future plan/PRD/risk-register follow-up if any
- `validation`: validation already run or expected before closeout

### Verdict Mapping

Every candidate gets exactly one verdict and a reason. `covered` and `rejected` are first-class outcomes, not silent skips.

| Adversarial verdict | Base spine mapping | Use when |
| --- | --- | --- |
| `new-gap` | `create` | The challenge exposes missing coverage and no current artifact owns the answer. |
| `revise-owner` | `update-existing` | An existing artifact owns the answer but needs correction, narrowing, or stronger evidence. |
| `handoff-only` | `link-only` | The challenge is valid, but the right action is a pointer, batch-reconciliation note, future-plan handoff, or risk/open-question reference. |
| `covered` | `none` | Existing authority already handles the challenge and no artifact change or link is warranted. |
| `rejected` | `none` | The challenge is not actionable after reading authority, and the pass records why. |

A future prompt or tool may add display labels, but it must preserve this mapping.

### Persona Targeting

Persona targeting is conditional.

Most adversarial review is non-persona because it challenges authority, implementation boundaries, or support claims. A candidate gets a persona target only when the challenge concerns persona-scoped content or audience-specific usability, such as a developer playbook, user guide, maintainer-only plugin, or run-stack workflow.

When configuration exists, the pass must use configured personas. Until persona configuration is implemented, the pass may use the legacy Developer/User fallback from [coverage-pass-contract.md](../assets/references/coverage-pass-contract.md), but new assets must not invent additional hard-coded persona schema.

### History Idempotency

History idempotency follows [coverage-pass-contract.md](../assets/references/coverage-pass-contract.md).

If a pass is part of closeout or explicitly records a session result, it updates the existing current-session history record or creates one if none exists. It does not create duplicate history entries.

If the pass is exploratory evidence gathering and the caller did not request history, the pass may return verdicts without mutating history, but it must state that no history artifact changed.

### Optional Surface Exposure

Adversarial review can become a shipped starter prompt or playbook only through a downstream change plan.

If implemented as a prompt, it should live beside the other coverage-pass starters, be registered in `PROMPT_RULES` only after source-of-truth and package-template parity decisions are made, and reuse the existing coverage-pass contract.

If implemented as a playbook, it must follow [29-revise-playbook-contract-run-playbook.md](29-revise-playbook-contract-run-playbook.md).

If implemented as a plugin or workflow bundle, it must follow [30-revise-harness-plugin-substrate-workflow-bundles.md](30-revise-harness-plugin-substrate-workflow-bundles.md) and remain explicit-selection only.

Bare installs, default sync, generic Run Playbook, and plugin selection do not imply adversarial review.

### Support Claims

Public support claims remain evidence-bound.

Any claim that adversarial review works in a harness, model, plugin bundle, unattended mode, CLI surface, MCP surface, or package delivery mode must be backed by implementation validation or conformance-lab records. Without that evidence, support language stays provisional.

### Template Package and Validation Boundary

If adversarial review becomes a shipped product asset, implementation must decide the template-owned source before adding root-dogfood copies.

Shipped adversarial prompts, references, playbooks, or starter assets follow [19-revise-template-package-dogfood-source-of-truth-contract.md](19-revise-template-package-dogfood-source-of-truth-contract.md):

1. Author in `packages/docs/template/`.
2. Reseed repo-root dogfood `docs/` for reviewed template-owned files.
3. Generate `packages/cli/template/` through copy/prepack behavior.
4. Validate local dev and packed npm behavior.

Baseline implementation validation should include `npm run build -w packages/cli`, `npm test -w packages/cli`, `npm run validate:defaults -w packages/cli`, `npm run smoke:pack`, focused link checks, package-template parity checks, prompt-rule coverage if a prompt is added, playbook metadata validation if a playbook is added, plugin substrate validation if a plugin is added, and conformance-lab records before public support claims.

## Non-Requirements

- No mandatory adversarial-review lifecycle gate.
- No default adversarial-review plugin, prompt, playbook, CLI command, MCP operation, or conformance scenario.
- No generic Run Playbook behavior change.
- No plugin selection implied by adversarial review.
- No source-code implementation in this PRD-only round.
- No public support claim without implementation or conformance evidence.
- No dogfood-first authoring for shipped adversarial-review assets.

## Affected Baseline Docs

- [00 Make Docs PRD Index](00-index.md)
- [03 Open Questions and Risk Register](03-open-questions-and-risk-register.md)
- [10 Packaging Validation and Release Reference](10-packaging-validation-and-release-reference.md)
- [14 Add Lifecycle Workflow Foundation](14-add-lifecycle-workflow-foundation.md)
- [19 Revise Template Package Dogfood Source of Truth Contract](19-revise-template-package-dogfood-source-of-truth-contract.md)
- [20 Revise Agent Harness Model Conformance Lab](20-revise-agent-harness-model-conformance-lab.md)
- [22 Revise New Docs Assets Playbooks Persona Model](22-revise-new-docs-assets-playbooks-persona-model.md)
- [24 Revise Configuration Convention Overlay](24-revise-configuration-convention-overlay.md)
- [25 Revise CLI Separation and MCP Boundary](25-revise-cli-separation-and-mcp-boundary.md)
- [29 Revise Playbook Contract Run Playbook](29-revise-playbook-contract-run-playbook.md)
- [30 Revise Harness Plugin Substrate Workflow Bundles](30-revise-harness-plugin-substrate-workflow-bundles.md)

## Acceptance Criteria

- Adversarial review is documented as optional coverage-pass behavior.
- Candidate record fields and verdict mapping are defined.
- `covered` and `rejected` outcomes require reasons rather than silent skips.
- Persona targeting is conditional and config-aware.
- History idempotency is preserved.
- No default prompt, playbook, plugin, CLI command, MCP operation, or conformance scenario is implied.
- Shipped adversarial assets, if selected later, follow template-first source-of-truth order.
- Support claims remain provisional until implementation or conformance evidence exists.

## Source Anchors

- [../designs/2026-06-20-coverage-pass-extensions-and-adversarial-review.md](../designs/2026-06-20-coverage-pass-extensions-and-adversarial-review.md)
- [../plans/2026-06-23-w18-r3-coverage-pass-extensions-adversarial-review/00-overview.md](../plans/2026-06-23-w18-r3-coverage-pass-extensions-adversarial-review/00-overview.md)
- [../work/2026-06-23-w18-r3-coverage-pass-extensions-adversarial-review/00-index.md](../work/2026-06-23-w18-r3-coverage-pass-extensions-adversarial-review/00-index.md)
- [../assets/references/coverage-pass-contract.md](../assets/references/coverage-pass-contract.md)
- [14 Add Lifecycle Workflow Foundation](14-add-lifecycle-workflow-foundation.md)
- [19 Revise Template Package Dogfood Source of Truth Contract](19-revise-template-package-dogfood-source-of-truth-contract.md)
- [20 Revise Agent Harness Model Conformance Lab](20-revise-agent-harness-model-conformance-lab.md)
- [22 Revise New Docs Assets Playbooks Persona Model](22-revise-new-docs-assets-playbooks-persona-model.md)
- [24 Revise Configuration Convention Overlay](24-revise-configuration-convention-overlay.md)
- [25 Revise CLI Separation and MCP Boundary](25-revise-cli-separation-and-mcp-boundary.md)
- [29 Revise Playbook Contract Run Playbook](29-revise-playbook-contract-run-playbook.md)
- [30 Revise Harness Plugin Substrate Workflow Bundles](30-revise-harness-plugin-substrate-workflow-bundles.md)
- `.make-docs/references/system/prompts/coverage-pass-developer-guide.prompt.md`
- `.make-docs/references/system/prompts/coverage-pass-user-guide.prompt.md`
- `.make-docs/references/system/prompts/coverage-pass-prd-reconciliation.prompt.md`
- `.make-docs/references/system/prompts/coverage-pass-testing-uat.prompt.md`
- `packages/docs/template/.make-docs/contracts/system/coverage-pass-contract.md`
- `packages/docs/template/.make-docs/references/system/prompts/coverage-pass-developer-guide.prompt.md`
- `packages/docs/template/.make-docs/references/system/prompts/coverage-pass-user-guide.prompt.md`
- `packages/docs/template/.make-docs/references/system/prompts/coverage-pass-prd-reconciliation.prompt.md`
- `packages/docs/template/.make-docs/references/system/prompts/coverage-pass-testing-uat.prompt.md`
- `packages/cli/src/rules.ts`
- `scripts/smoke-pack.mjs`

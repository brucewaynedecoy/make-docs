# Coverage-Pass Extensions and Adversarial Review

> Filename: `2026-06-20-coverage-pass-extensions-and-adversarial-review.md`. See `.make-docs/contracts/system/design-contract.md` for naming and structural rules.

## Purpose

Define the v2 contract for adversarial review as an optional coverage-pass extension. The design decides whether adversarial review is part of v2, how it maps to the existing coverage-pass mechanics, and which boundaries keep it from becoming an implied release gate, plugin mandate, or replacement for the normal design -> plan -> PRD -> work -> implementation lifecycle.

## Context

Batch 4 builds the invocation layer after the substrate exists. The accepted Batch 4 playbook design makes playbooks persona-scoped content under `docs/assets/playbooks/<persona-slug>/<playbook-slug>.md` and defines generic Run Playbook as an execution model, not a plugin requirement. The accepted plugin design makes plugins harness-visible invocation packages that may call playbooks or built-in workflows, while keeping plugin payloads, generated harness exposure, support claims, audit, backup, and uninstall behavior in the plugin substrate.

The roadmap asks this design to treat adversarial review as an optional coverage-pass extension, not a blocker for the rest of v2. It also asks for verdicts, persona targeting if applicable, history idempotency, and validation only if adversarial review becomes a real v2 deliverable.

The current coverage-pass baseline already exists. [Coverage Pass Contract and Skill Evolution](../assets/archive/designs/2026-05-28-coverage-pass-contract-and-skill-evolution.md) established the shared pass mechanics, and [coverage-pass-contract.md](../../.make-docs/contracts/system/coverage-pass-contract.md) now owns the pass skeleton, base verdict spine, persona-target axis, history idempotency, verdict-and-reason rule, validation checklist, and rules for defining new coverage passes. Existing starter prompts for developer guides, user guides, PRD reconciliation, and testing/UAT are already registered in `packages/cli/src/rules.ts` and mirrored through package templates. There is no current adversarial-review prompt, playbook, plugin, CLI command, MCP operation, or manifest field.

This v2 design pass is an intentional lifecycle departure. The current source is the artifact roadmap plus accepted earlier v2 designs, so this design is being drafted from artifact inputs before the repo returns to the normal arc: design -> plan -> PRD -> work -> implementation. This file records that departure and does not create or mutate plans, PRDs, risk-register entries, work backlogs, package templates, prompt assets, or source code.

Related risk and open-question entries remain active references, not mutation targets: [Q-009](../prd/03-open-questions-and-risk-register.md#q-009-what-is-the-persona-model-schema) for persona schema, [Q-012](../prd/03-open-questions-and-risk-register.md#q-012-how-do-plugins-and-skills-share-an-install-and-respect-config-mapping) and [Q-013](../prd/03-open-questions-and-risk-register.md#q-013-what-are-the-plugin-flow-and-exposure-boundaries) for plugin exposure, [R-012](../prd/03-open-questions-and-risk-register.md#r-012-playbooks-and-plugins-could-become-overlapping-deliverables) for playbook/plugin overlap, [R-014](../prd/03-open-questions-and-risk-register.md#r-014-the-no-scripts-migration-has-a-transitional-break-window) for deterministic logic migration, and [D-014](../prd/03-open-questions-and-risk-register.md#d-014-w16-r0-product-assets-authored-in-the-dogfood-instead-of-the-template-source) for template source-of-truth drift.

## Decision

Adversarial review is a real v2 design concept, but it is optional. It is not a required release, merge, publish, push, implementation, or batch-approval gate. It is also not a plugin by default. The canonical v2 shape is an adversarial-review coverage-pass extension that can later be exposed through a starter prompt, playbook, plugin bundle, CLI command, MCP operation, or conformance scenario only when a downstream plan explicitly selects that surface.

The extension inherits the shared coverage-pass skeleton:

1. Load the authority docs for the target surface.
2. Enumerate every adversarial candidate.
3. Assign exactly one verdict to every candidate.
4. Prefer updating an existing owner artifact over creating a new one.
5. Apply history idempotency once for the current session when history recording is required.
6. Validate the changed or intentionally unchanged coverage.
7. Close with a summary of verdicts, reasons, artifacts changed, validation, and handoffs.

An adversarial candidate is a challenge against a claim, assumption, workflow, support statement, or artifact boundary. Each candidate must record:

- `id`: stable within the pass output
- `target`: design, plan, PRD, work item, guide, playbook, prompt, package asset, code surface, support claim, or other reviewed surface
- `challenge`: the adversarial concern or counterexample
- `evidence`: the authority or observed surface supporting the challenge
- `persona_target`: configured persona slug or `none`
- `severity`: advisory ordering for review, not a gate by itself
- `verdict`: one of the pass verdicts below
- `reason`: why the verdict is correct
- `handoff`: artifact, owner surface, or future plan/PRD/risk-register follow-up if any
- `validation`: validation already run or expected before closeout

The adversarial verdict set maps onto the coverage-pass spine:

| Adversarial verdict | Base spine mapping | Use when |
| --- | --- | --- |
| `new-gap` | `create` | The challenge exposes missing coverage and no current artifact owns the answer. |
| `revise-owner` | `update-existing` | An existing artifact owns the answer but needs correction, narrowing, or stronger evidence. |
| `handoff-only` | `link-only` | The challenge is valid, but the right action is a pointer, batch-reconciliation note, future-plan handoff, or risk/open-question reference. |
| `covered` | `none` | Existing authority already handles the challenge and no artifact change or link is warranted. |
| `rejected` | `none` | The challenge is not actionable after reading authority, and the pass records why. |

Every candidate gets exactly one verdict and a reason. `covered` and `rejected` are first-class outcomes, not silent skips. A future prompt or tool may add display labels, but it must preserve this mapping.

Persona targeting is conditional. Most adversarial review is non-persona because it challenges authority, implementation boundaries, or support claims. A candidate gets a persona target only when the challenge concerns persona-scoped content or audience-specific usability, such as a Developer playbook, User guide, maintainer-only plugin, or run-stack workflow. When configuration exists, the pass must use configured personas. Until the persona schema is settled, new assets must not hard-code persona field names beyond the legacy fallback already allowed by the coverage-pass contract.

History idempotency follows the coverage-pass contract. If a pass is part of closeout or explicitly records a session result, it updates the existing current-session history record or creates one if none exists. It does not create duplicate history entries. If the pass is only exploratory evidence gathering and the caller did not request history, the pass may return verdicts without mutating history, but it must say that no history artifact was changed.

Adversarial review can become a shipped starter prompt or playbook only through a downstream change plan. If implemented as a prompt, it should likely live beside the other coverage-pass starters, be registered in `PROMPT_RULES` only after source-of-truth and package-template parity decisions are made, and reuse the existing coverage-pass contract rather than duplicating mechanics. If implemented as a playbook, it must follow the v2 playbook contract. If implemented as a plugin or workflow bundle, it must inherit the plugin substrate and stay explicit-selection only. Bare installs, default sync, and generic Run Playbook do not imply adversarial review.

Public support claims remain evidence-bound. Any claim that adversarial review works in a harness, model, plugin bundle, unattended mode, or package delivery mode must be backed by implementation validation or conformance-lab records. Without that evidence, support language stays provisional.

## Alternatives Considered

Making adversarial review a mandatory lifecycle gate was rejected. It would turn an advisory challenge process into a blocking release or merge policy, contradicting the coverage-pass contract's non-goal and slowing unrelated v2 work.

Making adversarial review a plugin-first feature was rejected. Plugins are invocation packages on top of substrate, not the canonical definition of workflow semantics. A future plugin can launch adversarial review, but the contract belongs in the coverage-pass layer.

Folding adversarial review directly into the base coverage-pass contract was rejected. The base contract should stay small and surface-neutral. Adversarial review is a pass-specific extension with its own candidate shape and verdict labels.

Treating adversarial review only as a conformance-lab scenario was rejected. Conformance evidence may validate support claims later, but the review behavior must be defined independently of any one harness or model test.

Ignoring adversarial review for v2 was rejected. The roadmap raises it as a Batch 4 decision, and an explicit optional contract is safer than leaving the batch to infer whether adversarial review is a blocker, plugin, or informal review style.

## Consequences

Batch 4 can close without making adversarial review a blocker for playbooks, plugins, or workflow bundles. The batch approval gate should check that this design preserved the playbook/plugin boundary, kept support claims provisional without conformance evidence, and treated adversarial review as optional.

Future implementation planning should be scoped as a change to the existing coverage-pass system. Likely touched surfaces, if the change is accepted, include `.make-docs/contracts/system/coverage-pass-contract.md` only if it needs a pointer to the extension, a new adversarial starter prompt if selected, package-template mirrors, `packages/cli/src/rules.ts`, manifest/audit/template parity behavior, package smoke validation, and any chosen playbook or plugin exposure. This design does not authorize those edits by itself.

Template and dogfood source-of-truth decisions matter. If adversarial review becomes a shipped product asset, the plan must decide the template-owned source before adding root-dogfood copies. That prevents repeating the D-014 pattern where W16 R0 product assets were authored first in repo-root dogfood docs.

The risk register and PRD state are not mutated by this design. Batch reconciliation can decide whether Q-009, Q-012, Q-013, R-012, R-014, or D-014 need status changes after the complete Batch 4 design set is accepted.

Validation expectations for future implementation include `npm run build -w packages/cli`, `npm test -w packages/cli`, `npm run validate:defaults -w packages/cli`, `npm run smoke:pack`, focused link checks, package-template parity checks, prompt-rule coverage if a prompt is added, playbook metadata validation if a playbook is added, plugin substrate validation if a plugin is added, and conformance-lab records before public support claims.

## Design Lineage

Update Mode: `new-doc-related`

Prior Design Docs:

- [Coverage Pass Contract and Skill Evolution](../assets/archive/designs/2026-05-28-coverage-pass-contract-and-skill-evolution.md)
- [New Docs Assets, Playbooks, and Persona Model](2026-06-19-new-docs-assets-playbooks-and-persona-model.md)
- [Template Package and Dogfood Source of Truth Contract](2026-06-19-template-package-and-dogfood-source-of-truth-contract.md)
- [Agent Harness and Model Conformance Lab](2026-06-19-agent-harness-and-model-conformance-lab.md)
- [Configuration and Convention Overlay](2026-06-20-configuration-and-convention-overlay.md)
- [Playbook Contract and Run Playbook](2026-06-20-playbook-contract-and-run-playbook.md)
- [Harness Plugin Substrate and Workflow Bundles](2026-06-20-harness-plugin-substrate-and-workflow-bundles.md)

Reason: This design extends the existing coverage-pass intent with a pass-specific adversarial-review extension while relying on accepted v2 decisions for persona-scoped playbooks, template ownership, conformance evidence, configuration overlays, generic Run Playbook, and plugin substrate boundaries. It does not supersede the base coverage-pass contract.

## Intended Follow-On

Route: `change-plan`

Next Prompt: [designs-to-plan-change.prompt.md](../../.make-docs/references/system/prompts/designs-to-plan-change.prompt.md)

Why: The design revises and extends the existing coverage-pass system rather than establishing a fresh baseline. Any future work should plan additive changes to the current contract, prompt, package-template, manifest, and optional playbook/plugin exposure surfaces.

Coordinate Handoff: prior coordinate W16 R0 for coverage-pass contract, lifecycle workflow foundation, and coverage-pass starter prompts; downstream coordinate W18 R3 ([PRD 31](../prd/31-revise-coverage-pass-extensions-adversarial-review.md)), currently deferred and split pending the W18 R6-R11 architecture; see risk-register entry R-020.

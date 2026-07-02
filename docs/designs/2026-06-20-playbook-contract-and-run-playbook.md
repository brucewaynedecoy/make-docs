# Playbook Contract and Run Playbook

## Purpose

Define the v2 contract for make-docs playbooks and the generic "Run Playbook" execution model that can operate on those playbooks without requiring every playbook to become a plugin. This design gives Batch 4 a stable content boundary before deciding plugin substrate, product bundles, or adversarial review extensions.

## Context

The [v2 roadmap](../assets/artifacts/v2-proposed-design-and-roadmap.md) places this design first in "Batch 4 - Playbooks and Plugins." It follows the docs asset substrate, configuration overlay, metadata model, shared agentics install, and harness-redirection decisions, and it must keep build-stack and run-stack playbooks distinct before later plugin behavior is designed.

This design intentionally starts from artifact roadmap inputs instead of from an already accepted design. That is a lifecycle departure under the [documentation lifecycle](../../.make-docs/references/system/lifecycle.md): v2 planning is using artifact proposals as a source-to-design straddle, then returning to the default design -> plan -> PRD -> work -> implementation sequence for downstream work.

The current repository has a dogfooded lifecycle playbook at [docs/assets/playbooks/agent/make-docs-lifecycle.playbook.md](../assets/playbooks/agent/make-docs-lifecycle.playbook.md) and a coverage-pass contract at [.make-docs/contracts/system/coverage-pass-contract.md](../../.make-docs/contracts/system/coverage-pass-contract.md). The prior transitional playbook location was migration evidence only; W9 R5 moved the active dogfood copy under the v2 playbook surface.

No existing design owns this exact decision area. This is a new v2 design, not an update to a prior design. It must, however, stay compatible with the accepted intent in [2026-06-19 New Docs Assets, Playbooks, and Persona Model](2026-06-19-new-docs-assets-playbooks-and-persona-model.md), [2026-06-17 Make-Docs Lifecycle Foundation](../assets/archive/designs/2026-06-17-make-docs-lifecycle-foundation.md), [2026-05-28 Make-Docs Lifecycle Playbook](../assets/archive/designs/2026-05-28-make-docs-lifecycle-playbook.md), [2026-06-20 Configuration and Convention Overlay](2026-06-20-configuration-and-convention-overlay.md), and [2026-06-20 Shared Agentics Installation and Harness Redirection](2026-06-20-shared-agentics-installation-and-harness-redirection.md).

Risk and open-question context remains in the existing PRD/risk register, including R-012, Q-009, Q-012, Q-013, R-011, and R-014 in [docs/prd/03-open-questions-and-risk-register.md](../prd/03-open-questions-and-risk-register.md). This design references those risks and questions but does not mutate PRD or risk-register state.

## Decision

V2 playbooks are persona-scoped docs assets. Their canonical v2 location is `docs/assets/playbooks/<persona-slug>/<playbook-slug>.md`. The path is part of the contract: a playbook belongs to one owning persona namespace even when another persona can consume it as reference material.

Each playbook must declare enough metadata for a generic runner, template sync, audit, and future plugin surfaces to identify its authority without interpreting prose. The minimum v2 frontmatter is:

```yaml
title: <human-readable title>
kind: playbook
status: proposed | accepted | deprecated
persona: <persona-slug>
stack: build | run
summary: <one-sentence purpose>
```

Additional fields may be introduced by the metadata design or later implementation plans, but the generic Run Playbook model may depend only on the minimum fields above plus normal Markdown headings. Coordinates, lifecycle labels, source labels, package labels, and plugin labels are optional overlays unless a later accepted design makes them required for a narrower surface.

Playbook body structure must remain readable as documentation and executable as a guided process. A v2 playbook must define:

- purpose and when to use it
- required inputs and authority order
- step-by-step procedure
- gates, stop conditions, or user-decision points
- allowed assists, including whether CLI, MCP, plugin, or subagent help is optional or required
- expected outputs or handoff artifacts
- validation or completion expectations

The `stack` field separates build-stack and run-stack playbooks. A build-stack playbook governs creating, changing, validating, or releasing documentation system assets. A run-stack playbook governs using an installed or already-available documentation workflow to operate on a downstream project. Both stacks use the same playbook contract, but they cannot silently substitute for each other. A runner must surface the stack in selection, validation, and handoff messages when there is any ambiguity.

"Run Playbook" is a generic execution model, not a plugin packaging rule. To run a playbook, an agent, CLI command, MCP tool, or future plugin must:

1. Select one playbook by explicit path, slug, or indexed catalog entry.
2. Validate required frontmatter and fail closed when `kind`, `persona`, or `stack` is missing or invalid.
3. Load referenced authority sources according to the playbook's stated authority order.
4. Resolve configuration overlays for labels, defaults, and presentation, while leaving lifecycle routing and artifact ownership to the governing design contracts.
5. Execute the playbook procedure step by step, stopping at gates and user-decision points unless the playbook explicitly allows unattended continuation.
6. Treat listed assists as optional capabilities unless the playbook marks an assist as required.
7. Record outputs only in the artifact, history, plan, work, or run-log surface named by the playbook or by the caller's explicit instruction.

Every playbook can be run by this generic model. A playbook may later be exposed through a plugin bundle, CLI affordance, MCP surface, or installed skill, but plugin exposure is additive. The content contract must not require one plugin per playbook and must not require a plugin for a playbook to be valid.

Support claims for run modes must be evidence-bound. If a playbook claims support for a surface such as CLI execution, MCP execution, plugin launch, template sync, or unattended operation, the implementation plan must define validation for that claim. Until conformance-lab or implementation evidence exists, broader support language should remain provisional.

The current `docs/library/playbooks/**` content is migration evidence, not the v2 home. Implementation planning should move or copy accepted playbooks into `docs/assets/playbooks/**`, then update any manifest, catalog, audit, backup, uninstall, installer, package-template, and template-sync behavior needed to keep packaged docs in parity.

## Alternatives Considered

One option was to make every playbook a plugin. That would make discovery and invocation uniform, but it conflates procedural content with packaging and would force lightweight persona guidance into plugin lifecycle concerns such as install, trust, updates, and uninstall.

Another option was to leave playbooks in `docs/library/playbooks/**`. That preserves the current dogfood path, but it conflicts with the v2 asset model and leaves packaged-template parity unclear.

A third option was to create separate contracts for build-stack and run-stack playbooks. That would make the distinction hard to miss, but it would duplicate schema, catalog, audit, and validation rules. A shared contract with a required `stack` discriminator gives the runner one model while preserving the operational boundary.

A fourth option was to defer Run Playbook entirely to the plugin substrate design. That would avoid designing an invocation model twice, but it would leave the next plugin design without a content boundary and would make it too easy to turn plugins into the only valid execution path.

## Consequences

The next Batch 4 design can focus on plugin substrate and bundles rather than deciding what a playbook is. It should treat plugin behavior as one exposure path for accepted playbooks, not as the source of truth for playbook validity.

Package and template work will need to account for `docs/assets/playbooks/**`. Future implementation plans should inspect template sync paths in `packages/docs/template` and `packages/cli/template`, package manifests, asset catalogs, audits, backup behavior, uninstall behavior, installer or skill behavior, and any CLI or MCP catalog surfaces that enumerate docs assets.

Validation should include metadata checks for required frontmatter, path/persona consistency checks, build-stack versus run-stack selection checks, package-template parity checks, and regression coverage for any manifest, audit, backup, uninstall, installer, CLI, MCP, or plugin behavior changed by implementation. Likely implementation validation includes `npm test -w packages/cli`, `npm run validate:defaults -w packages/cli`, `npm run build -w packages/cli`, `npm run smoke:pack`, and focused parity tests for packaged docs assets.

The design leaves PRD and risk-register state untouched. Batch reconciliation should decide whether R-012, Q-009, Q-012, Q-013, R-011, or R-014 need status changes after the full Batch 4 design set is accepted.

This decision creates a blocker removal for later designs: plugin substrate, product workflow bundles, and coverage/adversarial extensions can now depend on a concrete playbook content contract and generic execution model.

## Design Lineage

Update Mode: new-doc-related.

Prior Design Docs: [2026-06-19 New Docs Assets, Playbooks, and Persona Model](2026-06-19-new-docs-assets-playbooks-and-persona-model.md); [2026-06-17 Make-Docs Lifecycle Foundation](../assets/archive/designs/2026-06-17-make-docs-lifecycle-foundation.md); [2026-05-28 Make-Docs Lifecycle Playbook](../assets/archive/designs/2026-05-28-make-docs-lifecycle-playbook.md); [2026-06-20 Configuration and Convention Overlay](2026-06-20-configuration-and-convention-overlay.md); [2026-06-20 Shared Agentics Installation and Harness Redirection](2026-06-20-shared-agentics-installation-and-harness-redirection.md).

Reason: This design extends prior playbook and lifecycle intent into a v2 content contract and run model. It supersedes only artifact-level assumptions that treated the current `docs/library/playbooks/**` location or plugin packaging as sufficient; it does not supersede prior accepted design docs.

## Intended Follow-On

Route: change-plan.

Next Prompt: [designs-to-plan-change.prompt.md](../../.make-docs/references/system/prompts/designs-to-plan-change.prompt.md).

Why: The implementation will revise existing docs asset, template, manifest, audit, backup, uninstall, installer, and catalog behavior rather than create a brand-new repository baseline. Planning must preserve the lifecycle departure noted above by returning from this v2 design to the normal design -> plan -> PRD -> work -> implementation sequence.

Coordinate Handoff: W16 R0 P3 is the related completed lifecycle-playbook coordinate; superseded by [Playbook Contract and Model](2026-06-30-playbook-contract-and-model.md) at W18 R6 ([PRD 34](../prd/34-revise-playbook-contract-and-model.md)) and completed by [Run Playbook State Machine](2026-07-01-run-playbook-state-machine.md) at W18 R7 ([PRD 35](../prd/35-revise-run-playbook-state-machine.md)).

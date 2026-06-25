# 29 Revise Playbook Contract Run Playbook

## Purpose

Define the v2 contract for make-docs playbooks and the generic Run Playbook execution model that can operate on those playbooks without requiring every playbook to become a plugin.

## Change Type

Revision. This PRD extends the active docs-assets, persona, metadata, configuration, lifecycle, package validation, CLI/MCP, shared-agentics, and plugin-boundary requirements.

Route: `change-plan`

Coordinate: `W18 R1`

## Change Notes

This PRD turns the Playbook Contract and Run Playbook design into active requirements. It defines the content contract and generic execution model only; it does not define plugin substrate, product workflow bundles, MCP writes, or public plugin exposure.

## Requirements

### Canonical Playbook Location

V2 playbooks are persona-scoped docs assets.

The canonical v2 location is:

```text
docs/assets/playbooks/<persona-slug>/<playbook-slug>.md
```

The path is part of the contract. A playbook belongs to one owning persona namespace even when another persona consumes it as reference material.

The current `docs/library/playbooks/**` content is transitional dogfood and migration evidence, not the v2 home.

### Minimum Frontmatter

Every v2 playbook must declare:

```yaml
title: <human-readable title>
kind: playbook
status: proposed | accepted | deprecated
persona: <persona-slug>
stack: build | run
summary: <one-sentence purpose>
```

The generic Run Playbook model may depend only on these minimum fields plus normal Markdown headings unless a later accepted design adds required fields for a narrower surface.

`persona` must follow the persona schema from [22-revise-new-docs-assets-playbooks-persona-model.md](22-revise-new-docs-assets-playbooks-persona-model.md). Validators must report drift when file path and `persona` frontmatter disagree.

### Body Contract

A v2 playbook must remain readable documentation and must define:

- purpose and when to use it
- required inputs and authority order
- step-by-step procedure
- gates, stop conditions, or user-decision points
- allowed assists, including whether CLI, MCP, plugin, subagent, or skill help is optional or required
- expected outputs or handoff artifacts
- validation or completion expectations

### Stack Discriminator

`stack: build` governs creating, changing, validating, or releasing documentation system assets.

`stack: run` governs using an installed or already-available documentation workflow to operate on a downstream project.

Both stacks use the same playbook contract, but they cannot silently substitute for each other. A runner must surface the stack in selection, validation, and handoff messages when ambiguity exists.

### Generic Run Playbook Model

Run Playbook is a generic execution model, not a plugin packaging rule.

A Run Playbook surface must:

1. Select one playbook by explicit path, slug, or indexed catalog entry.
2. Validate required frontmatter and fail closed when `kind`, `persona`, or `stack` is missing or invalid.
3. Load referenced authority sources according to the playbook's stated authority order.
4. Resolve configuration overlays for labels, defaults, and presentation while preserving canonical lifecycle routing and artifact ownership.
5. Execute the playbook procedure step by step.
6. Stop at gates and user-decision points unless the playbook explicitly allows unattended continuation.
7. Treat listed assists as optional capabilities unless the playbook marks an assist as required.
8. Record outputs only in the artifact, history, plan, work, or run-log surface named by the playbook or by explicit caller instruction.

Every valid playbook can be run by this generic model.

### Plugin and Surface Boundary

A playbook may later be exposed through a plugin bundle, CLI affordance, MCP surface, or installed skill, but plugin exposure is additive.

The content contract must not require one plugin per playbook and must not require a plugin for a playbook to be valid.

[30-revise-harness-plugin-substrate-workflow-bundles.md](30-revise-harness-plugin-substrate-workflow-bundles.md) owns plugin substrate and workflow bundle metadata. Plugins may invoke Run Playbook, but they cannot redefine playbook storage, frontmatter, stack validation, authority order, output routing, or playbook validity.

If adversarial review is implemented as a playbook, it must follow this PRD's playbook content contract and the optional adversarial-review candidate contract from [31-revise-coverage-pass-extensions-adversarial-review.md](31-revise-coverage-pass-extensions-adversarial-review.md). Generic Run Playbook does not imply that adversarial review exists or runs by default.

Support claims for CLI execution, MCP execution, plugin launch, template sync, or unattended operation require validation evidence. Until conformance-lab or implementation evidence exists, support language must remain provisional.

### Template Package and Migration Boundary

Accepted shipped playbook defaults follow source-first template flow:

1. Author in `packages/docs/template/docs/assets/playbooks/**`.
2. Reseed repo-root dogfood `docs/assets/playbooks/**` for review.
3. Generate `packages/cli/template/**` through copy/prepack behavior.
4. Validate local dev and packed npm behavior.

Implementation planning should move or copy accepted transitional playbooks from `docs/library/playbooks/**` into `docs/assets/playbooks/**` with lineage preserved.

Manifest, catalog, audit, backup, uninstall, installer, CLI, MCP, and plugin behavior changes are required only when implementation changes how playbooks are shipped, selected, enumerated, or executed.

## Non-Requirements

- No plugin substrate or product workflow bundle contract in this PRD; [30-revise-harness-plugin-substrate-workflow-bundles.md](30-revise-harness-plugin-substrate-workflow-bundles.md) owns that boundary.
- No public plugin exposure decision.
- No one-plugin-per-playbook requirement.
- No adversarial-review playbook by default.
- No MCP write surface.
- No unattended execution by default.
- No broad migration of all current playbook content in this PRD-only round.

## Affected Baseline Docs

- [00 Make Docs PRD Index](00-index.md)
- [03 Open Questions and Risk Register](03-open-questions-and-risk-register.md)
- [05 Installation Profile and Manifest Lifecycle](05-installation-profile-and-manifest-lifecycle.md)
- [06 Template Contracts and Generated Assets](06-template-contracts-and-generated-assets.md)
- [09 Dogfood and Maintainer Operations](09-dogfood-and-maintainer-operations.md)
- [10 Packaging Validation and Release Reference](10-packaging-validation-and-release-reference.md)
- [14 Add Lifecycle Workflow Foundation](14-add-lifecycle-workflow-foundation.md)
- [19 Revise Template Package Dogfood Source of Truth Contract](19-revise-template-package-dogfood-source-of-truth-contract.md)
- [22 Revise New Docs Assets Playbooks Persona Model](22-revise-new-docs-assets-playbooks-persona-model.md)
- [23 Revise Generated Metadata Lifecycle Handoffs](23-revise-generated-metadata-lifecycle-handoffs.md)
- [24 Revise Configuration Convention Overlay](24-revise-configuration-convention-overlay.md)
- [25 Revise CLI Separation and MCP Boundary](25-revise-cli-separation-and-mcp-boundary.md)
- [28 Revise Shared Agentics Installation Harness Redirection](28-revise-shared-agentics-installation-harness-redirection.md)
- [30 Revise Harness Plugin Substrate Workflow Bundles](30-revise-harness-plugin-substrate-workflow-bundles.md)
- [31 Revise Coverage Pass Extensions Adversarial Review](31-revise-coverage-pass-extensions-adversarial-review.md)

## Acceptance Criteria

- Playbook path, minimum frontmatter, body, and stack rules are documented.
- Run Playbook validates frontmatter and fails closed on missing or invalid `kind`, `persona`, or `stack`.
- Build-stack and run-stack playbooks are selected and messaged distinctly.
- Plugin exposure is treated as additive, not required for playbook validity.
- Package/template validation covers accepted playbook defaults when shipped files change.
- Risk register entries keep playbook content separate from plugin invocation and support claims.

## Source Anchors

- [../designs/2026-06-20-playbook-contract-and-run-playbook.md](../designs/2026-06-20-playbook-contract-and-run-playbook.md)
- [../plans/2026-06-23-w18-r1-playbook-contract-run-playbook/00-overview.md](../plans/2026-06-23-w18-r1-playbook-contract-run-playbook/00-overview.md)
- [../work/2026-06-23-w18-r1-playbook-contract-run-playbook/00-index.md](../work/2026-06-23-w18-r1-playbook-contract-run-playbook/00-index.md)
- [22 Revise New Docs Assets Playbooks Persona Model](22-revise-new-docs-assets-playbooks-persona-model.md)
- [23 Revise Generated Metadata Lifecycle Handoffs](23-revise-generated-metadata-lifecycle-handoffs.md)
- [24 Revise Configuration Convention Overlay](24-revise-configuration-convention-overlay.md)
- [28 Revise Shared Agentics Installation Harness Redirection](28-revise-shared-agentics-installation-harness-redirection.md)
- [30 Revise Harness Plugin Substrate Workflow Bundles](30-revise-harness-plugin-substrate-workflow-bundles.md)
- [31 Revise Coverage Pass Extensions Adversarial Review](31-revise-coverage-pass-extensions-adversarial-review.md)
- `docs/library/playbooks/agent/make-docs-lifecycle.md`
- `.make-docs/contracts/system/coverage-pass-contract.md`
- `packages/cli/src/rules.ts`
- `packages/cli/src/catalog.ts`
- `packages/cli/src/manifest.ts`
- `packages/cli/src/audit.ts`
- `packages/cli/src/backup.ts`
- `packages/cli/src/uninstall.ts`
- `scripts/smoke-pack.mjs`
- [../designs/2026-06-20-harness-plugin-substrate-and-workflow-bundles.md](../designs/2026-06-20-harness-plugin-substrate-and-workflow-bundles.md)
- [../plans/2026-06-23-w18-r2-harness-plugin-substrate-workflow-bundles/00-overview.md](../plans/2026-06-23-w18-r2-harness-plugin-substrate-workflow-bundles/00-overview.md)
- [../designs/2026-06-20-coverage-pass-extensions-and-adversarial-review.md](../designs/2026-06-20-coverage-pass-extensions-and-adversarial-review.md)
- [../plans/2026-06-23-w18-r3-coverage-pass-extensions-adversarial-review/00-overview.md](../plans/2026-06-23-w18-r3-coverage-pass-extensions-adversarial-review/00-overview.md)

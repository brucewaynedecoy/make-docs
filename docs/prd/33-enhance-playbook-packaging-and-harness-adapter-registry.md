# 33 Enhance Playbook Packaging and Harness Adapter Registry

## Purpose

Add Playbook packaging and a harness adapter registry as required v2 capability so Make Docs can project portable Playbook source into reviewed harness-specific plugin or skills-bundle outputs without making packaging mandatory for Playbook validity.

## Change Type

Enhancement. This PRD extends the active Playbook, Run Playbook, plugin substrate, shared-agentics, CLI/MCP, conformance, lifecycle, package-validation, configuration, and adversarial-review requirements.

Route: `change-plan`

Coordinate: `W18 R5`

## Capability Addition or Enhancement

### Change Notes

- Superseded by [36-revise-playbook-packaging-compiler-and-harness-adapters.md](./36-revise-playbook-packaging-compiler-and-harness-adapters.md) for the output-kind interpretation and the accepted output shape. `outputKind` `plugin` now means the harness's richest native container (a plugin, an extension, or another container per the harness capability descriptor) and `skills-bundle` means the portable agents-standard skills form, and the accepted output is a real multi-file harness-native distributable, never a Make Docs descriptor. The reviewed pipeline, the `plugin`/`skills-bundle` output kinds themselves, and the `native`/`agents-standard`/`auto` surface model remain active here.

Make Docs must implement a reviewed Playbook packaging pipeline with deterministic rails. The pipeline turns one or more Playbooks into a package plan, routes the plan through a harness adapter, then writes accepted plugin or skills-bundle outputs with manifest ownership, provenance, lifecycle behavior, and validation.

Playbooks remain source artifacts under `docs/assets/playbooks/<persona>/<slug>.md`. Generated plugins, generated skills bundles, generated adapters, symlink exposures, copy mirrors, and export-only packages are distribution artifacts. A Playbook does not become a plugin because it can be packaged, and a Playbook remains valid without packaging.

The pipeline must support two first-class output kinds:

- `plugin`: a harness-visible plugin package or plugin payload.
- `skills-bundle`: a bundled set of harness-visible skills generated from one or more Playbooks or package-plan inputs.

The pipeline must also distinguish real harness ids from surface profiles:

- `native`: harness-specific location or packaging convention.
- `agents-standard`: generic standard skill location such as `.agents/skills/**` or `<user-home>/.agents/skills/**` when a real harness adapter supports it.
- `auto`: adapter-ranked selection across valid surfaces.

`generic` is not a harness id. Generic or standard locations are surfaces that a real harness adapter may support.

## Affected Baseline Docs

- [10 Packaging Validation and Release Reference](10-packaging-validation-and-release-reference.md)
- [20 Revise Agent Harness Model Conformance Lab](20-revise-agent-harness-model-conformance-lab.md)
- [24 Revise Configuration Convention Overlay](24-revise-configuration-convention-overlay.md)
- [25 Revise CLI Separation and MCP Boundary](25-revise-cli-separation-and-mcp-boundary.md)
- [28 Revise Shared Agentics Installation Harness Redirection](28-revise-shared-agentics-installation-harness-redirection.md)
- [29 Revise Playbook Contract Run Playbook](29-revise-playbook-contract-run-playbook.md)
- [30 Revise Harness Plugin Substrate Workflow Bundles](30-revise-harness-plugin-substrate-workflow-bundles.md)
- [31 Revise Coverage Pass Extensions Adversarial Review](31-revise-coverage-pass-extensions-adversarial-review.md)
- [32 Revise Lifecycle Backup State and Agentics Pruning](32-revise-lifecycle-backup-state-agentics-pruning.md)
- [00 Make Docs PRD Index](00-index.md)
- [03 Open Questions and Risk Register](03-open-questions-and-risk-register.md)

## Contracts and Data

### Change Notes

- Enhanced by [34-revise-playbook-contract-and-model.md](./34-revise-playbook-contract-and-model.md).
- Superseded by [36-revise-playbook-packaging-compiler-and-harness-adapters.md](./36-revise-playbook-packaging-compiler-and-harness-adapters.md) for the adapter `path templates` declaration and the descriptor-era output writer. Adapter paths, manifest shapes, and registration steps must be verified against the real harness and carried in a harness capability descriptor with a verification reference and status, and the output writer produces the W18 R8 multi-file harness-native distributable inventory with per-kind dependency materialization and a generate-but-do-not-auto-register marketplace seam. The package-plan record, deterministic rails, agent-assistance limits, adapter-registry modularity, provenance, and lifecycle behavior in this section remain active.

The package planner must produce a reviewable package plan before writes. The plan must record source Playbook refs, source digests, package id, title, summary, output kind, target harness, selected surface, scope, generated artifact inventory, deterministic derivations, agent-assisted proposals, unresolved decisions, review status, support status, lifecycle behavior, and validation requirements.

Deterministic rails include source parsing, frontmatter validation, persona/slug resolution, stack validation, asset and relative-link validation, ownership classification, source digest calculation, adapter compatibility checks, output inventory planning, manifest provenance, audit classification, backup-before-destructive-change behavior, safe uninstall behavior, and package/conformance validation.

Agent assistance is allowed only for package-plan drafting when semantic judgment is needed. Agents may propose descriptions, prompt text, command labels, skill grouping, package summaries, or adapter prose. Non-interactive runs must fail before writing if the plan requires semantic review, unresolved user decisions, ambiguous ownership, unsafe rewrites, unsupported surfaces, or missing conformance evidence.

The harness adapter registry must make harness support modular. Each adapter declares harness id, supported output kinds, supported surfaces, path templates, project/global/export scopes, preconditions, preferred exposure mode, fallback mode, ownership classes, audit/backup/uninstall rules, and conformance scenarios. Adding a future harness should primarily add a new adapter module, fixtures, and conformance evidence rather than editing the package planner.

Generated outputs must carry provenance to source Playbook refs and digests. Manifest and audit records must distinguish source Playbooks, generated plugins, generated skills bundles, generated adapters, symlink exposures, copy mirrors, export-only files, user-authored files, and legacy generated outputs.

## Integration Impact

### Change Notes

- Enhanced by [37-enhance-playbook-and-package-conformance.md](./37-enhance-playbook-and-package-conformance.md). The provisional support claims for generated plugin and skills-bundle outputs are now promotable through the W18 R9 tuple registry under `docs/assets/conformance/`: a public claim may advance only when its exact scenario/harness/surface/scope/output-kind/generated-output-kind/model-or-provider/runtime tuple reaches `conformance-validated` via the install-discover-invoke-uninstall evidence bar, and internal tests never count as harness-recognition evidence.
- Superseded by [42-revise-conformance-asset-home-relocation.md](./42-revise-conformance-asset-home-relocation.md), registry home only: the tuple registry relocated on 2026-07-06 from `docs/assets/conformance/` to the repo-root `conformance/` directory (register item D-022). The promotion path itself is unchanged.

[29-revise-playbook-contract-run-playbook.md](29-revise-playbook-contract-run-playbook.md) remains the source and runner contract. W18 R5 requires W18 R1 implementation to preserve packaging-ready metadata and validation hooks, but not to make every Playbook packaged by default.

[30-revise-harness-plugin-substrate-workflow-bundles.md](30-revise-harness-plugin-substrate-workflow-bundles.md) remains the plugin substrate and workflow-bundle contract. W18 R5 requires W18 R2 implementation to avoid one-bundle-equals-one-plugin assumptions and to support generated-from-Playbook metadata.

[28-revise-shared-agentics-installation-harness-redirection.md](28-revise-shared-agentics-installation-harness-redirection.md) remains the shared selected-agentics storage and native exposure contract. Generated plugin and skills-bundle installs must reuse shared payload stores, symlink-preferred native exposure, managed copy-mirror fallback, and legacy-output migration rules.

[25-revise-cli-separation-and-mcp-boundary.md](25-revise-cli-separation-and-mcp-boundary.md) remains the TypeScript operation-domain and MCP parity contract. The package planner, adapter registry, surface resolver, output writers, and lifecycle operations must be modular TypeScript domains that CLI, MCP, plugin, skill, or agent surfaces can call.

[20-revise-agent-harness-model-conformance-lab.md](20-revise-agent-harness-model-conformance-lab.md) remains the support-claim evidence contract. Public support for generated plugin or skills-bundle outputs requires conformance or implementation evidence for the exact Playbook/package-plan/output-kind/harness/surface/scope/model-provider/runtime tuple.

## Required Baseline Annotations

- [29-revise-playbook-contract-run-playbook.md](29-revise-playbook-contract-run-playbook.md): add W18 R5 to change notes, plugin/surface boundary, non-requirements, and acceptance criteria.
- [30-revise-harness-plugin-substrate-workflow-bundles.md](30-revise-harness-plugin-substrate-workflow-bundles.md): add W18 R5 to change notes, plugin metadata, workflow bundle metadata, Playbook boundary, package validation, non-requirements, and acceptance criteria.
- [25-revise-cli-separation-and-mcp-boundary.md](25-revise-cli-separation-and-mcp-boundary.md): add W18 R5 to operation-domain and CLI/MCP parity expectations.
- [28-revise-shared-agentics-installation-harness-redirection.md](28-revise-shared-agentics-installation-harness-redirection.md): add generated package outputs to plugin inheritance and manifest ownership expectations.
- [20-revise-agent-harness-model-conformance-lab.md](20-revise-agent-harness-model-conformance-lab.md): add generated package output tuples to support-claim gating.
- [24-revise-configuration-convention-overlay.md](24-revise-configuration-convention-overlay.md): keep package-plan schemas, adapters, generated artifact paths, and support claims out of project config while allowing reviewed harness capability hints to inform package planning.
- [10-packaging-validation-and-release-reference.md](10-packaging-validation-and-release-reference.md): add package proof for generated plugin and skills-bundle outputs.
- [31-revise-coverage-pass-extensions-adversarial-review.md](31-revise-coverage-pass-extensions-adversarial-review.md): require W18 R5 when adversarial-review surfaces are packaged as plugins, skills bundles, or generated harness entries.
- [32-revise-lifecycle-backup-state-agentics-pruning.md](32-revise-lifecycle-backup-state-agentics-pruning.md): ensure generated package outputs inherit backup, uninstall, preservation, and pruning safety.
- [03-open-questions-and-risk-register.md](03-open-questions-and-risk-register.md): add a risk for source/generated package boundary drift without reopening the closed Playbook/plugin boundary.
- [00-index.md](00-index.md): add PRD 33 to reading order, document map, source anchors, audience paths, and intended follow-on.

## Acceptance Criteria

- Playbook packaging is required for v2 while Playbooks remain valid without packaging.
- `plugin` and `skills-bundle` are first-class package output kinds.
- `native`, `agents-standard`, and `auto` are surfaces or surface-selection modes, not harness ids.
- The package planner creates reviewable package plans before writes.
- Deterministic validation, writes, manifest provenance, audit, backup, uninstall, and package validation remain CLI/MCP/shared-operation owned.
- Agent assistance is limited to reviewed semantic package-plan drafting.
- Harness-specific behavior lives in adapter modules with fixtures and conformance scenarios.
- Generated outputs carry provenance from source Playbook refs and digests.
- Generated plugins and skills bundles reuse shared-agentics storage and lifecycle safety where installed.
- Public support claims remain evidence-bound to exact generated-output tuples.
- W18 R1, W18 R2, and W18 R3 backlogs consume W18 R5 before implementing runner, plugin, bundle, or adversarial-review package behavior.

## Source Anchors

- [../designs/2026-06-29-playbook-packaging-and-harness-adapter-registry.md](../designs/2026-06-29-playbook-packaging-and-harness-adapter-registry.md)
- [../plans/2026-06-29-w18-r5-playbook-packaging-and-harness-adapter-registry/00-overview.md](../plans/2026-06-29-w18-r5-playbook-packaging-and-harness-adapter-registry/00-overview.md)
- [../work/2026-06-29-w18-r5-playbook-packaging-and-harness-adapter-registry/00-index.md](../work/2026-06-29-w18-r5-playbook-packaging-and-harness-adapter-registry/00-index.md)
- [29 Revise Playbook Contract Run Playbook](29-revise-playbook-contract-run-playbook.md)
- [30 Revise Harness Plugin Substrate Workflow Bundles](30-revise-harness-plugin-substrate-workflow-bundles.md)
- [28 Revise Shared Agentics Installation Harness Redirection](28-revise-shared-agentics-installation-harness-redirection.md)
- [25 Revise CLI Separation and MCP Boundary](25-revise-cli-separation-and-mcp-boundary.md)
- [24 Revise Configuration Convention Overlay](24-revise-configuration-convention-overlay.md)
- [20 Revise Agent Harness Model Conformance Lab](20-revise-agent-harness-model-conformance-lab.md)
- [32 Revise Lifecycle Backup State and Agentics Pruning](32-revise-lifecycle-backup-state-agentics-pruning.md)
- [31 Revise Coverage Pass Extensions Adversarial Review](31-revise-coverage-pass-extensions-adversarial-review.md)
- `docs/assets/playbooks/agent/make-docs-lifecycle.md`
- `docs/assets/library/developer/playbooks-development-runner-architecture.md`
- `docs/assets/library/user/playbooks-running-make-docs-workflows.md`
- `packages/cli/src/operations/playbook.ts`
- `packages/cli/src/operations/plugin.ts`
- `packages/cli/src/manifest.ts`
- `packages/cli/src/audit.ts`
- `packages/cli/src/backup.ts`
- `packages/cli/src/uninstall.ts`
- `scripts/smoke-pack.mjs`

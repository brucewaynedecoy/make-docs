# 30 Revise Harness Plugin Substrate Workflow Bundles

## Purpose

Define the v2 plugin substrate for supported agent harnesses and separate that substrate from workflow bundles such as Idea/Brainstorm, Scaffold, Change Request/Iterate, and Use/Run.

## Change Type

Revision. This PRD extends the active shared-agentics, playbook, manifest, skills, configuration, package validation, compatibility, CLI/MCP, no-scripts, and conformance requirements.

Route: `change-plan`

Coordinate: `W18 R2`

## Change Notes

This PRD turns the Harness Plugin Substrate and Workflow Bundles design into active requirements. It defines plugin substrate and bundle metadata only; it does not make plugins default, does not make plugin packaging mandatory for playbooks, and does not close per-bundle UX decisions that still need implementation or bundle-specific planning.

## Requirements

### Plugin Definition and Boundary

A v2 plugin is a harness-visible invocation package. It is not a playbook, not a lifecycle artifact, and not a substitute behavior model.

A plugin may wrap a built-in workflow, invoke the generic Run Playbook model, expose one or more playbooks, present a guided entrypoint for a productized workflow bundle, or delegate deterministic behavior to CLI/MCP/shared-core operations. The governing contracts remain the accepted docs, lifecycle, manifest, configuration, audit, package, CLI/MCP, conformance, and playbook requirements.

### Canonical Plugin Payload Store

Selected plugin payloads are installed once into the shared make-docs-owned selected-agentics store:

- project scope: `.make-docs/agentics/plugins/<plugin-id>/`
- global scope: the user's home-scoped `.make-docs/agentics/plugins/<plugin-id>/`

Supported harnesses receive generated exposure files or adapters, not duplicated authoritative plugin payloads. Codex and Claude Code are the initial supported harness targets because they are the current make-docs harnesses.

The generated exposure file is the harness boundary. The canonical plugin payload remains in the shared selected-agentics store. Symlinks are not the v2 default.

### Plugin Metadata and Manifest Ownership

The manifest schema must grow structured agentic ownership records instead of overloading skill-only state indefinitely.

Plugin records must identify:

- canonical plugin id, title, summary, status, source manifest, source ref or version, digest, provenance, trust policy, supported harnesses, and scope
- canonical payload files under `.make-docs/agentics/plugins/<plugin-id>/`
- generated harness exposure files and their target canonical payload
- exposure mode, with `generated-stub` or an equivalent generated-adapter value as the default
- invocation metadata describing whether the plugin wraps a built-in workflow, one or more playbooks, generic Run Playbook, or a CLI/MCP operation
- bundle metadata when the plugin belongs to a productized workflow bundle
- permission and safety metadata describing whether the plugin is read-only, request-capture only, plan-first, dry-run first, temp-fixture only, or write-capable after explicit approval
- support metadata distinguishing `provisional`, `implementation-validated`, and `conformance-validated` claims per harness and, where applicable, model/provider tuple

Until the schema exists, transitional records may be used, but audit, backup, uninstall, dry-run output, and migration diagnostics must preserve the distinction between canonical plugin payloads and generated harness exposure files.

### Explicit Plugin Selection

Plugin selection is explicit.

Bare install and default sync install no plugins. `--selected-skills all` and existing skill-selection affordances do not imply plugin installation.

Plugin installation requires a future accepted plugin selection flow, an effective plugin manifest, or explicit user instruction. Reconfigure and sync preserve existing selected plugins unless the user changes the selection or an accepted migration plan defines a reviewed transition.

### Lifecycle and Operation Ownership

Plugin lifecycle behavior follows the TypeScript package runtime and modular operation-domain surface.

Install, update, sync, reconfigure, backup, audit, uninstall, migration review, package validation, and conflict handling remain TypeScript CLI-owned. A plugin may call MCP or shared-core operations only through accepted operation contracts.

A plugin must not carry independent deterministic logic that bypasses no-scripts migration or creates a second implementation of manifest, configuration, audit, backup, uninstall, generation, validation, or lifecycle routing behavior.

### Update, Migration, Audit, Backup, and Uninstall

Update behavior reconciles selected plugins against the effective plugin manifest and manifest-owned state.

A clean managed plugin payload or generated exposure file may be updated in place. A modified managed payload, modified generated exposure file, malformed manifest, missing-manifest ambiguous state, or user-authored harness plugin must flow through review, backup, skip, or manual-resolution paths.

Migration and update must never infer ownership over a user-authored harness file just because its name matches a make-docs plugin id.

Uninstall removes only reviewed, make-docs-owned plugin payloads and generated exposure files. Backup and uninstall must consume one reviewed audit snapshot before destructive removal. Empty make-docs-owned plugin directories may be pruned only when audit proves there are no unmanaged descendants.

### Configuration Boundary

Configuration overlays are rendering inputs, not routing authority.

A project may relabel "designs" as "ideas" or change user-facing persona labels, but plugins still route through canonical paths, kind values, lifecycle route identifiers, prompt paths, plugin ids, playbook ids, skill names, harness names, and manifest keys.

A plugin may display configured labels after canonical resolution. It cannot use configuration to rename the structure it reads or writes.

### Workflow Bundle Metadata

Workflow bundles are products on top of the plugin substrate.

Initial v2 bundle families are:

- Idea/Brainstorm: captures and refines an idea or request into a lifecycle-ready input. It is request-capture or plan-first by default and must not silently mutate build-stack artifacts.
- Scaffold: creates or expands a make-docs documentation system from accepted inputs. It is maintainer-facing by default unless a later bundle plan defines constrained non-maintainer behavior with explicit gates.
- Change Request/Iterate: captures a bounded change request and, when authorized, routes it through design, plan, PRD, work, and implementation according to lifecycle contracts. It must distinguish "file a request" from "make the change" in metadata and UI.
- Use/Run: exposes run-stack workflows for users operating an installed or already-available system. It may call the generic Run Playbook model, but it cannot redefine playbook storage or make a plugin mandatory for playbook validity.

Every productized bundle must declare its audience and exposure boundary. At minimum, bundle metadata must identify whether the workflow is maintainer-only, non-maintainer request-capture, non-maintainer guided-change, or end-user run-stack usage.

Non-maintainer plugins are sanctioned entrypoints with explicit gates, not hidden write channels into lifecycle artifacts. Q-013 remains open for exact per-bundle UX.

### Playbook Boundary

Playbook requirements remain governed by [29-revise-playbook-contract-run-playbook.md](29-revise-playbook-contract-run-playbook.md).

A plugin may invoke one playbook, offer a catalog of playbooks, or wrap a built-in workflow that is not authored as a playbook. A playbook remains persona-scoped content under `docs/assets/playbooks/<persona-slug>/<playbook-slug>.md`; it does not become a plugin because a plugin can run it.

### Support Claims

Support claims are evidence-bound.

Public language about plugin, bundle, playbook, skill, harness, CLI, MCP, unattended, or model/provider support must cite implementation validation or conformance-lab evidence. Until [20-revise-agent-harness-model-conformance-lab.md](20-revise-agent-harness-model-conformance-lab.md) has scenario records for a plugin/harness/model tuple, support wording for that tuple must remain provisional.

If adversarial review is implemented as a plugin or workflow bundle, it must remain explicit-selection only and must follow [31-revise-coverage-pass-extensions-adversarial-review.md](31-revise-coverage-pass-extensions-adversarial-review.md). Bare install, default sync, generic Run Playbook, and plugin selection do not imply adversarial review.

### Package and Validation Boundary

Package validation must prove plugin behavior without accidentally shipping the wrong assets.

If first-party plugin payloads or plugin manifests become shipped assets, implementation must decide their source location and package inclusion rules using the template/package source-of-truth order from [19-revise-template-package-dogfood-source-of-truth-contract.md](19-revise-template-package-dogfood-source-of-truth-contract.md).

Conformance-lab records, generated local run artifacts, and unreviewed local plugin outputs must not be placed into `packages/docs/template/`, `packages/cli/template/`, npm tarballs, or future runtime packages by accident.

Baseline implementation validation should include `npm run build -w packages/cli`, `npm test -w packages/cli`, `npm run validate:defaults -w packages/cli`, `npm run smoke:pack`, and targeted plugin substrate tests.

## Non-Requirements

- No default plugin installation.
- No skill-selection flag that implicitly selects plugins.
- No one-plugin-per-playbook requirement.
- No plugin requirement for playbook validity.
- No default adversarial-review plugin, workflow bundle, or plugin-selection implication.
- No symlink-based default behavior.
- No MCP write surface implementation in this PRD.
- No closure of per-bundle UX details for request-vs-change, docs visibility, scaffold exposure, or exact non-maintainer flows.
- No remote-versus-bundled skills delivery decision.

## Affected Baseline Docs

- [00 Make Docs PRD Index](00-index.md)
- [03 Open Questions and Risk Register](03-open-questions-and-risk-register.md)
- [08 Skills Catalog and Distribution](08-skills-catalog-and-distribution.md)
- [10 Packaging Validation and Release Reference](10-packaging-validation-and-release-reference.md)
- [16 Revise Package and Deployment Boundaries](16-revise-package-and-deployment-boundaries.md)
- [18 Revise Compatibility Audit and Migration Disposition](18-revise-compatibility-audit-and-migration-disposition.md)
- [20 Revise Agent Harness Model Conformance Lab](20-revise-agent-harness-model-conformance-lab.md)
- [21 Revise Tool Directory System Custom Resource Tiers](21-revise-tool-directory-system-custom-resource-tiers.md)
- [24 Revise Configuration Convention Overlay](24-revise-configuration-convention-overlay.md)
- [25 Revise CLI Separation and MCP Boundary](25-revise-cli-separation-and-mcp-boundary.md)
- [27 Revise Skill Purpose Registry Alternate Skills Manifest](27-revise-skill-purpose-registry-alternate-skills-manifest.md)
- [28 Revise Shared Agentics Installation Harness Redirection](28-revise-shared-agentics-installation-harness-redirection.md)
- [29 Revise Playbook Contract Run Playbook](29-revise-playbook-contract-run-playbook.md)
- [31 Revise Coverage Pass Extensions Adversarial Review](31-revise-coverage-pass-extensions-adversarial-review.md)

## Acceptance Criteria

- Plugin payloads install under `.make-docs/agentics/plugins/<plugin-id>/` per selected scope.
- Codex and Claude Code receive generated plugin exposure files or adapters rather than duplicated authoritative payloads.
- Manifest, audit, backup, uninstall, dry-run, and migration output distinguish canonical plugin payloads from generated harness exposures.
- Bare install, default sync, and selected-skill flows write no plugin files.
- Modified/custom harness plugin files are preserved or reviewed rather than inferred as make-docs-owned.
- Workflow bundle metadata declares audience, exposure boundary, safety mode, and whether the flow captures a request or makes a change.
- Plugin support claims remain provisional until implementation or conformance evidence exists for the exact tuple claimed.
- Playbooks remain valid without plugin packaging.
- Adversarial review remains explicit-selection only if exposed through a plugin or workflow bundle.

## Source Anchors

- [../designs/2026-06-20-harness-plugin-substrate-and-workflow-bundles.md](../designs/2026-06-20-harness-plugin-substrate-and-workflow-bundles.md)
- [../plans/2026-06-23-w18-r2-harness-plugin-substrate-workflow-bundles/00-overview.md](../plans/2026-06-23-w18-r2-harness-plugin-substrate-workflow-bundles/00-overview.md)
- [../work/2026-06-23-w18-r2-harness-plugin-substrate-workflow-bundles/00-index.md](../work/2026-06-23-w18-r2-harness-plugin-substrate-workflow-bundles/00-index.md)
- [20 Revise Agent Harness Model Conformance Lab](20-revise-agent-harness-model-conformance-lab.md)
- [21 Revise Tool Directory System Custom Resource Tiers](21-revise-tool-directory-system-custom-resource-tiers.md)
- [24 Revise Configuration Convention Overlay](24-revise-configuration-convention-overlay.md)
- [25 Revise CLI Separation and MCP Boundary](25-revise-cli-separation-and-mcp-boundary.md)
- [28 Revise Shared Agentics Installation Harness Redirection](28-revise-shared-agentics-installation-harness-redirection.md)
- [29 Revise Playbook Contract Run Playbook](29-revise-playbook-contract-run-playbook.md)
- [31 Revise Coverage Pass Extensions Adversarial Review](31-revise-coverage-pass-extensions-adversarial-review.md)
- [../designs/2026-06-20-coverage-pass-extensions-and-adversarial-review.md](../designs/2026-06-20-coverage-pass-extensions-and-adversarial-review.md)
- [../plans/2026-06-23-w18-r3-coverage-pass-extensions-adversarial-review/00-overview.md](../plans/2026-06-23-w18-r3-coverage-pass-extensions-adversarial-review/00-overview.md)
- `packages/cli/src/types.ts`
- `packages/cli/src/profile.ts`
- `packages/cli/src/manifest.ts`
- `packages/cli/src/skill-catalog.ts`
- `packages/cli/src/skill-registry.ts`
- `packages/cli/src/skill-resolver.ts`
- `packages/cli/src/skills-command.ts`
- `packages/cli/src/skills-ui.ts`
- `packages/cli/src/planner.ts`
- `packages/cli/src/install.ts`
- `packages/cli/src/audit.ts`
- `packages/cli/src/backup.ts`
- `packages/cli/src/uninstall.ts`
- `scripts/smoke-pack.mjs`

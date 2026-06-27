# 27 Revise Skill Purpose Registry Alternate Skills Manifest

## Purpose

Decide how make-docs v2 makes skill selection purpose-led without making first-party skills mandatory. This design defines stable purpose ids, the alternate skills manifest contract, source and trust display rules, and the boundary between skill selection metadata and the existing selected-skill install state.

## Change Type

Revision. This PRD extends the active skills catalog, selected-skill, CLI, package validation, compatibility, configuration, CLI/MCP, and no-scripts requirements.

Route: `change-plan`

Coordinate: `W17 R1`

## Change Notes

This PRD turns the purpose-registry and alternate-manifest design into active requirements. It does not make first-party skills required or default-installed, and it does not close the broader long-term bundled-local versus remote-fetch skills delivery question.

Implementation evidence as of W17 R1 Phase 4: the TypeScript CLI ships the evolved first-party skills manifest and schema, accepts alternate local skills manifests, expands `all` against the effective manifest, rejects unpinned remote manifests and unpinned remote skill payloads before mutation, persists manifest and selected-skill provenance, exposes that provenance through audit, backup, uninstall, and compatibility review surfaces, and validates bare install, explicit first-party skill, alternate local-manifest, and package-smoke behavior through CLI tests and `npm run smoke:pack`.

## Requirements

### Purpose-Led Skill Selection

The CLI should let users choose by stable purpose first and concrete skill second. Purpose-led selection is metadata and presentation over the selected-skill model, not a replacement for it.

The first-party purpose ids are:

- `archive-management`
- `codebase-decomposition`
- `documentation-maintenance`
- `lifecycle-closeout`
- `workflow-execution`
- `plan-creation`
- `migration-support`

First-party purpose ids are canonical make-docs ids. Configuration overlays may relabel visible text, but CLI, MCP, plugin, manifest, and skill routing must use canonical purpose ids.

Alternate manifests may define additional purpose ids only when they are namespaced, such as `acme.release-readiness`.

### Skills Manifest Shape

The built-in first-party registry becomes the default skills manifest in logical terms. The physical file may remain `packages/cli/skill-registry.json` during implementation, but the schema must evolve toward one shape that can describe built-in and alternate manifests.

A skills manifest must include:

- `schemaVersion`
- `manifestId`
- `displayName` and optional description
- `purposes` with stable ids, labels, descriptions, and optional ordering
- `skills` with stable skill name, display metadata, purpose ids, source, entry point, install name, assets, supported harnesses, and provenance metadata
- `sourcePolicy` declaring whether the manifest is first-party, local, or remote-pinned

One skill may satisfy multiple purposes, and one purpose may offer multiple candidate skills.

### Selection Behavior

Purpose-led selection must show the purpose, each candidate skill, skill source, supported harnesses, and trust/provenance before selection.

If multiple skills satisfy the same purpose, the UI must not silently choose one unless the active manifest marks exactly one default candidate for that purpose and the user has explicitly opted into skills.

The install manifest remains behavior-first:

- `selectedSkills` stores resolved skill names that should be installed.
- `skillFiles` remains the managed-output ownership list.
- Selection provenance may record selected purpose id, manifest id, candidate skill, source policy class, and source provenance for review, reconfigure, audit, backup, uninstall, and support.
- Selection provenance does not replace `selectedSkills` or `skillFiles`.
- [28-revise-shared-agentics-installation-harness-redirection.md](28-revise-shared-agentics-installation-harness-redirection.md) consumes the resolved effective manifest and selection provenance when writing shared payloads and native harness exposures. Agentic ownership records should preserve manifest id, purpose id, skill name, source policy, digest/ref, scope, canonical payload path, symlink exposure paths, copy-mirror paths, and legacy generated stub paths without replacing `selectedSkills`.
- [30-revise-harness-plugin-substrate-workflow-bundles.md](30-revise-harness-plugin-substrate-workflow-bundles.md) may let future plugin and workflow bundle surfaces present purpose metadata, but plugin selection remains explicit and separate from `selectedSkills`; skills-manifest purpose ids do not become plugin ids or bundle ids.

### Alternate Manifests

Alternate manifests are explicit inputs, not ambient discovery. A run uses one effective skills manifest: the built-in first-party manifest unless the user supplies an alternate manifest.

make-docs does not automatically merge the built-in manifest into an alternate manifest. If an alternate manifest wants first-party skills, it must include entries for them with first-party provenance.

`--selected-skills all` expands to every selectable skill in the effective manifest after validation. It must not mean every known first-party skill when an alternate manifest is active.

`--selected-skills none` remains an empty selected-skill set.

Bare default installs continue to produce no skill files.

### Source and Trust Policy

File-path alternate manifests are the first supported implementation target.

URL manifests are valid for installation only when the source can be treated as remote-pinned: the manifest reference or caller must supply an immutable ref plus a manifest digest.

Mutable branches such as `main`, unauthenticated HTTP, and unpinned remote manifests are invalid for v2 alternate-manifest installation. The CLI may preview rejected manifests enough to explain the policy failure, but it must not install from them.

Remote skill payload sources inside any manifest follow the same trust rule: immutable ref plus integrity metadata before installation.

Local file sources are allowed only when explicitly supplied by the user and must be displayed as local/custom before selection.

Third-party sources must be labeled third-party even when they satisfy a first-party purpose id.

### No-Scripts Boundary

Purpose metadata may explain why a skill is useful, but it must not become a second source of deterministic workflow logic. Deterministic make-docs-owned behavior still belongs behind CLI/shared-core operations under [26-revise-no-scripts-migration-skill-refactor.md](26-revise-no-scripts-migration-skill-refactor.md).

### Validation Boundary

Implementation must prove:

- default installs still produce no skill files
- explicit first-party skill installs still work
- alternate file-manifest installs work
- unpinned URL manifests are rejected before installation
- remote-pinned URL manifests work only if implemented with immutable refs and digest checks
- remote skill payloads require immutable refs and integrity metadata
- `--selected-skills all` and `none` are interpreted against the effective manifest
- audit, backup, uninstall, and migration explain alternate-manifest and selection provenance
- package contents include the evolved schema and validation fixtures

## Non-Requirements

- No required or default first-party skills.
- No ambient alternate-manifest discovery.
- No automatic merge of built-in and alternate manifests.
- No closure of Q-001's bundled-local versus remote-fetch delivery decision.
- No closure of plugin runtime implementation parity, per-bundle public UX, or remote-versus-bundled skills delivery.
- No permission for configured labels to replace canonical purpose ids.
- No deterministic workflow logic in purpose metadata.

## Affected Baseline Docs

- [07 CLI Command Surface and Lifecycle](07-cli-command-surface-and-lifecycle.md)
- [08 Skills Catalog and Distribution](08-skills-catalog-and-distribution.md)
- [10 Packaging Validation and Release Reference](10-packaging-validation-and-release-reference.md)
- [12 Revise CLI Skill Selection Simplification](12-revise-cli-skill-selection-simplification.md)
- [16 Revise Package and Deployment Boundaries](16-revise-package-and-deployment-boundaries.md)
- [18 Revise Compatibility Audit and Migration Disposition](18-revise-compatibility-audit-and-migration-disposition.md)
- [24 Revise Configuration Convention Overlay](24-revise-configuration-convention-overlay.md)
- [25 Revise CLI Separation and MCP Boundary](25-revise-cli-separation-and-mcp-boundary.md)
- [26 Revise No-Scripts Migration Skill Refactor](26-revise-no-scripts-migration-skill-refactor.md)
- [28 Revise Shared Agentics Installation Harness Redirection](28-revise-shared-agentics-installation-harness-redirection.md)
- [30 Revise Harness Plugin Substrate Workflow Bundles](30-revise-harness-plugin-substrate-workflow-bundles.md)

## Acceptance Criteria

- Purpose ids are stable, canonical, and not configurable routing identifiers.
- Built-in and alternate manifests share one validated manifest shape.
- One effective manifest is active per run.
- `selectedSkills` and `skillFiles` remain the executable and ownership state.
- Source and trust policy rejects unpinned remote manifests and unpinned remote skill payloads before install.
- Bare installs remain skill-free.
- Package and lifecycle validation covers effective-manifest selection, provenance, and rejection paths.

## Source Anchors

- [../designs/2026-06-20-skill-purpose-registry-and-alternate-skills-manifest.md](../designs/2026-06-20-skill-purpose-registry-and-alternate-skills-manifest.md)
- [../plans/2026-06-23-w17-r1-skill-purpose-registry-alternate-skills-manifest/00-overview.md](../plans/2026-06-23-w17-r1-skill-purpose-registry-alternate-skills-manifest/00-overview.md)
- [../work/2026-06-23-w17-r1-skill-purpose-registry-alternate-skills-manifest/00-index.md](../work/2026-06-23-w17-r1-skill-purpose-registry-alternate-skills-manifest/00-index.md)
- [08 Skills Catalog and Distribution](08-skills-catalog-and-distribution.md)
- [12 Revise CLI Skill Selection Simplification](12-revise-cli-skill-selection-simplification.md)
- [26 Revise No-Scripts Migration Skill Refactor](26-revise-no-scripts-migration-skill-refactor.md)
- [28 Revise Shared Agentics Installation Harness Redirection](28-revise-shared-agentics-installation-harness-redirection.md)
- [30 Revise Harness Plugin Substrate Workflow Bundles](30-revise-harness-plugin-substrate-workflow-bundles.md)
- [../designs/2026-06-20-shared-agentics-installation-and-harness-redirection.md](../designs/2026-06-20-shared-agentics-installation-and-harness-redirection.md)
- [../plans/2026-06-23-w17-r2-shared-agentics-installation-harness-redirection/00-overview.md](../plans/2026-06-23-w17-r2-shared-agentics-installation-harness-redirection/00-overview.md)
- [../designs/2026-06-20-harness-plugin-substrate-and-workflow-bundles.md](../designs/2026-06-20-harness-plugin-substrate-and-workflow-bundles.md)
- [../plans/2026-06-23-w18-r2-harness-plugin-substrate-workflow-bundles/00-overview.md](../plans/2026-06-23-w18-r2-harness-plugin-substrate-workflow-bundles/00-overview.md)
- `packages/cli/skill-registry.json`
- `packages/cli/skill-registry.schema.json`
- `packages/cli/src/cli.ts`
- `packages/cli/src/skills-command.ts`
- `packages/cli/src/skills-ui.ts`
- `packages/cli/src/skill-registry.ts`
- `packages/cli/src/skill-resolver.ts`
- `packages/cli/src/skill-catalog.ts`
- `packages/cli/src/manifest.ts`
- `packages/cli/src/audit.ts`
- `packages/cli/src/backup.ts`
- `packages/cli/src/uninstall.ts`
- `packages/cli/tests/skill-registry.test.ts`
- `packages/cli/tests/skill-catalog.test.ts`
- `packages/cli/tests/skills-ui.test.ts`
- `packages/cli/tests/install.test.ts`
- `scripts/smoke-pack.mjs`

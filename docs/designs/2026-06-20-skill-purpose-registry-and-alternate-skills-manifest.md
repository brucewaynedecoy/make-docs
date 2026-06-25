# Skill Purpose Registry and Alternate Skills Manifest

## Purpose

Decide how make-docs v2 makes skill selection purpose-led without making first-party skills mandatory. This design defines stable purpose ids, the alternate skills manifest contract, source and trust display rules, and the boundary between skill selection metadata and the existing selected-skill install state.

## Context

This design is part of [Batch 3 - CLI, MCP, and Deterministic Automation](../assets/artifacts/v2-proposed-design-and-roadmap.md). It follows [CLI Separation and MCP Boundary](2026-06-20-cli-separation-and-mcp-boundary.md) and [No-Scripts Migration and Skill Refactor](2026-06-20-no-scripts-migration-and-skill-refactor.md), which are stronger authority than the proposal artifact for this batch.

The lifecycle departure is intentional. The default lifecycle runs design to plan to PRD to work to implementation, but this v2 planning wave is using artifact roadmap inputs as a source-to-design straddle before returning to that default chain. This design records the departure explicitly and does not mutate PRDs, risk registers, plans, work backlogs, guides, history records, package templates, or source code.

Current product behavior is name-led. The CLI registry describes skills by `name`, `source`, `entryPoint`, `installName`, `description`, and `assets`. Selection state persists resolved skill names in `selectedSkills`, and `skillFiles` remains managed-output ownership tracking. [PRD 12](../prd/12-revise-cli-skill-selection-simplification.md) is current authority for the no-default-skills model: fresh defaults set `skills: false`, `selectedSkills: []`, and `skillScope: "project"`; no skill files are written on default install or default sync; every skill remains selectable and deselectable.

Older skill installation designs are historical evidence, not current authority. [CLI Skill Installation](../assets/archive/designs/2026-04-16-cli-skill-installation.md), [CLI Skill Installation R2](../assets/archive/designs/2026-04-16-cli-skill-installation-r2.md), [CLI Skills Command](../assets/archive/designs/2026-04-21-cli-skills-command.md), and [CLI Skill Selection Simplification](../assets/archive/designs/2026-04-28-cli-skill-selection-simplification.md) explain why remote registry, required/optional, and selected-skill behavior exist, but v2 must not reintroduce required first-party skills or implicit default skill installation.

The accepted no-scripts design also constrains this area. Skills may carry guidance, metadata, examples, and references, but deterministic make-docs-owned behavior belongs in CLI/shared-core operations. A purpose registry may explain why a skill is useful; it must not become a second source of deterministic workflow logic.

## Decision

Introduce a purpose-led skill catalog on top of the selected-skill model. The installer and `make-docs skills` UI should let users choose by stable purpose first and by concrete skill second, while the installed manifest continues to store resolved selected skill names for executable behavior and managed-file ownership.

The built-in first-party registry becomes the default skills manifest in logical terms. The physical file may remain `packages/cli/skill-registry.json` during implementation, but the schema must evolve toward one manifest shape that can describe both the built-in catalog and user-supplied alternate manifests.

A skills manifest must include:

- `schemaVersion`: manifest schema version.
- `manifestId`: stable id for the manifest source.
- `displayName` and optional description.
- `purposes`: purpose definitions with stable ids, labels, descriptions, and optional ordering.
- `skills`: skill entries with stable skill name, display name or description, purpose ids, source, entry point, install name, assets, supported harnesses, and provenance metadata.
- `sourcePolicy`: explicit source policy for the manifest, including whether the manifest is first-party, local, or remote-pinned.

The initial first-party purpose ids are:

- `archive-management`: archive, relationship tracing, staleness, and deprecation workflows.
- `codebase-decomposition`: repository analysis and implementation-planning inputs.
- `documentation-maintenance`: cleanup, style, path, link, and docs hygiene workflows.
- `lifecycle-closeout`: validation, history, PRD/risk reconciliation, and commit-message preparation.
- `workflow-execution`: wave and phase execution support.
- `plan-creation`: design-to-plan and planning-prep workflows.
- `migration-support`: compatibility, audit, migration, and package-transition support.

First-party purpose ids are owned by make-docs and must remain canonical ids, not configured presentation labels. Configuration overlays may relabel visible text, but CLI, MCP, plugins, manifests, and skills route through canonical ids. Alternate manifests may define additional purpose ids, but non-first-party ids must be namespaced, for example `acme.release-readiness`, to avoid collisions with make-docs-owned ids.

One skill may satisfy multiple purposes, and one purpose may offer multiple candidate skills. Purpose-led selection must show the purpose, each candidate skill, the skill source, supported harnesses, and trust/provenance before selection. If multiple skills satisfy the same purpose, the UI must not silently choose one unless the active manifest marks exactly one default candidate for that purpose and the user has explicitly opted into skills.

The install manifest remains behavior-first. `selectedSkills` stores the resolved skill names that should be installed. When selection came through purpose-led UI or an alternate manifest, the manifest should also record explanatory selection provenance, such as the selected purpose id, the manifest id, and the skill that satisfied it. That provenance is for review, reconfigure, audit, and support. It does not replace `selectedSkills`, and `skillFiles` remains the managed-output ownership list.

Alternate manifests are explicit inputs, not ambient discovery. A run uses one effective skills manifest: the built-in first-party manifest unless the user supplies an alternate manifest. An alternate manifest may include first-party skills by declaring them as entries with first-party provenance, but make-docs does not automatically merge the built-in manifest into an alternate manifest. This keeps validation, `--selected-skills all`, audit, and uninstall behavior predictable.

File-path alternate manifests are the first supported implementation target. URL manifests are allowed only when the source can be treated as remote-pinned: the caller must provide or the manifest reference must include an immutable ref plus a manifest digest. Mutable branches such as `main`, unauthenticated HTTP, and unpinned remote manifests are invalid for v2 alternate-manifest installation. The CLI may still preview rejected remote manifests enough to explain the policy failure, but it must not install from them.

Remote skill payload sources inside any manifest follow the same trust rule. A remote skill source must use an immutable ref and integrity metadata before the CLI installs it. Local file sources are allowed only when explicitly supplied by the user and must be displayed as local/custom before selection. Third-party sources must be labeled as third-party even if they satisfy a first-party purpose id.

The `--selected-skills all` shortcut expands to every selectable skill in the effective manifest after manifest validation. It must not mean every known first-party skill when an alternate manifest is active, and it must not install anything during a bare default install. `none` remains an empty selected-skill set.

## Alternatives Considered

### Keep Selection Name-Led Only

Rejected. Name-led selection preserves current behavior, but it forces users to understand make-docs skill names before they understand the workflow need. It also does not let teams map a stable purpose to a first-party, custom, or third-party skill.

### Store Only Purpose Ids in the Install Manifest

Rejected. The existing installer, audit, backup, uninstall, and selected-skill behavior depends on resolved skill names and managed `skillFiles`. Replacing `selectedSkills` with purpose ids would make installed behavior less explicit and would complicate ownership safety.

### Automatically Merge Alternate Manifests With the First-Party Manifest

Rejected for v2. Automatic merging creates collision rules, override semantics, and trust confusion before shared install and plugin routing are settled. A single effective manifest is simpler to validate and explain.

### Allow Unpinned URL Manifests for Convenience

Rejected. The risk register already identifies mutable remote skill sources as a security and reproducibility gap. A URL manifest that can change without a digest or immutable ref is not an acceptable source for install-time skill behavior.

### Reintroduce Required or Default First-Party Skills Through Purposes

Rejected. Purpose-led selection is a better explanation layer, not a way around the no-default-skills contract. Users must still opt into skills.

## Consequences

The change plan must update registry schema and validation, resolver source policy, skill catalog construction, interactive and non-interactive selection, manifest persistence, audit/backup/uninstall safety, package validation, and tests together. The current registry has no purpose, harness-support, provenance, or trust metadata fields, so the implementation will need schema and code changes rather than a UI-only patch.

This design should reference but not mutate [Q-001, Q-007, Q-012, Q-013, D-005, R-001, R-002, R-006, R-008, and R-014](../prd/03-open-questions-and-risk-register.md). It narrows `Q-007` for alternate manifests by rejecting unpinned URL manifests, but it does not fully close the long-term skills delivery contract or shared install questions. Those remain PRD/risk-register work for the downstream plan and implementation closeout.

The user-facing guides will likely need follow-up because some current skill guidance still uses older required/optional language. This design does not edit those guides; it only establishes the decision that future guide updates should follow.

Validation for implementation should separately prove default installs, explicit first-party skill installs, alternate file-manifest installs, rejected unpinned URL manifests, remote-pinned URL manifest handling if implemented, `--selected-skills all`, `--selected-skills none`, audit/backup/uninstall classification, and package contents. Bare installs must continue to produce no skill files.

## Design Lineage

Update Mode: new-doc-related

Prior Design Docs:

- [CLI Separation and MCP Boundary](2026-06-20-cli-separation-and-mcp-boundary.md)
- [No-Scripts Migration and Skill Refactor](2026-06-20-no-scripts-migration-and-skill-refactor.md)
- [Configuration and Convention Overlay](2026-06-20-configuration-and-convention-overlay.md)
- [Template, Package, and Dogfood Source-of-Truth Contract](2026-06-19-template-package-and-dogfood-source-of-truth-contract.md)
- [Agentics Ecosystem - Capability Registry, Modules, and Gateway Skill](2026-04-15-agentics-ecosystem.md)
- [Work Backlog Source Authority](../assets/archive/designs/2026-05-06-work-backlog-source-authority.md)
- [CLI Skill Installation](../assets/archive/designs/2026-04-16-cli-skill-installation.md)
- [CLI Skill Installation R2](../assets/archive/designs/2026-04-16-cli-skill-installation-r2.md)
- [CLI Skills Command](../assets/archive/designs/2026-04-21-cli-skills-command.md)
- [CLI Skill Selection Simplification](../assets/archive/designs/2026-04-28-cli-skill-selection-simplification.md)

Reason: this design extends accepted Batch 3 CLI and no-scripts boundaries into the skill selection metadata model. It supersedes older required/optional and unpinned remote-selection intent for v2 while preserving the current selected-skill and managed `skillFiles` safety model established by [PRD 12](../prd/12-revise-cli-skill-selection-simplification.md) and the [W17 R0 no-default-skills correction](../assets/history/2026-06-18-w17-r0-static-template-router-skill-correction.md).

## Intended Follow-On

Route: change-plan

Next Prompt: [designs-to-plan-change.prompt.md](../../.make-docs/references/system/prompts/designs-to-plan-change.prompt.md)

Why: this revises existing CLI skill registry, resolver, selection UI, manifest, audit, backup, uninstall, package, and dogfood behavior rather than creating a greenfield baseline.

Coordinate Handoff: unresolved; planner must resolve before writing. Prior related work includes [W14 R1 CLI skill-selection simplification](../assets/archive/plans/2026-04-28-w14-r1-cli-skill-selection-simplification/00-overview.md) and the W17 R0 no-default-skills correction, but the downstream W/R coordinate for the v2 purpose-registry and alternate-manifest change must be assigned by the planner.

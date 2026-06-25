# Configuration and Convention Overlay

## Purpose

Define the v2 configuration overlay boundary for make-docs. The configuration file gives a project room to adapt user-visible vocabulary, persona labels, and generated text conventions without turning the canonical information architecture into a project-specific schema.

This design decides what `.make-docs/config.yaml` may influence, what remains canonical, and what later implementation work must validate before configuration reaches CLI, MCP, template, skill, or package surfaces.

## Context

The Batch 2 roadmap names this design as the boundary for configuration and conventions. It says config should be a presentation overlay, not a structural rewrite, and that repo paths, frontmatter field names, skill names, and contract names stay canonical unless a later design explicitly changes that boundary. See [v2-proposed-design-and-roadmap.md](../assets/artifacts/v2-proposed-design-and-roadmap.md).

The accepted Batch 2 designs already constrain this decision. [Tool Directory System and Custom Resource Tiers](2026-06-19-tool-directory-system-and-custom-resource-tiers.md) makes `.make-docs/` the in-project tool directory and includes future local config in the required bootstrap. [New Docs Assets, Playbooks, and Persona Model](2026-06-19-new-docs-assets-playbooks-and-persona-model.md) defines the default persona schema and says config overlays may relabel presentation vocabulary but must not rename canonical paths, field names, primitive names, or schema keys. [Generated Metadata and Lifecycle Handoffs](2026-06-20-generated-metadata-and-lifecycle-handoffs.md) makes YAML frontmatter canonical for generated metadata and explicitly says configuration overlays may change generated prose labels, not metadata names, `kind` values, `persona`, route identifiers, prompt paths, or lifecycle departure slugs.

The evidence pass found no existing active design that should be updated in place. The closest same-area prior design is [Make Docs Lifecycle Playbook and Terminology Overlay](../assets/archive/designs/2026-05-28-make-docs-lifecycle-playbook.md), but that design captured broader terminology-overlay intent before the accepted v2 Batch 2 model narrowed configuration to presentation behavior. This v2 planning pass therefore creates a new dated design rather than mutating the older document.

Current source surfaces have no `.make-docs/config.yaml` loader. Existing `make-docs reconfigure` behavior is installer/profile selection, not convention overlay configuration. Later implementation planning must audit `packages/cli/src/cli.ts`, `packages/cli/src/profile.ts`, `packages/cli/src/types.ts`, `packages/cli/src/manifest.ts`, `packages/cli/src/install.ts`, `packages/cli/src/catalog.ts`, `packages/cli/src/rules.ts`, `packages/cli/src/wizard.ts`, `packages/cli/src/skills-ui.ts`, package template copy paths, smoke-pack validation, and skill scripts that currently hard-code coordinates, date prefixes, output paths, or selected YAML fields.

This design is a lifecycle departure by direction: it is generated from artifact roadmap inputs before the workflow returns to design -> plan -> PRD -> work -> implementation. The departure is the accepted `source-to-design-straddle` described by [lifecycle.md](../../.make-docs/references/system/lifecycle.md); it is explicit here so the later plan can resume the normal lifecycle instead of silently treating artifact proposals as implementation authority.

## Decision

`.make-docs/config.yaml` is optional project-owned configuration. If it is absent, make-docs uses shipped defaults. If it is present, install, reconfigure, provider refresh, package sync, and cache recovery must preserve it as local project content unless a later plan defines an explicit user-approved replacement flow.

The configuration overlay may affect presentation:

- Display labels for lifecycle concepts and document kinds in generated prose.
- Display labels for coordinate parts in generated prose and CLI output.
- Prompt or CLI wording that describes configured audiences, lifecycle stages, or handoff labels.
- Persona entries using the Batch 2 schema: `slug`, `label`, `description`, and `primitive`.
- Future generator defaults for prose wording, as long as the generated files still satisfy their owning contracts.

The configuration overlay must not rename structure:

- Repository paths such as `docs/designs/`, `docs/assets/library/`, `docs/assets/playbooks/`, or `.make-docs/`.
- Frontmatter fields such as `title`, `kind`, `status`, `coordinate`, `persona`, `source`, `lifecycle`, or `follow_on`.
- `kind` values, lifecycle departure slugs, source type values, route identifiers, prompt paths, skill names, contract names, harness names, or manifest keys.
- Persona schema keys or primitive values. `agent`, `maintainer`, and `user` remain canonical primitives.
- W/R/P lineage as a machine-readable coordinate contract unless a later design explicitly supersedes that coordinate model.

For personas, config may add or relabel persona entries but must preserve the accepted schema. A custom persona `slug` is the stable automation value, `label` is display text, `description` explains the audience boundary, and `primitive` maps to one of the canonical primitives. Persona-scoped guide and playbook frontmatter stores the persona slug. Directory placement remains secondary discovery structure.

Coordinate configuration is presentation-only in this design. A project may prefer words such as batch, revision, phase, milestone, or stage in generated prose, but tooling still stores and validates canonical coordinate metadata. A configured prefix-style label may influence how future generated text explains filenames or coordinates, but it does not authorize a generator to create structurally different filenames, directory names, or frontmatter until a later design explicitly changes those contracts.

CLI, MCP, plugin, and skill surfaces must consume config as a rendering input, not as routing authority. Commands, scripts, validators, and package-template checks route through canonical paths and identifiers, then apply configured labels only when producing user-visible text. A plugin may say "ideas" if a project labels designs that way, but it still reads and writes canonical design docs through the design contract.

Validation must reject or warn on structural rename attempts. A config file that tries to rename `persona`, redefine `kind` values, replace route identifiers, redirect canonical paths, or change primitive names is invalid. Unknown display labels are acceptable only where the schema declares them as display text.

## Alternatives Considered

Allow config to redefine structural vocabulary, paths, metadata fields, and coordinate syntax. This would maximize customization, but it would make every prompt, script, package template, validator, and plugin negotiate a different schema per repository. It would also reopen the path and metadata decisions already settled by the first three Batch 2 designs.

Keep all vocabulary hard-coded with no config overlay. This would keep implementation simpler, but it would leave `Q-011`, `R-010`, and `R-011` unresolved and preserve too much software-biased product language in user-facing output.

Treat config as a manifest extension. This would keep all tool state in one file, but it would conflate project-owned conventions with make-docs-owned provenance and runtime state. The tool-directory design separates local project config from manifest and provider/cache metadata, so this design follows that separation.

Let prefix-style configuration change filenames immediately. This would address earlier planning notes about date slugs versus version-number prefixes, but it would contradict the current design router, generated metadata contract, link hygiene expectations, and package-template validation. This design defers structural filename changes.

## Consequences

The later change plan must introduce a config schema, default config source, loader, diagnostics, and tests without changing canonical document locations or metadata keys. It should treat current `make-docs reconfigure` as install/profile configuration and avoid overloading that command name until the CLI/MCP design decides the user-facing command surface.

Template and package work must be source-first. If a default `.make-docs/config.yaml` template is introduced, it starts in the product-owned template source, is copied through package prepack paths, and is dogfooded only through planned template work. The installer should preserve project-owned config and report conflicts instead of overwriting local convention choices.

This design references but does not mutate the PRD or risk register. Relevant items include `Q-011` for coordinate and prefix configurability, `Q-009` and `R-011` for persona configuration, `R-010` for software-biased vocabulary, `R-004` for duplicated path knowledge, `D-014` for template-first source of truth, `R-003` for packed-template drift, `R-013` for relocation and link risk, `R-014` for the no-scripts transition, and `Q-012` for shared agentic surfaces that may later need to render configured labels.

Future validation should cover absent config using defaults, valid custom personas, invalid primitive values, invalid attempts to rename structural identifiers, generated prose that uses configured labels, CLI output that applies labels without changing routing, package-template parity, dogfood parity, manifest/audit/backup preservation of local config, and unchanged behavior for canonical metadata readers.

Batch reconciliation must verify that the four Batch 2 designs agree on one model: `.make-docs/` owns tool resources and local config, `docs/assets/**` owns reader-facing assets, YAML frontmatter is canonical metadata, and config overlays presentation only.

## Design Lineage

Update Mode: `new-doc-related`

Prior Design Docs: [Tool Directory System and Custom Resource Tiers](2026-06-19-tool-directory-system-and-custom-resource-tiers.md), [New Docs Assets, Playbooks, and Persona Model](2026-06-19-new-docs-assets-playbooks-and-persona-model.md), [Generated Metadata and Lifecycle Handoffs](2026-06-20-generated-metadata-and-lifecycle-handoffs.md), [Make Docs Lifecycle Playbook and Terminology Overlay](../assets/archive/designs/2026-05-28-make-docs-lifecycle-playbook.md)

Reason: This design is a new v2 Batch 2 decision that extends the accepted tool-directory, persona, and metadata designs while narrowing older terminology-overlay intent to presentation behavior. It does not update the prior docs in place because the active v2 model needs a distinct configuration-boundary decision.

## Intended Follow-On

Route: `change-plan`

Next Prompt: [designs-to-plan-change.prompt.md](../../.make-docs/references/system/prompts/designs-to-plan-change.prompt.md)

Why: This design changes future CLI, MCP, template, manifest, package, validation, plugin, skill, and dogfood behavior while preserving canonical paths and metadata. It should become additive change planning against the active make-docs PRD/risk namespace after Batch 2 reconciliation.

Coordinate Handoff: unresolved; planner must resolve before writing. Treat the follow-on as a revision because this design refines earlier configuration, terminology-overlay, persona, and coordinate-convention intent under the accepted v2 information architecture.

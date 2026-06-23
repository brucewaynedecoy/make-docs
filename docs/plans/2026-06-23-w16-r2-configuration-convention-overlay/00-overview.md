# W16 R2 Configuration Convention Overlay Plan

## Purpose

Define the v2 configuration overlay boundary for make-docs. The configuration file gives a project room to adapt user-visible vocabulary, persona labels, and generated text conventions without turning the canonical information architecture into a project-specific schema.

## Source Design

- Design: [Configuration and Convention Overlay](../../designs/2026-06-20-configuration-and-convention-overlay.md)
- Route: `change-plan`
- Update Mode: `new-doc-related`
- Coordinate: `W16 R2`

## Current State

- `.make-docs/` is present as the tool/state directory, with manifest and conflict state under the current TypeScript CLI.
- There is no `.make-docs/config.yaml` loader, schema, or diagnostics surface in the active CLI.
- `make-docs reconfigure` is install/profile selection behavior, not convention overlay configuration.
- Current rendering surfaces in CLI, wizard, skills UI, templates, package-copy paths, and validation scripts still hard-code canonical labels, paths, and metadata field names.

## Target State

- `.make-docs/config.yaml` is optional project-owned configuration. When absent, make-docs uses shipped defaults.
- Config may influence presentation labels, persona entries, prompt/CLI wording, and future generated prose defaults.
- Config must not rename canonical paths, frontmatter fields, metadata values, route identifiers, prompt paths, skill names, contract names, harness names, manifest keys, or persona primitive values.
- Persona entries keep the Batch 2 schema: `slug`, `label`, `description`, and `primitive`.
- Coordinate customization is presentation-only. Tooling still stores and validates canonical W/R/P lineage unless a later design supersedes that model.

## Dependencies

- [21 Revise Tool Directory System Custom Resource Tiers](../../prd/21-revise-tool-directory-system-custom-resource-tiers.md) for `.make-docs/` ownership and project-owned local config placement.
- [22 Revise New Docs Assets Playbooks Persona Model](../../prd/22-revise-new-docs-assets-playbooks-persona-model.md) for persona schema and primitive values.
- [23 Revise Generated Metadata Lifecycle Handoffs](../../prd/23-revise-generated-metadata-lifecycle-handoffs.md) for canonical generated metadata field names and YAML/body drift validation.
- [03 Open Questions and Risk Register](../../prd/03-open-questions-and-risk-register.md) for Q-011, Q-009, R-010, R-011, R-004, R-003, D-014, R-013, R-014, and Q-012.

## Deliverables

- Add PRD 24 for the configuration and convention overlay requirements.
- Reconcile the active PRD index and affected baseline PRDs.
- Update the living risk register to capture the presentation-only decision and remaining implementation risks.
- Generate the paired work backlog under `docs/work/2026-06-23-w16-r2-configuration-convention-overlay/`.

## Validation Plan

- Run `git diff --check`.
- Run `bash scripts/check-wave-numbering.sh`.
- Reindex project docs with jdocmunch after edits.
- Scan new and touched docs for unfinished tokens.
- Check touched Markdown local links before committing.

## Intended Follow-On

- Implement the W16 R2 backlog before exposing `.make-docs/config.yaml` behavior in CLI, MCP, plugin, skill, package, or generated-template surfaces.
- Keep config structural changes out of scope unless a later accepted design explicitly supersedes the canonical path, metadata, or coordinate contracts.

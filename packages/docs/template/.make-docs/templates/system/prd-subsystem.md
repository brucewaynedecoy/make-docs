---
title: "{{NUMBER}} {{TITLE}}"
kind: "prd"
status: "active"
# source:
#   type: "plan"
#   path: "{{SOURCE_PATH}}"
---

# {{NUMBER}} {{TITLE}}

## Purpose

Explain what this subsystem owns and why it exists.

## Scope

Explain what is covered here and what is intentionally covered elsewhere.

Code anchors:

- `{{SCOPE_PATHS}}`

## Component and Capability Map

Describe the subsystem's components, modules, or pages and the capabilities they implement.

Code anchors:

- `{{COMPONENT_PATHS}}`

## Contracts and Data

Describe the important data models, API contracts, events, storage shapes, or configuration surfaces.

Code anchors:

- `{{CONTRACT_PATHS}}`

## Integrations

Describe external dependencies, sibling modules, or cross-cutting connections.

Code anchors:

- `{{INTEGRATION_PATHS}}`

## Rebuild Notes

Explain what a clean-room rebuild would need to preserve and where future implementers are likely to make mistakes.

Code anchors:

- `{{REBUILD_PATHS}}`

## Requirement History

Optional and non-normative. Omit this section until a material prior contract needs to remain visible. Current subsystem requirements above always win. For each entry, record the date, coordinate when known, affected requirement or section, previous contract, replacement contract, rationale, and source using `.make-docs/references/system/prd-change-management.md`.

## Source Anchors

- `{{PRIMARY_FILES}}`

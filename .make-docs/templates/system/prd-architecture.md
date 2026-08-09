---
title: "02 Architecture Overview"
kind: "prd"
status: "active"
# source:
#   type: "plan"
#   path: "{{SOURCE_PATH}}"
---

# 02 Architecture Overview

## Purpose

Explain how the system is shaped end to end.

## Topology

Describe the main runtime surfaces, services, processes, or deployment shape.

Code anchors:

- `{{TOPOLOGY_PATHS}}`

## Module Map

Describe the major modules, packages, apps, or directories and what each one owns.

Code anchors:

- `{{MODULE_MAP_PATHS}}`

## Runtime Boundaries

Explain browser/server, service/service, or process/module boundaries and their responsibilities.

Code anchors:

- `{{BOUNDARY_PATHS}}`

## Data Flow

Describe the important end-to-end flows that connect the system together.

Code anchors:

- `{{FLOW_PATHS}}`

## Configuration Surfaces

Explain manifests, environment variables, config files, and operational switches that materially affect behavior.

Code anchors:

- `{{CONFIG_PATHS}}`

## Requirement History

Optional and non-normative. Omit this section until a material prior contract needs to remain visible. Current requirements above always win. For each entry, record the date, coordinate when known, affected requirement or section, previous contract, replacement contract, rationale, and source using `.make-docs/references/system/prd-change-management.md`.

## Source Anchors

- `{{ENTRYPOINTS}}`
- `{{MAIN_CONFIGS}}`
- `{{MAIN_RUNTIME_FILES}}`

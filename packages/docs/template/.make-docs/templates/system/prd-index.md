---
title: "{{PRODUCT_NAME}} PRD Index"
kind: "prd"
status: "active"
follow_on:
  route: "work-backlog-generation"
  next_prompt: "make-docs://system/prompt/prd-to-work-full-prd.prompt.md"
  why: "The PRD set should become the effective contract before phase-sized implementation work is queued."
  coordinate_handoff: "Carry the plan or source W/R lineage named by this PRD set into docs/work/."
# source:
#   type: "plan"
#   path: "{{SOURCE_PATH}}"
---

# {{PRODUCT_NAME}} PRD Index

## Purpose

Explain what this PRD set covers, who it is for, and why it exists.

This index maps the current authoritative shape of the product. It never catalogs the editorial operations used to change that authority.

## Reading Order

1. {{PRODUCT_OVERVIEW_LINK}}
2. {{ARCHITECTURE_OVERVIEW_LINK}}
3. {{RISK_REGISTER_LINK}}
4. {{GLOSSARY_LINK}}
5. Add the adaptive capability, subsystem, and reference authorities here in the order that best rebuilds understanding.

## Document Map

| Document | Kind | Status | Related Docs | Focus |
| --- | --- | --- | --- | --- |
| {{INDEX_LINK}} | `core` | `active` | `—` | Explain the PRD set and how to read it |
| {{PRODUCT_OVERVIEW_LINK}} | `core` | `active` | `—` | Explain product purpose, users, capabilities, boundaries, and limitations |
| {{ARCHITECTURE_OVERVIEW_LINK}} | `core` | `active` | `—` | Explain topology, module map, runtime boundaries, data flow, and config surfaces |
| {{RISK_REGISTER_LINK}} | `core` | `active` | `—` | Capture drift, gaps, and rebuild risks |
| {{GLOSSARY_LINK}} | `core` | `active` | `—` | Define canonical terms |
| {{ADAPTIVE_DOC_LINKS}} | `capability`, `subsystem`, or `reference` | Current product-authority status | List related current authorities | Explain the current product subject owned by this PRD |

## Source Anchors

- `README.md`
- `package.json`
- `{{PRIMARY_ENTRYPOINT}}`
- `{{PRIMARY_DOCS}}`

## Audience Paths

### New developer

List the best reading path for a developer joining the project.

### Product or technical lead

List the best reading path for product, architecture, or planning review.

### AI coding assistant

List the fastest path for an assistant that needs safe, code-first context before making changes.

## Intended Follow-On

This handoff is advisory-default-but-overridable: it is authoritative unless the user explicitly overrides it, and it is not a gate or precondition.

- Route: `work-backlog-generation`
- Next step: Generate or update the work backlog from this PRD set.
- Why: The PRD set should become the effective contract before phase-sized implementation work is queued.
- Coordinate Handoff: Carry the plan or source W/R lineage named by this PRD set into `docs/work/`, or resolve the coordinate question before writing the backlog.

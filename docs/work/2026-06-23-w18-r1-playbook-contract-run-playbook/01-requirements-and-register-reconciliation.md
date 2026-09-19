# P1 Requirements and Register Reconciliation

## Goal

Keep the active PRD set and risk register aligned with PRD 29 before implementation changes playbook behavior.

## Tasks

- [x] Confirm PRD 29 remains the active owner of the playbook contract and generic Run Playbook model.
- [x] Confirm PRD 22 owns persona-scoped asset namespace and persona schema.
- [x] Confirm PRD 23 owns generated metadata and YAML/body handoff validation.
- [x] Confirm PRD 24 keeps config overlays presentation-only for playbook labels and selection text.
- [x] Confirm PRD 28 remains shared-agentics substrate only and does not redefine Run Playbook.
- [x] Keep Q-013 open for plugin public flow and exposure.
- [x] Narrow R-012 to the content-vs-invocation boundary.

## Acceptance Criteria

- Existing PRD updates point to PRD 29 without duplicating requirements.
- Risk register items are updated in place.
- No updated doc makes plugin exposure mandatory for playbook validity.

## Validation Notes

Run touched Markdown link checks and unfinished-token scans after reconciliation.

## Closeout Notes

Phase 1 confirmed that the active PRD set already carries the required W18 R1 authority boundaries after the W18 R4 and W18 R5 corrective work:

- PRD 29 owns playbook storage, frontmatter, stack validation, resolver identity, generic Run Playbook invocation, harness capability mediation, run state, nesting, concurrency, and plugin/surface boundaries.
- PRD 22 owns `docs/assets/playbooks/<persona>/<slug>.md`, `docs/assets/library/<persona>/<slug>.md`, and the persona schema.
- PRD 23 owns generated metadata and YAML/body handoff validation.
- PRD 24 keeps configuration overlays presentation-focused while allowing reviewed harness capability facts as Run Playbook execution hints.
- PRD 28 owns shared agentics storage and native harness exposure without redefining playbook validity or Run Playbook behavior.
- Q-013 remains open for plugin public flow and exposure decisions.
- R-012 is already closed around the content-vs-invocation boundary: playbooks are persona-scoped process definitions, Run Playbook is the generic invocation model, and plugins are optional packaged exposure paths.

No PRD text change was needed because the current active PRD and risk-register state already satisfies the phase acceptance criteria.

Developer-guide coverage decision: `none`. This phase verified requirements ownership and did not create a new maintainer workflow, extension point, validation process, or safe-change rule beyond existing Playbook guide coverage.

User-guide coverage decision: `none`. This phase did not add or change a user-facing task, command, expected result, configuration choice, troubleshooting path, or adoption workflow.

PRD coverage decision: `none`. The phase implemented existing W18 R1 reconciliation requirements without changing the active requirement surface.

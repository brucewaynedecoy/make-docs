# PRD and Risk Reconciliation

## PRD Additions

Create [PRD 29](../../prd/29-revise-playbook-contract-run-playbook.md) as the active owner of the v2 playbook content contract and generic Run Playbook execution model.

PRD 29 should sit after PRD 28 in the active change-doc sequence because it depends on the persona/playbook namespace, metadata, configuration, and shared agentics substrate decisions already captured in PRDs 22, 23, 24, and 28.

## Existing PRD Updates

- PRD 00 must add PRD 29 to reading order, document map, source anchors, audience paths, and intended follow-on.
- PRD 03 must update R-012 and related entries without creating duplicate playbook/plugin questions.
- PRD 10 must add package proof expectations for playbook metadata, path/persona consistency, stack validation, and packed-template parity.
- PRD 14 must point lifecycle workflow guidance at the generic Run Playbook model where applicable.
- PRD 19 must preserve template-first source-of-truth flow for shipped playbook defaults.
- PRD 22 must replace its Run Playbook non-requirement with a pointer to PRD 29.
- PRD 23 must add playbook minimum frontmatter and stack validation as generated metadata consumers.
- PRD 24 must keep configuration overlays presentation-only for playbook labels and selection messages.
- PRD 25 must treat CLI/MCP Run Playbook exposure as a shared-operation consumer, not a second behavior model.
- PRD 28 must keep generated stubs and plugin payloads separate from the Run Playbook content contract.

## Risk Register Updates

- Q-013 remains open for public plugin flow and exposure boundaries.
- R-011 remains open until persona config implementation proves path/frontmatter and generated metadata behavior.
- R-012 should narrow from confirming to a settled content-vs-invocation boundary: playbooks are persona-scoped content; Run Playbook is the generic invocation model; plugins are optional exposure.
- R-013 should include the `docs/library/playbooks/**` to `docs/assets/playbooks/**` migration and metadata path updates.
- R-014 remains open because shared stubs, scripts, MCP, and Run Playbook surfaces must not cite missing CLI/shared-core deterministic behavior.

## Acceptance

- The PRD set captures Run Playbook without requiring plugin substrate.
- Existing risk items are updated in place.
- No risk item implies storage under `docs/assets/playbooks/**` is executable by itself.

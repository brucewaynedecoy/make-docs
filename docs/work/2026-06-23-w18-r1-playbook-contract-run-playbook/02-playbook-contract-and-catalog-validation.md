# P2 Playbook Contract and Catalog Validation

## Goal

Implement playbook contract validation for path, frontmatter, body expectations, persona consistency, and stack selection.

## Tasks

- [x] Add or update playbook fixtures under the source-first template path when shipped defaults are required.
- [x] Validate `docs/assets/playbooks/<persona-slug>/<playbook-slug>.md` path shape.
- [x] Validate required frontmatter fields: `title`, `kind`, `status`, `persona`, `stack`, and `summary`.
- [x] Fail closed when `kind` is not `playbook`.
- [x] Fail closed when `persona` is missing, invalid, or inconsistent with the path persona.
- [x] Fail closed when `stack` is missing or not `build` or `run`.
- [x] Add body-structure diagnostics for missing purpose, inputs/authority, procedure, gates, assists, outputs, or validation sections.

## Acceptance Criteria

- Invalid playbooks cannot be selected or run silently.
- Build-stack and run-stack metadata are available to selection and handoff messages.
- Former `docs/library/playbooks/**` content is treated as migrated historical evidence and is not selected as the v2 playbook home.

## Validation Notes

Cover valid, missing-frontmatter, invalid-persona, path/persona drift, invalid-stack, and historical transitional-path fixtures.

Completed in commit `0cf56ed`. The implementation updates the playbook operation domain, focused operation tests, and the dogfooded Make Docs lifecycle playbook. No shipped default playbook template fixture was required in this phase.

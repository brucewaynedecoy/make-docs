# P4 Template Package Lifecycle Closeout

## Goal

Prove the playbook contract and Run Playbook model across source template, dogfood, package, lifecycle, and support-claim surfaces.

## Tasks

- [ ] Preserve source-first authoring under `packages/docs/template/docs/assets/playbooks/**` for shipped defaults.
- [ ] Reseed repo-root dogfood for reviewed playbook defaults.
- [ ] Regenerate `packages/cli/template/**` through copy/prepack behavior.
- [ ] Extend package validation when shipped playbook defaults change.
- [ ] Confirm manifest, audit, backup, uninstall, installer, CLI, MCP, or plugin code changes are covered only where behavior changed.
- [ ] Update closeout records, PRDs, and risk entries only with implementation evidence.

## Acceptance Criteria

- Package validation catches stale or missing shipped playbook defaults.
- Dogfood and template playbook copies follow PRD 19 source-of-truth order.
- Q-013 remains open unless plugin flow and exposure are actually defined.
- R-012 remains aligned with content versus invocation after implementation.

## Validation Notes

Run targeted tests plus package validation when shipped template, catalog, lifecycle, or runner behavior changes.

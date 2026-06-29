# P4 Template Package Lifecycle Closeout

## Goal

Prove the playbook contract and Run Playbook model across source template, dogfood, package, lifecycle, and support-claim surfaces.

## Tasks

- [x] Preserve source-first authoring under `packages/docs/template/docs/assets/playbooks/**` for shipped defaults.
- [x] Reseed repo-root dogfood for reviewed playbook defaults.
- [x] Regenerate `packages/cli/template/**` through copy/prepack behavior.
- [x] Extend package validation when shipped playbook defaults change.
- [x] Confirm manifest, audit, backup, uninstall, installer, CLI, MCP, or plugin code changes are covered only where behavior changed.
- [x] Update closeout records, PRDs, and risk entries only with implementation evidence.

## Acceptance Criteria

- Package validation catches stale or missing shipped playbook defaults.
- Dogfood and template playbook copies follow PRD 19 source-of-truth order.
- Q-013 remains open unless plugin flow and exposure are actually defined.
- R-012 remains aligned with content versus invocation after implementation.

## Validation Notes

Implemented Phase 4 by making `docs/assets/playbooks/agent/make-docs-lifecycle.md` a named shipped default authored from `packages/docs/template/docs/assets/playbooks/agent/make-docs-lifecycle.md`, managed by the install catalog, and validated through source-template, dogfood, generated package template, install manifest, and smoke-pack assertions. No plugin substrate, audit, backup, uninstall, MCP, or separate runner behavior changed beyond the managed default asset surface.

Validation completed:

- `npm run validate:defaults -w packages/cli`
- `npm test -w packages/cli -- --run tests/install.test.ts --reporter=dot`
- `npm test -w packages/cli -- --reporter=dot`
- `npm run build -w packages/cli`
- `npm run smoke:pack`

Coverage decisions:

- Manual UAT: worthwhile after full W18 R1 completion because the change is user-observable in fresh installs and the Playbook operation surface; a human should confirm the installed default is discoverable and invokable in a real temp project.
- Developer guide: `update-existing`; the Run Playbook runner architecture guide now documents shipped default Playbook source-of-truth and validation rules.
- User guide: `update-existing`; the Running Make Docs Playbooks guide now documents the installed default Playbook and current operation-level catalog/invocation commands.
- PRD coverage: `none`; Phase 4 implements the existing PRD 29 template/package boundary and does not change the active requirement surface. Q-013 remains open and R-012 remains closed around content versus invocation.

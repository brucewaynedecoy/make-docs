# Package Template Lifecycle Closeout

## Package and Template Work

Implementation must account for:

- source-first authored defaults under `packages/docs/template/docs/assets/playbooks/**`
- dogfood reseeding into repo-root `docs/assets/playbooks/**`
- generated package copy under `packages/cli/template/**`
- package allowlist and smoke-pack expectations when shipped playbook defaults change
- path-hygiene and link checks for moved playbook content

## Lifecycle Work

Manifest, catalog, audit, backup, uninstall, installer, CLI, MCP, and plugin changes are required only when implementation changes how playbooks are shipped, selected, enumerated, or executed.

Any destructive migration from `docs/library/playbooks/**` must use the existing compatibility classification and single-audit safety rules.

## Closeout Requirements

- Reconcile PRDs and risk entries before implementation.
- Generate the paired work backlog.
- Run touched-doc validation.
- Commit locally using the plan commit convention.

## Acceptance

- `docs/work/2026-06-23-w18-r1-playbook-contract-run-playbook/` exists and traces to PRD 29.
- The round commits only planning, PRD, and work documents.
- Later Batch 4 plugin planning can consume the playbook contract without redefining playbook validity.

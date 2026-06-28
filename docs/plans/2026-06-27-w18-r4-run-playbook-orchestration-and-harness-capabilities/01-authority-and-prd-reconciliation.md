# Authority and PRD Reconciliation

## Objective

Establish W18 R4 as the blocking authority for Run Playbook orchestration and reconcile active PRDs without reopening settled playbook storage or plugin-substrate decisions.

## Scope

- Add W18 R4 authority to PRD 29, PRD 30, PRD 24, PRD 25, PRD 20, PRD 23, PRD 05, PRD 10, PRD index, and risk register.
- Preserve W18 R1 as the content/runner implementation backlog, W18 R2 as plugin/bundle implementation, and W18 R3 as optional adversarial-review implementation.
- Do not add package code changes in this planning pass.

## Acceptance Criteria

- PRD 29 owns Run Playbook resolver, capability, run-state, nested-run, and concurrency requirements.
- PRD 30 says plugins and workflow bundles delegate playbook execution semantics to W18 R4.
- PRD 24 permits reviewed harness capability records while preserving config's non-routing boundary.
- Risk register records the newly mitigated orchestration gap without reopening R-012.

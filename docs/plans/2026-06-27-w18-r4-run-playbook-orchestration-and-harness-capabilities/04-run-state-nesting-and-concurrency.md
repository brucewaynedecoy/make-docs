# Run State, Nesting, and Concurrency

## Objective

Define Make Docs-owned execution state so long-running, resumed, nested, and parallel playbook work remains auditable and recoverable across harnesses.

## Scope

- Store run state under `.make-docs/runs/playbooks/<run-id>/state.json`.
- Record run id, root run id, parent run id, playbook ref, stack, harness, capability snapshot, current step/gate, child runs, output-surface claims, status, and resume hints.
- Require explicit playbook permission for child playbooks.
- Require explicit permission plus non-overlapping output-surface claims for parallel child runs.

## Acceptance Criteria

- Future implementation tests cover new run state, resume from interrupted state, parent/child state, serial child execution, permitted parallel execution, overlapping output-surface conflict, and manual-review stop.
- Harness-native goal or loop features are recorded as assists, not as the Make Docs source of truth.
- No run writes outside the playbook or caller-authorized output surfaces.

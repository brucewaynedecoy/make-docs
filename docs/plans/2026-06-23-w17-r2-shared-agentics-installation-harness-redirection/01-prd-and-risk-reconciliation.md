# PRD and Risk Reconciliation

## Objective

Update the active PRD set so shared agentics installation has a clear owner and does not conflict with no-default-skills, purpose manifests, compatibility migration, or no-scripts boundaries.

## PRD Updates

- Add PRD 28 as a revision because shared payloads and generated stubs are new installation-state requirements.
- Update PRD 05 for manifest schema and lifecycle ownership records.
- Update PRDs 07 and 08 for CLI, skills UI, skill catalog, and harness exposure behavior.
- Update PRD 10 for package and smoke-pack proof.
- Update PRD 12 for the no-default-skills invariant.
- Update PRDs 16, 18, 21, 24, 25, 26, and 27 for package, compatibility, tool-directory, config, CLI/MCP, no-scripts, and purpose-manifest implications.

## Risk Register Updates

- Q-012 gains a concrete cross-platform direction: generated stubs over symlinks.
- Q-013 remains open for plugin flow, Run Playbook, and public exposure decisions.
- Q-001 and D-005 remain open because this plan does not choose bundled-local versus remote-fetch delivery.
- Q-007 remains open for broader remote source policy.
- R-001, R-002, and R-006 must include shared payload/stub classification and single-audit implications.
- R-008 and R-014 remain open until no-scripts implementation proves parity.

## Acceptance

- PRD 28 owns the shared installed-state model.
- No updated PRD implies stubs or shared payloads are installed by default.
- No updated PRD treats symlinks as required for v2 correctness.

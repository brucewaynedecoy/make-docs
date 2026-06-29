# P3 Run Playbook Invocation Model

## Goal

Implement the generic Run Playbook execution model without making playbook validity depend on plugin packaging.

## Tasks

- [x] Support selecting one playbook by explicit path, slug, or indexed catalog entry.
- [x] Load authority sources according to the playbook's stated authority order.
- [x] Resolve configuration overlays only for labels, defaults, and presentation.
- [x] Execute playbook steps in order.
- [x] Stop at gates and user-decision points unless the playbook explicitly permits unattended continuation.
- [x] Treat assists as optional unless the playbook marks them required.
- [x] Route outputs only to the surface named by the playbook or explicit caller instruction.
- [x] Label CLI, MCP, plugin, skill, template-sync, or unattended support claims as provisional until validation exists.

## Acceptance Criteria

- A valid playbook can run through the generic model without a plugin.
- An invalid playbook fails closed before procedure execution.
- The runner does not write artifacts outside the playbook or caller's explicit output surface.

## Validation Notes

Add focused tests for selection ambiguity, invalid metadata, gate handling, required assists, output routing, and build/run stack messaging.

Completed in this phase. Validation covered focused Playbook operation tests, MCP tool registration and write-gate tests, the full package test suite, and package build.

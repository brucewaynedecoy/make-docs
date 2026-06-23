# P3 Run Playbook Invocation Model

## Goal

Implement the generic Run Playbook execution model without making playbook validity depend on plugin packaging.

## Tasks

- [ ] Support selecting one playbook by explicit path, slug, or indexed catalog entry.
- [ ] Load authority sources according to the playbook's stated authority order.
- [ ] Resolve configuration overlays only for labels, defaults, and presentation.
- [ ] Execute playbook steps in order.
- [ ] Stop at gates and user-decision points unless the playbook explicitly permits unattended continuation.
- [ ] Treat assists as optional unless the playbook marks them required.
- [ ] Route outputs only to the surface named by the playbook or explicit caller instruction.
- [ ] Label CLI, MCP, plugin, skill, template-sync, or unattended support claims as provisional until validation exists.

## Acceptance Criteria

- A valid playbook can run through the generic model without a plugin.
- An invalid playbook fails closed before procedure execution.
- The runner does not write artifacts outside the playbook or caller's explicit output surface.

## Validation Notes

Add focused tests for selection ambiguity, invalid metadata, gate handling, required assists, output routing, and build/run stack messaging.

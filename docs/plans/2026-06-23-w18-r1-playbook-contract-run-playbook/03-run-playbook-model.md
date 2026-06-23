# Run Playbook Model

## Objective

Define the generic execution model that can operate on any valid playbook without making every playbook a plugin.

## Runner Flow

A Run Playbook surface must:

1. Select one playbook by explicit path, slug, or indexed catalog entry.
2. Validate required frontmatter and fail closed when `kind`, `persona`, or `stack` is missing or invalid.
3. Load referenced authority sources according to the playbook's stated authority order.
4. Resolve configuration overlays for labels, defaults, and presentation while preserving canonical routing and artifact ownership.
5. Execute the procedure step by step.
6. Stop at gates and user-decision points unless the playbook explicitly allows unattended continuation.
7. Treat listed assists as optional unless the playbook marks an assist as required.
8. Record outputs only in the artifact, history, plan, work, or run-log surface named by the playbook or explicit caller instruction.

## Invocation Boundary

Run Playbook can be exposed by agents, CLI commands, MCP tools, future plugins, or installed skills.

Plugin exposure is additive. A playbook remains valid content even when no plugin exposes it.

Support claims for CLI execution, MCP execution, plugin launch, template sync, or unattended execution require implementation evidence or conformance-lab evidence.

## Acceptance

- A runner cannot execute an invalid playbook silently.
- A playbook does not become executable merely because it is stored under `docs/assets/playbooks/**`.
- Unattended behavior and plugin launch claims remain provisional until validated.

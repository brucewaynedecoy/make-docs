# Harness Capabilities and Config

## Objective

Define how Run Playbook uses harness capabilities without hard-coding every harness-specific feature or treating local capability knowledge as manifest ownership.

## Scope

- Store reviewed harness capability records in `.make-docs/config.yaml` under `harnessCapabilities`.
- Use canonical capability ids: `goal_managed_execution`, `long_running_runs`, `resume_after_interrupt`, `parallel_playbook_runs`, `subagent_delegation`, and `user_gate_prompts`.
- Require unknown capabilities to be inspected and reviewed before persistence.
- Fall back to serial gated execution for optional unknown capabilities and stop for required unknown capabilities.

## Acceptance Criteria

- Config validation preserves canonical routing and rejects attempts to use capability records as path, stack, or manifest aliases.
- Future implementation tests cover absent config, known supported capability, known unsupported capability, unknown optional capability fallback, unknown required capability stop, and reviewed persistence.
- Conformance evidence remains required for public support claims.

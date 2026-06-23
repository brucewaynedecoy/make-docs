# Harness Adapter and Support Claim Gating

## Purpose

Separate current product harnesses from future lab adapters and define how support claims are evidence-gated.

## Requirements

- Current executable coverage is Codex and Claude Code because those are the current `HARNESSES` in `packages/cli/src/types.ts`.
- OpenCode, Goose, Pi, and future agentic IDEs are future lab adapter targets until a later accepted design changes the executable harness model.
- A run result applies only to the scenario/harness/model/provider/runtime tuple it records.
- One passing run is the minimum threshold for nominal public support for that tuple.
- Repeated reviewed runs are required before stronger commendations.
- A green package validation run is not a public harness/model support claim without conformance evidence.

## Acceptance Criteria

- Public support wording cannot collapse harness, provider, and model into a blanket claim.
- Scenario adapters consume existing validation commands rather than replacing them.
- Future provider-backed, plugin, and playbook scenarios remain deferred until their designs have executable behavior.

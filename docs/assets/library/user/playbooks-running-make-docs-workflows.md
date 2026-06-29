---
title: "Running Make Docs Playbooks"
kind: "guide"
path: "playbooks"
persona: "user"
status: "draft"
order: 100
tags:
  - playbooks
  - workflows
  - run-playbook
applies-to:
  - playbooks
  - workflows
related:
  - ../developer/playbooks-development-runner-architecture.md
  - ./workflows-how-make-docs-stages-fit-together.md
  - ../developer/development-workflows-stage-model-and-artifact-relationships.md
  - ../../../prd/29-revise-playbook-contract-run-playbook.md
  - ../../../prd/30-revise-harness-plugin-substrate-workflow-bundles.md
  - ../../../designs/2026-06-27-run-playbook-orchestration-and-harness-capabilities.md
---

# Running Make Docs Playbooks

This guide describes the accepted v2 direction for Playbooks after W18 R4, W18 R1, W18 R2, and W18 R3 are implemented. It is written as planned product behavior, not as a claim that every runner surface is already available in the current package.

## What a Playbook Is

A Playbook is a reusable workflow document that Make Docs can validate, select, and run with an agent. It is still readable Markdown, but it has enough structure for Make Docs to know what the workflow is for, what authority it depends on, what inputs it needs, where it may write outputs, and when a human decision is required.

Playbooks live under `docs/assets/playbooks/<persona>/<slug>.md`. The stable identity is `persona/slug`. A Playbook also declares a required `stack` value so Make Docs can distinguish between build workflows and run workflows.

## What Users Can Do With Playbooks

Users will be able to use Playbooks as repeatable workflows instead of rebuilding Make Docs procedure knowledge from scratch each time.

A maintainer might run a build-stack Playbook to move from an idea to a design, from a design to a plan, from a plan to PRD updates, or from a work backlog to closeout. These Playbooks operate on Make Docs-managed artifacts and are expected to respect the documentation lifecycle.

A project user might run a run-stack Playbook to use an installed workflow against their own project. That might mean capturing a change request, running a guided project workflow, or using a shipped workflow bundle without needing to understand Make Docs internals.

A team can also install Playbooks as shared project assets. The Playbook remains a readable document, while Make Docs provides the runner, resolver, validation, state, and harness mediation needed to execute it safely.

## How a Run Starts

A Playbook run can start from different surfaces:

- A person can ask an agent to run a Playbook by name, by `persona/slug`, or by an explicit path.
- A future CLI command can resolve and validate the Playbook before the agent follows it.
- A future MCP tool can expose the same resolver and validation behavior to an agent harness.
- A plugin or workflow bundle can present a guided entry point that invokes the same Run Playbook behavior underneath.

The exact public command and tool names are intentionally left to the implementation backlogs. The important contract is that these entry points all use the same resolver, validator, run-state model, and safety rules.

## The Simplest Run

In the simplest arrangement, an agent or runner performs the Playbook step by step.

Make Docs resolves the selected Playbook, validates the metadata and required sections, loads the referenced authority, creates run state, and then proceeds through the workflow. When the Playbook reaches a gate, decision, missing input, conflict, or unsafe write, the run pauses and asks for review instead of guessing.

This basic mode does not require special harness support. It is serial, review-oriented, and intentionally conservative.

## Runs With Harness Assists

Some agent harnesses can help with long-running work. A harness might support goal-managed execution, resumable sessions, subagents, parallel work, or native prompts for user gates.

Make Docs does not guess that a harness has those capabilities. Reviewed harness capability records belong in `.make-docs/config.yaml`. When a capability is unknown, Make Docs either asks the agent to inspect and request review before recording it, or falls back to serial gated execution.

Harness features are assists. The Playbook contract, resolver, run state, gates, and output-surface rules still belong to Make Docs.

## Nested And Parallel Runs

Some Playbooks can call other Playbooks. A parent Playbook can be allowed to run child Playbooks serially or in parallel, but only when that permission is explicit in the Playbook metadata.

Parallel runs require non-overlapping output-surface claims. If two runs might write to the same files, artifact families, or managed surfaces, Make Docs stops for review instead of letting the runs race.

This allows larger workflows to be composed without making concurrency the default behavior.

## Plugins And Workflow Bundles

Plugins and workflow bundles are user-facing entry points. A plugin can expose a guided workflow in a harness-native way, but it does not become a separate Playbook runner.

When a plugin runs a Playbook, it should invoke the generic Run Playbook model. That keeps CLI, MCP, plugin, and agent-driven runs aligned around the same validation, state, gates, and permission behavior.

## What Playbooks Do Not Do

Playbooks are not hidden automation scripts. They should remain readable and reviewable.

Playbooks do not bypass gates just because a user starts them from a CLI, MCP tool, plugin, or harness. Unattended behavior must be explicitly allowed by the Playbook and by the runner surface.

Playbooks also do not redefine Make Docs authority. If a Playbook changes PRDs, plans, work backlogs, or package behavior, it still has to follow the appropriate Make Docs contracts and lifecycle.

## Future Coverage

This guide should be refreshed after W18 implementation lands with the final command names, MCP tool names, plugin entry points, and a small set of end-user examples that can be run against an installed Make Docs project.

## Related Resources

- [How Make Docs Stages Fit Together](./workflows-how-make-docs-stages-fit-together.md)
- [Run Playbook Runner Architecture](../developer/playbooks-development-runner-architecture.md)
- [29 Revise Playbook Contract Run Playbook](../../../prd/29-revise-playbook-contract-run-playbook.md)
- [30 Revise Harness Plugin Substrate Workflow Bundles](../../../prd/30-revise-harness-plugin-substrate-workflow-bundles.md)
- [Run Playbook Orchestration and Harness Capabilities](../../../designs/2026-06-27-run-playbook-orchestration-and-harness-capabilities.md)

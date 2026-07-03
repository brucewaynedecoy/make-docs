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
  - ../../../prd/33-enhance-playbook-packaging-and-harness-adapter-registry.md
  - ../../../prd/34-revise-playbook-contract-and-model.md
  - ../../../prd/35-revise-run-playbook-state-machine.md
  - ../../../../.make-docs/contracts/system/playbook-contract.md
  - ../../../designs/2026-06-27-run-playbook-orchestration-and-harness-capabilities.md
  - ../../../designs/2026-06-29-playbook-packaging-and-harness-adapter-registry.md
---

# Running Make Docs Playbooks

This guide describes the accepted v2 direction for Playbooks after W18 R4, W18 R1, W18 R2, and W18 R3 are implemented. It is written as planned product behavior, not as a claim that every runner surface is already available in the current package.

## What a Playbook Is

A Playbook is a reusable workflow document that Make Docs can validate, select, and run with an agent. It is still readable Markdown, but it has enough structure for Make Docs to know what the workflow is for, what authority it depends on, what inputs it needs, where it may write outputs, and when a human decision is required.

Playbooks live under `docs/assets/playbooks/<persona>/<slug>.playbook.md`. The stable identity is `persona/slug`. An older plain `<slug>.md` file with `kind: playbook` frontmatter is still recognized, but it is a deprecated form: validation flags it with a warning that asks for a rename to `<slug>.playbook.md`. A Playbook also declares a required `stack` value so Make Docs can distinguish between build workflows and run workflows.

The normative document schema — the filename form, frontmatter, required section order, workflow contract block, and dependency registry — is [the Playbook contract](../../../../.make-docs/contracts/system/playbook-contract.md). This guide covers what users do with Playbooks; the contract is the authority for what a Playbook file must contain.

## Installed Default Playbook

A default Make Docs install includes the Make Docs lifecycle Playbook at:

```text
docs/assets/playbooks/agent/make-docs-lifecycle.playbook.md
```

This Playbook is a readable workflow for the `agent` persona. It describes how an agent should move through the Make Docs lifecycle from source evidence to design, plan, PRD, work backlog, implementation, validation, closeout, and history.

Users can inspect available Playbooks with:

```sh
make-docs run playbook catalog --repo-root .
```

The catalog lists each Playbook by its canonical reference — `agent/make-docs-lifecycle` for the default — with its title, summary, stack, status, file form, whether it is currently runnable, and its error and warning counts.

They can validate one Playbook, several, or every installed Playbook with:

```sh
make-docs run playbook validate agent/make-docs-lifecycle --repo-root .
```

References may be canonical `persona/slug` values or explicit `.md` paths; with no references, every detected Playbook is validated. Each finding carries a stable code such as `PB-FM-002`, a severity of `error` or `warning`, the section and source location where it was found, a message, and a fix hint. A Playbook with zero errors is runnable; warnings do not block it. The most common warning during migration is `PB-FILE-007`, which asks for a rename from the deprecated plain `<slug>.md` name to `<slug>.playbook.md`.

MCP-capable agent harnesses reach the same behavior through the `make_docs_playbook_validate` and `make_docs_playbook_catalog` tools.

They can start the current operation-level invocation model with:

```sh
make-docs run playbook invoke agent/make-docs-lifecycle --repo-root . --harness codex --stack build
```

The command validates the Playbook and creates Make Docs run state. It does not bypass review gates or turn the Playbook into a plugin.

Run state lives in the machine-level global store at `~/.make-docs/`, not in your repository. Starting or invoking a run writes nothing under the project — there is no `.make-docs/runs/` clutter to commit or ignore — and the run is keyed to the stable project identity Make Docs minted at setup plus a run identifier, so it survives moving or renaming the repository directory. This also means Playbook runs need a set-up project: in a repository without Make Docs installed, or with an older install that predates the project identifier, `run playbook start` and `run playbook invoke` stop with guidance to run `make-docs setup` (or run `make-docs` once to mint the identifier) instead of writing state anywhere. `make-docs run playbook status --run-id <id>` reads the same stored record back for resume or audit.

A started run is no longer read-only: the full lifecycle from start to a terminal status can be driven from the CLI or MCP. See Driving a Run from Start to Close below.

## What Users Can Do With Playbooks

Users will be able to use Playbooks as repeatable workflows instead of rebuilding Make Docs procedure knowledge from scratch each time.

A maintainer might run a build-stack Playbook to move from an idea to a design, from a design to a plan, from a plan to PRD updates, or from a work backlog to closeout. These Playbooks operate on Make Docs-managed artifacts and are expected to respect the documentation lifecycle.

A project user might run a run-stack Playbook to use an installed workflow against their own project. That might mean capturing a change request, running a guided project workflow, or using a shipped workflow bundle without needing to understand Make Docs internals.

A team can also install Playbooks as shared project assets. The Playbook remains a readable document, while Make Docs provides the runner, resolver, validation, state, and harness mediation needed to execute it safely.

## How a Run Starts

A Playbook run can start from different surfaces:

- A person can ask an agent to run a Playbook by name, by `persona/slug`, or by an explicit path.
- `make-docs run playbook invoke <ref> --harness <id>` can resolve and validate the Playbook, create Make Docs-owned run state in the global store, and return the next gated step without requiring a plugin.
- `make_docs_playbook_invoke` exposes the same write-gated behavior to MCP-capable agent harnesses when the caller passes `allowWrite=true`.
- A plugin or workflow bundle can present a guided entry point that invokes the same Run Playbook behavior underneath.

The current operation command is a deterministic Make Docs operation surface, not a polished product shortcut. The important contract is that these entry points all use the same resolver, validator, run-state model, and safety rules.

## Driving a Run from Start to Close

A run started from the CLI can now be carried all the way to a terminal status. Each step below also works through the matching MCP tool (`make_docs_playbook_next`, `make_docs_playbook_advance`, `make_docs_playbook_gate`, `make_docs_playbook_resume`, `make_docs_playbook_close`) in an MCP-capable harness; the recording tools require the caller to pass `allowWrite=true`, while `next` is read-only.

Start a run against a set-up project and note the run identifier it returns:

```sh
make-docs run playbook start agent/make-docs-lifecycle --repo-root . --harness codex
```

Ask where the run stands whenever you need direction:

```sh
make-docs run playbook next --repo-root . --run-id <run-id>
```

`next` never changes the run. It reports the current position — a step to execute, a gate waiting for a decision, `blocked` with the reasons, `closeable` when no workflow position remains, or `closed` after finalization — along with the step's title, mode, and invocation, whether its required dependencies are recorded as available, and what to do about anything in the way. A required dependency recorded as unavailable blocks the position; one with unknown availability comes back as probe-first guidance instead. `make-docs run playbook status --repo-root . --run-id <run-id>` still returns the raw stored record when you want the full state instead of a recommendation.

Then advance the run. What `advance` does depends on the step's execution mode, which `next` reports:

```sh
make-docs run playbook advance --repo-root . --run-id <run-id>
```

- A `deterministic` step executes itself. Make Docs runs the step's declared operation or command, captures what happened — the exit code and output, or the operation's result — as run evidence, and moves the cursor automatically. If you would rather run the command yourself, pass `--present`: Make Docs prints the exact command to run by hand and holds the step; run it, then advance again with `--outcome` and your evidence to report what happened.
- A `delegated` step — and any step that declares no mode — is work for you or your agent. `advance` presents the step's instructions and holds the run at `waiting-for-user`. Do the work, then advance again with `--outcome completed` or `--outcome failed`, citing evidence:

  ```sh
  make-docs run playbook advance --repo-root . --run-id <run-id> --outcome completed \
    --evidence-ref docs/path/to/proof.md --note "What was done"
  ```

  The run only moves past a delegated step on a reported outcome.
- A `manual` step is documentation only. Acknowledge that you read it with `--acknowledge`; it takes no outcome and executes nothing.

Recording `--outcome failed` holds the run for review unless the Playbook declares an explicit failure route. `--evidence-ref` and `--output-ref` repeat for multiple references, and everything recorded — including what deterministic steps executed — lands in the stored run record for audit and resume.

When the run is positioned at a gate, record the decision instead of advancing:

```sh
make-docs run playbook gate --repo-root . --run-id <run-id> --decision approve
```

`approve` moves the run past the gate; `reject` stops it at the gate for re-planning. Gate decisions also accept `--evidence-ref` and `--note`.

If a run is blocked — a failed step, a rejected gate — or you are returning to it after an interruption, re-enter it:

```sh
make-docs run playbook resume --repo-root . --run-id <run-id>
```

Resume first checks that the Playbook file has not changed since the run started, by comparing the content digest stored at `start` with the current file. When they match, the run reopens at the same position it held; resume never skips work or moves the cursor. After resuming, retry the step with `advance`, revisit the gate with `gate`, or finalize instead.

If the Playbook file did change, resume refuses: the run is marked stale and blocked, and the error names the file, both digests, and which step identifiers were added or removed. A stale run also refuses `advance` and `gate` — Make Docs never silently continues a run against a changed workflow. From there you have three honest options: start a fresh run against the current Playbook with `start`, revert the Playbook change and resume again (the block clears when the digests match), or explicitly migrate the existing run onto the changed Playbook:

```sh
make-docs run playbook resume --repo-root . --run-id <run-id> --migrate
```

`--migrate` is an opt-in, never the default. It keeps the recorded status of every step that still exists in the changed Playbook, treats newly added steps as not yet done, drops steps that no longer exist (naming them in the run's evidence), and re-enters at your surviving position. Use it when the change edited the workflow around your progress; prefer a fresh run when the workflow was redesigned.

When `next` reports the run is `closeable` — or you decide to end it early — finalize it:

```sh
make-docs run playbook close --repo-root . --run-id <run-id> --terminal-status completed
```

`close` is the only operation that stamps the terminal status (`completed`, `failed`, or `cancelled`), and a closed run refuses any further changes. Reaching the end of the workflow does not auto-close a run; the run waits for you so the closeout decision stays explicit.

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

## Packaging Playbooks

Make Docs also plans to let reviewed Playbooks become shareable harness-specific outputs. A Playbook can remain a normal Markdown workflow while Make Docs generates a package plan for a plugin or skills bundle that exposes the workflow in a harness-native way.

Packaging is not blind conversion. Make Docs should validate deterministic parts such as Playbook identity, source digest, selected harness, output kind, surface, and lifecycle ownership. Semantic fields such as plugin descriptions, skill grouping, or harness-native wording may be drafted by an agent, but they require review before Make Docs writes generated outputs.

The generated package should point back to the source Playbook and use the same runner model when it is invoked. The packaged output is a distribution artifact; the Playbook remains the editable source.

## What Playbooks Do Not Do

Playbooks are not hidden automation scripts. They should remain readable and reviewable.

Playbooks do not bypass gates just because a user starts them from a CLI, MCP tool, plugin, or harness. Unattended behavior must be explicitly allowed by the Playbook and by the runner surface.

Playbooks also do not redefine Make Docs authority. If a Playbook changes PRDs, plans, work backlogs, or package behavior, it still has to follow the appropriate Make Docs contracts and lifecycle.

## Future Coverage

This guide should be refreshed after W18 implementation lands with plugin entry points, packaging commands, package-plan review examples, and a small set of end-user examples that can be run against an installed Make Docs project.

- Blocked by: W18 R7 runner consumption of the parsed Playbook model. Update when: W18 R7 moves the runner surfaces onto the W18 R6 model. Guide change: revisit whether a reader-facing projection of the Playbook contract is warranted as its own guide. W18 R6 Phase 5 and wave completion resolved the previous trigger and re-deferred creation: the document schema itself is now hardened and stable — every diagnostic code has a failing fixture and the upstream and dogfood contract copies are machine-checked byte-identical — which removes the earlier stability objection, but the contract remains normative and linkable on its own, this guide already covers the user-visible validate/catalog surface, and a projection authored now would quote pre-runner behavior that W18 R7 changes, so it would need immediate rework for no added reader value. The W18 R11 command reorganization, formerly a second trigger, has landed and this guide now uses the `run playbook` spellings.

## Related Resources

- [How Make Docs Stages Fit Together](./workflows-how-make-docs-stages-fit-together.md)
- [Run Playbook Runner Architecture](../developer/playbooks-development-runner-architecture.md)
- [29 Revise Playbook Contract Run Playbook](../../../prd/29-revise-playbook-contract-run-playbook.md)
- [30 Revise Harness Plugin Substrate Workflow Bundles](../../../prd/30-revise-harness-plugin-substrate-workflow-bundles.md)
- [33 Enhance Playbook Packaging and Harness Adapter Registry](../../../prd/33-enhance-playbook-packaging-and-harness-adapter-registry.md)
- [34 Revise Playbook Contract and Model](../../../prd/34-revise-playbook-contract-and-model.md)
- [35 Revise Run Playbook State Machine](../../../prd/35-revise-run-playbook-state-machine.md)
- [Playbook Contract](../../../../.make-docs/contracts/system/playbook-contract.md)
- [Run Playbook Orchestration and Harness Capabilities](../../../designs/2026-06-27-run-playbook-orchestration-and-harness-capabilities.md)
- [Playbook Packaging and Harness Adapter Registry](../../../designs/2026-06-29-playbook-packaging-and-harness-adapter-registry.md)
- [Packaging Shareable Agent Workflows](./playbooks-packaging-shareable-agent-workflows.md)

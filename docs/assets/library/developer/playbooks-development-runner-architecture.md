---
title: "Run Playbook Runner Architecture"
kind: "guide"
path: "playbooks/development"
persona: "developer"
status: "draft"
order: 100
tags:
  - playbooks
  - run-playbook
  - cli
  - mcp
  - plugins
applies-to:
  - playbooks
  - cli
  - mcp
  - plugins
related:
  - ../user/playbooks-running-make-docs-workflows.md
  - ./cli-mcp-operation-parity-and-permissions.md
  - ./development-workflows-stage-model-and-artifact-relationships.md
  - ../../../prd/25-revise-cli-separation-and-mcp-boundary.md
  - ../../../prd/29-revise-playbook-contract-run-playbook.md
  - ../../../prd/30-revise-harness-plugin-substrate-workflow-bundles.md
  - ../../../prd/33-enhance-playbook-packaging-and-harness-adapter-registry.md
  - ../../../prd/34-revise-playbook-contract-and-model.md
  - ../../../../.make-docs/contracts/system/playbook-contract.md
  - ../../../designs/2026-06-27-run-playbook-orchestration-and-harness-capabilities.md
  - ../../../designs/2026-06-29-playbook-packaging-and-harness-adapter-registry.md
  - ../../../work/2026-06-23-w18-r1-playbook-contract-run-playbook/00-index.md
  - ../../../work/2026-06-27-w18-r4-run-playbook-orchestration-and-harness-capabilities/00-index.md
  - ../../../work/2026-06-29-w18-r5-playbook-packaging-and-harness-adapter-registry/00-index.md
---

# Run Playbook Runner Architecture

This guide explains the accepted v2 architecture for Run Playbook after W18 R4, W18 R1, W18 R2, and W18 R3 are implemented. It is a developer guide for contributors and maintainers. The implemented operation primitives include `playbook-catalog`, `playbook-resolve`, `playbook-capabilities`, `playbook-run-start`, `playbook-run-invoke`, and `playbook-run-read`; later plugin and bundle command names may still be refined by their implementation phases.

## Architectural Shape

Run Playbook should be implemented as a shared TypeScript operation domain. CLI commands, MCP tools, plugins, and harness-native entry points should call that operation domain instead of each building a separate runner.

The runner is responsible for deterministic plumbing: resolution, validation, authority loading, capability mediation, run-state management, gate handling, child-run scheduling, and output-surface protection.

The agent remains responsible for judgment and task execution. The CLI is not expected to become an autonomous LLM. It should provide the rails that let an agent run a Playbook predictably and resume or stop safely.

## Entry Points

Run Playbook can be reached through several surfaces:

- CLI: a command can resolve, validate, dry-run, start, resume, pause, or inspect a Playbook run.
- MCP: tools can expose the same read-first and plan-first behavior to an agent harness.
- Plugin or workflow bundle: a harness-visible entry point can invoke a built-in workflow without reimplementing the runner.
- Direct agent request: an agent can read the Playbook and still use Make Docs contracts, config, and run state as the execution authority.

Each surface should delegate to the same operation module. Public dispatch can stay thin, but the domain logic needs to be testable without invoking the full CLI parser or MCP transport.

W18 R4 Phase 2 adds the first read-only playbook operation primitives:

- `make-docs operations playbook-catalog --repo-root <path>` lists valid playbooks under `docs/assets/playbooks/<persona>/<slug>.md`.
- `make-docs operations playbook-resolve <ref> --repo-root <path> [--stack build|run]` resolves an explicit path, `persona/slug`, or unique bare slug/title before any execution behavior starts.
- MCP exposes the same resolver primitives through `make_docs_playbook_catalog` and `make_docs_playbook_resolve`.

W18 R4 Phase 3 adds read-only harness capability evaluation:

- `.make-docs/config.yaml` may include `harnessCapabilities` records with `harness`, `reviewStatus`, `capabilities`, optional `source`, and optional `caveats`.
- Canonical capability ids are `goal_managed_execution`, `long_running_runs`, `resume_after_interrupt`, `parallel_playbook_runs`, `subagent_delegation`, and `user_gate_prompts`.
- `make-docs operations playbook-capabilities --repo-root <path> --harness <id> --requires-capability <id> --prefers-capability <id>` evaluates a request without mutating config or starting a run.
- MCP exposes the same behavior through `make_docs_playbook_capabilities`.

W18 R4 Phase 4 adds Make Docs-owned run-state primitives:

- `make-docs operations playbook-run-start <ref> --repo-root <path> --harness <id> [--run-id <id>]` creates `.make-docs/runs/playbooks/<run-id>/state.json`.
- `make-docs operations playbook-run-read --repo-root <path> --run-id <id>` reads saved run state for resume or audit.
- MCP exposes `make_docs_playbook_run_start` behind `allowWrite=true` and `make_docs_playbook_run_read` as a read-only state inspection tool.

W18 R1 Phase 3 adds the first generic invocation primitive:

- `make-docs operations playbook-run-invoke <ref> --repo-root <path> --harness <id> [--stack build|run]` resolves a valid Playbook, extracts the authority/procedure/gate/assist/output model, creates run state, and returns the next gated step.
- MCP exposes the same behavior through `make_docs_playbook_run_invoke` behind `allowWrite=true`.
- The invocation result labels CLI, MCP, plugin, skill, template-sync, and unattended support claims as `provisional` until each surface has validation evidence.

## Runner Pipeline

The expected runner pipeline is:

```text
caller
  -> run-playbook operation domain
  -> load config, manifest, and catalog state
  -> resolve playbook reference
  -> validate playbook metadata and body contract
  -> load declared authority and inputs
  -> evaluate run metadata
  -> mediate harness capabilities
  -> create or resume run state
  -> execute the next step or gate
  -> write allowed outputs
  -> update state
  -> complete, pause, block, or resume
```

The pipeline should be shared by CLI, MCP, plugin, and agent-facing usage. If one surface needs a different permission posture, it should pass policy into the same domain instead of branching into a separate implementation.

The implemented `playbook-run-invoke` operation is still conservative. It does not pretend to be an autonomous LLM runner. It resolves and validates the source, loads referenced authority path facts, evaluates required and preferred assists, creates run state, chooses the next procedure step, and pauses or blocks when gates, missing authority, or required assists require review.

## Resolver And Catalog Semantics

Playbooks live under `docs/assets/playbooks/<persona>/<slug>.md`. The stable resolver identity is `persona/slug`.

Selection should follow this order:

1. Explicit path.
2. `persona/slug`.
3. Bare slug or title only when it resolves to exactly one candidate.

The `stack` metadata remains required, but it is not another directory level. It helps validation and disambiguation after candidate resolution.

Ambiguity fails closed. If two Playbooks can match the same bare slug or title, the runner should ask for a more specific reference instead of choosing one.

The implemented resolver validates stack requests before returning a selected Playbook. If `--stack build` is requested for a run-stack Playbook, the resolver fails before authority loading, procedure execution, or output routing can begin.

## Catalog Contract Validation

Contract authority note: since W18 R6 Phase 1, the normative Playbook document schema is owned by [the Playbook contract](../../../../.make-docs/contracts/system/playbook-contract.md) per [PRD 34](../../../prd/34-revise-playbook-contract-and-model.md). The contract defines the `<slug>.playbook.md` filename form, the eleven-heading spine, the expanded frontmatter enums, the embedded `playbook` workflow contract block, and the dependency registry that the W18 R6 parser and validator will enforce. The behavior described below is the implemented W18 R4 catalog validation, which remains what the code enforces until the W18 R6 parser and validator phases land.

The catalog fails closed before selection. A Playbook is catalogable only when it lives directly under `docs/assets/playbooks/<persona>/<slug>.md`, has YAML frontmatter, declares `kind: playbook`, and uses a configured persona slug that matches the path directory.

The required frontmatter fields are `title`, `kind`, `status`, `persona`, `stack`, and `summary`. Accepted `status` values are `proposed`, `accepted`, and `deprecated`; accepted `stack` values are `build` and `run`.

The body must expose the durable runner contract in readable Markdown. Current diagnostics require coverage for purpose, inputs and authority, procedure, gates or decisions, allowed assists, expected outputs or handoff artifacts, and validation or completion expectations.

Do not make transitional paths such as `docs/library/playbooks/**` selectable. Historical playbook files are migration evidence only; the v2 runner and resolver should use the canonical `docs/assets/playbooks/**` tree.

## Shipped Default Playbooks

Accepted shipped Playbook defaults use the PRD 19 source-of-truth path:

1. Author the default in `packages/docs/template/docs/assets/playbooks/**`.
2. Reseed the matching dogfood copy under `docs/assets/playbooks/**`.
3. Regenerate `packages/cli/template/**` through `npm run prepack -w packages/cli` or `npm run smoke:pack`.
4. Validate package behavior with `npm run validate:defaults -w packages/cli` and `npm run smoke:pack`.

The Make Docs lifecycle Playbook is the first reviewed shipped default. Its source-template, dogfood, and generated package copies must stay byte-for-byte aligned at `docs/assets/playbooks/agent/make-docs-lifecycle.md`.

Do not add recursive catalog ownership for every file under `docs/assets/playbooks/**`. Shipped defaults should be named explicitly in the catalog rules so user-authored project Playbooks do not become managed package files by accident.

## Harness Capability Mediation

Harness features are optional execution assists. Make Docs can use features such as goal-managed execution, long-running runs, resume after interrupt, parallel playbook runs, subagent delegation, or user gate prompts when the harness is known to support them.

Reviewed capability records live in `.make-docs/config.yaml`. The runner must not invent or silently persist a capability record. If a required capability is unknown, the run stops or asks the agent to inspect and request review. If an optional capability is unknown, the runner should fall back to serial gated execution.

The capability model is a mediator between Make Docs and harness-specific behavior. It is not a replacement for Make Docs-owned run state.

The implemented evaluator trusts only `reviewStatus: reviewed` records. Unreviewed records remain visible as evidence, but they are not execution authority. Required unknown or unsupported capabilities return `manual-review-required`; optional unavailable or unknown capabilities return `serial-gated-fallback`.

## Run State

Make Docs-owned run state lives under `.make-docs/runs/playbooks/<run-id>/state.json`.

State should capture enough information to resume or audit a run:

- selected Playbook identity and source path;
- resolved authority and inputs;
- runner policy and capability decisions;
- current step, gate, or blocked reason;
- declared output surfaces and child-run claims;
- completed steps and produced outputs;
- resumability and interrupt metadata.

Manifest state remains for managed installation ownership. It should not become the home for local harness capability knowledge or transient Playbook execution state.

The implemented state creator records `stateSource: "make-docs"` and `harnessAssistsAreSourceOfTruth: false` so harness-native goal or long-running features remain assists rather than the recovery authority.

## Nested And Parallel Playbooks

Nested Playbooks require explicit permission in the parent Playbook metadata. Parallel child runs require explicit permission and non-overlapping output-surface claims.

The runner should treat each child Playbook as its own run with its own state, while the parent records child references and aggregate status. If output claims overlap, or if the runner cannot prove they are separate, execution stops for review.

Default behavior is serial and gated. Parallelism is an opt-in capability, not a default optimization.

The implemented child-run guard reads the parent run state before creating a child state file. Parent Playbooks default to `child_playbooks: none`; serial or parallel children require explicit parent metadata. Parallel child runs also fail when their output-surface claims overlap with the parent run or an existing child run.

## Plugin And Workflow Bundle Boundary

Plugins and workflow bundles are entry points and packaging surfaces. They may provide harness-native commands, prompts, or guided flows, but they must invoke the Run Playbook operation domain for Playbook selection and execution.

This keeps bundle behavior aligned with CLI and MCP behavior. A plugin should not invent separate state, separate capability rules, or separate nested-run logic.

## Playbook Packaging Boundary

W18 R5 adds a separate package-planner boundary around Run Playbook. The runner selects, validates, executes, pauses, resumes, and records Playbook runs. The package planner turns accepted Playbook sources into reviewed generated outputs such as harness-specific plugins or skills bundles.

Those outputs may expose a nicer harness-native entry point, but they are not the source Playbook and they are not a second runner. Generated package outputs should call the same Run Playbook operation domain and should carry package-plan provenance, source Playbook refs, source digests, target harness, output kind, selected surface, adapter id, review status, and support status.

Harness-specific packaging behavior belongs in a harness adapter registry. Future harnesses should be added with adapter declarations, fixtures, conformance evidence, and output-writer tests instead of conditionals inside the runner.

## Permission And Parity Expectations

The CLI, MCP server, and plugin surfaces should preserve the same core decisions:

- read-only inspection is allowed before writes;
- dry-run and plan-first flows should be available before mutation;
- gate prompts are required when Playbook metadata or runner policy requires review;
- unattended runs require explicit permission from the Playbook and the entry surface;
- MCP tools must not expose a capability that lacks a shared operation-domain owner.

When a new runner behavior is added, it needs focused operation tests and parity expectations for every surface that exposes it.

## Future Coverage

This guide should be refreshed when W18 implementation chooses final run-state command names, state schema details, plugin bundle entry points, package-planner commands, harness adapter modules, and generated-output writers. It should also be updated with links to additional concrete operation modules and tests as W18 R1 through W18 R5 land.

- Blocked by: W18 R6 Phases 2 and 3. Update when: the single parsed Playbook model, the staged parser, and the layered validator with the diagnostic catalog replace the W18 R4 catalog validation described above. Guide change: replace the Catalog Contract Validation section's implemented-behavior description with the model/parser/validator architecture and keep the Playbook contract as the schema authority.

## Related Resources

- [Running Make Docs Playbooks](../user/playbooks-running-make-docs-workflows.md)
- [CLI/MCP Operation Parity and Permissions](./cli-mcp-operation-parity-and-permissions.md)
- [Understanding the Make Docs Stage Model](./development-workflows-stage-model-and-artifact-relationships.md)
- [25 Revise CLI Separation and MCP Boundary](../../../prd/25-revise-cli-separation-and-mcp-boundary.md)
- [29 Revise Playbook Contract Run Playbook](../../../prd/29-revise-playbook-contract-run-playbook.md)
- [30 Revise Harness Plugin Substrate Workflow Bundles](../../../prd/30-revise-harness-plugin-substrate-workflow-bundles.md)
- [33 Enhance Playbook Packaging and Harness Adapter Registry](../../../prd/33-enhance-playbook-packaging-and-harness-adapter-registry.md)
- [34 Revise Playbook Contract and Model](../../../prd/34-revise-playbook-contract-and-model.md)
- [Playbook Contract](../../../../.make-docs/contracts/system/playbook-contract.md)
- [Run Playbook Orchestration and Harness Capabilities](../../../designs/2026-06-27-run-playbook-orchestration-and-harness-capabilities.md)
- [Playbook Packaging and Harness Adapter Registry](../../../designs/2026-06-29-playbook-packaging-and-harness-adapter-registry.md)
- [Playbook Packaging and Harness Adapters](./playbooks-development-packaging-and-harness-adapters.md)

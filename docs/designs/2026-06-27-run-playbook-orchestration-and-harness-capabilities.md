# Run Playbook Orchestration and Harness Capabilities

## Purpose

Harden the v2 Run Playbook model before W18 R1, W18 R2, and W18 R3 implementation by defining playbook resolver identity, harness capability mediation, Make Docs-owned run state, nested playbook execution, and safe concurrency rules.

## Context

[Playbook Contract and Run Playbook](2026-06-20-playbook-contract-and-run-playbook.md) defines playbooks as persona-scoped documents under `docs/assets/playbooks/<persona-slug>/<playbook-slug>.md` and defines Run Playbook as a generic execution model rather than a plugin packaging rule. [Harness Plugin Substrate and Workflow Bundles](2026-06-20-harness-plugin-substrate-and-workflow-bundles.md) then makes plugins additive harness-visible entrypoints over accepted contracts.

Those designs intentionally left the first runner model thin: select one playbook, validate frontmatter, load authority, step through gates, and route outputs. That model is not yet sufficient for long-running, goal-oriented, nested, or concurrent playbook work. Agent harnesses may provide goal commands, long-running loops, subagents, resume behavior, or other execution affordances, but Make Docs cannot assume those capabilities for every harness or model.

The configuration overlay design defines `.make-docs/config.yaml` as project-owned configuration for presentation and local convention, while preserving canonical paths, metadata keys, route identifiers, and manifest ownership. The W18 R4 decision uses that same project-owned config surface for reviewed harness capability facts, without allowing config to rename playbook storage, resolver keys, stack values, or output routing.

## Decision

W18 R4 is a blocking corrective wave before W18 R1, W18 R2, or W18 R3 implementation. W18 R1 remains the playbook content and runner implementation backlog, W18 R2 remains the plugin substrate and workflow bundle backlog, and W18 R3 remains the optional adversarial-review extension backlog. Each must consume this orchestration contract before work proceeds.

Playbook filesystem paths remain `docs/assets/playbooks/<persona-slug>/<playbook-slug>.md`. The resolver identity is `persona/slug`; `stack` remains required metadata for validation and disambiguation, not a directory level. Explicit paths select exactly one file. Qualified `persona/slug` references select that playbook and validate its `stack`. Bare slug or title selection is allowed only when it resolves to exactly one candidate across configured personas and stacks; otherwise the runner must stop and ask for persona and/or stack.

Playbooks may include an optional `run` metadata block that narrows orchestration behavior without changing the minimum playbook contract:

```yaml
run:
  requires_capabilities: []
  prefers_capabilities: []
  child_playbooks: none | serial | parallel
  concurrency: serial | parallel-allowed | parallel-required
```

The recognized harness capability names are canonical automation values. Initial names are `goal_managed_execution`, `long_running_runs`, `resume_after_interrupt`, `parallel_playbook_runs`, `subagent_delegation`, and `user_gate_prompts`. Later plans may add values, but they must keep canonical ids stable and treat display labels as configuration-rendered text.

Reviewed harness playbook-execution capabilities live in `.make-docs/config.yaml` under a `harnessCapabilities` section. Config may record known capabilities for a harness, detection source, review status, and caveats. Config does not become routing authority: it may inform execution strategy only after canonical playbook, stack, harness, and output-surface resolution.

Unknown harness capabilities must not be guessed. If a playbook requires a capability that is absent or unknown, the runner or agent must either inspect the active harness and request review before persisting the finding, fall back to serial gated execution when the capability is optional, or stop with a manual-review requirement when the capability is required.

Make Docs-owned run state is required for any Make Docs Run Playbook surface, even when an agent harness provides its own goal or long-running workflow feature. The harness feature is an assist; `.make-docs/runs/playbooks/<run-id>/state.json` is the Make Docs source of truth for recovery, auditability, nested runs, and overlap checks. Run state must record run id, root run id, parent run id, playbook ref, stack, harness, capability snapshot, current step or gate, child runs, claimed output surfaces, status, and resume hints.

Nested playbooks are allowed only when the parent playbook explicitly permits child playbooks. Serial child runs are the default. Parallel child runs require explicit playbook permission, a harness capability or reviewed operator approval that supports parallel execution, and non-overlapping output-surface claims. If overlap cannot be proven safe, the runner must serialize the work or stop for review.

W18 R2 plugins and workflow bundles must invoke this orchestration model rather than inventing separate resolver, capability, run-state, child-run, or concurrency behavior. A plugin may choose a playbook, offer a catalog, or wrap a bundle, but it still delegates playbook execution semantics to the W18 R4 Run Playbook contract.

## Alternatives Considered

Add `stack` as a directory level under `docs/assets/playbooks/**`. Rejected because persona ownership remains the document grouping contract, and stack is a validation discriminator rather than a publication hierarchy.

Store harness capabilities in the manifest. Rejected because manifest state owns managed installation files and selected-agentics ownership. Reviewed harness execution capabilities are project-local convention facts, not proof that Make Docs owns files or payloads.

Use conformance-lab records only. Rejected because conformance evidence gates public support claims, but day-to-day agents need a reviewed local place to remember harness capabilities after discovery.

Let each plugin or workflow bundle define its own playbook state model. Rejected because that would split Run Playbook behavior across plugin implementations and recreate the content-vs-invocation ambiguity W18 R1 and W18 R2 are meant to avoid.

## Consequences

W18 R1 implementation must grow beyond the original thin runner. It must implement resolver semantics, optional run metadata validation, harness capability lookups, unknown-capability handling, Make Docs-owned run state, resume behavior, child run records, and concurrency safety.

W18 R2 must treat plugin and workflow bundle metadata as an invocation layer over the W18 R4 runner. Bundle metadata can describe required capabilities and safety mode, but it cannot define a second execution state machine.

PRD 24 needs a narrow configuration-overlay clarification: `harnessCapabilities` is a reviewed operational hint surface. It remains subordinate to canonical paths, metadata keys, stack values, playbook refs, route identifiers, manifest keys, and output-surface ownership.

Package validation and conformance-lab work must keep support claims evidence-bound. A local config capability record can guide a run, but public claims about Codex, Claude Code, MCP, plugin, unattended, or parallel playbook support still require implementation or conformance evidence for the exact tuple.

## Design Lineage

Update Mode: new-doc-related.

Prior Design Docs: [Playbook Contract and Run Playbook](2026-06-20-playbook-contract-and-run-playbook.md), [Harness Plugin Substrate and Workflow Bundles](2026-06-20-harness-plugin-substrate-and-workflow-bundles.md), [Configuration and Convention Overlay](2026-06-20-configuration-and-convention-overlay.md), [CLI Separation and MCP Boundary](2026-06-20-cli-separation-and-mcp-boundary.md), [Agent Harness and Model Conformance Lab](2026-06-19-agent-harness-and-model-conformance-lab.md).

Reason: This design hardens the accepted playbook and plugin decisions before their implementation backlogs run. It does not replace W18 R1, W18 R2, or W18 R3; it becomes a blocking prerequisite those backlogs must consume.

## Intended Follow-On

Route: `change-plan`

Next Prompt: [designs-to-plan-change.prompt.md](../../.make-docs/references/system/prompts/designs-to-plan-change.prompt.md)

Why: This design corrects and extends active W18 playbook, plugin, configuration, CLI/MCP, conformance, package, and metadata requirements before downstream implementation begins.

Coordinate Handoff: Use W18 R4 as the corrective downstream coordinate. W18 R1, W18 R2, and W18 R3 already exist and remain active, but they must apply W18 R4 before implementation.

# Playbook Packaging and Harness Adapter Registry

## Purpose

Make Playbook packaging a required v2 deliverable and define how Make Docs turns harness-agnostic Playbooks into reviewed, harness-specific plugin or skills-bundle outputs without collapsing the boundary between Playbook source, Run Playbook execution, workflow bundles, skills, and plugins.

## Context

[Playbook Contract and Run Playbook](2026-06-20-playbook-contract-and-run-playbook.md) defines Playbooks as persona-scoped workflow content under `docs/assets/playbooks/<persona>/<slug>.md`. [Run Playbook Orchestration and Harness Capabilities](2026-06-27-run-playbook-orchestration-and-harness-capabilities.md) hardens the runner with resolver identity, reviewed harness capability mediation, Make Docs-owned run state, nested Playbooks, and concurrency safety. [Harness Plugin Substrate and Workflow Bundles](2026-06-20-harness-plugin-substrate-and-workflow-bundles.md) defines plugins as harness-visible invocation packages and workflow bundles as products on top of the substrate.

Those designs intentionally separate content from invocation, but they leave one important v2 product path under-specified: Make Docs should be able to package one or more Playbooks into shippable, shareable agentic outputs. Some target harnesses support plugins. Some support skills but not plugins. Some support both native harness-specific locations and generic standard locations. Future harnesses may support different package shapes, trust preconditions, global/project scopes, symlink behavior, copy mirrors, generated adapters, or publication conventions.

The packaging path cannot be treated as fully deterministic in every detail. Playbooks can contain semantic content, user-authored instructions, persona-specific workflow language, and target-audience framing. Make Docs should make deterministic decisions where the contract can be parsed, validated, and written safely, but agents may assist with semantic package-plan drafting when a Playbook needs harness-native descriptions, prompt wording, skill grouping, or adapter prose. Agent assistance must remain review-gated before Make Docs writes generated package outputs.

## Decision

W18 R5 is a required v2 corrective wave before W18 R1, W18 R2, or W18 R3 implementation proceeds further. It does not replace W18 R1, W18 R2, W18 R3, or W18 R4. It adds the packaging and adapter-registry contract those backlogs must preserve while implementing the Playbook content contract, Run Playbook surfaces, plugin substrate, workflow bundles, and optional adversarial-review exposure.

Make Docs must implement a reviewed Playbook packaging pipeline with deterministic rails:

```text
playbook source
  -> source validation
  -> package intent
  -> reviewed package plan
  -> harness adapter resolution
  -> output writer
  -> manifest and provenance records
  -> package/lifecycle/conformance validation
```

Deterministic rails include parsing Playbook metadata, validating required fields, resolving assets and links, computing source digests, classifying owned versus user-authored files, evaluating allowed output kinds, selecting adapter surfaces, writing accepted package outputs, recording manifest ownership, auditing generated artifacts, backing up before destructive changes, uninstalling only Make Docs-owned outputs, and running validation.

Agent-assisted work is allowed only as package-plan drafting. An agent may propose descriptions, command names, skill grouping, harness-native prompt wording, or adapter prose when semantic interpretation is needed. That proposal is not authority until the user or maintainer accepts the package plan. Non-interactive runs must fail before writing when a package plan requires unresolved semantic judgment, unsafe rewrites, ambiguous ownership, unsupported surfaces, or missing review.

Packaging targets must separate the real harness from the surface profile. `generic` is not a harness target. Standard locations such as `.agents/skills/**` or `<user-home>/.agents/skills/**` are surfaces that a real harness adapter may opt into when the harness supports them and when its preconditions are satisfied. The package plan must model at least:

```yaml
target:
  harness: <harness-id>
  outputKind: plugin | skills-bundle
  surface: native | agents-standard | auto
  scope: project | global | export-only
```

The harness adapter registry owns harness-specific behavior. Each adapter declares supported output kinds, supported surfaces, path templates, preconditions, preferred exposure mode, fallback exposure mode, ownership classification, audit/uninstall behavior, and required conformance evidence. Adding support for a future harness should primarily add a new adapter module, fixtures, and conformance scenarios, not conditionals scattered through the package planner.

The core package planner remains harness-neutral. It validates Playbooks, builds a package plan, records source references, determines whether semantic review is required, and asks the target harness adapter for valid surfaces. The surface resolver chooses native versus standard surfaces using user intent, adapter ranking, project/global scope, trust state, support status, symlink availability, and copy-mirror fallback rules. The package writer performs accepted deterministic writes only after the plan is reviewed or is proven fully deterministic and safe.

Generated outputs are distribution artifacts, not Playbook source. A generated plugin or skills bundle may be installed into `.make-docs/agentics/plugins/**`, `.make-docs/agentics/skills/**`, harness-native locations, generic standard skill locations, or export directories according to the accepted plan and adapter rules. Generated outputs must carry provenance back to the source Playbook refs, source digests, package profile, adapter id, output kind, generated files, ownership status, and support status.

Workflow bundles do not map one-to-one to plugins. A productized bundle family such as Lifecycle, Intake, Scaffolding, Review, or Use/Run may be grouped inside a larger first-party Make Docs plugin, split into separate plugins, exposed as skills bundles for non-plugin harnesses, or packaged from project/user Playbooks. The plugin package is a distribution boundary; the workflow bundle is a product capability grouping; the Playbook remains portable workflow source.

The first v2 implementation should prove the architecture with at least one validated output path and the adapter registry shape. Broader publishing, third-party registry upload, and public support for additional harnesses require explicit implementation and conformance evidence.

## Alternatives Considered

Make every Playbook a plugin. Rejected because it would violate the accepted content-versus-invocation boundary and create unnecessary plugin clutter for simple, manually runnable Playbooks.

Make workflow bundle families equal plugin ids. Rejected because product capability groupings and harness package boundaries do not have to match. A Product Development plugin could contain several bundle families, while a user-authored Playbook could be packaged independently.

Treat `generic` as a harness. Rejected because generic or standard locations are surfaces, not an executing harness. Real harness adapters decide whether they can consume standard surfaces and what preconditions apply.

Force a fully deterministic pipeline. Rejected because semantic Playbook content can require agent assistance to draft useful descriptions, prompts, grouping, or adapter prose. The stable requirement is deterministic state, validation, writes, provenance, audit, lifecycle, and review gates.

Leave the packaging pipeline as post-v2. Rejected because W18 R1 and W18 R2 are about to define Playbook and plugin implementation surfaces. If packaging is not designed now, those backlogs can accidentally hard-code assumptions that block Playbooks from becoming shareable agentic outputs.

## Consequences

W18 R1 must preserve Playbook metadata and validation hooks needed for later package planning, including stable source refs, persona/slug identity, stack metadata, summary, authority, asset/link validation, output-surface declarations, and run metadata.

W18 R2 must treat plugin substrate implementation as adapter-registry-ready. Plugin metadata and manifest ownership need fields for source Playbook refs, generated-from provenance, output kind, target harness, surface profile, support status, and generated artifact lifecycle.

W18 R3 must not imply adversarial review becomes default package content. If adversarial review is later exposed as a Playbook, plugin, skills bundle, CLI command, MCP tool, or workflow bundle, it must go through the same packaging, review, support-claim, and conformance rules.

PRD 25's modular TypeScript operation-domain contract extends to Playbook packaging. The package planner, harness adapter registry, surface resolver, output writers, manifest/audit/lifecycle behavior, and conformance hooks must live in modular TypeScript domains that CLI, MCP, plugin, skill, or agent surfaces can call.

PRD 20 conformance work must cover package outputs and adapter claims. A support claim for a generated plugin or skills bundle applies only to the exact Playbook/package-plan/output-kind/harness/surface/scope/model-provider/runtime tuple that has evidence.

User and developer documentation must explain that Playbooks are portable sources, generated plugins and skills bundles are optional projections, and Make Docs owns the safe packaging rails while agents may assist with reviewed semantic drafting.

## Risks

The largest risk is source/generated drift. A generated plugin or skills bundle can become stale, appear to be the source of truth, or be edited by a user after generation. W18 R5 must require source Playbook refs, source digests, generated-output ownership records, audit classification, backup-before-destructive-change behavior, and review stops for modified or ambiguous generated files.

The second risk is harness-specific branching inside shared planner code. If every new harness adds special cases to the package planner, future support will become fragile. W18 R5 must keep harness-specific behavior in adapter declarations, fixtures, output-writer tests, and conformance records.

The third risk is over-automation. A semantic package plan can require human or agent judgment, but non-interactive runs must not silently invent descriptions, groupings, prompt language, or support claims. Review-gated package plans are required before Make Docs writes generated outputs that depend on semantic judgment.

## Rollout / Migration

W18 R5 should land as authority, PRD reconciliation, and work backlog before W18 R1, W18 R2, or W18 R3 proceed further. The first implementation backlog should add schema, package-planner, adapter-registry, dry-run, and validation behavior before writing generated package outputs.

Existing Playbooks remain valid source documents and do not need migration merely because packaging exists. Existing plugin, skill, and selected-agentics lifecycle work must be updated only where generated-from-Playbook outputs enter those surfaces.

Existing installs that later receive generated package outputs need migration classification for legacy generated outputs, user-modified generated files, unmanaged harness files, symlink exposures, copy mirrors, and package-plan records. Unsafe or ambiguous state should route to review instead of being deleted or rewritten automatically.

## Design Lineage

Update Mode: new-doc-related.

Prior Design Docs: [Playbook Contract and Run Playbook](2026-06-20-playbook-contract-and-run-playbook.md), [Run Playbook Orchestration and Harness Capabilities](2026-06-27-run-playbook-orchestration-and-harness-capabilities.md), [Harness Plugin Substrate and Workflow Bundles](2026-06-20-harness-plugin-substrate-and-workflow-bundles.md), [Shared Agentics Native Harness Exposure Correction](2026-06-27-shared-agentics-native-harness-exposure-correction.md), [CLI Separation and MCP Boundary](2026-06-20-cli-separation-and-mcp-boundary.md), [Agent Harness and Model Conformance Lab](2026-06-19-agent-harness-and-model-conformance-lab.md).

Reason: This design captures a required v2 packaging and adapter-registry deliverable that was implied by the Playbook/plugin roadmap but not yet defined as active implementation authority.

## Intended Follow-On

Route: `change-plan`

Next Prompt: [designs-to-plan-change.prompt.md](../../.make-docs/system/prompts/designs-to-plan-change.prompt.md)

Why: This is an active-set evolution that enhances W18 Playbook, plugin, shared-agentics, CLI/MCP, conformance, package, and guide requirements without replacing the active PRD namespace.

Coordinate Handoff: Use `W18 R5`. W18 R1, W18 R2, W18 R3, and W18 R4 already exist; W18 R5 is the next corrective W18 revision because it adds required v2 Playbook packaging and harness-adapter authority before those downstream W18 backlogs proceed.

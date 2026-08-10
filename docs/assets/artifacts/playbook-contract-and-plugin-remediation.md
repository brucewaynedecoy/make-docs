---
title: "Playbook Contract and Plugin Remediation"
date: "2026-06-29"
kind: "artifact"
status: "draft"
---

# Playbook Contract and Plugin Remediation

This artifact captures the current investigation into the Playbook contract, Run Playbook execution model, Playbook packaging, and generated plugin or skills-bundle outputs. It is working source material for review and iteration. It is not a design, PRD, plan, work backlog, guide, history record, support claim, or implementation authority.

## Review Frame

The triggering finding was that a generated Codex plugin package was not recognized by Codex. That finding is real, but it is only one symptom. The larger issue is that Make Docs is currently trying to package Playbooks into agentic outputs before the Playbook contract is deterministic enough to support that transformation.

A dependable Playbook contract is also valuable before any plugin or skills bundle is generated. Playbooks should be executable primitives for agents: structured enough that an agent can load a Playbook directly, understand the workflow, identify the next step, respect gates, record status, and produce expected outputs without relying on a generated harness package. Skills and plugins should be projections or distribution formats built from Playbooks, not the first point at which Playbooks become operational.

The remediation should first quantify the contract and implementation gaps, then define a staged roadmap that can be converted into normal lifecycle artifacts after review.

## Current Evidence

- [2026-06-20-playbook-contract-and-run-playbook.md](../../designs/2026-06-20-playbook-contract-and-run-playbook.md) defines Playbooks as persona-scoped docs assets and says a Playbook body must include purpose, inputs or authority, procedure, gates, assists, outputs, and validation expectations.
- [35-run-playbook-state-machine-and-portability.md](../../prd/35-run-playbook-state-machine-and-portability.md#requirements) turns that design into requirements, including resolver identity, generic Run Playbook behavior, harness capability mediation, run state, nested Playbook rules, and the additive boundary between Playbooks and plugins.
- There is no first-class `.make-docs/contracts/system/playbook-contract.md` artifact in the current repository. Existing system contracts include output, design, guide, history, coverage-pass, and commit-message contracts, but not Playbook structure.
- [packages/cli/src/operations/playbook/index.ts](../../../packages/cli/src/operations/playbook/index.ts) currently models `PlaybookInvocationStep` as `id`, `index`, `text`, and `sourceSection`. It extracts procedure and gate steps from Markdown list items rather than from a structured workflow schema.
- [2026-06-29-playbook-packaging-and-harness-adapter-registry.md](../../designs/2026-06-29-playbook-packaging-and-harness-adapter-registry.md) describes a required Playbook packaging pipeline that should move from source validation to package intent, reviewed package plan, harness adapter resolution, output writer, manifest/provenance records, and package/lifecycle/conformance validation.
- [36-playbook-packaging-compiler-and-harness-adapters.md](../../prd/36-playbook-packaging-compiler-and-harness-adapters.md) requires generated plugin and skills-bundle outputs to carry Playbook provenance, reuse shared-agentics storage and lifecycle safety, and keep public support claims evidence-bound to exact tuples.
- [packages/cli/src/operations/playbook-packaging/writers.ts](../../../packages/cli/src/operations/playbook-packaging/writers.ts) currently renders plugin output as a Make Docs descriptor with `kind: "make-docs.playbook-package.plugin"` rather than a harness-native plugin package.
- [packages/cli/src/operations/playbook-packaging/adapters.ts](../../../packages/cli/src/operations/playbook-packaging/adapters.ts) currently declares Codex native project plugin output as `.agents/plugins/{packageId}`, while current Codex plugin documentation describes a plugin folder with `.codex-plugin/plugin.json` plus marketplace registration through `.agents/plugins/marketplace.json` or a configured marketplace source.
- [20-agent-harness-conformance-and-support-claims.md](../../prd/20-agent-harness-conformance-and-support-claims.md) requires support claims to cite evidence for the exact scenario, harness, model/provider, runtime, and generated-output tuple. Current tests validate internal file writing and symlink exposure, not harness recognition or plugin usability.

## Gap Inventory

| Gap | Current shape | Impact | Remediation direction |
| --- | --- | --- | --- |
| No authoritative Playbook contract artifact | Contract authority is distributed across design, PRD, one dogfood Playbook, and code validators. | Workers can satisfy "contract" work by implementing weak section checks rather than a deterministic workflow model. | Add a first-class Playbook contract under `.make-docs/contracts/system/` and keep template/package copies in parity when accepted. |
| No schema for the Markdown document shape | The current Playbook requirement names broad content areas, but not a stable ordered section contract. | A Playbook can include a valid workflow block while still being hard for humans and agents to navigate consistently. | Define a Playbook document schema for required headings, order, frontmatter, dependency tables, workflow blocks, and narrative sections. |
| Playbook body contract is underspecified | Required body content is validated by broad substring checks for terms like purpose, input, procedure, gate, assist, output, and validation. | Human-readable docs can pass while lacking machine-usable step semantics. | Define required structural sections and a deterministic step model with machine-checkable fields. |
| Step model is too shallow | `PlaybookInvocationStep` only records generated id, index, text, and source section. | Run Playbook cannot reason about ownership, routing, statuses, inputs, outputs, tools, or checks. | Introduce structured step records with type, owner persona, inputs, outputs, routing, gate semantics, status transitions, validation, and failure behavior. |
| Run Playbook is not yet a real workflow runner | Current invocation resolves a Playbook, extracts list items, writes run state, and pauses at gates. | Users cannot meaningfully test a Playbook affecting an agent or progressing through a deterministic process. | Add state-machine operations for next step, advance, gate decision, validation result, resume, child Playbook handling, and closeout. |
| Direct agent execution is under-modeled | Current Playbooks are readable process notes, but not dependable execution primitives. | Agents need to infer workflow semantics from prose unless Make Docs first generates a skill or plugin. | Make the Playbook contract strong enough for direct agent execution, then let skills and plugins compile or package that same primitive. |
| Dependencies are not first-class | Playbooks can mention tools, skills, scripts, MCP surfaces, or other Playbooks in prose. | Runners and package generators cannot reliably determine what must be available before execution. | Add a required dependency declaration section with deterministic IDs that workflow steps can reference. |
| Validation tooling is not planned deeply enough | Current validation is CLI/test oriented and does not cover authoring-time feedback. | Contract errors may be found late, after generation or execution attempts. | Design schema validation so the CLI and a future language server can share the same parser and diagnostics. |
| Packaging is not a compiler | Package planning produces one generated artifact path for plugin or skills-bundle outputs. | Generated outputs cannot include multiple skills, references, deterministic scripts, dependency checks, tools, or manifest files. | Redesign packaging as a compiler from structured Playbook sources to a multi-file package inventory. |
| Generated Codex plugin is not Codex-native | Current plugin output is a Make Docs descriptor and symlink exposure, not `.codex-plugin/plugin.json` plus marketplace registration. | Codex does not discover or install the generated plugin. | Update the Codex adapter to official Codex plugin and marketplace shape, or mark Codex plugin output unsupported until implemented. |
| Skills-bundle output is too thin | Current skills-bundle output is a single `SKILL.md` summary with source Playbook provenance. | It does not guide an agent through the original Playbook or expose deterministic scripts/references. | Generate focused skills with instructions, references, scripts, assets, and optional `agents/openai.yaml` metadata where applicable. |
| Harness adapter declarations are not conformance-backed | Adapter declarations include conformance requirements but current tests do not verify recognition by actual harnesses. | Support wording can drift from real harness behavior. | Add conformance scenarios for each exact Playbook/package/output-kind/harness/surface/scope/model/runtime tuple before support claims. |
| Test coverage focuses on internal artifacts | Current tests assert descriptor content, manifest ownership, symlink/copy behavior, and lifecycle stops. | The user-visible outcome can fail while automated tests pass. | Add user-outcome tests for harness discovery, plugin installation, skill visibility, dependency checks, and Playbook-driven workflow behavior. |

## Target Playbook Model

A Playbook should remain easy for humans to read, but it also needs deterministic structure. The emerging preferred direction is a two-schema, one-file baseline: a Playbook document schema governs the Markdown file, and a workflow contract schema governs the executable YAML-like block inside that file. The document schema makes the Playbook predictable for humans and agents. The workflow contract schema makes it executable by deterministic Make Docs logic and suitable for later skill or plugin generation.

The Playbook document schema should define:

- Required frontmatter fields, including Playbook identity, schema versions, persona, stack, status, and summary.
- Required headings and heading order.
- Required dependency declaration shape.
- Required workflow contract block location and language identifier.
- Required narrative sections for purpose, inputs, guidance, gates, outputs, validation, and packaging notes.
- Rules for whether optional sections are allowed and how unknown sections are handled.

The workflow contract schema should define:

- Playbook identity: stable `persona/slug`, title, summary, status, stack, version, source path, and source digest.
- Authority and inputs: required authority sources, optional references, input fields, defaults, and missing-input behavior.
- Step collection: ordered or graph-routed steps with stable IDs and predictable rendering.
- Step type: at minimum, classify steps as activity, request, decision, gate, check, validation, handoff, tool, script, package, or child-playbook.
- Step ownership: owning persona, allowed assisting personas, and whether the step is user-owned, agent-owned, CLI-owned, MCP-owned, or harness-owned.
- Step dependencies: required prior steps, required inputs, required files, required tools, required harness capabilities, and optional assists.
- Routing: next step on success, next step on failure, branch conditions, stop conditions, and resume behavior.
- Gates and statuses: allowed statuses, who can resolve the gate, what evidence is needed, whether unattended continuation is allowed, and how the decision is recorded.
- Outputs: files, manifest entries, history records, package outputs, user-facing summaries, and handoff artifacts.
- Validation: deterministic checks, human review checks, external conformance checks, and expected completion evidence.
- Safety: mutation surfaces, dry-run behavior, approval requirements, rollback/backup expectations, and unsupported-state handling.

The contract should decide whether this structure is represented as YAML frontmatter, embedded YAML blocks, tables with strict columns, Markdown headings with typed blocks, or a hybrid. The format should optimize for both human review and reliable parsing.

## Candidate Format Direction

The current working hypothesis is to keep Markdown as the canonical Playbook source format and require a schema-governed workflow block inside it. Paired standalone YAML files may be useful later for very large or generated workflows, but they should not be required for the baseline because a two-file requirement increases drift risk and makes direct agent execution less ergonomic. MDX remains a possible future option for rendered or interactive Playbooks, but it is a larger convention shift and should be deferred unless the product explicitly needs component-like Playbook authoring.

A canonical Playbook file should likely use a suffix convention such as `make-docs-lifecycle.playbook.md`. If standalone workflow files are supported later, they should likely use a suffix such as `make-docs-lifecycle.workflow.yaml`. Embedded workflow blocks should use a distinct language identifier such as `playbook` so parsers, syntax highlighters, and a future language server can distinguish Playbook workflow syntax from ordinary YAML fences.

Conceptual shape:

````md
---
title: "Make Docs Lifecycle"
kind: "playbook"
schemaVersion: "make-docs.playbook.v1"
workflowSchemaVersion: "make-docs.workflow.v1"
persona: "agent"
stack: "build"
status: "accepted"
summary: "Guide agents through the Make Docs lifecycle."
---

# Make Docs Lifecycle

## Purpose

Human-readable explanation of the workflow.

## When To Use

Human-readable trigger and boundary guidance.

## Inputs And Authority

Human-readable input and authority order guidance.

## Dependencies

| ID | Kind | Requirement | Source | Used By | Fallback |
| --- | --- | --- | --- | --- | --- |
| make-docs-cli | cli | Make Docs operation surface | package install | validate, package | stop for install guidance |

## Workflow Contract

```playbook
workflow:
  id: make-docs-lifecycle
  state_model: make-docs.workflow-state.v1
steps:
  - id: validate
    type: cli.command
    uses: [make-docs-cli]
    command:
      run: "make-docs operations playbook-catalog"
```

## Step Guidance

Narrative guidance that expands on the workflow contract without redefining it.

## Gates And Decisions

Human-readable pause and review guidance.

## Outputs And Handoff

Expected artifacts and handoff behavior.

## Validation

Completion checks.

## Packaging Notes

Hints for generated skills and plugins.
````

## Dependency Declarations

Dependencies and imports should be first-class because Playbooks are read by humans, run by agents, and used as primitives for generated skills and plugins. The current preference is a required Markdown table with a predetermined schema. A table is readable in plain Markdown, easy for agents to inspect, and still parseable by deterministic business logic when the contract controls the columns.

The dependency table should act as the dependency registry. Workflow steps should reference dependency IDs from that table through fields such as `uses`, `requires`, or `imports`, rather than duplicating full dependency definitions inside each step. This keeps the human-facing dependency view and the executable workflow contract connected.

Potential dependency columns:

- `ID`: stable local identifier used by workflow steps.
- `Kind`: dependency type, such as `skill`, `plugin`, `cli`, `mcp`, `script`, `playbook`, `reference`, `asset`, `package`, or `external-service`.
- `Requirement`: whether the dependency is required, optional, preferred, or conditional.
- `Source`: where the dependency is expected to come from, such as a repo path, package name, marketplace entry, MCP server id, or another Playbook ref.
- `Used By`: one or more step IDs or workflow phases that consume the dependency.
- `Fallback`: what execution should do when the dependency is missing.

The workflow contract should then reference those IDs:

```playbook
steps:
  - id: run-validation
    type: cli.command
    depends_on: [implement]
    uses: [make-docs-cli, package-manager]
    command:
      run: "npm test -w packages/cli"
```

## State Model Alignment

The Playbook state engine should share vocabulary and properties with the workflow contract. The workflow contract is the static definition: steps, dependencies, owners, transitions, gates, completion conditions, and allowed mutation surfaces. The run state is the runtime instance: current step, completed steps, blocked steps, gate decisions, dependency status, output evidence, validation results, and resume hints.

Make Docs deterministic business logic should bridge the two. It should load the Playbook document schema, parse the workflow contract schema, validate declared dependencies, create or resume run state, evaluate the next executable step, pause at gates, record decisions, and expose enough state for agents to continue without re-inferring the workflow from prose.

At minimum, the workflow contract and state engine should agree on:

- Step IDs and status values.
- Gate IDs and decision states.
- Dependency IDs and availability states.
- Owner persona values.
- Output and evidence identifiers.
- Terminal states such as completed, blocked, failed, skipped, cancelled, and waiting-for-user.
- Resume semantics after interruption or fresh-context execution.

## Validation And Language Tooling

The Playbook contract should not rely only on prose plus unit tests. It likely needs a shared parser and schema validator that can be used by both the CLI and future authoring tools.

First-pass validation should be CLI-owned:

- `make-docs playbook validate <path>` or an equivalent operation-domain command.
- Frontmatter schema validation.
- Required heading and heading-order validation.
- Dependency table validation.
- Embedded workflow contract validation.
- Cross-reference validation between dependency IDs, step IDs, gates, outputs, and state-model fields.
- Diagnostics that identify the failing section, field, and expected shape.

The design should leave room for a later language server that reuses the same parser and diagnostics. The language server could provide syntax checking, completion, hover help, and quick fixes for both `*.playbook.md` files and standalone `*.workflow.yaml` files if those are accepted later. For Markdown files, the language server would need to understand both the Playbook document schema and embedded `playbook` fenced blocks. It may eventually validate constrained inline syntax in narrative sections, but the first implementation should avoid making free-text prose carry deterministic meaning.

## Direct Agent Execution Principle

Playbooks should be operational without first becoming skills or plugins. A structured Playbook should give an agent enough deterministic information to execute the workflow directly inside an ordinary thread, using Make Docs operations when available and falling back to clear human-readable instructions when tooling is missing.

This direct-execution path matters because it makes Playbooks the primitive and keeps generated skills or plugins as optional projections. The same Playbook source should support three levels of use:

1. Direct reading by a human or agent as structured workflow documentation.
2. Guided execution by an agent or CLI/MCP surface using the Playbook parser, state model, gates, and validation rules.
3. Packaged distribution as a skill bundle or plugin when a harness-specific installable artifact is useful.

The Playbook contract should therefore define execution semantics in the source Playbook itself. Skills and plugins can improve discoverability, installation, dependency setup, and harness-native invocation, but they should not be required to make the Playbook understandable or runnable.

## Target Packaging Model

Playbook packaging should become a compiler pipeline rather than a descriptor writer. A reviewed package plan should be able to generate a multi-file output inventory from one or more structured Playbooks:

- Generated skills: `SKILL.md` files that preserve the Playbook's workflow intent, trigger descriptions, step instructions, references, and safety boundaries.
- References: supporting Markdown files extracted or copied from Playbook authority sources where redistribution is allowed.
- Scripts: deterministic helper scripts only when needed, with provenance and lifecycle ownership.
- Tool/dependency declarations: metadata and checks that tell the harness or user what must be installed, including Make Docs itself when required.
- Plugin manifests: harness-native manifests such as Codex `.codex-plugin/plugin.json` when the target is a real plugin.
- Marketplace or registration files: harness-specific discovery surfaces when the plugin requires a registry or marketplace entry.
- Lifecycle records: Make Docs manifest ownership, source digests, package-plan identity, support status, review status, backup/uninstall disposition, and stale-output handling.
- Conformance records: reviewed evidence that the generated artifact is recognized and usable in the target harness.

The package planner should continue to fail before writes when semantic interpretation, ownership, missing dependencies, unsupported surfaces, or missing conformance evidence require review.

## Proposed Remediation Roadmap

### Phase 0 - Claim Freeze and Gap Record

Record that current generated Codex plugin output is provisional or unsupported for actual Codex discovery. Preserve existing lifecycle safety work, but avoid adding stronger support claims until conformance evidence exists.

Expected outputs:

- A history or gap record describing the tested failure and its implications.
- Risk-register updates if existing risks do not already cover weak Playbook contracts, descriptor-only packaging, or unsupported harness discovery.
- Guide wording that distinguishes "Make Docs generated descriptor" from "harness-recognized plugin" until fixed.

### Phase 1 - Playbook Contract Recovery

Create the missing first-class Playbook contract and decide the deterministic structure. This should be done before extending packaging or plugin generation.

Expected outputs:

- A design doc for the Playbook contract recovery.
- `.make-docs/contracts/system/playbook-contract.md` after the design is accepted and planned.
- Template/package parity decisions for the contract artifact.
- PRD updates to [35-run-playbook-state-machine-and-portability.md](../../prd/35-run-playbook-state-machine-and-portability.md#requirements), [36-playbook-packaging-compiler-and-harness-adapters.md](../../prd/36-playbook-packaging-compiler-and-harness-adapters.md), and related support-claim docs.

### Phase 2 - Structured Playbook Parser and Validator

Replace substring body validation with a parser and validator that can load the accepted Playbook schema, report actionable diagnostics, and preserve human-readable rendering.

Expected outputs:

- Parser and schema validation in the Playbook operation domain.
- Fixture coverage for valid and invalid Playbook structures.
- Migration of the dogfood lifecycle Playbook to the new contract.
- Validation coverage for required heading order, dependency tables, embedded workflow contracts, cross-references, and file naming conventions.
- Package/template validation for shipped default Playbooks.

### Phase 3 - Run Playbook State Machine

Upgrade Run Playbook from resolver/state creation to deterministic step progression.

Expected outputs:

- Operations for inspecting the current step, advancing steps, recording gate decisions, recording validation results, resuming runs, and closing runs.
- State records that track step status, gate status, routing decisions, outputs, owner persona, and resume hints.
- State-model properties that align with the workflow contract schema instead of becoming a separate runtime vocabulary.
- Direct agent-execution guidance that lets an agent run a structured Playbook before any generated skill or plugin exists.
- Guardrails for nested Playbooks, parallel execution, output-surface conflicts, and unattended mode.

### Phase 4 - Playbook-to-Agentics Compiler

Redesign Playbook packaging so it can generate real skills, scripts, references, dependency checks, tools metadata, plugin manifests, and lifecycle records from structured Playbooks.

Expected outputs:

- A package-plan schema that supports multi-file artifact inventories.
- Deterministic generation for schema-owned fields.
- Review-gated agent-assisted drafting for semantic descriptions, grouping, and harness-facing prose.
- Writer coverage for multi-file plugin and skills-bundle outputs.

### Phase 5 - Harness Adapter Correction

Update harness adapters from assumed path templates to verified harness contracts.

Expected outputs:

- Codex plugin output that follows Codex plugin folder and marketplace requirements.
- Codex skills-bundle output that uses direct `.agents/skills` discovery and symlink/copy-mirror behavior.
- Claude Code adapter review against its actual plugin and skill contract.
- Unsupported or unknown harness surfaces fail closed before writes.

### Phase 6 - Conformance and User-Outcome Tests

Add maintainer conformance scenarios that test the real user outcome, not just generated files.

Expected outputs:

- Scenario proving a generated Codex skills bundle appears as a skill and can be invoked.
- Scenario proving a generated Codex plugin appears through a marketplace, installs, exposes bundled skills, and can be used in a new thread.
- Scenario proving generated dependency checks surface missing tools and pass when dependencies are present.
- Scenario proving uninstall/backup removes managed generated outputs without orphaning empty managed directories or deleting user-authored files.

### Phase 7 - Lifecycle Reconciliation

After the shape is accepted, convert this artifact into normal lifecycle work.

Expected outputs:

- New or updated design doc.
- Plan bundle derived from accepted design.
- PRD reconciliation across Playbook, plugin substrate, packaging, conformance, shared agentics, backup/uninstall, and guide contracts.
- Work backlog with phase-sized remediation tasks.
- History record documenting the pivot.
- Commit message following the repo convention after the docs changes are complete.

## Open Questions

- Should the Playbook contract live only in `.make-docs/contracts/system/playbook-contract.md`, or should there also be a reader-facing guide that explains the contract for humans?
- Should structured steps be written as YAML blocks, Markdown tables, frontmatter arrays, heading-scoped blocks, or another format?
- Should the baseline require `*.playbook.md` file names, allow legacy `<slug>.md` names with frontmatter detection, or support both during migration?
- Should embedded workflow blocks use the `playbook` language identifier, `yaml`, or a combined convention such as `yaml playbook`?
- Should dependency declarations be a required Markdown table, a workflow-contract map, frontmatter, footnotes, or a combination?
- Which dependency kinds are required in the first pass: skills, plugins, CLI commands, MCP servers, scripts, references, other Playbooks, package managers, and external services?
- What is the minimum viable step-type taxonomy for the first remediation pass?
- Should the language server be a first-class deliverable in the initial remediation plan, or should the plan first ship reusable CLI validation and leave language-server integration as a later projection?
- Should package generation create one skill per Playbook, one skill per step family, one skill per workflow bundle, or adapter-selected groupings?
- Which dependency metadata should be harness-native, which should be Make Docs-specific, and which should be emitted as deterministic scripts?
- Should Make Docs generate Codex marketplace files automatically, or should it produce export-only plugin folders until the user explicitly registers a marketplace?
- What conformance evidence is sufficient to move a generated-output tuple from provisional to implementation-validated or conformance-validated?

## Collaboration Notes

This artifact is intentionally a draft. It should be revised until it is specific enough to support a design document without prematurely locking implementation details. The most important next review decision is whether the remediation should start with the Playbook contract artifact, because every downstream packaging and harness-adapter correction depends on that contract being parseable and enforceable.

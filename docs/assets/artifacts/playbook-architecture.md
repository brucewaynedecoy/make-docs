---
title: "Playbook Architecture and Design"
date: "2026-06-30"
kind: "artifact"
status: "draft"
---

# Playbook Architecture and Design

This artifact is the comprehensive architecture and design for the Playbook primitive, its deterministic runner, and the packaging pipeline that compiles Playbooks into harness-native distributables. It is the successor working document to [playbook-contract-and-plugin-remediation.md](playbook-contract-and-plugin-remediation.md), which remains the investigation and gap record. This artifact is pre-design source material for review and iteration. It is not a design, PRD, plan, work backlog, guide, history record, support claim, or implementation authority. When it is accepted, it will be converted into one or more lifecycle design documents.

The artifact is written full-stack and in dependency order. Earlier sections define foundations that later sections consume. The most important architectural commitment is stated first because every later decision follows from it.

## Section Status

This artifact is drafted full-stack, Sections 0 through 9. Sections 0 through 3 define the Playbook primitive as a document: the inversion thesis, the document schema, the workflow contract and step model, and the dependency registry. Sections 4 and 5 make it executable: the Playbook model and validator, and the run state machine. Sections 6 through 9 cover the packaging compiler, the harness capability and distributable model, the harness adapters, and conformance. Cross-cutting decisions live in three sibling working documents, linked in the closing section.

## 0. Frame: Playbook as Primitive

### 0.1 The Inversion

A Playbook is the primitive. Skills, plugins, extensions, and other harness-native distributables are projections of a Playbook, not the first point at which a Playbook becomes operational. This inverts the order Make Docs has implemented so far, where packaging into agentic outputs was attempted before the Playbook contract was deterministic enough to support the transformation.

The consequence is a hard rule: a Playbook must be directly usable, with no generated package and no harness installation, by a human or an agent reading the file. Packaging improves discoverability, installation, dependency setup, and harness-native invocation. It must never be required to make a Playbook understandable or runnable.

### 0.2 The Compiler Model

The architecture is organized as a compiler. This framing is not decorative. It makes the dependency order undeniable and it assigns every known gap to a precise layer.

- Frontend: the Playbook document schema and the workflow contract schema, parsed and validated.
- Playbook model: one fully resolved, in-memory model of the Playbook. The single source of truth that every downstream consumer reads.
- Consumers (backends): three of them, each imposing requirements on the Playbook model.
  1. The reader: a human or agent executing directly from the file.
  2. The runner: the deterministic Run Playbook state machine.
  3. The compiler: the packaging pipeline that lowers the Playbook model plus a package plan into harness-native distributables.

Under this framing, the known defects classify cleanly. A shallow step record is a Playbook-model defect. Substring body validation is a frontend defect. The missing run-progression engine is a runner defect blocked on the Playbook-model defect. A wrong Codex plugin path is a backend defect. None of the backend defects can be meaningfully fixed before the Playbook model is rich, which is precisely why packaging-first failed.

### 0.3 The Three-Tier Degradation Guarantee

The same Playbook source supports three levels of use, and the architecture guarantees graceful degradation across three environments.

- A directory with neither Make Docs nor the CLI: the Playbook is excellent structured procedural documentation that a human or agent can read and execute by hand.
- A directory with Make Docs installed but no CLI: the Playbook still reads and executes as structured documentation, and its contracts and references are present.
- A directory with Make Docs and the CLI present: the Playbook gains deterministic execution, state and progression tracking, validation, and the Playbook-to-distributable pipeline.

This guarantee is realized through the per-step execution mode defined in Section 2. It is a promise the contract makes, not an implementation accident.

### 0.4 Two Independent Granularities

The architecture separates authoring granularity from distribution granularity, so that the fuzzy industry question of skill density never has to be answered.

- Authoring unit: one Playbook projects to one skill. The Playbook is the skill-sized primitive by definition. Two genuinely distinct workflows are two Playbooks.
- Distribution unit: a distributable that an adapter lowers onto the richest container its target harness supports. A distributable contains one or more skills plus the agentics the Playbook's steps imply, such as hooks, scripts, MCP declarations, and references. A bundle is multiple Playbooks compiled into one distributable with multiple skills.

The adapter's job is therefore narrow and well defined: map one abstract distributable onto a harness-native container, using a harness capability descriptor, and fail closed or degrade explicitly when a required primitive is unsupported.

### 0.5 Layer Map

The full architecture is the following layers, numbered to match their document sections. Each layer consumes the layer above it.

- Section 0: Frame and principles (this section).
- Section 1: Playbook document schema, the Markdown file shape.
- Section 2: Workflow contract schema and step model, the executable block.
- Section 3: Dependency registry, first-class declared dependencies and imports.
- Section 4: Playbook model, parser, and validator, one resolved model with shared diagnostics, reusable as a library.
- Section 5: Run Playbook state machine, deterministic progression and the degradation contract in motion.
- Section 6: Packaging compiler, Playbook model plus package plan to a multi-file distributable inventory.
- Section 7: Harness capability and distributable model, per-harness primitive support and container selection.
- Section 8: Harness adapter contracts, verified harness-native lowering for each target.
- Section 9: Conformance and tuple registry, support claims bound to install, discover, invoke, and uninstall evidence.

Sections 0 through 9 are drafted below.

Cross-cutting all operational layers is the operation registry defined in Section 0.6. Sections 5, 6, and 8 invoke Make Docs operations, and they reference the registry rather than any CLI command spelling.

### 0.6 The Operation Registry and CLI, MCP, and Step Surfaces

Make Docs exposes a set of deterministic operations. These operations are the stable contract. The CLI command tree, the MCP server, and Playbook workflow steps are three surfaces over the same operation registry, and none of them owns the operations.

- The operation registry defines stable operation identifiers, for example `playbook.catalog` or `closeout.probe`, independent of how they are invoked.
- The CLI is the human surface. A command such as `make-docs run closeout --probe` invokes an operation. The CLI command tree can be reorganized freely without changing operation identifiers.
- The MCP server is the agent surface. The same operations are exposed as MCP tools.
- A Playbook deterministic step is the workflow surface. It references an operation by registry identifier through the step `operation` field rather than by command string.

This decoupling is what lets the CLI be reorganized without breaking Playbooks or MCP tools, and it is what makes the degradation guarantee implementable. When the CLI is absent, the runner resolves the operation identifier to its current human CLI form and prints that for the reader to run by hand.

The CLI command tree reorganization itself is a related but separable concern with its own working artifact, [cli-command-reorganization.md](cli-command-reorganization.md). This architecture depends only on the existence and stability of the operation registry, not on the specific command tree.

## 1. Playbook Document Schema

The document schema governs the Markdown file. Its purpose is to make a Playbook predictable for humans and agents and parseable for deterministic logic, without forcing the whole file to be machine syntax. The file stays readable Markdown; a bounded, schema-governed region inside it carries the executable contract.

### 1.1 File Identity and Naming

A Playbook is a persona-scoped docs asset. It lives under `docs/assets/playbooks/<persona-slug>/`, where the persona slug indicates the primary audience and determines organization. The persona in the file frontmatter must match the folder.

New Playbooks must use the suffix convention `<slug>.playbook.md`. The suffix makes Playbooks discoverable by glob, distinguishes them from ordinary Markdown, and gives a future language server a file pattern to attach to. For migration and back-compatibility, the parser also detects a Playbook by frontmatter `kind: playbook` on a plain `<slug>.md` file, treats that as a deprecated form, and emits a rename diagnostic. The existing dogfood Playbook at `docs/assets/playbooks/agent/make-docs-lifecycle.md` is migrated to the suffix form as part of adopting this schema.

### 1.2 Frontmatter

Frontmatter is YAML. The schema distinguishes required identity and classification fields from optional hints.

Required:

- `kind`: always `playbook`.
- `title`: human-readable title.
- `summary`: one-line description used for catalogs, triggers, and generated skill descriptions.
- `persona`: the owning persona slug; must match the folder.
- `stack`: the lifecycle stack discriminator, currently `build` or `run`.
- `status`: `proposed`, `accepted`, or `deprecated`.
- `schemaVersion`: the document schema version, for example `make-docs.playbook.v1`.
- `workflowSchemaVersion`: the workflow contract schema version, for example `make-docs.workflow.v1`.

Optional:

- `packagingHints`: non-authoritative hints for the compiler, such as preferred distributable profile or target harnesses. Target selection remains a package-time decision; hints only inform it.
- `id`: an explicit stable identifier. When absent, the canonical reference is derived as `persona/slug`.

### 1.3 Required Headings and Order

The document body has a required ordered spine. Order is enforced so that humans and agents navigate every Playbook the same way and so that the parser can locate regions deterministically.

1. `# <Title>`
2. `## Purpose`
3. `## When To Use`
4. `## Inputs And Authority`
5. `## Dependencies`
6. `## Workflow Contract`
7. `## Step Guidance`
8. `## Gates And Decisions`
9. `## Outputs And Handoff`
10. `## Validation`
11. `## Packaging Notes`

The `## Dependencies` section carries the dependency registry table defined in Section 3. The `## Workflow Contract` section carries exactly one executable block defined in Section 2. The remaining sections are narrative.

### 1.4 Authoritative Versus Narrative Content

The schema draws a strict line that prevents drift between the human-readable and machine-readable views.

- Authoritative and parsed: the frontmatter, the dependency registry table, and the single workflow contract block. These carry deterministic meaning. The validator checks their structure and cross-references and the runner and compiler consume them.
- Narrative and non-authoritative: Purpose, When To Use, Inputs And Authority prose, Step Guidance, Gates And Decisions prose, Outputs And Handoff prose, Validation prose, and Packaging Notes. The validator checks that these sections exist and are non-empty so the Playbook stays human-usable, but it does not extract deterministic meaning from their free text.

This line is the core anti-drift mechanism. Execution truth lives in one place. Narrative elaborates on that truth without redefining it, and the first implementation deliberately avoids making prose carry machine meaning.

### 1.5 Unknown Sections

Unknown additional `##` sections are allowed after the required spine and are ignored by the parser, so that authors can add context without fighting the schema. Unknown sections inserted before or between required sections, or a missing or out-of-order required section, are validation errors with a precise diagnostic naming the offending heading and the expected position.

### 1.6 Contract and Guide

The normative form of this schema lives in a first-class contract at `.make-docs/contracts/system/playbook-contract.md`, alongside the existing system contracts. The contract is authoritative and terse. A separate reader-facing guide under `docs/assets/library/<persona-slug>/` is a projection of the contract that explains it for humans. The contract is the source of truth; the guide never adds requirements.

## 2. Workflow Contract Schema and Step Model

The workflow contract is the executable definition. It is the single authoritative description of what the Playbook does, who or what does each part, how control flows, where it pauses, and what it produces. It is consumed by the runner and the compiler and read directly by agents.

### 2.1 Location and Encoding

The contract is a single fenced block inside the `## Workflow Contract` section. The block uses the info string `playbook` rather than `yaml`, so parsers, highlighters, and a future language server can distinguish Playbook workflow syntax from ordinary YAML. The block content is YAML-shaped for human readability and reliable parsing. There is exactly one such block per Playbook; zero or more than one is a validation error.

Standalone `<slug>.workflow.yaml` files are not part of the baseline. The single-file form reduces drift risk and keeps direct agent execution ergonomic. Standalone workflow files remain a possible later option for very large or generated workflows and are not designed away, but they are not required now.

### 2.2 Workflow Header

The block opens with workflow-level identity and routing declarations.

- `id`: stable workflow id, conventionally matching the Playbook slug.
- `state_model`: the run-state vocabulary version, for example `make-docs.workflow-state.v1`. This binds the static contract to the runtime engine so they share one vocabulary.
- `routing`: `linear` or `graph`. Linear walks steps in order with optional success and failure jumps. Graph routes explicitly by step references. Linear is the default and the common case.

### 2.3 The Step Model: Three Orthogonal Dimensions

A step is described by three independent dimensions plus an execution mode. Keeping the dimensions orthogonal avoids the ambiguity of a single flat type enum, where a gate that runs a script is impossible to classify cleanly.

- Executor: who or what performs the step. One of `cli`, `script`, `agent`, `human`, `mcp`, `child-playbook`.
- Control role: the step's place in the flow. One of `activity`, `decision`, `gate`, `check`, `handoff`.
- Activation: how the step is reached. One of `sequential` (part of the workflow the runner walks) or `event-bound` (triggered by a harness lifecycle event). Event-bound steps compile to hooks where the target harness supports them, and are skipped by the linear runner walk except when their event fires.
- Execution mode: the determinism and degradation contract for the step. One of `deterministic` (the CLI runs it and captures the result), `delegated` (the CLI hands instructions to an agent or human and waits for a reported outcome plus evidence), or `manual` (pure documentation, no CLI involvement). When unspecified, the mode defaults to `delegated`, the safe middle that works as instructions without the CLI and gains tracking with it.

The execution mode is the mechanism behind the three-tier degradation guarantee. Manual steps work in any directory. Delegated steps render as clear instructions without the CLI and gain tracking with it. Deterministic steps auto-run with the CLI and degrade to a printed command the reader can run themselves without it.

### 2.4 Per-Step Fields

Each step record carries:

- `id`: stable, unique within the workflow. Referenced by routing, run state, and evidence.
- `title`: short human-readable label.
- `executor`, `role`, `activation`, `mode`: the dimensions above.
- `event`: required when `activation` is `event-bound`; names the lifecycle event, for example `on-session-start` or `on-pre-commit`. The harness capability model maps named events to harness-native hook points.
- `uses` and `requires`: references to dependency IDs declared in the registry. `requires` is a hard precondition; `uses` is consumed but not gating. Steps reference IDs only; they never redefine dependencies inline.
- `inputs` and `outputs`: named input fields with defaults and missing-input behavior, and named output identifiers that the run state and validation reference.
- `operation`, `command`, or `instructions`: how the step is performed. `operation` references a Make Docs operation by stable registry identifier (Section 0.6) and is the required form for invoking Make Docs's own deterministic logic, so steps never hardcode CLI command strings. `command: { run: ... }` is reserved for external tools Make Docs does not own, such as a package manager, version control, or a project script. `instructions` carries the instruction text for `agent` and `human` executors. A deterministic step requires either an `operation` or a `command`.
- `routing`: `on_success`, `on_failure`, `branch` conditions, and `stop` conditions. Absent routing in a linear workflow means proceed to the next step.
- Gate semantics, present when `role` is `gate`: who may resolve it, what evidence is required, whether unattended continuation is allowed, and how the decision is recorded.
- `validation`: deterministic checks, human-review checks, and the expected completion evidence for the step.
- `safety`: declared mutation surfaces, dry-run behavior, approval requirements, and rollback or backup expectations.

### 2.5 Shared Status Vocabulary

Step status values are defined once and shared between the static contract and the run state, so the runtime never invents a parallel vocabulary. The status set is `pending`, `running`, `blocked`, `waiting-for-user`, `completed`, `failed`, `skipped`, and `cancelled`. Gate decision states, dependency availability states, owner persona values, and output and evidence identifiers are likewise shared. Section 6 binds the run-state record to these values.

### 2.6 Worked Example

````md
## Workflow Contract

```playbook
workflow:
  id: make-docs-lifecycle
  state_model: make-docs.workflow-state.v1
  routing: linear
steps:
  - id: validate-catalog
    title: Validate the Playbook catalog
    executor: cli
    role: check
    activation: sequential
    mode: deterministic
    requires: [make-docs-cli]
    operation: playbook.catalog
    validation:
      expect: exit-zero
    routing:
      on_failure: stop

  - id: review-gate
    title: Human review before packaging
    executor: human
    role: gate
    activation: sequential
    mode: delegated
    gate:
      resolved_by: user
      evidence: review-note
      unattended: false

  - id: enforce-commit-convention
    title: Enforce commit message convention
    executor: cli
    role: check
    activation: event-bound
    event: on-pre-commit
    mode: deterministic
    requires: [make-docs-cli]
    operation: commit.validate-message
```
````

In this example the linear runner walks `validate-catalog` then `review-gate`. The third step is event-bound and does not appear in the linear walk; the compiler routes it to the harness pre-commit hook point, and on a harness without hooks the adapter degrades it to a documented manual check or fails closed per the capability model.

## 3. Dependency Registry

Dependencies and imports are first-class because Playbooks are read by humans, run by agents and the CLI, and used as sources for generated distributables. All three need to know what must be available before execution and what to do when it is missing.

### 3.1 Form

The registry is a required Markdown table in the `## Dependencies` section. A table is readable in plain Markdown, easy for an agent to inspect, and parseable by deterministic logic when the contract controls the columns. The table is the dependency registry of record; the workflow contract references its IDs rather than duplicating definitions.

Columns:

- `ID`: stable local identifier used by workflow steps via `uses` and `requires`.
- `Kind`: dependency type. First-pass set: `cli`, `script`, `mcp`, `skill`, `plugin`, `playbook`, `reference`, `package-manager`, `external-service`. `asset` is optional.
- `Requirement`: `required`, `optional`, `preferred`, or `conditional`.
- `Source`: where the dependency comes from, such as a repo path, package name, marketplace entry, MCP server id, or another Playbook ref.
- `Used By`: one or more step IDs or workflow phases that consume the dependency.
- `Fallback`: what execution does when the dependency is missing.

### 3.2 Example

````md
## Dependencies

| ID | Kind | Requirement | Source | Used By | Fallback |
| --- | --- | --- | --- | --- | --- |
| make-docs-cli | cli | required | package install | validate-catalog, enforce-commit-convention | stop with install guidance |
| package-manager | package-manager | required | npm | run-tests | stop with install guidance |
| repo-conventions | reference | preferred | .make-docs/contracts/system | review-gate | continue with reduced guidance |
````

### 3.3 Cross-Reference Integrity

The parser enforces bidirectional integrity between the registry and the workflow contract. Every `uses` or `requires` reference in a step must resolve to a registry ID. Every registry row should be referenced by at least one step or phase; an unreferenced dependency is a warning, not an error, since a Playbook may declare an environmental prerequisite that no single step consumes. A `requires` reference to a dependency whose `Requirement` is `optional` is a contradiction and is an error.

### 3.4 Metadata Routing Preview

The `Kind` of a dependency determines how the compiler later materializes it into a distributable. The routing is fully specified in the packaging compiler layer; the declaration here is what makes that routing possible. The intended mapping is that `cli` and `package-manager` dependencies become emitted deterministic check scripts plus human instructions, `skill` and `plugin` dependencies become harness-native manifest references where the harness supports them, and `mcp` and `external-service` dependencies become Make Docs metadata plus a runtime availability check. This preview is non-binding until Section 7 is drafted.

## 4. Playbook Model, Parser, and Validator

The Playbook model is the single in-memory model that the reader-as-data path, the runner, and the compiler all consume. It is produced once by the parser, checked by the validator, and immutable thereafter. The parser and validator are a core library module consistent with the operation core in Section 0.6: pure functions that take a source and return a Playbook model plus diagnostics, with no presentation or filesystem effects beyond reading the provided input.

### 4.1 The Playbook Model

The Playbook model is the fully resolved form of the Playbook. It contains:

- Identity: canonical ref, source path, source digest, document and workflow schema versions, persona, stack, and status.
- Dependency registry: typed dependency records keyed by ID, each carrying kind, requirement, source, used-by, and fallback.
- Workflow: the header, meaning id, state model, and routing, and the ordered or graph-routed steps. Each step is fully resolved, with its executor, role, activation, mode, invocation, input and output declarations, routing, gate semantics, validation, and safety, and with every dependency reference linked to the registry record it names rather than left as a bare string.
- Narrative presence map: which required narrative sections are present and non-empty.
- Source spans: byte or line ranges for every parsed element, so diagnostics and a future language server can point precisely at the offending text.

The Playbook model is the contract between the frontend and every consumer. Consumers never re-parse Markdown; they read the model.

### 4.2 The Parser Pipeline

Parsing is a fixed sequence of stages, each able to emit diagnostics while continuing where possible so that one error does not mask the rest.

1. Read source and split frontmatter from body.
2. Parse frontmatter YAML against the document schema.
3. Locate the required headings and verify presence and order.
4. Parse the dependency registry table.
5. Locate the single `playbook` workflow block and parse its contents.
6. Resolve cross-references, linking step dependency references to registry records and routing targets to step IDs.
7. Assemble the Playbook model.

Parsing is fail-soft for diagnostics and fail-closed for execution. It collects as many diagnostics as it can, but the Playbook model is marked runnable only when there are zero errors.

### 4.3 Validation Layers

Validation is layered so diagnostics are specific.

- Structural: heading presence and order, frontmatter field presence and enum values, and the file-naming convention.
- Registry: table column schema, dependency kind and requirement enums, and unique dependency IDs.
- Workflow: step schema, the executor, role, activation, and mode enums, and the per-executor required fields, such as a deterministic step requiring an operation or a command, or an event-bound step requiring an event.
- Cross-reference integrity: every `uses` and `requires` resolves to a registry ID, every routing target resolves to a step ID, gate fields are present when the role is gate, and no step ID is duplicated.
- Consistency: a `requires` reference may not point at an optional dependency, event names are drawn from the known set, and unreferenced dependencies produce warnings rather than errors.

### 4.4 The Diagnostic Catalog

Because Playbooks are co-authored by humans and agents, diagnostics are the product, not an afterthought. Each diagnostic carries a stable code, a severity, a precise location naming the section and field and source span, a message, and an expected-shape or fix hint. The catalog is shared by the validate operation and any future language server, so authoring feedback is identical across surfaces. Representative codes:

| Code | Severity | Meaning |
| --- | --- | --- |
| PB-DOC-001 | error | a required section is missing or out of order |
| PB-FM-002 | error | a frontmatter field is missing or has an invalid enum value |
| PB-DEP-003 | error | a step references an unknown dependency ID |
| PB-DEP-004 | warning | a declared dependency is never referenced |
| PB-WF-005 | error | a deterministic step declares neither an operation nor a command |
| PB-WF-006 | error | a routing target is not a defined step ID |
| PB-FILE-007 | warning | a legacy filename should be renamed to the `*.playbook.md` form |

### 4.5 Reuse and the Contract

The `playbook.validate` and `playbook.catalog` operations wrap the library, the runner consumes its model, and a future language server wraps the same library so that command-line and editor diagnostics never diverge. The validator enforces exactly what the `.make-docs/contracts/system/playbook-contract.md` states. The contract is the specification and the validator is its executable enforcement, kept in parity.

## 5. Run Playbook State Machine

The run state machine turns the Playbook model into a running primitive. It is the progression engine the current implementation lacks: today only create, invoke, and read exist, with no advancement, gate handling, resume, or closeout.

### 5.1 Storage in the Global Store

Run state is operational, machine-local data used primarily by Make Docs itself, so it lives in the global store at `~/.make-docs/` rather than in the project's `.make-docs/` or `docs/` directories. This reverses the current in-repo `.make-docs/runs/playbooks/{runId}/state.json` location and removes per-repo noise and duplication. The global store and its boundary principle are specified in [runtime-and-global-store.md](runtime-and-global-store.md); this section consumes it.

Run state is keyed by a stable project identifier plus a run identifier. The project identifier is minted at setup and recorded in the project's `.make-docs/manifest.json`, so it survives path changes and clones rather than depending on the directory path. For run state the global store is canonical; unlike install information, which is mirrored from the project manifest, run state is relocated and has no in-repo copy.

### 5.2 The Run-State Record

The run-state record is bound to the shared status vocabulary from Section 2.5 rather than reinventing a runtime vocabulary. It carries the run identifier, the project identifier, the Playbook ref and source digest, the document and workflow schema versions, the routing model, the per-step status using the shared status set, the gate decisions, a dependency availability snapshot, output and evidence references, the current cursor, child run references with the root and parent run identifiers, resume hints, timestamps, and the terminal status.

### 5.3 Progression Operations

The engine is a set of core operations, surfaced on the CLI under `run playbook` and as MCP tools, honoring the uniform safety gating from Section 0.6. Read-only operations compute; mutating operations transition.

- `playbook.start`: create a run from a validated Playbook model.
- `playbook.status`: read the current run state.
- `playbook.next`: compute the next executable step from the state plus the Playbook model without mutating, respecting dependencies, gates, and routing.
- `playbook.advance`: record completion or failure of the current step, capture evidence, transition status, and compute the next cursor.
- `playbook.gate`: record a gate decision with its evidence and either unblock or stop.
- `playbook.resume`: re-enter a run, digest-checked per Section 5.5.
- `playbook.close`: finalize a run with a terminal status and closeout evidence.

### 5.4 Step Execution by Mode

The execution mode from Section 2.3 governs what `advance` does and is the mechanism of the degradation guarantee.

- Deterministic: the runner resolves the step's operation or command, executes it, an operation through the core handler and a command through the shell, captures the structured result as run evidence, and auto-transitions. Without the CLI, the runner prints the resolved command for the reader to run by hand.
- Delegated: the runner emits the step instructions, sets the step to waiting-for-user, and waits for an advance call carrying the reported outcome and evidence. The same instructions are usable directly without the CLI; the CLI adds tracking.
- Manual: documentation only; the runner records acknowledgment and does not execute.

### 5.5 Digest-Aware Resume

On resume the runner compares the stored source digest with the current Playbook digest. If they match, it resumes at the cursor. If they differ, the run is stale, and by default the runner blocks and requires an explicit re-plan, with a diagnostic naming the change, because silently resuming against a changed workflow is unsafe. Optional migration, which re-maps still-present step IDs and flags added or removed steps, is an enhancement rather than a baseline requirement.

### 5.6 Guardrails

- Nested Playbooks: a child run links to its parent through the child-run references and a shared root run identifier, and a child policy controls whether nesting is allowed and whether children run serially or in parallel.
- Parallel execution and output-surface conflicts: when two steps or runs would claim the same output surface, the runner stops rather than interleaving writes.
- Unattended mode: only steps whose gates permit unattended continuation proceed without a human; all others set waiting-for-user and hold.

### 5.7 Portability

Because run state is machine-local, cross-machine handoff is served by explicit export and import of a run, which serializes the run record and its evidence into a portable artifact and rehydrates it elsewhere. This is opt-in and never places run state back into the repository by default, preserving the boundary principle while still allowing audit, handoff, and resumption in a fresh environment.

### 5.8 The Three Tiers in Motion

The runner realizes the Section 0.3 guarantee. With neither Make Docs nor the CLI present, there is no engine and the Playbook is structured documentation a reader executes by hand. With Make Docs resources present but no CLI, an agent reads the same structure and the operation registry's documented command forms and executes without tracking. With the CLI present, the full engine runs and records state in the global store.

## 6. Packaging Compiler

Packaging is a compiler, not a descriptor writer. It lowers one or more Playbook models, plus a reviewed package plan, into a real multi-file distributable that the target harness recognizes. The current implementation emits a Make Docs descriptor file rather than harness-native content; the plumbing it writes into, the staging payload, the exposure mirror, and the manifest ownership records, is reusable, but the generator that produces the payload must be rebuilt to emit real artifacts.

### 6.1 Inputs and Reuse

The compiler consumes the validated Playbook model and a reviewed package plan, and it writes through the existing exposure machinery: a canonical payload under the staging area, an exposure mirror placed at the harness path by symlink or copy-mirror, and manifest ownership records that track both. Nothing about that plumbing changes. What changes is that the payload becomes a faithful harness-native artifact tree instead of a single descriptor.

### 6.2 The Package Plan

The package plan is the reviewed instruction set for one packaging run. It declares the target, meaning the harness, the distributable profile, the surface, and the scope; the source Playbook or Playbooks; the multi-file artifact inventory to generate; the field provenance for every generated field, classified as deterministic, user-supplied, agent-proposed, or unresolved; the review status; the support status; and the lifecycle disposition. This extends the plan the current planner already produces, which carries generated artifacts, deterministic derivations, agent-assisted proposals, unresolved decisions, field provenance, review, support, and lifecycle, by making the artifact inventory genuinely multi-file.

### 6.3 The Distributable Inventory

A distributable is a multi-file tree, and its contents are a function of the Playbook model and the target. The compiler can emit:

- Skills: a `SKILL.md` per source Playbook that preserves the workflow intent, the trigger description, the step instructions, the references, and the safety boundaries.
- References: supporting Markdown extracted or copied from Playbook authority sources where redistribution is allowed, and linked otherwise.
- Scripts: deterministic helper scripts and dependency-check scripts, each with provenance and lifecycle ownership, emitted only when needed.
- Tool and dependency declarations: the metadata and checks that tell the harness or user what must be installed, materialized per dependency kind as described in Section 6.5.
- Hooks: artifacts generated from event-bound steps, placed at the harness hook points the capability model maps the logical events to.
- Harness-native manifest: the real plugin or extension manifest the target requires, such as a Codex `.codex-plugin/plugin.json`, rather than a Make Docs descriptor.
- Marketplace or registration files: the discovery surfaces the target needs, generated into the distributable but never auto-installed, per Section 7.6.
- Lifecycle records: manifest ownership, source digests, package-plan identity, support and review status, backup and uninstall disposition, and stale-output handling.
- Conformance records: the reviewed evidence that the generated artifact is recognized and usable in the target, per Section 9.

### 6.4 Deterministic and Agent-Assisted Generation

Generation is two-tier, and the boundary is recorded in field provenance. Schema-owned fields are generated deterministically: file paths, manifest structure, dependency checks, provenance, and digests. Semantic fields are agent-assisted proposals that are review-gated: skill descriptions and triggers, the grouping of Playbooks into a bundle, and harness-facing prose. The compiler fails closed before any write when unresolved semantic decisions, ownership conflicts, missing dependencies, unsupported surfaces, or missing conformance evidence require review, which preserves the fail-before-write behavior the current planner already enforces.

### 6.5 Dependency Materialization

The dependency kind declared in the registry, Section 3, determines how the compiler materializes it, making the Section 3.4 preview binding here.

- `cli` and `package-manager`: emitted as deterministic check scripts plus human instructions. A `cli` dependency on Make Docs itself references operation identifiers from the registry, Section 0.6, not CLI command strings, so generated outputs survive CLI reorganization.
- `skill` and `plugin`: emitted as harness-native manifest references where the target supports them, and degraded explicitly where it does not.
- `mcp` and `external-service`: emitted as Make Docs metadata plus a runtime availability check.
- `reference`: copied or extracted where redistribution is allowed, and linked otherwise.
- `playbook`: included as an additional skill when bundled, or referenced when not.

### 6.6 Provenance, Lifecycle, and Support

Every generated artifact carries Playbook provenance, meaning the source ref and digest, and reuses the shared agentics storage and lifecycle safety. Backup and uninstall remove managed generated outputs without orphaning empty managed directories or deleting user-authored files, which is one of the conformance scenarios in Section 9. Support claims remain provisional until conformance evidence exists and are bound to the exact tuple of scenario, harness, surface, scope, output kind, model or provider, and runtime.

## 7. Harness Capability and Distributable Model

The compiler cannot lower a distributable without knowing what the target harness supports. That knowledge is a declarative model the adapters read, and it is what lets one abstract distributable map onto many concrete harness containers.

### 7.1 Two Capability Questions, One Registry

There are two distinct capability questions, and they share one harness registry. The packaging-time question is whether a harness can host a given agentic primitive, such as a plugin, a hook, an extension, a skill, or an MCP server. The runtime question is whether a harness can execute a given step's required surface at run time, which is the concern the current capability evaluation already addresses for Playbook assists. The registry answers both; the compiler asks the first and the runner asks the second.

### 7.2 The Harness Capability Descriptor

Each harness has a descriptor declaring its identifier; the agentic primitives it supports; its native distributable container; the container's file layout, meaning paths and manifest filenames; a lifecycle event map from logical events to harness hook points; the exposure modes it supports, such as symlink or copy-mirror; its registration model, such as a marketplace, a config entry, or none; and its preconditions, such as trust and scope. The descriptor is data, and it is the single place harness-specific knowledge lives.

Illustratively, Claude Code supports skills, plugins, and hooks, with a plugin container and a plugin manifest. Codex supports skills and plugins, with a plugin container, a distinct plugin manifest, and a marketplace registration step, plus direct skills discovery. Pi supports skills, MCP, and extensions but not hooks, so its richest container is an extension bundled with skills. These specifics are verified and detailed in the adapter contracts, Section 8.

### 7.3 Two Granularities, Realized

The authoring unit is one Playbook, which projects to one skill. The distribution unit is a distributable, which an adapter lowers onto the richest container its target supports. A distributable has a profile: a portable profile lowers to agents-standard skills for maximum compatibility and is the lowest common denominator, while a native profile lowers to the richest harness-native container, such as a plugin or an extension. A bundle is multiple Playbooks compiled into one distributable that contains multiple skills. The industry question of how much complexity belongs in one skill never arises, because authoring granularity is fixed at one Playbook per skill and distribution granularity is a separate, adapter-driven choice.

### 7.4 Container Selection and Degradation

The adapter selects the richest container the harness supports for the chosen profile, maps the Playbook's implied agentics onto the harness's supported primitives, and handles the unsupported case explicitly. When a Playbook needs a primitive the harness lacks, such as a hook on a harness without hook support, the adapter either degrades by emitting the behavior as a documented manual step or skill instruction, or fails closed with an unsupported-surface stop. The choice is always declared, never silent.

### 7.5 The Marketplace and Registration Seam

Registration and marketplace files are generated into the distributable, but a user's global marketplace is never auto-mutated without an explicit global scope and approval. The default is to generate but not install. A config-gated policy seam in the global store can later opt into auto-registration where a stop-and-approve step would disrupt a deliberate workflow cadence, but that opt-in is additive and off by default.

## 8. Harness Adapter Contracts

An adapter is the code that reads a harness capability descriptor, Section 7.2, and lowers a distributable onto that harness's concrete container. The descriptor is data; the adapter is the executable contract. The defining requirement is that an adapter's paths, manifest shapes, and registration steps are verified against the real harness, not assumed from a path template. Assumed templates are exactly what produced the triggering bug.

### 8.1 The Verified-Contract Principle

Every adapter declaration carries a verification reference, naming where the harness contract was confirmed, and a verification status. An adapter whose contract is unverified may only produce export-only or provisional output, never a support claim. This prevents the current situation, where the Codex adapter declares a plugin path of `.agents/plugins/{packageId}` and writes a Make Docs descriptor, while the real Codex plugin shape is a `.codex-plugin/plugin.json` folder plus marketplace registration.

### 8.2 Codex

The Codex adapter must follow the verified Codex contract. A plugin is a folder containing `.codex-plugin/plugin.json`, registered through a marketplace entry such as `.agents/plugins/marketplace.json` or a configured marketplace source. A skills bundle uses direct `.agents/skills/{id}/SKILL.md` discovery with symlink or copy-mirror exposure. The current adapter is wrong on both the plugin path and the payload content and must be corrected before any Codex plugin support claim.

### 8.3 Claude Code

The Claude Code adapter lowers a plugin to `.claude/plugins/{id}/plugin.json` and a skill to `.claude/skills/{id}/SKILL.md`, or to agents-standard `.agents/skills` for the portable profile. Claude Code supports hooks, so event-bound steps lower to its hook points. The adapter is reviewed against the actual Claude Code plugin and skill contract before its support status moves beyond provisional.

### 8.4 Pi

The Pi adapter supports skills, MCP, and extensions but not hooks. Its richest native container is an extension bundled with one or more skills. Because Pi has no hook support, event-bound steps degrade to a documented manual step or skill instruction, or fail closed, per Section 7.4.

### 8.5 Fail-Closed for Unknown and Unsupported Surfaces

An unknown harness identifier, an unsupported output kind, an unsupported surface, or a scope the adapter cannot honor fails closed before any write, consistent with the existing stop reasons for unsupported output kind, unsupported surface, and unresolved target. A fixture adapter exercises the unsupported path so the fail-closed behavior is itself tested.

## 9. Conformance and Tuple Registry

Conformance tests the user-visible outcome, not the generated files. Current tests assert internal file writing and symlink exposure, which can pass while a real harness fails to recognize or use the output. Conformance closes that gap.

### 9.1 The Tuple

A support claim is bound to an exact tuple: the scenario, the harness, the surface, the scope, the output kind, the model or provider, the runtime, and the generated-output kind. The tuple is the unit of a support claim, and no claim may be broader than the tuple its evidence covers.

### 9.2 The Tuple Registry

The set of tuples and their statuses lives in a data file in the repository, not in prose, so that support status is queryable and cannot drift from documentation. Each tuple records a status of provisional, implementation-validated, or conformance-validated, and a status transition requires the corresponding evidence.

### 9.3 The Evidence Bar

To move a tuple to conformance-validated, a scenario installs the generated distributable into the real or a faithfully simulated harness, asserts discovery by confirming the output appears in the harness's listing, asserts invocation by confirming a bundled skill can be invoked or the workflow can be driven, and asserts clean uninstall by confirming managed outputs are removed without orphaning managed directories or deleting user-authored files. The bar is install, discover, invoke, and uninstall.

### 9.4 Required Scenarios

The first conformance pass proves the outcomes the current tests do not. A generated skills bundle appears as a skill in the target and can be invoked. A generated plugin appears through a marketplace, installs, exposes its bundled skills, and is usable in a new thread. Generated dependency checks surface missing tools and pass when the dependencies are present. Uninstall and backup remove managed generated outputs without orphaning empty managed directories or deleting user-authored files.

### 9.5 Test Layers

Coverage has three named layers so that one layer's passing never masquerades as another's. Unit tests cover the operation core, the parser, and the validator as pure functions without a CLI. Integration tests cover the CLI and MCP surfaces over the core, including the manifest and exposure plumbing. Conformance tests cover the real-harness user outcome per tuple. Internal tests passing must never be read as the user outcome working.

### 9.6 Support-Claim Governance

A public claim may state only what a conformance-validated tuple proves. Until a tuple is conformance-validated, wording distinguishes a Make Docs generated output from a harness-recognized plugin, which is the claim discipline the remediation record established as its first step.

## From Artifact to Design

This artifact is now a full-stack architecture, Sections 0 through 9, supported by three sibling working documents that hold the cross-cutting decisions: [cli-command-reorganization.md](cli-command-reorganization.md), [runtime-and-global-store.md](runtime-and-global-store.md), and the originating gap record [playbook-contract-and-plugin-remediation.md](playbook-contract-and-plugin-remediation.md). It remains pre-design source material and carries no implementation authority.

The conversion to lifecycle design documents should follow the dependency order this artifact is built in. The Playbook contract and model, Sections 1 through 4, is the first and most important design, because every downstream layer depends on the model being parseable and enforceable. The run state machine, Section 5, follows. Packaging and adapters, Sections 6 through 8, form a third design that depends on the model being rich. Conformance, Section 9, can be specified alongside packaging. The CLI reorganization and the global store warrant their own designs, since both are broader than Playbooks and are consumed by, rather than internal to, this architecture.

The most important review gate before conversion is unchanged: the Playbook contract and model must be ratified first, because it is the foundation every other layer compiles against.

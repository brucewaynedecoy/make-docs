# Playbook Contract

## Purpose

Use this contract for Playbooks under `docs/assets/playbooks/<persona-slug>/`.

This contract is the normative authority for the Playbook document schema, the embedded workflow contract and step model, the dependency registry, and the Playbook model with its parser, validator, and diagnostics. A Playbook is a persona-scoped workflow document that a human or an agent can read and execute directly: the file stays readable Markdown, and a bounded, schema-governed region inside it carries the executable contract.

The Playbook validator is this contract's executable enforcement, and the two are kept in parity: every rule stated in this contract is enforced by the validator, and the validator enforces no rule this contract does not state. A reader-facing guide may project this contract for humans, but a guide never adds, relaxes, or contradicts a requirement stated here.

## Scope and Boundaries

This contract owns exactly four areas: the Playbook document schema, the workflow contract and step model, the dependency registry, and the Playbook model with its parser, validator, and diagnostics.

The following are owned elsewhere, and nothing in this contract defines their behavior:

- The Run Playbook state machine and its progression operations. The optional orchestration policy fields in the workflow header are governed here for presence and shape only; their runtime semantics and the canonical harness-capability identifier set are owned by the Run Playbook orchestration lineage.
- The packaging compiler and the harness adapters. The dependency `Kind` declared in the registry governs how the packaging compiler later materializes a dependency, but that materialization is owned by packaging; this contract requires only that the declaration shape supports it.
- Conformance, the CLI command reorganization and operation-registry materialization, and the global store with run-state storage.

The step `operation` field references a Make Docs operation by its stable identifier from the operation registry. Operation identifiers are an external contract: steps and tooling must consume them as identifiers and must never substitute CLI command strings for them.

Standalone `<slug>.workflow.yaml` files are not part of this baseline and must not be required. The single-file Playbook form defined here is the contract.

## File Identity and Naming

- A Playbook is a persona-scoped docs asset stored at `docs/assets/playbooks/<persona-slug>/`. The `persona` frontmatter value must match the folder.
- New Playbooks must use the filename suffix `<slug>.playbook.md`.
- For migration, a plain `<slug>.md` file with frontmatter `kind: playbook` is also detected as a Playbook, is a deprecated form, and triggers the PB-FILE-007 rename diagnostic.

## Required Frontmatter

Frontmatter is YAML. Required fields:

| Field | Constraint |
| --- | --- |
| `kind` | Must be `playbook`. |
| `title` | Non-empty string. |
| `summary` | Non-empty single-line string used for catalogs, triggers, and generated descriptions. |
| `persona` | Persona slug; must match the containing folder. |
| `stack` | One of `build`, `run`. |
| `status` | One of `proposed`, `accepted`, `deprecated`. |
| `schemaVersion` | Document schema version string, for example `make-docs.playbook.v1`. |
| `workflowSchemaVersion` | Workflow contract schema version string, for example `make-docs.workflow.v1`. |

## Optional Frontmatter

| Field | Constraint |
| --- | --- |
| `packagingHints` | Non-authoritative hint object for the packaging compiler. Hints inform package-time decisions; they never bind them. |
| `id` | Explicit stable identifier. When absent, the canonical reference derives as `persona/slug`. |

## Required Headings and Order

The document body must contain exactly this heading spine, in this order, with no required heading missing and none out of order:

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

## Authoritative Versus Narrative Content

Exactly three regions of the file are authoritative and parsed for machine meaning: the frontmatter, the dependency registry table under `## Dependencies`, and the single workflow contract block under `## Workflow Contract`.

All other sections are narrative. The validator checks that each required narrative section exists and is non-empty, and it does not extract deterministic meaning from narrative free text. Narrative prose must never carry machine meaning.

## Unknown Sections

Unknown additional `##` sections placed after the required spine are allowed and ignored by the parser. An unknown section placed before or between required sections, or a missing or out-of-order required section, is a validation error (PB-DOC-001).

## Dependency Registry

Dependencies are declared as a Markdown table in the `## Dependencies` section. That table is the dependency registry of record: workflow steps reference its identifiers via `uses` and `requires`, and a step must never redefine a dependency inline.

### Columns

The table has exactly these columns:

| Column | Meaning |
| --- | --- |
| `ID` | Stable local identifier, unique within the Playbook, referenced by steps via `uses` and `requires`. |
| `Kind` | Dependency type; see the enumeration below. |
| `Requirement` | One of `required`, `optional`, `preferred`, `conditional`. |
| `Source` | Where the dependency comes from, such as a repo path, package name, marketplace entry, MCP server id, or another Playbook reference. |
| `Used By` | One or more step ids or workflow phases that consume the dependency. |
| `Fallback` | What execution does when the dependency is missing. |

### Enumerations

`Kind` is one of `cli`, `script`, `mcp`, `skill`, `plugin`, `playbook`, `reference`, `package-manager`, `external-service`. `asset` may be supported as an additional optional kind. `Requirement` is one of `required`, `optional`, `preferred`, `conditional`. `ID` values must be unique within the Playbook.

### Cross-Reference Integrity

Cross-reference integrity between the registry and the workflow contract is bidirectional:

- Every `uses` or `requires` reference in a step must resolve to a registry `ID`; an unknown identifier is an error (PB-DEP-003).
- Every routing target must resolve to a defined step `id`; an unresolved target is an error (PB-WF-006).
- A `requires` reference whose target dependency has `Requirement` `optional` is a contradiction and is an error.
- A declared dependency that is never referenced is a warning, not an error (PB-DEP-004), since a Playbook may declare an environmental prerequisite that no single step consumes.

## Workflow Contract Block

The workflow contract is a single fenced block inside the `## Workflow Contract` section, using the info string `playbook` and YAML-shaped content. The info string must be `playbook`, not `yaml`, so parsers, highlighters, and a future language server can target Playbook workflow syntax without colliding with ordinary YAML fences. There must be exactly one such block; zero or more than one is a validation error.

### Workflow Header

The block declares a workflow header with:

| Field | Constraint |
| --- | --- |
| `id` | Stable workflow identifier, conventionally matching the Playbook slug. |
| `state_model` | Run-state vocabulary version string, for example `make-docs.workflow-state.v1`. |
| `routing` | One of `linear`, `graph`. Defaults to `linear`. |

### Optional Orchestration Policy

The workflow header may carry an optional orchestration policy. Its fields and value sets are:

| Field | Constraint |
| --- | --- |
| `requires_capabilities` | List of canonical harness-capability identifiers. |
| `prefers_capabilities` | List of canonical harness-capability identifiers. |
| `child_playbooks` | One of `none`, `serial`, `parallel`. |
| `concurrency` | One of `serial`, `parallel-allowed`, `parallel-required`. |

This contract governs only the presence and shape of these fields. Their runtime semantics and the canonical harness-capability identifier set are owned by the Run Playbook orchestration lineage and are not defined here.

### Step Dimensions

Each step is described by four attributes drawn from fixed sets:

| Dimension | Values |
| --- | --- |
| `executor` | `cli`, `script`, `agent`, `human`, `mcp`, `child-playbook` |
| `role` | `activity`, `decision`, `gate`, `check`, `handoff` |
| `activation` | `sequential`, `event-bound` |
| `mode` | `deterministic`, `delegated`, `manual` |

When `mode` is unspecified, it defaults to `delegated`.

### Per-Step Fields

Each step record carries the following fields, with the stated conditional requirements:

- `id`: stable and unique within the workflow; duplicate step ids are an error.
- `title`: short human-readable label.
- `executor`, `role`, `activation`, `mode`: the dimensions above; values outside the fixed sets are workflow-layer validation errors.
- `event`: required when `activation` is `event-bound`; names a logical lifecycle event drawn from the known event set: `on-session-start`, `on-session-end`, `on-user-prompt-submit`, `on-pre-tool-use`, `on-post-tool-use`, `on-pre-commit`, `on-post-commit`, or `on-pre-push`.
- `uses` and `requires`: references to dependency identifiers declared in the dependency registry. `requires` is a hard precondition; `uses` is consumed but not gating. Steps reference dependencies by identifier only and never redefine a dependency inline.
- `inputs` and `outputs`: named input fields with defaults and missing-input behavior, and named output identifiers.
- At most one invocation form among `operation`, `command`, or `instructions`; declaring more than one is an error: `operation` references a Make Docs operation by stable registry identifier; `command: { run: ... }` is reserved for external tools Make Docs does not own; `instructions` carries instruction text for `agent` and `human` executors. A step whose `mode` is `deterministic` must declare either an `operation` or a `command` (PB-WF-005); a step that invokes nothing, such as a gate, declares no invocation form.
- `routing`: `on_success`, `on_failure`, `branch`, and `stop`. Absent routing in a `linear` workflow means proceed to the next step.
- Gate semantics: required when `role` is `gate`; the step must declare who may resolve the gate, what evidence is required, and whether unattended continuation is allowed.
- `validation`: deterministic checks, human-review checks, and the expected completion evidence for the step.
- `safety`: declared mutation surfaces, dry-run behavior, approval requirements, and rollback or backup expectations.

### Step Status Vocabulary

Step status values are defined once and shared with the run state; the runtime must not invent a parallel vocabulary. The status set is exactly: `pending`, `running`, `blocked`, `waiting-for-user`, `completed`, `failed`, `skipped`, `cancelled`.

## Worked Example

The following is the canonical illustration of a conformant `## Dependencies` registry and `## Workflow Contract` block, including a deterministic `operation` step, a `human` `gate` step, and an `event-bound` step. The parser must parse this example without error.

`````md
## Dependencies

| ID | Kind | Requirement | Source | Used By | Fallback |
| --- | --- | --- | --- | --- | --- |
| make-docs-cli | cli | required | package install | validate-catalog, enforce-commit-convention | stop with install guidance |

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
`````

In this example the linear runner walks `validate-catalog` then `review-gate`. The third step is event-bound and does not appear in the linear walk; how event-bound steps bind to harness hook points is owned by the packaging and harness-capability lineage, not by this contract.

## Playbook Model

One parser produces one Playbook model, the fully resolved in-memory form of the Playbook, and every consumer reads that model. Downstream consumers never re-parse Playbook Markdown. The model contains:

- Identity: canonical reference, source path, source digest, document and workflow schema versions, persona, stack, and status.
- The typed dependency registry keyed by identifier, each record carrying kind, requirement, source, used-by, and fallback.
- The workflow header and the fully resolved steps, with every dependency reference linked to the registry record it names rather than left as a bare string.
- A narrative-section presence map recording which required narrative sections are present and non-empty.
- Source spans for every parsed element, so diagnostics can point precisely at the offending text.

## Parser Stages

Parsing proceeds in stages, each able to emit diagnostics while continuing where possible:

1. Read the source and split frontmatter from body.
2. Parse the frontmatter against the document schema.
3. Locate the required headings and verify presence and order.
4. Parse the dependency registry table.
5. Locate and parse the single `playbook` workflow block.
6. Resolve cross-references, linking step dependency references to registry records and routing targets to step ids.
7. Assemble the Playbook model.

Parsing is fail-soft for diagnostics and fail-closed for execution: it collects as many diagnostics as it can, and the model is marked runnable only when there are zero errors. A Playbook that violates this contract fails validation before any run or packaging is attempted.

## Validation Layers

Validation is layered so diagnostics are specific:

- Structural: heading presence and order, frontmatter field presence and enum values, and the file-naming convention.
- Registry: table column schema, dependency kind and requirement enums, and unique dependency identifiers.
- Workflow: step schema, the executor, role, activation, and mode enums, and per-executor required fields, such as a deterministic step requiring an operation or a command, or an event-bound step requiring an event.
- Cross-reference integrity: every `uses` and `requires` resolves to a registry `ID`, every routing target resolves to a step `id`, gate fields are present when the role is `gate`, and no step `id` is duplicated.
- Consistency: a `requires` reference may not target an `optional` dependency, event names are drawn from the known event set, and unreferenced dependencies produce warnings rather than errors.

## Diagnostics

Every diagnostic carries a stable code, a severity, a precise location naming the section, field, and source span, a message, and an expected-shape or fix hint. The diagnostic set includes at least the following codes and severities:

| Code | Severity | Meaning |
| --- | --- | --- |
| PB-DOC-001 | error | A required section is missing or out of order. |
| PB-FM-002 | error | A frontmatter field is missing or has an invalid enum value. |
| PB-DEP-003 | error | A step references an unknown dependency identifier. |
| PB-DEP-004 | warning | A declared dependency is never referenced. |
| PB-WF-005 | error | A deterministic step declares neither an operation nor a command. |
| PB-WF-006 | error | A routing target is not a defined step identifier. |
| PB-FILE-007 | warning | A legacy filename should be renamed to the `*.playbook.md` form. |

## Operations and Reuse

The `playbook.validate` and `playbook.catalog` operations wrap the parser and validator library, and the Run Playbook runner consumes the Playbook model it produces. A future language server can wrap the same library so command-line and editor diagnostics never diverge; the language server itself is outside this contract.

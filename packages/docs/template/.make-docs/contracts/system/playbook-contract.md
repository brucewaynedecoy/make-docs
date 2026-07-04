# Playbook Contract

## Purpose

Use this contract for Playbooks under `docs/assets/playbooks/<persona-slug>/`.

This contract is the normative authority for the Playbook document schema, the embedded workflow contract and step model, the dependency registry, and the Playbook model with its parser, validator, and diagnostics. A Playbook is a persona-scoped workflow document that a human or an agent can read and execute directly: the file stays readable Markdown, and bounded, schema-governed regions inside it carry the executable contract.

The Playbook validator is this contract's executable enforcement, and the two are kept in parity: every rule stated in this contract is enforced by the validator, and the validator enforces no rule this contract does not state. A reader-facing guide may project this contract for humans, but a guide never adds, relaxes, or contradicts a requirement stated here.

This is schema v2 of the authoring contract. The v1 forms — the `## Dependencies` Markdown table, the `schemaVersion`/`workflowSchemaVersion` frontmatter keys, the `## Inputs And Authority`/`## Workflow Contract`/`## Gates And Decisions`/`## Outputs And Handoff` heading spellings, and the `make-docs.playbook.v1` schema identifier — were removed as a clean break: they never parse, and each fails validation with a pointed diagnostic naming its v2 replacement.

## Scope and Boundaries

This contract owns exactly four areas: the Playbook document schema, the workflow contract and step model, the dependency registry, and the Playbook model with its parser, validator, and diagnostics.

The following are owned elsewhere, and nothing in this contract defines their behavior:

- The Run Playbook state machine and its progression operations. The optional orchestration policy fields in the workflow header are governed here for presence and shape only; their runtime semantics and the canonical harness-capability identifier set are owned by the Run Playbook orchestration lineage.
- The packaging compiler and the harness adapters. The dependency `kind` declared in the registry governs how the packaging compiler later materializes a dependency, and the declared `probe` is the only field its generated dependency checks may target; that materialization is owned by packaging, and this contract requires only that the declaration shape supports it.
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
| `schema` | Document schema identifier; must be `make-docs.playbook.v2`. |
| `workflowSchema` | Workflow contract schema version string, for example `make-docs.workflow.v1`. |

The v1 keys `schemaVersion` and `workflowSchemaVersion` were removed: declaring either fails validation with a pointed diagnostic naming the v2 key (PB-FM-026), and a `schema` value other than `make-docs.playbook.v2` fails naming the v2 identifier (PB-FM-028).

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
4. `## Inputs`
5. `## Dependencies`
6. `## Workflow`
7. `## Step Guidance`
8. `## Gates`
9. `## Outputs`
10. `## Validation`
11. `## Packaging Notes`

`## Inputs` carries both the inputs a run consumes and the authority and precedence order the executor honors — name the sources of direction (user direction, repo contracts, active docs, code and validation evidence, archived history) and the order in which they win. `## Outputs` carries both the produced artifacts and the handoff the next stage inherits. The v1 spellings `## Inputs And Authority`, `## Workflow Contract`, `## Gates And Decisions`, and `## Outputs And Handoff` were removed; each fails validation with a pointed diagnostic naming the v2 heading for its slot (PB-DOC-027).

## Authoritative Versus Narrative Content

Exactly three regions of the file are authoritative and parsed for machine meaning: the frontmatter, the fenced dependencies block under `## Dependencies`, and the single workflow contract block under `## Workflow`.

All other sections are narrative. The validator checks that each required narrative section exists and is non-empty, and it does not extract deterministic meaning from narrative free text. Narrative prose must never carry machine meaning.

Both authoritative blocks use the fenced info string `playbook` and are distinguished by their top-level key: `dependencies` in `## Dependencies`, and the `workflow` header with `steps` in `## Workflow`. Exactly one authoritative `playbook` fence is allowed per governed section, and a `playbook` fence whose top-level key does not match its section is an error (PB-DOC-029).

## Unknown Sections

Unknown additional `##` sections placed after the required spine are allowed and ignored by the parser. An unknown section placed before or between required sections, or a missing or out-of-order required section, is a validation error (PB-DOC-001).

## Dependency Registry

Dependencies are declared as a fenced `playbook` block with a top-level `dependencies:` list in the `## Dependencies` section. That block is the dependency registry of record: workflow steps reference its identifiers via `uses` and `requires`, and a step must never redefine a dependency inline. The v1 Markdown table was removed; a table under `## Dependencies` fails validation with a pointed diagnostic naming this block (PB-DEP-025).

### Entry Fields

Each entry in the `dependencies` list declares exactly these fields:

| Field | Constraint |
| --- | --- |
| `id` | Required. Stable local identifier, unique within the Playbook, referenced by steps via `uses` and `requires`. |
| `kind` | Required. Dependency type; see the enumeration below. |
| `requirement` | Required. One of `required`, `optional`, `preferred`, `conditional`. |
| `probe` | Optional. The executable or reference target that generated dependency checks verify, defaulting to `id`. For `cli` and `package-manager` kinds this is the binary probed with `command -v`; for `skill` and `plugin` kinds it is the manifest reference identifier; other kinds reserve it. Must match the executable-token pattern when present. |
| `source` | Required. Human provenance prose — where the dependency comes from, such as a repo path, package name, marketplace entry, MCP server id, or another Playbook reference. Never parsed for machine meaning by anything. |
| `used_by` | Required. A YAML list of step ids or workflow phase names that consume the dependency. |
| `fallback` | Required. Prose describing what execution does when the dependency is missing. |

`probe` is the only field dependency-check generation may target; `source` is pure human provenance that nothing parses.

### Enumerations

`kind` is one of `cli`, `script`, `mcp`, `skill`, `plugin`, `playbook`, `reference`, `package-manager`, `external-service`. `asset` may be supported as an additional optional kind. `requirement` is one of `required`, `optional`, `preferred`, `conditional`. `id` values must be unique within the Playbook.

### Cross-Reference Integrity

Cross-reference integrity between the registry and the workflow contract is bidirectional:

- Every `uses` or `requires` reference in a step must resolve to a registry `id`; an unknown identifier is an error (PB-DEP-003).
- Every routing target must resolve to a defined step `id`; an unresolved target is an error (PB-WF-006).
- A `requires` reference whose target dependency has `requirement` `optional` is a contradiction and is an error.
- A declared dependency that is never referenced is a warning, not an error (PB-DEP-004), since a Playbook may declare an environmental prerequisite that no single step consumes.

## Workflow Contract Block

The workflow contract is a single fenced block inside the `## Workflow` section, using the info string `playbook` and YAML-shaped content. The info string must be `playbook`, not `yaml`, so parsers, highlighters, and a future language server can target Playbook workflow syntax without colliding with ordinary YAML fences. There must be exactly one such block; zero or more than one is a validation error.

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

The following is the canonical illustration of a conformant `## Dependencies` registry and `## Workflow` block, including a deterministic `operation` step, a `human` `gate` step, and an `event-bound` step. The parser must parse this example without error. Note the `probe` on `make-docs-cli`: its `source` is provenance prose, and the declared probe names the binary the generated check verifies.

`````md
## Dependencies

```playbook
dependencies:
  - id: make-docs-cli
    kind: cli
    requirement: required
    probe: make-docs
    source: package install of the make-docs CLI
    used_by: [validate-catalog, enforce-commit-convention]
    fallback: stop with install guidance
```

## Workflow

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
- The typed dependency registry keyed by identifier, each record carrying kind, requirement, the resolved probe (declared value or the `id` default), source, used-by, and fallback.
- The workflow header and the fully resolved steps, with every dependency reference linked to the registry record it names rather than left as a bare string.
- A narrative-section presence map recording which required narrative sections are present and non-empty.
- Source spans for every parsed element, so diagnostics can point precisely at the offending text.

## Parser Stages

Parsing proceeds in stages, each able to emit diagnostics while continuing where possible:

1. Read the source and split frontmatter from body.
2. Parse the frontmatter against the document schema.
3. Locate the required headings and verify presence and order.
4. Parse the fenced dependencies block into the typed registry.
5. Locate and parse the single `playbook` workflow block.
6. Resolve cross-references, linking step dependency references to registry records and routing targets to step ids.
7. Assemble the Playbook model.

Parsing is fail-soft for diagnostics and fail-closed for execution: it collects as many diagnostics as it can, and the model is marked runnable only when there are zero errors. A Playbook that violates this contract fails validation before any run or packaging is attempted. Removed v1 forms never parse to a model.

## Validation Layers

Validation is layered so diagnostics are specific:

- Structural: heading presence and order, frontmatter field presence and enum values, and the file-naming convention.
- Registry: dependencies-block field schema, dependency kind and requirement enums, unique dependency identifiers, and the executable-token pattern on a declared probe.
- Workflow: step schema, the executor, role, activation, and mode enums, and per-executor required fields, such as a deterministic step requiring an operation or a command, or an event-bound step requiring an event.
- Cross-reference integrity: every `uses` and `requires` resolves to a registry `id`, every routing target resolves to a step `id`, gate fields are present when the role is `gate`, and no step `id` is duplicated.
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
| PB-DEP-025 | error | The removed v1 dependency Markdown table is declared; the fix hint names the fenced `dependencies` block. |
| PB-FM-026 | error | A removed v1 frontmatter key (`schemaVersion`/`workflowSchemaVersion`) is declared; the fix hint names `schema`/`workflowSchema`. |
| PB-DOC-027 | error | A removed v1 heading spelling is used; the fix hint names the v2 heading for that slot. |
| PB-FM-028 | error | The document schema identifier is not `make-docs.playbook.v2`. |
| PB-DOC-029 | error | A `playbook` fence's top-level key does not match its governed section. |
| PB-DEP-030 | error | A declared dependency `probe` is not a single executable token. |

## Operations and Reuse

The `playbook.validate` and `playbook.catalog` operations wrap the parser and validator library, and the Run Playbook runner consumes the Playbook model it produces. A future language server can wrap the same library so command-line and editor diagnostics never diverge; the language server itself is outside this contract.

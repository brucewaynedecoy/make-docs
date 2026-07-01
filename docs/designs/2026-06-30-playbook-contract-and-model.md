# Playbook Contract and Model

## Purpose

This design establishes the authoritative contract for the Playbook primitive and the deterministic model that Make Docs parses a Playbook into. It defines four things and only these four things: the Playbook document schema that governs the Markdown file, the embedded workflow contract and step model that make a Playbook executable, the dependency registry that declares what a Playbook needs, and the Playbook model with its parser, validator, and diagnostic catalog.

It exists because Playbook contract authority is currently distributed across earlier designs, a single dogfood Playbook, and substring-based code validators, which is too weak to support deterministic execution or reliable packaging. This design is the gating foundation of the Playbook architecture: the Run Playbook state machine, the packaging compiler, the harness adapters, and conformance all compile against the model defined here, and none of them can be implemented correctly until this contract is parseable and enforceable.

The full architecture this design draws from is recorded in [Playbook Architecture and Design](../assets/artifacts/playbook-architecture.md), Sections 0 through 4. That artifact is the source material; this design is the authority that planning proceeds from.

## Context

Make Docs treats a Playbook as the primitive: a persona-scoped workflow document that a human or agent can read and execute directly, with skills and plugins as later projections of it rather than the first point at which it becomes operational. A Playbook must support three levels of use from one source: direct reading, guided execution by the Run Playbook engine, and packaged distribution. It must also degrade gracefully across three environments, with neither Make Docs nor its CLI present, with Make Docs resources present but no CLI, and with the CLI present. This design specifies the contract that makes all three uses and all three tiers possible; the runner and packaging behavior that consume the contract are specified in their own designs.

The current implementation is insufficient in specific, verified ways. There is no first-class Playbook contract at `packages/docs/template/.make-docs/contracts/system/playbook-contract.md` or its dogfood location `./.make-docs/contracts/system/playbook-contract.md`. The Playbook step record is shallow, modeling only a generated id, an index, free text, and a source-section label, which is not enough to reason about ownership, routing, status, inputs, outputs, tools, or checks. Body validation is substring-based, so a Playbook can pass while lacking machine-usable step semantics. Dependencies are mentioned in prose rather than declared. These gaps are why packaging produced a descriptor instead of a usable plugin: the model the packaging step compiled from was never rich enough.

Two cross-cutting decisions this design depends on are owned elsewhere and are referenced, not redefined, here. The step `operation` field names a Make Docs operation by a stable identifier from the operation registry; the registry and the CLI surface over it are specified in [CLI Command Reorganization](../assets/artifacts/cli-command-reorganization.md). The execution-mode and degradation concepts that the step model encodes are realized at run time by the runner; run state storage lives in the global store specified in [Runtime and Global Store](../assets/artifacts/runtime-and-global-store.md). This design defines the contract fields; it does not define their runtime execution.

This repository is the Make Docs maintainer repo and simultaneously a dogfood instance of Make Docs. Make Docs-owned resources are therefore authored upstream in the shipped template at `packages/docs/template/` and dogfooded into this repository's own `./.make-docs/` and `./docs/`; this design's authoring-location rules are stated in D0.

## Decision

### D0. Authoring Location, Authority, and Parity

R-AUTH-1 (MUST). This repository is both the Make Docs maintainer repo and a dogfood instance of Make Docs. Every Make Docs-owned resource this design introduces — the Playbook contract, the default Playbooks, and any associated reference or guide — MUST be authored upstream in the shipped template source of truth at `packages/docs/template/`, and then dogfooded downstream into this repository's own installed instance at `./.make-docs/` and `./docs/`. Authoring these resources directly in the downstream instance is prohibited. `packages/docs/template/` is the single upstream authority; the `packages/cli/` package does not maintain a separate template and pulls the template in only at build time. See [Template, Package, and Dogfood Source-of-Truth Contract](2026-06-19-template-package-and-dogfood-source-of-truth-contract.md).

R-AUTH-2 (MUST). The Playbook contract MUST be authored at `packages/docs/template/.make-docs/contracts/system/playbook-contract.md` as the normative authority for everything in this design, and dogfooded to `./.make-docs/contracts/system/playbook-contract.md`. It is the specification; the parser and validator in D5 are its executable enforcement.

R-AUTH-3 (MUST). The contract and the validator MUST be kept in parity. A rule stated in the contract MUST be enforced by the validator, and a rule enforced by the validator MUST be stated in the contract. Neither may carry a requirement the other omits.

R-AUTH-4 (SHOULD). A reader-facing guide MAY be created, upstream first and then dogfooded, under `docs/assets/library/<persona-slug>/` as a projection of the contract for humans. The guide MUST NOT add, relax, or contradict any contract requirement.

R-AUTH-5 (MUST). Default Playbooks introduced or migrated by this design MUST be authored upstream under `packages/docs/template/docs/assets/playbooks/<persona-slug>/` and dogfooded into `./docs/assets/playbooks/<persona-slug>/`, and MUST validate against this contract with zero errors in both locations. The packaged copy under `packages/cli/template/` is generated at build time and is not a hand-authored parity target.

### D1. Scope and Boundaries

This design owns exactly four areas: the document schema (D2), the workflow contract and step model (D3), the dependency registry (D4), and the Playbook model with its parser, validator, and diagnostics (D5). Implementers MUST treat these four areas as the complete and only surface of this design.

R-SCOPE-1 (MUST NOT). The following are owned by other designs and MUST NOT be designed, redefined, or reinvented in the implementation of this design:

- The Run Playbook state machine and its progression operations, including next, advance, gate, resume, and close. Owned by the Run Playbook design; see architecture artifact Section 5.
- The packaging compiler, the harness capability and distributable model, and the harness adapters. Owned by the packaging design; see architecture artifact Sections 6 through 8.
- Conformance and the tuple registry. See architecture artifact Section 9.
- The CLI command reorganization and the materialization of the operation registry. See [CLI Command Reorganization](../assets/artifacts/cli-command-reorganization.md).
- The global store and run-state storage. See [Runtime and Global Store](../assets/artifacts/runtime-and-global-store.md).

R-SCOPE-2 (MUST). This design depends on the operation registry existing and exposing stable operation identifiers, because the step `operation` field references them. The implementation MUST consume those identifiers as an external contract and MUST NOT hardcode CLI command strings in their place.

### D2. Playbook Document Schema

R-DOC-1 (MUST). A Playbook is a persona-scoped docs asset stored at `docs/assets/playbooks/<persona-slug>/`. The `persona` frontmatter value MUST match the folder.

R-DOC-2 (MUST). New Playbooks MUST use the filename suffix `<slug>.playbook.md`. For migration, the parser MUST also detect a Playbook by frontmatter `kind: playbook` on a plain `<slug>.md` file, MUST treat that as a deprecated form, and MUST emit the rename diagnostic in D5. The existing default Playbook at `packages/docs/template/docs/assets/playbooks/agent/make-docs-lifecycle.md` MUST be migrated to the suffix form upstream and dogfooded into `./docs/assets/playbooks/agent/`.

R-DOC-3 (MUST). Frontmatter is YAML. The following fields are REQUIRED, with the stated constraints:

- `kind`: MUST be `playbook`.
- `title`: non-empty string.
- `summary`: non-empty single-line string.
- `persona`: persona slug; MUST match the folder.
- `stack`: MUST be one of `build` or `run`.
- `status`: MUST be one of `proposed`, `accepted`, or `deprecated`.
- `schemaVersion`: the document schema version, for example `make-docs.playbook.v1`.
- `workflowSchemaVersion`: the workflow contract schema version, for example `make-docs.workflow.v1`.

R-DOC-4 (MAY). The following frontmatter fields are OPTIONAL: `packagingHints`, a non-authoritative hint object for the packaging compiler; and `id`, an explicit stable identifier. When `id` is absent, the canonical reference is derived as `persona/slug`.

R-DOC-5 (MUST). The document body MUST contain the following headings, in this exact order, with no required heading missing and none out of order:

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

R-DOC-6 (MUST). Exactly three regions of the file are authoritative and parsed for machine meaning: the frontmatter, the dependency registry table under `## Dependencies` (D4), and the single workflow contract block under `## Workflow Contract` (D3). All other sections are narrative. The validator MUST check that each required narrative section exists and is non-empty, and MUST NOT extract deterministic meaning from narrative free text. Implementers MUST NOT make any narrative prose carry machine meaning in this design.

R-DOC-7 (MAY / MUST). Unknown additional `##` sections placed after the required spine are allowed and MUST be ignored by the parser. An unknown section placed before or between required sections, or a missing or out-of-order required section, MUST be a validation error.

### D3. Workflow Contract and Step Model

R-WF-1 (MUST). The workflow contract MUST be a single fenced block inside the `## Workflow Contract` section, using the info string `playbook` and YAML-shaped content. There MUST be exactly one such block; zero or more than one is a validation error. The info string MUST be `playbook`, not `yaml`.

R-WF-2 (MUST NOT). Standalone `<slug>.workflow.yaml` files are NOT part of this baseline and MUST NOT be required. They remain a possible later option and are explicitly out of scope here.

R-WF-3 (MUST). The block MUST declare a workflow header with: `id`, a stable workflow identifier; `state_model`, the run-state vocabulary version, for example `make-docs.workflow-state.v1`; and `routing`, one of `linear` or `graph`, defaulting to `linear`.

R-WF-4 (MUST). Each step MUST be described by four attributes drawn from fixed sets:

- `executor`: one of `cli`, `script`, `agent`, `human`, `mcp`, `child-playbook`.
- `role`: one of `activity`, `decision`, `gate`, `check`, `handoff`.
- `activation`: one of `sequential` or `event-bound`.
- `mode`: one of `deterministic`, `delegated`, or `manual`. When `mode` is unspecified, it MUST default to `delegated`.

R-WF-5 (MUST). Each step record MUST carry the following fields, with the stated conditional requirements:

- `id`: stable and unique within the workflow.
- `title`: short human-readable label.
- `executor`, `role`, `activation`, `mode`: as in R-WF-4.
- `event`: REQUIRED when `activation` is `event-bound`; names a logical lifecycle event, for example `on-session-start` or `on-pre-commit`.
- `uses` and `requires`: references to dependency identifiers declared in D4. `requires` is a hard precondition; `uses` is consumed but not gating. A step MUST reference dependencies by identifier only and MUST NOT redefine a dependency inline.
- `inputs` and `outputs`: named input fields with defaults and missing-input behavior, and named output identifiers.
- `operation`, `command`, or `instructions`: `operation` references a Make Docs operation by stable registry identifier; `command: { run: ... }` is reserved for external tools Make Docs does not own; `instructions` carries instruction text for `agent` and `human` executors. A step whose `mode` is `deterministic` MUST declare either an `operation` or a `command`.
- `routing`: `on_success`, `on_failure`, `branch`, and `stop`. Absent routing in a `linear` workflow means proceed to the next step.
- gate semantics: REQUIRED when `role` is `gate`; MUST declare who may resolve the gate, what evidence is required, and whether unattended continuation is allowed.
- `validation`: deterministic checks, human-review checks, and expected completion evidence for the step.
- `safety`: declared mutation surfaces, dry-run behavior, approval requirements, and rollback or backup expectations.

R-WF-6 (MUST). Step status values are defined once and shared with the run state; the runtime MUST NOT invent a parallel vocabulary. The status set is exactly: `pending`, `running`, `blocked`, `waiting-for-user`, `completed`, `failed`, `skipped`, `cancelled`.

R-WF-7 (reference). The worked example in the architecture artifact Section 2.6 is the canonical illustration of a conformant `## Workflow Contract` block, including a deterministic `operation` step, a `human` `gate` step, and an `event-bound` step. The implementation MUST be able to parse that example without error.

R-WF-8 (MAY). The workflow header MAY carry an optional orchestration policy that narrows run-time behavior without changing the minimum contract. Its fields and value sets, which preserve the names established by the Run Playbook orchestration design, are: `requires_capabilities` and `prefers_capabilities`, each a list of canonical harness-capability identifiers; `child_playbooks`, one of `none`, `serial`, or `parallel`; and `concurrency`, one of `serial`, `parallel-allowed`, or `parallel-required`. This design owns only the presence and shape of these fields. Their run-time semantics and the canonical harness-capability identifier set are owned by the [Run Playbook State Machine](2026-07-01-run-playbook-state-machine.md) design and its predecessor, and MUST NOT be redefined here.

### D4. Dependency Registry

R-DEP-1 (MUST). Dependencies MUST be declared as a Markdown table in the `## Dependencies` section, and that table is the dependency registry of record. Workflow steps reference its identifiers; they MUST NOT duplicate dependency definitions.

R-DEP-2 (MUST). The table MUST have exactly these columns: `ID`, `Kind`, `Requirement`, `Source`, `Used By`, `Fallback`.

R-DEP-3 (MUST). `Kind` MUST be one of `cli`, `script`, `mcp`, `skill`, `plugin`, `playbook`, `reference`, `package-manager`, `external-service`. `asset` MAY be supported as an additional optional kind. `Requirement` MUST be one of `required`, `optional`, `preferred`, `conditional`. `ID` values MUST be unique within the Playbook.

R-DEP-4 (MUST). The parser MUST enforce bidirectional cross-reference integrity: every `uses` or `requires` reference in a step MUST resolve to a registry `ID`; every routing target MUST resolve to a defined step `id`. A `requires` reference whose target dependency is `optional` MUST be an error. An unreferenced declared dependency MUST be a warning, not an error.

R-DEP-5 (declaration only). The `Kind` of a dependency governs how the packaging compiler later materializes it. That materialization is owned by the packaging design and MUST NOT be implemented here. This design requires only that the declaration shape supports it.

### D5. Playbook Model, Parser, Validator, and Diagnostics

R-MODEL-1 (MUST). The parser and validator MUST be a core library module consistent with the operation-core ownership rules: pure functions that take a source and return a Playbook model plus diagnostics, with no presentation or filesystem effects beyond reading the provided input. The logic MUST be modular and compartmentalized; it MUST NOT be implemented as a single monolithic file.

R-MODEL-2 (MUST). The parser MUST produce one Playbook model: the fully resolved, in-memory form of the Playbook. It MUST contain identity, the typed dependency registry keyed by identifier, the workflow header and fully resolved steps with every dependency reference linked to its registry record, a narrative-section presence map, and source spans for every parsed element. Downstream consumers MUST read the model and MUST NOT re-parse Markdown.

R-MODEL-3 (MUST). Parsing MUST proceed in stages, each able to emit diagnostics while continuing where possible: read and split frontmatter from body; parse frontmatter; locate required headings and verify order; parse the dependency table; locate and parse the single workflow block; resolve cross-references; assemble the model. Parsing MUST be fail-soft for diagnostics and fail-closed for execution: it collects as many diagnostics as it can, but the model is marked runnable only when there are zero errors.

R-MODEL-4 (MUST). Validation MUST be layered: structural (heading presence and order, frontmatter fields and enums, file naming), registry (column schema, kind and requirement enums, unique identifiers), workflow (step schema, the executor, role, activation, and mode enums, and per-executor required fields), cross-reference integrity (D4), and consistency (a `requires` may not target an optional dependency, event names from the known set, no duplicate step identifiers).

R-MODEL-5 (MUST). Diagnostics are a first-class output because Playbooks are co-authored by humans and agents. Each diagnostic MUST carry a stable code, a severity, a precise location naming the section and field and source span, a message, and an expected-shape or fix hint. The diagnostic set MUST include at least the following codes and severities:

| Code | Severity | Meaning |
| --- | --- | --- |
| PB-DOC-001 | error | a required section is missing or out of order |
| PB-FM-002 | error | a frontmatter field is missing or has an invalid enum value |
| PB-DEP-003 | error | a step references an unknown dependency identifier |
| PB-DEP-004 | warning | a declared dependency is never referenced |
| PB-WF-005 | error | a deterministic step declares neither an operation nor a command |
| PB-WF-006 | error | a routing target is not a defined step identifier |
| PB-FILE-007 | warning | a legacy filename should be renamed to the `*.playbook.md` form |

R-MODEL-6 (MUST). The `playbook.validate` and `playbook.catalog` operations MUST wrap this library, and the runner MUST consume its model. A future language server MUST be able to wrap the same library so command-line and editor diagnostics never diverge; the language server itself is out of scope here.

### D6. Non-Negotiable Decisions and Deliberately Open Choices

The following are fixed by this design and MUST NOT be substituted, relaxed, or reinvented:

- The eleven-heading spine and its order (R-DOC-5).
- The authoritative-versus-narrative line: only frontmatter, the dependency table, and the single workflow block carry machine meaning (R-DOC-6).
- The `playbook` info string for the workflow block (R-WF-1).
- The executor, role, activation, mode, status, dependency-kind, and requirement enumerations, and the `delegated` default for unspecified mode (R-WF-4, R-WF-6, R-DEP-3).
- The single-model rule: one parser produces one Playbook model that every consumer reads (R-MODEL-2).
- The `operation` versus `command` split, and referencing Make Docs operations by registry identifier rather than command string (R-WF-5, R-SCOPE-2).

The following are deliberately left to the implementer and MUST NOT be treated as under-specified gaps:

- The concrete in-memory data structures of the Playbook model, provided they carry the required content.
- The internal file and module organization of the parser library, provided it is modular per R-MODEL-1.
- The exact human wording of diagnostic messages, provided each carries the required code, severity, location, and fix hint.
- The precise format used to persist the contract version strings, provided they are present and checked.

### D7. Verification and Testability

R-TEST-1 (MUST). The parser and validator MUST have unit tests with both valid and invalid fixtures, and there MUST be at least one failing fixture that triggers each diagnostic code in R-MODEL-5.

R-TEST-2 (MUST). Test coverage MUST include required-heading-order violations, dependency-table schema violations, malformed and absent workflow blocks, cross-reference integrity violations in both directions, and legacy-filename detection.

R-TEST-3 (MUST). The migrated default Playbook MUST validate with zero errors in both the upstream template (`packages/docs/template/`) and this repository's dogfood instance. All shipped default Playbooks MUST validate with zero errors.

R-TEST-4 (MUST). Contract errors MUST be detectable at validate time. A Playbook that violates this contract MUST fail validation before any run or packaging is attempted, not at run time or package time.

## Alternatives Considered

Keep substring body validation. Rejected. It allows a human-readable Playbook to pass while lacking machine-usable step semantics, which is the root cause of the current gap.

Adopt a two-file baseline of Markdown plus a standalone `workflow.yaml`. Rejected for the baseline because two files increase drift risk and make direct agent execution less ergonomic. It is preserved as a possible later option for very large or generated workflows.

Encode steps as frontmatter arrays or as Markdown tables instead of an embedded YAML-shaped block. Rejected. Those forms are less expressive for routing, gates, and graph workflows, and they fragment the executable contract.

Use the `yaml` info string for the workflow block. Rejected. A distinct `playbook` info string lets parsers, highlighters, and a future language server target Playbook workflow syntax specifically without colliding with ordinary YAML fences.

Model step type as a single flat enum, as in the earlier eleven-value list of activity, request, decision, gate, check, validation, handoff, tool, script, package, and child-playbook. Rejected in favor of the orthogonal executor, role, and activation dimensions, which remove the ambiguity of classifying a gate that runs a script and are more future-proof.

Continue packaging-first, treating skills and plugins as the first operational form. Rejected. It is the inversion this architecture corrects: the Playbook is the primitive, and packaging compiles from a rich model that must exist first.

## Consequences

Deterministic execution becomes possible, because the runner advances through a fully resolved step model rather than inferring semantics from prose. One model feeds the reader, the runner, and the packaging compiler, so the three uses never diverge. Diagnostics are agent-actionable, which makes the human-plus-agent co-authoring loop work, and generated outputs that drive Make Docs reference operation identifiers, so they survive the CLI reorganization.

The costs are real and accepted. The strict heading spine is an authoring constraint, mitigated by the diagnostic catalog and, later, a scaffold operation that emits a valid skeleton. Existing Playbooks must be migrated. The contract, validator, and template parity is an ongoing maintenance obligation. This design also gates downstream work: the runner, packaging, and conformance designs depend on this model being ratified, so its acceptance is on the critical path.

The most important review gate before this design proceeds to planning is whether the document schema, workflow contract, dependency registry, and model are specified precisely enough that an implementing agent cannot substitute an alternative encoding, relax a fixed enumeration, or let narrative prose carry machine meaning.

## Design Lineage

Update Mode: new-doc-related.

Prior Design Docs: [Playbook Contract and Run Playbook](2026-06-20-playbook-contract-and-run-playbook.md), [Run Playbook Orchestration and Harness Capabilities](2026-06-27-run-playbook-orchestration-and-harness-capabilities.md), [Playbook Packaging and Harness Adapter Registry](2026-06-29-playbook-packaging-and-harness-adapter-registry.md).

Reason: This design recovers and supersedes the Playbook contract intent that was distributed across those designs, a single dogfood Playbook, and substring-based validators. It defines a deterministic, parseable document-and-workflow contract and a single Playbook model. It does not replace the downstream scope of the run-playbook or packaging designs; it provides the contract foundation they assumed but that was only partially specified, and they now compile against it.

## Intended Follow-On

Route: `change-plan`

Next Prompt: [designs-to-plan-change.prompt.md](../../.make-docs/references/system/prompts/designs-to-plan-change.prompt.md)

Why: This is a corrective evolution of active W18 Playbook requirements. It tightens and recovers the existing Playbook contract namespace rather than starting a fresh baseline, so it should feed additive change planning against the active PRD namespace.

Coordinate Handoff: Revises W18 R1 (Playbook contract and catalog validation) and W18 R4 (resolver and stack disambiguation), because it replaces the substring-based contract those waves established with a deterministic document-and-workflow contract and model. Recommended downstream coordinate unresolved; planner must resolve against the active W18 namespace before writing.

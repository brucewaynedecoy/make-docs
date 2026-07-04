---
title: "34 Revise Playbook Contract and Model"
kind: "prd"
status: "active"
coordinate: "W18 R6"
source:
  type: "design"
  path: "docs/designs/2026-06-30-playbook-contract-and-model.md"
---

# 34 Revise Playbook Contract and Model

## Purpose

Replace the substring-based, prose-distributed Playbook contract established by the PRD 29 lineage with the authoritative, deterministic contract for the Playbook primitive: a document schema, an embedded workflow contract and step model, a first-class dependency registry, and one parsed Playbook model with a parser, layered validator, and diagnostic catalog. This change belongs in the active PRD namespace because it revises requirements PRD 29, PRD 22, PRD 30, and PRD 33 already established, and because the Run Playbook state machine, the packaging compiler, the harness adapters, and conformance all compile against the model defined here.

## Change Type

Revision. This PRD supersedes the playbook naming, minimum-frontmatter, body-contract, and orchestration-hint declaration requirements from the PRD 29 lineage and constrains PRD 33 packaging rails to consume the single Playbook model. It does not revise resolver identity, run-state, harness capability semantics, the generic Run Playbook model, plugin substrate, packaging outputs, or conformance; those remain governed by their owning docs and designs.

Route: `change-plan`

Coordinate: `W18 R6`

## Baseline Being Revised or Removed

- [29-revise-playbook-contract-run-playbook.md](29-revise-playbook-contract-run-playbook.md): the `<playbook-slug>.md` filename form under Canonical Playbook Location, the six-field Minimum Frontmatter set, the prose-level Body Contract bullet list, and the optional `run:` frontmatter block under Harness Capability Mediation as the declaration location for orchestration hints. Resolver identity, stack discriminator semantics, the generic Run Playbook model, run state, nesting, concurrency, the plugin/surface boundary, and the template/migration flow in PRD 29 remain active.
- [22-revise-new-docs-assets-playbooks-persona-model.md](22-revise-new-docs-assets-playbooks-persona-model.md): the `<playbook-slug>.md` filename form shown in the Managed Project Asset Namespace tree. The namespace itself, persona schema, and frontmatter authority remain active.
- [30-revise-harness-plugin-substrate-workflow-bundles.md](30-revise-harness-plugin-substrate-workflow-bundles.md): the `docs/assets/playbooks/<persona-slug>/<playbook-slug>.md` filename literal cited in the Playbook Boundary. The boundary itself remains active.
- [33-enhance-playbook-packaging-and-harness-adapter-registry.md](33-enhance-playbook-packaging-and-harness-adapter-registry.md): the deterministic rails in Contracts and Data that perform source parsing and frontmatter/stack validation are extended, not replaced — they must now read the single Playbook model this PRD defines rather than re-parsing Playbook Markdown independently.

## Rationale

Playbook contract authority is currently distributed across earlier designs, a single dogfood Playbook, and substring-based code validators, which is too weak to support deterministic execution or reliable packaging. There is no first-class contract at `packages/docs/template/.make-docs/contracts/system/playbook-contract.md` or its dogfood location; the Playbook step record models only a generated id, an index, free text, and a source-section label; body validation is substring-based so a Playbook can pass while lacking machine-usable step semantics; and dependencies are mentioned in prose rather than declared. These gaps are why W18 R5 packaging produced a descriptor instead of a usable plugin: the model the packaging step compiled from was never rich enough.

Code anchors:

- `packages/cli/src/operations/playbook.ts`
- `packages/cli/src/rules.ts`
- `docs/assets/playbooks/agent/make-docs-lifecycle.md`

## Effective Requirement

The effective requirement set carries the design's requirement IDs so traceability holds; [../designs/2026-06-30-playbook-contract-and-model.md](../designs/2026-06-30-playbook-contract-and-model.md) is the normative statement of each.

### Authoring Location, Authority, and Parity (R-AUTH)

- R-AUTH-1 (MUST): every Make Docs-owned resource this change introduces — the Playbook contract, default Playbooks, and any associated reference or guide — is authored upstream in `packages/docs/template/` and dogfooded into this repository's `./.make-docs/` and `./docs/`; authoring directly downstream is prohibited, per [19-revise-template-package-dogfood-source-of-truth-contract.md](19-revise-template-package-dogfood-source-of-truth-contract.md).
- R-AUTH-2 (MUST): the Playbook contract is authored at `packages/docs/template/.make-docs/contracts/system/playbook-contract.md` and dogfooded to `./.make-docs/contracts/system/playbook-contract.md`; it is the specification, and the parser/validator are its executable enforcement.
- R-AUTH-3 (MUST): the contract and validator stay in parity; neither may carry a requirement the other omits.
- R-AUTH-4 (SHOULD/MAY): a reader-facing guide under `docs/assets/library/<persona-slug>/` may project the contract for humans but must not add, relax, or contradict any requirement.
- R-AUTH-5 (MUST): default Playbooks are authored upstream under `packages/docs/template/docs/assets/playbooks/<persona-slug>/`, dogfooded into `./docs/assets/playbooks/<persona-slug>/`, and validate with zero errors in both locations; the `packages/cli/template/` copy is build-time generated, not a hand-authored parity target.

### Scope and Boundaries (R-SCOPE)

- R-SCOPE-1 (MUST NOT): this change owns exactly four areas — document schema, workflow contract and step model, dependency registry, and the Playbook model with parser/validator/diagnostics. The Run Playbook state machine and progression operations, the packaging compiler and harness adapters, conformance and the tuple registry, the CLI command reorganization and operation-registry materialization, and the global store and run-state storage are owned by other designs and must not be redesigned or reinvented here.
- R-SCOPE-2 (MUST): the step `operation` field references stable identifiers from the operation registry as an external contract; implementations must not hardcode CLI command strings in their place.

### Playbook Document Schema (R-DOC)

- R-DOC-1 (MUST): a Playbook is a persona-scoped docs asset at `docs/assets/playbooks/<persona-slug>/`; the `persona` frontmatter must match the folder.
- R-DOC-2 (MUST): new Playbooks use the `<slug>.playbook.md` filename suffix; the parser also detects `kind: playbook` on a plain `<slug>.md` file as a deprecated form and emits the rename diagnostic; the existing default Playbook at `packages/docs/template/docs/assets/playbooks/agent/make-docs-lifecycle.md` is migrated to the suffix form upstream and dogfooded.
- R-DOC-3 (MUST): required YAML frontmatter is `kind: playbook`, non-empty `title`, non-empty single-line `summary`, `persona` matching the folder, `stack` of `build` or `run`, `status` of `proposed`/`accepted`/`deprecated`, `schemaVersion` (for example `make-docs.playbook.v1`), and `workflowSchemaVersion` (for example `make-docs.workflow.v1`).
- R-DOC-4 (MAY): `packagingHints` and `id` are optional; when `id` is absent the canonical reference derives as `persona/slug`.
- R-DOC-5 (MUST): the body carries the eleven-heading spine in exactly this order: `# <Title>`, `## Purpose`, `## When To Use`, `## Inputs And Authority`, `## Dependencies`, `## Workflow Contract`, `## Step Guidance`, `## Gates And Decisions`, `## Outputs And Handoff`, `## Validation`, `## Packaging Notes`.
- R-DOC-6 (MUST): exactly three regions are authoritative and parsed for machine meaning — the frontmatter, the dependency registry table, and the single workflow contract block; all other sections are narrative, checked only for presence and non-emptiness, and narrative prose must never carry machine meaning.
- R-DOC-7 (MAY/MUST): unknown `##` sections after the required spine are allowed and ignored; an unknown section before or between required sections, or a missing or out-of-order required section, is a validation error.

#### Change Notes

- Superseded by [40-revise-playbook-authoring-contract-v2.md](40-revise-playbook-authoring-contract-v2.md). The v2 authoring contract renames the R-DOC-3 version keys to `schema`/`workflowSchema`, simplifies the R-DOC-5 spine spellings to `## Inputs`, `## Workflow`, `## Gates`, and `## Outputs`, and advances the schema version to the v2 identifier as a clean break: the old keys, spellings, and v1 identifiers are removed and fail with pointed diagnostics naming the v2 shape. R-DOC-6's authoritative regions now read the fenced dependencies block in place of the dependency registry table; the narrative-prose rule itself is unchanged and is the stated rationale for the change.

### Workflow Contract and Step Model (R-WF)

- R-WF-1 (MUST): the workflow contract is exactly one fenced block inside `## Workflow Contract` with info string `playbook` (not `yaml`) and YAML-shaped content; zero or more than one block is a validation error.
- R-WF-2 (MUST NOT): standalone `<slug>.workflow.yaml` files are not part of this baseline and must not be required.
- R-WF-3 (MUST): the block declares a workflow header with `id`, `state_model` (for example `make-docs.workflow-state.v1`), and `routing` of `linear` or `graph`, defaulting to `linear`.
- R-WF-4 (MUST): each step is described by `executor` (`cli`, `script`, `agent`, `human`, `mcp`, `child-playbook`), `role` (`activity`, `decision`, `gate`, `check`, `handoff`), `activation` (`sequential` or `event-bound`), and `mode` (`deterministic`, `delegated`, `manual`, defaulting to `delegated` when unspecified).
- R-WF-5 (MUST): each step record carries `id` (unique in the workflow), `title`, the four dimensions, `event` when event-bound, `uses`/`requires` referencing dependency identifiers only, `inputs`/`outputs`, at most one invocation form among `operation` (registry identifier), `command: { run: ... }` (external tools only), or `instructions` (agent/human executors) — a step that invokes nothing, such as a gate, declares no form — `routing` (`on_success`, `on_failure`, `branch`, `stop`), gate semantics when `role` is `gate` (resolver, evidence, unattended allowance), `validation`, and `safety` declarations; a `deterministic` step must declare an `operation` or a `command`.
- R-WF-6 (MUST): step status values are shared with run state and are exactly `pending`, `running`, `blocked`, `waiting-for-user`, `completed`, `failed`, `skipped`, `cancelled`.
- R-WF-7 (reference): the worked example in [../assets/artifacts/playbook-architecture.md](../assets/artifacts/playbook-architecture.md) Section 2.6 is the canonical conformant block, and the implementation must parse it without error.
- R-WF-8 (MAY): the workflow header may carry an optional orchestration policy preserving the W18 R4 names — `requires_capabilities`, `prefers_capabilities`, `child_playbooks` (`none`/`serial`/`parallel`), and `concurrency` (`serial`/`parallel-allowed`/`parallel-required`); this PRD owns only presence and shape, while runtime semantics and the canonical harness-capability identifier set remain with the Run Playbook orchestration lineage in [29-revise-playbook-contract-run-playbook.md](29-revise-playbook-contract-run-playbook.md).

### Dependency Registry (R-DEP)

- R-DEP-1 (MUST): dependencies are declared as a Markdown table in `## Dependencies`, which is the dependency registry of record; steps reference its identifiers and never redefine dependencies inline.
- R-DEP-2 (MUST): the table has exactly the columns `ID`, `Kind`, `Requirement`, `Source`, `Used By`, `Fallback`.
- R-DEP-3 (MUST): `Kind` is one of `cli`, `script`, `mcp`, `skill`, `plugin`, `playbook`, `reference`, `package-manager`, `external-service`, with `asset` optionally supported; `Requirement` is one of `required`, `optional`, `preferred`, `conditional`; `ID` values are unique within the Playbook.
- R-DEP-4 (MUST): cross-reference integrity is bidirectional — every `uses`/`requires` resolves to a registry `ID` and every routing target resolves to a step `id`; a `requires` targeting an `optional` dependency is an error; an unreferenced declared dependency is a warning.
- R-DEP-5 (declaration only): dependency `Kind` governs how the packaging compiler later materializes it; that materialization is owned by [33-enhance-playbook-packaging-and-harness-adapter-registry.md](33-enhance-playbook-packaging-and-harness-adapter-registry.md) and is not implemented here.

#### Change Notes

- Superseded by [40-revise-playbook-authoring-contract-v2.md](40-revise-playbook-authoring-contract-v2.md). The Markdown dependency table (R-DEP-1 through R-DEP-3) is replaced by a fenced `playbook` block with a top-level `dependencies` key and typed per-entry fields — `id`, `kind`, `requirement`, optional `probe` defaulting to `id`, `source` as unparsed human provenance prose, `used_by` as a typed list, and `fallback` — with `probe` the only field dependency-check generation may target. The registry-of-record role, identifier uniqueness, the kind and requirement enumerations, and R-DEP-4 cross-reference integrity carry forward unchanged; the v1 table form is removed and fails with a pointed diagnostic naming the block shape.

### Playbook Model, Parser, Validator, and Diagnostics (R-MODEL)

- R-MODEL-1 (MUST): the parser and validator are a pure, modular core library module — source in, Playbook model plus diagnostics out, no presentation or filesystem effects beyond reading the input, and no monolithic single file.
- R-MODEL-2 (MUST): the parser produces one fully resolved Playbook model — identity, typed dependency registry keyed by identifier, workflow header and fully linked steps, narrative-section presence map, and source spans for every parsed element; downstream consumers read the model and never re-parse Markdown.
- R-MODEL-3 (MUST): parsing proceeds in stages (split frontmatter, parse frontmatter, locate/verify headings, parse dependency table, locate/parse the single workflow block, resolve cross-references, assemble the model), fail-soft for diagnostics and fail-closed for execution: the model is runnable only with zero errors.
- R-MODEL-4 (MUST): validation is layered — structural, registry, workflow, cross-reference integrity, and consistency.
- R-MODEL-5 (MUST): every diagnostic carries a stable code, severity, precise location with section/field/source span, message, and fix hint; the set includes at least PB-DOC-001 (error, required section missing or out of order), PB-FM-002 (error, frontmatter field missing or invalid enum), PB-DEP-003 (error, unknown dependency identifier), PB-DEP-004 (warning, unreferenced dependency), PB-WF-005 (error, deterministic step with neither operation nor command), PB-WF-006 (error, routing target not a defined step), and PB-FILE-007 (warning, legacy filename should be renamed to `*.playbook.md`).
- R-MODEL-6 (MUST): the `playbook.validate` and `playbook.catalog` operations wrap this library, the runner consumes its model, and a future language server can wrap the same library so command-line and editor diagnostics never diverge; the language server itself is out of scope.

#### Change Notes

- Superseded by [40-revise-playbook-authoring-contract-v2.md](40-revise-playbook-authoring-contract-v2.md). The R-MODEL-3 parse-dependency-table stage becomes a dependencies-block parsing stage and the v1 table parser is deleted; the diagnostics catalog gains pointed old-form error diagnostics naming the v2 replacement shapes for the removed table, keys, spellings, and v1 schema identifiers. The model shape, layered validation, and the R-MODEL-5 diagnostic set otherwise remain active.

### Verification and Testability (R-TEST)

- R-TEST-1 (MUST): the parser and validator have unit tests with valid and invalid fixtures, including at least one failing fixture per R-MODEL-5 diagnostic code.
- R-TEST-2 (MUST): coverage includes heading-order violations, dependency-table schema violations, malformed and absent workflow blocks, cross-reference violations in both directions, and legacy-filename detection.
- R-TEST-3 (MUST): the migrated default Playbook validates with zero errors in both `packages/docs/template/` and this repository's dogfood instance, and all shipped default Playbooks validate with zero errors.
- R-TEST-4 (MUST): contract violations are detectable at validate time and fail before any run or packaging is attempted.

The design's D6 section fixes the eleven-heading spine, the authoritative-versus-narrative line, the `playbook` info string, every enumeration and the `delegated` default, the single-model rule, and the `operation`-versus-`command` split as non-substitutable, while leaving concrete in-memory data structures, internal module layout, diagnostic message wording, and version-string persistence format to the implementer.

Code anchors:

- `packages/docs/template/.make-docs/contracts/system/playbook-contract.md`
- `.make-docs/contracts/system/playbook-contract.md`
- `packages/docs/template/docs/assets/playbooks/agent/make-docs-lifecycle.md`
- `packages/cli/src/operations/playbook.ts`

## Impacted Docs and Dependencies

- [29-revise-playbook-contract-run-playbook.md](29-revise-playbook-contract-run-playbook.md): naming, minimum frontmatter, body contract, and the `run:` orchestration-hint declaration location are superseded; its runner, resolver, run-state, and boundary requirements now consume the Playbook model rather than re-validating substring content.
- [22-revise-new-docs-assets-playbooks-persona-model.md](22-revise-new-docs-assets-playbooks-persona-model.md): the playbook filename form in the managed asset namespace tree becomes `<playbook-slug>.playbook.md`; persona schema and frontmatter authority are unchanged.
- [30-revise-harness-plugin-substrate-workflow-bundles.md](30-revise-harness-plugin-substrate-workflow-bundles.md): the Playbook Boundary filename literal follows the new suffix form; plugin substrate semantics are unchanged.
- [33-enhance-playbook-packaging-and-harness-adapter-registry.md](33-enhance-playbook-packaging-and-harness-adapter-registry.md): package-planner deterministic rails for source parsing and frontmatter/stack validation must read the single Playbook model; output kinds, surfaces, adapters, and lifecycle behavior are unchanged.
- Downstream dependency: the [Run Playbook State Machine](../designs/2026-07-01-run-playbook-state-machine.md) design, the packaging design lineage behind PRD 33, and conformance all compile against this model and are gated on its acceptance.
- External contracts consumed: the operation registry and stable operation identifiers (CLI command reorganization lineage, see [../assets/artifacts/cli-command-reorganization.md](../assets/artifacts/cli-command-reorganization.md)) and run-state storage in the global store (see [../assets/artifacts/runtime-and-global-store.md](../assets/artifacts/runtime-and-global-store.md)); this PRD defines contract fields, not their runtime execution.

Code anchors:

- `packages/cli/src/operations/playbook.ts`
- `packages/cli/src/operations/plugin.ts`
- `scripts/smoke-pack.mjs`

## Required Baseline Annotations

- [29-revise-playbook-contract-run-playbook.md](29-revise-playbook-contract-run-playbook.md): `Superseded by` under Canonical Playbook Location, Minimum Frontmatter, Body Contract, and Harness Capability Mediation, plus a W18 R6 paragraph in its doc-level Change Notes.
- [22-revise-new-docs-assets-playbooks-persona-model.md](22-revise-new-docs-assets-playbooks-persona-model.md): `Superseded by` under Managed Project Asset Namespace for the playbook filename form.
- [30-revise-harness-plugin-substrate-workflow-bundles.md](30-revise-harness-plugin-substrate-workflow-bundles.md): `Superseded by` under Playbook Boundary for the playbook filename literal.
- [33-enhance-playbook-packaging-and-harness-adapter-registry.md](33-enhance-playbook-packaging-and-harness-adapter-registry.md): `Enhanced by` under Contracts and Data for model-consuming deterministic rails.
- [00-index.md](00-index.md): add PRD 34 to the reading order, document map, source anchors, audience paths, and intended follow-on.
- [03-open-questions-and-risk-register.md](03-open-questions-and-risk-register.md): add the contract/validator/template parity-drift rebuild risk and extend the existing R-016 and R-017 decisions with the single-model rule.

## Source Anchors

- [../designs/2026-06-30-playbook-contract-and-model.md](../designs/2026-06-30-playbook-contract-and-model.md)
- [../assets/artifacts/playbook-architecture.md](../assets/artifacts/playbook-architecture.md)
- [../plans/2026-07-01-w18-r6-playbook-contract-and-model/00-overview.md](../plans/2026-07-01-w18-r6-playbook-contract-and-model/00-overview.md)
- [../work/2026-07-01-w18-r6-playbook-contract-and-model/00-index.md](../work/2026-07-01-w18-r6-playbook-contract-and-model/00-index.md)
- [29 Revise Playbook Contract Run Playbook](29-revise-playbook-contract-run-playbook.md)
- [22 Revise New Docs Assets Playbooks Persona Model](22-revise-new-docs-assets-playbooks-persona-model.md)
- [30 Revise Harness Plugin Substrate Workflow Bundles](30-revise-harness-plugin-substrate-workflow-bundles.md)
- [33 Enhance Playbook Packaging and Harness Adapter Registry](33-enhance-playbook-packaging-and-harness-adapter-registry.md)
- [19 Revise Template Package Dogfood Source of Truth Contract](19-revise-template-package-dogfood-source-of-truth-contract.md)
- [25 Revise CLI Separation and MCP Boundary](25-revise-cli-separation-and-mcp-boundary.md)
- `packages/docs/template/.make-docs/contracts/system/playbook-contract.md`
- `packages/docs/template/docs/assets/playbooks/agent/make-docs-lifecycle.md`
- `docs/assets/playbooks/agent/make-docs-lifecycle.md`
- `packages/cli/src/operations/playbook.ts`
- `scripts/smoke-pack.mjs`

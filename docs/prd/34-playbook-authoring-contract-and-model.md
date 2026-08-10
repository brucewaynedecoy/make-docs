---
title: "34 Playbook Authoring Contract and Model"
kind: "prd"
status: "active"
source:
  type: "design"
  path: "docs/designs/2026-06-30-playbook-contract-and-model.md"
---

# 34 Playbook Authoring Contract and Model

## Purpose

This document defines the current product contract for the canonical playbook authoring contract and portable content model. Normative requirements are stated in the sections below; Requirement History is provenance only.
## Scope

This authority owns the canonical playbook authoring contract and portable content model. Related PRDs own adjacent capabilities and are linked where a cross-boundary contract is required.
## Component and Capability Map

The requirements below define the owned components, behaviors, boundaries, and evidence expectations for this capability.
## Requirements

The requirements below are the normative authority. Their stable identifiers preserve traceability to the originating [playbook contract and model design](../designs/2026-06-30-playbook-contract-and-model.md), which is provenance rather than product authority.

### Authoring Location, Authority, and Parity (R-AUTH)

- R-AUTH-1 (MUST): every Make Docs-owned resource governed here — the Playbook contract, default Playbooks, and any associated reference or guide — is authored upstream in `packages/docs/template/` and dogfooded into this repository's `./.make-docs/` and `./docs/`; authoring directly downstream is prohibited, per [06-template-contracts-and-generated-assets.md](06-template-contracts-and-generated-assets.md).
- R-AUTH-2 (MUST): the Playbook contract is authored at `packages/docs/template/.make-docs/contracts/system/playbook-contract.md` and dogfooded to `./.make-docs/contracts/system/playbook-contract.md`; it is the specification, and the parser/validator are its executable enforcement.
- R-AUTH-3 (MUST): the contract and validator stay in parity; neither may carry a requirement the other omits.
- R-AUTH-4 (SHOULD/MAY): a reader-facing guide under `docs/assets/library/<persona-slug>/` may project the contract for humans but must not add, relax, or contradict any requirement.
- R-AUTH-5 (MUST): default Playbooks are authored upstream under `packages/docs/template/docs/assets/playbooks/<persona-slug>/`, dogfooded into `./docs/assets/playbooks/<persona-slug>/`, and validate with zero errors in both locations; the `packages/cli/template/` copy is build-time generated, not a hand-authored parity target.

### Scope and Boundaries (R-SCOPE)

- R-SCOPE-1 (MUST NOT): this authority owns exactly four areas — document schema, workflow contract and step model, dependency registry, and the Playbook model with parser, validator, and diagnostics. [35-run-playbook-state-machine-and-portability.md](35-run-playbook-state-machine-and-portability.md) owns run-state and progression semantics; [36-playbook-packaging-compiler-and-harness-adapters.md](36-playbook-packaging-compiler-and-harness-adapters.md) owns packaging and adapters; [20-agent-harness-conformance-and-support-claims.md](20-agent-harness-conformance-and-support-claims.md), [43-conformance-scenario-model-and-execution-kits.md](43-conformance-scenario-model-and-execution-kits.md), and [44-conformance-lab-sessions-and-evidence.md](44-conformance-lab-sessions-and-evidence.md) own conformance; [39-cli-command-model-and-operation-registry.md](39-cli-command-model-and-operation-registry.md) owns CLI grammar and registry materialization; and [38-global-store-and-project-state.md](38-global-store-and-project-state.md) owns global-store storage. This authority must not redefine those contracts.
- R-SCOPE-2 (MUST): the step `operation` field references stable identifiers from the operation registry as an external contract; implementations must not hardcode CLI command strings in their place.

### Playbook Selection Identity and Stack (R-SELECT)

- R-SELECT-1 (MUST): the canonical filesystem location is `docs/assets/playbooks/<persona-slug>/<playbook-slug>.playbook.md`, and the catalog resolver identity is `persona/slug`. `stack` is required metadata with values `build` or `run`; it is a validation and disambiguation dimension, not another directory level.
- R-SELECT-2 (MUST): selection resolves in this order: an explicit path selects exactly one file and then validates the current Playbook schema; a qualified `persona/slug` selects the matching Playbook and validates its stack; and a bare slug or title is accepted only when it resolves to exactly one candidate across configured personas and stacks.
- R-SELECT-3 (MUST): ambiguous bare references fail closed and request the missing persona and/or stack before authority sources are loaded, steps execute, or outputs are claimed. Missing or invalid `kind`, `persona`, `stack`, `schema`, or `workflowSchema` metadata likewise makes the parsed model non-runnable.
- R-SELECT-4 (MUST): `stack: build` governs creating, changing, validating, or releasing documentation-system assets; `stack: run` governs applying an installed or already-available documentation workflow to a downstream project. Both stacks share one authoring contract and runner, but neither may silently substitute for the other; selection, validation, and handoff messages surface the stack whenever ambiguity exists.
- R-SELECT-5 (MUST): every valid Playbook remains hand-followable documentation and may run through the generic model in [35-run-playbook-state-machine-and-portability.md](35-run-playbook-state-machine-and-portability.md). Packaging, plugin exposure, CLI affordances, MCP tools, and installed skills are additive surfaces and are never conditions of Playbook validity.

### Playbook Document Schema (R-DOC)

- R-DOC-1 (MUST): a Playbook is a persona-scoped docs asset at `docs/assets/playbooks/<persona-slug>/`; the `persona` frontmatter must match the folder.
- R-DOC-2 (MUST): Playbooks use the `<slug>.playbook.md` filename suffix. A plain `<slug>.md` file carrying `kind: playbook` is noncanonical and produces the rename diagnostic; every upstream default and dogfood copy uses the canonical suffix.
- R-DOC-4 (MAY): `packagingHints` and `id` are optional; when `id` is absent the canonical reference derives as `persona/slug`.
- R-DOC-6 (MUST): exactly three regions are authoritative and parsed for machine meaning — the frontmatter, the fenced dependencies block, and the single workflow contract block; all other sections are narrative, checked only for presence and non-emptiness, and narrative prose must never carry machine meaning.
- R-DOC-7 (MAY/MUST): unknown `##` sections after the required spine are allowed and ignored; an unknown section before or between required sections, or a missing or out-of-order required section, is a validation error.

### Workflow Contract and Step Model (R-WF)

- R-WF-1 (MUST): the workflow contract is exactly one fenced block inside `## Workflow` with info string `playbook` (not `yaml`) and YAML-shaped content; zero or more than one block is a validation error.
- R-WF-2 (MUST NOT): standalone `<slug>.workflow.yaml` files are not part of the Playbook contract and must not be required.
- R-WF-3 (MUST): the block declares a workflow header with `id`, `state_model` (for example `make-docs.workflow-state.v1`), and `routing` of `linear` or `graph`, defaulting to `linear`.
- R-WF-4 (MUST): each step is described by `executor` (`cli`, `script`, `agent`, `human`, `mcp`, `child-playbook`), `role` (`activity`, `decision`, `gate`, `check`, `handoff`), `activation` (`sequential` or `event-bound`), and `mode` (`deterministic`, `delegated`, `manual`, defaulting to `delegated` when unspecified).
- R-WF-5 (MUST): each step record carries `id` (unique in the workflow), `title`, the four dimensions, `event` when event-bound, `uses`/`requires` referencing dependency identifiers only, `inputs`/`outputs`, at most one invocation form among `operation` (registry identifier), `command: { run: ... }` (external tools only), or `instructions` (agent/human executors) — a step that invokes nothing, such as a gate, declares no form — `routing` (`on_success`, `on_failure`, `branch`, `stop`), gate semantics when `role` is `gate` (resolver, evidence, unattended allowance), `validation`, and `safety` declarations; a `deterministic` step must declare an `operation` or a `command`.
- R-WF-6 (MUST): step status values are shared with run state and are exactly `pending`, `running`, `blocked`, `waiting-for-user`, `completed`, `failed`, `skipped`, `cancelled`.
- R-WF-7 (MUST): the worked example in [../assets/artifacts/playbook-architecture.md](../assets/artifacts/playbook-architecture.md) Section 2.6 is a provenance example that conforms to this PRD; the implementation parses it without error, but this PRD and the Playbook contract remain authoritative when prose examples drift.
- R-WF-8 (MAY): the workflow header may carry an optional orchestration policy with `requires_capabilities`, `prefers_capabilities`, `child_playbooks` (`none`/`serial`/`parallel`), and `concurrency` (`serial`/`parallel-allowed`/`parallel-required`); this PRD owns only presence and shape, while runtime semantics and the canonical harness-capability identifier set are owned by [35-run-playbook-state-machine-and-portability.md](35-run-playbook-state-machine-and-portability.md).

### Dependency Registry (R-DEP)

- R-DEP-4 (MUST): cross-reference integrity is bidirectional — every `uses`/`requires` resolves to a registry `ID` and every routing target resolves to a step `id`; a `requires` targeting an `optional` dependency is an error; an unreferenced declared dependency is a warning.
- R-DEP-5 (declaration only): dependency `Kind` governs how the packaging compiler later materializes it; that materialization is owned by [36-playbook-packaging-compiler-and-harness-adapters.md](36-playbook-packaging-compiler-and-harness-adapters.md) and is not implemented here.

### Playbook Model, Parser, Validator, and Diagnostics (R-MODEL)

- R-MODEL-1 (MUST): the parser and validator are a pure, modular core library module — source in, Playbook model plus diagnostics out, no presentation or filesystem effects beyond reading the input, and no monolithic single file.
- R-MODEL-2 (MUST): the parser produces one fully resolved Playbook model — identity, typed dependency registry keyed by identifier, workflow header and fully linked steps, narrative-section presence map, and source spans for every parsed element; downstream consumers read the model and never re-parse Markdown.
- R-MODEL-3 (MUST): parsing proceeds in stages (split frontmatter, parse frontmatter, locate/verify headings, parse the fenced dependencies block, locate/parse the single workflow block, resolve cross-references, assemble the model), fail-soft for diagnostics and fail-closed for execution: the model is runnable only with zero errors.
- R-MODEL-4 (MUST): validation is layered — structural, registry, workflow, cross-reference integrity, and consistency.
- R-MODEL-5 (MUST): every diagnostic carries a stable code, severity, precise location with section/field/source span, message, and fix hint; the set includes at least PB-DOC-001 (error, required section missing or out of order), PB-FM-002 (error, frontmatter field missing or invalid enum), PB-DEP-003 (error, unknown dependency identifier), PB-DEP-004 (warning, unreferenced dependency), PB-WF-005 (error, deterministic step with neither operation nor command), PB-WF-006 (error, routing target not a defined step), and PB-FILE-007 (warning, legacy filename should be renamed to `*.playbook.md`).
- R-MODEL-6 (MUST): the `playbook.validate` and `playbook.catalog` operations wrap this library, the runner consumes its model, and a future language server can wrap the same library so command-line and editor diagnostics never diverge; the language server itself is out of scope.
### Verification and Testability (R-TEST)

- R-TEST-1 (MUST): the parser and validator have unit tests with valid and invalid fixtures, including at least one failing fixture per R-MODEL-5 diagnostic code.
- R-TEST-2 (MUST): coverage includes heading-order violations, dependencies-block schema violations, malformed and absent workflow blocks, cross-reference violations in both directions, and legacy-filename detection.
- R-TEST-3 (MUST): the default Playbook validates with zero errors in both `packages/docs/template/` and this repository's dogfood instance, and all shipped default Playbooks validate with zero errors.
- R-TEST-4 (MUST): contract violations are detectable at validate time and fail before any run or packaging is attempted.

The eleven-heading spine, the authoritative-versus-narrative line, the `playbook` info string, every enumeration and the `delegated` default, the single-model rule, and the `operation`-versus-`command` split are non-substitutable. Concrete in-memory data structures, internal module layout, diagnostic message wording, and version-string persistence format remain implementation choices.

Code anchors:

- `packages/docs/template/.make-docs/contracts/system/playbook-contract.md`
- `.make-docs/contracts/system/playbook-contract.md`
- `packages/docs/template/docs/assets/playbooks/agent/make-docs-lifecycle.playbook.md`
- `packages/cli/src/operations/playbook/index.ts`
## Naive-UAT Playbook Boundaries

Deferred-obligation and naive-UAT playbooks conform to the existing parsed playbook model; no parallel schema exists. [R-NUAT-SCENARIO](46-naive-end-user-acceptance-testing.md#r-nuat-scenario-scenario-identity-and-artifact-contract) requires tester-visible fields to be separable from facilitator/developer-only fields so internal terminology, expected answers, architecture knowledge, and hidden remediation steps cannot leak into a naive test packet.

[R-NUAT-FUTURE](46-naive-end-user-acceptance-testing.md#r-nuat-future-documentation-first-and-future-automation) permits future deterministic validation of this separation, but the documentation contract remains authoritative; deterministic enforcement becomes product behavior only after authoritative maintenance of PRDs 34 and 46.
## Authoring Contract Requirements

### Dependencies Block (R-DEP)

- R-DEP-1 (MUST): the `## Dependencies` section carries one fenced block with info string `playbook` and top-level key `dependencies`, the same fence discipline as the workflow contract block, distinguished by its top-level key. Exactly one authoritative `playbook` fence is allowed per governed section; a `playbook` fence whose top-level key does not match its section is an error.
- R-DEP-2 (MUST): per-entry fields are `id` (required; stable and unique within the Playbook), `kind` (required; one of `cli`, `script`, `mcp`, `skill`, `plugin`, `playbook`, `reference`, `package-manager`, `external-service`, with `asset` optionally supported), `requirement` (required; `required`, `optional`, `preferred`, or `conditional`), `probe` (optional; the executable or reference target generated dependency checks verify, defaulting to `id`; the `command -v` binary for `cli` and `package-manager` kinds, the manifest reference identifier for `skill` and `plugin` kinds, reserved for other kinds; must match the executable-token pattern when present), `source` (required; human provenance prose, never parsed for machine meaning), `used_by` (required; a typed YAML list of step ids or workflow phase names), and `fallback` (required; behavior when the dependency is missing).
- R-DEP-3 (MUST): `probe` is the only field dependency-check generation may target, defaulting to `id`; no code path parses `source` prose for machine meaning. Regression fixtures include a dependency whose `source` does not begin with its executable token, satisfying the [D-015](03-open-questions-and-risk-register.md) close bar.

### Frontmatter Keys (R-FM)

- R-FM-1 (MUST): `schema` and `workflowSchema` are the canonical required version keys. `schemaVersion` and `workflowSchemaVersion` are invalid and fail validation with a pointed diagnostic naming the accepted v2 key.

### Heading Spine (R-HEAD)

- R-HEAD-1 (MUST): the required spine is exactly, in order: `# <Title>`, `## Purpose`, `## When To Use`, `## Inputs`, `## Dependencies`, `## Workflow`, `## Step Guidance`, `## Gates`, `## Outputs`, `## Validation`, and `## Packaging Notes`.
- R-HEAD-2 (MUST): authority and precedence guidance lives inside `## Inputs`, and handoff guidance lives inside `## Outputs`. Only the R-HEAD-1 spellings are valid; `## Inputs And Authority`, `## Workflow Contract`, `## Gates And Decisions`, and `## Outputs And Handoff` fail validation with a pointed diagnostic naming the accepted heading for that slot.
- R-HEAD-3 (MUST): the narrative spine remains operationally complete: `## Purpose` and `## When To Use` define applicability; `## Inputs` names required inputs and their authority/precedence order; `## Step Guidance` explains the procedure; `## Gates` states stop conditions, user-decision points, required evidence, and any unattended allowance; `## Outputs` names expected artifacts, owned output surfaces, and handoff guidance; `## Validation` defines completion evidence; and `## Packaging Notes` records optional distribution considerations without making packaging a validity requirement. Assists such as CLI, MCP, plugin, subagent, or skill help are optional unless the parsed workflow or dependency contract marks them required.

### V2 Exclusivity and Compatibility Rejection (R-MIG)

- R-MIG-1 (MUST): the parser supports only the v2 dependencies block, required headings, frontmatter keys, and schema identifiers. No compatibility alias or accept-with-warning path exists for the rejected v1 shapes.
- R-MIG-2 (MUST): rejected shapes fail with pointed error diagnostics naming the accepted v2 form — a `## Dependencies` Markdown table names the fenced `playbook` dependencies block, `schemaVersion`/`workflowSchemaVersion` name `schema`/`workflowSchema`, and each noncurrent heading names its accepted slot. Rejected forms never parse to a model.
- R-MIG-3 (MUST): the parser accepts only the v2 document schema identifier (for example `make-docs.playbook.v2`); a v1 identifier fails with a pointed diagnostic naming the accepted identifier.
- R-MIG-4 (MUST): every in-tree Playbook, parser/validator/compiler fixture, shipped default, and upstream template source uses the v2 contract.

### Cross-Surface Parity and Authoring Order (R-RIPPLE)

- R-RIPPLE-1 (MUST): the dependencies-block parser, validator layers, diagnostics catalog, packaging compiler dependency materialization, Playbook contract and worked example, and shipped default Playbook remain in contract parity. No dependency-table parser or alternate source-prose interpretation exists.
- R-RIPPLE-2 (MUST): the playbook contract and the default Playbook are dogfooded template assets authored upstream in `packages/docs/template/.make-docs/contracts/system/playbook-contract.md` and `packages/docs/template/docs/assets/playbooks/agent/`, then re-seeded into this repo's `.make-docs/` and `docs/` instances; dogfood-only authoring guides update in place downstream.

### Defect Fix (R-FIX)

- R-FIX-1 (MUST): dependency-check generation uses `probe` per R-DEP-3, and no `source`-scraping path exists. Fixtures whose `source` prose does not begin with the binary name pin the behavior, including `git` with source `system install of git`.

### Verification (R-TEST)

- R-TEST-1 (MUST): the v2 dependencies block, frontmatter keys, and headings parse and validate; each rejected v1 form (dependency table, noncurrent frontmatter keys, noncurrent heading spellings, v1 schema identifier) fails with its pointed diagnostic naming the accepted v2 form and never parses to a model.
- R-TEST-2 (MUST): generated `cli` and `package-manager` checks probe `probe` (or `id` when absent), verified with a fixture whose `source` does not start with the binary name; the UAT repro passes.

Code anchors:

- `packages/cli/src/playbook/parser/parse-playbook.ts`
- `packages/cli/src/playbook/parser/dependencies-block.ts`
- `packages/cli/src/operations/playbook-packaging/materialization.ts`
- `packages/docs/template/.make-docs/contracts/system/playbook-contract.md`
- `packages/docs/template/docs/assets/playbooks/agent/make-docs-lifecycle.playbook.md`
- `packages/cli/tests/playbook-parser.test.ts`

## Contracts and Data

The named paths, schemas, state records, metadata fields, and evidence shapes in Requirements are normative contracts for this capability.
## Integrations

This capability integrates with the adjacent current authorities linked from Requirements and Source Anchors; those authorities remain owners of their own boundaries.
## Rebuild Notes

A rebuild must preserve the requirement identifiers, stable semantic anchors, ownership boundaries, and failure-safe behavior stated here. Implementation evidence does not silently weaken this authority.
## Requirement History

### 2026-08-08 — Not assigned

- Affected requirement or section: `Consolidated capability ownership`
- Previous contract: Current requirements were also represented by standalone editorial PRDs 29, 40.
- Replacement contract: The applicable current requirements are inline in this authority and its linked product owners; the standalone editorial records are retired from the active set.
- Rationale: Active PRDs own product subjects and do not preserve editorial operations as product authority.
- Source: [PRD Authority Maintenance](../../.make-docs/references/system/prd-change-management.md)


### 2026-08-08 — W18 R6

- Affected requirement or section: `Document identity and current authority`
- Previous contract: The capability was represented as a standalone editorial change record whose title and structure described how the PRD set was modified.
- Replacement contract: This document now states the current canonical playbook authoring contract and portable content-model requirements inline as product authority.
- Rationale: Active PRDs describe the current product shape; editorial operations belong in plans, work, and history.
- Source: [Playbook contract and model design](../designs/2026-06-30-playbook-contract-and-model.md)
## Source Anchors

- [../designs/2026-06-30-playbook-contract-and-model.md](../designs/2026-06-30-playbook-contract-and-model.md)
- [../assets/artifacts/playbook-architecture.md](../assets/artifacts/playbook-architecture.md)
- [../plans/2026-07-01-w18-r6-playbook-contract-and-model/00-overview.md](../plans/2026-07-01-w18-r6-playbook-contract-and-model/00-overview.md)
- [../work/2026-07-01-w18-r6-playbook-contract-and-model/00-index.md](../work/2026-07-01-w18-r6-playbook-contract-and-model/00-index.md)
- [22 Project Documentation Asset Model](22-project-documentation-asset-model.md)
- [47 Persona Model](47-persona-model.md)
- [30 Harness Plugin Substrate Workflow Bundles](30-plugin-substrate-and-workflow-bundles.md)
- [36 Playbook Packaging Compiler and Harness Adapters](36-playbook-packaging-compiler-and-harness-adapters.md)
- [06 Template Contracts and Generated Assets](06-template-contracts-and-generated-assets.md)
- [25 CLI Separation and MCP Boundary](25-typescript-runtime-cli-mcp-operation-boundaries.md)
- `packages/docs/template/.make-docs/contracts/system/playbook-contract.md`
- `packages/docs/template/docs/assets/playbooks/agent/make-docs-lifecycle.playbook.md`
- `docs/assets/playbooks/agent/make-docs-lifecycle.playbook.md`
- `packages/cli/src/operations/playbook/index.ts`
- `scripts/smoke-pack.mjs`

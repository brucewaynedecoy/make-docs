---
title: "W19 R0 Playbooks To Protocol Narrow Guardrail Refactor"
kind: "plan"
status: "draft"
coordinate: "W19 R0"
follow_on:
  route: "prd-generation"
  next_prompt: ".make-docs/references/system/prompts/prd-change-to-work.prompt.md"
  why: "The Playbook capability boundary is product authority spread across PRDs 34, 35, 36, 30, 39, and their dependents; the narrowed Protocol boundary must become current PRD authority before any code, template, or dogfood surface is retired."
  coordinate_handoff: "Carry W19 R0 into the maintained PRD authorities and into one downstream W19 R0 delta backlog; preserve W18 R6 through W18 R13 as requirement history rather than reopening those waves."
---

# W19 R0 Playbooks To Protocol Narrow Guardrail Refactor

## Purpose

Record the plan for refactoring the Make Docs Playbook capability from a comprehensive workflow automation, run-state, packaging/compiler, orchestration, and Skill-generating subsystem into **Protocol** — a deliberately narrow agent guardrail and guidance mechanism equivalent in intent to the earlier simple Make Docs Playbook concept. The refactor is a product-boundary reversal, not a rename: the name change from Playbook(s) to Protocol(s) is the smallest part of the work, and a global find-and-replace rename would preserve exactly the automation surface this plan exists to retire.

## Objective

Make Make Docs own one narrow thing in this space: a persona-scoped, human-and-agent-readable guidance document that constrains how an agent works a Make Docs lifecycle stage, with validation limited to document shape. Everything that makes the current implementation a workflow engine — deterministic run state, progression, gates, resume, portability, the packaging compiler, harness adapters, capability descriptors, distributables, the marketplace registration seam, and the fourteen-operation CLI and MCP surface — is retired from Make Docs rather than renamed. Completion means current PRD authority describes Protocol as a guardrail mechanism, the retired surfaces are gone from code, templates, manifest, conformance, and dogfood instances, and no Make Docs surface still claims workflow-execution behavior.

## Governing Invariant

> `docs/prd/` describes the current authoritative shape of the product. It must never describe the editorial operation used to change that authority.

Retirement sequencing, deletion actions, rename mechanics, and migration language stay in this plan, in the downstream W19 R0 delta backlog, and in history records. The PRD set states the narrowed Protocol scope, the non-goals, and the current boundary as present-tense product authority, and preserves the retired contracts only as non-normative `## Requirement History` entries.

## Determination: The Current Implementation Is Comprehensive

This plan takes the `comprehensive` branch. The determination rests on traced code and document evidence, not on reading the contract's stated intent.

| Evidence | Location | What it proves |
| --- | --- | --- |
| Parser, model, validator, diagnostics: 21 source files, 3,519 TypeScript lines | `packages/cli/src/playbook/` | A full document frontend with source spans, YAML node parsing, structural, cross-reference, consistency, workflow, and orchestration-policy validators, and a `PB-*` diagnostic registry |
| Runtime and packaging: 34 source files, 11,549 TypeScript lines | `packages/cli/src/operations/playbook/`, `packages/cli/src/operations/playbook-packaging/` | A run-state machine with progression, execution modes, gates, resume, export/import, portability, plus a packaging compiler, planner, surface resolution, capability descriptors, distributables, materialization, output writers, and a registration seam |
| 18 dedicated test files, 11,973 lines | `packages/cli/tests/playbook-*.test.ts`, `packages/cli/tests/registry-playbook-ops.test.ts` | The subsystem carries its own conformance-grade test layer, including packaging lifecycle, adapters, capability, verification, three-tier, guardrails, and portability suites |
| 14 registered operations with stable IDs `playbook.catalog`, `playbook.resolve`, `playbook.validate`, `playbook.capabilities`, `playbook.invoke`, `playbook.start`, `playbook.next`, `playbook.advance`, `playbook.gate`, `playbook.resume`, `playbook.close`, `playbook.status`, `playbook.run.export`, `playbook.run.import` | `packages/cli/src/operations/playbook/ops/` | A first-class orchestration API, not a document linter |
| Operations are projected to both CLI and MCP (`playbook.catalog` -> `make-docs run playbook catalog` and `make_docs_playbook_catalog`) | `packages/cli/src/operations/registry.ts`, `packages/cli/src/mcp/tools.ts`, `packages/cli/src/cli.ts` | The subsystem owns public command and tool surface in two runtimes |
| Persistent run state in a SQLite table `playbook_runs`, classified `relocated-canonical` in project state | `packages/cli/src/store/database.ts`, `packages/cli/src/store/state-rows.ts`, `packages/cli/src/store/project-state.ts` | Durable cross-session state management, the defining property of a workflow engine rather than a guardrail |
| Harness adapters emitting `generated-plugin`, `generated-skills-bundle`, `generated-adapter`, `symlink-exposure`, and `copy-mirror` ownership classes | `packages/cli/src/operations/playbook-packaging/adapters.ts` | Skill-generating and plugin-generating packaging, explicitly including skills bundles |
| Four packaging operations `package.plan`, `package.surface-resolve`, `package.write`, `package.ship` | `packages/cli/src/operations/package/ops/` | A ship pipeline built on the Playbook model |
| Roughly 10,700 `playbook` occurrences across about 573 files repo-wide | `packages/`, `.make-docs/`, `docs/`, `conformance/`, `scripts/` | The concept is load-bearing across every surface class, which is why a rename is the wrong instrument |
| The contract itself declares a workflow contract, step model, dependency registry, orchestration policy, and a v1-to-v2 schema break | `.make-docs/contracts/system/playbook-contract.md` | The authored artifact is a workflow program with a readable Markdown host, by design |

The comparison repository at `/Users/tylerkneisly/Developer/Source/Lemme/playbooks` (read-only, inspected but not modified) is a Rust workspace whose crates are `playbooks-parser`, `playbooks-validator`, `playbooks-model`, `playbooks-compiler`, `playbooks-runner`, `playbooks-store`, `playbooks-operations`, `playbooks-operation-api`, `playbooks-catalog`, `playbooks-mcp`, `playbooks-cli`, `playbooks-sdk`, `playbooks-adapter-sdk`, `playbooks-schema`, `playbooks-source`, `playbooks-export`, and `playbooks-import-mermaid`. That decomposition is a layer-for-layer match with the Make Docs subsystem inventoried above: parser, validator, model, compiler, runner, store, operations, catalog, MCP, CLI, adapters. The two systems are comparable in kind, and Make Docs is carrying a second implementation of a product that already exists as a dedicated tool.

Because the subsystem is comprehensive, this plan does not perform a global rename or refactor in place. It produces the change plan for retiring the automation and rebuilding a narrow Protocol mechanism in its place.

## What Protocol Is

Protocol restores the intent that the archived design [Make Docs Lifecycle Playbook and Terminology Overlay](../../assets/archive/designs/2026-05-28-make-docs-lifecycle-playbook.md) and the current default asset both describe in prose: a persona-scoped procedural document that is "not automation, does not enforce stage order, and does not gate work." A Protocol is a Markdown guardrail: it names the authority and precedence order an agent honors, the constraints it must not violate, the checks it must surface, and the departures it must report. It is read, not executed. Make Docs validates that a Protocol has the required shape and that its persona folder matches; it does not model steps, resolve dependencies, hold run state, gate progression, or compile the document into anything.

## Non-Goals

- Reimplementing any part of the retired runner, compiler, adapter, or distributable pipeline under the Protocol name.
- Providing workflow execution, orchestration, child-run nesting, concurrency policy, resume, or portability.
- Generating Skills, plugins, extensions, marketplace entries, or any harness-native distributable from a Protocol.
- Persisting Protocol run records, cursors, gate decisions, or execution evidence in the Global Store.
- Owning a dependency registry, probes, or dependency materialization.
- Competing with, wrapping, vendoring, or shimming the separate Playbooks CLI. Make Docs consumes no part of it and declares no interoperability contract with it in this wave.
- Renaming unrelated colloquial uses of the word "playbook", specifically `packages/skills/decompose-codebase/references/mcp-playbook.md` and its two referring files, which describe an MCP usage walkthrough and are outside this boundary.
- Rewriting archived designs, archived plans, archived work, or history records under `docs/assets/archive/`, which are immutable provenance.

## Coordinate Decision

- Coordinate: `W19 R0`
- Classification: `new-wave`
- Evidence: The highest existing coordinate across `docs/plans/` and `docs/work/` is W18, whose revisions R4 through R15 built the Playbook subsystem forward. This plan does not revise, rework, correct, standardize, or finish W18's intent; it reverses the product decision that W18 executed, on new owner direction motivated by duplication with a dedicated external Playbooks tool. Under `.make-docs/references/system/wave-model.md` resolution rule 4, a new end-to-end initiative increments the highest existing wave and resets the revision, giving W19 R0. The alternative reading, treating this as W18 R16 lineage, was considered and rejected because the lineage rule targets redos of a wave's own intent, and a scope reversal establishing a new product boundary is a new initiative. If the owner prefers lineage continuity, re-coordinate to W18 R16 before execution and carry the same phase structure unchanged.

## Maintenance Inputs

| Input | Format | Location | Confidence |
| --- | --- | --- | --- |
| North Star guiding principles 2, 3, 4, and 5 | Living artifact | `docs/assets/artifacts/NORTHSTAR.md` | High — directly authorizes narrowing deterministic logic to facts-of-record and identity primitives, and mandates tracing invocations before removal |
| Current Playbook contract | System contract | `.make-docs/contracts/system/playbook-contract.md` | High — the normative surface being narrowed |
| Playbook architecture artifact | Draft artifact | `docs/assets/artifacts/playbook-architecture.md` | High — the comprehensive design being retired; the compiler framing it states is the scope this plan removes |
| Earlier simple Playbook concept | Archived design | `docs/assets/archive/designs/2026-05-28-make-docs-lifecycle-playbook.md` | High — the guardrail intent Protocol restores |
| Dogfooded default asset | Materialized system asset | `packages/docs/template/docs/assets/playbooks/agent/make-docs-lifecycle.playbook.md` | High — 554 lines; its prose already describes guardrail intent while its frontmatter and workflow block encode the automation contract |
| Comparison Playbooks CLI | External Rust workspace, read-only | `/Users/tylerkneisly/Developer/Source/Lemme/playbooks` | High — establishes the duplication that motivates the reversal |
| Template and dogfood authority contract | Design | `docs/designs/2026-06-19-template-package-and-dogfood-source-of-truth-contract.md` | High — fixes upstream-first ordering for every reusable resource this plan touches |
| Compatibility classification authority | PRD | `docs/prd/18-compatibility-classification-and-migration-safety.md` | Medium — must classify the retirement; the exact disposition is a phase-5 decision |
| Deferred obligation governance | PRD | `docs/prd/45-deferred-obligation-governance.md` | Medium — any capability intentionally deferred rather than removed must be registered as an obligation, not left implicit |

Open questions and ambiguities identified here are promoted into `docs/prd/03-open-questions-and-risk-register.md` during execution.

## Active Authority Baseline

- Active `docs/prd/` status: active and authoritative; 28 of 34 product PRDs reference Playbook, totalling roughly 1,055 occurrences.
- Current index: `docs/prd/00-index.md`
- Discovery pass required: no. The owning PRDs are already identified by direct inspection; see [Phase 1](01-authority-baseline-and-prd-maintenance.md) for the full decision matrix.
- Discovery scope if required: not applicable.
- Known noncompliance or legacy editorial PRDs: none identified. PRDs 34, 35, and 36 are product-subject PRDs whose subjects narrow or dissolve under this plan; their retirement disposition is a phase-1 decision, and no PRD is renumbered.

## Upstream-First Authority

Every reusable Make Docs resource touched by this plan is authored **upstream** in `packages/docs/template/` and only then projected **downstream** into this repository's installed instance at `./.make-docs/` and `./docs/`. That ordering is not advisory here: the retirement removes and replaces materialized system assets that the manifest tracks by logical asset ID, and reversing the order would make the dogfood instance the accidental source of truth. `packages/cli/` maintains no template of its own and pulls `packages/docs/template/` at build time only; `packages/cli/template/` is build output and is never hand-edited. Project artifacts this repository authors as a Make Docs consumer — this plan, the downstream PRD updates, the delta backlog, and history records — are edited in place here.

## Candidate Decision Matrix

Every candidate requirement carries exactly one decision. Full per-section detail is in [Phase 1](01-authority-baseline-and-prd-maintenance.md).

| Candidate | Decision | Owning PRD or new product subject | Reason | Evidence |
| --- | --- | --- | --- | --- |
| Protocol document schema, persona scoping, shape validation | `update-existing` | `docs/prd/34-playbook-authoring-contract-and-model.md` | PRD 34 already owns the authoring contract subject; the subject survives in narrowed form | `packages/cli/src/playbook/` |
| Workflow contract, step model, dependency registry, orchestration policy | `update-existing` | `docs/prd/34-playbook-authoring-contract-and-model.md` | Removals are expressed as current scope and non-goal statements in the owning PRD before history is recorded | `.make-docs/contracts/system/playbook-contract.md` |
| Run state machine, progression, gates, resume, execution modes, portability | `update-existing` | `docs/prd/35-run-playbook-state-machine-and-portability.md` | The PRD's entire subject is retired; its body becomes a retired-capability boundary statement rather than being deleted or renumbered | `packages/cli/src/operations/playbook/run-state.ts` |
| Packaging compiler, harness adapters, capability descriptors, distributables, registration seam | `update-existing` | `docs/prd/36-playbook-packaging-compiler-and-harness-adapters.md` | Same disposition as PRD 35; the subject is retired in place | `packages/cli/src/operations/playbook-packaging/` |
| Plugin substrate and workflow bundles that consume the Playbook model | `update-existing` | `docs/prd/30-plugin-substrate-and-workflow-bundles.md` | The substrate keeps its non-Playbook responsibilities; only the Playbook-sourced bundle path is retired | `packages/cli/src/plugin-substrate/` |
| Operation registry entries, CLI grammar, MCP tool derivation | `update-existing` | `docs/prd/39-cli-command-model-and-operation-registry.md`, `docs/prd/25-typescript-runtime-cli-mcp-operation-boundaries.md` | Both PRDs own the surface shape; the fourteen retired operation IDs and their two projections are removed from current authority | `packages/cli/src/operations/registry.ts` |
| `playbook_runs` storage and project-state classification | `update-existing` | `docs/prd/38-global-store-and-project-state.md` | The store PRD owns table inventory and relocation classification | `packages/cli/src/store/database.ts` |
| Documentation asset model, asset namespace, catalog defaults | `update-existing` | `docs/prd/22-project-documentation-asset-model.md`, `docs/prd/06-template-contracts-and-generated-assets.md`, `docs/prd/05-installation-profile-and-manifest-lifecycle.md` | These own the `docs/assets/playbooks/` namespace, materialized asset IDs, and manifest lifecycle | `.make-docs/manifest.json` |
| Conformance scenarios, tuple registry, support claims referencing packaging | `update-existing` | `docs/prd/43-conformance-scenario-model-and-execution-kits.md`, `docs/prd/20-agent-harness-conformance-and-support-claims.md` | Retired capabilities cannot retain support claims or evidence tuples | `conformance/tuple-registry.json` |
| Lifecycle and coverage-pass references to playbook coverage | `update-existing` | `docs/prd/14-lifecycle-workflow-and-coverage-passes.md`, `docs/prd/47-persona-model.md` | Coverage passes and persona scoping continue under the Protocol name | `.make-docs/contracts/system/coverage-pass-contract.md` |
| Naive-UAT Playbook boundaries | `update-existing` | `docs/prd/46-naive-end-user-acceptance-testing.md` | Boundary statements name the retired capability and must be restated against Protocol; no Naive UAT implementation file is edited by this plan | `docs/prd/46-naive-end-user-acceptance-testing.md` |
| Compatibility disposition for the retirement | `update-existing` | `docs/prd/18-compatibility-classification-and-migration-safety.md` | The classification vocabulary is owned there; the retirement needs a named disposition | `packages/cli/src/compatibility.ts` |
| Risk, decision, and open-question records for the reversal | `update-existing` | `docs/prd/03-open-questions-and-risk-register.md` | The living register owns every risk and decision this plan raises | `docs/prd/03-open-questions-and-risk-register.md` |
| Glossary terms Playbook, Run Playbook, Protocol | `update-existing` | `docs/prd/04-glossary.md` | Term authority lives in the glossary | `docs/prd/04-glossary.md` |
| A dedicated "Protocol guardrail mechanism" PRD | `none` | Not created | PRD 34 already owns the authoring-contract subject and survives in narrowed form; creating a parallel PRD would split one product subject across two authorities | `docs/prd/34-playbook-authoring-contract-and-model.md` |
| Interoperability contract with the external Playbooks CLI | `none` | Not created | Declared a non-goal for this wave; if the owner later wants it, it is a separate initiative with its own design | This plan, `## Non-Goals` |
| Colloquial "playbook" wording in the decompose-codebase skill | `none` | Not changed | Unrelated sense of the word; renaming it would create false coupling | `packages/skills/decompose-codebase/references/mcp-playbook.md` |

## Existing PRDs To Update

| Existing PRD | Owning sections | Current normative update | Preserved surrounding authority |
| --- | --- | --- | --- |
| `docs/prd/34-playbook-authoring-contract-and-model.md` | `## Scope`, `## Component and Capability Map`, `## Requirements` R-SELECT/R-DOC/R-WF/R-DEP/R-MODEL, `## Naive-UAT Playbook Boundaries`, `## Authoring Contract Requirements` | Narrow to Protocol document shape and persona scoping; R-WF, R-DEP, and orchestration-policy requirements become non-goals | R-AUTH parity rules, R-TEST verification discipline, R-RIPPLE cross-surface ordering |
| `docs/prd/35-run-playbook-state-machine-and-portability.md` | Whole document | Restate as a retired capability boundary: no run state, no progression, no resume, no portability | Document number, title identity, and `## Requirement History` |
| `docs/prd/36-playbook-packaging-compiler-and-harness-adapters.md` | Whole document | Restate as a retired capability boundary: no compiler, no adapters, no distributables, no registration seam | Document number, title identity, and `## Requirement History` |
| `docs/prd/30-plugin-substrate-and-workflow-bundles.md` | Workflow-bundle requirements | Remove the Playbook-sourced bundle path from current scope | Substrate responsibilities independent of Playbook |
| `docs/prd/39-cli-command-model-and-operation-registry.md` | Operation inventory, command tree | Remove the fourteen retired operation IDs and the `run playbook` subtree | Registry model, bare-command grammar, derivation rules |
| `docs/prd/25-typescript-runtime-cli-mcp-operation-boundaries.md` | MCP derivation inventory | Remove `make_docs_playbook_*` tools from current surface | Derivation parity rule itself |
| `docs/prd/38-global-store-and-project-state.md` | Table inventory, relocation classification | Remove `playbook_runs` from current schema authority | Store bootstrap, identity, privacy requirements |
| `docs/prd/22-project-documentation-asset-model.md` | Asset namespace | Rename the `docs/assets/playbooks/` namespace to `docs/assets/protocols/` as current authority | Namespace model and persona-scoping rules |
| `docs/prd/06-template-contracts-and-generated-assets.md` | Generated asset inventory | Replace playbook asset IDs with protocol asset IDs | Template contract model |
| `docs/prd/05-installation-profile-and-manifest-lifecycle.md` | Profile asset lists | Update default asset paths | Profile and manifest lifecycle rules |
| `docs/prd/24-project-configuration-and-convention-overlay.md` | Convention overlay keys | Update any playbook-named configuration surface | Overlay model |
| `docs/prd/23-generated-document-metadata-and-lifecycle-handoffs.md` | Document kinds | Change the `playbook` kind to `protocol` | Metadata model |
| `docs/prd/43-conformance-scenario-model-and-execution-kits.md` | Scenario inventory | Remove packaging scenarios bound to retired capabilities | Scenario model, kit generation |
| `docs/prd/20-agent-harness-conformance-and-support-claims.md` | Support claims | Withdraw claims that depend on retired packaging | Claim governance and evidence bar |
| `docs/prd/14-lifecycle-workflow-and-coverage-passes.md` | Coverage band | Rename playbook coverage to protocol coverage | Coverage-pass model |
| `docs/prd/47-persona-model.md` | Persona-scoped assets | Update asset references | Persona model itself; no Persona implementation file is edited |
| `docs/prd/46-naive-end-user-acceptance-testing.md` | Playbook boundary statements | Restate against Protocol | Naive UAT requirements; no Naive UAT implementation file is edited |
| `docs/prd/18-compatibility-classification-and-migration-safety.md` | Classification vocabulary | Record the retirement disposition | Existing classification requirements |
| `docs/prd/10-packaging-validation-and-release-reference.md` | Release reference | Remove retired packaging steps | Release validation |
| `docs/prd/09-dogfood-and-maintainer-operations.md` | Dogfood inventory | Update dogfooded asset list | Maintainer operations |
| `docs/prd/28-shared-agentics-installation-and-harness-exposure.md` | Exposure inventory | Remove Playbook-generated exposure | Exposure model |
| `docs/prd/08-skills-catalog-and-distribution.md`, `docs/prd/21-project-tool-directory-and-resource-tiers.md`, `docs/prd/17-system-asset-materialization-and-local-bootstrap.md`, `docs/prd/02-architecture-overview.md`, `docs/prd/01-product-overview.md` | Incidental references | Terminology and inventory alignment | All surrounding authority |
| `docs/prd/00-index.md`, `docs/prd/03-open-questions-and-risk-register.md`, `docs/prd/04-glossary.md` | Shared surfaces | Index links and kinds, risk and decision records, glossary terms | Shared-surface conventions |

## Genuinely New Product PRDs

`none`. Every changed requirement has a suitable existing owner, and PRD 34 remains the coherent authority for the narrowed authoring contract. Creating a new PRD for Protocol would fragment one product subject and would read as an editorial record of the rename rather than a product boundary.

## Requirement History Entries

| Owning PRD | Date / coordinate | Affected requirement or section | Previous contract | Replacement contract | Rationale | Source |
| --- | --- | --- | --- | --- | --- | --- |
| `docs/prd/34-playbook-authoring-contract-and-model.md` | 2026-08-11 — W19 R0 | R-WF, R-DEP, orchestration policy | Executable workflow contract, step model, dependency registry with probes, orchestration policy fields | Protocol document shape and persona scoping only | Workflow authoring duplicates a dedicated external tool; Make Docs keeps guidance, not execution | This plan |
| `docs/prd/35-run-playbook-state-machine-and-portability.md` | 2026-08-11 — W19 R0 | Whole subject | Deterministic run state machine with progression, gates, resume, execution modes, export/import portability | Retired; Protocol has no run state | North Star principles 1 and 2: no fact-of-record justified the persisted run records | `docs/assets/artifacts/NORTHSTAR.md` |
| `docs/prd/36-playbook-packaging-compiler-and-harness-adapters.md` | 2026-08-11 — W19 R0 | Whole subject | Packaging compiler, harness adapter registry, capability descriptors, distributables, materialization, registration seam | Retired; Protocol compiles to nothing | Skill and plugin generation from a guidance document is out of the narrowed boundary | This plan |
| `docs/prd/39-cli-command-model-and-operation-registry.md` | 2026-08-11 — W19 R0 | Operation inventory | Fourteen `playbook.*` operations plus four `package.*` operations | `protocol.catalog`, `protocol.resolve`, `protocol.validate` only, pending phase-4 confirmation | Principle 2: only identity primitives and facts-of-record earn a slot | `docs/assets/artifacts/NORTHSTAR.md` |
| `docs/prd/38-global-store-and-project-state.md` | 2026-08-11 — W19 R0 | Table inventory | `playbook_runs` table, `relocated-canonical` classification | Removed | No recorded decision survives that is not re-derivable from the repository | `docs/assets/artifacts/NORTHSTAR.md` |
| `docs/prd/22-project-documentation-asset-model.md` | 2026-08-11 — W19 R0 | Asset namespace | `docs/assets/playbooks/<persona-slug>/` | `docs/assets/protocols/<persona-slug>/` | Name follows the narrowed meaning | This plan |

## Affected Links, Risks, Plans, And Work

| Surface | Artifact | Required maintenance | Authority role |
| --- | --- | --- | --- |
| Links and index | `docs/prd/00-index.md` | Update kinds, titles, and links for PRDs 34, 35, 36 | Navigation only |
| Risks and decisions | `docs/prd/03-open-questions-and-risk-register.md` | Record the reversal decision, the load-bearing-removal risk, the external-tool-dependency risk, and the migration risk for existing authored Playbooks | Living risk and decision register |
| Plans | This plan directory | Entry point plus five phase files | Sequencing and rationale |
| Work | `docs/work/2026-08-11-w19-r0-playbooks-to-protocol-narrow-guardrail-refactor/` | Delta backlog generated after PRD maintenance, citing updated PRD authority | Implementation queue |
| History | `docs/assets/archive/history/2026-08-11-w19-r0-p{P}-<slug>.md` | One breadcrumb per executed phase | Execution provenance |
| Archive | `docs/assets/archive/` | Untouched; archived designs, plans, work, and history keep their Playbook terminology as provenance | Immutable provenance |

## Output Contract

- Plan directory: `docs/plans/2026-08-11-w19-r0-playbooks-to-protocol-narrow-guardrail-refactor/`
  - entry point: `docs/plans/2026-08-11-w19-r0-playbooks-to-protocol-narrow-guardrail-refactor/00-overview.md`
  - phase files: `01-authority-baseline-and-prd-maintenance.md`, `02-automation-state-and-packaging-retirement.md`, `03-protocol-contract-and-template-authority.md`, `04-cli-mcp-conformance-and-naming-surfaces.md`, `05-migration-compatibility-and-validation.md`
- Existing authoritative PRDs to update: the 28 PRDs listed above.
- Genuinely new authoritative PRDs: none.
- Requirement-history entries: the six listed above, plus any additional entry a phase-1 worker identifies while making surgical edits.
- Shared PRD surfaces: `docs/prd/00-index.md`, `docs/prd/03-open-questions-and-risk-register.md`, `docs/prd/04-glossary.md`.
- Delta backlog: `docs/work/2026-08-11-w19-r0-playbooks-to-protocol-narrow-guardrail-refactor/`.

## Phases

| Phase | File | Scope |
| --- | --- | --- |
| 1 | [01-authority-baseline-and-prd-maintenance.md](01-authority-baseline-and-prd-maintenance.md) | PRD authority maintenance, requirement history, shared surfaces, risk register |
| 2 | [02-automation-state-and-packaging-retirement.md](02-automation-state-and-packaging-retirement.md) | Traced removal of run state, progression, portability, packaging compiler, adapters, distributables, store table, and their tests |
| 3 | [03-protocol-contract-and-template-authority.md](03-protocol-contract-and-template-authority.md) | Upstream-first Protocol contract, template assets, manifest, default asset, dogfood projection |
| 4 | [04-cli-mcp-conformance-and-naming-surfaces.md](04-cli-mcp-conformance-and-naming-surfaces.md) | Operation registry, CLI grammar, MCP derivation, conformance scenarios and tuple registry, naming and collision boundaries |
| 5 | [05-migration-compatibility-and-validation.md](05-migration-compatibility-and-validation.md) | Migration of existing authored Playbooks, compatibility disposition, acceptance criteria, validation matrix |

Phase 1 precedes every other phase. Phases 2, 3, and 4 depend on phase 1 and are otherwise parallelizable across disjoint write scopes. Phase 5 depends on all of them.

## Worker Ownership

| Worker | Scope | Write Scope | Dependencies | Deliverables |
| --- | --- | --- | --- | --- |
| PRD authority worker | Phase 1 surgical updates to the 25 subject PRDs | `docs/prd/05,06,09,10,14,17,18,20,21,22,23,24,25,28,30,34,35,36,38,39,43,46,47,01,02` | none | Updated current authority plus requirement-history entries |
| Shared surface worker | Phase 1 index, glossary, and register | `docs/prd/00-index.md`, `docs/prd/03-open-questions-and-risk-register.md`, `docs/prd/04-glossary.md` | PRD authority worker | Consistent index kinds, terms, risks, decisions |
| Runtime retirement worker | Phase 2 code and test removal | `packages/cli/src/operations/playbook*`, `packages/cli/src/playbook/`, `packages/cli/src/store/`, `packages/cli/tests/playbook-*` | Phase 1 | Traced-removal evidence and a green test suite |
| Template authority worker | Phase 3 upstream template and manifest | `packages/docs/template/`, then `.make-docs/`, `docs/assets/protocols/` | Phase 1 | Protocol contract, assets, manifest, dogfood projection |
| Surface worker | Phase 4 registry, CLI, MCP, conformance | `packages/cli/src/operations/registry.ts`, `packages/cli/src/cli.ts`, `packages/cli/src/mcp/`, `conformance/` | Phase 1 | Narrowed command and tool surface, reconciled scenarios |
| Migration and validation worker | Phase 5 | `docs/work/2026-08-11-w19-r0-.../`, validation reports, history records | Phases 2, 3, 4 | Migration guidance, delta backlog, validation evidence |

No worker owns Persona or Naive UAT implementation files. Where a Persona or Naive UAT PRD names Protocol, the PRD authority worker restates the boundary in the PRD only. The coordinator owns no document-writing task.

## MCP Strategy

- Preferred servers available: `jdocmunch` and `jcodemunch` are both available and were used for this plan. The code index resolved as `local/make-docs-ca94d684` with 5,595 symbols across 245 files; the doc index was reindexed as `local/make-docs-protocols-20260811` with 7,534 sections across 500 files because prior indexes were stale.
- Fallback plan if unavailable: reindex first per `AGENTS.md`; only if reindexing fails, fall back to direct reads, `ls`, and `grep`, and record the fallback reason in the phase history record. This plan used targeted shell inspection alongside both MCPs for exact line counts, file-set enumeration, and identifier extraction, which the MCP surfaces do not report directly.

## Validation

Execution validates that:

- every candidate in the decision matrix has exactly one decision and a stated reason
- current normative requirements live inline in their owning PRDs and no PRD was renumbered
- no new PRD was created whose subject is the rename itself
- every retired contract is preserved only as a non-normative `## Requirement History` entry
- `docs/prd/00-index.md` uses product-oriented kinds and current-authority links
- retirements are stated as current scope, non-goal, limitation, or boundary before history is recorded
- every removal in phase 2 cites traced invocations per North Star principle 5, and nothing was deleted on inference
- upstream `packages/docs/template/` changed before the downstream `./.make-docs/` and `./docs/` projection in every case
- `npm test` and the repository's validation commands pass with the retired suites removed rather than skipped
- no Make Docs surface, in code, contract, template, guide, or conformance scenario, still claims workflow execution, run state, or distributable generation
- the delta backlog cites updated authoritative PRDs, not this plan

Detailed acceptance criteria and the per-surface validation matrix are in [Phase 5](05-migration-compatibility-and-validation.md).

## Approval State

The owner explicitly directed the creation of this change-plan bundle, which satisfies the save-the-plan decision in `.make-docs/references/system/planning-workflow.md`. Execution is a separate decision and has **not** been authorized by that direction. No PRD, code, template, contract, manifest, conformance, or dogfood file is modified by this plan bundle.

## Intended Follow-On

- `Route:` `prd-generation`
- `Next step:` perform the phase-1 authoritative PRD maintenance described in [Phase 1](01-authority-baseline-and-prd-maintenance.md), then generate the W19 R0 delta backlog from the maintained PRD set.
- `Why:` the Playbook boundary is stated as current product authority in 28 PRDs. Retiring code, templates, and conformance evidence before that authority is corrected would leave the PRD set describing a product that no longer exists, and would make every downstream removal unciteable.
- `Coordinate Handoff:` carry `W19 R0` into the maintained PRD requirement-history entries and source links, and into a single downstream backlog at `docs/work/2026-08-11-w19-r0-playbooks-to-protocol-narrow-guardrail-refactor/`. Preserve W18 R4 through W18 R15 as prior lineage; do not reopen those coordinates. If the owner re-coordinates this plan to W18 R16, apply the same handoff with that coordinate substituted throughout.

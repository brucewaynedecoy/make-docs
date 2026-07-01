---
title: "W18 R8 Playbook Packaging Compiler and Harness Adapters"
kind: "plan"
status: "draft"
coordinate: "W18 R8"
follow_on:
  route: "prd-generation"
  next_prompt: ".make-docs/references/system/execution-workflow.md"
  why: "The plan should become active PRD requirements before the output-writer correction, capability descriptor, dependency materialization, verified adapter, marketplace seam, and test implementation begins."
  coordinate_handoff: "Carry W18 R8 into the downstream PRD reconciliation and work backlog lineage."
source:
  type: "design"
  path: "docs/designs/2026-07-01-playbook-packaging-compiler-and-harness-adapters.md"
---

# W18 R8 Playbook Packaging Compiler and Harness Adapters

## Purpose

Produce the reviewable change plan for turning [Playbook Packaging Compiler and Harness Adapters](../../designs/2026-07-01-playbook-packaging-compiler-and-harness-adapters.md) into active PRD requirements and a decision-complete delta work backlog. The design corrects two verified implementation failures — the current output writer emits a Make Docs descriptor instead of harness-native content, and the Codex adapter declares an assumed `.agents/plugins/{packageId}` path that does not match the real Codex plugin shape — while preserving the reviewed W18 R5 packaging pipeline, deterministic rails, target model, adapter-registry model, provenance, and tuple-bound support claims. It makes the packaging compiler produce real multi-file harness-native distributables, adds the harness capability and distributable model, and requires adapter contracts verified against the actual harness.

## Objective

This plan is complete when the active PRD namespace carries the packaging-compiler correction as an effective requirement through a new numbered revision doc, the genuinely impacted baseline PRD carries `### Change Notes` backlinks, the PRD index and living risk register reflect the change including the adapter-verification obligations and the provisional support claims pending conformance, and a dependency-ordered delta backlog exists that an implementing agent can execute without re-deriving compiler, generation-tier, materialization, capability, adapter, marketplace, provenance, or test decisions.

## Coordinate Decision

- Coordinate: `W18 R8`
- Classification: `revision`
- Evidence: The design's Coordinate Handoff declares W18 lineage — it revises W18 R5 (Playbook packaging and harness adapter registry) by correcting the output writer to produce harness-native distributables and requiring verified adapter contracts. Per the wave-model lineage rule, the wave stays W18 and the revision is the next unused one; `docs/plans/` already contains W18 R1 through W18 R7, so R8 is the next unused revision of wave 18.

## Change Classification

- Requested change type: `revision`
- Effective execution mode: `active-set evolution`
- Cleanup rewrite requested: no
- Full backlog regeneration requested: no

## Change Inputs

| Input | Format | Location | Confidence |
| ----- | ------ | -------- | ---------- |
| Playbook Packaging Compiler and Harness Adapters design | design doc | [../../designs/2026-07-01-playbook-packaging-compiler-and-harness-adapters.md](../../designs/2026-07-01-playbook-packaging-compiler-and-harness-adapters.md) | High — accepted authority with D0–D10 decisions and R-* requirement IDs |
| Playbook Architecture and Design, Sections 6–8 | artifact | [../../assets/artifacts/playbook-architecture.md](../../assets/artifacts/playbook-architecture.md) | High as source material; the design is the authority where they differ |
| PRD 33 Enhance Playbook Packaging and Harness Adapter Registry | change PRD (primary baseline being revised) | [../../prd/33-enhance-playbook-packaging-and-harness-adapter-registry.md](../../prd/33-enhance-playbook-packaging-and-harness-adapter-registry.md) | High — carries the W18 R5 pipeline this design preserves and the descriptor-era output and path-template declarations this design supersedes |
| PRD 34 Revise Playbook Contract and Model | change PRD | [../../prd/34-revise-playbook-contract-and-model.md](../../prd/34-revise-playbook-contract-and-model.md) | High — the compiler consumes its Playbook model, rich steps, typed dependency registry, and activation content unchanged |
| PRD 35 Revise Run Playbook State Machine | change PRD | [../../prd/35-revise-run-playbook-state-machine.md](../../prd/35-revise-run-playbook-state-machine.md) | High — the run-time capability question stays with the runner; the shared harness registry answers both questions without contradiction |
| PRD 28 Revise Shared Agentics Installation Harness Redirection | baseline PRD | [../../prd/28-revise-shared-agentics-installation-harness-redirection.md](../../prd/28-revise-shared-agentics-installation-harness-redirection.md) | High — the exposure plumbing (canonical payload, symlink/copy-mirror mirror, manifest ownership) is reused unchanged; no annotation expected |
| PRD 30 Revise Harness Plugin Substrate Workflow Bundles | baseline PRD | [../../prd/30-revise-harness-plugin-substrate-workflow-bundles.md](../../prd/30-revise-harness-plugin-substrate-workflow-bundles.md) | High — plugin substrate and workflow bundles keep consuming the packaging contract through PRD 33's change-note chain; no requirement text there is superseded |
| PRD 20 Revise Agent Harness Model Conformance Lab | baseline PRD | [../../prd/20-revise-agent-harness-model-conformance-lab.md](../../prd/20-revise-agent-harness-model-conformance-lab.md) | High — tuple-bound support-claim gating is preserved unchanged and real-harness recognition evidence stays with the conformance lineage |

Open questions and ambiguities discovered during execution are promoted into [../../prd/03-open-questions-and-risk-register.md](../../prd/03-open-questions-and-risk-register.md) per its numbering and status rules.

## Baseline Context

- Active `docs/prd/` status: active namespace, docs `00` through `35`; next available number is `36`.
- Impacted baseline docs: PRD 33 (under Capability Addition or Enhancement, the `plugin` output-kind reading as a harness-visible plugin payload is superseded by the two-granularities model and the native-versus-portable profile interpretation, and the accepted output becomes a real multi-file harness-native distributable rather than a descriptor payload; under Contracts and Data, the adapter-registry `path templates` declaration and the descriptor-era output-writer behavior are superseded by verified adapter contracts, capability descriptors, and the multi-file distributable inventory — the reviewed pipeline, deterministic rails, review gates, target model, adapter-registry model, provenance, lifecycle, and tuple-bound support claims are preserved).
- Not annotated after verification: PRD 28's exposure plumbing is reused unchanged per R-COMP-2; PRD 30's plugin substrate and workflow-bundle requirements reference W18 R5 packaging generically and continue to consume it through PRD 33's change-note chain, and its generated-from metadata fields remain accurate; PRD 20's tuple-bound support gating is preserved per R-KEEP-1 and R-PROV-3; PRD 24, PRD 25, PRD 31, and PRD 32 reference the W18 R5 package-plan model generically and none of their requirement text asserts the descriptor output or the assumed Codex path; PRD 34 and PRD 35 are consumed unchanged as the Playbook model and runner authorities.
- Discovery pass required: no
- Discovery scope if required: n/a

## Output Contract

- Plan directory: `docs/plans/2026-07-01-w18-r8-playbook-packaging-compiler-and-harness-adapters/`
  - entry point: `docs/plans/2026-07-01-w18-r8-playbook-packaging-compiler-and-harness-adapters/00-overview.md`
  - phase files: `docs/plans/2026-07-01-w18-r8-playbook-packaging-compiler-and-harness-adapters/0N-<phase>.md`
- New change docs:
  - `docs/prd/36-revise-playbook-packaging-compiler-and-harness-adapters.md`
- Baseline docs to annotate: `docs/prd/33-enhance-playbook-packaging-and-harness-adapter-registry.md`
- Index and register updates: `docs/prd/00-index.md`, `docs/prd/03-open-questions-and-risk-register.md`
- Delta backlog:
  - `docs/work/2026-07-01-w18-r8-playbook-packaging-compiler-and-harness-adapters/`

## Change Doc Strategy

One change doc carries the whole scope because the design's decision areas (compiler and distributable inventory, generation tiers, dependency materialization, capability and distributable model, verified adapter contracts, marketplace seam, provenance and lifecycle binding, tests) share one rationale — the generated Codex package was not recognized because the writer emitted a descriptor and the adapter assumed an unverified path — and one delivery sequence.

| New doc | Kind | Why it exists | Affected baseline docs |
| ------- | ---- | ------------- | ---------------------- |
| [36-revise-playbook-packaging-compiler-and-harness-adapters.md](../../prd/36-revise-playbook-packaging-compiler-and-harness-adapters.md) | revision | Supersedes PRD 33's descriptor-as-payload output and assumed adapter path templates with a harness-native multi-file distributable compiler, the harness capability and distributable model, and verified Codex/Claude Code/Pi adapter contracts, while preserving the reviewed W18 R5 pipeline, rails, target model, adapter-registry model, provenance, and tuple-bound support. | PRD 33, plus the PRD index and risk register. |

## Baseline Annotation Plan

| Baseline doc | Impacted sections | Note verb | Target change doc |
| ------------ | ----------------- | --------- | ----------------- |
| [33-enhance-playbook-packaging-and-harness-adapter-registry.md](../../prd/33-enhance-playbook-packaging-and-harness-adapter-registry.md) | Capability Addition or Enhancement | Superseded by | [36-revise-playbook-packaging-compiler-and-harness-adapters.md](../../prd/36-revise-playbook-packaging-compiler-and-harness-adapters.md) |
| [33-enhance-playbook-packaging-and-harness-adapter-registry.md](../../prd/33-enhance-playbook-packaging-and-harness-adapter-registry.md) | Contracts and Data (appended newest-last after the existing PRD 34 note) | Superseded by | [36-revise-playbook-packaging-compiler-and-harness-adapters.md](../../prd/36-revise-playbook-packaging-compiler-and-harness-adapters.md) |

## Worker Ownership

The coordinator write scope is `none` when delegation is available; every output-writing task below belongs to a role-based worker with a disjoint write scope.

| Worker | Scope | Write Scope | Dependencies | Deliverables |
| ------ | ----- | ----------- | ------------ | ------------ |
| Change doc author | Author PRD 36 from the revision template with the design's R-* requirement IDs | `docs/prd/36-revise-playbook-packaging-compiler-and-harness-adapters.md` | Accepted W18 R8 design | The effective-requirement change doc. |
| Baseline annotation worker | Add `### Change Notes` backlinks under the genuinely impacted PRD 33 headings, newest note last in existing blocks | `docs/prd/33-enhance-playbook-packaging-and-harness-adapter-registry.md` (annotations only) | PRD 36 exists | Non-destructive supersession annotations. |
| Index and register assembler | PRD index row, reading-order and lineage mentions, risk-register updates including R-017 and the adapter-verification risk | `docs/prd/00-index.md`, `docs/prd/03-open-questions-and-risk-register.md` | PRD 36 and annotations | Accurate catalog status, lineage, and register state. |
| Delta backlog author | Dependency-ordered W18 R8 implementation backlog | `docs/work/2026-07-01-w18-r8-playbook-packaging-compiler-and-harness-adapters/**` | PRD 36 shape settled | Decision-complete delta backlog. |
| Validation worker | Link, path-hygiene, wave-numbering, annotation, and traceability checks | Changed docs only (fix-up edits) | All writing workers | Validation output and fix-up patches. |

## MCP Strategy

- Preferred servers available: use `jdocmunch` for project-doc search and section reads when indexed and `jcodemunch` for any code-anchor verification; reindex before falling back.
- Fallback plan if unavailable: direct file reads plus `rg` for targeted searches, with repository contracts under `.make-docs/**` as the structural authority.

## Validation

Execution validates that PRD 36 uses the revision template and carries every design R-* family (R-SCOPE, R-KEEP, R-COMP, R-GEN, R-DEPMAT, R-CAP, R-ADAPT, R-MKT, R-PROV, R-TEST); that PRD 33 contains the required `### Change Notes` backlinks with the planned verb, newest note last, and no baseline text was deleted or renumbered; that `docs/prd/00-index.md` shows doc 36 with Current status and consistent reading-order and lineage prose; that the risk register reflects the adapter-verification obligations and provisional support claims by updating existing items in place before adding new ones; that every backlog phase cites PRD 36 plus the still-constraining baselines; and that changed files pass link, path-hygiene, and `git diff --check` review.

## Phase Map

| File | Purpose |
| ---- | ------- |
| [01-prd-change-doc-and-baseline-reconciliation.md](01-prd-change-doc-and-baseline-reconciliation.md) | Author PRD 36, annotate PRD 33, and update the PRD index and risk register. |
| [02-packaging-compiler-scope.md](02-packaging-compiler-scope.md) | Settle the compiler, generation-tier, materialization, capability, adapter, marketplace, provenance, and test scope the backlog must encode, grounded in D0–D10. |
| [03-delta-backlog-and-validation.md](03-delta-backlog-and-validation.md) | Generate the W18 R8 delta backlog and run the closing validation pass. |

## Dependencies

- [Playbook Packaging Compiler and Harness Adapters](../../designs/2026-07-01-playbook-packaging-compiler-and-harness-adapters.md) is the accepted authority; [Playbook Architecture and Design](../../assets/artifacts/playbook-architecture.md) Sections 6–8 are its source material.
- The Playbook model, rich step content, typed dependency registry, and step activation are owned by the W18 R6 lineage ([../../prd/34-revise-playbook-contract-and-model.md](../../prd/34-revise-playbook-contract-and-model.md) and [../../designs/2026-06-30-playbook-contract-and-model.md](../../designs/2026-06-30-playbook-contract-and-model.md)); this plan is sequenced after that design, consumes the model unchanged, and must not redefine it per R-SCOPE-1.
- The run-state machine and run-time execution are owned by the W18 R7 lineage ([../../prd/35-revise-run-playbook-state-machine.md](../../prd/35-revise-run-playbook-state-machine.md)); the shared harness registry answers the packaging-time capability question here and the run-time question there, without either side redefining the other.
- Cross-design sequencing dependency: real-harness recognition, installation, and invocation evidence is owned by the conformance design and its tuple registry (architecture artifact Section 9, planned next as W18 R9); this plan references that evidence bar, keeps support claims provisional until it exists per R-PROV-3 and R-TEST-5, and never redefines conformance.
- The config-gated auto-registration opt-in seam of R-MKT-2 lives in the global store owned by the [Runtime and Global Store](../../assets/artifacts/runtime-and-global-store.md) lineage (design planned as W18 R10); this plan records the seam as additive and off by default and defines nothing about the store itself.
- Generated outputs that drive Make Docs reference operation identifiers from the operation registry owned by [CLI Command Reorganization](../../assets/artifacts/cli-command-reorganization.md); the registry and CLI tree are consumed, not redefined, per R-SCOPE-1 and R-DEPMAT-1.
- The exposure plumbing — canonical payload under the staging area, symlink or copy-mirror exposure mirror, and manifest ownership records — is inherited unchanged from [../../prd/28-revise-shared-agentics-installation-harness-redirection.md](../../prd/28-revise-shared-agentics-installation-harness-redirection.md) per R-COMP-2.
- The compiler and adapters are ordinary Make Docs operation-core source code under the CLI package, not dogfooded template assets; any Make Docs-owned documentation, contract, or config-schema resource this change implies is authored upstream in `packages/docs/template/` per the maintainer dogfooding rule, and this planning round writes project planning/PRD/work content only and authors nothing under `packages/`.

## Intended Follow-On

This handoff is advisory-default-but-overridable: it is authoritative unless the user explicitly overrides it, and it is not a gate or precondition.

- Route: `prd-generation`
- Next step: Reconcile the active PRD set from this plan, then implement from the W18 R8 delta backlog.
- Why: The plan should become the product requirement contract before the output-writer correction, capability descriptor, dependency materialization, verified adapter, marketplace seam, and test implementation begins, because the plugin substrate, workflow bundles, and conformance work all consume this packaging contract rather than inventing their own.
- Coordinate Handoff: Carry `W18 R8` into the downstream PRD reconciliation and the delta work backlog lineage, adding the active P coordinate per phase.

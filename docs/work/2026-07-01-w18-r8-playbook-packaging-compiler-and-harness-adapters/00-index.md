---
title: "W18 R8 Playbook Packaging Compiler and Harness Adapters Work"
kind: "work"
status: "active"
coordinate: "W18 R8"
follow_on:
  route: "implementation-loop"
  next_prompt: ".make-docs/references/system/execution-workflow.md"
  why: "The backlog is the implementation queue derived from the W18 R8 plan and PRD contract."
  coordinate_handoff: "Carry W18 R8 into phase history records and commits, adding the active P coordinate for each phase."
source:
  type: "prd"
  path: "docs/prd/36-revise-playbook-packaging-compiler-and-harness-adapters.md"
---

# W18 R8 Playbook Packaging Compiler and Harness Adapters Work

## Purpose

Implement the packaging-compiler correction required by [36 Revise Playbook Packaging Compiler and Harness Adapters](../../prd/36-revise-playbook-packaging-compiler-and-harness-adapters.md): the harness capability descriptor and two-granularities distributable model, the output writer rebuilt to produce real multi-file harness-native distributables through the unchanged exposure plumbing, two-tier deterministic/agent-assisted generation with fail-before-write, per-kind dependency materialization, verified Codex, Claude Code, and Pi adapter contracts with fixture-tested fail-closed paths, the generate-but-do-not-auto-register marketplace seam, provenance/lifecycle/support binding, and the D10 test suite including the Codex shape assertions. The source chain is [the design](../../designs/2026-07-01-playbook-packaging-compiler-and-harness-adapters.md), [the W18 R8 plan](../../plans/2026-07-01-w18-r8-playbook-packaging-compiler-and-harness-adapters/00-overview.md), and PRD 36, with [PRD 33](../../prd/33-enhance-playbook-packaging-and-harness-adapter-registry.md), [PRD 34](../../prd/34-revise-playbook-contract-and-model.md), [PRD 35](../../prd/35-revise-run-playbook-state-machine.md), [PRD 28](../../prd/28-revise-shared-agentics-installation-harness-redirection.md), [PRD 30](../../prd/30-revise-harness-plugin-substrate-workflow-bundles.md), [PRD 25](../../prd/25-revise-cli-separation-and-mcp-boundary.md), and [PRD 20](../../prd/20-revise-agent-harness-model-conformance-lab.md) as still-constraining baselines.

## Phase Map

| File | Purpose |
| --- | --- |
| [01-capability-descriptor-and-distributable-model.md](./01-capability-descriptor-and-distributable-model.md) | Define the harness capability descriptor, the shared registry answering both capability questions, and the two-granularities native/portable distributable model with declared degradation. |
| [02-compiler-output-writer-and-dependency-materialization.md](./02-compiler-output-writer-and-dependency-materialization.md) | Rebuild the output writer into a compiler emitting the multi-file harness-native distributable inventory through the unchanged exposure plumbing, with two-tier generation, fail-before-write, and per-kind dependency materialization. |
| [03-verified-adapter-contracts.md](./03-verified-adapter-contracts.md) | Land verification references and statuses on adapter declarations, correct the Codex adapter to the verified contract, implement the Claude Code and Pi contracts, and prove fail-closed behavior with the fixture adapter. |
| [04-marketplace-registration-provenance-and-lifecycle.md](./04-marketplace-registration-provenance-and-lifecycle.md) | Generate marketplace and registration files without auto-registering, define the config-gated opt-in seam, and bind provenance, backup/uninstall safety, and tuple-bound support status to every generated artifact. |
| [05-tests-and-verification.md](./05-tests-and-verification.md) | Land the D10 test suite: harness-native tree assertions, the Codex shape assertions, fixture-adapter fail-closed coverage, materialization and generation-gate coverage, and the rule that unit tests are not harness-recognition evidence. |

## Usage Notes

- Read phases in order; they are dependency-ordered and later phases consume earlier deliverables.
- The compiler consumes the W18 R6 Playbook model — rich steps, typed dependency registry, and activation content — from [PRD 34](../../prd/34-revise-playbook-contract-and-model.md) unchanged and never re-parses Playbook Markdown or redefines the schema, workflow contract, step model, parser, or validator (R-SCOPE-1).
- Preserve every W18 R5 decision listed in PRD 36 R-KEEP-1 — the reviewed pipeline, deterministic rails, plan-drafting-only agent assistance, the harness/surface target model, the adapter-registry model, the harness-neutral planner and surface resolver, provenance, bundles not mapping one-to-one to plugins, and tuple-bound support — and never branch on harness inside the shared planner.
- Reuse the exposure plumbing from [PRD 28](../../prd/28-revise-shared-agentics-installation-harness-redirection.md) unchanged: canonical payload under the staging area, symlink or copy-mirror exposure mirror, and manifest ownership records; only the payload content changes (R-COMP-2).
- Cross-design sequencing dependency: real-harness recognition, installation, and invocation evidence — including the R-PROV-2 backup/uninstall cleanliness scenario — is owned by the conformance design and its tuple registry ([Playbook Architecture and Design](../../assets/artifacts/playbook-architecture.md) Section 9, planned next as W18 R9); this backlog references that evidence bar and never redefines conformance, and every adapter support status stays provisional until that evidence exists (R-ADAPT-1, R-PROV-3, R-TEST-5).
- The R-MKT-2 auto-registration opt-in seam lives in the global store owned by the [Runtime and Global Store](../../assets/artifacts/runtime-and-global-store.md) lineage; this backlog defines the seam as additive and off by default and never the store schema (R-SCOPE-1).
- Generated `cli` dependency checks on Make Docs itself reference stable operation identifiers from the registry owned by the [CLI Command Reorganization](../../assets/artifacts/cli-command-reorganization.md) lineage, never CLI command strings (R-DEPMAT-1, R-SCOPE-1).
- The compiler and adapters are ordinary Make Docs operation-core source code under `packages/cli/` in modular operation domains per [PRD 25](../../prd/25-revise-cli-separation-and-mcp-boundary.md); they are not dogfooded template assets, and any Make Docs-owned documentation, contract, or config-schema resource this work implies is authored upstream in `packages/docs/template/` first per the maintainer dogfooding rule.
- Treat the D9 fixed decisions — the harness-native multi-file distributable, verified adapter contracts with the verified Codex/Claude Code/Pi shapes, the capability descriptor as the single home of harness packaging knowledge, the two-granularities model and profile interpretation of `outputKind`, fail-before-write on unresolved review, and generate-but-do-not-auto-register — as non-substitutable acceptance criteria, and leave the D9 implementer freedoms (compiler internals, generated-file organization within harness layout constraints, proposal prompt wording, adapter module internals) open.
- Keep task checkboxes as `- [ ] tN: ...` with IDs incrementing across each entire phase file and acceptance criteria as plain bullets.

## Intended Follow-On

This handoff is advisory-default-but-overridable: it is authoritative unless the user explicitly overrides it, and it is not a gate or precondition.

- Route: `implementation-loop`
- Next step: Start with Phase 1 and continue phase-by-phase.
- Why: The backlog is the implementation queue derived from the W18 R8 plan and PRD contract, and the plugin substrate, workflow bundles, and conformance work all consume this packaging contract.
- Coordinate Handoff: Carry `W18 R8` into phase history records and commits, adding the active P coordinate for each phase.

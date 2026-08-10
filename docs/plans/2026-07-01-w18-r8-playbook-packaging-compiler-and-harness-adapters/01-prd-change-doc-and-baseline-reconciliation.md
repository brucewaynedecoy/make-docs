# Phase 1: PRD Change Doc and Baseline Reconciliation

## Scope

Author the numbered revision doc that makes the packaging-compiler correction, the harness capability and distributable model, and the verified adapter contracts an effective requirement, add the non-destructive baseline annotations, and reconcile the PRD index and living risk register. This phase mutates only `docs/prd/**`.

## Inputs

- [Playbook Packaging Compiler and Harness Adapters](../../designs/2026-07-01-playbook-packaging-compiler-and-harness-adapters.md), all of D0–D10 and the Design Lineage and Coordinate Handoff sections.
- The revision template at `.make-docs/templates/system/prd-change-revision.md` and the annotation rules in `.make-docs/references/system/prd-change-management.md`.
- The impacted baseline: former PRD 33 (now incorporated in [PRD 36](../../prd/36-playbook-packaging-compiler-and-harness-adapters.md)), plus [PRD 34](../../prd/34-playbook-authoring-contract-and-model.md), [PRD 35](../../prd/35-run-playbook-state-machine-and-portability.md), [PRD 28](../../prd/28-shared-agentics-installation-and-harness-exposure.md), [PRD 30](../../prd/30-plugin-substrate-and-workflow-bundles.md), and [PRD 20](../../prd/20-agent-harness-conformance-and-support-claims.md) as consumed-unchanged constraints.

## Outputs

- `docs/prd/36-playbook-packaging-compiler-and-harness-adapters.md` from the revision template: Purpose, Change Type (`revision`), Baseline Being Revised or Removed (PRD 33's descriptor-as-payload output and the assumed `.agents/plugins/{packageId}` Codex path), Rationale (the generated Codex package was not recognized), an Effective Requirement section carrying the design's R-* IDs — the harness-native multi-file distributable with reused exposure plumbing, the distributable inventory, two-tier deterministic/agent-assisted generation with fail-before-write, dependency materialization per kind, the capability descriptor, the two-granularities model and the native/portable profile interpretation of `outputKind`, the verified Codex/Claude Code/Pi adapter contracts including the corrected `.codex-plugin/plugin.json` plus marketplace registration and `.agents/skills/{id}/SKILL.md` shapes, fail-closed unsupported paths, generate-but-do-not-auto-register with the config-gated opt-in seam, and the provenance/lifecycle/support binding — plus Impacted Docs and Dependencies, Required Baseline Annotations, and Source Anchors.
- PRD 33 annotations: a `Superseded by` note under Capability Addition or Enhancement scoped to the `plugin` output-kind reading as a single harness-visible plugin payload — `outputKind` is now interpreted per the two-granularities model as the harness's richest native container or the portable agents-standard form, and the accepted output is a multi-file harness-native distributable, never a descriptor — and a `Superseded by` note appended newest-last to the existing Contracts and Data Change Notes block scoped to the adapter-registry `path templates` declaration and the descriptor-era output-writer behavior, which give way to verified adapter contracts, capability descriptors, and the multi-file distributable inventory; the reviewed pipeline, deterministic rails, agent-assistance limits, target model, adapter-registry model, provenance, lifecycle safety, and tuple-bound support claims remain governed there and are not rewritten.
- `docs/prd/00-index.md` updates mirroring how PRDs 34 and 35 were added: a Document Map row for 36, the Reading Order item-3 link and description extension, Source Anchors additions, audience-path mentions, and an Apply W18 R8 bullet in Intended Follow-On placed in the W18 sequence.
- `docs/prd/03-open-questions-and-risk-register.md` updates: extend R-017's Decision and Follow-Up in place with the W18 R8 compiler correction, capability descriptor, and verified adapter contracts, and add one new rebuild risk for adapter contracts regressing to assumed paths and support claims outrunning conformance evidence, which is owned by the conformance design planned as W18 R9; never renumber existing items.

## Validation

- PRD 36 is the next available number, no existing PRD doc was renumbered, and every baseline annotation uses the planned verb with the newest note last.
- The effective requirement is resolvable by following links from PRD 33 to PRD 36, and baseline text remains visible unchanged.
- The register update modifies R-017 in place rather than duplicating it, and the new risk item uses the next available R-* number.

---
title: "43 Revise Conformance Scenario Model and Execution Kit"
kind: "prd"
status: "active"
coordinate: "W18 R13"
source:
  type: "plan"
  path: "docs/plans/2026-07-06-w18-r13-conformance-execution-and-lab-session-redesign/00-overview.md"
---

# 43 Revise Conformance Scenario Model and Execution Kit

## Purpose

Redesign the scenario model and execution layer of the W18 R9 packaging conformance machinery: scenario definitions become harness-agnostic and organize by domain under `conformance/scenarios/<domain>/` with domain-qualified ids and per-target `targets` bindings, evidence and results organize by execution target under `conformance/results/<harness>/`, and the executable projection of a definition becomes a generated per-target conformance kit — artifacts shipped through the real packaging pipeline, deterministic instrument scripts per bar stage, self-assessment prompts, and a session manifest — with fail-closed ingestion assembling result records from instrument outputs into the unchanged recording seam. The revision closes register item [D-023](03-open-questions-and-risk-register.md) with the executable-by-construction requirement (a definition that cannot project to a command sequence the current CLI accepts fails at kit-generation time, never mid-session) and register item [D-025](03-open-questions-and-risk-register.md) by retiring harness-named scenario identity and `futureHarnesses`. Source chain: [the W18 R13 design](../designs/2026-07-06-conformance-execution-and-lab-session-redesign.md) and [the W18 R13 plan](../plans/2026-07-06-w18-r13-conformance-execution-and-lab-session-redesign/00-overview.md); the round is tracked as register item [R-028](03-open-questions-and-risk-register.md).

## Change Type

This doc records a `revision`. It supersedes the execution layer and asset organization of [37-enhance-playbook-and-package-conformance.md](37-enhance-playbook-and-package-conformance.md) — the harness-named first-pass scenario identity implied by R-SCEN-1's Codex-first spec forms, R-SCEN-2's expression of future-harness absence (re-expressed as uncovered-target reporting through the `targets` map), and the Contracts and Data prose organizing scenario specs beside the registry with raw evidence under `.make-docs/conformance/` — and enhances its R-TEST meta-verification family with the executability check. Everything else PRD 37 fixes is explicitly unchanged: the eight-dimension support tuple (R-TUPLE-1), the tuple registry with its three statuses and verdict derivation (R-REG-1..3 as relocated by [42](42-revise-conformance-asset-home-relocation.md)), the install-discover-invoke-uninstall evidence bar (R-BAR-1..2), the three test layers and the internal-tests-are-not-evidence rule (R-LAYER-1..2), support-claim governance (R-GOV-1..2), and the maintainer-only never-shipped boundary (R-KEEP-1, R-TEST-3). This doc also enhances the harness capability descriptor contract of [36-revise-playbook-packaging-compiler-and-harness-adapters.md](36-revise-playbook-packaging-compiler-and-harness-adapters.md) with a lab-facing interrogation block, strengthening R-CAP-2's single-home rule.

Route: `change-plan`

Coordinate: `W18 R13`

## Baseline Being Revised or Removed

- [37-enhance-playbook-and-package-conformance.md](37-enhance-playbook-and-package-conformance.md), Required First-Pass Scenarios (R-SCEN): the required first-pass outcomes are unchanged in substance, but their identity moves off harness-named specs — the four committed `conformance/scenarios/codex-*.json` files are replaced by the four `packaging/` domain definitions with Codex target bindings, and R-SCEN-2's future-harness reporting is re-expressed structurally: a harness absent from a definition's `targets` map is an uncovered target whose absence is reported (kit generation fails closed naming the gap; the registry's scenario-absence notes continue to report it), never implied as covered.
- [37-enhance-playbook-and-package-conformance.md](37-enhance-playbook-and-package-conformance.md), Contracts and Data: the prose locating scenario specs flat beside the registry and defaulting raw transcripts to `.make-docs/conformance/` is superseded — definitions live at `conformance/scenarios/<domain>/`, committed result records at `conformance/results/<harness>/`, and the raw-evidence default is owned by [44-revise-conformance-lab-execution-protocol-and-evidence-homes.md](44-revise-conformance-lab-execution-protocol-and-evidence-homes.md) R-NAME-2.
- [37-enhance-playbook-and-package-conformance.md](37-enhance-playbook-and-package-conformance.md), Verification and Meta-Verification (R-TEST): enhanced, not superseded — the R-TEST-2 check follows the domain-qualified ids and `scenarios/<domain>/` paths and the family gains the executability check; R-TEST-1 and R-TEST-3 are unchanged.
- The committed scenario schema in `packages/cli/src/conformance/scenario.ts`: the `packagingExtension`'s top-level `harness` field, `harnessExecution`, definition-level `registryTupleIds`, target-specific precondition probes, `futureHarnesses`, and the `characterization` block name are superseded per the Effective Requirement below; the `conformance.scenario.v1` lab core and `recordConformanceRunOnRegistryEntry` are untouched.

## Rationale

The first attempt to operate the committed machinery — projecting the `codex-plugin-marketplace-install` scenario into a hand-runnable operator walkthrough on 2026-07-06 — confirmed three verified-against-code defects ([D-023](03-open-questions-and-risk-register.md)): the specs' ship commands omit `--support-evidence-ref` and the planner unconditionally stops; the non-TTY `setup remove --backup < /dev/null` uninstall step cannot pass the TTY confirmation gate without the omitted `--yes`; and the workspace steps never establish the packaging precondition attestations the ship step requires. The R-TEST-2 "runnable" check verified structure but never projected literal step text against the real command surface — spec-without-execution, the library-without-wiring pattern (D-021) recurring at the protocol layer. Patching the three defects in place was rejected: the root cause is the form — harness-named, human-runbook-projected, hand-transcribed commands — so executability becomes a generated property, not an authored one. Separately, the `codex-*` ids and `futureHarnesses` fuse the scenario dimension (a user outcome) with the harness dimension (an execution target), bifurcating the tuple model the registry, the tuple, and the README Scope paragraph keep separate ([D-025](03-open-questions-and-risk-register.md)): N harnesses times M outcomes would need N×M drifting spec copies. Definitions by domain, evidence by target is the user's permanent direction.

Code anchors:

- `conformance/scenarios/`
- `conformance/tuple-registry.json`
- `packages/cli/src/conformance/scenario.ts`
- `packages/cli/src/conformance/meta-verification.ts`
- `packages/cli/src/operations/playbook-packaging/`

## Effective Requirement

The requirement set carries the design's requirement IDs so traceability holds; [../designs/2026-07-06-conformance-execution-and-lab-session-redesign.md](../designs/2026-07-06-conformance-execution-and-lab-session-redesign.md) is the normative statement of each.

### Organization: Definitions by Domain, Evidence by Target (R-ORG)

- R-ORG-1 (MUST): scenario definitions are harness-agnostic and live under `conformance/scenarios/<domain>/`. The first and only current domain is `packaging`; `playbook-runs` is the named future domain, created only when its first definition lands. Definition ids are domain-qualified outcome names with no harness token — `packaging/plugin-marketplace-install`, `packaging/skills-bundle-discovery-invocation`, `packaging/dependency-check-both-directions`, `packaging/uninstall-backup-cleanliness` — each at `conformance/scenarios/<domain>/<outcome>.json`.
- R-ORG-2 (MUST): evidence and results organize by execution target: committed result records live at `conformance/results/<harness>/<YYYY-MM-DD>-<outcome-slug>-<seq>.json`, with the model-or-provider and runtime dimensions inside each record (deeper nesting deferred until volume demands it). The tuple registry remains the single queryable index across all targets — the directory layout is storage, not a second query surface.
- R-ORG-3 (MUST): the committed README Scope paragraph survives and extends with the domain axis: a scenario domain groups outcome definitions by product area, and neither domain nor scenario ever encodes an execution target. `conformance/fixtures/` is unchanged in location, contract, and contents.

### Scenario Schema: Target Bindings Replace Harness Identity (R-SCHEMA)

- R-SCHEMA-1 (MUST): the `conformance.scenario.v1` lab core is untouched. The `packagingExtension` block keeps the definition-level, target-independent fields — per-stage `evidenceBar` assertions, `transcriptPolicy`, `workspacePolicy`, `fixturePlaybooks`, and the precondition template — and gains `domain`. The fields that name a target move out of the definition body: `harness` is deleted as a top-level extension field, and `harnessExecution`, per-target `registryTupleIds`, and target-specific precondition probes live in a `targets` map keyed by harness id.
- R-SCHEMA-2 (MUST): `futureHarnesses` is retired. Its honest job — uncovered harnesses are named, never implied as covered — is done structurally: a harness with no entry in a definition's `targets` map is an uncovered target, kit generation for it fails closed naming the gap, and the registry's existing scenario-absence notes continue to report it.
- R-SCHEMA-3 (MUST): `REQUIRED_FIRST_PASS_SCENARIOS`, the R-TEST-2 check, and the registry's `plannedScenarios` values move to the domain-qualified ids in the same change; the required first-pass set remains exactly the four packaging outcomes bound to Codex targets.

### The Kit: Per-Target, Generated, Disposable (R-KIT)

- R-KIT-1 (MUST): a conformance kit is generated on demand for one (definition, target) pair — or one target's full first-pass suite — into a disposable lab-session workspace outside the repository (per [44](44-revise-conformance-lab-execution-protocol-and-evidence-homes.md) R-NAME-2). The kit contains the artifacts (the fixture project materialized and the distributables shipped through the real packaging pipeline — plan/preview/write via the same compiler and descriptors the product ships — with evidence refs and precondition attestations supplied by the kit's session configuration rather than remembered by an operator, the structural fix for all three D-023 defects), the prompts (R-PROMPT-1), the deterministic instrument scripts (R-INST), and a session manifest recording the definition id, target, tuple ids, generation inputs (descriptor digest, CLI version), and the expected-evidence table the ingest step validates against.
- R-KIT-2 (MUST): the workspace layout is fixed — `<session-root>/kit/` (prompts, instruments, manifest), `<session-root>/workspace/` (the fixture project the target operates in), `<session-root>/evidence/` (instrument outputs and transcripts). The workspace is disposable by default, discarded after ingestion, and nothing in it is ever written under the repository.
- R-KIT-3 (MUST): executable-by-construction — kit generation derives every command it emits (packaging invocations, `setup remove --yes` forms, precondition establishment) from the registered operation surface and the capability descriptors, and fails generation, before any session starts, if a definition cannot project to a command sequence the current CLI accepts. This is D-023's close-bar direction as machinery.

### Kit Generation Home: Maintainer Lab Tooling (R-HOME)

- R-HOME-1 (MUST): the kit generator is lab code in `packages/cli/src/conformance/` (a `kit.ts` module beside the existing lab modules, consuming the descriptors, the packaging pipeline, and the scenario loaders in-process and unit-testable), invoked through maintainer tooling (an npm script/`scripts/` entry). It is deliberately NOT registered in the operation registry and NOT exposed on the shipped CLI command tree or MCP surface: the W18 R11 parity rule is preserved vacuously, because shipping it would advertise a maintainer-lab capability whose required assets R-TEST-3 structurally excludes from every install — the D-022 category error repeated at the command level. The revisit seam is recorded on register item Q-022.
- R-HOME-2 (MUST): the kit generator consumes the harness capability descriptors and never mints a second home for harness knowledge (PRD 36 R-CAP-2). Harness knowledge the descriptors do not yet carry — how to list installed plugins, where a harness logs skill invocation — is authored INTO the descriptor as a lab-facing interrogation block on the descriptor type, verification-marked like every other descriptor claim, and the kit renders from it. A kit-local table of harness facts is the R-021 regression vector and is prohibited.

### Instruments: Deterministic, One per Bar Stage (R-INST)

- R-INST-1 (MUST): each asserted bar stage has an instrument script in the kit whose output is machine-verifiable and lands in `evidence/`: install — exit codes of the install commands plus a file inventory of the harness-visible placement roots; discover — a capture of the harness's own listing surface (command output, directory listing, or manifest read, per the descriptor's interrogation block) that ingestion greps deterministically; invoke — the fixture skill's deterministic invocation marker (the existing `conformance-skill-probe` emits it) captured as a probe file; uninstall — a byte-level before/after diff of the placement roots and the workspace proving managed outputs removed, user content untouched, no orphaned managed directories. Instruments capture; they never interpret — interpretation happens at ingestion against the manifest's expected-evidence table.
- R-INST-2 (MUST): instruments are deterministic and offline — no instrument spends network or model routing. The judgment-shaped middle belongs to the driving agent or human; the instruments bracket it with measurements.

### Prompts: Target-Agnostic Core, Per-Target Rendering (R-PROMPT)

- R-PROMPT-1 (MUST): the kit's prompt set has a target-agnostic core — the session narrative, the honesty rules verbatim (blocked is a valid result; failures are evidence; assertions never relax), the instruction to perform its own discovery and assessment, when to run each instrument, and the explicit statement that the agent's claims are not evidence and only instrument outputs count — rendered per target with harness specifics drawn from the descriptors. The prompt tells the target agent to attempt, observe, and narrate; it never asks the agent to certify.

### The Discovery Kit (R-DISC)

- R-DISC-1 (MUST): the characterization preamble committed on the plugin scenario (R-021's resolution plan for the negative Codex v0.142.4 probe) carries forward as a first-run discovery kit — a kit variant whose session precedes bar assertion and whose instruments record ground truth: pin the harness version, hand-author a minimal plugin from the harness's own docs independent of Make Docs, vary marketplace source shapes until one is accepted, capture the accepted shape, then diff the generated shapes against it. Discovery findings feed descriptor corrections (re-triggering contract-digest re-verification), never evidence-bar relaxations. The schema's `characterization` block is renamed and generalized to `discoveryKit` with the `resolvesProbe` linkage to R-021 preserved verbatim, carried on the plugin definition's Codex target binding.

### Ingestion: Instruments In, the Existing Seam Out (R-ING)

- R-ING-1 (MUST): ingestion is a deterministic kit step assembling a `conformance.result.v1` record from the session: bar-stage booleans derive SOLELY from instrument outputs validated against the manifest's expected-evidence table — a missing or failed instrument output for an asserted stage yields `false`, fail-closed, no narrative rescue. The driving agent or human contributes only what instruments cannot — operator attestations (network, model routing), run metadata (model, provider, runtime), and the narrative `reason` — and every attestation is recorded as an attestation, distinguishable from measurement. The assembled record validates against the existing result contract before it goes anywhere.
- R-ING-2 (MUST): the recording seam is unchanged — the validated record commits under `conformance/results/<harness>/` and binds to its registry tuple exclusively through `recordConformanceRunOnRegistryEntry`, whose existing refusals (unasserted stages, tuple or harness mismatch, simulation-posture mismatch) and the registry's derivation rules do all the gating. Nothing new writes to the registry; nothing bypasses the seam; the R-TEST-1 receipts discipline applies as-is.

### Verification and Reconciliation Obligations (D12, D14)

The implementation must prove: kit generation fails closed on an unprojectable definition and the three D-023 defect classes are impossible in generated output (evidence refs, `--yes`, precondition establishment all kit-supplied, asserted by tests over generated kits); ingestion refuses to assert a bar stage without its instrument output; the R-TEST-2 check passes over the domain-organized definitions and the executability check runs enforcing in the standard suite (a kit-generation dry-run projects every required definition to an accepted command sequence); the reconciliation greps return no live-surface hits (`.make-docs/conformance` outside dated evidence and the preserved compiler record, the four `codex-*` scenario ids, `futureHarnesses`, stale `REQUIRED_FIRST_PASS_SCENARIOS` ids); the registry loads green with updated `plannedScenarios` and untouched statuses; and the standard validation surface (CLI suite, build, `validate:defaults`, `smoke:pack`, path hygiene) is green. Unit and integration tests over kits and instruments remain repository layers and are never cited as harness-recognition evidence (R-LAYER-2 unchanged). The design's D12 reconciliation inventory is the completeness source, executed exhaustively per register item R-028 — every entry changed or explicitly preserved with a recorded reason, with the four old spec files removed in the same change as their replacements, never left as parallel truths.

Code anchors:

- `packages/cli/src/conformance/kit.ts`
- `packages/cli/src/conformance/scenario.ts`
- `packages/cli/src/conformance/meta-verification.ts`
- `packages/cli/src/conformance/registry.ts`
- `conformance/scenarios/`
- `conformance/tuple-registry.json`

## Impacted Docs and Dependencies

- [37-enhance-playbook-and-package-conformance.md](37-enhance-playbook-and-package-conformance.md): the revised baseline — R-SCEN identity and absence reporting, the Contracts and Data organization prose, and the enhanced R-TEST family; its registry, bar, statuses, layers, and governance requirements are untouched.
- [44-revise-conformance-lab-execution-protocol-and-evidence-homes.md](44-revise-conformance-lab-execution-protocol-and-evidence-homes.md): the sibling W18 R13 change doc — it owns the execution-protocol rules (R-EXEC), the operator modes (R-MODE), and the lab-session vocabulary and evidence homes (R-NAME) this doc's kit and ingestion machinery operate under.
- [36-revise-playbook-packaging-compiler-and-harness-adapters.md](36-revise-playbook-packaging-compiler-and-harness-adapters.md): enhanced — the descriptor type gains the verification-marked lab-facing interrogation block (R-HOME-2), and the kit generator becomes the packaging pipeline's first end-to-end internal consumer; the compiler, adapters, and distributable model remain owned there, and the compiled package's embedded `.make-docs/conformance.json` record is explicitly untouched despite the near-collision.
- [42-revise-conformance-asset-home-relocation.md](42-revise-conformance-asset-home-relocation.md): explicitly preserved — the repo-root `conformance/` home stands; no location change in this round; the R-TEST-3 markers are verified (not assumed) to survive the `scenarios/<domain>/` nesting.
- [40-revise-playbook-authoring-contract-v2.md](40-revise-playbook-authoring-contract-v2.md) and [41-revise-cli-human-experience-and-package-grammar.md](41-revise-cli-human-experience-and-package-grammar.md): consumed unchanged — kit generation ships through the `plan`/`preview`/`write` pipeline and the registered operation surface, and machine-consumed CLI output in instruments pins `--json` per the reconciled W18 R9 baseline; no annotation required.
- [39-revise-cli-command-reorganization-and-operation-registry.md](39-revise-cli-command-reorganization-and-operation-registry.md): consumed unchanged — kit generation stays off the shipped surface entirely, so registry parity is preserved vacuously (R-HOME-1); no annotation required.
- The developer conformance-lab guide, the conformance README with its router stubs, the four claim surfaces, the conformance test suites, and the completed W18 R9 backlog carry the implementation-round reconciliation per the design's D12 inventory; the W18 R9 backlog index and history records receive notes, never rewrites.
- [00-index.md](00-index.md) carries the catalog update; [03-open-questions-and-risk-register.md](03-open-questions-and-risk-register.md) already records D-023/D-025 with close bars and R-028 as the tracking item, closing on this round's implementation.

Code anchors:

- `packages/cli/tests/conformance-scenarios.test.ts`
- `packages/cli/tests/conformance-meta-verification.test.ts`
- `packages/cli/tests/conformance-tuple-registry.test.ts`
- `packages/cli/tests/conformance-governance.test.ts`
- `conformance/README.md`

## Required Baseline Annotations

- [37-enhance-playbook-and-package-conformance.md](37-enhance-playbook-and-package-conformance.md): `Superseded by` appended newest-last to the existing R-SCEN `#### Change Notes`, scoped to scenario identity and absence reporting; `Enhanced by` as a new `#### Change Notes` under Verification and Meta-Verification (R-TEST), scoped to the executability check and id/path retargeting; `Superseded by` (this doc and [44](44-revise-conformance-lab-execution-protocol-and-evidence-homes.md)) appended newest-last to the existing Contracts and Data `### Change Notes`, scoped to scenario/result organization and the raw-evidence default.
- [36-revise-playbook-packaging-compiler-and-harness-adapters.md](36-revise-playbook-packaging-compiler-and-harness-adapters.md): `Enhanced by` as a new `#### Change Notes` under Harness Capability and Distributable Model (R-CAP), scoped to the lab-facing interrogation block.
- [00-index.md](00-index.md): add this doc to the reading order, document map, source anchors, audience paths, and intended follow-on.

## Source Anchors

- [../designs/2026-07-06-conformance-execution-and-lab-session-redesign.md](../designs/2026-07-06-conformance-execution-and-lab-session-redesign.md)
- [../plans/2026-07-06-w18-r13-conformance-execution-and-lab-session-redesign/00-overview.md](../plans/2026-07-06-w18-r13-conformance-execution-and-lab-session-redesign/00-overview.md)
- [../work/2026-07-06-w18-r13-conformance-execution-and-lab-session-redesign/00-index.md](../work/2026-07-06-w18-r13-conformance-execution-and-lab-session-redesign/00-index.md)
- [03-open-questions-and-risk-register.md](03-open-questions-and-risk-register.md) (D-023, D-025, R-028, R-021, Q-022)
- [37 Enhance Playbook and Package Conformance](37-enhance-playbook-and-package-conformance.md)
- [42 Revise Conformance Asset Home Relocation](42-revise-conformance-asset-home-relocation.md)
- [36 Revise Playbook Packaging Compiler and Harness Adapters](36-revise-playbook-packaging-compiler-and-harness-adapters.md)
- [44 Revise Conformance Lab Execution Protocol and Evidence Homes](44-revise-conformance-lab-execution-protocol-and-evidence-homes.md)
- `packages/cli/src/conformance/scenario.ts`
- `packages/cli/src/conformance/meta-verification.ts`
- `conformance/README.md`

---
title: "43 Conformance Scenario Model and Execution Kits"
kind: "prd"
status: "active"
source:
  type: "plan"
  path: "docs/plans/2026-07-06-w18-r13-conformance-execution-and-lab-session-redesign/00-overview.md"
---

# 43 Conformance Scenario Model and Execution Kits

## Purpose

This document defines the current product contract for portable conformance scenarios, execution kits, and deterministic verification. Normative requirements are stated in the sections below; Requirement History is provenance only.
## Scope

This authority owns portable conformance scenarios, execution kits, and deterministic verification. Related PRDs own adjacent capabilities and are linked where a cross-boundary contract is required.
## Component and Capability Map

The requirements below define the owned components, behaviors, boundaries, and evidence expectations for this capability.
## Requirements

The requirements below are the normative authority. Their stable identifiers preserve traceability to the originating [conformance execution and lab-session design](../designs/2026-07-06-conformance-execution-and-lab-session-redesign.md), which is provenance rather than product authority.

### Organization: Definitions by Domain, Evidence by Target (R-ORG)

- R-ORG-1 (MUST): scenario definitions are harness-agnostic and live under `conformance/scenarios/<domain>/`. The first and only current domain is `packaging`; `playbook-runs` is the named future domain, created only when its first definition lands. Definition ids are domain-qualified outcome names with no harness token — `packaging/plugin-marketplace-install`, `packaging/skills-bundle-discovery-invocation`, `packaging/dependency-check-both-directions`, `packaging/uninstall-backup-cleanliness` — each at `conformance/scenarios/<domain>/<outcome>.json`.
- R-ORG-2 (MUST): evidence and results organize by execution target: committed result records live at `conformance/results/<harness>/<YYYY-MM-DD>-<outcome-slug>-<seq>.json`, with the model-or-provider and runtime dimensions inside each record (deeper nesting deferred until volume demands it). The tuple registry remains the single queryable index across all targets — the directory layout is storage, not a second query surface.
- R-ORG-3 (MUST): the committed README Scope paragraph survives and extends with the domain axis: a scenario domain groups outcome definitions by product area, and neither domain nor scenario ever encodes an execution target. `conformance/fixtures/` is unchanged in location, contract, and contents.

### Scenario Schema: Target Bindings Replace Harness Identity (R-SCHEMA)

- R-SCHEMA-1 (MUST): `conformance.scenario.v1` supplies the lab core. Its `packagingExtension` carries target-independent `domain`, per-stage `evidenceBar` assertions, `transcriptPolicy`, `workspacePolicy`, `fixturePlaybooks`, and the precondition template. A `targets` map keyed by harness id carries `harnessExecution`, per-target `registryTupleIds`, and target-specific precondition probes; no top-level `harness` field is valid.
- R-SCHEMA-2 (MUST): `futureHarnesses` is not part of the schema. A harness without a `targets` entry is an uncovered target, kit generation for it fails closed naming the gap, and registry scenario-absence notes report it.
- R-SCHEMA-3 (MUST): `REQUIRED_FIRST_PASS_SCENARIOS`, the R-TEST-2 check, and registry `plannedScenarios` use the domain-qualified ids; the required first-pass set is exactly the four packaging outcomes bound to Codex targets.

### The Evidence Bar (R-BAR)

- R-BAR-1 (MUST): a tuple reaches `conformance-validated` only when its scenario installs the generated distributable into the real harness or an explicitly recorded faithful simulation, asserts discovery through the harness's own listing or recognition surface, asserts invocation by proving a bundled skill can be invoked or its workflow can be driven, and asserts clean uninstall by proving managed outputs and empty managed directories are removed without deleting user-authored files. The four required stages are install, discover, invoke, and uninstall; each is measured by the deterministic instruments below.
- R-BAR-2 (MUST): internal file, schema, and structure tests may establish only `implementation-validated`. A tuple never advances directly from `provisional` to `conformance-validated` without a recorded eligible verdict and all required R-BAR-1 measurements. Evidence from a faithful simulation is identified as simulated and cannot be worded as real-harness evidence.

### Required First-Pass Scenarios (R-SCEN)

- R-SCEN-1 (MUST): the first pass is Codex-bound and contains exactly four harness-agnostic packaging outcomes: `packaging/plugin-marketplace-install` proves a generated native plugin appears through a marketplace, installs, exposes bundled skills, and is usable in a new thread; `packaging/skills-bundle-discovery-invocation` proves a generated skills bundle appears in the target and its fixture skill can be invoked; `packaging/dependency-check-both-directions` proves missing-tool checks fail with the dependency named and the same checks pass when dependencies are present, using the v2 `probe` field; and `packaging/uninstall-backup-cleanliness` proves backup/uninstall removes Make Docs-owned generated outputs and empty managed directories without deleting user-authored files.
- R-SCEN-2 (MUST): Pi and other harnesses are future target bindings added only when their adapters and harness contracts become supported. Their absence is reported as uncovered: a definition without that harness in `targets` fails kit generation for that target and the tuple registry retains a scenario-absence note; coverage is never implied.
- R-SCEN-3 (MUST): scenario commands use the current `plan`, `preview`, `write`, and `ship` grammar, dependency expectations use `probe` rather than `source` prose, and any transcript consumer pins `--json` so human rendering never enters machine evidence.

### The Kit: Per-Target, Generated, Disposable (R-KIT)

- R-KIT-1 (MUST): a conformance kit is generated on demand for one (definition, target) pair — or one target's full first-pass suite — into a disposable lab-session workspace outside the repository (per [44](44-conformance-lab-sessions-and-evidence.md) R-NAME-2). The kit contains the artifacts (the fixture project materialized and the distributables shipped through the real packaging pipeline — plan/preview/write via the same compiler and descriptors the product ships — with evidence refs and precondition attestations supplied by the kit's session configuration rather than remembered by an operator), the prompts (R-PROMPT-1), the deterministic instrument scripts (R-INST), and a session manifest recording the definition id, target, tuple ids, generation inputs (descriptor digest, CLI version), and the expected-evidence table the ingest step validates against.
- R-KIT-2 (MUST): the workspace layout is fixed — `<session-root>/kit/` (prompts, instruments, manifest), `<session-root>/workspace/` (the fixture project the target operates in), `<session-root>/evidence/` (instrument outputs and transcripts). The workspace is disposable by default, discarded after ingestion, and nothing in it is ever written under the repository.
- R-KIT-3 (MUST): executable-by-construction — kit generation derives every command it emits (packaging invocations, `setup remove --yes` forms, precondition establishment) from the registered operation surface and the capability descriptors, and fails generation, before any session starts, if a definition cannot project to a command sequence the current CLI accepts.

### Kit Generation Home: Maintainer Lab Tooling (R-HOME)

- R-HOME-1 (MUST): the kit generator is lab code in `packages/cli/src/conformance/` (a `kit.ts` module beside the existing lab modules, consuming descriptors, the packaging pipeline, and scenario loaders in process and remaining unit-testable), invoked through maintainer tooling (an npm script or `scripts/` entry). It is not registered in the operation registry or exposed on the shipped CLI or MCP surface because its required assets are structurally absent from every install. Register item Q-022 is the explicit revisit seam.
- R-HOME-2 (MUST): the kit generator consumes the harness capability descriptors and never mints a second home for harness knowledge (PRD 36 R-CAP-2). Harness knowledge the descriptors do not yet carry — how to list installed plugins, where a harness logs skill invocation — is authored INTO the descriptor as a lab-facing interrogation block on the descriptor type, verification-marked like every other descriptor claim, and the kit renders from it. A kit-local table of harness facts is the R-021 regression vector and is prohibited.

### Instruments: Deterministic, One per Bar Stage (R-INST)

- R-INST-1 (MUST): each asserted bar stage has an instrument script in the kit whose output is machine-verifiable and lands in `evidence/`: install — exit codes of the install commands plus a file inventory of the harness-visible placement roots; discover — a capture of the harness's own listing surface (command output, directory listing, or manifest read, per the descriptor's interrogation block) that ingestion greps deterministically; invoke — the fixture skill's deterministic invocation marker (the existing `conformance-skill-probe` emits it) captured as a probe file; uninstall — a byte-level before/after diff of the placement roots and the workspace proving managed outputs removed, user content untouched, no orphaned managed directories. Instruments capture; they never interpret — interpretation happens at ingestion against the manifest's expected-evidence table.
- R-INST-2 (MUST): instruments are deterministic and offline — no instrument spends network or model routing. The judgment-shaped middle belongs to the driving agent or human; the instruments bracket it with measurements.

### Prompts: Target-Agnostic Core, Per-Target Rendering (R-PROMPT)

- R-PROMPT-1 (MUST): the kit's prompt set has a target-agnostic core — the session narrative, the honesty rules verbatim (blocked is a valid result; failures are evidence; assertions never relax), the instruction to perform its own discovery and assessment, when to run each instrument, and the explicit statement that the agent's claims are not evidence and only instrument outputs count — rendered per target with harness specifics drawn from the descriptors. The prompt tells the target agent to attempt, observe, and narrate; it never asks the agent to certify.

### The Discovery Kit (R-DISC)

- R-DISC-1 (MUST): the plugin definition's Codex target binding carries a `discoveryKit` with `resolvesProbe: R-021`. Its first session precedes evidence-bar assertion and records ground truth: pin the harness version, hand-author a minimal plugin from the harness's own documentation independently of Make Docs, vary marketplace source shapes until one is accepted, capture that shape, and diff generated shapes against it. Findings correct the verified capability descriptor and re-trigger contract-digest verification; they never relax the evidence bar.

### Ingestion: Instruments In, the Existing Seam Out (R-ING)

- R-ING-1 (MUST): ingestion is a deterministic kit step assembling a `conformance.result.v1` record from the session: bar-stage booleans derive SOLELY from instrument outputs validated against the manifest's expected-evidence table — a missing or failed instrument output for an asserted stage yields `false`, fail-closed, no narrative rescue. The driving agent or human contributes only what instruments cannot — operator attestations (network, model routing), run metadata (model, provider, runtime), and the narrative `reason` — and every attestation is recorded as an attestation, distinguishable from measurement. The assembled record validates against the existing result contract before it goes anywhere.
- R-ING-2 (MUST): the recording seam is unchanged — the validated record commits under `conformance/results/<harness>/` and binds to its registry tuple exclusively through `recordConformanceRunOnRegistryEntry`, whose existing refusals (unasserted stages, tuple or harness mismatch, simulation-posture mismatch) and the registry's derivation rules do all the gating. Nothing new writes to the registry; nothing bypasses the seam; the R-TEST-1 receipts discipline applies as-is.

### Verification and Meta-Verification (R-TEST)

- R-TEST-1 (MUST): registry verification joins each `conformance-validated` tuple to a committed result record for the same tuple and verifies an eligible verdict plus asserted install, discover, invoke, and uninstall stages. A missing receipt, tuple mismatch, harness mismatch, simulation-posture mismatch, or unasserted stage fails closed.
- R-TEST-2 (MUST): all four R-SCEN-1 definitions exist at their domain-qualified paths and are runnable. The enforcing check performs a kit-generation dry run that projects every definition to commands accepted by the current operation/CLI surface; missing preconditions produce `blocked`, never a silent pass.
- R-TEST-3 (MUST): exclusion checks scan the shipped template, packaged copy, npm tarballs, and generated product packages for a root-level `conformance/` directory and for the family's distinctive subtree fragments at any depth, while also rejecting the retired `docs/assets/conformance/` path and the unchanged distinctive basenames and schema identifiers. Finding any marker in a shipped surface fails packaging validation.

### Verification and Repository Consistency (D12, D14)

Verification proves that kit generation fails closed on an unprojectable definition; generated kits always supply evidence references, non-interactive confirmation, and precondition establishment; ingestion never asserts a bar stage without its instrument output; and the enforcing R-TEST-2 dry run projects every required definition to an accepted current command sequence. Current product and executable surfaces contain no `.make-docs/conformance` transcript home, harness-qualified scenario ids, `futureHarnesses`, or non-domain-qualified `REQUIRED_FIRST_PASS_SCENARIOS` values; historical records and explicit rejection tests may name those strings as history or negative markers. The registry loads with current `plannedScenarios` and derived statuses, and the standard CLI suite, build, `validate:defaults`, `smoke:pack`, and path-hygiene checks pass. Unit and integration tests over kits and instruments remain repository layers and are never cited as harness-recognition evidence.

Code anchors:

- `packages/cli/src/conformance/kit.ts`
- `packages/cli/src/conformance/scenario.ts`
- `packages/cli/src/conformance/meta-verification.ts`
- `packages/cli/src/conformance/registry.ts`
- `conformance/scenarios/`
- `conformance/tuple-registry.json`
## Contracts and Data

The named paths, schemas, state records, metadata fields, and evidence shapes in Requirements are normative contracts for this capability.
## Integrations

This capability integrates with the adjacent current authorities linked from Requirements and Source Anchors; those authorities remain owners of their own boundaries.
## Rebuild Notes

A rebuild must preserve the requirement identifiers, stable semantic anchors, ownership boundaries, and failure-safe behavior stated here. Implementation evidence does not silently weaken this authority.
## Canonical Conformance Asset Home

Repo-root `conformance/` is the versioned, authoritative maintainer-infrastructure home and contains the complete family: `tuple-registry.json`, `scenarios/`, `fixtures/`, `README.md`, and `results/` once recorded results exist. It is a peer of `packages/` and `scripts/`, outside `docs/assets/` because it is machine-validated data and executable protocol rather than reader documentation, and outside `packages/` because it is never shipped product. The family is edited in place and is deliberately not authored upstream in `packages/docs/template/`.

Current requirements, loaders, tests, and claim surfaces resolve only this repo-root family. References to `docs/assets/conformance/` in dated designs, plans, completed work, and history records describe historical states; they do not define a current alternate home. R-TEST-3 continues to reject the retired path so a historical mention cannot revive it in a shipped tree.

Machine-local transcripts and lab-session evidence follow [44-conformance-lab-sessions-and-evidence.md](44-conformance-lab-sessions-and-evidence.md) and must not turn either the repository or repo-local `.make-docs/` into a run-residue store.

## Requirement History

### 2026-08-08 — Not assigned

- Affected requirement or section: `Consolidated capability ownership`
- Previous contract: Current requirements were also represented by standalone editorial PRDs 37, 42.
- Replacement contract: The applicable current requirements are inline in this authority and its linked product owners; the standalone editorial records are retired from the active set.
- Rationale: Active PRDs own product subjects and do not preserve editorial operations as product authority.
- Source: [PRD Authority Maintenance](../../.make-docs/references/system/prd-change-management.md)


### 2026-08-08 — W18 R13

- Affected requirement or section: `Document identity and current authority`
- Previous contract: The capability was represented as a standalone editorial change record whose title and structure described how the PRD set was modified.
- Replacement contract: This document now states the current portable conformance scenarios, execution kits, and deterministic verification requirements inline as product authority.
- Rationale: Active PRDs describe the current product shape; editorial operations belong in plans, work, and history.
- Source: [Conformance execution redesign](../designs/2026-07-06-conformance-execution-and-lab-session-redesign.md)
## Source Anchors

- [../designs/2026-07-06-conformance-execution-and-lab-session-redesign.md](../designs/2026-07-06-conformance-execution-and-lab-session-redesign.md)
- [../plans/2026-07-06-w18-r13-conformance-execution-and-lab-session-redesign/00-overview.md](../plans/2026-07-06-w18-r13-conformance-execution-and-lab-session-redesign/00-overview.md)
- [../work/2026-07-06-w18-r13-conformance-execution-and-lab-session-redesign/00-index.md](../work/2026-07-06-w18-r13-conformance-execution-and-lab-session-redesign/00-index.md)
- [03-open-questions-and-risk-register.md](03-open-questions-and-risk-register.md) (D-023, D-025, R-028, R-021, Q-022)
- [20 Agent Harness Conformance and Support Claims](20-agent-harness-conformance-and-support-claims.md)
- [36 Playbook Packaging Compiler and Harness Adapters](36-playbook-packaging-compiler-and-harness-adapters.md)
- [44 Conformance Lab Sessions and Evidence](44-conformance-lab-sessions-and-evidence.md)
- `packages/cli/src/conformance/scenario.ts`
- `packages/cli/src/conformance/meta-verification.ts`
- `conformance/README.md`

---
title: Conformance Lab Scenario and Result Contracts
path: maintainer/conformance
status: draft
persona: developer
order: 60
tags:
  - maintainer
  - conformance
  - support-claims
applies-to:
  - docs
  - validation
related:
  - ../../../prd/20-agent-harness-conformance-and-support-claims.md
  - ../../../prd/20-agent-harness-conformance-and-support-claims.md
  - ../../../prd/43-conformance-scenario-model-and-execution-kits.md
  - ../../../plans/2026-06-23-w10-r5-agent-harness-model-conformance-lab/02-scenario-and-result-contract.md
  - ../../../plans/2026-06-23-w10-r5-agent-harness-model-conformance-lab/03-harness-adapter-and-support-claim-gating.md
  - ../../../work/2026-06-23-w10-r5-agent-harness-model-conformance-lab/02-scenario-and-result-schema.md
  - ../../../work/2026-06-23-w10-r5-agent-harness-model-conformance-lab/03-adapters-and-support-claims.md
  - ../../../work/2026-07-01-w18-r9-playbook-and-package-conformance/01-support-tuple-and-tuple-registry.md
  - ../../../work/2026-07-01-w18-r9-playbook-and-package-conformance/02-evidence-bar-and-first-pass-scenarios.md
  - ../../../work/2026-07-01-w18-r9-playbook-and-package-conformance/03-test-layer-separation-and-meta-verification.md
  - ../../../prd/44-conformance-lab-sessions-and-evidence.md
  - ../../../work/2026-07-06-w18-r13-conformance-execution-and-lab-session-redesign/01-asset-reorganization-and-spec-migration.md
  - ../../../work/2026-07-06-w18-r13-conformance-execution-and-lab-session-redesign/02-execution-kit-instruments-and-lab-sessions.md
  - ../../../work/2026-07-06-w18-r13-conformance-execution-and-lab-session-redesign/03-ingestion-and-operator-modes.md
  - ../../../../conformance/operator-modes.md
  - ./playbooks-development-packaging-and-harness-adapters.md
  - ./release-packaging-validation-and-release-reference.md
---

# Conformance Lab Scenario and Result Contracts

> Current scope after W19 R1 P8: the four packaging scenarios are retired. No current scenario set replaces them. The current tuple registry has zero entries. Old sources and fixture files stay at their original paths for history. The exact old registry is in `conformance/history/w19-r1-p8-tuple-registry.json`. Old results cannot prove current Skill, lifecycle, or harness support. Compiler-specific commands and mappings below are historical records. Shared session tools, instruments, record readers, and support-claim checks remain. New kit generation requires an explicit lab target; no first-party packaging descriptor is enabled. The former first-pass suite returns a retirement error.


## Overview

The conformance lab is maintainer-only evidence infrastructure. It helps maintainers test make-docs behavior across agent harnesses and harness-selected models before making support claims. It does not replace package validation, and it is not installed into consumer projects by default.

Use this guide when defining reviewed scenario specs, compact result records, raw artifact storage, and redacted evidence promotion. Keep the lab outside shipped templates and packages unless a later accepted design explicitly promotes a reviewed subset.

Since W18 R9 Phase 1 ([PRD 20](../../../prd/20-agent-harness-conformance-and-support-claims.md#support-claim-governance)), the lab extends into the Playbook packaging domain: support claims for generated distributables bind to an eight-dimension tuple, and every tuple's status lives in one queryable registry data file. Since W18 R9 Phase 2, the install-discover-invoke-uninstall evidence bar is implemented as the packaging scenario shape, and the four required first-pass scenario definitions are committed — runnable where their preconditions hold and honestly `blocked` where they do not. Since W18 R13 Phase 1 ([PRD 43](../../../prd/43-conformance-scenario-model-and-execution-kits.md)), the scenario model is **definitions by domain, evidence by target**: definitions are harness-agnostic, organize under `conformance/scenarios/<domain>/` with domain-qualified ids (`packaging/plugin-marketplace-install`, never `codex-*`), and bind execution targets through a per-target `targets` map — Codex bound first — while committed evidence organizes under `conformance/results/<harness>/`. Since W18 R13 Phase 2, the executable projection of a definition is a generated per-target execution kit in a disposable lab session — executable by construction, driven by the target agent, measured by deterministic instruments — with raw evidence homed in the session workspace or the machine-level store's lab area, never repo-local `.make-docs/`; see The Execution Kit and Lab Sessions below. Since W18 R9 Phase 3, coverage is organized into three named test layers — declared where the tests live and machine-enforced — and the D9 meta-verification checks police the registry, the required scenario set, the layer attribution of cited evidence, and the maintainer-only shipping boundary from the standard repository suite. The lab core in this guide — verdicts, safety modes, evidence classes, storage boundaries, and the result contract — is consumed by that extension unchanged (R-SCOPE-1, R-KEEP-1). See Packaging Conformance Tuple and Registry, Packaging Conformance Scenarios and the Evidence Bar, and Test Layers and Meta-Verification below.

## Project Orientation

| Surface | Purpose | Source-control rule |
| --- | --- | --- |
| Scenario definitions | Define the behavior to exercise, the safety mode, and the expected evidence. | May be committed only when compact and reviewed. Packaging scenario definitions are harness-agnostic and live at `conformance/scenarios/<domain>/<outcome>.json`. |
| Result records | Capture the exact scenario/harness/model/provider/runtime tuple and reviewed verdict. | May be committed only when compact and reviewed. Packaging result records land under `conformance/results/<harness>/`, created with the first recorded run. |
| Scenario fixture Playbooks | Provide the v2-form source Playbooks packaging scenarios compile, packaged only into disposable fixture workspaces. | Committed under `conformance/fixtures/<persona>/`. |
| Tuple registry | Carry every packaging support tuple and its evidence-derived status. | Committed queryable data file at `conformance/tuple-registry.json`. |
| Raw artifacts | Hold transcripts, provider logs, temporary workspaces, raw diffs, and lab-session scratch data. | Live in the disposable lab-session workspace, discarded with it by default; raw evidence retained beyond a session goes to the machine-level store's lab area, never repo-local `.make-docs/` (register item D-024). |
| Redacted evidence bundles | Preserve the minimum evidence needed for disputed or stronger support claims. | Opt-in only after review and redaction. |

Do not add lab assets to `packages/docs/template/`, copied `packages/cli/template/`, package allowlists, Rust package surfaces, or provider-backed system asset delivery as part of routine lab work.

## Scenario Specs

This section documents the lab-core `conformance.scenario.v1` contract, which is unchanged. Packaging conformance definitions keep this core verbatim and add a harness-agnostic, domain-qualified shape on top of it — a `<domain>/<outcome>` id, a `packagingExtension` block, and a per-target `targets` map that carries everything naming an execution target — documented in Packaging Conformance Scenarios and the Evidence Bar below. Read this section for the shared fields; read that one for how a real packaging definition is organized on disk.

Every scenario spec must be small enough to review and stable enough to rerun. Use YAML or JSON, but preserve the same field names.

```yaml
schemaVersion: "conformance.scenario.v1"
scenarioId: "docs-assets-install-dry-run"
scenarioVersion: "1.0.0"
title: "Docs assets install dry run"
sourceRequirements:
  - "docs/prd/20-agent-harness-conformance-and-support-claims.md"
safetyMode: "dry-run"
requiresNetwork: false
requiresCredentials: false
destructive: false
prerequisites:
  - "Node.js is installed."
steps:
  - kind: "command"
    run: "npm run validate:defaults -w packages/cli"
expectedEvidence:
  - "Command exits 0."
  - "No raw provider transcript is required."
artifactPolicy: "local-generated"
supportClaimScope: "scenario-harness-model-provider-runtime"
```

Required fields:

| Field | Requirement |
| --- | --- |
| `schemaVersion` | Use `conformance.scenario.v1` until a later accepted change revises the schema. |
| `scenarioId` | Stable lowercase kebab-case id. |
| `scenarioVersion` | Version for meaningful scenario changes. |
| `title` | Human-readable title. |
| `sourceRequirements` | PRD, plan, work, or guide paths that justify the scenario. |
| `safetyMode` | One of the approved safety modes below. |
| `requiresNetwork` | Boolean. `true` means a run can be blocked when network is unavailable. |
| `requiresCredentials` | Boolean. `true` means a run can be blocked when credentials are unavailable. |
| `destructive` | Boolean. Destructive scenarios must target temp fixtures only. |
| `steps` | Ordered commands or human/harness actions. |
| `expectedEvidence` | Observable evidence required for a verdict. |
| `artifactPolicy` | Usually `local-generated`; use `redacted-review-bundle` only after review. |
| `supportClaimScope` | Must stay scoped to the scenario/harness/model/provider/runtime tuple. |

## Safety Modes

Use exactly one safety mode:

| Safety mode | Use for |
| --- | --- |
| `read-only` | Inspection-only scenarios that should not write files. |
| `dry-run` | CLI or harness flows that preview writes without applying them. |
| `temp-fixture-apply` | Writes into a disposable fixture workspace. |
| `destructive-temp-fixture-apply` | Destructive behavior in a disposable fixture workspace only. |
| `external-provider-run` | Runs requiring network access, provider accounts, or harness model routing. |

Never run destructive scenarios against a maintainer working tree. If required credentials, network access, provider accounts, model routing, or harnesses are unavailable, record a `blocked` result instead of inventing evidence.

## Execution Targets and Uncovered-Target Reporting

A scenario definition never names an execution target. A harness becomes a *covered target* for a definition by gaining an entry in that definition's `targets` map (the per-target binding described under The `packagingExtension` Scenario Shape below); a harness with no entry is an *uncovered target*. This target-binding model — since W18 R13 Phase 1 ([PRD 43](../../../prd/43-conformance-scenario-model-and-execution-kits.md); the resolution of register item [D-025](../../../prd/03-open-questions-and-risk-register.md)) — is what replaced the retired copy-per-harness lists: coverage grows by adding target bindings and descriptor knowledge, not by copying a scenario per harness.

The current make-docs harness ids live in `packages/cli/src/types.ts`. Today every packaging definition binds exactly one target:

| Harness id | Product harness | Coverage on the four packaging definitions |
| --- | --- | --- |
| `codex` | Codex | Covered target — bound on all four first-pass definitions (no lab session has run yet). |
| `claude-code` | Claude Code | Uncovered target — no `targets` binding; reported as a gap, not implied coverage. |
| `pi` | Pi | Uncovered target — no `targets` binding; reported as a gap, not implied coverage. |

An uncovered target is *reported*, never silently absent: kit generation for a harness with no binding fails closed naming the gap, `getScenarioTargetBinding` refuses to resolve it, and the registry's scenario-absence notes state the gap queryably (the six Pi tuples carry these notes explicitly). Absence is a statement, not a hole — the structural replacement for the retired `futureHarnesses` list, which implied a hand-maintained copy-per-harness future the tuple model rejects. Do not describe an uncovered target as supported because the scenario names a user outcome the target could one day run: covering Claude Code or Pi means authoring their target bindings and the descriptor lab knowledge those bindings need, then recording real runs — never editing scenario identity.

Adapter ids must stay separate from model names and providers. A Codex run with one OpenAI-routed model, a Claude Code run with one Anthropic-routed model, and a future provider-routed open-weight model are three different support-claim tuples. Until a target has a binding and a reviewed result records the exact scenario/harness/model/provider/runtime tuple that meets the evidence bar, runs for that target are `blocked` or unattempted, and no wording may run ahead of that tuple.

## Result Records

Result records must be compact and tuple-specific. A result for one tuple is not evidence for a different harness, model, provider, runtime, scenario, or scenario version.

```yaml
schemaVersion: "conformance.result.v1"
resultId: "2026-06-25-docs-assets-install-dry-run-codex-gpt5-cli"
scenarioId: "docs-assets-install-dry-run"
scenarioVersion: "1.0.0"
runDate: "2026-06-25"
makeDocsVersion: "1.0.0-rc.1"
harness: "codex"
modelName: "gpt-5"
providerOrRoutingLayer: "openai"
modelVersion: "unknown"
runtimeDistribution: "npm-cli"
runtimeVersion: "node>=18"
producedFiles: []
relevantDiffs: []
exitStatus: 0
transcriptLogPointer: "discarded-with-session"
verdict: "pass"
reason: "The scenario evidence matched the expected result."
caveats: []
reviewerStatus: "reviewed"
supportClaimUse: "nominal-tuple"
```

Required fields:

| Field | Requirement |
| --- | --- |
| `schemaVersion` | Use `conformance.result.v1` until a later accepted change revises the schema. |
| `resultId` | Stable id that includes date, scenario, harness, model, and runtime where practical. |
| `scenarioId` and `scenarioVersion` | Must match the scenario spec. |
| `runDate` | Date of the run. |
| `makeDocsVersion` | Package or repository version under test. |
| `harness` | The agent harness actually used. |
| `modelName` | The selected model name or `unknown` when unavailable. |
| `providerOrRoutingLayer` | Provider or routing layer when known. |
| `modelVersion` | Immutable model identifier when available, otherwise `unknown`. |
| `runtimeDistribution` | Example: `npm-cli`, `local-source`, `mcp`, or `plugin`. |
| `runtimeVersion` | Runtime version, package version, or other reviewed identity. |
| `producedFiles` | Compact list of reviewed output paths. |
| `relevantDiffs` | Compact list or pointer to reviewed diffs. |
| `exitStatus` | Process exit status when a command was run. |
| `transcriptLogPointer` | Machine-level store lab-area pointer, redacted bundle pointer, or `discarded-with-session`; never a repo-local `.make-docs/` path (register item D-024), and do not inline raw transcripts. |
| `verdict` | One of the verdicts below. |
| `reason` | Short explanation for the verdict. |
| `caveats` | Specific limitations that change how evidence may be used. |
| `reviewerStatus` | One of `unreviewed`, `reviewed`, `needs-follow-up`, or `rejected`. |
| `supportClaimUse` | One of `none`, `nominal-tuple`, or `stronger-claim-candidate`. |

## Verdicts and Support Claims

Use exactly one verdict:

| Verdict | Meaning | Support-claim rule |
| --- | --- | --- |
| `pass` | Expected evidence was produced without material caveats. | May support nominal wording for the exact tuple when reviewed. |
| `pass-with-caveats` | Expected evidence was produced with meaningful limitations. | May support only caveated tuple-specific wording when reviewed. |
| `inconsistent` | Runs or evidence conflict. | Does not support public claims. |
| `unsupported` | The scenario cannot work for the tuple under test. | Does not support public claims. |
| `blocked` | Required access, harness, network, credentials, model routing, or safe setup was unavailable. | Does not support public claims and must use `supportClaimUse: none`. |

One passing run is only the minimum threshold for nominal support wording for the exact tuple it records. Repeated reviewed runs are required before stronger commendations. A green package validation run is not a public harness/model support claim without conformance evidence.

Support-claim wording must follow this gate:

| Claim type | Minimum evidence |
| --- | --- |
| No public claim | No reviewed `pass` or `pass-with-caveats` result exists for the tuple. |
| Nominal tuple support | At least one reviewed `pass` result exists for the exact scenario/harness/model/provider/runtime tuple. |
| Caveated tuple support | A reviewed `pass-with-caveats` result exists and the caveats are repeated in public wording. |
| Stronger wording | Repeated reviewed runs exist, the result record uses `supportClaimUse: stronger-claim-candidate`, and any promoted evidence bundle is redacted and linked. |

Do not collapse tuple evidence into blanket wording. A pass for one scenario in Codex does not prove all Codex behavior, a pass for one Claude Code model does not prove every Claude Code model route, and package validation alone does not prove agent-harness support.

For generated Playbook distributables, this gate is realized structurally in the tuple registry described in the next section: a status the recorded evidence does not support fails the registry load. Since W18 R9 Phase 4 the gate's wording half is code as well — see Support-Claim Governance below.

## Packaging Conformance Tuple and Registry

Since W18 R9 Phase 1 ([the phase backlog](../../../work/2026-07-01-w18-r9-playbook-and-package-conformance/01-support-tuple-and-tuple-registry.md)), the packaging conformance extension lives in `packages/cli/src/conformance/` (`tuple.ts`, `registry.ts`) with its data file under the repo-root `conformance/` directory (relocated from `docs/assets/conformance/` on 2026-07-06 per [PRD 43](../../../prd/43-conformance-scenario-model-and-execution-kits.md#canonical-conformance-asset-home)). Phase 1 deliberately registered no new operations: the backlog mandates only the queryable data file, its loader, and query helpers, so the registry is consumed as a library seam by the later-phase scenarios, meta-verification checks, and claim governance — not as a CLI or MCP surface.

### The Eight-Dimension Support Tuple

A support claim for a generated Playbook distributable binds to the exact eight-field tuple — `scenario`, `harness`, `surface`, `scope`, `outputKind`, `generatedOutputKind`, `modelOrProvider`, `runtime` (R-TUPLE-1) — defined in `packages/cli/src/conformance/tuple.ts`. The tuple extends two owned shapes and redefines neither:

- The lab's scenario/harness/model/provider/runtime tuple (PRD 20): `scenario`, `modelOrProvider`, and `runtime` remain run metadata exactly as the result contract above defines them. On a registry tuple they are `null` until a recorded run binds them through `bindRunMetadataOntoConformanceTuple` — the only seam allowed to bind the evidence-owned dimensions, so nothing in packaging or registry code can invent them.
- The packaging lineage's seven-dimension `PackageSupportClaimTuple` (W18 R8 Phase 4, PRD 36 R-PROV-3): the packaging dimensions — harness, surface, scope, output kind — are consumed from that shape through `bindConformanceSupportTuple`, and a parity test pins the dimension relationship so the two lineages cannot drift apart silently. See [Playbook Packaging and Harness Adapters](./playbooks-development-packaging-and-harness-adapters.md) for the claim-tuple side.

The one added dimension is `generatedOutputKind`: the ownership-record kind of the artifact actually generated (`generated-plugin`, `generated-skills-bundle`, and the exposure and export kinds), reusing the packaging vocabulary rather than minting a new one. It separates what was produced from what was requested (`outputKind`), so evidence for a generated plugin never silently covers its exposure or export artifacts. Two implementer decisions (D8 freedoms) are recorded on the module: a registry tuple's `surface` is always concrete — `bindConformanceSupportTuple` refuses an unresolved `auto` surface because a resolution request is not a surface a harness recognizes, making such a claim broader than any evidence (R-TUPLE-1) — and tuple identity is the ordered dimension values joined with `/`, unbound dimensions spelled `~` (`conformanceTupleKey`), so identity is deterministic and queryable without parsing.

### The Tuple Registry Data File

The set of tuples and their statuses lives in one committed data file, `conformance/tuple-registry.json` (R-REG-1) — a single versioned JSON document, an implementer format choice per D8 so any tool can query it without a parser dependency. [The conformance assets README](../../../../conformance/README.md) documents the entry shape. `packages/cli/src/conformance/registry.ts` owns the schema, the statuses, and the derivation rules, and provides the fail-closed zod loader (`loadConformanceTupleRegistry`) plus the query helpers (`queryConformanceTuples`, `getConformanceTupleEntry`).

The file and the code are drift-proofed against each other in both directions:

- The file redundantly embeds the R-REG-2 status meanings and R-REG-3 verdict-derivation rules as data, and validation compares the embedded copies byte-for-byte against the code's canonical constants — an edit to either side alone fails the load.
- Statuses are stored AND rederived: every entry records its status, and validation recomputes `deriveConformanceTupleStatus` from the entry's evidence, failing closed on any mismatch. A `conformance-validated` status without a qualifying recorded run is therefore structurally impossible — and since Phase 3 the R-TEST-1 meta-verification check asserts it as an enforcing test with receipts (see Test Layers and Meta-Verification below).
- Duplicate tuples are refused: the canonical tuple key enforces one entry per exact tuple.

### Status Derivation Rules

Each tuple carries exactly one of three statuses (R-REG-2), derived — never asserted — from its evidence (R-REG-3, R-BAR-2):

| Status | Requires |
| --- | --- |
| `conformance-validated` | A recorded run with verdict `pass` — or `pass-with-caveats` whose caveats are surfaced — that asserts all four D4 evidence-bar stages: `install`, `discover`, `invoke`, `uninstall` (R-BAR-1). |
| `implementation-validated` | `internal-test` evidence refs only: repository test files proving the generated files and structure. Internal tests are never harness-recognition evidence (R-LAYER-2, PRD 36 R-TEST-5). |
| `provisional` | Everything else — no conformance evidence yet; the output may be generated but its recognition and usability are unverified. |

The lab's five verdicts are consumed unchanged: `inconsistent`, `unsupported`, and `blocked` never advance a tuple, and a scenario that cannot run reports `blocked` — honest absence of evidence, not evidence. A non-qualifying run neither advances nor demotes a tuple; it stays recorded as history.

### Evidence Kinds and Real-Harness Probes

Non-run evidence refs carry one of two kinds. `internal-test` refs are the only support for `implementation-validated` and must name the repository test file that proves the generated output. `real-harness-probe` refs record out-of-protocol real-harness observations — positive or negative — that inform and warn but never move a status in either direction. The first probe on record is negative: the 2026-07-03 hand-run Codex v0.142.4 recognition probe (register item [R-021](../../../prd/03-open-questions-and-risk-register.md)) rides the `codex-plugin-native-project` tuple with a governance note that its subject must never be worded as recognized; it opens the first-pass packaging definitions' Codex target bindings rather than substituting for them.

### Historical Seed

The registry is seeded with the exact first-party descriptor placement matrix from W18 R8 — twenty tuples (seven Codex, seven Claude Code, six Pi), parity-tested against `FIRST_PARTY_HARNESS_CAPABILITY_DESCRIPTORS` so the seed cannot silently miss or invent a placement. The honesty posture:

- Zero tuples are `conformance-validated`: no real-harness evidence bar has been met anywhere.
- Five tuples are `implementation-validated`, each citing the W18 R8 write-path file-and-structure tests with a boundary note that the evidence is never harness recognition.
- Fifteen tuples are `provisional`, each with a note naming the specific evidence gap.
- Export-only tuples bind `generatedOutputKind` to the export-only file kind, keeping the requested-versus-produced distinction visible in the tuple itself.

Seeding Pi tuples does not change the adapter-protocol table above: Pi remains a future lab adapter target, and its registry entries exist precisely to state, queryably, that nothing beyond internal structure tests is proven for it.

### Registry Boundary and Ownership

The registry follows the same maintainer-only boundary as the rest of the repo-root `conformance/` family (R-KEEP-1): it is in-repo project content edited in place, deliberately NOT authored upstream in `packages/docs/template/`. This is a stated exception to the maintainer repo's upstream-first dogfooding rule, recorded in [the W18 R9 backlog index](../../../work/2026-07-01-w18-r9-playbook-and-package-conformance/00-index.md), because conformance is maintainer evidence infrastructure, not shipped product. The registry must stay out of the shipped template, the packaged copy, and npm tarballs; since Phase 3 the R-TEST-3 exclusion check enforces that boundary outward on three surfaces (see Test Layers and Meta-Verification below).

## Packaging Conformance Scenarios and the Evidence Bar

Since W18 R9 Phase 2 ([the phase backlog](../../../work/2026-07-01-w18-r9-playbook-and-package-conformance/02-evidence-bar-and-first-pass-scenarios.md)), the D4 install-discover-invoke-uninstall evidence bar is implemented as the packaging scenario shape in `packages/cli/src/conformance/scenario.ts`. Since W18 R13 Phase 1 ([PRD 43](../../../prd/43-conformance-scenario-model-and-execution-kits.md), [the phase backlog](../../../work/2026-07-06-w18-r13-conformance-execution-and-lab-session-redesign/01-asset-reorganization-and-spec-migration.md)), the scenario model is **definitions by domain, evidence by target** (R-ORG-1..2; the resolution of register item [D-025](../../../prd/03-open-questions-and-risk-register.md)): a scenario definition is harness-agnostic and names a user outcome, never an execution target, and its authored data lives under `conformance/scenarios/<domain>/` — `packaging` is the first and only current domain, with `playbook-runs` the named future domain, created only when its first definition lands. [The conformance assets README](../../../../conformance/README.md) documents the on-disk formats; this section documents the contracts and seams a maintainer extends.

### The `packagingExtension` Scenario Shape

A packaging scenario definition keeps the lab's `conformance.scenario.v1` schema verbatim — every required field above with its exact name and meaning — and adds one additive `packagingExtension` block, so the extension boundary is visible in the data itself (R-SCOPE-1). The `scenarioId` is domain-qualified — `<domain>/<outcome>`, both parts lowercase hyphenated slugs with no harness token anywhere, split by the `splitConformanceScenarioId` helper — and the extension's required `domain` field must equal the id's domain prefix (R-ORG-1). Two D8 implementer decisions fix the format: one JSON document per definition (matching the registry's no-parser-dependency choice), and the file must live at its id path `conformance/scenarios/<domain>/<outcome>.json` so definitions stay addressable without opening them; `loadPackagingConformanceScenarioSpecs` recurses the domain layout and fails closed on a definition file outside a domain subdirectory, an empty tree, or a duplicate id, so absence can never read as coverage. The extension declares:

- the definition-level, target-independent fields: `domain`; per-stage `evidenceBar` assertion lists for `install`, `discover`, `invoke`, and `uninstall`; `transcriptPolicy: "json-or-non-tty"`; `workspacePolicy: "disposable-fixture-workspace"` (nothing destructive ever runs against a maintainer working tree, R-KEEP-1); `fixturePlaybooks` (repo-relative v2-form source Playbooks the scenario packages); and the precondition template (see Preconditions and Honest Blocked Runs below);
- `targets`: the per-target bindings, keyed by harness id (R-SCHEMA-1). Everything that names an execution target lives here and only here: each binding carries the `registryTupleIds` its runs may land on, its `harnessExecution` mode, the concrete `preconditionProbes` for the template's probeable preconditions — validated exhaustive-and-exact, so a probeable precondition without a probe command, or a probe command for an attestation-only or undeclared precondition, fails the load — optional target-specific `parameters` consumed by kit generation, and an optional `discoveryKit` (see below).

A harness with no entry in `targets` is an uncovered target: `getScenarioTargetBinding` fails closed naming the gap, and the registry's scenario-absence notes report it — a reported gap, never implied coverage (R-SCHEMA-2, preserving PRD 43 R-SCEN-2's absence-must-be-reported rule structurally). This rule replaces the retired `futureHarnesses` list; Claude Code and Pi are currently uncovered targets on all four packaging definitions.

The schema is `.strict()` and fails closed on dishonest, stale, or superseded specs: the retired spellings — top-level `harness`, `harnessExecution`, `registryTupleIds`, `futureHarnesses`, and `characterization` — are rejected rather than silently ignored; the retired `--write` flag is rejected anywhere in a command step (scenario scripts use the PRD 39 `plan`/`preview`/`write`/`ship` grammar); a command step tagged `evidence-json` must literally pin `--json` so rendered TTY text never enters evidence (register item R-026); a `destructive` scenario must use the `destructive-temp-fixture-apply` safety mode; and `requiresNetwork`/`requiresCredentials` without a matching precondition kind is invalid.

Bar eligibility is a property of the spec, checked by two helpers: `listUnassertedEvidenceBarStages` returns the stages a spec declares no assertion for, and `scenarioAssertsFullEvidenceBar` is true only when all four stages carry assertions. The bar is exactly install, discover, invoke, and uninstall (R-BAR-1) — a spec asserting anything less can never advance a tuple, because the recording seam below refuses a run claiming a stage its scenario does not assert and qualification requires all four stages.

### Result Records and the Recording Seam

Packaging result records keep the lab's `conformance.result.v1` fields verbatim and add only additive fields: the per-stage `evidenceBar` booleans, `caveatsSurfaced`, `simulated` with `simulationMechanicsRef`, and `transcriptFormat` (`json` or `non-tty`). A `blocked` record must carry `supportClaimUse: "none"` and an all-false evidence bar — blocked is honest absence of evidence, not evidence.

Committed evidence organizes by execution target (R-ORG-2): a record lives at `conformance/results/<harness>/<YYYY-MM-DD>-<outcome-slug>-<seq>.json`, with the path derived by `conformanceResultRecordRelativePath` in `packages/cli/src/conformance/governance.ts` (the sequence is zero-padded to three digits — a recorded implementer decision — so records sort stably within a day) and the model-or-provider and runtime dimensions inside each record; deeper nesting is deferred until volume demands it. The layout is storage, not a second query surface — the tuple registry remains the single queryable index across all targets — and no directory is pre-created: zero result records exist today, so the first `<harness>/` directory appears with the first committed record. The governance claim-use walk recurses this layout, so a nested record can never sit outside the claim-use gates.

`recordConformanceRunOnRegistryEntry` is the single seam between a result record and a Phase 1 registry entry (R-REG-3, R-BAR-1..2). A qualifying run — verdict `pass`, or `pass-with-caveats` with surfaced caveats, meeting all four bar stages — advances the tuple to `conformance-validated` and binds the evidence-owned tuple dimensions (`scenario`, `modelOrProvider`, `runtime`) from its run metadata through `bindRunMetadataOntoConformanceTuple`; a non-qualifying run (including `blocked`) is appended as honest history and advances nothing, and internal-test evidence stays capped at `implementation-validated` by the Phase 1 derivation this seam reuses rather than reimplements. The seam fails closed on every mismatch that could make a claim broader than its evidence:

- the record must belong to the given scenario, and the record's harness must have a target binding in the scenario whose `registryTupleIds` include the entry — evidence never crosses harnesses (R-TUPLE-1), and an uncovered target cannot even produce a bindable record;
- the record may not claim a bar stage the scenario does not assert, so an incomplete scenario structurally cannot advance a tuple (R-BAR-1);
- the record's simulation posture must match the target binding's declared harness-execution mode;
- a qualifying run may not land on an entry already bound to a different scenario.

### Simulation Posture

The faithful-simulation mechanics allowance (D8) is a reviewed spec-level contract, never a per-run improvisation. Each target binding declares `real-harness` or `faithful-simulation` in its `harnessExecution`; the simulation mode must document its reviewed mechanics in the binding, every result record and recorded run states `simulated` (with a `simulationMechanicsRef` naming the mechanics used), and the recording seam refuses a run whose posture disagrees with its target binding's declared mode. All four first-pass definitions' Codex bindings declare `real-harness`: no faithful simulation of Codex exists, so simulation never silently substitutes for the real harness, and the registry's embedded verdict-derivation rules carry the simulation clause as drift-checked data.

### Preconditions and Honest Blocked Runs

Every packaging precondition is declared once, in the definition-level template, with the embedded rule `onUnmet: "blocked"` (R-KEEP-1). The template marks each precondition probeable (`probe: "command-succeeds"`, covering harness CLI availability and authentication) or attestation-only (`probe: "operator-attestation"` for `network` and `model-routing`, which cannot be probed without spending them) — and the concrete probe command for each probeable precondition lives on each target binding, so harness knowledge never enters the definition body. An attestation is satisfied only when the operator explicitly names the precondition id at run time, so an unattended probe honestly resolves `blocked` by default. `probePackagingScenarioPreconditions` evaluates the declared set against one target's probe commands (with an injectable executor for tests), and `blockedPackagingResultRecord` turns an unmet report into a valid `blocked` result record — verdict `blocked`, `supportClaimUse: "none"`, all-false bar, model and provider `unknown` because no run reached a model, and a default transcript pointer of `discarded-with-session` (`CONFORMANCE_TRANSCRIPT_DISCARDED_WITH_SESSION`), because a blocked-before-execution session produced no transcript to keep and no default ever names a repo-local transcript home (register item D-024) — which recording on a tuple never advances. It also fails closed for an uncovered harness: even a blocked record may not imply a target binding that does not exist (R-SCHEMA-2).

### The Four Required First-Pass Definitions and the R-021 Discovery Kit

The four required first-pass outcomes (PRD 43 R-SCEN-1 and R-SCHEMA-3) are fixed in `REQUIRED_FIRST_PASS_SCENARIOS`, keyed by their domain-qualified ids — `packaging/plugin-marketplace-install`, `packaging/skills-bundle-discovery-invocation`, `packaging/dependency-check-both-directions`, `packaging/uninstall-backup-cleanliness` — and mapped to the user-visible outcome each must prove, with `REQUIRED_FIRST_PASS_TARGET` fixing Codex as the target every required definition must bind and `listMissingRequiredFirstPassScenarioIds` feeding the R-TEST-2 runnability check — absence of any definition is a failure, never a silent gap. All four are authored (`scenarioVersion` 2.1.0, harness-agnostic prose), `external-provider-run`, non-destructive, bar-complete, precondition-guarded, and bound to exactly one target today, Codex; none has run yet.

The frozen Playbook package commands are projected statically against the current CLI parser, registry adapter, and input schema. P6 does not assert that these legacy commands are executable as written. Workspace setup keeps their legacy-writer operations quiesced through P6-P10. P8 owns removal of these conformance surfaces or an owner-approved retargeting. Historical evidence remains: W18 R13 Phase 2 drove the ship steps through the real pipeline under dry-run and found two latent defects. The probe fixture's `scenario-spec` reference prose parsed as a repository path, and all four definitions lacked the `make-docs setup --yes` workspace-establishment step. The committed definitions fixed both at `scenarioVersion` 2.1.0.

The README's scenario table names each definition and outcome; three details matter to maintainers:

- `packaging/plugin-marketplace-install`'s Codex target binding carries the `discoveryKit` — the renamed and generalized characterization preamble (PRD 43 R-DISC-1), preserving the `resolvesProbe` linkage to the negative Codex v0.142.4 recognition probe (register item [R-021](../../../prd/03-open-questions-and-risk-register.md)) verbatim. Before any bar assertion, the session pins the Codex version, hand-authors a minimal plugin from the Codex docs independent of Make Docs, varies marketplace source shapes until Codex accepts one, records that ground truth, and diffs the generated shapes against it. Divergences are compiler or descriptor defects to fix — discovery findings feed descriptor corrections, never bar relaxations — so a failure distinguishes wrong generated shapes from a harness capability gap.
- `packaging/dependency-check-both-directions` binds its expectations to the v2 probe-based checks (PRD 34 R-DEP-3): its fixture set includes an `rg` dependency whose `source` prose begins with "ripgrep" (a check derived from prose would probe the wrong binary) and a deliberately absent probe target for the missing direction.
- `packaging/uninstall-backup-cleanliness` owns the PRD 36 R-PROV-2 cleanliness scenario this lineage was assigned: backup plus removal with orphan-directory and user-authored-sentinel assertions.

### Planned-Scenario Linkage and Scenario Absence

Registry entries carry a `plannedScenarios[]` field: domain-qualified ids of authored definitions whose target binding for the entry's harness targets the tuple — the registry loader rejects an id that is not domain-qualified (R-SCHEMA-3). The linkage is forward-looking only — a planned scenario is not evidence, never affects status derivation, and never binds the tuple's `scenario` dimension; only a recorded run does (R-TUPLE-1). An explicitly empty list is itself a statement: no authored definition binds the tuple's harness, so absence is reported rather than implied as covered (R-SCEN-2 as re-expressed by R-SCHEMA-2) — the six Pi entries additionally carry scenario-absence notes naming Pi as a reported uncovered-target gap. `listConformanceScenarioRegistryLinkageErrors` enforces the linkage bidirectionally: every planned id must resolve to an authored definition whose binding for the entry's harness lists the entry back, and every binding's `registryTupleIds` must resolve to an entry that plans it.

### Raw Evidence and the Lab-Session Workspace

Raw transcripts, provider logs, temporary workspaces, raw stdout/stderr captures, and scratch diffs live in the disposable lab-session workspace and are discarded with it by default (register item D-024; [PRD 44](../../../prd/44-conformance-lab-sessions-and-evidence.md) owns the protocol): the repo-local `.make-docs/conformance/` home mandated by the earlier lineage is rejected — no packaging code default names it, and the blocked-record transcript pointer defaults to `discarded-with-session`. Deliberately redacted-and-promoted evidence lands in the committed result records under `conformance/results/<harness>/`, and raw evidence retained beyond a session goes to the machine-level store's lab area, never to repo-local `.make-docs/`. Since W18 R13 Phase 2 the vocabulary and homes are code — see Lab Sessions and Evidence Homes below; the operator-modes documentation (`conformance/operator-modes.md`, PRD 44 R-MODE-2) lands with a later W18 R13 phase.

Do not commit credentials, unredacted provider logs, full private transcripts, temporary workspaces, or raw local scratch output. If evidence must become durable, create a compact reviewed result record and promote only redacted, minimal supporting material.

## The Execution Kit and Lab Sessions

Since W18 R13 Phase 2 ([the phase backlog](../../../work/2026-07-06-w18-r13-conformance-execution-and-lab-session-redesign/02-execution-kit-instruments-and-lab-sessions.md)), the executable projection of a scenario definition is a generated per-target conformance kit (PRD 43 R-KIT-1..3, R-INST-1..2, R-PROMPT-1, R-DISC-1, R-HOME-1..2), implemented in `packages/cli/src/conformance/kit.ts` with the lab-session vocabulary and evidence homes in `packages/cli/src/conformance/lab-session.ts` ([PRD 44](../../../prd/44-conformance-lab-sessions-and-evidence.md) R-NAME-1..2). A kit is generated on demand for one (definition, target) pair — or one target's full first-pass suite — into a disposable lab-session root that must lie outside the repository, with the fixed R-KIT-2 layout: `<session-root>/kit/` (the rendered session prompt, the per-stage instruments, the session manifest, and a rendered step script), `<session-root>/workspace/` (the materialized fixture project the target harness operates in), and `<session-root>/evidence/` (instrument outputs and transcripts). Nothing a session produces is ever written under the repository, and discarding the session root discards every session artifact. Tests over generated kits live in `packages/cli/tests/conformance-kit.test.ts` and `packages/cli/tests/conformance-lab-session.test.ts`, including a full Codex first-pass suite generation and byte-determinism pins (equal inputs yield byte-identical kits: no clock, no randomness, no absolute paths in kit output).

### Kit Generation Home: Maintainer Tooling Only

Kit generation is maintainer lab tooling, deliberately NOT a shipped operation (R-HOME-1): it is invoked through `npm run conformance:kit` (`packages/cli/scripts/conformance-kit.ts`), registers nothing in the operation registry, and adds nothing to the CLI command tree or MCP surface — shipping it would advertise a maintainer-lab capability whose required assets the R-TEST-3 exclusion check structurally keeps out of every install, the D-022 category error repeated at the command level. The W18 R11 parity rule is preserved vacuously, asserted by `listConformanceLabShippedSurfaceViolations`, which fails the standard suite if any registry identifier or `run` CLI adapter ever names a conformance-lab surface; the revisit seam is recorded on register item [Q-022](../../../prd/03-open-questions-and-risk-register.md). Generation isolates the machine-level Store for its duration. The real session workspace binds setup to session-local Store state and keeps the resulting quiescence barrier active. P6 does not create a second proof workspace or run frozen Playbook package operations. A future non-Playbook packaging conformance design requires new owner authority.

### Executable by Construction

Every command a kit emits derives from the registered operation surface and the harness capability descriptors. Current static projection fails before session start when a definition does not match the real public surface (R-KIT-3), in two layers:

1. **Static projection.** `make-docs run` commands project through the registry-derived resolver, the authored CLI adapters, and each operation's input schema (`adaptRunCliArgv`); other `make-docs` commands project through the real CLI parser (`validateMakeDocsCliArgv`). A definition that cannot project to an accepted command sequence fails generation closed, naming the definition, target, and unprojectable element — including the uncovered-target case where the harness has no `targets` entry and the descriptor-gap case where the target's interrogation block lacks knowledge the kit needs.
2. **Workspace materialization.** The definition's leading workspace-establishment steps are executed — not re-transcribed — to materialize `workspace/`, so the committed step text stays the single source and hand-transcription drift (the D-023 root cause) cannot recur.
Tests pin fail-closed static projection, active session quiescence, migration safety, and byte-identical kit output for equal inputs. A failed generation removes any session artifacts it created before rethrowing, so no half-generated kit survives. No kit-local table of harness facts exists: every harness-specific string in kit output traces to a verified current source. P6 does not run the frozen package operations for conformance proof. P8 owns removal of the legacy package conformance surfaces or an owner-approved retargeting. A future non-Playbook packaging proof needs new owner authority.

### Instruments: Deterministic, One per Bar Stage

Each asserted bar stage has exactly one instrument script in `kit/instruments/`, a self-contained Node script (`node:` builtins only — no third-party imports, no network modules, no clock, no randomness) whose machine-verifiable output lands under `evidence/` in a form the manifest's expected-evidence table names (R-INST-1):

| Stage | Instrument measurement |
| --- | --- |
| `install` | Exit codes of the install commands plus a file inventory of the harness-visible placement roots. |
| `discover` | A capture of the harness's own listing surface — command output, directory listing, or manifest read, per the descriptor interrogation block's listing-capture forms. |
| `invoke` | The fixture skill's deterministic invocation marker (the `conformance-skill-probe` fixture's `MAKE-DOCS-CONFORMANCE-*` spellings) captured as a probe file — fixture facts, not harness facts. |
| `uninstall` | A byte-level before/after diff of the placement roots and the workspace, plus the make-docs-managed file set captured from the workspace manifest *before* removal (register item [D-026](../../../prd/03-open-questions-and-risk-register.md)), proving managed outputs removed, user content untouched, and no orphaned managed directories. |

Instruments capture; they never interpret (R-INST-2). No instrument opens a network connection or invokes model routing, any CLI output an instrument consumes pins `--json` (the PRD 39 agent-invariance rule carried into evidence), and interpretation happens only at the Phase 3 ingestion step, which validates instrument outputs against the manifest's expected-evidence table.

A **preflight instrument** (`kit/instruments/preflight.mjs`) runs first, before any setup or bar-stage instrument: it compares `make-docs --version` to the manifest's `generationInputs.cliVersion` and refuses loudly (exit non-zero, with `just install-cli-pack` reinstall guidance) on a mismatch or error, so a stale or mismatched global `make-docs` cannot silently corrupt a run (register item [D-027](../../../prd/03-open-questions-and-risk-register.md)). The rendered `session-steps.sh` runs it as its first line, and ingestion refuses a session whose preflight recorded `ok:false`.

### The Prompt Set: The Agent Drives, the Instruments Measure

The rendered session prompt carries a target-agnostic core (R-PROMPT-1; PRD 44 R-EXEC-1..3): the session narrative, the honesty rules verbatim (blocked is a valid result; failures are evidence; assertions never relax — `CONFORMANCE_PROMPT_HONESTY_RULES`, pinned verbatim by tests against the rendered prompts), the instruction to perform its own discovery and assessment, when to run each instrument, and the named R-EXEC-1 rule stated to the target agent directly: self-assessment is never self-attestation — the agent's claims ("the skill appeared", "the plugin installed") are narrative context, never evidence, and a bar stage with no instrument output is unasserted, full stop. Harness specifics — names, paths, launch and version commands, workspace notes — render per target from the descriptors. The prompt tells the target agent to attempt, observe, and narrate; it never asks the agent to certify. Uninstrumentable stages are recorded caveats on the result record, never trust fallbacks (R-EXEC-2), and unmet preconditions still resolve to an honest `blocked` record exactly as before (R-EXEC-3) — the redesign changes who drives, not what counts.

### The Discovery Kit

The characterization plan on `packaging/plugin-marketplace-install`'s Codex binding generates as a discovery-kit variant (R-DISC-1): a kit whose session precedes bar assertion and records ground truth — pin the harness version, hand-author a minimal plugin from the harness's own docs independent of Make Docs, vary marketplace source shapes until one is accepted, capture the accepted shape, then diff the generated shapes against it. The generated Codex plugin kit carries the discovery prompt and instrument alongside the session kit, with the `resolvesProbe` linkage to register item [R-021](../../../prd/03-open-questions-and-risk-register.md) preserved verbatim in the session manifest. Discovery findings feed descriptor corrections — re-triggering contract-digest re-verification — never evidence-bar relaxations.

### Lab Sessions and Evidence Homes

The operational envelope is a lab session — session id, session workspace, session evidence, session manifest (R-NAME-1). "Run" survives in exactly two prior meanings that do not change: the registry's `recordedRuns` evidence noun and the `run` CLI command; no new artifact, path, or identifier uses "run" for lab operations. `packages/cli/src/conformance/lab-session.ts` owns the vocabulary as code:

- Session ids are deterministic `<date>-<harness>-<outcome>` slugs (`mintConformanceLabSessionId`), so retained-session paths stay readable without a clock or randomness inside generation.
- The default session root is under the OS temp directory (`defaultConformanceSessionRoot`), never under a repository and never under repo-local `.make-docs/`; a session retained beyond its run lands in the machine-level store's lab area at `<store-root>/conformance-lab/sessions/<session-id>/` (`retainedConformanceLabSessionPath`) — a narrowly named location that adds no store schema (R-NAME-2; PRD 38 consumed unchanged).
- `listConformanceTranscriptLogPointerErrors` validates a result record's `transcriptLogPointer` against the D-024 rule: exactly two shapes are honest — the literal `discarded-with-session` or a path inside a store lab area — and a pointer naming repo-local `.make-docs/conformance/` fails with D-024 named.

The repo-local transcript home is retired everywhere live (register item [D-024](../../../prd/03-open-questions-and-risk-register.md)): the `.gitignore` entry for `.make-docs/conformance/` is removed (the adjacent `.make-docs/runs/` entry, which belongs to the store-migration lineage, is preserved), the default transcript pointer in `packages/cli/src/conformance/scenario.ts` states `discarded-with-session`, and the `.make-docs/conformance/` commentary in `packages/cli/src/conformance/registry.ts` is updated — a grep for `.make-docs/conformance` over `.gitignore`, `packages/cli/src/`, and `packages/cli/tests/` returns no hits. The compiled package's embedded `.make-docs/conformance.json` record is an unrelated generated file inside distributables and is untouched.

### Fail-Closed Ingestion

Since W18 R13 Phase 3 ([the phase backlog](../../../work/2026-07-06-w18-r13-conformance-execution-and-lab-session-redesign/03-ingestion-and-operator-modes.md)), ingestion closes the loop from a driven lab session to the registry, implemented in `packages/cli/src/conformance/ingestion.ts` (PRD 43 R-ING-1..2; [PRD 44](../../../prd/44-conformance-lab-sessions-and-evidence.md) R-EXEC-1..3). `ingestConformanceLabSession` reads a session's `evidence/` and `kit/manifest.json` and assembles a `conformance.result.v1` record, and it is where "the agent drives, the instruments measure" becomes enforceable: each asserted bar-stage boolean derives **solely** from that stage's instrument outputs, validated against the manifest's expected-evidence table. A missing or failed instrument output for an asserted stage yields `false` — there is no narrative rescue. The per-stage measurement is deterministic: install confirms only when every install command exited 0 and files were placed under the descriptor-declared roots; invoke confirms only when the driver-saved harness transcript contains every expected marker verbatim; uninstall confirms only when removal commands exited 0, managed outputs were removed with no orphaned managed directories, and no user-authored file was changed or deleted — where a removal counts as user-authored only when it is outside the make-docs manifest's managed-file set (captured before removal), the placement roots, and `.make-docs/`, so setup-managed scaffolding removed by `setup remove` is not mislabeled a user deletion (register item [D-026](../../../prd/03-open-questions-and-risk-register.md)); discover is governed by the honesty rule below. The verdict is derived from the measured bar, never from anything attested — every asserted stage confirmed with no caveats is `pass`, confirmed with surfaced caveats is `pass-with-caveats`, anything short is `unsupported` (advancing no tuple); records are minted `reviewerStatus: unreviewed`, since review is a separate maintainer gate. Ingestion also refuses outright when the session's preflight recorded a make-docs CLI mismatch (`evidence/preflight/preflight.json` `ok:false`), rather than assembling a misleading `unsupported` record from a wrong-binary run (register item [D-027](../../../prd/03-open-questions-and-risk-register.md)).

Everything the driving agent or human contributes is recorded as an **attestation, structurally separate from the measurements**, and can never turn a `false` measurement true (R-EXEC-2). `ConformanceOperatorAttestations` carries the run metadata (model, provider, runtime), the `attestedPreconditionIds` (the `operator-attestation` preconditions — network, model routing — the operator explicitly attests), and the narrative `reason`; `ConformanceIngestionAssembly` (schema `conformance.ingestion-provenance.v1`, `CONFORMANCE_INGESTION_PROVENANCE_SCHEMA_VERSION`) holds the measured stages apart from the attested metadata as a committable audit trail, written beside the record as `<record>.provenance.json` when requested. Uninstrumentable-stage gaps become caveats on the record, feeding the existing `pass-with-caveats` surfaced-caveats rules — say-so never substitutes for a missing instrument.

Blocked honesty holds end to end (R-EXEC-3): an `operator-attestation` precondition the operator did not attest, or a probeable precondition the operator reports unmet, resolves the session to an honest `blocked` record through the same `blockedPackagingResultRecord` machinery W18 R9 enforces — `supportClaimUse: none`, an all-false evidence bar, model and provider `unknown` — advancing no tuple. Attestation preconditions default to unmet, so an unattended session honestly blocks rather than assuming expensive preconditions hold.

### The Discover Honesty Rule

The load-bearing distinction ingestion enforces (register item [R-021](../../../prd/03-open-questions-and-risk-register.md)): a bar stage is confirmable only by an instrument that measures the thing the stage asserts. `install`, `invoke`, and `uninstall` assert directly-measurable facts — Make Docs wrote files, the harness produced a deterministic marker in its own transcript, Make Docs removed its files cleanly. `discover` asserts something different: **harness recognition** — that the harness's own listing surface shows the installed package. A directory listing or manifest read of a path Make Docs itself wrote only re-observes **placement** (the same fact install already measured); a non-empty `.codex/plugins/` listing proves *we wrote files*, never that the harness *found* them. So `measureDiscoverStage` confirms discover only from a genuine harness-listing capture — a `command-output` capture, the harness running its own listing command and reporting what it sees — that is `verified`, exited 0, and names the package id; `directory-listing` and `manifest-read` captures never confirm discover on their own.

Codex today has no verified machine-readable listing command: its descriptor's listing captures are file surfaces, and its workspace-plugins view is an interactive UI observation that stays narrative context. So a Codex session cannot reach an instrument-confirmed discover — the stage ingests to `false` with a caveat naming exactly why, harness recognition stays unverified (R-021), and the tuple honestly does not advance to `conformance-validated` on the strength of placement alone. This is the redesign's whole point restated at the ingestion layer: "files were written" never masquerades as "the harness recognized them."

### The Recording Seam Is Unchanged

Ingestion mutates nothing (R-ING-2). The assembled record is validated against the existing result contract before it goes anywhere; `writeConformanceResultRecord` commits it under `conformance/results/<harness>/` (the committed evidence class, distinct from disposable session artifacts); and `bindIngestedResultToRegistryEntry` is a thin, explicit pass-through to the one unchanged seam, `recordConformanceRunOnRegistryEntry`, so the ingestion tooling never grows a second registry-mutation path. Every refusal that seam enforces — unasserted stages, tuple or harness mismatch, overclaim, simulation-posture mismatch — fires unchanged, and the R-TEST-1 receipts discipline (the committed record resolves, validates, and projects back byte-equal) applies as-is. Ingestion itself never writes to the registry; persisting a bound entry stays a separate reviewed step. Tests over the honesty rules — placement-only discover to `false`, recognition-ok to `true`, attestations never flipping a measured boolean, blocked honesty, and record round-trip — live in `packages/cli/tests/conformance-ingestion.test.ts`.

Kit generation and ingestion are both maintainer lab tooling, deliberately off the shipped surface (R-HOME-1): ingestion is invoked through `npm run conformance:ingest` (`packages/cli/scripts/conformance-ingest.ts`), registers no operation, and adds nothing to the CLI command tree or MCP surface, exactly like `conformance:kit`. The revisit seam for both generators is recorded on register item [Q-022](../../../prd/03-open-questions-and-risk-register.md).

### Operator Modes

The three execution modes are documented as executable protocol content in [`conformance/operator-modes.md`](../../../../conformance/operator-modes.md) ([PRD 44](../../../prd/44-conformance-lab-sessions-and-evidence.md) R-MODE-1..2) — this guide summarizes and links rather than duplicating. All three produce evidence through the same kit, instruments, and ingestion path, and each restates the R-EXEC-1 rule that only instrument outputs are evidence:

- **Human-only** — the manual fallback: one maintainer with a real harness install generates the kit, performs every step from the generated `kit/prompts/session-prompt.md`, runs each instrument by hand, and authors the attestations file. The generated kit is the source of the Codex-specific steps — no hand-maintained runbook is kept, since that is exactly the drift executable-by-construction prevents. The three defects the earlier (now-removed) codex-* walkthrough surfaced are preserved in D-023's evidence record and are supplied by kit generation.
- **Human plus assisting agent** — the work splits along the evidence boundary: the agent does the deterministic non-harness work (kit generation, workspace preparation, running the instruments, ingestion) while the human drives the target harness's own flows and narrates what it did. The agent's job is explicitly not to certify any stage.
- **Agent-multiplexed** — an orchestrating agent drives end to end through a terminal-multiplexer tool consumed as an environment capability, never built or shipped by Make Docs; everything it observes through the multiplexer is narrative context, only instrument outputs are evidence.

## Test Layers and Meta-Verification

Since W18 R9 Phase 3 ([the phase backlog](../../../work/2026-07-01-w18-r9-playbook-and-package-conformance/03-test-layer-separation-and-meta-verification.md)), the evidence honesty this guide describes is policed structurally by two modules in `packages/cli/src/conformance/`: `layers.ts` carries the three-layer vocabulary as data (R-LAYER-1..2), and `meta-verification.ts` carries the D9 checks over the checks (R-TEST-1..3). Both run ENFORCING in the standard suite through `packages/cli/tests/conformance-meta-verification.test.ts`, so a regression in the committed registry, the required scenario set, a suite's layer attribution, or the shipping boundary fails the build. A green meta-verification run proves the evidence machinery is honest — never that any harness recognizes any output (R-KEEP-1, R-LAYER-2).

### The Three Named Test Layers

Coverage is organized into three named layers so one layer's passing never masquerades as another's (R-LAYER-1):

| Layer | Covers | Where it lives |
| --- | --- | --- |
| `unit` | The operation core, parser, and validator as pure functions without a CLI. | Automated repository tests under `packages/cli/tests/`. |
| `integration` | The CLI and MCP surfaces over the core, including the manifest and exposure plumbing. | Automated repository tests under `packages/cli/tests/`. |
| `conformance` | The real-harness user outcome per tuple through the maintainer lab. | Repo-root `conformance/` — never an automated repository test. |

The vocabulary is code, not prose: `CONFORMANCE_TEST_LAYERS` and `CONFORMANCE_TEST_LAYER_MEANINGS` fix the names and meanings, `REPOSITORY_TEST_LAYERS` restricts what a repository suite may claim to `unit` and `integration` only, and `TEST_LAYER_BOUNDARY_RULE` carries the R-LAYER-2 boundary verbatim — internal tests passing is never evidence that a harness recognizes or can use the output (PRD 36 R-TEST-5 alignment). The rule is the direct corrective for the failure mode that let the descriptor output look correct while not being recognized.

Layers are declared where the tests live (a recorded D8 decision): each packaging-related repository suite names exactly one layer with a `Test layer: <layer>` marker line in its file-header comment — the text before the first `describe(` — parsed by `listDeclaredTestLayers`, which returns unknown tokens as-is so a typo is flagged rather than ignored. The placement extends the W18 R8 P5 evidence-boundary header precedent, and each marker restates the R-LAYER-2 boundary alongside the layer name. This is a maintainer rail: the meta-verification suite reads every packaging and conformance suite header, so a NEW test file that omits its layer declaration — or any `*.test.ts` file that claims the `conformance` layer — fails the suite. The conformance layer itself is named in [the conformance assets README](../../../../conformance/README.md), where its assets live.

One recorded judgment call: all eight `playbook-packaging*.test.ts` suites are classified `integration`, because they exercise the packaging rails through the manifest and exposure plumbing per the R-LAYER-1 definition, rather than splitting per file; the conformance-extension suites (`conformance-*.test.ts`) declare `unit` as pure-function tests over the check code and committed assets.

### Cross-Layer Citation Honesty

`listCrossLayerCitationErrors` closes the citation loop over the registry: every `internal-test` evidence ref must cite a repository test file that exists and declares exactly one repository layer (`unit` or `integration`) in its header. Internal-test evidence is therefore always attributable to one named layer, can never be a conformance-layer artifact, and no suite is cited across layers (R-LAYER-1..2). The complementary direction — `plannedScenarios` citing only authored conformance-layer specs — is enforced by the Phase 2 linkage check described above.

### The Three Meta-Verification Checks

Every check in `meta-verification.ts` returns human-readable error strings; empty means the invariant holds.

- **R-TEST-1** — `listConformanceValidatedRunQualificationErrors`: no tuple may read `conformance-validated` without a recorded run meeting the D4 install-discover-invoke-uninstall bar, and drift is flagged in both directions — a qualifying run understated as a lower status is equally dishonest (R-REG-3). With a `repoRoot`, the check demands receipts: every recorded run's `recordRef` must resolve to a committed result record that validates against the lab result contract and projects back byte-equal to the run stored on the registry entry, so a registry run can never drift from, or outlive, the evidence it summarizes.
- **R-TEST-2** — `listRequiredFirstPassScenarioErrors`: "runnable" is structural plus honest-blocked (ids and paths retargeted by PRD 43 R-SCHEMA-3). Every required first-pass scenario must be authored as a domain-qualified definition under `conformance/scenarios/<domain>/`, bar-eligible with all four stages asserted, bidirectionally linked to the registry tuples its target bindings declare, backed by fixture Playbooks that exist on disk, bound to the required first-pass target (Codex), and must carry a probeable `harness-cli` precondition with a concrete probe command on that target binding, so an unavailable harness resolves to `blocked` instead of silently passing. The dynamic leg is exercised in the meta suite through the Phase 2 seams: a failing probe executor resolves the scenarios not-runnable and yields a valid `blocked` record that advances nothing, while a succeeding executor still leaves the network and model-routing operator attestations unmet — so even a machine with a working harness CLI stays honestly `blocked` until an operator attests at run time. The D-023 executable-by-construction proof — a kit-generation dry-run projecting every required definition to a command sequence the current CLI accepts — is owned by the W18 R13 Phase 2 kit generator and Phase 4 executability check, not by this check.
- **R-TEST-3** — `listConformanceAssetExclusionViolations`: conformance assets never ship. Detection is relocation-proof by design, three ways — the asset path (a root-level `conformance/` directory in the scanned tree, the family's distinctive subtree fragments at any depth, and the pre-relocation `docs/assets/conformance` home, which still fails wherever it reappears), the `tuple-registry.json` basename, and the unambiguous schema identifiers (`CONFORMANCE_ASSET_CONTENT_MARKERS`) as content markers — so a renamed or moved copy of an asset still fails. The W18 R13 Phase 1 reorganization verified — not assumed — that the detectors survive the `scenarios/<domain>/` nesting, with a regression test pinning that the family's subtree fragments match through the nested layout. Check CODE shipping is deliberately allowed: the PRD ships lab and check code as ordinary CLI source inside `dist/` (which is also why compiled `dist/conformance/` code does not trip the path detection); only the ASSETS are maintainer-only.

### Where the Exclusion Check Runs

The R-TEST-3 boundary is enforced on three surfaces, and all three state the same posture: a green run is an exclusion fact, never a support claim (R-KEEP-1).

| Surface | Mechanism |
| --- | --- |
| Standard suite | `conformance-meta-verification.test.ts` runs `listShippedConformanceAssetErrors` over `CONFORMANCE_EXCLUSION_CHECKED_ROOTS` — `packages/docs/template/` (required) and the build-generated `packages/cli/template/` copy (checked when present). |
| Package validation | A dedicated describe in `packages/cli/tests/consistency.test.ts` runs the same repo-side check behind `validate:defaults`. |
| npm tarball | `assertNoConformanceAssetsInTarball` in `scripts/smoke-pack.mjs` sweeps the real unpacked tarball with the same three detectors (dist/ code allowed, assets excluded). |

## Support-Claim Governance

<!-- support-claim-state: conformance-validated=0/0 -->

Since W18 R9 Phase 4 ([the phase backlog](../../../work/2026-07-01-w18-r9-playbook-and-package-conformance/04-support-claim-governance.md)), the claim gate this guide states in Verdicts and Support Claims is encoded in `packages/cli/src/conformance/governance.ts` (PRD 20 R-GOV-1..2) and enforced in the standard suite through `packages/cli/tests/conformance-governance.test.ts`. The rule: a public claim states only what a `conformance-validated` tuple proves; until then wording distinguishes a Make Docs generated output from a harness-recognized plugin, and a `pass-with-caveats` result surfaces its caveats in any claim derived from it.

- **Wording is derived, not authored.** `renderConformanceSupportClaim` is the single seam that turns a registry entry into permitted public wording: below `conformance-validated` it renders the distinguishing wording with the honest status; at `conformance-validated` it states only the exact tuple, the scenario, the bar, and the run metadata, embedding every caveat carried by the reviewed qualifying runs. Hand-authored prose may restate, never exceed, what the derivation permits.
- **Two gates, not one.** Registry status derivation (R-REG-3) needs a qualifying run; public wording additionally needs maintainer review, preserving this guide's claim-gate table. `deriveSupportClaimStrength` reads each qualifying run's committed result record via its `recordRef` — the same receipts discipline as R-TEST-1 — and fails closed to `no-public-claim` on a missing, invalid, or unreviewed record. One reviewed qualifying run is `nominal` (the lab's minimum, R-GOV-2); repeated reviewed runs with a reviewed `stronger-claim-candidate` record are `stronger`, and stronger commendation language renders only behind that threshold.
- **Wording advancement is mechanical.** The declared claim surfaces (`CONFORMANCE_CLAIM_SURFACES`: this guide, the packaging guides, and the conformance README) each carry the rule's core phrase, a reference to the registry home, and a `support-claim-state` marker asserting the registry's current conformance-validated count. When a tuple advances, every marker goes stale and `listSupportClaimGovernanceErrors` fails the build until each surface's wording is reviewed and re-marked — claim wording advances only when the exact tuple advances, and it cannot silently fail to advance either. A vocabulary sweep flags support-status language appearing on an undeclared reader-facing surface.
- **The packaging lineage promotes only through the registry.** `derivePackageSupportStatusCeilingFromRegistry` and `capSupportStatusForConformanceRegistry` hold every PRD 36 generated-output and adapter-support claim at `provisional` unless the exact registry tuple is `conformance-validated`; `listPackagingSupportRegistryAgreementErrors` proves the wiring — every first-party descriptor placement claim has exactly one registry tuple and every registry tuple anchors back to a placement, so no parallel or prose-only support surface exists (R-REG-1). This third cap composes with the W18 R8 verification and tuple-binding caps and is maintainer-side by design: the registry is maintainer-only content, so the cap is enforced by the repository suite, not by shipping the registry.
- **Traceability is end to end.** Following links from a public claim reaches the tuple (each claim surface names the registry home), the tuple's status (the fail-closed loader), and the recorded run that justified it (the run's `recordRef`, receipt-checked by R-TEST-1). Today the chain ends honestly at "no recorded runs": zero tuples are conformance-validated, so every derived claim reads `no-public-claim` and distinguishes the generated output from a harness-recognized one.

A green governance run proves the wording machinery is honest — never that any harness recognizes any output (R-KEEP-1, R-LAYER-2).

## Redaction and Promotion

Use redaction and promotion only when the evidence is needed for a disputed result, a stronger support claim, or a cross-harness comparison. The reviewer must confirm that the bundle contains only the evidence needed to justify the claim.

Promotion checklist:

1. Confirm the scenario and result record are complete.
2. Remove credentials, local usernames, private paths, personal data, unrelated prompt content, and raw provider noise.
3. Replace full transcripts with short excerpts or structured summaries.
4. Link the promoted evidence to the exact result tuple.
5. Keep `supportClaimUse` as `none` unless the result is reviewed and the verdict allows support wording.

## Validation

When changing this guide or adding scenario/result records, run:

- `git diff --check`
- `python3 .make-docs/scripts/check_path_hygiene.py --repo-root . --format json`
- A changed-file Markdown link check for touched docs

When a scenario executes package or CLI behavior, run the normal package validation for that behavior too. The conformance lab may call package validation commands as scenario steps, but it does not replace those commands.

Validation commands can appear in scenario `steps`, for example:

```yaml
steps:
  - kind: "command"
    run: "npm test -w packages/cli"
  - kind: "command"
    run: "npm run validate:defaults -w packages/cli"
```

Those commands remain package validation evidence. They become conformance evidence only after the result record also captures the harness, model, provider or routing layer, runtime distribution, scenario id/version, reviewer status, verdict, reason, and caveats.

## Future Coverage

- Blocked by: W18 R13 Phase 4 (the enforcing meta-verification executability check; PRD 43 D14). Phase 3 landed the remaining former blocker — fail-closed ingestion, the discover honesty rule, the recording-seam pass-through, and the three operator modes — now documented in The Execution Kit and Lab Sessions above (Fail-Closed Ingestion, The Discover Honesty Rule, The Recording Seam Is Unchanged, and Operator Modes). Update when: the enforcing executability check (a kit-generation dry-run projecting every required definition to an accepted command sequence, running in the standard suite), the four reconciliation greps returning no live-surface hits, and D-023's register closure land. Guide change: record the enforcing executability check as D-023's structural close in Test Layers and Meta-Verification, note the reconciliation greps, and revisit any claim-surface wording the Phase 4 verification touches.
- Blocked by: the first maintainer-operated lab sessions against a real Codex install. Update when: the first result records are committed under `conformance/results/codex/` and recorded through `recordConformanceRunOnRegistryEntry`. Guide change: replace the "no scenario has run yet" posture with the recorded state — statuses, caveats, and any claim-wording advancement the governance markers force.

## Related Resources

- [20 Revise Agent Harness Model Conformance Lab](../../../prd/20-agent-harness-conformance-and-support-claims.md)
- [20 Agent Harness Conformance and Support Claims](../../../prd/20-agent-harness-conformance-and-support-claims.md#support-claim-governance)
- [43 Revise Conformance Scenario Model and Execution Kit](../../../prd/43-conformance-scenario-model-and-execution-kits.md)
- [44 Revise Conformance Lab Execution Protocol and Evidence Homes](../../../prd/44-conformance-lab-sessions-and-evidence.md)
- [Conformance Assets README](../../../../conformance/README.md)
- [Asset Reorganization and Spec Migration Work Phase](../../../work/2026-07-06-w18-r13-conformance-execution-and-lab-session-redesign/01-asset-reorganization-and-spec-migration.md)
- [Execution Kit, Instruments, and Lab Sessions Work Phase](../../../work/2026-07-06-w18-r13-conformance-execution-and-lab-session-redesign/02-execution-kit-instruments-and-lab-sessions.md)
- [Ingestion and Operator Modes Work Phase](../../../work/2026-07-06-w18-r13-conformance-execution-and-lab-session-redesign/03-ingestion-and-operator-modes.md)
- [Operator Modes Protocol](../../../../conformance/operator-modes.md)
- [Support Tuple and Tuple Registry Work Phase](../../../work/2026-07-01-w18-r9-playbook-and-package-conformance/01-support-tuple-and-tuple-registry.md)
- [Evidence Bar and First-Pass Scenarios Work Phase](../../../work/2026-07-01-w18-r9-playbook-and-package-conformance/02-evidence-bar-and-first-pass-scenarios.md)
- [Test-Layer Separation and Meta-Verification Work Phase](../../../work/2026-07-01-w18-r9-playbook-and-package-conformance/03-test-layer-separation-and-meta-verification.md)
- [Support-Claim Governance Work Phase](../../../work/2026-07-01-w18-r9-playbook-and-package-conformance/04-support-claim-governance.md)
- [Playbook Packaging and Harness Adapters](./playbooks-development-packaging-and-harness-adapters.md)
- [Scenario and Result Contract Plan](../../../plans/2026-06-23-w10-r5-agent-harness-model-conformance-lab/02-scenario-and-result-contract.md)
- [Harness Adapter and Support Claim Gating Plan](../../../plans/2026-06-23-w10-r5-agent-harness-model-conformance-lab/03-harness-adapter-and-support-claim-gating.md)
- [Scenario and Result Schema Work Phase](../../../work/2026-06-23-w10-r5-agent-harness-model-conformance-lab/02-scenario-and-result-schema.md)
- [Adapters and Support Claims Work Phase](../../../work/2026-06-23-w10-r5-agent-harness-model-conformance-lab/03-adapters-and-support-claims.md)
- [Packaging, Validation, and Release Reference](./release-packaging-validation-and-release-reference.md)

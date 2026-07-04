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
  - ../../../prd/20-revise-agent-harness-model-conformance-lab.md
  - ../../../prd/37-enhance-playbook-and-package-conformance.md
  - ../../../plans/2026-06-23-w10-r5-agent-harness-model-conformance-lab/02-scenario-and-result-contract.md
  - ../../../plans/2026-06-23-w10-r5-agent-harness-model-conformance-lab/03-harness-adapter-and-support-claim-gating.md
  - ../../../work/2026-06-23-w10-r5-agent-harness-model-conformance-lab/02-scenario-and-result-schema.md
  - ../../../work/2026-06-23-w10-r5-agent-harness-model-conformance-lab/03-adapters-and-support-claims.md
  - ../../../work/2026-07-01-w18-r9-playbook-and-package-conformance/01-support-tuple-and-tuple-registry.md
  - ../../../work/2026-07-01-w18-r9-playbook-and-package-conformance/02-evidence-bar-and-first-pass-scenarios.md
  - ./playbooks-development-packaging-and-harness-adapters.md
  - ./release-packaging-validation-and-release-reference.md
---

# Conformance Lab Scenario and Result Contracts

## Overview

The conformance lab is maintainer-only evidence infrastructure. It helps maintainers test make-docs behavior across agent harnesses and harness-selected models before making support claims. It does not replace package validation, and it is not installed into consumer projects by default.

Use this guide when defining reviewed scenario specs, compact result records, raw artifact storage, and redacted evidence promotion. Keep the lab outside shipped templates and packages unless a later accepted design explicitly promotes a reviewed subset.

Since W18 R9 Phase 1 ([PRD 37](../../../prd/37-enhance-playbook-and-package-conformance.md)), the lab extends into the Playbook packaging domain: support claims for generated distributables bind to an eight-dimension tuple, and every tuple's status lives in one queryable registry data file. Since W18 R9 Phase 2, the install-discover-invoke-uninstall evidence bar is implemented as the packaging scenario shape, and the four required Codex-first first-pass scenario specs are committed — runnable where their preconditions hold and honestly `blocked` where they do not. The lab core in this guide — verdicts, safety modes, evidence classes, storage boundaries, and the result contract — is consumed by that extension unchanged (R-SCOPE-1, R-KEEP-1). See Packaging Conformance Tuple and Registry and Packaging Conformance Scenarios and the Evidence Bar below.

## Project Orientation

| Surface | Purpose | Source-control rule |
| --- | --- | --- |
| Scenario specs | Define the behavior to exercise, the safety mode, and the expected evidence. | May be committed only when compact and reviewed. Packaging scenario specs live at `docs/assets/conformance/scenarios/<scenarioId>.json`. |
| Result records | Capture the exact scenario/harness/model/provider/runtime tuple and reviewed verdict. | May be committed only when compact and reviewed. Packaging result records land under `docs/assets/conformance/results/`, created with the first recorded run. |
| Scenario fixture Playbooks | Provide the v2-form source Playbooks packaging scenarios compile, packaged only into disposable fixture workspaces. | Committed under `docs/assets/conformance/fixtures/<persona>/`. |
| Tuple registry | Carry every packaging support tuple and its evidence-derived status. | Committed queryable data file at `docs/assets/conformance/tuple-registry.json`. |
| Raw artifacts | Hold transcripts, provider logs, temporary workspaces, raw diffs, and run scratch data. | Generated local state under `.make-docs/conformance/<run-id>/` or `.make-docs/runs/conformance/<run-id>/`; not committed by default. |
| Redacted evidence bundles | Preserve the minimum evidence needed for disputed or stronger support claims. | Opt-in only after review and redaction. |

Do not add lab assets to `packages/docs/template/`, copied `packages/cli/template/`, package allowlists, Rust package surfaces, or provider-backed system asset delivery as part of routine lab work.

## Scenario Specs

Every scenario spec must be small enough to review and stable enough to rerun. Use YAML or JSON, but preserve the same field names.

```yaml
schemaVersion: "conformance.scenario.v1"
scenarioId: "docs-assets-install-dry-run"
scenarioVersion: "1.0.0"
title: "Docs assets install dry run"
sourceRequirements:
  - "docs/prd/20-revise-agent-harness-model-conformance-lab.md"
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

## Harness Adapter Protocol

The first executable lab coverage is limited to the current make-docs harness ids in `packages/cli/src/types.ts`:

| Adapter id | Current product harness | Instruction file | Status |
| --- | --- | --- | --- |
| `codex` | Codex | `AGENTS.md` | Current executable lab target |
| `claude-code` | Claude Code | `CLAUDE.md` | Current executable lab target |

Adapter ids must stay separate from model names and providers. A Codex run with one OpenAI-routed model, a Claude Code run with one Anthropic-routed model, and a future provider-routed open-weight model are three different support-claim tuples.

Future adapter targets are reserved but not current shipped harnesses:

| Future target | Current status | Required before support wording |
| --- | --- | --- |
| OpenCode | Future lab adapter target | Accepted implementation plus reviewed scenario results |
| Goose | Future lab adapter target | Accepted implementation plus reviewed scenario results |
| Pi | Future lab adapter target | Accepted implementation plus reviewed scenario results |
| Future agentic IDEs | Future lab adapter targets | Accepted implementation plus reviewed scenario results |

Do not describe a future target as supported because the scenario protocol can name it. Until an adapter exists and a reviewed result records the exact scenario/harness/model/provider/runtime tuple, runs for that target are `blocked` or unattempted.

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
transcriptLogPointer: ".make-docs/conformance/<run-id>/transcript.log"
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
| `transcriptLogPointer` | Local pointer or redacted bundle pointer; do not inline raw transcripts. |
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

For generated Playbook distributables, this gate is realized structurally in the tuple registry described in the next section: a status the recorded evidence does not support fails the registry load.

## Packaging Conformance Tuple and Registry

Since W18 R9 Phase 1 ([the phase backlog](../../../work/2026-07-01-w18-r9-playbook-and-package-conformance/01-support-tuple-and-tuple-registry.md)), the packaging conformance extension lives in `packages/cli/src/conformance/` (`tuple.ts`, `registry.ts`) with its data file under `docs/assets/conformance/`. Phase 1 deliberately registered no new operations: the backlog mandates only the queryable data file, its loader, and query helpers, so the registry is consumed as a library seam by the later-phase scenarios, meta-verification checks, and claim governance — not as a CLI or MCP surface.

### The Eight-Dimension Support Tuple

A support claim for a generated Playbook distributable binds to the exact eight-field tuple — `scenario`, `harness`, `surface`, `scope`, `outputKind`, `generatedOutputKind`, `modelOrProvider`, `runtime` (R-TUPLE-1) — defined in `packages/cli/src/conformance/tuple.ts`. The tuple extends two owned shapes and redefines neither:

- The lab's scenario/harness/model/provider/runtime tuple (PRD 20): `scenario`, `modelOrProvider`, and `runtime` remain run metadata exactly as the result contract above defines them. On a registry tuple they are `null` until a recorded run binds them through `bindRunMetadataOntoConformanceTuple` — the only seam allowed to bind the evidence-owned dimensions, so nothing in packaging or registry code can invent them.
- The packaging lineage's seven-dimension `PackageSupportClaimTuple` (W18 R8 Phase 4, PRD 36 R-PROV-3): the packaging dimensions — harness, surface, scope, output kind — are consumed from that shape through `bindConformanceSupportTuple`, and a parity test pins the dimension relationship so the two lineages cannot drift apart silently. See [Playbook Packaging and Harness Adapters](./playbooks-development-packaging-and-harness-adapters.md) for the claim-tuple side.

The one added dimension is `generatedOutputKind`: the ownership-record kind of the artifact actually generated (`generated-plugin`, `generated-skills-bundle`, and the exposure and export kinds), reusing the packaging vocabulary rather than minting a new one. It separates what was produced from what was requested (`outputKind`), so evidence for a generated plugin never silently covers its exposure or export artifacts. Two implementer decisions (D8 freedoms) are recorded on the module: a registry tuple's `surface` is always concrete — `bindConformanceSupportTuple` refuses an unresolved `auto` surface because a resolution request is not a surface a harness recognizes, making such a claim broader than any evidence (R-TUPLE-1) — and tuple identity is the ordered dimension values joined with `/`, unbound dimensions spelled `~` (`conformanceTupleKey`), so identity is deterministic and queryable without parsing.

### The Tuple Registry Data File

The set of tuples and their statuses lives in one committed data file, `docs/assets/conformance/tuple-registry.json` (R-REG-1) — a single versioned JSON document, an implementer format choice per D8 so any tool can query it without a parser dependency. [The conformance assets README](../../conformance/README.md) documents the entry shape. `packages/cli/src/conformance/registry.ts` owns the schema, the statuses, and the derivation rules, and provides the fail-closed zod loader (`loadConformanceTupleRegistry`) plus the query helpers (`queryConformanceTuples`, `getConformanceTupleEntry`).

The file and the code are drift-proofed against each other in both directions:

- The file redundantly embeds the R-REG-2 status meanings and R-REG-3 verdict-derivation rules as data, and validation compares the embedded copies byte-for-byte against the code's canonical constants — an edit to either side alone fails the load.
- Statuses are stored AND rederived: every entry records its status, and validation recomputes `deriveConformanceTupleStatus` from the entry's evidence, failing closed on any mismatch. A `conformance-validated` status without a qualifying recorded run is therefore structurally impossible, which makes the Phase 3 R-TEST-1 meta-verification assertion true from day one.
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

Non-run evidence refs carry one of two kinds. `internal-test` refs are the only support for `implementation-validated` and must name the repository test file that proves the generated output. `real-harness-probe` refs record out-of-protocol real-harness observations — positive or negative — that inform and warn but never move a status in either direction. The first probe on record is negative: the 2026-07-03 hand-run Codex v0.142.4 recognition probe (register item [R-021](../../../prd/03-open-questions-and-risk-register.md)) rides the `codex-plugin-native-project` tuple with a governance note that its subject must never be worded as recognized; it opens the Phase 2 Codex-first scenarios rather than substituting for them.

### Current Seed

The registry is seeded with the exact first-party descriptor placement matrix from W18 R8 — twenty tuples (seven Codex, seven Claude Code, six Pi), parity-tested against `FIRST_PARTY_HARNESS_CAPABILITY_DESCRIPTORS` so the seed cannot silently miss or invent a placement. The honesty posture:

- Zero tuples are `conformance-validated`: no real-harness evidence bar has been met anywhere.
- Five tuples are `implementation-validated`, each citing the W18 R8 write-path file-and-structure tests with a boundary note that the evidence is never harness recognition.
- Fifteen tuples are `provisional`, each with a note naming the specific evidence gap.
- Export-only tuples bind `generatedOutputKind` to the export-only file kind, keeping the requested-versus-produced distinction visible in the tuple itself.

Seeding Pi tuples does not change the adapter-protocol table above: Pi remains a future lab adapter target, and its registry entries exist precisely to state, queryably, that nothing beyond internal structure tests is proven for it.

### Registry Boundary and Ownership

The registry follows the same maintainer-only boundary as the rest of `docs/assets/conformance/` (R-KEEP-1): it is in-repo project content edited in place, deliberately NOT authored upstream in `packages/docs/template/`. This is a stated exception to the maintainer repo's upstream-first dogfooding rule, recorded in [the W18 R9 backlog index](../../../work/2026-07-01-w18-r9-playbook-and-package-conformance/00-index.md), because conformance is maintainer evidence infrastructure, not shipped product. The registry must stay out of the shipped template, the packaged copy, and npm tarballs; the Phase 3 R-TEST-3 exclusion check enforces that boundary outward.

## Packaging Conformance Scenarios and the Evidence Bar

Since W18 R9 Phase 2 ([the phase backlog](../../../work/2026-07-01-w18-r9-playbook-and-package-conformance/02-evidence-bar-and-first-pass-scenarios.md)), the D4 install-discover-invoke-uninstall evidence bar is implemented as the packaging scenario shape in `packages/cli/src/conformance/scenario.ts`, with the authored specs as its data under `docs/assets/conformance/scenarios/`. [The conformance assets README](../../conformance/README.md) documents the on-disk formats; this section documents the contracts and seams a maintainer extends.

### The `packagingExtension` Scenario Shape

A packaging scenario spec keeps the lab's `conformance.scenario.v1` schema verbatim — every required field above with its exact name and meaning — and adds one additive `packagingExtension` block, so the extension boundary is visible in the data itself (R-SCOPE-1). Two D8 implementer decisions fix the format: one JSON document per scenario (matching the registry's no-parser-dependency choice), and the filename must equal the `scenarioId` so specs stay addressable without opening them. The extension declares:

- `harness` and `registryTupleIds`: the harness under test and the registry entry ids the scenario's runs may land on;
- `evidenceBar`: per-stage assertion lists for `install`, `discover`, `invoke`, and `uninstall`;
- `preconditions`, `harnessExecution`, `transcriptPolicy: "json-or-non-tty"`, and `workspacePolicy: "disposable-fixture-workspace"` (nothing destructive ever runs against a maintainer working tree, R-KEEP-1);
- `fixturePlaybooks`: repo-relative v2-form source Playbooks the scenario packages;
- `futureHarnesses`: the harness variants the spec deliberately does not cover (R-SCEN-2);
- an optional `characterization` preamble (see below).

The schema fails closed on dishonest or stale specs: the retired `--write` flag is rejected anywhere in a command step (scenario scripts use the PRD 41 `plan`/`preview`/`write`/`ship` grammar), a command step tagged `evidence-json` must literally pin `--json` so rendered TTY text never enters evidence (register item R-026), a `destructive` scenario must use the `destructive-temp-fixture-apply` safety mode, and `requiresNetwork`/`requiresCredentials` without a matching precondition kind is invalid.

Bar eligibility is a property of the spec, checked by two helpers: `listUnassertedEvidenceBarStages` returns the stages a spec declares no assertion for, and `scenarioAssertsFullEvidenceBar` is true only when all four stages carry assertions. The bar is exactly install, discover, invoke, and uninstall (R-BAR-1) — a spec asserting anything less can never advance a tuple, because the recording seam below refuses a run claiming a stage its scenario does not assert and qualification requires all four stages.

### Result Records and the Recording Seam

Packaging result records keep the lab's `conformance.result.v1` fields verbatim and add only additive fields: the per-stage `evidenceBar` booleans, `caveatsSurfaced`, `simulated` with `simulationMechanicsRef`, and `transcriptFormat` (`json` or `non-tty`). A `blocked` record must carry `supportClaimUse: "none"` and an all-false evidence bar — blocked is honest absence of evidence, not evidence.

`recordConformanceRunOnRegistryEntry` is the single seam between a result record and a Phase 1 registry entry (R-REG-3, R-BAR-1..2). A qualifying run — verdict `pass`, or `pass-with-caveats` with surfaced caveats, meeting all four bar stages — advances the tuple to `conformance-validated` and binds the evidence-owned tuple dimensions (`scenario`, `modelOrProvider`, `runtime`) from its run metadata through `bindRunMetadataOntoConformanceTuple`; a non-qualifying run (including `blocked`) is appended as honest history and advances nothing, and internal-test evidence stays capped at `implementation-validated` by the Phase 1 derivation this seam reuses rather than reimplements. The seam fails closed on every mismatch that could make a claim broader than its evidence:

- the record must belong to the given scenario, and the scenario must target the entry (`registryTupleIds`) on the same harness — evidence never crosses harnesses (R-TUPLE-1);
- the record may not claim a bar stage the scenario does not assert, so an incomplete scenario structurally cannot advance a tuple (R-BAR-1);
- the record's simulation posture must match the scenario's declared harness-execution mode;
- a qualifying run may not land on an entry already bound to a different scenario.

### Simulation Posture

The faithful-simulation mechanics allowance (D8) is a reviewed spec-level contract, never a per-run improvisation. A spec's `packagingExtension.harnessExecution` declares `real-harness` or `faithful-simulation`; the simulation mode must document its reviewed mechanics in the spec, every result record and recorded run states `simulated` (with a `simulationMechanicsRef` naming the mechanics used), and the recording seam refuses a run whose posture disagrees with its scenario's declared mode. All four first-pass Codex specs declare `real-harness`: no faithful simulation of Codex exists, so simulation never silently substitutes for the real harness, and the registry's embedded verdict-derivation rules carry the simulation clause as drift-checked data.

### Preconditions and Honest Blocked Runs

Every packaging precondition carries a cheap, local, read-only probe and the embedded rule `onUnmet: "blocked"` (R-KEEP-1). `command-succeeds` probes cover harness CLI availability and authentication; `network` and `model-routing` use `operator-attestation`, because they cannot be probed without spending them — an attestation is satisfied only when the operator explicitly names the precondition id at run time, so an unattended probe honestly resolves `blocked` by default. `probePackagingScenarioPreconditions` evaluates the declared set (with an injectable executor for tests), and `blockedPackagingResultRecord` turns an unmet report into a valid `blocked` result record — verdict `blocked`, `supportClaimUse: "none"`, all-false bar, model and provider `unknown` because no run reached a model — which recording on a tuple never advances.

### The Four First-Pass Scenarios and the R-021 Characterization Preamble

The four required R-SCEN-1 scenarios are fixed in `REQUIRED_FIRST_PASS_SCENARIOS`, mapped to the user-visible outcome each must prove, with `listMissingRequiredFirstPassScenarioIds` pre-figuring Phase 3's R-TEST-2 runnability check — absence of any spec is a failure, never a silent gap. All four are authored, Codex-first, `external-provider-run`, non-destructive, bar-complete, and precondition-guarded; none has run yet. The README's scenario table names each spec and outcome; three details matter to maintainers:

- `codex-plugin-marketplace-install` carries the `characterization` preamble — the recorded plan for resolving the negative Codex v0.142.4 recognition probe (register item [R-021](../../../prd/03-open-questions-and-risk-register.md)). Before any bar assertion, the run pins the Codex version, hand-authors a minimal plugin from the Codex docs independent of Make Docs, varies marketplace source shapes until Codex accepts one, records that ground truth, and diffs the generated shapes against it. Divergences are compiler or descriptor defects to fix — never bar relaxations — so a failure distinguishes wrong generated shapes from a harness capability gap.
- `codex-dependency-check-both-directions` binds its expectations to the v2 probe-based checks (PRD 40 R-DEP-3): its fixture set includes an `rg` dependency whose `source` prose begins with "ripgrep" (a check derived from prose would probe the wrong binary) and a deliberately absent probe target for the missing direction.
- `codex-uninstall-backup-cleanliness` owns the PRD 36 R-PROV-2 cleanliness scenario this lineage was assigned: backup plus removal with orphan-directory and user-authored-sentinel assertions.

### Planned-Scenario Linkage and Scenario Absence

Registry entries carry a `plannedScenarios[]` field: ids of authored specs that target the tuple. The linkage is forward-looking only — a planned scenario is not evidence, never affects status derivation, and never binds the tuple's `scenario` dimension; only a recorded run does (R-TUPLE-1). An explicitly empty list is itself a statement: no authored scenario targets the tuple, so absence is reported rather than implied as covered (R-SCEN-2) — the six Pi entries additionally carry scenario-absence notes naming Pi as recorded future work. `listConformanceScenarioRegistryLinkageErrors` enforces the linkage bidirectionally: every planned id must resolve to an authored spec that targets the entry back on the same harness, and every spec's `registryTupleIds` must resolve to an entry that plans it.

Raw artifacts default to generated local state:

- `.make-docs/conformance/<run-id>/`
- `.make-docs/runs/conformance/<run-id>/`

These locations are for raw transcripts, provider logs, temporary workspaces, raw stdout/stderr captures, and scratch diffs. `.make-docs/conformance/` is ignored in this repository, and `.make-docs/runs/` is already ignored.

Do not commit credentials, unredacted provider logs, full private transcripts, temporary workspaces, or raw local scratch output. If evidence must become durable, create a compact reviewed result record and promote only redacted, minimal supporting material.

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

## Related Resources

- [20 Revise Agent Harness Model Conformance Lab](../../../prd/20-revise-agent-harness-model-conformance-lab.md)
- [37 Enhance Playbook and Package Conformance](../../../prd/37-enhance-playbook-and-package-conformance.md)
- [Conformance Assets README](../../conformance/README.md)
- [Support Tuple and Tuple Registry Work Phase](../../../work/2026-07-01-w18-r9-playbook-and-package-conformance/01-support-tuple-and-tuple-registry.md)
- [Evidence Bar and First-Pass Scenarios Work Phase](../../../work/2026-07-01-w18-r9-playbook-and-package-conformance/02-evidence-bar-and-first-pass-scenarios.md)
- [Playbook Packaging and Harness Adapters](./playbooks-development-packaging-and-harness-adapters.md)
- [Scenario and Result Contract Plan](../../../plans/2026-06-23-w10-r5-agent-harness-model-conformance-lab/02-scenario-and-result-contract.md)
- [Harness Adapter and Support Claim Gating Plan](../../../plans/2026-06-23-w10-r5-agent-harness-model-conformance-lab/03-harness-adapter-and-support-claim-gating.md)
- [Scenario and Result Schema Work Phase](../../../work/2026-06-23-w10-r5-agent-harness-model-conformance-lab/02-scenario-and-result-schema.md)
- [Adapters and Support Claims Work Phase](../../../work/2026-06-23-w10-r5-agent-harness-model-conformance-lab/03-adapters-and-support-claims.md)
- [Packaging, Validation, and Release Reference](./release-packaging-validation-and-release-reference.md)

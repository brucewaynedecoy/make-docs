# Conformance Assets

Maintainer-only evidence infrastructure for the W18 R9 conformance lineage ([PRD 37](../../prd/37-enhance-playbook-and-package-conformance.md)), extending the maintainer lab from [PRD 20](../../prd/20-revise-agent-harness-model-conformance-lab.md) into the Playbook packaging domain. This directory holds the tuple registry (`tuple-registry.json`), the packaging scenario specs (`scenarios/`), their fixture Playbooks (`fixtures/`), and — once real runs exist — the compact normalized result records (`results/`).

**Boundary (R-KEEP-1, R-TEST-3):** everything under `docs/assets/conformance/` is maintainer-only in-repo project content, edited in place, and deliberately NOT authored upstream in `packages/docs/template/`. This is a stated exception to the upstream-first dogfooding rule, because conformance is maintainer evidence infrastructure, not shipped product. These assets must stay out of the shipped template, the packaged `packages/cli/template/` copy, npm tarballs, and any future package; the R-TEST-3 exclusion check (`listShippedConformanceAssetErrors` in the standard suite and `validate:defaults`, plus the tarball sweep in `scripts/smoke-pack.mjs`) enforces this outward — and a green exclusion run is an exclusion fact, never a support claim (R-KEEP-1). Raw transcripts and provider logs default to `.make-docs/conformance/` or `.make-docs/runs/conformance/` and are not committed unless deliberately redacted and promoted.

**Test layer: conformance (R-LAYER-1, R-LAYER-2).** This directory is where the conformance test layer lives: its scenario specs, tuple registry, and result records cover the real-harness user outcome per tuple through the maintainer lab. The other two named layers — unit (the operation core, parser, and validator as pure functions without a CLI) and integration (the CLI and MCP surfaces over the core, including the manifest and exposure plumbing) — are automated repository tests under `packages/cli/tests/`, and each suite there names its layer in its file header via a `Test layer:` marker enforced by `packages/cli/tests/conformance-meta-verification.test.ts`. The layers are never substitutable, and internal (unit or integration) tests passing is never evidence that a harness recognizes or can use the output (R-LAYER-2; PRD 36 R-TEST-5): only recorded runs from this layer meeting the R-BAR-1 install-discover-invoke-uninstall bar advance a tuple.

## The Tuple Registry (`tuple-registry.json`)

The single queryable home of support status for generated Playbook distributables (R-REG-1): the set of support tuples and their statuses lives in this data file, not in prose, so support status cannot drift from documentation. The schema, canonical status meanings, and verdict-derivation rules are owned by `packages/cli/src/conformance/` (`tuple.ts`, `registry.ts`); the loader fails closed when this file drifts from the code's canonical rules, when any status disagrees with the status derived from its recorded evidence, or when any tuple is duplicated.

### Format (implementer choice per D8)

One versioned JSON document. JSON keeps the registry queryable by any tool without a parser dependency; a single file keeps tuple identity enforceable in one place.

- `record`: `make-docs.conformance.tuple-registry`; `schemaVersion`: `1`.
- `statuses`: the three R-REG-2 status meanings, embedded verbatim so the file is self-describing (validated byte-for-byte against the code's constants).
- `verdictDerivation`: the R-REG-3 rules as data (same drift check).
- `tuples[]`: one entry per exact support tuple:
  - `id`: unique human-oriented slug.
  - `tuple`: the eight R-TUPLE-1 dimensions — `scenario`, `harness`, `surface` (`native`/`agents-standard`, never `auto`), `scope`, `outputKind`, `generatedOutputKind`, `modelOrProvider`, `runtime`. The evidence-owned dimensions (`scenario`, `modelOrProvider`, `runtime`) are lab run metadata per PRD 20 and stay `null` until a recorded run binds them.
  - `status`: exactly one of `provisional`, `implementation-validated`, `conformance-validated`.
  - `evidence[]`: non-run evidence links. `internal-test` refs (repository test files) are the only support for `implementation-validated`; `real-harness-probe` refs record out-of-protocol real-harness observations (positive or negative) and never move a status.
  - `recordedRuns[]`: compact projections of lab result records — scenario, run date, verdict, caveats plus whether they are surfaced, the four D4 evidence-bar stage results (`install`, `discover`, `invoke`, `uninstall`), a `recordRef` to the committed result record, the model/provider and runtime run metadata, and the run's `simulated` posture.
  - `plannedScenarios[]` (W18 R9 P2 t9): ids of authored scenario specs under `scenarios/` that target this tuple. Forward-looking linkage only — a planned scenario is not evidence, never affects status derivation, and never binds the tuple's `scenario` dimension; only a recorded run does. An explicitly empty list is itself a statement: no authored scenario targets the tuple, so absence is reported rather than implied as covered (R-SCEN-2).
  - `notes[]`: honesty annotations (e.g. what the current evidence does not prove).

### Status derivation (R-REG-2, R-REG-3, R-BAR-2)

Statuses are derived, never asserted:

- `conformance-validated` — only from a recorded run with verdict `pass`, or `pass-with-caveats` whose caveats are surfaced, that met all four evidence-bar stages. Verdicts of `inconsistent`, `unsupported`, and `blocked` never advance a tuple; a scenario that cannot run reports `blocked` rather than inventing evidence.
- `implementation-validated` — only from `internal-test` evidence refs proving the generated files and structure. Internal tests are never harness-recognition evidence (R-LAYER-2, PRD 36 R-TEST-5).
- `provisional` — everything else.

## Scenario Specs (`scenarios/`)

The W18 R9 P2 first-pass scenario specs implement the install-discover-invoke-uninstall evidence bar as the scenario shape for packaging conformance (R-BAR-1). The contract is owned by `packages/cli/src/conformance/scenario.ts`; the specs are its data.

### Format (implementer choice per D8)

One JSON document per scenario at `scenarios/<scenarioId>.json` — the lab permits YAML or JSON, and JSON matches the tuple registry's no-parser-dependency choice; the loader rejects a file whose name is not its `scenarioId`. The lab's `conformance.scenario.v1` fields (PRD 20; see [the developer guide](../library/developer/conformance-lab-scenario-and-result-contracts.md)) are consumed unchanged with their exact names; everything packaging-specific is additive under the `packagingExtension` key:

- `harness` and `registryTupleIds`: the harness under test and the registry entries whose tuples the scenario's runs may land on.
- `evidenceBar`: per-stage assertions for all four D4 stages. A spec that declares no assertion for any stage is not bar-eligible, and the recording seam refuses a run claiming a stage its scenario does not assert — a scenario missing any assertion structurally cannot advance a tuple (R-BAR-1).
- `preconditions`: each with a cheap local probe (`command-succeeds` for harness CLI availability and authentication; `operator-attestation` for network and model routing, which cannot be probed without spending them) and the embedded `onUnmet: "blocked"` rule — a scenario that cannot run resolves to an honest `blocked` result record with `supportClaimUse: "none"`, never invented evidence (R-KEEP-1).
- `harnessExecution`: `real-harness` or `faithful-simulation`. All four first-pass specs declare `real-harness`; no faithful simulation of Codex exists, so simulation never silently substitutes for the real harness. A future simulation must document its reviewed mechanics here (D8) and every result record states whether the run was simulated.
- `transcriptPolicy: "json-or-non-tty"` and per-step transcript tags: any command transcript consumed as evidence pins `--json` or runs non-TTY, so the render layer never enters evidence (PRD 41 R-SEQ-2; register item R-026). Scenario scripts use the `plan`/`preview`/`write`/`ship` grammar; the schema rejects the retired `--write` flag.
- `workspacePolicy: "disposable-fixture-workspace"`: nothing destructive ever runs against a maintainer working tree (R-KEEP-1).
- `futureHarnesses`: the harness variants this spec deliberately does not cover (Claude Code follows the Codex-first pass; Pi is a future harness per R-SCEN-2).
- `characterization` (plugin scenario only): the preamble that is the recorded plan for resolving the R-021 negative recognition probe — before any bar assertion, the run characterizes what the real Codex version accepts as a marketplace source and plugin layout using a hand-minimal plugin independent of Make Docs, then diffs the generated shapes against that ground truth, so a failure distinguishes wrong generated shapes from a harness capability gap.

### The four required first-pass scenarios (R-SCEN-1, Codex first)

| Spec | Proves |
| --- | --- |
| `codex-skills-bundle-discovery-invocation` | A generated skills bundle appears as a skill in the target harness and can be invoked. |
| `codex-plugin-marketplace-install` | A generated plugin appears through a marketplace, installs, exposes its bundled skills, and is usable in a new thread. |
| `codex-dependency-check-both-directions` | Generated dependency checks surface missing tools and pass when dependencies are present, bound to the v2 probe-based checks — including a fixture whose `source` prose does not begin with the binary name (PRD 40 R-DEP-3, R-FIX-1). |
| `codex-uninstall-backup-cleanliness` | Uninstall and backup remove managed generated outputs without orphaning empty managed directories or deleting user-authored files; owns the PRD 36 R-PROV-2 cleanliness scenario. |

All four are runnable-or-honestly-blocked: their precondition probes (`probePackagingScenarioPreconditions`) resolve `blocked` when the Codex CLI is unavailable or unauthenticated, and the network/model-routing preconditions require explicit operator attestation, so an unattended probe is `blocked` by default.

## Fixture Playbooks (`fixtures/`)

Scenario source Playbooks are v2-form documents (PRD 40) under `fixtures/<persona>/`, packaged only into disposable fixture workspaces. `conformance-skill-probe` emits a deterministic invocation marker so the invoke assertion greps evidence; `conformance-dependency-probe` carries the dependency fixture set for both directions, including the deliberately absent probe target and the `rg` entry whose provenance prose begins with "ripgrep".

## Result Records (`results/`)

Compact normalized result records are the committed evidence class (R-KEEP-1): one JSON document per run, the lab's `conformance.result.v1` fields verbatim plus the packaging extension (per-stage `evidenceBar` booleans, `caveatsSurfaced`, `simulated` with `simulationMechanicsRef`, and `transcriptFormat` pinning `json` or `non-tty`). Raw transcripts and provider logs stay local under `.make-docs/conformance/<run-id>/`, uncommitted unless deliberately redacted and promoted. No result record exists yet — no scenario has run — so this directory appears with the first recorded run. Bar outcomes bind to the registry through `recordConformanceRunOnRegistryEntry` in `packages/cli/src/conformance/scenario.ts`: a qualifying `pass` (or `pass-with-caveats` with surfaced caveats) meeting all four stages advances the tuple and binds its evidence-owned dimensions from run metadata; every other verdict is recorded as honest history and advances nothing.

### Current state (W18 R9 P2)

The registry is seeded with the twenty W18 R8 first-party adapter tuples (codex, claude-code, pi across their descriptor placements) at their honest statuses. No real-harness evidence exists yet, so **no tuple is `conformance-validated`**; five tuples with write-path file-and-structure tests are `implementation-validated`, and the rest are `provisional`. The one real-harness observation on record is negative: the 2026-07-03 Codex v0.142.4 recognition probe (register item R-021), carried on `codex-plugin-native-project` as a `real-harness-probe` ref that advances nothing. Phase 2 authored the four Codex-first scenario specs and linked them through `plannedScenarios` on the tuples they target; the linkage is forward-looking only, every tuple's `scenario` dimension stays `null`, and the Pi tuples state their scenario absence explicitly (R-SCEN-2). The scenarios have not run: they are runnable where the preconditions hold and honestly `blocked` where they do not.

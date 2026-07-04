# Conformance Assets

Maintainer-only evidence infrastructure for the W18 R9 conformance lineage ([PRD 37](../../prd/37-enhance-playbook-and-package-conformance.md)), extending the maintainer lab from [PRD 20](../../prd/20-revise-agent-harness-model-conformance-lab.md) into the Playbook packaging domain. This directory holds the tuple registry, and — as later W18 R9 phases land — the scenario specs and compact normalized result records.

**Boundary (R-KEEP-1, R-TEST-3):** everything under `docs/assets/conformance/` is maintainer-only in-repo project content, edited in place, and deliberately NOT authored upstream in `packages/docs/template/`. This is a stated exception to the upstream-first dogfooding rule, because conformance is maintainer evidence infrastructure, not shipped product. These assets must stay out of the shipped template, the packaged `packages/cli/template/` copy, npm tarballs, and any future package; the Phase 3 R-TEST-3 exclusion check enforces this outward. Raw transcripts and provider logs default to `.make-docs/conformance/` or `.make-docs/runs/conformance/` and are not committed unless deliberately redacted and promoted.

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
  - `recordedRuns[]`: compact projections of lab result records — scenario, run date, verdict, caveats plus whether they are surfaced, the four D4 evidence-bar stage results (`install`, `discover`, `invoke`, `uninstall`), a `recordRef` to the committed result record, and the model/provider and runtime run metadata.
  - `notes[]`: honesty annotations (e.g. what the current evidence does not prove).

### Status derivation (R-REG-2, R-REG-3, R-BAR-2)

Statuses are derived, never asserted:

- `conformance-validated` — only from a recorded run with verdict `pass`, or `pass-with-caveats` whose caveats are surfaced, that met all four evidence-bar stages. Verdicts of `inconsistent`, `unsupported`, and `blocked` never advance a tuple; a scenario that cannot run reports `blocked` rather than inventing evidence.
- `implementation-validated` — only from `internal-test` evidence refs proving the generated files and structure. Internal tests are never harness-recognition evidence (R-LAYER-2, PRD 36 R-TEST-5).
- `provisional` — everything else.

### Current state (W18 R9 P1 seed)

The registry is seeded with the twenty W18 R8 first-party adapter tuples (codex, claude-code, pi across their descriptor placements) at their honest statuses. No real-harness evidence exists yet, so **no tuple is `conformance-validated`**; five tuples with write-path file-and-structure tests are `implementation-validated`, and the rest are `provisional`. The one real-harness observation on record is negative: the 2026-07-03 Codex v0.142.4 recognition probe (register item R-021), carried on `codex-plugin-native-project` as a `real-harness-probe` ref that advances nothing and opens the Phase 2 Codex-first scenarios.

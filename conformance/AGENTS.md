# Conformance Assets Router

This repo-root directory holds the maintainer-only conformance asset family: the tuple registry (`tuple-registry.json`), harness-agnostic scenario definitions organized by domain (`scenarios/<domain>/`, currently `scenarios/packaging/`), fixture Playbooks (`fixtures/`), and future compact result records organized by execution target (`results/<harness>/`).

- Read [README.md](README.md) first; it documents the formats, the evidence rules, and why this family lives at the repo root (outside `docs/assets/` and outside `packages/`).
- Conformance is not harness-specific: harness is one dimension of the eight-dimension evidence tuple (with model/provider, runtime, scenario, and more). Definitions organize by scenario domain and evidence by execution target — never subdivide `scenarios/` by harness, and never put a harness token in a scenario id or filename; target specifics live in each definition's `targets` map. See the Scope paragraph in the README.
- Contract chain: [PRD 37](../docs/prd/37-enhance-playbook-and-package-conformance.md) as revised by [PRD 42](../docs/prd/42-revise-conformance-asset-home-relocation.md) and [PRD 43](../docs/prd/43-revise-conformance-scenario-model-and-execution-kit.md).
- These are maintainer assets, never shipped and deliberately NOT authored upstream in `packages/docs/template/` — do not mirror them into the template, the packaged copy, or any install; the R-TEST-3 exclusion checks fail the build if they ship.
- Never hand-edit a status in `tuple-registry.json`: statuses are derived from recorded evidence and the fail-closed loader in `packages/cli/src/conformance/registry.ts` rejects asserted statuses. Record runs only through `recordConformanceRunOnRegistryEntry`.
- Raw lab-session transcripts and evidence scratch never live under repo-local `.make-docs/`; they stay in the disposable lab-session workspace or the machine-level store's lab area (register item D-024).
- This router itself is maintainer-local project content, not a dogfooded template asset.

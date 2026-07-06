# Conformance Assets Router

This repo-root directory holds the maintainer-only conformance asset family: the tuple registry (`tuple-registry.json`), packaging scenario specs (`scenarios/`), fixture Playbooks (`fixtures/`), and future compact result records (`results/`).

- Read [README.md](README.md) first; it documents the formats, the evidence rules, and why this family lives at the repo root (outside `docs/assets/` and outside `packages/`).
- Contract chain: [PRD 37](../docs/prd/37-enhance-playbook-and-package-conformance.md) as revised by [PRD 42](../docs/prd/42-revise-conformance-asset-home-relocation.md).
- These are maintainer assets, never shipped and deliberately NOT authored upstream in `packages/docs/template/` — do not mirror them into the template, the packaged copy, or any install; the R-TEST-3 exclusion checks fail the build if they ship.
- Never hand-edit a status in `tuple-registry.json`: statuses are derived from recorded evidence and the fail-closed loader in `packages/cli/src/conformance/registry.ts` rejects asserted statuses. Record runs only through `recordConformanceRunOnRegistryEntry`.
- This router itself is maintainer-local project content, not a dogfooded template asset.

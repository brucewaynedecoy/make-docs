---
title: "42 Revise Conformance Asset Home Relocation"
kind: "prd"
status: "active"
coordinate: "W18 R9"
source:
  type: "register"
  path: "docs/prd/03-open-questions-and-risk-register.md"
---

# 42 Revise Conformance Asset Home Relocation

## Purpose

Revise the mandated home of the W18 R9 conformance asset family — the tuple registry, packaging scenario specs, fixture Playbooks, and future compact result records — from `docs/assets/conformance/` to a repo-root maintainer directory `conformance/`, a peer of `packages/` and `scripts/`. [37-enhance-playbook-and-package-conformance.md](37-enhance-playbook-and-package-conformance.md) R-REG-1 mandated a path inside `docs/assets/` that the assets router never admitted, a silent contract-versus-contract conflict the user confirmed post-wave (register item D-022); this revision resolves the conflict by relocating the family rather than amending the router.

## Change Type

Revision, location only. R-REG-1's substance — the set of tuples and their statuses lives in ONE queryable data file, not in prose, so support status cannot drift from documentation — is unchanged, as are R-REG-2/R-REG-3, the evidence bar, the scenario set, the test layers, the governance rules, and the maintainer-only never-shipped boundary (R-KEEP-1, R-TEST-3). Only the directory the family lives in revises.

Route: `change-plan`

Coordinate: `W18 R9` (post-wave register-driven amendment, executed 2026-07-06)

## Baseline Being Revised or Removed

- [37-enhance-playbook-and-package-conformance.md](37-enhance-playbook-and-package-conformance.md): R-REG-1's `under docs/assets/conformance/` location clause, the Contracts and Data location prose, and every `docs/assets/conformance/` code anchor.
- [20-revise-agent-harness-model-conformance-lab.md](20-revise-agent-harness-model-conformance-lab.md): the lab-scope statement that scenario specs and compact reviewed result records "may live under a future `docs/assets/conformance/` tree", and the PRD 37 change note naming that registry home.
- [33-enhance-playbook-packaging-and-harness-adapter-registry.md](33-enhance-playbook-packaging-and-harness-adapter-registry.md): the PRD 37 change note naming the registry home.

## Rationale

Two defects in the original location, both confirmed by the user on 2026-07-06 after the W18 R9 wave completed (register item D-022):

1. **Contract-versus-contract conflict.** The `docs/assets/` router (shipped upstream in `packages/docs/template/` and dogfooded at `docs/assets/AGENTS.md`/`CLAUDE.md`) enumerates exactly four document families — `library`, `playbooks`, `artifacts`, and `archive` — and explicitly bars state-like content from `docs/assets/`. PRD 37 R-REG-1 mandated `docs/assets/conformance/` without amending that router, so the two accepted contracts silently disagreed and every conformance asset sat in a namespace whose own router did not admit it.
2. **Category conflation.** The directory holds machine-validated data (the tuple registry), executable protocol (the scenario specs), and compilation inputs (the fixture Playbooks) — none of which is reader documentation. Placing them beside the reader-facing document families conflated maintainer evidence infrastructure with the documentation asset surface.

The anti-drift goal R-REG-1 wanted — support status queryable and unable to drift from documentation — is achieved by the enforcement code (the fail-closed loaders in `packages/cli/src/conformance/`, the R-TEST-3 asset-detection markers, the meta-verification and governance checks), not by directory proximity to `docs/`. Relocating now is nearly free: zero result records exist, so no recorded evidence path ever changes retroactively. The move also resolves the router conflict without touching the routers — `docs/assets/` returns to exactly its four declared families, so the shipped and dogfooded assets routers need no amendment.

Code anchors:

- `docs/assets/AGENTS.md`
- `packages/docs/template/docs/assets/AGENTS.md`
- `packages/cli/src/conformance/registry.ts`

## Effective Requirement

### Change Notes

- Superseded by [44-revise-conformance-lab-execution-protocol-and-evidence-homes.md](44-revise-conformance-lab-execution-protocol-and-evidence-homes.md) (W18 R13, register items D-024 and R-028), raw-transcripts clause only: the sentence below preserving "raw transcripts local under `.make-docs/conformance/` per PRD 20's evidence classes" no longer holds — the repo-local transcript home is rejected, evidence scratch lives in the disposable lab-session workspace, and retained raw evidence goes to the machine-level store's lab area. Everything else this revision fixes is explicitly preserved by the W18 R13 round: the repo-root `conformance/` home stands and is not revisited, and [43-revise-conformance-scenario-model-and-execution-kit.md](43-revise-conformance-scenario-model-and-execution-kit.md) nests `scenarios/` by domain within it while verifying the R-TEST-3 markers survive the nesting.

R-REG-1 now reads with the revised location: the set of tuples and their statuses lives in a queryable data file, not in prose, under the repo-root `conformance/` directory, so that support status is queryable and cannot drift from documentation. Concretely:

- The conformance asset family lives at repo-root `conformance/`: `tuple-registry.json`, `scenarios/`, `fixtures/`, `README.md`, and — once real runs exist — `results/`. It is a maintainer-infrastructure peer of `packages/` and `scripts/`, deliberately outside `docs/assets/` (it is not reader documentation) and outside `packages/` (it is not shipped product).
- Everything else PRD 37 fixes about the family is preserved verbatim: maintainer-only, never shipped in templates, the packaged copy, or npm tarballs (R-KEEP-1, R-TEST-3); deliberately NOT authored upstream in `packages/docs/template/` as the stated exception to the upstream-first rule; statuses derived, never asserted (R-REG-2/3); raw transcripts local under `.make-docs/conformance/` per PRD 20's evidence classes.
- The R-TEST-3 detection markers in `packages/cli/src/conformance/meta-verification.ts` (mirrored by `scripts/smoke-pack.mjs`) detect the family at its new canonical home — a root-level `conformance/` directory in any scanned shipped tree plus the family's distinctive subtree fragments at any depth — while STILL failing anything that reappears under the retired `docs/assets/conformance` path, alongside the unchanged basename and schema-identifier detection.
- Every `docs/assets/conformance/` mention in PRD 37, PRD 20, PRD 33, dated designs and plans, completed W18 R9 backlog phases, and past history records reads historically; the effective home resolves through this document.

Code anchors:

- `conformance/README.md`
- `packages/cli/src/conformance/registry.ts`
- `packages/cli/src/conformance/scenario.ts`
- `packages/cli/src/conformance/governance.ts`
- `packages/cli/src/conformance/meta-verification.ts`
- `scripts/smoke-pack.mjs`

## Impacted Docs and Dependencies

- [37-enhance-playbook-and-package-conformance.md](37-enhance-playbook-and-package-conformance.md): the revised baseline; annotated under The Tuple Registry and Contracts and Data.
- [20-revise-agent-harness-model-conformance-lab.md](20-revise-agent-harness-model-conformance-lab.md) and [33-enhance-playbook-packaging-and-harness-adapter-registry.md](33-enhance-playbook-packaging-and-harness-adapter-registry.md): change notes naming the registry home gain a follow-on note.
- [03-open-questions-and-risk-register.md](03-open-questions-and-risk-register.md): D-022 records the conflict and its resolution; R-021 and R-022 path mentions updated in place.
- `packages/cli/src/conformance/**` loader constants, the R-TEST-3 markers, the five conformance test suites, `packages/cli/tests/consistency.test.ts`, and `scripts/smoke-pack.mjs` carry the implementation.
- The four declared claim surfaces ([conformance/README.md](../../conformance/README.md), the [user packaging guide](../assets/library/user/playbooks-packaging-shareable-agent-workflows.md), the [developer packaging guide](../assets/library/developer/playbooks-development-packaging-and-harness-adapters.md), and the [developer conformance-lab guide](../assets/library/developer/conformance-lab-scenario-and-result-contracts.md)) reference the registry home at its new path; the governance marker checks are unchanged in rule.
- The completed [W18 R9 backlog](../work/2026-07-01-w18-r9-playbook-and-package-conformance/00-index.md) carries a reconciliation usage note; its phase text stays historical.

Code anchors:

- `packages/cli/tests/conformance-meta-verification.test.ts`
- `packages/cli/tests/consistency.test.ts`

## Required Baseline Annotations

- [37-enhance-playbook-and-package-conformance.md](37-enhance-playbook-and-package-conformance.md): `Superseded by` under The Tuple Registry (R-REG) and under Contracts and Data, scoped to the location only.
- [20-revise-agent-harness-model-conformance-lab.md](20-revise-agent-harness-model-conformance-lab.md): `Superseded by` appended to the existing Change Notes under Effective Requirement, scoped to the conformance asset home only.
- [33-enhance-playbook-packaging-and-harness-adapter-registry.md](33-enhance-playbook-packaging-and-harness-adapter-registry.md): `Superseded by` appended to the existing Change Notes, scoped to the registry home only.
- [00-index.md](00-index.md): add this doc to the reading order, document map, and source anchors, and correct the index's own path mentions.

## Source Anchors

- [03-open-questions-and-risk-register.md](03-open-questions-and-risk-register.md)
- [37-enhance-playbook-and-package-conformance.md](37-enhance-playbook-and-package-conformance.md)
- [../assets/archive/history/2026-07-06-conformance-asset-relocation.md](../assets/archive/history/2026-07-06-conformance-asset-relocation.md)
- `conformance/README.md`
- `packages/cli/src/conformance/meta-verification.ts`
- `scripts/smoke-pack.mjs`

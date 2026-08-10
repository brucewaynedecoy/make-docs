---
title: "Conformance Asset Relocation to Repo-Root conformance/"
kind: "history"
status: "completed"
date: "2026-07-06"
client: "Claude Code"
model: "Fable 5"
coordinate: "W18"
repo: "make-docs"
branch: "make-docs-v2"
summary: "Relocated the W18 R9 conformance asset family from docs/assets/conformance/ to repo-root conformance/ per the user's post-wave D-022 decision, recorded the PRD 42 revision against PRD 37 R-REG-1, retargeted the loaders and R-TEST-3 markers, and swept every path mention with live docs updated and dated evidence left historical."
---

# Conformance Asset Relocation to Repo-Root conformance/

## Changes

This session executed the user's post-wave relocation decision, recorded as register item [D-022](../../../prd/03-open-questions-and-risk-register.md) (added Closed with its Resolution in the same change). The trigger was a user challenge after the W18 R9 wave completed: PRD 37 (retired action-PRD: `docs/prd/37-enhance-playbook-and-package-conformance.md`) R-REG-1 mandated the conformance asset home at `docs/assets/conformance/`, but the `docs/assets/` router — shipped upstream and dogfooded — admits exactly four reader-facing document families (library, playbooks, artifacts, archive) and bars state-like content, a silent contract-versus-contract conflict; and the directory conflated machine-validated data (the tuple registry), executable protocol (the scenario specs), and compilation inputs (the fixtures) with reader documentation. The user decided the family relocates to a repo-root maintainer directory `conformance/`, a peer of `packages/` and `scripts/`: R-REG-1's anti-drift goal is carried by the enforcement code, not directory proximity, the move was nearly free because zero result records existed, and it resolves the router conflict without touching the routers (verified: no assets router mentions conformance; all left untouched).

### The move and its contract chain

| Area | Summary |
| --- | --- |
| `git mv` (history follows) | `docs/assets/conformance/` → `conformance/` — `tuple-registry.json`, `scenarios/` (four Codex-first specs), `fixtures/agent/` (two fixture Playbooks), `README.md`. A minimal maintainer-local `conformance/AGENTS.md`/`CLAUDE.md` router stub was added (not dogfooded, not authored upstream). |
| this historical record (retired action-PRD: `docs/prd/42-revise-conformance-asset-home-relocation.md`) (new) | Revision against PRD 37, location only: the mandated home revises to repo-root `conformance/`; queryability, statuses, derivation rules, evidence bar, and the maintainer-only never-shipped boundary unchanged. |
| Change notes | PRD 37 (The Tuple Registry, Contracts and Data), PRD 20 ([historical closeout](2026-06-25-w10-r5-p4-validation-and-closeout.md); retired action-PRD: `docs/prd/20-revise-agent-harness-model-conformance-lab.md`) (Effective Requirement notes), and PRD 33 (Integration Impact notes; retired action-PRD: `docs/prd/33-enhance-playbook-packaging-and-harness-adapter-registry.md`) each carry a `Superseded by` note scoped to the location; nothing renumbered. |
| Register | D-022 added (Closed, with Resolution); R-021 and R-022 path mentions updated in place with relocation parentheticals. |
| [PRD index](../../../prd/00-index.md) | Row 42 added; reading order, source anchors, audience paths, and the W18 R9 follow-on line corrected to the new home. |

### Code, tests, and data

| Area | Summary |
| --- | --- |
| `packages/cli/src/conformance/` | `CONFORMANCE_TUPLE_REGISTRY_PATH` → `conformance/tuple-registry.json`, `CONFORMANCE_SCENARIO_SPECS_DIR` → `conformance/scenarios`, `CONFORMANCE_RESULT_RECORDS_DIR` → `conformance/results`, the claim-surface declaration → `conformance/README.md`, the governance sweep root → `conformance`, plus loader error strings and module-header prose. |
| R-TEST-3 markers (`meta-verification.ts`) | The single old-path fragment became `CONFORMANCE_ASSET_ROOT_DIR` + `CONFORMANCE_ASSET_PATH_MARKERS` with `isConformanceAssetPath`: a root-level `conformance/` directory in a scanned shipped tree fails, the family's distinctive subtree fragments (`conformance/tuple-registry.json`, `conformance/scenarios/`, `conformance/fixtures/`, `conformance/results/`) fail at any depth, and anything reappearing under the retired `docs/assets/conformance` path still fails; basename and schema-identifier detection unchanged, and compiled `dist/conformance/` check code deliberately does not match. `scripts/smoke-pack.mjs` mirrors the same marker set for the npm tarball. |
| Tests | The five conformance suites (`conformance-meta-verification`, `-tuple-registry`, `-scenarios`, `-governance`, plus `consistency.test.ts` via `listShippedConformanceAssetErrors`) retargeted; the exclusion-walker test now proves detection of the canonical home at a tree root, a nested copy, the old path, a relocated basename, and a renamed file by content marker. |
| Data files | `tuple-registry.json` note paths, all four scenario specs (`fixturePlaybooks` and workspace-copy steps), and both fixture Playbooks now reference `conformance/…` paths. |

### Docs sweep disposition

Live docs updated in place: the four claim surfaces ([conformance/README.md](../../../../conformance/README.md) — including a new location-rationale paragraph — the [user packaging guide](../../library/user/playbooks-packaging-shareable-agent-workflows.md), the [developer packaging guide](../../library/developer/playbooks-development-packaging-and-harness-adapters.md), and the [developer conformance-lab guide](../../library/developer/conformance-lab-scenario-and-result-contracts.md)), the register, the PRD set, and the PRD index. The artifacts lineage doc `docs/assets/artifacts/playbook-architecture.md` names no conformance path (verified; untouched). Dated evidence left historical: the completed [W18 R9 backlog](../../../work/2026-07-01-w18-r9-playbook-and-package-conformance/00-index.md) (which gained a reconciliation usage note per the R12-note pattern), its phase files, the W18 R9 plan and design docs, the W10 R5 plan and lab design, and the four W18 R9 phase history records — whose relative link targets alone were repointed so they resolve from the new location, with their displayed historical text unchanged. Remaining `docs/assets/conformance` mentions in code and this change's own docs are the deliberate old-home detection markers and explicit "relocated from" statements.

### Validation

Full CLI suite, build, `validate:defaults`, `smoke:pack`, path hygiene, and link resolution all green over the new layout (results pinned in the D-022 Resolution).

## Documentation

### Project

| Path | Description |
| --- | --- |
| this historical record (retired action-PRD: `docs/prd/42-revise-conformance-asset-home-relocation.md`) | New revision change doc relocating the conformance asset home to repo-root `conformance/`. |
| [docs/prd/03-open-questions-and-risk-register.md](../../../prd/03-open-questions-and-risk-register.md) | D-022 added Closed with Resolution; R-021/R-022 path mentions updated in place. |
| PRD 37 (retired action-PRD: `docs/prd/37-enhance-playbook-and-package-conformance.md`) | `Superseded by` change notes under The Tuple Registry and Contracts and Data. |
| [historical closeout](2026-06-25-w10-r5-p4-validation-and-closeout.md) (retired action-PRD: `docs/prd/20-revise-agent-harness-model-conformance-lab.md`) | Location-scoped `Superseded by` note appended to the existing change notes. |
| PRD 33 (retired action-PRD: `docs/prd/33-enhance-playbook-packaging-and-harness-adapter-registry.md`) | Registry-home-scoped `Superseded by` note appended. |
| [docs/prd/00-index.md](../../../prd/00-index.md) | PRD 42 catalogued; path mentions corrected. |
| [docs/work/2026-07-01-w18-r9-playbook-and-package-conformance/00-index.md](../../../work/2026-07-01-w18-r9-playbook-and-package-conformance/00-index.md) | Post-wave relocation reconciliation usage note added; phase text preserved as historical. |
| [conformance/README.md](../../../../conformance/README.md) + [conformance/AGENTS.md](../../../../conformance/AGENTS.md) | README self-description updated with the repo-root location rationale; new minimal maintainer-local router stub. |

### Developer

| Path | Description |
| --- | --- |
| [docs/assets/library/developer/conformance-lab-scenario-and-result-contracts.md](../../library/developer/conformance-lab-scenario-and-result-contracts.md) | Registry, scenario, fixture, result, and layer-home paths updated to `conformance/…`; R-TEST-3 detection description updated to the new marker design. |
| [docs/assets/library/developer/playbooks-development-packaging-and-harness-adapters.md](../../library/developer/playbooks-development-packaging-and-harness-adapters.md) | Registry and scenario path mentions updated. |

### User

| Path | Description |
| --- | --- |
| [docs/assets/library/user/playbooks-packaging-shareable-agent-workflows.md](../../library/user/playbooks-packaging-shareable-agent-workflows.md) | Conformance-registry link repointed to the repo-root home. |

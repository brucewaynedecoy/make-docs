# Agent Harness Model Conformance Lab - PRD Change Plan

## Objective

Turn the accepted conformance-lab design into an active PRD and work backlog for maintainer-only harness/model evidence, support-claim gating, and scenario/result records without expanding shipped make-docs installs or templates.

## Coordinate Decision

- Coordinate: `W10 R5`
- Route: `change-plan`
- Reason: this plan extends the W10 v2 package/deployment sequence after the Batch 1 package, materialization, compatibility, and source-of-truth contracts.
- Plan directory: `docs/plans/2026-06-23-w10-r5-agent-harness-model-conformance-lab/`
- PRD change doc: `docs/prd/20-agent-harness-conformance-and-support-claims.md`
- Work backlog: `docs/work/2026-06-23-w10-r5-agent-harness-model-conformance-lab/`

## Change Inputs

- Design: `docs/designs/2026-06-19-agent-harness-and-model-conformance-lab.md`
- Prior PRDs: `docs/prd/16-package-runtime-and-deployment-boundaries.md` through `docs/prd/06-template-contracts-and-generated-assets.md`
- Current code anchors: `packages/cli/src/types.ts`, `packages/cli/src/wizard.ts`, `packages/cli/src/skill-catalog.ts`, `packages/cli/src/audit.ts`, `packages/cli/src/manifest.ts`, and existing validation commands.

## Output Contract

This round produces a plan bundle, PRD 20, active PRD annotations, living risk-register updates, and a paired work backlog for the maintainer-only conformance lab.

## Phase Map

| Phase | File | Focus |
| --- | --- | --- |
| 1 | `01-active-prd-and-risk-reconciliation.md` | Register PRD 20 and update affected baseline/risk docs. |
| 2 | `02-scenario-and-result-contract.md` | Define scenario metadata, run result records, verdicts, raw artifact storage, and reviewer status. |
| 3 | `03-harness-adapter-and-support-claim-gating.md` | Keep current product harnesses separate from future lab adapters and gate public support claims by evidence tuple. |
| 4 | `04-delta-backlog-and-closeout.md` | Generate work backlog, validate, and commit this planning round. |

## Intended Follow-On

Implement the lab only as maintainer infrastructure. Scenario specs and reviewed result records may live under future `docs/assets/conformance/`; raw artifacts default to `.make-docs/conformance/` or `.make-docs/runs/conformance/` and are not committed by default.

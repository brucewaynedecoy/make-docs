# CLI Asset Selection Simplification - Change Plan

**Date:** 2026-04-28
**Repository:** `/Users/tylerkneisly/Developer/Source/Tyler/Projects/make-docs`
**Purpose:** Produce a reviewable active-set evolution plan for the CLI asset-selection simplification captured in [2026-04-28-cli-asset-selection-simplification.md](../../designs/2026-04-28-cli-asset-selection-simplification.md).

## Objective

Revise the active PRD namespace, CLI wizard, selection normalization, and tests so prompts, document templates, and reference files are no longer user-selectable asset groups. The completed change should remove the three interactive asset prompts, remove their rows from the wizard review summary, and ensure install, sync, and reconfigure flows always manage all included prompts, templates, and references that belong to the effective product surface.

Completion means:

- the active PRD set records the revision in a new numbered change doc
- impacted baseline PRD docs contain `### Change Notes` backlinks
- the CLI no longer exposes prompt/template/reference selection as interactive wizard decisions
- effective selections normalize to prompts included, all templates, and all references before planning or manifest writes
- tests prove the shorter wizard flow, review output, asset inclusion, and compatibility behavior
- a scoped delta backlog is ready under the matching `docs/work/` coordinate

## Coordinate Decision

- Coordinate: `W14 R0`
- Classification: `new-wave`
- Evidence: the originating design explicitly recommends `W14 R0` after the current latest planned/work coordinate `W13 R0`. The design is related to prior `W4 R0`, `W8 R0`, and `W9 R1` asset and CLI work, but it introduces a new end-to-end change plan against the active PRD namespace rather than revising one prior wave's artifacts. `docs/plans/` and `docs/work/` currently have no `w14-r0` entry.

## Change Classification

- Requested change type: `revision`
- Effective execution mode: `active-set evolution`
- Cleanup rewrite requested: no
- Full backlog regeneration requested: no

This is a revision because it changes established requirements for the CLI options step, review summary, install-selection data, and asset-selection contract. It also removes public user choice points, but the capability is not being removed from the product; asset installation becomes more comprehensive and less configurable.

## Change Inputs

| Input | Format | Location | Confidence |
| ----- | ------ | -------- | ---------- |
| Originating design | Markdown design doc | `docs/designs/2026-04-28-cli-asset-selection-simplification.md` | High |
| Active CLI PRD baseline | Markdown PRD docs | `docs/prd/05-installation-profile-and-manifest-lifecycle.md`, `docs/prd/06-template-contracts-and-generated-assets.md`, `docs/prd/07-cli-command-surface-and-lifecycle.md` | High |
| Shared risk register | Markdown PRD doc | `docs/prd/03-open-questions-and-risk-register.md` | High |
| Current wizard implementation | TypeScript | `packages/cli/src/wizard.ts` | High |
| Current selection and asset resolution | TypeScript | `packages/cli/src/cli.ts`, `packages/cli/src/profile.ts`, `packages/cli/src/rules.ts`, `packages/cli/src/catalog.ts` | High |
| Current tests | TypeScript tests | `packages/cli/tests/wizard.test.ts`, `packages/cli/tests/cli.test.ts`, `packages/cli/tests/install.test.ts`, `packages/cli/tests/profile.test.ts`, `packages/cli/tests/consistency.test.ts`, `packages/cli/tests/renderers.test.ts` | High |
| Planning references | Markdown references/templates | `docs/assets/references/prd-change-management.md`, `docs/assets/references/wave-model.md`, `docs/assets/templates/prd-change-revision.md` | High |

Open questions for execution:

- Should legacy non-interactive asset flags be removed, rejected with migration guidance, or accepted but normalized to always-managed values for one compatibility window?
- Should `prompts`, `templatesMode`, and `referencesMode` remain in `InstallSelections` and persisted manifests as compatibility fields, or should execution remove them from shared types in this wave?

## Baseline Context

- Active `docs/prd/` status: active PRD namespace exists with fixed core docs `00` through `10`.
- Impacted baseline docs: `03`, `05`, `06`, and `07`.
- Discovery pass required: yes.
- Discovery scope: current CLI flag/help behavior for `--no-prompts`, template mode, and reference mode; manifest compatibility for older selections; profile ID impact; asset list impact; wizard tests and install/smoke tests that assume configurable asset choices.

## Output Contract

- Plan directory: `docs/plans/2026-04-28-w14-r0-cli-asset-selection-simplification/`
  - entry point: `docs/plans/2026-04-28-w14-r0-cli-asset-selection-simplification/00-overview.md`
  - phase files: `docs/plans/2026-04-28-w14-r0-cli-asset-selection-simplification/0N-<phase>.md`
- New change doc:
  - `docs/prd/11-revise-cli-asset-selection-simplification.md`
- Baseline docs to annotate:
  - `docs/prd/03-open-questions-and-risk-register.md`
  - `docs/prd/05-installation-profile-and-manifest-lifecycle.md`
  - `docs/prd/06-template-contracts-and-generated-assets.md`
  - `docs/prd/07-cli-command-surface-and-lifecycle.md`
- Index update:
  - `docs/prd/00-index.md`
- Delta backlog:
  - `docs/work/2026-04-28-w14-r0-cli-asset-selection-simplification/`

## Change Doc Strategy

| New doc | Kind | Why it exists | Affected baseline docs |
| ------- | ---- | ------------- | ---------------------- |
| `11-revise-cli-asset-selection-simplification.md` | `revision` | Records that prompt/template/reference asset choices are no longer active user decisions and that all included assets are always managed. | `03`, `05`, `06`, `07` |

The change doc should use `docs/assets/templates/prd-change-revision.md` and treat the effective requirement as:

- interactive wizard asset prompts are removed
- review summary omits invariant asset rows
- install selections normalize to prompts included, all templates, and all references
- asset planning continues to include every included prompt, template, and reference that belongs to the effective capability surface
- compatibility with existing manifests is explicit and tested

## Baseline Annotation Plan

| Baseline doc | Impacted sections | Note verb | Target change doc |
| ------------ | ----------------- | --------- | ----------------- |
| `docs/prd/03-open-questions-and-risk-register.md` | `Confirmed Drift`; `Open Questions` rows about template/reference modes | `Superseded by` | `11-revise-cli-asset-selection-simplification.md` |
| `docs/prd/05-installation-profile-and-manifest-lifecycle.md` | `Contracts and Data`; selection/profile identity references that include prompt/template/reference modes | `Superseded by` | `11-revise-cli-asset-selection-simplification.md` |
| `docs/prd/06-template-contracts-and-generated-assets.md` | `Component and Capability Map`; `Contracts and Data`; rebuild/risk notes about prompt/template/reference asset selection | `Superseded by` | `11-revise-cli-asset-selection-simplification.md` |
| `docs/prd/07-cli-command-surface-and-lifecycle.md` | `Interactive wizard and review flow`; `Contracts and Data`; rebuild/risk notes for the wizard options step | `Superseded by` | `11-revise-cli-asset-selection-simplification.md` |

## Phase Map

| File | Purpose |
| ---- | ------- |
| `01-prd-change-and-baseline-annotations.md` | Create the PRD change doc, annotate impacted baseline docs, and update the PRD index without renumbering existing docs. |
| `02-cli-selection-surface.md` | Remove asset-selection prompts from the wizard and settle the non-interactive flag/help behavior for asset controls. |
| `03-asset-normalization-and-compatibility.md` | Normalize effective selections to always-managed assets and preserve compatibility with existing manifests, profile IDs, and planner behavior. |
| `04-tests-delta-backlog-and-validation.md` | Update targeted tests, create the matching delta backlog, and run focused validation. |

## Dependencies

- Phase 1 should land first because execution needs the effective requirement and baseline backlinks before code changes begin.
- Phase 2 depends on Phase 1 for public behavior wording and owns the user-visible CLI surface.
- Phase 3 can run in parallel with Phase 2 after Phase 1 if write scopes stay disjoint, but final integration must reconcile wizard output, CLI overrides, manifest compatibility, and profile IDs.
- Phase 4 depends on Phases 1 through 3 for final expected behavior and target paths.

## Worker Ownership

If implementation is delegated, split ownership by write scope:

| Worker | Scope | Write Scope | Dependencies | Deliverables |
| ------ | ----- | ----------- | ------------ | ------------ |
| PRD worker | Active PRD evolution | `docs/prd/00-index.md`, `docs/prd/03-open-questions-and-risk-register.md`, `docs/prd/05-installation-profile-and-manifest-lifecycle.md`, `docs/prd/06-template-contracts-and-generated-assets.md`, `docs/prd/07-cli-command-surface-and-lifecycle.md`, `docs/prd/11-revise-cli-asset-selection-simplification.md` | Originating design and current PRD set | Change doc, baseline annotations, index update |
| CLI surface worker | Wizard and public CLI option behavior | `packages/cli/src/wizard.ts`, selected help/argument surfaces in `packages/cli/src/cli.ts` | Phase 1 requirement | Shorter wizard flow, review summary without invariant asset rows, settled flag/help behavior |
| Compatibility worker | Selection normalization and asset planning | `packages/cli/src/profile.ts`, `packages/cli/src/rules.ts`, `packages/cli/src/types.ts`, manifest/selection helpers as needed | Phase 1 and interface decisions from Phase 2 | Always-managed asset normalization with manifest/backward-compat behavior |
| Test and backlog worker | Tests and execution backlog | `packages/cli/tests/**`, `docs/work/2026-04-28-w14-r0-cli-asset-selection-simplification/**` | Phases 1 through 3 | Targeted tests, delta backlog, validation notes |
| Validation worker | Final contract and regression pass | Validation-only edits across touched files | All prior workers | Passing focused tests, link checks, stale-string checks, and final review |

## MCP Strategy

- Use `jdocmunch` first for design, PRD, plan, work, and reference discovery.
- Use `jcodemunch` first for code symbols, signatures, and source anchors in `packages/cli/`.
- Reindex both after meaningful docs or code edits before final validation.
- Use `rg` only for exact stale-string and path checks when indexed lookup is insufficient.

## Non-Goals

- Do not reduce the actual prompt/template/reference asset set.
- Do not regenerate the full PRD namespace.
- Do not regenerate the full implementation backlog.
- Do not rewrite unrelated CLI lifecycle behavior, skills behavior, backup, uninstall, or instruction conflict handling.
- Do not delete historical design, plan, work, or history artifacts that mention older asset-selection behavior.

## Validation

Execution should verify:

1. `docs/prd/11-revise-cli-asset-selection-simplification.md` exists, uses the revision template, and is listed in `docs/prd/00-index.md`.
2. Impacted baseline PRD docs contain `### Change Notes` backlinks to the new change doc, and no existing PRD docs are renumbered.
3. The wizard no longer asks `Install starter prompts?`, `Which document templates should be installed?`, or `Which reference files should be installed?`.
4. The wizard review summary no longer includes prompt, template mode, or reference mode rows.
5. Effective install selections always produce prompts included, all templates, and all references before planning and manifest writes.
6. Existing manifests with omitted prompts or required-only asset modes are handled deliberately and covered by tests.
7. Install/reconfigure tests prove all included prompts, templates, and references remain managed.
8. Focused commands pass, at minimum: `npm test -w make-docs -- wizard`, `npm test -w make-docs -- cli`, `npm test -w make-docs -- install`, `npm test -w make-docs -- profile`, and `npm run build -w make-docs`.
9. `jdocmunch` and `jcodemunch` are refreshed after execution.

# CLI Skill Selection Simplification - Change Plan

**Date:** 2026-04-28
**Repository:** `/Users/tylerkneisly/Developer/Source/Tyler/Projects/make-docs`
**Purpose:** Produce a reviewable active-set evolution plan for the CLI skill-selection simplification captured in [2026-04-28-cli-skill-selection-simplification.md](../../designs/2026-04-28-cli-skill-selection-simplification.md).

## Objective

Revise the active PRD namespace, CLI registry contract, install-selection model, skill-selection UI, skills command, and tests so shipped skills are treated as one recommended set. The completed change should remove the required-versus-optional skill distinction, select every registry skill by default, allow every skill to be deselected, and preserve predictable migration for existing manifests that still store `optionalSkills`.

Completion means:

- the active PRD set records the revision in a new numbered change doc
- impacted baseline PRD docs contain `### Change Notes` backlinks
- the skill registry no longer carries `required` metadata
- install planning uses a selected-skill set rather than `required || optional`
- the full install wizard and skills-only command stop showing `Default` and `Optional` skill categories
- review and help text use selected-skill language instead of optional-skill language
- tests prove fresh defaults, deselection, migration, registry validation, and install planning behavior
- a scoped delta backlog is ready under the matching `docs/work/` coordinate

## Coordinate Decision

- Coordinate: `W14 R1`
- Classification: `revision`
- Evidence: the originating design explicitly names `W5 R2` as the related completed coordinate for CLI-managed skill installation and recommends `W14 R0` only if planned together with the CLI asset-selection simplification work. `docs/plans/2026-04-28-w14-r0-cli-asset-selection-simplification/` already exists, so this plan uses the next available `W14` revision rather than overwriting `W14 R0` or returning to the older `W5` sequence.

## Change Classification

- Requested change type: `revision`
- Effective execution mode: `active-set evolution`
- Cleanup rewrite requested: no
- Full backlog regeneration requested: no

This is a revision because it changes established requirements for the skills registry, `InstallSelections`, manifest migration, skill install planning, CLI flags, and interactive skill-selection surfaces. It does not remove skill installation as a capability; it changes how users select the recommended skill set.

## Change Inputs

| Input | Format | Location | Confidence |
| ----- | ------ | -------- | ---------- |
| Originating design | Markdown design doc | `docs/designs/2026-04-28-cli-skill-selection-simplification.md` | High |
| Prior skill installation design | Markdown design doc | `docs/designs/2026-04-16-cli-skill-installation-r2.md` | High |
| Related asset-selection simplification plan | Markdown plan directory | `docs/plans/2026-04-28-w14-r0-cli-asset-selection-simplification/` | High |
| Active skills PRD baseline | Markdown PRD doc | `docs/prd/08-skills-catalog-and-distribution.md` | High |
| Manifest and lifecycle PRD baseline | Markdown PRD doc | `docs/prd/05-installation-profile-and-manifest-lifecycle.md` | High |
| CLI surface PRD baseline | Markdown PRD doc | `docs/prd/07-cli-command-surface-and-lifecycle.md` | High |
| Shared risk register | Markdown PRD doc | `docs/prd/03-open-questions-and-risk-register.md` | High |
| Current registry and selection model | JSON and TypeScript | `packages/cli/skill-registry.json`, `packages/cli/skill-registry.schema.json`, `packages/cli/src/skill-registry.ts`, `packages/cli/src/skill-catalog.ts`, `packages/cli/src/types.ts`, `packages/cli/src/manifest.ts` | High |
| Current skill UI and command surface | TypeScript | `packages/cli/src/wizard.ts`, `packages/cli/src/skills-ui.ts`, `packages/cli/src/cli.ts`, `packages/cli/src/skills-command.ts` | High |
| Current tests | TypeScript tests | `packages/cli/tests/skill-registry.test.ts`, `packages/cli/tests/skill-catalog.test.ts`, `packages/cli/tests/wizard.test.ts`, `packages/cli/tests/skills-ui.test.ts`, `packages/cli/tests/cli.test.ts`, `packages/cli/tests/install.test.ts` | High |

Open questions for execution:

- Should the replacement headless flag be named `--skills <csv|all|none>` or `--selected-skills <csv|all|none>`?
- Should deprecated `--optional-skills` remain accepted for one compatibility window, and if so should it warn or silently map to the new selected-skill model?
- Should the migration field be named `selectedSkills` exactly, or should implementation choose a more specific persisted name after inspecting current tests and manifest shape?

## Baseline Context

- Active `docs/prd/` status: active PRD namespace exists with fixed core docs `00` through `10`; no change doc has been written for this skill-selection revision yet.
- Impacted baseline docs: `03`, `05`, `07`, and `08`.
- Discovery pass required: yes.
- Discovery scope: registry schema and validation, skill install asset selection, manifest migration, profile identity, full install wizard skill screen, skills-only UI flow, CLI help and flag validation, install/audit expectations for prior selections, and tests that assert required/default versus optional behavior.

## Output Contract

- Plan directory: `docs/plans/2026-04-28-w14-r1-cli-skill-selection-simplification/`
  - entry point: `docs/plans/2026-04-28-w14-r1-cli-skill-selection-simplification/00-overview.md`
  - phase files: `docs/plans/2026-04-28-w14-r1-cli-skill-selection-simplification/0N-<phase>.md`
- New change doc:
  - `docs/prd/12-revise-cli-skill-selection-simplification.md`
- Baseline docs to annotate:
  - `docs/prd/03-open-questions-and-risk-register.md`
  - `docs/prd/05-installation-profile-and-manifest-lifecycle.md`
  - `docs/prd/07-cli-command-surface-and-lifecycle.md`
  - `docs/prd/08-skills-catalog-and-distribution.md`
- Index update:
  - `docs/prd/00-index.md`
- Delta backlog:
  - `docs/work/2026-04-28-w14-r1-cli-skill-selection-simplification/`

If `docs/prd/11-revise-cli-asset-selection-simplification.md` has not been created by the time this plan executes, execution should confirm whether doc `12` is still correct or whether the next available PRD number has changed. Do not renumber existing PRD docs.

## Change Doc Strategy

| New doc | Kind | Why it exists | Affected baseline docs |
| ------- | ---- | ------------- | ---------------------- |
| `12-revise-cli-skill-selection-simplification.md` | `revision` | Records that skills are one recommended, selected-by-default set rather than required/default plus optional categories. | `03`, `05`, `07`, `08` |

The change doc should use `docs/assets/templates/prd-change-revision.md` and treat the effective requirement as:

- registry entries describe installable recommended skills and do not carry `required`
- persisted selections represent selected skills, not optional additions to an implicit required set
- fresh installs select every registry skill by default when skills are enabled
- every listed skill can be deselected in the interactive UI
- full install and skills-only flows avoid `Default`, `Optional`, `Required skills`, and `Optional skills` product vocabulary
- old manifests with `optionalSkills` migrate to an equivalent effective selected-skill set

## Baseline Annotation Plan

| Baseline doc | Impacted sections | Note verb | Target change doc |
| ------------ | ----------------- | --------- | ----------------- |
| `docs/prd/03-open-questions-and-risk-register.md` | confirmed drift and risk rows for skills delivery, skill registry, and authoring/release guidance | `Superseded by` | `12-revise-cli-skill-selection-simplification.md` |
| `docs/prd/05-installation-profile-and-manifest-lifecycle.md` | `Contracts and Data`; selection/profile identity references to `optionalSkills`; manifest migration notes | `Superseded by` | `12-revise-cli-skill-selection-simplification.md` |
| `docs/prd/07-cli-command-surface-and-lifecycle.md` | skills command and flag validation; wizard/review behavior where skill selection affects public UX | `Superseded by` | `12-revise-cli-skill-selection-simplification.md` |
| `docs/prd/08-skills-catalog-and-distribution.md` | command behavior, catalog layer, registry contract, shipped inventory, install selections, and tests that describe required/optional behavior | `Superseded by` | `12-revise-cli-skill-selection-simplification.md` |

## Phase Map

| File | Purpose |
| ---- | ------- |
| `01-prd-change-and-baseline-annotations.md` | Create the PRD change doc, annotate impacted baseline docs, and update the PRD index without renumbering existing docs. |
| `02-registry-and-selection-model.md` | Remove `required` from the registry contract and replace `optionalSkills` with a selected-skill model through catalog, profile, and manifest migration. |
| `03-cli-skill-selection-ux.md` | Update the full install wizard, skills-only UI, review summaries, help text, and headless flag behavior to use one selected-skill list. |
| `04-tests-delta-backlog-and-validation.md` | Update targeted tests, create the matching delta backlog, and run focused validation. |

## Dependencies

- Phase 1 should land first because execution needs the effective requirement and baseline backlinks before code changes begin.
- Phase 2 owns the structural data model and should settle field names before UX code is updated.
- Phase 3 depends on Phase 2 for the selected-skill state shape, but can inspect UI copy and test expectations in parallel.
- Phase 4 depends on Phases 1 through 3 for final expected behavior and target paths.

## Worker Ownership

If implementation is delegated, split ownership by write scope:

| Worker | Scope | Write Scope | Dependencies | Deliverables |
| ------ | ----- | ----------- | ------------ | ------------ |
| PRD worker | Active PRD evolution | `docs/prd/00-index.md`, `docs/prd/03-open-questions-and-risk-register.md`, `docs/prd/05-installation-profile-and-manifest-lifecycle.md`, `docs/prd/07-cli-command-surface-and-lifecycle.md`, `docs/prd/08-skills-catalog-and-distribution.md`, `docs/prd/12-revise-cli-skill-selection-simplification.md` | Originating design and current PRD set | Change doc, baseline annotations, index update |
| Registry/model worker | Registry, selection, profile, and manifest model | `packages/cli/skill-registry.json`, `packages/cli/skill-registry.schema.json`, `packages/cli/src/skill-registry.ts`, `packages/cli/src/skill-catalog.ts`, `packages/cli/src/types.ts`, `packages/cli/src/profile.ts`, `packages/cli/src/manifest.ts` | Phase 1 requirement | Recommended-skill registry and selected-skill data model with compatibility migration |
| UX worker | Full install and skills-only skill-selection surfaces | `packages/cli/src/wizard.ts`, `packages/cli/src/skills-ui.ts`, `packages/cli/src/cli.ts`, `packages/cli/src/skills-command.ts`, help/readme surfaces if needed | Phase 2 selected-skill shape | One-list skill picker, selected-skill review language, replacement flag behavior |
| Test and backlog worker | Tests and execution backlog | `packages/cli/tests/**`, `docs/work/2026-04-28-w14-r1-cli-skill-selection-simplification/**` | Phases 1 through 3 | Targeted tests, delta backlog, validation notes |
| Validation worker | Final contract and regression pass | Validation-only edits across touched files | All prior workers | Passing focused tests, link checks, stale-string checks, and final review |

## MCP Strategy

- Use `jdocmunch` first for design, PRD, plan, work, and reference discovery.
- Use `jcodemunch` first for code symbols, signatures, and source anchors in `packages/cli/`.
- Reindex both after meaningful docs or code edits before final validation.
- Use `rg` only for exact stale-string and path checks when indexed lookup is insufficient.

## Non-Goals

- Do not remove skill installation, the `make-docs skills` command, project/global skill scope, harness selection, or `skillFiles` ownership tracking.
- Do not change the remote skill resolver or introduce bundled skill payloads.
- Do not regenerate the full PRD namespace.
- Do not regenerate the full implementation backlog.
- Do not rewrite unrelated asset-selection behavior covered by `W14 R0`.
- Do not delete historical design, plan, work, or history artifacts that mention older required/optional skill behavior.

## Validation

Execution should verify:

1. `docs/prd/12-revise-cli-skill-selection-simplification.md` exists, uses the revision template, and is listed in `docs/prd/00-index.md`.
2. Impacted baseline PRD docs contain `### Change Notes` backlinks to the new change doc, and no existing PRD docs are renumbered.
3. `packages/cli/skill-registry.json` and `packages/cli/skill-registry.schema.json` no longer require or carry `required`.
4. `InstallSelections` and manifest migration represent selected skills instead of optional-only additions.
5. Fresh default selections install every registry skill when skills are enabled.
6. Full install and skills-only skill-selection screens show no `Default` or `Optional` heading rows.
7. The highlighted skill detail panel and bottom selection/instruction section remain, while the old default-skill immutability note is absent.
8. Review summaries and help text use selected-skill language and retain a deliberate compatibility path for deprecated `--optional-skills` if execution keeps it.
9. Focused commands pass, at minimum: `npm test -w make-docs -- skill-registry`, `npm test -w make-docs -- skill-catalog`, `npm test -w make-docs -- wizard`, `npm test -w make-docs -- skills-ui`, `npm test -w make-docs -- cli`, `npm test -w make-docs -- install`, and `npm run build -w make-docs`.
10. `jdocmunch` and `jcodemunch` are refreshed after execution.

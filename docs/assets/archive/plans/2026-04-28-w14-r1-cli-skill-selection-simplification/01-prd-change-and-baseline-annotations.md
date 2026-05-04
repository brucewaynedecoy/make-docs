# Phase 1 - PRD Change and Baseline Annotations

## Objective

Evolve the active PRD namespace so the CLI skill-selection simplification has a durable requirement record before implementation starts.

## Depends On

- Originating design: [2026-04-28-cli-skill-selection-simplification.md](../../designs/2026-04-28-cli-skill-selection-simplification.md)
- Change-management rules: `docs/assets/references/prd-change-management.md`
- Revision template: `docs/assets/templates/prd-change-revision.md`

## Files To Modify

- `docs/prd/00-index.md`
- `docs/prd/03-open-questions-and-risk-register.md`
- `docs/prd/05-installation-profile-and-manifest-lifecycle.md`
- `docs/prd/07-cli-command-surface-and-lifecycle.md`
- `docs/prd/08-skills-catalog-and-distribution.md`
- `docs/prd/12-revise-cli-skill-selection-simplification.md`

## Detailed Changes

### 1. Add `12-revise-cli-skill-selection-simplification.md`

Use `docs/assets/templates/prd-change-revision.md`.

The change doc should record:

- Change Type: `revision`
- Baseline Being Revised or Removed:
  - the skills registry contract in `docs/prd/08-skills-catalog-and-distribution.md`
  - the selected-skill state and manifest migration contract in `docs/prd/05-installation-profile-and-manifest-lifecycle.md`
  - the full install wizard and skills command UX in `docs/prd/07-cli-command-surface-and-lifecycle.md`
  - the shared drift/risk entries in `docs/prd/03-open-questions-and-risk-register.md`
- Effective Requirement:
  - all registry skills are recommended and selected by default when skills are enabled
  - every listed skill can be deselected
  - registry entries no longer carry `required`
  - persisted selections represent selected skills rather than optional skill additions
  - legacy manifests with `optionalSkills` migrate to the prior effective selected-skill set
  - user-facing copy avoids `Default`, `Optional`, `Required skills`, and `Optional skills` as product categories

Source anchors should include:

- `docs/designs/2026-04-28-cli-skill-selection-simplification.md`
- `packages/cli/skill-registry.json`
- `packages/cli/skill-registry.schema.json`
- `packages/cli/src/skill-registry.ts`
- `packages/cli/src/skill-catalog.ts`
- `packages/cli/src/types.ts`
- `packages/cli/src/manifest.ts`
- `packages/cli/src/wizard.ts`
- `packages/cli/src/skills-ui.ts`
- `packages/cli/src/cli.ts`

### 2. Update `00-index.md`

Append the new doc to the Document Map without renumbering existing docs.

Recommended entry:

| Slot | Status | Document | Focus |
| --- | --- | --- | --- |
| `12` | Current | [12-revise-cli-skill-selection-simplification.md](../../../../prd/12-revise-cli-skill-selection-simplification.md) | Revision making shipped skills one recommended, selected-by-default set instead of required/default plus optional categories. |

If doc `11` has not yet been created by `W14 R0` execution, confirm the next available PRD number before writing. Do not reserve or create placeholder docs.

### 3. Annotate impacted baseline docs

Add `### Change Notes` blocks directly under the impacted headings or requirement paragraphs.

Use:

```md
### Change Notes

- Superseded by [12-revise-cli-skill-selection-simplification.md](../../../../prd/12-revise-cli-skill-selection-simplification.md).
```

Targets:

- `03-open-questions-and-risk-register.md`
  - confirmed drift row for live skills delivery model
  - skills authoring/release guidance row if it describes the old registry shape
  - risk rows where optional/default skill assumptions affect safety or distribution
- `05-installation-profile-and-manifest-lifecycle.md`
  - `Contracts and Data`, where `InstallSelections`, profile identity, and manifest migration currently include `optionalSkills`
- `07-cli-command-surface-and-lifecycle.md`
  - skills command flag validation and help behavior
  - wizard/review sections where skill selection is part of user-facing flow
- `08-skills-catalog-and-distribution.md`
  - command behavior
  - catalog layer
  - registry contract
  - shipped inventory
  - install selections and manifest ownership
  - clean-room rebuild notes that mention required/optional behavior

### 4. Keep baseline text visible

Do not delete or silently rewrite the baseline requirement text during PRD evolution. The change doc becomes the effective requirement through backlinks.

Cleanup rewrites can happen later only if explicitly requested.

## Parallelism

This phase is mostly single-write-scope because multiple PRD files must be kept consistent. If delegated, one worker should own all PRD edits, with a separate validation worker reviewing links and numbering afterward.

## Acceptance Criteria

- `docs/prd/12-revise-cli-skill-selection-simplification.md` exists and uses the revision change-doc structure.
- `docs/prd/00-index.md` lists the new change doc without renumbering existing docs.
- Every impacted baseline doc has targeted `### Change Notes` backlinks.
- The effective requirement can be resolved by following the baseline links to the new change doc.
- No active PRD baseline content is deleted as part of the change.

# Phase 1 - PRD Change and Baseline Annotations

## Objective

Evolve the active PRD namespace so the CLI asset-selection simplification has a durable requirement record before implementation starts.

## Depends On

- Originating design: [2026-04-28-cli-asset-selection-simplification.md](../../designs/2026-04-28-cli-asset-selection-simplification.md)
- Change-management rules: `docs/assets/references/prd-change-management.md`
- Revision template: `docs/assets/templates/prd-change-revision.md`

## Files To Modify

- `docs/prd/00-index.md`
- `docs/prd/03-open-questions-and-risk-register.md`
- `docs/prd/05-installation-profile-and-manifest-lifecycle.md`
- `docs/prd/06-template-contracts-and-generated-assets.md`
- `docs/prd/07-cli-command-surface-and-lifecycle.md`
- `docs/prd/11-revise-cli-asset-selection-simplification.md`

## Detailed Changes

### 1. Add `11-revise-cli-asset-selection-simplification.md`

Use `docs/assets/templates/prd-change-revision.md`.

The change doc should record:

- Change Type: `revision`
- Baseline Being Revised or Removed:
  - the wizard options step in `docs/prd/07-cli-command-surface-and-lifecycle.md`
  - the asset-selection contract in `docs/prd/06-template-contracts-and-generated-assets.md`
  - install-selection and manifest/profile semantics in `docs/prd/05-installation-profile-and-manifest-lifecycle.md`
  - the open drift/question entries in `docs/prd/03-open-questions-and-risk-register.md`
- Effective Requirement:
  - prompt starters are always included when their capability requirements are satisfied
  - document templates are always selected from the complete included set for effective capabilities
  - reference files are always selected from the complete included set for effective capabilities
  - the wizard does not ask prompt/template/reference asset questions
  - review output does not list invariant asset choices
  - existing manifest selections are normalized or migrated safely

Source anchors should include:

- `docs/designs/2026-04-28-cli-asset-selection-simplification.md`
- `packages/cli/src/wizard.ts`
- `packages/cli/src/cli.ts`
- `packages/cli/src/profile.ts`
- `packages/cli/src/rules.ts`
- `packages/cli/tests/wizard.test.ts`
- `packages/cli/tests/install.test.ts`

### 2. Update `00-index.md`

Append the new doc to the Document Map without renumbering existing docs.

Recommended entry:

| Slot | Status | Document | Focus |
| --- | --- | --- | --- |
| `11` | Current | [11-revise-cli-asset-selection-simplification.md](11-revise-cli-asset-selection-simplification.md) | Revision making prompt, template, and reference assets always managed rather than user-selectable. |

Update reading guidance only if needed. Keep the index concise and avoid turning it into a design explanation.

### 3. Annotate impacted baseline docs

Add `### Change Notes` blocks directly under the impacted headings or requirement paragraphs.

Use:

```md
### Change Notes

- Superseded by [11-revise-cli-asset-selection-simplification.md](./11-revise-cli-asset-selection-simplification.md).
```

Targets:

- `03-open-questions-and-risk-register.md`
  - confirmed drift row for template/reference mode labels
  - open question row asking whether template/reference modes should remain public options
- `05-installation-profile-and-manifest-lifecycle.md`
  - `Contracts and Data`, where `InstallSelections` and profile identity currently include prompt/template/reference modes
- `06-template-contracts-and-generated-assets.md`
  - asset selection sections that describe prompts being disabled, template/reference modes, or selector behavior
- `07-cli-command-surface-and-lifecycle.md`
  - `Interactive wizard and review flow`
  - `Contracts and Data`

### 4. Keep baseline text visible

Do not delete or silently rewrite the baseline requirement text during PRD evolution. The change doc becomes the effective requirement through backlinks.

Cleanup rewrites can happen later only if explicitly requested.

## Parallelism

This phase is mostly single-write-scope because multiple PRD files must be kept consistent. If delegated, one worker should own all PRD edits, with a separate validation worker reviewing links and numbering afterward.

## Acceptance Criteria

- `docs/prd/11-revise-cli-asset-selection-simplification.md` exists and uses the revision change-doc structure.
- `docs/prd/00-index.md` lists doc `11` without renumbering existing docs.
- Every impacted baseline doc has a targeted `### Change Notes` backlink.
- The effective requirement can be resolved by following the baseline links to doc `11`.
- No active PRD baseline content is deleted as part of the change.

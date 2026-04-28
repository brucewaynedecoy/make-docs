# Phase 2 - Templates and Output Model

## Objective

Rebase the packaged `decompose-codebase` templates on the current shared v2 decomposition and work model, while preserving stable local template filenames where useful and removing the obsolete one-file rebuild backlog template.

## Depends On

- Phase 1 contract rewrite
- `docs/assets/templates/plan-prd-decompose.md`
- `docs/assets/templates/work-index.md`
- `docs/assets/templates/work-phase.md`
- Current shared PRD templates under `docs/assets/templates/prd-*.md`

## Files to Modify

| File | Change Summary |
| ---- | -------------- |
| `packages/skills/decompose-codebase/assets/templates/decomposition-plan.md` | Rewrite the template content so the generated decomposition plan is a v2 plan directory with `00-overview.md` plus phase files. |
| `packages/skills/decompose-codebase/assets/templates/rebuild-backlog-index.md` | Rewrite the backlog index template around the shared `work-index.md` shape. |
| `packages/skills/decompose-codebase/assets/templates/rebuild-backlog-phase.md` | Rewrite the backlog phase template around the shared `work-phase.md` shape, including source-PRD traceability. |
| `packages/skills/decompose-codebase/assets/templates/rebuild-backlog.md` | Delete the obsolete single-file backlog template. |
| `packages/skills/decompose-codebase/assets/templates/prd-index.md` | Refresh only if drift exists relative to `docs/assets/templates/prd-index.md`. |
| `packages/skills/decompose-codebase/assets/templates/prd-overview.md`, `prd-architecture.md`, `prd-subsystem.md`, `prd-reference.md`, `prd-risk-register.md`, `prd-glossary.md` | Byte-check against the shared repo templates and reseed only if drift is found. |

## Detailed Changes

### 1. Rebuild the local decomposition plan template on the shared v2 plan shape

`assets/templates/decomposition-plan.md` should remain the skill-local filename, but its content should follow the current shared decomposition-plan contract:

- plan directory output, not a one-file plan
- explicit `00-overview.md` and `0N-<phase>.md` output paths
- coordinator policy, worker ownership, MCP strategy, and validation sections aligned to the current planning workflow

### 2. Move the local backlog templates to the shared work-directory model

`rebuild-backlog-index.md` and `rebuild-backlog-phase.md` should align semantically with `work-index.md` and `work-phase.md`, including:

- `00-index.md` as the backlog entry point
- dependency-ordered phase files
- source-PRD traceability in each phase
- usage notes and acceptance-focused work structure

Do not preserve wording that suggests the default backlog is a single Markdown file.

### 3. Remove the obsolete one-file backlog template

Delete `assets/templates/rebuild-backlog.md` from the packaged skill. After this phase:

- the template file is gone from `packages/skills/decompose-codebase/`
- no active skill docs reference it
- later phases remove it from the shipped asset declarations and mirrored file set

### 4. Reseed any shared PRD template drift

The shared PRD templates were already close to the repo versions during planning, but implementation should still perform a byte-level or structured compare against `docs/assets/templates/prd-*.md`. If any drift exists, reseed the skill-local copies from the repo-authoritative versions.

### 5. Keep local filenames stable where they still serve the packaged skill

Do not rename the retained local template files just to mirror the shared repo names. The shared contract should be reflected through content and behavior, not through unnecessary installed-path churn.

## Acceptance Criteria

- [ ] `assets/templates/decomposition-plan.md` now describes a v2 plan directory with `00-overview.md` and phase files.
- [ ] `assets/templates/rebuild-backlog-index.md` and `assets/templates/rebuild-backlog-phase.md` align to the current shared work-directory model.
- [ ] `assets/templates/rebuild-backlog.md` is removed from the packaged skill source.
- [ ] No retained template still instructs a one-file rebuild backlog as the default output.
- [ ] Shared PRD templates are either confirmed byte-identical to the repo templates or updated to match them.

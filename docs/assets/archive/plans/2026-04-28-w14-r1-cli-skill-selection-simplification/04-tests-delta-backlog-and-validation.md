# Phase 4 - Tests, Delta Backlog, and Validation

## Objective

Update targeted tests, create the matching delta backlog, and validate that the PRD, code, and docs changes preserve install behavior while removing the required/optional skill model.

## Depends On

- Phase 1 PRD change and baseline annotations
- Phase 2 registry and selected-skill model
- Phase 3 CLI skill-selection UX

## Files To Modify

Expected write scope:

- `packages/cli/tests/skill-registry.test.ts`
- `packages/cli/tests/skill-catalog.test.ts`
- `packages/cli/tests/wizard.test.ts`
- `packages/cli/tests/skills-ui.test.ts`
- `packages/cli/tests/cli.test.ts`
- `packages/cli/tests/install.test.ts`
- other focused tests that fail because they encode old `required` or `optionalSkills` assumptions
- `docs/work/2026-04-28-w14-r1-cli-skill-selection-simplification/00-index.md`
- `docs/work/2026-04-28-w14-r1-cli-skill-selection-simplification/0N-<phase>.md`

## Detailed Changes

### 1. Update registry and catalog tests

Test that:

- packaged registry entries no longer require `required`
- schema validation accepts the new registry shape
- invalid entries still fail for missing source, entrypoint, install name, description, or asset data
- default selected skills include every registry entry
- skill asset planning installs all selected skills
- deselecting a skill removes its desired assets from the plan

### 2. Update wizard and skills UI tests

Test that:

- `buildSkillSelectionState()` or its replacement creates one list without heading options
- all skills are initially selected on fresh installs
- every skill can be toggled
- rendered frames do not contain `Default`, `Optional`, or the old immutability note
- detail panels still show focused skill descriptions
- selected-skill summaries and keyboard instructions remain present
- skills-only UI prompts for selected skills rather than optional skills
- removal mode still skips selection

### 3. Update CLI, manifest, and install tests

Test that:

- help text uses the new selected-skill flag language
- unknown skill validation checks the full registry
- deprecated `--optional-skills`, if retained, maps predictably to the selected-skill model
- old manifests with `optionalSkills` migrate to the prior effective selected-skill set
- old manifests with `skills: false` remain skill-disabled
- `profileId` changes when selected skills change
- install and reconfigure apply the selected skill set without collapsing `skillFiles` into `files`

### 4. Create the delta backlog

Create `docs/work/2026-04-28-w14-r1-cli-skill-selection-simplification/`.

Use:

- `docs/assets/templates/work-index.md`
- `docs/assets/templates/work-phase.md`

The backlog should be scoped to this revision only and should cite:

- `docs/prd/12-revise-cli-skill-selection-simplification.md`
- impacted baseline docs `03`, `05`, `07`, and `08`
- this plan directory
- the originating design

Do not regenerate the full implementation backlog.

### 5. Run focused validation

Minimum commands:

```sh
npm test -w make-docs -- skill-registry
npm test -w make-docs -- skill-catalog
npm test -w make-docs -- wizard
npm test -w make-docs -- skills-ui
npm test -w make-docs -- cli
npm test -w make-docs -- install
npm run build -w make-docs
```

Also run exact stale-string checks for remaining user-facing category language in active code/tests:

```sh
rg -n "Default skills|Required skills|Optional skills|optional skills|Which optional skills|Edit optional skills" packages/cli/src packages/cli/tests
```

Allowed matches should be limited to deprecated compatibility aliases, explicit migration tests, or historical docs outside the active implementation surface.

## Parallelism

This phase can be split between a test worker and a backlog worker after code behavior is stable. Final validation should be single-owner so failures are triaged coherently.

## Acceptance Criteria

- Focused tests pass.
- Build passes.
- Delta backlog exists and traces to the new PRD change doc and impacted baseline docs.
- Exact stale-string scan has no unexpected active user-facing required/optional skill copy.
- `jdocmunch` and `jcodemunch` are refreshed after execution.
- Final review confirms no active PRD docs were renumbered and no unrelated CLI lifecycle behavior was changed.

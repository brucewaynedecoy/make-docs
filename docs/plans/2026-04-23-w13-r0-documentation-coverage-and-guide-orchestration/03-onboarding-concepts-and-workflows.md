# Phase 3 - Onboarding, Concepts, and Workflows

## Objective

Execute the onboarding, concepts, and workflows bundle using the finalized guide delivery map. This phase updates existing entry-point guides first, creates new guides only where the map says current coverage is missing, and keeps the resulting files tightly linked to the rest of the guide library.

## Depends On

- Phase 2 guide delivery map
- Existing guide contract and templates under `docs/assets/references/guide-contract.md`, `docs/assets/templates/guide-user.md`, and `docs/assets/templates/guide-developer.md`

## Files to Modify

| File | Change Summary |
| ---- | -------------- |
| `docs/guides/user/getting-started-*.md` | Update or create onboarding guides for installation, first use, and user entry paths approved in Phase 2. |
| `docs/guides/user/concepts-*.md` | Update or create concept guides for mental models that belong in the user-facing taxonomy. |
| `docs/guides/user/workflows-*.md` | Update or create user workflow guides selected in the delivery map. |
| `docs/guides/developer/development-workflows-*.md` | Update developer workflow guides when the map assigns companion maintainer context to this bundle. |

## Detailed Changes

### 1. Update existing guides before creating new ones

Treat these current guides as the first candidates for reuse:

- `docs/guides/user/getting-started-installing-make-docs.md`
- `docs/guides/user/concepts-wave-revision-phase-coordinates.md`
- `docs/guides/user/workflows-how-make-docs-stages-fit-together.md`
- `docs/guides/user/workflows-choosing-the-right-route-for-your-project.md`
- `docs/guides/developer/development-workflows-stage-model-and-artifact-relationships.md`
- `docs/guides/developer/development-workflows-choosing-the-right-route.md`

Create a new guide in this bundle only when Phase 2 marks the capability as uncovered or when an existing guide would become misleading if expanded further.

### 2. Keep this bundle within its path families

This worker owns only guide files whose final `path` values and filename prefixes belong to:

- `getting-started`
- `concepts/*`
- `workflows/*`
- `development/workflows`

Do not edit `cli-*`, `skills-*`, `template-*`, `maintainer-*`, `release-*`, or shared navigation files in this phase.

### 3. Write current-state guidance, not historical narration

The prose should explain how `make-docs` works now. Historical wave material may be cited in `related` links or used to explain provenance, but the guide body should not read like a changelog.

When a concept was assembled across multiple waves, present it as one current workflow or concept unless Phase 2 explicitly split it for user comprehension.

### 4. Add required `related` links

Every guide touched in this phase must include or refresh `related` links for:

- the companion audience guide when one exists
- relevant reference docs or PRD docs used as authority
- adjacent workflow or concept guides in the same user path

Cross-bundle links that depend on Phase 4 or 5 may be staged for final normalization in Phase 6, but obvious known links should be added here.

### 5. Return structured handoff data

The bundle worker must return:

- files changed
- ledger rows satisfied
- evidence used
- unresolved questions
- links added or deferred to assembly

That handoff becomes the input for Phase 6 traceability and final review.

## Acceptance Criteria

- [ ] Existing onboarding, concept, and workflow guides are reused where appropriate before new files are created.
- [ ] All files modified in this phase stay within the allowed path families.
- [ ] New guides created in this phase use `status: draft`.
- [ ] Updated guides describe the current product surface, not wave chronology.
- [ ] `related` frontmatter is added or refreshed for each touched guide.
- [ ] The worker returns structured handoff data for ledger traceability and assembly.

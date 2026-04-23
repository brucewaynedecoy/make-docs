# Phase 4 - CLI Lifecycle and Skills

## Objective

Deliver the guide coverage for the public CLI lifecycle surface and the installable skills surface. This phase uses two disjoint writing lanes inside one bundle phase so command/lifecycle docs and skills docs can proceed in parallel without touching each other's files.

## Depends On

- Phase 2 guide delivery map
- Current command and skills truth in `packages/cli/src/cli.ts`, `packages/cli/src/skills-command.ts`, `packages/cli/src/skill-catalog.ts`, and the active PRD set

## Files to Modify

| File | Change Summary |
| ---- | -------------- |
| `docs/guides/user/cli-*.md` | Update or create user-facing CLI lifecycle guides approved in Phase 2. |
| `docs/guides/developer/cli-*.md` | Update or create developer-facing CLI lifecycle guides, including existing `cli-development-local-build-and-install.md` when assigned by the map. |
| `docs/guides/user/skills-*.md` | Update or create user-facing skills guides approved in Phase 2. |
| `docs/guides/developer/skills-*.md` | Update or create developer-facing skills guides approved in Phase 2. |

## Detailed Changes

### 1. Split the phase into two write lanes

Within this phase, keep two separate workers:

- CLI lifecycle lane
- skills lane

The CLI lifecycle lane owns only `cli-*` guide files. The skills lane owns only `skills-*` guide files. Neither worker may edit `README.md` or any guide families owned by other phases.

### 2. Cover the current command model explicitly

CLI guides in this phase should reflect the current public surface, including where Phase 2 marks coverage as needed:

- apply or sync behavior from bare `make-docs`
- `reconfigure`
- `--dry-run`
- help behavior
- lifecycle commands such as `backup` and `uninstall`
- skills-related command entry points only insofar as they affect CLI navigation between command families

Use the active PRD set and current CLI code as authority when wave artifacts differ.

### 3. Cover the current skills model explicitly

Skills guides in this phase should reflect the current shipped model, including where Phase 2 marks coverage as needed:

- skills command behavior
- installable skills and optional vs required skills
- scope decisions such as project vs global installation
- harness-aware delivery and the distinction between CLI lifecycle and skills lifecycle

Skills docs should point readers to current behavior, not to obsolete packaging or distribution assumptions from earlier waves.

### 4. Reuse existing guide anchors where they already fit

If Phase 2 assigns `docs/guides/developer/cli-development-local-build-and-install.md` to the CLI lifecycle bundle, update it in place instead of creating a redundant local-build guide.

If a planned topic is better represented as `link-only` coverage inside another CLI or skills guide, implement that choice here rather than creating a thin standalone file.

### 5. Add cross-bundle links without taking shared ownership

Each touched guide must add `related` links to:

- onboarding/workflow guides from Phase 3 where relevant
- template or maintainer guides from Phase 5 where relevant
- PRD or reference docs that are the authority for the guide

If a link target depends on another bundle still in progress, note it in the handoff so Phase 6 can normalize the final cross-bundle links.

## Acceptance Criteria

- [ ] CLI lifecycle and skills drafting run as separate write lanes with non-overlapping file scopes.
- [ ] CLI guides reflect the current command model, not historical command chronology.
- [ ] Skills guides reflect the current skills model, not obsolete packaging assumptions.
- [ ] Existing guide anchors are reused where the delivery map says update-in-place.
- [ ] New guides created in this phase use `status: draft`.
- [ ] Each lane returns structured handoff data for assembly and validation.

# Phase 4: CLI Lifecycle and Skills

> Derives from [Phase 4 of the plan](../../plans/2026-04-23-w13-r0-documentation-coverage-and-guide-orchestration/04-cli-lifecycle-and-skills.md).

## Purpose

Deliver the guide coverage for the current CLI lifecycle and the current skills model. This phase is intentionally split into two non-overlapping lanes so command and lifecycle docs can proceed without colliding with skills docs.

## Overview

The public command model and the installable skills model are related but not identical. This phase keeps them separate in execution while still requiring final cross-links in the guide set. Use the active PRD set and current CLI implementation as authority when wave artifacts disagree with the shipped surface.

## Source PRD Docs

- [../../prd/05-installation-profile-and-manifest-lifecycle.md](../../prd/05-installation-profile-and-manifest-lifecycle.md)
- [../../prd/07-cli-command-surface-and-lifecycle.md](../../prd/07-cli-command-surface-and-lifecycle.md)
- [../../prd/08-skills-catalog-and-distribution.md](../../prd/08-skills-catalog-and-distribution.md)

## Source Plan Phases

- [04-cli-lifecycle-and-skills.md](../../plans/2026-04-23-w13-r0-documentation-coverage-and-guide-orchestration/04-cli-lifecycle-and-skills.md)

## Stage 1 - CLI lifecycle lane

### Tasks

1. Update or create `docs/guides/user/cli-*.md` files according to the guide delivery map.
2. Update or create `docs/guides/developer/cli-*.md` files according to the guide delivery map, including `docs/guides/developer/cli-development-local-build-and-install.md` when assigned.
3. Cover the current command model explicitly: bare `make-docs` apply or sync behavior, `reconfigure`, `--dry-run`, help behavior, and lifecycle commands such as `backup` and `uninstall`.
4. Implement `link-only` decisions inside broader CLI guides when the map says a separate standalone file is unnecessary.
5. Add `related` links to onboarding or workflow guides that already exist and are clearly relevant.

### Acceptance criteria

- [x] CLI drafting stays entirely within `cli-*` guide families.
- [x] Guides describe the current command surface rather than historical command evolution.
- [x] Existing CLI anchors are reused when the map says update in place.
- [x] New CLI guides created in this stage use `status: draft`.

### Dependencies

- Phase 2 guide delivery map.

## Stage 2 - Skills lane

### Tasks

1. Update or create `docs/guides/user/skills-*.md` files according to the guide delivery map.
2. Update or create `docs/guides/developer/skills-*.md` files according to the guide delivery map.
3. Cover the current shipped skills model: skills command behavior, optional versus required skills, project versus global scope decisions, and harness-aware delivery expectations.
4. Remove or replace obsolete packaging assumptions from earlier wave material when they conflict with current behavior.
5. Add `related` links to CLI, onboarding, or maintainer guides wherever the final targets are already available.

### Acceptance criteria

- [x] Skills drafting stays entirely within `skills-*` guide families.
- [x] Skills guides reflect the current shipped model rather than stale distribution assumptions.
- [x] New skills guides created in this stage use `status: draft`.
- [x] User and developer skill guides stay distinct when the map marked the capability as `both`.

### Dependencies

- Phase 2 guide delivery map.

## Stage 3 - Lane handoff and bundle review

### Tasks

1. Verify that the CLI lifecycle lane and skills lane did not overlap on file ownership.
2. Capture structured handoff data from both lanes: files changed, ledger rows satisfied, evidence used, unresolved questions, and links added or deferred.
3. Note any cross-bundle links that depend on Bundle A or Bundle D so Phase 6 can normalize them later.
4. Keep `README.md` untouched and reserve any shared navigation changes for Phase 6.

### Acceptance criteria

- [x] CLI and skills lanes return non-overlapping write scopes.
- [x] Both lanes provide complete handoff data for traceability and validation.
- [x] Deferred cross-bundle links are documented rather than silently omitted.

### Dependencies

- Stage 1 - CLI lifecycle lane.
- Stage 2 - Skills lane.

## Implementation notes

### CLI lifecycle lane

- Created `docs/guides/user/cli-lifecycle-managing-installations.md` for Bundle B row `L05`.
- Covered the current lifecycle surface only: bare `make-docs` apply or sync, `reconfigure`, `--dry-run`, help, `backup`, `uninstall`, and recovery guidance.
- Kept the lifecycle guide separate from the skills guides and did not add cross-bundle navigation inside the guide itself.

### Skills lane

- Created `docs/guides/user/skills-installing-and-managing-skills.md` for Bundle C row `L06` user coverage.
- Created `docs/guides/user/skills-decomposing-an-existing-codebase.md` for Bundle C row `L08`.
- Created `docs/guides/developer/skills-catalog-and-distribution-model.md` for Bundle C row `L06` developer coverage.
- Added `archive-docs` coverage as link-only sections inside the user and developer skills guides for Bundle C row `L07`.
- Kept user and developer skills guidance distinct: command-and-scope usage stayed in the user guide, while registry ownership, harness targets, scope model, and distribution responsibilities stayed in the developer guide.

### Structured handoff payload

- `files changed`:
  - `docs/work/2026-04-23-w13-r0-documentation-coverage-and-guide-orchestration/04-cli-lifecycle-and-skills.md`
  - `docs/guides/user/cli-lifecycle-managing-installations.md`
  - `docs/guides/user/skills-installing-and-managing-skills.md`
  - `docs/guides/user/skills-decomposing-an-existing-codebase.md`
  - `docs/guides/developer/skills-catalog-and-distribution-model.md`
- `ledger rows satisfied`:
  - `L05`
  - `L06` user guide
  - `L06` developer guide
  - `L07` user link-only coverage
  - `L07` developer link-only coverage
  - `L08`
- `evidence used`:
  - `docs/work/2026-04-23-w13-r0-documentation-coverage-and-guide-orchestration/supporting/guide-delivery-map.md`
  - `docs/work/2026-04-23-w13-r0-documentation-coverage-and-guide-orchestration/supporting/capability-coverage-ledger.md`
  - `docs/assets/references/guide-contract.md`
  - `docs/prd/05-installation-profile-and-manifest-lifecycle.md`
  - `docs/prd/07-cli-command-surface-and-lifecycle.md`
  - `docs/prd/08-skills-catalog-and-distribution.md`
  - `packages/cli/src/cli.ts`
  - `packages/cli/src/backup.ts`
  - `packages/cli/src/audit.ts`
  - `packages/cli/src/skills-command.ts`
  - `packages/cli/src/skill-catalog.ts`
  - `packages/cli/src/skill-registry.ts`
  - `packages/cli/skill-registry.json`
  - `packages/skills/archive-docs/SKILL.md`
  - `packages/skills/decompose-codebase/assets/README.md`
- `unresolved questions`:
  - None at drafting time. The guides were written against the current shipped CLI and registry surfaces.
- `links added or deferred`:
  - Added same-bundle links among the new skills guides and between the user and developer skills guides.
  - Deferred cross-bundle links into onboarding and workflow guides to Phase 6 because those guides are outside this phase's write scope.

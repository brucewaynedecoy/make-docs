# Phase 4: CLI Lifecycle and Skills

> Derives from [Phase 4 of the plan](../../plans/2026-04-23-w13-r0-documentation-coverage-and-guide-orchestration/04-cli-lifecycle-and-skills.md).

## Purpose

Deliver the guide coverage for the current CLI lifecycle and the current skills model. This phase is intentionally split into two non-overlapping lanes so command and lifecycle docs can proceed without colliding with skills docs.

## Overview

The public command model and the installable skills model are related but not identical. This phase keeps them separate in execution while still requiring final cross-links in the guide set. Use the active PRD set and current CLI implementation as authority when wave artifacts disagree with the shipped surface.

## Source PRD Docs

- [../../prd/05-installation-profile-and-manifest-lifecycle.md](../../prd/05-installation-profile-and-manifest-lifecycle.md)
- [../../prd/07-cli-command-surface-and-lifecycle.md](../../prd/07-cli-command-surface-and-lifecycle.md)
- [../../prd/08-skills-delivery-and-runtime-integration.md](../../prd/08-skills-delivery-and-runtime-integration.md)

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

- [ ] CLI drafting stays entirely within `cli-*` guide families.
- [ ] Guides describe the current command surface rather than historical command evolution.
- [ ] Existing CLI anchors are reused when the map says update in place.
- [ ] New CLI guides created in this stage use `status: draft`.

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

- [ ] Skills drafting stays entirely within `skills-*` guide families.
- [ ] Skills guides reflect the current shipped model rather than stale distribution assumptions.
- [ ] New skills guides created in this stage use `status: draft`.
- [ ] User and developer skill guides stay distinct when the map marked the capability as `both`.

### Dependencies

- Phase 2 guide delivery map.

## Stage 3 - Lane handoff and bundle review

### Tasks

1. Verify that the CLI lifecycle lane and skills lane did not overlap on file ownership.
2. Capture structured handoff data from both lanes: files changed, ledger rows satisfied, evidence used, unresolved questions, and links added or deferred.
3. Note any cross-bundle links that depend on Bundle A or Bundle D so Phase 6 can normalize them later.
4. Keep `README.md` untouched and reserve any shared navigation changes for Phase 6.

### Acceptance criteria

- [ ] CLI and skills lanes return non-overlapping write scopes.
- [ ] Both lanes provide complete handoff data for traceability and validation.
- [ ] Deferred cross-bundle links are documented rather than silently omitted.

### Dependencies

- Stage 1 - CLI lifecycle lane.
- Stage 2 - Skills lane.

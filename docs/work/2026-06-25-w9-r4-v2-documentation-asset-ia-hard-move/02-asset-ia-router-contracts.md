# Phase 2: Asset IA Router Contracts

## Purpose

Update the active router, lifecycle, output, compatibility, catalog, and path-hygiene contracts to use the accepted W9 R4 asset IA.

## Overview

This phase changes future-facing product contracts and deterministic path knowledge. It must not move project content blindly; content movement belongs to planned migration behavior and dogfood validation.

## Source PRD Docs

- [../../prd/02-architecture-overview.md](../../prd/02-architecture-overview.md)
- [../../prd/06-template-contracts-and-generated-assets.md](../../prd/06-template-contracts-and-generated-assets.md)
- [../../prd/14-add-lifecycle-workflow-foundation.md](../../prd/14-add-lifecycle-workflow-foundation.md)
- [../../prd/21-revise-tool-directory-system-custom-resource-tiers.md](../../prd/21-revise-tool-directory-system-custom-resource-tiers.md)
- [../../prd/22-revise-new-docs-assets-playbooks-persona-model.md](../../prd/22-revise-new-docs-assets-playbooks-persona-model.md)

## Stage 1 - Documentation Contract Updates

### Tasks

- [ ] t1: Update lifecycle, planning, execution, output, path-hygiene, archive, history/breadcrumb, and router reference docs to use `docs/assets/artifacts/**`, `docs/assets/archive/**`, and `docs/assets/breadcrumbs/**` for future-facing targets.
- [ ] t2: Update design, plan, PRD, work, guide, playbook, archive, artifact, and breadcrumb routers so generated agent instructions route to the accepted IA.
- [ ] t3: Update template references from `docs/assets/{prompts,references,templates}/**` to `.make-docs/{contracts,references,templates,scripts}/system/**` according to the phase 1 classification.
- [ ] t4: Preserve historical links in archived plans, completed work, and existing history records unless they are active router/template text.

### Acceptance criteria

- Future-facing contract docs no longer instruct users or agents to create shipped content under top-level `docs/artifacts/**` or `docs/archive/**`.
- Router instructions name `docs/assets/artifacts/**`, `docs/assets/archive/**`, and `docs/assets/breadcrumbs/**` where applicable.
- Historical references remain factual and linked.

### Dependencies

- Phase 1 migration inventory.

## Stage 2 - CLI and Compatibility Path Knowledge

### Tasks

- [ ] t5: Update catalog and static path definitions so shipped routers and managed asset directories match the W9 R4 IA.
- [ ] t6: Update compatibility classification so legacy top-level `docs/artifacts/**` is a move target, not a supported shipped alias.
- [ ] t7: Update path-hygiene or validation helpers that currently expect top-level archive or artifact targets.
- [ ] t8: Update tests that assert old path families or router fanout.

### Acceptance criteria

- CLI/package path knowledge aligns with the updated docs contracts.
- Compatibility behavior can identify old-path installs without advertising old paths as current contract.
- Tests fail if top-level `docs/archive/**` or `docs/artifacts/**` reappear as shipped v2 targets.

### Dependencies

- Stage 1 complete.

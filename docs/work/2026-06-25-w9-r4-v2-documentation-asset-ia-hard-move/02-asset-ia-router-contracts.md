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

- [x] t1: Update lifecycle, planning, execution, output, path-hygiene, archive, history/breadcrumb, and router reference docs to use `docs/assets/artifacts/**`, `docs/assets/archive/**`, and `docs/assets/breadcrumbs/**` for future-facing targets.
- [x] t2: Update design, plan, PRD, work, guide, playbook, archive, artifact, and breadcrumb routers so generated agent instructions route to the accepted IA.
- [x] t3: Update template references from `docs/assets/{prompts,references,templates}/**` to `.make-docs/{contracts,references,templates,scripts}/system/**` according to the phase 1 classification.
- [x] t4: Preserve historical links in archived plans, completed work, and existing history records unless they are active router/template text.

### Acceptance criteria

- Future-facing contract docs no longer instruct users or agents to create shipped content under top-level `docs/artifacts/**` or `docs/archive/**`.
- Router instructions name `docs/assets/artifacts/**`, `docs/assets/archive/**`, and `docs/assets/breadcrumbs/**` where applicable.
- Historical references remain factual and linked.

### Dependencies

- Phase 1 migration inventory.

### Implementation Evidence

- System contracts, workflow references, prompt starters, templates, and helper scripts were relocated under `.make-docs/{contracts,references,templates,scripts}/system/**` in the root dogfood tree and template source.
- Router files now route future-facing records to `docs/assets/artifacts/**`, `docs/assets/archive/**`, and `docs/assets/breadcrumbs/**`.
- `docs/work/AGENTS.md`, `docs/plans/AGENTS.md`, `docs/designs/AGENTS.md`, and template mirrors now tell workers to apply W9 R4 before executing pre-W9 R4 future-facing work.
- Completed history under `docs/assets/history/**` remains preserved as pre-migration evidence rather than rewritten into the new breadcrumb namespace.

## Stage 2 - CLI and Compatibility Path Knowledge

### Tasks

- [x] t5: Update catalog and static path definitions so shipped routers and managed asset directories match the W9 R4 IA.
- [x] t6: Update compatibility classification so legacy top-level `docs/artifacts/**` is a move target, not a supported shipped alias.
- [x] t7: Update path-hygiene or validation helpers that currently expect top-level archive or artifact targets.
- [x] t8: Update tests that assert old path families or router fanout.

### Acceptance criteria

- CLI/package path knowledge aligns with the updated docs contracts.
- Compatibility behavior can identify old-path installs without advertising old paths as current contract.
- Tests fail if top-level `docs/archive/**` or `docs/artifacts/**` reappear as shipped v2 targets.

### Dependencies

- Stage 1 complete.

### Validation Evidence

- `packages/cli/src/catalog.ts`, `packages/cli/src/rules.ts`, `packages/cli/src/tool-directory.ts`, `packages/cli/src/compatibility.ts`, and `packages/cli/src/planner.ts` now encode W9 R4 path knowledge.
- Legacy `docs/assets/{prompts,references,templates}/**` paths remain only as migration inputs for system-resource relocation.
- `scripts/smoke-pack.mjs` now asserts the W9 R4 package/install contract, including shipped `.make-docs/**` resources and absence of top-level shipped archive/artifact targets.
- Phase 2 and Phase 3 were validated together because router contracts, template source, package copy, and dogfood manifest hashes must agree for a meaningful installed-state proof.

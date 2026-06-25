# Phase 1: Authority and Migration Inventory

## Purpose

Confirm the reconciled W9 R4 authority set and produce the concrete migration inventory that later phases must execute.

## Overview

This phase is the implementation safety gate. It verifies that active PRDs, the W9 R4 plan, and the pivot design agree before code, template, or router changes start. It also separates shipped template targets from make-docs repo dogfood and unmanaged local material.

## Source PRD Docs

- [../../prd/00-index.md](../../prd/00-index.md)
- [../../prd/03-open-questions-and-risk-register.md](../../prd/03-open-questions-and-risk-register.md)
- [../../prd/21-revise-tool-directory-system-custom-resource-tiers.md](../../prd/21-revise-tool-directory-system-custom-resource-tiers.md)
- [../../prd/22-revise-new-docs-assets-playbooks-persona-model.md](../../prd/22-revise-new-docs-assets-playbooks-persona-model.md)

## Stage 1 - Authority Verification

### Tasks

- [x] t1: Re-read the W9 R4 design, plan, PRD 21, PRD 22, PRD index, and risk register.
- [x] t2: Confirm the implementation scope uses `docs/assets/{archive,artifacts,breadcrumbs,guides,playbooks}/**` and `.make-docs/{contracts,references,scripts,templates,agentics}/**`.
- [x] t3: Confirm top-level `docs/artifacts/**` is a hard move and top-level `docs/archive/**` is not a shipped v2 target.
- [x] t4: Confirm existing `docs/assets/history/**` remains the current closeout path until the breadcrumb contract migration lands.

### Evidence

- Accepted authority files are [../../designs/2026-06-25-v2-documentation-asset-ia-hard-move.md](../../designs/2026-06-25-v2-documentation-asset-ia-hard-move.md), [../../plans/2026-06-25-w9-r4-v2-documentation-asset-ia-hard-move/00-overview.md](../../plans/2026-06-25-w9-r4-v2-documentation-asset-ia-hard-move/00-overview.md), [../../prd/21-revise-tool-directory-system-custom-resource-tiers.md](../../prd/21-revise-tool-directory-system-custom-resource-tiers.md), [../../prd/22-revise-new-docs-assets-playbooks-persona-model.md](../../prd/22-revise-new-docs-assets-playbooks-persona-model.md), [../../prd/00-index.md](../../prd/00-index.md), and [../../prd/03-open-questions-and-risk-register.md](../../prd/03-open-questions-and-risk-register.md).
- `./.make-docs/build-process/` is not currently materialized in this worktree, so the phase follows [../../AGENTS.md](../../AGENTS.md) and [../../assets/references/lifecycle.md](../../assets/references/lifecycle.md). This is an explicit lifecycle departure from the requested numbered build-process directory, not an implicit skip.
- W9 R4 gates remaining unimplemented v2 work that depends on docs asset locations, template materialization, compatibility classification, migration behavior, package path knowledge, or dogfood structure. Already-completed W9 R2, W9 R3, W10 R1, W10 R2, and W10 R3 commits remain historical evidence and are not reordered.
- The settled shipped asset targets are `docs/assets/archive/**`, `docs/assets/artifacts/**`, `docs/assets/breadcrumbs/**`, `docs/assets/guides/**`, and `docs/assets/playbooks/**`.
- The settled system targets are `.make-docs/contracts/**`, `.make-docs/references/**`, `.make-docs/templates/**`, `.make-docs/scripts/**`, and `.make-docs/agentics/**`.
- Top-level `docs/artifacts/**` is a hard move to `docs/assets/artifacts/**`; top-level `docs/archive/**` is not a shipped v2 target.
- `docs/assets/history/**` remains the current closeout path only until Phase 3 migrates the live breadcrumb contract. Phase 4 still writes the W9 R4 closeout record there because that is the current live closeout router during this wave.

### Acceptance criteria

- The phase notes identify the exact accepted authority files.
- No implementation decision remains open for artifact hard move, archive target, breadcrumb target, or dogfood boundary.
- Any discovered disagreement is reconciled into the current phase before later phases start.

### Dependencies

- W9 R4 design and PRD reconciliation are present in the worktree.

## Stage 2 - Migration Inventory

### Tasks

- [x] t5: Inventory future-facing references to top-level `docs/artifacts/**`, top-level `docs/archive/**`, current `docs/assets/history/**`, and transitional `docs/assets/{prompts,references,templates}/**`.
- [x] t6: Classify each hit as historical evidence, active contract, shipped template, CLI/package path knowledge, dogfood state, or unmanaged local material.
- [x] t7: Map every active-contract or shipped-template hit to its W9 R4 target path family.
- [x] t8: Record which hits must be preserved as historical references instead of rewritten.

### Migration Inventory

| Surface | Classification | Phase | Target or disposition |
| --- | --- | --- | --- |
| `docs/AGENTS.md`, `docs/CLAUDE.md`, root lifecycle/router instructions | Active contract and dogfood router | 2 | Route future artifact, archive, breadcrumb, guide, and playbook work to `docs/assets/{artifacts,archive,breadcrumbs,guides,playbooks}/**`; route system contracts, references, templates, scripts, and agentics to `.make-docs/**`. |
| `docs/assets/references/*.md` workflow, contract, lifecycle, output, path, history, guide, and coverage references | Active contract and transitional tool resource | 2 | Move product-owned workflow/reference contracts to `.make-docs/references/system/**` or `.make-docs/contracts/system/**` according to function; preserve old links only where historical. |
| `docs/assets/templates/*.md` | Active contract and transitional tool resource | 2, 3 | Move reusable document skeletons to `.make-docs/templates/system/**`; update routers and selectors to read from the new system template family. |
| `docs/assets/prompts/*.prompt.md` | Prompt starters and transitional tool resource | 2, 3 | Reclassify process prompts into `.make-docs/references/system/**` unless a file is a reusable document skeleton or deterministic script input. Do not preserve a shipped `.make-docs/prompts/**` family. |
| `docs/artifacts/AGENTS.md`, `docs/artifacts/CLAUDE.md`, and `docs/artifacts/*.md` seed inputs | Dogfood state, unmanaged local material, and optional input evidence | 3 | Move live seed inputs to `docs/assets/artifacts/**`; create/update `docs/assets/artifacts/{AGENTS,CLAUDE}.md`; do not keep top-level `docs/artifacts/**` as a shipped alias. |
| `docs/archive/**` references in contracts or package code | Old shipped-template assumption | 2, 3 | Remove top-level archive routing and installation; use `docs/assets/archive/**` only. |
| `docs/assets/history/**` routers and existing records | Current closeout surface and historical evidence | 2, 3, 4 | Migrate template/package/router future path knowledge to `docs/assets/breadcrumbs/**`; preserve existing records under `docs/assets/history/**` until the migration writes or moves them intentionally. |
| `packages/docs/template/docs/artifacts/{AGENTS,CLAUDE}.md` | Shipped template old artifact router | 3 | Replace with `packages/docs/template/docs/assets/artifacts/{AGENTS,CLAUDE}.md`. |
| `packages/docs/template/docs/archive/{AGENTS,CLAUDE}.md` | Shipped template rejected archive router | 3 | Remove from shipped template; keep `packages/docs/template/docs/assets/archive/{AGENTS,CLAUDE}.md`. |
| `packages/docs/template/docs/assets/history/{AGENTS,CLAUDE}.md` | Shipped template current closeout router | 3 | Replace future template router with `packages/docs/template/docs/assets/breadcrumbs/{AGENTS,CLAUDE}.md`; do not move this repo's existing closeout records in Phase 1. |
| `packages/docs/template/docs/assets/{prompts,references,templates}/**` | Shipped template transitional tool resources | 3 | Move to `packages/docs/template/.make-docs/{contracts,references,templates}/system/**` according to function; remove shipped docs-assets tool-resource families. |
| `packages/cli/template/**` matching the template paths above | CLI package copy | 3 | Regenerate with `scripts/copy-template-to-cli.mjs` after template-source edits. |
| `packages/cli/src/catalog.ts` | CLI/package path knowledge | 2 | Stop materializing top-level `docs/artifacts/**` and `docs/archive/**`; add `docs/assets/artifacts/**` and `docs/assets/breadcrumbs/**`; point tool-resource families at `.make-docs/**`. |
| `packages/cli/src/rules.ts`, `packages/cli/src/planner.ts`, `packages/cli/src/tool-directory.ts`, `packages/cli/src/compatibility.ts` | CLI selectors, conflict metadata, migration classification, compatibility detection | 2 | Update selected path arrays, metadata categories, legacy migration targets, and compatibility signatures for the W9 R4 targets. |
| `packages/cli/tests/*.test.ts` and `packages/cli/tests/compatibility-fixtures.ts` | Test expectations and state fixtures | 2, 3 | Update expected install paths, template parity paths, package consistency checks, compatibility fixtures, and no-old-shipped-target assertions. |
| `packages/skills/closeout-*` and `packages/skills/work-on-*` scripts | Skill helper path defaults | 2, 4 | Keep default history output at `docs/assets/history` until Phase 4 closeout, but record `docs/assets/breadcrumbs` as the future target and update scope guards when template/package migration lands. |
| `.make-docs/manifest.json` | Dogfood manifest and managed-file evidence | 3 | Remove old shipped `docs/artifacts/**`, `docs/archive/**`, `docs/assets/history/**`, and `docs/assets/{prompts,references,templates}/**` entries only when the corresponding managed template-owned files are moved or removed; add selected `.make-docs/**` and `docs/assets/{artifacts,breadcrumbs}/**` entries. |
| `docs/designs/**`, `docs/plans/**`, `docs/work/**`, and `docs/assets/history/**` historical references to old paths | Historical evidence | 2, 4 | Preserve factual historical references unless the file is an active router, current plan/backlog instruction, or future-facing contract. |

### Acceptance criteria

- The inventory covers docs, package templates, CLI template copies, CLI source/tests, smoke scripts, and `.make-docs/manifest.json` where relevant.
- Historical references are explicitly separated from future-facing targets.
- The inventory is sufficient for phases 2 and 3 to edit without searching for policy decisions.

### Dependencies

- Stage 1 complete.

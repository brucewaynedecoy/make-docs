---
date: 2026-06-18
coordinate: W17 R0
closeout: corrective
summary: "Corrected W17 installs to static template assets, all-router blocks, and optional skills."
---

# Static Template, Router Block, and Skill Default Correction

## Changes

This corrective pass removes the remaining dynamic scaffold-renderer model and
makes `packages/docs/template/` the only source of installed docs, router, and
instruction content. Install profiles now select paths only; selected files are
copied from the template bytes. Every installed `AGENTS.md` and `CLAUDE.md`
uses make-docs managed-block markers, and fresh default installs write no skill
files unless the user explicitly selects skills.

| Area | Summary |
| --- | --- |
| Static asset pipeline | Removed the dynamic renderer surface and converted scaffold assets to static template reads. |
| Router ownership | Extended managed-block hashing and reconciliation to every installed `AGENTS.md` and `CLAUDE.md`, including nested routers. |
| Skills defaults | Changed fresh defaults to `skills: false`, `selectedSkills: []`, and `skillFiles: []` while keeping explicit selected-skill installs supported. |
| Template and dogfood | Added managed-block markers across template and dogfood routers, reseeded `packages/cli/template`, and removed dogfood skill mirrors. |
| Docs reconciliation | Updated active PRD, design, plan, backlog, and maintainer docs so they describe the static-template/no-default-skills contract. |

## Documentation

### Project

| Path | Description |
| --- | --- |
| [../../prd/06-template-contracts-and-generated-assets.md](../../prd/06-template-contracts-and-generated-assets.md) | Replaces the old dynamic renderer/buildable-asset model with the static template asset contract. |
| [../../prd/08-skills-catalog-and-distribution.md](../../prd/08-skills-catalog-and-distribution.md) | Aligns skills delivery with explicit optional selected skills and no default skill files. |
| [../../prd/12-revise-cli-skill-selection-simplification.md](../../prd/12-revise-cli-skill-selection-simplification.md) | Revises the selected-skill model so fresh defaults install no skills. |
| [../../prd/15-revise-agent-instruction-file-ownership.md](../../prd/15-revise-agent-instruction-file-ownership.md) | Clarifies static template sourcing plus block-scoped instruction reconciliation. |
| [../../designs/2026-06-18-agent-instruction-file-ownership.md](../../designs/2026-06-18-agent-instruction-file-ownership.md) | Updates W17 design language away from renderer-owned instruction files. |
| [../../plans/2026-06-18-w17-r0-agent-instruction-file-ownership/02-dedicated-file-and-harness-block.md](../../plans/2026-06-18-w17-r0-agent-instruction-file-ownership/02-dedicated-file-and-harness-block.md) | Recasts Phase 02 as static inline instruction blocks while preserving the existing path. |
| [../../work/2026-06-18-w17-r0-agent-instruction-file-ownership/02-dedicated-file-and-harness-block.md](../../work/2026-06-18-w17-r0-agent-instruction-file-ownership/02-dedicated-file-and-harness-block.md) | Reconciles Phase 02 tasks and acceptance criteria with the corrected product shape. |

### Developer

| Path | Description |
| --- | --- |
| [../../../packages/cli/src/README.md](../../../packages/cli/src/README.md) | Updates maintainer guidance for static asset selection and managed-block validation. |

### User

None this session.

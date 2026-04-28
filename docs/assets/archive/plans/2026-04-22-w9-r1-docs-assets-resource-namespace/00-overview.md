# Docs Assets Resource Namespace Overhaul - Implementation Plan

## Purpose

Implement the architecture defined in [2026-04-22-docs-assets-resource-namespace.md](../../designs/2026-04-22-docs-assets-resource-namespace.md). This is **Wave 9 Revision 1** (`w9-r1`): a revision of Wave 9 that consolidates non-project docs resources under one visible `docs/assets/` namespace and applies the same structure to the shippable template and this repository's dogfood docs tree.

## Objective

- `docs/assets/` becomes the only top-level document-resource directory inside `docs/`.
- The shippable template at `packages/docs/template/docs/` uses `assets/` instead of `.archive/`, `.assets/`, `.prompts/`, `.references/`, and `.templates/`.
- The CLI asset catalog, renderers, rules, tests, and docs all use the new document-resource paths.
- The make-docs manifest lives at root `.make-docs/manifest.json`, outside `docs/`.
- Skipped-conflict staging lives at root `.make-docs/conflicts/<run-id>/`.
- This repository's own `docs/` tree is migrated after the template and CLI agree on the new model.
- Active instructions no longer route future work to hidden `docs/.<resource>/` directories.

## Coordinate Decision

- Coordinate: `W9 R1`
- Classification: `revision`
- Evidence: The originating design declares `Coordinate Handoff: prior coordinate W9 R0; recommended downstream coordinate W9 R1`. The request revises Wave 9's completed resource namespace rather than starting a new end-to-end initiative. Later waves exist, but the wave model says source lineage wins over highest-wave fallback for revisions.

## Change Classification

- Requested change type: `revision`
- Effective execution mode: active implementation plan derived from an approved design
- Cleanup rewrite requested: no
- Full backlog regeneration requested: no
- Legacy install migration required: no indefinite compatibility; dogfood cleanup and managed-path retirement are required so this repo does not retain duplicate active resources

## Change Inputs

| Input | Format | Location | Confidence |
| ----- | ------ | -------- | ---------- |
| Originating design | Markdown design doc | `docs/assets/archive/designs/2026-04-22-docs-assets-resource-namespace.md` | High |
| Prior Wave 9 design | Markdown design doc | `docs/assets/archive/designs/2026-04-20-docs-assets-state-and-history.md` | High |
| Prior Wave 9 plan/work/history | Markdown plan, backlog, history records | `docs/assets/archive/plans/2026-04-20-w9-r0-docs-assets-state-and-history/`, `docs/assets/archive/work/2026-04-20-w9-r0-docs-assets-state-and-history/`, `docs/.assets/history/2026-04-20-w9-r0-*.md` | High |
| Planning and wave contracts | Markdown references/templates | `docs/.references/planning-workflow.md`, `docs/.references/wave-model.md`, `docs/.templates/plan-overview.md`, `docs/.templates/plan-prd-change.md` | High |
| CLI resource path code | TypeScript source | `packages/cli/src/catalog.ts`, `packages/cli/src/renderers.ts`, `packages/cli/src/rules.ts`, `packages/cli/src/manifest.ts`, `packages/cli/src/install.ts`, `packages/cli/src/audit.ts`, `packages/cli/src/backup.ts`, `packages/cli/src/uninstall.ts`, `packages/cli/src/cli.ts` | High |
| Template and dogfood docs | Markdown template/docs trees | `packages/docs/template/docs/`, `docs/` | High |
| Archive skill resources | Markdown and Python skill assets | `packages/skills/archive-docs/`, `.agents/skills/archive-docs/`, `.claude/skills/archive-docs/` | Medium |

## Baseline Context

- Active `docs/prd/` status: no PRD namespace change is planned in this step.
- Impacted baseline docs: documentation routers, resource contracts, prompt/template/reference paths, archive guidance, package READMEs, user/developer guides, CLI help/readme copy, and archive-skill references.
- Discovery pass required: yes.
- Discovery scope: active source-of-truth files and generated-output surfaces that reference `docs/.archive`, `docs/.assets`, `docs/.prompts`, `docs/.references`, `docs/.templates`, `docs/.resources`, `docs/assets`, `.make-docs`, `MANIFEST_RELATIVE_PATH`, `CONFLICTS_RELATIVE_DIR`, `PROMPT_RULES`, template path constants, reference path constants, and buildable router paths.

## Output Contract

- Plan directory: `docs/assets/archive/plans/2026-04-22-w9-r1-docs-assets-resource-namespace/`
  - entry point: `docs/assets/archive/plans/2026-04-22-w9-r1-docs-assets-resource-namespace/00-overview.md`
  - phase files: `docs/assets/archive/plans/2026-04-22-w9-r1-docs-assets-resource-namespace/0N-<phase>.md`
- New PRD change docs: none
- Baseline docs to annotate: none in `docs/prd/`
- Expected follow-on backlog directory after plan approval: `docs/assets/archive/work/2026-04-22-w9-r1-docs-assets-resource-namespace/`
- Dogfood migration target: this repository's active `docs/` directory

## Change Doc Strategy

This change does not create PRD change docs. It is implemented through this plan set, a later work backlog, direct updates to active docs contracts and routers, CLI source/test changes, and physical file moves in the template and dogfood docs trees.

## Baseline Annotation Plan

No `docs/prd/` baseline annotations are required. Existing active documentation that behaves like source-of-truth material should be updated in place:

| Baseline doc | Impacted sections | Note verb | Target |
| ------------ | ----------------- | --------- | ------ |
| `docs/AGENTS.md`, `docs/CLAUDE.md` | resource, prompt, reference, template, archive, history routing | revise | `docs/assets/` |
| `docs/.references/*.md` | workflow, contract, archive, wave, output, guide, design, planning links | revise | `docs/assets/references/` and related children |
| `docs/.templates/*.md` | template self-references and prompt links | revise | `docs/assets/templates/` |
| `docs/.prompts/*.prompt.md` | prompt target paths and workflow references | revise | `docs/assets/prompts/` |
| `docs/.archive/AGENTS.md`, `docs/.archive/CLAUDE.md` | archive structure authority | move and revise | `docs/assets/archive/` |
| `README.md`, `packages/cli/README.md`, `packages/docs/README.md` | resource tree, manifest path, conflict path, package template inventory | revise | `docs/assets/` and `.make-docs/` |
| `docs/guides/user/*`, `docs/guides/developer/*` | install, smoke, troubleshooting, and state-path references | revise | `.make-docs/manifest.json` and `.make-docs/conflicts/` |
| `packages/skills/archive-docs/**`, `.agents/skills/archive-docs/**`, `.claude/skills/archive-docs/**` | archive and history resource paths | revise | `docs/assets/archive/` and `docs/assets/history/` |

## Phase Map

| File | Purpose |
| ---- | ------- |
| `01-resource-contract-and-routing.md` | Establish the new `docs/assets/` contract and update active router/path language before physical moves. |
| `02-template-resource-tree.md` | Move the shippable template resource tree to `packages/docs/template/docs/assets/` and align checked-in router files. |
| `03-cli-asset-pipeline-and-state-paths.md` | Update CLI managed resource paths, generated renderers, root `.make-docs/` state paths, and related tests. |
| `04-dogfood-docs-migration.md` | Apply the same resource namespace change to this repository's `docs/` tree and relocate dogfood CLI state to root `.make-docs/`. |
| `05-tests-and-validation.md` | Run focused and full validation, stale-path searches, link checks, and dogfood install verification. |

## Dependencies

- Phase 1 should land first because it defines the path contract that later file moves and code changes follow.
- Phase 2 depends on Phase 1 because the template files need final router wording and resource paths.
- Phase 3 depends on Phase 2's target paths but can be implemented in parallel with final docs edits once path constants are settled.
- Phase 4 depends on Phases 1 through 3 because the dogfood tree should mirror the template after the CLI can manage the new paths.
- Phase 5 depends on all prior phases.

## Research Findings

- `packages/cli/src/catalog.ts` currently adds instruction routers under `docs/.assets/`, `docs/.assets/history/`, `docs/.assets/config/`, `docs/.archive/`, `docs/.references/`, `docs/.templates/`, and `docs/.prompts/`.
- `packages/cli/src/renderers.ts` currently registers buildable routers for `.assets`, `.assets/history`, `.assets/config`, `.templates`, `.prompts`, and design reference/template paths.
- `packages/cli/src/rules.ts` currently emits prompt, template, and reference assets under `docs/.prompts/`, `docs/.templates/`, and `docs/.references/`.
- `packages/cli/src/manifest.ts` currently defines `MAKE_DOCS_CONFIG_RELATIVE_DIR = "docs/.assets/config"`, with the manifest and conflict directories derived from that constant. The target state path is root `.make-docs/`.
- Active package docs and tests still assert `docs/.assets/config/manifest.json`, `docs/.assets/config/conflicts/`, `docs/.prompts/`, `docs/.templates/`, `docs/.references/`, and `docs/.archive/`.
- `packages/docs/template/docs/` currently has five top-level hidden resource directories: `.archive`, `.assets`, `.prompts`, `.references`, and `.templates`.
- This repository's active `docs/` tree has those same hidden directories plus an empty `docs/.resources/`.
- Historical docs contain many old-path mentions; validation should distinguish active instructions from historical records that describe prior behavior.

## Worker Ownership

If implementation is delegated, split ownership by write scope:

| Worker | Scope | Write Scope | Dependencies | Deliverables |
| ------ | ----- | ----------- | ------------ | ------------ |
| Contract and router worker | Active path contracts and generated router wording | `docs/.references/`, `docs/.prompts/`, `docs/.templates/`, `docs/AGENTS.md`, `docs/CLAUDE.md`, matching template source files where not physically moved yet | Originating design | Updated resource path contract and router language |
| Template tree worker | Physical shippable template resource moves | `packages/docs/template/docs/assets/**`, deletion of retired `packages/docs/template/docs/.*/**` resource paths | Phase 1 path contract | Template tree using one `assets/` resource namespace |
| CLI path worker | Managed asset paths, renderers, manifest, conflict staging, and focused tests | `packages/cli/src/`, `packages/cli/tests/`, `scripts/smoke-pack.mjs` | Final target paths from Phases 1 and 2 | CLI installs and manages `docs/assets/**` resources and writes state to `.make-docs/manifest.json` |
| Dogfood docs worker | Repository docs tree migration | `docs/assets/**`, removal of active `docs/.archive`, `docs/.assets`, `docs/.prompts`, `docs/.references`, `docs/.templates`, `docs/.resources` after move | Phases 1 through 3 | Dogfood docs match the new template model |
| Active docs and skills worker | READMEs, guides, skill references, archive skill assets | `README.md`, `packages/cli/README.md`, `packages/docs/README.md`, `docs/guides/**`, `packages/skills/archive-docs/**`, `.agents/skills/archive-docs/**`, `.claude/skills/archive-docs/**` | Final path contract | User-facing and skill-facing docs no longer point to retired paths |
| Validation worker | Test, stale-reference, and link repair pass | Validation-only edits across affected files | All implementation workers | Passing validation and documented stale-reference allowlist |

## MCP Strategy

- Use `jcodemunch` first for source search, symbol context, and targeted code reads.
- Use `jdocmunch` first for docs contracts, templates, prior plans, history records, and active documentation references.
- Use `rg` as an exact-match supplement for stale path strings and file inventories.
- If either index is stale after file moves, use local targeted reads for changed files and avoid broad batch reads.

## Non-Goals

- Do not introduce `docs/assets/config/` or `docs/assets/state/` directories.
- Do not put CLI state directly under `docs/assets/`.
- Do not preserve active duplicate copies under hidden top-level resource directories after the dogfood migration.
- Do not rewrite old historical plans, work backlogs, designs, or history records solely because they mention prior Wave 9 paths as historical facts.
- Do not change project document output roots: `docs/designs/`, `docs/guides/`, `docs/plans/`, `docs/prd/`, and `docs/work/` stay direct children of `docs/`.
- Do not create new `docs/assets/` resource namespaces beyond `archive`, `history`, `prompts`, `references`, and `templates` unless execution discovers a checked-in resource that must be preserved.

## Validation

1. Focused tests pass for catalog, renderer, install, root `.make-docs/` manifest, conflict staging, audit, backup, uninstall, lifecycle, and smoke expectations.
2. Full package validation passes: `npm run build -w make-docs`, `npm test -w make-docs`, `node scripts/smoke-pack.mjs`, and `bash scripts/check-instruction-routers.sh`.
3. Template completeness passes so every file under `packages/docs/template/docs/assets/**` is managed by the CLI asset pipeline.
4. Dogfood verification confirms this repo's active `docs/` tree has `docs/assets/` as the only resource namespace, no active hidden resource directories remain, and CLI state lives in root `.make-docs/`.
5. Active stale-reference search finds no future-facing references to retired `docs/.archive`, `docs/.assets`, `docs/.prompts`, `docs/.references`, `docs/.templates`, `docs/.resources`, `docs/assets/manifest.json`, `docs/assets/conflicts/`, `docs/assets/config/`, or `docs/assets/state/` paths.
6. Internal links resolve after the template and dogfood moves.
7. `git diff --check` passes.

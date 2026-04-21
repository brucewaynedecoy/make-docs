# Docs Assets, Make-Docs State, and Session History - Implementation Plan

## Purpose

Implement the architecture defined in [2026-04-20-docs-assets-state-and-history.md](../../designs/2026-04-20-docs-assets-state-and-history.md). This is **Wave 9 Revision 0** (`w9-r0`): a change to move make-docs operational state and agent-authored session history into the template-owned `docs/.assets/` namespace.

This plan is alpha-phase scoped. It does not spend implementation effort on backward-compatible migration from existing `docs/.make-docs/manifest.json` installs.

## Objective

- `docs/.assets/` becomes the documented home for operational documentation assets.
- The CLI writes and reads its manifest at `docs/.assets/config/manifest.json`.
- The CLI stages unmanaged update conflicts under `docs/.assets/config/conflicts/<run-id>/...`.
- Agent session records move from `docs/guides/agent/` to `docs/.assets/history/`.
- History records gain flexible YAML frontmatter with `client`, `model`, `date`, optional measurement fields, and a combined `coordinate` value such as `W9 R0 P1`.
- Template files, generated router text, asset-pipeline rules, project docs, tests, and smoke validation all agree on the new paths.

## Change Classification

- Requested change type: `revision`
- Effective execution mode: active implementation plan derived from an approved design
- Cleanup rewrite requested: no
- Full backlog regeneration requested: no
- Legacy install migration required: no, because existing alpha installs are out of scope

## Change Inputs

| Input | Format | Location | Confidence |
| ----- | ------ | -------- | ---------- |
| Approved design | Markdown design doc | `docs/designs/2026-04-20-docs-assets-state-and-history.md` | High |
| Planning contract | Markdown reference/template | `docs/.references/planning-workflow.md`, `docs/.templates/plan-overview.md`, `docs/.templates/plan-prd-change.md` | High |
| CLI state-path code | TypeScript source | `packages/cli/src/manifest.ts`, `packages/cli/src/install.ts`, `packages/cli/src/audit.ts`, `packages/cli/src/cli.ts` | High |
| Template asset pipeline | TypeScript source and template files | `packages/cli/src/catalog.ts`, `packages/cli/src/renderers.ts`, `packages/cli/src/rules.ts`, `packages/docs/template/docs/` | High |
| Active docs and history references | Markdown docs | `docs/`, `README.md`, `packages/cli/README.md`, `packages/docs/README.md`, `packages/skills/archive-docs/` | High |

## Baseline Context

- Active design status: reviewed and approved for planning.
- Active PRD status: no PRD namespace change is planned in this step.
- Impacted baseline docs: documentation contracts, router instructions, package READMEs, user/developer guides, archive-skill references, and agent history records.
- Discovery scope completed: code symbols, docs contracts/templates, asset-pipeline consistency tests, smoke script expectations, and stale path references.

## Output Contract

- Plan directory: `docs/plans/2026-04-20-w9-r0-docs-assets-state-and-history/`
- Entry point: `docs/plans/2026-04-20-w9-r0-docs-assets-state-and-history/00-overview.md`
- Phase files: `docs/plans/2026-04-20-w9-r0-docs-assets-state-and-history/0N-<phase>.md`
- Expected follow-on backlog directory after plan approval: `docs/work/2026-04-20-w9-r0-docs-assets-state-and-history/`
- New PRD docs: none
- Baseline PRD annotations: none

## Change Doc Strategy

This change does not create PRD change docs. It is implemented through this plan set, a later work backlog, and direct updates to active documentation contracts, router instructions, template assets, package docs, and CLI behavior.

## Baseline Annotation Plan

No `docs/prd/` baseline annotations are required. Existing active documentation that behaves like source-of-truth material should be updated in place:

| Baseline doc | Impacted sections | Note verb | Target |
| ------------ | ----------------- | --------- | ------ |
| `docs/.references/agent-guide-contract.md` | path, naming, frontmatter, link rules | revise | `docs/.assets/history/` contract |
| `docs/.references/wave-model.md` | history path and coordinate rules | revise | combined `coordinate` convention |
| `docs/.references/output-contract.md` | required path table | revise | `docs/.assets/history/` |
| `README.md`, `packages/cli/README.md`, `packages/cli/src/README.md` | manifest and conflict descriptions | revise | `docs/.assets/config/` |
| `docs/guides/user/getting-started-installing-make-docs.md` | install state, conflict, troubleshooting sections | revise | `docs/.assets/config/` |
| `packages/skills/archive-docs/SKILL.md` and references | history lookup behavior | revise | `docs/.assets/history/` |

## Phase Map

| File | Purpose |
| ---- | ------- |
| `01-contracts-and-history-namespace.md` | Update the history contract/template/prompt model and introduce `.assets` router source files in the project and template. |
| `02-template-assets-and-renderers.md` | Wire `.assets` routers into the managed asset pipeline and generated router renderers while removing `docs/guides/agent/` from install output. |
| `03-cli-state-paths.md` | Move make-docs manifest and conflict staging paths to `docs/.assets/config/` across install, audit, backup, uninstall, CLI output, and tests. |
| `04-history-and-documentation-migration.md` | Move active repo session history into `docs/.assets/history/` and update active docs, guides, READMEs, and skill references. |
| `05-tests-and-validation.md` | Run focused and full validation, link checks, smoke packaging, and stale-reference checks with an explicit historical-doc allowlist. |

## Dependencies

- Phase 1 should land first because it establishes the file contracts and checked-in router source that later phases reference.
- Phase 2 depends on Phase 1 because asset-pipeline consistency tests require every new template file to be managed.
- Phase 3 can proceed after Phase 1, but should land before final documentation cleanup so user-facing docs can cite the implemented CLI path.
- Phase 4 depends on Phases 1 and 2 because moved history files need final routers, contracts, and template paths.
- Phase 5 depends on all prior phases.

## Research Findings

- `packages/cli/src/manifest.ts` owns `MANIFEST_RELATIVE_PATH`, currently `docs/.make-docs/manifest.json`.
- `packages/cli/src/install.ts` hardcodes conflict staging under `docs/.make-docs/conflicts`.
- `packages/cli/src/audit.ts` already uses `MANIFEST_RELATIVE_PATH` for manifest-present and manifest-missing audit classification, so moving the constant changes most audit state automatically.
- `packages/cli/src/cli.ts`, `packages/cli/src/README.md`, `packages/cli/README.md`, `scripts/smoke-pack.mjs`, and several lifecycle tests still mention the old state path directly.
- `packages/cli/src/catalog.ts` currently installs instruction routers for `docs/guides/agent/`; these should move to `docs/.assets/`, `docs/.assets/history/`, and `docs/.assets/config/`.
- `packages/cli/src/renderers.ts` currently renders root, docs, guides, templates, prompts, and design references but has no `.assets` router renderer.
- `packages/cli/tests/consistency.test.ts` requires every file under `packages/docs/template/docs/` to be present in the managed asset pipeline.
- Existing history files are currently under `docs/guides/agent/`; moving them to `docs/.assets/history/` preserves relative-link depth for most links.
- Historical designs, plans, work backlogs, and old history records may describe the old paths as historical facts. The implementation should update active source-of-truth docs and use an explicit stale-reference allowlist instead of rewriting every old artifact.

## Worker Ownership

If implementation is delegated, split ownership by write scope:

| Worker | Scope | Write Scope | Dependencies | Deliverables |
| ------ | ----- | ----------- | ------------ | ------------ |
| Contracts/history worker | Contracts, templates, prompts, and `.assets` router source files | `docs/.references/`, `docs/.templates/`, `docs/.prompts/`, `docs/.assets/`, matching `packages/docs/template/docs/` paths | None | Updated history contract/template/prompt and new `.assets` routers |
| Asset-pipeline worker | CLI catalog/renderers/rules and template consistency | `packages/cli/src/catalog.ts`, `packages/cli/src/renderers.ts`, `packages/cli/src/rules.ts`, renderer/consistency/install tests | Contracts/history worker path decisions | Managed `.assets` assets and no fresh `docs/guides/agent/` output |
| CLI-state worker | Manifest/conflict path behavior and lifecycle tests | `packages/cli/src/manifest.ts`, `packages/cli/src/install.ts`, `packages/cli/src/audit.ts`, `packages/cli/src/backup.ts`, `packages/cli/src/uninstall.ts`, `packages/cli/src/cli.ts`, related tests | Final state paths from design | New manifest/conflict path behavior |
| Docs migration worker | Active docs, history moves, skill references, link repair | `docs/.assets/history/`, `docs/guides/`, `README.md`, `packages/cli/README.md`, `packages/docs/README.md`, `packages/skills/archive-docs/` | Contracts/history worker output | Moved history and updated active docs |
| Validation worker | Final test and stale-reference pass | Tests, scripts, and validation-only fixes | All implementation workers | Passing validation and documented stale-reference allowlist |

## MCP Strategy

- Use `jcodemunch` first for source search, symbol outlines, and targeted code reads.
- Use `jdocmunch` first for docs contracts, templates, existing plans, and active documentation references.
- Use `rg` as a supplemental exact-match check for path strings such as `docs/.make-docs`, `.make-docs/conflicts`, and `docs/guides/agent`.
- If either MCP index is stale, read the specific local file needed and avoid broad batch reads.

## Non-Goals

- Do not implement a legacy reader or migrator for `docs/.make-docs/manifest.json`.
- Do not create `docs/.assets/memories/` or `docs/.assets/preferences/` in this wave.
- Do not rename `docs/.references/agent-guide-contract.md`, `docs/.templates/agent-guide.md`, or `docs/.prompts/session-to-agent-guide.prompt.md` in this wave. Update their contents and routing semantics instead. A later cleanup can rename those files if the project wants less legacy wording.
- Do not rewrite historical design, plan, or work documents solely to remove old path mentions unless they are active instructions, active user/developer docs, package READMEs, or validation targets.

## Validation

1. Focused tests pass for manifest path behavior, conflict staging, audit, backup, uninstall, CLI output, and template asset consistency.
2. Full package validation passes: `npm run build -w make-docs`, `npm test -w make-docs`, and `node scripts/smoke-pack.mjs`.
3. Template completeness passes so every `packages/docs/template/docs/.assets/**` file is managed by the CLI asset pipeline.
4. Internal links resolve after moving history files.
5. Stale-reference search confirms active source-of-truth files no longer point users or generated output at `docs/.make-docs/` or `docs/guides/agent/`.
6. `git diff --check` passes.

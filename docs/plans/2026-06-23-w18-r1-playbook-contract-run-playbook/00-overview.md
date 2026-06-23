# W18 R1 Playbook Contract Run Playbook

## Purpose

Define the implementation plan for the v2 playbook content contract and generic Run Playbook execution model.

This plan is derived from [Playbook Contract and Run Playbook](../../designs/2026-06-20-playbook-contract-and-run-playbook.md). It returns the Batch 4 roadmap's artifact-led source-to-design straddle to the normal design -> plan -> PRD -> work -> implementation sequence.

## Coordinate

- Wave: W18
- Revision: R1
- Route: change-plan
- Source design: [docs/designs/2026-06-20-playbook-contract-and-run-playbook.md](../../designs/2026-06-20-playbook-contract-and-run-playbook.md)
- New PRD: [docs/prd/29-revise-playbook-contract-run-playbook.md](../../prd/29-revise-playbook-contract-run-playbook.md)
- Work backlog: [docs/work/2026-06-23-w18-r1-playbook-contract-run-playbook/00-index.md](../../work/2026-06-23-w18-r1-playbook-contract-run-playbook/00-index.md)

## Current Implementation Grounding

- `docs/library/playbooks/agent/make-docs-lifecycle.md` exists as transitional dogfood evidence, not the v2 home.
- [docs/prd/22-revise-new-docs-assets-playbooks-persona-model.md](../../prd/22-revise-new-docs-assets-playbooks-persona-model.md) already makes `docs/assets/playbooks/**` the future persona-scoped playbook namespace but explicitly does not define Run Playbook execution.
- `packages/cli/src/rules.ts` and `packages/cli/src/catalog.ts` currently enumerate prompts, references, templates, scripts, and instruction routers; they do not enumerate playbook assets or validate playbook frontmatter.
- `packages/cli/src/manifest.ts` records generic files and `skillFiles`; it has no playbook catalog, stack, or run-support metadata.
- `scripts/smoke-pack.mjs` validates packed template, skills, backup, and uninstall behavior, but it does not prove playbook metadata, path/persona consistency, build-stack versus run-stack selection, or Run Playbook invocation.

## Plan Shape

1. Reconcile PRD and risk-register ownership.
2. Define playbook metadata, path, body, and stack validation.
3. Define generic Run Playbook selection, validation, authority loading, gates, assists, and output routing.
4. Define package/template/lifecycle validation and implementation closeout expectations.

## Non-Goals

- Do not define plugin substrate, product workflow bundles, or public plugin exposure.
- Do not require one plugin per playbook.
- Do not add MCP writes or unattended execution as default behavior.
- Do not migrate all current playbook content in this planning round.

## Validation Plan

- Run `git diff --check`.
- Run `bash scripts/check-wave-numbering.sh`.
- Attempt to reindex project docs with jdocmunch after edits.
- Scan new and touched docs for unfinished tokens.
- Check touched Markdown local links before committing.

## Intended Follow-On

- Implement the paired backlog under `docs/work/2026-06-23-w18-r1-playbook-contract-run-playbook/`.
- Continue Batch 4 with the plugin-substrate design using the playbook contract as content authority, not as a plugin-packaging rule.

# W18 R2 Harness Plugin Substrate Workflow Bundles

## Purpose

Define the implementation plan for the v2 plugin substrate and productized workflow bundle metadata.

This plan is derived from [Harness Plugin Substrate and Workflow Bundles](../../designs/2026-06-20-harness-plugin-substrate-and-workflow-bundles.md). It follows W18 R1 by treating playbooks as content and plugins as optional harness-visible invocation packages over accepted lifecycle, manifest, configuration, CLI/MCP, audit, and playbook contracts.

## W10 R7 Runtime Pivot

W10 R7 supersedes any future-facing Rust parity assumption in plugin lifecycle planning. Plugin deterministic behavior must delegate to TypeScript CLI/MCP operation domains, with MCP required and TypeScript-owned.

## W17 R3 Native Exposure Correction

W17 R3 supersedes the W17 R2 generated-stub default for shared-agentics exposure. W18 R2 plugin substrate work may proceed, but plugin harness exposure must inherit W17 R3's native exposure rule: prefer symlinked harness directories when possible, use managed copy mirrors as the compatibility fallback, and treat generated adapters as plugin-specific harness shims rather than the default shared-agentics exposure primitive.

## W17 R4 Lifecycle State Prerequisite

Before implementing plugin backup, uninstall, migration, or cleanup behavior, apply W17 R4: new backup writes target `.make-docs/backup/**`, legacy root `.backup/**` remains protected backup state, and empty managed `.make-docs/agentics/**` directories are pruned only when audit proves no unmanaged descendants remain.

## W18 R4 Run Playbook Prerequisite

Before executing plugin or workflow bundle work that invokes playbooks, apply [W18 R4 Run Playbook Orchestration and Harness Capabilities](../2026-06-27-w18-r4-run-playbook-orchestration-and-harness-capabilities/00-overview.md). W18 R2 must delegate resolver identity, stack disambiguation, harness capability mediation, Make Docs-owned run state, nested-playbook behavior, and concurrency safety to W18 R4 instead of defining plugin-local semantics.

## Coordinate

- Wave: W18
- Revision: R2
- Route: change-plan
- Source design: [docs/designs/2026-06-20-harness-plugin-substrate-and-workflow-bundles.md](../../designs/2026-06-20-harness-plugin-substrate-and-workflow-bundles.md)
- New PRD: [docs/prd/30-revise-harness-plugin-substrate-workflow-bundles.md](../../prd/30-revise-harness-plugin-substrate-workflow-bundles.md)
- Work backlog: [docs/work/2026-06-23-w18-r2-harness-plugin-substrate-workflow-bundles/00-index.md](../../work/2026-06-23-w18-r2-harness-plugin-substrate-workflow-bundles/00-index.md)

## Current Implementation Grounding

- `packages/cli/src/types.ts` recognizes `claude-code` and `codex` harnesses, but no plugin artifact kind exists in the current type model.
- `packages/cli/src/profile.ts` defaults `skills` to false and records `selectedSkills`; there is no selected-plugin selection state.
- `packages/cli/src/manifest.ts` records `files` and `skillFiles`; it has no structured selected-agentics ownership record that can distinguish canonical plugin payloads from native harness exposure files or plugin-specific adapters.
- `packages/cli/src/skill-catalog.ts`, `packages/cli/src/skill-registry.ts`, `packages/cli/src/skill-resolver.ts`, `packages/cli/src/skills-command.ts`, and `packages/cli/src/skills-ui.ts` are skill-specific and do not define plugin registries, plugin manifests, bundle metadata, or plugin selection flows.
- `packages/cli/src/audit.ts`, `packages/cli/src/backup.ts`, and `packages/cli/src/uninstall.ts` already use conservative manifest and content evidence, but they do not classify plugin payloads, generated plugin exposures, or user-authored harness plugin files.
- [PRD 28](../../prd/28-revise-shared-agentics-installation-harness-redirection.md) defines shared selected-agentics storage and native harness exposure. [PRD 29](../../prd/29-revise-playbook-contract-run-playbook.md) defines playbook content and the generic Run Playbook model. This plan connects those contracts to plugin substrate and workflow bundle requirements.

## Plan Shape

1. Reconcile PRD and risk-register ownership for PRD 30.
2. Define the plugin substrate, canonical payload store, native harness exposure or plugin-specific adapters, metadata, and manifest records.
3. Define plugin selection, lifecycle, update, audit, backup, uninstall, migration, and operation-boundary behavior.
4. Define workflow bundle metadata, playbook invocation boundaries, package validation, and conformance evidence gates.

## Non-Goals

- Do not make plugins install by default.
- Do not make `--selected-skills all` or any skill selection affordance imply plugin installation.
- Do not make one plugin per playbook or require a plugin for a playbook to be valid.
- Do not implement per-bundle UX details for request-vs-change, scaffold exposure, or docs visibility in this planning round.
- Do not add MCP writes, Rust parity, symlink-only behavior without copy-mirror fallback, or independent plugin-owned deterministic lifecycle logic.

## Validation Plan

- Run `git diff --check`.
- Run `bash scripts/check-wave-numbering.sh`.
- Attempt to reindex project docs with jdocmunch after edits.
- Scan new and touched docs for unfinished tokens.
- Check touched Markdown local links before committing.

## Intended Follow-On

- Implement the paired backlog under `docs/work/2026-06-23-w18-r2-harness-plugin-substrate-workflow-bundles/`.
- Continue Batch 4 with coverage-pass extensions and adversarial review using PRD 30 as the plugin substrate authority.

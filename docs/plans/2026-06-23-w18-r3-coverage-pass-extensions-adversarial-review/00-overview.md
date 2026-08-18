# W18 R3 Coverage Pass Extensions Adversarial Review

## W18 R4 Run Playbook Prerequisite

Before executing any adversarial-review surface that uses a playbook, plugin workflow bundle, CLI action, MCP tool, or harness-assisted long-running execution, apply [W18 R4 Run Playbook Orchestration and Harness Capabilities](../2026-06-27-w18-r4-run-playbook-orchestration-and-harness-capabilities/00-overview.md). W18 R3 remains optional coverage-pass work, but any runner-like exposure must consume W18 R4 resolver, capability, run-state, nested-run, and concurrency behavior.

## W18 R5 Playbook Packaging Prerequisite

Before executing any adversarial-review surface that is packaged as a plugin, skills bundle, or generated harness entry, apply [W18 R5 Playbook Packaging and Harness Adapter Registry](../2026-06-29-w18-r5-playbook-packaging-and-harness-adapter-registry/00-overview.md). W18 R3 remains optional coverage-pass work, but packaged adversarial-review outputs must use reviewed package plans, source/generated provenance, harness adapters, and evidence-bound support claims.

## Purpose

Define the implementation plan for adversarial review as an optional coverage-pass extension.

This plan is derived from [Coverage-Pass Extensions and Adversarial Review](../../designs/2026-06-20-coverage-pass-extensions-and-adversarial-review.md). It closes the Batch 4 design sequence by keeping adversarial review real but optional, and by preserving the coverage-pass, playbook, plugin, package, and conformance boundaries accepted in earlier W16, W18 R1, and W18 R2 work.

## Coordinate

- Wave: W18
- Revision: R3
- Route: change-plan
- Source design: [docs/designs/2026-06-20-coverage-pass-extensions-and-adversarial-review.md](../../designs/2026-06-20-coverage-pass-extensions-and-adversarial-review.md)
- New PRD: [docs/prd/14-lifecycle-workflow-and-coverage-passes.md](../../prd/14-lifecycle-workflow-and-coverage-passes.md)
- Work backlog: [docs/work/2026-06-23-w18-r3-coverage-pass-extensions-adversarial-review/00-index.md](../../work/2026-06-23-w18-r3-coverage-pass-extensions-adversarial-review/00-index.md)

## Current Implementation Grounding

- [.make-docs/contracts/system/coverage-pass-contract.md](../../../.make-docs/contracts/system/coverage-pass-contract.md) already owns the seven-step pass skeleton, base verdict spine, persona-target axis, history idempotency, verdict-and-reason rule, validation checklist, and rules for defining new coverage passes.
- `packages/docs/template/.make-docs/contracts/system/coverage-pass-contract.md` mirrors the shipped template source for the same contract.
- The four coverage-pass prompt resources use the stable `make-docs://system/prompt/<file>` identity and resolve through the provider inventory. They do not require a project-local snapshot.
- `packages/cli/src/rules.ts` registers those four coverage-pass prompts in `PROMPT_RULES`.
- There is no current adversarial-review prompt, playbook, plugin, CLI command, MCP operation, manifest field, or conformance scenario.
- [PRD 30](../../prd/30-plugin-substrate-and-workflow-bundles.md) (historical section: `playbook-boundary`) keeps playbooks valid without plugins, and [PRD 30](../../prd/30-plugin-substrate-and-workflow-bundles.md) keeps plugins explicit-selection only and evidence-gated.

## Plan Shape

1. Reconcile PRD and risk-register ownership for PRD 31.
2. Define the adversarial candidate record and verdict mapping as a coverage-pass extension.
3. Define optional starter prompt, playbook, plugin, CLI, MCP, and conformance exposure boundaries.
4. Define template/package, history idempotency, validation, and support-claim closeout expectations.

## Non-Goals

- Do not make adversarial review a required release, merge, publish, push, implementation, or batch-approval gate.
- Do not make adversarial review a plugin by default.
- Do not add an adversarial prompt, playbook, plugin, CLI command, MCP operation, or conformance scenario without a downstream implementation phase selecting that surface.
- Do not rewrite the base coverage-pass contract into an adversarial-specific contract.
- Do not bypass template-first source-of-truth order for shipped assets.

## Validation Plan

- Run `git diff --check`.
- Run `bash scripts/check-wave-numbering.sh`.
- Attempt to reindex project docs with jdocmunch after edits.
- Scan new and touched docs for unfinished tokens.
- Check touched Markdown local links before committing.

## Intended Follow-On

- Implement the paired backlog under `docs/work/2026-06-23-w18-r3-coverage-pass-extensions-adversarial-review/`.
- Use PRD 31 as the optional adversarial-review authority for any later starter prompt, playbook, plugin bundle, CLI command, MCP operation, or conformance scenario.

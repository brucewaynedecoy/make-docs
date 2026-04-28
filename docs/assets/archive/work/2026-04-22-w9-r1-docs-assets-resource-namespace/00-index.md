# Docs Assets Resource Namespace Overhaul - Work Backlog

## Purpose

This backlog turns the W9 R1 plan set into execution work for the docs resource namespace overhaul.

The target model is:

```text
.make-docs/
  manifest.json
  conflicts/
    <run-id>/
docs/
  assets/
    archive/
    history/
    prompts/
    references/
    templates/
```

`docs/assets/` is for document resources only. Mutable make-docs runtime state belongs at the install target root under `.make-docs/`.

## Source Design

- [Docs Assets Resource Namespace Overhaul](../../designs/2026-04-22-docs-assets-resource-namespace.md)

## Source Plan

- [Docs Assets Resource Namespace Overhaul - Implementation Plan](../../plans/2026-04-22-w9-r1-docs-assets-resource-namespace/00-overview.md)

## Work Phases

| Phase | Work doc | Purpose |
| --- | --- | --- |
| 1 | [Resource Contract and Routing](01-resource-contract-and-routing.md) | Normalize active routing language before physical moves. |
| 2 | [Template Resource Tree](02-template-resource-tree.md) | Move the shippable template resource tree to `packages/docs/template/docs/assets/`. |
| 3 | [CLI Asset Pipeline and State Paths](03-cli-asset-pipeline-and-state-paths.md) | Update managed resource paths and root `.make-docs/` state behavior. |
| 4 | [Dogfood Docs Migration](04-dogfood-docs-migration.md) | Apply the same resource and state model to this repository. |
| 5 | [Tests and Validation](05-tests-and-validation.md) | Prove the template, CLI, dogfood tree, and active docs all match the final contract. |

## Execution Order

1. Complete Phase 1 first so the repo has one path contract.
2. Complete Phase 2 before relying on generated template expectations.
3. Complete Phase 3 after the template target paths are settled.
4. Complete Phase 4 only after the CLI can manage the new paths.
5. Complete Phase 5 after all implementation and dogfood moves are in place.

Phase 2 and Phase 3 can overlap once Phase 1 is stable, but final validation needs the checked-in template and CLI generated output to agree exactly.

## Global Constraints

- Use `jdocmunch` for project docs search and `jcodemunch` for code search when available.
- Preserve user-authored content when moving resource directories.
- Do not create `docs/assets/config/`, `docs/assets/state/`, `docs/assets/manifest.json`, `docs/assets/conflicts/`, or `docs/.make-docs/`.
- Do not add indefinite legacy compatibility for retired alpha paths unless execution discovers a concrete workflow that cannot be migrated cleanly.
- Keep historical references only when they describe past behavior. Active instructions, templates, guides, tests, and CLI output must point to the new model.

## Completion Definition

- `docs/assets/` is the only active document-resource namespace inside `docs/`.
- `.make-docs/manifest.json` is the canonical manifest path.
- `.make-docs/conflicts/<run-id>/` is the canonical conflict staging path.
- The shippable template, CLI asset pipeline, dogfood docs tree, and active documentation all agree on the same path contract.
- Focused tests, stale-path scans, link checks, and whitespace checks pass.


---
title: Template Assets and Generated Routers
kind: guide
persona: maintainer
path: template/assets
status: draft
order: 20
tags:
  - template
  - assets
  - routers
  - renderers
applies-to:
  - docs
  - template
  - cli
related:
  - "template-contracts-guide-authoring.md"
  - "../../prd/06-template-contracts-and-generated-assets.md"
  - "../../prd/02-architecture-overview.md"
  - "../../../.make-docs/system/contracts/guide-contract.md"
---

# Template Assets and Generated Routers

## Overview

The installed documentation surface is a selected projection of `packages/docs/template/`. It is not a copy of every source directory. The CLI selects shipped resources and the instruction files for the chosen harnesses. The global Make Docs Store records installation ownership and progress.

This guide covers the source and delivery boundary. [Guide Contracts and Authoring](template-contracts-guide-authoring.md) covers project-authored guides.

## Source of Truth

Author shipped contracts, references, templates, prompts, and default routers in `packages/docs/template/` first. `packages/cli/` receives the template during the build. Do not maintain a separate CLI template source.

The source tree has these roles:

| Source | Role |
| --- | --- |
| `.make-docs/system/contracts/` | Reusable policy |
| `.make-docs/system/references/` | Workflow and reference material |
| `.make-docs/system/templates/` | Reusable output shapes |
| `.make-docs/system/prompts/` | Reusable prompt resources |
| `docs/` and selected child instruction files | Short routes to policy and output destinations |
| `docs/assets/` instruction files | On-demand shared and audience content routing |
| `.make-docs/archive/` instruction files | On-demand archive routing |

These paths are relative to the template root. A file in the source tree is not proof that a fresh install must create its directory.

Project designs, plans, PRDs, work backlogs, guides, shared material, history, archives, and project config are consumer content. Edit those in the project. They are not template-owned copies merely because Make Docs helped create them.

## Resource Selection and Delivery

The resource catalog and install selections decide which optional bodies are projected locally. Template source variants support the selected harness combination; they are not additional installed files.

Always-present short routers expose the default Personas and route readers to system resources. Use a valid local system body first. If it is absent and the CLI is present, read its stable `make-docs://system/<type>/<path>` URI with `make-docs resource read`.

Current guide templates are `guide-maintainer.md` and `guide-user.md`. Choose the template by the selected effective Persona's primitive, then set the output's `persona` to its actual slug. `guide-developer.md` is an old migration input, not a current resource name.

Do not add broad text rewriting merely to make an old resource look current. Review source changes, update the relevant catalog or selection rule when necessary, and use the managed CLI delivery path.

## On-Demand Asset Routing

A fresh project can have documentation routers without `docs/assets/`. Ordinary discovery must work in that state, with no CLI or Store access.

Built-in Personas are `user` and `maintainer`. Each role can be human or agent. Merge valid `.make-docs/config.yaml` entries with both defaults. Custom Personas retain their slug and use one of the two primitives. The docs router carries the detailed config rules; `make-docs project persona list` can show the effective set without Store access.

When content needs assets, use:

- `docs/assets/project/` for shared project material
- `docs/assets/<persona-slug>/` for audience material
- `.make-docs/archive/` for archives and history

Create only directories needed by content. Keep asset instruction files at the assets root. The `Asset router files` declaration in the docs router names the selected filenames. Do not choose filenames from the acting agent's identity. If the declaration is absent or invalid, obtain an explicit project choice for router creation; ordinary content work can continue.

The compatibility selector `project surface ensure artifacts` ensures the assets root and its selected routers. It reports `docs/assets/project/` as the shared-content destination without creating an empty child. It must not claim that an uncreated destination exists.

Reconfiguration updates the docs declaration. If the assets root already exists, it updates only the selected root instruction files through the normal managed flow. It does not create absent assets or empty audience children.

## State and Ownership

All Make Docs installation, upgrade, migration, layout, and other CLI operation state belongs in the global Make Docs Store. The CLI writes and reads it. Project `.make-docs/config.yaml` is project configuration and identity; it is not a replacement installation ledger.

System resource bodies, project history, and backup payload bytes may exist locally. Their presence does not make them operational authority. Do not create a project manifest, state directory, lock, receipt, or retry queue as a fallback. Do not write directly to the Store from an agent.

Ordinary content work can continue when the CLI is absent or optional capture fails. Report the missing capture truthfully. A CLI-managed change must have its required Store records before it changes managed files. Store failure must stop that operation safely.

## Maintainer Change Workflow

1. Edit the shipped source in `packages/docs/template/`.
2. Update selection or delivery code only when the source change requires it.
3. Test fresh installs, applicable harness combinations, and upgrades from the prior managed version. Preserve edited project content and report conflicts.
4. Build the package and test its public CLI and resource catalog.
5. Use the installed public CLI's reviewed setup flow to update this repository's dogfood instance. Do not copy system bodies into the installed instance by hand.
6. Check source, packaged, and installed bytes where parity is required. Check Store state and confirm no operation remains pending.

A rename needs both a current resource and an upgrade disposition for the old managed path. Clean old copies can be removed through the reviewed CLI plan. Edited copies require a clear preservation or conflict decision.

## Validation

Use focused catalog, install, Persona/assets, and consistency tests for the changed behavior. Package smoke tests cover the public installed path. Test that absent assets stay absent on fresh install and reconfiguration, and that on-demand ensure creates only selected root routers.

A successful source test is not installed parity evidence. A successful copy is not a verified upgrade. The public CLI and Store state must confirm the delivered result.

## Related Resources

- [Guide Contracts and Authoring](template-contracts-guide-authoring.md)
- [Docs Assets and Runtime State Boundaries](maintainer-docs-assets-and-runtime-state-boundaries.md)
- [Template Contracts and Generated Assets](../../prd/06-template-contracts-and-generated-assets.md)
- [Global Store and Project State](../../prd/38-global-store-and-project-state.md)
- [Project Assets and Persona Discovery Design](../../designs/2026-09-09-project-assets-and-persona-discovery.md)
- [Guide Contract](../../../.make-docs/system/contracts/guide-contract.md)

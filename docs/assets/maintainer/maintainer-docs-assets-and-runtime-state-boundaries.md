---
title: Docs Assets and Runtime State Boundaries
kind: guide
persona: maintainer
path: maintainer
status: draft
order: 20
tags:
  - maintainer
  - docs-assets
  - runtime-state
applies-to:
  - cli
  - template
related:
  - template-assets-and-generated-routers.md
  - cli-development-local-build-and-install.md
  - ../user/cli-lifecycle-managing-installations.md
  - ../../prd/38-global-store-and-project-state.md
  - ../../../packages/cli/src/store/README.md
---

# Docs Assets and Runtime State Boundaries

## Overview

Make Docs operational state has one authority: the global Make Docs Store, managed through the CLI. This includes installation inventories, upgrades, migrations, pending operations, locks, recovery checkpoints, and receipts. No project-local manifest or state directory is a current operational authority.

Project knowledge remains local. A guide, backlog, history record, or backup payload is not an installation ledger. Preserve that distinction when changing templates, CLI behavior, or this repository's dogfood instance.

## Current Boundary

| Area | What belongs there |
| --- | --- |
| `docs/designs/`, `docs/plans/`, `docs/prd/`, `docs/work/` | Project lifecycle documents |
| `docs/assets/project/` | Shared project material |
| `docs/assets/<persona-slug>/` | Material for an effective Persona |
| `.make-docs/archive/` | Project archives and history |
| `.make-docs/system/<type>/` | Short resource routers and optional shipped body projections |
| `.make-docs/config.yaml` | Project configuration and portable project identity |
| `.make-docs/backup/` | Preserved backup payload bytes when a CLI operation requires them |
| Global Make Docs Store | CLI installation and operation authority |

The default Store root is `~/.make-docs/`. Supported Store configuration can select another external root. A Store must not be placed inside the managed project. Read the [Store module README](../../../packages/cli/src/store/README.md) for the current schema and implementation details.

## Project Assets and Personas

The two built-in Personas and primitives are `user` and `maintainer`. Either role can be human or agent. Valid project config merges custom entries with both defaults; a custom Persona keeps its slug and chooses one of the two primitives. Do not infer an audience from the executor or silently rename a custom `developer` audience.

The docs router carries the defaults and config rules without requiring the CLI, Store, assets directory, or prior agent memory. `make-docs project persona list` is a read-only way to inspect the effective set.

Create assets only when content needs them. Keep configured instruction files at the assets root. Do not create empty audience children or revive the retired Library, Artifacts, or Playbooks directory families. Archives stay in `.make-docs/archive/`.

## Required State and Optional Capture

CLI-managed installation and layout changes require durable Store intent before project mutation. The operation remains pending until the CLI verifies the required file and state changes. A Store error must not turn into an unrecorded installation, partial-success claim, or local fallback.

Ordinary project work can continue when the CLI is absent or optional state capture fails. In that case, report that capture did not occur. Do not create a local state file, retry queue, or direct Store write to make the report look complete.

Project history breadcrumbs and an optional work backlog can record project work. They cannot replace required CLI operation records or authorize a migration by themselves.

## Inspection and Recovery

Start with the public read-only status command:

```sh
make-docs project state status --target-root <project-path> --json
```

If it reports a pending operation, use the reported recovery instructions and `make-docs project state recover`. Do not delete a lock, receipt, database row, or legacy file by hand to clear the status.

For a legacy layout, use `make-docs project layout preview` to review exact paths, content identities, link repairs, and blockers. `prepare` records the reviewed intent in the Store. CLI mode uses `apply`; manual or agent mode follows the prepared instructions and ends with `verify`. All modes must satisfy the same recorded byte and link checks. A manual file move alone is not completion.

Old project manifests, `.make-docs/state/`, and prior operational directories are migration inputs only. Their existence is not permission to resume writing them. Keep ambiguous or edited content intact until the CLI presents a reviewed disposition.

## Ownership and Safe Changes

Author shipped resources and defaults in `packages/docs/template/` first. Build the CLI package from that source. Apply changes to the dogfood instance through the installed public CLI. Do not hand-copy system resources or modify generated ownership records.

Project-authored designs, guides, PRDs, plans, work backlogs, shared material, and history are edited in place as consumer content. Do not promote them into shipped templates without explicit product authority.

A file's path does not prove that Make Docs owns it. The Store installation inventory and recorded content identities support that decision. Reviewed updates must preserve edited or ambiguous files and report conflicts. Keep backup payloads while they remain needed for preservation or recovery.

Machine-wide tool removal and project removal have separate scopes. Removing one project must not delete an all-projects Store. Tool removal preserves the Store by default; explicit Store cleanup is a separate choice. Consult the current CLI help and owning requirements before a cleanup operation.

## Historical Material

Earlier phases used project manifests, local state directories, and several asset layouts. Retain historical records as evidence of those versions. They do not override current PRD authority or the live CLI's state boundary.

A historical `Developer` heading can remain in a past record. New history uses `Project`, `Maintainer`, and `User`. A former default audience name does not prove the primitive of a custom Persona.

## Maintainer Validation

For a state change, test the failure path as well as the successful path. Check that required Store intent exists before writes, conflicts preserve bytes, interrupted work can resume, and verification leaves no pending operation. Keep tests and smoke runs isolated from the real home Store with their supported test configuration.

For template delivery, test fresh installs, managed upgrades, and configured harness combinations. Check that no local operational state or empty legacy asset family is created. After the public dogfood update, compare selected installed resources with the package and read Store status again.

## Related Resources

- [Template Assets and Generated Routers](template-assets-and-generated-routers.md)
- [Guide Contracts and Authoring](template-contracts-guide-authoring.md)
- [Building and Installing the CLI Locally](cli-development-local-build-and-install.md)
- [Managing Installations](../user/cli-lifecycle-managing-installations.md)
- [Global Store and Project State](../../prd/38-global-store-and-project-state.md)
- [Store-Owned Installation and Migration State Design](../../designs/2026-09-09-store-owned-installation-and-migration-state.md)
- [Project Assets and Persona Discovery Design](../../designs/2026-09-09-project-assets-and-persona-discovery.md)
- [Store Module README](../../../packages/cli/src/store/README.md)

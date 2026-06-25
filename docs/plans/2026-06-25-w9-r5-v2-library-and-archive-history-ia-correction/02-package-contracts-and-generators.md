# Package Contracts and Generators

## Purpose

Define the package and generator edits required to make W9 R5 install, sync, smoke, and closeout behavior use the corrected paths.

## Scope

- `packages/docs/template/**` source routers.
- Generated `packages/cli/template/**` copy.
- CLI catalog and compatibility fallback paths.
- Default validation, install, uninstall, and smoke-pack tests.
- Closeout/archive/workflow skill helpers that write or discover history and guide/library content.
- `.make-docs/manifest.json` after managed asset set refresh.

## Required Updates

- Replace `docs/assets/guides/{AGENTS,CLAUDE}.md` with `docs/assets/library/{AGENTS,CLAUDE}.md`.
- Remove shipped `docs/assets/breadcrumbs/{AGENTS,CLAUDE}.md`.
- Ensure fresh installs do not pre-create `docs/assets/archive/history/**`; history helpers create it only when writing records.
- Update helper defaults from `docs/assets/history` or `docs/assets/breadcrumbs` to `docs/assets/archive/history`.
- Update guide discovery and scope guards from `docs/guides/**` or `docs/assets/guides/**` to `docs/assets/library/**`.

## Validation

- Focused package tests must prove default installs contain library routers and omit old guide/breadcrumb/history routers.
- Smoke-pack must preserve custom unmanaged content in `docs/assets/library/**`, `docs/assets/playbooks/**`, `docs/assets/artifacts/**`, and `docs/assets/archive/history/**`.

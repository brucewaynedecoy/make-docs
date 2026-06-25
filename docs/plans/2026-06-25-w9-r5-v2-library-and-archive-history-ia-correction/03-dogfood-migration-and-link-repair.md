# Dogfood Migration and Link Repair

## Purpose

Define the repo-root dogfood migration that happens now rather than later.

## Scope

- Move legacy guide content from `docs/guides/**` plus current guide routers from `docs/assets/guides/**` to `docs/assets/library/**`.
- Move old history and W9 R4 breadcrumb records from `docs/assets/history/**` and `docs/assets/breadcrumbs/**` to `docs/assets/archive/history/**`.
- Remove transitional `docs/library/**` after preserving any unique playbook content under `docs/assets/playbooks/**`.
- Repair live links and active non-historical references.

## Required Updates

- Preserve persona subdirectories for guide/library content.
- Preserve existing history filenames unless a collision requires suffixing the newer breadcrumb with `-breadcrumb`.
- Keep old path prose in archived/completed artifacts only when it describes past state.

## Validation

- No root dogfood directories remain at `docs/guides`, `docs/library`, `docs/assets/guides`, `docs/assets/breadcrumbs`, or `docs/assets/history`.
- Links to moved live files resolve.

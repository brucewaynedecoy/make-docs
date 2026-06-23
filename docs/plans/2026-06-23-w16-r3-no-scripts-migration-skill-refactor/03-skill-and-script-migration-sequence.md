# Skill and Script Migration Sequence

## Purpose

Make the migration order explicit so no selected first-party skill is left with a missing script dependency.

## Required Sequence

1. Add the CLI/shared-core operation and focused tests.
2. Update manifest, planner, audit, backup, uninstall, and installer behavior for the old and new asset shape.
3. Rewrite affected first-party skills in the same implementation window so they call the CLI/MCP boundary instead of skill-local helpers.
4. Remove a first-party helper script from the skill registry, package template, dogfood tree, or mirrored harness only after the corresponding CLI operation and skill rewrite both exist.
5. Validate install, selected-skills, audit, package, and template synchronization before accepting the migration.

## First Wave Scope

The first implementation wave should prioritize lifecycle-breaking dependencies:

- `closeout-commit`
- `closeout-phase`
- `work-on-wave`
- `work-on-phase`

Secondary conversions may include:

- `archive-docs` relationship tracing;
- `cleanup-docs` markdown style checks;
- `decompose-codebase` environment probing and output validation;
- `.make-docs/scripts/check_path_hygiene.py`.

## Selection and Install Safety

Bare installs keep no-default-skills behavior. Explicit selected-skill installs may continue to install first-party skill prose, references, examples, metadata, and agent descriptors, but deterministic make-docs logic must be available from the CLI package rather than only from remote or skill-local script payloads.

## Managed Removal Safety

Removed helper scripts must be classified as managed old skill scripts, managed wrappers, modified local files, or custom user scripts. Removal plans must be reviewable before mutation, and custom user scripts remain out of scope unless a later design explicitly includes them.

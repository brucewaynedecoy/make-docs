# Harness Adapter Registry and Surfaces

## Purpose

Define a modular adapter registry so Make Docs developers can add future harness support without spreading harness-specific rules through the package planner.

## Scope

- Create a harness adapter registry in modular TypeScript operation/source folders.
- Model output kinds separately from surface profiles.
- Treat standard generic locations as surfaces that real harness adapters may consume, not as a fake `generic` harness.
- Let adapters rank valid surfaces using user intent, project/global scope, trust state, platform behavior, symlink availability, copy-mirror fallback, and support status.

## Requirements

Each harness adapter must declare:

- stable harness id and display metadata;
- supported output kinds such as `plugin` and `skills-bundle`;
- supported surfaces such as native project, native global, agents-standard project, agents-standard global, export-only, or adapter-specific surfaces;
- path templates using sanitized placeholders such as `<repo-root>` and `<user-home>`;
- preconditions such as project trust, harness installation, plugin support, skill support, config availability, or user selection;
- preferred exposure mode, fallback exposure mode, and unsupported-mode behavior;
- ownership classification for canonical payloads, symlinks, copy mirrors, generated adapters, user-authored files, and legacy outputs;
- audit, backup, update, migration, and uninstall rules;
- conformance scenario requirements before public support claims.

## Validation

- Adapter fixtures prove at least one supported harness path and one future-harness-style fixture can be added without changing planner behavior.
- Surface selection tests prove `agents-standard` is a surface/profile rather than a harness.
- Unsupported preconditions route to review or manual stop before writing.
- Cross-platform tests cover symlink-preferred and managed copy-mirror fallback where filesystem behavior affects exposure.

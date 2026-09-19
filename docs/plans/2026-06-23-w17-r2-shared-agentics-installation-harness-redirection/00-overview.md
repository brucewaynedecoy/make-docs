# W17 R2 Shared Agentics Installation Harness Redirection Plan

## W17 R3 Supersession

W17 R2 remains historical implementation evidence for shared selected-skill payload placement, role classification, audit, backup, uninstall, and package validation. [W17 R3 Shared Agentics Native Harness Exposure Correction](../2026-06-27-w17-r3-shared-agentics-native-harness-exposure-correction/00-overview.md) supersedes only the generated-stub default: future selected-skill exposure should use native harness directories with symlink preferred and managed copy-mirror fallback.

## Purpose

Decide how make-docs v2 installs selected agentic artifacts once while exposing them to each supported harness without duplicating authoritative payloads.

This design covers the shared installed-state model for skills first, with enough plugin shape to unblock later Batch 4 plugin and playbook decisions. It chooses the cross-platform redirection mechanism, the relationship between shared payloads and harness-specific entrypoints, the manifest and audit boundary, and the way installed agentic artifacts consume configuration overlays.

## Source Design

- Design: [Shared Agentics Installation and Harness Redirection](../../designs/2026-06-20-shared-agentics-installation-and-harness-redirection.md)
- Route: `change-plan`
- Update Mode: `new-doc-related`
- Coordinate: `W17 R2`

## Coordinate Decision

Use `W17 R2`.

The design leaves the coordinate unresolved and cites W5 R2 skill installation, W14 R1 skill selection, W17 R0 no-default-skills correction, and the Batch 3 v2 design sequence. W17 R1 now owns purpose-led skill manifests; this design extends the same selected-agentics line into installed-state and harness exposure, so it becomes W17 R2.

## Current State

- Selected skills are expanded into full payload files under each selected harness root: `.claude/skills/<skill>/` and `.agents/skills/<skill>/`.
- Global selected skills use home-scoped harness roots directly.
- `selectedSkills` remains behavior-level selection state and `skillFiles` is a flat list of managed skill output paths.
- There is no shared `.make-docs/agentics/` payload store.
- There is no generated-stub exposure mode, no stub-vs-payload manifest distinction, and no agentic ownership record that separates canonical payload from harness exposure.
- Audit, backup, uninstall, and migration classify skill files through current manifest and canonical-content regeneration behavior.

## Target State

- Selected agentic payloads are installed once into `.make-docs/agentics/` for project scope or a home-scoped `.make-docs/agentics/` for global scope.
- Canonical families are reserved under `skills/<skill-name>/`, `plugins/<plugin-id>/`, and manifest/provenance records.
- Harness roots receive generated text stubs, not duplicated authoritative payloads.
- `generated-stub` is the default cross-platform exposure mode; symlink mode is not required for v2 correctness.
- Manifest schema evolves to distinguish shared payload paths, generated stub paths, exposure mode, artifact kind, source/provenance, and migrated prior duplicated payloads.
- No-default-skills still holds: bare installs write no selected agentic payloads and no stubs.

## PRD Strategy

- Add PRD 28 for shared agentics installation and generated harness stubs.
- Annotate PRDs 05, 07, 08, 10, 12, 16, 18, 21, 24, 25, 27, and 26 where shared payloads, stubs, manifest ownership, config routing, and plugin inheritance alter existing requirements.
- Update the PRD index and risk register, especially D-005, Q-001, Q-007, Q-012, Q-013, R-001, R-002, R-006, R-008, and R-014.
- Keep broader plugin runtime, Run Playbook, and public plugin exposure questions open.

## Validation Plan

- Run `git diff --check`.
- Run `bash scripts/check-wave-numbering.sh`.
- Attempt to reindex project docs with jdocmunch after edits.
- Scan new and touched docs for unfinished tokens.
- Check touched Markdown local links before committing.

## Intended Follow-On

- Generate the paired implementation backlog under `docs/work/2026-06-23-w17-r2-shared-agentics-installation-harness-redirection/`.
- Implement shared payloads, generated stubs, schema migration, audit/backup/uninstall classification, and package validation without introducing symlink assumptions or default skill installation.

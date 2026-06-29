---
title: "Playbook Packaging and Harness Adapters"
kind: "guide"
status: "draft"
path: "playbooks/development"
persona: "developer"
order: 110
tags:
  - playbooks
  - packaging
  - harness-adapters
  - plugins
  - skills
applies-to:
  - playbooks
  - plugins
  - skills
  - cli
  - mcp
related:
  - ./playbooks-development-runner-architecture.md
  - ../user/playbooks-packaging-shareable-agent-workflows.md
  - ../../../designs/2026-06-29-playbook-packaging-and-harness-adapter-registry.md
  - ../../../prd/33-enhance-playbook-packaging-and-harness-adapter-registry.md
  - ../../../work/2026-06-29-w18-r5-playbook-packaging-and-harness-adapter-registry/00-index.md
---

# Playbook Packaging and Harness Adapters

This guide explains the v2 architecture Make Docs uses for packaging Playbooks into harness-specific plugins or skills bundles. It is written for maintainers and contributors who will implement or extend the package planner, harness adapters, output writers, lifecycle behavior, and validation.

## Architectural Boundary

Playbooks are source. Generated plugins and skills bundles are distribution artifacts. A Playbook remains valid when it is never packaged, and a generated package must carry provenance back to the Playbook refs and source digests that produced it.

The packaging system should be built as modular TypeScript operation domains:

- package planner: validates Playbook sources and creates reviewable package plans;
- harness adapter registry: declares harness-specific output kinds, surfaces, paths, preconditions, and lifecycle rules;
- surface resolver: chooses native, agents-standard, or export-only surfaces from adapter rules and user intent;
- output writers: write accepted plugin or skills-bundle outputs;
- lifecycle integration: records manifest ownership, audit classification, backup, uninstall, stale-output cleanup, and safe pruning;
- conformance hooks: prove support claims for exact generated-output tuples.

CLI commands, MCP tools, plugins, skills, and agent-facing surfaces should delegate to these domains. They should not implement independent packaging or lifecycle behavior.

## Current Operation Domain

The current implementation lives under `packages/cli/src/operations/playbook-packaging/` and exports:

- `types.ts` for package-plan, generated-output, and harness-adapter declaration contracts;
- `validation.ts` for fail-closed validation helpers;
- `planner.ts` for deterministic package-plan generation and dry-run rendering;
- `adapters.ts` for first-party and fixture harness adapter declarations;
- `surface-resolution.ts` for adapter-owned surface, path, precondition, and exposure-mode resolution;
- `writers.ts` for accepted package-plan output writing, generated-output records, manifest ownership, and lifecycle stops;
- `index.ts` for the public operation-domain export and helper exports.

`playbookPackagingDomain` is registered in the shared operations registry with read-only `playbook-package-plan` and `playbook-package-surface-resolve` operations plus the mutating `playbook-package-write` operation. The write operation dry-runs by default and only mutates when `--write` is passed.

Maintainers should import schema helpers from `packages/cli/src/operations/playbook-packaging/` or the operations facade, not duplicate literals in planner, writer, adapter, CLI, or MCP code. When adding fields, update the TypeScript contract, fail-closed validator, and focused schema tests together.

## Package Plans

A package plan is the reviewable bridge between source and output. It should be produced before writes and should record:

- source Playbook refs and source digests;
- output kind, target harness, surface, scope, and package id;
- generated files and ownership classes;
- deterministic fields, user-supplied fields, agent-proposed fields, and unresolved fields;
- review status and reviewer decision;
- support status and conformance requirements;
- lifecycle behavior for install, update, audit, backup, uninstall, and export-only outputs.

Agents may help draft semantic fields such as descriptions, command names, skill grouping, or adapter prose. Those fields are proposals until reviewed. Non-interactive runs must fail before writing when a plan still needs semantic review, ownership review, unsupported-surface resolution, or support-claim evidence.

The current `PlaybookPackagePlan` schema requires a `schemaVersion: 1`, at least one source Playbook, a target, generated artifact inventory, deterministic derivations, agent-assisted proposals, unresolved decisions, field provenance, review state, support state, lifecycle behavior, and validation requirements. Validation rejects unknown output kinds, unknown surfaces, invalid harness ids, empty source lists, invalid field-provenance values, and plans that contain semantic proposals or unresolved decisions without required review state.

The package planner currently supports a dry-run plan flow through `make-docs operations playbook-package-plan`. It reuses the Run Playbook resolver for explicit paths, `persona/slug` refs, and unique bare slug/title refs; computes stable source digests; validates relative Markdown links and assets outside code spans/fences; marks deterministic, user-supplied, agent-proposed, and unresolved fields; and returns review stops before any writes can occur.

Use the operation like this during development:

```sh
make-docs operations playbook-package-plan \
  --source user/run-stack \
  --harness codex \
  --output-kind plugin \
  --surface native \
  --scope project \
  --support-evidence-ref docs/prd/33-enhance-playbook-packaging-and-harness-adapter-registry.md
```

Non-interactive callers should pass `--non-interactive` when they need fail-before-write behavior. The planner throws before returning a writable result when semantic review, ownership review, unsafe rewrite review, unresolved adapter decisions, unsupported targets, broken source links/assets, ambiguous refs, or missing support evidence would require human review.

## Harness Adapters

Adapters own harness-specific behavior. The core package planner should ask an adapter which outputs and surfaces are valid instead of hard-coding harness rules.

Each adapter should declare:

- stable harness id and display metadata;
- supported output kinds such as `plugin` and `skills-bundle`;
- supported surfaces such as native project, native global, agents-standard project, agents-standard global, and export-only;
- path templates with sanitized placeholders such as `<repo-root>` and `<user-home>`;
- preconditions such as project trust, harness installation, plugin support, skill support, config state, or user selection;
- preferred exposure mode and fallback mode;
- ownership classes and lifecycle handling;
- conformance scenarios required before public support claims.

`generic` should not be a harness id. Standard locations are surfaces that real harness adapters may support. The schema currently accepts `plugin` and `skills-bundle` as output kinds and `native`, `agents-standard`, and `auto` as surfaces or surface-selection modes.

Adapter declaration validation requires at least one supported output kind and at least one supported surface. Path templates must only reference output kinds, surfaces, and scopes declared by that adapter so future harness support stays additive instead of requiring planner-specific branching.

Current first-party adapter declarations live in `adapters.ts` for `codex` and `claude-code`. They intentionally model support as internal capability declarations and conformance requirements; public support wording remains provisional unless an exact tuple has evidence. The fixture-only `future-harness` adapter proves new harnesses can add native and agents-standard surfaces without modifying planner code.

Use surface resolution like this during development:

```sh
make-docs operations playbook-package-surface-resolve \
  --package-id run-stack \
  --harness codex \
  --output-kind plugin \
  --surface native \
  --scope project \
  --precondition harness-supported=satisfied \
  --precondition project-trusted=satisfied \
  --precondition symlink-or-copy-mirror=satisfied
```

The resolver returns the selected concrete surface, package path, precondition states, lifecycle rules, conformance requirements, preferred exposure mode, fallback mode, and stops. Unknown or unsupported required preconditions route to manual review before writes. `auto` is resolved deterministically by adapter ranking to a concrete surface, preferring native when available and then agents-standard.

Cross-platform exposure follows the W17 R3 native-exposure rule: prefer symlink exposures, use managed copy mirrors when symlinks are unavailable, and never silently generate generic stubs as a fallback. Lifecycle rules returned by the adapter must preserve user-authored files, unlink symlink exposures without following targets, and remove copy mirrors only when reviewed Make Docs ownership and backup evidence exist.

## Output Writers

Output writers write only after an accepted package plan exists or after the planner proves the output is fully deterministic and safe. Writers distinguish:

- source Playbooks;
- generated plugin payloads;
- generated skills-bundle payloads;
- generated adapters;
- symlink exposures;
- managed copy mirrors;
- export-only files;
- user-authored files;
- legacy generated outputs.

Installed generated outputs should reuse the selected-agentics storage and native exposure contracts. Plugin payloads use `.make-docs/agentics/plugins/**`; skill payloads use `.make-docs/agentics/skills/**`. Harness exposures prefer symlinks and use managed copy mirrors as the compatibility fallback.

Use the writer operation like this during development:

```sh
make-docs operations playbook-package-write \
  --plan-json /path/to/package-plan.json \
  --precondition harness-supported=satisfied \
  --precondition project-trusted=satisfied \
  --precondition symlink-or-copy-mirror=satisfied
```

Without `--write`, the command returns write diagnostics and generated-output records but does not touch files. With `--write`, installed outputs require an existing Make Docs manifest so audit, backup, uninstall, and migration can see the generated files. Export-only output writes under `.make-docs/exports/playbook-packages/**` and does not add installed harness exposure ownership to the manifest.

The writer records source refs, source digests, target harness, output kind, surface, scope, support status, review status, canonical payload path, exposure path, and exposure mode. It stops before writing when required review is incomplete, an `auto` surface has not been resolved, required adapter preconditions are unknown or unsupported, an existing generated output differs, or stale generated output removal lacks a reviewed backup snapshot.

When symlinks are available, installed plugin and skills-bundle outputs expose the shared payload directory through a harness-native or standard location. When symlinks are unavailable, the writer creates managed copy mirrors and records `copy-mirror` ownership instead of generating generic stubs.

## Validation

Implementation should include focused tests for:

- deterministic package plans;
- plans requiring semantic review;
- schema serialization for package plans, generated-output records, and adapter declarations;
- invalid Playbook sources;
- broken links and assets;
- unsupported output kinds and surfaces;
- invalid harness ids, including `generic`;
- future-harness adapter fixtures;
- adapter path templates that reference unsupported surfaces or scopes;
- symlink and copy-mirror fallback;
- modified generated-output preservation;
- stale generated-output cleanup;
- manifest/audit/backup/uninstall behavior;
- package smoke and conformance support claims.

Public support wording should cite evidence for the exact Playbook, package plan, output kind, harness, surface, scope, model/provider, and runtime tuple.

Current focused schema coverage lives in `packages/cli/tests/playbook-packaging.test.ts`. Keep those tests fail-closed: new enum values, ownership classes, support states, surfaces, or lifecycle dispositions should require deliberate test updates rather than passing through as arbitrary strings.

Current package-planner coverage also lives in `packages/cli/tests/playbook-packaging.test.ts`. It covers deterministic single-Playbook plans, multi-Playbook skills-bundle plans that require semantic review, broken relative links and assets, ambiguous source refs, modified generated-output review stops, non-interactive review stops, and CLI dry-run JSON output.

Current adapter and surface-resolution coverage lives in the same test file. It covers first-party adapter lookup, `generic` rejection, native and agents-standard surface resolution, `auto` surface selection, required-precondition review stops, Windows copy-mirror fallback when symlinks are unavailable, future-harness fixture additivity, and CLI surface-resolution JSON output.

Current writer and lifecycle coverage lives in the same test file. It covers plugin payload writes, skills-bundle writes, symlink exposure, copy-mirror fallback, manifest ownership, export-only separation, modified generated-output review stops, reviewed stale-output cleanup, and CLI dry-run/write JSON output.

## Related Resources

- [Run Playbook Runner Architecture](./playbooks-development-runner-architecture.md)
- [Packaging Shareable Playbook Workflows](../user/playbooks-packaging-shareable-agent-workflows.md)
- [Playbook Packaging and Harness Adapter Registry](../../../designs/2026-06-29-playbook-packaging-and-harness-adapter-registry.md)
- [33 Enhance Playbook Packaging and Harness Adapter Registry](../../../prd/33-enhance-playbook-packaging-and-harness-adapter-registry.md)
- [W18 R5 Work Backlog](../../../work/2026-06-29-w18-r5-playbook-packaging-and-harness-adapter-registry/00-index.md)

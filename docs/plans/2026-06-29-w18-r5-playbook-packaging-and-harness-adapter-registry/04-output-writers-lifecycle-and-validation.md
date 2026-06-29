# Output Writers, Lifecycle, and Validation

## Purpose

Define generated plugin and skills-bundle writers plus lifecycle, package, conformance, guide, and history closeout expectations.

## Scope

- Implement generated plugin and skills-bundle writers through accepted package plans.
- Record generated artifacts in manifest ownership state with provenance back to source Playbooks.
- Reuse shared-agentics canonical stores, native harness exposure, symlink preference, copy-mirror fallback, lifecycle backup, and safe pruning rules.
- Validate packed package behavior, source/template inclusion boundaries, and support claims.
- Update user and developer guides after implementation.

## Requirements

Generated outputs must:

- distinguish source Playbooks from generated plugins, generated skills bundles, generated adapters, copy mirrors, symlink exposures, and export-only artifacts;
- record source Playbook refs, source digests, package profile, target harness, output kind, surface, scope, adapter id, support status, and review status;
- use `.make-docs/agentics/plugins/**` for selected plugin payloads and `.make-docs/agentics/skills/**` for selected skill payloads when installed as Make Docs-managed selected agentics;
- preserve user-modified generated outputs for review rather than overwriting or deleting them blindly;
- remove stale generated outputs only when audit proves Make Docs ownership and backup has captured the reviewed snapshot;
- keep conformance-lab records, local run state, and unreviewed generated outputs out of shipped templates and npm tarballs.

## Validation

- Package validation covers build, CLI tests, default validation, smoke-pack, template/package parity, and no accidental inclusion of local generated outputs.
- Lifecycle tests cover install, update, audit, backup, uninstall, modified output preservation, stale output cleanup, symlink unlinking, copy-mirror removal, and empty managed directory pruning.
- Conformance scenarios prove package outputs only claim support for exact validated tuples.
- Guides and history records summarize the implemented user and developer behavior without presenting unshipped surfaces as available.

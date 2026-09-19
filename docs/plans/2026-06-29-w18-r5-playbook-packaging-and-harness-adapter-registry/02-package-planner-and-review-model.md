# Package Planner and Review Model

## Purpose

Define the package planner as the reviewed bridge between portable Playbook source and generated harness-specific outputs.

## Scope

- Add a modular TypeScript package-planner operation domain.
- Validate Playbook source refs, frontmatter, stack, persona/slug identity, assets, relative links, output-surface claims, and run metadata before packaging.
- Compute package intent and package plan records before writes.
- Distinguish deterministic planner output from agent-assisted semantic drafting.
- Fail non-interactive runs before writing when review is required.

## Requirements

The package plan must record:

- source Playbook refs and source digests;
- package id, title, summary, output kind, target harness, surface, scope, and support status;
- generated artifact inventory and ownership class;
- whether a field was derived deterministically, supplied by the user, or proposed by an agent;
- review status and reviewer decision;
- unresolved semantic decisions, unsafe rewrites, unsupported surfaces, or manual-review stops;
- lifecycle behavior for install, update, audit, backup, uninstall, and export-only output.

The planner must not write generated package outputs until the plan is accepted or proven fully deterministic and safe. Agent assistance may draft descriptions, prompts, command labels, grouping, or adapter prose, but it cannot bypass deterministic validation or persist unreviewed outputs.

## Validation

- Fixture tests cover deterministic Playbook package plans, plans requiring semantic review, rejected non-interactive writes, missing required metadata, ambiguous Playbook refs, broken assets/links, and user-modified generated outputs.
- CLI/MCP dry-run surfaces expose package plans without writing.
- Review status is visible in dry-run, manifest, audit, and diagnostics.

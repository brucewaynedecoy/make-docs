# Delta Backlog and Closeout

## Purpose

Define the downstream work backlog structure and closeout expectations for W16 R3.

## Backlog Shape

Create a paired backlog under [docs/work/2026-06-23-w16-r3-no-scripts-migration-skill-refactor](../../work/2026-06-23-w16-r3-no-scripts-migration-skill-refactor/00-index.md) with phases for:

- requirements and register reconciliation;
- CLI/shared-core operation boundary;
- selected skill and script migration;
- package validation and closeout.

## Implementation Guardrails

- Do not delete or de-register a first-party helper script before the equivalent CLI/shared-core operation and skill rewrite are present.
- Do not treat Rust or MCP as implementation prerequisites.
- Do not resolve remote skill source trust, alternate skill manifests, or shared plugin/skill install redirection in this wave.
- Preserve TypeScript package validation, source-first template mutation, dogfood reseeding review, and packed template validation.
- Keep package/release validation dry-run only unless separately authorized.

## Closeout Validation

The implementation closeout should include:

- focused tests for each migrated operation;
- selected-skill install/update/remove tests;
- manifest/audit/backup/uninstall tests for removed managed scripts and wrappers;
- package-template and smoke-pack validation when shipped files change;
- link and path hygiene checks for touched docs;
- explicit risk-register decisions for R-008 and R-014.

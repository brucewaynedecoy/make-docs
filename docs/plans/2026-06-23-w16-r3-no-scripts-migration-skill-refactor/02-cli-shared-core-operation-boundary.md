# CLI Shared-Core Operation Boundary

## Purpose

Define the implementation surface that must exist before shipped helper scripts are removed or converted to thin wrappers.

## Operation Categories

Core deterministic operations move behind CLI/shared-core APIs:

- path hygiene scanning and fixing;
- closeout probing, validation selection, and history skeleton generation;
- phase state inspection and guide coverage probing;
- work-on-wave and work-on-phase coordinate resolution, status, phase planning, checkpointing, scope guard, and phase gate checks;
- archive relationship tracing and impact reporting;
- markdown cleanup and style checks;
- decompose-codebase environment probing and output validation.

Each operation needs:

- deterministic input arguments;
- structured output suitable for CLI text, CLI JSON, and future MCP tool responses;
- dry-run or read-only behavior where mutation would otherwise occur;
- stable exit/error semantics;
- provenance that identifies repo root, target files, selected phase or skill, and relevant manifest/audit state.

## TypeScript First

The TypeScript CLI is the first implementation target because it owns the current install, skills, manifest, audit, backup, uninstall, and package validation behavior. Rust and MCP inherit the operation contract later.

## Wrapper Rule

Existing system scripts may remain only as compatibility wrappers after the equivalent CLI/shared-core operation exists. A wrapper must delegate to the CLI operation, preserve necessary exit-code and message compatibility, and contain no authoritative workflow logic.

## MCP Consequence

No immediate MCP implementation is required. The operation boundary must still be shaped so an MCP tool can expose it later without duplicating behavior or inventing a separate permission model.

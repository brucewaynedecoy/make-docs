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
- structured output suitable for CLI text, CLI JSON, and MCP tool responses;
- dry-run or read-only behavior where mutation would otherwise occur;
- stable exit/error semantics;
- provenance that identifies repo root, target files, selected phase or skill, and relevant manifest/audit state.

## TypeScript First

The TypeScript CLI is the implementation target because it owns the current install, skills, manifest, audit, backup, uninstall, package validation, deterministic operation, and required MCP behavior. W16 R3 proved the first boundary; W10 R8 modularizes that boundary and adds the TypeScript MCP surface.

## Wrapper Rule

Existing system scripts may remain only as compatibility wrappers after the equivalent CLI/shared-core operation exists. A wrapper must delegate to the CLI operation, preserve necessary exit-code and message compatibility, and contain no authoritative workflow logic.

## MCP Consequence

W16 R3 did not implement MCP, but MCP is required for v2 under W10 R7. The operation boundary must be shaped so W10 R8 MCP tools expose it without duplicating behavior or inventing a separate permission model.

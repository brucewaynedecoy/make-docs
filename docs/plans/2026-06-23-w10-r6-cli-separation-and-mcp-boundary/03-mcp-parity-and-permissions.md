# MCP Parity and Permissions

## Operation Parity

Each MCP tool must delegate to the same deterministic operation contract used by the equivalent CLI command or shared core operation.

Parity covers:

- manifest reads;
- config interpretation;
- asset provenance;
- compatibility classification;
- conflict handling;
- dry-run output;
- write permissions;
- audit, backup, uninstall, and recovery safety.

## First MCP Surface

The first MCP surface should be read-first and plan-first:

- inspect installed project state;
- inspect manifest provenance, harnesses, skills, materialization mode, and compatibility classification;
- list or resolve immutable system assets only through accepted materialization contracts;
- run deterministic validators once CLI/shared-core equivalents exist;
- produce dry-run plans before mutation.

## Write Boundary

MCP writes stay out of scope until a later implementation plan defines an explicit permission model and proves parity with existing CLI safety.

## Asset Boundary

MCP must not expose hidden provider-backed state as the only way to understand a repository. Local bootstrap remains mandatory, and provider/cache assets must preserve manifest provenance, hashes, offline expectations, and recovery guidance.

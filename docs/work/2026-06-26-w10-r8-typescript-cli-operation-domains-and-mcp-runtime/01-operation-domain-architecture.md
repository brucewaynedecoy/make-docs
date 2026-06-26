# Phase 01: Operation Domain Architecture

## Purpose

Define and implement the modular TypeScript operation-domain structure before moving behavior.

## Tasks

- [ ] t1: Define operation domain folders that mirror CLI/MCP command domains.
- [ ] t2: Extract shared operation input, output, error, provenance, and rendering types.
- [ ] t3: Keep dispatch layers thin and free of domain logic.
- [ ] t4: Add focused tests for direct operation-domain invocation without CLI parser or MCP transport.
- [ ] t5: Update developer-facing architecture notes for future operation additions.

## Acceptance Criteria

- New deterministic behavior has an obvious module home.
- Operation-domain tests can run without CLI parser setup.

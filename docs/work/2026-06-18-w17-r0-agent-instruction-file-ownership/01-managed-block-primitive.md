# Phase 01: Managed-Block Primitive

## Purpose

Build the foundational delimited managed-block primitive in the CLI: deterministic
location, insertion, replacement, and re-assertion of a marked region inside any
text file, leaving everything outside the markers byte-for-byte untouched.

## Overview

This primitive is content-agnostic so later phases reuse it for root and `docs/`
instruction files alike. It is the mechanism that makes "find make-docs's region"
deterministic rather than a fragile content match.

## Source PRD Docs

- [15-revise-agent-instruction-file-ownership.md](../../prd/15-revise-agent-instruction-file-ownership.md)
- [07-cli-command-surface-and-lifecycle.md](../../prd/07-cli-command-surface-and-lifecycle.md)

## Stage 1 - Block parser and writer

### Tasks

- [ ] t1: Add marker constants (working form `<!-- make-docs:begin -->` / `<!-- make-docs:end -->`) and a block parser/writer module under `packages/cli/src/`.
- [ ] t2: Implement idempotent operations: insert when absent, replace the body on update, re-assert when the body was edited, and no-op when the body already matches.
- [ ] t3: Handle edge cases deterministically: missing, duplicate, or unterminated markers, and files without a trailing newline; preserve surrounding content byte-for-byte.
- [ ] t4: Add unit tests under `packages/cli/tests/` for greenfield, update, edited-body, and malformed-marker cases.

### Acceptance criteria

- Insert, update, and re-assert are idempotent; repeating any operation is a no-op when the body already matches.
- Content outside the block is preserved byte-for-byte across all operations.
- Missing, duplicate, or unterminated markers resolve to a single clean block.
- Tests cover greenfield, update, edited-body, and malformed-marker cases.

### Dependencies

- None. Foundation phase, authored under `packages/cli/` (template-first).

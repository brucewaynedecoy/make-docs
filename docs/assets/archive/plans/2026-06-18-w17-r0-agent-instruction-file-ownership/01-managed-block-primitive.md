# Phase 01: Managed-Block Primitive

## Purpose

Build the foundational delimited managed-block primitive in the CLI: deterministic
location, insertion, replacement, and re-assertion of a marked region inside any
text file, leaving everything outside the markers byte-for-byte untouched.

## What to build

- Marker constants (working form `<!-- make-docs:begin -->` and
  `<!-- make-docs:end -->`) and a small parser/writer module under
  `packages/cli/src/`.
- Operations: locate the block by markers; insert when absent (greenfield or
  missing markers); replace the block body on update; re-assert when the body
  was edited; no-op when the body already matches (idempotency).
- Edge handling: missing or duplicate markers, markers without a closing pair,
  and a file with no trailing newline. Preserve surrounding content exactly.
- Unit tests for every operation and edge case under `packages/cli/tests/`.

## Key decisions

- make-docs owns only the text between the markers; content outside is never
  modified.
- The primitive is content-agnostic (works for any instruction file), so later
  phases reuse it for root and `docs/` instruction files alike.

## Acceptance criteria

- Insert -> update -> re-assert is idempotent (repeating any operation is a
  no-op when the body already matches).
- Content outside the block is preserved byte-for-byte across all operations.
- Missing, duplicate, or unterminated markers are handled deterministically
  (re-insert a single clean block).
- Tests cover greenfield, update, edited-body, and malformed-marker cases.

## Dependencies

- None. Foundation phase. Authored under `packages/cli/` (template-first).

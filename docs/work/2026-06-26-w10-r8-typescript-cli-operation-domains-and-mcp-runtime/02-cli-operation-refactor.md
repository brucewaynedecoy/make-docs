# Phase 02: CLI Operation Refactor

## Purpose

Move the W16 R3 `make-docs operations` behavior into modular operation domains while preserving public behavior.

## Tasks

- [ ] t1: Refactor closeout operations into a closeout domain.
- [ ] t2: Refactor wave and phase operations into work/lifecycle domains.
- [ ] t3: Refactor checkpoint, scope guard, and phase gate behavior into reusable domain modules.
- [ ] t4: Preserve all existing `make-docs operations ...` command names, JSON shapes, and error semantics unless a task explicitly records an intentional compatibility change.
- [ ] t5: Keep W16 R3 selected-skill references working without edits unless module paths appear in shipped prose.

## Acceptance Criteria

- Existing W16 R3 operation tests pass.
- Public CLI behavior is unchanged while source organization improves.

# Phase 3 — Tests and Validation

## Purpose

Add regression tests covering the new code-aware filtering and heuristic rejection, then run the full validation suite to confirm no regressions.

## Overview

Create test fixtures with known false-positive patterns and legitimate links, write unit tests for the new helpers and end-to-end `validate_links` behavior, and run the validator against both fixtures and the real repo.

## Source Plan Phases

- [03-tests-and-validation.md](../../plans/2026-04-16-w6-r0-validator-false-positive-links/03-tests-and-validation.md)

## Stage 1 — Create test fixtures

### Tasks

1. Create a test fixture directory at `packages/skills/decompose-codebase/scripts/test_fixtures/` (or use inline strings in the test file).
2. Include Markdown content with:
   - Salt-style bracket-paren patterns inside fenced code blocks.
   - Salt-style patterns inside single and double backtick inline code spans.
   - Bare bracket-paren patterns outside code regions (e.g., `salt['pillar.get'](..., merge=True)` not in backticks).
   - Legitimate relative links (`./file.md`, `../dir/file.md`).
   - Fragment-only links, absolute URLs, and mailto links (should be skipped by existing filters).
   - Edge cases: unbalanced backticks, consecutive fences, empty code spans.

### Acceptance criteria

- [x] Fixtures cover all categories listed above.
- [x] At least one fixture contains a genuinely broken link (to confirm the validator still catches it).

### Dependencies

- None — fixtures can be created before the implementation is complete.

## Stage 2 — Write unit tests

### Tasks

1. Create `packages/skills/decompose-codebase/scripts/test_validate_output.py`.
2. Test `strip_code_regions` (or equivalent):
   - Fenced blocks are blanked; line count preserved.
   - Inline spans (single and double backtick) are masked.
   - Non-code content is untouched.
3. Test `is_plausible_link_target`:
   - Rejects targets with commas, spaces, quotes, ellipsis.
   - Accepts valid relative path targets.
4. Test `validate_links` end-to-end:
   - Zero errors on fixture containing only code-region false positives.
   - Correct errors reported on fixture with genuinely broken links.
   - Mixed fixture: broken links reported, code-region patterns ignored.

### Acceptance criteria

- [x] All unit tests pass with `python -m pytest` (or `python -m unittest`).
- [x] Test coverage includes every rejection heuristic.
- [x] Test coverage includes both fenced and inline code masking.

### Dependencies

- Phases 1 and 2 (the functions under test must exist).
- Stage 1 (fixtures must exist if using file-based fixtures).

## Stage 3 — Full validation pass

### Tasks

1. Run `python packages/skills/decompose-codebase/scripts/validate_output.py --repo-root <fixture-dir>` and confirm clean output on false-positive fixtures.
2. Run the validator against the make-docs repo itself (`--repo-root .`) and confirm no regressions.
3. If a SaltStack-heavy decomposition output is available, run against it and confirm zero false-positive broken-link errors.

### Acceptance criteria

- [x] Validator produces zero false positives on code-heavy fixtures.
- [x] Validator produces no regressions on the make-docs repo.
- [x] All genuinely broken links are still reported.

### Dependencies

- Stages 1 and 2.

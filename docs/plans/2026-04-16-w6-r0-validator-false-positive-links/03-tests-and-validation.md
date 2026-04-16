# Phase 3 — Tests and Validation

## Purpose

Add regression tests covering the new code-aware filtering and heuristic rejection, and run the full validation suite to confirm no regressions.

## Scope

New test file(s) adjacent to `validate_output.py`, plus a manual validation pass.

## Detailed Changes

### 1. Create test fixtures

Create a test fixture directory (or inline fixtures) containing Markdown files with:

- Salt-style bracket-paren patterns inside fenced code blocks.
- Salt-style patterns inside inline code spans (single and double backtick).
- Non-code bracket-paren patterns with comma/space/quote/ellipsis targets.
- Legitimate Markdown links (relative, fragment, absolute URL, mailto) — these must still be validated.
- Edge cases: unbalanced backticks, nested fences, empty code spans.

### 2. Write unit tests

Test the following functions:

- `strip_code_regions` (or equivalent): confirm fenced blocks and inline spans are masked.
- `is_plausible_link_target`: confirm heuristic rejection for commas, spaces, quotes, ellipsis; confirm acceptance for valid targets.
- `validate_links` end-to-end: confirm no false positives on code-heavy fixtures; confirm real broken links are still caught.

### 3. Run full validation

- Run `python packages/skills/decompose-codebase/scripts/validate_output.py --repo-root <test-fixture>` and confirm clean output.
- Run against the starter-docs repo itself to confirm no regressions.
- If a known SaltStack decomposition output is available, run against it and confirm zero false-positive broken-link errors.

## Files to Create/Modify

| File | Change Summary |
| ---- | -------------- |
| `packages/skills/decompose-codebase/scripts/test_validate_output.py` (new) | Unit tests for code-region masking, heuristic rejection, and end-to-end link validation. |
| Test fixture files (new) | Markdown files exercising false-positive patterns and legitimate links. |

## Acceptance Criteria

- All unit tests pass.
- The validator produces zero false positives on fixtures containing Salt/Jinja2/Python bracket-paren code.
- The validator still catches genuinely broken links.
- Running against the starter-docs repo produces no regressions.

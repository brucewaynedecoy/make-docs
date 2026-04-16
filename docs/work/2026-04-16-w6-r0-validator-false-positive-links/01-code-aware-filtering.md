# Phase 1 — Code-Aware Filtering

## Purpose

Add fenced-code-block skipping and inline-code-span masking to `validate_links` so that `LINK_RE` never evaluates content inside code regions.

## Overview

Two independent transformations are applied to each file's text before `LINK_RE` matching: fenced code block lines are blanked, and inline code spans are masked. Together these eliminate the primary class of false positives — bracket-paren patterns quoted from source code.

## Source Plan Phases

- [01-code-aware-filtering.md](../../plans/2026-04-16-w6-r0-validator-false-positive-links/01-code-aware-filtering.md)

## Stage 1 — Fenced code block tracking

### Tasks

1. Add a helper function (or inline logic) that iterates lines, tracks `in_fence` state toggling on ```` ``` ```` lines, and blanks all lines while inside a fence.
2. Ensure line count is preserved (replace content with empty strings, not removed) so error-reporting line numbers remain accurate.

### Acceptance criteria

- [ ] Lines inside ```` ``` ```` fences are excluded from `LINK_RE` matching.
- [ ] Nested or consecutive fences are handled correctly.
- [ ] Line count of the processed text matches the original.

### Dependencies

- None — independent of all other stages.

## Stage 2 — Inline code span masking

### Tasks

1. After fence removal, apply a regex substitution to mask inline code spans: single-backtick (`` `...` ``) and double-backtick (``` ``...`` ```) delimiters.
2. Replace span content with a safe placeholder that cannot match `LINK_RE` (e.g., empty string between backticks).

### Acceptance criteria

- [ ] Single-backtick code spans are excluded from `LINK_RE` matching.
- [ ] Double-backtick code spans are excluded from `LINK_RE` matching.
- [ ] Backticks themselves are preserved for readability if the masked text is ever inspected.

### Dependencies

- Stage 1 (fenced blocks should be blanked first so backtick-heavy fence markers don't confuse inline span matching).

## Stage 3 — Integrate into validate_links

### Tasks

1. Call the code-region stripping logic on the full file text before running `LINK_RE.findall()` in both the `docs/prd/` and `docs/work/` loops in `validate_links`.
2. Verify existing skip-filters (fragment-only, absolute URL, mailto) remain unchanged.

### Acceptance criteria

- [ ] `validate_links` calls the stripping logic before matching in both loops.
- [ ] No changes to `LINK_RE` constant.
- [ ] Existing legitimate link detection is unaffected.

### Dependencies

- Stages 1 and 2.

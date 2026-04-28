# Phase 1 — Code-Aware Filtering

## Purpose

Add fenced-code-block skipping and inline-code-span masking to `validate_links` so that `LINK_RE` never matches content inside code regions.

## Scope

All changes are in `packages/skills/decompose-codebase/scripts/validate_output.py`, within or adjacent to the `validate_links` function.

## Detailed Changes

### 1. Fenced code block tracking

Add a helper function `strip_code_regions(text: str) -> str` (or integrate inline) that:

- Iterates lines and tracks a boolean `in_fence` state.
- Toggles `in_fence` on lines matching `^\`\`\``.
- While `in_fence` is true, replaces each line's content with an empty string (preserving line count for error reporting if needed).
- Returns the processed text.

### 2. Inline code span masking

After fence removal, mask inline code spans:

- Replace content matching `` `[^`]+` `` with a placeholder that cannot match `LINK_RE` (e.g., replace with empty backticks or a safe token).
- Handle double-backtick spans (``` `` ... `` ```) as well.

### 3. Integration into validate_links

- Call the stripping/masking logic on the full file text before running `LINK_RE.findall()`.
- The existing skip-filters (fragment-only, absolute URL, mailto) remain unchanged.

## Files to Modify

| File | Change Summary |
| ---- | -------------- |
| `packages/skills/decompose-codebase/scripts/validate_output.py` | Add code-region stripping logic; call it in `validate_links` before `LINK_RE.findall()`. |

## Acceptance Criteria

- Fenced code blocks are fully excluded from link matching.
- Inline code spans (single and double backtick) are excluded from link matching.
- Line-count preservation is maintained for accurate error reporting.
- No changes to `LINK_RE` itself.

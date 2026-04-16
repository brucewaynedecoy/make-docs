# Phase 2 — Heuristic Target Rejection

## Purpose

Add post-match heuristics to `validate_links` that reject `LINK_RE` captures which are structurally incompatible with being filesystem paths. This acts as a safety net for cases where code-region masking misses (e.g., unbalanced backticks in source material).

## Scope

All changes are in `packages/skills/decompose-codebase/scripts/validate_output.py`, within the `validate_links` function's post-match filtering.

## Detailed Changes

### 1. Define heuristic rejection function

Add a helper `is_plausible_link_target(target: str) -> bool` that returns `False` when the target:

- Contains a comma (`,`) — paths do not contain commas.
- Contains unescaped spaces (spaces not preceded by `\`) — unescaped spaces are invalid in Markdown link targets per CommonMark.
- Starts or ends with a quote character (`'` or `"`) — indicates a string literal.
- Is exactly `...` or contains `...` — ellipsis placeholder, not a path.

### 2. Integrate into validate_links

- After extracting and stripping a match target, call `is_plausible_link_target(target)`.
- If it returns `False`, skip the target (do not resolve or report it).
- This check runs after the existing skip-filters (fragment, URL, mailto) and before path resolution.

## Files to Modify

| File | Change Summary |
| ---- | -------------- |
| `packages/skills/decompose-codebase/scripts/validate_output.py` | Add `is_plausible_link_target` helper; call it in `validate_links` after match extraction. |

## Acceptance Criteria

- Targets containing commas, unescaped spaces, quotes, or ellipsis are silently skipped.
- Legitimate relative link targets (e.g., `./path/to/file.md`, `../README.md`, `00-index`) continue to be validated.
- No new false negatives for well-formed Markdown link targets.

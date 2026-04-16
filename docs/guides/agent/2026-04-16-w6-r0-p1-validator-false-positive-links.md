# Phase 1 — Validator False-Positive Links: Code-Aware Filtering

## Changes

Added fenced-code-block skipping and inline-code-span masking to `validate_links` in `validate_output.py`. The `LINK_RE` regex now only runs against text that has been pre-processed to remove code regions, eliminating the primary class of false positives — bracket-paren patterns quoted from source code (e.g., `salt['pillar.get'](..., merge=True)`).

| Area | Summary |
| --- | --- |
| New constants | Added `FENCE_RE` and `INLINE_CODE_RE` regex patterns for detecting fenced code blocks and inline code spans. |
| `strip_code_regions()` | New helper function that blanks fenced-block lines (backtick and tilde fences) and masks inline code spans (single and double backtick), preserving line count for accurate error reporting. |
| `validate_links()` | Both the `docs/prd/` and `docs/work/` loops now call `strip_code_regions()` on each file's text before running `LINK_RE.findall()`. |

Files modified:

```text
packages/skills/decompose-codebase/scripts/
└── validate_output.py    (updated — FENCE_RE, INLINE_CODE_RE, strip_code_regions added; validate_links updated)
```

Derives from the [design](../../designs/2026-04-16-validator-false-positive-links.md), [plan phase 1](../../plans/2026-04-16-w6-r0-validator-false-positive-links/01-code-aware-filtering.md), and [work phase 1](../../work/2026-04-16-w6-r0-validator-false-positive-links/01-code-aware-filtering.md).

## Documentation

### Project

| Path | Description |
| --- | --- |
| [docs/work/2026-04-16-w6-r0-validator-false-positive-links/01-code-aware-filtering.md](../../work/2026-04-16-w6-r0-validator-false-positive-links/01-code-aware-filtering.md) | Work backlog phase for code-aware filtering. |

### Developer

None this session.

### User

None this session.

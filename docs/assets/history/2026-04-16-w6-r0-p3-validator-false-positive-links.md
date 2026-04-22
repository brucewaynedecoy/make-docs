---
date: "2026-04-16"
coordinate: "W6 R0 P3"
---

# Phase 3 — Validator False-Positive Links: Tests and Validation

## Changes

Created the test suite for the validator false-positive link fix and ran a full validation pass against the make-docs repo to confirm no regressions.

| Area | Summary |
| --- | --- |
| `test_validate_output.py` (new) | 33 unit tests across 3 classes covering `strip_code_regions`, `is_plausible_link_target`, and end-to-end `_check_links_in_tree` / `build_result` integration. Uses `unittest` with inline fixtures and temp directories. |
| `TestStripCodeRegions` (13 tests) | Fenced blocks (backtick, tilde, language tags, consecutive, CommonMark closing rules, unclosed fence), inline spans (single/double backtick, empty), line count preservation, end-to-end `LINK_RE` filtering of the original Salt bug. |
| `TestIsPlausibleLinkTarget` (12 tests) | Rejects commas, ellipsis, quotes, unescaped spaces. Accepts relative paths, parent paths, fragments, escaped spaces, bare filenames, subdirectories. |
| `TestValidateLinksEndToEnd` (8 tests) | Temp-directory fixtures: code-only docs, broken links, valid links, fragment/URL/mailto skipping, mixed content, bare bracket-paren heuristic, work directory filtering, full `build_result` integration with minimal PRD skeleton. |
| Simplification pass | Extracted `_check_prd()` / `_check_work()` helpers, `_write_minimal_prd_set()` skeleton builder, hoisted `self.resolved_root` into setUp, added unclosed-fence edge case. |
| Regression check | Ran `validate_output.py --repo-root .` against the make-docs repo. All 31 errors are pre-existing structural issues. The single link error is a genuinely broken reference (renamed design file). Zero false positives from code patterns. |

Files created:

```text
packages/skills/decompose-codebase/scripts/
└── test_validate_output.py    (new — 33 tests)
```

Derives from the [design](../../designs/2026-04-16-validator-false-positive-links.md), [plan phase 3](../../plans/2026-04-16-w6-r0-validator-false-positive-links/03-tests-and-validation.md), and [work phase 3](../../work/2026-04-16-w6-r0-validator-false-positive-links/03-tests-and-validation.md).

## Documentation

### Project

| Path | Description |
| --- | --- |
| [docs/work/2026-04-16-w6-r0-validator-false-positive-links/03-tests-and-validation.md](../../work/2026-04-16-w6-r0-validator-false-positive-links/03-tests-and-validation.md) | Work backlog phase for tests and validation. |

### Developer

None this session.

### User

None this session.

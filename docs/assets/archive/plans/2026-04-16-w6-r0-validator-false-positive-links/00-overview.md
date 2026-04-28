# Validator False-Positive Link Fix

## Purpose

Implement the layered link-filtering fix designed in [2026-04-16-validator-false-positive-links.md](../../designs/2026-04-16-validator-false-positive-links.md). The `validate_links` function in `packages/skills/decompose-codebase/scripts/validate_output.py` currently flags programming syntax (e.g., `salt['pillar.get'](..., merge=True)`) as broken Markdown links, causing the LLM to silently corrupt code snippets in the decomposition output.

## Objective

- `validate_links` skips all content inside fenced code blocks (```` ``` ````).
- `validate_links` masks inline code spans (`` `...` ``) before applying `LINK_RE`.
- A post-match heuristic rejects targets that cannot be filesystem paths (commas, unescaped spaces, quotes, ellipsis).
- All existing legitimate link validation continues to work — no false negatives introduced.
- Regression tests cover Salt-style patterns, fenced blocks, inline code spans, heuristic edge cases, and legitimate links.

## Phase Map

| File | Purpose |
| ---- | ------- |
| `01-code-aware-filtering.md` | Add fenced-code-block state tracking and inline-code-span masking to `validate_links`. |
| `02-heuristic-rejection.md` | Add post-match target heuristics to reject non-path captures. |
| `03-tests-and-validation.md` | Add regression tests and run the full validation suite. |

## Dependencies

- Phase 1 has no dependencies.
- Phase 2 has no dependencies. Phases 1 and 2 can run in parallel — they touch different parts of the `validate_links` flow (pre-match filtering vs post-match rejection).
- Phase 3 depends on Phases 1 and 2.

## Validation

1. `python packages/skills/decompose-codebase/scripts/validate_output.py --repo-root <test-fixture>` passes on a fixture containing Salt-style code snippets inside fenced blocks and inline spans.
2. The same command continues to catch genuinely broken links in test fixtures.
3. All existing tests pass.
4. Manual spot-check: run the validator against a known SaltStack-heavy decomposition output and confirm zero false-positive broken-link errors.

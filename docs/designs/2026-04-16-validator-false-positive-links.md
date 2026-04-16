# Validator False-Positive Link Detection in Code Snippets

## Purpose

Fix a bug in `validate_output.py` where the `LINK_RE` regex matches programming syntax that resembles Markdown links — most notably bracket-paren patterns like `salt['pillar.get'](..., merge=True)`. These false positives cause the validator to report "broken link" errors on valid PRD content, which in turn causes the LLM running the decomposition to "fix" the source material by rewriting functioning code snippets to satisfy the validator. This is a data-corruption bug: the validator's false signal leads to destructive edits of the codebase documentation it is supposed to preserve.

## Context

The `validate_links` function in `packages/skills/decompose-codebase/scripts/validate_output.py` scans all Markdown files under `docs/prd/` and `docs/work/` for relative links using:

```python
LINK_RE = re.compile(r"\[[^\]]+\]\(([^)]+)\)")
```

This regex matches any `[...](...) ` pattern. It then resolves the captured target as a filesystem path and flags it as broken if the path doesn't exist. The function already skips fragment-only links (`#...`), absolute URLs (`://`), and `mailto:` targets, but it has no awareness of whether the match occurs inside a code span, code block, or is structurally incompatible with being a real Markdown link.

The decompose-codebase skill generates PRD documents that quote source code to anchor claims back to the repository. Many programming languages use bracket-paren syntax that collides with Markdown link syntax:

| Pattern | Language/Context | False match target |
|---|---|---|
| `salt['pillar.get'](..., merge=True)` | SaltStack | `..., merge=True` |
| `obj['method.name'](arg1, arg2)` | Python/JS dict call | `arg1, arg2` |
| `hash['config.get'](default)` | Ruby/Python | `default` |
| `{{ salt['grains.get']('os_family') }}` | Jinja2 | `'os_family'` |

These all produce `LINK_RE` matches where the "target" is clearly not a path (contains commas, quotes, ellipses, or spaces). The validator flags these as broken links, which triggers the LLM to attempt corrective edits — modifying quoted source code in the PRD to eliminate the "broken link." This silently corrupts the decomposition output.

### Severity

This is high-severity because:

1. **Silent corruption.** The LLM "fixes" the validation error by rewriting code snippets in the PRD, destroying their fidelity to the actual source.
2. **Broad surface area.** Any codebase using bracket-call patterns (SaltStack, Python dict-method chains, Jinja2 templates, Ruby, Perl) will trigger this.
3. **No user signal.** The corruption looks like normal validator-driven cleanup to the operator — there's no warning that real code was modified.

## Decision

Apply a layered filtering strategy in `validate_links` to reject matches that are clearly not Markdown links, without attempting full Markdown parsing.

### 1. Skip matches inside inline code spans

Before running `LINK_RE` over the document text, strip or skip content inside backtick-delimited code spans. A match like `` `salt['pillar.get'](..., merge=True)` `` should never be evaluated as a link.

**Approach:** Pre-process each line to mask inline code spans (`` `...` ``) before applying `LINK_RE`. This is simpler and more robust than trying to exclude them via a negative lookbehind in the regex itself, because code spans can contain arbitrary characters including nested brackets.

### 2. Skip matches inside fenced code blocks

Content between ```` ``` ```` fences is not Markdown prose and should be excluded from link scanning entirely.

**Approach:** Track fenced-code-block state (toggle on ```` ``` ```` lines) and skip all `LINK_RE` matching while inside a fence.

### 3. Heuristic rejection of non-path targets

After extracting a match target, apply lightweight heuristics to reject values that cannot be filesystem paths:

- **Contains commas** (e.g., `arg1, arg2`) — paths don't contain commas.
- **Contains spaces not preceded by `\`** (e.g., `..., merge=True`) — unescaped spaces are not valid in relative Markdown link targets.
- **Starts or ends with a quote character** (`'` or `"`) — indicates a string literal, not a path.
- **Is `...` or contains `...`** — ellipsis placeholder, not a path.

These heuristics act as a safety net for cases where code-span/fence detection fails (e.g., unbalanced backticks in source material).

### 4. Implementation location

All changes are scoped to `validate_links` in `packages/skills/decompose-codebase/scripts/validate_output.py`. No changes to the regex constant `LINK_RE` itself — the filtering happens post-match and pre-match (via code-block skipping).

### 5. Add regression tests

Add test cases to cover:

- Salt-style bracket-paren patterns inside code spans
- Salt-style patterns inside fenced code blocks
- Non-code bracket-paren patterns with comma/space/quote targets
- Legitimate Markdown links still validated correctly
- Edge cases: unbalanced backticks, nested fences

## Alternatives Considered

**Replace `LINK_RE` with a full Markdown parser (e.g., `markdown-it` or `mistune`).** A proper AST walk would correctly distinguish links from code. Rejected because: it adds a runtime dependency to the validation script, which currently uses only stdlib. The script runs inside the decompose-codebase skill where dependency installation is not guaranteed. The heuristic approach solves the known failure modes without external dependencies.

**Use a negative lookbehind/lookahead in the regex to exclude backtick-wrapped matches.** For example, `` (?<!`)LINK_RE(?!`) ``. Rejected because: backtick spans can be arbitrarily nested (`` ` `` vs ``` `` ```), and lookbehind assertions cannot handle variable-length patterns. The pre-processing approach (mask code spans, then match) is more reliable.

**Only validate links that look like file paths (e.g., must contain `/` or end in a known extension).** This would filter out most false positives but would also reject valid Markdown links to files without extensions or in the same directory (e.g., `[index](00-index)`). Rejected because: it trades false positives for false negatives, which defeats the purpose of link validation.

**Do nothing and instruct the LLM not to "fix" broken-link errors in code snippets.** Rejected because: the validator's error output is consumed programmatically by the decompose skill, and relying on prompt-level instructions to override a hard validation error is fragile. The validator should not report false errors in the first place.

## Consequences

**What improves:**

- Codebases using SaltStack, Jinja2, Python dict-method patterns, and similar bracket-paren syntax can be decomposed without corruption.
- The validator's broken-link output becomes trustworthy — every reported error is actionable.
- No new runtime dependencies.

**What shifts:**

- `validate_links` gains ~30 lines of pre-processing and heuristic filtering logic.
- Test coverage must expand to include code-span and code-fence scenarios.
- Future link-validation enhancements must maintain the code-aware filtering.

**Risks:**

- The heuristic rejection rules could theoretically filter out a genuine broken link whose target happens to contain a comma or space. Mitigation: Markdown link targets with unescaped spaces or commas are malformed per the CommonMark spec, so filtering them is correct behavior regardless.
- The code-span masking logic must handle edge cases (nested backticks, unbalanced fences). Mitigation: use a simple state machine rather than regex for fence tracking; for inline spans, match the standard single/double backtick delimiter rules.

## Intended Follow-On

- Route: `baseline-plan`
- Next Prompt: [designs-to-plan.prompt.md](../.prompts/designs-to-plan.prompt.md)
- Why: The fix is scoped to a single file with clear test requirements, but the layered approach (code-span masking, fence tracking, heuristic filters, tests) benefits from a sequenced plan to avoid regressions during implementation.

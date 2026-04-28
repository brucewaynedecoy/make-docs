# Phase 2 — Heuristic Target Rejection

## Purpose

Add post-match heuristics to `validate_links` that reject `LINK_RE` captures structurally incompatible with being filesystem paths, providing a safety net for cases where code-region masking misses.

## Overview

A single helper function inspects each extracted link target and rejects it if it contains characters or patterns that cannot appear in valid Markdown link targets. This runs after the existing skip-filters and before path resolution.

## Source Plan Phases

- [02-heuristic-rejection.md](../../plans/2026-04-16-w6-r0-validator-false-positive-links/02-heuristic-rejection.md)

## Stage 1 — Define heuristic rejection function

### Tasks

1. Add `is_plausible_link_target(target: str) -> bool` that returns `False` when the target:
   - Contains a comma (`,`).
   - Contains unescaped spaces (spaces not preceded by `\`).
   - Starts or ends with a quote character (`'` or `"`).
   - Is exactly `...` or contains `...` (ellipsis).
2. Keep the function pure — no filesystem access, no side effects.

### Acceptance criteria

- [ ] `is_plausible_link_target("..., merge=True")` returns `False`.
- [ ] `is_plausible_link_target("'os_family'")` returns `False`.
- [ ] `is_plausible_link_target("arg1, arg2")` returns `False`.
- [ ] `is_plausible_link_target("./path/to/file.md")` returns `True`.
- [ ] `is_plausible_link_target("../README.md")` returns `True`.
- [ ] `is_plausible_link_target("00-index")` returns `True`.

### Dependencies

- None — independent of Phase 1.

## Stage 2 — Integrate into validate_links

### Tasks

1. In both `docs/prd/` and `docs/work/` loops in `validate_links`, call `is_plausible_link_target(target)` after the existing skip-filters and before path resolution.
2. If it returns `False`, `continue` (skip the target silently).

### Acceptance criteria

- [ ] Non-path targets are silently skipped — no "broken link" error emitted.
- [ ] Legitimate relative link targets are still resolved and validated.
- [ ] The check runs in both the prd and work loops.

### Dependencies

- Stage 1.

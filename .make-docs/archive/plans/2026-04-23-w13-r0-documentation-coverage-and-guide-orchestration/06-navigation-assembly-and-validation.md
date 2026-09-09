# Phase 6 - Navigation, Assembly, and Validation

## Objective

Finish the initiative by making the new guide set discoverable, consistent, and traceable. This phase owns the required non-guide navigation update, cross-bundle link normalization, final ledger-to-guide verification, and any scoped mechanical fixes needed to satisfy the guide contract and acceptance criteria.

## Depends On

- Phases 3 through 5
- The final ledger and guide delivery map from Phases 1 and 2

## Files to Modify

| File | Change Summary |
| ---- | -------------- |
| `README.md` | Add or refresh a guide-discovery entry point that routes readers to the current guide families and recommended starting points. |
| `docs/assets/archive/work/2026-04-23-w13-r0-documentation-coverage-and-guide-orchestration/supporting/capability-coverage-ledger.md` | Mark final resolution notes where validation identifies mismatches or coverage changes. |
| `docs/assets/archive/work/2026-04-23-w13-r0-documentation-coverage-and-guide-orchestration/supporting/guide-delivery-map.md` | Record final delivery status and any accepted deviations from the original bundle map. |
| Guide files changed in Phases 3-5 only | Apply scoped cross-link or mechanical fixes discovered during assembly and validation. |

## Detailed Changes

### 1. Update the shared navigation surface

`README.md` is the required non-guide navigation surface for this initiative.

The assembly update should add a compact discovery section that points readers to:

- onboarding or installation starting points
- workflow and concept guides
- CLI and skills guides
- maintainer and release guides

The section should route readers by need, not by filename alone.

### 2. Normalize cross-bundle guide links

Review the `related` frontmatter and in-body links across all touched guides and normalize the final cross-bundle relationships.

This phase owns:

- links that were deferred because another bundle had not finished yet
- companion-guide links between user and developer audiences
- shared references from multiple bundles back to the same authority docs

Bundle workers should not reopen each other's files once assembly begins.

### 3. Validate contract compliance and traceability

The validation worker must verify:

- frontmatter presence and required fields
- path/slug consistency
- `status: draft` on new guides
- internal Markdown link resolution
- no duplicate or conflicting coverage for the same ledger row
- every touched guide maps back to one or more ledger rows
- historical-vs-current mismatches recorded in the ledger were resolved in favor of current PRD or code truth

Use `jdocmunch` broken-link checks where useful, supplemented by exact local searches for unresolved relative links or stale guide references.

### 4. Limit validation fixes to scoped cleanup

If validation finds issues, the worker may apply only scoped, mechanical fixes such as:

- missing or incorrect `related` entries
- broken internal links
- frontmatter field corrections
- small wording fixes needed to restore current-state accuracy

Do not use validation to reopen guide scope, add new standalone guides, or move work between bundles.

### 5. Produce a final acceptance summary

Before closing, the validation worker should summarize:

- which ledger rows were satisfied
- which rows became `link-only` or `none`
- any rows intentionally deferred
- any unresolved questions that remain after the guide update pass

That summary should be recorded in the updated guide delivery map or returned in the worker handoff so the coordinator can approve the initiative with a clear audit trail.

## Acceptance Criteria

- [ ] `README.md` contains a guide-discovery entry point outside the guide directories.
- [ ] Cross-bundle `related` links are normalized after all bundle workers finish.
- [ ] Every touched guide passes the guide contract checks.
- [ ] Internal links resolve.
- [ ] Duplicate coverage conflicts are removed or explicitly resolved.
- [ ] Every touched guide is traceable to ledger rows and evidence links.
- [ ] Historical-vs-current mismatches are resolved in favor of current PRD or code truth and recorded in the ledger.
- [ ] Validation fixes remain scoped to mechanical cleanup.
- [ ] `git diff --check` passes.

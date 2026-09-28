---
title: "Phase 2: Guidance and Project Proof"
kind: "plan"
status: "draft"
coordinate: "W18 R16 P2"
---

# Phase 2: Guidance and Project Proof

## Purpose

Make the shipped rule match the validator and prove the fix on the reported project shape.

## Source and package scope

Update `packages/docs/template/.make-docs/system/references/prd-change-management.md` and `packages/docs/template/.make-docs/system/contracts/output-contract.md`. State the supported Markdown source scope and the empty standalone structured source set. Keep the field vocabulary for Markdown frontmatter. Dogfood the upstream files into this repo's `.make-docs/system/` paths by the normal template process. Confirm the built CLI package carries the same content. Update user guidance only where it repeats the old broad scan claim.

## Project proof

Run the built validator against the full North Atlantic BuildOS project without changing its evidence. Record the complete report and elapsed time. Confirm that the command returns a result and does not access unrelated JSONL evidence. If it still fails or times out, record that as a separate finding and do not call the full-project check passed. Compare the result with the prior reduced-copy run only as context; the reduced copy is not a substitute for full-project proof.

## Acceptance

- Product PRD, upstream guidance, dogfood guidance, and packaged guidance state the same source rule.
- Relevant tests pass and the full-project command returns an authority report.
- [D-042](../../prd/03-open-questions-and-risk-register.md) closes only after the runtime and guidance match the authority and the full-project result is recorded.

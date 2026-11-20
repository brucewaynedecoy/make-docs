---
title: "W28 R0 P10 Third Review Corrections"
kind: "history"
status: "completed"
date: "2026-11-20"
client: "T3 Code"
model: "Claude Opus 5.5"
coordinate: "W28 R0 P10"
repo: "make-docs"
branch: "docs/w28-wave-revision-rules"
---

# W28 R0 P10 Third Review Corrections

## Changes

Corrects the CodeRabbit findings on PR #64 at `73f0ae00` that are defects in W28's own code, as a revision Phase of P9. The `make-docs setup skills` route names `--target <folder>` when setup ran with a target, and setup counts the Skill changes it leaves again after it plans again. The snapshot code scan tracks comment and fence state together, and a fenced block closes only on a matching fence line. At the owner's direction, the backlog review display and widget findings are deferred to a separate Wave and recorded as D-056 and D-057. No Skill or widget source changed, so no installed Skill sync was needed. Two builds of the 2.0.9 candidate give SHA-256 `d2362a6a26b67bcea9efc60680091ae7830b673d504e7607aa90171b84342556`.

Validation passed: regression tests that fail without each fix, `npm test` apart from the 2 known Node 26 stdio failures, `validate:defaults`, the build, and `smoke:pack:local`. Performance and Unassisted Goal Testing are `not-needed-now`.

## Documentation

### Project

| Path | Description |
| --- | --- |
| [P10 work](../../../docs/work/2026-11-18-w28-r0-wave-revision-rules/10-third-review-corrections.md) | Closes t1–t4 and A56–A59. |
| [Evidence report](../../../docs/work/2026-11-18-w28-r0-wave-revision-rules/evidence.md) | Records the tests, the deferred findings, and both digests. |
| [PRD 03](../../../docs/prd/03-open-questions-and-risk-register.md) | Records D-056 and D-057 as open. |

### Maintainer

None this session.

### User

None this session.

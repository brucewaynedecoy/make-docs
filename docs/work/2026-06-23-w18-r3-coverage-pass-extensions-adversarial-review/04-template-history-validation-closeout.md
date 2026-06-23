# P4 Template History Validation Closeout

## Goal

Validate template/package parity, history idempotency, and support-claim behavior before closing W18 R3 implementation.

## Tasks

- [ ] Confirm any shipped adversarial asset starts in `packages/docs/template/`.
- [ ] Reseed dogfood only for reviewed template-owned files.
- [ ] Refresh `packages/cli/template/` through copy/prepack behavior when package assets change.
- [ ] Validate history idempotency for history-mutating passes.
- [ ] Validate that exploratory no-history passes report no history artifact changed.
- [ ] Run package and docs validation for changed surfaces.
- [ ] Keep public support wording provisional unless implementation or conformance evidence exists.
- [ ] Record closeout with verdicts, reasons, changed artifacts, validation, and handoffs.

## Acceptance Criteria

- Template, dogfood, and package surfaces do not drift.
- History breadcrumbs are not duplicated for one session.
- Validation covers every selected adversarial surface.
- Support claims cite evidence or remain provisional.

## Validation Notes

Baseline closeout should include `git diff --check`, `bash scripts/check-wave-numbering.sh`, focused touched-link checks, `npm run validate:defaults -w packages/cli` when package/template assets change, and `npm run smoke:pack` when packed behavior changes.

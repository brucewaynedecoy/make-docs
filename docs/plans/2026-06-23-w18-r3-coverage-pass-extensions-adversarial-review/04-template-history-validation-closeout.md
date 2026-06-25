# Template, History, Validation, and Closeout

## Objective

Define package/template, history, validation, and closeout expectations for adversarial review implementation.

## Scope

- Preserve template-first authoring for any shipped adversarial prompt, playbook, reference pointer, or starter asset.
- Reseed dogfood only for reviewed template-owned files.
- Refresh `packages/cli/template/` through copy/prepack behavior.
- Apply history idempotency once when a pass creates or updates a session result.
- Permit exploratory adversarial passes to return verdicts without mutating history when the caller did not request history.
- Validate changed or intentionally unchanged coverage before closeout.

## Dependencies

- PRD 10 for package validation.
- PRD 19 for source-of-truth order.
- [history-record-contract.md](../../../.make-docs/contracts/system/history-record-contract.md) for history shape.
- [coverage-pass-contract.md](../../../.make-docs/contracts/system/coverage-pass-contract.md) for validation checklist.

## Acceptance Criteria

- Shipped adversarial assets start in `packages/docs/template/` when selected.
- History records are not duplicated for one session.
- Closeout reports verdicts, reasons, changed artifacts, validation, and handoffs.
- Validation covers package-template parity and surface-specific fixtures for every selected exposure.

## Validation Notes

Baseline implementation validation should include `npm run build -w packages/cli`, `npm test -w packages/cli`, `npm run validate:defaults -w packages/cli`, `npm run smoke:pack`, focused link checks, package-template parity checks, prompt-rule coverage when a prompt is added, playbook metadata validation when a playbook is added, plugin substrate validation when a plugin is added, and conformance-lab records before public support claims.

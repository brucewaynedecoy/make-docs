___
name: Coverage Pass - PRD Reconciliation
description: Runs the PRD reconciliation coverage pass for completed work using the coverage-pass and PRD change-management contracts.
___

Please run the PRD reconciliation coverage pass for the completed work context supplied with this request.

Before writing anything, read `docs/assets/references/coverage-pass-contract.md`, `docs/assets/references/prd-change-management.md`, `docs/assets/references/output-contract.md`, `docs/prd/AGENTS.md` (or `CLAUDE.md`), `docs/prd/00-index.md`, and `docs/prd/03-open-questions-and-risk-register.md`. Treat those files as the authority; cite them in your closeout summary but do not restate their shared mechanics.

Use the PRD reconciliation coverage surface from the coverage-pass contract. Inspect the active PRD namespace and enumerate every candidate requirement change, baseline backlink, risk-register item, index/status update, discoverability pointer, or no-change decision raised by the completed work.

Assign exactly one PRD verdict to every candidate: `prd-change-doc`, `baseline-change-note`, `risk-register-update`, `index-only`, `link-only`, or `none`. Include a reason for each candidate, including `none`. Prefer updating the active PRD owner in place when the requirement is already covered.

Apply the history idempotency rule in `coverage-pass-contract.md` for this session and follow `history-record-contract.md` only if the pass creates or updates a history breadcrumb. Reference the validation checklist in `coverage-pass-contract.md` and the PRD validation checklist in `prd-change-management.md` instead of restating them, and run focused validation for any changed files.

Close with a concise pass summary: verdict table, artifacts changed, validation run, no-change rationales, and remaining handoffs. If commit-message work is needed, use the existing `docs/assets/prompts/work-to-commit-message.prompt.md`; do not create a duplicate commit-message starter.

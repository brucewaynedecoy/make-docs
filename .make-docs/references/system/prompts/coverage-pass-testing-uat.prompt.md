___
name: Coverage Pass - Testing and UAT
description: Runs the testing and UAT coverage pass for completed work using the coverage-pass contract.
___

Please run the testing and UAT coverage pass for the completed work context supplied with this request.

Before writing anything, read `.make-docs/contracts/system/coverage-pass-contract.md` and `.make-docs/contracts/system/history-record-contract.md`. Also read any repo-local test, validation, release, UAT, or acceptance documents that already own the changed surface. Treat those files as the authority; cite them in your closeout summary but do not restate their shared mechanics.

Use the testing and UAT coverage surface from the coverage-pass contract. Enumerate every candidate automated validation command, manual-test scenario, UAT pass, acceptance script, smoke test, no-test decision, or validation-discoverability pointer raised by the completed work.

Assign exactly one verdict to every candidate: `create`, `update-existing`, `link-only`, or `none`. Include a reason for each candidate, including `none`. When no test or UAT is warranted, record why, such as internal-only docs work, behavior already covered by automated tests, or a manual scenario that would not add meaningful signal.

Apply the history idempotency rule in `coverage-pass-contract.md` for this session and follow `history-record-contract.md` for any history breadcrumb. Reference the validation checklist in `coverage-pass-contract.md` instead of restating it, and run focused validation for any changed files.

Close with a concise pass summary: verdict table, artifacts changed, validation run, no-test or no-UAT rationales, and remaining handoffs. If commit-message work is needed, use the existing `.make-docs/references/system/prompts/work-to-commit-message.prompt.md`; do not create a duplicate commit-message starter.

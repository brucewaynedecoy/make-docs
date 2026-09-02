___
name: Coverage Pass - Testing and UAT
description: Runs the testing and UAT coverage pass for completed work using the coverage-pass contract.
___

Please run the testing and UAT coverage pass for the completed work context supplied with this request.

Before writing anything, read `.make-docs/system/contracts/coverage-pass-contract.md`, `.make-docs/system/contracts/history-record-contract.md`, and, when naive UAT or deferred future acceptance may be implicated, `.make-docs/system/contracts/naive-uat-contract.md` plus `.make-docs/system/contracts/deferred-obligation-contract.md`. Also read any repo-local test, validation, release, UAT, or acceptance documents that already own the changed surface. Treat those files as the authority; cite them in your closeout summary but do not restate their shared mechanics.

Use the testing and UAT coverage surface from the coverage-pass contract. Enumerate every applicable candidate separately: automated validation, owner or architecture review, naive end-user UAT, knowledgeable visual or manual interaction, accessibility testing, visual-regression automation, acceptance scripts, smoke tests, no-test decisions, and validation-discoverability pointers.

Assign exactly one verdict to every candidate: `create`, `update-existing`, `link-only`, or `none`. Include a reason for each candidate, including `none`. For each activated naive-UAT execution, preserve the separate mode verdict and resolve exactly one configured Persona whose primitive is `user` or `maintainer`. Use the canonical `user` Persona when none is supplied. When `none` is valid, record the concrete reason, still-applicable validation, future observable trigger, durable owner, target coordinate, and linked `O-###` or current register route.

Apply the history idempotency rule in `coverage-pass-contract.md` for this session and follow `history-record-contract.md` for any history breadcrumb. Reference the validation checklist in `coverage-pass-contract.md` instead of restating it, and run focused validation for any changed files.

Close with a concise pass summary: verdict table, artifacts changed, validation run, no-test or no-UAT rationales, any activated `NUAT-###` or valid future-trigger `none` routing, and remaining handoffs. If commit-message work is needed, read `make-docs://system/prompt/work-to-commit-message.prompt.md` with `make-docs resource read`; do not create a duplicate commit-message starter.

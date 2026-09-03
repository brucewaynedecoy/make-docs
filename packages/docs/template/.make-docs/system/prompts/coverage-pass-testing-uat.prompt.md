___
name: Coverage Pass - Testing
description: Runs the proportionate testing coverage pass for completed work.
___

Run the testing coverage pass for the completed work context supplied with this request.

Before writing, read `.make-docs/system/contracts/coverage-pass-contract.md` and `.make-docs/system/contracts/history-record-contract.md`. When Unassisted Goal Testing or an accepted future outcome can apply, also read `.make-docs/system/contracts/naive-uat-contract.md` and `.make-docs/system/contracts/deferred-obligation-contract.md`. Read the local test, validation, release, and acceptance documents that own the changed surface.

Use the testing coverage surface from the coverage-pass contract. Make a separate current decision for each applicable testing type. Consider automated implementation testing, performance testing, guided progress review, Unassisted Goal Testing, specialist accessibility testing, visual regression, conformance, smoke tests, no-test decisions, and validation links.

For each testing decision, record:

- Testing type;
- Decision informed;
- Reason now;
- Product maturity;
- Scope;
- Executor;
- Gate effect;
- Effort budget;
- Stop condition;
- Evidence retained; and
- Rerun trigger.

For Unassisted Goal Testing, activate a run only when it can answer a material current human-experience uncertainty, or when explicit current authority requires it. Otherwise record `not-needed-now`, the reason, and the evidence that already answers the uncertainty. Do not create a scenario or obligation only for this result.

For each activated run, resolve one configured Persona whose primitive is `user` or `maintainer`. Use canonical `user` when none is supplied. Keep Persona selection separate from executor qualification. Use one result: `clear`, `friction`, `blocked`, or `invalid-run`. Keep the default gate effect advisory unless explicit current authority names a blocking effect.

Reuse unchanged evidence. Expand testing only after a failure signal, a cross-cutting change, an explicit support claim, or accepted risk. Stop when the recorded budget or stop condition ends.

Apply the history idempotency rule in `coverage-pass-contract.md`. Follow `history-record-contract.md` for any history record. Run focused validation for changed files.

Close with a short summary of the testing decisions, files changed, validation run, any activated `NUAT-###`, any `not-needed-now` result, and remaining handoffs. If commit-message work is needed, read `make-docs://system/prompt/work-to-commit-message.prompt.md` with `make-docs resource read`.

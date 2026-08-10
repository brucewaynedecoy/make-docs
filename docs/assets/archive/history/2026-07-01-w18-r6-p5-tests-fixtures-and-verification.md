---
title: "W18 R6 P5 Tests, Fixtures, and Verification"
kind: "history"
status: "completed"
date: "2026-07-01"
client: "Claude Code"
model: "Fable 5"
coordinate: "W18 R6 P5"
repo: "make-docs"
branch: "make-docs-v2"
summary: "Landed the D7 verification suite closing the W18 R6 wave, closed R-018, and ran the wave-completion UAT pass over the validate/catalog surface."
---

# W18 R6 P5 Tests, Fixtures, and Verification

## Changes

Implemented W18 R6 Phase 5, the final phase of the wave, by landing the D7 verification suite as pure tests and fixtures with no production-code changes, per R-TEST-1 through R-TEST-4 of [historical closeout](2026-07-01-w18-r6-p1-playbook-contract-authoring.md) (retired action-PRD: `docs/prd/34-revise-playbook-contract-and-model.md`). The new suite at `packages/cli/tests/playbook-fixtures.test.ts` (52 tests) exercises the library through its pure interface against `packages/cli/tests/fixtures/playbooks/` — 3 valid fixtures and 29 invalid fixtures. Every one of the twenty-four catalog codes has at least one failing fixture asserting the exact code, the catalog severity, a non-empty message and hint, no undeclared co-diagnostics, and severity-exact runnability, with completeness double-enforced by a compile-time `Record<PlaybookDiagnosticCode, FixtureCase[]>` over the full diagnostic-code union plus a runtime walk of the exported catalog, so registering a new code without a fixture fails the suite (R-TEST-1). The valid fixtures include a standalone equivalent of the contract's Section 2.6 worked example that parses and validates with zero diagnostics (R-WF-7). Coverage areas span heading order (missing, reordered, and interleaved-unknown-section cases), dependency-table schema (wrong columns, invalid kind and requirement enums, duplicate IDs), workflow blocks (zero blocks, two blocks, a `yaml` info string, unparseable content), cross-reference integrity in both directions plus the `requires`-targets-`optional` contradiction and the unreferenced-dependency warning, legacy-filename PB-FILE-007 detection, and multi-fault fail-soft collection with fail-closed runnability (R-TEST-2, R-MODEL-3). In `packages/cli/tests/consistency.test.ts` the shipped-default sweep was generalized to directory enumeration, so the template (t9) and dogfood (t10) zero-error sweeps auto-cover any future shipped Playbook (R-TEST-3). In `packages/cli/tests/playbook-validator.test.ts` the contract/catalog machine-check now reads both the upstream template and dogfood contract copies, and a new parity test asserts the two copies are byte-identical, closing the R-018 upstream-parity debt. The t11 parity walk checked every contract section against the implemented layers and catalog and found zero drift — the Phase 3 reconciliation held and no contract edits were needed. All thirteen tasks in [the Phase 5 backlog file](../../../work/2026-07-01-w18-r6-playbook-contract-and-model/05-tests-fixtures-and-verification.md) are checked off, which completes all five phases of the W18 R6 wave: P1 contract, P2 parser, P3 validator, P4 operations and default migration, and P5 verification.

PRD coverage was `risk-register-update` plus a drift check that returned `none`. R-018 in [the open questions and risk register](../../../prd/03-open-questions-and-risk-register.md) moved from Open to Closed: its To-close bar — per-code fixtures and focused parity checks that fail when contract text, validator behavior, or template/dogfood copies diverge — is now fully met, so the Decision cell records the Phase 5 landing, a new Resolution block records how each of the three contract statements is machine-coupled to the others, and the Follow-Up keeps the durable coupling practice now enforced by the suite. The consistency test pins register item headings, not statuses, so the closure required no test change. The drift check found no other affected item or PRD 34 language: R-016 stays Open because its bar is the W18 R7 state machine and W18 R11 registry surfaces and its W18 R6 references describe the single-model rule accurately, R-019 remains owned by the W18 R10 lineage, and PRD 34 records requirements the phase implemented as written, so no change doc was warranted.

Developer-guide coverage was `update-existing`: the [runner architecture guide](../../library/developer/playbooks-development-runner-architecture.md) already told extenders to add a failing fixture per new diagnostic code, and its Catalog Contract Validation section now records that this rule is mechanically enforced by the fixture suite's compile-time and runtime completeness checks and that the contract machine-check covers both contract copies with byte-identity, while the Shipped Default Playbooks section notes that the zero-error sweeps enumerate directories in both locations and auto-cover future defaults. User-guide coverage was `none` for new coverage because the phase is pure test infrastructure with no new user surface; the [running-playbooks guide](../../library/user/playbooks-running-make-docs-workflows.md) validate/catalog sections already describe the user-visible behavior the fixtures pin. The deferred reader-facing contract-projection guide decision, whose blocking trigger (Phase 5 plus wave completion) is now satisfied, was resolved as re-defer to W18 R7: the schema-stability objection is gone — fixtures and byte-identity checks now harden the contract — but the contract remains normative and linkable on its own, the user guide already covers the user-visible validate/catalog surface, and a projection authored now would quote `operations` command spellings that the W18 R11 reorganization renames and pre-runner behavior that W18 R7 changes, so it would need immediate rework for no added reader value. The guide's Future Coverage bullet records the resolution and the new W18 R7 trigger.

### Wave-Completion UAT Coverage

With all five phases landed, the deferred manual-test decision for the W18 R6 wave is `create`: unlike the W18 R2 closeout, this wave ships a real end-user surface — the `playbook-validate` and `playbook-catalog` commands against an installed instance — where a human can judge diagnostic quality (message and hint wording, severity, locations) in a way automated assertions do not. The scenario below was executed against this repo's installed instance during this closeout and behaved exactly as written.

Preparation: from the repo root, build the CLI with `npm run build -w packages/cli` (or `cd packages/cli && npm run build`).

1. Inspect the catalog: run `node packages/cli/dist/index.js operations playbook-catalog --repo-root .`. Expected: JSON with one entry whose `ref` is `agent/make-docs-lifecycle`, `path` is `docs/assets/playbooks/agent/make-docs-lifecycle.playbook.md`, `fileForm` is `playbook-suffix`, `runnable` is `true`, and `errorCount` and `warningCount` are both `0`, with frontmatter identity (title, summary, `stack: build`, `status: accepted`, both schema versions) populated and top-level `diagnostics` empty.
2. Validate the shipped default: run `node packages/cli/dist/index.js operations playbook-validate agent/make-docs-lifecycle --repo-root .`. Expected: one result with `runnable: true`, an empty `diagnostics` array, zero error and warning counts, and top-level `valid: true`.
3. Negative check — broken spine: copy the default Playbook into a scratch directory shaped `<scratch>/docs/assets/playbooks/agent/`, delete the entire `## Inputs And Authority` section, and run `node packages/cli/dist/index.js operations playbook-validate agent/make-docs-lifecycle --repo-root <scratch>`. Expected: `valid: false`, `runnable: false`, `errorCount: 1`, and one diagnostic with code `PB-DOC-001`, severity `error`, a message naming the missing required section, a fix hint listing the full eleven-heading spine in order, and a source span.
4. Negative check — deprecated filename: in the scratch directory rename the intact copy to plain `make-docs-lifecycle.md` and run `node packages/cli/dist/index.js operations playbook-validate --repo-root <scratch>` with no refs. Expected: the file is still detected and validated with `fileForm: "deprecated-plain"`, one `PB-FILE-007` diagnostic with severity `warning` asking for a rename to `<slug>.playbook.md`, zero errors, and `runnable: true` because warnings do not block.
5. Report pass/fail: the scenario passes when every step's observed output matches the expectations above; any missing diagnostic, wrong code or severity, empty message or hint, or a runnable/valid flag that contradicts the error count is a failure to report against W18 R6.

Verification run results: all four steps matched expectations exactly. Step 1 returned the single catalog entry with canonical ref `agent/make-docs-lifecycle`, `playbook-suffix` file form, `runnable: true`, and zero counts; step 2 returned `valid: true` with zero diagnostics; step 3 returned exactly one `PB-DOC-001` error with the expected message ("Required section `## Inputs And Authority` is missing."), the eleven-heading-spine hint, `runnable: false`, and `valid: false`; step 4 returned `fileForm: "deprecated-plain"` with exactly one `PB-FILE-007` warning and `runnable: true`. The scratch copies lived outside the repo and no mutating operation was run.

Validation: the full CLI suite passed 604/604 tests across 34 files (up from 550/33 before the phase), build and `smoke:pack` are green per the implementation checkpoint, the UAT commands above were run read-only against the built CLI, `check_path_hygiene.py` reports zero errors on the touched docs, `git diff --check` is clean, every relative link added by this closeout resolves, and the jdocmunch index was refreshed over the touched docs. The working tree also carries concurrent W18 R10 P5 template runtime-state guidance edits that are outside this phase's scope.

## Documentation

### Project

| Path | Description |
| --- | --- |
| [../../../work/2026-07-01-w18-r6-playbook-contract-and-model/05-tests-fixtures-and-verification.md](../../../work/2026-07-01-w18-r6-playbook-contract-and-model/05-tests-fixtures-and-verification.md) | Marked Phase 5 tasks t1 through t13 complete, closing the W18 R6 backlog. |
| [../../../prd/03-open-questions-and-risk-register.md](../../../prd/03-open-questions-and-risk-register.md) | Closed R-018 with the Phase 5 Decision-cell landing, a Resolution block recording the machine-coupled parity checks, and a Follow-Up keeping the coupling practice. |

### Developer

| Path | Description |
| --- | --- |
| [../../library/developer/playbooks-development-runner-architecture.md](../../library/developer/playbooks-development-runner-architecture.md) | Recorded that the add-a-failing-fixture rule for new diagnostic codes is now mechanically enforced by the fixture suite's completeness checks, that the contract machine-check covers both copies with byte-identity, and that the shipped-default sweeps enumerate directories in both locations. |

### User

| Path | Description |
| --- | --- |
| [../../library/user/playbooks-running-make-docs-workflows.md](../../library/user/playbooks-running-make-docs-workflows.md) | Resolved the deferred contract-projection guide decision as re-defer to W18 R7, recording the rationale and the new trigger in the Future Coverage bullet. |

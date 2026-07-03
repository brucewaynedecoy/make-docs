---
title: "W18 R7 P5 Tests and Verification"
kind: "history"
status: "completed"
date: "2026-07-03"
client: "Claude Code"
model: "Fable 5"
coordinate: "W18 R7 P5"
repo: "make-docs"
branch: "make-docs-v2"
summary: "Completed the D10 verification suite — op-by-op coverage matrix, byte-identical next proof, and the suite-enforced no-repo-run-state boundary — closing the W18 R7 wave at 775/775; resolved both owning guides' Future Coverage triggers, recorded the wave-complete evidence on R-016, and designed (without executing) an end-user UAT scenario for the built CLI."
---

# W18 R7 P5 Tests and Verification

## Changes

Implemented [Phase 5 of the W18 R7 backlog](../../../work/2026-07-01-w18-r7-run-playbook-state-machine/05-tests-and-verification.md) per [PRD 35](../../../prd/35-revise-run-playbook-state-machine.md) R-TEST-1 through R-TEST-5, with all ten phase tasks (t1 through t10) checked off, completing the D10 verification suite and closing the W18 R7 wave — all five phases done. The t1 coverage audit produced the R-TEST-1 coverage matrix as the comment block at the top of `packages/cli/tests/playbook-progression.test.ts`, an operation-by-operation map from every progression operation's success and failure transitions to its owning test, and filled the one gap it found with a new test proving every progression operation fails closed on a missing run id. t2 was strengthened past the phase's letter: the `playbook.next` zero-side-effects proof now asserts the raw stored record row (`SELECT record, updated_at FROM playbook_runs`) is byte-identical before and after the call, not merely deep-equal after parsing, so serialization or timestamp churn fails the test. t3 through t9 were verified already covered by the Phase 2-4 suites — resume both ways with the naming diagnostic, all three execution modes, the parallel-child output-surface overlap block, and the unattended human-gate hold. t10 landed the suite-enforced R-TEST-5 boundary as the new shared module `packages/cli/tests/run-state-boundary.ts` plus a global hook in `tests/setup.ts`: `createTempDir` registers every fixture root it mints, `cleanupTempDir` asserts no `.make-docs/runs/` directory exists anywhere under a root before removing it, and a global `afterEach` sweep re-checks every still-existing tracked root (including the redirected `MAKE_DOCS_HOME` store root) so leaked fixtures are caught too; the mechanism was verified with a temporary negative test proving both legs fail correctly, then removed. A vocabulary audit confirmed every status assertion in the suite uses only the eight shared values — `ready`/`paused` belong to the separate `PlaybookInvocationStatus` vocabulary, and `planned` appears only as the rejected-legacy input. The suite closed at 775/775 across the CLI package with the build green. The [wave index](../../../work/2026-07-01-w18-r7-run-playbook-state-machine/00-index.md) stays `status: "active"` per the W18 R10/R11 convention.

Developer-guide coverage was `update-existing` on [Run Playbook Runner Architecture](../../library/developer/playbooks-development-runner-architecture.md), which owned the topic and whose Future Coverage bullet named this exact pass: the Progression Engine section gained a closing D10 verification paragraph documenting the coverage-matrix comment as the first place to look before changing progression behavior, the byte-identical raw-row proof for `playbook.next`, and the R-TEST-5 boundary mechanism as a maintainer safety rail — new tests that create fixtures through `createTempDir`/`cleanupTempDir` inherit the guard automatically, while a test minting its own temp directory bypasses it — plus the vocabulary-audit boundary between the shared eight values and the invocation-status vocabulary. The Phase 5 half of the Future Coverage bullet was resolved, and the invoke-collapse question the bullet deliberately carried was re-scoped into its own forward-looking bullet: `playbook.invoke` survived the wave's verification unchanged as an active operation, so collapsing the invoke-centric W18 R1 description into the progression flow remains a guide-maintenance decision whose trigger is now a runner-lineage product decision (for example, plugin bundle entry points choosing which operation they call), not a verification outcome. User-guide coverage was `update-existing` on [Running Make Docs Playbooks](../../library/user/playbooks-running-make-docs-workflows.md) at minimal, honest scope, because Phase 5 is test-only and ships no new user-facing behavior: the intro's "planned product behavior" hedge was retired — the run lifecycle the guide documents is now implemented and verified, with only the plugin and packaging sections still describing accepted direction — and the guide's own Future Coverage bullet, whose trigger was the full W18 R7 migration, was resolved with a `none` verdict for the reader-facing Playbook-contract projection it had deferred: the contract remains the normative linkable authority, this guide owns what users do with Playbooks, and a prose projection would restate both without giving a reader a task, to be revisited only if user-authored Playbooks become a primary authoring surface. No new guide was warranted for either persona.

PRD coverage was `risk-register-update` with no change doc, because the phase verified existing PRD 35 requirements without changing the requirement surface: [R-016](../../../prd/03-open-questions-and-risk-register.md) advanced in place — the Decision now records the D10 suite (coverage matrix, missing-run-id fail-closed coverage, byte-identical next proof, both resume outcomes, three modes, the two guardrail failing-path proofs, the suite-enforced boundary mechanism, and the vocabulary audit) and states that the single-writer, resume, nested-run, concurrency, and CLI/MCP-parity legs of the item's close bar are implementation-verified at 775/775, while the Follow-Up names plugin-surface parity as the single remaining close input. R-016 stays Open because its literal close bar requires CLI/MCP/plugin parity and the plugin surface does not exist yet. No other register item needed movement (R-017 concerns packaging provenance; R-023's evidence concerns are the store checkpoint migration, which this phase does not touch), and `docs/prd/00-index.md` needed no change: the completed-wave convention is set by PRD 39, whose row stayed `Current` with no wave-complete annotation after W18 R11 closed, and PRD 35's row already names the full requirement surface.

UAT coverage was `create`: the wave has a real user-observable surface — the `make-docs run playbook` command family — and while the 775-test suite proves every requirement-level behavior, no human has driven the lifecycle from the built package the way a user would: authoring a Playbook by hand, reading the CLI's actual output text, and performing a cross-machine handoff. A hand-run rerun of test logic would add nothing, so the deliverable is the genuine end-user scenario below, recorded here as the manual-test artifact. Command spellings were sanity-checked against the adapters in `packages/cli/src/run/cli.ts`; the scenario was deliberately not executed this session, and it must never be run against the real repository — it uses fresh temp directories and two temp store roots only.

### UAT Scenario: End-User Run Lifecycle From the Built CLI

Setup: `npm run build -w packages/cli`; `CLI="node <repo>/packages/cli/dist/index.js"`; a fresh temp project directory `$PROJ` outside the repo; two temp store roots `$STORE_A` and `$STORE_B` standing in for two machines (the same project directory plus a second store root is a faithful machine-B stand-in because project identity travels in `.make-docs/manifest.json`); a temp handoff directory `$HANDOFF`. Every `run playbook` command below includes `--repo-root .` from `$PROJ`.

1. `cd $PROJ && $CLI setup --yes` — expect a success summary, `.make-docs/manifest.json` with a minted project id, and the shipped default at `docs/assets/playbooks/agent/make-docs-lifecycle.playbook.md`; snapshot the file tree (`find . -type f | sort`).
2. Author `docs/assets/playbooks/user/uat-smoke.playbook.md` by hand per the Playbook contract: `stack: run`, a four-position workflow — s1 `delegated`, s2 `deterministic` with `command: echo uat-ok`, gate g1, s3 `manual`. `$CLI run playbook validate user/uat-smoke` — expect zero errors and runnable. Authoring friction is itself a UAT observation; fall back to `agent/make-docs-lifecycle` only if authoring fails irrecoverably, and record that as a finding.
3. `$CLI run playbook catalog` — expect both Playbooks listed with title, stack, and runnable state.
4. `$CLI run playbook start user/uat-smoke --harness codex --store-root $STORE_A` — expect a run id; expect no `.make-docs/runs/` anywhere under `$PROJ` and a tree diff against the snapshot showing only the user-authored files.
5. `next --run-id $RUN --store-root $STORE_A` — expect position s1, mode `delegated`, instructions presented.
6. `advance` with no outcome — expect a hold at `waiting-for-user` with instructions; then `advance --outcome completed --evidence-ref docs/uat-notes.md --note "done by hand"` — expect the cursor at s2.
7. `advance --present` — expect the exact human command printed and the step held; then plain `advance` — expect `echo uat-ok` executed with structured evidence captured and the cursor at gate g1.
8. `gate --decision approve --note "UAT approval"` — expect the run past g1 at s3.
9. `advance --acknowledge` — expect acknowledgment recorded with nothing executed; `next` reports `closeable`.
10. `run export --run-id $RUN --output $HANDOFF/run.json --store-root $STORE_A` — expect the artifact at exactly that path and nothing new under `$PROJ`; also run once without `--output` and expect stdout-only.
11. `run import --artifact-json $HANDOFF/run.json --store-root $STORE_B` — expect success; repeat the identical import and expect a refusal naming the `--overwrite` opt-in.
12. `resume --run-id $RUN --store-root $STORE_B` — expect re-entry at the stored closeable position; `status` shows the full evidence log including the `import` provenance record.
13. `close --run-id $RUN --terminal-status completed --store-root $STORE_B` — expect the terminal status stamped; a further `advance` refuses with a closed-run error.
14. Final boundary check — `find $PROJ -path '*.make-docs/runs*'` is empty and the tree diff still shows only user-authored files.

Pass/fail reporting: every step names its observable expectation; the scenario fails if any expectation misses, if any run operation writes a file under the project, or if any refusal message fails to name the actionable next step (the overwrite opt-in, the serial fallback, the setup guidance). Record outcomes as a per-step checklist and file failures against the PRD 35 requirement the step exercises (R-OP, R-MODE-1, R-GUARD-4, R-PORT-1, R-STORE-1).

Validation: full CLI suite 775/775 with the build green, `npm run validate:defaults` exit 0, `python3 .make-docs/scripts/check_path_hygiene.py` clean, relative links in the touched docs verified to resolve, no guide promoted past `draft`, no unresolved placeholders, and `git diff --check` clean for every doc this session touched.

## Documentation

### Project

| Path | Description |
| --- | --- |
| [../../../prd/03-open-questions-and-risk-register.md](../../../prd/03-open-questions-and-risk-register.md) | Advanced R-016 in place with the W18 R7 P5 D10 verification evidence and wave completion at 775/775, leaving plugin-surface parity as the single remaining close input. |

### Developer

| Path | Description |
| --- | --- |
| [../../library/developer/playbooks-development-runner-architecture.md](../../library/developer/playbooks-development-runner-architecture.md) | Documented the completed D10 verification suite — the coverage-matrix comment, the byte-identical `playbook.next` proof, and the suite-enforced no-repo-run-state boundary rail new tests inherit automatically; resolved the Phase 5 Future Coverage half and re-scoped the invoke-collapse question into its own bullet with a product-decision trigger. |

### User

| Path | Description |
| --- | --- |
| [../../library/user/playbooks-running-make-docs-workflows.md](../../library/user/playbooks-running-make-docs-workflows.md) | Retired the "planned product behavior" hedge now the run lifecycle is implemented and verified, and resolved the wave-triggered Future Coverage bullet with a no-projection-guide decision. |

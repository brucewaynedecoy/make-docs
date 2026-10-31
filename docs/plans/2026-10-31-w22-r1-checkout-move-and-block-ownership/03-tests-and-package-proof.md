---
title: "Tests and Package Proof"
kind: "plan"
status: "draft"
coordinate: "W22 R1 P3"
---

# Tests and Package Proof

## Purpose

Prove the repair through the shared core, CLI review flow, and installed package. All Store writes in this future test phase use disposable Stores. Never point a fixture at the user's Store or live Make Kit checkout.

## Regression Fixture

Obtain the authentic published `@brucewaynedecoy/make-docs@2.0.5` tarball. Record its registry or approved archive source, package identity, published integrity value, and local SHA-256 digest. Verify its contents and version before it creates the seed. A cached tarball is acceptable only when those facts establish the same released artifact. If the artifact cannot be obtained or verified, mark the authentic upgrade proof blocked. Do not substitute a current-source fixture or hand-written Store row for that proof.

Use that released package to create the seed in an isolated home and Store. Save a copy of the seeded project and Store before the candidate runs. Source-generated fixtures remain useful for unit tests and fault injection, but label them as synthetic evidence. They cannot satisfy the released-package upgrade gate. Install at a temporary `buildos` path. Create a separately installed `kits/make-blueprint` target with a different project ID. Add user prefix and suffix text outside both root instruction blocks. Preserve the resulting files and record identities. Rename the parent directory to `make-kit`.

In this phase, run the fixed development candidate through the normal setup entry point. Its version may still be 2.0.5; label this as development proof. After the version bump, [Phase 4](04-release-206.md#candidate-proof) must repeat this scenario with the exact final 2.0.6 tarball. Development proof cannot close that release gate. The review must identify an existing moved checkout. Approve only the root move. Verify that the kit record stays untouched. Then target the kit and approve its move. Confirm both are ready. Run setup again and prove no move or fresh install is proposed.

Capture file bytes, project and checkout IDs, ledger facts, history counts and identities, and selected path bindings before and after. Compare durable Store tables or a logical snapshot. Do not use a raw SQLite database checksum as the no-write assertion because permitted transient access leases can alter support files. Assert that no preview, cancellation, or rejection leaves a durable move, identity, history, journal, or ownership change. Transient leases must be released. A path-only move must not modify project files. The fixture is evidence for the release candidate, not a repair of the user's live projects.

## Required Test Matrix

| Case | Required result |
| --- | --- |
| Unchanged valid blocks; edited prefix/suffix in both root files | Move succeeds; outside bytes remain exact. |
| One edited managed block | Exact block conflict; no binding change or silent overwrite. |
| Missing, duplicate, reversed, or malformed markers | Strict marker diagnosis; no adoption. |
| Fully owned file changed | Existing full-file safety rule still applies. |
| 2.0.5 whole-file verification record | Independent ownership proof permits safe upgrade; no blind digest reset. |
| Authentic schema-1 router | Existing trusted whole-file adoption rules still pass or stop as designed. |
| Config comments or unrelated desired settings changed | Valid identity is recognized; unrelated text is preserved. |
| Wrong, invalid, or missing project ID | Explain the identity state; never select another project's record by name. |
| Same name with different project IDs | No cross-project binding. |
| Old path still exists or was recreated | Do not take its record; offer only safe alternatives. |
| Several absent records or several live records | Require a proven explicit choice; never select the first row. |
| Target path already claimed | Block without changing either claim. |
| Pending install or active writer | Give the exact safe next step; no move. |
| Dead lock | Follow existing recovery policy; never silently discard live work. |
| Cancel, dry-run, status, missing approval, or bare non-interactive `--yes` | No durable Store or project change. Short-lived read locks do not create move state. |
| Source, target, ownership, or config changes after review | Reject the stale plan before apply. |
| Source checkout switched after stateless preview | Reject the review for the other source; no implicit reselection. |
| Move-only apply enters setup bootstrap or generic file mutation | Fail the test; config, ledger contents, and project files remain unchanged. |
| Old evidence lacks independent ownership proof or uses an unsupported schema | Block with a precise reason; no checksum reset or implicit schema migration. |
| MCP caller lacks the selected root scope | Deny apply even when Store access is allowed. |
| Atomic path update and receipt interrupted or retried | Both commit together; retry does not duplicate the receipt or change another record. |
| Crash before atomic commit | Old path remains bound; retry is safe. |
| Crash after commit, before reply | Retry recognizes the completed move; no second identity or history loss. |
| Case-only path, case collision, safe and unsafe symlink paths | Existing platform rules hold; no permanent inode/device requirement. |
| Root and nested project move | Each ID needs its own target and review; no recursive adoption. |
| Successful move followed by cancelled or failed setup edits | Move result remains clear; later changes keep their own state. |
| Read-only Store caller or insufficient project permission | Core admission blocks apply; read-only preview remains accurate where allowed. |
| Direct CLI and MCP preview/apply paths | Same checks and results as setup. |
| Second run | No move, identity churn, or duplicate history. |

## Test Placement and Sequence

Add a focused `packages/cli/tests/w22-r1-checkout-move.test.ts` suite. Extend existing suites only where the boundary belongs. Relevant coverage includes `installation-state.test.ts`, `managed-block.test.ts`, `cli.test.ts`, `wizard.test.ts`, `mcp.test.ts`, `w22-r0-p3-platform-safety.test.ts`, `w22-r0-p7-authentic-upgrade.test.ts`, `w22-r0-p7-legacy-identity.test.ts`, and `w22-r0-p8-router-reinstall.test.ts`.

Write the failing regression first. Run focused suites after the core and prompt changes. Then run the required repo checks. Current commands to recheck before execution are:

```bash
npm test
npm run validate:defaults
npm run build
npm run smoke:pack:local
```

Use `npm run smoke:pack` for the required final release proof. It runs the local and online package-runner cases against one tarball. `smoke:pack:local` is bounded local evidence only. Separate local and runner runs on different tarballs do not establish one-artifact release proof. Use the platform safety workflow for the required real-host matrix. Reuse `scripts/tests/w22-p6-package-proof.test.mjs` and `scripts/smoke-pack.mjs` where suitable. Add the moved-checkout package case without replacing the existing package checks. Record the exact package hash, runtime, OS, command, and result.

## Four Testing Decisions

Use the exact types and common decision fields in [PRD 50](../../prd/50-proportionate-testing-and-human-centered-validation.md). These decisions are ready to carry into the scoped backlog. They authorize no test execution during this planning task.

| Field | Automated Implementation Testing | Performance Testing | Guided Progress Review | Unassisted Goal Testing |
| --- | --- | --- | --- | --- |
| Decision informed | Correctness of the move and release candidate | No current performance decision | Whether the owner has useful feedback on the flow | No current unassisted-use claim |
| Reason now | The current rename and ownership failures need regression proof | `not-needed-now`; no speed or scale claim changes | Offer after the first meaningful installed flow | `not-needed-now`; current failure is explained and covered by automated and agent review evidence |
| Product maturity | Released CLI; patch repair | Released CLI; patch repair | Working installed increment | Released CLI; no new unassisted support claim |
| Scope | This matrix, nearest integration boundaries, existing required package and host proof | No benchmark | One disposable moved-project goal in one to five steps | No run selected |
| Executor | Maintainer or agent using isolated homes and Stores | None | Willing owner or maintainer; may decline | None; any later run needs a qualified human under PRD 46 |
| Gate effect | `blocking-claim-only` for the exact correctness and release claims | `not-applicable` | `advisory` | `not-applicable` |
| Effort budget | One affected-first set, one full set, one final artifact matrix per candidate; at most two repair-and-rerun cycles for a failure | Zero runs | One offer and at most 15 minutes if accepted | Zero runs |
| Stop condition | Required failure, unsafe environment, missing seed/host, or exhausted budget; report the exact blocker | Stop before any benchmark | Experienced, feedback recorded, declined, or environment blocked | Stop before recruiting or preparing a scenario |
| Evidence retained | Commands, artifact/source identity, logical before/after facts, result, and material failure | Decision only | Goal, short path, result or decline, feedback, and next action | Decision only |
| Rerun trigger | Relevant code/artifact/environment change or a failed covered case | A new accepted performance claim or relevant cost risk | Material UI change or new owner feedback | A material discoverability uncertainty that existing evidence cannot answer, or explicit product/release authority |

A Guided Progress Review is never a release gate. A declined offer creates no failure or deferred obligation. Unassisted Goal Testing remains separate from a coached walkthrough. Revisit its selection only on the stated trigger; if activated, record the qualified human, allowed public context, scenario, finite budget, evidence, and explicit gate effect before it runs.


## Human Experience Review

Review the actual installed flow. The reader must see the project, old path, new path, effect, and next choice without knowing the Store schema. Check successful, cancelled, ambiguous, unsafe, and partially completed setup cases. Compare JSON and human output for the same facts.

The agent records this review against the accepted promises in the overview. It is required release evidence under PRD 10. It is a review lens, not a fifth testing type or a demand for human acceptance. Offer the separate advisory Guided Progress Review after the meaningful installed increment. No benchmark or human acceptance gate is selected here.

## Installed and Platform Boundaries

Use the exact final tarball on real Windows, macOS, and Linux hosts with the source repository unavailable. Use Node.js 24, the current supported runtime floor, and record the exact runtime and package-manager versions. Simulated path tests do not replace native host proof. Keep the existing PRD 10 fixed legacy/setup/Store matrix, persistent package-manager link proof, no-scripts checks, and installed CLI/MCP parity; add the rename cases rather than replacing the old cases.

Extend `scripts/w22-p6-package-proof.mjs` and `.github/workflows/platform-safety.yml` to run the new case against the downloaded common candidate. The current workflow does not acquire the new test merely because a source test was added. Record one candidate digest across all three host results. A missing host, unavailable authentic seed, denied test capability, or unrun required case is a blocker to that release claim. Only an explicit, time-bounded owner exception under PRD 10 can change a required parity gate. Do not invent an exception or turn an old unrelated waiver into one.


## Exit Evidence

Keep a concise result table in the later work record. Distinguish automated tests, installed-package proof, guided review, unrun platform checks, and remaining limits. No passed test is claimed by this plan. Failure in a required case blocks the affected release claim.

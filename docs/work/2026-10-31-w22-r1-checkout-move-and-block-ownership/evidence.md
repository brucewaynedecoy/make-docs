# W22 R1 Documentation Review Evidence

## Scope and Current State

This report records the actual plan review and backlog documentation work on 2026-10-31. It does not report product execution. The user authorized review and, if the plan was sound, creation of the scoped backlog. The two focused reviewers found material gaps and corrected the plan before backlog authoring.

A1–A3 are now satisfied as documentation acceptance only after the separately authorized PRD reconciliation and review below. Implementation acceptance cases A4–A32 remain not run. No code, test suite, version bump, Store mutation, package build, release, or live project repair was performed for this report.

## Actual Plan Review Findings

| Finding | Review result | Plan disposition | Backlog route |
| --- | --- | --- | --- |
| Old whole-file evidence could still reject unchanged blocks | Confirmed contract gap | [P1](../../plans/2026-10-31-w22-r1-checkout-move-and-block-ownership/01-authority-and-ownership.md) now specifies evidence v2, retained v1 reader, independent block proof, and refusal of missing proof | P1 Stages 1–3 |
| Generic installation wrapper exceeds move-only scope | Confirmed scope gap | [P2](../../plans/2026-10-31-w22-r1-checkout-move-and-block-ownership/02-setup-path-move-flow.md) now requires Store-only atomic path/evidence/receipt apply with no config/bootstrap/ledger replacement | P2 Stage 2 |
| Operation naming and review selection were incomplete | Confirmed operation gap | P2 uses three-part IDs and stateless source/target-bound review facts; caller root limits remain enforced | P2 Stages 1–2 |
| Separate-checkout choice could invoke automatic absent-source move | Confirmed identity gap | P2 requires explicit distinct checkout creation under a separate admitted action | P2 Stage 3 |
| A synthetic current-source seed would not prove released upgrade behavior | Confirmed proof gap | [P3](../../plans/2026-10-31-w22-r1-checkout-move-and-block-ownership/03-tests-and-package-proof.md) requires authentic published 2.0.5 identity/integrity/SHA-256; missing seed blocks proof | P3 Stage 2 |
| Development proof before version bump was not final release proof | Confirmed release gap | [P4](../../plans/2026-10-31-w22-r1-checkout-move-and-block-ownership/04-release-206.md) repeats final installed matrix after bump with one artifact digest and source unavailable | P4 Stage 2 |
| Guided review was described as a required release gate | Confirmed testing-rule gap | P3 keeps Guided Progress Review advisory and required agent Human Experience Review separate; UGT has a not-needed-now reason and trigger | Index and all phase decisions |
| Required package/host checks and publication artifact match were too loose | Confirmed release gap | P3/P4 retain full smoke, existing PRD 10 legacy/link/no-scripts matrix, real hosts, security review, and staged/public artifact checks | P3 Stage 3; P4 Stages 1–3 |

Reviewer scope: the ownership reviewer covered plan P1/P2; the release reviewer covered P3/P4. The parent coordinator supplied their completed review handoffs before this backlog was written. Plan overview assembly aligns those changes and the current documentation-only authorization.

## Documentation Checks

The new backlog has an index, four phase files, and this nonempty evidence report. The final Store-free static check covered all 11 new documents: five plan files and six backlog files. It checked 42 unchecked tasks, contiguous phase-local task IDs, 32 unique acceptance IDs A1 through A32, draft state, required phase/stage headings, all four exact testing labels, unresolved fields, final newlines, and trailing whitespace. All 112 relative file links and 14 heading anchors resolve. No static defect remained.

The semantic review also corrected A18 so unchanged-state proof uses durable row, ledger, history, and file facts rather than a raw database checksum alone. It narrowed the old-reader case to a further relocation attempted with released 2.0.5. It does not claim that an immutable old binary refuses ordinary operations at an already-bound path. Future fixture guidance uses MAKE_DOCS_HOME or explicit platform adapters and temporary plain copies, without changing HOME, home, or CODEX_HOME.

These checks validate documents only. They do not pass any implementation acceptance case. No product test, package build, runtime repair, or live Store operation ran.

## Implementation and Release Results

The authority-first documentation stage is complete. Phase 1 focused red cases and the ownership code change are complete in the checkout. Phase 2 to Phase 4, full product proof, version bump, final artifact matrix, release actions, and owner Store repairs are not run. D-049 remains open.

## Review Limits and Next Action

The named PRDs were updated under separate user authorization and passed gap review. The owner then authorized the remaining Phase 1 code and regression tests with a temporary Store. The code and focused tests are complete but uncommitted. Phase 2 and later work remain open. No benchmark, unassisted test, or human acceptance gate is selected.

## PRD Reconciliation and Gap Review

On 2026-10-31 the user separately authorized existing-owner PRD changes and gap review. This expands documentation scope only. Source code, product tests, versions, Store access, and release actions remain unapproved. P1 t1–t4 are now complete after the independent review and final Store-free authority pass recorded below.

| Owning document | Changed current sections | Review state |
| --- | --- | --- |
| PRD 10 | Installed Legacy-Project Candidate Proof; Core Platform Candidate Proof; Candidate Artifact and Publication Identity; W22 R1 history/source links | Author and independent gap review complete |
| PRDs 15, 18, 24, 38 | Block ownership, compatibility, declarative identity, checkout/evidence owners | Owning writer and independent review complete |
| PRDs 07, 25, 39 | Setup flow and shared operation/access/registry owners | Dedicated writer/reviewer handoff pending |
| PRD index and D-049 | Owner navigation and implementation-open state | Assembly current; post-review authority validation passed |

The parent ran the baseline Store-free authority validator before these edits: passed, 35 PRDs, 635 Markdown sources, 1206 links, zero diagnostics. Access was Store none, project read, host config none. This is baseline only. It cannot complete t4 or prove the final PRD set. No product acceptance case passed from that check.

### Independent Cross-Document Gap Findings

The independent review found five narrow conflicts after the first authoring pass. A syntactic authority pass did not reveal these semantic gaps. The owning writers corrected them, and both independent reviewers confirmed the fixes before the post-review authority pass.

| Owning PRD | Finding | Required correction | Final review state |
| --- | --- | --- | --- |
| PRD 07 | Broad no-Store-state wording would reject permitted transient read leases. | Require no durable preview/review changes; allow the existing short-lived access lease and require its release. | Corrected; independent reviewer confirmed; post-review authority pass clean |
| PRD 39 | Existing setup ordering and pending-work language did not explicitly include moved-source preflight. | Discover and check the selected source before editable setup choices and mutation admission. | Corrected; independent reviewer confirmed; post-review authority pass clean |
| PRD 10 | A literal v2.0.6 tag rule could become a permanent rule for later releases. | Match the tag to the reviewed CLI package version; identify 2.0.6 as this candidate only. | Corrected; independent reviewer confirmed; post-review authority pass clean |
| PRD 38 | Ambiguity language could prohibit a valid explicit source selection. | Stop automatic selection while ambiguity is unresolved; permit an explicit choice only with full independent proof. | Corrected; independent reviewer confirmed; post-review authority pass clean |
| PRD 18 | An old aggregate or fully owned-file path could accidentally reclaim project-owned config bytes. | Exclude project-owned config from durable owned-file proof even when old ledger/aggregate bytes include it; preserve PRD 24's identity/settings scope. | Corrected; independent reviewer confirmed; post-review authority pass clean |

The parent then ran a post-authoring Store-free CLI authority check: exit 0, 35 PRDs, 635 Markdown sources, 1206 links, zero diagnostics. The cross-doc corrections above were still in progress, so that result is not the final post-review pass and does not yet complete t4. No product test or Store repair ran.


## Final PRD Documentation Stage Result

The parent confirmed that both independent reviewers completed their disjoint cross-doc checks and stopped after the five corrections above and the release-gap note. The ownership review checked 23 new links and found no duplicate requirement IDs. The flow/release review checked 27 new links and eight anchors. The missing release-gap note was corrected without a new product PRD or a broader rewrite.

The post-review CLI command was make-docs run prd authority validate --target-root <make-docs> --json. It returned exit 0 and status passed: 35 PRDs, 635 Markdown sources, 1206 links, zero diagnostics. The check is Store-free. git diff whitespace checks were clean. The parent also checked that packages, scripts, workflows, and version files had no diff from this documentation work.

P1 t1–t4 are complete. A1–A3 are satisfied as documentation acceptance only: current owning requirements are inline, their distinct safety boundaries are preserved, and independent semantic plus authority checks passed. The code gate remains closed. Four of 42 tasks are complete; 38 tasks remain unchecked. A4–A32 remain not run. No authentic Store fixture, source test, package build, installed candidate, host matrix, version bump, release, or live repair was run. D-049 stays Open. Phase 1 is partially complete; the repair capability is unimplemented.

The parent completed the final standalone CLI authority and scope checks after status assembly. The CLI returned exit code 0 and status passed: 35 PRD files, 635 Markdown sources, 1206 links, zero diagnostics. At that prior documentation stage, the scope contained only documentation on fix/2.0.6-checkout-move-ownership. No packages, scripts, .github, or package version/lock files had a diff. git diff --check passed. These results closed the documentation check only. They did not authorize product execution or a Store operation.

## Phase 1 Implementation Evidence

Phase 1 used disposable project directories and explicit temporary Store roots. No test used the live Store. The focused bridge test failed against the original source with `The moved checkout content does not match its last verified Store facts`. The same test passed after the ownership fix. The saved version 1 whole-file digest changed after user text outside a valid block changed. The saved block hash did not change.

The new ownership tests cover both root managed blocks, changed and invalid blocks, changed fully owned files, invalid config identity, version 1 to version 2 proof, missing proof, ledger digest mismatch, and unknown evidence versions. The existing Store safety test now confirms that a historical operation path does not grant current ownership. A released 2.0.5 executable, pointed at a temporary Store, refused a further relocation after version 2 evidence was saved. The test compared checkout, ledger, operation, and step rows before and after. It does not claim old-binary safety for an already-bound path or downgrade support.

The focused run passed 54 tests across the new ownership suite, Store safety suite, and authentic older-install suite. Seven selected installer cases passed for fresh setup, managed blocks, project and global skill links, and copy mirrors. TypeScript no-emit and `git diff --check` passed. The full installer suite was started but stopped after it ran for more than two minutes without a result. Its full result is unknown. No package build or installed 2.0.6 proof was run.

Phase 2 must call the same ownership verifier for both preview and apply. The verifier reads the saved ledger and ownership class. It hashes only a valid managed-block body. It checks a fully owned file against its saved hash. It checks a skill link or copy against its saved exposure facts. It excludes project-owned config text and historical operation paths from permanent move proof. The version 1 reader remains. New verification writes use version 2. A selected version 1 row moves to version 2 only after ledger and current ownership proof pass. Exact pending recovery snapshots still have their prior role.

Human Experience Review: The agent reviewed the test output and the changed move error path for the maintainer. The observed result lets the maintainer tell a valid outside edit from a changed managed block. A failed check names the affected path and leaves the saved checkout binding in place. The old binary reports that the moved path lacks verified installation evidence. This is an indirect maintainer outcome. The review does not prove how an operator will experience the future Phase 2 public preview and apply flow. The next action is Phase 2 integration and Phase 3 installed-package proof. No human response is required for this Phase 1 review.

## Phase 2 Implementation Evidence

The user authorized P2. The local code uses config project identity before setup reads a path-bound manifest or decides that the target is fresh. Setup shows saved source paths and asks for Move, Register separate, or Cancel. A non-interactive setup with `--yes` or `--dry-run` stops at that choice. The move preview and apply use the shared operation registry. Direct CLI and MCP use the same handlers. Separate registration has its own Store-write/project-write action and creates a new checkout ID.

The move preview binds its digest to the selected checkout, source and target canonical paths and keys, saved ledger and verification digests, and target ownership facts. It does not save a review row. Apply checks the same facts under one SQLite write transaction. The path, version 2 evidence, and receipt commit together. A failed receipt insert rolls back the path update. An exact retry returns the saved completion without another receipt. The ledger, earlier operations, and steps stay unchanged. Ordinary checkout binding no longer moves an absent source path.

The focused P2 registry, MCP, profile, and ownership run passed 74 tests in five files, with one optional released-binary case skipped. A later focused ownership run passed 26 tests, with the same optional case skipped. The Store safety file passed 33 tests. Four nearby CLI and setup files passed 194 tests after a skipped-file ownership issue was fixed. These runs covered move preview and apply, setup `--yes` and dry run no-change, CLI parity, MCP write gating, missing and invalid IDs, source recreation, a target claim, pending work, live and dead locks, stale review, transaction rollback, exact retry, separate registration, and independent root and nested-kit IDs. TypeScript no-emit passed. Every test project and Store was temporary. No live Store, release, version, or package artifact changed.

The tests were added during implementation. No separate pre-fix red run was retained. The installed-package path, interactive Cancel prompt, and real MCP connection policy still need the P3 proof pass. The first broad CLI run found that a reviewed Skip on a changed owned file stopped Store completion. The completion path now saves only proved ownership facts. Move preview still requires full proof. The affected CLI case passed on rerun, followed by the 194-test nearby suite. The Store safety file first had five child-process failures when the test runner started from the repository root. Those child processes looked for `tsx` two directories above the repository. The file passed all 33 tests when run from `packages/cli`, which is its expected working directory.

Human Experience Review: The agent checked the captured JSON results and the CLI text renderer against the focused temporary-Store results. The blocked setup result names the target, source checkout, and next action before any fresh choices. The CLI preview gives a review digest and blockers. A completed move reports its checkout ID before later setup work. The separate registration result reports its new ID. These observations support the local review flow. They do not prove the installed package or a real operator session. P3 is the next action. No human approval gate was added.

## Phase 3 Tests and Package Evidence

The published `@brucewaynedecoy/make-docs@2.0.5` tarball came from `https://registry.npmjs.org/@brucewaynedecoy/make-docs/-/make-docs-2.0.5.tgz`. Its registry SHA-512 integrity is `sha512-6R85IftsAMGtsICPMOc8fmvnCNWRyhr+gnimzD24G2Pu6Reqt3CWcfnuwMQzhEiX7/4FWjzrq0aOngDRfMdIQA==`. Its local SHA-256 is `76b6ee0af960da03f894bd4e0b2c4ca3804dac4e0a490cee6935c844771bb4cd`. The proof script checks both values before use. The seed and every Store used by the proof were temporary. A seed copy was kept at `/private/tmp/w22-r1-seed-snapshot` for this local review.

The released package installed the `buildos` root and `kits/make-blueprint` as two projects with separate IDs. The proof copied the seed files and Store, added text before and after both root instruction blocks, and renamed the parent to `make-kit`. The 2.0.6 candidate stopped normal setup for a move choice without a durable Store change. Root approval kept the kit record fixed. Separate kit approval moved only that kit record. Both moves kept the selected checkout IDs, ledger rows, operation rows, step rows, and outside-block bytes. The proof found two move receipts. A repeat setup made no new move. The 2.0.5 reader refused a later unreviewed relocation without changing durable Store state.

The installed text preview showed the source path, checkout ID, and review digest. A repeated apply showed the saved checkout ID, source path, unchanged project files, and next step. An installed preview of a broken managed block showed `Available: no` and a blocker without a durable Store change. Focused source tests covered other blocked candidates, stale reviews, writer locks, target claims, and rollback. An actual interactive Cancel session, an ambiguous choice, and a later setup failure were not replayed through the installed package. This is a limit on the agent's installed review evidence. No participant joined the optional Guided Progress Review; it is not a release gate.

The user later reported that a manual 2.0.6 test appeared successful on the renamed live `buildos` to `make-kit` root and its `kits/make-blueprint` project. The user did not provide the final command output or Store rows. This is a reported manual result, not an agent-verified Store comparison. It does not close the missing Windows and Linux host checks.

After `npm ci` restored the locked test tools, the final full `npm test` run passed 111 files and skipped one file. It passed 1,996 tests and skipped six. `npm run validate:defaults`, TypeScript no-emit, and CLI prepack/build passed. The earlier full run had the same 1,996 pass and six skip result. The first run on stale local dependencies failed; those dependencies were replaced with the lockfile before the final runs. The proof script and package workflow now carry the published 2.0.5 upgrade case. The real Windows and Linux host jobs need a check commit.

## Phase 4 Candidate and Release Limits

The private root package remains `0.0.0`. The CLI package and lockfile workspace entry now say `2.0.6`. No dependency version changed. The local base commit was `7d6924722a5995c44cfb98dbf883d835431f7e14`. The tested package came from the uncommitted working tree, so that commit alone is not its source identity. Two packs of the final build made the same 3,014,431-byte tarball. Its SHA-256 is `9e1520c49167eb731e4bac506d8ee2cdb968382815888ddd5eb1b270058a5674`. The package has 141 entries, including the MIT license, README, CLI binary, and templates. The reviewed digest is in `.github/release-candidates/v2.0.6.sha256`.

On macOS, Node.js `v24.19.0` and npm `11.17.0`, that exact tarball passed the published 2.0.5 root-and-kit upgrade proof, full `npm run smoke:pack` with local, npx, pnpm dlx, and Bun x paths, and the P6 installed Mac verifier. The Mac verifier used the same digest. The workflow now checks the package digest before it uploads a check candidate or stages a release package. Workflow YAML parsed locally. CI has not run on real Windows or Linux hosts. The GitHub alert list could not be read with the available connector or local `gh` login. The local audit found zero critical or high alerts, one moderate runtime alert, and one low development alert; the separate draft security review records the exposure assessment. The agent made no live Store change. The user later reported the manual live test. No tag, release, package stage, or public package occurred.

Human Experience Review: The agent compared the installed JSON and text results with the promised move flow. The output names the selected source and target, the ID, the review digest, the effect, and the next step. The root and kit paths need separate choices. The result supports the Mac installed flow. The user reported a successful manual session, but the agent did not inspect its transcript or Store rows. Windows and Linux results remain open. The next action is a scoped check commit and real-host checks. Release approval remains separate.

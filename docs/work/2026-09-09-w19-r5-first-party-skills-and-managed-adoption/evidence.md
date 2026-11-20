---
title: "W19 R5 Acceptance Evidence"
kind: "work"
status: "completed"
coordinate: "W19 R5 P1"
source:
  type: "prd"
  path: "docs/prd/08-skills-catalog-and-distribution.md"
---

# W19 R5 Acceptance Evidence

## Current Result

The standard-location correction is implemented and installed. The public CLI removed the real `.make-docs/agentics/` tree. This project selects Codex and Claude Code: its three Skills are real directories under `.agents/skills/`, with Claude links to them. Claude-only projects use `.claude/skills/` directly and create no `.agents/skills/` root. Global installs use `~/.agents/skills/` and only the selected tools' native links or copies.

All 1235 tests passed across 80 files. Final package SHA-256: `33ac19ff4b05caa0253b8f572b975c335c64239dd2e054a0cf47b40afc0fe462`. All 130 archive files and the complete installed dist/template trees match. The CLI recipe, real reviewed cutover, router refresh and unchanged repeat completed. D-005 is resolved by this delivery proof. The owner accepted the completed phase and requested closeout and commit on 2026-09-09. Phase closeout is complete; the implementation commit is authorized and next. W20/W21 remain paused.

The earlier private layout was our error. The real preview also exposed a missed both-harness legacy case: normal conflict checks rejected exact recorded old Claude links. A narrow reviewed exception and explicit remove/create recovery steps fixed it. The final regression uses the actual old metadata and preserves all protection for changed links, other owners and later user edits.

## Final Evidence

- [Full suite](evidence/final/full-tests.log.txt): 1235/1235 tests, 80/80 files, exit zero.
- [Final package parity](evidence/final/installed-parity.json.txt) and [complete readback](evidence/final/readback.json.txt).
- [Reviewed move](evidence/final/cutover-review.json.txt), [human summary](evidence/final/cutover-summary.txt), and [completed operation](evidence/final/cutover-apply.json.txt).
- [Unchanged repeat](evidence/final/repeat-apply.json.txt), [repeat summary](evidence/final/repeat-summary.txt), and [ready Store](evidence/final/state.json.txt).
- [Public follow-up findings](evidence/final/summary-review-report.txt) and [unchanged review inputs](evidence/final/summary-review-verification.json.txt).
- [Prior standard-layout evidence](evidence/superseded-standard-layout-report.txt) retains candidate-specific isolated, offline, review and recovery proof. Its pending statements are historical and are replaced by this report.

## Acceptance Results

A1–A14 are supported by the evidence below. Candidate-specific checks retain their actual identity. No unrun final-package matrix or live human test is claimed.

### A1 Source and Standalone Intent

Seven Skills have sole authoring homes in packages/skills. Standalone references and explicit-only intent passed source checks and the installed public review.

### A2 Payload Membership and Bytes

The final archive and installed CLI match across all 130 package files and complete dist/template trees. The build embeds the 39 declared Skill files; it creates no duplicate Skill trees.

### A3 Offline Selection

The strict 21-case offline matrix passed on 68d08ff1 with network and source-checkout access denied. Later changes concern review display and exact old-link migration, not Skill bytes or embedded resolution. Those changes received focused tests and the final full suite; the unchanged matrix was not repeated.

### A4 Scope and Harness Exposure

Project Claude-only uses .claude/skills; Codex-only uses .agents/skills; both use .agents files and Claude links/copies. Global files use ~/.agents/skills with selected native access. The isolated matrix and final path tests cover selected-only roots and configured homes.

### A5 Reviewed Adoption

The installed CLI reviewed and applied the real three-Skill cutover with 12 content backups. The exact digest was supplied to apply. See the final review, summary and apply captures.

### A6 Command Edges

Argument, interactive, stale-review and no-generic-yes guards pass. Human summaries preserve JSON stdout and report counts, scope, tools and actual roots. Final display tests passed 18 cases.

### A7 Unsafe or Ambiguous Input

Unknown files, wrong links, conflicting copies, other ownership and late edits remain blockers. The authentic old-Claude fixture also proves changed targets, unselected Skills and changed providers still stop the move.

### A8 Stale Review

The saved review binds file/link inventories, ownership, package/source and selections under the installation lock. Stale-input tests pass in the final full suite.

### A9 Ownership-Only and Repeat

Ownership-only adoption is tested. The real normal setup, Skills sync and exact repeat report unchanged with 15 retained ownership entries and no file or ownership changes.

### A10 Store and Recovery

Store failure, pending operations and recovery pass. The exact old-Claude link test covers interruption after removal, later user edits, forward-only rollback refusal and successful resume. Standard adoption retains rollback. Earlier extracted/installed public recovery and help checks passed 11 cases.

### A11 Upgrade, Update, and Removal

Isolated tests cover old source upgrades, managed updates/removals and protected edits. The real old-to-standard move completed through the installed CLI. No real removal test or one-off cleanup script was used.

### A12 Complete Directory Proof

Package and isolated scans include actual directories and ignored paths. Final readback proves the active .make-docs/agentics tree, local state directory and local manifest are absent. Original 11 files and old 12 payload files remain preserved.

### A13 Independent and Fresh-Context Review

Independent code review passed the final migration exception and journal steps. The public review checked all seven installed Skills. Its ownership-summary finding was fixed and a second public review confirmed counts and unchanged claims. Its two path-disclosure refinements were then fixed and checked by focused tests plus final installed output. No extra external review was run after the owner directed us to finish. Full review inputs stayed unchanged. These were agent reviews with supplied-context limits, not human UAT or live harness workflows.

### A14 Real Maintainer Adoption

Final installed public cutover completed as operation d2a08984-a479-4532-9560-ef3c4b2d84f5. Readback proves 12 real .agents files, three Claude links, 15 Store ownership entries, preserved originals/backups, updated upstream routers, ready Store and unchanged repeat.

## Experience Promises

| Promise | Observation and conclusion | Limit |
| --- | --- | --- |
| P1 | Skills appear in the selected tools' standard directories. Satisfied by isolated path checks and real final readback. | No live Claude/Codex Skill workflow test. |
| P2 | Review states file effects, backups, ownership, scope, tools and paths. Satisfied by corrected public output and focused tests. | The last two text refinements were checked locally, without another external review. |
| P3 | Content is preserved and interrupted moves can resume safely. Satisfied by fault tests and final backup/readback proof. | Real interruption/removal tests stayed isolated. |
| P4 | Each Skill carries its own required files; the three promoted guidance Skills require explicit invocation. Satisfied by installed text and metadata review. | Agent intent review is not a live harness or human usability claim. |

## Acceptance and Follow-Up

The owner accepted the final implementation and documentation on 2026-09-09 and explicitly requested closeout and commit. W19 R5 P1 is closed. The implementation commit is authorized and remains the next action. Publication and W20/W21 resumption remain outside this authorization.

The [phase history](../../../.make-docs/archive/history/2026-09-09-w19-r5-p1-skills-and-managed-adoption.md) records this acceptance. Review limits above remain unchanged; owner acceptance does not turn agent review into a live harness or human usability test.

## P2 Adoption With Existing Native Links

Covers A15 to A19 in [P2](02-adoption-with-existing-native-links.md). Evidence date: 2026-11-18. Branch: `fix/d053-skill-symlink-adoption`, based on `origin/main` `ad84ffb8`. Node `v26.13.1`. CLI package version `2.0.8`.

- **Cause.** `buildSkillAdoptionReview` (`packages/cli/src/skills-adoption.ts`) declared a copy fallback for every native link exposure. The detached-plan check in `packages/cli/src/store/installation-state.ts` and the executor's `selectDetachedCopyFallback` accept a fallback only for a link that the plan creates from a missing path. An unchanged existing link has no planned change, so the check rejected it. The fix declares a fallback only when the exposure path is currently missing.
- **Regression test.** `packages/cli/tests/w19-r5-skill-adoption-existing-links.test.ts` runs in an isolated `HOME` and Store.
  - Before the fix, its existing-link cases failed, and the outdated-copy case threw `Invalid predeclared native copy fallback.`
  - After the fix, all 3 cases pass. That covers A15 (adopt and repeat `unchanged` with the link kept), A16 (outdated copy backed up and refreshed through the kept link), and A17 (a new link keeps its copy fallback).
- **Focused tests.** 14 Skill, adoption, install, and Store files pass 243 of 243.
- **Full suite.** `npm test` ran 114 test files: 111 passed, 2 failed, and 1 was skipped. Of 2,013 tests, 2,004 passed, 3 failed, and 6 were skipped. The 3 failures are the known environment cases: two Node 26 `DEP0205` stdio tests, which fail the same way on unchanged `main`, and one fixture that fails only inside the agent sandbox.
- **Packaging.** `npm run validate:defaults -w packages/cli` passes 53 of 53, after `node scripts/copy-template-to-cli.mjs` refreshed the git-ignored bundled template that an earlier branch had left behind. The build passes. `npm run smoke:pack:local` passes, and this machine's Store file did not change.
- **Real adoption in a throwaway project.** A copy of this repository's `.agents/skills/` and `.claude/skills/` links, with a temporary `HOME` and Store, was adopted with the built CLI.
  - The dry run reported `ready`, and the apply with its review digest exited 0.
  - `.claude/skills/preflight` and `.claude/skills/backlog-review` stayed links to `../../.agents/skills/<name>`.
  - The installed `preflight` and `backlog-review` trees match `packages/skills/`, and a repeat review reports `unchanged`.
- **Dry run in this checkout.** The built CLI's `setup skills --selected-skills backlog-review,factory,human-experience,preflight --adopt-existing <same> --dry-run` reported `ready`, with no blockers: 11 path changes, 2 backups, and 32 ownership entries to register. Against this base's Skill source, it changes only three installed `backlog-review` files. `git status` and the Store file were unchanged.
- **Deterministic and agentic twins.** Skill adoption planning is CLI-only. No agent instruction describes copy fallbacks, so no agentic counterpart changes. PRD 28 already states the required behavior.

### P2 Follow-Up: Copy Fallback For Replaced Native Folders (A18)

Evidence date: 2026-11-19.

- **Finding.** CodeRabbit (Major, PR #65) found that the first P2 guard dropped the copy fallback when adoption replaces an outdated native folder with a link. That plan removes the folder, then creates the link from a missing path.
- **Fix.** `buildSkillAdoptionReview` now declares fallbacks for every link exposure, then prunes them to planned steps whose `before` is `missing` and whose `after` is `symlink`. That is the validator's own rule.
- **Tests.** `w19-r5-skill-adoption-existing-links.test.ts` now has 5 cases, all passing. The new refused-link case fails against the earlier P2 code (`9fb05c4d`) and passes with the fix. It reports `completed`, a copy-mirror folder whose bytes match the canonical copy, a ledger mode of `copy-mirror`, and a backup of the outdated folder. The allowed-link case produces a link with mode `symlink`.
- **Checks.** Focused Skill and adoption tests pass 245 of 245. `npm test` passes 2,006 tests, with the 3 known environment failures. `validate:defaults` passes 53 of 53. The build passes. `smoke:pack:local` passes, with this machine's Store file unchanged.
- **Real adoption.** A built-CLI adoption in a throwaway copy of this repository's linked Skills applied, kept the `.claude/skills` links, and repeated as `unchanged`.

### P2 Follow-Up: Merge With W28 R0 And D-053 Closure (A19)

Evidence date: 2026-11-20. PR #64 merged W28 R0 into `main` as `d381dae5`.

- **Merge.** `origin/main` was merged into `fix/d053-skill-symlink-adoption` with no conflicts. Both PRs change `packages/cli/src/skills-adoption.ts` in different places: W28 R0 P8 validates the prepared adoption ledger (D-054), and P2 prunes copy fallbacks (D-053).
- **Adoption tests.** `w19-r5-skill-adoption-existing-links.test.ts`, `w28-r0-skill-adoption-version.test.ts`, and `w28-r0-setup-sync-safety.test.ts` pass together, 9 of 9.
- **Real adoption.** In a throwaway project with a temporary `HOME` and Store, `.agents/skills/preflight` and `.agents/skills/backlog-review` were copied from this repository, and `preflight/SKILL.md` was replaced with older bytes. `.claude/skills/<name>` were relative links to `../../.agents/skills/<name>`. The built CLI's `setup skills --adopt-existing preflight,backlog-review --dry-run` reported `ready`. The apply with its review digest reported `completed`. Both links kept their targets, both installed Skills match `packages/skills/`, the older `SKILL.md` was backed up, and a repeat review reported `unchanged`.
- **D-053.** Closed in [PRD 03](../../prd/03-open-questions-and-risk-register.md).
- **Checks.** `npm test` ran 119 test files: 117 passed, 1 failed, and 1 was skipped. Of 2,076 tests, 2,068 passed, 2 failed, and 6 were skipped. The 2 failures are the known Node 26 stdio cases in `mcp-app-contract.test.ts`. `validate:defaults` passes 53 of 53. The build passes.
- **Package candidate.** Two independent `npm pack -w packages/cli` runs produced the same tarball:
  - build 1: `f9f832fb93f904f36cb345aee17854a3be2967825f7ce440633036d51d6dad0c`
  - build 2: `f9f832fb93f904f36cb345aee17854a3be2967825f7ce440633036d51d6dad0c`
- `smoke:pack:local` passed with the same digest. 2.0.9 is not published, and `RELEASING.md` does not forbid replacing an unpublished candidate digest. The digest replaces the W28 R0 P11 value in `.github/release-candidates/v2.0.9.sha256` as the last content change.
- This Mac's Store and installed Skills were not changed.

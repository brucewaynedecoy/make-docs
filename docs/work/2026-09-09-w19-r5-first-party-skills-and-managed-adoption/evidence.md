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

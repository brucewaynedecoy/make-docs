---
title: "W18 R12 P4 Verification and Conformance Reconciliation"
kind: "history"
status: "completed"
date: "2026-07-03"
client: "Claude Code"
model: "Fable 5"
coordinate: "W18 R12 P4"
repo: "make-docs"
branch: "make-docs-v2"
summary: "Ran the round's full verification bar (PRD 40 R-TEST-1..2, PRD 41 R-TEST-3..6) as one pass at 908/908 with the coverage matrix pinned in run-cli-experience.test.ts and the ship unresolved-proposal abort leg added, reconciled PRD 37 and the W18 R9 backlog to the v2/probe/grammar/--json baseline per R-SEQ-1..2, closed register item R-026 unblocking W18 R9, and regenerated the untracked hand-run UAT walkthrough against the remediated surfaces with every changed step verified live against the built CLI."
---

# W18 R12 P4 Verification and Conformance Reconciliation

## Changes

Implemented [Phase 4 of the W18 R12 backlog](../../../work/2026-07-03-w18-r12-playbook-authoring-ergonomics-and-cli-experience-remediation/04-verification-and-conformance-reconciliation.md) per [PRD 40](../../../prd/40-revise-playbook-authoring-contract-v2.md) (R-TEST-1..2 sweep) and [PRD 41](../../../prd/41-revise-cli-human-experience-and-package-grammar.md) (R-TEST-3..6 sweep, R-SEQ-1..2), all six phase tasks checked off.

**Stage 1 — verification sweep.** The complete W18 R12 test bar ran as one pass: every R-TEST anchor across PRD 40 and PRD 41 is owned by a named suite, and an audit found one thin spot in the R-TEST-6 bar — the ship composite's "unresolved proposal" abort leg had no direct test (the existing aborts exercised plan *stops* and preview stops). A new test in `packages/cli/tests/run-cli-experience.test.ts` ships a multi-Playbook package with no authored summary, producing a review-gated proposal with zero stops, and proves ship aborts at the plan stage before any disk write with guidance naming `run package plan`. The same file gained the round's R-TEST coverage-matrix header (the W18 R7/R8 P5 precedent) mapping R-TEST-1 → `playbook-fixtures`/`playbook-parser`/`playbook-validator`, R-TEST-2 → `playbook-packaging-compiler` (probe-targeted checks, adversarial provenance), R-TEST-3 → `playbook-progression` (hint retirement), R-TEST-4 → this file plus `mcp-derivation` parity, R-TEST-5 → this file plus `playbook-packaging` (retired `--write`), and R-TEST-6 → this file's ship suite. A sweep confirmed no v1-contract fixture, old-grammar spelling, or `--write` usage survives anywhere in `tests/`, `scripts/`, or `packages/docs/template/` outside the retirement regression tests. Full CLI suite 908/908 across 55 files, build green, `npm run validate:defaults` 33/33 (consistency pins reflect `package.ship` and nothing else), `scripts/smoke-pack.mjs` exit 0, `python3 .make-docs/scripts/check_path_hygiene.py` clean (82 files, 0 errors), `git diff --check` clean.

**Stage 2 — PRD 37 / W18 R9 reconciliation (R-026).** A grep-verified sweep confirmed neither PRD 37 nor any W18 R9 phase file references the v1 dependency table, `Source`-derived checks, the `write --write` spelling, or unpinned CLI output consumption; the reconciliation therefore made the corrected baseline *explicit* rather than excising stale text. [The R9 index](../../../work/2026-07-01-w18-r9-playbook-and-package-conformance/00-index.md) gained a W18 R12 reconciliation usage note (v2 forms per PRD 40, probe-based checks, `plan`/`preview`/`write`/`ship` spellings, `--json`-pinned transcripts), PRD 40 and PRD 41 added to its still-constraining baselines, and its "consumes the W18 R6 Playbook model unchanged" sequencing corrected to the model as revised by the v2 contract. [R9 Phase 2](../../../work/2026-07-01-w18-r9-playbook-and-package-conformance/02-evidence-bar-and-first-pass-scenarios.md) had its overview rebased on the v2 model and remediated grammar, its dependency-check scenario task (t6) bound to probe-based checks with an adversarial-provenance fixture requirement (an entry whose `source` prose does not begin with the binary name), a new acceptance criterion pinning scenario transcripts to `--json`/non-TTY, and PRDs 40/41 added to its source docs. The [PRD 37](../../../prd/37-enhance-playbook-and-package-conformance.md) R-SCEN change note now records the completed reconciliation. In the [register](../../../prd/03-open-questions-and-risk-register.md), R-026 closed with a Resolution (D-015 and D-016 already carried their W18 R12 P2 closure evidence); W18 R9 is unblocked.

**Stage 3 — UAT walkthrough regeneration.** The hand-run UAT walkthrough (`UAT-W18-R7-R8.md`, repo root, deliberately untracked and never committed) was regenerated end-to-end against the remediated surfaces, preserving the narrative style, the no-prior-experience audience, the per-step "expect" discipline, and the honesty boundary (harness recognition remains W18 R9 evidence). Every changed step was verified live against the built CLI in a scratch project before being written — including a full Test 1 lifecycle, ship, the granular grammar, both Pi legs, both safety stops, and uninstall.

### UAT regeneration handoff — every step whose commands or expected output changed

| Step | Old edition | New edition (verified live) |
| --- | --- | --- |
| Header | Undated walkthrough | Edition line: regenerated 2026-07-03 against W18 R12; old workarounds now verification steps |
| Setup | `CLI="node .../index.js"` string shorthand | `CLI=(node .../index.js)` array with `"${CLI[@]}"` expansion (zsh-safe — old doc bug fixed); standing expectation added: the SQLite ExperimentalWarning must never print |
| 1.1 | `--repo-root .` on later commands | No `--repo-root` anywhere (defaults to the nearest manifest-carrying ancestor); flag noted as override |
| 1.2 | v1 playbook: `schemaVersion`/`workflowSchemaVersion`, `## Inputs And Authority`/`## Workflow Contract`/`## Gates And Decisions`/`## Outputs And Handoff`, Markdown dependency table | v2 playbook: `schema: make-docs.playbook.v2`/`workflowSchema`, simplified spine (`Inputs`/`Workflow`/`Gates`/`Outputs`), fenced YAML `dependencies` block with a `probe` example; playbook content in four-backtick outer fences (old doc bug fixed — v2 content carries triple-backtick inner fences); validate expectation now pins `"runnable": true`, 0 errors/0 warnings JSON |
| 1.3 | JSON dump; "output containing a run id" | TTY summary quoted: `Started run <id>: ...`, `Capabilities:` printed once at start, compact status line, exact `Next:` command as last line; run-id prefix and `--last` conveniences introduced; ambiguous-prefix failure named |
| 1.4 | JSON expectations per advance | Exact TTY lines per mode (`presented-instructions`, `recorded -> completed`, `presented-command`/`Run by hand:`, `executed-command -> completed`, `acknowledged -> completed`, `Recorded gate review: approve`); `--last` used mid-flow; NEW expectation: the waiting hint is retired once the step resolves (D-016 fix under test); `Full record ... --json` reference replaces the state echo |
| 1.5 | Loose success expectations | Export/import expectations pinned to their JSON results (no TTY renderer — the payload is the point); duplicate import names the `overwrite` opt-in; `Resumed run.`/`Run status.`/`Closed run <id> (terminal: completed).` TTY lines; NEW expectation: a closed run prints zero `Hint:` lines; closed-run advance refusal text pinned |
| 1.6 | "diagnostic names both digests and what changed at step level" | Verified exact behavior: names the source path, quotes stored and current digests, states whether step ids changed, points to fresh `start` or `--migrate` |
| 2.1 | Dependency table with the workaround note "Source must begin with the binary name" (the D-015 defect) | v2 dependencies block with NO `probe` and source `system install of git` — the adversarial shape on purpose; 2.3 verifies the generated check probes `git` (fix-verification step) |
| 2.2 | Six `--precondition` flags on every command (PRECONDS array); `jq '.plan'` surgery with a shape-uncertainty apology | `packaging.preconditions` block in `.make-docs/config.yaml` with the explicit-flags-override note; only the EVIDENCE array remains; no `jq` anywhere |
| 2.3 (new shape) | Two-phase plan-then-write with `--write` | Leads with `run package ship` as the one-command happy path; exact ship summary quoted (`Plan: ready ... Preview: ready ... Write: written`); marketplace expectation corrected to `registration/marketplace.json` inside the payload plus the `generate-only`/`withheldBecause`/`installAt` record (the old `.agents/plugins/marketplace.json` top-level file no longer exists); `checks/git.sh` run-by-hand now expects `ok: git is available`, exit 0, probing `git` |
| 2.4 | dry-run = `write` without `--write`; real write = `--write` | Granular walk on the skills bundle: `plan --output plan-skills.json` (artifact is exactly what `--plan-json` consumes), `preview` (`Writes executed: no`, nothing on disk), `write`; plus a guidance check that `--write` fails naming all four new spellings |
| 2.5 | Pi extension + fail-closed hook stop | Same substance, new output shape: `Distributable: native profile via extension \`pi-extension\``, `extension.json` in payload; hooked plan is `review-required` with the `unsupported-surface` stop and a `Next: resolve the stops...` line; ship-abort equivalence noted |
| 2.6 | "digest-mismatch stop naming the changed source" / "modified-generated-output stop" | Verified reasons pinned: `manual-review-required` with "changed since the plan was created (digest mismatch); re-plan before writing", and `ownership-review-required` with "differs and requires reviewed overwrite"; preview recommended as the stop-inspection surface; hand edit preserved byte-for-byte |
| 2.7 | `setup remove --backup` | Interactive confirmation noted (`--yes` for non-interactive); NEW verified expectation: the hand-edited generated `plugin.json` survives removal (ownership rule), while payloads and exposures are removed with directories pruned and user files untouched |

## Documentation

### Project

| Path | Description |
| --- | --- |
| [../../../prd/03-open-questions-and-risk-register.md](../../../prd/03-open-questions-and-risk-register.md) | Closed R-026 with a Resolution recording the verification sweep, the PRD 37/W18 R9 reconciliation, the UAT regeneration, and the reconciled-baseline follow-up for R9 execution. |
| [../../../prd/37-enhance-playbook-and-package-conformance.md](../../../prd/37-enhance-playbook-and-package-conformance.md) | Advanced the R-SCEN change note to record the completed W18 R12 P4 reconciliation and the closed R-026. |
| [../../../work/2026-07-01-w18-r9-playbook-and-package-conformance/00-index.md](../../../work/2026-07-01-w18-r9-playbook-and-package-conformance/00-index.md) | Added the W18 R12 reconciliation usage note (v2 forms, probe-based checks, new grammar, `--json`-pinned transcripts), PRD 40/41 as still-constraining baselines, and the v2-revised model in the ownership and sequencing notes. |
| [../../../work/2026-07-01-w18-r9-playbook-and-package-conformance/02-evidence-bar-and-first-pass-scenarios.md](../../../work/2026-07-01-w18-r9-playbook-and-package-conformance/02-evidence-bar-and-first-pass-scenarios.md) | Rebased the overview on the v2 model and remediated grammar, bound the dependency-check scenario (t6) to probe-based checks with an adversarial-provenance fixture, added the `--json`-pinned-transcript acceptance criterion, and added PRDs 40/41 to the source docs. |
| [../../../work/2026-07-03-w18-r12-playbook-authoring-ergonomics-and-cli-experience-remediation/04-verification-and-conformance-reconciliation.md](../../../work/2026-07-03-w18-r12-playbook-authoring-ergonomics-and-cli-experience-remediation/04-verification-and-conformance-reconciliation.md) | Checked off all six Phase 4 tasks. |

### Developer

| Path | Description |
| --- | --- |
| `packages/cli/tests/run-cli-experience.test.ts` | Added the W18 R12 R-TEST-1..6 coverage-matrix header and the ship unresolved-proposal abort test (R-TEST-6); suite now 908 tests across 55 files. |

### User

| Path | Description |
| --- | --- |
| `UAT-W18-R7-R8.md` (repo root, deliberately untracked — never committed) | Regenerated the hand-run UAT walkthrough end-to-end against the remediated surfaces; the step-by-step change map is in the handoff table above, and every changed expectation was verified live against the built CLI before being written. |

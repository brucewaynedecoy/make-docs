---
title: "W18 R7/R8 UAT Findings and Remediation Scoping"
kind: "history"
status: "completed"
date: "2026-07-03"
client: "Claude Code"
model: "Fable 5"
coordinate: "W18"
repo: "make-docs"
branch: "make-docs-v2"
summary: "Recorded the hand-run W18 R7 and W18 R8 user-acceptance findings — two functional defects, the authoring-contract ergonomics family, and the CLI-experience family — captured the deferred interactive-mode and TUI directions and the remediation-before-R9 sequencing decision in the risk register, and authored the W18 R12 remediation design."
---

# W18 R7/R8 UAT Findings and Remediation Scoping

## Changes

The user hand-ran the user-acceptance walkthroughs for the two just-completed waves against the built CLI: the W18 R7 run-state-machine UAT (Test 1) was executed fully — author, validate, start, all three execution modes, the gate, export/import handoff, resume, close, and both repository-cleanliness boundary checks — and the W18 R8 packaging UAT (Test 2) was executed through step 2.3 (setup, authoring, Codex plugin plan, dry-run and real write). The walkthrough script is `UAT-W18-R7-R8.md`, an uncommitted working file at the repository root (it is deliberately not committed and may be deleted or moved). This session captured the findings durably, scoped the remediation round, and authored its design; no fixes were implemented.

**Functional defects (register items D-015, D-016).** F1: generated `cli`/`package-manager` dependency-check scripts probe the first word of the dependency's `Source` prose (`executableToken` in `packages/cli/src/operations/playbook-packaging/materialization.ts`) instead of the dependency `ID`. Repro: a `git` dependency with Source `system install` generates a check for a binary named `system`, which exits 1 despite git being installed; the UAT proceeded only because the Source cell was reworded to begin with `git`. Root cause: structured data (the probe target) living in prose; unit fixtures missed it because their Source text happened to start with the binary name. F2: `PlaybookRunState.resumeHints` only accumulates — hints from long-completed steps ("Delegated step `prepare` is waiting for its executor") persist through close, misleading agents that read hints as current guidance.

**Contract-ergonomics findings (C1–C3, owned by the design).** The authoring format is optimized for the parser, not the author: the `## Dependencies` table's positional, stringly-typed cells (C1 — becomes a fenced YAML block with an explicit optional `probe` field defaulting to the dependency id, the root fix for F1, with `Source` returning to pure prose); the long-winded `schemaVersion`/`workflowSchemaVersion` keys (C2 — become `schema`/`workflowSchema`); and jargon-heavy required headings such as `## Inputs And Authority` and `## Workflow Contract` (C3 — full simplification pass). Migration stance, user-approved: accept old forms with deprecation warnings, batched into one contract revision so migration happens once. These revise the W18 R6 contract (PRD 34 lineage); the contract and the default Playbook are dogfooded assets authored upstream in `packages/docs/template/` first.

**CLI-experience findings (X1–X7, owned by the design).** One output channel serves two audiences and the grammar mismatches intent: every command dumps the full JSON operation result with a monotonically growing state echo (X1 — a render layer: human text on TTY, `--json` for the full record, MCP/agent output byte-identical); `run package write` is a dry run without `--write` (X2 — correct fail-before-write posture, wrong name; intent-named `plan`/`preview`/`write` grammar); plan-to-write handoff needs jq surgery (X3 — `plan --output <path>`); 24-character timestamp run IDs (X4 — prefix matching and `--last`); `--repo-root`/`--store-root`/`--precondition` boilerplate (X5 — defaults and config absorption); the Node SQLite ExperimentalWarning on every invocation (X6 — targeted suppression); and the capability snapshot repeated verbatim in every state echo (X7 — folded into the render layer).

**Deferred items (register items Q-015, Q-016).** A Clack-based interactive mode for driving playbook runs is the natural wave after the remediation lands — building it over the current grammar and output would wallpaper the problems. A full TUI over the global store, run state machine, and packaging surfaces is captured as a named future design lineage.

**Sequencing decision (user-approved, register item R-026).** The remediation round runs before the planned W18 R9 conformance wave, because R9's evidence binds to generated-package content and CLI command spellings this round changes; the round's PRD coverage must reconcile [PRD 37](../../../prd/37-enhance-playbook-and-package-conformance.md) and the existing [W18 R9 backlog](../../../work/2026-07-01-w18-r9-playbook-and-package-conformance/00-index.md) for the assumptions it invalidates (dependency-table fixtures, command spellings in scenarios).

The remediation design was authored as [Playbook Authoring Ergonomics and CLI Experience Remediation](../../../designs/2026-07-03-playbook-authoring-ergonomics-and-cli-experience-remediation.md) with downstream coordinate W18 R12 (W18 R1–R11 are taken), route `change-plan`, revising the W18 R6/R7/R8/R11 lineage.

| Area | Summary |
| --- | --- |
| Risk register | Added D-015 (F1 probe defect), D-016 (F2 hint accumulation), Q-015 (deferred Clack interactive mode), Q-016 (deferred TUI as a future design lineage), and R-026 (the W18 R12 remediation round and its before-R9 sequencing and reconciliation obligations). |
| Design | New W18 R12 remediation design covering the batched authoring-contract revision, the CLI render layer and package grammar, the defect corrections, explicit non-goals, and the R9 reconciliation. |
| Implementation | None — deliberately. No code, contract, or template files were changed this session. |

## Documentation

### Project

| Path | Description |
| --- | --- |
| [docs/designs/2026-07-03-playbook-authoring-ergonomics-and-cli-experience-remediation.md](../../../designs/2026-07-03-playbook-authoring-ergonomics-and-cli-experience-remediation.md) | New W18 R12 remediation design: dependencies YAML block with `probe` field, frontmatter and heading simplification with accept-old-warn migration, CLI render layer and `plan`/`preview`/`write` grammar under the agent-invariance rule, F1/F2 corrections, non-goals, and R9 sequencing. |
| [docs/prd/03-open-questions-and-risk-register.md](../../../prd/03-open-questions-and-risk-register.md) | Added D-015, D-016, Q-015, Q-016, and R-026 capturing the UAT defects, the deferred interactive-mode and TUI directions, and the remediation-before-R9 sequencing decision with its PRD 37 / W18 R9 reconciliation obligation. |

### Developer

None this session.

### User

None this session.

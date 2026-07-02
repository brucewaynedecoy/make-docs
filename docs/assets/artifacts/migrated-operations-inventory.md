---
title: "Migrated Deterministic Operations Inventory"
date: "2026-07-01"
kind: "artifact"
status: "draft"
---

# Migrated Deterministic Operations Inventory

This artifact inventories the deterministic operations that were migrated from former Python skill scripts into the TypeScript CLI under `make-docs operations`. It records each operation's intent and its actual behavior so that a later pruning and consolidation effort has a factual basis. It is a working analysis document, not a design, PRD, plan, or implementation authority, and it does not itself propose the pruning plan. It is a sibling to [cli-command-reorganization.md](cli-command-reorganization.md); the CLI reorganization and this inventory intersect at the operation core, but pruning can proceed on its own track.

## Scope

This inventory covers the non-playbook, non-packaging operations cluster: `wave-resolve`, `wave-status`, `work-phase-state`, `phase-plan`, `phase-gate`, `checkpoint`, `scope-guard`, `closeout-probe`, `closeout-validate`, and `closeout-history`. The playbook and packaging operations are excluded because they are fresh v2 TypeScript with no Python counterparts. These ten operations are the work-lifecycle and closeout inspection surface: they read the `docs/work/` phase documents, git status, and checkpoint state, and only `checkpoint` writes state.

## The Migration Situation

Each of the ten operations is a faithful port of a Python script, and in every case the Python original still exists on disk in a skill package. The migration moved the logic into the CLI but did not remove the Python source, so there are now two implementations of the same deterministic logic. No behavioral drift was detected between them; the ports reproduce the Python regexes, output shapes, and field names closely. The central pruning question is therefore not correctness but duplication: which implementation is authoritative, and what is removed once the CLI is the source of truth.

## Operation Summary

| Operation | Domain | Mutating | Python origin | Purpose in one line |
| --- | --- | --- | --- | --- |
| wave-resolve | work | no | yes | Parse a wave coordinate or path into a canonical wave resolution and the next incomplete phase |
| wave-status | work | no | yes | Summarize wave progress across phases plus any saved checkpoint state |
| work-phase-state | work | no | yes | Parse one phase document into tasks, acceptance, dependencies, validation, and declared paths |
| phase-plan | work | no | yes | Assemble an actionable implementation plan for the next incomplete phase |
| phase-gate | lifecycle | no | yes | Decide whether a phase is eligible to commit or push from recorded evidence |
| checkpoint | lifecycle | yes | yes | Persist lifecycle evidence into phase checkpoint state |
| scope-guard | lifecycle | no | yes | Compare changed files against the phase's declared scope |
| closeout-probe | closeout | no | yes | Scan changes, coordinates, history candidates, risk ids, and validation hints |
| closeout-validate | closeout | conditional | yes | Extract and optionally run validation commands from a probe |
| closeout-history | closeout | conditional | yes | Generate or write a closeout history record |

## Per-Operation Detail

### wave-resolve

Intent: turn a coordinate such as `W1 R2 P3` or a filesystem path into a canonical wave resolution. It does: detects coordinate versus path, locates the wave directory under `docs/work/`, scans phase files matching a two-digit prefix while excluding `00-*` stubs, sorts them, computes each phase's completion and unchecked-task count, and selects the first incomplete phase in wave mode. It reads `docs/work/` and phase files; it writes nothing. Python origin: `resolve_wave.py`.

### wave-status

Intent: report wave progress. It does: runs the wave resolution, parses each phase for task and warning counts, and loads any checkpoint state from `.make-docs/runs/<wave-slug>/state.json`. Read-only. Python origin: `wave_status.py`.

### work-phase-state

Intent: parse a single phase document into a complete machine-usable state. It does: reads the markdown, extracts the title, parses task checkboxes of the form `- [ ] tN: ...` with their stage and section, collects acceptance criteria, dependencies, and validation commands, detects declared file paths from backtick-quoted text and manifest names, gathers source links, and computes warnings such as duplicate or non-sequential task ids. Read-only. Python origin: `work_phase_state.py`.

### phase-plan

Intent: produce an implementation brief for the next incomplete phase. It does: resolves the target, parses the phase, adds consistency warnings by reading linked source documents and comparing expected task counts, and computes parallelization hints from the dependency language. Renders to markdown or JSON. Read-only. Python origin: `phase_plan.py`.

### phase-gate

Intent: decide whether a phase may commit or push. It does: parses the phase, loads its checkpoint state, and collects blockers: unchecked tasks, validation not recorded as passed, code review required but not passed or waived where git shows code changes, closeout not passed, and the commit or push evidence required by the commit policy. Returns passed or blocked with the blocker list. Read-only, though it queries git status. Python origin: `phase_gate.py`.

### checkpoint

Intent: the authoritative write for phase lifecycle evidence. It does: resolves the target, loads or initializes state at `.make-docs/runs/<wave-slug>/state.json`, and applies the provided flags to update the phase entry's status, notes, validation, review, closeout, commit, and push records, localizes absolute paths to repo-relative, and writes the state file. This is the only mutating operation in the cluster. Python origin: `checkpoint.py`.

### scope-guard

Intent: flag changes outside the phase's declared scope. It does: parses the phase for declared paths, gets changed files from explicit arguments or `git status --porcelain`, and classifies each change as in-scope, an allowed derivative such as a lockfile whose manifest changed or a managed state file, or out of scope. Read-only. Python origin: `scope_guard.py`.

### closeout-probe

Intent: the lightweight first scan before closeout. It does: reads git status and diffs to build a categorized changed-file set, extracts coordinates from paths, discovers contract files and history-record candidates, computes the next risk-register ids from `docs/prd/03-open-questions-and-risk-register.md`, and generates validation-command hints tuned to the touched paths. Read-only. Python origin: `closeout_probe.py`.

### closeout-validate

Intent: run or list the validation commands a probe suggested. It does: reads a probe JSON, extracts and de-duplicates its validation hints, always including `git diff --check`, and, when `--run` is given, executes each through a shell and captures truncated stdout, stderr, and exit code. It executes read-only validation commands but writes no state. Python origin: `closeout_validate.py`.

### closeout-history

Intent: produce a closeout history record and commit-message scaffold. It does: reads optional probe and phase JSON, computes a title and coordinate label, renders a history markdown document with frontmatter and standard sections, computes a dated, slugified filename, and, when `--write` is given, writes it under `docs/assets/archive/history/` without overwriting an existing file. Mutating only with `--write`. Python origin: `closeout_history.py`.

## Remaining Python Scripts

The Python counterparts for all ten operations remain on disk. `work-on-wave/scripts/` and `work-on-phase/scripts/` each hold a near-identical set covering the wave and lifecycle operations, and `closeout-phase/scripts/` holds the closeout operations plus a second copy of `work_phase_state.py`. Roughly three dozen `.py` files exist in the repo overall. Scripts outside this cluster, such as `decompose-codebase/scripts/validate_output.py`, `cleanup-docs/scripts/check_markdown_style.py`, and `.make-docs/scripts/check_path_hygiene.py`, are different domains and were not part of this migration.

## Cross-Cutting Pruning Signals

- Two implementations exist for every operation: the ported TypeScript and the original Python skill script. The pruning effort must decide the authoritative surface and remove the other, and it must confirm no skill or workflow still invokes the Python path before removing it.
- The `work-on-wave/` and `work-on-phase/` Python sets are near-duplicates of each other. Even before considering the TypeScript ports, these two skill script sets are candidates for consolidation.
- Two separate git-status parsers exist: one in the lifecycle domain returning a plain path array, and one in the closeout domain returning a categorized map. They could be unified with adapters at the call sites.
- The `checkpoint` operation writes phase state to `.make-docs/runs/<wave-slug>/state.json` in the repository, and `wave-status` and `phase-gate` read it. This is the same in-repo operational-state pattern that the [Runtime and Global Store](runtime-and-global-store.md) decision relocates for Playbook run state. Whether work-lifecycle checkpoint state should also move to the global store, or remain project-visible progress, is an open question for that design, not this inventory, but the interaction should be recorded.
- The `closeout-probe` validation-hint logic is tightly coupled to this repository's structure, such as skill test paths and npm workspaces. It is not redundant, but it is brittle to refactoring and worth isolating.

## Contract and Reference Coupling

None of the ten operations are referenced by their CLI name or their original Python script name in any Make Docs contract under `.make-docs/contracts/system/` or any reference under `.make-docs/references/system/`. A search of both the dogfood tree and the upstream template returned only a generic prose use of the word checkpoint in the history-record contract, not the `checkpoint` operation. The workflow references describe the lifecycle these operations support, such as phase gates, closeout, checkpoints, and coverage passes, conceptually, without naming the operations or scripts. The operations are therefore an implementation detail of those workflows rather than named contract elements.

The one script that authoritative resources reference is `check_path_hygiene.py`, which is outside this cluster. It is cited by `path-and-link-hygiene.md` and the `docs-path-hygiene-cleanup` prompt. If a later no-scripts effort removes that helper, those two upstream template files would need updating, but that is a separate concern from pruning the ten operations here.

The practical implication is that pruning or renaming the ten operations is contained to code and the skill packages that invoke the Python scripts; it does not ripple into the template-owned contracts or references.

## Open Pruning Questions

- Which surface is authoritative for each operation, the TypeScript CLI or the Python skill script, and what invokes each today?
- Can the `work-on-wave/` and `work-on-phase/` skill script sets be consolidated, and does the skill model still need Python at all once the CLI is authoritative?
- Should the two git-status parsers be unified in the operation core?
- Should work-lifecycle checkpoint state move to the global store alongside Playbook run state, or remain in the repository as shared work progress?

## Disposition

Based on review, the cluster's disposition is as follows.

Keep, migrated to the global store project-state model:

- The work-execution evidence store: the record and read of decisions and sign-offs that cannot be re-derived from the repository or git, such as validation-passed, review-passed or waived, and closeout-approved. This is the state core of the current `checkpoint` operation, stripped of its re-derivable fields.
- A tight work-item identity resolver: coordinate or path to canonical phase identity, meaning repo root, wave slug, and phase path. It is kept because the evidence store needs a stable, canonical key for what it records, and because the resolution is fiddly and deterministic in a way where agent variance is a correctness risk, not only a token cost. Its judgment part, selecting the next incomplete phase, is re-derivable and is not kept.

Remove, as CLI operations and as Python scripts: the next-incomplete-phase selection, `wave-status`, `work-phase-state`, `phase-plan`, the `phase-gate` decision logic, `scope-guard`, `closeout-probe`, `closeout-validate`, and `closeout-history`. These are re-derivation, judgment, or document generation, and they are re-expressed as Playbooks.

Method and safeguards:

- The removed workflows are rebuilt as Playbooks, which also dogfoods the run, package, and distribution pipeline. The rebuild is the discovery mechanism: any step that proves painful or error-prone as agent work is a candidate to promote back to a deterministic operation, so load-bearing logic is surfaced empirically rather than predicted.
- Removal is gated on traced invocations, meaning skills and MCP consumers, not on the assumption that contracts and references cover the behavior. Removed logic remains recoverable from version history, so promoting a step back is cheap.

The filter for what earns a CLI or MCP slot going forward: a deterministic operation earns exposure when it is either a fact-of-record that cannot be re-derived, or a canonical-identity or parse primitive that is both fiddly enough that agent variance is a real correctness risk and genuinely reused. Derivation an agent can do correctly from contracts and files, and that is not correctness-critical, does not earn a slot.

## Invocation Tracing at Surface Removal (W18 R11 P4, 2026-07-02)

The W18 R11 pruning phase removed the cluster's command surface — the legacy `operations` CLI dispatcher and the eight pruned MCP tools — gated on the following invocation trace of the removed spellings across the repository:

- Skill packages: four shipped skill packages instruct agents to invoke the removed `make-docs operations ...` spellings — `work-on-wave` and `work-on-phase` (wave-resolve, wave-status, phase-plan, checkpoint, scope-guard, phase-gate) and `closeout-phase` and `closeout-commit` (closeout-probe, closeout-validate, closeout-history) — across their `SKILL.md` and `references/*.md` files (43 mentions in 8 files), and each still ships the Python originals under `scripts/` as its no-CLI fallback. These skills are the pruned workflows' current instruction surface; they keep functioning through their Python fallbacks, their CLI instructions are stale by design until the Playbook rebuild replaces them, and their retirement or consolidation remains this inventory's tracked follow-up under the PRD 26 removal-safety rules.
- Shipped default Playbook: `docs/assets/playbooks/agent/make-docs-lifecycle.playbook.md` (and its upstream template copy) lists `phase_gate.py` and `checkpoint.py` only under optional Suggested Assists; no `operation:` step references a pruned identifier, so the Playbook remains runnable.
- MCP consumers: the only in-repo MCP surface was `packages/cli/src/mcp/tools.ts` itself; no other consumer invokes the removed tool names.
- Code paths: the legacy dispatcher (`packages/cli/src/operations/cli.ts`, deleted this phase) and its tests were the only remaining CLI paths; the internal domain implementation functions stay in place per the reorganization's surface-only scope and remain the recovery source for the Playbook rebuild alongside version history.
- Template and docs: `packages/docs/template/` and the dogfood library guides contain no removed spellings (guides were migrated in W18 R11 P2); the remaining mentions live in historical analysis artifacts and archived records, which are deliberately preserved evidence.

## Relationship to Other Artifacts

The CLI reorganization moves these operations under the `run` namespace and behind the operation core and registry. This inventory is the pruning companion to that reorganization: the reorganization decides where the operations live and how they are surfaced, while this inventory records what each one does so that duplicate and brittle logic can be removed deliberately rather than carried forward unexamined.

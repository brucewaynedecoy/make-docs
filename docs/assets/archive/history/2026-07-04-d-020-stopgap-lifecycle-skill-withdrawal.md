---
title: "D-020 Stopgap: Lifecycle Skill Withdrawal"
kind: "history"
status: "completed"
date: "2026-07-04"
client: "Claude Code"
model: "Fable 5"
coordinate: "W18"
repo: "make-docs"
branch: "make-docs-v2"
summary: "Executed the D-020 stopgap: pulled the four broken lifecycle skills (closeout-commit, closeout-phase, work-on-phase, work-on-wave) from the shipped registry and deleted their sources, swept every shipped enumeration, proved clean removal for existing installs, and closed D-020 with the durable regeneration bar transferred to Q-022."
---

# D-020 Stopgap: Lifecycle Skill Withdrawal

## Changes

This session executed the stopgap for [D-020](../../../prd/03-open-questions-and-risk-register.md) — the pre-W18 conformance audit's one live user-facing break: all four shipped lifecycle skills instructed agents to run ten `make-docs operations ...` subcommands (43 invocation lines) on a command surface the W18 R11 reorganization removed. Per the user's decision, the fix is a **registry pull, not a hand-rewrite**: the skills are slated for regeneration through the [Q-022](../../../prd/03-open-questions-and-risk-register.md) agentics production pipeline, so investing in hand-maintained rewrites of pipeline-destined artifacts would be waste. The withdrawal is the honest representation of what Make Docs can currently ship.

### What was removed

| Surface | Removal |
| --- | --- |
| `packages/cli/skill-registry.json` | The `closeout-commit`, `closeout-phase`, `work-on-phase`, and `work-on-wave` skill entries. The registry now ships three skills: `archive-docs`, `cleanup-docs`, `decompose-codebase`. |
| `packages/skills/{closeout-commit,closeout-phase,work-on-wave,work-on-phase}/` | Deleted entirely (git history preserves them). This also disposes of the leftover `scripts/*.py` helper payloads the audit flagged as unshipped leftovers, in the same decision. |
| `packages/cli/src/skill-catalog.ts` | The `RETIRED_MANAGED_SKILL_ASSETS` map is emptied — all of its entries belonged to the withdrawn skills; the generic stale-skill removal path now owns their cleanup. The seam remains for future retirements. |
| `scripts/smoke-pack.mjs` | Expectations rebuilt around the three-skill catalog; a new `WITHDRAWN_SKILL_PATHS` guard asserts no install path (shared payload, Claude Code exposure, Codex exposure) ever materializes the four skills and that no manifest `skillFiles` entry falls under their trees. |
| `packages/docs/template/docs/assets/playbooks/agent/make-docs-lifecycle.playbook.md` (+ dogfood and generated CLI-template copies) | The withdrawn skills removed from the Suggested Assists lists of the execution and coverage-pass bands (upstream-first, then dogfood, then `scripts/copy-template-to-cli.mjs` resync). |

The consumer-sweep rule D-020 adopted was applied in the same window: `packages/`, `src/`, `tests/`, `scripts/`, templates, playbooks, and library guides were grepped for the four slugs, and every shipped enumeration was corrected. Incidental non-shipped references were left intentionally: legacy-manifest test fixtures (real historical installs did select these skills), the `work-on-wave` legacy-state migration text in `packages/cli/src/operations/lifecycle/index.ts`, and archived designs/plans/history.

### Lifecycle: existing installs get clean removal

The update/removal machinery needed no special-casing — it is generic by construction. `getDesiredSkillAssets` filters the manifest's `selectedSkills` against the registry, so withdrawn skills simply produce no desired assets; manifest-tracked files that are no longer desired flow through `planStaleSkillFile` in `packages/cli/src/planner.ts` into `remove-managed` actions (hash-matching copies removed, locally modified copies preserved as `skip-conflict` for review). Verification added:

- `packages/cli/tests/install.test.ts` — new test `skills-only sync removes previously installed skills withdrawn from the registry`: a fixture install carrying manifest-tracked `closeout-commit` and `work-on-wave` files plans `remove-managed` for clean copies and `skip-conflict` for a locally edited one, and the next manifest drops the removed paths.
- `packages/cli/tests/audit.test.ts` — new test `classifies withdrawn lifecycle skill files left by prior installs`: manifest-tracked withdrawn files with matching hashes classify removable (`managed-file-hash-match`); skill-list-only leftovers classify preserved (`manifest-skill-file-without-metadata`) because canonical content for a withdrawn skill is intentionally unresolvable.
- `packages/cli/tests/skill-registry.test.ts`, `skill-catalog.test.ts`, `consistency.test.ts` — pins that the four skills are absent from the registry, produce no assets even when a stale manifest still selects them, and that their source directories stay deleted.

### Purpose-registry consequence (recorded, not backfilled)

The canonical PRD 27 purpose taxonomy keeps `lifecycle-closeout` and `workflow-execution` declared in `packages/cli/skill-registry.json` and in `FIRST_PARTY_PURPOSE_IDS`, but the withdrawn skills were those purposes' only occupants — **both purposes now ship zero skills**. Nothing in the schema or loader requires a purpose to be occupied (skills must reference declared purposes, not the reverse), and the wizard derives its choices from skills, so empty purposes simply do not render. No replacement skills were invented; occupancy returns when the Q-022 pipeline regenerates the lifecycle agentics.

### Guide coverage

Both library guides that enumerated the seven-skill catalog were corrected to the three-skill catalog, each with a note recording the withdrawal and the pipeline ownership of the replacements (see Documentation below). No other `docs/assets/library/` guide references the withdrawn skills.

### Register

D-020 is moved to **Closed** with a Resolution block: the stopgap removed the live break per its close bar, the stranded closeout/lifecycle operation exports under `packages/cli/src/operations/` are recorded as dormant surface-less code dispositioned to the Q-022 lineage (retirement or reuse), and the durable regeneration bar was already transferred to Q-022 when the lineage was named. Register heading pins in `consistency.test.ts` were unaffected (the D-020 heading text is unchanged).

### Validation

| Check | Result |
| --- | --- |
| `npm test -w packages/cli` | Green — 905 tests across 55 files (withdrawn-skill enumeration tests removed; withdrawal and lifecycle-removal coverage added). |
| `npm run build -w packages/cli` | Green. |
| `npm run validate:defaults` | Green — 32 consistency tests. |
| `node scripts/smoke-pack.mjs` | Green — packed install/skills/backup/remove cycle with the three-skill catalog and withdrawn-path guards. |
| `python3 .make-docs/scripts/check_path_hygiene.py` | Clean — 82 files, 0 errors. |
| `git diff --check` | Clean. |

## Documentation

### Project

| Path | Description |
| --- | --- |
| [docs/prd/03-open-questions-and-risk-register.md](../../../prd/03-open-questions-and-risk-register.md) | D-020 moved to Closed with a Resolution block recording the registry pull, the lifecycle-removal proof, the dormant-exports disposition to Q-022, and the empty-purpose consequence. |
| [docs/assets/playbooks/agent/make-docs-lifecycle.playbook.md](../../playbooks/agent/make-docs-lifecycle.playbook.md) | Withdrawn skills removed from the Suggested Assists lists (dogfood copy, synced from the template source). |

### Developer

| Path | Description |
| --- | --- |
| [docs/assets/library/developer/skills-catalog-and-distribution-model.md](../../library/developer/skills-catalog-and-distribution-model.md) | Shipped catalog corrected from seven to three entries, with the withdrawal and the empty `lifecycle-closeout`/`workflow-execution` purposes recorded. |

### User

| Path | Description |
| --- | --- |
| [docs/assets/library/user/skills-installing-and-managing-skills.md](../../library/user/skills-installing-and-managing-skills.md) | Selectable-skill table corrected to the three shipped skills, with a note explaining the withdrawal and the pipeline-owned replacements. |

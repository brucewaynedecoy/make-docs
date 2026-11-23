---
title: "W29 R0 P5 Agent Twin and Config"
kind: "history"
status: "completed"
date: "2026-11-23"
client: "T3 Code"
model: "Claude Opus 5.5"
coordinate: "W29 R0 P5"
repo: "make-docs"
branch: "docs/w29-w30-work-store-and-factory"
---

# W29 R0 P5 Agent Twin and Config

## Changes

Adds `make-docs://system/reference/work-store.md`, the agent twin of the nine `work` operations. An agent that edits `docs/work/` directly, with or without the CLI, finds there the authority rule, the repo copy, the sync table and the settle choices of each conflict kind, the hold list, first import and dependency bullets, readiness with every wait reason, claims with private claim IDs, report and close, the tracker connection contract, quick items, and project URIs that always name their project. Each sentence names its catalog rule ID. The rule catalog gains `WORK-RULE-041` to `WORK-RULE-054` for the sync rules that P3 and P4 added, with parity fixtures, and a new test fails when a rule ID is on one side only. The text's sync table, settle choices, wait reasons, recorded status map, and claim timing are checked against the catalog, and ten sync scenarios run through the real sync.

Config validation names each state or secret key in the `work` block, and refuses a field map value that looks like a key. Setup shows the project name, or proposes one from the checkout folder name (from the main checkout's folder for a linked git worktree), and writes nothing for it. `make-docs project doctor` gains the `phase-status-line` check: an older phase file with no status line whose tasks are all checked gets a reviewed fix that adds `status: "completed"`. The check skips paths on `work.syncHold`. On this repository it finds 79 phase files; the fix was not run, because a repository-wide fix needs the owner's approval.

An independent review asked for seven small changes, all fixed with tests: the doctor fix keeps mixed line endings and adds no second front matter, the field name check accepts camelCase names with digits, the fix sentence reads well for each mix of changes, key words match only as whole words, the resource names the opt-in `--work-store` snapshot, three new fixtures cover the progress note, and test examples use generic names. Whether setup should only propose `projectName` waits for the owner; it proposes only, as recommended.

```text
packages/docs/template/.make-docs/
├── system/references/work-store.md                 (new agent twin)
├── system/references/project-doctor.md             (phase-status-line check)
├── system/references/AGENTS.md, CLAUDE.md          (router line)
└── system-resources.catalog.json                   (work-store.md entry)
packages/docs/template/docs/work/AGENTS.md, CLAUDE.md (router line)
packages/cli/
├── src/operations/work/work-store/catalog.ts       (WORK-RULE-041 to -054)
├── src/operations/work/work-store/schemas.ts       (state and secret keys, field map values)
├── src/config.ts                                   (work-block-state-field)
├── src/store/project-register.ts, src/cli.ts       (projectName proposal)
├── src/operations/project/doctor/                  (phase-status-line)
├── src/run/root-operations.ts, src/rules.ts
└── tests/w29-r0-p5-agent-twin-and-config.test.ts   (new), fixtures and updated tests
docs/prd/06, 24, 38, 39, 52                         (requirements and history)
```

## Documentation

### Project

| Path | Description |
| --- | --- |
| [P5 work](../../../docs/work/2026-11-21-w29-r0-work-store/05-agent-twin-and-config.md) | Closes T1 to T10 and records A22 to A24. |
| [Evidence report](../../../docs/work/2026-11-21-w29-r0-work-store/evidence.md#p5-agent-twin-and-config) | What was built, new behavior, twin parity, config refusals, the project name sample, and the doctor count on this repository. |
| [PRD 52](../../../docs/prd/52-work-store-and-work-queue.md) | R-WORK-STORE-6 and R-WORK-QUEUE-20, with history. |
| [PRD 39](../../../docs/prd/39-cli-command-model-and-operation-registry.md) | R-DOCTOR-2 and new R-DOCTOR-8, with history. |
| [PRD 24](../../../docs/prd/24-project-configuration-and-convention-overlay.md) | R-CONFIG-WORK-3, with history. |
| [PRD 38](../../../docs/prd/38-global-store-and-project-state.md) | R-ID-8, with history. |
| [PRD 06](../../../docs/prd/06-template-contracts-and-generated-assets.md) | New R-WORK-RESOURCE-1, with history. |

### Maintainer

None this session.

### User

| Path | Description |
| --- | --- |
| `make-docs://system/reference/work-store.md` | How to find, claim, report, and close work with the same rules as the CLI. |

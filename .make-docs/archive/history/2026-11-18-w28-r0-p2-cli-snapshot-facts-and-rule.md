---
title: "W28 R0 P2 CLI Snapshot Facts and Rule Closeout"
kind: "history"
status: "completed"
date: "2026-11-18"
client: "T3 Code"
model: "Claude Opus 5.5"
coordinate: "W28 R0 P2"
repo: "make-docs"
branch: "docs/w28-wave-revision-rules"
---

# W28 R0 P2 CLI Snapshot Facts and Rule Closeout

## Changes

Adds the deterministic twin of the W28 coordinate rules to `work.backlog.snapshot`. Each interpreted phase now reports `closeoutNotesPresent` and a Git-derived `committed` fact. Each record reports `nextPhase` and a filled `closeout.committed`. The snapshot reports project-level `coordinates` with the highest Wave and each Wave's revisions and next free revision, and every Git-dependent fact stays `null` when Git is unavailable. The rule catalog, now version 2, adds `BACKLOG-RULE-017` / `BACKLOG-VAL-017`, which warns about a malformed `## Change History` entry in a work index, and agent-only `BACKLOG-AGENT-018` for coordinate selection. `work.item.resolve` is unchanged. The generated backlog-review Skill bundles, the MCP App widget, and the Skill rule map are regenerated or updated to match.

Validation passed: 21 new focused tests, using real temporary Git repositories, 376 backlog and registry tests, the CLI build with its widget check, and a built-CLI snapshot of this repository with no new diagnostics. The schema-consumer preflight found no persisted strict-schema consumer, so the facts are additive version 1 keys. A comparison run on unchanged `main` showed that the two MCP stdio test failures come from the Node 26 `DEP0205` warning. One scope edit moved the rule-map rows from P3 into P2, and the backlog's Change History records it. Performance and Unassisted Goal Testing are `not-needed-now`.

## Documentation

### Project

| Path | Description |
| --- | --- |
| [P2 work](../../../docs/work/2026-11-18-w28-r0-wave-revision-rules/02-cli-snapshot-facts-and-rule.md) | Closes t1–t12, A10–A18, and A31. |
| [W28 index](../../../docs/work/2026-11-18-w28-r0-wave-revision-rules/00-index.md) | Records the first Change History entry. |
| [Evidence report](../../../docs/work/2026-11-18-w28-r0-wave-revision-rules/evidence.md) | Records the P2 preflight, tests, real run, and Node 26 proof. |

### Maintainer

| Path | Description |
| --- | --- |
| [Skill rule map](../../../packages/skills/backlog-review/references/rule-map.md) | Maps `BACKLOG-RULE-017` and `BACKLOG-RULE-018`. |

### User

None this session.

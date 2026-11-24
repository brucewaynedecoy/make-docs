---
title: "W30 R0 P5 Factory Run Skill and Handoffs"
kind: "history"
status: "draft"
date: "2026-11-23"
client: "T3 Code"
model: "Claude Opus 5.5"
coordinate: "W30 R0 P5"
repo: "make-docs"
branch: "docs/w29-w30-work-store-and-factory"
---

# W30 R0 P5 Factory Run Skill and Handoffs

## Changes

Rewrites the `factory` Skill so that it runs one saved, `ready` factory workflow of one named project. The Skill loads the workflow, its type, and the factory contract, and refuses a workflow that is not `ready` with the fix for each state. It runs the contract's loop in order: sync and read readiness, check open assignments through their handles with `unknown` first, renew claims, judge, review with a separate reviewer, correct within the round limit, accept and close units inside the scope, take the next ready unit, and escalate. It names the project in every factory call and every message, and it never takes the project from the folder where it works. Three references replace the profiles, the old Store reference, and the old work methods: the run loop with each command, the working rules, and the messages to the person. The installed copy in `.agents/skills/factory/` matches the source.

A merge or a deploy of one unit records its grant use in the same save that accepts the builder's assignment, so a refused grant leaves the unit in review and nothing happens. An action after the person accepts the whole scope has no way to record its grant use yet. The owner approved a follow-up on 2026-11-23 that records a grant use on the live claim; until it lands, the Skill asks the person and does not act there. After the person allows more rounds, the Skill records a `once` reset grant, cancels the old assignment, and starts a new one at round 0. A takeover gives a new task handle, also for the foreman's own expired claim.

An `escalations` entry in the config only adds an event, and nothing in the config can remove a floor event. A workflow key about the floor or escalations gets a plain refusal.

The backlog review "Work on this wave" action hands a wave to the factory when a workflow is `ready`. `backlog snapshot --factory` (MCP `factory: true`) adds a `factory` key with the ready workflows and the project, only when one is `ready` in a bound checkout. The key changes no snapshot or model identity. With it, the live message and the static report's copied prompt name the project and ask the agent to use the `factory` Skill and to hand the wave to the front desk of the ready workflow. Without it, both are as before. PRD 51 states the option as new behavior, which the owner approved on 2026-11-23. The app assets and the backlog review Skill scripts are regenerated.

T10, backups outside git, is not met: no factory command records a backup. Until the follow-up adds `factory backup save`, the Skill stops before any builder job in a folder without git and asks the person.

An independent review found ten items, all fixed: the grant use timing, the project in the handoff message, a two-way twin test with planted misses, more rounds after the limit, PRD 51, an older CLI that refuses the option, takeover and order details, a config check that refused valid added events, stale README rows, and the T10 rule.

Validation: 29 tests in `packages/cli/tests/w30-r0-p5-factory-run-skill-and-handoffs.test.ts`, the type check, the build, the byte-match tests, `validate:defaults`, the router check, `check prd`, `project paths validate`, the Markdown check of the changed files, and the full suite.

| Area | Summary |
| --- | --- |
| `packages/skills/factory/` and `.agents/skills/factory/` | New run Skill text and three references. |
| `packages/cli/skill-registry.json` | The `factory` entry lists the new references. |
| `packages/cli/src/operations/factory/` | The floor check in `config-block.ts`, and `handoff.ts`, which reads the ready workflows of a checkout. |
| `packages/cli/src/operations/work/backlog/` | The snapshot option and key, the identity rule, and the two Work message routes. |
| `packages/skills/backlog-review/` and `packages/cli/src/mcp/` | The static report's Work prompt, the Skill text, and the regenerated assets. |
| `README.md` and `packages/cli/README.md` | The `factory` command and Skill rows. |

## Documentation

### Project

| Path | Description |
| --- | --- |
| [P5 work](../../../docs/work/2026-11-21-w30-r0-factory/05-factory-run-skill-and-handoffs.md) | Checks T1 to T9 and T11 to T21, keeps T10 open, and records the closeout notes. |
| [Evidence report](../../../docs/work/2026-11-21-w30-r0-factory/evidence.md) | Adds the P5 section: what changed, each task, the twin test, the fixture runs, the message samples, the choices made, the review fixes, the checks, and the owner items. |
| [PRD 51](../../../docs/prd/51-backlog-review-and-reporting.md) | Names the `--factory` option in R-BACKLOG-SNAPSHOT-1, -13, and -24, adds R-BACKLOG-SNAPSHOT-34, and records it in Requirement History as new behavior. |

### Maintainer

| Path | Description |
| --- | --- |
| [Factory Skill](../../../packages/skills/factory/SKILL.md) | The run Skill and its references. |
| [Backlog review Skill](../../../packages/skills/backlog-review/SKILL.md) | Asks for the `factory` key and says how to hand a wave to the factory. |

### User

None this session.

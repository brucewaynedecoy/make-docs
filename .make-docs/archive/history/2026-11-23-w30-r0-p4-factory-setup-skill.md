---
title: "W30 R0 P4 Factory Setup Skill Closeout"
kind: "history"
status: "draft"
date: "2026-11-23"
client: "T3 Code"
model: "Claude Opus 5.5"
coordinate: "W30 R0 P4"
repo: "make-docs"
branch: "docs/w29-w30-work-store-and-factory"
---

# W30 R0 P4 Factory Setup Skill Closeout

## Changes

Adds the first-party `factory-setup` Skill in `packages/skills/factory-setup/`, explicit-invocation-only and off by default. It is Markdown and metadata only, with no script and no Python. It runs six steps: find the agent tools by capability (reusing the machine's saved list when it is current), read each tool's help, docs, MCP tool list, and Skills, interview the person for preferences and permissions one decision at a time, wire each role to a tool by proved capability, prove and save, and close with a plain summary. Step 0 stops setup when the CLI, the Store, or the project is missing, and names the fix.

The Skill names no product, harness, provider, multiplexer, scheduler, or messaging tool. It never installs, signs in, pays, or changes authentication for the person; those are manual steps. Every project write names `--target-root` or `--project`, and `factory tools save` names neither. Proofs record the tool version, the time, `proved`, `unproved`, or `contradicted`, and a "does not cover" list. Known losses are named and accepted one by one. Grants are asked for by action, with the narrowest scope recommended. The standard roles keep the contract's context defaults, and a custom role lists its own. The Skill tells the person the plan revision and its digest in plain words, runs the test task under it, and saves the proof with the same digest. A rerun shows what changed, proves each changed boundary again, and reaches `ready` under a new revision.

```text
make-docs/
├── packages/skills/factory-setup/
│   ├── SKILL.md
│   ├── agents/openai.yaml
│   └── references/ (find-and-read, interview, wire-and-prove, save-and-test, summary)
├── packages/cli/skill-registry.json
└── packages/cli/tests/w30-r0-p4-factory-setup-skill.test.ts
```

| Area | Summary |
| --- | --- |
| Skill | The new `factory-setup` Skill and its registry entry. |
| Twin test | 24 tests: commands, MCP tools, flags, reason codes, record values, one-word values and field paths, rule IDs, the two-option rule, the tool-agnostic text, and fixture runs to a saved `ready` workflow for the smallest setup, a multi-tool setup, a rerun, and a new tool version. |
| Skill lists | Six tests and two scripts list the ninth Skill. |

An independent review found no broken code and eight text and test items. Seven are fixed: the tools copy is a hint only after a restore and never gives a record version, the grants file has a shape and a rerun revokes grants, each question shows at most two options, the twin test also checks one-word values and field paths, the product name list is wider, a version conflict uses the version that the refusal names, and Step 0 has one `store-denied` row. The eighth, an email address accepted in `grantedBy`, is a P3 follow-up.

Validation: the type check, the build, the Skill tests, `validate:defaults`, the router check, `check prd`, paths, the Markdown check on the new Skill files, and the full suite with only the known failures. The owner's Guided Progress Review of the interview and the summary is open.

## Documentation

### Project

| Path | Description |
| --- | --- |
| [P4 work](../../../docs/work/2026-11-21-w30-r0-factory/04-factory-setup-skill.md) | Checks T1 to T17 and records the closeout. The phase stays `active` until the owner's review. |
| [Evidence report](../../../docs/work/2026-11-21-w30-r0-factory/evidence.md) | Adds the P4 section: the files, how each task is met, the twin test, the choices made, a sample summary, the checks, the review fixes, and the follow-ups. |
| [Root README](../../../README.md) and [Skills README](../../../packages/skills/README.md) | List nine Skills, with `factory-setup`. |

### Maintainer

| Path | Description |
| --- | --- |
| [Skills catalog model](../../../docs/assets/maintainer/skills-catalog-and-distribution-model.md) | Lists nine entries, with `backlog-review` and `factory-setup`. |
| [CLI README](../../../packages/cli/README.md) | Lists nine Skills. |

### User

| Path | Description |
| --- | --- |
| [Installing and managing Skills](../../../docs/assets/user/skills-installing-and-managing-skills.md) | Lists `factory-setup` and nine payloads. |

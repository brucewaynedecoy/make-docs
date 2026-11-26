---
title: "W34 R0 P4 Removal and Guard Closeout"
kind: "history"
status: "completed"
date: "2026-11-23"
client: "T3 Code"
model: "Claude Opus 5.5"
coordinate: "W34 R0 P4"
repo: "make-docs"
branch: "docs/w29-w30-work-store-and-factory"
---

# W34 R0 P4 Removal and Guard Closeout

## Changes

Removes the last Python from the first-party Skills, under PRD 08 R-SKILL-BUNDLE-7 and the PRD 25 operation-first order. The seven Python files and the tracked `.pyc` file under `packages/skills/` are deleted, and `packages/cli/skill-registry.json` no longer declares the four installed `.py` files. The closeout validation hints drop their three `python3` commands, two of which named Skills that D-020 had already deleted, and name the W34 vitest suites instead, only in the Make Docs repository.

An update of an older install removes each old Python copy that Make Docs wrote and that nobody changed. `make-docs setup` plans it and routes it to `make-docs setup skills`, which applies it. A changed copy stays. Under the owner's option A of 2026-11-23 and new PRD 08 R-SKILL-SETUP-8, `make-docs setup skills` names each kept file with a plain reason, says in a dry run which files it would keep, and lists a file with a staged conflict copy only in the staged list. `w34-r0-p4-removed-skill-scripts.test.ts` (23 tests) proves both cases for each file with a temporary Store and project, and also covers an unrecorded copy, `setup skills --remove`, a Claude-only install, and each R-SKILL-SETUP-8 point.

`w34-r0-p4-skill-scripts-guard.test.ts` (11 tests) fails on any `.py` file, `.pyc` file, or `__pycache__` folder in `packages/skills/`, on a registry `.py` entry, and on any hand-written or changed file in a Skill `scripts/` folder. It reuses the P3 byte-match check for the `backlog-review` bundles. Each planted case fails with its own finding. `scripts/smoke-pack.mjs` also refuses a packed `.py` entry or an installed `.py` file. The installed `.agents/skills/` copy is out of the guard's scope until the owner refreshes it after the release.

```text
packages/
├── cli/skill-registry.json                          (four .py entries removed)
├── cli/src/operations/closeout/index.ts             (python3 hints removed)
├── cli/src/skills-command.ts                        (kept-file list, R-SKILL-SETUP-8)
├── cli/tests/w34-r0-p4-removed-skill-scripts.test.ts (new)
├── cli/tests/w34-r0-p4-skill-scripts-guard.test.ts   (new)
└── skills/
    ├── README.md                                    (generated-bundle rule)
    ├── archive-docs/scripts/                        (removed)
    ├── cleanup-docs/scripts/                        (removed)
    └── decompose-codebase/scripts/                  (removed)
scripts/smoke-pack.mjs                               (no-Python checks)
```

## Documentation

### Project

| Path | Description |
| --- | --- |
| [P4 work](../../../docs/work/2026-11-23-w34-r0-skill-scripts-into-the-cli/04-removal-and-guard.md) | Closes T1–T7 and records A16 to A19. |
| [Evidence report](../../../docs/work/2026-11-23-w34-r0-skill-scripts-into-the-cli/evidence.md) | The removal map, the managed-removal test, the guard's planted cases, the search, and the owner decision on finding 1. |
| [PRD 08](../../../docs/prd/08-skills-catalog-and-distribution.md) | New R-SKILL-SETUP-8 for the kept-file list, with a Requirement History entry. |

### Maintainer

None this session. `packages/skills/README.md` carries the new Skill authoring rule.

### User

| Path | Description |
| --- | --- |
| [Installing and Managing Skills](../../../docs/assets/user/skills-installing-and-managing-skills.md) | New troubleshooting entry for a plan that removes old Python files from a Skill. |

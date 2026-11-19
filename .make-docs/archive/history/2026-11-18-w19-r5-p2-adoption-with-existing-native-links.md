---
title: "W19 R5 P2 Adoption With Existing Native Links"
kind: "history"
status: "completed"
date: "2026-11-18"
client: "T3 Code"
model: "Claude Opus 5.5"
coordinate: "W19 R5 P2"
repo: "make-docs"
branch: "fix/d053-skill-symlink-adoption"
---

# W19 R5 P2 Adoption With Existing Native Links

## Changes

Fixes reviewed first-party Skill adoption for projects that already expose Skills through native links such as `.claude/skills/<name>` → `../../.agents/skills/<name>`. Adoption now declares a copy fallback only for a native link that the plan creates, which matches the detached-plan validator and executor, so an existing link no longer fails with "Invalid predeclared native copy fallback" and stays a link. A regression test reproduces the failure and covers the kept link, a refreshed outdated copy with its backup, and the preserved fallback for new links. This is revision Phase P2 of W19 R5, and it fixes D-053, which is recorded on the W28 R0 branch.

Validation passed: 243 focused Skill and adoption tests, `npm test` apart from the 3 known environment failures, `validate:defaults` with 53 tests, the build, `smoke:pack:local`, a real built-CLI adoption in a throwaway project, and an adoption dry run in this checkout. Performance and Unassisted Goal Testing are `not-needed-now`.

## Documentation

### Project

| Path | Description |
| --- | --- |
| [P2 work](../../../docs/work/2026-09-09-w19-r5-first-party-skills-and-managed-adoption/02-adoption-with-existing-native-links.md) | Closes t1–t3 and A15–A17. |
| [W19 R5 index](../../../docs/work/2026-09-09-w19-r5-first-party-skills-and-managed-adoption/00-index.md) | Records the revision Phase in Change History. |
| [Evidence report](../../../docs/work/2026-09-09-w19-r5-first-party-skills-and-managed-adoption/evidence.md) | Records the P2 cause, tests, and real runs. |

### Maintainer

None this session.

### User

None this session.

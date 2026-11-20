---
title: "W19 R5 P2 Main Merge and D-053 Closure"
kind: "history"
status: "completed"
date: "2026-11-20"
client: "T3 Code"
model: "Claude Opus 5.5"
coordinate: "W19 R5 P2"
repo: "make-docs"
branch: "fix/d053-skill-symlink-adoption"
---

# W19 R5 P2 Main Merge and D-053 Closure

## Changes

After PR #64 merged W28 R0 into `main`, `main` was merged into the D-053 fix branch with no conflicts. The W28 R0 adoption ledger check (D-054) and the P2 copy-fallback pruning (D-053) now sit together in `skills-adoption.ts`, and their tests pass together. A built-CLI adoption in a throwaway project with existing `.claude/skills` links applied, kept the links, backed up the older bytes, and repeated as `unchanged`. D-053 is closed in PRD 03. Two builds of the 2.0.9 candidate give SHA-256 `f9f832fb93f904f36cb345aee17854a3be2967825f7ce440633036d51d6dad0c`.

Validation: `npm test` passed apart from the 2 known Node 26 stdio failures. `validate:defaults`, the build, and `smoke:pack:local` passed. This Mac's Store was not changed.

## Documentation

### Project

| Path | Description |
| --- | --- |
| [P2 work](../../../docs/work/2026-09-09-w19-r5-first-party-skills-and-managed-adoption/02-adoption-with-existing-native-links.md) | Adds and closes t5 and A19. |
| [W19 R5 index](../../../docs/work/2026-09-09-w19-r5-first-party-skills-and-managed-adoption/00-index.md) | Records the edit in Change History. |
| [Evidence report](../../../docs/work/2026-09-09-w19-r5-first-party-skills-and-managed-adoption/evidence.md) | Records the merge, the real adoption, the checks, and both digests. |
| [PRD 03](../../../docs/prd/03-open-questions-and-risk-register.md) | Closes D-053. |

### Maintainer

None this session.

### User

None this session.

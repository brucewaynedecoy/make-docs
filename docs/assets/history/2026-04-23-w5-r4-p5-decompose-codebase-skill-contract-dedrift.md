---
date: "2026-04-23"
repo: "make-docs"
branch: "codex/makedocsw5r4"
coordinate: "W5 R4 P5"
status: "completed"
summary: "Closed out W5 R4 with focused validation, stale-path scans, and parity verification."
---

# Phase 5: Decompose Codebase Skill Contract De-Drift - Tests and Validation

## Changes

This session completed [Phase 5 of the `w5-r4` backlog](../archive/work/2026-04-23-w5-r4-decompose-codebase-skill-contract-dedrift/05-tests-and-validation.md), implementing the validation closeout described in [the de-drift design](../archive/designs/2026-04-23-decompose-codebase-skill-contract-dedrift.md) and [Phase 5 of the implementation plan](../archive/plans/2026-04-23-w5-r4-decompose-codebase-skill-contract-dedrift/05-tests-and-validation.md). The corrected `decompose-codebase` package and `.agents` mirror now pass the focused validator, build, test, router, stale-path, install-surface, and parity checks, and the mapped-file parity guardrail was verified both by an induced-drift failure and by a passing rerun after the mirror was restored.

| Area | Summary |
| --- | --- |
| Focused validation suite | Ran the packaged validator tests, CLI build, full CLI test suite, and instruction-router check to prove the corrected v2 contract works end to end. |
| Environment repair | Installed the workspace dependencies with `npm ci` after the local worktree was missing `tsup` and `vitest`, and used `python3` in place of `python` because this machine does not expose a `python` binary on `PATH`. |
| Active-surface scans | Ran targeted scans across `packages/skills/decompose-codebase/`, `.agents/skills/decompose-codebase/`, `packages/cli/skill-registry.json`, and `packages/cli/tests/` to confirm the active surfaces no longer route future work to `docs/prd/archive/...`, one-file plan/backlog outputs, or the retired installed `rebuild-backlog.md` template. |
| Install and parity proof | Confirmed the updated install and skill-catalog coverage still proves the retained optional `decompose-codebase` install surface, confirmed no legacy `skill-assets` projection reappears for the decompose skill, and verified the new mapped-file parity guardrail first fails on an induced mirror drift and then passes again after restoring the mirrored file. |
| Hygiene | Cleaned the generated `__pycache__` artifact back to its committed state, verified `git diff --check`, and left the tracked working tree with only the completed Phase 5 backlog file plus this new history record. |
| Backlog tracking | Marked [the Phase 5 work item](../archive/work/2026-04-23-w5-r4-decompose-codebase-skill-contract-dedrift/05-tests-and-validation.md) complete after every validation and hygiene check passed. |

Validation commands run:

```text
python3 packages/skills/decompose-codebase/scripts/test_validate_output.py
npm ci
npm run build -w make-docs
npm test -w make-docs
bash scripts/check-instruction-routers.sh
npm exec -w make-docs -- vitest run tests/consistency.test.ts
git diff --check
```

## Documentation

### Project

| Path | Description |
| --- | --- |
| [docs/assets/history/2026-04-23-w5-r4-p5-decompose-codebase-skill-contract-dedrift.md](2026-04-23-w5-r4-p5-decompose-codebase-skill-contract-dedrift.md) | History record for the completed Phase 5 validation closeout. |
| [docs/assets/archive/work/2026-04-23-w5-r4-decompose-codebase-skill-contract-dedrift/05-tests-and-validation.md](../archive/work/2026-04-23-w5-r4-decompose-codebase-skill-contract-dedrift/05-tests-and-validation.md) | Phase 5 backlog item with all validation and hygiene tasks marked complete. |

### Developer

None this session.

### User

None this session.

# Standard Skill Layout Code Review

This read-only review covered `skill-paths.ts`, `skill-catalog.ts`, the Skill paths and guards in `planner.ts`, and the changed write/copy/prune paths in `install.ts`. The reviewer did not author those runtime changes. This review did not independently assess the reviewer’s own delivery runner or test edits. It did not run an installed harness or assess human use.

| Finding | Correction read back | Proof |
| --- | --- | --- |
| An unregistered private Skill tree was absent from the ledger-only guard. | `assertStandardSkillLayout` now checks the selected scope’s exact `.make-docs/agentics` path with `lstat`, including an empty directory or dangling link, before selected Skill writes. It preserves content and gives the reviewed adoption route. | Focused path/guard cases in the retained guards log. |
| A custom global native home could evade the unowned-copy guard. | `planDesiredSkillAsset` now guards the exact exposure path and canonical path. It does not derive a custom native home from a fixed directory-name pattern. | Custom-home unowned matching-copy regression in the retained guards log. |
| Two selected global tools could target one noncanonical native directory. | The catalog now refuses that collision before reading/installing payloads. It asks for distinct configured homes or one selected tool. Canonical equality still yields direct use without a duplicate link. | Same-home refusal and canonical-equality cases in the retained guards log. |

The final code read-back confirmed all three corrections. The literal scope/harness matrix matches the accepted project and global paths. Copy checks compare owned hashes and reject extra files or directories before replacing a native tree. No further material issue was found in this bounded scope. The separate adoption/Store owner reported an independent review of that area and 63 passing focused cases; that is complementary evidence, not this reviewer’s own code review.

The first package smoke failure was a stale assertion for `.make-docs/agentics/skills/archive-docs/SKILL.md`. The runtime had emitted the corrected standard path. The smoke script was corrected to its own literal path table and full absence checks. This was a test-maintenance failure, not a demonstrated runtime failure.

The corrected package remains a candidate. Full-suite, isolated delivery, current installed cutover, and public fresh-review gates must use the corrected bytes before final acceptance.

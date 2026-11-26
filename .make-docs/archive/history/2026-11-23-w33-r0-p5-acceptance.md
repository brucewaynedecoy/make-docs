---
title: "W33 R0 P5 Acceptance Closeout"
kind: "history"
status: "completed"
date: "2026-11-23"
client: "T3 Code"
model: "Claude Opus 5.5"
coordinate: "W33 R0 P5"
repo: "make-docs"
branch: "docs/w29-w30-work-store-and-factory"
---

# W33 R0 P5 Acceptance Closeout

## Changes

Proves the W33 R0 command tree and closes the Wave. `--help` on a leaf command, such as `make-docs work item resolve --help`, failed with "`--help` requires a value." in this build, on every old alias path, and in released 2.0.9, because the argv reached the command's own option parser. The CLI now answers `--help` or `-h` after any of the 48 registry commands before any router runs. It prints one plain-words summary, the usage line, the arguments, the options, and short notes, exits 0, and runs no operation, reads no Store, and writes nothing. A help flag that is the value of a flag, such as `--checkpoint -h`, stays that value. Through an old path in the window, the new command's help prints, then the alias notice.

One table in `packages/cli/src/operations/leaf-help-table.ts` holds the help. The registry usage line (`operationCliCommand`) now comes from it, which removes 11 disagreements, and tests check the table against the options each command really reads. The notes from the old command help for `setup store`, `project list`, and `project state` moved into the table, and the dead command-level help branches in `root-operations.ts` are removed.

The owner reviewed the help on 2026-11-23 and accepted it with five changes, all made: every group lists one plain-words line per command with flags only in command help, `project` help is short and plain, `setup` help uses plain words and has a `setup store` line for people and MCP tools for agents, `mcp` help describes the `core` profile in plain words, and read-only commands say only "Changes nothing." The owner confirmed the new PRD 39 R-TOP-4 for command help. `uninstall --help` now says when `--remove-store` deletes the Store and that `<store>/backup/` is kept, and `uninstall --remove-store` no longer says the Store is preserved after it removed it. `naive-uat-validation.md` states the current MCP name rule, template first and then the dogfood copy. Register D-065 records the result. The W33 R0 backlog is completed.

Validation passed: the type check, the build, and 1042 naming-rule, parity, alias, shipped-text, leaf help, CLI, and changed tests in one JSON run (1039 passed, 3 known failures). The full suite has 2858 tests: 2848 passed, 4 failed, and 6 skipped. The 4 failures are the known stdio, sandbox, and load-timeout failures. `validate:defaults` (53), the router check, `check prd`, `project paths validate`, `project doctor check`, and `smoke:pack:local` passed. Automated Implementation Testing and Guided Progress Review are selected and passed. Performance Testing and Unassisted Goal Testing are `not-needed-now`.

## Documentation

### Project

| Path | Description |
| --- | --- |
| [P5 work](../../../docs/work/2026-11-22-w33-r0-command-tree-and-tool-names/05-acceptance.md) | Closes T1–T5 and A12–A15. |
| [Evidence report](../../../docs/work/2026-11-22-w33-r0-command-tree-and-tool-names/evidence.md) | Holds the help fix, the drift tests, the test counts, the captured help, and the owner's review. |
| [W33 R0 index](../../../docs/work/2026-11-22-w33-r0-command-tree-and-tool-names/00-index.md) | Marks the backlog completed. |
| [PRD 39](../../../docs/prd/39-cli-command-model-and-operation-registry.md) | Adds R-TOP-4 for command help and group help. |
| [Register](../../../docs/prd/03-open-questions-and-risk-register.md) | D-065 records the result. Alias removal in 2.4.0 remains. |

### System

| Path | Description |
| --- | --- |
| [Unassisted Goal Testing Typed Validation](../../system/references/naive-uat-validation.md) | States that each MCP tool name is its CLI path with underscores. |

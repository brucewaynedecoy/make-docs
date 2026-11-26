---
title: "W33 R0 P4 Shipped Text and Skills Closeout"
kind: "history"
status: "completed"
date: "2026-11-23"
client: "T3 Code"
model: "Claude Opus 5.5"
coordinate: "W33 R0 P4"
repo: "make-docs"
branch: "docs/w29-w30-work-store-and-factory"
---

# W33 R0 P4 Shipped Text and Skills Closeout

## Changes

Moves shipped text to the W33 R0 command and MCP tool names. Nine template files under `packages/docs/template/` changed first and were copied byte for byte into this repository's `.make-docs/` and `docs/`, and the bundled template was refreshed. The `backlog-review`, `naive-uat`, `factory`, and `preflight` Skills and their installed copies, the root and CLI README files, three guides, and PRDs 00, 07, 21, 25, 38, 39, and 51 now name commands such as `make-docs check prd`, `make-docs backlog cache lookup`, `make-docs work export --quick`, and `make-docs lifecycle <verb>`, and tools such as `backlog_cache_lookup`. The README files list the eleven groups with the exact `make-docs --help` words. PRD 39 gains R-NAME-6, which names the scanned set, the exclusions, and the exact `<!-- make-docs:former-names -->` marker, and moves R-RUN-1 to the group paths. Each changed PRD has a Requirement History entry. The name catalog's R-RUN-1 and R-MCP-PROFILE checks now fail on a former name. A new test scans 316 shipped Markdown files. It reads commands behind environment prefixes, `npx` package specs, and `node .../dist/index.js`, and bare `run <root>` spans, and it fails on a former or unknown command or tool name. Only history sections and the table rows right after the marker may keep former names. History records, archives, plans, designs, backlogs, `docs/assets/project/`, and the decision register keep their names.

The release scripts that P2 broke now use the new commands. `scripts/w22-r1-package-proof.mjs` calls `project move preview|apply`. `scripts/smoke-pack.mjs` checks retired `run` paths by exit code, empty stdout, and one `operation-error` JSON refusal with no `renamedTo`, a contract that holds through P3.

Validation passed: the type check, the new test (11), the name-catalog test (43), the backlog-review Skill test (15), the consistency test, `validate:defaults` (53), the router check, template and dogfood parity, `check prd`, `project paths validate`, and `project doctor check`. The full suite has 2377 tests: 2368 passed, 3 failed, and 6 skipped. The 3 failures are the known stdio and sandbox failures. `smoke:pack:local` passed every local packed check and then failed in the W22 R1 package proof, before its first `project move` call. A build search found that commit `4daaf18f` (W32 R0 P2) stopped setup from finding a moved checkout in a 2.0.5 Store. That defect is outside this phase and needs its own fix. Automated Implementation Testing is selected. Performance Testing, Guided Progress Review, and Unassisted Goal Testing are `not-needed-now`.

## Documentation

### Project

| Path | Description |
| --- | --- |
| [P4 work](../../../docs/work/2026-11-22-w33-r0-command-tree-and-tool-names/04-shipped-text-and-skills.md) | Closes T1–T4, A10, and A11. |
| [Evidence report](../../../docs/work/2026-11-22-w33-r0-command-tree-and-tool-names/evidence.md) | Holds the changed files, the names replaced, the test rules, and the names left on purpose. |
| [PRD 39](../../../docs/prd/39-cli-command-model-and-operation-registry.md) | Adds R-NAME-6 and moves R-RUN-1 to the group paths. |

### Maintainer

| Path | Description |
| --- | --- |
| [CLI/MCP Operation Parity and Permissions](../../../docs/assets/maintainer/cli-mcp-operation-parity-and-permissions.md) | Names the registry groups and current resource tools. |
| [Maintaining Setup and Harness Access](../../../docs/assets/maintainer/cli-maintaining-setup-and-harness-access.md) | Runs `check prd`. |

### User

| Path | Description |
| --- | --- |
| [Managing Installations](../../../docs/assets/user/cli-lifecycle-managing-installations.md) | Names the new tool names and the alias window. |

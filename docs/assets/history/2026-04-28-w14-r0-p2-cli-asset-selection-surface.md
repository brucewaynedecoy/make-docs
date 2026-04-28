---
date: "2026-04-28"
client: "Codex Desktop"
repo: "make-docs"
status: "completed"
coordinate: "W14 R0 P2"
summary: "Removed prompt, template, and reference asset choices from the CLI and wizard surface."
---

# CLI Asset Selection Simplification - Phase 2 CLI Surface

## Changes

Implemented W14 R0 Phase 2 from [the CLI selection surface backlog](../archive/work/2026-04-28-w14-r0-cli-asset-selection-simplification/02-cli-selection-surface.md). The interactive installer no longer asks users whether to install starter prompts, which templates to install, or which reference files to install. The review surface now focuses on the remaining user decisions, and the removed CLI flags are rejected as unknown arguments instead of remaining as compatibility flags.

| Area | Summary |
| --- | --- |
| Wizard prompts | Removed the prompt/template/reference questions from the options flow and removed their review rows. |
| CLI parser and help | Removed parser and help support for `--no-prompts`, `--templates`, and `--references`. |
| CLI tests | Updated wizard and CLI tests for the shorter public surface and explicit rejection of removed flags. |

## Documentation

### Project

| Path | Description |
| --- | --- |
| [packages/cli/src/wizard.ts](../../../packages/cli/src/wizard.ts) | Wizard options and review flow no longer expose prompt, template, or reference asset controls. |
| [packages/cli/src/cli.ts](../../../packages/cli/src/cli.ts) | CLI parser and help no longer support the removed asset-selection flags. |
| [packages/cli/tests/wizard.test.ts](../../../packages/cli/tests/wizard.test.ts) | Wizard tests updated for the reduced option state and review rows. |
| [packages/cli/tests/cli.test.ts](../../../packages/cli/tests/cli.test.ts) | CLI tests assert removed flags are unknown and absent from help output. |
| [packages/cli/src/README.md](../../../packages/cli/src/README.md) | Manual wizard smoke sequence updated to match the simplified options flow. |
| [docs/work/2026-04-28-w14-r0-cli-asset-selection-simplification/02-cli-selection-surface.md](../archive/work/2026-04-28-w14-r0-cli-asset-selection-simplification/02-cli-selection-surface.md) | Phase 2 backlog item implemented by the CLI and wizard surface cleanup. |
| [docs/assets/history/2026-04-28-w14-r0-p2-cli-asset-selection-surface.md](2026-04-28-w14-r0-p2-cli-asset-selection-surface.md) | History record for the completed W14 R0 Phase 2 checkpoint. |

### Developer

None this session.

### User

None this session.

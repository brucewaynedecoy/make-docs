---
title: "W18 R1 P3 Run Playbook Invocation Model"
kind: "history"
status: "completed"
date: "2026-06-29"
client: "Codex Desktop"
coordinate: "W18 R1 P3"
repo: "make-docs"
branch: "make-docs-v2"
summary: "Implemented the generic Run Playbook invocation model."
---

# W18 R1 P3 Run Playbook Invocation Model

## Changes

Implemented `playbook-run-invoke` as a shared TypeScript Playbook operation exposed through CLI and MCP. The invocation model resolves a valid Playbook without requiring plugin packaging, extracts authority/procedure/gate/assist/output intent from the Playbook body and run metadata, creates Make Docs-owned run state, blocks on missing authority or required assist review, pauses at gates unless both caller and Playbook permit unattended continuation, and labels CLI, MCP, plugin, skill, template-sync, and unattended support claims as provisional.

Manual UAT was deferred until W18 R1 is fully complete, per the wave workflow.

Developer-guide coverage decision: `update-existing`. The Run Playbook runner architecture guide, CLI/MCP parity guide, and package maintainer README now describe the implemented invocation primitive, write-gated MCP exposure, provisional support-claim rule, and playbook operation-domain ownership.

User-guide coverage decision: `update-existing`. The Playbooks user guide now names the current operation-level CLI and MCP invocation surfaces while preserving the distinction between deterministic operation commands and future polished plugin/workflow entry points.

PRD coverage decision: `none`. Phase 3 implements the active PRD 29 generic Run Playbook requirements and does not change the requirement surface, risk register, or PRD index.

## Documentation

### Project

| Path | Description |
| --- | --- |
| [../../../work/2026-06-23-w18-r1-playbook-contract-run-playbook/03-run-playbook-invocation-model.md](../../../work/2026-06-23-w18-r1-playbook-contract-run-playbook/03-run-playbook-invocation-model.md) | Marked W18 R1 Phase 3 complete and recorded validation coverage. |
| [../../../../packages/cli/src/README.md](../../../../packages/cli/src/README.md) | Updated the maintainer operation-domain list for Playbook and Playbook packaging domains. |
| [./2026-06-29-w18-r1-p3-run-playbook-invocation-model.md](./2026-06-29-w18-r1-p3-run-playbook-invocation-model.md) | Phase 3 closeout breadcrumb and coverage decisions. |

### Developer

| Path | Description |
| --- | --- |
| [../../library/developer/playbooks-development-runner-architecture.md](../../library/developer/playbooks-development-runner-architecture.md) | Added current maintainer guidance for `playbook-run-invoke`. |
| [../../library/developer/cli-mcp-operation-parity-and-permissions.md](../../library/developer/cli-mcp-operation-parity-and-permissions.md) | Marked Playbook inspection and invocation MCP parity as shipped through shared operation-domain owners. |

### User

| Path | Description |
| --- | --- |
| [../../library/user/playbooks-running-make-docs-workflows.md](../../library/user/playbooks-running-make-docs-workflows.md) | Updated the Run Playbook entry-point guidance with current operation-level CLI and MCP invocation surfaces. |

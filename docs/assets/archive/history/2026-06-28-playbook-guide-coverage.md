---
date: "2026-06-28"
repo: "make-docs"
status: "completed"
summary: "Captured Playbook product and runner architecture guidance as draft user and developer guides."
---

# Playbook Guide Coverage

## Changes

Captured the Playbook discussion as guide coverage with an explicit `both` verdict:

- `user`: created a draft user guide explaining what Playbooks are, how users will run them, and what planned v2 behavior looks like.
- `developer`: created a draft developer guide explaining the Run Playbook operation-domain architecture, runner pipeline, resolver semantics, harness capability mediation, run state, nested runs, plugin boundaries, and parity expectations.

The existing user workflow guide and developer CLI/MCP parity guide were cross-linked to the new Playbook coverage.

## Documentation

### Project

| Path | Description |
| --- | --- |
| [docs/assets/archive/history/2026-06-28-playbook-guide-coverage.md](./2026-06-28-playbook-guide-coverage.md) | History breadcrumb for the Playbook guide coverage pass. |

### Developer

| Path | Description |
| --- | --- |
| [docs/assets/library/developer/playbooks-development-runner-architecture.md](../../library/developer/playbooks-development-runner-architecture.md) | New draft developer guide for the Run Playbook runner architecture and implementation boundaries. |
| [docs/assets/library/developer/cli-mcp-operation-parity-and-permissions.md](../../library/developer/cli-mcp-operation-parity-and-permissions.md) | Added a related-resource link to the new Run Playbook runner architecture guide. |

### User

| Path | Description |
| --- | --- |
| [docs/assets/library/user/playbooks-running-make-docs-workflows.md](../../library/user/playbooks-running-make-docs-workflows.md) | New draft user guide explaining planned Playbook behavior and usage surfaces. |
| [docs/assets/library/user/workflows-how-make-docs-stages-fit-together.md](../../library/user/workflows-how-make-docs-stages-fit-together.md) | Added a related-resource link to the new user Playbooks guide. |

---
title: "Runtime and Global Store"
date: "2026-06-30"
kind: "artifact"
status: "draft"
---

# Runtime and Global Store

This artifact captures the decision to introduce a machine-level global store for Make Docs and the boundary principle that governs what data lives in a project repository versus what lives in that global store. It is a working document, not a design, PRD, plan, or implementation authority. It is a sibling to [playbook-architecture.md](playbook-architecture.md) and [cli-command-reorganization.md](cli-command-reorganization.md); the playbook architecture run state machine consumes the run-state storage decided here.

## Motivation

A repository folder should not host files that are either duplicated in every repository where Make Docs is set up or used primarily by Make Docs itself. Make Docs v2 already acted on this insight by migrating deterministic logic out of per-repo Python scripts and into the CLI. The Playbook run state files, which did not exist at the start of v2, reintroduced the same anti-pattern by writing per-run operational state into each project. The fix is to move machine-local, tool-operational data out of the repository and into a global store created when Make Docs is installed on a system.

## Boundary Principle

Versioned project knowledge stays in the repository. Machine-local, tool-operational, or otherwise-duplicative data goes to the global store. The test for a piece of data is whether it is meaningful project knowledge that should be versioned and shared, or operational state that Make Docs uses to do its job.

| Data | Location | Canonical where |
| --- | --- | --- |
| Structural docs, contracts, references, templates | Project repo | Project repo |
| Playbooks, generated guides, history records | Project repo | Project repo |
| Project install record and config selections | Project `.make-docs/manifest.json` | Project repo |
| Install and directory registry across the machine | Global store | Mirror or index; canonical stays in each project manifest |
| Playbook run state and run evidence | Global store | Global store; relocated, no in-repo copy |
| Operational caches and quick-access data | Global store | Global store |

The two roles of the global store differ in an important way. For installs it is a mirror or index of information whose canonical home remains each project's manifest. For run state it is the relocated canonical store, with no project-side copy.

## Global Store Layout

When Make Docs is installed on a system, it creates `~/.make-docs/` containing at least:

- A global configuration file for machine-level settings.
- A global manifest for tool-level state.
- A SQLite database used by the CLI for the install and directory registry, for Playbook run state and operations, and for other operational data as needs emerge.

## Open Questions

- Project identity: run state and the install registry must key to a project by a stable identifier minted at setup and stored in the project manifest, rather than by directory path, so that clones, moves, and worktrees do not orphan state. The identifier scheme needs definition.
- Database schema versioning: the SQLite schema evolves with Make Docs and needs a migration strategy and a schema version record.
- Concurrency: multiple processes, such as the CLI, the MCP server, and agent sessions, may access the database at once; a concurrency model such as write-ahead logging and the locking discipline need definition.
- Corruption and recovery: the store needs a defined recovery path, and run state that is lost should degrade gracefully rather than blocking execution.
- Portability and export: run state is machine-local; cross-machine handoff is served by explicit export and import of a run rather than by repository storage. The export format is to be defined.
- Backup and uninstall semantics: tool-level backup and uninstall now act on the global store in addition to project-level setup and removal; the interaction needs definition.
- Privacy: the global store records the paths of every project where Make Docs is set up; the implications and any opt-out need consideration.

## Relationship to Other Artifacts

The CLI command reorganization places install management under `setup`, tool self-management under top-level `update` and `uninstall`, and operations under `run`; the global store is what those tool-level commands manage and what the operations read and write. The Playbook architecture run state machine stores run state in this global store and keys it by the stable project identifier defined here.

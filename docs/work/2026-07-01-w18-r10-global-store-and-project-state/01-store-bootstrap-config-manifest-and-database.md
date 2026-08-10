---
title: "Phase 1: Store Bootstrap, Config, Manifest, and Database"
kind: "work"
status: "active"
coordinate: "W18 R10 P1"
source:
  type: "prd"
  path: "docs/prd/38-global-store-and-project-state.md"
---

# Phase 1: Store Bootstrap, Config, Manifest, and Database

## Purpose

Create the machine-level global store so it exists as the storage seam every other phase and every downstream consumer builds on. Without the store, the W18 R7 run-state relocation and the retained work-execution evidence operations have nowhere to write, and R-019 stays blocked.

## Overview

Implement the `~/.make-docs/` bootstrap that creates the global configuration file, the global manifest, and the SQLite database when Make Docs is installed on a system, and give the database its operational spine: a schema version, a migration strategy applied by `update`, a WAL-based concurrency model with a defined locking discipline, and a graceful-recovery path for a missing or corrupt database. The store holds operational state only; it is distinct from any provider-backed asset cache and never weakens the non-optional local bootstrap.

## Source PRD Docs

- [38 Revise Global Store and Project State](../../prd/38-global-store-and-project-state.md)
- [17 Revise System Asset Materialization Contract](../../prd/17-system-asset-materialization-and-local-bootstrap.md)
- [24 Revise Configuration Convention Overlay](../../prd/24-project-configuration-and-convention-overlay.md)

## Stage 1 - Store Bootstrap and Contents

### Tasks

- [x] t1: Implement store bootstrap that creates `~/.make-docs/` with a global configuration file for machine-level settings, a global manifest for tool-level state, and a SQLite database for operational data when Make Docs is installed on a system (R-STORE-1).
- [x] t2: Define the global config surface for machine and tool settings — such as a self-update preference and the marketplace auto-registration opt-in — keeping it structurally and behaviorally separate from project `.make-docs/config.yaml`, which it must never override or be confused with (R-STORE-2, R-KEEP-1).
- [x] t3: Choose and document the global config and global manifest file formats as an implementer decision (D10 open choice), verifying they carry the required machine-level and tool-level content.
- [x] t4: Keep the store distinct from any provider-backed global asset cache: it holds operational state and never shipped template assets, and its presence or absence changes nothing about the non-optional local repository bootstrap or cache pinning (R-STORE-3, R-KEEP-2).

### Acceptance criteria

- Installing Make Docs on a system produces `~/.make-docs/` containing at least the global config, the global manifest, and the SQLite database.
- No code path reads the global config as a source of project presentation configuration, and no code path lets project `.make-docs/config.yaml` set machine-level settings.
- The store never serves, caches, or pins template assets, and local bootstrap behavior is byte-identical with and without the store present.

### Dependencies

- None; this is the foundation phase.

## Stage 2 - Schema Version, Migrations, Concurrency, and Recovery

### Tasks

- [x] t5: Give the database a recorded schema version and a defined migration strategy; `update` applies pending migrations, and a database from a newer schema than the running CLI is detected and handled explicitly rather than read or written blind (R-DB-2, R-LIFE-3).
- [x] t6: Implement the concurrency model with write-ahead logging enabled and a defined locking discipline that tolerates concurrent access from the CLI, the MCP server, and agent sessions (R-DB-3).
- [x] t7: Implement the recovery path: a missing or corrupt database degrades gracefully — repository reads are never blocked, state can be re-established, and the condition is reported as recoverable operational-state loss, never as project-knowledge data loss (R-DB-4).
- [x] t8: Choose and document the concrete SQL schema and table layout and the exact migration and locking implementation as implementer decisions (D10 open choices), verifying they carry the install and directory registry and the project-state model content.

### Acceptance criteria

- The database carries a schema version, `update` applies migrations, and a newer-schema database produces an explicit diagnostic instead of corruption.
- Concurrent access from two or more processes does not corrupt the database or deadlock, under the documented locking discipline with WAL enabled.
- Deleting or corrupting the database leaves every repository read path working and allows state to be re-established.
- The schema, migration, and locking choices are recorded as implementer decisions and are not restated as contract in any PRD or template asset.

### Dependencies

- Stage 1 store bootstrap.

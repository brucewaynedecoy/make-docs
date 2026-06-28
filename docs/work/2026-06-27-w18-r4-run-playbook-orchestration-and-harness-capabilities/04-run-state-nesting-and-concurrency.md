# Phase 4: Run State, Nesting, and Concurrency

## Purpose

Keep long-running, nested, interrupted, and concurrent playbook execution recoverable and auditable.

## Overview

Define Make Docs-owned playbook run state under `.make-docs/runs/playbooks/**`, nested-run records, resume behavior, and concurrency conflict handling.

## Source PRD Docs

- [29 Revise Playbook Contract Run Playbook](../../prd/29-revise-playbook-contract-run-playbook.md)
- [25 Revise CLI Separation and MCP Boundary](../../prd/25-revise-cli-separation-and-mcp-boundary.md)
- [30 Revise Harness Plugin Substrate Workflow Bundles](../../prd/30-revise-harness-plugin-substrate-workflow-bundles.md)

## Stage 1 - Run-State Contract

### Tasks

- [ ] t1: Create `.make-docs/runs/playbooks/<run-id>/state.json` for Make Docs Run Playbook surfaces.
- [ ] t2: Record root/parent run ids, playbook ref, stack, harness, capability snapshot, step/gate, child runs, output-surface claims, status, and resume hints.
- [ ] t3: Treat harness goal or long-running features as assists rather than the Make Docs state source of truth.
- [ ] t4: Permit child playbooks only when the parent playbook explicitly allows them.
- [ ] t5: Permit parallel child runs only with explicit permission and non-overlapping output-surface claims.

### Acceptance criteria

- Interrupted runs can be inspected and resumed from Make Docs-owned state.
- Parallel runs with overlapping output surfaces stop for review or serialize.
- Plugins and workflow bundles reuse the same state and concurrency rules.

### Dependencies

- Phase 2 resolver contract.
- Phase 3 capability contract.

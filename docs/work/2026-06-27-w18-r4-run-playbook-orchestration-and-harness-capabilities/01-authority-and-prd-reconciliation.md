# Phase 1: Authority and PRD Reconciliation

## Purpose

Establish W18 R4 as the active corrective authority before downstream playbook and plugin implementation starts.

## Overview

Reconcile the W18 R4 design into the active PRDs and risk register while preserving existing W18 R1, W18 R2, and W18 R3 ownership boundaries.

## Source PRD Docs

- [29 Revise Playbook Contract Run Playbook](../../prd/29-revise-playbook-contract-run-playbook.md)
- [30 Revise Harness Plugin Substrate Workflow Bundles](../../prd/30-revise-harness-plugin-substrate-workflow-bundles.md)
- [24 Revise Configuration Convention Overlay](../../prd/24-revise-configuration-convention-overlay.md)

## Stage 1 - Authority Reconciliation

### Tasks

- [x] t1: Confirm the W18 R4 design is the active blocker for W18 R1, W18 R2, and W18 R3.
- [x] t2: Update PRD 29 with resolver, capability, run-state, nested-run, and concurrency requirements.
- [x] t3: Update PRD 30 so plugins and workflow bundles delegate to W18 R4 orchestration.
- [x] t4: Update PRD 24 to allow reviewed `harnessCapabilities` records without weakening canonical config boundaries.
- [x] t5: Update supporting PRDs, PRD index, and risk register.

### Acceptance criteria

- PRD 29, PRD 30, and PRD 24 agree on playbook validity, plugin exposure, config authority, and harness capability handling.
- Risk register records the orchestration gap as mitigated by W18 R4 planning.
- No package code is changed in this phase.

### Dependencies

- W18 R4 design.

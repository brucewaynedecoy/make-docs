# Phase 3: Harness Capabilities and Config

## Purpose

Let Run Playbook use harness-specific execution features without assuming every harness provides them.

## Overview

Add the `harnessCapabilities` config contract, capability ids, unknown-capability behavior, and persistence review rules.

## Source PRD Docs

- [24 Revise Configuration Convention Overlay](../../prd/24-project-configuration-and-convention-overlay.md)
- [20 Revise Agent Harness Model Conformance Lab](../../prd/20-agent-harness-conformance-and-support-claims.md)
- [29 Revise Playbook Contract Run Playbook](../../prd/35-run-playbook-state-machine-and-portability.md#requirements)

## Stage 1 - Capability Contract

### Tasks

- [x] t1: Add config schema support for reviewed `harnessCapabilities` records.
- [x] t2: Use canonical capability ids for goal management, long-running runs, resume, parallel runs, subagent delegation, and user gate prompts.
- [x] t3: Require review before persisting newly discovered capability facts.
- [x] t4: Fall back to serial gated execution for optional unknown capabilities.
- [x] t5: Stop with manual review when a required capability is unknown or unsupported.

### Acceptance criteria

- Config labels and capability records do not rename canonical playbook paths, stacks, route ids, or manifest keys.
- Unknown capability behavior is deterministic and test-covered.
- Public support claims still require implementation or conformance evidence.

### Dependencies

- Phase 1 PRD reconciliation.

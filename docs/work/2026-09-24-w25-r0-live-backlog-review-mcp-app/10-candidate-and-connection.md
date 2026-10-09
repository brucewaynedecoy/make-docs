---
title: "Phase 10: Candidate and Connection"
kind: "work"
status: "draft"
coordinate: "W25 R0 P10"
source:
  type: "prd"
  path: "docs/prd/51-backlog-review-and-reporting.md"
---

# Phase 10: Candidate and Connection

## Purpose

Bind the W25 test to an exact package and reviewed installed connection.

## Overview

This phase owns Bear proposal step 6. Connection replacement is separate from access-policy, UI, cleanup, commit, and release decisions.

## Human Experience Outcome

- Promise: The user tests the package and connection that the review packet names.
- Surface and evidence: Exact package hash, command/configuration diff, installed runtime, and rollback packet.
- Limit: A package build does not prove the user can see or use the live app.

## Current Testing Decisions

Qualify one final candidate after P9 scope completion and at most one correction candidate under the proposed limit. Rebuild and retest affected behavior if shipped bytes change. Keep the current candidate until replacement passes.

## Source PRD Docs

- [PRD 51 Backlog Review](../../prd/51-backlog-review-and-reporting.md)
- [PRD 25 access boundary](../../prd/25-typescript-runtime-cli-mcp-operation-boundaries.md)
- [PRD 39 operation registry](../../prd/39-cli-command-model-and-operation-registry.md)

## Source Obligations, Scenarios, And Findings

Bear steps 6 and 15; P9 tested source; W26 R0 P3 required proof; current project connection and retained candidate.

## Stage 1 - Review packet and approved replacement

### Tasks

- [ ] t1: Record package source/name/version, source revision and dirty inputs, lockfile, generated asset and Skill hashes, tarball hash, install path, executable, arguments, working directory, environment, and setup records. (Step 6; evidence: candidate packet.)
- [ ] t2: Show the exact connection/configuration diff, unrelated-setting preservation, rollback diff, trigger, and retained old candidate. Obtain owner connection approval before mutation. (Step 6; gate: named connection approval.)
- [ ] t3: After approval, install and bind only the reviewed candidate. Verify the running host loads those exact bytes. Apply only the approved rollback if needed. (Step 6; evidence: host binding receipt.)

### Acceptance criteria

- The test package, configuration, checkout, and host are exact and repeatable.
- The current candidate remains available until the replacement passes.
- No global installation change, publication, service, or policy change occurs under this connection gate.

### Dependencies

- P9 and W26 R0 P3 required checks pass. A needed global change or third candidate stops for a new proposal.

## Closeout Notes

Keep P10 open if the running host cannot be tied to the reviewed package and connection.

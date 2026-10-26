---
title: "Phase 10: Candidate and Connection"
kind: "work"
status: "complete"
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

- [x] t1: Record package source/name/version, source revision and dirty inputs, lockfile, generated asset and Skill hashes, tarball hash, install path, executable, arguments, working directory, environment, and setup records. (Step 6; evidence: candidate packet.)
- [x] t2: Show the exact connection/configuration diff, unrelated-setting preservation, rollback diff, trigger, and retained old candidate. Obtain owner approval for the revised first-party replacement before mutation. The unsafe intermediate change stopped Codex startup. The owner commented all Make Docs settings, then asked for a safer approach. The candidate setup added a complete managed entry. (Step 6; evidence: P10 packet.)
- [x] t3: After approval, install and bind only the reviewed candidate. Verify the running host loads those exact bytes. Apply only the approved rollback if needed. The restarted Codex app used the saved 2.0.5 entry. Its read-only tools worked. The candidate process path and hash match this packet. (Step 6; evidence: host binding receipt.)

### Acceptance criteria

- The test package, configuration, checkout, and host are exact and repeatable.
- The current candidate remains available until the replacement passes.
- No global installation change, publication, service, or policy change occurs under this connection gate.

### Dependencies

- P9 and W26 R0 P3 required checks pass. A needed global change or third candidate stops for a new proposal.

## Closeout Notes

The [candidate and connection packet](evidence/p10/candidate-and-connection-packet.md) records the isolated 2.0.5 package and the two approved changes. The command-only trial was rolled back. The first migration step then left active tool tables without a parent command. Codex could not start. The owner commented both old Make Docs entries and all tool settings. A disposable test proved this was the cause. The owner asked for a safer approach. The 2.0.5 first-party setup then added one complete managed `make_docs` block. Codex parses the saved config. A direct MCP client loaded the saved candidate and matched the widget bytes. A bad key was denied. The owner restarted Codex. The running app loaded the candidate, reported version 2.0.5, and returned the reference inventory. Its process path and hash match the packet. P10 is closed. The valid key still needs project access intent in P11. Keep the old package and candidate available.

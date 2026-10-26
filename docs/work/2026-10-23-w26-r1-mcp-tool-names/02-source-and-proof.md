---
title: "W26 R1 P2 MCP Source and Proof"
kind: "work"
status: "complete"
coordinate: "W26 R1 P2"
source:
  type: "prd"
  path: "docs/prd/25-typescript-runtime-cli-mcp-operation-boundaries.md"
---

# Phase 2: MCP Source and Proof

## Purpose

Expose the [P1 names](../../plans/2026-10-23-w26-r1-mcp-tool-names/01-name-contract.md) through the one MCP server.

## Overview

The registry, CLI grammar, profiles, resources, Store access, and operation handlers stay in place. Only public MCP name spelling and matching documentation change.

## Human Experience Outcome

- Promise: A caller finds and invokes the right tool with less name noise.
- Surface and evidence: Actual profile tool lists, calls, errors, and migration guide.
- Limit: Local proof does not show the installed `make_docs` entry using this new package.

## Source PRD Docs

- [PRD 39](../../prd/39-cli-command-model-and-operation-registry.md)
- [PRD 25](../../prd/25-typescript-runtime-cli-mcp-operation-boundaries.md)

## Stage 1 - Source And Callers

### Tasks

- [x] t1: Replace the name projection and six hand-defined names with the P1 map.
- [x] t2: Update all current test and source callers that use old names. Keep historical evidence unchanged.
- [x] t3: Update user and maintainer guides with new examples and a migration path.

### Acceptance criteria

- The server lists only the 43 new names across the same profiles.
- Each new call reaches its prior operation or hand-defined handler.
- An old call fails as unknown in the new server.

### Dependencies

- P1 current PRD authority must be written first.

## Stage 2 - Local Proof

### Tasks

- [x] t4: Run name-map, profile, dispatch, TypeScript, build, and package tests.
- [x] t5: Check the public docs and package output for old current-name examples.
- [x] t6: Record the tested source state and the installed-host gate.

### Acceptance criteria

- No duplicate or overlong name exists. Missing map entries fail validation.
- Focused tests pass, or each failure has a cause and next action.
- The handoff separates local proof from installed proof and release approval.

### Dependencies

- An installed connection change requires separate owner approval.

## Local Evidence And Limit

- Source state at local proof: branch `w26-r0-simplified-store-access` at `2bf8233b0a1b3b00e68d7d5b73a96ed46ee77241`, with uncommitted W26 R0 and R1 edits. W26 R0 was later committed as `39b121400fba9dc1e7d9344301305bab6c85605a`. W26 R1 source remains local. No installed entry changed.
- Name check: 37 mapped registry names, 37 unique names, and a 25-character maximum. Six hand-defined names bring the list to 43.
- TypeScript and package build passed. PRD authority and link validation passed with no diagnostics.
- The CLI workspace suite first passed 1,658 tests and failed two retired-ID assertions. Both tests used the old mechanical name rule. The corrected two files passed all 33 tests. A focused set of eight files then passed all 138 tests. The full suite was not rerun after these test-only fixes.
- The rebuilt first-party Skill bundle contains `backlog_snapshot`, `backlog_cache_read`, and `backlog_cache_write`. Its Skill and cache files contain none of their old names.
- Tested source hashes: `packages/cli/src/mcp/tools.ts` SHA-256 `1aaf54e19b94dcc8cfc0ebd63dcb1871477c5e2b774cec3b84ddf0061fde68b0`; `packages/skills/backlog-review/SKILL.md` SHA-256 `4580f398c0b5b614f40326f883a5fd9e7ece29667dd16e208586ec4ba329a6da`; `packages/skills/backlog-review/references/cache.md` SHA-256 `79dfbc129c0461b483be1a8fa11f1ed67d30e7c3b480cdd2f1e908c5dce89ac8`.
- Installed-host proof remains open. The saved `make_docs` entry still starts the installed package. A later package install or host entry change needs separate owner approval.

---
title: "W25 R0 P12 Recovery Cleanup"
kind: "plan"
status: "draft"
coordinate: "W25 R0 P12"
source:
  type: "design"
  path: "docs/designs/2026-09-24-live-backlog-review-mcp-app.md"
---

# W25 R0 P12 Recovery Cleanup

## Purpose

Remove approved recovery residue without losing active dependencies or useful evidence.

## Outcome

One exact file-level list names path, size, purpose, owner, active reference, keep/remove decision, and prerequisite for removal. Only approved paths are removed after the accepted connection no longer needs them.

## Scope

Separate current/replacement candidates, installs, `node_modules`, qualification projects, caches, reports, snapshots, configuration backups, minimal receipts, and files owned by other work. Move retained small evidence to W25 evidence and repair links. Keep installs and scratch data out of the commit. Do not delete `.codex/` by pattern or hide a dependency with an ignore rule.

## Verification

Check the running connection against every proposed deletion. Verify retained evidence links and the exact Git diff after cleanup. Confirm unrelated configuration and files remain intact.

## Dependencies

P11 candidate disposition and separate owner approval of exact cleanup paths. Failed acceptance cannot justify deleting the only rollback candidate.

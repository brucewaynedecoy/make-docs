---
title: "W26 R1 P2 MCP Rename Implementation and Proof"
kind: "plan"
status: "draft"
coordinate: "W26 R1 P2"
---

# W26 R1 P2 MCP Rename Implementation and Proof

## Purpose

Change the public MCP catalog to the [P1 name map](01-name-contract.md) without changing operation behavior.

## Source Boundaries

Update `packages/cli/src/mcp/tools.ts` for the name table and hand-defined tools. Keep `packages/cli/src/mcp/server.ts` registration from the single descriptor list. Update exact name fixtures and call sites in CLI tests. Update user and maintainer guides that show the old names. Do not edit W25 app code or installed host settings.

## Compatibility

This is a public tool-name break. The new package lists only the new names. A host may need to refresh its tool catalog after installing that package. A saved prompt or direct client call using an old name must use the table in P1. A release decision must set the package version and migration notice before publication. No source test counts as an installed-host migration.

## Proof

- Verify the 43-name inventory, one-to-one operation mapping, no collision, and 26-character limit.
- Verify each profile still lists its assigned tools and `all` remains their union.
- Verify a new-name call reaches the same shared operation, input schema, access check, result, and error behavior.
- Verify an old name is absent from discovery and fails as unknown in the new server.
- Run TypeScript, build, focused MCP/registry/profile tests, and the package suite when useful. Record the tested source state.
- Check guide examples and the package copy for old public names. Retain historical evidence files unchanged.

## Gate

W26 R0 Store proof and any installed `make_docs` replacement keep their own approval. This P2 work stops at local source and fixture proof. No push, PR, merge, or installed change is implied.

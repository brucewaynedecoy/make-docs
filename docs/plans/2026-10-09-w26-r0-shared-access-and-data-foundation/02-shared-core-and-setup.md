---
title: "W26 R0 P2 Shared Core and Setup"
kind: "plan"
status: "draft"
coordinate: "W26 R0 P2"
source:
  type: "design"
  path: "docs/designs/2026-10-09-shared-access-and-data-foundation.md"
---

# W26 R0 P2 Shared Core and Setup

## Purpose

Implement only the P1 access design that the owner accepts.

## Outcome

One shared policy and supported setup path serve CLI and MCP. Exact errors survive both surfaces. Existing Store safety and core write/approval gates remain enforced.

## Scope

Apply the approved PRD 25, 38, and 39 redline before source edits. Change the shared policy, adapter context, setup and migration, and agent instructions only within the approved file list. Use existing configuration. Do not add a grant database, service, HTTP server, generic CRUD, or broad tool rename. Keep unrelated configuration and grant limits. Start system-resource edits in `packages/docs/template/`, then dogfood them into this checkout.

## Verification

Run focused policy, registry, setup, migration, Store, CLI, and MCP tests. Check machine-readable errors and generated/package parity where touched. Review deterministic behavior and agent instructions together. Record the source version and exact tested configuration.

## Dependencies

P1 design and access-policy redline are accepted. Before P2 implementation, show the rules enforced by the selected installed connection and their differences from PRDs 25, 38, and 39, using exact host and runtime evidence. P2 work and its finite limit require separate approval. Any exact installed connection replacement also requires separate approval. Stop and revise scope if a larger migration is required.

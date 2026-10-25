---
title: "W27 R0 P2 Setup and Lifecycle"
kind: "plan"
status: "draft"
coordinate: "W27 R0 P2"
---

# W27 R0 P2 Setup and Lifecycle

## Purpose

Build the PRD-approved static Copilot adapter and its safe setup flow.

## Scope

Add the adapter to the source-owned harness inventory. Add detection, review, apply, verify, repeat, drift, repair, rotation, removal, and status to the existing setup path. Write only an exact Make Docs-owned entry after a fresh state check. Preserve unknown fields, other servers, and user-owned names. Keep the CLI and app as separate evidence rows while using one native entry when P1 proves sharing.

## Safety

Show the native path, entry name, command, arguments, environment variable names, requested Store scope, and file delta before apply. Redact the connection key. Bind the active call to current grants and the connection key. Never use a receipt as access proof. Do not auto-repair on status. If safe ownership or key handling fails, stop that method and show the generic MCP fallback.

## Exit Gate

Focused tests prove exact changes, unknown-file preservation, repeat setup, removal, blocked conflicts, and no secret leak. A built package has the same behavior as source. P3 can use a disposable configuration without touching an installed client entry.

---
title: "W27 R0 P1 Contract and Native Probe"
kind: "plan"
status: "draft"
coordinate: "W27 R0 P1"
---

# W27 R0 P1 Contract and Native Probe

## Purpose

Set product authority and verify current Copilot behavior before source edits.

## Scope

Inspect the installed `copilot` CLI and GitHub Copilot app separately. Record version, active configuration home, user and project MCP precedence, folder trust, tool list, skill list, and app inheritance. Inspect with read-only commands first. Use disposable configuration for trial writes. Do not alter a real saved connection during the probe.

## Decisions To Freeze

- The stable static adapter id and one supported MCP method.
- The exact user entry path and JSON fields that Make Docs may own.
- The caller identity and key transport that both clients can present without writing a secret into Git.
- The behavior when `COPILOT_HOME`, a project entry, a duplicate name, or organization policy changes the active source.
- Which platforms have direct proof. Unproved platforms stay `blocked` or `unsupported`.

## PRD Reconciliation

Update [PRD 28](../../prd/28-shared-agentics-installation-and-harness-exposure.md) with the accepted Copilot method and client-specific support rule. Update [PRD 38](../../prd/38-global-store-and-project-state.md) or [PRD 25](../../prd/25-typescript-runtime-cli-mcp-operation-boundaries.md) only if the probe finds a real gap. Add dated W27 R0 history to changed owners. Keep the [risk register](../../prd/03-open-questions-and-risk-register.md) current if the probe finds a new gap.

## Exit Gate

The active PRD states the exact method, ownership, denial, and support labels. A redacted probe record shows which CLI and app facts were observed. The owner can review any product choice that differs from the design before P2 begins.

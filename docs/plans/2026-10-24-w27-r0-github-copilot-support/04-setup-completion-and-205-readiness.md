---
title: "W27 R0 P4 Setup Completion and 2.0.5 Readiness"
kind: "plan"
status: "active"
coordinate: "W27 R0 P4"
---

# W27 R0 P4 Setup Completion and 2.0.5 Readiness

## Purpose

Finish the guided setup experience for selected agent platforms. Give the user a truthful result when project setup succeeds but one selected MCP connection still needs manual work. Prepare the publishable CLI package as version 2.0.5.

## Accepted decision and scope

The owner accepted a partial finish on 2026-10-24. If a selected MCP method cannot be configured, setup may finish independently reviewed project work and other verified harness work. It must name the affected harness as pending. It must not claim that the blocked connection is ready. A pending or unsafe native operation, a failed project write, and a failed Store prerequisite still stop the affected work and use their existing recovery path.

The phase covers the project-state tile, GitHub Copilot platform selection and method routing, per-harness completion state, manual MCP instructions, version 2.0.5, and focused release checks. It does not add a second Copilot app entry or change an installed connection without separate approval.

## Product authority

Update [PRD 39](../../prd/39-cli-command-model-and-operation-registry.md) before source changes. Amend R-SETUP-4 and the setup result requirements. Keep machine-first ordering for every native change. Permit project apply after a reviewed machine result is partial only when no pending or unsafe machine operation affects that project. Add a dated W27 R0 P4 history entry for the old all-or-stop rule.

PRD 28 continues to own the static Copilot adapter and its one CLI MCP entry. No new Store grant is inferred from a printed configuration object. The connection remains pending until the native entry and current grant are verified.

## Setup result and manual path

Use separate result fields for project setup and each selected harness. Show one final summary with project state, each harness state, and the next action for each pending harness. The text and JSON forms must agree. Keep unrelated, unselected native entries unchanged.

For a safe manual MCP path, render the exact entry shape from the same adapter definition that native setup uses. Show the target path, entry name, server type, executable command, arguments, environment names, and needed values. Keep the normal preview redacted. Issue a connection key for manual use only through a reviewed one-time result. Do not put its raw value in a durable receipt, evidence file, or later status output. Recheck the native entry before making the harness current. If a safe key cannot be issued, show the exact blocker and one action instead of a broken snippet. A client or organization policy block cannot be bypassed by printing config text.

## Version and user-facing text

The Project state card keeps its title. Its body uses a short state label such as `Fresh project.`. The platform list labels `GitHub Copilot` and explains that its MCP method manages one Copilot CLI entry. The app may use that entry when its effective source and account policy allow it.

Set the publishable CLI package and lock metadata to `2.0.5`. Keep the private monorepo root version as it is. Build and inspect the package before any publication decision.

## Validation and closeout

Test Codex only, Copilot only, and both selected with MCP. Test one blocked harness with another verified harness and one blocked harness alone. Check project completion, pending status, manual text, key redaction, later verification, repeat setup, and no change to unselected entries. Use a disposable home and Store. Run the build, TypeScript check, focused setup tests, package checks, PRD authority validation, and Human Experience Review. Record platform limits and leave P3 claims bounded to the macOS proof already obtained.

P4 follows P3. It does not reopen W26. Keep P1-P3 and P4 in separate local commits. Push, PR, package publication, and any further installed connection change remain separate approvals.

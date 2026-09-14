---
title: Maintaining Setup and Harness Access
kind: guide
path: cli/setup-maintenance
persona: maintainer
status: draft
order: 25
tags:
  - setup
  - harnesses
  - conformance
  - store
applies-to:
  - cli
  - mcp
  - conformance
related:
  - "conformance-lab-scenario-and-result-contracts.md"
  - "cli-development-local-build-and-install.md"
  - "cli-mcp-operation-parity-and-permissions.md"
  - "../user/cli-setting-up-projects-and-harness-access.md"
  - "../../designs/2026-09-12-unified-setup-and-harness-access.md"
  - "../../plans/2026-09-12-w19-r6-unified-setup-and-harness-access/01-unified-setup-and-harness-access.md"
  - "../../work/2026-09-12-w19-r6-unified-setup-and-harness-access/00-index.md"
---

# Maintaining Setup and Harness Access

## Overview

This guide covers the safe maintenance path for unified setup and native harness access. It also states the proof that a connection method needs before setup can show it as supported.

Adapter code is not support proof. A detected harness is not support proof. A native file at an expected path is not ownership proof.

The current Codex and Claude Code methods are implemented. The version 2 registry has exact real-harness proof for Claude Code MCP and Claude Code direct resource reads. Claude Code permission rules stay unavailable under A35. The Codex methods stay unavailable until a logged-in disposable Codex session passes exact proof. Pi is unsupported.

Normal setup does not yet have an accepted source for the exact harness version, model or provider, and runtime facts. It can keep even a proved tuple unavailable. Do not add a wildcard. Treat this as an open production-selection gap.

## Code and State Map

| Area | Current owner |
| --- | --- |
| Shared setup service and system plan, review, apply, verify, and resume | `packages/cli/src/setup-system.ts` |
| Interactive setup flow | `packages/cli/src/wizard.ts` and `packages/cli/src/cli.ts` |
| Adapter contract and support decision | `packages/cli/src/harness-access/` |
| Operation access and command-rule authority | `packages/cli/src/operations/` |
| Global machine intent | `packages/cli/src/store/global-config.ts` |
| Exact native receipts | `packages/cli/src/store/harness-integration-receipts.ts` |
| Pending system-operation journal | `packages/cli/src/store/harness-system-operations.ts` |
| Project trust limits | `packages/cli/src/config.ts` |

The Store is the only operation and recovery state owner. Do not add a local receipt, a project manifest for system state, or a second recovery engine.

## Adapter Evidence Binding

Each adapter method has an exact identity. The identity includes the adapter, adapter version, harness, connection method, and surface.

`resolveHarnessMethodSupport()` must fail closed. It can use only the validated packaged registry. Tests can provide a temporary registry file through the same loader.

- an admitted adapter and method
- the exact seven-part tuple
- a `conformance-validated` registry status
- a qualifying recorded result
- matching Make Docs version, executable digest, and behavior digest
- matching harness version, model or provider, and runtime
- surfaced caveats

Each failed check returns one typed reason and one useful next action. Local validation alone must not make a method selectable. Keep `publicSupportClaim: false` for each provisional tuple. Only an exact `conformance-validated` entry can make its method selectable.

## Verified Caller and Command Rules

Native access must bind to the exact active Make Docs package binary. `verifyMakeDocsExecutable()` rejects relative paths, symbolic links, non-files, non-executable files, shell programs, package runners, fingerprint changes, and a binary outside the active package.

Command-rule plans must use the operation registry as their authority. The setup system path supplies both the registry list and the registry validator. It must not trust a caller-built rule list.

The registry-derived rules exclude setup, update, uninstall, backup, removal, and shell wrappers. A forged rule, a changed rule, or a project-filtered list must not enter the machine file.

Project-facing review can show the effective project-limited operations. The machine plan and machine verify path must still use the full system rule authority.

## Review and Apply Order

Normal setup must build one exact final review before it writes either scope. Skills are one project-wide selection. Each selected harness method screen can edit that shared selection.

1. Show project state.
2. Select harnesses.
3. Show one method-and-Skills screen for each selected harness.
4. Select resource placement.
5. Render **This computer** and **This project** in one review.
6. Apply and verify the computer operation.
7. Apply and verify the project operation once.
8. Return one final result.

The review must include changes to `~/.make-docs/config.json`. Do not write global intent before the person approves the computer group. An excluded harness means skip. It must preserve the prior machine intent.

Direct `make-docs setup system` starts at the harness method screens. It must not create project files, register a project, or change project Skills.

Non-interactive setup uses `--codex-method <none|mcp|command-rules>` and `--claude-code-method <none|mcp|permission-rules>`. A method flag selects its harness. A matching `--no-*` flag is an error. `--yes` approves the resolved plan. It does not select a method. Dry-run resolves the same plan and suppresses only writes. `--json` and non-TTY output return the canonical version 2 setup result without progress text.

## Pending Journal and Drift Repair

For a reviewed computer write, use this Store order:

1. Plan the exact native change.
2. Get explicit computer approval.
3. Save and read back the pending system operation in the Store.
4. Apply the native change with the saved operation ID, version, and time.
5. Verify the executable and exact native entry again.
6. Record the exact adapter receipt in the Store.
7. Complete the pending operation only after the receipt passes readback.

If the process stops after the native write, keep the operation pending. On repeat, bind the target root, adapter, plan fingerprint, saved ownership receipt, executable, and native entry again. Then finish verify, receipt, and completion. Do not create private resume state in setup code.

A drift repair is safe only when the current Store receipt proves ownership of every exact changed entry. The pending record keeps the exact old receipt and the exact new plan. A missing or changed receipt must block resume.

Unknown, user-owned, malformed, changed, remote, or symbolic-link state must block. Do not adopt it from its path, display name, or similar content.

## Adding Exact Conformance Evidence

Use the setup-access mode in the current conformance lab. Do not use an automated fixture as real-harness proof.

1. Pack the current candidate.
2. Bootstrap one exact tuple with `npm run conformance:kit` and a disposable session root.
3. Run the official harness only in that disposable home.
4. Record the native files, identity, method, Store access, denied access, cleanup, and preserved content.
5. Preview the version 2 result with `npm run conformance:ingest`.
6. Have a maintainer review the result.
7. Use reviewed ingestion to write the result and derive the registry status.
8. Rebuild the package and confirm that its behavior digest stays stable.
9. Confirm that normal installed setup shows support only for the exact proved tuple.
10. Run `npm run conformance:kit -- --cleanup-session <session.json>` and confirm that the managed entry is absent and seeded user content is unchanged.

Repeat this work for every harness and method. Evidence for Codex MCP does not prove Codex rules. Evidence for Codex does not prove Claude Code. A caveat must stay on the exact tuple that produced it.

## Required Validation Gates

Run the smallest focused set during implementation. Run the full gates before a support claim or phase closeout.

```bash
npm test -w packages/cli
npm run build -w packages/cli
npm run test:smoke-harness
npm run smoke:pack:local
node packages/cli/dist/index.js run prd authority validate --target-root .
git diff --check
```

Also run isolated-home exact-file tests for every native format. Prove unrelated native content stays unchanged. Prove a computer success plus project failure. Prove interrupted native writes resume through the Store. Prove the project mutation callback runs once.

Use a temporary home for all CLI and packed checks. Never point a test at a maintainer's real Codex or Claude Code home.

Before a support claim, run the real-harness conformance path for the exact tuple. Then review the installed setup screens for fresh, partial, skipped, blocked, drifted, failed, recovered, and repeat use.

Human Experience Review is separate from automated tests. Record the promise, evidence, observation, conclusion, reviewer, and limit. An agent cannot certify lived ease or confidence.

## Current Release Gate

The P2 production path and automated checks pass. The phase remains open.

Claude Code MCP and direct resource reads have exact current proof. Claude Code permission rules remain safely unavailable under A35. Codex MCP, command rules, and direct resource reads are blocked because the disposable Codex home is not logged in. Normal setup also needs an accepted exact-fact discovery or input path before it can select a proved tuple.

Do not mark P2 complete until the exact-fact input gap, Codex proof, installed terminal review, Human Experience Review, and final closeout checks are complete.

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

The current Codex and Claude Code methods are implemented, but they are not selectable. The required exact real-harness evidence does not exist. Pi is unsupported.

## Code and State Map

| Area | Current owner |
| --- | --- |
| Shared setup state and scope order | `packages/cli/src/setup-state.ts` |
| System plan, review, apply, verify, and resume | `packages/cli/src/setup-system.ts` |
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

`resolveHarnessMethodSupport()` must fail closed. It can consider only evidence loaded from a durable conformance record. The record needs:

- schema version 1
- committed conformance-registry provenance
- a stable evidence ID and record time
- a digest that still matches the record
- the exact adapter and method identity
- a non-empty result ID
- an eligible `pass` or `pass-with-caveats` result
- complete install, discover, invoke, and uninstall assertions

Local validation alone must not make a method selectable. PRD 20 also needs an authoritative tuple-registry result for the exact connection method. The current registry has no such record. Keep `publicSupportClaim: false` and keep the method unavailable or experimental.

## Verified Caller and Command Rules

Native access must bind to the exact active Make Docs package binary. `verifyMakeDocsExecutable()` rejects relative paths, symbolic links, non-files, non-executable files, shell programs, package runners, fingerprint changes, and a binary outside the active package.

Command-rule plans must use the operation registry as their authority. The setup system path supplies both the registry list and the registry validator. It must not trust a caller-built rule list.

The registry-derived rules exclude setup, update, uninstall, backup, removal, and shell wrappers. A forged rule, a changed rule, or a project-filtered list must not enter the machine file.

Project-facing review can show the effective project-limited operations. The machine plan and machine verify path must still use the full system rule authority.

## Review and Apply Order

Normal setup must build one exact final review before it writes either scope.

1. Build the computer plan and the project plan.
2. Render **This computer** and **This project** in one review.
3. Ask for computer approval and project approval as separate decisions.
4. Apply and verify the computer operation.
5. Apply the project operation once.

The review must include changes to `~/.make-docs/config.json`. Do not write global intent before the person approves the computer group. An excluded harness means skip. It must preserve the prior machine intent.

Direct `make-docs setup system` uses only the computer part of this model. It must honor the parsed target root.

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

Use the current conformance lab. Do not use an automated fixture as real-harness proof.

1. Run one official or installed harness for one exact adapter and connection method.
2. Record the install, discovery, invocation, and uninstall evidence.
3. Ingest the result through the conformance result contract.
4. Commit the durable result under the conformance registry through the normal review path.
5. Add the exact connection method to the PRD 20 tuple-registry authority.
6. Load the durable evidence through the adapter evidence loader.
7. Run meta-verification and the full support checks.
8. Confirm that setup shows support only for the proved tuple.

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

The code candidate has passed its independent code review and automated candidate checks. The phase remains open.

Do not mark a method supported until exact real-harness evidence and the PRD 20 tuple entry exist. Do not mark the phase complete until restricted-task proof, installed terminal review, Human Experience Review, and final closeout checks are complete.

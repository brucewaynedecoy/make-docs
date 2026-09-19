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
  - adapters
  - store
applies-to:
  - cli
  - mcp
  - testing
related:
  - "../../designs/2026-09-14-static-harness-adapters-and-conformance-retirement.md"
  - "cli-development-local-build-and-install.md"
  - "cli-mcp-operation-parity-and-permissions.md"
  - "../user/cli-setting-up-projects-and-harness-access.md"
  - "../../designs/2026-09-12-unified-setup-and-harness-access.md"
  - "../../plans/2026-09-12-w19-r6-unified-setup-and-harness-access/01-unified-setup-and-harness-access.md"
  - "../../work/2026-09-12-w19-r6-unified-setup-and-harness-access/00-index.md"
---

# Maintaining Setup and Harness Access

## Overview

This guide covers the safe maintenance path for unified setup and native harness access. It also states the direct proof that a declared static adapter method needs before Make Docs can claim support.

Adapter code is not installed-product proof. A detected harness is not a verified connection. A native file at an expected path is not ownership proof.

Codex and Claude Code are the current static adapters. Codex can declare MCP and bounded verified-executable command rules. Claude Code can declare MCP. Claude Code permission rules remain blocked because the live CLI did not keep the exact allowed command. Pi is not a current adapter.

Provider, model, runtime, scenario, tuple, result-record, registry, and lab-bootstrap data do not control method selection.

## Code and State Map

| Area | Current owner |
| --- | --- |
| Shared setup service and system plan, review, apply, verify, and resume | `packages/cli/src/setup-system.ts` |
| Interactive setup flow | `packages/cli/src/wizard.ts` and `packages/cli/src/cli.ts` |
| Static adapter contract and method decision | `packages/cli/src/harness-access/` |
| Operation access and command-rule authority | `packages/cli/src/operations/` |
| Global machine intent | `packages/cli/src/store/global-config.ts` |
| Exact native receipts | `packages/cli/src/store/harness-integration-receipts.ts` |
| Pending system-operation journal | `packages/cli/src/store/harness-system-operations.ts` |
| Project trust limits | `packages/cli/src/config.ts` |

The Store is the only operation and recovery state owner. Do not add a local receipt, a project manifest for system state, or a second recovery engine.

## Static Adapter Binding

Each adapter has a stable id and name. It declares detection, native paths and methods, owned native entries, allowed Store operations, plan/apply/verify/repair/remove behavior, blockers, and useful next actions.

Production setup reads this source-owned declaration. Tests can exercise the same declaration. They cannot inject a second method inventory.

Each unavailable method returns one typed reason and one useful next action. A direct installed-product failure blocks the support claim. It does not add dynamic eligibility data to setup.

## Verified Caller and Command Rules

Native access must bind to the exact active Make Docs package binary. `verifyMakeDocsExecutable()` rejects relative paths, symbolic links, non-files, non-executable files, shell programs, package runners, fingerprint changes, and a binary outside the active package.

Command-rule plans must use the operation registry as their authority. The setup system path supplies both the registry list and the registry validator. It must not trust a caller-built rule list.

Each Codex rule starts with the verified executable path. It then uses the hidden `--make-docs-harness-caller <base64url-identity>` option before the exact operation prefix. The value uses base64url so the shell sees one plain word. The CLI removes this internal option before it parses the public command. It rejects a missing, repeated, malformed, or misplaced option. If the environment also supplies a caller identity, both identities must match.

Codex command rules must not use `/usr/bin/env`, an environment assignment, or another shell wrapper. MCP entries continue to carry the caller identity in `MAKE_DOCS_HARNESS_CALLER_IDENTITY`.

The implemented Claude permission-rule form starts with the verified executable path. It then uses the hidden `--make-docs-harness-caller-ref <reference>` option before the exact operation prefix. The reference holds the Claude method, adapter version, machine root, and identity digest. It does not hold raw JSON. It grants no access by itself. Runtime checks rebuild the full identity and verify the executable, Store receipt, native rule, and project limit.

Claude permission-rule setup is not selectable. The live Claude Code 2.1.258 check did not pass. A natural request selected the short `make-docs` command from `PATH`. That command did not match the rule. A second request supplied the full allowed command. Claude cut the long reference before the operation name. It then denied the partial command. Keep this method blocked until a shorter safe carrier passes the same live checks.

The registry-derived rules exclude setup, update, uninstall, backup, removal, and shell wrappers. A forged rule, a changed rule, or a project-filtered list must not enter the machine file.

Project-facing review can show the effective project-limited operations. The machine plan and machine verify path must still use the full system rule authority.

The desired-entry check treats the old `/usr/bin/env` Codex form as drift. Replace it only after the Store receipt proves ownership and the user approves the machine change. Preserve all other rule files.

The Claude adapter can also detect an old receipt-owned `/usr/bin/env` permission rule. It can replace only the exact rules in that receipt. It must block on a missing, changed, partial, or user-owned rule set. This repair code stays in place while the method remains blocked.

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

## Adding or Changing a Static Adapter

1. Update the source-owned adapter declaration.
2. Keep its methods, owned native entries, Store operations, blockers, and next actions explicit.
3. Add focused plan, apply, verify, repair, remove, repeat, and config-preservation checks.
4. Pack the current candidate.
5. Run the official harness only in a disposable home.
6. Exercise each declared method through the installed package.
7. Record the native files, caller and method identity, Store access, denied access, cleanup, and preserved user content.
8. Confirm that setup shows only the declared methods.

Repeat this work for every harness and method. Evidence for Codex MCP does not prove Codex rules. Evidence for Codex does not prove Claude Code.

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

For Codex rules, use `codex execpolicy check` on the direct token list. Check the exact allowed prefix, a missing or changed identity, another executable, setup, update, uninstall, and a command joined to unrelated work. Also run the real `zsh -lc` form. The checker can report no direct match for the shell wrapper because Codex splits safe shell scripts before it applies command rules. A live Codex run in a disposable home must prove the actual wrapper path.

Use a disposable machine root for Make Docs setup and packed checks. Never write test config to the maintainer's real Codex or Claude Code home.

Keep the real `HOME` when you start Claude Code. Pass the disposable settings file with `--settings`. Pass an empty MCP file with `--strict-mcp-config`. Use `--bare` and `dontAsk`. Do not copy or link Claude credentials. Stop and ask the user if `ANTHROPIC_API_KEY` is absent.

Before a support claim, exercise the exact declared method through the installed package in a disposable harness home. Then review the installed setup screens for fresh, partial, skipped, blocked, drifted, failed, recovered, and repeat use.

Human Experience Review is separate from automated tests. Record the promise, evidence, observation, conclusion, reviewer, and limit. An agent cannot certify lived ease or confidence.

## Current Release Gate

P2 is superseded. Its useful setup, config, Store, caller, receipt, and recovery work remains a correction input. Its dynamic eligibility gate is not current product authority.

Do not mark W19 R6 complete until P3 removes the dynamic gate and retired assets, direct installed-product checks pass for each shown method, the installed setup matrix passes, Human Experience Review covers all six promises, and every P3 hard close rule passes.

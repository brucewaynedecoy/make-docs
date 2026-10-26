---
title: "P11 Print Correction Candidate"
kind: "work"
status: "draft"
coordinate: "W25 R0 P11"
source:
  type: "work"
  path: "docs/work/2026-09-24-w25-r0-live-backlog-review-mcp-app/11-installed-acceptance.md"
---

# P11 Print Correction Candidate

## Observed fault

On 2026-10-24, the owner pressed Print in the live Codex Backlog Review. No print preview opened. The owner confirmed that the static report prints in a browser. A read-only check of the expanded Codex MCP App found `typeof window.print === "undefined"`. The old button called `window.print()` without checking for that host limit. The live Print check failed. Static print does not pass the live check.

## Correction

When `window.print` is available, Print still calls it. When it is absent, the live button is named **How to print this report**. A click shows this local status message: **Print preview is unavailable here. Ask in chat for a static report, then print it in your browser.** The button does not call a tool, send an agent message, or create a static file. The user must still ask for static output. Print media hides the message.

The upstream edit is in `packages/skills/backlog-review/assets/backlog-review-report.html`. The build made the generated widget files in `packages/cli/src/mcp/widget/static-renderer.js` and `packages/cli/src/mcp/assets/backlog-review-v1.html` and `.ts`. The live button name is in `packages/cli/src/mcp/widget/live-view.ts`. The dogfood copy is `.agents/skills/backlog-review/assets/backlog-review-report.html`. The affected Skill test is `packages/cli/tests/backlog-review-skill.test.ts`.

## Exact candidate

| Item | Value |
| --- | --- |
| Branch and HEAD | `w25-r0-p1-live-delivery-contract` at `93c0ae6389fa345e6ef2ea3da51942cc6ad70279` |
| Version | `2.0.5` |
| Tarball | `/private/tmp/w25-p11-print-candidate-20261024/brucewaynedecoy-make-docs-2.0.5.tgz` |
| Tarball SHA-256 | `d599cb9b5ca8f245fca35cb3ef8943a01bbc9c416ad7bac8287f4da5f1ecc3d2` |
| Isolated executable | `/private/tmp/w25-p11-print-candidate-20261024/installed/node_modules/@brucewaynedecoy/make-docs/dist/index.js` |
| Executable SHA-256 | `4a5f01785c103f58a976003861ccd127bb63fcec6c34d00c856eb3c8092340e2` |
| Widget SHA-256 | `f2083a53912bd5b15fb53a1ed9a36c6d870066fbe91d5a71116e3a4b2b4f5815` |
| Static template SHA-256 | `9f2ecf76606b931782b06f1cb101aa7efe151ddfaf0e2d7fb3d0612babaa655d` |

I made the tarball with `npm pack`. I copied the prior isolated install to a new temporary path. I replaced only its Make Docs package with the extracted new tarball. The dependency tree stayed in the new temporary path. At the time of this packet, the saved Codex entry still pointed to the older P10 candidate. No Store key or installed setting changed during candidate creation.

## Checks and limits

- The CLI build, TypeScript check, generated-widget check, and `git diff --check` passed.
- The affected source run passed 128 tests in three files. The first run found one old CSS text check. I updated that check for the added print notice and reran it.
- A browser host with `window.print` removed showed the new button name and local status message. The page sent no tool call or agent message when clicked.
- A fresh disposable first-party MCP connection launched this candidate. Its UI resource matched the generated widget byte for byte. The access matrix returned `ready`, all four Store failure codes in the intended cases, and `ready` after repair. Each refusal left durable project and Store files unchanged.
- A fresh temporary setup installed the candidate's Backlog Review Skill. Its static template hash matched the upstream file. An explicit static render kept all 76 report records exactly. The chat summary kept the W25 recommendation. No static output appeared before the explicit render command.
- A separate process used the current saved connection identity with the new executable. It reached the Store lock and returned `store-unavailable` in that sandbox. This is not a running-Codex Store result.

This candidate makes the host limit clear. It does not make native print preview available inside Codex. The owner accepted an explicit static report as the print path for this host. The running-host result and other P11 checks remain open.

## Proposed installed change and recovery

The owner later approved this exact command change. `codex mcp list --json` parsed it as an enabled stdio entry with argument `mcp`. On 2026-10-25, the owner approved a further exact command change to the [static icon candidate](static-icon-candidate.md). The saved entry now points to that newer executable. Neither config check proves which executable a running app process loaded or whether the print help appeared in the host. Keep the old package until host checks pass. Do not rotate or remove the Store key by guesswork.

The later static prompt source correction is outside this tarball and these hashes. It needs its own candidate before an installed check.

The candidate is in `/private/tmp`. Keep that path until the installed check and an approved durable install route finish. No commit, push, publication, or release is implied by this packet.

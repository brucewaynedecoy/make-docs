---
title: "P11 Static Prompt Icon Candidate"
kind: "work"
status: "draft"
coordinate: "W25 R0 P11"
source:
  type: "work"
  path: "docs/work/2026-09-24-w25-r0-live-backlog-review-mcp-app/11-installed-acceptance.md"
---

# P11 Static Prompt Icon Candidate

## Owner correction

The owner rejected the first saved-report prompt controls. They used text buttons, repeated help, and showed a prompt box when copy failed. The corrected report uses the live review's two fixed icons as 34-pixel buttons. It shows no helper sentence or prompt box. Each button has an accessible name and tooltip. After a click, the only visible response is `Copied.` or `Copy failed.` for three seconds.

The copy action first tries a synchronous browser copy while the click has user activation. That path uses a short-lived offscreen field. If it fails, the action tries the Clipboard API. Neither path can override a browser that denies all clipboard writes.

## Exact local candidate

| Item | Value |
| --- | --- |
| Branch and HEAD | `w25-r0-p1-live-delivery-contract` at `93c0ae6389fa345e6ef2ea3da51942cc6ad70279` |
| Version | `2.0.5` |
| Tarball | `/private/tmp/w25-p11-static-icon-candidate-20261025/brucewaynedecoy-make-docs-2.0.5.tgz` |
| Tarball SHA-256 | `e6f6d9c01b590f521ad382d9f9d09df5fd2037ddcdf8ab41a0b5aad83deca5d4` |
| Isolated executable | `/private/tmp/w25-p11-static-icon-candidate-20261025/installed/node_modules/@brucewaynedecoy/make-docs/dist/index.js` |
| Executable SHA-256 | `d0f0ab5af9ed03edb721454a8bf1e9d8a1485895d560dcbfaacf8f3008d00e4d` |
| Static template SHA-256 | `bc680e5032d629cc3e76c71039ea40d977449301cc4e8e54a6fc3aac9ce28674` |
| Static guide SHA-256 | `b00f022750c06fe99158fa8f2b009be18410787c6dfd113fd4f2ff7bb82029b2` |

The upstream and dogfood copies have matching hashes. The new tarball's embedded Backlog Review Skill records the same template hash. I extracted the tarball into a new isolated copy of the prior candidate's dependency tree. The executable reports version `2.0.5`.

## Checks

- The CLI build and TypeScript check passed.
- The focused Backlog Review Skill test passed 15 tests.
- The default package checks passed 53 tests.
- PRD authority validation passed across 35 PRDs with no diagnostics.
- `git diff --check` passed.
- A disposable browser rendered the 76-record report. W25 R0 showed two icon-only controls and no prompt field or helper sentence. The [preview](static-icon-preview.png) shows that row.
- Stubbed browser copy calls captured both prompts. Explain named W25 R0, its source record, goals, status, open work, and next step. Work included the saved P11 action.
- The Clipboard API path copied when the browser command was forced to fail. The action returned keyboard focus to the Work button. A forced denial of both paths showed only `Copy failed.` and no prompt box.
- The disposable server received one page request and no request from the action clicks.

The browser checks used stubbed clipboard calls. They did not read the operating system clipboard or prove every browser's clipboard policy. The corrected source has not been tested through the saved Codex entry.

## Saved entry and running process

The owner approved this exact executable. I checked the old and new executable hashes, then changed only the saved `make_docs` command to the path above. I saved the former complete config at `/Users/tylerkneisly/.codex/config.toml.w25-p11-static-icon-backup-20261025` with mode `0600`. A byte comparison showed that replacing the new command with the old one makes the files identical. Both files have mode `0600`.

`codex mcp list --json` parsed the full config. It shows the enabled stdio `make_docs` entry at the new path with argument `mcp`. I did not change the private identity, key, tool settings, or separate entry. A direct MCP client started the new executable and completed initialization. It listed 45 tools, including `backlog_snapshot`, `backlog_cache_read`, `backlog_cache_write`, `backlog_review_open`, and `backlog_review_refresh`.

A read-only process check before the app restart found the older P10 candidate and a global Make Docs process. The owner then quit and reopened Codex. A new process now runs this exact executable. The current `make_docs` tool returned Store status `ready` and accepted a current 76-record review report. The tool wrapper exposed no MCP App tab to this agent, so visible Print guidance, Codex clipboard behavior, and same-chat Work still need host proof. If a later app check fails, restore the complete saved config from the backup and check that Codex parses it before retrying.

No commit, push, publication, or release is implied by this candidate.

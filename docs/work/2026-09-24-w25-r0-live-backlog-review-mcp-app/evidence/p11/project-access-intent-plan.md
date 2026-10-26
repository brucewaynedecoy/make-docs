---
title: "W25 R0 P11 Codex Project Access Plan"
kind: "evidence"
status: "draft"
coordinate: "W25 R0 P11"
source:
  type: "work"
  path: "docs/work/2026-09-24-w25-r0-live-backlog-review-mcp-app/11-installed-acceptance.md"
---

# Codex Project Access Plan

Date: 2026-10-24. State: owner approved and the one-file access change passed. The full P11 acceptance matrix remains open.

## Current state

The running Codex app loaded the reviewed 2.0.5 `make_docs` entry. Its machine setup is current. This project's manifest already selects Codex. Its `.make-docs/config.yaml` grants Claude Code MCP access but has no Codex entry. The valid Codex MCP key therefore returns `store-not-configured` for a Store-backed project call.

A full setup preview with `--project-resources none` planned removal of many managed files. A reconfigure preview that kept Claude Code MCP planned a native Claude Code repair. Neither preview was applied. This plan changes only the missing project access entry.

## Exact change

Use the first-party `planProjectHarnessIntegrationWrite` helper to add one Codex record to [config.yaml](../../../../../.make-docs/config.yaml). The helper keeps the current Claude Code record and all other YAML bytes. `deriveHarnessAccessCeiling("mcp")` returned `store: write`, `project: write`, and `hostConfig: none`. A disposable parse of the planned file passed with both harness records.

```diff
 harnessIntegrations:
   - harness: claude-code
     mode: narrow
     method: mcp
     accessCeiling:
       store: write
       project: write
       hostConfig: none
+  - harness: codex
+    mode: narrow
+    method: mcp
+    accessCeiling:
+      store: write
+      project: write
+      hostConfig: none
```

This grants the verified Codex MCP connection Store read and write access and project read and write access, up to each operation's own limit. It gives no host configuration access. It does not change a saved MCP entry, the Claude Code connection, the manifest, skills, or managed system resources.

## Apply and check

1. Recheck the current config and the candidate command. Stop if either changed.
2. Save a protected copy of the current project config. Apply only the planned YAML change with an atomic file replacement.
3. Parse the new project config. Check that the Claude Code record is unchanged and the Codex record matches the reviewed values.
4. Call `project_status` through the running Codex MCP entry. A normal call must pass. A deliberately invalid key must still return `store-denied`.
5. If the config check or normal call fails before any P11 Store write, restore the exact prior project config. Keep the machine entry and receipt unchanged. Record the result before any other setup step.

## Result

The owner approved this plan. The first-party planner produced only the seven added YAML lines shown above. The prior file hash was `3dc312fb2a95626859429b476b1c6245c177bbefdc420914f4791ba6434685ce`. The applied file hash is `9fc3b33e855ad063bb9aea1a20eacc81724edcdda433f1c602d457c067c9d93b`. The protected copy is `<LOCAL_TEMP>/w25-p10-candidate-20261024/p11-config-backup.yaml` and matches the prior bytes. The parser accepted both the unchanged Claude Code record and the new Codex record.

The running Codex MCP `project_status` call returned `ready`. An invalid key returned `store-denied`. The current deterministic backlog snapshot found 76 records: 52 live and 24 archived. The optional cache lookup returned 76 misses and no hits or rejected rows. No cache write was attempted. The source snapshot reported 62 diagnostics: 48 `BACKLOG-VAL-004`, 10 `BACKLOG-VAL-009`, and 4 `BACKLOG-VAL-008`. These diagnostics need review before a report claim.

This step only adds project access intent. P11 still needs a validated full report before cache write, then live report, connected chat, and human checks. Do not mark those checks complete from this config change.

# P12 Applied Recovery Cleanup

## Authority and exact set

The owner approved removal of the 52 paths in the [exact cleanup proposal](cleanup-proposal.md). The approval was bound to the [private file-level inventory](recovery-inventory.md) with SHA-256 `667f87345707b9357a3fd270a2ff6e499ac5c9240810c70d6b4ff15b58d0444d`. It did not approve a commit, a saved connection change, or removal of any kept path.

Before removal, a fresh scan matched that SHA-256. The proposed roots matched the inventory row by row. The 52 roots held 16,841 files, 12 links, and 237,594,621 logical bytes. No approved root contained a kept root. No approved root was a link. A process check found no running W25 command under an approved root. A read-only open-file check found no matching W25 temporary path.

## Removal

All 52 approved roots were removed. No link was followed. A private local log at `/private/tmp/w25-p12-cleanup-applied-20261026.jsonl` has one success row per root. It has 52 rows and SHA-256 `dbc0058922f4d95c4432de766041dc39ad8aa932374db22a56f7f13fc11f960e`. The full file names and sizes remain in the private inventory and the approved proposal. No temp install, cache, Store file, private config, or live backlog JSON was added to Git.

All 52 approved roots are absent. All 15 kept roots are present. The kept set includes the active 2.0.5 package, two recovery packages, the saved-report proof folder, five older package folders with private config files, and six private config backups. The checkout's `.playwright-mcp/` files, W25 evidence, and the active Codex config were outside the removal list.

## Post-removal checks

- The saved `make_docs` entry remains enabled. It still points to the browser-hash 2.0.5 executable with the `mcp` argument. Two Node MCP processes still run that executable. Its SHA-256 remains `70cb6646974ea938ea457016f11e65f16285bfc53a8e7ff098a80a41cff370cf`.
- The installed package status reports version `2.0.5`. The project Store status is `ready`, with Store access available and no pending recovery action.
- The installed backlog snapshot found 76 work records: 52 live and 24 archived. The installed `backlog_review_open` tool opened the retained 76-record report in Codex. That report is older than the latest W25 source edits. Its live app showed `Status: Needs review`, and its Explain and Work controls stayed disabled for stale facts. This checks the live delivery path and the stale-source guard. It is not a claim that the older report is current.
- All 23 repaired P7 links resolve to the [old file-status record](recovery-link-disposition.md). The former `.codex/w25-recovery/` links are gone from `docs/`. The four new P12 evidence files passed focused path-hygiene validation. The 24 exact temporary-path findings were allowed as approved audit paths.
- `git diff --check` passed. No commit or saved connection change was made.

## Retained dependency and next gate

The active Codex entry still runs from a temporary package folder. The older recovery packages and private backups also remain. The P12 work record says to keep the phase open while active references or unreviewed ownership remain. Do not remove the active folder or private backup files under this approval. A durable install and any saved-entry change need their own reviewed plan and separate owner approval. P13 closeout remains blocked on that disposition.

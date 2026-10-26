# P12 Exact Cleanup Proposal

## State and scope

The owner approved removal of the 52 exact paths in this list, bound to the file-level manifest SHA-256 `667f87345707b9357a3fd270a2ff6e499ac5c9240810c70d6b4ff15b58d0444d`. The file-level manifest is `/private/tmp/w25-p12-file-inventory-20261026.jsonl`. A read-only rescan matched that SHA-256 before removal. The manifest names every file and link in the 67 original roots. The two P12 inventory files created after that scan are outside this list. The [applied result](cleanup-results.md) records the outcome.

The approved list names 52 exact top-level paths with 16,841 files, 12 links, and 237,594,621 logical bytes. The pre-removal check found no new, missing, or changed entry. All 52 paths below were removed. The 15 kept paths remain present.

The P7 recovery files under `./.codex/` are already absent. I repaired all 23 old links to point to their [file-status record](recovery-link-disposition.md). No old P7 byte receipt could be moved. The P10 packet and P11 result record already hold the current hashes, checks, and limits. I found no needed small receipt to copy from the temp roots. I will not put a private config, Store file, temporary install, cache, or live backlog JSON into Git.

## Approved and removed paths

The process scan found no running W25 process under these 52 paths. Four older package roots in this list had no saved `make_docs` command and no running process. They were historical failed or superseded candidates. Their W25 packets keep their names, hashes, and outcomes; their package bytes are no longer available. The 12 links were package `.bin` links with targets inside those four roots. The disposable fault projects and qualification folders held test Store data. They had no live connection reference.

| Exact path removed | Files | Links | Logical bytes |
| --- | ---: | ---: | ---: |
| `/private/tmp/w25-count-proof` | 6 | 0 | 500597 |
| `/private/tmp/w25-count-proof.mjs` | 1 | 0 | 2611 |
| `/private/tmp/w25-p10-npm-cache` | 8 | 0 | 2594107 |
| `/private/tmp/w25-p11-after-restart-report.json` | 1 | 0 | 4170912 |
| `/private/tmp/w25-p11-after-restart-snapshot.json` | 1 | 0 | 6738303 |
| `/private/tmp/w25-p11-cache-rule-proof.mjs` | 1 | 0 | 11331 |
| `/private/tmp/w25-p11-current-key-probe.mjs` | 1 | 0 | 1607 |
| `/private/tmp/w25-p11-current-report.json` | 1 | 0 | 4170938 |
| `/private/tmp/w25-p11-direct-client.mjs` | 1 | 0 | 5156 |
| `/private/tmp/w25-p11-dogfood-guide-before-icon-fix-20261025.md` | 1 | 0 | 10082 |
| `/private/tmp/w25-p11-dogfood-guide-before-static-20261025.md` | 1 | 0 | 5952 |
| `/private/tmp/w25-p11-dogfood-html-before-icon-fix-20261025.html` | 1 | 0 | 62021 |
| `/private/tmp/w25-p11-dogfood-html-before-static-20261025.html` | 1 | 0 | 57952 |
| `/private/tmp/w25-p11-exact-command-switch.mjs` | 1 | 0 | 2977 |
| `/private/tmp/w25-p11-fault-matrix.mjs` | 1 | 0 | 7849 |
| `/private/tmp/w25-p11-fault-root.txt` | 1 | 0 | 70 |
| `/private/tmp/w25-p11-host.ts` | 1 | 0 | 1740 |
| `/private/tmp/w25-p11-live-print-guidance-candidate-20261025` | 4213 | 3 | 47559306 |
| `/private/tmp/w25-p11-no-print-candidate-20261025` | 4213 | 3 | 47554116 |
| `/private/tmp/w25-p11-no-print-static-20261025.html` | 1 | 0 | 4278402 |
| `/private/tmp/w25-p11-npm-cache` | 5 | 0 | 2597630 |
| `/private/tmp/w25-p11-print-candidate-20261024` | 4065 | 3 | 32866019 |
| `/private/tmp/w25-p11-print-static.YR1XhT` | 63 | 0 | 7262199 |
| `/private/tmp/w25-p11-refresh-report-20261025.mjs` | 1 | 0 | 1530 |
| `/private/tmp/w25-p11-snapshot.json` | 1 | 0 | 6737744 |
| `/private/tmp/w25-p11-static-check.mjs` | 1 | 0 | 1260 |
| `/private/tmp/w25-p11-static-copy-host.mjs` | 1 | 0 | 442 |
| `/private/tmp/w25-p11-static-copy-proof-v2.html` | 1 | 0 | 4279083 |
| `/private/tmp/w25-p11-static-copy-proof-v3.html` | 1 | 0 | 4279603 |
| `/private/tmp/w25-p11-static-copy-proof-v4.html` | 1 | 0 | 4279685 |
| `/private/tmp/w25-p11-static-copy-proof.html` | 1 | 0 | 4279043 |
| `/private/tmp/w25-p11-static-icon-candidate-20261025` | 4065 | 3 | 32884527 |
| `/private/tmp/w25-p11-static-icon-mcp-probe-20261025.mjs` | 1 | 0 | 1076 |
| `/private/tmp/w25-p11-static-icon-npm-cache` | 8 | 0 | 5203270 |
| `/private/tmp/w25-p11-static-icon-resource-20261025.html` | 1 | 0 | 469886 |
| `/private/tmp/w25-p11-static-icon-resource-probe-20261025.mjs` | 1 | 0 | 1385 |
| `/private/tmp/w25-p11-static-icon-switch-20261025.mjs` | 1 | 0 | 1926 |
| `/private/tmp/w25-p11-static-root.txt` | 1 | 0 | 40 |
| `/private/tmp/w25-p11-static.JRicmq` | 63 | 0 | 7259029 |
| `/private/tmp/w25-p9-npm-test.log` | 1 | 0 | 344199 |
| `/private/var/folders/x8/zvcz1qzj2v7_pdsktm01v0ww0000gn/T/w25-p11-faults-3R8geA` <!-- make-docs-path-hygiene: allow exact approved W25 cleanup target; the random folder name is part of the reviewed file list --> | 5 | 0 | 374288 |
| `/private/var/folders/x8/zvcz1qzj2v7_pdsktm01v0ww0000gn/T/w25-p11-faults-6i1crM` <!-- make-docs-path-hygiene: allow exact approved W25 cleanup target; the random folder name is part of the reviewed file list --> | 12 | 0 | 814476 |
| `/private/var/folders/x8/zvcz1qzj2v7_pdsktm01v0ww0000gn/T/w25-p11-faults-Hrnyer` <!-- make-docs-path-hygiene: allow exact approved W25 cleanup target; the random folder name is part of the reviewed file list --> | 12 | 0 | 814476 |
| `/private/var/folders/x8/zvcz1qzj2v7_pdsktm01v0ww0000gn/T/w25-p11-faults-N3ejpr` <!-- make-docs-path-hygiene: allow exact approved W25 cleanup target; the random folder name is part of the reviewed file list --> | 11 | 0 | 629198 |
| `/private/var/folders/x8/zvcz1qzj2v7_pdsktm01v0ww0000gn/T/w25-p11-faults-d3exK3` <!-- make-docs-path-hygiene: allow exact approved W25 cleanup target; the random folder name is part of the reviewed file list --> | 5 | 0 | 374288 |
| `/private/var/folders/x8/zvcz1qzj2v7_pdsktm01v0ww0000gn/T/w25-p11-faults-dTW0xD` <!-- make-docs-path-hygiene: allow exact approved W25 cleanup target; the random folder name is part of the reviewed file list --> | 5 | 0 | 574992 |
| `/private/var/folders/x8/zvcz1qzj2v7_pdsktm01v0ww0000gn/T/w25-p11-faults-ghwEuC` <!-- make-docs-path-hygiene: allow exact approved W25 cleanup target; the random folder name is part of the reviewed file list --> | 5 | 0 | 374288 |
| `/private/var/folders/x8/zvcz1qzj2v7_pdsktm01v0ww0000gn/T/w25-p11-faults-htw25X` <!-- make-docs-path-hygiene: allow exact approved W25 cleanup target; the random folder name is part of the reviewed file list --> | 5 | 0 | 374288 |
| `/private/var/folders/x8/zvcz1qzj2v7_pdsktm01v0ww0000gn/T/w25-p11-faults-j6pzXy` <!-- make-docs-path-hygiene: allow exact approved W25 cleanup target; the random folder name is part of the reviewed file list --> | 13 | 0 | 960609 |
| `/private/var/folders/x8/zvcz1qzj2v7_pdsktm01v0ww0000gn/T/w25-p11-faults-oKCsgc` <!-- make-docs-path-hygiene: allow exact approved W25 cleanup target; the random folder name is part of the reviewed file list --> | 5 | 0 | 374288 |
| `/private/var/folders/x8/zvcz1qzj2v7_pdsktm01v0ww0000gn/T/w25-p11-faults-up8TdQ` <!-- make-docs-path-hygiene: allow exact approved W25 cleanup target; the random folder name is part of the reviewed file list --> | 11 | 0 | 629198 |
| `/private/var/folders/x8/zvcz1qzj2v7_pdsktm01v0ww0000gn/T/w25-p11-faults-xkLzSd` <!-- make-docs-path-hygiene: allow exact approved W25 cleanup target; the random folder name is part of the reviewed file list --> | 13 | 0 | 814627 |

## Paths kept

These 15 paths stayed in place. The active package is a live dependency. Older packages and private backups stay until their recovery value is reviewed after a durable install. The exact saved entry remains unchanged. The six private backup rows use `~` for the current user's home; the private manifest retains their exact absolute paths.

| Path kept | Reason |
| --- | --- |
| `~/.codex/config.toml.w25-p10-backup` | Private user config backup |
| `~/.codex/config.toml.w25-p10-migration-backup` | Private user config backup |
| `~/.codex/config.toml.w25-p10-user-commented-backup` | Private user config backup |
| `~/.codex/config.toml.w25-p11-no-print-backup-20261025` | Private user config backup |
| `~/.codex/config.toml.w25-p11-print-backup` | Private user config backup |
| `~/.codex/config.toml.w25-p11-static-icon-backup-20261025` | Private user config backup |
| `/private/tmp/w25-p10-candidate-20261024` | P10 recovery package and private setup files |
| `/private/tmp/w25-p11-action-feedback-candidate-20261025` | Prior saved-command package and private config backup |
| `/private/tmp/w25-p11-browser-hash-candidate-20261025` | Current saved command and two running MCP processes |
| `/private/tmp/w25-p11-clear-action-widget-candidate-20261025` | Contains a private Codex config backup |
| `/private/tmp/w25-p11-clear-actions-candidate-20261025` | Contains a private Codex config backup |
| `/private/tmp/w25-p11-compact-actions-candidate-20261025` | Contains private Codex config files |
| `/private/tmp/w25-p11-layout-candidate-20261025` | Contains a private Codex config backup |
| `/private/tmp/w25-p11-live-controls-candidate-20261025` | Contains a private Codex config backup |
| `/private/tmp/w25-p11-parity-20261026` | Current accepted package and saved-report proof |

## Applied gate and checks

1. The owner approved the 52 exact paths in this list and the manifest SHA-256 above.
2. The pre-removal rescan matched the manifest. The saved `make_docs` entry and two running processes used the kept browser-hash package. No proposed path showed active use.
3. The 52 approved paths were removed. Links were not followed. All 15 kept paths remained. `./.playwright-mcp/`, W25 evidence, and the active Codex config were not targets.
4. The [applied result](cleanup-results.md) records post-removal checks. No commit or connection change was made.

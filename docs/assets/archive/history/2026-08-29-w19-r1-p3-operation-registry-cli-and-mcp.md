---
title: "W19 R1 P3 Operation Registry, CLI, and MCP Closeout"
kind: "history"
status: "completed"
date: "2026-08-29"
client: "Codex Desktop"
coordinate: "W19 R1 P3"
repo: "make-docs"
branch: "make-docs-v2"
summary: "Closed W19 R1 P3 after owner testing, provider repair, and pushed commits."
---

# W19 R1 P3 Operation Registry, CLI, and MCP Closeout

## Changes

W19 R1 P3 established the 24-operation registry, CLI and MCP projections, and native system-resource list and read paths. Decision-authority commit `dddb6d1645ac32e96d95812cb5a3c875052a52c5` fixed the staged legacy-surface rule and finite operation inventory. Implementation commit `93749c9e7d17d4c1cf446d9456499de5fee59635` delivered the accepted phase and its repository-debt repair.

Real-project testing in Party later found that the installed provider used a different identity format than the manifest and that local resource discovery did not apply the provider catalog rules. Repair commit `f2ed36c6dabf65b7707a5a821d467b4704fc62df` aligned the provider identity, excluded prompt routers and stray files, and added full-snapshot coverage across `effective`, `local`, and `installed` origins. The final gate passed the build, the zero-error TypeScript check, 68 test files and 1,201 tests, 48 default-content tests, the package smoke check, and diff checks. The owner completed the naive-style Party tests successfully. All three commits were pushed to `origin/make-docs-v2`.

The normal build order places coverage and history work before the phase commit. This work record and history reconciliation follows the pushed commits because the integration defect appeared after the first owner acceptance and required a bounded repair loop. This record makes that lifecycle straddle explicit.

## Documentation

### Project

| Path | Description |
| --- | --- |
| [P3 work record](../../../work/2026-08-14-w19-r1-make-docs-v2-product-boundary-and-missing-migration-recovery/03-operation-registry-cli-and-mcp.md) | Records the completed phase-entry gate, implementation, repair, validation, acceptance, and pushed commits. |
| [W19 R1 work index](../../../work/2026-08-14-w19-r1-make-docs-v2-product-boundary-and-missing-migration-recovery/00-index.md) | Marks P3 complete and owner-accepted. |

### Developer

None this session.

### User

None this session.

---
date: "2026-06-25"
coordinate: "W10 R2 P2"
branch: "make-docs-v2"
status: "complete"
summary: "Implemented the internal materialization mode model and local bootstrap guardrails."
---

# W10 R2 P2 Materialization Mode and Bootstrap

## Changes

Completed W10 R2 Phase 2 by adding typed system asset materialization modes, keeping public install/sync/reconfigure behavior on the `full-snapshot` default, and proving internally selected non-default modes still materialize the local bootstrap surfaces.

| Area | Summary |
| --- | --- |
| Mode model | Added typed `full-snapshot`, `provider-backed`, and `hybrid-pinned-cache` values plus plan metadata for local bootstrap, deferred system assets, and materialization classes. |
| Default behavior | Routed normal install planning through `full-snapshot` without adding a public CLI flag or changing the default selected docs asset footprint. |
| Local bootstrap | Classified `.make-docs/manifest.json`, `.make-docs/config.yaml`, `.make-docs/*/custom` overlay roots, and active root/docs instruction routers as `always-local-bootstrap` across all modes. |
| Non-default guard | Added focused tests showing internal `provider-backed` and `hybrid-pinned-cache` plans keep root/docs routers and the manifest local while deferring non-bootstrap docs assets. |
| Skills boundary | Preserved the selected-skills planning path, kept agentics/plugin paths outside system asset selection, and retained default-install no-skill-file coverage. |
| Workflow | Deferred UAT/manual testing until the full W10 R2 wave is complete, matching the user-directed build-process departure from the default loop. |

## Documentation

### Project

| Path | Description |
| --- | --- |
| [../../work/2026-06-23-w10-r2-system-asset-materialization-contract/02-materialization-mode-and-bootstrap.md](../../work/2026-06-23-w10-r2-system-asset-materialization-contract/02-materialization-mode-and-bootstrap.md) | Marked Phase 2 tasks complete and added implementation evidence for the mode model, bootstrap classification, and skills/plugin boundary. |

### Developer

None this session. Phase 2 added internal source/test guardrails but no durable maintainer guide changes beyond the work backlog.

### User

None this session. The public CLI behavior and default install output remain unchanged.

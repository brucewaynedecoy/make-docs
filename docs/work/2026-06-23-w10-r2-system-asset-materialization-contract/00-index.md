# System Asset Materialization Contract Work Backlog

> In v2, work backlogs are directories. This file is the `00-index.md` entry point. Phase detail lives in sibling `0N-<phase>.md` files. See `docs/assets/references/wave-model.md` for W/R semantics.

## Purpose

This backlog implements the W10 R2 system asset materialization contract. It turns the accepted design, W10 R2 plan, and PRD 17 revision into dependency-ordered work for materialization mode modeling, local bootstrap guarantees, manifest provenance, provider/cache safety, and validation.

Implementation must keep full-snapshot behavior as the default until provider-backed and hybrid pinned-cache behavior have explicit implementation evidence.

## Phase Map

| Phase | File | Purpose |
| --- | --- | --- |
| 01 | [01-requirements-and-register-reconciliation.md](01-requirements-and-register-reconciliation.md) | Confirm PRD 17 and risk-register scope before source work starts. |
| 02 | [02-materialization-mode-and-bootstrap.md](02-materialization-mode-and-bootstrap.md) | Add typed materialization modes and preserve the non-provider-backed local bootstrap. |
| 03 | [03-provider-cache-manifest-safety.md](03-provider-cache-manifest-safety.md) | Extend manifest provenance and provider/cache safety without changing the default mode. |
| 04 | [04-validation-and-closeout.md](04-validation-and-closeout.md) | Add validation, docs, migration notes, and closeout evidence. |

## Usage Notes

- Start with phase 01 even if the PRD files already exist; the phase gates implementation on current PRD/risk-register state.
- Do not make provider-backed mode the default in this backlog.
- Do not move runtime state into `docs/assets/`.
- Do not fold skills or plugins into system asset materialization.
- Treat TypeScript npm behavior as the implementation source of truth until a Rust parity plan lands.
- Preserve existing manifest, audit, backup, uninstall, and conflict-review safety behavior.

## Intended Follow-On

Route: implementation

Next step: Implement phase 01, then proceed through phases 02 to 04 in order.

Why: The active PRD set now names the system asset materialization requirements; implementation should proceed through the dependency-ordered backlog rather than skipping directly to provider or cache behavior.

Coordinate Handoff: `W10 R2`.

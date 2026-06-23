# Phase 01: Active PRD and Risk Reconciliation

## Purpose

Create the active-set PRD revision for the system asset materialization contract and update only the affected baseline docs and risk-register entries.

## Scope

- Add `docs/prd/17-revise-system-asset-materialization-contract.md`.
- Update `docs/prd/00-index.md`.
- Add targeted `Change Notes` to impacted baseline docs.
- Update existing D/Q/R items in `docs/prd/03-open-questions-and-risk-register.md`.
- Do not archive or regenerate the active PRD namespace.

## PRD Requirements

- The PRD revision must name `full-snapshot`, `provider-backed`, and `hybrid-pinned-cache` as the only accepted system asset materialization modes for this change.
- The full-snapshot path must remain the default and the current npm package behavior until provider-backed behavior has implementation evidence.
- The local bootstrap must be non-optional and never provider-backed.
- System assets must be separated from mutable project artifacts, custom overlays, local config, and selected skill/plugin assets.
- Provider/cache behavior must be pinned by provider identity, provider version or immutable ref, hash algorithm, and hash set.
- Manifest requirements must include materialization mode, source/provenance, logical asset id, local path when materialized, offline expectation, recovery guidance, and selection trigger.
- On-demand materialization must use the existing managed-file conflict and review path.

## Risk Register Strategy

- Update skills-delivery entries to say skills are not system assets under this contract.
- Update package/template risks to say full-snapshot materialization remains the package validation baseline.
- Update remote-source questions to say remote sources are deferred for system assets until protocol, pinning, caching, trust, and confirmation policy are resolved.
- Do not close risk-register items unless this PRD revision fully resolves them; most entries remain open because implementation is still pending.

## Validation

- New PRD doc uses the active change-doc structure: purpose, change type, baseline, rationale, effective requirement, impacted docs, required annotations, and source anchors.
- Baseline annotations link back to `17-revise-system-asset-materialization-contract.md`.
- `docs/prd/00-index.md` lists the new doc in reading order, document map, source anchors, and audience paths.

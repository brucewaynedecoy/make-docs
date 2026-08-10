---
title: "W18 R13 P3: Ingestion and Operator Modes"
kind: "history"
status: "completed"
date: "2026-07-06"
client: "Claude Code"
model: "Fable 5"
coordinate: "W18 R13 P3"
repo: "make-docs"
branch: "make-docs-v2"
summary: "Closed the loop from a driven lab session to the tuple registry: fail-closed ingestion assembles a conformance.result.v1 record with every asserted bar-stage boolean derived solely from that stage's instrument outputs (missing or failed output yields false, no narrative rescue), operator contributions recorded as attestations held structurally apart from measurements, blocked honesty preserved, and the record bound through the one unchanged recordConformanceRunOnRegistryEntry seam — and the discover honesty rule keeps placement from masquerading as recognition, so Codex still cannot reach instrument-confirmed discover (R-021 open, correctly) and the registry stays 0/20. Also landed conformance/operator-modes.md documenting the three first-class modes and the conformance:ingest maintainer tooling; +13 ingestion tests. D-023 and D-024 advanced in place with their closures resting on P4."
---

# W18 R13 P3: Ingestion and Operator Modes

## Changes

This session implemented Phase 3 of [the W18 R13 backlog](../../../work/2026-07-06-w18-r13-conformance-execution-and-lab-session-redesign/03-ingestion-and-operator-modes.md) (all seven tasks t1–t7 across the two stages, per [historical closeout](2026-07-06-w18-r13-conformance-execution-and-lab-session-redesign.md) (retired action-PRD: `docs/prd/43-revise-conformance-scenario-model-and-execution-kit.md`) R-ING-1..2 and [historical closeout](2026-07-06-w18-r13-p4-verification-and-reconciliation.md) (retired action-PRD: `docs/prd/44-revise-conformance-lab-execution-protocol-and-evidence-homes.md`) R-EXEC-1..3 and R-MODE-1..2) and ran the phase documentation passes. The implementation was complete and tested at handoff; this session's work was the documentation coverage passes over it.

### Implementation

| Surface | Summary |
| --- | --- |
| `packages/cli/src/conformance/ingestion.ts` (new) | Fail-closed lab-session ingestion (t1–t4). `ingestConformanceLabSession` reads a session's `evidence/` and `kit/manifest.json` and assembles a `conformance.result.v1` record with every asserted bar-stage boolean derived SOLELY from that stage's instrument outputs, validated against the manifest's expected-evidence table — a missing or failed output yields `false`, no narrative rescue (R-ING-1). Per-stage measurement is deterministic: install confirms only when every install command exited 0 and files were placed under the descriptor-declared roots; invoke only when the driver-saved harness transcript carries every expected marker verbatim; uninstall only when removal commands exited 0, managed outputs were removed with no orphaned managed directories, and no user-authored file was changed or deleted; discover per the honesty rule below. The verdict is derived from the measured bar, never from anything attested (`pass`/`pass-with-caveats`/`unsupported`), records minted `reviewerStatus: unreviewed`. Operator-contributed material — run metadata, network and model-routing attestations (`attestedPreconditionIds`), and the narrative `reason` — is recorded as an ATTESTATION (`ConformanceOperatorAttestations`) held structurally apart from the measurements in the assembly provenance (`ConformanceIngestionAssembly`, schema `conformance.ingestion-provenance.v1`, `CONFORMANCE_INGESTION_PROVENANCE_SCHEMA_VERSION`), and can never flip a `false` measurement true (R-EXEC-2). Blocked honesty holds end to end (t3, R-EXEC-3): an unattested `operator-attestation` precondition or an operator-reported-unmet probeable precondition resolves the session to an honest `blocked` record via `blockedPackagingResultRecord` — `supportClaimUse: none`, all-false bar. The record is validated against the existing result contract; `writeConformanceResultRecord` commits it under `conformance/results/<harness>/`; and `bindIngestedResultToRegistryEntry` is a thin pass-through to the ONE unchanged seam `recordConformanceRunOnRegistryEntry`, so ingestion mutates the registry nowhere and grows no second registry-mutation path (t4, R-ING-2). Key exports: `ingestConformanceLabSession`, `writeConformanceResultRecord`, `bindIngestedResultToRegistryEntry`, `ConformanceOperatorAttestations`, `ConformanceIngestionAssembly`, `CONFORMANCE_INGESTION_PROVENANCE_SCHEMA_VERSION`. |
| The discover honesty rule (the load-bearing point) | `install`/`invoke`/`uninstall` assert directly-measurable facts (Make Docs wrote files; the harness produced a deterministic marker in its own transcript; Make Docs removed its files cleanly). `discover` asserts HARNESS RECOGNITION — that the harness's own listing surface shows the installed package. A directory listing or manifest read of a path Make Docs itself wrote only re-observes PLACEMENT (the fact install already measured); a non-empty `.codex/plugins/` listing proves we wrote files, never that the harness found them. So `measureDiscoverStage` confirms discover only from a genuine harness-listing `command-output` capture (the harness running its own listing command) that is `verified`, exited 0, and names the package id; `directory-listing`/`manifest-read` captures never confirm it alone. Codex today has no verified machine-readable listing command — its listing captures are file surfaces, and its workspace-plugins view is an interactive UI observation that stays narrative context — so a Codex session ingests `discover: false` with a caveat naming exactly why, harness recognition stays unverified (register item R-021), and the tuple honestly does not advance on placement alone. "Files were written" never masquerades as "the harness recognized them." |
| `packages/cli/scripts/conformance-ingest.ts` (new) + `conformance:ingest` npm script | Maintainer tooling only (R-HOME-1; Q-022 revisit seam): registers no operation, adds nothing to the CLI command tree or MCP surface, exactly like `conformance:kit`. |
| `conformance/operator-modes.md` (new) | The three first-class operator modes (t5–t7) as executable protocol content in the maintainer-only `conformance/` directory (PRD 44 R-MODE-2): human-only (the manual fallback), human plus assisting agent (the agent does the deterministic non-harness work; the human drives the real harness and narrates), and agent-multiplexed (an orchestrating agent drives end to end through a terminal-multiplexer tool consumed as an environment capability, never built by Make Docs). All three produce evidence through the same kit → instruments → ingestion path, and each restates the R-EXEC-1 rule (the agent drives, the instruments measure; a driver's claims are never evidence). The parked `CONFORMANCE-RUN-codex-plugin.md` walkthrough was read as raw material for the human-only mode (t6) and left byte-unchanged. Routed from `conformance/README.md` and the `conformance/AGENTS.md`/`CLAUDE.md` router stubs (t7). |
| `packages/cli/tests/conformance-ingestion.test.ts` (new, 13 tests) | Proves the honesty rules: placement-only discover to `false`, recognition-ok to `true`, attestations never flipping a measured boolean, blocked honesty, and receipts round-trip. Suite total: 1060 tests across 62 files (+13 tests, +1 file over P2). |

### Documentation passes

- Developer pass (`update-existing`): the conformance-lab guide's The Execution Kit and Lab Sessions section gained four new subsections — Fail-Closed Ingestion (bar-stage booleans from instruments only, missing or failed to `false` with no narrative rescue, the attestations-vs-measurements assembly-provenance separation, and blocked honesty end to end), The Discover Honesty Rule (placement is not recognition; only a harness-listing `command-output` capture confirms discover; Codex cannot reach instrument-confirmed discover today, R-021), The Recording Seam Is Unchanged (ingestion mutates nothing and binds only through `recordConformanceRunOnRegistryEntry`, with the receipts discipline and the `npm run conformance:ingest` maintainer-only home), and Operator Modes (the three modes with a link to `conformance/operator-modes.md`); the section's Future Coverage was retargeted from Phases 3-4 to Phase 4 only (the enforcing executability check, the four reconciliation greps, and the guide/claim-surface verification). The CLI/MCP parity guide's off-registry paragraph was extended to record `conformance:ingest` as a second deliberately-off-registry maintainer surface alongside `conformance:kit` (Q-022 seam). The packaging and harness-adapters guide was checked and intentionally left unchanged — its scope covers the harness capability descriptors and the lab-facing interrogation block, not ingestion, so an ingestion note there would exceed its scope.
- User pass (`none`): Phase 3 is maintainer lab tooling with no user-facing surface — kit generation and ingestion register nothing and ship nothing, and no CLI or MCP surface changed. The user packaging guide's conformance posture (zero conformance-validated combinations, no scenario has run, honest blocked, "generated plugin" never "Codex-recognized plugin") remains accurate as written and its `support-claim-state` marker still asserts 0/20, so no user guide changes.
- PRD pass (`risk-register-update`): R-028 advanced in place with the full P3 inventory (fail-closed ingestion, the discover honesty rule, the three operator modes doc, and the `conformance:ingest` tooling; +13 tests) and the remaining scope narrowed to Phase 4 (the enforcing D-023 executability check, the four reconciliation greps, the guide/claim-surface verification, the register closures, and the operator handoff). D-023 and D-024 advanced in place — D-023 records that ingestion now exercises the executable-by-construction projection end to end and absorbed the walkthrough's defect notes into the human-only mode; D-024 records that ingestion binds every result record's `transcriptLogPointer` to the two honest homes — with both close bars and statuses unchanged, closure resting with P4. R-021 was left untouched: P3 only makes ingestion honest about why discover cannot confirm for Codex yet, which its P2 note already captures; the item stays open until the maintainer operates the recorded Codex sessions. No new PRD docs, no renumbering, no other register items touched.
- Support-claim surfaces: unchanged — the registry still reads conformance-validated=0/20 and every `support-claim-state` marker continues to assert exactly that. This is the correct posture, not a gap: the discover honesty rule means the Codex plugin tuple cannot reach `conformance-validated` through instrument-confirmed discover (R-021 open), so nothing advanced.

### Validation

| Check | Result |
| --- | --- |
| `npm test -w packages/cli` | Green — 1060 tests across 62 files (+13 ingestion tests, +1 file). |
| `npm run build -w packages/cli` | Green. |
| `npm run validate:defaults` | Green (33/33). |
| `npm run smoke:pack` | Green. |
| `python3 .make-docs/scripts/check_path_hygiene.py` | Clean (0 errors). |
| Changed-file relative-link check | All links resolve. |
| `git diff --check` | Clean. |

## Documentation

### Project

| Path | Description |
| --- | --- |
| [docs/prd/03-open-questions-and-risk-register.md](../../../prd/03-open-questions-and-risk-register.md) | R-028 advanced with the full P3 inventory and Phase-4-only remaining scope; D-023 and D-024 advanced in place with closures resting on P4 (close bars and statuses unchanged); R-021 left untouched. |
| [docs/work/2026-07-06-w18-r13-conformance-execution-and-lab-session-redesign/03-ingestion-and-operator-modes.md](../../../work/2026-07-06-w18-r13-conformance-execution-and-lab-session-redesign/03-ingestion-and-operator-modes.md) | All seven phase tasks checked complete. |

### Developer

| Path | Description |
| --- | --- |
| [docs/assets/library/developer/conformance-lab-scenario-and-result-contracts.md](../../library/developer/conformance-lab-scenario-and-result-contracts.md) | New Fail-Closed Ingestion, The Discover Honesty Rule, The Recording Seam Is Unchanged, and Operator Modes subsections under The Execution Kit and Lab Sessions; Future Coverage retargeted to Phase 4 only; Phase 3 work-phase and operator-modes doc added to `related` frontmatter and Related Resources. |
| [docs/assets/library/developer/cli-mcp-operation-parity-and-permissions.md](../../library/developer/cli-mcp-operation-parity-and-permissions.md) | Off-registry paragraph extended to record `conformance:ingest` as a second deliberately-off-registry maintainer surface alongside `conformance:kit` (Q-022 seam). |

### User

None this session — Phase 3 has no user-facing surface, and the user guides' conformance posture (0/20 conformance-validated, no scenario has run, honest blocked) remains accurate as written.

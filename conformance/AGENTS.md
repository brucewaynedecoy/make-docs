# Conformance Assets Router

> Current scope after W19 R6 P2 implementation: the active version 2 registry has six exact entries and two qualifying Claude Code results. Setup-access sessions use exact seven-part tuples. The four packaging scenarios and version 1 registry remain historical only. The former first-pass suite returns a retirement error.


This repo-root directory holds the support registry, maintainer lab protocol, retired scenario sources, fixtures, and reviewed result records.

- Read [README.md](README.md) first; it documents the formats, the evidence rules, and why this family lives at the repo root (outside `docs/assets/` and outside `packages/`).
- To drive a lab session, read [operator-modes.md](operator-modes.md): generate a per-target kit (`npm run conformance:kit`), drive it through the deterministic instruments, and close with the fail-closed ingest step (`npm run conformance:ingest`). Three modes (human-only, human plus assisting agent, agent-multiplexed) all produce evidence the same way — the agent drives, the instruments measure, and a driver's claims are never evidence (PRD 44 R-EXEC-1). Kit generation and ingestion are maintainer tooling that register no operation and add nothing to the shipped CLI or MCP surface (PRD 43 R-HOME-1).
- Current setup-access evidence uses the exact fields `scenario`, `harness`, `connectionMethod`, `surface`, `scope`, `modelOrProvider`, and `runtime`. Active values are non-empty and never use wildcards or `null`.
- Contract chain: [PRD 20](../docs/prd/20-agent-harness-conformance-and-support-claims.md#support-claim-governance), [PRD 43](../docs/prd/43-conformance-scenario-model-and-execution-kits.md#canonical-conformance-asset-home), and [PRD 44](../docs/prd/44-conformance-lab-sessions-and-evidence.md).
- These are maintainer assets and are not template content. The controlled package build copies only `tuple-registry.json`. It must not copy scenarios, fixtures, results, transcripts, or maintainer tools.
- Never hand-edit a status in `tuple-registry.json`. Statuses derive from recorded evidence. Record setup-access results only through the validated ingestion and recording seam.
- Raw lab-session transcripts and evidence scratch never live under repo-local `.make-docs/`; they stay in the disposable lab-session workspace or the machine-level store's lab area (register item D-024).
- This router itself is maintainer-local project content, not a dogfooded template asset.

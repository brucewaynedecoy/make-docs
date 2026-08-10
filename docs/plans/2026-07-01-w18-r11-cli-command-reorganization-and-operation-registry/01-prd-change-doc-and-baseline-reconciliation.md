# Phase 1: PRD Change Doc and Baseline Reconciliation

## Scope

Author the revision change doc and reconcile the active PRD namespace non-destructively: PRD 39 carries the effective requirement, the genuinely impacted baselines gain change-note backlinks, and the index and living risk register reflect the new lineage.

## Work

- Write `docs/prd/39-cli-command-model-and-operation-registry.md` from `.make-docs/templates/system/prd-change-revision.md` with frontmatter title, `kind: prd`, `status: active`, `coordinate: W18 R11`, and the design as source, carrying the design's R-* requirement IDs (R-SCOPE, R-KEEP, R-TOP, R-BARE, R-SELF, R-REG, R-CORE, R-SURF, R-RUN, R-MIG, R-SEQ, R-TEST) so traceability holds against [the design](../../designs/2026-07-01-cli-command-reorganization-and-operation-registry.md).
- Annotate the impacted baselines per the Baseline Annotation Plan in [00-overview.md](00-overview.md): `Superseded by` in PRD 07 for the public command model, the root command contract and parser taxonomy, and the rebuild guidance around the no-command/`init`/`update` model; `Superseded by` in PRD 25 for the `make-docs operations ...` surface and hand-maintained CLI/MCP mirroring, with the boundary itself preserved; `Superseded by` in PRD 26 for the operation-destination rule per R-SEQ-3; `Enhanced by` in PRD 16 for machine-footprint tool self-management under the preserved remote-execution posture; `Superseded by` in PRD 05 for the install lifecycle command spellings; and `Enhanced by` in PRD 35, PRD 36, and PRD 38 resolving their operation-registry and W18 R11 lineage references to PRD 39.
- Add PRD 39 to `docs/prd/00-index.md` mirroring the PRD 34–38 additions: Document Map row, Reading Order item-3 extension, Source Anchors, audience-path extensions, and an Apply W18 R11 follow-on bullet.
- Update `docs/prd/03-open-questions-and-risk-register.md`: advance R-005, R-016, and D-002 in place with the PRD 39 decisions, and add the hard-cutover/half-migrated-state migration risk at the next available number, verified as R-024. Never renumber existing items.

## Validation

- PRD 39 resolves as the effective requirement by following links from every annotated baseline, no baseline text was deleted or rewritten, and all change notes appear newest-last in existing blocks.
- The index and register changes match the established W18 R6–R10 style and pass link and path-hygiene review.

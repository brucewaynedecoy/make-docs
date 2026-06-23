# Validation and Closeout

## Purpose

Validate and close conformance-lab implementation with evidence that lab assets remain maintainer-only.

## Source PRD Docs

- `docs/prd/20-revise-agent-harness-model-conformance-lab.md`
- `docs/prd/10-packaging-validation-and-release-reference.md`

## Stage 1 - Validation

### Tasks

- [ ] t1: Run relevant CLI tests for touched install, audit, backup, skills, managed-block, or validation surfaces.
- [ ] t2: Run `npm run validate:defaults -w packages/cli` when template or router evidence is touched.
- [ ] t3: Run `npm run smoke:pack` when package proof surfaces are touched.
- [ ] t4: Verify lab assets are absent from shipped template and package copies unless a later accepted design explicitly promotes them.
- [ ] t5: Update support-claim docs and risk entries only with reviewed result evidence.

### Acceptance Criteria

- Lab scenario/result records are reviewable.
- Raw artifacts remain generated local state by default.
- Shipped install/package/template surfaces do not include the lab by accident.

### Dependencies

- Phase 3 adapters and support claims.

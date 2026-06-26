# P2 Manifest Schema and Registry Validation

## Tasks

- [x] t1: Extend `packages/cli/skill-registry.schema.json` for `schemaVersion`, `manifestId`, `displayName`, `purposes`, `sourcePolicy`, supported harnesses, and provenance fields.
- [x] t2: Update `packages/cli/skill-registry.json` to the first-party manifest shape while preserving existing skill names.
- [x] t3: Update `packages/cli/src/skill-registry.ts` so built-in and alternate manifests use one validator.
- [x] t4: Reject duplicate purpose ids, collisions with first-party ids, skill entries that reference missing purposes, and missing source policy metadata.
- [x] t5: Add tests for accepted first-party manifests and malformed manifest fixtures.

## Acceptance Criteria

- The built-in registry remains loadable after schema evolution.
- Third-party purpose ids must be namespaced.
- First-party purpose ids remain canonical and stable.

## Validation Notes

Targeted registry and catalog tests passed before UI or resolver work.

## Implementation Notes

- `packages/cli/skill-registry.schema.json` now describes one manifest shape with `schemaVersion`, `manifestId`, manifest `sourcePolicy`, canonical `purposes`, supported harnesses, and provenance metadata.
- `packages/cli/skill-registry.json` now uses the first-party manifest shape while preserving the seven existing skill names and asset surfaces.
- `packages/cli/src/skill-registry.ts` now exposes one manifest validator for packaged and future alternate manifests, returning manifest metadata while keeping the existing `registry.skills` consumer surface intact.
- Malformed manifests now fail deterministically instead of silently skipping invalid entries for duplicate purpose ids, unnamespaced third-party purpose ids, first-party purpose collisions without first-party provenance, missing purpose references, missing source policy metadata, missing provenance metadata, and invalid first-party local sources.
- First-party remote skill source immutability and digest enforcement remains Phase 3 work so this phase does not break existing explicit first-party skill installs before the source-policy decision is wired into install behavior.

## Coverage Decisions

- Developer guide update: not required in Phase 2 because this is package-internal schema and validator behavior; Phase 3 user-facing alternate-manifest options will require guide coverage.
- User guide update: deferred to Phase 3 when alternate manifest input and purpose-led selection become observable.
- PRD update: not required; PRD 27 already owns the schema, purpose, source policy, and provenance requirements.
- UAT: deferred until the full W17 R1 wave is complete, per the wave instruction.

## Validation Evidence

- `npm test -w packages/cli -- skill-registry --reporter=dot`
- `npm test -w packages/cli -- skill-catalog --reporter=dot`

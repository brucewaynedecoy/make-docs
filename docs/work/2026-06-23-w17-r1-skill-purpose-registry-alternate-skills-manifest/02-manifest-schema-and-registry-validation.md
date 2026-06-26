# P2 Manifest Schema and Registry Validation

## Tasks

- [ ] t1: Extend `packages/cli/skill-registry.schema.json` for `schemaVersion`, `manifestId`, `displayName`, `purposes`, `sourcePolicy`, supported harnesses, and provenance fields.
- [ ] t2: Update `packages/cli/skill-registry.json` to the first-party manifest shape while preserving existing skill names.
- [ ] t3: Update `packages/cli/src/skill-registry.ts` so built-in and alternate manifests use one validator.
- [ ] t4: Reject duplicate purpose ids, collisions with first-party ids, skill entries that reference missing purposes, and missing source policy metadata.
- [ ] t5: Add tests for accepted first-party manifests and malformed manifest fixtures.

## Acceptance Criteria

- The built-in registry remains loadable after schema evolution.
- Third-party purpose ids must be namespaced.
- First-party purpose ids remain canonical and stable.

## Validation Notes

Run targeted registry tests before UI or resolver work.

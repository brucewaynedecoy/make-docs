# P2 Manifest Schema and Registry Validation

## Tasks

- [ ] Extend `packages/cli/skill-registry.schema.json` for `schemaVersion`, `manifestId`, `displayName`, `purposes`, `sourcePolicy`, supported harnesses, and provenance fields.
- [ ] Update `packages/cli/skill-registry.json` to the first-party manifest shape while preserving existing skill names.
- [ ] Update `packages/cli/src/skill-registry.ts` so built-in and alternate manifests use one validator.
- [ ] Reject duplicate purpose ids, collisions with first-party ids, skill entries that reference missing purposes, and missing source policy metadata.
- [ ] Add tests for accepted first-party manifests and malformed manifest fixtures.

## Acceptance Criteria

- The built-in registry remains loadable after schema evolution.
- Third-party purpose ids must be namespaced.
- First-party purpose ids remain canonical and stable.

## Validation Notes

Run targeted registry tests before UI or resolver work.

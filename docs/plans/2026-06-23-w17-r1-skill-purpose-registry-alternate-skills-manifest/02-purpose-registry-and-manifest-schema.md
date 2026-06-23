# Purpose Registry and Manifest Schema

## Objective

Plan the schema and loading changes that let the built-in registry and alternate manifests share one validated manifest shape.

## Required Shape

- `schemaVersion`
- `manifestId`
- `displayName`
- optional manifest description
- `purposes` with stable id, label, description, and optional ordering
- `skills` with stable name, display metadata, purpose ids, source, entry point, install name, assets, supported harnesses, and provenance
- `sourcePolicy` declaring first-party, local, or remote-pinned expectations

## First-Party Purpose IDs

- `archive-management`
- `codebase-decomposition`
- `documentation-maintenance`
- `lifecycle-closeout`
- `workflow-execution`
- `plan-creation`
- `migration-support`

## Implementation Notes

- The physical file may remain `packages/cli/skill-registry.json` during implementation.
- First-party purpose ids are canonical and must not be generated from configured labels.
- Third-party purpose ids must be namespaced, such as `acme.release-readiness`.
- Schema validation must reject unknown first-party collisions and skill entries that reference missing purpose ids.

## Acceptance

- Built-in registry validation supports the new shape.
- Alternate file manifests use the same shape.
- Tests prove malformed purpose ids, duplicate ids, missing purpose references, and missing provenance are rejected with actionable errors.

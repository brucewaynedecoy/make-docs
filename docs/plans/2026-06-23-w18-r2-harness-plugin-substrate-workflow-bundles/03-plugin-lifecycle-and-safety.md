# Plugin Lifecycle and Safety

## Objective

Define plugin selection, install, update, sync, reconfigure, backup, audit, uninstall, migration, and operation-boundary behavior.

## Scope

- Require explicit plugin selection through a future accepted plugin selection flow, effective plugin manifest, or user instruction.
- Preserve no-default plugin behavior for bare install and default sync.
- Keep existing skill selection semantics separate; `--selected-skills all` must not imply any plugin selection.
- Reconcile selected plugins against effective plugin manifests and manifest-owned state during update, sync, and reconfigure.
- Preserve modified managed payloads, modified generated exposures, malformed manifest states, missing-manifest ambiguous states, and user-authored harness plugins through review, backup, skip, or manual-resolution paths.
- Require audit and backup/uninstall flows to consume one reviewed audit snapshot before destructive removal.
- Keep deterministic lifecycle behavior owned by TypeScript CLI/shared-core contracts until a later Rust/MCP parity plan lands.

## Dependencies

- PRD 18 for compatibility classification and migration disposition.
- PRD 25 for CLI/MCP operation contracts.
- PRD 26 for no-scripts migration sequencing.
- PRD 27 for purpose-led skills manifests and canonical ids.
- PRD 28 for generated selected-agentics exposure.

## Acceptance Criteria

- Bare install and default sync write no plugin payloads or exposure files.
- Explicit plugin install can be planned without treating skill-selection flags as plugin-selection flags.
- Audit output classifies plugin payloads and generated exposures separately.
- Backup/uninstall never removes a user-authored harness plugin because its name matches a make-docs plugin id.
- Plugin code does not carry independent implementations of manifest, config, audit, backup, uninstall, generation, validation, or lifecycle routing behavior.

## Validation Notes

Implementation should extend install, audit, backup, uninstall, manifest, migration, dry-run, and noninteractive tests before user-facing plugin selection is considered ready.

# PRD and Risk Reconciliation

## PRD Additions

Create [PRD 30](../../prd/30-revise-harness-plugin-substrate-workflow-bundles.md) as the active owner of the v2 plugin substrate, native harness exposure or plugin-specific adapter requirements, and workflow bundle metadata boundary.

PRD 30 should sit after PRD 29 in the active change-doc sequence because it depends on the shared selected-agentics primitive from PRD 28 and the playbook content/execution boundary from PRD 29.

## Existing PRD Updates

- PRD 00 must add PRD 30 to reading order, document map, source anchors, audience paths, and intended follow-on.
- PRD 03 must update Q-012 and Q-013 without pretending implementation evidence or per-bundle UX is complete.
- PRD 08 must clarify that skills and plugins share the selected-agentics storage primitive but have separate selection and runtime contracts.
- PRD 10 must add package proof expectations for plugin payload inclusion or exclusion, no-default plugin behavior, native exposure or plugin-specific adapters, and support-claim evidence.
- PRD 16 must update the skills/plugin boundary so plugin substrate is no longer wholly unresolved while delivery/runtime implementation remains future work.
- PRD 18 must include plugin payloads, native exposures, copy mirrors, symlink records, and plugin-specific adapters in compatibility classification and migration dispositions.
- PRD 20 must treat plugin, bundle, playbook, harness, and model support claims as conformance-evidence gated.
- PRD 21 must move `agentics/plugins/` from reserved-only language to the selected-plugin payload home governed by PRD 30.
- PRD 24 must keep plugin and bundle config consumption presentation-only.
- PRD 25 must require plugins to call accepted CLI/MCP/shared-core operation contracts instead of owning deterministic lifecycle behavior.
- PRD 27 must preserve canonical purpose ids and effective-manifest routing when future plugin surfaces present skills or purposes.
- PRD 28 must delegate full plugin substrate requirements to PRD 30 while retaining the shared store and W17 R3 native exposure primitive.
- PRD 29 must cite PRD 30 as the plugin substrate owner while keeping playbook validity independent of plugins.

## Risk Register Updates

- Q-012 remains open for implementation proof, but PRD 30 supplies the substrate-level answer: selected plugins use `.make-docs/agentics/plugins/<plugin-id>/`, native harness exposure or plugin-specific adapters, and config after canonical resolution.
- Q-013 remains open for per-bundle UX, but PRD 30 narrows the substrate-level rule: non-maintainer plugins are explicit gated entrypoints, not hidden write channels.
- Q-007 and Q-001 remain open for remote skills delivery and broader source policy; PRD 30 only requires plugin source, provenance, digest/ref, and trust metadata.
- R-012 remains closed; PRD 30 must reinforce that playbooks are content and plugins are optional invocation packages.
- R-014 remains open because plugins, bundles, native exposures, adapters, skills, and MCP tools must not cite deterministic behavior before CLI/shared-core operations exist.

## Acceptance

- The PRD set captures plugin substrate without making plugins default or mandatory for playbooks.
- Existing risk items are updated in place.
- No active PRD implies a plugin may bypass manifest, audit, config, package, CLI/MCP, or conformance contracts.

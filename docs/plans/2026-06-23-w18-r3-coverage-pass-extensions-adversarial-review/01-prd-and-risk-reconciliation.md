# PRD and Risk Reconciliation

## PRD Additions

Create [PRD 14](../../prd/14-lifecycle-workflow-and-coverage-passes.md) as the active owner of the adversarial-review coverage-pass extension.

PRD 31 should sit after PRD 30 because it depends on the plugin substrate and workflow-bundle boundary while keeping adversarial review outside plugin selection by default.

## Existing PRD Updates

- PRD 00 must add PRD 31 to reading order, document map, source anchors, audience paths, and intended follow-on.
- PRD 03 must update existing coverage-pass, persona, restructure, no-scripts, plugin, and source-of-truth risk entries without creating duplicate adversarial-review risks.
- PRD 10 must add package proof expectations for any future adversarial prompt, playbook, plugin, or conformance surface.
- PRD 14 must point the lifecycle workflow foundation at PRD 31 as an optional coverage-pass extension.
- PRD 19 must preserve template-first authoring if adversarial review becomes a shipped prompt, playbook, or package asset.
- PRD 20 must keep adversarial-review support claims evidence-bound.
- PRD 22 must keep persona targeting conditional and schema-backed.
- PRD 24 must keep configured persona labels presentation-only for adversarial candidates.
- PRD 25 must require future CLI/MCP adversarial review surfaces to delegate to accepted operation contracts.
- PRD 29 must keep adversarial-review playbooks valid without plugin packaging if a playbook surface is selected later.
- PRD 30 must keep adversarial review outside plugin selection unless a downstream plan explicitly chooses plugin exposure.

## Risk Register Updates

- D-013 can narrow because the coverage-pass design now matches deferred skill scope and Batch 4 playbook/plugin boundaries.
- D-014 should mention adversarial review as another future shipped asset that must start in the template source if selected.
- R-011 should include adversarial persona targeting as conditional, not a hard-coded persona field expansion.
- R-013 should include adversarial prompt/playbook/plugin asset relocation if such assets are created before the broader restructure.
- R-014 should include adversarial prompt, playbook, plugin, CLI, MCP, and conformance surfaces in the no-scripts sequencing risk.

## Acceptance

- The PRD set captures adversarial review as optional coverage-pass behavior.
- No PRD text makes adversarial review a default gate or default plugin.
- Existing risk entries are updated in place.

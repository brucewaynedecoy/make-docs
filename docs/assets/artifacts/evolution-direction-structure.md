# Evolution Direction - Planned Restructure

## Directory Structure

```md
.make-docs/
├─ agentics/
│  ├─ plugins/ # shared plugins assets (one sub-directory per plugin)
│  │  ├─ AGENTS.md
│  │  └─ CLAUDE.md
│  └─ skills/ # shared skills assets (one sub-directory per skill)
│     ├─ AGENTS.md
│     └─ CLAUDE.md
├─ contracts/
│  ├─ system/
│  │  ├─ AGENTS.md
│  │  ├─ CLAUDE.md
│  │  ├─ commit-messages.md # originally `commit-message-convention.md`
│  │  ├─ designs.md # originally `design-contract.md`
│  │  ├─ guides.md # originally `guide-contract.md`
│  │  ├─ history-entry.md # originally `history-record-contract.md`
│  │  └─ output.md # originally `output-contract.md`
│  └─ custom/
│     ├─ AGENTS.md
│     └─ CLAUDE.md
├─ references/
│  ├─ system/
│  │  ├─ AGENTS.md
│  │  ├─ archive-workflow.md # originally `<agent_harness>/skills/archive-docs/references/archive-workflow.md`
│  │  ├─ CLAUDE.md
│  │  ├─ design-workflow.md
│  │  ├─ execution-workflow.md
│  │  ├─ harness-capability-matrix.md
│  │  ├─ path-and-link-hygiene.md
│  │  ├─ planning-workflow.md
│  │  ├─ prd-change-management.md
│  │  └─ wave-model.md
│  └─ custom/
│     ├─ AGENTS.md
│     └─ CLAUDE.md
├─ scripts/ # eventually, system scripts will become thin wrappers around tool discovery for the make-docs CLI
│  ├─ system/
│  │  ├─ AGENTS.md
│  │  ├─ check_markdown_style.py # originally `<agent_harness>/skills/check_markdown_style.py`
│  │  ├─ CLAUDE.md
│  │  ├─ closeout_history.py
│  │  ├─ closeout_probe.py
│  │  ├─ closeout_validate.py
│  │  ├─ guide_coverage_probe.py
│  │  ├─ probe_environment.py
│  │  ├─ trace_relationships.py
│  │  ├─ validate_output.py
│  │  ├─ validate_paths.py # originally `check_path_hygiene.py`
│  │  ├─ validate_style.py # originally `check_markdown_style.py`
│  │  ├─ work_checkpoint.py # originally `checkpoint.py`
│  │  ├─ work_on_wave.py # originally `work_on_wave_common.py`
│  │  ├─ work_phase_gate.py # originally `phase_gate.py`
│  │  ├─ work_phase_plan.py # originally `phase_plan.py`
│  │  ├─ work_phase_state.py
│  │  ├─ work_resolve_wave.py # originally `resolve_wave.py`
│  │  ├─ work_scope_guard.py # originally `scope_guard.py`
│  │  └─ wave_status.py
│  └─ custom/
│     ├─ AGENTS.md
│     └─ CLAUDE.md
├─ templates/
│  ├─ system/
│  │  ├─ AGENTS.md
│  │  ├─ CLAUDE.md
│  │  ├─ design.md
│  │  ├─ guide-developer.md
│  │  ├─ guide-user.md
│  │  ├─ history-entry.md # originally `history-record.md`
│  │  ├─ plan-overview.md
│  │  ├─ plan-prd.md
│  │  ├─ plan-prd-change.md
│  │  ├─ plan-prd-decompose.md
│  │  ├─ prd-architecture.md
│  │  ├─ prd-change-addition.md
│  │  ├─ prd-change-revision.md
│  │  ├─ prd-glossary.md
│  │  ├─ prd-index.md
│  │  ├─ prd-overview.md
│  │  ├─ prd-reference.md
│  │  ├─ prd-risk-register.md
│  │  ├─ prd-subsystem.md
│  │  ├─ work-index.md
│  │  └─ work-phase.md
│  └─ custom/
│     ├─ AGENTS.md
│     └─ CLAUDE.md
├─ AGENTS.md
├─ CLAUDE.md
├─ config.yaml
└─ manifest.json

docs/
├─ assets/
│  ├─ archive/ # managed/template asset that ONLY gets created when docs (like designs, plans, work backlogs, etc.) are archived
│  │  ├─ AGENTS.md
│  │  └─ CLAUDE.md
│  ├─ artifacts/ # managed/template asset (not created by default); an **optional, zero-contract** home for free-form, pre-design inputs.
│  │  ├─ AGENTS.md
│  │  └─ CLAUDE.md
│  ├─ breadcrumbs/ # managed/template asset for saving and referencing history breadcrumbs (used to be `docs/assets/history/`)
│  │  ├─ AGENTS.md
│  │  └─ CLAUDE.md
│  ├─ guides/
│  │  ├─ AGENTS.md
│  │  └─ CLAUDE.md
│  ├─ playbooks/
│  │  ├─ AGENTS.md
│  │  └─ CLAUDE.md
│  ├─ AGENTS.md
│  └─ CLAUDE.md
├─ designs/
│  ├─ AGENTS.md
│  └─ CLAUDE.md
├─ plans/
│  ├─ AGENTS.md
│  └─ CLAUDE.md
├─ prd/
│  ├─ AGENTS.md
│  └─ CLAUDE.md
└─ work/
   ├─ AGENTS.md
   └─ CLAUDE.md
```

## Example Manifest

### Current State
```json
{
  "schemaVersion": 1,
  "packageName": "make-docs",
  "packageVersion": "0.1.0",
  "updatedAt": "2026-05-06T17:14:58.804Z",
  "profileId": "304b1b93df2839e4",
  "selections": {
    "capabilities": {
      "designs": true,
      "plans": true,
      "prd": true,
      "work": true
    },
    "harnesses": {
      "claude-code": true,
      "codex": true
    },
    "skills": true,
    "skillScope": "project",
    "selectedSkills": [...]
  },
  "effectiveCapabilities": [
    "designs",
    "plans",
    "prd",
    "work"
  ],
  "files": {...},
  "skillFiles": [...]
}
```

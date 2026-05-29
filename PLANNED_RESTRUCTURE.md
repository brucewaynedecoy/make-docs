
```md
.make-docs/
├─ contracts/
│  ├─ system/
│  │  ├─ AGENTS.md
│  │  ├─ CLAUDE.md
│  │  ├─ commit-messages.md # originally "commit-message-convention.md"
│  │  ├─ designs.md # originally "design-contract.md"
│  │  ├─ guides.md # originally "guide-contract.md"
│  │  ├─ history-entry.md # originally "history-record-contract.md"
│  │  └─ output.md # originally "output-contract.md"
│  └─ user/
│     ├─ AGENTS.md
│     └─ CLAUDE.md
├─ references/
│  ├─ system/
│  │  ├─ AGENTS.md
│  │  ├─ CLAUDE.md
│  │  ├─ design-workflow.md
│  │  ├─ execution-workflow.md
│  │  ├─ harness-capability-matrix.md
│  │  ├─ path-and-link-hygiene.md
│  │  ├─ planning-workflow.md
│  │  ├─ prd-change-management.md
│  │  └─ wave-model.md
│  └─ user/
│     ├─ AGENTS.md
│     └─ CLAUDE.md
├─ scripts/
│  ├─ system/
│  │  ├─ AGENTS.md
│  │  ├─ CLAUDE.md
│  │  ├─ closeout_history.py
│  │  ├─ closeout_probe.py
│  │  ├─ closeout_validate.py
│  │  ├─ guide_coverage_probe.py
│  │  ├─ probe_environment.py
│  │  ├─ trace_relationships.py
│  │  ├─ validate_output.py
│  │  ├─ validate_paths.py # originally "check_path_hygiene.py"
│  │  ├─ validate_style.py # originally "check_markdown_style.py"
│  │  ├─ work_checkpoint.py # originally "checkpoint.py"
│  │  ├─ work_on_wave.py # originally "work_on_wave_common.py"
│  │  ├─ work_phase_gate.py # originally "phase_gate.py"
│  │  ├─ work_phase_plan.py # originally "phase_plan.py"
│  │  ├─ work_phase_state.py
│  │  ├─ work_resolve_wave.py # originally "resolve_wave.py"
│  │  ├─ work_scope_guard.py # originally "scope_guard.py"
│  │  └─ wave_status.py
│  └─ user/
│     ├─ AGENTS.md
│     └─ CLAUDE.md
├─ templates/
│  ├─ system/
│  │  ├─ AGENTS.md
│  │  ├─ CLAUDE.md
│  │  ├─ design.md
│  │  ├─ guide-developer.md
│  │  ├─ guide-user.md
│  │  ├─ history-entry.md # originally "history-record.md"
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
│  └─ user/
│     ├─ AGENTS.md
│     └─ CLAUDE.md
├─ AGENTS.md
└─ CLAUDE.md

docs/
├─ archive/
│  ├─ check_markdown_style.py
│  ├─ AGENTS.md
│  └─ CLAUDE.md
├─ contracts/
│  ├─ 2025.07.19 - Data Synchronization/
│  └─ 2025.09.30 - Schema System Redesign/
└─ system/

```

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

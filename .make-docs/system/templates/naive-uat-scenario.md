<!-- Stable template for an Unassisted Goal Testing decision and any activated NUAT scenario. Keep the filename for compatibility. -->

## Testing Decision

| Field | Value |
| --- | --- |
| Testing Type | Unassisted Goal Testing |
| Decision Informed | {{CURRENT_PRODUCT_RELEASE_OR_HUMAN_EXPERIENCE_DECISION}} |
| Reason Now | {{ACTIVATION_OR_NOT_NEEDED_NOW_REASON}} |
| Product Maturity | {{RELEVANT_PRODUCT_STATE}} |
| Scope | {{PRODUCT_PLATFORM_AUDIENCE_AND_SUPPORT_SCOPE}} |
| Executor | {{QUALIFIED_EXECUTOR_OR_NONE}} |
| Gate Effect | {{ADVISORY_OR_EXPLICIT_BLOCKING_EFFECT}} |
| Effort Budget | {{FINITE_RUN_AND_CORRECTION_LIMIT}} |
| Stop Condition | {{FINITE_STOP_RULE}} |
| Evidence Retained | {{EVIDENCE_NEEDED_FOR_THE_DECISION}} |
| Rerun Trigger | {{MATERIAL_CHANGE_OR_EXPLICIT_AUTHORITY}} |
| Result | {{NOT_NEEDED_NOW_OR_RUN_RESULT}} |

Use `not-needed-now` without a scenario when no current decision justifies a run. Record the reason and applicable evidence. Do not create an obligation unless an accepted future outcome remains owed.

### NUAT-### {{TITLE}}

#### Operator View

| Field | Value |
| --- | --- |
| Scenario ID | `NUAT-###` |
| Scenario Version | `{{SCENARIO_VERSION}}` |
| Title | {{TITLE}} |
| User Goal | {{REAL_WORLD_GOAL}} |
| Source Requirements | {{PRD_LINKS_AND_ANCHORS}} |
| Target User | {{INTENDED_AUDIENCE}} |
| Current Uncertainty | {{MATERIAL_CURRENT_QUESTION}} |
| Selected Persona | {{ELIGIBLE_PERSONA_OR_DEFAULT_USER}} |
| Supported Scope | {{PLATFORM_LOCALE_INPUT_ACCESSIBILITY_ACCOUNT_NETWORK_SCOPE}} |
| Product Build And Environment | {{REPRODUCIBLE_NORMALLY_CONSUMABLE_PRODUCT_IDENTITY}} |
| Starting State | {{VISIBLE_ACCOUNT_CONTENT_PERMISSIONS_ENVIRONMENT}} |
| Public Resources | {{ALLOWED_PUBLIC_OR_REALISTIC_RESOURCES}} |
| Prohibited Context | {{PRIVATE_CONTEXT_AND_HIDDEN_ROUTE_GUIDANCE}} |
| Tester Prompt | {{GOAL_ORIENTED_TESTER_PACKET_SUMMARY}} |
| Operator Success Outcomes | {{OPERATOR_ONLY_EVALUATION_CONDITIONS}} |
| Setup | {{ISOLATION_QUALIFICATION_CONSENT_CAPTURE_READINESS}} |
| Teardown | {{CLEANUP_REDACTION_RESTORATION}} |
| Evidence Requirements | {{EVIDENCE_NEEDED_FOR_THE_CURRENT_DECISION}} |
| Severity Rules | {{BASE_OR_PROJECT_SPECIFIC_RULE}} |
| Finding Route | {{OWNING_PRD_WORK_AND_GATE_ROUTE}} |

#### Tester Packet

> This packet is visible to the executor. Do not leak operator-only setup, requirement IDs, hidden steps, expected answers, or success criteria.

- Situation: {{REALISTIC_SITUATION}}
- Goal: {{TESTER_VISIBLE_GOAL}}
- Visible starting state: {{VISIBLE_STARTING_STATE_ONLY}}
- Allowed public resources: {{PUBLIC_OR_REALISTIC_HELP_ONLY}}
- Genuine constraints and safety notes: {{PUBLICLY_SHAREABLE_CONSTRAINTS}}
- Consent and capture notice: {{TESTER_VISIBLE_CONSENT_NOTICE}}
- Tester-owned teardown steps: {{TESTER_OWNED_CLEANUP_ONLY}}

#### Run Record Checklist

- `run_id`
- `scenario_ref` with ID, version, and source digest
- `selected_persona` / `persona_primitive` / `persona_resolution`
- `executor_qualification` / `isolation_evidence`
- `evidence_root`
- `work_coordinate`
- `product_build` / `environment` / `support_scope`
- `public_resources_used`
- `interventions`
- `result`
- `observations`
- `interaction_evidence` / `visual_evidence` / `accessibility_evidence`
- `finding_ids`
- `reproduction`
- `evidence_refs`
- `review`

#### Finding Expectations

Record observed behavior, expected human outcome, severity, reproducibility, support scope, evidence, source requirement or promise, owner, and disposition.

#### Notes

- Keep this scenario in the owning PRD. Do not create a second canonical copy in work or history.
- Increment `scenario_version` for a material change to the same goal.
- Use a new `NUAT-###` only for a materially different goal, audience, support claim, or risk.
- Keep Persona-specific packets, runs, findings, and approved evidence under `docs/assets/<persona-slug>/testing/`.
- Do not store Unassisted Goal Testing evidence under `.make-docs/archive/` or `docs/artifacts/`.
- Keep the stable filename and `NUAT-###` identity for compatibility.

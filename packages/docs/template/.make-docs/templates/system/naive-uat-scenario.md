<!-- Canonical PRD subsection template for one naive-UAT scenario. Insert into the owning PRD under `## Naive UAT Scenarios`. -->

### NUAT-### {{TITLE}}

#### Operator View

| Field | Value |
| --- | --- |
| Scenario ID | `NUAT-###` |
| Scenario Version | `{{SCENARIO_VERSION}}` |
| Title | {{TITLE}} |
| User Goal | {{REAL_WORLD_GOAL}} |
| Source Requirements | {{PRD_LINKS_AND_ANCHORS}} |
| Target User | {{EXTERNAL_AUDIENCE}} |
| Activation Coordinate | {{FIRST_SAFE_OBSERVABLE_COORDINATE}} |
| Future Trigger | {{ACTIVE_OR_TRIGGER}} |
| Obligation Ref | {{O_LINK_OR_NONE}} |
| Supported Scope | {{PLATFORM_LOCALE_INPUT_ACCESSIBILITY_ACCOUNT_NETWORK_SCOPE}} |
| Installed Build Identity | {{BUILD_PACKAGE_DIGEST_RULE}} |
| Starting State | {{VISIBLE_ACCOUNT_CONTENT_PERMISSIONS_ENVIRONMENT}} |
| Public Resources | {{ALLOWED_USER_FACING_RESOURCES}} |
| Prohibited Context | {{PRIVATE_CONTEXT_AND_SHORTCUTS}} |
| Tester Prompt | {{GOAL_ORIENTED_TESTER_PACKET_SUMMARY}} |
| Operator Success Outcomes | {{OPERATOR_ONLY_EVALUATION_CONDITIONS}} |
| Setup | {{ISOLATION_CONSENT_CAPTURE_READINESS}} |
| Teardown | {{CLEANUP_REDACTION_RESTORATION}} |
| Evidence Requirements | {{INTERACTION_VISUAL_ACCESSIBILITY_COMPLETION_EVIDENCE}} |
| Severity Rules | {{BASE_OR_PROJECT_SPECIFIC_RULE}} |
| Finding Route | {{OWNING_PRD_WORK_AND_GATE_ROUTE}} |

#### Tester Packet

> This packet is the tester-visible view. Do not leak operator-only setup, requirement IDs, hidden steps, expected answers, or success criteria.

- Situation: {{REALISTIC_SITUATION}}
- Goal: {{TESTER_VISIBLE_GOAL}}
- Visible starting state: {{VISIBLE_STARTING_STATE_ONLY}}
- Allowed public resources: {{USER_FACING_HELP_ONLY}}
- Genuine constraints and safety notes: {{PUBLICLY_SHAREABLE_CONSTRAINTS}}
- Consent / capture notice: {{TESTER_VISIBLE_CONSENT_NOTICE}}
- Tester-owned teardown steps: {{TESTER_OWNED_CLEANUP_ONLY}}

#### Run Record Checklist

- `run_id`
- `scenario_ref` (ID, version, source digest)
- `work_coordinate`
- `product_build` / `environment`
- `tester_qualification`
- `public_resources_used`
- `interventions`
- `outcome`
- `completion`
- `observations`
- `interaction_evidence` / `visual_evidence` / `accessibility_evidence`
- `finding_ids`
- `reproduction`
- `evidence_refs`
- `review`

#### Finding Expectations

Record findings with observed behavior, expected user outcome, severity, reproducibility, support scope, evidence refs, source requirement, owner, and disposition.

#### Notes

- Keep this scenario in the owning PRD; do not create a second canonical copy in work or history.
- Increment `scenario_version` for meaningful changes to the same goal.
- Use a new `NUAT-###` only for a materially different goal, audience, platform claim, accessibility condition, or risk.
- A valid future-trigger `none` still requires the complete trigger and `O-###` routing.

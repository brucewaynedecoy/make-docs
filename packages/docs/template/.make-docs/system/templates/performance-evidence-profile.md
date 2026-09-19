<!-- Copy this progressive shape into the one record that owns the candidate. Do not keep a second live profile copy. -->

## Performance Applicability

| Field | Value |
| --- | --- |
| Candidate ID | `{{STABLE_LOCAL_CANDIDATE_ID}}` |
| Title | {{PRODUCT_LANGUAGE_TITLE}} |
| Testing Type | Performance Testing |
| Base Maintenance Action | `{{CREATE_UPDATE_EXISTING_LINK_ONLY_OR_NONE}}` |
| Protected Outcome | {{USER_OR_BUSINESS_OUTCOME}} |
| Decision Informed | {{CURRENT_DECISION_THIS_EVIDENCE_CAN_CHANGE}} |
| Failure Cost | {{CONSEQUENCE_AND_SEVERITY_BASIS}} |
| Risk And Reversibility | {{BLAST_RADIUS_REVERSIBILITY_FALSE_PASS_AND_FALSE_FAIL_COST}} |
| Supported Scope | {{EXACT_CLAIMED_SURFACE_AND_BOUNDARY}} |
| Product Maturity | {{CURRENT_MATURITY_POSTURE}} |
| Source Authority | {{RELATIVE_LINKS_TO_ACCEPTED_AUTHORITY_OR_NONE}} |
| Source Evidence | {{RELATIVE_LINKS_TO_RELEVANT_EVIDENCE_OR_NONE}} |
| Baseline Availability | {{COMPARABLE_BASELINE_REFERENCE_OR_NONE}} |
| Applicability | `{{REQUIRED_NOW_CHARACTERIZE_NOW_DEFER_REQUIRED_NOT_NEEDED_OR_REJECT_UNSUPPORTED}}` |
| Target Class | `{{TARGET_CLASS_OR_NONE}}` |
| Owner | {{DURABLE_DECISION_OWNER}} |
| Lifecycle Coordinate | {{CURRENT_OR_INTENDED_ACTIVATION_POINT}} |
| Gate Effect | {{ADVISORY_INFORMATIONAL_OR_EXPLICIT_BLOCKING_SCOPE}} |
| Reason | {{DECISION_RELEVANT_JUSTIFICATION}} |
| Next Record | {{PERF_O_OR_NONE}} |

For `not-needed` or `reject-unsupported`, stop here.

For `defer-required`, link one accepted `O-###` in **Next Record** and stop here.

Continue only for `required-now` or `characterize-now`. Put the profile in the one canonical record selected by its target class.

### PERF-### {{PROFILE_TITLE}}

#### Identity And Authority

| Field | Value |
| --- | --- |
| Profile ID | `PERF-###` |
| Profile Version | `{{MONOTONIC_VERSION}}` |
| Source Digest | `{{ALGORITHM_AND_DIGEST}}` |
| Title | {{PRODUCT_LANGUAGE_TITLE}} |
| Protected Outcome | {{USER_OR_BUSINESS_OUTCOME}} |
| Source Requirements | {{RELATIVE_OWNING_AUTHORITY_LINKS}} |
| Canonical Owner | {{ONE_PRD_PLAN_OR_WORK_LOCATION}} |
| Product Maturity | {{CURRENT_MATURITY_POSTURE}} |
| Applicability | `{{REQUIRED_NOW_OR_CHARACTERIZE_NOW}}` |
| Target Class | `{{EXECUTABLE_TARGET_CLASS}}` |
| Risk And Failure Cost | {{USER_IMPACT_SEVERITY_REVERSIBILITY_FALSE_PASS_AND_FALSE_FAIL_COST}} |
| Owner | {{DURABLE_AUTHORITY_ROLE}} |
| Approver | {{ACCEPTANCE_CHANGE_WAIVER_RETIREMENT_OR_SUPERSESSION_ROLE}} |

#### Supported Scope

| Field | Value |
| --- | --- |
| Surface | {{PRODUCT_SURFACE}} |
| Platform Or Runtime | {{SUPPORTED_PLATFORM_OR_RUNTIME_SCOPE}} |
| Deployment Or Device Class | {{SUPPORTED_DEPLOYMENT_OR_DEVICE_SCOPE}} |
| Scale | {{SUPPORTED_SCALE_BOUNDARY}} |
| Account And Network State | {{SUPPORTED_ACCOUNT_AND_NETWORK_BOUNDARY}} |
| Resource Envelope | {{SUPPORTED_RESOURCE_BOUNDARY}} |
| Exclusions | {{EXPLICIT_EXCLUSIONS_OR_NONE}} |

#### Baseline And Target

| Field | Value |
| --- | --- |
| Comparable Baseline | {{EVIDENCE_REFERENCE_OR_NONE}} |
| Target | {{EVIDENCE_BACKED_TARGET_OR_NONE}} |
| Unit | {{UNIT_OR_NONE}} |
| Direction | {{DIRECTION_OR_NONE}} |
| Tolerance | {{TOLERANCE_OR_NONE}} |
| Target Source | {{SOURCE_LINK_OR_NONE}} |
| Target Approval | {{APPROVAL_REFERENCE_OR_NONE}} |

#### Environment And Workload

| Field | Value |
| --- | --- |
| Product Build | {{BUILD_IDENTITY}} |
| Dependency State | {{RELEVANT_DEPENDENCY_IDENTITY}} |
| Configuration | {{RELEVANT_CONFIGURATION}} |
| Qualified Environment | {{ENVIRONMENT_OR_ENVIRONMENT_CLASS}} |
| Dataset Or Fixture | {{DATASET_SETUP_OR_FIXTURE_IDENTITY}} |
| Workload | {{WORKLOAD_DEFINITION}} |
| Scale | {{WORKLOAD_SCALE}} |
| Concurrency | {{CONCURRENCY_DEFINITION}} |
| Operation Mix | {{OPERATION_MIX}} |
| Workload Exclusions | {{EXCLUSIONS_OR_NONE}} |

#### Measurement Protocol

| Field | Value |
| --- | --- |
| Measurement Boundary | {{START_END_AND_INCLUDED_WORK}} |
| Instrument And Version | {{INSTRUMENT_IDENTITY}} |
| Cold Or Warm State | {{DECLARED_STATE}} |
| Warmup Rule | {{PREDECLARED_RULE}} |
| Repetitions Or Observation Window | {{PREDECLARED_APPROACH}} |
| Statistic | {{DECISION_FIT_STATISTIC}} |
| Variance Reporting | {{VARIANCE_METHOD}} |
| Uncertainty Reporting | {{UNCERTAINTY_METHOD}} |
| Outlier Treatment | {{PREDECLARED_RULE}} |
| Comparison Method | {{METHOD_AND_EQUIVALENCE_RULE_OR_NONE}} |
| Raw Evidence Retention | {{LOCATION_FORMAT_AND_RETENTION_RULE}} |
| Observer Effects | {{MATERIAL_EFFECTS_AND_CONTROLS_OR_NONE}} |

#### Non-Sacrificable Constraints

| Constraint | Required Condition And Evidence |
| --- | --- |
| Correctness | {{CONDITION_AND_EVIDENCE}} |
| Durability | {{CONDITION_AND_EVIDENCE}} |
| Safety | {{CONDITION_AND_EVIDENCE}} |
| Security | {{CONDITION_AND_EVIDENCE}} |
| Privacy | {{CONDITION_AND_EVIDENCE}} |
| Accessibility | {{CONDITION_AND_EVIDENCE}} |
| Portability | {{CONDITION_AND_EVIDENCE}} |
| Cost | {{CONDITION_AND_EVIDENCE}} |
| Maintainability | {{CONDITION_AND_EVIDENCE}} |
| Fixture And Measurement Seam | {{VALIDATION_EVIDENCE}} |

#### Evidence Budget And Stop Rules

| Field | Value |
| --- | --- |
| Authorizing Plan Or Work Scope | {{RELATIVE_LINK_AND_COORDINATE}} |
| Budget Event ID | {{STABLE_EVENT_ID}} |
| Characterization Pass Limit | {{FINITE_LIMIT}} |
| Materially Distinct Correction Attempt Limit | {{FINITE_LIMIT}} |
| Review Cycle Limit | {{FINITE_LIMIT}} |
| Elapsed Investigation Time Limit | {{FINITE_LIMIT}} |
| Compute Limit | {{FINITE_LIMIT}} |
| External Resource Spend Limit | {{FINITE_LIMIT}} |
| Unchanged Fingerprint Action | {{REUSE_OR_AUTHORIZED_REQUALIFICATION}} |
| Material Change Action | {{AFFECTED_CHECKS_ONLY_RULE}} |
| Diminishing Return Rule | {{DECISION_RELEVANT_STOP_RULE}} |
| Budget Exhaustion Disposition | {{BLOCKED_REVISE_SCOPED_FAIL_OR_OWNER_DECISION}} |

#### Outcome Rules

| Outcome | Exact Condition |
| --- | --- |
| `pass` | {{CONDITION_FOR_THIS_PROFILE_AND_SCOPE}} |
| `fail` | {{COMPARABLE_REPRODUCIBLE_MISS_OR_CONSTRAINT_CONDITION}} |
| `revise` | {{UNFIT_PROFILE_TARGET_PROTOCOL_OR_DECISION_CONDITION}} |
| `blocked` | {{MISSING_PRECONDITION_CONDITION}} |
| `waived` | {{BOUNDED_APPROVED_RISK_ACCEPTANCE_CONDITION}} |

| Field | Value |
| --- | --- |
| Severity Treatment | `{{CRITICAL_MAJOR_MODERATE_OR_MINOR_RULE}}` |
| Reproducibility Treatment | `{{REPRODUCED_NOT_REPRODUCED_INTERMITTENT_OR_NOT_ATTEMPTED_RULE}}` |
| Finding Route | {{OWNING_PRD_WORK_AND_GATE_ROUTE}} |
| Escalation Route | {{OWNER_AND_DECISION_ROUTE}} |

#### Expiry And Reevaluation

| Field | Value |
| --- | --- |
| Material Change Triggers | {{PROFILE_BUILD_ENVIRONMENT_WORKLOAD_SCOPE_DEPENDENCY_INSTRUMENT_OR_ANALYSIS_TRIGGERS}} |
| Time Or Release Boundary | {{DECLARED_BOUNDARY_OR_NONE}} |
| Current-Use Invalidation Rule | {{INVALIDATION_RULE}} |
| Next Review Condition | {{OWNER_REVIEW_TRIGGER}} |
| Requalification Authority | {{SEPARATE_OWNER_OR_PHASE_AUTHORITY_REQUIRED}} |
| Requalification Budget | {{NEW_FINITE_BUDGET_REQUIRED}} |
| Unchanged-Fingerprint Qualification Limit | {{SINGLE_BOUNDED_EXECUTION}} |

#### Lineage And Traceability

| Field | Value |
| --- | --- |
| Predecessor | {{PERF_REFERENCE_OR_NONE}} |
| Successor | {{PERF_REFERENCE_OR_NONE}} |
| Promotion Source | {{NON_PRODUCT_PROFILE_REFERENCE_OR_NONE}} |
| Promotion Approval | {{PRD_OWNER_APPROVAL_REFERENCE_OR_NONE}} |
| Supersession Reason | {{RATIONALE_OR_NONE}} |
| Plan And Work Links | {{RELATIVE_LINKS_OR_NONE}} |
| Result Links | {{RELATIVE_LINKS_OR_NONE}} |
| Finding Links | {{RELATIVE_LINKS_OR_NONE}} |
| Obligation Links | {{O_REFERENCES_OR_NONE}} |
| History Links | {{RELATIVE_LINKS_OR_NONE}} |
| Support Links | {{RELATIVE_LINKS_OR_NONE}} |

#### Evidence Fingerprint

- Profile ID, version, and digest: {{EXACT_BINDING}}
- Product build and relevant code state: {{STABLE_IDENTITIES}}
- Dependency and configuration state: {{STABLE_IDENTITIES}}
- Qualified environment: {{STABLE_IDENTITY_OR_DIGEST}}
- Workload and fixture or dataset: {{STABLE_IDENTITIES_OR_DIGESTS}}
- Instrument version: {{STABLE_IDENTITY}}
- Analysis method: {{STABLE_IDENTITY_OR_DIGEST}}
- Comparability result and reasons: {{MATCH_EQUIVALENT_OR_NOT_COMPARABLE_WITH_REASON}}

#### Budget Ledger

- Authorizing scope and budget event: {{REFERENCE_AND_ID}}
- Requalification authorization: {{REFERENCE_OR_NONE}}
- Declared limits: {{LIMITS}}
- Materially distinct attempts: {{ATTEMPT_REFERENCES}}
- Affected checks: {{CHECK_REFERENCES}}
- Time, compute, and external spend: {{CONSUMPTION}}
- Review cycles used: {{CONSUMPTION}}
- Remaining budget: {{REMAINDER}}
- Unchanged evidence reused: {{EVIDENCE_REFERENCES_OR_NONE}}
- Stop reason and escalation: {{STOP_AND_ROUTE}}

#### Result Record

- Result ID: {{STABLE_RESULT_ID}}
- Exact profile binding: {{ID_VERSION_AND_DIGEST}}
- Build and evidence fingerprint: {{REFERENCES}}
- Environment and workload: {{REFERENCES}}
- Raw and analyzed evidence: {{RELATIVE_OR_SANITIZED_STABLE_REFERENCES}}
- Observed distribution: {{OBSERVATIONS}}
- Uncertainty and exclusions: {{OBSERVATIONS_AND_REASONS}}
- Budget ledger: {{REFERENCE}}
- Outcome: `{{PASS_FAIL_REVISE_BLOCKED_OR_WAIVED}}`
- Findings: {{FINDING_REFERENCES_OR_NONE}}
- Owner or reviewer disposition: {{DISPOSITION}}
- Supported-scope limit: {{EXACT_LIMIT}}
- Expiry: {{CURRENT_USE_BOUNDARY}}
- Later result: {{REFERENCE_OR_NONE}}

#### Finding Record

- Finding ID: {{STABLE_FINDING_ID}}
- Observed behavior and expected protected outcome: {{OBSERVATION_AND_EXPECTATION}}
- Target class: `{{TARGET_CLASS}}`
- Severity: `{{CRITICAL_MAJOR_MODERATE_OR_MINOR}}`
- Reproducibility and attempts: `{{STATE_AND_REFERENCES}}`
- Affected support scope: {{EXACT_SCOPE}}
- Source requirement and evidence: {{RELATIVE_LINKS}}
- Owner and disposition: {{OWNER_AND_DISPOSITION}}
- Expiry: {{CURRENT_USE_BOUNDARY}}
- Remediation work: {{WORK_REFERENCE_OR_NONE}}
- Rerun or result links: {{RELATIVE_LINKS_OR_NONE}}

#### Waiver Record

- Requirement and profile: {{EXACT_REFERENCES}}
- Exact miss and affected scope: {{MISS_AND_SCOPE}}
- Rationale and accepted risk: {{RATIONALE_AND_RISK}}
- Non-sacrificable constraint status: {{STATUS}}
- Owner and approver: {{AUTHORITY_ROLES}}
- Expiry or release boundary: {{BOUNDARY}}
- Reevaluation or remediation trigger: {{TRIGGER}}
- Owed work: {{O_REFERENCE_OR_NONE}}
- Renewal or terminal disposition: {{DISPOSITION}}

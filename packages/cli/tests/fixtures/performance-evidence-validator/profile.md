### {{PROFILE_ID}} Representative Profile

#### Identity And Authority

| Field | Value |
| --- | --- |
| Profile ID | `{{PROFILE_ID}}` |
| Profile Version | `1` |
| Source Digest | `sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa` |
| Title | Representative response target |
| Protected Outcome | A person receives a complete response without a correctness loss. |
| Source Requirements | [Owning authority]({{SOURCE_LINK}}) |
| Canonical Owner | {{CANONICAL_OWNER}} |
| Product Maturity | supported path |
| Applicability | `required-now` |
| Target Class | `{{TARGET_CLASS}}` |
| Risk And Failure Cost | A slow response delays a current decision. |
| Owner | Product owner |
| Approver | Product owner |

#### Supported Scope

| Field | Value |
| --- | --- |
| Surface | CLI response |
| Platform Or Runtime | Node.js 18 or later |
| Deployment Or Device Class | Maintainer workstation |
| Scale | One project with 20 Markdown files |
| Account And Network State | Local and offline |
| Resource Envelope | Existing process memory |
| Exclusions | Remote files and benchmark execution |

#### Baseline And Target

| Field | Value |
| --- | --- |
| Comparable Baseline | Prior evidence record PERF-BASE-001 |
| Target | 100 ms declared fixture target |
| Unit | ms |
| Direction | lower is better |
| Tolerance | 10 ms |
| Target Source | Owning authority |
| Target Approval | Product owner approval 2026-09-17 |

#### Environment And Workload

| Field | Value |
| --- | --- |
| Product Build | build-001 |
| Dependency State | lock-digest-001 |
| Configuration | default fixture configuration |
| Qualified Environment | fixture-environment-001 |
| Dataset Or Fixture | fixture-data-001 |
| Workload | one read-only validation pass |
| Scale | 20 Markdown files |
| Concurrency | one process |
| Operation Mix | repository reads only |
| Workload Exclusions | benchmark execution |

#### Measurement Protocol

| Field | Value |
| --- | --- |
| Measurement Boundary | operation entry to structured result |
| Instrument And Version | fixture-clock-1 |
| Cold Or Warm State | cold |
| Warmup Rule | no warmup for this fixture |
| Repetitions Or Observation Window | 1 bounded fixture observation |
| Statistic | observed duration |
| Variance Reporting | not applicable to one fixture observation |
| Uncertainty Reporting | instrument resolution is recorded |
| Outlier Treatment | no observation is removed |
| Comparison Method | exact declared fingerprint match |
| Raw Evidence Retention | repository evidence path for 30 days |
| Observer Effects | file-system cache can affect time |

#### Non-Sacrificable Constraints

| Constraint | Required Condition And Evidence |
| --- | --- |
| Correctness | focused fixture test passes |
| Durability | no project file changes |
| Safety | unsafe paths are refused |
| Security | no command execution |
| Privacy | repository-local reads only |
| Accessibility | text result remains available |
| Portability | project-relative records |
| Cost | no external spend |
| Maintainability | stable rule IDs |
| Fixture And Measurement Seam | fixture parser test passes |

#### Evidence Budget And Stop Rules

| Field | Value |
| --- | --- |
| Authorizing Plan Or Work Scope | [Authorized work]({{PLAN_LINK}}) |
| Budget Event ID | PERF-BUDGET-001 |
| Characterization Pass Limit | 1 pass |
| Materially Distinct Correction Attempt Limit | 2 attempts |
| Review Cycle Limit | 2 cycles |
| Elapsed Investigation Time Limit | 2 hours |
| Compute Limit | 1 local process |
| External Resource Spend Limit | 0 dollars |
| Unchanged Fingerprint Action | reuse current evidence |
| Material Change Action | rerun affected checks only |
| Diminishing Return Rule | stop after two distinct attempts do not change the verdict |
| Budget Exhaustion Disposition | blocked and owner decision |

#### Outcome Rules

| Outcome | Exact Condition |
| --- | --- |
| `pass` | exact scope meets the declared rule |
| `fail` | comparable evidence shows a reproducible miss |
| `revise` | the profile or method is not fit for the decision |
| `blocked` | a required precondition is missing |
| `waived` | the owner accepts a bounded risk |

| Field | Value |
| --- | --- |
| Severity Treatment | `critical major moderate or minor` |
| Reproducibility Treatment | `reproduced not-reproduced intermittent or not-attempted` |
| Finding Route | owning work and PRD |
| Escalation Route | product owner decision |

#### Expiry And Reevaluation

| Field | Value |
| --- | --- |
| Material Change Triggers | profile build environment workload scope dependency instrument or analysis change |
| Time Or Release Boundary | next release |
| Current-Use Invalidation Rule | any material trigger expires current use |
| Next Review Condition | next release or material trigger |
| Requalification Authority | separate owner or phase approval |
| Requalification Budget | new finite budget required |
| Unchanged-Fingerprint Qualification Limit | 1 bounded execution |

#### Lineage And Traceability

| Field | Value |
| --- | --- |
| Predecessor | none |
| Successor | none |
| Promotion Source | none |
| Promotion Approval | none |
| Supersession Reason | none |
| Plan And Work Links | [Authorized work]({{PLAN_LINK}}) |
| Result Links | none |
| Finding Links | none |
| Obligation Links | none |
| History Links | none |
| Support Links | none |

#### Evidence Fingerprint

- Profile ID, version, and digest: {{PROFILE_ID}} version 1 sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
- Product build and relevant code state: build-001
- Dependency and configuration state: lock-digest-001 and default fixture configuration
- Qualified environment: fixture-environment-001
- Workload and fixture or dataset: fixture-data-001
- Instrument version: fixture-clock-1
- Analysis method: exact declared comparison
- Comparability result and reasons: unchanged because all declared fields match the prior evidence record

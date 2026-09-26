# Deterministic and Agentic Rule Map

Review this table whenever deterministic snapshot logic or Skill logic changes. Update both sides when parity changes. A row marked judgment-only must stay out of deterministic fact collection.

| Rule | Deterministic source | Agentic handling |
| --- | --- | --- |
| BACKLOG-RULE-001 | Snapshot stops on an unsafe root. | Fallback stays inside selected repository authority and stops when it cannot inspect safely. |
| BACKLOG-RULE-002 | Snapshot retains a directory with no work index. | Fallback counts the directory and reports missing detail. |
| BACKLOG-RULE-003 | Snapshot exposes safe current-frontmatter facts only. | Fallback preserves each missing or unreadable current field. |
| BACKLOG-RULE-004 | Snapshot emits inventory only for unsupported shape. | Fallback does not interpret a no-frontmatter body. |
| BACKLOG-RULE-005 | Snapshot retains duplicate coordinates by record path. | Fallback does not merge duplicate coordinates. |
| BACKLOG-RULE-006 | Snapshot follows safe phase-map links only. | Fallback reports and excludes broken authority links. |
| BACKLOG-RULE-007 | Snapshot reports unlinked current phases. | Fallback does not silently add an unlinked phase. |
| BACKLOG-RULE-008 | Snapshot keeps recorded status and task evidence separate. | Review shows the conflict and does not choose one as fact. |
| BACKLOG-RULE-009 | Snapshot records missing or unsafe source authority. | Review does not use an unsafe source to support a claim. |
| BACKLOG-RULE-010 | Snapshot names Git evidence fallback. | Fallback uses scoped file evidence and states its lower precision. |
| BACKLOG-RULE-011 | Snapshot names created-date fallback. | Fallback keeps date-only precision or an unknown value visible. |
| BACKLOG-RULE-012 | Report schema checks full-portfolio tally integrity. | Review preserves every record once and checks the four-tally invariant. |
| BACKLOG-RULE-013 | Judgment-only; snapshot supplies facts. | Review assigns one fixed live status and one evidence-backed reason. |
| BACKLOG-RULE-014 | Judgment-only; snapshot supplies sort and dependency facts. | Review recommends order with rationale, evidence, and limits. |
| BACKLOG-RULE-015 | Judgment-only; tool supplies structured meaning. | Agent explains subject, context, effect, limits, next action, and human action level. |
| BACKLOG-RULE-016 | Snapshot keeps lifecycle evidence separate. | Review does not promote task completion into closeout, commit, history, release, or archive. |

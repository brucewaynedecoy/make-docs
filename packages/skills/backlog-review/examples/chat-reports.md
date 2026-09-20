# Chat Report Patterns

These examples show scale and order. They do not require fixed prose.

## Small portfolio

**Backlog review — Aurora Notes**

Source method: MCP snapshot

1 work record found · 1 record in scope · 0 historical records · 0 archived records

### Current focus

- [W1 R1](docs/work/2042-06-01-w1-r1-orbit-notes/00-index.md) — `current`: Capture inputs.
  - Fact: One linked phase has one completed task.
  - Inference (medium): The record remains current because its recorded status is active. Limit: no owner priority was recorded.

### Next

1. Review the active record before opening more work. This preserves the current focus. Limit: owner direction can change the order.

## Medium portfolio

**Backlog review — Harbor**

Source method: CLI snapshot

8 work records found · 3 records in scope · 3 historical records · 2 archived records

### Current focus

- [W8 R0](docs/work/2042-07-10-w8-r0-harbor-index/00-index.md) — `current`: Accepted work is ready to continue.
  - Fact: The open phase has accepted authority and no recorded blocker.
  - Inference (high): This is the clean current track. Limit: the review does not assign an owner.

### Next

1. Continue W8 R0. It has accepted authority and no stronger conflict.
2. Reconcile W7 R2 before closeout. Its task evidence and recorded status disagree.

### Needs attention

- [W7 R2](docs/work/2042-06-18-w7-r2-harbor-import/00-index.md) — `conflict`: Recorded completion conflicts with one open task.
  - Recommendation: Reconcile the record before using it as historical evidence.

### Deferred

- [W6 R1](docs/work/2042-05-04-w6-r1-harbor-search/00-index.md) — `deferred`: The record says work is paused pending an owner decision.

The remaining completed, historical, and archived records are in the full report model. Expand them only when they affect the current decision.

## Large portfolio

**Backlog review — Atlas**

Source method: agentic fallback

64 work records found · 5 records in scope · 41 historical records · 18 archived records

### Current focus

- [W31 R0](docs/work/2042-08-03-w31-r0-atlas-release/00-index.md) — `attention`: Closeout evidence is still needed.

### Next

1. Finish the W31 R0 closeout evidence before opening another release track.
2. Review the recorded blocker on W30 R1 after W31 R0 is settled.

### Needs attention

- W31 R0 has complete tasks but no accepted closeout fact.
- W30 R1 depends on an owner decision that this review cannot make.

### Evidence limit

The compatible MCP tool and CLI snapshot command were not available. This report used the agentic fallback. It counted all 64 records, but 12 records without current frontmatter remain inventory only. No human action is required to use the report. Owner review is required before the inventory-only records can support stronger status claims.

Keep all 64 records in the report model. Show more record detail only when the maintainer asks or when it affects a current decision.

## Conflict-heavy portfolio

Lead with the conflict in normal words. Keep the recorded facts separate.

### Current focus

- [W4 R1](docs/work/2042-04-03-w4-r1-conflicted-closeout/00-index.md) — `conflict`: Recorded completion conflicts with task or closeout evidence.
  - Fact: The work index records complete.
  - Fact: Separate task or closeout evidence does not support the stronger lifecycle claim.
  - Inference (high): The record cannot be trusted at face value. Limit: the review does not choose which source should be changed.

### Next

1. Reconcile the recorded status and task or closeout evidence before using this record to set later work.

### Needs attention

- The source disagreement blocks a clean complete or historical classification. Human action is required only if the maintainer wants to resolve the record now.

---
title: "Queue restart measurement"
kind: "history"
status: "completed"
coordinate: "W20 R0 P3"
source:
  type: "work"
  path: "work.md"
---

# Queue Restart Measurement

[Planned work](./work.md)

Promise: [HX-IND-01](./design.md#human-experience-intent)

Reviewed human goal: Operators can trust that accepted work will appear without manual replay.

Testing decision executed: Performance Testing

Evidence source: A controlled run accepted 1,000 jobs and restarted one worker. The result showed 99.4% within 30 seconds. All jobs became visible. No job needed manual replay.

Human effect: Operators can trust that accepted work will appear without manual replay. The measured wait and replay count support that effect.

## Human Experience Review

| Promise | Evidence | Observation | Conclusion | Reviewer | Reviewer limit | Disposition |
| --- | --- | --- | --- | --- | --- | --- |
| [HX-IND-01](./design.md#human-experience-intent) | The controlled 1,000-job restart run measured 99.4 percent within 30 seconds and no manual replay. | The measured wait and replay count support the stated operator trust effect. | `satisfied` | Reliability reviewer | This evidence covers one worker restart at the accepted load profile. | Accept only the stated reliability, wait, and replay-risk claim. |

Human Experience Review conclusion: `satisfied`

Limit: This evidence covers one worker restart at the accepted load profile.

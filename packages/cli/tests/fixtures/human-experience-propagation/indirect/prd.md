---
title: "Queue recovery"
kind: "prd"
status: "active"
coordinate: "W20 R0 P3"
source:
  type: "plan"
  path: "plan.md"
---

# Queue Recovery

[Source plan](./plan.md)

This capability applies the [Human Experience Contract](make-docs://system/contract/human-experience-contract.md) and uses [HX-IND-01](./design.md#human-experience-intent) as its source promise.

### R-QUEUE-07

At least 99% of accepted jobs must become visible in results within 30 seconds, including after one worker restart, without an operator replaying the job.

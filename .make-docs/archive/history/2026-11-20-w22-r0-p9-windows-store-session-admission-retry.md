---
title: "W22 R0 P9 Windows Store Session Admission Retry"
kind: "history"
status: "completed"
date: "2026-11-20"
client: "T3 Code"
model: "Claude Opus 5.5"
coordinate: "W22 R0 P9"
repo: "make-docs"
branch: "fix/2-0-9-adoption-output-and-windows-eperm"
---

# W22 R0 P9 Windows Store Session Admission Retry

## Changes

Store session admission on Windows now retries a transient `EPERM`, `EACCES`, or `EBUSY` when it creates the session directory, opens and secures it, and creates the session file. Windows returns these codes when a process opens a path that another process is deleting, and admission races with the cleanup of the empty session directory. The retry stays bounded by the admission deadline, so a lasting access problem still fails with `access-denied`, and other platforms keep `EPERM` fatal. The two existing Windows retries use the same helper. This closes D-059.

After the PR #66 review, the admission loop also retries a wrapped transient Windows access code from any safety read between those steps, and a failed attempt removes its own pending session file, matched by the identity captured when the file was created. The test row types were fixed for `tsc`.

Validation: the new fault-injection tests fail without the change and pass with it. `npm test` passed apart from the 2 known Node 26 stdio failures. `validate:defaults`, the build, and `smoke:pack:local` passed. Two builds of the first 2.0.9 candidate gave SHA-256 `113ccd0e2a2673e2e59f71d7c5b663d38de61637d8765b5b8c291bff46705ef2`. After the review corrections, two builds give `34f35f2374fc7359cfeff2ea0a6ad0e99e44d4ca59d95c55179e6f65234dc3db`. This Mac's Store was not changed.

## Documentation

### Project

| Path | Description |
| --- | --- |
| [P9 work](../../../docs/work/2026-09-18-w22-r0-store-architecture-recovery-and-platform-neutral-foundation/09-windows-store-session-admission-retry.md) | Adds and closes the revision Phase of P7. |
| [W22 R0 index](../../../docs/work/2026-09-18-w22-r0-store-architecture-recovery-and-platform-neutral-foundation/00-index.md) | Adds P9 and the first Change History entry. |
| [Evidence report](../../../docs/work/2026-09-18-w22-r0-store-architecture-recovery-and-platform-neutral-foundation/evidence.md) | Records the CI failure, the regression proof, the checks, and both digests. |
| [PRD 03](../../../docs/prd/03-open-questions-and-risk-register.md) | Records and closes D-059. |

### Maintainer

None this session.

### User

None this session.

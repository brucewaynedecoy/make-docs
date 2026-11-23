---
title: "W29 R0 P4 Work Queue Operations Second Pass"
kind: "history"
status: "draft"
date: "2026-11-23"
client: "T3 Code"
model: "Claude Opus 5.5"
coordinate: "W29 R0 P4 T7 T8 T10 T11 T12"
repo: "make-docs"
branch: "t3/w29-p4-work-queue-second-pass"
---

# W29 R0 P4 Work Queue Operations Second Pass

## Changes

Builds the five open P4 tasks. `backlog snapshot` reads the work store when the store is the authority and, after the owner's decision, the caller asks with `--work-store`: it runs the read-only sync check, reads each work file's text from the store, and adds `readiness` facts to each record and phase and a `workStore` key; without a usable Store it reads the files exactly as before (T7, T8). `make-docs resource read`, `resource_read`, and native MCP reads accept `make-docs://project/<project>/tasks/`, `.../tasks/<n>`, and `.../backlog/` down to a stage or task. The project resolves only through `project_register`, the read opens one read-only Store session with no project folder, and the result is the same from any folder (T10, T11). `work add` names the quick item's URI again. A complete `work export` returns a `workDigest`, and a prune given that digest removes the pruned project's work rows when they still match and no claim is live (T12). `work next` without a usable Store keeps its typed outcome and now names the `docs/work/` files.

An independent review asked for changes, fixed in the same session. A project URI read uses the harness grant of the folder where the agent works, and a folder that is not a project is refused without a setup step for it; native MCP project reads send the MCP connection. The snapshot runs the harness check before it reads Store state. A complete export also writes files whose repo copy a person removed, so the cleanup loses nothing. An absent Store gives one next step. The worktree moved to `main` at `f1aaa63d` before these fixes.

The owner then decided two points. Old Skill copies, option A: the store-mode snapshot keys are opt-in with `--work-store` (MCP `workStore: true`), the default snapshot is unchanged in every mode, and a test proves that this repository's old installed backlog-review Skill accepts it. Register D-068, option A: `work next` keeps the typed outcome and the pointer, PRD 52 R-WORK-STORE-2 says so, and D-068 is closed.

`resource.read` keeps `store: none`; only a project URI opens a Store session. The snapshot now declares Store-optional read, as PRD 51 already said. 

| Area | Summary |
| --- | --- |
| Snapshot | `store-snapshot.ts`, a work file source seam in `snapshot.ts`, store-mode schema keys, regenerated MCP app and Skill bundles. |
| Project URIs | `project-resource.ts`, `resource/ops.ts`, `mcp/resources.ts`, CLI raw output, `withStoreReadOnlyDatabase`, `readWorkStoreAt`. |
| Cleanup | `workProjectDigest`, `deletePrunedProjectWorkRows`, `pruneProjectFromStore` `workExportDigest`, export `complete` and `workDigest`. |
| `work next` | `files-fallback.ts`, typed outcome for an unbound checkout. |
| Tests | New `tests/w29-r0-p4-second-pass.test.ts`; updated P4, snapshot, and Store lifecycle tests. |

Deferred obligations and Unassisted Goal Testing: `not-needed-now`, no change.

## Documentation

### Project

| Path | Description |
| --- | --- |
| [04-work-queue-operations.md](../../../docs/work/2026-11-21-w29-r0-work-store/04-work-queue-operations.md) | T7, T8, T10, T11, and T12 checked; second pass closeout. |
| [evidence.md](../../../docs/work/2026-11-21-w29-r0-work-store/evidence.md#p4-second-pass) | P4 second pass and review fixes sections with samples. |
| [PRD 52](../../../docs/prd/52-work-store-and-work-queue.md) | R-WORK-STORE-2, R-WORK-STORE-10, new R-WORK-STORE-13, R-WORK-QUEUE-18, R-WORK-URI-3. |
| [PRD 51](../../../docs/prd/51-backlog-review-and-reporting.md) | R-BACKLOG-SNAPSHOT-1, -11, -13, -24, -31, -32; the opt-in `--work-store` option. |
| [PRD 25](../../../docs/prd/25-typescript-runtime-cli-mcp-operation-boundaries.md) | R-ACCESS-2: project URI reads open their own Store session and use the working folder's grant. |
| [PRD 39](../../../docs/prd/39-cli-command-model-and-operation-registry.md) | R-REG-EVOLVE-2 and the resource command lines. |
| [Register](../../../docs/prd/03-open-questions-and-risk-register.md) | D-068 opened and closed (owner option A). |

### Maintainer

| Path | Description |
| --- | --- |
| [Store README](../../../packages/cli/src/store/README.md) | The scoped work-row cleanup after a prune. |

### User

None this session.

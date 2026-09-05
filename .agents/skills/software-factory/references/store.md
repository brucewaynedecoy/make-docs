# Existing Make Docs Store

Use this reference only when the assignment needs saved lifecycle progress or resumes an existing run. It does not activate the factory skill. Short reviews need no saved run.

## Keep the Existing Boundary

Use supported Make Docs lifecycle operations. Let Make Docs resolve the normal Store path. A valid project manifest with a stable project ID must already exist. Do not create or migrate a manifest, update Make Docs, write SQL, or add a state directory to make capture work.

Save only a short progress marker and references to existing evidence. Keep substantive decisions, requirements, and accepted outcomes in the applicable project documents. Keep worker status and task handles in the selected tool. Use its existing task history to recover permission and context. Do not store prompts, transcripts, task graphs, permission ledgers, or a hidden tracker in metadata. Leave metadata unused for this skill.

Follow the current [Store requirements](../../../../docs/prd/38-global-store-and-project-state.md) if a boundary is unclear. Any proposed change, repair, or extension to Make Docs needs full disclosure and explicit owner approval before edits. This also applies to a missing or broken capability.

## Save and Read Progress

The CLI form is `make-docs run lifecycle <verb> --repo-root <project>`. The same operations may be exposed through the active MCP tool. Use the actual tool schema. Do not treat the CLI version alone as capability proof.

| Need | CLI arguments after the common form |
| --- | --- |
| Find current runs | `list` has no further arguments. |
| Read a run | `show --run-id <id>` |
| Start a run | `start --stage <actual-stage> --checkpoint <short-progress>` |
| Save a checkpoint | `checkpoint --run-id <id> --expected-version <current-version> --checkpoint <short-progress>` |
| Pause or resume | `pause` or `resume`, with run ID and current expected version. |
| Link existing evidence | `attach-evidence --run-id <id> --expected-version <current-version> --evidence-id <id> --kind <kind> --project-path <relative-file>` |
| Finish the run | `complete`, `fail`, or `abandon`, with run ID and current expected version, only when the actual outcome calls for it. |

The table's first column names the need; each verb replaces `<verb>` in the common form. Supply arguments as separate values or quote them safely for the shell. Read the returned run ID rather than inventing a second identity system.

There is one `lifecycle` run type. Use its actual stage: `design`, `plan`, `prd`, `work`, `implementation`, `release`, `archive`, or `retrospective`. There is no `preflight` or `factory` stage. Do not create a run for an informal review merely to fit it to a stage.

A checkpoint is one string of at most 256 characters. For example: `Phase 4 import: implementation reviewed; owner review remains.` Use a recognizable work title or existing coordinate. Read the current version before a write. On a version conflict, inspect the changed run and reconcile the affected work; do not blindly retry.

Evidence is a bounded reference, not content. `show` returns links; read the actual sources before judging them. Use an existing project-relative evidence path, or `--external-reference <https-url>` instead of `--project-path`. External query strings and fragments are stripped; check that the saved link still identifies the evidence. Do not create operational note files just to attach them.

## Inspect the Result

A successful mutation returns `status: captured` and a Store receipt. Check the structured result and read back important changes. **Exit 0 alone is insufficient:** an unavailable Store can return `status: run-capture-unavailable` with no save. Report that outcome. Do not retry automatically or create a fallback store.

Capture failure need not stop repository work that does not require capture. If durable recovery is essential and unsupported, pause that part and explain the gap. Never claim state was saved or work accepted without the relevant evidence.

On resume, compare the checkpoint with current documents, files, and task history. A saved status is not permission. If those sources cannot recover an essential decision or assignment, report what is missing instead of extending storage.

## Validation Scope

The installed `2.0.0-rc` CLI passed isolated start/read/list/checkpoint/pause/resume/evidence/complete and conflict checks during skill creation. It also returned the unavailable outcome above. This proves a small progress marker, not a worker registry or complete cross-harness recovery. Tests use explicit temporary `--repo-root` and `--store-root` values; normal operation uses the existing project and Make Docs Store resolution.

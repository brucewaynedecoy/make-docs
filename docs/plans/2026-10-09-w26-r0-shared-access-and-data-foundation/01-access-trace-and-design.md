---
title: "W26 R0 P1 Access Trace and Design"
kind: "plan"
status: "completed"
coordinate: "W26 R0 P1"
source:
  type: "design"
  path: "docs/designs/2026-10-09-shared-access-and-data-foundation.md"
---

# W26 R0 P1 Access Trace and Design

## Purpose

Make the current refusal and proposed smaller policy reviewable before access changes.

## Outcome

One current/proposed call-path map, a keep/move/remove matrix for each caller, receipt, package, native-entry, grant, and Store check, and an exact PRD/config/schema/migration/rollback packet. The owner accepts or rejects that packet before P2.

## Scope

Trace `work.backlog.snapshot`, `work.backlog-cache.lookup`, `work.backlog-cache.write`, and live refresh through setup, adapter context, registry, policy, Store session, and serialization. Record project selection, Store location, granted scope, write intent, and refusal at each boundary. Define stable project/checkout/item/source-version rules, including dirty content and unavailable states. List changed source files, tests, work limit, and grant revocation behavior. Preserve current authority until approval.

## Verification

Reproduce normal setup and the observed `store-denied` path without changing production grants. Compare current PRDs 25, 38, and 39 with the proposed redline. Review denial and Store-free cases. P1 passes when the packet names every changed check and affected interface; it does not pass because a private identity value makes one candidate work.

## Dependencies

Read-only source and configuration access. No connection, policy, installation, or cleanup mutation is included. Owner access-design approval gates P2.

## P1 decision packet — accepted design, not active policy

This packet includes the needed W25 P8 inventory facts. That inventory found three enabled MCP entries: global `make-docs`, global `make_docs`, and project `make_docs_current_backlog`. The project entry starts the separate repair-1 package under the W25 checkout. The global installed runtime has different bytes. A cache lookup reported `store-denied` with required `store:read` and `project:read`, but effective `store:none` and `project:none`. The inventory did not identify which entry received that call. It did not prove the grant source or cause of the refusal. The owner accepted this packet's access-policy design on 2026-10-09. Current PRD 25 caller rules and grants still govern until separately approved P2 work changes them. Attribution still needs a host receipt for the exact entry and call.

### Current path and observed boundary

| Path | Current route and check | Result or limit |
| --- | --- | --- |
| Setup | `packages/cli/src/cli.ts` routes `setup` and `setup system` to `setup-system.ts` and `harness-access/native.ts`. The native planner writes an owned first-party entry with `MAKE_DOCS_HARNESS_CALLER_IDENTITY`. It stores machine intent and a Store ownership receipt. Project intent stays in `.make-docs/config.yaml`. `generic-mcp-setup.ts` prints client-owned configuration and stores separate machine intent; Make Docs does not edit that client file. | `deriveHarnessAccessCeiling()` takes the maximum access of all active operations for a method. It can derive Store and project write for MCP. A profile does not grant access. |
| Direct CLI | `cli.ts`, `run/cli.ts`, and `run/root-operations.ts` call `resolveCliOperationLaunch()`, then the registry with `route: direct-cli` when no native caller carrier exists. | The explicit local operator route has full operation access under current policy. Store and target safety still apply. |
| MCP | `mcp/server.ts` lists tools by profile. `mcp/tools.ts` reads the caller environment and creates `route: mcp`. It invokes the same registry. | `tools/list` does not prove permission. The `backlog` profile exposes snapshot, lookup, write, open, and refresh. |
| Registry | `operations/registry.ts` checks status, typed input, write permission, named approvals, declared access, and required Store admission. | `work.backlog.snapshot` is Store-free project read. Cache lookup needs Store read and project read. Cache write needs Store write, project read, and `allowWrite=true` on MCP. `dryRun` does not grant write permission. Refresh uses optional outer Store admission and calls snapshot before a separately gated lookup. |
| Policy | `operations/harness-policy.ts` checks current machine and project intent, caller and method, executable, first-party receipt and native entry, or the generic MCP proof and reviewed profile. It compares the required access with the effective ceiling. | No caller identity on MCP yields `store:none, project:none` for a Store-backed call. No project intent yields `store-not-configured`. A lower effective ceiling yields `store-denied`. |
| Store and cache | `operations/context.ts` validates the Store root, opens the database, and holds a Store lease. `work/backlog/cache-service.ts` uses the verified checkout binding and exact record digest, snapshot schema, rule catalog, and Skill version. | Lookup reads only and never creates a checkout. An unbound checkout is a miss. Write may bind a checkout and uses a transaction, fragment checks, and a per-checkout cap. A denied Store call does not reach cache code. |
| Result | `serializeOperationError()` supplies machine fields. `mcp/server.ts` returns them in `structuredContent` and text with `isError: true`. CLI surfaces render the same underlying result. | The four Store states must stay distinct. Optional cache refusal leaves current source facts available. |

At this check, `codex mcp list --json` shows three enabled entries. Global `make-docs` has no caller environment. Global `make_docs` has that environment key. Project `make_docs_current_backlog` launches repair-1 with `--profile backlog` and has no caller environment. The project configuration SHA-256 is `06de59626c49835153e6348bcba79dd361e210ee65c7128c99d389643c48a1e5`. The repair-1 runtime SHA-256 is `26a848500b3e62cb638c2c41b812c9d79cc16981345b2b09ae9d1c4d005d9863`. The different global runtime SHA-256 is `97d38f20a7ff7e2f90dc1d998acc66de9277df7040aacc2b7babfbe8cd051c14`. These hashes identify bytes. They grant no access. The current checkout is branch `w25-r0-p1-live-delivery-contract` at `c7627bde8bc7f5d49811d00642cd86f5ba83c589`, with earlier W25 work dirty. P8's earlier HEAD and candidate source HEAD are historical.

### Settled requirements and remaining choices

The program direction is settled: simplify access, use one shared operation policy, and make supported setup work without a human or agent carrying caller proof. Project scope, the current machine and project read/write grants, target checks, explicit write intent, named approvals, and Store path, integrity, ownership, lock, and recovery safeguards remain requirements. Store-free work continues after a scoped Store refusal. The operation registry remains the source of each operation's access needs. The current policy remains active until separately approved implementation.

The accepted design uses a saved connection key to name the approved MCP context. The exact connection replacement and implementation limits remain later approvals. No existing grant value changes under this decision.

### One recommended policy: a connection key and current grants

Use one random, 256-bit connection key for each reviewed MCP connection. The key selects a connection identity. It grants no access on its own. Keep only its hash, active/disabled state, and reviewed method and owner binding in the existing machine config. The client cannot choose a different method or owner on a call. Put the raw key and a public connection ID in the host's MCP entry. First-party setup writes its owned entry through the current reviewed planner. Generic setup prints a client-owned configuration object; Make Docs does not edit an unknown client file. Setup shows the current machine ceiling, project intent, and selected method. It does not change their values during connection migration.

A Store-backed MCP call follows one path:

1. The MCP adapter passes the connection ID and key to the shared core. It does not decide a grant. It never returns the key in a result or error.
2. The core checks the key against the active hash and uses the method and owner from that machine record. An absent, wrong, disabled, or rotated key fails as `store-denied`. A client label or environment value without that current hash match has no authority.
3. The core reads current machine and project intent for the requested target. It takes the lower read/write ceiling. It checks project and checkout scope, operation metadata, write intent, and named approvals.
4. The Store session checks the root, database, ownership, lock, and recovery state before the handler runs. The cache handler checks its exact source key and fragment rules.

The key check is the only MCP connection proof in operation admission. The key is a bearer secret: a party that copies it can claim that connection until rotation. This is an explicit limit. Setup must keep it out of model-visible tool output and diagnostics. A leaked key needs rotation. Machine and project grants still bound the copied key's access.

The direct CLI remains the explicit local operator route. It uses the same registry, target, write, approval, and Store checks. It does not need an MCP key. Native command and permission rules keep their present host-proved launch check for now. They then use the same core grant and Store policy. Placing a bearer key in a shell command line would expose it, so P2 does not force native rules into the MCP key model. Store-free operations require no key or Store session.

This removes the MCP per-call caller-identity structure, adapter-version comparison, executable hash check, native-entry parse, ownership-receipt read, and generic configuration-digest/revision chain from operation admission. First-party and generic MCP use the same key check. Setup and status still check executable compatibility and native-entry ownership before writing an entry. A new runtime does not accept an old caller-identity blob as a fallback. This avoids a second live admission path.

### Check-purpose matrix

| Check | Failure it prevents; why grants and target are insufficient | Recommended place and failure effect |
| --- | --- | --- |
| MCP connection key hash | Stops a client from claiming another approved connection by changing only its label or method. Grants need a reliable connection selector before they can apply the right ceiling. | Keep one key check in core on every Store call. Missing, wrong, disabled, or rotated key gives `store-denied`. |
| First-party native-entry fingerprint | Detects a changed or removed managed entry before setup edits it. A valid key plus current grants already decides a running process's operation access. The file fingerprint adds no separate grant fact. | Remove from operation admission. Setup/status reports drift and blocks an unsafe overwrite. An explicit managed removal also revokes the key. |
| Setup ownership receipt fingerprint | Proves which setup operation owns a native entry, so repair or rollback does not overwrite a user entry. It does not prove that the current caller holds a grant. | Remove from operation admission. Missing or stale receipt blocks setup mutation and asks for review. It does not change an active key's grant. |
| Generic proof, profile revision, configuration digest | Today these stop a bare generic label from borrowing access. The shared key hash prevents the same failure. A second profile proof and revision check add another authority chain. | Replace them with the common key. Generic rotate/remove changes the active key hash. The old key gives `store-denied` on the next Store call. Client-file drift alone appears in status when observable. |
| Package hash, executable identity, adapter version | Detect wrong install bytes at setup and incompatibility at launch. A runtime self-check cannot protect against code that has been changed to bypass that self-check. Package identity is not a grant. | Move to setup, candidate qualification, and startup compatibility checks. A bad candidate blocks setup or launch. A disk change after a process starts is installation drift; it does not revoke a current grant by itself. |
| Native command/permission rule proof | Limits which shell command a native-rule permission admits. A project grant alone cannot prove the host allowed that command. | Keep for the native-rule route only. A failed launch fact gives `store-denied`. This route remains distinct from MCP key transport. |
| Current machine/project grants and target | Stop over-broad, revoked, or wrong-project use. A valid key cannot create or widen these grants. | Keep in core on every Store call. Missing intent gives `store-not-configured`. Narrowed, revoked, or wrong-target use gives `store-denied`. |
| Operation metadata, write intent, approvals | Stop an adapter from running a stronger operation than it exposes or turning a read into a write. | Keep in registry/core. Write-denied or approval-required results stop before mutation. |
| Store path, schema, ownership, lock, recovery | Stop unsafe or unavailable Store use. A valid key and grant do not make Store data safe. | Keep at session entry. Return `store-unavailable` or `store-unsafe` for only the affected operation. |
| Cache checkout, source key, fragment, transaction | Stop cross-checkout reuse, stale judgment, unsafe fragments, and partial writes. | Keep in cache service. Return miss, rejection, stale state, or the typed Store error. |

The only retained MCP connection-proof check is the key hash. Native-rule launch proof remains because its shell exposure is different. Native-entry, receipt, generic-profile, and package checks remain useful for setup or status. They do not deny an otherwise allowed operation for a health discrepancy alone.

### Exact operation matrix

| Route and operation | Connection or launch fact | Current grant and intent checks | Store result |
| --- | --- | --- | --- |
| Direct CLI Store operation | Explicit local operator route; no MCP key. | Registry operation access, selected target, required write intent and approvals. | Store session safety still applies. |
| First-party or generic MCP cache lookup | Same active key check and reviewed method binding. A profile listing is not proof. | Store read and project read on the target. | Read or scoped refusal; no checkout is created. |
| First-party or generic MCP cache write | Same active key check and reviewed method binding. | Store write, project read, explicit `allowWrite`, and any named approval. | Transactional write or scoped refusal. `dryRun` does not grant write. |
| First-party or generic MCP snapshot | No Store admission when it reads source facts only. | Registry and target checks for project read. | Source facts can succeed without Store. |
| First-party or generic MCP refresh | Snapshot follows its Store-free path. Optional lookup uses the active key. | Cache lookup needs Store read and project read. Any later cache write needs Store write, project read, and explicit intent. | Cache refusal does not erase successful source facts. |
| Native command or permission rule Store operation | Current host-proved launch fact for that rule. | Same registry, current grant, target, write-intent, and approval checks. | Store session safety still applies. |

### Revocation and installation drift

| Change | Next Store call | Reason |
| --- | --- | --- |
| Machine or project grant is narrowed, disabled, or removed | Recheck current values and deny access that no longer fits. | This is grant revocation. A running process cannot retain an older ceiling. |
| Managed MCP connection is removed or key is rotated | Reject the old key. | The reviewed connection identity has been revoked or replaced. |
| Reviewed setup changes the connection's command, executable, or owner | Rotate the key as part of that reviewed replacement. Reject the old key. | The old process must not keep the authority of the selected new connection. |
| Someone edits or deletes only the native entry outside setup | Existing process keeps access while its key and grants remain active. A new launch may fail. Status reports drift. | A file change alone is not a grant change. Use managed remove or key rotation to revoke a running connection. |
| Receipt is missing or package file changes on disk | Existing process keeps access while key and grants remain active. Setup/launch health checks may fail. | Receipt and package bytes are installation evidence. They do not set the operation grant. |
| Generic client removes its own configuration | A running client keeps access until its key is revoked or the process stops. | Make Docs cannot observe every client-owned file. Generic remove/rotate is the explicit revocation action. |

Setup must say that deleting a client entry alone does not revoke an already running process. Its remove and rotate actions must revoke the key. This is the key security tradeoff in the simpler design. It is part of the recommended policy, not an unstated fallback.

### Migration, rollback, identity, and errors

Do not merge the three enabled entries. Inventory each entry, owner, command, profile, grant, and package bytes. Review a dry-run diff and backup for the one selected connection. First-party setup generates a new key, writes only its owned entry, verifies it, and activates the matching hash last. At that activation, it disables the old key in the same reviewed setup change. Project setup verifies separate project intent. Generic setup prints the new configuration and activates the reviewed key; it disables any replaced key. The user installs the printed configuration in the client-owned file. No existing grant is widened or narrowed by this migration. Old MCP identity carriers remain valid only in old installed runtimes. The new runtime has one admission path. A connection replacement still needs its own later approval.

For rollback, stop the new process and disable its key first. Review restoration of the prior entry and package bytes under that runtime's actual policy. Do not reactivate a disabled key; issue a fresh key if the restored runtime uses the new policy. Recheck current grants and Store safety. Do not restore a revoked grant. Do not add a Store database grant table or project-local fallback.

Use `projectId` from project config. Use verified `checkoutId` for local Store binding. Select explicit path, then matching working directory, then reviewed preferred checkout; stop on ambiguity. A clone or worktree does not inherit another checkout's cache or grant. A Store-free read may report an unavailable checkout binding. Cache lookup on an unbound checkout returns a miss; write may bind only through its authorized Store write path. Pin an open review to its selected checkout.

Use repository-relative item paths and coordinates. Define `sourceVersion` as SHA-256 over sorted relevant paths, exact bytes or absence markers, and parsing contract version. Include dirty and untracked relevant files. HEAD, mtime, and `generatedAt` are not enough. An unsafe or incomplete read yields an unavailable version. Cache keys also include checkout ID, record digest, snapshot schema, rule catalog version, and Skill version. A changed source version marks old agent judgment stale without silently rerunning it. Keep known zero, unknown, unsupported, and unavailable separate.

CLI JSON and MCP `structuredContent` carry the same `code`, `operation`, `reason`, `nextAction`, `scope: operation`, `taskCanContinue: true`, and safe failure details. MCP sets `isError: true`. Do not return the key, caller carrier, or private Store path. Use `store-not-configured` for missing reviewed intent, `store-denied` for wrong key or insufficient/currently revoked authority, `store-unavailable` for inaccessible configured Store, and `store-unsafe` for integrity, ownership, lock, or recovery failure. Optional cache refusal keeps current source facts. Unknown errors remain errors, not cache misses.

### Exact accepted PRD redline for later P2 work

The owner accepted this design text. PRDs 25, 38, and 39 remain unchanged under P1. P2 must obtain separate work and limit approval before it applies the redline and records the prior proof rule in requirement history.

| Owner | Proposed current requirement |
| --- | --- |
| PRD 25: replace R-ACCESS-6 and R-ACCESS-7 | **R-ACCESS-6 (MUST):** One shared policy admits each Store-backed operation. MCP supplies a connection ID and setup-generated key. The policy validates the key against active machine config, then checks current machine and project grants, target scope, declared operation access, write intent, and approvals. A key is a connection selector, not a grant. Direct CLI uses its explicit local operator route. Native rules use a host-proved launch fact. **R-ACCESS-7 (MUST):** Supported first-party setup installs the MCP connection key in the owned native entry without a human or agent carrying it between calls. Generic setup prints a client-owned configuration object with the same key form. A missing or copied label, path, receipt, package hash, or environment value without a current key match grants no access. |
| PRD 25: replace R-ACCESS-12 and R-ACCESS-15 | **R-ACCESS-12 (MUST):** Every Store-backed MCP call checks the active connection key and current machine/project grants and target. It does not require per-call executable, native-entry, receipt, or package verification. Managed replacement issues a new key and disables the old key. Explicit remove or disable rejects the old key on the next Store call. Installation drift alone is reported by setup/status and does not change a current grant. **R-ACCESS-15 (MUST):** A failed key, grant, target, Store, or policy check stops only the affected operation and returns its failed check and one safe next action. Verification never repairs state. |
| PRD 25: add R-ACCESS-18 and R-ACCESS-19 | **R-ACCESS-18 (MUST):** MCP profile membership and tool listing do not grant access. Cache lookup needs Store read and project read. Cache write needs Store write, project read, and explicit surface write intent. Optional cache refusal preserves successful source facts. **R-ACCESS-19 (MUST):** Setup migration preserves current grants and unrelated entries. Grant changes and key disablement take effect on the next Store call. Deleting a native or client-owned configuration file alone does not disable an active key; setup provides explicit remove and disable actions. |
| PRD 38: add R-STORE-6 and R-ID-3 through R-ID-5 | **R-STORE-6 (MUST):** Existing machine and project intent remain the grant sources. Existing machine config stores each MCP connection ID, active state, key hash, and reviewed method and owner binding. The client cannot select a different method or owner on a call. The raw key stays only in the connection's native or client-owned configuration. Receipts record installation ownership, not operation authority. Store path, schema, ownership, lock, and recovery checks stay at session entry. **R-ID-3 (MUST):** Project ID, verified checkout ID, and item path/coordinate are distinct. Explicit path, matching working directory, then preferred checkout resolve selection; ambiguity stops it. A Store-free read may report an unavailable binding but must not mint one. **R-ID-4 (MUST):** Source version hashes relevant paths, bytes, absence markers, and parsing version, including dirty and untracked files. HEAD and file time alone are insufficient. Unsafe or incomplete reads have no valid source version. **R-ID-5 (MUST):** An open review stays pinned to its checkout. Cache and judgments carry source version and provenance. Unknown, unsupported, unavailable, and known zero stay distinct. |
| PRD 39: add R-REG-9 and R-CORE-3; clarify R-SURF-4 | **R-REG-9 (MUST):** Registry metadata remains the only operation access declaration. Adapters may narrow exposure but cannot grant access. **R-CORE-3 (MUST):** The shared core validates a current MCP connection key or explicit direct/native route, then checks current grants, target, operation access, write intent, and approvals before Store entry. Adapter code carries context but does not decide grants. **R-SURF-4 clarification:** Cache lookup remains Store-read/project-read. Cache write remains Store-write/project-read with explicit write intent. Registry IDs and CLI/MCP projections stay stable. |

PRD 25's Store-free, optional Store admission, typed-error, and profile rules remain. PRD 38's Store safety and existing identity rules remain. PRD 39's registry and shared-core rules remain. PRD 51 and D-047 stay open for later proof.

### Later file list and test plan

P1 changes only this plan and its work note. The later file set is a review list, not edit approval.

| Later owner | Files and purpose |
| --- | --- |
| W26 P2 minimal policy | `packages/cli/src/operations/harness-policy.ts`, `context.ts`, `registry.ts`, and `store-access.ts`: one key check and current grant/target decision. `access.ts` only if the accepted type needs it. |
| W26 P2 setup | `packages/cli/src/setup-system.ts`, `generic-mcp-setup.ts`, `harness-access/native.ts`, `harness-access/contract.ts`, `store/global-config.ts`, and `packages/cli/src/cli.ts`: key generation, reviewed entry/config output, activation, explicit remove/disable, replacement rotation, and status. `config.ts` keeps current project grants. |
| W26 P2 MCP adapter | `packages/cli/src/mcp/tools.ts` carries the connection key to core. `mcp/server.ts` changes only if startup handling cannot stay in tools; it is dirty W25 P9 overlap and needs an exact file boundary. |
| W25 P9 identity/cache overlap | `packages/cli/src/operations/work/backlog/snapshot.ts`, `schemas.ts`, `live-contracts.ts`, `review-operation.ts`, `cache-operation.ts`, and `cache-service.ts` own source version, checkout, cache, and refresh behavior. P2 touches only a required shared seam. |
| After policy acceptance | Surgical PRD 25/38/39 edits and matching setup guidance. Edit shipped system text in `packages/docs/template/` first, then dogfood `.make-docs/system/`. Do not edit those in P1. |

The minimal-design tests use `w19-r6-access-config.test.ts`, `w19-r6-harness-adapters.test.ts`, `w19-r6-setup.test.ts`, `w19-r8-store-access-remediation.test.ts`, `registry-contract.test.ts`, `mcp-derivation.test.ts`, `mcp-profiles.test.ts`, and `backlog-cache.test.ts`. Test normal first-party setup, generic printed config, one key per connection, wrong/missing/copied-label key, new key and disabled old key after replacement, explicit remove and disable, current grant change on the next call, wrong target, read-only cache lookup, denied write without intent, approved cache write, Store faults, Store-free continuation, and native-rule nonregression. Test that native-entry or receipt drift blocks setup repair but does not become an extra operation denial. Test that a package-file change is a status or launch fault, not a silent grant change. Test that the new runtime rejects an old caller-identity blob without a new key. P3 adds real CLI/MCP envelope parity, one normal installed connection, sandboxed host-owned Store access, cache miss/write/hit, dirty-source invalidation, and key disablement while the MCP process runs.

Do not keep or backfill the old MCP proof chain in the new runtime. Its ownership receipts remain for setup repair and rollback only. Keeping a dual legacy MCP admission path, migrating old proof blobs, and testing both paths would add an estimated **3–6 active hours**. That work is excluded from the recommendation. The selected connection instead migrates through a later reviewed replacement. Other old installed runtimes keep their current policy until their own approved replacement.

### Estimate, Bear comparison, and decision

The simpler design estimates W26 P1 at 4–5 active hours, P2 at 5–8, and P3 at 4–6: **13–19 W26 hours**. W25 P9–P13 remain **16–27 hours**. The combined planning range is **29–46 active hours**, including P1 and one final candidate with at most one correction candidate. Owner wait, a third candidate, new service, global install change, Store schema migration, and new UI scope are excluded. The optional 3–6 hours for dual old-proof support are separate and unapproved. Set implementation limits before P2 and W25 work; this estimate grants none.

The Bear Package F plan already calls for one policy, supported setup, separate grants, and removal of duplicate per-operation installation checks. This recommendation follows that direction. It narrows the earlier P1 packet by removing native-entry, receipt, package, and separate generic-profile checks from MCP operation admission. It leaves native rules on their current launch proof for this phase because a shell command cannot safely carry the MCP key. That is the one scope departure to record in Bear. The plan's older 31–49 estimate is replaced by 29–46 for the simpler design; no current grant or access rule changes in P1.

The accepted design is the one key check plus current grants, target, write, approval, and Store safeguards above. Setup replacement must issue a new key and disable the old key. Manual edits or deletion of client settings do not disable a running connection. Setup must provide an explicit remove or disable action. This design decision does not approve P2 work, its limit, W25 P9, or any exact connection replacement.

### Required installed-connection check before implementation

Before P2 implementation, identify the one installed connection selected for later work. Read its exact host entry, launch command, package bytes, setup record, current machine and project grants, and the runtime that the host actually starts. Trace that runtime's Store admission and failure path for snapshot, cache lookup, cache write, and refresh. Compare each enforced rule with current PRDs 25, 38, and 39 and with this accepted design. Label each row **enforced**, **not enforced**, or **unverified**, and name the exact byte and host evidence. Do not infer enforcement from repository source, a package version, a profile listing, or an unrelated MCP entry. Show the differences to the owner before any P2 source or PRD edit. Selection and any replacement remain separate decisions.
